"""Serializers for safe account registration and authentication output."""

from django.contrib.auth import password_validation
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation which deliberately excludes password fields."""

    class Meta:
        model = User
        fields = ("id", "name", "email", "created_at", "updated_at")
        read_only_fields = fields


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ("name", "email", "password")
        extra_kwargs = {"email": {"error_messages": {"unique": "A user with this email already exists."}}}

    def validate_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Name is required.")
        return name

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate_password(self, value: str) -> str:
        password_validation.validate_password(value, user=User(name=self.initial_data.get("name", ""), email=self.initial_data.get("email", "")))
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(TokenObtainPairSerializer):
    """SimpleJWT serializer using the custom User model's email identifier."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["name"] = user.name
        return token
