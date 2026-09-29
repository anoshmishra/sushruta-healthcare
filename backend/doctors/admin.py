from django.contrib import admin

from .models import Doctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ("name", "department", "specialization", "email", "phone", "created_at")
    list_filter = ("department", "specialization", "created_at")
    search_fields = ("name", "department", "specialization", "email", "phone")
    readonly_fields = ("created_at", "updated_at")
