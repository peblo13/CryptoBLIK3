#!/usr/bin/env python3
"""
CryptoBLIK Production App
Unified backend dla https://cryptoblik.pl z integracją PayU BLIK
"""

import os
import requests
import json
import hashlib
import hmac
import time
import asyncio
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS

# Import konfiguracji
from config import get_api_credentials, BYBIT_BASE_URL, SUPPORTED_CRYPTOS
from backend_localization import backend_i18n
from payu_integration import payu_integration

def create_app():
    """Stwórz unified Flask app dla produkcji"""
    app = Flask(__name__, static_folder='.')
    
    # CORS dla https://cryptoblik.pl i innych
    CORS(app, methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {"status": "OK", "message": "CryptoBLIK Production API", "version": "1.0.0"}
    
    @app.route('/')
    def root():
        try:
            with open('index.html', 'r', encoding='utf-8') as f:
                return f.read(), 200, {'Content-Type': 'text/html'}
        except FileNotFoundError:
            return {"endpoints": {
                "blik_payment": "/api/payment/blik",
                "bybit_prices": "/api/market-price/<symbol>",
                "crypto_buy": "/api/crypto/buy",
                "health": "/health"
            }, "message": "CryptoBLIK Production API", "version": "1.0.0"}
    
    # Bybit API functions
    def generate_signature(params, secret):
        """Generate signature for Bybit API requests"""
        query_string = '&'.join([f"{k}={v}" for k, v in sorted(params.items())])
        return hmac.new(secret.encode('utf-8'), query_string.encode('utf-8'), hashlib.sha256).hexdigest()

    @app.route('/api/market-price/<symbol>')
    def market_price(symbol):
        """Get crypto price from Bybit"""
        try:
            url = f'{BYBIT_BASE_URL}/v5/market/tickers'
            params = {
                'category': 'spot',
                'symbol': symbol
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data.get('retCode') == 0 and data.get('result'):
                ticker = data['result']['list'][0]
                return jsonify({
                    'symbol': symbol,
                    'price': float(ticker.get('lastPrice', 0)),
                    'bid': float(ticker.get('bid1Price', 0)),
                    'ask': float(ticker.get('ask1Price', 0)),
                    'volume24h': float(ticker.get('volume24h', 0))
                })
            else:
                return jsonify(backend_i18n.error_response('invalid_crypto')), 404
                
        except Exception as e:
            return jsonify(backend_i18n.error_response('api_error', details=str(e))), 500

    @app.route('/api/calculate-crypto-amount', methods=['POST', 'OPTIONS'])
    def calculate_crypto_amount():
        """Calculate crypto amount for PLN input"""
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            data = request.get_json()
            pln_amount = float(data.get('pln_amount', 0))
            crypto_symbol = data.get('crypto_symbol', 'BTCUSDT')
            
            if pln_amount <= 0:
                return jsonify(backend_i18n.error_response('invalid_amount'))
            
            # Get USD/PLN rate (using USDC/USDT as approximation)
            usd_pln_response = requests.get(f'{BYBIT_BASE_URL}/v5/market/tickers?category=spot&symbol=USDCUSDT', timeout=10)
            usd_pln_data = usd_pln_response.json()
            usd_pln_rate = 4.0  # default
            if usd_pln_data.get('retCode') == 0 and usd_pln_data.get('result'):
                usd_pln_rate = float(usd_pln_data['result']['list'][0].get('lastPrice', 4.0))
            
            # Get crypto price
            crypto_response = requests.get(f'{BYBIT_BASE_URL}/v5/market/tickers?category=spot&symbol={crypto_symbol}', timeout=10)
            crypto_data = crypto_response.json()
            crypto_price_usd = 1.0  # default
            if crypto_data.get('retCode') == 0 and crypto_data.get('result'):
                crypto_price_usd = float(crypto_data['result']['list'][0].get('lastPrice', 1.0))
            
            usd_amount = pln_amount / usd_pln_rate
            crypto_amount = usd_amount / crypto_price_usd
            
            return jsonify(backend_i18n.success_response(
                message_key='price_updated',
                data={
                    'pln_amount': pln_amount,
                    'usd_amount': usd_amount,
                    'crypto_amount': crypto_amount,
                    'crypto_symbol': crypto_symbol,
                    'usd_pln_rate': usd_pln_rate,
                    'crypto_price_usd': crypto_price_usd
                }
            ))
            
        except ValueError:
            return jsonify(backend_i18n.error_response('invalid_amount'))
        except Exception as e:
            return jsonify(backend_i18n.error_response('api_error', details=str(e)))

    @app.route('/api/crypto/buy', methods=['POST'])
    def crypto_buy():
        """Handle crypto purchase with BLIK"""
        try:
            data = request.get_json()
            # Validacja danych
            required_fields = ['amount', 'crypto', 'wallet', 'blik_code', 'email']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'Missing field: {field}'}), 400

            # Parametry wejściowe
            amount_pln = float(data['amount'])
            crypto_symbol = data['crypto']
            wallet = data['wallet']
            email = data['email']
            # Prowizja 5%
            fee_percent = 0.05
            fee_pln = round(amount_pln * fee_percent, 2)
            amount_for_crypto = round(amount_pln - fee_pln, 2)

            # Pobierz kurs krypto (USDT/PLN i krypto/USDT)
            # Założenie: PLN->USDT->krypto
            try:
                # 1. Pobierz kurs USDT/PLN (odwrotność PLN/USDT)
                url_usdt = f'{BYBIT_BASE_URL}/v5/market/tickers'
                params_usdt = {'category': 'spot', 'symbol': 'USDTPLN'}
                r_usdt = requests.get(url_usdt, params=params_usdt, timeout=10)
                d_usdt = r_usdt.json()
                if d_usdt.get('retCode') == 0 and d_usdt.get('result'):
                    usdt_pln = float(d_usdt['result']['list'][0]['lastPrice'])
                else:
                    return jsonify({'error': 'Brak kursu USDT/PLN'}), 400
                # 2. Pobierz kurs krypto/USDT
                params_crypto = {'category': 'spot', 'symbol': f'{crypto_symbol}USDT'}
                r_crypto = requests.get(url_usdt, params=params_crypto, timeout=10)
                d_crypto = r_crypto.json()
                if d_crypto.get('retCode') == 0 and d_crypto.get('result'):
                    crypto_usdt = float(d_crypto['result']['list'][0]['lastPrice'])
                else:
                    return jsonify({'error': f'Brak kursu {crypto_symbol}/USDT'}), 400
            except Exception as e:
                return jsonify({'error': f'Błąd pobierania kursów: {str(e)}'}), 500

            # Oblicz ile USDT i krypto kupić
            usdt_amount = round(amount_for_crypto / usdt_pln, 6)
            crypto_amount = round(usdt_amount / crypto_usdt, 8)

            # Zakup krypto na Bybit (market order)
            api_key, api_secret = get_api_credentials()
            bybit_order_url = f'{BYBIT_BASE_URL}/v5/order/create'
            timestamp = int(time.time() * 1000)
            order_params = {
                'category': 'spot',
                'symbol': f'{crypto_symbol}USDT',
                'side': 'Buy',
                'orderType': 'Market',
                'qty': str(crypto_amount),
                'timestamp': str(timestamp),
                'api_key': api_key
            }
            # Podpisz zapytanie
            sign = generate_signature(order_params, api_secret)
            order_params['sign'] = sign
            # Wyślij zapytanie
            try:
                order_resp = requests.post(bybit_order_url, data=order_params, timeout=10)
                order_data = order_resp.json()
                if order_data.get('retCode') != 0:
                    return jsonify({'error': f'Błąd zakupu krypto: {order_data.get("retMsg", "Brak szczegółów")}'})
            except Exception as e:
                return jsonify({'error': f'Błąd zamówienia na Bybit: {str(e)}'}), 500

            # Odpowiedź
            response = {
                "status": "success",
                "message": "Transakcja crypto zrealizowana",
                "transaction_id": f"CB_{int(time.time())}",
                "data": {
                    "amount_pln": amount_pln,
                    "fee_pln": fee_pln,
                    "amount_for_crypto": amount_for_crypto,
                    "crypto": crypto_symbol,
                    "wallet": wallet,
                    "email": email,
                    "usdt_amount": usdt_amount,
                    "crypto_amount": crypto_amount,
                    "order_result": order_data
                }
            }
            return jsonify(response)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/payment/blik', methods=['POST'])
    def blik_payment():
        """Handle BLIK payment processing"""
        try:
            data = request.get_json()
            
            # Validacja danych BLIK
            required_fields = ['blik_code', 'amount', 'email']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'Missing field: {field}'}), 400
            
            # Symulacja płatności BLIK
            response = {
                "status": "success",
                "message": "Płatność BLIK zainicjowana",
                "payment_id": f"BLIK_{int(time.time())}",
                "amount": data['amount'],
                "email": data['email']
            }
            
            # TODO: Implementować rzeczywistą integrację z PayU/Przelewy24
            
            return jsonify(response)
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # PayU BLIK Integration Endpoints
    @app.route('/api/payu/create-order', methods=['POST'])
    def create_payu_order():
        """Create PayU order for BLIK payment"""
        try:
            data = request.get_json()
            
            # Validation
            required_fields = ['amount', 'currency', 'description', 'customerEmail']
            for field in required_fields:
                if not data.get(field):
                    return jsonify(backend_i18n.error_response('invalid_' + field))
            
            # Create order through PayU integration
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(payu_integration.create_order(data))
            loop.close()
            
            return jsonify(result)
            
        except Exception as e:
            return jsonify(backend_i18n.error_response('api_error', details=str(e)))
    
    @app.route('/api/payu/notify', methods=['POST'])
    def payu_notification():
        """Handle PayU payment notifications"""
        try:
            # Get notification data
            notification_data = request.get_json()
            
            # Process notification
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(payu_integration.handle_notification(notification_data))
            loop.close()
            
            return jsonify(result)
            
        except Exception as e:
            print(f"PayU notification error: {str(e)}")
            return jsonify(backend_i18n.error_response('api_error', details=str(e)))
    
    @app.route('/payment/success')
    def payment_success():
        """Payment success page"""
        return '''
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Płatność Zakończona - CryptoBLIK</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
                    color: white; 
                    text-align: center; 
                    padding: 50px; 
                }
                .success-box {
                    background: rgba(0, 255, 0, 0.1);
                    border: 2px solid #00ff00;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .success-icon { font-size: 4rem; color: #00ff00; margin-bottom: 20px; }
                h1 { color: #FFD700; margin-bottom: 20px; }
                .btn {
                    display: inline-block;
                    background: linear-gradient(45deg, #FFD700, #FFA500);
                    color: #111;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: bold;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="success-box">
                <div class="success-icon">✅</div>
                <h1>Płatność Zakończona Pomyślnie!</h1>
                <p>Twoja płatność została przetworzona. Kryptowaluty zostaną przesłane na podany adres portfela w ciągu 10-15 minut.</p>
                <p>Na podany adres email został wysłany szczegółowy raport transakcji.</p>
                <a href="/" class="btn">Powrót do strony głównej</a>
            </div>
            <script>
                // Auto redirect after 10 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 10000);
            </script>
        </body>
        </html>
        '''
    
    @app.route('/payment/cancelled')
    def payment_cancelled():
        """Payment cancelled page"""
        return '''
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Płatność Anulowana - CryptoBLIK</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
                    color: white; 
                    text-align: center; 
                    padding: 50px; 
                }
                .error-box {
                    background: rgba(255, 0, 0, 0.1);
                    border: 2px solid #ff4444;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .error-icon { font-size: 4rem; color: #ff4444; margin-bottom: 20px; }
                h1 { color: #FFD700; margin-bottom: 20px; }
                .btn {
                    display: inline-block;
                    background: linear-gradient(45deg, #FFD700, #FFA500);
                    color: #111;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: bold;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="error-box">
                <div class="error-icon">❌</div>
                <h1>Płatność Anulowana</h1>
                <p>Płatność została anulowana. Możesz spróbować ponownie.</p>
                <a href="/" class="btn">Powrót do strony głównej</a>
            </div>
            <script>
                // Auto redirect after 10 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 10000);
            </script>
        </body>
        </html>
        '''
    
    @app.route('/api/crypto/prices-batch', methods=['GET'])
    def get_crypto_prices_batch():
        """Get multiple crypto prices at once for frontend"""
        try:
            # Get symbols from query parameter
            symbols_param = request.args.get('symbols', '')
            symbols = symbols_param.split(',') if symbols_param else [
                'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 
                'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT'
            ]
            
            prices = {}
            
            for symbol in symbols:
                try:
                    url = f'{BYBIT_BASE_URL}/v5/market/tickers'
                    params = {
                        'category': 'spot',
                        'symbol': symbol
                    }
                    
                    response = requests.get(url, params=params, timeout=5)
                    data = response.json()
                    
                    if data.get('retCode') == 0 and data.get('result'):
                        ticker = data['result']['list'][0]
                        prices[symbol] = {
                            'symbol': symbol,
                            'price': float(ticker.get('lastPrice', 0)),
                            'change24h': float(ticker.get('price24hPcnt', 0)) * 100,
                            'volume24h': float(ticker.get('volume24h', 0)),
                            'timestamp': int(time.time())
                        }
                except Exception as e:
                    print(f"Error fetching {symbol}: {e}")
                    continue
            
            return jsonify(backend_i18n.success_response(
                message_key='api_connected',
                data=prices
            ))
            
        except Exception as e:
            return jsonify(backend_i18n.error_response('api_error', details=str(e)))
    
    return app

# Utwórz app instance
app = create_app()

if __name__ == '__main__':
    # Render.com przekazuje port przez zmienną środowiskową PORT
    port = int(os.environ.get('PORT', 10000))
    debug = os.environ.get('FLASK_ENV') == 'development'

    print(f"🚀 CryptoBLIK API startuje na porcie {port} (Render.com ready)")
    print(f"🔧 Debug mode: {debug}")
    print(f"🌐 CORS origins: https://cryptoblik.pl")

    app.run(host='0.0.0.0', port=port, debug=debug)

