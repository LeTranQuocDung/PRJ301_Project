# LUCY E-Learning Platform

Dự án LUCY là nền tảng học ngoại ngữ trực tuyến (Tiếng Anh, Tiếng Trung, Tiếng Nhật) dành cho học viên và giảng viên, bao gồm các tính năng học qua Video, Live Room (Agora RTC), và Thi trắc nghiệm.

## 🛠 Hướng dẫn cài đặt cho người mới (Setup Guide)

Nếu bạn vừa tải (clone) source code này về máy, hãy làm theo các bước dưới đây để vận hành hệ thống.

### Bước 1: Cài đặt Cơ sở dữ liệu (SQL Server)

Hệ thống sử dụng SQL Server. Toàn bộ kịch bản tạo bảng và dữ liệu mẫu nằm trong thư mục `data_importer_toolkit/LucyImporter/sql/`.

1. Mở **SQL Server Management Studio (SSMS)** và kết nối vào Database Engine của bạn.
2. Lần lượt mở và chạy (Execute - F5) các file SQL theo đúng thứ tự sau:
   - `01_create_database.sql`: Khởi tạo Database `LUCY_DB` và toàn bộ cấu trúc bảng (Users, Lessons, Courses...).
   - `02_seed_data.sql`: Bơm dữ liệu cốt lõi như Ngôn ngữ và **Tài khoản Test**.
   - `03_migration.sql` (Nếu có): Cập nhật các thay đổi cấu trúc mới nhất.
   - `05_insert_data.sql`: Bơm toàn bộ dữ liệu bài học (Tiếng Anh, Trung, Nhật).

**🔑 Tài khoản Test mặc định (Đã mã hóa SHA-256):**
- **Admin:** Username: `admin` | Email: `admin@lucy.edu` | Pass: `123456`
- **Học viên:** Username: `student` | Email: `student@lucy.edu` | Pass: `123456`

*(Lưu ý: Nếu bạn muốn tự tạo mật khẩu mã hóa mới, hãy mở Terminal, cd vào `data_importer_toolkit` và chạy lệnh: `node generate_password.js <mật_khẩu_của_bạn>`)*

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
     - databaseName: `LUCY_DBS` (hoặc `LUCY_DB` tùy vào cấu hình DBConnection của máy bạn).

3. **Build & Deploy:**
   - Dùng IDE (Eclipse/NetBeans/IntelliJ) mở thư mục `LucyBackendAPI`.
   - Chạy `mvn clean package` để tạo file `.war`.
   - Deploy file `.war` lên Server **Apache Tomcat 10+** (đảm bảo Tomcat chạy ở port 8080).
   - API sẽ chạy tại: `http://localhost:8080/LucyBackendAPI/api/users/...`

---

### Bước 3: Cài đặt Frontend (React + Vite)

Frontend được build bằng ReactJS và Vite.

1. Đảm bảo máy đã cài đặt **Node.js** (Phiên bản 18+).
2. Mở Terminal / CMD tại thư mục gốc của project (nơi chứa file `package.json`).
3. Chạy lệnh cài đặt thư viện:
   ```bash
   npm install
   ```
4. Khởi động Web Server:
   ```bash
   npm run dev
   ```
5. Mở trình duyệt và truy cập vào đường link hiển thị trên Terminal (thường là `http://localhost:5173`).

---

### 🌟 Lưu ý
- **Giao diện:** Ứng dụng hỗ trợ Dark Theme tự động đồng bộ trên cả Admin và Student.
- **Tính năng Live Room:** Yêu cầu kết nối Internet để SDK Agora RTC hoạt động.