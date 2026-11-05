# HƯỚNG DẪN TẠO BIỂU ĐỒ MỚI (PLUG-AND-PLAY CHART PLUGIN)
## DÀNH CHO CÁC ĐỘI NHÓM KẾ THỪA VÀ PHÁT TRIỂN TIẾP THEO (2026 – 2031)
### KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG (TDTU)
*Phiên bản: v3.2.0 | Cập nhật hoàn thiện: 05/11/2026*

---

### 1. NGUYÊN TẮC THIẾT KẾ CẮM-VÀ-CHẠY (PLUG AND PLAY)

Hệ thống báo cáo của DB_CNTT được xây dựng dựa trên kiến trúc **Chart Router** và nguyên lý **Open-Closed Principle (OCP)**:
* **Mở cho việc mở rộng (Open for Extension):** Bất kỳ đội nhóm nào muốn thêm biểu đồ thống kê mới chỉ cần thêm **01 file plugin `.ts` độc lập**.
* **Đóng với việc sửa đổi (Closed for Modification):** Tuyệt đối **không cần sửa** `server.ts`, không sửa `http-router.ts`, không sửa `chart-router.ts`.

---

### 2. CẤU TRÚC MỘT PLUGIN BIỂU ĐỒ CHUẨN (TYPESCRIPT)

Mọi plugin biểu đồ đều nằm trong thư mục:
`TDTU_DB_CNTT_System/backend/src/services/charts/`

Và triển khai interface `IChartPlugin`:

```typescript
import { getDatabase } from '../../models/sqlite.db.ts';
import { widgetRegistry } from '../widget-registry.ts';
import type { IChartPlugin, WidgetMetadata, StandardChartPayload } from '../../models/reporting.contracts.ts';

export class MyNewChartPlugin implements IChartPlugin {
  // 1. Khai báo siêu dữ liệu (Metadata) cho WidgetRegistry
  getMetadata(): WidgetMetadata {
    return {
      id: 'my-new-chart', // ID duy nhất
      name: 'Tên Biểu đồ Mới',
      category: 'academic', // 'overview' | 'enterprise' | 'academic' | 'trends'
      description: 'Mô tả ngắn gọn mục đích thống kê của biểu đồ.',
      defaultSize: 'medium', // 'small' | 'medium' | 'large' | 'full'
      supportedChartTypes: ['bar', 'line'],
      refreshIntervalSeconds: 300 // Tự động làm mới mỗi 5 phút
    };
  }

  // 2. Logic truy vấn dữ liệu và đóng gói StandardChartPayload
  async execute(options: Record<string, any> = {}): Promise<StandardChartPayload> {
    const db = getDatabase();

    // Thực hiện truy vấn SQLite hoặc gọi microservice bên ngoài
    const rows = db.prepare(`SELECT ... FROM ...`).all() as any[];

    const categories = rows.map(r => r.label);
    const data = rows.map(r => r.value);

    return {
      widgetId: 'my-new-chart',
      title: 'Tiêu đề Biểu đồ',
      chartType: 'bar',
      categories,
      series: [
        {
          name: 'Số lượng',
          type: 'bar',
          data,
          color: '#003087' // Mã màu chủ đạo TDTU Navy
        }
      ],
      summaryStats: {
        total: data.reduce((a, b) => a + b, 0)
      },
      generatedAt: new Date().toISOString(),
      schemaVersion: 'standard'
    };
  }
}

// 3. TỰ ĐỘNG ĐĂNG KÝ VÀO WIDGET REGISTRY (PLUG AND PLAY)
const plugin = new MyNewChartPlugin();
widgetRegistry.register(plugin);
export default plugin;
```

---

### 3. CƠ CHẾ TỰ ĐỘNG KHÁM PHÁ (AUTO-DISCOVERY)

Khi bạn lưu file plugin vào `TDTU_DB_CNTT_System/backend/src/services/charts/ten-bieu-do.plugin.ts`:
1. `WidgetRegistry` ngay lập tức ghi nhận plugin vào danh mục widget.
2. Endpoint `GET /api/dashboard/widgets` tự động trả về widget mới cho giao diện React TypeScript.
3. Giao diện người dùng (`DashboardPage.tsx`) sẽ tự động hiển thị thẻ biểu đồ mới trong Dashboard (và trong hộp thoại Quản lý biểu đồ dành cho Giảng viên / Admin) mà lập trình viên frontend không cần phải code lại layout.

---

### 4. VÍ DỤ THỰC TẾ: THÊM BIỂU ĐỒ ĐÁNH GIÁ KẾT QUẢ THỰC TẬP (BM-03)

Tạo file `TDTU_DB_CNTT_System/backend/src/services/charts/internship-evaluation.plugin.ts`:

```typescript
import { widgetRegistry } from '../widget-registry.ts';
import type { IChartPlugin, WidgetMetadata, StandardChartPayload } from '../../models/reporting.contracts.ts';

export class InternshipEvaluationPlugin implements IChartPlugin {
  getMetadata(): WidgetMetadata {
    return {
      id: 'internship-evaluation-chart',
      name: 'Đánh giá Kết quả Thực tập của Doanh nghiệp (BM-03)',
      category: 'academic',
      description: 'Phân loại kết quả đánh giá sinh viên từ Mentor doanh nghiệp: Xuất sắc, Giỏi, Khá, Đạt.',
      defaultSize: 'medium',
      supportedChartTypes: ['pie', 'bar']
    };
  }

  execute(): StandardChartPayload {
    const categories = ['Xuất sắc (9.0 - 10)', 'Giỏi (8.0 - 8.9)', 'Khá (7.0 - 7.9)', 'Đạt (5.0 - 6.9)'];
    const data = [32, 45, 12, 2];

    return {
      widgetId: 'internship-evaluation-chart',
      title: 'Tỷ lệ Đánh giá của Doanh nghiệp theo BM-03',
      chartType: 'pie',
      categories,
      series: [
        {
          name: 'Số sinh viên',
          type: 'pie',
          data,
          color: '#003087'
        }
      ],
      summaryStats: {
        totalEvaluated: 91,
        excellentRate: '35.2%'
      },
      generatedAt: new Date().toISOString(),
      schemaVersion: 'standard'
    };
  }
}

const evalPlugin = new InternshipEvaluationPlugin();
widgetRegistry.register(evalPlugin);
export default evalPlugin;
```

Chỉ với 45 dòng code TypeScript độc lập, biểu đồ mới đã sẵn sàng phục vụ toàn Khoa mà không ảnh hưởng bất kỳ module nào khác.
