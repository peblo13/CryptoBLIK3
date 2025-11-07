# 🎵 EventFinder - Discover the Best Events Worldwide

![EventFinder Logo](https://img.shields.io/badge/EventFinder-🎵-purple)
![Status](https://img.shields.io/badge/Status-Active-green)
![License](https://img.shields.io/badge/License-MIT-blue)

**EventFinder** is a modern, responsive web application that helps you discover amazing concerts, shows, and events worldwide. With AI-powered recommendations, interactive maps, and multilingual support, it's your ultimate companion for finding unforgettable experiences.

## 🌟 Key Features

### 🌍 Global Event Discovery
- **125K+ Events**: Access to events worldwide through Ticketmaster Discovery API
- **Multi-region Search**: Intelligent search across USA, Europe, Asia, and other regions
- **Real-time Updates**: Live event data with pricing and availability

### 🗺️ Interactive Event Map
- **Global Visualization**: See events on an interactive world map
- **Smart Clustering**: Automatic grouping of nearby events
- **Country Focus**: Quick navigation to specific countries and regions
- **Venue Details**: Comprehensive venue information and directions

### 🤖 AI-Powered Recommendations
- **Personalized Suggestions**: Events tailored to your preferences
- **Location-based**: Recommendations based on your area
- **Genre Learning**: System learns from your interactions
- **Popular Events**: Trending events in your region

### 🌐 Multilingual Support
- **English & Polish**: Complete interface translation
- **Language Switcher**: Easy toggle between languages
- **Localized Content**: Currency, dates, and regional preferences
- **SEO Optimized**: Multi-language meta tags and content

### 📱 Modern Responsive Design
- **Glassmorphism UI**: Beautiful translucent design elements
- **Mobile-First**: Optimized for all device sizes
- **Dark Theme**: Eye-friendly dark interface
- **Smooth Animations**: Engaging user interactions

### 💎 Premium Features
- **SMS Notifications**: Get alerts for your favorite artists
- **Calendar Sync**: Export events to Google Calendar/Outlook
- **Unlimited Favorites**: Save as many events as you want
- **Priority Support**: Fast customer service
- **$19.99/month**: Affordable premium subscription

### 🔗 Social Integration
- **Share Events**: Facebook, Twitter, Instagram, WhatsApp
- **Follow Artists**: Get notifications for new tours
- **Merchandise**: Direct links to artist merch
- **Reviews System**: User ratings and reviews

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for API calls
- Optional: Local web server for development

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/peblo13/eventfinder.git
   cd eventfinder
   ```

2. **Open in browser:**
   ```bash
   # Simple file serving
   open events-finder.html
   
   # Or with Python server
   python -m http.server 8080
   ```

3. **Visit:** `http://localhost:8080/events-finder.html`

### Configuration

1. **API Keys** (included for demo):
   - Ticketmaster API key is pre-configured
   - For production, get your own at [developer.ticketmaster.com](https://developer.ticketmaster.com)

2. **Customization:**
   - Modify `TICKETMASTER_API.key` in the HTML file
   - Update language preferences in `translations` object
   - Customize styling through CSS variables

## 🏗️ Architecture

### Frontend Stack
- **HTML5**: Semantic markup with modern features
- **CSS3**: Advanced styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript**: No frameworks, pure ES6+ code
- **Leaflet.js**: Interactive mapping library
- **Font Awesome**: Icon library for UI elements

### APIs & Services
- **Ticketmaster Discovery API**: Event data and venue information
- **OpenStreetMap**: Map tiles and geographic data
- **Geolocation API**: User location detection
- **Local Storage**: Client-side data persistence

### Key Components

```javascript
// Main search functionality
async function searchEvents()

// Global multi-region search
async function searchGlobalEvents()

// Map visualization
function updateMap(events)

// Language switching
function switchLanguage(lang)

// Event rendering
function displayEvents(events)
```

## 🌍 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 80+     | ✅ Fully Supported |
| Firefox | 75+     | ✅ Fully Supported |
| Safari  | 13+     | ✅ Fully Supported |
| Edge    | 80+     | ✅ Fully Supported |

## 📊 Performance

- **First Load**: < 3 seconds
- **Search Response**: < 1 second
- **Map Rendering**: < 2 seconds
- **Language Switch**: Instant
- **Bundle Size**: ~150KB gzipped

## 🔒 Privacy & Security

- **No User Data Collection**: Privacy-first approach
- **Local Storage Only**: Data stays on your device
- **HTTPS Ready**: Secure connections supported
- **GDPR Compliant**: European privacy regulations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly across browsers
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use 4 spaces for indentation
- Follow ESLint configuration
- Write semantic HTML
- Use CSS custom properties
- Document complex functions

## 📈 Roadmap

### Version 2.0 (Q1 2024)
- [ ] Weather integration for outdoor events
- [ ] Price alerts and notifications
- [ ] Local transportation integration
- [ ] Enhanced calendar features

### Version 2.1 (Q2 2024)
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Voice search improvements
- [ ] AR venue navigation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**peblo13**
- GitHub: [@peblo13](https://github.com/peblo13)
- Email: contact@eventfinder.fun

## 🙏 Acknowledgments

- **Ticketmaster**: For providing the comprehensive events API
- **OpenStreetMap**: For the beautiful map tiles
- **Font Awesome**: For the icon library
- **Leaflet**: For the mapping functionality

## 📞 Support

- 📧 Email: support@eventfinder.fun
- 🐛 Issues: [GitHub Issues](https://github.com/peblo13/eventfinder/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/peblo13/eventfinder/discussions)

---

**⭐ Star this repository if you find it helpful!**

Made with ❤️ for event lovers worldwide 🌍