from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from doctors.models import Doctor
from patients.models import Patient
from .models import PatientDoctorMapping


User = get_user_model()


class MappingApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user("mapping-owner@example.com", "Mapping Owner", "Strong-password-987!")
        self.other_user = User.objects.create_user("mapping-other@example.com", "Other Owner", "Strong-password-987!")
        self.client.force_authenticate(self.owner)
        self.patient = Patient.objects.create(
            name="Casey Patient",
            date_of_birth=date(1986, 6, 5),
            gender=Patient.Gender.NON_BINARY,
            phone="+1 555 0101",
            created_by=self.owner,
        )
        self.other_patient = Patient.objects.create(
            name="Private Patient",
            date_of_birth=date(1986, 6, 5),
            gender=Patient.Gender.NON_BINARY,
            phone="+1 555 0199",
            created_by=self.other_user,
        )
        self.doctor = Doctor.objects.create(
            name="Riley Doctor",
            specialization="Pediatrics",
            email="riley@example.com",
            phone="+1 555 0200",
        )
        self.list_url = reverse("mappings:list-create")
        self.payload = {"patient": self.patient.pk, "doctor": self.doctor.pk}

    def test_create_and_list_mapping(self):
        create_response = self.client.post(self.list_url, self.payload, format="json")

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["patient"], self.patient.pk)
        self.assertEqual(create_response.data["doctor"], self.doctor.pk)

        list_response = self.client.get(self.list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)

    def test_unauthenticated_access_is_denied(self):
        response = APIClient().get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_duplicate_mapping_is_rejected(self):
        PatientDoctorMapping.objects.create(patient=self.patient, doctor=self.doctor)
        response = self.client.post(self.list_url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patient_specific_mappings_return_assigned_doctors(self):
        PatientDoctorMapping.objects.create(patient=self.patient, doctor=self.doctor)
        response = self.client.get(reverse("mappings:patient-doctors-delete", kwargs={"resource_id": self.patient.pk}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([doctor["id"] for doctor in response.data], [self.doctor.pk])

    def test_delete_mapping(self):
        mapping = PatientDoctorMapping.objects.create(patient=self.patient, doctor=self.doctor)
        response = self.client.delete(reverse("mappings:patient-doctors-delete", kwargs={"resource_id": mapping.pk}))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PatientDoctorMapping.objects.filter(pk=mapping.pk).exists())

    def test_cannot_create_or_list_mapping_for_another_users_patient(self):
        create_response = self.client.post(
            self.list_url,
            {"patient": self.other_patient.pk, "doctor": self.doctor.pk},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_400_BAD_REQUEST)

        mapping = PatientDoctorMapping.objects.create(patient=self.other_patient, doctor=self.doctor)
        self.assertEqual(self.client.get(self.list_url).data, [])
        delete_response = self.client.delete(
            reverse("mappings:patient-doctors-delete", kwargs={"resource_id": mapping.pk})
        )
        self.assertEqual(delete_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(PatientDoctorMapping.objects.filter(pk=mapping.pk).exists())

    def test_invalid_patient_and_doctor_ids_are_rejected(self):
        missing_patient = self.client.post(
            self.list_url,
            {"patient": 999999, "doctor": self.doctor.pk},
            format="json",
        )
        missing_doctor = self.client.post(
            self.list_url,
            {"patient": self.patient.pk, "doctor": 999999},
            format="json",
        )

        self.assertEqual(missing_patient.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("patient", missing_patient.data)
        self.assertEqual(missing_doctor.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("doctor", missing_doctor.data)

    def test_patient_specific_endpoint_hides_another_users_patient(self):
        response = self.client.get(
            reverse("mappings:patient-doctors-delete", kwargs={"resource_id": self.other_patient.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
