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
| 1 | **TS. Phạm Văn C** | `phamvanc@tdtu.edu.vn` | `Admin@123456` | Quản trị viên Khoa CNTT (`isAdmin: true`) — Toàn quyền hệ thống, cấu hình học kỳ, import/export, phân quyền Prime RBAC |
| 2 | **TS. BCN Khoa CNTT** | `thayphuc@tdtu.edu.vn` | `Admin@123456` | Ban Chủ nhiệm Khoa (`isAdmin: true`) — Toàn quyền quản trị & phê duyệt học vụ |

---

## 2. Giảng Viên Phụ Trách Thực Tập (Lecturer)

| STT | Họ và Tên | Email đăng nhập | Mật khẩu | Vai trò & Quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **ThS. Nguyễn Văn A** | `nguyenvana@tdtu.edu.vn` | `Gv@123456` | Giảng viên điều phối — Xem thống kê, quản lý biểu đồ, theo dõi danh sách & hồ sơ doanh nghiệp của SV, duyệt chứng chỉ, đăng thông báo |
| 2 | **ThS. Trần Minh Lan** | `tranminhlan@tdtu.edu.vn` | `Gv@123456` | Giảng viên Bộ môn HTTT & Mạng — Theo dõi sinh viên, thẩm định hồ sơ & chứng chỉ |
| 3 | **TS. Trần Văn B** | `tranvanb@tdtu.edu.vn` | `Gv@123456` | Giảng viên Bộ môn KHMT — Theo dõi sinh viên, thẩm định hồ sơ & chứng chỉ |

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
