import requests
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from products.models import Produto, Categoria
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Sincroniza produtos do ERP Olist (Tiny) para o banco de dados local'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando sincronização com Olist (Tiny)...'))
        
        url_pesquisa = f"{settings.TINY_API_URL}produtos.pesquisa.php"
        url_obter = f"{settings.TINY_API_URL}produto.obter.php"
        
        params_pesquisa = {
            'token': settings.TINY_TOKEN,
            'formato': 'JSON'
        }
        
        try:
            response = requests.get(url_pesquisa, params=params_pesquisa)
            data = response.json()
            
            if data['retorno']['status'] != 'OK':
                self.stdout.write(self.style.ERROR(f"Erro na API do Tiny: {data['retorno']['erros'][0]}"))
                return

            produtos_lista = data['retorno'].get('produtos', [])
            total = len(produtos_lista)
            self.stdout.write(f"Encontrados {total} produtos. Buscando detalhes...")

            for idx, item in enumerate(produtos_lista, 1):
                prod_resumo = item['produto']
                tiny_id = prod_resumo['id']
                
                # Buscar detalhes do produto individualmente
                params_obter = {
                    'token': settings.TINY_TOKEN,
                    'id': tiny_id,
                    'formato': 'JSON'
                }
                
                # Respeitar limite de requisições se necessário
                time.sleep(0.5) 
                
                resp_detalhe = requests.get(url_obter, params=params_obter)
                detalhe_data = resp_detalhe.json()
                
                if detalhe_data['retorno']['status'] == 'OK':
                    prod_data = detalhe_data['retorno']['produto']
                    
                    # Nome e Categoria
                    nome = prod_data['nome']
                    categoria_nome = prod_data.get('categoria', 'Geral')
                    
                    # Garantir categoria
                    categoria, _ = Categoria.objects.get_or_create(nome=categoria_nome)
                    
                    # Imagem (pega a primeira se existir)
                    imagem_url = None
                    anexos = prod_data.get('anexos')
                    if anexos:
                        # O Tiny pode retornar anexos em vários formatos malucos
                        if isinstance(anexos, list) and len(anexos) > 0:
                            first = anexos[0]
                            if isinstance(first, str):
                                imagem_url = first
                            elif isinstance(first, dict):
                                if 'anexo' in first and isinstance(first['anexo'], dict):
                                    imagem_url = first['anexo'].get('url')
                                else:
                                    imagem_url = first.get('url')
                        elif isinstance(anexos, dict) and 'anexo' in anexos:
                             list_anexo = anexos['anexo']
                             if isinstance(list_anexo, list) and len(list_anexo) > 0:
                                 first_anexo = list_anexo[0]
                                 if isinstance(first_anexo, str):
                                     imagem_url = first_anexo
                                 elif isinstance(first_anexo, dict):
                                     imagem_url = first_anexo.get('url') or first_anexo.get('anexo', {}).get('url')
                             elif isinstance(list_anexo, str):
                                 imagem_url = list_anexo

                    # Medidas de Logística (Fallback inteligente para evitar frete zerado)
                    def get_fallback_measures(name):
                        name_lower = name.lower()
                        # Perfumes (ex: 30ml, 100ml, Cologne, Deo)
                        if any(k in name_lower for k in ['ml', 'perfume', 'colonia', 'deo', 'spray', 'fragrancia']):
                            return 0.350, 15, 12, 12  # 350g, 15x12x12cm
                        # Batons / Maquiagem Pequena
                        if any(k in name_lower for k in ['batom', 'rimel', 'lapis', 'esmalte']):
                            return 0.050, 10, 5, 5
                        # Hidratantes / Séruns / Shampoos
                        if any(k in name_lower for k in ['serum', 'hidratante', 'creme', 'shampoo', 'condicionador', 'oleo']):
                            return 0.400, 18, 10, 10
                        # Sabonetes
                        if any(k in name_lower for k in ['sabonete', 'barra']):
                            return 0.120, 10, 8, 8
                        # Fallback Geral (Mínimo Correios)
                        return 0.200, 16, 11, 11

                    peso = float(prod_data.get('peso_bruto', 0) or 0)
                    largura = float(prod_data.get('largura', 0) or 0)
                    altura = float(prod_data.get('altura', 0) or 0)
                    comprimento = float(prod_data.get('comprimento', 0) or 0)

                    if peso <= 0 or (largura + altura + comprimento) < 10:
                        peso_f, comp_f, alt_f, larg_f = get_fallback_measures(nome)
                        if peso <= 0: peso = peso_f
                        if largura <= 0: largura = larg_f
                        if altura <= 0: altura = alt_f
                        if comprimento <= 0: comprimento = comp_f

                    # Atualizar ou Criar
                    produto, created = Produto.objects.update_or_create(
                        id_olist=tiny_id,
                        defaults={
                            'nome': nome,
                            'slug': slugify(nome),
                            'descricao': prod_data.get('descricao', ''),
                            'preco': float(prod_data.get('preco', 0) or 0),
                            'estoque': int(prod_data.get('estoque_atual', 0) or 0),
                            'categoria': categoria,
                            'codigo_barras': prod_data.get('gtin', '')[:50],  # Extrai o EAN/GTIN do Tiny
                            'imagem_url': imagem_url,
                            'peso_kg': peso,
                            'comprimento_cm': comprimento,
                            'altura_cm': altura,
                            'largura_cm': largura,
                        }
                    )
                    
                    status_text = "Criado" if created else "Atualizado"
                    self.stdout.write(f"[{idx}/{total}] {status_text}: {nome}")
                else:
                    self.stdout.write(self.style.WARNING(f"Não foi possível obter detalhes do produto {tiny_id}"))

            self.stdout.write(self.style.SUCCESS('Sincronização concluída com sucesso!'))

        except Exception as e:
            import traceback
            self.stdout.write(self.style.ERROR(f"Erro inesperado: {traceback.format_exc()}"))
