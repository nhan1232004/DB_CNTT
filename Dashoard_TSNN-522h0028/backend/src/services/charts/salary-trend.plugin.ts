import { widgetRegistry } from '../widget-registry.ts';
import type { IChartPlugin, WidgetMetadata, StandardChartPayload } from '../../models/reporting.contracts.ts';

export class SalaryTrendPlugin implements IChartPlugin {
  getMetadata(): WidgetMetadata {
    return {
      id: 'salary-trend-chart',
      name: 'Thống kê Mức Phụ cấp Thực tập',
      category: 'trends',
      description: 'Phổ trợ cấp thực tập trung bình hàng tháng theo các lĩnh vực công nghệ (NodeJS, React, Mobile, AI/Data).',
      defaultSize: 'medium',
      supportedChartTypes: ['bar', 'line'],
      refreshIntervalSeconds: 600
    };
  }

  execute(): StandardChartPayload {
    const categories = ['AI & Data Science', 'Backend (NodeJS/Go)', 'Frontend (React/Vue)', 'Mobile App', 'DevOps / Cloud'];
    const data = [8.5, 7.5, 6.5, 6.0, 7.8]; // Triệu VNĐ

    return {
      widgetId: 'salary-trend-chart',
      title: 'Mức Phụ cấp Thực tập Trung bình theo Lĩnh vực (Triệu VNĐ/tháng)',
      chartType: 'bar',
      categories,
      series: [
        {
          name: 'Phụ cấp TB (Triệu VNĐ)',
          type: 'bar',
          data,
          color: '#E0A96D' // TDTU Gold
        }
      ],
      summaryStats: {
        highestSector: 'AI & Data Science',
        highestSalary: '8.5 triệu VNĐ/tháng',
        averageSalary: '7.2 triệu VNĐ/tháng'
      },
      generatedAt: new Date().toISOString(),
      schemaVersion: 'standard'
    };
  }
}

const plugin = new SalaryTrendPlugin();
widgetRegistry.register(plugin);
export default plugin;
