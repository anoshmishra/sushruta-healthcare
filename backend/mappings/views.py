"""Authenticated patient-doctor assignment endpoints."""

from django.shortcuts import get_object_or_404
from django.db import IntegrityError, transaction
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from doctors.models import Doctor
from doctors.serializers import DoctorSerializer
from patients.models import Patient
from .models import PatientDoctorMapping
from .serializers import PatientDoctorMappingSerializer


class MappingListCreateView(generics.ListCreateAPIView):
    serializer_class = PatientDoctorMappingSerializer

    def get_queryset(self):
        return PatientDoctorMapping.objects.filter(patient__created_by=self.request.user).select_related(
            "patient", "doctor"
        )

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError as exc:
            raise ValidationError({"non_field_errors": ["This patient is already assigned to this doctor."]}) from exc


class PatientMappingResourceView(APIView):
    """GET addresses a patient's assignments; DELETE addresses a mapping."""

    def get(self, request, resource_id):
        patient = get_object_or_404(Patient, pk=resource_id, created_by=request.user)
        doctors = Doctor.objects.filter(patient_mappings__patient=patient).distinct()
        return Response(DoctorSerializer(doctors, many=True).data)

    def delete(self, request, resource_id):
        mapping = get_object_or_404(
            PatientDoctorMapping.objects.select_related("patient"),
            pk=resource_id,
            patient__created_by=request.user,
        )
        mapping.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
