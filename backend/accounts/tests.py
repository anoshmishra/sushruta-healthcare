from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthenticationApiTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("accounts:register")
        self.login_url = reverse("accounts:login")
        self.payload = {
            "name": "Avery Morgan",
            "email": "avery@example.com",
            "password": "A-strong-password-2026!",
        }

    def test_registration_creates_hashed_password_and_safe_response(self):
        response = self.client.post(self.register_url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data["user"])
        self.assertEqual(response.data["user"]["email"], self.payload["email"])

        user = User.objects.get(email=self.payload["email"])
        self.assertNotEqual(user.password, self.payload["password"])
        self.assertTrue(user.check_password(self.payload["password"]))

    def test_registration_rejects_duplicate_email(self):
        self.client.post(self.register_url, self.payload, format="json")
        duplicate_response = self.client.post(self.register_url, self.payload, format="json")

        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", duplicate_response.data)

    def test_login_issues_access_and_refresh_tokens(self):
        self.client.post(self.register_url, self.payload, format="json")
        response = self.client.post(
            self.login_url,
            {"email": self.payload["email"], "password": self.payload["password"]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
