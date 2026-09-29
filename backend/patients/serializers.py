"""Data-layer serializer for patients; CRUD endpoints are a later phase."""

from django.utils import timezone
from rest_framework import serializers

from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Patient
        fields = (
            "id", "name", "date_of_birth", "gender", "phone", "email", "address",
            "care_department", "primary_concern", "medical_notes", "created_by", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")

    def validate_date_of_birth(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value
