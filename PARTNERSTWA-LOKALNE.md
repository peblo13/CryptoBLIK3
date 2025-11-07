# 🤝 Partnerstwa Lokalne - Lista Kontaktów i Strategia

## 🍽️ RESTAURACJE przy eventach (prowizje 5-15%)

### Warszawa:
- **Restauracja Akademia** (przy Palladium) - akademia@example.com
- **Sphinx** (centrum handlowe) - marketing@sphinx.pl
- **McDonald's** (lokalizacje centralne) - marketing@mcdonalds.pl
- **Pizza Hut** - partnerships@pizzahut.pl

### Template Email:
```
Temat: Partnerstwo EventFinder - skierowanie klientów do Państwa restauracji

Dzień dobry,

Jestem twórcą platformy EventFinder - wyszukiwarki koncertów i wydarzeń w Polsce.

NASZA PROPOZYCJA:
✅ Dodamy Państwa restaurację jako "Polecane miejsce przed/po evencie"
✅ Link bezpośrednio do Państwa strony/menu
✅ Geolokalizacja - pokazujemy najbliższe restauracje do eventów
✅ Prowizja tylko od rzeczywistych zamówień (tracking UTM)

WARUNKI:
- 5-10% prowizji od zamówień przez naszą stronę
- Specjalne promocje dla użytkowników EventFinder
- Wzajemne promowanie (my u Was, Wy u nas)

STATYSTYKI:
- 10,000+ użytkowników miesięcznie
- Focus na osoby 25-45 lat (Twoja grupa docelowa!)
- Głównie Warszawa, Kraków, Gdańsk

Zapraszam do współpracy!
```

## 🏨 HOTELE (prowizje 8-25%)

### Platformy:
- **Booking.com Affiliate Program** - commission.booking.com
- **Hotels.com** - affiliate-network.hotels.com  
- **Agoda Partner Program** - partners.agoda.com

### Integracja:
```javascript
// Add this to event details
function showNearbyHotels(eventVenue) {
    const hotelLinks = {
        booking: `https://booking.com/searchresults.html?city=${eventVenue}&aid=YOUR_AFFILIATE_ID`,
        hotels: `https://hotels.com/search?q=${eventVenue}&aid=YOUR_ID`
    };
    
    return `
        <div class="hotel-recommendations">
            <h4>🏨 Hotele w pobliżu:</h4>
            <a href="${hotelLinks.booking}" target="_blank">Zobacz hotele na Booking.com</a>
        </div>
    `;
}
```

## 🚗 TRANSPORT (prowizje 3-12%)

### Uber/Bolt:
- **Uber Affiliate Program** - uber.com/affiliate
- **Bolt Business** - bolt.eu/business

### Kod promocyjny:
```
EVENTFINDER10 - 10% zniżki na przejazdy
(prowizja za każde nowe pobranie aplikacji)
```

## 🎫 DODATKOWE USŁUGI

### Ubezpieczenia na eventy:
- **PZU** - ubezpieczenia eventowe
- **Ergo Hestia** - sport i rekreacja

### Produkty muzyczne:
- **Empik** - płyty, gadżety
- **Allegro Partner Program** - sprzęt muzyczny

## 📊 TRACKING I ANALYTICS

### UTM Parameters:
```
https://restaurant.com/menu?utm_source=eventfinder&utm_medium=recommendation&utm_campaign=concert_name&utm_content=venue_nearby
```

### Conversion Tracking:
```javascript
function trackPartnerClick(partner, eventId, revenue = 0) {
    // Google Analytics
    gtag('event', 'partner_click', {
        'event_category': 'monetization',
        'event_label': partner,
        'custom_parameter_1': eventId
    });
    
    // Local storage for reporting
    const clicks = JSON.parse(localStorage.getItem('partnerClicks') || '[]');
    clicks.push({
        partner: partner,
        eventId: eventId,
        timestamp: new Date().toISOString(),
        estimatedRevenue: revenue
    });
    localStorage.setItem('partnerClicks', JSON.stringify(clicks));
}
```

## 💰 POTENCJAŁ ZAROBKOWY

### Miesiąc 1-3 (budowanie)
- 5-10 partnerów lokalnych
- 50-100 kliknięć miesięcznie
- **Zarobek: 200-500 zł**

### Miesiąc 4-6 (wzrost)
- 20-30 partnerów
- 500-1000 konwersji
- **Zarobek: 1000-2500 zł**

### Miesiąc 7+ (optymalizacja)
- 50+ partnerów
- 2000+ konwersji
- **Zarobek: 3000-8000 zł**

## 📝 SZABLON UMOWY PARTNERSKIEJ

```
UMOWA PARTNERSKA EVENTFINDER

Strony:
1. EventFinder - [Twoje dane]
2. Partner - [dane restauracji/hotelu]

Warunki współpracy:
- Prowizja: X% od zamówień przez link EventFinder
- Płatność: co miesiąc, przelew na konto
- Tracking: kody UTM, pixel conversion
- Minimalny limit: 100 zł miesięcznie
- Wypowiedzenie: 30 dni na piśmie

Zobowiązania Partnera:
- Honoring tracking links
- Raportowanie miesięczne
- Promocje dla użytkowników EventFinder

Zobowiązania EventFinder:
- Jakościowy ruch
- Professional presentation
- Marketing support
```

## 🎯 PLAN DZIAŁANIA - PIERWSZY TYDZIEŃ

### Dzień 1-2: Aplikuj do Booking.com
1. Idź na partners.booking.com
2. Załóż konto affiliate
3. Dodaj EventFinder jako stronę

### Dzień 3-4: Kontakt z restauracjami
1. Przygotuj 1-2 slajdy o EventFinder
2. Zadzwoń do 10 restauracji w centrum Warszawy
3. Umów spotkania

### Dzień 5-7: Implementacja
1. Dodaj sekcję "Nearby Services" do eventów
2. Zintegruj Booking.com links
3. Testuj tracking

## 📈 KPI DO ŚLEDZENIA

- **CTR (Click-Through Rate)**: % użytkowników klika partner links
- **Conversion Rate**: % kliknięć kończy się zakupem
- **Average Order Value**: średnia wartość zamówienia
- **Monthly Recurring Revenue**: stały miesięczny przychód
- **Partner Satisfaction**: feedback score od partnerów

---

## 🚀 QUICK WINS (Można zrobić dziś!)

1. **Booking.com**: Aplikuj online (30 min)
2. **McDonald's**: Mail na marketing@mcdonalds.pl
3. **Uber**: Sprawdź uber.com/affiliate
4. **Local Pizza**: Zadzwoń do 3 pizzerii w centrum

**Cel na grudzień 2024: 1000 zł z partnerów! 💪**