import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from products.models import Produto
from django.db import transaction
from django.conf import settings

class OlistWebhookView(APIView):
    """
    Webhook para receber atualizações de produtos vindos da Tiny API / Olist.
    """
    def post(self, request, *args, **kwargs):
        payload = request.data
        
        # O Tiny envia o 'id' do produto no ERP
        event_type = payload.get('event')
        data = payload.get('data', {})

        tiny_id = data.get('id')
        
        if not tiny_id:
             return Response({"status": "ID não encontrado no payload"}, status=status.HTTP_200_OK)
        
        try:
            with transaction.atomic():
                produto = Produto.objects.filter(id_olist=tiny_id).first()

                if event_type == 'produto.atualizado': # Ajustado para padrão Tiny
                    if produto:
                        produto.preco = data.get('preco', produto.preco)
                        produto.estoque = data.get('estoque_atual', produto.estoque)
                        produto.save()
                        return Response({"status": "Sucesso"}, status=status.HTTP_200_OK)
                
                return Response({"status": "Ação ignorada"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CorreiosShippingCalcView(APIView):
    """
    Endpoint que consulta o Gateway Logístico do Tiny ERP para cotação real.
    """
    def post(self, request, *args, **kwargs):
        cep_destino = request.data.get('cep')
        produtos_cart = request.data.get('produtos', [])
        
        if not cep_destino or not produtos_cart:
            return Response({"error": "CEP e array de produtos são obrigatórios"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Preparar itens para o Melhor Envio ou Fallback
        itens_envio = []
        peso_total = 0
        for item in produtos_cart:
            prod_obj = Produto.objects.filter(id=item.get('id')).first()
            if prod_obj:
                qtd = int(item.get('quantidade', 1))
                peso = float(prod_obj.peso_kg)
                if peso <= 0: peso = 0.35 # Fallback segurança
                
                peso_total += (peso * qtd)
                itens_envio.append({
                    "id": str(prod_obj.id_olist or prod_obj.id),
                    "width": max(float(prod_obj.largura_cm or 11), 11),
                    "height": max(float(prod_obj.altura_cm or 2), 2),
                    "length": max(float(prod_obj.comprimento_cm or 16), 16),
                    "weight": peso,
                    "insurance_value": float(prod_obj.preco),
                    "quantity": qtd
                })

        token = settings.MELHOR_ENVIO_TOKEN
        
        # Fallback Automático (Simulador Dinâmico se não houver Token preenchido)
        if not token or token == 'INSERIR_TOKEN_AQUI':
            # Simulação realista baseada no peso acumulado
            valor_base_pac = 15.00 + (peso_total * 1.50)
            valor_base_sedex = 25.00 + (peso_total * 4.00)
            
            return Response([
                {"id": "PAC", "nome": "Correios PAC", "valor": f"{valor_base_pac:.2f}", "prazo_dias": 7},
                {"id": "JADLOG", "nome": "Jadlog .Package", "valor": f"{(valor_base_pac * 0.85):.2f}", "prazo_dias": 5},
                {"id": "SEDEX", "nome": "Correios Sedex", "valor": f"{valor_base_sedex:.2f}", "prazo_dias": 3}
            ], status=status.HTTP_200_OK)

        # Melhor Envio Payload V2
        payload = {
            "from": {"postal_code": settings.CEP_ORIGEM},
            "to": {"postal_code": cep_destino.replace('-', '')},
            "products": itens_envio
        }
        
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "User-Agent": "SMGlamourStore (contato@smglamourstore.com)"
        }
        
        try:
            url = f"{settings.MELHOR_ENVIO_URL.rstrip('/')}/me/shipment/calculate"
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"DEBUG ME Error payload: {response.text}")
                # Fallback em caso de erro da API (Token vencido, etc)
                return Response([
                    {"id": "PAC_FB", "nome": "Correios PAC", "valor": "22.00", "prazo_dias": 8},
                    {"id": "SEDEX_FB", "nome": "Correios Sedex", "valor": "35.00", "prazo_dias": 3}
                ], status=status.HTTP_200_OK)
                
            data = response.json()
            
            # Filtrar opções com status ok
            opcoes = []
            for transport in data:
                if 'error' not in transport and transport.get('custom_price'):
                    opcoes.append({
                        "id": str(transport.get('id')),
                        "nome": transport.get('name', 'Transportadora Log'),
                        "valor": str(transport.get('custom_price')),
                        "prazo_dias": transport.get('custom_delivery_time', 0)
                    })
            
            # Ordenar por valor mais barato
            opcoes.sort(key=lambda x: float(x['valor']))
            
            return Response(opcoes, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Erro na consulta externa: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
