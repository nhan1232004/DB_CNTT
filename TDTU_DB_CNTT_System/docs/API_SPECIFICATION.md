# TÀI LIỆU ĐẶC TẢ RESTful API HỆ THỐNG DB_CNTT
### KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG

---

## 1. TỔNG QUAN VỀ GIAO THỨC & XÁC THỰC

* **Base URL:** `http://localhost:3000/api`
* **Định dạng dữ liệu:** `application/json; charset=utf-8`
* **Tiêu đề xác thực (Authorization Header):**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
* **Cấu trúc JSON phản hồi chuẩn (ApiResponse):**
  ```json
  {
    "success": true,
    "message": "Thông báo kết quả thao tác",
    "data": { ... },
    "timestamp": "2026-10-27T10:00:00.000Z"
  }
  ```

---

## 2. DANH MỤC ENDPOINTS THEO PHÂN HỆ

### 2.1. Phân hệ Xác thực & Quản lý Tài khoản (`/api/auth`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/google-sso` | Public | Đăng nhập Google SSO TDTU (@tdtu.edu.vn hoặc @student.tdtu.edu.vn) |
| `POST` | `/api/auth/firebase-login` | Public | Đăng nhập Firebase Auth (UID & ID Token) |
| `GET` | `/api/auth/me` | Logged In | Lấy thông tin tài khoản và quyền hạn của token hiện tại |
| `GET` | `/api/auth/firebase-users` | Logged In | Lấy danh sách 95 tài khoản hệ thống |
| `POST` | `/api/auth/firebase-users` | Admin | Thêm mới hoặc đồng bộ tài khoản người dùng |
| `PUT` | `/api/auth/firebase-users/:uid/status` | Admin | Khóa hoặc mở khóa tài khoản người dùng |
| `POST` | `/api/auth/admin-role` | Admin | Cấp quyền hoặc thu hồi quyền Quản trị viên (Admin) cho Giảng viên |

### 2.2. Phân hệ Sinh viên & Thẩm định Điều kiện (`/api/students`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | Logged In | Lấy danh sách 91 sinh viên (hỗ trợ lọc theo `search`, `status`, `major`, `isDual`) |
| `GET` | `/api/students/summary` | Logged In | Lấy số liệu thống kê tổng quan (Tổng SV, Đi 2 môn, Đã có DN, Cần hỗ trợ) |
| `GET` | `/api/students/eligibility/:studentId` | Logged In | Thẩm định sinh viên có thuộc danh sách đợt thực tập HK1 hay không (**AUTH-03**) |
| `GET` | `/api/students/:studentId` | Logged In | Lấy thông tin chi tiết một sinh viên theo MSSV |

### 2.3. Phân hệ Khai báo Thực tập & Tra cứu MST (`/api/internship`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/internship/company-lookup/:taxCode` | Public | Tra cứu tự động thông tin doanh nghiệp qua Mã số thuế (MST) |
| `POST` | `/api/internship/declare` | Student | Nộp hoặc cập nhật phiếu khai báo nơi thực tập (hỗ trợ 1 hoặc 2 môn) |
| `GET` | `/api/internship/declaration/:studentId` | Logged In | Xem thông tin phiếu khai báo nơi thực tập của sinh viên |

### 2.4. Phân hệ Bảng tin 2 Tầng & Bóc tách Email Forward (`/api/bulletin`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bulletin` | Logged In | Lấy danh sách bài đăng bảng tin (hỗ trợ lọc `type=announcement` hoặc `type=recruitment_jd`) |
| `POST` | `/api/bulletin` | Lecturer | Đăng thông báo học vụ hoặc tạo tin tuyển dụng mới |
| `PUT` | `/api/bulletin/:id/status` | Lecturer | Phê duyệt 1-Click bản nháp JD sang trạng thái công khai (`published`) |
| `POST` | `/api/bulletin/parse-email` | Lecturer | Bóc tách tự động nội dung email forward của doanh nghiệp thành bản nháp JD |
| `POST` | `/api/bulletin/apply` | Student | Sinh viên nộp hồ sơ ứng tuyển trực tuyến vào vị trí thực tập |
| `GET` | `/api/bulletin/applications` | Lecturer | Giảng viên xem danh sách sinh viên đã nộp đơn ứng tuyển |

### 2.5. Phân hệ Biểu mẫu & Quy định (`/api/documents`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/documents` | Logged In | Lấy danh mục biểu mẫu chuẩn hóa BM-01 đến BM-04 và Quy chế 320h |
| `GET` | `/api/documents/:id` | Logged In | Lấy thông tin chi tiết một tài liệu theo mã |

### 2.6. Phân hệ Chuẩn Ngoại ngữ Xét Tốt nghiệp (`/api/certificates`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/certificates/standards` | Logged In | Danh mục chứng chỉ ngoại ngữ chuẩn xét tốt nghiệp TDTU (**CERT-01**) |
| `POST` | `/api/certificates/validate` | Logged In | Kiểm tra tính hợp lệ của chứng chỉ ngoại ngữ theo quy định TDTU |

### 2.7. Phân hệ Báo cáo Hỗ trợ Ra Quyết định (`/api/dashboard`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/widgets` | Logged In | Lấy danh sách siêu dữ liệu (metadata) các widget biểu đồ đã đăng ký |
| `POST` | `/api/dashboard/chart/dispatch` | Logged In | Định tuyến Chart Router thực thi plugin biểu đồ theo widgetId |
| `GET` | `/api/dashboard/chart/:widgetId` | Logged In | Đường dẫn rút gọn lấy dữ liệu biểu đồ theo widgetId |
