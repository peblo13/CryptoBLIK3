"""
PayU BLIK Integration for CryptoBLIK
Handles BLIK payments through PayU API
"""

import requests
import json
import hashlib
import uuid
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, redirect
import os
from backend_localization import backend_i18n

class PayUBLIKIntegration:
    def __init__(self):
        # PayU Sandbox Configuration (replace with production values)
        self.config = {
            'client_id': '300746',  # PayU Client ID
            'client_secret': 'b9a8f17a3d5e1c2f8a9b4d6e2c1a8b3d',  # PayU Client Secret
            'pos_id': '300746',  # Point of Sale ID
            'signature_key': 'b9a8f17a3d5e1c2f8a9b4d6e2c1a8b3d',  # MD5 Signature Key
            'api_url': 'https://secure.snd.payu.com',  # Sandbox URL
            'oauth_url': 'https://secure.snd.payu.com/pl/standard/user/oauth/authorize',
            'notify_url': 'https://cryptoblik.pl/api/payu/notify',
            'continue_url': 'https://cryptoblik.pl/payment/success',
            'currency': 'PLN'
        }
        
        self.access_token = None
        self.token_expires = None
        
    async def get_access_token(self):
        """Get OAuth access token from PayU"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return self.access_token
            
        try:
            url = f"{self.config['api_url']}/pl/standard/user/oauth/authorize"
            
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.config['client_id'],
                'client_secret': self.config['client_secret']
            }
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            response = requests.post(url, data=data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                self.access_token = result['access_token']
                self.token_expires = datetime.now() + timedelta(seconds=result['expires_in'] - 60)
                return self.access_token
            else:
                raise Exception(f"Failed to get access token: {response.status_code}")
                
        except Exception as e:
            print(f"Error getting PayU access token: {str(e)}")
            return None
    
    def generate_signature(self, data):
        """Generate MD5 signature for PayU request"""
        # Create signature string according to PayU documentation
        signature_data = (
            f"{data.get('merchantPosId', '')}"
            f"{data.get('sessionId', '')}"
            f"{data.get('totalAmount', '')}"
            f"{data.get('currencyCode', '')}"
            f"{self.config['signature_key']}"
        )
        
        return hashlib.md5(signature_data.encode('utf-8')).hexdigest()
    
    async def create_order(self, order_data):
        """Create PayU order for BLIK payment"""
        try:
            access_token = await self.get_access_token()
            if not access_token:
                return backend_i18n.error_response('api_error', details='Cannot get PayU access token')
            
            # Generate unique session ID
            session_id = str(uuid.uuid4())
            
            # Prepare order data for PayU
            payu_order = {
                'merchantPosId': self.config['pos_id'],
                'sessionId': session_id,
                'description': order_data['description'],
                'currencyCode': self.config['currency'],
                'totalAmount': order_data['amount'],  # Amount in grosze (1 PLN = 100 grosze)
                'buyer': {
                    'email': order_data['customerEmail'],
                    'phone': order_data.get('customerPhone', ''),
                    'firstName': order_data.get('firstName', 'Klient'),
                    'lastName': order_data.get('lastName', 'CryptoBLIK'),
                    'language': 'pl'
                },
                'products': [{
                    'name': f"Zakup {order_data.get('cryptoAmount', 0)} {order_data.get('cryptoSymbol', '').replace('USDT', '')}",
                    'unitPrice': order_data['amount'],
                    'quantity': 1
                }],
                'payMethods': {
                    'payMethod': {
                        'type': 'BLIK_CODE'
                    }
                },
                'notifyUrl': self.config['notify_url'],
                'continueUrl': self.config['continue_url'],
                'extOrderId': session_id,
                'customerIp': request.environ.get('HTTP_X_FORWARDED_FOR', request.environ['REMOTE_ADDR']),
                'validityTime': 900  # 15 minutes
            }
            
            # Add custom parameters for crypto transaction
            payu_order['additionalDescription'] = json.dumps({
                'cryptoSymbol': order_data.get('cryptoSymbol'),
                'cryptoAmount': order_data.get('cryptoAmount'),
                'walletAddress': order_data.get('walletAddress'),
                'cryptoPrice': order_data.get('cryptoPrice')
            })
            
            # Create order via PayU API
            url = f"{self.config['api_url']}/api/v2_1/orders"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(url, json=payu_order, headers=headers)
            
            if response.status_code == 302:  # PayU returns 302 for successful order creation
                result = response.json()
                
                return backend_i18n.success_response(
                    message_key='transaction_created',
                    data={
                        'orderId': result.get('orderId'),
                        'redirectUri': result.get('redirectUri'),
                        'sessionId': session_id,
                        'status': result.get('status', {}).get('statusCode')
                    }
                )
            else:
                error_details = response.json() if response.content else {'error': 'Unknown error'}
                return backend_i18n.error_response('payment_failed', details=error_details)
                
        except Exception as e:
            print(f"Error creating PayU order: {str(e)}")
            return backend_i18n.error_response('api_error', details=str(e))
    
    async def handle_notification(self, notification_data):
        """Handle PayU payment notification"""
        try:
            # Verify notification signature
            if not self.verify_notification(notification_data):
                return backend_i18n.error_response('invalid_signature', status_code=400)
            
            order_id = notification_data.get('order', {}).get('orderId')
            status = notification_data.get('order', {}).get('status')
            
            # Get order details
            order_details = await self.get_order_details(order_id)
            
            if status == 'COMPLETED':
                # Payment successful - process crypto transaction
                await self.process_crypto_transaction(order_details)
                return backend_i18n.success_response('payment_success')
                
            elif status == 'CANCELED':
                # Payment canceled
                await self.handle_payment_cancellation(order_details)
                return backend_i18n.error_response('payment_cancelled')
                
            elif status == 'REJECTED':
                # Payment rejected
                await self.handle_payment_rejection(order_details)
                return backend_i18n.error_response('payment_failed')
            
            return backend_i18n.success_response('notification_received')
            
        except Exception as e:
            print(f"Error handling PayU notification: {str(e)}")
            return backend_i18n.error_response('api_error', details=str(e))
    
    def verify_notification(self, notification_data):
        """Verify PayU notification signature"""
        try:
            # Extract signature from headers
            signature = request.headers.get('OpenPayu-Signature', '')
            
            if not signature:
                return False
            
            # Parse signature
            signature_parts = {}
            for part in signature.split(';'):
                if '=' in part:
                    key, value = part.split('=', 1)
                    signature_parts[key] = value
            
            if 'signature' not in signature_parts:
                return False
            
            # Calculate expected signature
            body = request.get_data().decode('utf-8')
            expected_signature = hashlib.md5(
                (body + self.config['signature_key']).encode('utf-8')
            ).hexdigest()
            
            return signature_parts['signature'] == expected_signature
            
        except Exception as e:
            print(f"Error verifying signature: {str(e)}")
            return False
    
    async def get_order_details(self, order_id):
        """Get order details from PayU"""
        try:
            access_token = await self.get_access_token()
            if not access_token:
                return None
            
            url = f"{self.config['api_url']}/api/v2_1/orders/{order_id}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            print(f"Error getting order details: {str(e)}")
            return None
    
    async def process_crypto_transaction(self, order_details):
        """Process crypto transaction after successful payment"""
        try:
            # Extract crypto transaction details from order
            additional_desc = order_details.get('orders', [{}])[0].get('additionalDescription', '{}')
            crypto_data = json.loads(additional_desc)
            
            # Here you would integrate with your crypto exchange/wallet
            # For now, we'll log the transaction
            transaction_data = {
                'order_id': order_details.get('orders', [{}])[0].get('orderId'),
                'crypto_symbol': crypto_data.get('cryptoSymbol'),
                'crypto_amount': crypto_data.get('cryptoAmount'),
                'wallet_address': crypto_data.get('walletAddress'),
                'crypto_price': crypto_data.get('cryptoPrice'),
                'status': 'completed',
                'timestamp': datetime.now().isoformat()
            }
            
            # Save transaction to database (implement your database logic here)
            # await save_crypto_transaction(transaction_data)
            
            # Send crypto to customer wallet (implement your crypto sending logic here)
            # await send_crypto_to_wallet(crypto_data)
            
            print(f"Crypto transaction processed: {transaction_data}")
            
        except Exception as e:
            print(f"Error processing crypto transaction: {str(e)}")
    
    async def handle_payment_cancellation(self, order_details):
        """Handle payment cancellation"""
        print(f"Payment cancelled for order: {order_details}")
        # Implement cancellation logic here
    
    async def handle_payment_rejection(self, order_details):
        """Handle payment rejection"""
        print(f"Payment rejected for order: {order_details}")
        # Implement rejection logic here

# Global instance
payu_integration = PayUBLIKIntegration()