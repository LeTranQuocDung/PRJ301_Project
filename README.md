# LUCY E-Learning Platform

Dự án LUCY là nền tảng học ngoại ngữ trực tuyến (Tiếng Anh, Tiếng Trung, Tiếng Nhật) dành cho học viên và giảng viên, bao gồm các tính năng học qua Video, Live Room (Agora RTC), và Thi trắc nghiệm.

## 🛠 Hướng dẫn cài đặt cho người mới (Setup Guide)

Nếu bạn vừa tải (clone) source code này về máy, hãy làm theo các bước dưới đây để vận hành hệ thống.

### Bước 1: Cài đặt Cơ sở dữ liệu (SQL Server)

Hệ thống hiện tại đang vận hành trên cấu trúc Database V1 (`LUCY_DBS`). Bạn cần chạy các file SQL sau để khởi tạo:

1. Mở **SQL Server Management Studio (SSMS)** và kết nối vào Database Engine của bạn.
2. Mở và chạy (Execute - F5) file `data_importer_toolkit/database_setup.sql`. File này sẽ khởi tạo Database `LUCY_DBS` và bảng `Lessons` để chứa nội dung bài giảng.
3. Mở và chạy file `create_LUCY_DBS.sql` (nằm ở thư mục gốc). File này sẽ tạo bảng `Users` và tự động bơm 2 tài khoản Test vào hệ thống.

**🔑 Tài khoản Test mặc định (Đã mã hóa SHA-256):**
- **Admin:** Username: `admin` | Email: `admin@lucy.edu` | Pass: `123456`
- **Học viên:** Username: `student` | Email: `student@lucy.edu` | Pass: `123456`

*(Lưu ý: 5 file SQL nằm trong thư mục `data_importer_toolkit/LucyImporter/sql/` là cấu trúc Database V2 (`LUCY_DB`) siêu chi tiết dành cho tương lai. Hiện tại Backend chưa Migrate sang cấu trúc V2 này nên bạn không cần chạy chúng).*

---

### Bước 2: Cài đặt Backend (Java Tomcat & Maven)

Backend sử dụng Java Servlet, kết nối tới SQL thông qua JDBC.

1. **Bật TCP/IP trong SQL Server:**
   - Mở `SQL Server Configuration Manager`.
   - Chọn `SQL Server Network Configuration` > `Protocols for MSSQLSERVER`.
   - Bật `TCP/IP` (Enable) và đảm bảo cổng mặc định là `1433`. Restart lại dịch vụ SQL Server.

2. **Cấu hình kết nối DB:**
   - Mở file: `LucyBackendAPI/src/main/java/com/lucy/util/DBConnection.java`
   - Đảm bảo cấu hình Username và Password trong code trùng khớp với tài khoản `sa` trên máy của bạn. Mặc định là:
     - user: `sa`
     - password: `123456` *(Sửa lại nếu máy bạn dùng pass khác)*
     - databaseName: `LUCY_DBS`

3. **Build & Deploy:**
   - Dùng IDE (Eclipse/NetBeans/IntelliJ) mở thư mục `LucyBackendAPI`.
   - Chạy `mvn clean package` để tạo file `.war`.
   - Deploy file `.war` lên Server **Apache Tomcat 10+** (đảm bảo Tomcat chạy ở port 8080).
   - API sẽ chạy tại: `http://localhost:8080/LucyBackendAPI/api/users/...`

---

### Bước 3: Cài đặt Frontend (React + Vite)

Frontend được build bằng ReactJS và Vite.

1. Đảm bảo máy đã cài đặt **Node.js** (Phiên bản 18+).
2. Tới thư mục gốc của project (nơi chứa file `package.json`).
3. Khởi động nhanh bằng cách:
   - **Click đúp chuột vào file `start_web.bat`** (File này sẽ tự động cài đặt thư viện và mở server).
   - HOẶC mở Terminal chạy thủ công 2 lệnh: `npm install` và `npm run dev`.
4. Mở trình duyệt và truy cập vào đường link hiển thị (thường là `http://localhost:5173`).

---

### 🌟 Lưu ý
- **Giao diện:** Ứng dụng hỗ trợ Dark Theme tự động đồng bộ trên cả Admin và Student.
- **Tính năng Live Room:** Yêu cầu kết nối Internet để SDK Agora RTC hoạt động.
