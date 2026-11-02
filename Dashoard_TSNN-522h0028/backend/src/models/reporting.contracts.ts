export interface WidgetMetadata {
  id: string;
  name: string;
  category: 'overview' | 'enterprise' | 'academic' | 'trends';
  description: string;
  defaultSize: 'small' | 'medium' | 'large' | 'full';
  supportedChartTypes: ('bar' | 'pie' | 'doughnut' | 'line' | 'table')[];
  refreshIntervalSeconds?: number;
}

export interface StandardChartSeries {
  name: string;
  type: string;
  data: number[];
  color?: string;
}

export interface StandardChartPayload {
  widgetId: string;
  title: string;
  chartType: string;
  categories: string[];
  series: StandardChartSeries[];
  summaryStats?: Record<string, string | number>;
  generatedAt: string;
  schemaVersion: 'v1' | 'v2' | 'standard';
}

export interface IChartPlugin {
  getMetadata(): WidgetMetadata;
  execute(options?: Record<string, any>): Promise<StandardChartPayload> | StandardChartPayload;
}

export interface ICompanyDataAdapter {
  transform(rawCompanyData: any[], schemaVersion: 'v1' | 'v2'): StandardChartPayload;
}

export class ChartNotFoundError extends Error {
  constructor(widgetId: string) {
    super(`Biểu đồ với mã [${widgetId}] không tồn tại trên hệ thống.`);
    this.name = 'ChartNotFoundError';
  }
}
