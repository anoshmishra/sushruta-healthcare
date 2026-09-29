from django.contrib import admin

from .models import PatientDoctorMapping


@admin.register(PatientDoctorMapping)
class PatientDoctorMappingAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor", "created_at", "updated_at")
    list_select_related = ("patient", "doctor")
    search_fields = ("patient__name", "doctor__name", "doctor__email")
    readonly_fields = ("created_at", "updated_at")
