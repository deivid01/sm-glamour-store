import os
import django
from django.conf import settings
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sm_glamour_backend.settings')
django.setup()

url = f'{settings.TINY_API_URL}produto.obter.php'
params = {'token': settings.TINY_TOKEN, 'formato': 'JSON', 'id': '343586283'}
res = requests.get(url, params=params)
produto = res.json()['retorno']['produto']
print(f"ID: {produto.get('id')}")
print(f"Codigo: {produto.get('codigo')}")
print(f"Nome: {produto.get('nome')}")
