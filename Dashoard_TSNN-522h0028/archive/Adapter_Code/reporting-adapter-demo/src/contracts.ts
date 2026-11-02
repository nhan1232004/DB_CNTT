// CONTRACT: Các chart phụ thuộc vào kiểu này, không phụ thuộc schema của Company Service.
// Quy định dữ liệu phải có cấu trúc như thế nào.
export interface IndustryStatistic {
  industry: string;
  count: number;
}

// Quy định phương thức cung cấp dữ liệu.
export interface CompanyDataProvider {
  getIndustryStatistics(options?: { schema?: string; simulate?: string }): Promise<IndustryStatistic[]>;
}

//Đây là cấu trúc JSON mà Chart Plugin trả về để frontend hiển thị biểu đồ.
export interface ChartResponse {
  chartId: string;
  type: 'pie' | 'bar';
  title: string;
  data: { labels: string[]; values: number[] };
}

export interface ChartPlugin {
  id: string;
  title: string;
  type: ChartResponse['type'];
  execute(options?: { schema?: string; simulate?: string }): Promise<ChartResponse>;
}

export class ChartNotFoundError extends Error {}
export class UpstreamError extends Error {}
export class UpstreamTimeoutError extends UpstreamError {}
