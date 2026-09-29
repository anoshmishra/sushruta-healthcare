"""Data-layer serializer for doctors; CRUD endpoints are a later phase."""

from rest_framework import serializers

from .models import Doctor


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ("id", "name", "department", "specialization", "email", "phone", "address", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
