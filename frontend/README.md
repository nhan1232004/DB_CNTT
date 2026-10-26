# RUN THE PROJECT MANUALLY
run the command: cd frontend && npm install 
then: npm run dev
# FOLDER ORGANIZATION
docs 
|
└─── plans
|___ Hinh`
frontend/
┣ public/                   # Chứa các file tĩnh (favicon, file tải về tĩnh...)
┣ src/
┃ ┣ assets/                 # Hình ảnh, icon, font chữ, CSS toàn cục
┃ ┃
┃ ┣ components/             # CÁC UI COMPONENT DÙNG CHUNG (Dumb Components)
┃ ┃ ┣ common/               # Nút bấm, Ô input, Modal, Loading spinner...
┃ ┃ ┗ layout/               # Header, Sidebar, Footer, Layout chuẩn...
┃ ┃
┃ ┣ config/                 # CẤU HÌNH HỆ THỐNG
┃ ┃ ┣ firebase.js           # Cấu hình kết nối Firebase
┃ ┃ ┗ constants.js          # Các hằng số (API_URL, ROLES, HTTP_STATUS...)
┃ ┃
┃ ┣ modules/                # 🚀 LÕI HỆ THỐNG: CÁC MODULE NGHIỆP VỤ ĐỘC LẬP
┃ ┃ ┣ auth/                 # Phân hệ Xác thực
┃ ┃ ┃ ┗ Login.jsx           # (File Login của chúng ta sẽ chuyển vào đây)
┃ ┃ ┣ student/              # Phân hệ Sinh viên
┃ ┃ ┃ ┣ StudentDashboard.jsx
┃ ┃ ┃ ┗ RegistrationForm.jsx
┃ ┃ ┣ lecturer/             # Phân hệ Giảng viên
┃ ┃ ┃ ┗ LecturerDashboard.jsx
┃ ┃ ┣ admin/                # Phân hệ Quản trị (Tách riêng logic hệ thống)
┃ ┃ ┗ company/              # Phân hệ Doanh nghiệp (Thư mục dự trù tương lai)
┃ ┃
┃ ┣ services/               # API ADAPTERS (Giao tiếp với Microservices Backend)
┃ ┃ ┣ authService.js        # Giao tiếp với Auth Service (Xác thực, phân quyền)
┃ ┃ ┣ studentService.js     # Giao tiếp với Internship Service (Khai báo, GGT)
┃ ┃ ┗ externalService.js    # Giao tiếp với API ngoài (Mã số thuế...)
┃ ┃
┃ ┣ routes/                 # ĐIỀU HƯỚNG & PHÂN QUYỀN ĐỘNG (Dynamic RBAC)
┃ ┃ ┣ AppRouter.jsx         # Cấu hình toàn bộ đường dẫn web
┃ ┃ ┗ PrivateRoute.jsx      # Component chặn cửa (Kiểm tra token & role)
┃ ┃
┃ ┣ store/                  # QUẢN LÝ TRẠNG THÁI (State Management - Context/Zustand)
┃ ┃ ┗ authContext.jsx       # Lưu trữ Token và Role của user đang đăng nhập
┃ ┃
┃ ┣ utils/                  # CÁC HÀM HỖ TRỢ DÙNG CHUNG
┃ ┃ ┣ formatters.js         # Hàm định dạng ngày tháng, tiền tệ...
┃ ┃ ┗ validators.js         # Hàm kiểm tra tính hợp lệ (Regex email, mã số...)
┃ ┃
┃ ┣ App.jsx                 # Điểm khởi tạo ứng dụng (Gắn Provider, Router)
┃ ┗ main.jsx                # Nơi React render vào DOM (index.html)
┃
┣ index.html
┣ package.json
┗ vite.config.js