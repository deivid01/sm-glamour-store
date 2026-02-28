from django.db import models
from django.utils.text import slugify
import requests

class Categoria(models.Model):
    nome = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nome)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nome

class Produto(models.Model):
    id_olist = models.CharField(max_length=50, unique=True, blank=True, null=True, help_text="ID do produto no ERP Olist")
    nome = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, null=True, blank=True)
    descricao = models.TextField()
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    estoque = models.PositiveIntegerField(default=0)
    categoria = models.ForeignKey(Categoria, related_name='produtos', on_delete=models.CASCADE)
    
    # Imagens e Códigos de Barras
    codigo_barras = models.CharField(max_length=50, blank=True, null=True, help_text="EAN / GTIN do produto")
    imagem = models.ImageField(upload_to='produtos/', blank=True, null=True, help_text="Upload direto do painel (Prioridade máxima)")
    imagem_url = models.URLField(max_length=500, blank=True, null=True, help_text="URL de fallback da API")
    
    # Dados de Logística
    peso_kg = models.DecimalField(max_digits=5, decimal_places=3, default=0.0)
    comprimento_cm = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    altura_cm = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    largura_cm = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nome)
            
        # Fallback de imagem via OpenBeautyFacts (Cosméticos, Perfumes, etc.)
        if self.codigo_barras and not self.imagem and not self.imagem_url:
            try:
                response = requests.get(f"https://world.openbeautyfacts.org/api/v0/product/{self.codigo_barras}.json", timeout=3)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 1 and 'product' in data:
                        img = data['product'].get('image_url') or data['product'].get('image_front_url')
                        if img:
                            self.imagem_url = img
            except Exception:
                pass # Ignora falhas da API para não quebrar o form

        super().save(*args, **kwargs)

    def __str__(self):
        return self.nome
