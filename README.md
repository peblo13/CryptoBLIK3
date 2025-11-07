# 🎭 EventFinder - Zaawansowana Wyszukiwarka Eventów

Nowoczesna aplikacja do wyszukiwania koncertów, teatrów, wydarzeń sportowych i innych eventów w Polsce z wykorzystaniem API Ticketmaster.

## 🌟 Funkcje

### 🔍 Zaawansowane Wyszukiwanie
- **Wyszukiwanie tekstowe** - słowa kluczowe, nazwy artystów, miejsca
- **Filtrowanie geograficzne** - miasto, promień wyszukiwania
- **Filtrowanie czasowe** - data, zakres dat
- **Kategorie** - muzyka, sport, teatr, film
- **Sortowanie** - data, cena, popularność, odległość, nazwa
- **Wyszukiwanie głosowe** - obsługa polskiego języka

### 🗺️ Interaktywna Mapa
- **Ciemny motyw** - elegancka mapa CartoDB Dark
- **Kolorowe markery** - różne kolory dla różnych kategorii
- **Szczegółowe popupy** - zdjęcia, ceny, linki do biletów
- **Automatyczne dopasowanie** - mapa dostosowuje się do wyników
- **Geolokalizacja** - pokazuje Twoją lokalizację
- **Obliczanie odległości** - dystans do eventów

### 🎨 Imponujący Design
- **Glassmorphism** - przezroczyste karty z efektem szkła
- **Gradienty** - piękne przejścia kolorów
- **Animacje** - płynne przejścia i efekty hover
- **Neon glow** - świecące elementy
- **Particle background** - animowane cząsteczki w tle
- **Responsywność** - działa na wszystkich urządzeniach

### 🚀 Zaawansowane Funkcje
- **Ulubione** - zapisywanie ulubionych eventów
- **Historia wyszukiwań** - zapamiętywanie ostatnich wyszukiwań
- **Udostępnianie** - łatwe dzielenie się eventami
- **Infinite scroll** - ładowanie kolejnych wyników
- **Oceny i opinie** - system gwiazdek
- **Cennik** - przejrzyste informacje o cenach

## 🛠️ Instalacja i Uruchomienie

### Wymagania
- Przeglądarka internetowa z obsługą ES6+
- Połączenie z internetem (dla API i map)
- Opcjonalnie: serwer HTTP dla pełnej funkcjonalności

### Uruchomienie lokalne

1. **Pobierz pliki:**
   ```bash
   # Wszystkie pliki powinny być w tym samym folderze:
   events-finder.html
   events-advanced.css
   events-advanced.js
   ```

