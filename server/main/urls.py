# face_analyzer/urls.py
from django.urls import path
from main.views import analyze_camera

urlpatterns = [
    path('analyze_camera/', analyze_camera, name='analyze_camera'),
]
