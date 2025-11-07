#!/usr/bin/env python3
from app import create_app

app = create_app()

with app.test_client() as client:
    response = client.get('/')
    print('Status:', response.status_code)
    print('Content-Type:', response.headers.get('Content-Type'))
    print('Content length:', len(response.get_data(as_text=True)))
    if response.status_code == 200:
        content = response.get_data(as_text=True)
        if '<!DOCTYPE html>' in content:
            print('✅ Returns HTML content')
        else:
            print('❌ Does not return HTML content')
            print('First 200 chars:', content[:200])