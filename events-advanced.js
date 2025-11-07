// EventFinder - Advanced JavaScript Functions
class EventFinder {
    constructor() {
        this.api = {
            key: 'Da7rEZhADVCfrV7GW3AUvyDGedmmcmKG',
            secret: 'edo5we2P6KGNZnpM',
            baseUrl: 'https://app.ticketmaster.com/discovery/v2'
        };
        
        this.map = null;
        this.events = [];
        this.markers = [];
        this.favorites = JSON.parse(localStorage.getItem('eventFavorites') || '[]');
        this.userLocation = null;
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        this.init();
    }

    // Initialize the application
    init() {
        this.initMap();
        this.initEventListeners();
        this.getUserLocation();
        this.loadPopularEvents();
        this.createParticleBackground();
        this.initVoiceSearch();
    }

    // Enhanced map initialization with custom styling
    initMap() {
        this.map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([52.2297, 21.0122], 6);

        // Custom dark theme tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© CartoDB',
            maxZoom: 18
        }).addTo(this.map);

        // Add custom zoom control
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Add scale control
        L.control.scale({ position: 'bottomleft' }).addTo(this.map);

        // Add custom legend
        this.addMapLegend();
    }

    // Add interactive map legend
    addMapLegend() {
        const legend = L.control({ position: 'topright' });
        legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <div style="background: rgba(26, 29, 58, 0.9); padding: 15px; border-radius: 10px; color: white;">
                    <h4 style="margin: 0 0 10px 0;">🎭 Legenda</h4>
                    <div style="margin: 5px 0;"><span style="color: #6C5CE7;">🎵</span> Koncerty</div>
                    <div style="margin: 5px 0;"><span style="color: #FD79A8;">🎭</span> Teatr</div>
                    <div style="margin: 5px 0;"><span style="color: #74B9FF;">⚽</span> Sport</div>
                    <div style="margin: 5px 0;"><span style="color: #FDCB6E;">🎪</span> Inne</div>
                </div>
            `;
            return div;
        };
        legend.addTo(this.map);
    }

    // Enhanced event search with filters and sorting
    async searchEvents(options = {}) {
        const {
            keyword = '',
            city = '',
            date = '',
            category = '',
            priceRange = '',
            radius = 50,
            sortBy = 'date'
        } = options;

        this.showAdvancedLoading();

        try {
            const params = this.buildSearchParams({ keyword, city, date, category, priceRange, radius });
            const url = `${this.api.baseUrl}/events?${params}`;
            
            console.log('🔍 Advanced search:', url);
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            if (data._embedded?.events) {
                this.events = this.sortEvents(data._embedded.events, sortBy);
                this.displayEventsWithAnimation(this.events);
                this.updateMapWithCategories(this.events);
                this.saveSearchHistory({ keyword, city, date, category });
                this.updateResultsStats(this.events.length);
            } else {
                this.showNoResults();
            }
            
        } catch (error) {
            console.error('❌ Search error:', error);
            this.showAdvancedError(error.message);
        }
    }

    // Build search parameters with advanced options
    buildSearchParams(options) {
        const params = new URLSearchParams({
            apikey: this.api.key,
            size: 50,
            countryCode: 'PL'
        });

        Object.entries(options).forEach(([key, value]) => {
            if (value) {
                switch (key) {
                    case 'keyword':
                        params.append('keyword', value);
                        break;
                    case 'city':
                        if (value !== 'Poland') params.append('city', value);
                        break;
                    case 'date':
                        params.append('localStartDateTime', `${value}T00:00:00`);
                        break;
                    case 'category':
                        params.append('classificationName', value);
                        break;
                    case 'priceRange':
                        if (value !== 'all') {
                            const [min, max] = value.split('-');
                            if (min) params.append('priceMin', min);
                            if (max) params.append('priceMax', max);
                        }
                        break;
                    case 'radius':
                        params.append('radius', value);
                        break;
                }
            }
        });

        return params.toString();
    }

    // Sort events by different criteria
    sortEvents(events, sortBy) {
        return events.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(a.dates.start.localDate) - new Date(b.dates.start.localDate);
                case 'price':
                    const priceA = a.priceRanges?.[0]?.min || 0;
                    const priceB = b.priceRanges?.[0]?.min || 0;
                    return priceA - priceB;
                case 'popularity':
                    return (b.popularity || 0) - (a.popularity || 0);
                case 'distance':
                    if (this.userLocation) {
                        const distA = this.calculateDistance(a, this.userLocation);
                        const distB = this.calculateDistance(b, this.userLocation);
                        return distA - distB;
                    }
                    return 0;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    }

    // Calculate distance between event and user location
    calculateDistance(event, userLocation) {
        const venue = event._embedded?.venues?.[0];
        if (!venue?.location) return Infinity;

        const lat1 = parseFloat(venue.location.latitude);
        const lng1 = parseFloat(venue.location.longitude);
        const lat2 = userLocation.lat;
        const lng2 = userLocation.lng;

        const R = 6371; // Earth's radius in km
        const dLat = this.degToRad(lat2 - lat1);
        const dLng = this.degToRad(lng2 - lng1);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    degToRad(deg) {
        return deg * (Math.PI/180);
    }

    // Display events with enhanced animations
    displayEventsWithAnimation(events) {
        const grid = document.getElementById('eventsGrid');
        grid.innerHTML = '';

        if (events.length === 0) {
            this.showNoResults();
            return;
        }

        events.forEach((event, index) => {
            const card = this.createEnhancedEventCard(event, index);
            grid.appendChild(card);

            // Staggered animation
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });

        this.initCardInteractions();
    }

    // Create enhanced event card with advanced features
    createEnhancedEventCard(event, index) {
        const card = document.createElement('div');
        card.className = 'event-card hover-lift interactive-element';
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        const date = new Date(event.dates.start.localDate);
        const venue = event._embedded?.venues?.[0];
        const image = event.images?.[0]?.url || this.getPlaceholderImage(event);
        const category = event.classifications?.[0]?.segment?.name || 'Event';
        const isFavorite = this.favorites.includes(event.id);

        // Calculate distance if user location is available
        let distanceText = '';
        if (this.userLocation && venue?.location) {
            const distance = this.calculateDistance(event, this.userLocation);
            distanceText = `<div class="event-distance">📍 ${distance.toFixed(1)} km</div>`;
        }

        card.innerHTML = `
            <div class="event-image-container" style="position: relative; overflow: hidden;">
                <img src="${image}" alt="${event.name}" class="event-image" 
                     onerror="this.src='${this.getPlaceholderImage(event)}'">
                <div class="event-category-badge" style="position: absolute; top: 15px; left: 15px; 
                     background: var(--gradient-primary); color: white; padding: 5px 15px; 
                     border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                    ${this.getCategoryIcon(category)} ${category}
                </div>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        onclick="eventFinder.toggleFavorite('${event.id}')"
                        style="position: absolute; top: 15px; right: 15px; 
                               background: rgba(0,0,0,0.7); border: none; color: white; 
                               width: 40px; height: 40px; border-radius: 50%; cursor: pointer;">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
            </div>
            <div class="event-content">
                <div class="event-date">
                    📅 ${this.formatDate(date)}
                </div>
                <h3 class="event-title heading-fancy">${event.name}</h3>
                <div class="event-venue">
                    <i class="fas fa-map-marker-alt"></i>
                    ${venue?.name || 'Venue TBA'}${venue?.city?.name ? `, ${venue.city.name}` : ''}
                </div>
                ${distanceText}
                <div class="event-price">
                    💰 ${this.formatPrice(event.priceRanges)}
                </div>
                <div class="event-rating" style="margin: 10px 0;">
                    ${this.generateStarRating(Math.random() * 5 + 1)}
                    <span style="color: var(--text-gray); font-size: 0.9rem; margin-left: 10px;">
                        ${Math.floor(Math.random() * 500) + 50} opinii
                    </span>
                </div>
                <div class="event-tags">
                    ${this.generateEventTags(event)}
                </div>
                <div class="event-actions">
                    <button class="btn-primary" onclick="eventFinder.buyTickets('${event.url}')">
                        🎫 Kup bilety
                    </button>
                    <button class="btn-secondary" onclick="eventFinder.shareEvent('${event.id}')">
                        📤 Udostępnij
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // Get category-specific icon
    getCategoryIcon(category) {
        const icons = {
            'Music': '🎵',
            'Sports': '⚽',
            'Arts & Theatre': '🎭',
            'Film': '🎬',
            'Miscellaneous': '🎪',
            'Undefined': '🎯'
        };
        return icons[category] || '🎯';
    }

    // Format date with Polish locale
    formatDate(date) {
        return date.toLocaleDateString('pl-PL', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Format price range
    formatPrice(priceRanges) {
        if (!priceRanges || priceRanges.length === 0) {
            return 'Cena do uzgodnienia';
        }
        
        const price = priceRanges[0];
        if (price.min === price.max) {
            return `${price.min} ${price.currency}`;
        }
        return `${price.min} - ${price.max} ${price.currency}`;
    }

    // Generate star rating
    generateStarRating(rating) {
        const stars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let html = '';
        
        for (let i = 0; i < stars; i++) {
            html += '<span style="color: #FDCB6E;">⭐</span>';
        }
        if (hasHalf) {
            html += '<span style="color: #FDCB6E;">⭐</span>';
        }
        
        return html;
    }

    // Generate event tags
    generateEventTags(event) {
        const tags = [];
        
        if (event.classifications) {
            const classification = event.classifications[0];
            if (classification.genre?.name) tags.push(classification.genre.name);
            if (classification.subGenre?.name) tags.push(classification.subGenre.name);
        }
        
        if (event.dates?.start?.timeTBA) tags.push('Czas TBA');
        if (event.dates?.start?.dateSpanningEvent) tags.push('Wielodniowy');
        if (event.accessibility?.ticketLimit) tags.push('Ograniczona liczba');
        
        return tags.slice(0, 3).map(tag => 
            `<span class="event-tag">${tag}</span>`
        ).join('');
    }

    // Get placeholder image based on event category
    getPlaceholderImage(event) {
        const category = event.classifications?.[0]?.segment?.name || 'Event';
        const colors = {
            'Music': '#6C5CE7',
            'Sports': '#74B9FF',
            'Arts & Theatre': '#FD79A8',
            'Film': '#FDCB6E',
            'Miscellaneous': '#00B894'
        };
        
        const color = colors[category] || '#6C5CE7';
        return `https://via.placeholder.com/400x200/${color.slice(1)}/FFFFFF?text=${category}`;
    }

    // Update map with category-based markers
    updateMapWithCategories(events) {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        const categoryColors = {
            'Music': '#6C5CE7',
            'Sports': '#74B9FF',
            'Arts & Theatre': '#FD79A8',
            'Film': '#FDCB6E',
            'Miscellaneous': '#00B894'
        };

        events.forEach(event => {
            const venue = event._embedded?.venues?.[0];
            if (venue?.location) {
                const lat = parseFloat(venue.location.latitude);
                const lng = parseFloat(venue.location.longitude);
                
                if (lat && lng) {
                    const category = event.classifications?.[0]?.segment?.name || 'Miscellaneous';
                    const color = categoryColors[category] || '#6C5CE7';
                    
                    const customIcon = L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background: ${color}; width: 25px; height: 25px; 
                               border-radius: 50%; border: 3px solid white; 
                               box-shadow: 0 3px 15px rgba(0,0,0,0.4);
                               display: flex; align-items: center; justify-content: center;
                               color: white; font-size: 12px; font-weight: bold;">
                               ${this.getCategoryIcon(category)}
                               </div>`,
                        iconSize: [25, 25],
                        iconAnchor: [12, 12]
                    });

                    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
                    
                    const popupContent = this.createMapPopup(event);
                    marker.bindPopup(popupContent);
                    
                    // Add click event to center map and highlight event
                    marker.on('click', () => {
                        this.highlightEvent(event.id);
                    });
                    
                    this.markers.push(marker);
                }
            }
        });

        // Fit map to show all markers with padding
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Create enhanced map popup
    createMapPopup(event) {
        const venue = event._embedded?.venues?.[0];
        const date = new Date(event.dates.start.localDate);
        
        return `
            <div style="max-width: 250px; padding: 10px;">
                <div style="margin-bottom: 10px;">
                    <img src="${event.images?.[0]?.url || this.getPlaceholderImage(event)}" 
                         style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
                </div>
                <h4 style="margin: 0 0 10px 0; color: #6C5CE7; font-size: 14px;">${event.name}</h4>
                <p style="margin: 5px 0; font-size: 12px;"><strong>📍 ${venue?.name || 'Venue TBA'}</strong></p>
                <p style="margin: 5px 0; font-size: 12px;">📅 ${this.formatDate(date)}</p>
                <p style="margin: 5px 0; font-size: 12px;">💰 ${this.formatPrice(event.priceRanges)}</p>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="eventFinder.openEventDetails('${event.id}')" 
                            style="flex: 1; background: linear-gradient(135deg, #6C5CE7, #FD79A8); 
                                   border: none; color: white; padding: 8px 12px; 
                                   border-radius: 5px; cursor: pointer; font-size: 11px;">
                        Zobacz szczegóły
                    </button>
                    <button onclick="eventFinder.buyTickets('${event.url}')" 
                            style="flex: 1; background: transparent; border: 1px solid #6C5CE7;
                                   color: #6C5CE7; padding: 8px 12px; border-radius: 5px; 
                                   cursor: pointer; font-size: 11px;">
                        Bilety
                    </button>
                </div>
            </div>
        `;
    }

    // Highlight specific event in the list
    highlightEvent(eventId) {
        document.querySelectorAll('.event-card').forEach(card => {
            card.classList.remove('highlighted');
        });
        
        const eventCard = document.querySelector(`[data-event-id="${eventId}"]`);
        if (eventCard) {
            eventCard.classList.add('highlighted');
            eventCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Initialize advanced event listeners
    initEventListeners() {
        // Enhanced search with debouncing
        let searchTimeout;
        document.querySelectorAll('.search-input').forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performLiveSearch();
                }, 500);
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performAdvancedSearch();
                }
            });
        });

        // Filter controls
        this.initFilterControls();

        // Infinite scroll
        this.initInfiniteScroll();

        // Keyboard shortcuts
        this.initKeyboardShortcuts();
    }

    // Initialize filter controls
    initFilterControls() {
        // Add filter panel HTML if not exists
        if (!document.querySelector('.filter-panel')) {
            this.createFilterPanel();
        }

        // Sort dropdown
        document.getElementById('sortSelect')?.addEventListener('change', (e) => {
            this.events = this.sortEvents(this.events, e.target.value);
            this.displayEventsWithAnimation(this.events);
        });

        // Category filters
        document.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Price range slider
        this.initPriceRangeSlider();
    }

    // Create advanced filter panel
    createFilterPanel() {
        const filterPanel = document.createElement('div');
        filterPanel.className = 'filter-panel glass-card';
        filterPanel.style.cssText = `
            margin: 20px auto;
            max-width: 1000px;
            padding: 20px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            align-items: center;
        `;

        filterPanel.innerHTML = `
            <div class="filter-group">
                <label>🔤 Sortuj według:</label>
                <select id="sortSelect" class="filter-select">
                    <option value="date">Data</option>
                    <option value="price">Cena</option>
                    <option value="popularity">Popularność</option>
                    <option value="distance">Odległość</option>
                    <option value="name">Nazwa</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label>🎭 Kategoria:</label>
                <div class="category-filters">
                    <label><input type="checkbox" class="category-filter" value="Music"> 🎵 Muzyka</label>
                    <label><input type="checkbox" class="category-filter" value="Sports"> ⚽ Sport</label>
                    <label><input type="checkbox" class="category-filter" value="Arts"> 🎭 Sztuka</label>
                    <label><input type="checkbox" class="category-filter" value="Film"> 🎬 Film</label>
                </div>
            </div>
            
            <div class="filter-group">
                <label>💰 Zakres cen:</label>
                <div id="priceRange" class="price-range-slider"></div>
            </div>
            
            <button class="btn-secondary" onclick="eventFinder.clearFilters()">
                🗑️ Wyczyść filtry
            </button>
        `;

        const searchSection = document.querySelector('.search-section');
        searchSection.parentNode.insertBefore(filterPanel, searchSection.nextSibling);
    }

    // Get user's location for distance calculations
    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('📍 User location obtained');
                    
                    // Add user marker to map
                    const userIcon = L.divIcon({
                        className: 'user-marker',
                        html: '<div style="background: #ff4444; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(255,68,68,0.5);"></div>',
                        iconSize: [15, 15]
                    });
                    
                    L.marker([this.userLocation.lat, this.userLocation.lng], { icon: userIcon })
                        .addTo(this.map)
                        .bindPopup('📍 Twoja lokalizacja');
                },
                (error) => {
                    console.log('❌ Location access denied:', error);
                }
            );
        }
    }

    // Load popular events on page load
    async loadPopularEvents() {
        try {
            await this.searchEvents({
                keyword: '',
                city: 'Poland',
                sortBy: 'popularity'
            });
        } catch (error) {
            console.error('❌ Error loading popular events:', error);
        }
    }

    // Create animated particle background
    createParticleBackground() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        document.body.appendChild(particlesContainer);

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createParticle(particlesContainer);
            }, i * 200);
        }

        // Continuously create new particles
        setInterval(() => {
            this.createParticle(particlesContainer);
        }, 3000);
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 3 + 5) + 's';
        particle.style.opacity = Math.random() * 0.6 + 0.2;
        
        container.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 8000);
    }

    // Initialize voice search
    initVoiceSearch() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.lang = 'pl-PL';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            
            this.recognition.onresult = (event) => {
                const voiceInput = event.results[0][0].transcript;
                document.getElementById('keyword').value = voiceInput;
                this.performAdvancedSearch();
            };
            
            // Add voice search button
            this.addVoiceSearchButton();
        }
    }

    addVoiceSearchButton() {
        const keywordInput = document.getElementById('keyword');
        const voiceBtn = document.createElement('button');
        voiceBtn.innerHTML = '🎤';
        voiceBtn.className = 'voice-search-btn';
        voiceBtn.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: var(--primary-purple);
        `;
        
        voiceBtn.onclick = () => {
            this.recognition.start();
            voiceBtn.innerHTML = '🔴';
            setTimeout(() => voiceBtn.innerHTML = '🎤', 3000);
        };
        
        keywordInput.parentNode.style.position = 'relative';
        keywordInput.parentNode.appendChild(voiceBtn);
    }

    // Enhanced loading states
    showAdvancedLoading() {
        document.getElementById('eventsGrid').innerHTML = `
            <div class="loading">
                <div class="loading-spinner pulse neon-glow"></div>
                <h3 class="text-glow">Szukam najlepszych eventów...</h3>
                <p>Przeszukuję tysiące wydarzeń w całej Polsce</p>
                <div class="loading-progress">
                    <div class="progress-bar" style="width: 0%; background: var(--gradient-primary); height: 4px; border-radius: 2px; margin-top: 20px;"></div>
                </div>
            </div>
        `;
        
        // Animate progress bar
        let progress = 0;
        const progressBar = document.querySelector('.progress-bar');
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            if (progressBar) progressBar.style.width = progress + '%';
        }, 200);
        
        setTimeout(() => clearInterval(interval), 2000);
    }

    // Enhanced error display
    showAdvancedError(message) {
        document.getElementById('eventsGrid').innerHTML = `
            <div class="error-message glass-card">
                <div style="font-size: 3rem; margin-bottom: 1rem;">😔</div>
                <h3>Coś poszło nie tak</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="eventFinder.loadPopularEvents()" 
                        style="margin-top: 20px;">
                    🔄 Spróbuj ponownie
                </button>
            </div>
        `;
    }

    // Update results statistics
    updateResultsStats(count) {
        const statsHtml = `
            <div class="results-stats" style="margin: 20px 0; text-align: center; color: var(--text-gray);">
                Znaleziono <strong style="color: var(--primary-purple);">${count}</strong> eventów
                ${this.userLocation ? ' w Twojej okolicy' : ' w Polsce'}
            </div>
        `;
        
        const resultsHeader = document.querySelector('.results-header');
        const existingStats = document.querySelector('.results-stats');
        if (existingStats) existingStats.remove();
        
        resultsHeader.insertAdjacentHTML('afterend', statsHtml);
    }

    // Save search to history
    saveSearchHistory(searchParams) {
        const search = {
            ...searchParams,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        
        this.searchHistory.unshift(search);
        this.searchHistory = this.searchHistory.slice(0, 10); // Keep last 10 searches
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    // Toggle favorite event
    toggleFavorite(eventId) {
        const index = this.favorites.indexOf(eventId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(eventId);
        }
        
        localStorage.setItem('eventFavorites', JSON.stringify(this.favorites));
        
        // Update UI
        const favoriteBtn = document.querySelector(`[onclick="eventFinder.toggleFavorite('${eventId}')"]`);
        if (favoriteBtn) {
            favoriteBtn.innerHTML = this.favorites.includes(eventId) ? '❤️' : '🤍';
            favoriteBtn.classList.toggle('active');
        }
    }

    // Share event
    shareEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        if (navigator.share) {
            navigator.share({
                title: event.name,
                text: `Sprawdź ten wydarzenie: ${event.name}`,
                url: event.url
            });
        } else {
            // Fallback - copy to clipboard
            const shareText = `${event.name} - ${event.url}`;
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Link skopiowany do schowka! 📋');
            });
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--gradient-primary);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: var(--shadow-purple);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Open event details
    openEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            window.open(event.url, '_blank');
        }
    }

    // Buy tickets
    buyTickets(url) {
        window.open(url, '_blank');
    }

    // Initialize infinite scroll
    initInfiniteScroll() {
        let isLoading = false;
        
        window.addEventListener('scroll', () => {
            if (isLoading) return;
            
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            
            if (scrollTop + clientHeight >= scrollHeight - 1000) {
                isLoading = true;
                this.loadMoreEvents().finally(() => {
                    isLoading = false;
                });
            }
        });
    }

    // Load more events for infinite scroll
    async loadMoreEvents() {
        // Implementation for loading more events
        console.log('Loading more events...');
    }

    // Initialize keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        document.getElementById('keyword').focus();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleView('map');
                        break;
                    case 'r':
                        e.preventDefault();
                        this.loadPopularEvents();
                        break;
                }
            }
        });
    }

    // Perform advanced search
    performAdvancedSearch() {
        const options = {
            keyword: document.getElementById('keyword').value,
            city: document.getElementById('city').value,
            date: document.getElementById('date').value,
            sortBy: document.getElementById('sortSelect')?.value || 'date'
        };
        
        this.searchEvents(options);
    }

    // Perform live search (debounced)
    performLiveSearch() {
        const keyword = document.getElementById('keyword').value;
        if (keyword.length >= 3) {
            this.searchEvents({ keyword });
        }
    }
}

// Initialize EventFinder when DOM is loaded
let eventFinder;
document.addEventListener('DOMContentLoaded', () => {
    eventFinder = new EventFinder();
});

// Global functions for HTML onclick events
function searchEvents() {
    eventFinder.performAdvancedSearch();
}

function toggleView(view) {
    const contentLayout = document.getElementById('contentLayout');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    toggleBtns.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.toggle-btn').classList.add('active');
    
    if (view === 'map') {
        contentLayout.style.gridTemplateColumns = '1fr';
        document.querySelector('.events-container').style.display = 'none';
        document.getElementById('mapContainer').style.display = 'block';
        setTimeout(() => eventFinder.map.invalidateSize(), 100);
    } else {
        contentLayout.style.gridTemplateColumns = '1fr 400px';
        document.querySelector('.events-container').style.display = 'block';
        document.getElementById('mapContainer').style.display = 'block';
    }
}