2. **Uruchom serwer HTTP (zalecane):**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (jeśli masz zainstalowany)
   npx http-server
   ```

3. **Otwórz w przeglądarce:**
   ```
   http://localhost:8000/events-finder.html
   ```

4. **Lub otwórz bezpośrednio:**
   - Kliknij dwukrotnie na `events-finder.html`
   - (niektóre funkcje mogą być ograniczone z powodu CORS)

## 🔑 Konfiguracja API

### Klucze Ticketmaster
Aplikacja używa Twoich kluczy API Ticketmaster:

```javascript
const TICKETMASTER_API = {
    key: 'Da7rEZhADVCfrV7GW3AUvyDGedmmcmKG',
    secret: 'edo5we2P6KGNZnpM',
    baseUrl: 'https://app.ticketmaster.com/discovery/v2'
};
```

### Limity API
- **Public APIs**: 5000 zapytań dziennie
- **OAuth**: 100 zapytań na minutę
- Klucz ważny: bezterminowo

## 📱 Jak używać

### Podstawowe wyszukiwanie
1. Wpisz słowo kluczowe (np. "koncert", "Taco Hemingway")
2. Wybierz miasto (lub zostaw puste dla całej Polski)
3. Opcjonalnie wybierz datę
4. Kliknij "Szukaj" lub naciśnij Enter

### Zaawansowane funkcje
- **Wyszukiwanie głosowe**: Kliknij ikonę mikrofonu 🎤
- **Sortowanie**: Użyj dropdown "Sortuj według"
- **Filtry**: Zaznacz kategorie które Cię interesują
- **Mapa/Siatka**: Przełączaj widoki przyciskami na górze
- **Ulubione**: Kliknij serduszko na karcie eventu
- **Udostępnianie**: Kliknij przycisk "Udostępnij"

### Skróty klawiaturowe
- **Ctrl+K**: Fokus na pole wyszukiwania
- **Ctrl+F**: Przełącz widok mapy
- **Ctrl+R**: Odśwież/załaduj popularne eventy

## 🎯 Kategorie Eventów

### 🎵 Muzyka
- Koncerty
- Festiwale
- Kluby muzyczne
- Recitale

### ⚽ Sport
- Mecze piłkarskie
- Sporty zimowe
- Eventos deportivos
- Turnieje

### 🎭 Sztuka i Teatr
- Spektakle teatralne
- Opera
- Balet
- Sztuka współczesna

### 🎬 Film
- Premiery filmowe
- Festiwale filmowe
- Kino plenerowe

### 🎪 Inne
- Komedia stand-up
- Wydarzenia rodzinne
- Targi i wystawy
- Wydarzenia biznesowe

## 🔧 Dostosowywanie

### Zmiana kolorów
Edytuj zmienne CSS w `:root`:
```css
:root {
    --primary-purple: #6C5CE7;
    --primary-pink: #FD79A8;
    --primary-orange: #FF7675;
    --primary-blue: #74B9FF;
    /* ... */
}
```

### Dodanie nowych kategorii
W pliku `events-advanced.js` dodaj do `categoryColors`:
```javascript
const categoryColors = {
    'Music': '#6C5CE7',
    'Sports': '#74B9FF',
    'YourCategory': '#YourColor'
};
```

### Zmiana lokalizacji domyślnej
W funkcji `initMap()`:
```javascript
.setView([52.2297, 21.0122], 6); // [lat, lng], zoom
```

## 🐛 Rozwiązywanie problemów

### Eventy się nie ładują
1. Sprawdź połączenie z internetem
2. Sprawdź konsolę przeglądarki (F12)
3. Upewnij się, że klucz API jest poprawny
4. Sprawdź limity API (5000/dzień)

### Mapa nie działa
1. Sprawdź czy Leaflet.js się załadował
2. Sprawdź połączenie z internetem
3. Wyczyść cache przeglądarki

### Geolokalizacja nie działa
1. Sprawdź uprawnienia w przeglądarce
2. Upewnij się, że strona jest na HTTPS (dla geolokalizacji)
3. Spróbuj w innej przeglądarce

### Powolne ładowanie
1. Zmniejsz liczbę wyników (`size: 50` → `size: 20`)
2. Sprawdź prędkość internetu
3. Wyczyść cache przeglądarki

## 📊 Struktura plików

```
📁 EventFinder/
├── 📄 events-finder.html      # Główny plik HTML
├── 📄 events-advanced.css     # Zaawansowane style
├── 📄 events-advanced.js      # Logika aplikacji
├── 📄 README.md              # Ten plik
└── 📁 images/                # Opcjonalne obrazy
```

## 🔐 Bezpieczeństwo

- Klucze API są widoczne w kodzie źródłowym
- Dla aplikacji produkcyjnej, ukryj klucze na backendzie
- Używaj HTTPS dla geolokalizacji
- Regularnie sprawdzaj logi API

## 🚀 Możliwe rozszerzenia

### Backend API
- Serwer proxy dla ukrycia kluczy API
- Baza danych użytkowników i ulubionych
- System ocen i komentarzy
- Powiadomienia o nowych eventach

### Dodatkowe funkcje
- Synchronizacja z kalendarzem
- Kupowanie biletów w aplikacji
- Grupowe planowanie wydarzeń
- Integracja z mediami społecznościowymi

### Mobile App
- Aplikacja React Native
- Push notifications
- Offline caching
- AR dla lokalizacji eventów

## 📞 Wsparcie

Jeśli masz problemy lub pytania:

1. Sprawdź konsolę przeglądarki (F12)
2. Sprawdź ten README
3. Sprawdź dokumentację Ticketmaster API
4. Kontakt: [twój-email@example.com]

## 📄 Licencja

Ten projekt jest open-source. Możesz go używać, modyfikować i dystrybuować zgodnie z potrzebami.

---

**Miłego wyszukiwania eventów! 🎉**

*Utworzone z ❤️ przy użyciu najnowszych technologii webowych*