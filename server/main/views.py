from rest_framework.response import Response
from rest_framework.decorators import api_view
from main.FaceDetector.FaceDetector import CameraAnalyzer


@api_view(['GET'])
def analyze_camera(request):
    analyzer = CameraAnalyzer()
    analyzer.analyze_camera()  # Вызываем метод анализа камеры
    return Response({"message": "Анализ камеры завершен"})
