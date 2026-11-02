import type { ICompanyDataAdapter, StandardChartPayload } from './contracts.ts';

export class CompanyDataAdapter implements ICompanyDataAdapter {
  transform(rawCompanyData: any[], schemaVersion: 'v1' | 'v2'): StandardChartPayload {
    const counts: Record<string, number> = {};

    if (schemaVersion === 'v1') {
      // Legacy Schema V1: { ten_cong_ty: string, so_luong_sv: number }
      for (const item of rawCompanyData) {
        const name = item.ten_cong_ty || item.ten_doanh_nghiep || 'Khác';
        const count = Number(item.so_luong_sv || item.so_luong || 1);
        counts[name] = (counts[name] || 0) + count;
      }
    } else {
      // Modern Schema V2: { companyName: string, studentCount?: number, students?: any[] }
      for (const item of rawCompanyData) {
        const name = item.companyName || item.name || 'Khác';
        const count = item.studentCount !== undefined
          ? Number(item.studentCount)
          : (Array.isArray(item.students) ? item.students.length : 1);
        counts[name] = (counts[name] || 0) + count;
      }
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const categories = sorted.map(([name]) => name);
    const data = sorted.map(([, count]) => count);

    return {
      widgetId: 'top-companies-chart',
      title: 'Top Doanh nghiệp Tiếp nhận Sinh viên Thực tập',
      chartType: 'bar',
      categories,
      series: [
        {
          name: 'Số lượng sinh viên',
          type: 'bar',
          data,
          color: '#0B3C5D'
        }
      ],
      summaryStats: {
        totalCompanies: categories.length,
        totalStudentsPlaced: data.reduce((a, b) => a + b, 0),
        topCompany: categories[0] || 'Chưa có'
      },
      generatedAt: new Date().toISOString(),
      schemaVersion
    };
  }
}

export const companyDataAdapter = new CompanyDataAdapter();
