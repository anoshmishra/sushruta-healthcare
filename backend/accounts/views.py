from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import LoginSerializer, RegistrationSerializer, UserSerializer


class RegisterView(APIView):
    """Create an email-authenticated user without exposing credentials."""

    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """Issue access and refresh tokens for valid email/password credentials."""

    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer
