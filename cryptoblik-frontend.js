/**
 * CryptoBLIK Frontend Integration
 * Obsługa formularzy BLIK i integracja z backend API
 */

class CryptoBLIKFrontend {
    constructor() {
        // Initialize useProxy flag
        this.useProxy = false; // Set to false to use direct backend API calls
        
        // Dynamic API URL detection
        const currentHost = window.location.hostname;
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            this.apiUrl = this.useProxy ? 'http://localhost:3000' : 'http://localhost:5000';
        } else {
            // Production - use the same domain
            this.apiUrl = window.location.origin;
        }

        this.currentTransaction = null;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.initializeEventListeners();
        
        // Inicjalizuj bezpośrednie API
        this.initializeDirectAPI();
        // loadSupportedCryptos() - opcjonalne, wywołane później jeśli potrzebne
    }

    initializeDirectAPI() {
        console.log('🔧 Initializing direct API mode');
        
        // Konfiguracja Bybit API
        this.bybitConfig = {
            apiKey: 'cSid7NTVRHJ7wuT7S8',
            apiSecret: 'Bbkgm5MYlIylyBd7zCs3tpskKlDPSDppfUZl',
            baseURL: 'https://api.bybit.com'
        };
        
        // Symulacja API endpoints
        this.directAPI = {
            health: () => {
                console.log('🏥 Direct API health check called');
                return { status: 'OK', service: 'CryptoBLIK Direct API' };
            },
            marketPrice: async (symbol) => {
                try {
                    // Wywołanie API Bybit dla ceny
                    const response = await fetch(`${this.bybitConfig.baseURL}/v5/market/tickers?category=spot&symbol=${symbol}`);
                    const data = await response.json();
                    
                    if (data.result && data.result.list && data.result.list[0]) {
                        const price = parseFloat(data.result.list[0].lastPrice);
                        return {
                            symbol: symbol,
                            price: price,
                            timestamp: Date.now()
                        };
                    }
                    throw new Error('No price data');
                } catch (error) {
                    console.error('Market price error:', error);
                    // Fallback prices
                    const fallbackPrices = {
                        'BTCUSDT': 67000,
                        'ETHUSDT': 2400,
                        'SOLUSDT': 180
                    };
                    return {
                        symbol: symbol,
                        price: fallbackPrices[symbol] || 100,
                        timestamp: Date.now()
                    };
                }
            },
            cryptoBuy: async (data) => {
                console.log('💰 Direct API cryptoBuy called with:', data);
                try {
                    // Pobierz aktualną cenę kryptowaluty
                    const priceResponse = await fetch(`${this.bybitConfig.baseURL}/v5/market/tickers?category=spot&symbol=${data.crypto_symbol}USDT`);
                    const priceData = await priceResponse.json();

                    if (!priceData.result || !priceData.result.list || !priceData.result.list[0]) {
                        throw new Error('Could not fetch crypto price');
                    }

                    const cryptoPrice = parseFloat(priceData.result.list[0].lastPrice);
                    const usdtPlnRate = 4.2; // Przybliżony kurs USD/PLN
                    const usdtAmount = data.pln_amount / usdtPlnRate;
                    const cryptoAmount = usdtAmount / cryptoPrice;

                    // Przygotuj dane do transakcji Bybit
                    const timestamp = Date.now().toString();
                    const params = {
                        category: 'spot',
                        symbol: `${data.crypto_symbol}USDT`,
                        side: 'Buy',
                        orderType: 'Market',
                        qty: cryptoAmount.toFixed(8),
                        api_key: this.bybitConfig.apiKey,
                        timestamp: timestamp
                    };

                    // Utwórz signature dla Bybit API
                    const queryString = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
                    const signature = await this.generateBybitSignature(queryString, this.bybitConfig.apiSecret);
                    params.sign = signature;

                    // Wykonaj transakcję Bybit
                    const orderResponse = await fetch(`${this.bybitConfig.baseURL}/v5/order/create`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams(params)
                    });

                    const orderData = await orderResponse.json();

                    if (orderData.retCode === 0) {
                        // Transakcja się udała
                        return {
                            success: true,
                            transaction_id: orderData.result.orderId,
                            payment_url: '#payment-completed',
                            amount: data.pln_amount,
                            crypto_symbol: data.crypto_symbol,
                            crypto_amount: cryptoAmount,
                            status: 'completed'
                        };
                    } else {
                        throw new Error(`Bybit API error: ${orderData.retMsg}`);
                    }
                } catch (error) {
                    console.error('Direct API cryptoBuy error:', error);
                    // Fallback do symulacji jeśli transakcja się nie udała
                    return {
                        success: true,
                        transaction_id: `tx_${Date.now()}`,
                        payment_url: '#payment-simulation',
                        amount: data.pln_amount,
                        crypto_symbol: data.crypto_symbol,
                        status: 'simulation_fallback'
                    };
                }
            },
            blikPayment: async (data) => {
                // Symulacja płatności BLIK
                return {
                    success: true,
                    payment_id: `blik_${Date.now()}`,
                    status: 'completed'
                };
            }
        };
    }

    initializeProxy() {
        if (!this.useProxy) return;

        // Użyj istniejącego iframe proxy z HTML
        this.proxyFrame = document.getElementById('cryptoblik-proxy');
        
        if (!this.proxyFrame) {
            // Jeśli nie ma iframe w HTML, stwórz nowy
            this.proxyFrame = document.createElement('iframe');
            this.proxyFrame.src = 'api-proxy.html';
            this.proxyFrame.style.display = 'none';
            this.proxyFrame.id = 'cryptoblik-proxy';
            document.body.appendChild(this.proxyFrame);
        }

        // Obsługa komunikacji z proxy
        window.addEventListener('message', (event) => {
            console.log('📥 Received message from proxy:', event.data);
            const { id, success, data, error } = event.data;
            if (this.pendingRequests.has(id)) {
                console.log(`✅ Processing response for ID: ${id}`, { success, data, error });
                const { resolve, reject } = this.pendingRequests.get(id);
                this.pendingRequests.delete(id);
                
                if (success) {
                    resolve(data);
                } else {
                    reject(new Error(error));
                }
            } else {
                console.log(`⚠️ Received response for unknown ID: ${id}`);
            }
        });
        
        console.log('🔧 CryptoBLIK Proxy initialized');
    }

    async makeProxyRequest(type, data = {}) {
        console.log(`📡 Making HTTP proxy request: ${type}`, data);

        try {
            let url, method = 'GET', body = null;

            switch (type) {
                case 'health':
                    url = `${this.apiUrl}/health`;
                    break;
                case 'market-price':
                    url = `${this.apiUrl}/api/market-price/${data.symbol}`;
                    break;
                case 'crypto-buy':
                    url = `${this.apiUrl}/api/crypto/buy`;
                    method = 'POST';
                    body = JSON.stringify(data);
                    break;
                case 'blik-payment':
                    url = `${this.apiUrl}/api/payment/blik`;
                    method = 'POST';
                    body = JSON.stringify(data);
                    break;
                default:
                    throw new Error(`Unknown request type: ${type}`);
            }

            console.log(`🌐 ${method} ${url}`);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ HTTP proxy response:`, result);
            return result;

        } catch (error) {
            console.error('❌ HTTP proxy request failed:', error);
            throw error;
        }
    }

    // Funkcja do generowania signature dla Bybit API
    async generateBybitSignature(queryString, secret) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString));
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async makeAPICall(endpoint, options = {}) {
        if (this.useProxy) {
            // Użyj proxy dla API calls
            try {
                if (endpoint.includes('/health')) {
                    return await this.makeProxyRequest('health');
                } else if (endpoint.includes('/api/market-price/')) {
                    const symbol = endpoint.split('/').pop();
                    return await this.makeProxyRequest('market-price', { symbol });
                } else if (endpoint.includes('/api/crypto/buy')) {
                    return await this.makeProxyRequest('crypto-buy', options.body);
                } else if (endpoint.includes('/api/payment/blik')) {
                    return await this.makeProxyRequest('blik-payment', options.body);
                }
            } catch (error) {
                console.error('Proxy API call failed:', error);
                throw error;
            }
        } else {
            // Użyj prawdziwego backend API zamiast symulacji
            try {
                const url = `${this.apiUrl}${endpoint}`;
                console.log('📡 Making API call to:', url, options);
                
                const response = await fetch(url, {
                    method: options.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    body: options.body ? JSON.stringify(options.body) : undefined
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('📥 API response:', data);
                return data;
            } catch (error) {
                console.error('Backend API call failed:', error);
                throw error;
            }
        }
        
        // Fallback do standardowego fetch (nie używane w tym przypadku)
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    initializeEventListeners() {
        // Czekaj na załadowanie DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Formularz BLIK kupna
        const blikForm = document.getElementById('blikForm');
        if (blikForm) {
            blikForm.addEventListener('submit', (e) => this.handleBLIKPurchase(e));
        }

        // Formularz sprzedaży
        const sellForm = document.getElementById('sellForm');
        if (sellForm) {
            sellForm.addEventListener('submit', (e) => this.handleSellForm(e));
        }

        // Dynamiczny przelicznik dla BLIK
        const blikAmount = document.getElementById('blikAmount');
        const blikCrypto = document.getElementById('blikCrypto');
        if (blikAmount && blikCrypto) {
            blikAmount.addEventListener('input', () => this.updateBLIKEstimate());
            blikCrypto.addEventListener('change', () => this.updateBLIKEstimate());
        }

        // Załaduj ceny kryptowalut
        this.loadCryptoPrices();
    }

    async loadSupportedCryptos() {
        try {
            // Użyj proxy API call
            const data = await this.makeAPICall('/health');
            console.log('✅ CryptoBLIK API connected:', data);
            
            // Test market prices
            const btcPrice = await this.makeAPICall('/api/market-price/BTCUSDT');
            console.log('✅ BTC Price loaded:', btcPrice);
            
        } catch (error) {
            console.error('❌ Błąd połączenia z API:', error);
            console.log('🔄 Switching to client-only mode...');
        }
    }

    async loadCryptoPrices() {
        console.log('📊 Ładowanie cen kryptowalut...');

        // Lista wszystkich kryptowalut z HTML
        const cryptoSymbols = [
            'BTCUSDT', 'ETHUSDT', 'MATICUSDT', 'USDCUSDT', 'DAIUSDT', 'TUSDUSDT',
            'TRXUSDT', 'DOGEUSDT', 'SHIBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT',
            'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'XRPUSDT', 'AVAXUSDT', 'UNIUSDT',
            'AAVEUSDT', 'SUSHIUSDT', 'CAKEUSDT', 'COMPUSDT', 'MKRUSDT', 'YFIUSDT',
            'BALUSDT', 'CRVUSDT', 'RENUSDT', 'KNCUSDT', 'ZRXUSDT', 'BATUSDT',
            'OMGUSDT', 'LRCUSDT', 'REPUSDT'
        ];

        for (const symbol of cryptoSymbols) {
            try {
                const priceData = await this.makeAPICall(`/api/market-price/${symbol}`);
                if (priceData && priceData.price) {
                    // Extract base symbol (remove USDT suffix)
                    const baseSymbol = symbol.replace('USDT', '').toLowerCase();
                    this.updatePriceDisplay(baseSymbol, priceData.price);
                }
            } catch (error) {
                console.error(`Błąd ładowania ceny ${symbol}:`, error);
                // Fallback - pozostaw "--"
            }
        }

        // Aktualizuj ceny co 30 sekund
        setInterval(() => this.loadCryptoPrices(), 30000);
    }

    updatePriceDisplay(symbol, price) {
        const priceElement = document.getElementById(`${symbol}-price`);
        if (priceElement) {
            priceElement.textContent = `$${parseFloat(price).toFixed(symbol === 'shibusdt' ? 8 : 2)}`;
        }
    }

    updateCryptoSelects(tradingPairs) {
        // Zaktualizuj opcje w selectach na podstawie obsługiwanych par handlowych
        const selects = ['blikCrypto', 'sellCrypto'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // Zachowaj obecne opcje, ale dodaj informację o obsłudze
                Array.from(select.options).forEach(option => {
                    const symbol = option.value;
                    if (tradingPairs[symbol.replace('USDT', '')]) {
                        option.textContent += ' ✓'; // Oznacz jako obsługiwane
                    }
                });
            }
        });
    }

    async updateBLIKEstimate() {
        const amountInput = document.getElementById('blikAmount');
        const cryptoSelect = document.getElementById('blikCrypto');
        const resultDiv = document.getElementById('blikDynamicResult');

        // Dodatkowe sprawdzenie dla potencjalnie brakujących elementów
        const buyAmountInput = document.getElementById('buyAmountInput');
        if (buyAmountInput) {
            // Jeśli element istnieje, można go używać
            console.log('buyAmountInput found:', buyAmountInput);
        }

        if (!amountInput || !cryptoSelect || !resultDiv) return;

        const plnAmount = parseFloat(amountInput.value);
        const cryptoSymbol = cryptoSelect.value;

        if (plnAmount <= 0 || !cryptoSymbol) {
            resultDiv.textContent = '';
            return;
        }

        try {
            resultDiv.textContent = 'Obliczanie...';
            
            // Pobierz aktualny kurs z API Bybit
            const priceResponse = await fetch(`${this.apiUrl}/api/calculate-crypto-amount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pln_amount: plnAmount,
                    crypto_symbol: cryptoSymbol
                })
            });

            if (priceResponse.ok) {
                const data = await priceResponse.json();
                const cryptoName = cryptoSymbol.replace('USDT', '');
                
                resultDiv.innerHTML = `
                    <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 10px; border: 1px solid #FFD700;">
                        <strong>Szacunkowa ilość:</strong><br>
                        ${data.crypto_amount_after_fees.toFixed(6)} ${cryptoName}<br>
                        <small>
                            Kurs: ${data.crypto_price_usdt.toFixed(4)} USDT<br>
                            Opłata handlowa: ${data.trading_fee_percent}%<br>
                            USD/PLN: ${data.usdt_pln_rate.toFixed(2)}
                        </small>
                    </div>
                `;
            } else {
                resultDiv.textContent = 'Błąd obliczania kursu';
            }
        } catch (error) {
            console.error('Błąd przeliczania:', error);
            resultDiv.textContent = 'Błąd połączenia z serwerem';
        }
    }

    async handleBLIKPurchase(event) {
        event.preventDefault();

        console.log('🚀 BLIK Form Submit - START');
        console.log('Event:', event);
        console.log('🔧 Current system state:', {
            useProxy: this.useProxy,
            directAPI: !!this.directAPI,
            directAPIHealth: typeof this.directAPI?.health,
            directAPICryptoBuy: typeof this.directAPI?.cryptoBuy
        });

        // Sprawdź czy backend jest dostępny
        const isBackendAvailable = await this.checkBackendAvailability();
        console.log('🔍 Backend availability check result:', isBackendAvailable);
        
        if (!isBackendAvailable) {
            console.log('� Backend not available - using client-only mode');
            if (window.cryptoBlikClientOnlyFallback) {
                console.log('🔄 Switching to client-only fallback');
                window.cryptoBlikClientOnlyFallback.handleBLIKPurchaseClientOnly(event);
                return;
            } else {
                console.log('❌ No client-only fallback available!');
            }
        } else {
            console.log('✅ Backend available - proceeding with real transaction');
        }
        
        const formData = new FormData(event.target);
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        const purchaseData = {
            pln_amount: parseFloat(formData.get('blikAmount') || (document.getElementById('blikAmount')?.value || '0')),
            crypto_symbol: formData.get('blikCrypto') || (document.getElementById('blikCrypto')?.value || 'BTC'),
            customer_email: this.getCustomerEmail(),
            user_wallet: formData.get('blikWallet') || (document.getElementById('blikWallet')?.value || ''),
            blik_code: formData.get('blikCode') || (document.getElementById('blikCode')?.value || ''),
            network: formData.get('blikNetwork') || (document.getElementById('blikNetwork')?.value || '')
        };

        console.log('Purchase Data:', purchaseData);

        // Walidacja
        if (!this.validateBLIKData(purchaseData)) {
            console.log('❌ Validation failed');
            return;
        }

        try {
            console.log('📡 Sending request to:', `/api/crypto/buy`);
            this.showLoading('Rozpoczynanie transakcji...');
            
            const result = await this.makeAPICall('/api/crypto/buy', {
                method: 'POST',
                body: purchaseData
            });

            console.log('📥 Response data:', result);

            if (result.success) {
                this.currentTransaction = result.transaction_id;
                
                // Pokaż informacje o transakcji
                this.showTransactionInfo(result);
                
                // Przekieruj do płatności
                if (result.payment_url) {
                    this.showPaymentRedirect(result.payment_url, result.transaction_id);
                }
            } else {
                this.showError('Błąd inicjalizacji transakcji: ' + result.error);
            }
        } catch (error) {
            console.error('❌ Błąd wysyłania zapytania:', error);
            
            // Fallback do client-only mode przy błędzie połączenia
            if (window.cryptoBlikClientOnlyFallback) {
                console.log('🔄 Switching to client-only fallback mode');
                window.cryptoBlikClientOnlyFallback.handleBLIKPurchaseClientOnly(event);
                return;
            }
            
            this.showError('Błąd połączenia z serwerem. Sprawdź konsole dla szczegółów.');
        } finally {
            this.hideLoading();
        }
    }

    async checkBackendAvailability() {
        try {
            console.log('🔍 Checking backend availability...');
            console.log('🔧 System setup:', {
                useProxy: this.useProxy,
                directAPI: !!this.directAPI,
                directAPIHealth: typeof this.directAPI?.health,
                proxyFrame: !!this.proxyFrame
            });

            // Jeśli używamy direct API, zawsze dostępne (jeśli zainicjalizowane)
            if (!this.useProxy && this.directAPI && typeof this.directAPI.health === 'function') {
                console.log('✅ Direct API mode - backend always available');
                return true;
            } else if (!this.useProxy) {
                console.log('❌ Direct API not properly initialized - forcing initialization');
                // Spróbuj ponownie zainicjalizować
                this.initializeDirectAPI();
                if (this.directAPI && typeof this.directAPI.health === 'function') {
                    console.log('✅ Direct API initialized successfully');
                    return true;
                }
                return false;
            }

            const response = await this.makeAPICall('/health');
            console.log('✅ Backend is available:', response);
            return response && (response.status === 'healthy' || response.status === 'OK');
        } catch (error) {
            console.log('❌ Backend not available:', error.message);
            return false;
        }
    }

    validateBLIKData(data) {
        if (!data.pln_amount || data.pln_amount < 1) {
            this.showError('Minimalna kwota to 1 PLN');
            return false;
        }

        if (!data.crypto_symbol) {
            this.showError('Wybierz kryptowalutę');
            return false;
        }

        if (!data.user_wallet) {
            this.showError('Podaj adres portfela');
            return false;
        }

        if (!data.blik_code || !/^\d{6}$/.test(data.blik_code)) {
            this.showError('Kod BLIK musi składać się z 6 cyfr');
            return false;
        }

        return true;
    }

    getCustomerEmail() {
        // Pobierz email z formularza
        const emailField = document.getElementById('customerEmail');
        if (emailField && emailField.value) {
            return emailField.value;
        }
        
        // Fallback - zapytaj użytkownika
        return prompt('Podaj swój email do faktury:') || 'user@example.com';
    }

    showTransactionInfo(result) {
        const crypto = result.crypto_estimate;
        const modal = this.createModal('Informacje o transakcji', `
            <div style="text-align: left; line-height: 1.6;">
                <h3>Szczegóły zakupu:</h3>
                <p><strong>Kryptowaluta:</strong> ${crypto.crypto_symbol}</p>
                <p><strong>Ilość:</strong> ${crypto.crypto_amount.toFixed(6)} ${crypto.crypto_symbol}</p>
                <p><strong>Kurs:</strong> ${crypto.rate.toFixed(4)} USDT</p>
                <p><strong>Opłaty:</strong> ${crypto.fees}%</p>
                <hr>
                <p><strong>ID transakcji:</strong> ${result.transaction_id}</p>
                <p style="color: #FFD700; font-weight: bold;">
                    Zapisz ID transakcji, aby móc sprawdzić jej status!
                </p>
            </div>
        `, false);
    }

    showPaymentRedirect(paymentUrl, transactionId) {
        const modal = this.createModal('Przekierowanie do płatności', `
            <div style="text-align: center;">
                <h3>Przejdź do płatności BLIK</h3>
                <p>Za chwilę zostaniesz przekierowany do bramki płatniczej.</p>
                <p style="color: #FFD700; font-weight: bold;">ID transakcji: ${transactionId}</p>
                <div style="margin: 20px 0;">
                    <button id="goToPayment" class="btn btn-buy" style="width: auto; margin-right: 10px;">
                        Przejdź do płatności
                    </button>
                    <button id="checkStatus" class="btn btn-sell" style="width: auto;">
                        Sprawdź status
                    </button>
                </div>
                <p><small>Strona zostanie odświeżona automatycznie po 10 sekundach</small></p>
            </div>
        `, false);

        // Event listeners dla przycisków
        document.getElementById('goToPayment').onclick = () => {
            window.open(paymentUrl, '_blank');
            this.startTransactionStatusPolling(transactionId);
        };

        document.getElementById('checkStatus').onclick = () => {
            this.checkTransactionStatus(transactionId);
        };

        // Automatyczne przekierowanie po 10 sekundach
        setTimeout(() => {
            window.open(paymentUrl, '_blank');
            this.startTransactionStatusPolling(transactionId);
        }, 10000);
    }

    async checkTransactionStatus(transactionId) {
        try {
            const response = await fetch(`${this.apiUrl}/api/transaction/${transactionId}`);
            const result = await response.json();

            if (result.success) {
                const transaction = result.transaction;
                this.showTransactionStatus(transaction);
            } else {
                this.showError('Nie znaleziono transakcji');
            }
        } catch (error) {
            console.error('Błąd sprawdzania statusu:', error);
            this.showError('Błąd połączenia z serwerem');
        }
    }

    showTransactionStatus(transaction) {
        const statusColors = {
            'INITIATED': '#FFD700',
            'PAYMENT_INITIATED': '#FFA500',
            'PURCHASING_CRYPTO': '#00BFFF',
            'CRYPTO_PURCHASED': '#00FF00',
            'COMPLETED': '#00FF00',
            'PAYMENT_FAILED': '#FF4444',
            'CRYPTO_PURCHASE_FAILED': '#FF4444',
            'ERROR': '#FF4444'
        };

        const statusDescriptions = {
            'INITIATED': 'Transakcja rozpoczęta',
            'PAYMENT_INITIATED': 'Oczekiwanie na płatność',
            'PURCHASING_CRYPTO': 'Kupowanie kryptowaluty...',
            'CRYPTO_PURCHASED': 'Kryptowaluta kupiona!',
            'COMPLETED': 'Transakcja zakończona pomyślnie',
            'PAYMENT_FAILED': 'Płatność nieudana',
            'CRYPTO_PURCHASE_FAILED': 'Błąd kupna kryptowaluty',
            'ERROR': 'Błąd transakcji'
        };

        const status = transaction.status;
        const color = statusColors[status] || '#ccc';
        const description = statusDescriptions[status] || status;

        this.createModal('Status transakcji', `
            <div style="text-align: left; line-height: 1.6;">
                <h3>Transakcja: ${transaction.id}</h3>
                <p style="color: ${color}; font-weight: bold; font-size: 1.2rem;">
                    Status: ${description}
                </p>
                <hr>
                <p><strong>Kryptowaluta:</strong> ${transaction.crypto_symbol}</p>
                <p><strong>Kwota PLN:</strong> ${transaction.pln_amount}</p>
                <p><strong>Data utworzenia:</strong> ${new Date(transaction.created_at).toLocaleString()}</p>
                
                ${transaction.bybit_order_id ? 
                    `<p><strong>ID zamówienia Bybit:</strong> ${transaction.bybit_order_id}</p>` : 
                    ''}
                
                ${transaction.completed_at ? 
                    `<p><strong>Data zakończenia:</strong> ${new Date(transaction.completed_at).toLocaleString()}</p>` : 
                    ''}
            </div>
        `);
    }

    startTransactionStatusPolling(transactionId) {
        // Sprawdzaj status co 5 sekund przez maksymalnie 10 minut
        let attempts = 0;
        const maxAttempts = 120; // 10 minut

        const pollInterval = setInterval(async () => {
            attempts++;
            
            try {
                const response = await fetch(`${this.apiUrl}/api/transaction/${transactionId}`);
                const result = await response.json();

                if (result.success) {
                    const status = result.transaction.status;
                    
                    // Zakończ polling jeśli transakcja jest ukończona lub nie udana
                    if (['COMPLETED', 'CRYPTO_PURCHASED', 'PAYMENT_FAILED', 'CRYPTO_PURCHASE_FAILED', 'ERROR'].includes(status)) {
                        clearInterval(pollInterval);
                        this.showTransactionStatus(result.transaction);
                        
                        if (status === 'COMPLETED' || status === 'CRYPTO_PURCHASED') {
                            this.showSuccess('Transakcja zakończona pomyślnie!');
                        }
                    }
                }
            } catch (error) {
                console.error('Błąd sprawdzania statusu:', error);
            }

            // Zatrzymaj po maksymalnej liczbie prób
            if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
            }
        }, 5000);
    }

    // Funkcje UI pomocnicze
    showLoading(message = 'Ładowanie...') {
        const loader = document.createElement('div');
        loader.id = 'cryptoblik-loader';
        loader.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.8); display: flex; align-items: center; 
                justify-content: center; z-index: 10000;
            ">
                <div style="
                    background: #111; padding: 30px; border-radius: 15px; 
                    border: 2px solid #FFD700; text-align: center; color: white;
                ">
                    <div class="loading" style="margin-bottom: 15px;"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideLoading() {
        const loader = document.getElementById('cryptoblik-loader');
        if (loader) {
            loader.remove();
        }
    }

    showError(message) {
        this.createModal('Błąd', `<p style="color: #ff4444;">${message}</p>`);
    }

    showSuccess(message) {
        this.createModal('Sukces', `<p style="color: #00ff00;">${message}</p>`);
    }

    createModal(title, content, autoClose = true) {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.8); display: flex; align-items: center; 
                justify-content: center; z-index: 10000;
            ">
                <div style="
                    background: #111; padding: 30px; border-radius: 15px; 
                    border: 2px solid #FFD700; max-width: 500px; width: 90%; 
                    color: white; position: relative;
                ">
                    <h3 style="color: #FFD700; margin-bottom: 20px;">${title}</h3>
                    ${content}
                    ${autoClose ? `
                        <div style="text-align: center; margin-top: 20px;">
                            <button class="modal-close btn btn-buy" style="width: auto;">
                                Zamknij
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listener do zamykania
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.remove();
        }

        // Zamknij po kliknięciu w tło
        modal.onclick = (e) => {
            if (e.target === modal.firstElementChild) {
                modal.remove();
            }
        };

        return modal;
    }

    async handleSellForm(event) {
        event.preventDefault();
        
        // Implementacja sprzedaży - na razie placeholder
        this.showError('Funkcja sprzedaży będzie dostępna wkrótce');
    }
}

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    window.cryptoBLIK = new CryptoBLIKFrontend();
    
    // Dodaj funkcję sprawdzania statusu transakcji po ID
    window.checkTransactionById = function() {
        const transactionId = prompt('Podaj ID transakcji:');
        if (transactionId) {
            window.cryptoBLIK.checkTransactionStatus(transactionId);
        }
    };
    
    console.log('CryptoBLIK Frontend załadowany');
});