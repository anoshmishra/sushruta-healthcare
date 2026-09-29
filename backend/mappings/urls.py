"""Patient-doctor mapping API routes."""

from django.urls import path

from .views import MappingListCreateView, PatientMappingResourceView

app_name = "mappings"
urlpatterns = [
    path("", MappingListCreateView.as_view(), name="list-create"),
    path("<int:resource_id>/", PatientMappingResourceView.as_view(), name="patient-doctors-delete"),
]
