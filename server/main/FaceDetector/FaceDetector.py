import os
import cv2
from server.settings import BASE_DIR

class FaceDetector:
    def __init__(self, cascade_path_face='haarcascade_frontalface_default.xml', cascade_path_eye='haarcascade_eye.xml'):
        # Определение лица
        self.face_cascade_path = os.path.join(BASE_DIR, 'main', 'FaceDetector', cascade_path_face)
        if not os.path.isfile(self.face_cascade_path):
            raise FileNotFoundError(f"Файл каскада лица '{self.face_cascade_path}' не найден.")
        self.face_cascade = cv2.CascadeClassifier(self.face_cascade_path)

        # Определение глаза
        self.eye_cascade_path = os.path.join(BASE_DIR, 'main', 'FaceDetector', cascade_path_eye)
        if not os.path.isfile(self.eye_cascade_path):
            raise FileNotFoundError(f"Файл каскада глаз '{self.eye_cascade_path}' не найден.")
        self.eye_cascade = cv2.CascadeClassifier(self.eye_cascade_path)

    # Определение лица в кадре
    def detect_faces(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.5, minNeighbors=5)
        return faces

    # Определение глаза в кадре
    def detect_eyes(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        eyes = self.eye_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
        return eyes

    # Определение плача человека в кадре
    def detect_crying(self, frame, faces):
        for (x, y, w, h) in faces:
            roi_gray = frame[y:y + h, x:x + w]
            eyes = self.eye_cascade.detectMultiScale(roi_gray)
            # Если не обнаружено глаз, считаем, что человек плачет
            if len(eyes) == 0: return True
        return False

class CameraAnalyzer:
    def __init__(self):
        self.face_detector = FaceDetector()
        # Сглаживание, чтобы рамка и текст не дергались
        self.smoothed_x = None
        self.smoothed_y = None

    def smooth_values(self, x, y, smoothing_factor=0.5):
        if smoothing_factor >= 1.0: ValueError("Сглаживание должно быть меньше 1.0")

        if self.smoothed_x is None or self.smoothed_y is None:
            self.smoothed_x = x
            self.smoothed_y = y
        else:
            self.smoothed_x = smoothing_factor * self.smoothed_x + (1 - smoothing_factor) * x
            self.smoothed_y = smoothing_factor * self.smoothed_y + (1 - smoothing_factor) * y
        return int(self.smoothed_x), int(self.smoothed_y)

    def annotate_frame(self, frame, faces, eyes ,emotion, name_emotion="Crying"):
        # Координаты лица
        for (x, y, w, h) in faces:
            # Сглаживаем координаты рамки
            smoothed_x, smoothed_y = self.smooth_values(x + w // 2, y + h // 2 + h // 4)
            # Рисуем прямоугольник вокруг лица
            cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
            # Рисуем точку в центре губ
            cv2.circle(frame, (smoothed_x, smoothed_y), 3, (0, 255, 0), -1)
            if emotion:
                # Добавляем текст над лицом
                cv2.putText(frame, name_emotion, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
        # Координаты глаз
        for (ex, ey, ew, eh) in eyes:
            # Рисуем круг в центре каждого глаза
            center_x = ex + ew // 2
            center_y = ey + eh // 2
            cv2.circle(frame, (center_x, center_y), 3, (0, 255, 0), -1)

    def analyze_camera(self):
        # Используем камеру с индексом 0 (обычно это встроенная камера)
        cap = cv2.VideoCapture(0)

        while (cap.isOpened()):
            ret, frame = cap.read()

            # Если камера закрылась, то завершаем работу
            if not ret: break

            faces = self.face_detector.detect_faces(frame)
            eyes = self.face_detector.detect_eyes(frame)
            emotion = self.face_detector.detect_crying(frame, faces)

            self.annotate_frame(frame=frame, faces=faces, eyes=eyes, emotion=emotion)

            cv2.imshow('frame', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

#
# if __name__ == "__main__":
#     analyzer = CameraAnalyzer()
#     analyzer.analyze_camera()
