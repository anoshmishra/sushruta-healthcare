from django.contrib import admin

from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("name", "date_of_birth", "gender", "care_department", "phone", "created_by", "created_at")
    list_filter = ("gender", "care_department", "created_at")
    search_fields = ("name", "email", "phone", "primary_concern", "medical_notes", "created_by__email")
    readonly_fields = ("created_at", "updated_at")
