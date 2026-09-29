from django.db import models


class Doctor(models.Model):
    name = models.CharField(max_length=150)
    department = models.CharField(max_length=100, default="Other / Independent Specialty")
    specialization = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=25)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self) -> str:
        return f"Dr. {self.name} ({self.specialization})"
