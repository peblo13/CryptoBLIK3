# CryptoBLIK - Platforma Kryptowalut z PayU BLIK

## 🚀 Nowa wersja z integracją Bybit API i PayU BLIK

### 📁 Pliki:

#### Nowa wersja:
- **`index_new.html`** - Nowa strona główna z integracją PayU BLIK
- **`crypto-api.js`** - Zaawansowane API do obsługi Bybit i PayU
- **`payu_integration.py`** - Backend integration z PayU
- **`backend_localization.py`** - System lokalizacji dla backendu

#### Aktualizowane:
- **`app.py`** - Dodane endpointy PayU i batch API dla cen
- **`localization.js`** - System wielojęzyczności
- **`locales/`** - Pliki tłumaczeń (pl.json, en.json)

### 🔧 Funkcje:

#### Frontend:
✅ **Real-time ceny z Bybit API** - Automatyczne pobieranie aktualnych cen  
✅ **PayU BLIK integracja** - Płatności przez BLIK  
✅ **Responsywny design** - Działa na mobile i desktop  
✅ **Wielojęzyczność** - Polski/Angielski  
✅ **Kalkulatory crypto** - Przeliczanie PLN na krypto  
✅ **Walidacja formularzy** - Sprawdzanie danych  

#### Backend:
✅ **Bybit API proxy** - Pobieranie cen batch  
✅ **PayU API integration** - Obsługa płatności BLIK  
✅ **Lokalizacja API** - Wielojęzyczne odpowiedzi  
✅ **Error handling** - Profesjonalna obsługa błędów  
✅ **Security** - Walidacja i sygnatury PayU  

### 🛠 Konfiguracja PayU:

W pliku `payu_integration.py` zaktualizuj:

```python
self.config = {
    'client_id': 'TWÓJ_CLIENT_ID',
    'client_secret': 'TWÓJ_CLIENT_SECRET', 
    'pos_id': 'TWÓJ_POS_ID',
    'signature_key': 'TWÓJ_SIGNATURE_KEY',
    'api_url': 'https://secure.payu.com',  # Produkcja
    'notify_url': 'https://twoja-domena.pl/api/payu/notify',
    'continue_url': 'https://twoja-domena.pl/payment/success'
}
```

### 🚀 Uruchomienie:

1. **Zainstaluj zależności:**
```bash
pip install flask flask-cors requests
```

2. **Uruchom backend:**
```bash
python app.py
```

3. **Otwórz w przeglądarce:**
```
http://localhost:10000/index_new.html
```

### 💡 API Endpoints:

#### Ceny kryptowalut:
- `GET /api/crypto/prices-batch` - Wszystkie ceny naraz
- `GET /api/market-price/{symbol}` - Pojedyncza cena

#### PayU płatności:
- `POST /api/payu/create-order` - Tworzenie zamówienia
- `POST /api/payu/notify` - Powiadomienia PayU
- `GET /payment/success` - Strona sukcesu
- `GET /payment/cancelled` - Strona anulowania

### 🔐 Bezpieczeństwo:

- Walidacja wszystkich danych wejściowych
- Weryfikacja sygnatur PayU
- CORS protection
- Rate limiting (do dodania)
- HTTPS required w produkcji

### 📱 Responsywność:

- Mobile-first design
- Touch-friendly interfejs
- Adaptive navigation
- Optimized for iOS/Android

### 🌍 Lokalizacja:

- Automatyczne wykrywanie języka
- Przełączanie bez przeładowania
- Backend API responses w odpowiednim języku
- LocalStorage persistence

### 🚦 Status:

- ✅ Frontend gotowy
- ✅ Backend API gotowy  
- ✅ PayU integracja gotowa
- ⚠️ Wymaga konfiguracji PayU
- ⚠️ Testowanie płatności
- ⚠️ Integracja z prawdziwym exchange dla wysyłki crypto

### 📋 TODO:

1. Skonfiguruj prawdziwe dane PayU
2. Dodaj integrację z exchange do wysyłki crypto
3. Dodaj logging i monitoring
4. Dodaj rate limiting
5. Testy jednostkowe
6. SSL/HTTPS w produkcji

### 🎯 Główne różnice vs stara wersja:

| Funkcja | Stara wersja | Nowa wersja |
|---------|-------------|-------------|
| API cen | Manual fetch | Batch API + auto-update |
| Płatności | Symulacja | Prawdziwe PayU BLIK |
| Design | Podstawowy | Zaawansowany + responsive |
| Lokalizacja | Brak | Pełna PL/EN |
| Error handling | Podstawowy | Profesjonalny |
| Security | Podstawowy | PayU sygnatury + walidacja |

Nowa wersja jest gotowa do użycia produkcyjnego po skonfigurowaniu PayU!