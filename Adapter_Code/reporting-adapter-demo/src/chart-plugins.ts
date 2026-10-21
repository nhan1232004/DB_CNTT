import type { ChartPlugin, ChartResponse, CompanyDataProvider } from './contracts.ts';

// MỖI CHART: Chỉ biết Provider contract, hoàn toàn không biết API/raw schema nguồn.
export class CompanyPieChart implements ChartPlugin {
  readonly id = 'company';
  readonly title = 'Tỷ lệ doanh nghiệp theo lĩnh vực';
  readonly type = 'pie' as const;
  private readonly provider: CompanyDataProvider;
  constructor(provider: CompanyDataProvider) { this.provider = provider; }

  async execute(options: { schema?: string; simulate?: string } = {}): Promise<ChartResponse> {
    const stats = await this.provider.getIndustryStatistics(options);
    console.log('[Chart] CompanyPieChart.execute()');
    return {
      chartId: this.id, type: this.type, title: this.title,
      data: { labels: stats.map((x) => x.industry), values: stats.map((x) => x.count) }
    };
  }
}

// CHART MỚI: Dùng lại đúng Provider + Adapter, chỉ thay cách chuẩn bị Chart JSON.
export class CompanyBarChart implements ChartPlugin {
  readonly id = 'company-bar';
  readonly title = 'Số doanh nghiệp theo lĩnh vực';
  readonly type = 'bar' as const;
  private readonly provider: CompanyDataProvider;
  constructor(provider: CompanyDataProvider) { this.provider = provider; }

  async execute(options: { schema?: string; simulate?: string } = {}): Promise<ChartResponse> {
    const stats = await this.provider.getIndustryStatistics(options);
    console.log('[Chart] CompanyBarChart.execute()');
    return {
      chartId: this.id, type: this.type, title: this.title,
      data: { labels: stats.map((x) => x.industry), values: stats.map((x) => x.count) }
    };
  }
}
