/**
 * CryptoBLIK Advanced API Integration
 * Handles Bybit price fetching and PayU BLIK payments
 */

console.log('🚀 crypto-api.js loaded successfully');

class CryptoBLIKAPI {
    constructor() {
        this.config = {
            apiUrl: window.location.origin,
            updateInterval: 30000, // 30 seconds
            retryAttempts: 3,
            retryDelay: 1000 // 1 second
        };
        
        this.cryptoPrices = new Map();
        this.priceUpdateCallbacks = new Set();
        this.isUpdating = false;
        
        // Start automatic price updates
        this.startPriceUpdates();
        
        console.log('🌐 CryptoBLIK API initialized');
    }

    /**
     * Add callback for price updates
     */
    onPriceUpdate(callback) {
        this.priceUpdateCallbacks.add(callback);
    }

    /**
     * Remove price update callback
     */
    offPriceUpdate(callback) {
        this.priceUpdateCallbacks.delete(callback);
    }

    /**
     * Notify all callbacks about price updates
     */
    notifyPriceUpdate() {
        this.priceUpdateCallbacks.forEach(callback => {
            try {
                callback(this.cryptoPrices);
            } catch (error) {
                console.error('Error in price update callback:', error);
            }
        });
    }

    /**
     * Fetch crypto prices from backend API
     */
    async fetchCryptoPrices(symbols = null) {
        if (this.isUpdating) {
            return this.cryptoPrices;
        }

        this.isUpdating = true;

        try {
            const symbolsParam = symbols ? symbols.join(',') : '';
            const url = `/api/crypto/prices-batch${symbolsParam ? `?symbols=${symbolsParam}` : ''}`;
            
            const response = await fetch(url);
            const result = await response.json();

            if (result.success && result.data) {
                // Update internal prices map
                Object.entries(result.data).forEach(([symbol, priceData]) => {
                    this.cryptoPrices.set(symbol, priceData);
                });

                // Notify callbacks
                this.notifyPriceUpdate();

                console.log(`✅ Updated prices for ${Object.keys(result.data).length} cryptocurrencies`);
                return this.cryptoPrices;
            } else {
                throw new Error(result.message || 'Failed to fetch prices');
            }

        } catch (error) {
            console.error('❌ Error fetching crypto prices:', error);
            this.showError('Błąd podczas pobierania cen kryptowalut');
            return this.cryptoPrices;
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Get single crypto price
     */
    async getCryptoPrice(symbol) {
        try {
            const response = await fetch(`/api/market-price/${symbol}`);
            const result = await response.json();

            if (result.symbol && result.price) {
                const priceData = {
                    symbol: result.symbol,
                    price: result.price,
                    timestamp: Date.now()
                };

                this.cryptoPrices.set(symbol, priceData);
                return priceData;
            } else {
                throw new Error(result.message || 'Invalid price data');
            }

        } catch (error) {
            console.error(`❌ Error fetching price for ${symbol}:`, error);
            return null;
        }
    }

    /**
     * Start automatic price updates
     */
    startPriceUpdates() {
        // Initial fetch
        this.fetchCryptoPrices();

        // Set up interval
        setInterval(() => {
            this.fetchCryptoPrices();
        }, this.config.updateInterval);

        console.log(`🔄 Started automatic price updates every ${this.config.updateInterval / 1000} seconds`);
    }

    /**
     * Calculate crypto amount for PLN
     */
    calculateCryptoAmount(plnAmount, cryptoSymbol) {
        const priceData = this.cryptoPrices.get(cryptoSymbol);
        if (!priceData) {
            throw new Error(`Price not available for ${cryptoSymbol}`);
        }

        const plnToUsdRate = 4.2; // This should be fetched from a real API
        const usdAmount = plnAmount / plnToUsdRate;
        const cryptoAmount = usdAmount / priceData.price;
        const fee = plnAmount * 0.02; // 2% fee
        const totalPln = plnAmount + fee;

        return {
            plnAmount,
            usdAmount,
            cryptoAmount,
            cryptoPrice: priceData.price,
            fee,
            totalPln,
            feePercentage: 2
        };
    }

    /**
     * Create PayU BLIK order
     */
    async createPayUOrder(orderData) {
        try {
            this.showMessage('Tworzenie zamówienia...', 'processing');

            const response = await fetch('/api/payu/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: Math.round(orderData.totalAmount * 100), // Convert to grosze
                    currency: 'PLN',
                    description: `Zakup ${orderData.cryptoAmount.toFixed(8)} ${orderData.cryptoSymbol.replace('USDT', '')}`,
                    customerEmail: orderData.email,
                    customerPhone: orderData.phone,
                    cryptoSymbol: orderData.cryptoSymbol,
                    cryptoAmount: orderData.cryptoAmount,
                    walletAddress: orderData.walletAddress,
                    cryptoPrice: orderData.cryptoPrice
                })
            });

            const result = await response.json();

            if (result.success && result.data && result.data.redirectUri) {
                this.showMessage('Przekierowanie do PayU...', 'processing');
                
                // Store order details in localStorage for tracking
                localStorage.setItem('cryptoblik_last_order', JSON.stringify({
                    orderId: result.data.orderId,
                    sessionId: result.data.sessionId,
                    ...orderData,
                    timestamp: Date.now()
                }));

                // Redirect to PayU
                window.location.href = result.data.redirectUri;
                
                return result;
            } else {
                throw new Error(result.message || 'Błąd podczas tworzenia zamówienia');
            }

        } catch (error) {
            console.error('❌ PayU order creation error:', error);
            this.showError(`Błąd płatności: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate order data
     */
    validateOrderData(orderData) {
        const errors = [];

        // Validate crypto symbol
        if (!orderData.cryptoSymbol || !this.cryptoPrices.has(orderData.cryptoSymbol)) {
            errors.push('Wybierz prawidłową kryptowalutę');
        }

        // Validate PLN amount
        if (!orderData.plnAmount || orderData.plnAmount < 10) {
            errors.push('Minimalna kwota to 10 PLN');
        }

        // Validate wallet address
        if (!orderData.walletAddress || orderData.walletAddress.length < 10) {
            errors.push('Podaj prawidłowy adres portfela');
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!orderData.email || !emailRegex.test(orderData.email)) {
            errors.push('Podaj prawidłowy adres email');
        }

        // Validate phone
        const phoneRegex = /^(\+48|48)?[\s-]?[0-9]{3}[\s-]?[0-9]{3}[\s-]?[0-9]{3}$/;
        if (!orderData.phone || !phoneRegex.test(orderData.phone.replace(/\s/g, ''))) {
            errors.push('Podaj prawidłowy numer telefonu');
        }

        return errors;
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        const statusDiv = document.getElementById('statusMessage');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `status-message ${type}`;
            statusDiv.style.display = 'block';

            if (type !== 'processing') {
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 5000);
            }
        }

        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Format price for display
     */
    formatPrice(price, currency = 'USD') {
        if (typeof price !== 'number') return '--';
        
        if (currency === 'USD') {
            return `$${price.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 6 
            })}`;
        } else if (currency === 'PLN') {
            return `${price.toLocaleString('pl-PL', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })} PLN`;
        }
        
        return price.toLocaleString();
    }

    /**
     * Format percentage change
     */
    formatChange(change) {
        if (typeof change !== 'number') return '--';
        
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(2)}%`;
    }

    /**
     * Get last order from localStorage
     */
    getLastOrder() {
        try {
            const orderData = localStorage.getItem('cryptoblik_last_order');
            return orderData ? JSON.parse(orderData) : null;
        } catch (error) {
            console.error('Error getting last order:', error);
            return null;
        }
    }

    /**
     * Clear last order from localStorage
     */
    clearLastOrder() {
        localStorage.removeItem('cryptoblik_last_order');
    }

    /**
     * Check if we're returning from payment
     */
    checkPaymentReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment_status');
        
        if (paymentStatus === 'success') {
            this.showSuccess('Płatność zakończona pomyślnie! Kryptowaluty zostaną przesłane na Twój portfel.');
            this.clearLastOrder();
        } else if (paymentStatus === 'cancelled') {
            this.showError('Płatność została anulowana.');
        } else if (paymentStatus === 'error') {
            this.showError('Wystąpił błąd podczas płatności.');
        }
    }

    /**
     * Retry function with exponential backoff
     */
    async retry(func, attempts = this.config.retryAttempts) {
        for (let i = 0; i < attempts; i++) {
            try {
                return await func();
            } catch (error) {
                if (i === attempts - 1) {
                    throw error;
                }
                
                const delay = this.config.retryDelay * Math.pow(2, i);
                console.log(`Retry attempt ${i + 1}/${attempts} in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

// Create global instance
window.cryptoAPI = new CryptoBLIKAPI();

// Check payment return status on page load
document.addEventListener('DOMContentLoaded', () => {
    window.cryptoAPI.checkPaymentReturn();
});

console.log('🌟 CryptoBLIK API ready for use');