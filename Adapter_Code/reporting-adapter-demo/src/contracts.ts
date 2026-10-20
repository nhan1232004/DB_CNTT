// CONTRACT: Các chart phụ thuộc vào kiểu này, không phụ thuộc schema của Company Service.
export interface IndustryStatistic {
  industry: string;
  count: number;
}

export interface CompanyDataProvider {
  getIndustryStatistics(options?: { schema?: string; simulate?: string }): Promise<IndustryStatistic[]>;
}

//Đây là cấu trúc mà Chart Plugin phải trả về.
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
