# AI Scanning - Face Scanning & Proctoring Module

> **Nhiệm vụ chính (Main Objective):** `fix camera nhận diện mặt tốt hơn`
> *(Improve face detection accuracy, multi-face handling, head orientation, and low-light tolerance).*

---

## 1. Yêu cầu Hệ thống & Thông số Kỹ thuật (Specifications)

- **Chu kỳ quét (Scan Cycle):** Quét khuôn mặt **1 giây / 1 lần** (`1000ms`).
- **Dung sai vi phạm (Tolerance - consecutive_fails):** **3 lần liên tiếp**
  - Quét thấy 1 khuôn mặt hợp lệ $\rightarrow$ Reset biến đếm `consecutive_fails` về `0`.
  - Quét lỗi (không có mặt, nhiều hơn 1 mặt, sai người, che camera) $\rightarrow$ Tăng biến đếm thêm `1`.
  - Khi `consecutive_fails == 3` (tức **3 giây liên tục** không thấy mặt hợp lệ) $\rightarrow$ Ghi nhận **1 lần vi phạm**, hiện cảnh báo cho thí sinh và gửi log vi phạm về máy chủ Giáo viên. Sau đó reset biến đếm về `0`.

---

## 2. Cách chạy và Test thử nghiệm (How to Run)

Thư mục này được đóng gói độc lập để kỹ sư AI có thể phát triển và test ngay lập tức:

### Cách 1: Chạy trực tiếp trên trình duyệt (Standalone UI)
1. Mở file [test.html](test.html) bằng trình duyệt (Chrome, Edge, Firefox, Cốc Cốc,...).
2. Bấm nút **"Start Camera & AI Scanner"**.
3. Cấp quyền Camera và quan sát:
   - Khung hình webcam trực tiếp.
   - Nhịp quét tự động **1 giây / 1 lần**.
   - Bộ đếm dung sai `0/3` $\rightarrow$ `1/3` $\rightarrow$ `2/3` $\rightarrow$ kích hoạt Violation khi đạt `3/3`.
   - Nhật ký sự kiện thời gian thực (Live Event Logs).

### Cách 2: Tích hợp vào Frontend chính
Import class `FaceProctor` từ file [faceDetector.js](faceDetector.js):
```javascript
import { FaceProctor } from './faceDetector.js';

const proctor = new FaceProctor({
  scanIntervalMs: 1000, // 1 giây / 1 lần
  toleranceLimit: 3,    // Dung sai 3 lần liên tiếp (= 3 giây)
  onStatusChange: (statusInfo) => {
    console.log('Trạng thái mặt:', statusInfo.status, 'Lỗi liên tiếp:', statusInfo.consecutiveFails);
  },
  onViolation: (violation) => {
    console.warn('Ghi nhận vi phạm:', violation.type, violation.details);
  }
});

proctor.start(videoElement);
```

---

## 3. Các điểm trọng tâm cần tối ưu ("fix camera nhận diện mặt tốt hơn")

Chuyên viên AI cải thiện thuật toán trong file [faceDetector.js](faceDetector.js) tập trung vào các điểm sau:

1. **Độ nhạy và độ chính xác nhận diện khuôn mặt:**
   - Tích hợp mô hình nhận diện khuôn mặt Client-side nhẹ và chính xác:
     - **MediaPipe Face Detection** (Khuyên dùng: cực kỳ nhẹ, chạy mượt qua WebAssembly).
     - Hoặc **@vladmandic/face-api** / **TensorFlow.js BlazeFace**.
2. **Xử lý các góc mặt và ánh sáng:**
   - Tránh báo lỗi giả khi học sinh chỉ hơi nghiêng đầu hoặc môi trường ánh sáng yếu/ngược sáng.
3. **Phát hiện gian lận đa đối tượng:**
   - `NO_FACE`: Thí sinh cúi mặt, rời khỏi khung hình, che webcam.
   - `MULTIPLE_FACES`: Có từ 2 người trở lên xuất hiện trước màn hình thi.
   - `LOOKING_AWAY`: Thí sinh liên tục quay đầu nhìn sang hướng khác.
4. **Hiệu năng quét:**
   - Tối ưu việc xử lý canvas/frame ở nhịp **1 giây / 1 lần** để CPU/GPU trên máy học sinh hoạt động êm ái, không gây lag giao diện làm bài thi.
