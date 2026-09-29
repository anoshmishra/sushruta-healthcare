from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Doctor


User = get_user_model()


class DoctorApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("doctor-admin@example.com", "Doctor Admin", "Strong-password-987!")
        self.client.force_authenticate(self.user)
        self.list_url = reverse("doctors:list-create")
        self.payload = {
            "name": "Jordan Physician",
            "specialization": "Family Medicine",
            "email": "jordan@example.com",
            "phone": "+1 555 0120",
            "address": "20 Clinic Road",
        }

    def create_doctor(self, **overrides):
        return Doctor.objects.create(**{**self.payload, **overrides})

    def test_authenticated_create_and_list_doctors(self):
        create_response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        list_response = self.client.get(self.list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["email"], self.payload["email"])

    def test_unauthenticated_access_is_denied(self):
        response = APIClient().get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_and_update_doctor(self):
        doctor = self.create_doctor()
        detail_url = reverse("doctors:detail", kwargs={"pk": doctor.pk})

        get_response = self.client.get(detail_url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        update_response = self.client.put(
            detail_url,
            {**self.payload, "name": "Jordan Updated", "email": "jordan.updated@example.com"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        doctor.refresh_from_db()
        self.assertEqual(doctor.name, "Jordan Updated")

    def test_delete_doctor(self):
        doctor = self.create_doctor()
        response = self.client.delete(reverse("doctors:detail", kwargs={"pk": doctor.pk}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Doctor.objects.filter(pk=doctor.pk).exists())

    def test_invalid_doctor_id_returns_not_found(self):
        response = self.client.get(reverse("doctors:detail", kwargs={"pk": 999999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_doctor_data_is_rejected(self):
        response = self.client.post(self.list_url, {"name": "Incomplete"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
