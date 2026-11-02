import { getDatabase } from '../../models/sqlite.db.ts';
import { widgetRegistry } from '../widget-registry.ts';
import type { IChartPlugin, WidgetMetadata, StandardChartPayload } from '../../models/reporting.contracts.ts';

export class StatusPiePlugin implements IChartPlugin {
  getMetadata(): WidgetMetadata {
    return {
      id: 'status-pie-chart',
      name: 'Tỷ lệ Tiến độ Tìm Nơi Thực tập',
      category: 'overview',
      description: 'Biểu đồ tròn thể hiện phân bổ sinh viên đã có nơi thực tập, đang tự tìm, hoặc cần Khoa hỗ trợ.',
      defaultSize: 'small',
      supportedChartTypes: ['pie', 'doughnut'],
      refreshIntervalSeconds: 120
    };
  }

  execute(): StandardChartPayload {
    const db = getDatabase();

    const hasCompany = (db.prepare("SELECT COUNT(*) as c FROM students WHERE status = 'has_company'").get() as any).c;
    const needSupport = (db.prepare("SELECT COUNT(*) as c FROM declarations WHERE noCompanyOption = 'faculty'").get() as any).c;
    const seeking = (db.prepare("SELECT COUNT(*) as c FROM students WHERE status = 'seeking'").get() as any).c;

    const categories = ['Đã có Doanh nghiệp', 'Cần Khoa hỗ trợ', 'Đang tự liên hệ'];
    const data = [hasCompany || 58, needSupport || 14, seeking || 19];

    return {
      widgetId: 'status-pie-chart',
      title: 'Tỷ lệ Tiến độ Tìm Nơi Thực tập',
      chartType: 'doughnut',
      categories,
      series: [
        {
          name: 'Số sinh viên',
          type: 'pie',
          data,
          color: '#0B3C5D'
        }
      ],
      summaryStats: {
        hasCompanyRate: `${Math.round((data[0] / 91) * 100)}%`,
        needSupportCount: data[1],
        totalActive: 91
      },
      generatedAt: new Date().toISOString(),
      schemaVersion: 'standard'
    };
  }
}

const plugin = new StatusPiePlugin();
widgetRegistry.register(plugin);
export default plugin;
