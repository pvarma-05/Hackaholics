from django.urls import path
from .views import GoogleLoginAPIView

urlpatterns = [
    path('google-login/', GoogleLoginAPIView.as_view(), name='google-login'),
]
