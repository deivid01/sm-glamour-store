from django.contrib import admin
from .models import Categoria, Produto

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'slug')
    prepopulated_fields = {'slug': ('nome',)}

@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'categoria', 'preco', 'estoque', 'codigo_barras')
    search_fields = ('nome', 'codigo_barras', 'id_olist')
    list_filter = ('categoria',)
    prepopulated_fields = {'slug': ('nome',)}
