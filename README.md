
# 🚀 Job Portal Microservices (Hire Heaven)

Đây là một nền tảng tìm kiếm việc làm hiện đại được xây dựng dựa trên kiến trúc **Microservices**. Hệ thống tích hợp các tính năng nâng cao như AI để phân tích CV, gợi ý nghề nghiệp, hệ thống thông báo thời gian thực qua Kafka, và thanh toán trực tuyến.

## 🌟 Tính năng chính (Key Features)

*   **Phân quyền người dùng:** Hai role riêng biệt (Job Seeker - Người tìm việc & Recruiter - Nhà tuyển dụng).
*   **AI Power (Trí tuệ nhân tạo):**
    *   **Resume Analyzer:** Phân tích CV và chấm điểm ATS bằng Google Gemini AI.
    *   **Career Guide:** Gợi ý lộ trình nghề nghiệp dựa trên kỹ năng của người dùng.
*   **Hệ thống việc làm:** Đăng tin tuyển dụng, quản lý công ty, ứng tuyển, lọc công việc theo tiêu chí.
*   **Real-time Notifications:** Gửi email thông báo trạng thái ứng tuyển (Accepted/Rejected) thông qua **Apache Kafka**.
*   **Subscription (Gói thành viên):** Tích hợp cổng thanh toán **VNPAY** để nâng cấp tài khoản (ưu tiên hiển thị hồ sơ).
*   **Bảo mật:** Xác thực JWT, Password Hashing (Bcrypt), và bảo vệ API Gateway.

## 🏗️ Kiến trúc hệ thống (Tech Stack)

Dự án sử dụng các công nghệ mới nhất hiện nay:

*   **Frontend:** Next.js (TypeScript), Tailwind CSS, Shadcn UI.
*   **Backend:** Node.js, Express.js (TypeScript).
*   **Database:** PostgreSQL (Sử dụng Neon DB - Serverless).
*   **Message Broker:** Apache Kafka (Chạy trên Docker).
*   **Caching & Session:** Redis (Upstash).
*   **File Storage:** Cloudinary (Lưu trữ ảnh đại diện, CV PDF).
*   **AI Model:** Google Gemini API.
*   **Deployment:** AWS EC2, Docker & Docker Hub.

## 🧩 Danh sách các Microservices

Hệ thống được chia nhỏ thành 5 service độc lập, giúp dễ dàng mở rộng và bảo trì:

| Service Name | Port | Nhiệm vụ chính |
| :--- | :--- | :--- |
| **Auth Service** | `5000` | Đăng ký, Đăng nhập, Quên mật khẩu, JWT Token. |
| **Utils Service** | `5001` | Xử lý Upload file, Gửi Email (Kafka Consumer), AI Features. |
| **User Service** | `5002` | Quản lý Profile, Cập nhật CV, Kỹ năng. |
| **Job Service** | `5003` | Quản lý Tin tuyển dụng, Công ty, Ứng tuyển. |
| **Payment Service** | `5004` | Xử lý thanh toán Razorpay, Đăng ký gói Premium. |
| **Frontend** | `3000` | Giao diện người dùng (Next.js). |

---

## 🛠️ Hướng dẫn cài đặt & Chạy Local (Setup Guide)

### 1. Yêu cầu tiên quyết (Prerequisites)
*   Node.js (v18 trở lên).
*   Docker Desktop (Để chạy Kafka).
*   Tài khoản: Neon DB (Postgres), Cloudinary, Google AI Studio (Gemini), Upstash (Redis), Razorpay.

### 2. Cài đặt biến môi trường (.env)
Tạo file `.env` trong từng thư mục service tương ứng và điền các thông tin sau (Tham khảo file `.env.example` nếu có):

**Ví dụ cho Auth Service:**
```env
PORT=5000
DB_URL=postgresql://... (Neon DB URL)
JWT_SECRET=your_secret_key
REDIS_URL=redis://... (Upstash URL)
KAFKA_BROKER=localhost:9092
```
*(Làm tương tự cho các service khác với các key tương ứng như CLOUDINARY_CLOUD_NAME, GEMINI_API_KEY, RAZORPAY_KEY_ID...)*

### 3. Khởi chạy Kafka (Bắt buộc)
Kafka đóng vai trò trung chuyển tin nhắn gửi mail. Chúng ta dùng Docker để chạy nó nhanh chóng mà không cần cài đặt Java phức tạp.

Mở terminal và chạy lệnh sau (đảm bảo Docker Desktop đang bật):
```bash
docker run -p 9092:9092 apache/kafka:3.7.0
```
*(Lưu ý: Sử dụng image Apache Kafka mới nhất hỗ trợ KRaft mode để không cần Zookeeper).*

### 4. Cài đặt và chạy các Service
Mở 6 terminal riêng biệt cho mỗi service và chạy các lệnh sau:

**Backend (Auth, User, Job, Utils, Payment):**
```bash
cd services/<service-name>
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Truy cập `http://localhost:3000` để trải nghiệm ứng dụng.

---

## 🐳 Quy trình Deployment (AWS EC2 & Docker)

Dự án đã được đóng gói (Containerized) để chạy trên môi trường Production:

1.  **Dockerize:** Mỗi service đều có `Dockerfile` riêng để build image.
2.  **Docker Hub:** Đẩy (Push) các image lên Docker Hub.
3.  **AWS EC2:**
    *   Thuê một instance EC2 (Ubuntu).
    *   Cài đặt Docker trên EC2.
    *   Pull các image từ Docker Hub về.
    *   Chạy container với lệnh `docker run` kèm theo biến môi trường (`--env-file`).

---

## 📚 Kiến thức thu được từ dự án này (For Students)

*   **Microservices Communication:** Hiểu cách các service giao tiếp qua REST API và Kafka (Async communication).
*   **Database Management:** Làm việc với Relational Database (PostgreSQL) và quan hệ giữa các bảng (Foreign Keys, Joins).
*   **DevOps Mindset:** Sử dụng Docker để chuẩn hóa môi trường từ lúc Code đến lúc Deploy.
*   **System Design:** Tách biệt logic xử lý (Separation of Concerns) - Ví dụ: Auth chỉ lo đăng nhập, Utils chỉ lo gửi mail.

---

### 👨‍💻 Author
**[binhdevk4]** 



