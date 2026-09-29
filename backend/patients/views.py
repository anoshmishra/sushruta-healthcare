"""Authenticated patient endpoints scoped to the creating user."""

from rest_framework import generics

from .models import Patient
from .serializers import PatientSerializer


class PatientListCreateView(generics.ListCreateAPIView):
    serializer_class = PatientSerializer

    def get_queryset(self):
        return Patient.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PatientSerializer
    lookup_url_kwarg = "pk"

    def get_queryset(self):
        return Patient.objects.filter(created_by=self.request.user)
