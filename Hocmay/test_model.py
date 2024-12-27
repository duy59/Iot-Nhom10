import cv2
import numpy as np
from tensorflow.keras.models import load_model

def test_model():
    # Load model
    model = load_model('egg_detection_model.h5')
    
    # Khởi tạo camera (0 là webcam, có thể thay đổi thành đường dẫn IP camera)
    cap = cv2.VideoCapture(0)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Xử lý frame
        processed = cv2.resize(frame, (224, 224))
        processed = processed / 255.0
        
        # Dự đoán
        prediction = model.predict(np.expand_dims(processed, axis=0))[0]
        
        # Hiển thị kết quả
        text = "Co trung" if prediction > 0.5 else "Khong co trung"
        confidence = prediction if prediction > 0.5 else 1 - prediction
        
        cv2.putText(frame, f"{text} ({confidence:.2f})", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                   1, (0, 255, 0), 2)
        
        cv2.imshow("Egg Detection", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    test_model()