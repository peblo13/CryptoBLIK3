"""
Backend localization support for CryptoBLIK
"""

import json
import os
from flask import request

class BackendLocalization:
    def __init__(self):
        self.translations = {}
        self.default_language = 'pl'
        self.supported_languages = ['pl', 'en']
        self.load_translations()
    
    def load_translations(self):
        """Load translation files for backend messages"""
        backend_translations = {
            'pl': {
                'errors': {
                    'invalid_amount': 'Nieprawidłowa kwota',
                    'invalid_crypto': 'Nieprawidłowa kryptowaluta',
                    'invalid_blik': 'Nieprawidłowy kod BLIK',
                    'invalid_email': 'Nieprawidłowy adres email',
                    'payment_failed': 'Płatność nie powiodła się',
                    'api_error': 'Błąd API',
                    'network_error': 'Błąd sieci',
                    'insufficient_funds': 'Niewystarczające środki',
                    'transaction_timeout': 'Przekroczono czas oczekiwania na transakcję'
                },
                'messages': {
                    'payment_processing': 'Przetwarzanie płatności...',
                    'payment_success': 'Płatność zakończona pomyślnie',
                    'transaction_created': 'Transakcja została utworzona',
                    'price_updated': 'Cena została zaktualizowana',
                    'api_connected': 'Połączono z API'
                },
                'status': {
                    'pending': 'Oczekujące',
                    'completed': 'Zakończone',
                    'failed': 'Niepowodzenie',
                    'cancelled': 'Anulowane'
                }
            },
            'en': {
                'errors': {
                    'invalid_amount': 'Invalid amount',
                    'invalid_crypto': 'Invalid cryptocurrency',
                    'invalid_blik': 'Invalid BLIK code',
                    'invalid_email': 'Invalid email address',
                    'payment_failed': 'Payment failed',
                    'api_error': 'API error',
                    'network_error': 'Network error',
                    'insufficient_funds': 'Insufficient funds',
                    'transaction_timeout': 'Transaction timeout'
                },
                'messages': {
                    'payment_processing': 'Processing payment...',
                    'payment_success': 'Payment completed successfully',
                    'transaction_created': 'Transaction created',
                    'price_updated': 'Price updated',
                    'api_connected': 'Connected to API'
                },
                'status': {
                    'pending': 'Pending',
                    'completed': 'Completed',
                    'failed': 'Failed',
                    'cancelled': 'Cancelled'
                }
            }
        }
        
        self.translations = backend_translations
    
    def get_language(self):
        """Get language from request headers or default"""
        # Check Accept-Language header
        accept_language = request.headers.get('Accept-Language', '')
        
        # Check for language in request args
        lang_param = request.args.get('lang', '').lower()
        if lang_param in self.supported_languages:
            return lang_param
        
        # Parse Accept-Language header
        if accept_language:
            languages = []
            for lang_range in accept_language.split(','):
                lang = lang_range.split(';')[0].strip().lower()
                if '-' in lang:
                    lang = lang.split('-')[0]
                languages.append(lang)
            
            for lang in languages:
                if lang in self.supported_languages:
                    return lang
        
        return self.default_language
    
    def translate(self, key, fallback=None):
        """Get translated text for the current request language"""
        language = self.get_language()
        
        # Navigate through the translation keys
        keys = key.split('.')
        value = self.translations.get(language, {})
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                # Try fallback language
                if language != self.default_language:
                    fallback_value = self.translations.get(self.default_language, {})
                    for fk in keys:
                        if isinstance(fallback_value, dict) and fk in fallback_value:
                            fallback_value = fallback_value[fk]
                        else:
                            fallback_value = None
                            break
                    if fallback_value:
                        return fallback_value
                
                return fallback or key
        
        return value or fallback or key
    
    def error_response(self, error_key, status_code=400, **kwargs):
        """Create standardized error response with localization"""
        return {
            'error': True,
            'message': self.translate(f'errors.{error_key}'),
            'error_code': error_key,
            'language': self.get_language(),
            **kwargs
        }, status_code
    
    def success_response(self, message_key=None, data=None, **kwargs):
        """Create standardized success response with localization"""
        response = {
            'success': True,
            'language': self.get_language(),
            **kwargs
        }
        
        if message_key:
            response['message'] = self.translate(f'messages.{message_key}')
        
        if data:
            response['data'] = data
            
        return response

# Global instance
backend_i18n = BackendLocalization()