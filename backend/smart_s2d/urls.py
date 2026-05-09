from django.contrib import admin
from django.http import JsonResponse
from django.urls import path


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "SMART-S2D API"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
]
