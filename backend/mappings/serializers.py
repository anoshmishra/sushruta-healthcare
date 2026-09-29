"""Patient-doctor mapping serializer with patient ownership validation."""

from patients.models import Patient
from rest_framework import serializers

from doctors.models import Doctor
from .models import PatientDoctorMapping


class PatientDoctorMappingSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.none())
    doctor = serializers.PrimaryKeyRelatedField(queryset=Doctor.objects.all())

    class Meta:
        model = PatientDoctorMapping
        fields = ("id", "patient", "doctor", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=PatientDoctorMapping.objects.all(),
                fields=("patient", "doctor"),
                message="This patient is already assigned to this doctor.",
            )
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["patient"].queryset = Patient.objects.filter(created_by=request.user)
