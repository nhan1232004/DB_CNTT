# Reporting Adapter Demo — Có Router và Không Router

Demo TypeScript **chạy thực tế qua HTTP**, dùng chung `Company Adapter` cho hai phương án trong sơ đồ. Tập trung vào khác biệt Registry / Chart Router và việc chuẩn hóa dữ liệu nguồn.

## Yêu cầu

- **Node.js >= 22.16** (hỗ trợ `--experimental-strip-types`).
- **Không phải cài thêm dependency để chạy demo hoặc test.**
- Không sử dụng NestJS, Vue, database hoặc auth thật; đây là bản demo kiến trúc backend, không phải ứng dụng production.

## Khởi động

```bash
npm start
```

Mở hai trang:

- **Không Router**: <http://127.0.0.1:3101>
- **Có Router**: <http://127.0.0.1:3102>

Hai trang dùng chung Company Service giả lập chạy ở `127.0.0.1:3200`. Có thể chuyển `V1`/`V2`, tạo lỗi hoặc timeout, xem biểu đồ và Chart JSON. Quan sát log terminal để thấy Adapter map field.

## Gọi thử API

```bash
# Hình 1: Widget Registry tra cứu + gọi execute()
curl http://127.0.0.1:3101/dashboard/widgets
curl 'http://127.0.0.1:3101/dashboard/charts/company?schema=v1'

# Hình 2: Chart Router tra cứu Registry + gọi execute()
curl http://127.0.0.1:3102/dashboard/widgets
curl 'http://127.0.0.1:3102/dashboard/charts/company?schema=v2'

# Thêm biểu đồ dạng bar: dùng lại cùng adapter
curl http://127.0.0.1:3101/dashboard/charts/company-bar

# Test error handling
curl -i 'http://127.0.0.1:3101/dashboard/charts/company?simulate=invalid'
curl -i 'http://127.0.0.1:3102/dashboard/charts/company?simulate=error'
curl -i 'http://127.0.0.1:3102/dashboard/charts/company?simulate=slow'
```

## Kiểm thử tự động

```bash
npm test
```

15 phép kiểm thử: widget discovery, đồng nhất hai schema V1/V2, tái sử dụng Adapter, 404 không tìm thấy chart, upstream HTTP 503, schema lỗi, timeout và đồng nhất output hai kiến trúc.

Nếu muốn kiểm tra TypeScript chặt hơn:

```bash
npm install
npm run typecheck
```

`npm install` chỉ cần cho kiểm tra kiểu dữ liệu; không cần cho `start` hoặc `test`.

## Luồng thực thi

**Không Router (port 3101):**

```
GET /dashboard/charts/company
 -> Reporting API Controller
 -> DispatchingWidgetRegistry.execute("company")
 -> Registry.lookup("company")
 -> CompanyPieChart.execute()
 -> CompanyDataProvider (interface/contract)
 -> CompanyAdapter.getIndustryStatistics() (implementation thực tế)
 -> SharedHttpClient
 -> Company Service mock HTTP API
 <- raw JSON -> Adapter map -> {industry,count}[]
 <- Chart JSON -> HTTP response
```

**Có Router (port 3102):**

```
GET /dashboard/charts/company
 -> Reporting API Controller
 -> ChartRouter.dispatch("company")
 -> WidgetRegistry.lookup("company")
 -> CompanyPieChart.execute()
 -> ... cùng Provider / Adapter / SharedHttpClient / Company Service
 <- Chart JSON -> HTTP response
```

Trong cả hai phương án, interface không phải một thành phần chạy riêng; DI thủ công cấp `CompanyAdapter` vào constructor Chart Plugin. Đây là bản demo TypeScript tối giản để bạn thấy chính xác trách nhiệm các lớp.

## Hai schema nguồn

V1 từ Company Service:

```json
[{"sector_name":"Phần mềm","total":40}]
```

V2 (cấu trúc mới) từ Company Service:

```json
{"summary":[{"industryName":"Phần mềm","companies":40}]}
```

Cùng được `CompanyAdapter` chuẩn hóa thành:

```json
[{"industry":"Phần mềm","count":40}]
```

Cả Pie Chart lẫn Bar Chart nhận **cùng một hợp đồng**, không phải chỉnh code Chart Plugin khi schema nguồn đổi từ V1 sang V2. Demo Adapter được lập trình hỗ trợ trước cả hai schema; ngoài đời khi có schema thứ ba chưa hỗ trợ, cần cập nhật hoặc thay Adapter tương ứng.

## Cấu trúc thư mục

```
src/
  contracts.ts             # Data Provider + Chart Plugin contract
  mock-company-service.ts  # Company Microservice giả lập, có schema v1/v2/lỗi
  shared-http-client.ts    # Giao tiếp HTTP / timeout / lỗi
  company-adapter.ts       # Mapping + validation dữ liệu
  chart-plugins.ts         # Pie Chart và Bar Chart dùng chung Provider
  widget-registry.ts       # WidgetRegistry và DispatchingWidgetRegistry
  chart-router.ts          # Chỉ phương án có Router
  reporting-server.ts      # Reporting API cho 2 phương án
  demo-page.ts             # Trang trực quan tối giản
  main.ts                  # Khởi động 3 server
 tests/
  demo.test.ts             # Tự động kiểm tra API và adapter
```

## Những gì demo CHƯA chứng minh

- Không chứng minh được độ ổn định production, chịu tải, retry/circuit breaker, uptime, tính sẵn sàng hoặc bảo mật.
- Không có Auth Service, phân quyền theo hai vai trò, API Gateway thật, DB, Vue 3; đã cố ý lược bỏ để giữ trọng tâm so sánh.
- Shared HTTP Client có timeout; một HTTP timeout phía client không đảm bảo dừng công việc đang thực hiện phía service nguồn.
- Không phải plugin hot-loading: muốn thêm module phải sửa code đăng ký và khởi động lại Reporting Service.
- Mỗi scheme mới được cập nhật ở Adapter; nếu API nguồn không đủ dữ liệu cho biểu đồ, Adapter không thể tự tạo dữ liệu thiếu.
