from django.urls import path
from .views import ProdutoListView, ProdutoDetailView, CategoriaListView

urlpatterns = [
    path('', ProdutoListView.as_view(), name='produto-list'),
    path('categorias/', CategoriaListView.as_view(), name='categoria-list'),
    path('<slug:slug>/', ProdutoDetailView.as_view(), name='produto-detail'),
]
