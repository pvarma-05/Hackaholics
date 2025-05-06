from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken

class GoogleLoginAPIView(APIView):
    def post(self, request):
        id_token_value = request.data.get('id_token')
        role = request.data.get('role')

        if role not in ['student', 'expert']:
            return Response({"error": "Invalid role. Must be 'student' or 'expert'."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify Google Token
            idinfo = id_token.verify_oauth2_token(
                id_token_value,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            email = idinfo['email']
            username = idinfo.get('name', email.split('@')[0])

            user, created = User.objects.get_or_create(email=email, defaults={
                'username': username,
                'role': role,
            })

            # If user exists but role doesn't match
            if not created and user.role != role:
                return Response({"error": f"This account is already registered as {user.role}."},
                                status=status.HTTP_400_BAD_REQUEST)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                }
            })

        except ValueError:
            return Response({"error": "Invalid Google token."},
                            status=status.HTTP_400_BAD_REQUEST)
