# Danh Sách Tài Khoản Kiểm Thử Hệ Thống (Prime RBAC)

Tài liệu này cung cấp danh sách các tài khoản nội bộ Trường Đại học Tôn Đức Thắng (`@tdtu.edu.vn` và `@student.tdtu.edu.vn`) phục vụ công tác kiểm thử và nghiệm thu hệ thống **Cổng Thông Tin Thực Tập Doanh Nghiệp Khoa CNTT**.

> [!IMPORTANT]
> - Toàn bộ các nút truy cập nhanh ngoài màn hình đăng nhập đã được **ẩn hoàn toàn** để đảm bảo tính bảo mật thực tế.
> - Để đăng nhập kiểm thử bằng tài khoản bên dưới, vui lòng chọn tab **"Tài khoản Nội bộ TDTU"** tại màn hình đăng nhập và nhập đúng **Email + Mật khẩu**.
> - Hệ thống **chặn tuyệt đối** mọi email ngoài tên miền TDTU (như `@gmail.com`), không tự động nhảy vào tài khoản mẫu khi hủy đăng nhập, và khóa hoàn toàn việc chuyển đổi tài khoản qua URL hoặc can thiệp LocalStorage.

---

## 1. Quản Trị Viên / Ban Chủ Nhiệm Khoa (Admin — Toàn quyền `Mask = 2310`)

| STT | Họ và Tên | Email đăng nhập | Mật khẩu | Vai trò & Quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **GV. Dương Hữu Phúc** | `duonghuuphuc@tdtu.edu.vn` | `Admin@123456` *(hoặc Google TDTU SSO)* | Quản trị viên Khoa CNTT (`isAdmin: true`, `RoleKey: thay_phuc`) — Toàn quyền hệ thống, cấu hình học kỳ, import/export, phân quyền Prime RBAC |
| 2 | **GV. Phạm Văn C** | `phamvanc@tdtu.edu.vn` | `Admin@123456` | Quản trị viên Khoa CNTT (`isAdmin: true`) — Toàn quyền quản trị & phê duyệt học vụ |

---

## 2. Giảng Viên Phụ Trách Thực Tập (Lecturer)

| STT | Họ và Tên | Email đăng nhập | Mật khẩu | Vai trò & Quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **GV. Nguyễn Văn A** | `nguyenvana@tdtu.edu.vn` | `Gv@123456` | Giảng viên điều phối — Xem thống kê, quản lý biểu đồ, theo dõi danh sách & hồ sơ doanh nghiệp của SV, duyệt chứng chỉ, đăng thông báo |
| 2 | **GV. Trần Minh Lan** | `tranminhlan@tdtu.edu.vn` | `Gv@123456` | Giảng viên Bộ môn HTTT & Mạng — Theo dõi sinh viên, thẩm định hồ sơ & chứng chỉ |
| 3 | **GV. Trần Văn B** | `tranvanb@tdtu.edu.vn` | `Gv@123456` | Giảng viên Bộ môn KHMT — Theo dõi sinh viên, thẩm định hồ sơ & chứng chỉ |

---

## 3. Sinh Viên Đủ Điều Kiện Trong Học Kỳ (Enrolled Student — `HK1 2026–2027`)

| STT | Họ và Tên | MSSV | Email đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Nguyễn Hữu Nhân** | `522H0045` | `522h0045@student.tdtu.edu.vn` | `Sv@123456` *(hoặc `522H0045`)* | Khai báo doanh nghiệp thực tập, nộp chứng chỉ ngoại ngữ, cập nhật CV, nhận thông báo học vụ |
| 2 | **Võ Duy Trí** | `51900839` | `51900839@student.tdtu.edu.vn` | `Sv@123456` *(hoặc `51900839`)* | Sinh viên trong danh sách 91 SV thực tế (Lớp `19050402` - Hệ thống thông tin) |
| 3 | **Nguyễn Minh Anh** | `522H0001` | `522h0001@student.tdtu.edu.vn` | `Sv@123456` *(hoặc `522H0001`)* | Sinh viên trong kỳ — Khai báo thực tập, nộp chứng chỉ & xem bảng tin |
| 4 | **91 SV thực tế khác** | `<MSSV>` | `<mssv>@student.tdtu.edu.vn` | `Sv@123456` *(hoặc `<MSSV>`)* | Toàn bộ sinh viên thuộc danh sách thực tập HK1 2026–2027 |

---

## 4. Sinh Viên Ngoài Kỳ / Chưa Đủ Điều Kiện (Out-of-Semester Student)

| STT | Họ và Tên | MSSV | Email đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Nguyễn Văn Ngoài Kỳ** | `52100999` | `52100999@student.tdtu.edu.vn` | `Sv@123456` *(hoặc `52100999`)* | Chưa có trong danh sách đăng ký học phần kỳ hiện tại — Chỉ được xem Cẩm nang Thực tập & Bảng tin, khóa tính năng gửi phiếu khai báo |

---

## 5. Hướng Dẫn Kiểm Thử Kịch Bản Cô Lập Học Kỳ & Đồng Bộ Real-Time

### Kịch bản 1: Kiểm thử Cô lập Khai báo Thực tập theo Học kỳ (Sinh viên)
1. Đăng nhập tài khoản sinh viên `522h0045@student.tdtu.edu.vn` (Mật khẩu: `Sv@123456`).
2. Tại Học kỳ 1 (`HK1 2026–2027`): Khai báo đơn vị thực tập (ví dụ: FPT Software, MST `0101248141`). Hệ thống ghi nhận trạng thái đã khai báo.
3. Chuyển sang Học kỳ 2 (`HK2 2026–2027`) từ dropdown học kỳ trên Header:
   - Giao diện form khai báo tự động làm mới hoàn toàn.
   - Trạng thái hiển thị: "Chưa khai báo", danh sách khai báo rỗng, không bị đọng thông tin của HK1.
4. Chuyển lại Học kỳ 1:
   - Toàn bộ thông tin thực tập của HK1 được khôi phục nguyên vẹn, chứng minh cơ chế cô lập dữ liệu theo học kỳ hoạt động chính xác 100%.

### Kịch bản 2: Kiểm thử Đồng bộ Hai Chiều Sinh viên ↔ Giảng viên (Real-Time < 500ms)
1. Mở song song hai cửa sổ trình duyệt:
   - Cửa sổ A: Đăng nhập Sinh viên `522h0045@student.tdtu.edu.vn`.
   - Cửa sổ B: Đăng nhập Giảng viên `duonghuuphuc@tdtu.edu.vn`, mở trang **Quản lý Sinh viên** (`/students`).
2. Ở Cửa sổ A: Sinh viên gửi hoặc cập nhật phiếu khai báo nơi thực tập.
3. Ở Cửa sổ B: Danh sách và popup hồ sơ sinh viên phía Giảng viên tự động cập nhật ngay lập tức mà không cần tải lại trang (nhờ Cloud Firestore listener và BroadcastChannel).
