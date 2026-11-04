# TDTU KHOA CONG NGHE THONG TIN
## HE THONG QUAN LY THUC TAP VA DASHBOARD HO TRO RA QUYET DINH (DB_CNTT)
### CONG THONG TIN HOC PHAN KIEN TAP CONG NGHIEP (KTCN) VA TAP SU NGHE NGHIEP (TSNN)

[![Node.js Version](https://img.shields.io/badge/Node.js-v24.19.0-339933?logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25_.ts_%2F_.tsx-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v10_Hosting_%26_Auth-FFCA28?logo=firebase)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Automated Tests](https://img.shields.io/badge/Automated_Tests-24%2F24_Passed-16a34a)](#)
[![Git Branch](https://img.shields.io/badge/Git_Branch-522H0045-003087)](#)

- **Dia chi ung dung truc tuyen (Live Production):** https://dashboard-39cf8.web.app
- **May chu phat trien cuc bo (Local Server):** `http://localhost:3000`
- **Nhanh ma nguon chinh thuc:** `522H0045`
- **Phien ban phat hanh:** `v3.2.0 (100% TypeScript Enterprise Release)`

---

## 1. TONG QUAN DU AN

He thong DB_CNTT la giai phap phan mem quan ly hoc vu chuyen nghiep duoc xay dung 100% bang ngon ngu TypeScript (`.ts` va `.tsx`), chuan hoa toan dien quy trinh to chuc, quan ly va giam sat thuc tap doanh nghiep tai Khoa Cong nghe Thong tin, Truong Dai hoc Ton Duc Thang (TDTU).

He thong giai quyet tap trung cac nghiep vu quan ly cho hai hoc phan dao tao cot loi:
1. **Kien tap Cong nghiep (KTCN):** 160 gio tiep can va thuc hanh thuc te tai doanh nghiep.
2. **Tap su Nghe nghiep (TSNN):** 320 gio thuc tap chuyen sau va lam viec tai don vi tiep nhan.
3. **Hoc phan Song song:** Ho tro sinh vien du dieu kien hoc tap dang ky dong thoi ca hai hoc phan trong cung mot hoc ky.

### Muc tieu chien luoc:
- **So hoa quy trinh hoc vu:** Xoa bo hoan toan quy trinh xu ly giay thu cong, chuyen doi sang khai bao truc tuyen, tra cuu phap ly doanh nghiep qua Ma so thue (MST), nop va tham dinh chung chi ngoai ngu tot nghiep, tiep nhan JD tuyen dung va cap Giay gioi thieu tu dong.
- **Ho tro ra quyet dinh (Decision Support System):** Cung cap Bang dieu khien tong the giup Ban Chu nhiem Khoa va Giang vien co van nhan dien som cac sinh vien gap kho khan (chua co don vi tiep nhan, can Khoa ho tro dieu phoi, chua dat chuan B1) de phan bo doanh nghiep kip thoi.
- **Kien truc huong dich vu ben vung:** Thiet ke theo mo hinh Modular Monolith huong Service-Oriented (SOA), ap dung co che Chart Router va Adapter Pattern dam bao he thong co kha nang mo rong, bao tri va de dang ban giao trong giai doan 2026 - 2031.

---

## 2. KIEN TRUC HE THONG VA NGUYEN TAC THIET KE

### 2.1. So do Luong Hoat dong Tong the

```text
+-----------------------------------------------------------------------------+
|                           TRINH DUYET KHACH (CLIENT)                        |
|        React 18 Single Page Application (100% TypeScript: 22 Modules)       |
|   Tailwind CSS Enterprise DS + TabErrorBoundary + LocalStorage / In-Memory  |
+-----------------------------------------------------------------------------+
               |                                            ^
               | HTTP / JSON API (Port 3000)                | Real-time Sync
               v                                            v (onSnapshot)
+---------------------------------------------+  +----------------------------+
|            NODE.JS API GATEWAY              |  |   CLOUD FIRESTORE SYNC     |
|       HTTP Router Pipeline & CORS           |  | Multi-Device Notification  |
| Prime RBAC (Tich so nguyen to: 2,3,5,7,...) |  | Live Declarations & Certs  |
+---------------------------------------------+  +----------------------------+
       |                               |
       v                               v
+-----------------------------+  +--------------------------------------------+
|     DOMAIN CONTROLLERS      |  |         REPORTING DECISION ENGINE          |
| - Auth Controller           |  |            (CHART ROUTER)                  |
| - Students Controller       |  |  ChartRouter.dispatch(widgetId, options)   |
| - Internship Controller     |  +--------------------------------------------+
| - Certificates Controller   |                        |
| - Documents Controller      |                        v
| - Bulletin Controller       |          +----------------------------+
+-----------------------------+          |      WIDGET REGISTRY       |
               |                         |    (Singleton Catalog)     |
               v                         +----------------------------+
+-----------------------------+                        |
|      DOMAIN SERVICES        |          +-------------+--------------+
| - auth.service.ts           |          |                            |
| - students.service.ts       |          v                            v
| - internship.service.ts     |  +----------------+          +----------------+
| - notification.service.ts   |  | StatusPieChart |          | TopCompanies   |
| - email-parser.ts           |  |     Plugin     |          |  Chart Plugin  |
| - documents.service.ts      |  +----------------+          +----------------+
+-----------------------------+          |                            |
       |               |                 +-------------+--------------+
       |               |                               |
       v               v                               v
+--------------+ +--------------------+ +-------------------------------------+
|  SQLite DB   | | Tax Lookup Adapter | |         COMPANY DATA ADAPTER        |
|  (WAL Mode)  | | Tra cuu MST DN     | |      Anti-Corruption Layer          |
| db_cntt.db   | | Phong Chuyen trach | | Chuan hoa Schema V1 va Schema V2    |
+--------------+ +--------------------+ +-------------------------------------+
```

### 2.2. Cac Nguyen tac Kien truc Cot loi

1. **Clean 3-Tier Architecture:**
   - He thong duoc phan tach nghiem ngat qua cac tang: `routes/` -> `middlewares/` -> `controllers/` -> `services/` -> `models/`.
   - Controller chi dam nhan doc request va tra response; Service chi chua pure business logic; Model chi dinh nghia schema va hop dong du lieu.

2. **Kien truc Chart Router & Widget Registry (Plug-and-Play Engine):**
   - Tuan thu triet de nguyen ly Open-Closed Principle (OCP): He thong mo cho viec mo rong (Them bieu do moi) nhung dong voi viec sua doi ma nguon cot loi.
   - Khi bo sung mot bao cao moi, lap trinh vien chi can them 01 file plugin `.ts` doc lap trong thu muc `services/charts/`. Server tu dong phat hien va frontend tu dong render the bieu do tren Dashboard ma khong can sua controller hay router.

3. **Adapter Pattern (Anti-Corruption Layer):**
   - Cach ly su bien dong ve dinh dang du lieu nguon tu cac phong ban khac nhau.
   - `CompanyDataAdapter` tu dong nhan dien va chuan hoa ca du lieu kieu cu (Schema V1: `sector_name`, `total`) va kieu moi (Schema V2: `summary.industryName`, `companies`) ve mot kieu hop dong duy nhat `IndustryStatistic[]`.

4. **Phan quyen Toan hoc Prime Product RBAC:**
   - Ap dung Dinh ly Co ban cua So hoc: Moi quyen han duoc gan bang mot so nguyen to doc lap (`Read=2`, `Create=3`, `Update=5`, `Delete=7`, `ScopeAll=11`, `Import=13`, `Export=17`, `Approve=19`).
   - Phan quyen cho mot vai tro la phep Nhan cac thua so nguyen to. Kiem tra quyen la phep Chia het (Modulo 0). Phep toan nay dem lai toc do xu ly 0ms va kha nang mo rong vo han ma khong gay xung dot ma tran quyen.

5. **He thong Dong bo Da thiet bi & Cache 2 tang:**
   - Ket hop Cache In-Memory (<0.5ms) va LocalStorage voi Firestore Real-time listener (`onSnapshot`).
   - Khi sinh vien khai bao tren thiet bi di dong, giang vien xem tren may tinh de ban duoc cap nhat ngay lap tuc ma khong can tai lai trang.

6. **Kha nang Cach ly Loi (TabErrorBoundary):**
   - Vung noi dung giao dien duoc bọc trong bo dem `TabErrorBoundary`. Neu mot tab gap su co tam thoi khi tai du lieu mang, thanh menu Sidebar va Navbar van hoat dong 100%, tuyet doi khong gay sup ung dung hoac huy phien dang nhap cua nguoi dung.

---

## 3. NGAN XEP CONG NGHE (TECHNOLOGY STACK)

| Phan he | Cong nghe su dung | Phien ban | Muc dich su dung |
| :--- | :--- | :---: | :--- |
| **Backend Runtime** | Node.js Native | `v24.19.0` | Thuc thi truc tiep TypeScript bang co `--experimental-strip-types`, khong can bien dich trung gian |
| **Ngon ngu chu dao** | TypeScript | `v5.5+` | Dong nhat 100% types tai ca Backend, Frontend va Adapter Code |
| **Co so Du lieu Local** | SQLite (`node:sqlite`) | Embedded | Che do WAL (Write-Ahead Logging), ho tro truy van bat dong bo toc do cao |
| **Co so Du lieu Cloud** | Google Cloud Firestore | `v10.13.0` | Dong bo du lieu thoi gian thuc giua cac thiet bi cua giang vien va sinh vien |
| **Frontend Framework** | React SPA (Functional) | `v18.3.1` | Khung giao dien nguoi dung theo kien truc Component-driven |
| **Styling & Design** | Tailwind CSS Enterprise | CDN | Trien khai bo nhan dien TDTU Design System: Navy `#003087`, Red `#dc2626`, White `#ffffff` |
| **Excel Engine** | SheetJS (`xlsx`) | `v0.18.5` | Doc, phan tich va ket xuat file Excel da sheet (KTCN & TSNN) ngay tai trinh duyet |
| **Cloud Hosting** | Firebase Hosting | Serverless | Trien khai Frontend SPA truc tuyen 24/7 tren mang luoi CDN toan cau |
| **Kiem thu Tu dong** | Node.js Test Runner | Native | Bo test suite 24 tests chay nhanh trong ~1.3s, khong can cai Jest/Mocha |
| **Container hoa** | Docker & Docker Compose | Multi-stage | Dong goi toan bo he thong de trien khai nhat quan tren moi may chu |

---

## 4. CAU TRUC THU MUC CHUAN CHUYEN NGHIEP

```text
Dashoard_TSNN-main/
|-- TDTU_DB_CNTT_System/
|   |-- backend/
|   |   |-- src/
|   |   |   |-- config/
|   |   |   |   `-- env.config.ts                  # Bien moi truong va cau hinh cong mang
|   |   |   |-- controllers/                       # 8 Controllers tiep nhan va tra loi HTTP
|   |   |   |   |-- auth.controller.ts
|   |   |   |   |-- bulletin.controller.ts
|   |   |   |   |-- certificates.controller.ts
|   |   |   |   |-- documents.controller.ts
|   |   |   |   |-- internship.controller.ts
|   |   |   |   |-- notification.controller.ts
|   |   |   |   |-- reporting.controller.ts
|   |   |   |   `-- students.controller.ts
|   |   |   |-- data/                              # CSDL SQLite va tap du lieu 91 sinh vien
|   |   |   |   |-- db_cntt.sqlite
|   |   |   |   `-- real-students.json
|   |   |   |-- middlewares/                       # Middleware xac thuc va Prime RBAC
|   |   |   |   |-- middleware.ts
|   |   |   |   `-- prime-rbac.ts
|   |   |   |-- models/                            # Schema du lieu va hop dong kien truc
|   |   |   |   |-- reporting.contracts.ts
|   |   |   |   |-- sqlite.db.ts
|   |   |   |   `-- types.ts
|   |   |   |-- routes/                            # Dinh tuyen RESTful API
|   |   |   |   |-- api.router.ts
|   |   |   |   `-- http-router.ts
|   |   |   |-- services/                          # Cac phan he dich vu nghiep vu doc lap
|   |   |   |   |-- charts/                        # Thu muc chua cac Plugin Bieu do (OCP)
|   |   |   |   |   |-- major-distribution.plugin.ts
|   |   |   |   |   |-- salary-trend.plugin.ts
|   |   |   |   |   |-- status-pie.plugin.ts
|   |   |   |   |   `-- top-companies.plugin.ts
|   |   |   |   |-- auth.service.ts
|   |   |   |   |-- bulletin.service.ts
|   |   |   |   |-- certificates.service.ts
|   |   |   |   |-- chart-router.ts                # Bo dinh tuyen bieu do (Chart Router)
|   |   |   |   |-- company-data.adapter.ts        # Adapter chuan hoa da Schema V1 / V2
|   |   |   |   |-- documents.service.ts
|   |   |   |   |-- email-parser.ts                # Boc tach tin tuyen dung tu email forward
|   |   |   |   |-- internship.service.ts
|   |   |   |   |-- notification.service.ts        # Phat thong bao hoc vu va chong Spam
|   |   |   |   |-- students.service.ts
|   |   |   |   |-- tax-lookup.adapter.ts          # Tra cuu phap ly doanh nghiep qua MST
|   |   |   |   `-- widget-registry.ts             # Danh muc bieu do Singleton
|   |   |   |-- utils/
|   |   |   |   `-- response.ts
|   |   |   `-- server.ts                          # Diem khoi chay Backend Server (Port 3000)
|   |   |-- tests/                                 # Kiem thu tu dong API va Prime RBAC (9/9 Pass)
|   |   |   |-- api.test.ts
|   |   |   `-- prime-rbac.test.ts
|   |   |-- package.json
|   |   `-- tsconfig.json
|   `-- frontend/                                  # React 18 TypeScript Single Page Application
|       |-- src/
|       |   |-- assets/                            # Logo TDTU va hinh anh he thong
|       |   |-- components/
|       |   |   |-- common/                        # AdminNotificationModal, Navbar, Sidebar
|       |   |   `-- student/                       # StudentEligibilityBanner
|       |   |-- config/
|       |   |   `-- firebase.config.ts             # Ket noi Firebase Auth va Cloud Firestore
|       |   |-- pages/                             # 14 Trang chuc nang nghiep vu (.tsx)
|       |   |   |-- AccountsPage.tsx               # Cai dat he thong va Prime RBAC
|       |   |   |-- BulletinPage.tsx               # Bang tin tuyen dung va Thong bao hoc vu
|       |   |   |-- CertificatesPage.tsx           # Ho so chung chi tieng Anh tot nghiep B1
|       |   |   |-- DashboardPage.tsx              # Bang dieu khien ra quyet dinh
|       |   |   |-- DeclarationPage.tsx            # Khai bao thuc tap 3 nhanh va tra cuu MST
|       |   |   |-- DocumentsPage.tsx              # Trung tam in an A4 (Bo 6 bieu mau)
|       |   |   |-- EmailJdPage.tsx                # Phe duyet JD tu dong tu Email
|       |   |   |-- ExportDataPage.tsx             # Xuat bao cao hoc vu Excel
|       |   |   |-- HandbookPage.tsx               # Cam nang thuc tap va quy che 320 gio
|       |   |   |-- ImportDataPage.tsx             # Nap danh sach sinh vien Excel dau ky
|       |   |   |-- LoginPage.tsx                  # Dang nhap Google SSO va Firebase
|       |   |   |-- ProfilePage.tsx                # Ho so ca nhan sinh vien va link CV
|       |   |   |-- SemestersPage.tsx              # Quan ly ke hoach hoc ky va han chot
|       |   |   `-- StudentsPage.tsx               # Quan ly danh sach 91 sinh vien thuc te
|       |   |-- services/
|       |   |   |-- api.client.ts                  # HTTP Client, Firestore Sync va Cache
|       |   |   `-- prime-rbac.ts                  # Kiem tra quyen phia Client
|       |   |-- types/
|       |   |   `-- index.ts                       # Dinh nghia Type hop dong dung chung
|       |   |-- App.tsx                            # Bo dinh tuyen tong va TabErrorBoundary
|       |   `-- index.css                          # Style sheet chuan TDTU va Media Print A4
|       |-- index.html                             # Host HTML nap 22 TypeScript Modules
|       |-- package.json
|       `-- tsconfig.json
|-- Adapter_Code/
|   `-- reporting-adapter-demo/                    # Goi Demo kien truc Chart Router va Adapter
|       |-- src/
|       |   |-- chart-plugins.ts                   # Cac bieu do Pie va Bar dung chung Provider
|       |   |-- chart-router.ts                    # Luong co Chart Router (Port 3102)
|       |   |-- company-adapter.ts                 # Adapter xu ly Schema V1 va Schema V2
|       |   |-- contracts.ts                       # Interface Provider va Chart
|       |   |-- demo-page.ts                       # Giao dien so sanh truc quan 2 luong
|       |   |-- main.ts                            # Entrypoint khoi chay 3 services
|       |   |-- mock-company-service.ts            # Server upstream gia lap (Port 3200)
|       |   |-- reporting-server.ts                # Server reporting (Port 3101 va 3102)
|       |   |-- shared-http-client.ts              # Http client ho tro timeout va loi mang
|       |   `-- widget-registry.ts                 # Luong khong Router (Port 3101)
|       |-- tests/
|       |   `-- demo.test.ts                       # 15 Bai kiem thu tu dong Adapter
|       `-- README.md
|-- docs/                                          # He thong tai lieu ky thuat va ban giao
|   |-- architecture/                              # So do thiet ke Sequence va Routing Flow
|   |-- plans/                                     # Ke hoach phat trien du an
|   |-- API_SPECIFICATION.md                       # Dac ta toan bo 25+ RESTful API Endpoints
|   |-- BAO_CAO_CHI_TIET_DU_AN_TONG_THE_DB_CNTT.md # Bao cao tien do chi tiet cac giai doan
|   |-- HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md        # Tai lieu ban giao ky thuat 2026 - 2031
|   |-- HUONG_DAN_TAO_CHART_PLUGIN_MOI.md          # Huong dan tung buoc tao Chart Plugin
|   `-- TAI_KHOAN_KIEM_THU.md                      # Huong dan dang nhap cac vai tro
|-- .firebaserc                                    # Cau hinh dinh danh du an Firebase
|-- firebase.json                                  # Quy tac Rewrite va Hosting Headers
|-- firestore.rules                                # Luat bao mat Cloud Firestore
|-- Dockerfile                                     # Dockerfile da tang (Multi-stage build)
|-- docker-compose.yml                             # Khoi chay container nhanh
|-- package.json                                   # Script dieu khien toan bo repository
|-- start-local.bat                                # Script khoi chay 1-Click tren Windows
|-- TAI_KHOAN_KIEM_THU.txt                         # Danh sach tai khoan test san sang
`-- README.md                                      # Tai lieu gioi thieu tong the du an
```

---

## 5. HUONG DAN CAI DAT VA KHOI CHAY

### 5.1. Yeu cau he thong
- **Node.js:** Phien ban `>= 22.16.0` hoac `v24.x` (Khuyen nghi Node.js 24 de su dung tinh nang `--experimental-strip-types` va module CSDL `node:sqlite` co san).
- **Khong can cai dat them CSDL ben ngoai:** He thong su dung tep SQLite cuc bo duoc quan ly tu dong boi Node.js, khong can cai MySQL, PostgreSQL hoac Redis.

### 5.2. Cach 1: Khoi chay 1-Click tren he dieu hanh Windows
Nguoi dung nhap dup chuot vao tep tai thu muc goc cua du an:
```cmd
start-local.bat
```
Tep lenh se thuc hien cac buoc tu dong:
1. Kiem tra phien ban Node.js hien tai cua may tinh.
2. Thuc thi toan bo 24 bai kiem thu tu dong (Unit Tests).
3. Khoi dong Backend Server tai cong 3000 phuc vu ca API va Giao dien Web.
4. Tu dong mo trinh duyet mac dinh tai dia chi `http://localhost:3000`.

### 5.3. Cach 2: Khoi chay bang Dong lenh (Terminal / PowerShell)
```bash
# Buoc 1: Chuyen vao thu muc goc cua du an
cd Dashoard_TSNN-main

# Buoc 2: Chay toan bo bo kiem thu tu dong (Backend API, Prime RBAC, Chart Adapter)
npm test

# Buoc 3: Khoi chay may chu ung dung
npm start
```
Mo trinh duyet va truy cap dia chi: **`http://localhost:3000`**

### 5.4. Cach 3: Khoi chay bang Docker Compose
```bash
docker compose up -d --build
```
He thong se duoc container hoa hoan toan va mo cong 3000 de truy cap.

---

## 6. DANH SACH TAI KHOAN KIEM THU THEO 4 VAI TRO

He thong ap dung nghiem ngat co che phan quyen Prime RBAC va ngan chan tuyet doi viec su dung email ngoai ten mien nha truong. Duoi day la danh sach tai khoan da duoc nap san vao he thong de phuc vu danh gia va kiem thu:

| Nhom Vai tro | Ho va Ten | Email dang nhap (@tdtu.edu.vn / @student.tdtu.edu.vn) | Mat khau mac dinh | Pham vi tham quyen tren he thong |
| :--- | :--- | :--- | :---: | :--- |
| **1. Admin / BCN Khoa** | TS. Duong Huu Phuc | `duonghuuphuc@tdtu.edu.vn` | `Admin@123456` | Toan quyen he thong: quan ly hoc ky, cau hinh han chot, duyet thong bao toan truong, quan ly bieu do Dashboard, phan quyen Prime RBAC, in 6 bieu mau A4 |
| **1. Admin phu** | TS. Pham Van C | `phamvanc@tdtu.edu.vn` | `Admin@123456` | Toan quyen quan tri hoc vu va xuat bao cao |
| **2. Giang vien Co van** | ThS. Nguyen Van A | `nguyenvana@tdtu.edu.vn` | `Lecturer@123456` | Quan ly 91 sinh vien, xem tien do va noi thuc tap SV khai bao, tra cuu chung chi tieng Anh, mo link CV, duyet JD tu email, xuat 6 mau in A4 |
| **2. Giang vien Co van** | ThS. Tran Minh Lan | `tranminhlan@tdtu.edu.vn` | `Lecturer@123456` | Tham dinh ho so sinh vien theo chuyen nganh He thong thong tin va Mang |
| **3. Sinh vien trong ky** | Nguyen Huu Nhan | `522h0045@student.tdtu.edu.vn` | `Student@123456` | Sinh vien du dieu kien hoc song song 2 hoc phan KTCN va TSNN, khai bao noi thuc tap va tra cuu MST, nop chung chi B1, xem Cam nang |
| **3. Sinh vien thuc te** | Vo Duy Tri | `51900839@student.tdtu.edu.vn` | `Student@123456` | Sinh vien thuc te thuoc tap du lieu 91 SV (Lop 19050402 - Nganh HTTT) |
| **3. Sinh vien can ho tro** | Nguyen Minh Anh | `522h0001@student.tdtu.edu.vn` | `Student@123456` | Da chon nhanh "Can Khoa ho tro dieu phoi", gui nguyen vong va link CV |
| **4. Sinh vien ngoai ky** | Nguyen Van Ngoai Ky | `52100999@student.tdtu.edu.vn` | `Student@123456` | Sinh vien chua co ten trong danh sach hoc phan ky nay; he thong tu dong tinh gon giao dien chi con 3 muc: Bang dieu khien, Ho so ca nhan, Bang tin |

---

## 7. TRUNG TAM IN AN VA BO 6 BIEU MAU A4 THEO NGHI DINH 30/2020/ND-CP

Tai phan he **Van ban va Bieu mau** (`/documents`), he thong cung cap cong cu xem truoc truc quan (A4 Live Preview) va xuat in an truc tiep ra kho giay A4 theo dung quy cach the thuc van ban hanh chinh nha nuoc:

1. **Mau 1 (`mau_tong_ket`):** Bao cao Tong ket va Xet duyet Dot Thuc tap Doanh nghiep (Phuc vu cuoc hop Ban Chu nhiem Khoa, tong hop 7 chi so KPI cot loi, danh sach chi tiet va khung ky 3 ben: Nguoi lap, Truong Bo mon, Truong Khoa).
2. **Mau 2 (`mau_phan_bo`):** Bang Phan bo Sinh vien theo Don vi Tiep nhan (Gui cac doanh nghiep doi tac nhu FPT Software, VNG, Viettel, TMA, KMS kem thong tin mentor va vi tri tiep nhan).
3. **Mau 3 (`mau_bang_diem`):** Bang Tong hop Diem Danh gia Ket qua Thuc tap (Tong hop diem so theo cong thuc trong so: Nhat ky 20%, Danh gia Doanh nghiep BM-03 40%, Bao cao Giang vien 40%, quy doi he 10, he 4 va diem chu).
4. **Mau 4 (`mau_giay_gioi_thieu`):** Giay Gioi thieu Sinh vien Thuc tap Doanh nghiep (Van ban hanh chinh trang trong co so cong van, thong tin phap ly cua Khoa va khung ky dong dau giay cua lanh dao Khoa).
5. **Mau 5 (`mau_dieu_phoi`):** Danh sach Sinh vien De nghi Khoa Ho tro Ket noi Doanh nghiep (Tong hop GPA, chuyen nganh, ky nang, nguyen vong khu vuc va so dien thoai de Khoa gui toi Hoi dong Doanh nghiep doi tac).
6. **Mau 6 (`mau_bieu_mau_bm`):** Bo Tai lieu Quy dinh va Huong dan Thuc tap (Tich hop bieu mau BM-01 Phieu tiep nhan, BM-02 Nhat ky thuc tap tuan, BM-03 Phieu danh gia doanh nghiep va de cuong quy dinh 320 gio lam viec thuc te).

---

## 8. HUONG DAN MO RONG: TAO PLUGIN BIEU DO MOI (PLUG-AND-PLAY)

Nho kien truc **Chart Router** va **Widget Registry**, bat ky doi ngu ky su ke thua nao cung co the bo sung them bieu do moi ma khong can can thiep vao server router hay controller.

### Quy trinh 3 buoc:
1. Tao 01 file plugin moi tai thu muc `TDTU_DB_CNTT_System/backend/src/services/charts/ten-bieu-do.plugin.ts`.
2. Trien khai interface `IChartPlugin` gom 2 ham: `getMetadata()` va `execute()`.
3. Dang ky instance vao `widgetRegistry.register(plugin)`.

```typescript
import { getDatabase } from '../../models/sqlite.db.ts';
import { widgetRegistry } from '../widget-registry.ts';
import type { IChartPlugin, WidgetMetadata, StandardChartPayload } from '../../models/reporting.contracts.ts';

export class EvaluationResultPlugin implements IChartPlugin {
  // 1. Khai bao metadata cho danh muc Widget
  getMetadata(): WidgetMetadata {
    return {
      id: 'evaluation-result-chart',
      name: 'Thong ke Ket qua Danh gia Thuc tap (BM-03)',
      category: 'academic',
      description: 'Phan bo xep loai thuc tap tu can bo huong dan doanh nghiep',
      defaultSize: 'medium',
      supportedChartTypes: ['pie', 'bar']
    };
  }

  // 2. Logic truy van du lieu va dong goi theo hop dong StandardChartPayload
  async execute(options: Record<string, any> = {}): Promise<StandardChartPayload> {
    const db = getDatabase();
    
    // Thuc hien truy van SQLite hoac goi dich vu khach
    const categories = ['Xuat sac', 'Gioi', 'Kha', 'Trung binh'];
    const data = [38, 42, 10, 1];

    return {
      widgetId: 'evaluation-result-chart',
      title: 'Xep loai Thuc tap tu Doanh nghiep',
      chartType: 'pie',
      categories,
      series: [
        {
          name: 'So luong sinh vien',
          type: 'pie',
          data,
          color: '#003087'
        }
      ],
      summaryStats: {
        totalEvaluated: 91,
        excellentRate: '41.8%'
      },
      generatedAt: new Date().toISOString(),
      schemaVersion: 'standard'
    };
  }
}

// 3. Tu dong dang ky vao Widget Registry (Plug and Play)
const plugin = new EvaluationResultPlugin();
widgetRegistry.register(plugin);
export default plugin;
```

Sau khi tao xong file, bieu do moi se lap tuc xuat hien tren endpoint `GET /api/dashboard/widgets` va duoc render tu dong tren Dashboard giang vien ma khong phai khoi dong lai toan bo he thong.

---

## 9. BO KIEM THU TU DONG (AUTOMATED TEST SUITES)

He thong tich hop san 24 bai kiem thu tu dong (Unit Tests va Integration Tests) chay truc tiep qua Node.js native test runner:

```bash
npm test
```

### Ket qua kiem thu thuc te (24/24 Tests Passed):
- **Phan he Reporting Adapter Demo (15 tests):**
  - Kiem tra widget discovery va tra cuu registry.
  - Kiem tra tinh dong nhat du lieu giua Schema V1 va Schema V2 khi di qua Adapter.
  - Kiem tra kha nang tai su dung Adapter cho ca hai loai bieu do Pie va Bar.
  - Kiem tra co che xu ly ma loi: 404 Not Found, 502 Bad Gateway khi upstream sai dinh dang, 503 Service Unavailable, va 504 Gateway Timeout.
  - Kiem tra su tuong dong ve ket qua Chart JSON giua mo hinh Co Router va Khong Router.
- **Phan he Backend API Core (6 tests):**
  - Test 1: API Summary thong ke tong quan dot thuc tap.
  - Test 2: API Tra cuu phap ly Ma so thue doanh nghiep (MST VNG `0303882213`).
  - Test 3: API Bang tin tuyen dung va thong bao hoc vu.
  - Test 4: API Widget Registry va Chart Router dispatch.
  - Test 5: API Notification Anti-Spam (Bo qua thong bao trung lap trong 20 giay).
  - Test 6: API Notification Admin Broadcast va xem truoc so luong nguoi nhan.
- **Phan he Phan quyen Prime RBAC (3 tests):**
  - Test 1: Kiem tra khop 100% ma tran so nguyen to chuan cua BCN Khoa CNTT.
  - Test 2: Phep toan Cap quyen (Nhan so nguyen to) va Go quyen (Chia so nguyen to).
  - Test 3: Giai ma mat na quyen (Explain Permission Mask).

---

## 10. TRIEN KHAI VA VAN HANH HE THONG (DEPLOYMENT)

### 10.1. Trien khai len Firebase Hosting (Moi truong Static Production)
Giao dien Frontend TypeScript duoc trien khai truc tiep tren ha tang mang phan phoi toan cau cua Google Firebase:
```bash
# Cai dat cong cu Firebase CLI neu chua co
npm install -g firebase-tools

# Thuc hien build va deploy len moi truong truc tuyen
npm run deploy:firebase
# Hoac chay lenh:
npx firebase-tools deploy --only hosting
```
Truy cap kiem tra truc tiep: **https://dashboard-39cf8.web.app**

### 10.2. Trien khai noi bo tren May chu Nha truong (On-Premises Production)
Khi dua he thong ve van hanh tren ha tang server rieng cua Khoa CNTT hoac Trung tam May tinh TDTU:
1. Su dung Docker Compose da duoc cau hinh san trong file `docker-compose.yml`.
2. Thiet lap Nginx Reverse Proxy phia truoc de dieu phoi luong:
   - `http://thuctap.cntt.tdtu.edu.vn/api/` -> chuyen tiep vao Node.js Backend Server tai cong 3000.
   - `http://thuctap.cntt.tdtu.edu.vn/` -> phuc vu thu muc `TDTU_DB_CNTT_System/frontend/` voi fallback rewrite ve `index.html`.

---

## 11. DANH MUC TAI LIEU BAN GIAO LIEN QUAN

De ho tro cong tac ban giao tron tru va dinh huong phat trien tiep noi trong giai doan 2026 - 2031, cac tai lieu chuyen sau da duoc bien soan day du tai thu muc `docs/`:

1. [HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/HUONG_DAN_BAN_GIAO_VA_PHAT_TRIEN.md): Tai lieu huong dan ban giao, ban do kien truc va quy trinh tiep nhan code.
2. [HUONG_DAN_TAO_CHART_PLUGIN_MOI.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/HUONG_DAN_TAO_CHART_PLUGIN_MOI.md): Cam nang lap trinh vien mo rong them cac bieu do truc quan hoa moi.
3. [API_SPECIFICATION.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/API_SPECIFICATION.md): Ban dac ta chi tiet toan bo cac endpoint RESTful API kem vi du request/response JSON.
4. [BAO_CAO_CHI_TIET_DU_AN_TONG_THE_DB_CNTT.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/BAO_CAO_CHI_TIET_DU_AN_TONG_THE_DB_CNTT.md): Bao cao tong ket tien do va ket qua thuc hien 6 giai doan du an.
5. [TAI_KHOAN_KIEM_THU.md](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/docs/TAI_KHOAN_KIEM_THU.md) va [TAI_KHOAN_KIEM_THU.txt](file:///d:/KTCN_TSNN/Dashoard_TSNN-main/TAI_KHOAN_KIEM_THU.txt): Danh sach chi tiet tai khoan, mat khau va phan quyen phuc vu nghiem thu he thong.

---

## 12. DON VI QUAN LY VA BAN QUYEN

- **Don vi chu quan:** Khoa Cong nghe Thong tin - Truong Dai hoc Ton Duc Thang (TDTU)
- **Chu de de tai:** He thong Quan ly Thuc tap & Dashboard Ho tro Ra Quyet dinh (DB_CNTT)
- **Giang vien huong dan & Chi dao kien truc:** TS. Duong Huu Phuc
- **Nhanh ma nguon thuc hien:** `522H0045`
- **Ban quyen ma nguon:** (c) 2026 Khoa CNTT, Truong Dai hoc Ton Duc Thang. Moi quyen duoc bao luu theo quy dinh so huu tri tue cua nha truong.
