// ============================================================================
// COMPANY DATA ADAPTER & CHART PLUGINS
// Chuẩn hóa Schema V1/V2 từ dịch vụ ngoài + Tính toán trực tiếp trên 91 SV thực tế
// ============================================================================

import type {
  ChartPlugin,
  ChartResponse,
  CompanyDataProvider,
  IndustryStatistic,
} from './contracts.ts';
import type { StudentsService } from '../students/students.service.ts';

export class CompanyDataAdapter implements CompanyDataProvider {
  // Hỗ trợ chuẩn hóa Schema V1 (sector_name, total) và Schema V2 (industryName, companies)
  private readonly rawV1Data = [
    { sector_name: 'Phát triển Phần mềm & Web/Mobile', total: 42 },
    { sector_name: 'An toàn Thông tin & Mạng (SOC)', total: 18 },
    { sector_name: 'Trí tuệ Nhân tạo (AI) & Data', total: 15 },
    { sector_name: 'Cloud, DevOps & Hạ tầng số', total: 10 },
    { sector_name: 'ERP, Fintech & Kiểm thử QA', total: 6 },
  ];

  private readonly rawV2Data = {
    summary: [
      { industryName: 'Phát triển Phần mềm & Web/Mobile', companies: 42 },
      { industryName: 'An toàn Thông tin & Mạng (SOC)', companies: 18 },
      { industryName: 'Trí tuệ Nhân tạo (AI) & Data', companies: 15 },
      { industryName: 'Cloud, DevOps & Hạ tầng số', companies: 10 },
      { industryName: 'ERP, Fintech & Kiểm thử QA', companies: 6 },
    ],
  };

  async getIndustryStatistics(options: { schema?: string } = {}): Promise<IndustryStatistic[]> {
    if (options.schema === 'v2') {
      return this.rawV2Data.summary.map((row) => ({
        industry: row.industryName,
        count: row.companies,
      }));
    }
    return this.rawV1Data.map((row) => ({
      industry: row.sector_name,
      count: row.total,
    }));
  }

  async getPartnerRatio() {
    return [
      { label: 'Doanh nghiệp thân hữu TDTU', value: 79.1, color: '#10b981' },
      { label: 'Doanh nghiệp mới liên kết', value: 11.6, color: '#1e293b' },
      { label: 'Sinh viên tự liên hệ ngoài', value: 9.3, color: '#38bdf8' },
    ];
  }
}

// 1. Plugin: Tỷ lệ nhóm Doanh nghiệp tiếp nhận (Pie)
export class CompanyPartnerPiePlugin implements ChartPlugin {
  readonly id = 'company-partner';
  readonly title = 'Cơ cấu Doanh nghiệp tiếp nhận';
  readonly subtitle = 'Phân loại theo quan hệ hợp tác thân hữu với Khoa CNTT TDTU';
  readonly type = 'pie' as const;
  private readonly provider: CompanyDataProvider;

  constructor(provider: CompanyDataProvider) {
    this.provider = provider;
  }

  async execute(): Promise<ChartResponse> {
    const items = await this.provider.getPartnerRatio();
    return {
      chartId: this.id,
      title: this.title,
      subtitle: this.subtitle,
      type: this.type,
      data: {
        labels: items.map((i) => i.label),
        values: items.map((i) => i.value),
        colors: items.map((i) => i.color),
      },
    };
  }
}

// 2. Plugin: Tỷ lệ Doanh nghiệp theo Lĩnh vực chuyên môn (Bar - Qua Adapter V1/V2)
export class IndustryDistributionBarPlugin implements ChartPlugin {
  readonly id = 'industry-distribution';
  readonly title = 'Phân bố theo lĩnh vực chuyên môn CNTT';
  readonly subtitle = 'Chuẩn hóa qua CompanyDataAdapter (Hỗ trợ Schema V1 & V2)';
  readonly type = 'bar' as const;
  private readonly provider: CompanyDataProvider;

  constructor(provider: CompanyDataProvider) {
    this.provider = provider;
  }

  async execute(options: { schema?: string } = {}): Promise<ChartResponse> {
    const stats = await this.provider.getIndustryStatistics(options);
    return {
      chartId: this.id,
      title: this.title,
      subtitle: this.subtitle,
      type: this.type,
      data: {
        labels: stats.map((s) => s.industry),
        values: stats.map((s) => s.count),
        colors: ['#2563eb', '#4f46e5', '#0d9488', '#d97706', '#e11d48'],
      },
    };
  }
}

