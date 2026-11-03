# TÀI LIỆU ĐẶC TẢ RESTful API HỆ THỐNG DB_CNTT (v3.2.0)
### KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG (TDTU)

---

## 1. TỔNG QUAN VỀ GIAO THỨC & XÁC THỰC

* **Base URL (Local):** `http://localhost:3000/api`
* **Ứng dụng Cloud:** https://dashboard-39cf8.web.app
* **Định dạng dữ liệu:** `application/json; charset=utf-8`
* **Tiêu đề xác thực (Authorization Header):**
  ```http
  Authorization: Bearer <JWT_OR_FIREBASE_TOKEN>
  ```
* **Cấu trúc JSON phản hồi chuẩn (`ApiResponse<T>`):**
  ```json
  {
    "success": true,
    "message": "Thông báo kết quả thao tác",
    "data": {},
    "timestamp": "2026-11-03T10:00:00.000Z"
  }
  ```

---

## 2. DANH MỤC ENDPOINTS THEO PHÂN HỆ

### 2.1. Phân hệ Xác thực & Quản lý Tài khoản (`/api/auth`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/google-sso` | Public | Đăng nhập Google SSO TDTU (`@tdtu.edu.vn` hoặc `@student.tdtu.edu.vn`) |
| `POST` | `/api/auth/firebase-login` | Public | Đăng nhập Firebase Auth (UID & ID Token) |
| `GET` | `/api/auth/me` | Logged In | Lấy thông tin tài khoản và mặt nạ quyền Prime RBAC hiện tại |
| `GET` | `/api/auth/firebase-users` | Logged In | Lấy danh sách tài khoản hệ thống |
| `POST` | `/api/auth/firebase-users` | Admin | Thêm mới hoặc đồng bộ tài khoản người dùng |
| `PUT` | `/api/auth/firebase-users/:uid/status` | Admin | Khóa hoặc mở khóa tài khoản người dùng |
| `POST` | `/api/auth/admin-role` | Admin | Cấp quyền hoặc thu hồi quyền Quản trị viên (Admin) cho Giảng viên |

### 2.2. Phân hệ Sinh viên, Lọc Học kỳ & Thẩm định Điều kiện (`/api/students`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | Logged In | Lấy danh sách sinh viên (hỗ trợ lọc `semester`, `search`, `status`, `major`, `isDual`) kèm thông tin doanh nghiệp đã đồng bộ |
| `GET` | `/api/students/summary` | Logged In | Lấy số liệu thống kê tổng quan theo học kỳ (`semester`) |
| `GET` | `/api/students/eligibility/:studentId` | Logged In | Thẩm định sinh viên có thuộc danh sách đợt thực tập hiện hành hay không (**AUTH-03**) |
| `GET` | `/api/students/:studentId` | Logged In | Lấy hồ sơ chi tiết 1 sinh viên kèm lịch sử khai báo doanh nghiệp |
| `POST` | `/api/students` | Lecturer / Admin | Thêm mới sinh viên vào học kỳ chỉ định (`semester`) |
| `PUT` | `/api/students/:studentId` | Lecturer / Admin | Cập nhật thông tin học vụ, GPA, doanh nghiệp hoặc trạng thái thực tập của sinh viên |
| `DELETE` | `/api/students/:studentId` | Lecturer / Admin | Xóa hồ sơ sinh viên khỏi danh sách đợt thực tập |
| `POST` | `/api/students/import` | Lecturer / Admin | Import hàng loạt danh sách sinh viên từ file Excel theo học kỳ (`replace` hoặc `append`) |

### 2.3. Phân hệ Khai báo Thực tập & Tra cứu MST (`/api/internship`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/internship/company-lookup/:taxCode` | Public | Tra cứu tự động thông tin pháp lý doanh nghiệp qua Mã số thuế (MST) |
| `POST` | `/api/internship/declare` | Student / Lecturer | Nộp hoặc cập nhật phiếu khai báo nơi thực tập (đồng bộ tự động MST, Vị trí, Mentor, SĐT Mentor, Địa chỉ sang hồ sơ sinh viên) |
| `GET` | `/api/internship/declaration/:studentId` | Logged In | Xem danh sách phiếu khai báo nơi thực tập của sinh viên |

### 2.4. Phân hệ Bảng tin 2 Tầng & Bóc tách Email Forward (`/api/bulletin`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bulletin` | Logged In | Lấy danh sách bài đăng bảng tin (lọc `type=announcement` hoặc `type=recruitment_jd`) |
| `POST` | `/api/bulletin` | Lecturer / Admin | Đăng thông báo học vụ (kích hoạt Popup thông báo góc dưới phải cho SV) hoặc tạo tin tuyển dụng |
| `PUT` | `/api/bulletin/:id/status` | Lecturer / Admin | Phê duyệt 1-Click bản nháp JD sang trạng thái công khai (`published`) |
| `POST` | `/api/bulletin/parse-email` | Lecturer / Admin | Bóc tách tự động nội dung email forward của doanh nghiệp thành bản nháp JD |
| `POST` | `/api/bulletin/apply` | Student | Sinh viên nộp hồ sơ ứng tuyển trực tuyến vào vị trí thực tập |
| `GET` | `/api/bulletin/applications` | Lecturer / Admin | Giảng viên xem danh sách sinh viên đã nộp đơn ứng tuyển |

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
| `GET` | `/api/dashboard/widgets` | Logged In | Lấy danh sách siêu dữ liệu (metadata) các widget biểu đồ đã đăng ký trong `WidgetRegistry` |
| `POST` | `/api/dashboard/chart/dispatch` | Logged In | Định tuyến `ChartRouter` thực thi plugin biểu đồ theo `widgetId` |
| `GET` | `/api/dashboard/chart/:widgetId` | Logged In | Đường dẫn rút gọn lấy dữ liệu biểu đồ theo `widgetId` |

### 2.8. Phân hệ Thông báo Học vụ & Anti-Spam Broadcast (`/api/notifications`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Logged In | Lấy danh sách thông báo phân quyền riêng tư theo tài khoản hiện tại |
| `GET` | `/api/notifications/unread-count` | Logged In | Đếm số lượng thông báo chưa đọc của người dùng |
| `GET` | `/api/notifications/audience-count` | Lecturer / Admin | Xem trước số lượng người nhận theo nhóm đối tượng (`targetGroup`) |
| `POST` | `/api/notifications/broadcast` | Lecturer / Admin | Phát thông báo học vụ đến nhóm đối tượng hoặc cá nhân sinh viên (tích hợp bộ lọc Anti-Spam 20s) |
| `PUT` | `/api/notifications/:id/read` | Logged In | Đánh dấu đã đọc một thông báo |
| `PUT` | `/api/notifications/mark-all-read` | Logged In | Đánh dấu đã đọc toàn bộ thông báo của người dùng |
