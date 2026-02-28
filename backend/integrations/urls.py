from django.urls import path
from .views import OlistWebhookView, CorreiosShippingCalcView

urlpatterns = [
    path('webhook/olist/', OlistWebhookView.as_view(), name='olist_webhook'),
    path('shipping/calculate/', CorreiosShippingCalcView.as_view(), name='calculate_shipping'),
]
