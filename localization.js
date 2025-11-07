/**
 * CryptoBLIK Localization Module
 * Handles multiple language support for the application
 */

class LocalizationManager {
    constructor() {
        this.currentLanguage = 'pl'; // Default language
        this.translations = {};
        this.supportedLanguages = ['pl', 'en'];
        this.fallbackLanguage = 'pl';
        
        // Initialize localization
        this.init();
    }

    async init() {
        console.log('🌍 Initializing LocalizationManager');
        
        // Load saved language preference
        this.currentLanguage = this.getSavedLanguage();
        
        // Load translations for current language
        await this.loadTranslations(this.currentLanguage);
        
        // Apply translations to the page
        this.translatePage();
        
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
        
        console.log(`🌍 Localization initialized with language: ${this.currentLanguage}`);
    }

    getSavedLanguage() {
        // Check localStorage first
        const saved = localStorage.getItem('cryptoblik_language');
        if (saved && this.supportedLanguages.includes(saved)) {
            return saved;
        }
        
        // Check browser language
        const browserLang = navigator.language.substring(0, 2);
        if (this.supportedLanguages.includes(browserLang)) {
            return browserLang;
        }
        
        // Return default
        return this.fallbackLanguage;
    }

    async loadTranslations(language) {
        try {
            console.log(`🌍 Loading translations for: ${language}`);
            
            const response = await fetch(`locales/${language}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations: ${response.status}`);
            }
            
            this.translations[language] = await response.json();
            console.log(`✅ Translations loaded for: ${language}`);
            
        } catch (error) {
            console.error(`❌ Error loading translations for ${language}:`, error);
            
            // Load fallback language if not already trying fallback
            if (language !== this.fallbackLanguage) {
                console.log(`🔄 Loading fallback language: ${this.fallbackLanguage}`);
                await this.loadTranslations(this.fallbackLanguage);
                this.currentLanguage = this.fallbackLanguage;
            }
        }
    }

    translate(key, defaultText = null) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Try fallback language
                if (this.currentLanguage !== this.fallbackLanguage && this.translations[this.fallbackLanguage]) {
                    let fallbackValue = this.translations[this.fallbackLanguage];
                    for (const fk of keys) {
                        if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
                            fallbackValue = fallbackValue[fk];
                        } else {
                            fallbackValue = null;
                            break;
                        }
                    }
                    if (fallbackValue) return fallbackValue;
                }
                
                // Return default text or key if no translation found
                return defaultText || key;
            }
        }
        
        return value || defaultText || key;
    }

    translatePage() {
        console.log('🌍 Translating page elements');
        
        // Translate elements with data-translate attribute
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text' || element.type === 'email' || element.type === 'number') {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Translate meta tags
        this.translateMeta();
        
        // Update page title
        const title = this.translate('meta.title');
        if (title && title !== 'meta.title') {
            document.title = title;
        }
        
        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: this.currentLanguage } 
        }));
    }

    translateMeta() {
        // Update meta description
        const description = this.translate('meta.description');
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && description !== 'meta.description') {
            metaDescription.content = description;
        }
        
        // Update meta keywords
        const keywords = this.translate('meta.keywords');
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords && keywords !== 'meta.keywords') {
            metaKeywords.content = keywords;
        }
    }

    async changeLanguage(language) {
        if (!this.supportedLanguages.includes(language)) {
            console.error(`❌ Unsupported language: ${language}`);
            return false;
        }

        if (language === this.currentLanguage) {
            return true;
        }

        console.log(`🌍 Changing language to: ${language}`);
        
        // Load translations if not already loaded
        if (!this.translations[language]) {
            await this.loadTranslations(language);
        }
        
        // Update current language
        this.currentLanguage = language;
        
        // Save to localStorage
        localStorage.setItem('cryptoblik_language', language);
        
        // Update HTML lang attribute
        document.documentElement.lang = language;
        
        // Re-translate the page
        this.translatePage();
        
        // Update language selector
        this.updateLanguageSelector();
        
        console.log(`✅ Language changed to: ${language}`);
        return true;
    }

    updateLanguageSelector() {
        const selector = document.getElementById('languageSelector');
        if (selector) {
            selector.value = this.currentLanguage;
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    // Helper method for dynamic content translation
    translateText(key, defaultText = null) {
        return this.translate(key, defaultText);
    }

    // Method to add runtime translations (for dynamic content)
    addTranslation(language, key, value) {
        if (!this.translations[language]) {
            this.translations[language] = {};
        }
        
        const keys = key.split('.');
        let current = this.translations[language];
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }
}

// Create global instance
window.localizationManager = new LocalizationManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalizationManager;
}

console.log('🌍 localization.js loaded successfully');