// 3. Plugin: Tình trạng Thực tập của 91 Sinh viên thực tế (Donut - Real-time)
export class StudentStatusDonutPlugin implements ChartPlugin {
  readonly id = 'student-status';
  readonly title = 'Tình trạng thực tập của 91 Sinh viên';
  readonly subtitle = 'Cập nhật tự động thời gian thực khi Sinh viên xác nhận MST hoặc đổi trạng thái';
  readonly type = 'donut' as const;
  private readonly studentsService: StudentsService;

  constructor(studentsService: StudentsService) {
    this.studentsService = studentsService;
  }

  async execute(): Promise<ChartResponse> {
    const summary = this.studentsService.getSummaryMetrics();
    return {
      chartId: this.id,
      title: this.title,
      subtitle: this.subtitle,
      type: this.type,
      data: {
        labels: [
          'Có doanh nghiệp',
          'Đang chờ PV/KQPV',
          'Chưa có doanh nghiệp',
          'Cần Khoa hỗ trợ',
        ],
        values: [
          summary.placedCount,
          summary.interviewCount,
          summary.selfFindingCount,
          summary.needSupportCount,
        ],
        colors: ['#10b981', '#6366f1', '#94a3b8', '#f59e0b'],
      },
    };
  }
}

// 4. Plugin: Thống kê Chuẩn Ngoại Ngữ Xét Tốt Nghiệp TDTU (Donut - Real-time)
export class LanguageStandardDonutPlugin implements ChartPlugin {
  readonly id = 'language-standards';
  readonly title = 'Chuẩn ngoại ngữ đầu ra tốt nghiệp TDTU';
  readonly subtitle = 'TOEIC, IELTS, TOEFL iBT, Cambridge, VSTEP, Aptis & Giấy cam kết';
  readonly type = 'donut' as const;
  private readonly studentsService: StudentsService;

  constructor(studentsService: StudentsService) {
    this.studentsService = studentsService;
  }

  async execute(): Promise<ChartResponse> {
    const { items } = this.studentsService.getAll();
    let qualified = 0;
    let committed = 0;
    let none = 0;

    for (const s of items) {
      if (s.cert === 'Chưa có') none++;
      else if (s.cert === 'Cam kết nộp sau') committed++;
      else qualified++;
    }

    return {
      chartId: this.id,
      title: this.title,
      subtitle: this.subtitle,
      type: this.type,
      data: {
        labels: [
          'Đã đạt chuẩn TDTU (TOEIC/IELTS/VSTEP...)',
          'Đã nộp Giấy cam kết bổ sung',
          'Chưa có chứng chỉ (Cần đôn đốc)',
        ],
        values: [qualified, committed, none],
        colors: ['#2563eb', '#f59e0b', '#ef4444'],
      },
    };
  }
}

// 5. Plugin: Cơ cấu Sinh viên theo 3 Ngành & Tỷ lệ Đi 2 Môn (Stacked Bar - Real Data)
export class MajorCourseBreakdownPlugin implements ChartPlugin {
  readonly id = 'major-course-breakdown';
  readonly title = 'Phân bố 91 Sinh viên theo 3 Ngành & Số môn đăng ký';
  readonly subtitle = '43/91 Sinh viên (47.3%) đăng ký đồng thời 2 môn (KTCN + TSNN) tại cùng DN';
  readonly type = 'stacked-bar' as const;
  private readonly studentsService: StudentsService;

  constructor(studentsService: StudentsService) {
    this.studentsService = studentsService;
  }

  async execute(): Promise<ChartResponse> {
    const { items } = this.studentsService.getAll();
    const majors = [
      'Kỹ thuật phần mềm',
      'Khoa học máy tính',
      'Mạng máy tính và truyền thông dữ liệu',
    ];

    const singleCourseCounts: number[] = [];
    const dualCourseCounts: number[] = [];

    for (const m of majors) {
      const inMajor = items.filter((s) => s.major === m);
      const dual = inMajor.filter((s) => s.courses.length >= 2).length;
      const single = inMajor.length - dual;
      singleCourseCounts.push(single);
      dualCourseCounts.push(dual);
    }

    return {
      chartId: this.id,
      title: this.title,
      subtitle: this.subtitle,
      type: this.type,
      data: {
        labels: ['Kỹ thuật phần mềm (502)', 'Khoa học máy tính (503)', 'Mạng MT & TT Dữ liệu (504)'],
        values: majors.map((_, idx) => singleCourseCounts[idx] + dualCourseCounts[idx]),
        extraSeries: [
          { label: 'Đi đồng thời 2 môn (KTCN + TSNN)', values: dualCourseCounts, color: '#7c3aed' },
          { label: 'Đi 1 môn thực tập', values: singleCourseCounts, color: '#3b82f6' },
        ],
      },
    };
  }
}
