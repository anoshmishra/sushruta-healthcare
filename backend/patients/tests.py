from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from .models import Patient


User = get_user_model()


class PatientApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user("owner@example.com", "Owner", "Strong-password-987!")
        self.other_user = User.objects.create_user("other@example.com", "Other", "Strong-password-987!")
        self.client.force_authenticate(self.owner)
        self.list_url = reverse("patients:list-create")
        self.payload = {
            "name": "Taylor Patient",
            "date_of_birth": "1990-03-12",
            "gender": "prefer_not_to_say",
            "phone": "+1 555 0100",
            "email": "taylor@example.com",
            "address": "10 Care Lane",
            "care_department": "Cardiology & Cardiothoracic Care",
            "primary_concern": "Recurring chest discomfort",
            "medical_notes": "Referred for assessment.",
        }

    def create_patient(self, owner=None, **overrides):
        fields = {
            "created_by": owner or self.owner,
            "name": "Taylor Patient",
            "date_of_birth": date(1990, 3, 12),
            "gender": Patient.Gender.PREFER_NOT_TO_SAY,
            "phone": "+1 555 0100",
        }
        fields.update(overrides)
        return Patient.objects.create(**fields)

    def test_authenticated_create_uses_request_user_even_if_created_by_is_forged(self):
        response = self.client.post(
            self.list_url,
            {**self.payload, "created_by": self.other_user.pk},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["created_by"], self.owner.pk)
        self.assertEqual(Patient.objects.get(pk=response.data["id"]).created_by, self.owner)
        self.assertEqual(response.data["primary_concern"], self.payload["primary_concern"])
        self.assertEqual(response.data["care_department"], self.payload["care_department"])

    def test_unauthenticated_access_is_denied(self):
        unauthenticated = APIClient()
        response = unauthenticated.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_only_shows_own_patients(self):
        own_patient = self.create_patient()
        self.create_patient(owner=self.other_user, name="Private Patient", email="private@example.com")

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [own_patient.pk])

    def test_cannot_retrieve_or_update_another_users_patient(self):
        patient = self.create_patient(owner=self.other_user)
        detail_url = reverse("patients:detail", kwargs={"pk": patient.pk})

        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_404_NOT_FOUND)
        response = self.client.put(detail_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_own_patient(self):
        patient = self.create_patient()
        response = self.client.put(
            reverse("patients:detail", kwargs={"pk": patient.pk}),
            {**self.payload, "name": "Updated Patient"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        patient.refresh_from_db()
        self.assertEqual(patient.name, "Updated Patient")

    def test_delete_own_patient(self):
        patient = self.create_patient()
        response = self.client.delete(reverse("patients:detail", kwargs={"pk": patient.pk}))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Patient.objects.filter(pk=patient.pk).exists())

    def test_invalid_patient_id_returns_not_found(self):
        response = self.client.get(reverse("patients:detail", kwargs={"pk": 999999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_future_date_of_birth_is_rejected(self):
        response = self.client.post(self.list_url, {**self.payload, "date_of_birth": "2999-01-01"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date_of_birth", response.data)
