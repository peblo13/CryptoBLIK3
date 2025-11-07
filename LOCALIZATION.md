# CryptoBLIK Localization System

## Overview
This document describes the comprehensive localization (internationalization) system implemented for the CryptoBLIK cryptocurrency platform. The system supports multiple languages and provides a seamless user experience for users speaking different languages.

## Supported Languages
- **Polish (pl)** - Default language
- **English (en)** - Secondary language

## System Components

### 1. Frontend Localization

#### Directory Structure
```
locales/
├── pl.json    # Polish translations
└── en.json    # English translations
```

#### JavaScript Module
- **File**: `localization.js`
- **Class**: `LocalizationManager`
- **Features**:
  - Automatic language detection from browser preferences
  - Dynamic language switching without page reload
  - LocalStorage for language preference persistence
  - Fallback to default language if translation missing
  - Real-time DOM updates when language changes

#### Usage in HTML
Elements requiring translation should include a `data-translate` attribute:
```html
<h1 data-translate="hero.title">Handluj Kryptowalutami</h1>
<button data-translate="trading.btn_buy_now">Kup teraz</button>
<input placeholder="..." data-translate="trading.email_placeholder">
```

#### Language Switcher
A dropdown selector in the navigation allows users to change languages:
```html
<select id="languageSelector" onchange="changeLanguage(this.value)">
    <option value="pl">🇵🇱 Polski</option>
    <option value="en">🇬🇧 English</option>
</select>
```

### 2. Backend Localization

#### Module
- **File**: `backend_localization.py`
- **Class**: `BackendLocalization`
- **Features**:
  - HTTP Accept-Language header detection
  - URL parameter language override (`?lang=en`)
  - Standardized error and success responses
  - Fallback language support

#### Usage in Flask Routes
```python
from backend_localization import backend_i18n

# Error response
return jsonify(backend_i18n.error_response('invalid_amount'))

# Success response
return jsonify(backend_i18n.success_response('payment_success', data=result))
```

## Translation Keys Structure

### Frontend (locales/pl.json, locales/en.json)
```json
{
  "navigation": {
    "home": "Home",
    "prices": "Ceny/Prices",
    "trading": "Trading",
    "about": "O Nas/About Us",
    "faq": "FAQ",
    "contact": "Kontakt/Contact"
  },
  "hero": {
    "title": "Handluj Kryptowalutami/Trade Cryptocurrencies",
    "subtitle": "Odkryj świat cyfrowych walut.../Discover the world of digital currencies...",
    "btn_buy_sell": "Kup / Sprzedaj/Buy / Sell",
    "btn_check_prices": "Sprawdź Ceny/Check Prices"
  },
  "trading": {
    "buy_title": "🟢 Kup Kryptowalutę/🟢 Buy Cryptocurrency",
    "sell_title": "🔴 Sprzedaj Kryptowalutę/🔴 Sell Cryptocurrency",
    "amount_label": "Kwota w PLN:/Amount in PLN:",
    "crypto_label": "Wybierz kryptowalutę:/Choose cryptocurrency:",
    "blik_code_label": "Kod BLIK (6 cyfr):/BLIK code (6 digits):",
    "email_label": "Email (do faktury):/Email (for invoice):",
    "btn_buy_now": "Kup teraz/Buy now",
    "btn_sell_now": "Sprzedaj teraz/Sell now"
  },
  "messages": {
    "payment_processing": "Przetwarzanie płatności.../Processing payment...",
    "payment_success": "Płatność została pomyślnie przetworzona!/Payment has been successfully processed!",
    "loading_prices": "Ładowanie cen.../Loading prices...",
    "connection_error": "Błąd połączenia.../Connection error..."
  },
  "forms": {
    "required_field": "To pole jest wymagane/This field is required",
    "invalid_email": "Nieprawidłowy adres email/Invalid email address",
    "invalid_blik": "Kod BLIK musi zawierać 6 cyfr/BLIK code must contain 6 digits"
  }
}
```

### Backend (backend_localization.py)
```python
backend_translations = {
    'pl': {
        'errors': {
            'invalid_amount': 'Nieprawidłowa kwota',
            'invalid_crypto': 'Nieprawidłowa kryptowaluta',
            'payment_failed': 'Płatność nie powiodła się',
            'api_error': 'Błąd API'
        },
        'messages': {
            'payment_success': 'Płatność zakończona pomyślnie',
            'api_connected': 'Połączono z API'
        }
    },
    'en': {
        'errors': {
            'invalid_amount': 'Invalid amount',
            'invalid_crypto': 'Invalid cryptocurrency',
            'payment_failed': 'Payment failed',
            'api_error': 'API error'
        },
        'messages': {
            'payment_success': 'Payment completed successfully',
            'api_connected': 'Connected to API'
        }
    }
}
```

## Implementation Details

### Language Detection Flow
1. Check URL parameter (`?lang=en`)
2. Check localStorage for saved preference
3. Parse browser Accept-Language header
4. Fall back to default language (Polish)

### Language Switching Process
1. User selects language from dropdown
2. JavaScript calls `changeLanguage(language)`
3. LocalizationManager loads translation file if needed
4. DOM is updated with new translations
5. Language preference saved to localStorage
6. HTML `lang` attribute updated
7. Meta tags (title, description) updated

### Dynamic Content Updates
The system handles dynamic content through:
- `data-translate` attributes for static content
- JavaScript method calls for dynamic content
- Event listeners for real-time updates
- Form validation messages
- API response messages

## CSS Styling for Language Switcher
```css
.language-switcher select {
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid #FFD700;
    border-radius: 20px;
    color: #fff;
    padding: 8px 15px;
    font-size: 14px;
    cursor: pointer;
    outline: none;
    transition: all 0.3s ease;
}

.language-switcher select:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: #FFA500;
}
```

## Browser Compatibility
- Modern browsers with ES6+ support
- Graceful degradation for older browsers
- Mobile-responsive language switcher
- Cross-browser localStorage support

## Performance Considerations
- Translation files loaded asynchronously
- Cached translations prevent multiple requests
- Minimal DOM manipulation during language switches
- Optimized file sizes for fast loading

## Future Enhancements
- Additional language support (German, French, Spanish)
- RTL language support for Arabic/Hebrew
- Pluralization rules for complex grammar
- Date/time localization
- Currency formatting based on locale
- Server-side rendering with language detection

## Maintenance
- Translation files are in JSON format for easy editing
- Centralized key structure for consistency
- Fallback mechanisms prevent broken UI
- Console logging for debugging translation issues

## Testing
To test the localization system:
1. Open the application in a browser
2. Use the language dropdown to switch between Polish and English
3. Verify all text elements update correctly
4. Check localStorage persistence by refreshing the page
5. Test with different browser language settings
6. Verify API responses include correct language

## Troubleshooting
Common issues and solutions:
- **Missing translations**: Check console for error messages
- **Language not switching**: Verify JSON syntax in translation files
- **Fallback not working**: Check default language configuration
- **Persistence issues**: Clear localStorage and test again