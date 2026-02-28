from rest_framework import serializers
from .models import Produto, Categoria

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'slug']

class ProdutoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.ReadOnlyField(source='categoria.nome')
    imagem_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Produto
        fields = [
            'id', 'id_olist', 'codigo_barras', 'nome', 'slug', 'descricao', 
            'preco', 'estoque', 'categoria', 'categoria_nome', 
            'imagem_url', 'peso_kg', 'comprimento_cm', 
            'altura_cm', 'largura_cm'
        ]

    def get_imagem_url(self, obj):
        request = self.context.get('request')
        if obj.imagem:
            return request.build_absolute_uri(obj.imagem.url) if request else obj.imagem.url
        if obj.imagem_url:
            return obj.imagem_url
        return None
