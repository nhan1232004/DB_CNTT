// ============================================================================
// INBOUND EMAIL FORWARD PARSER (MIME / Raw Text / Subject / Body Extractor)
// Tự động bóc tách Mã số thuế (MST), Tên Doanh nghiệp, Vị trí thực tập,
// Kỹ năng, Mức trợ cấp, Chỉ tiêu, Hạn nộp từ Email Giảng viên chuyển tiếp
// ============================================================================

import type { InboundEmailPayload } from '../../../../../packages/shared-types/src/index.ts';

export interface ParsedEmailJdResult {
  companyName: string;
  taxCode: string;
  jobTitle: string;
  description: string;
  skills: string[];
  stipend: string;
  quota: number;
  acceptsBothCourses: boolean;
  deadline: string;
  contactEmail: string;
  location: string;
  sourceEmail: string;
  forwardedBy: string;
  rawEmailSubject: string;
  rawEmailBody: string;
}

const KNOWN_COMPANY_DOMAINS: Array<{
  keywords: string[];
  companyName: string;
  taxCode: string;
  location: string;
}> = [
  {
    keywords: ['fsoft.com.vn', 'fpt.com', 'fpt software'],
    companyName: 'FPT Software (F-Town 3)',
    taxCode: '0303882213',
    location: 'Khu Công nghệ cao, TP. Thủ Đức, TP.HCM',
  },
  {
    keywords: ['viettel.com.vn', 'viettel cyber security', 'vcs'],
    companyName: 'Viettel Cyber Security (VCS)',
    taxCode: '0100109106',
    location: '285 Cách Mạng Tháng Tám, Quận 10, TP.HCM',
  },
  {
    keywords: ['vng.com.vn', 'zalopay', 'vng corporation', 'vng cloud'],
    companyName: 'VNG Corporation (ZaloPay & VNG Cloud)',
    taxCode: '0312345678',
    location: 'Z06 Đường số 13, KCX Tân Thuận, Quận 7, TP.HCM',
  },
  {
    keywords: ['kms-technology.com', 'kms technology'],
    companyName: 'KMS Technology Vietnam',
    taxCode: '0309876543',
    location: 'Số 2 Tản Viên, Quận Tân Bình, TP.HCM',
  },
  {
    keywords: ['misa.com.vn', 'misa jsc'],
    companyName: 'MISA JSC (Trung tâm Phát triển Phần mềm)',
    taxCode: '0101243150',
    location: 'Công viên Phần mềm Quang Trung, Quận 12, TP.HCM',
  },
  {
    keywords: ['dxc.com', 'dxc technology'],
    companyName: 'DXC Technology Vietnam',
    taxCode: '0304567891',
    location: 'Tòa nhà eTown 5, 364 Cộng Hòa, Quận Tân Bình, TP.HCM',
  },
  {
    keywords: ['nashtechglobal.com', 'nashtech'],
    companyName: 'NashTech Vietnam',
    taxCode: '0302030405',
    location: 'Tòa nhà eTown 2, 364 Cộng Hòa, Quận Tân Bình, TP.HCM',
  },
];

const TECH_SKILL_DICTIONARY = [
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'NestJS',
  'Next.js',
  'Golang',
  'Java',
  'Spring Boot',
  'Python',
  'AI',
  'Machine Learning',
  'Data Science',
  'Docker',
  'Kubernetes',
  'AWS',
  'Cloud',
  'PostgreSQL',
  'SQL',
  'MongoDB',
  'Redis',
  'System Design',
  'SOC',
  'SIEM',
  'Pentest',
  'Network Security',
  'Linux',
  'Automation QA',
  'Playwright',
  'Cypress',
  'Flutter',
  'Mobile',
  '.NET',
  'C#',
  'REST API',
  'GraphQL',
  'Agile',
];

export const SAMPLE_FORWARDED_EMAILS: Array<{
  subject: string;
  from: string;
  forwardedBy: string;
  rawEmail: string;
}> = [
  {
    subject: 'Fwd: [Tuyển dụng Thực tập HK1/2026-2027] Software Engineer Intern (Distributed Backend & AI) - VNG Corporation',
    from: 'campus-hr@vng.com.vn',
    forwardedBy: 'nguyenvana@tdtu.edu.vn',
    rawEmail: `---------- Forwarded message ---------
From: Phòng Tuyển dụng VNG Campus <campus-hr@vng.com.vn>
Date: 23/10/2026 09:15
Subject: [Tuyển dụng Thực tập HK1/2026-2027] Software Engineer Intern (Distributed Backend & AI) - VNG Corporation
To: TS. Nguyễn Văn A <nguyenvana@tdtu.edu.vn>

Kính gửi Quý Thầy Cô Khoa CNTT - Trường Đại học Tôn Đức Thắng,
Công ty: VNG Corporation (ZaloPay & VNG Cloud)
Mã số thuế (MST): 0312345678
Vị trí tuyển dụng: Software Engineer Intern (Distributed Backend & AI)
Số lượng tiếp nhận: 12 sinh viên
Kỹ năng yêu cầu: Golang, Node.js, System Design, Docker
Mức trợ cấp: 8.500.000 VNĐ/tháng
Hạn nộp hồ sơ: 30/11/2026
Địa điểm làm việc: Z06 Đường số 13, KCX Tân Thuận, Quận 7, TP.HCM
Mô tả công việc: Tham gia phát triển hệ thống thanh toán ZaloPay & VNG Cloud chịu tải cao. Hỗ trợ đóng dấu xác nhận báo cáo cho sinh viên đăng ký đồng thời cả 2 môn Kiến tập công nghiệp (KTCN) + Tập sự nghề nghiệp (TSNN).`,
  },
  {
    subject: 'Fwd: [MISA JSC] Đề xuất tiếp nhận Sinh viên Thực tập Web Frontend & Business Analyst 2026',
    from: 'hr@misa.com.vn',
    forwardedBy: 'nguyenvana@tdtu.edu.vn',
    rawEmail: `---------- Forwarded message ---------
From: Ban Nhân sự MISA <hr@misa.com.vn>
Date: 23/10/2026 10:30
Subject: [MISA JSC] Đề xuất tiếp nhận Sinh viên Thực tập Web Frontend & Business Analyst 2026
To: TS. Nguyễn Văn A <nguyenvana@tdtu.edu.vn>

Chào Thầy/Cô Phụ trách Thực tập Khoa CNTT TDTU,
Doanh nghiệp: MISA JSC (Trung tâm Phát triển Phần mềm)
MST: 0101243150
Vị trí: Web Frontend & Business Analyst Intern
Chỉ tiêu: 10 sinh viên
Kỹ năng: React, TypeScript, REST API, SQL
Trợ cấp thực tập: 5.500.000 VNĐ/tháng
Hạn chót: 28/11/2026
Địa điểm: Tòa nhà MISA, Công viên Phần mềm Quang Trung, Quận 12, TP.HCM
Mô tả: Tuyển sinh viên ngành Kỹ thuật phần mềm & KHMT tham gia phát triển nền tảng ERP Cloud. Chấp nhận sinh viên làm đồng thời 2 môn KTCN + TSNN.`,
  },
  {
    subject: 'Fwd: [NashTech Vietnam] Tuyển dụng Cloud DevOps & Full-Stack .NET/React Intern (HK1 2026-2027)',
    from: 'recruitment@nashtechglobal.com',
    forwardedBy: 'tranvanb@tdtu.edu.vn',
    rawEmail: `---------- Forwarded message ---------
From: NashTech Vietnam Campus <recruitment@nashtechglobal.com>
Date: 23/10/2026 14:00
Subject: [NashTech Vietnam] Tuyển dụng Cloud DevOps & Full-Stack .NET/React Intern (HK1 2026-2027)
To: TS. Trần Văn B <tranvanb@tdtu.edu.vn>

Kính gửi Bộ môn Kỹ thuật Phần mềm - Khoa CNTT TDTU,
Công ty: NashTech Vietnam
Mã số thuế: 0302030405
Vị trí: Cloud DevOps & Full-Stack .NET/React Intern
Số lượng: 15 sinh viên
Yêu cầu kỹ năng: .NET, C#, React, Azure Cloud, Docker, SQL
Học bổng trợ cấp: 7.000.000 VNĐ/tháng
Deadline: 05/12/2026
Địa chỉ: Tòa nhà eTown 2, 364 Cộng Hòa, Quận Tân Bình, TP.HCM
Mô tả: Chương trình thực tập sinh tài năng tại NashTech, có Mentor hướng dẫn 1-1 và hỗ trợ xác nhận thực tập cho cả 2 môn KTCN và TSNN.`,
  },
];

export class EmailForwardParser {
  static parse(payload: InboundEmailPayload = {}, fallbackIndex = 0): ParsedEmailJdResult {
    const rawBodyAlias = (payload as any).rawBody as string | undefined;
    const hasRawOrCustom =
      Boolean(payload.rawEmail?.trim()) ||
      Boolean(rawBodyAlias?.trim()) ||
      Boolean(payload.body?.trim()) ||
      Boolean(payload.subject?.trim()) ||
      Boolean(payload.companyName?.trim()) ||
      Boolean(payload.jobTitle?.trim());

    const sample = SAMPLE_FORWARDED_EMAILS[fallbackIndex % SAMPLE_FORWARDED_EMAILS.length];
    const rawText = (payload.rawEmail || rawBodyAlias || payload.body || (!hasRawOrCustom ? sample.rawEmail : '')).trim();
    const subjectLine = (
      payload.subject ||
      this.extractHeaderField(rawText, 'Subject') ||
      (!hasRawOrCustom ? sample.subject : 'Fwd: Thông báo tuyển dụng Thực tập sinh CNTT TDTU')
    ).trim();

    const forwardedBy = (
      payload.forwardedBy ||
      this.extractTdtuEmailFromHeaders(rawText) ||
      this.extractEmailFromLine(this.extractHeaderField(rawText, 'To')) ||
      sample.forwardedBy
    )
      .trim()
      .toLowerCase();

    const explicitFromEmail = this.extractEmailFromLine(payload.from || '');
    const nonTdtuExplicitFrom =
      explicitFromEmail && !this.isTdtuEmail(explicitFromEmail) ? explicitFromEmail : '';
    const extractedFromEmail =
      payload.contactEmail ||
      nonTdtuExplicitFrom ||
      this.extractNonTdtuFromHeaderEmail(rawText) ||
      this.extractFirstNonTdtuEmail(rawText) ||
      explicitFromEmail ||
      sample.from;

    const combinedLower = `${subjectLine}\n${rawText}\n${extractedFromEmail}`.toLowerCase();
    const matchedKnownCompany = KNOWN_COMPANY_DOMAINS.find((c) =>
      c.keywords.some((kw) => combinedLower.includes(kw))
    );

    // 1. Trích xuất Mã Số Thuế (MST)
    const mstMatch =
      rawText.match(/(?:MST|Mã\s*số\s*thuế|Tax\s*Code|Mã\s*DN)\s*(?:\([^)]*\))?\s*[:#-]*\s*([0-9]{8,13}(?:-[0-9]{3})?)/i) ||
      rawText.match(/\b(0[123456789][0-9]{8}(?:-[0-9]{3})?)\b/);
    const taxCode =
      payload.taxCode?.trim() ||
      (mstMatch ? mstMatch[1].trim() : matchedKnownCompany?.taxCode || '0303882213');

    // 2. Trích xuất Tên công ty
    const companyLineMatch =
      rawText.match(
        /^[\s•*-]*(?:Công\s*ty|Doanh\s*nghiệp|Đơn\s*vị(?:\s*tiếp\s*nhận)?|Tên\s*công\s*ty|Company)\s*[:#-]\s*([^\n\r]+)/im
      ) ||
      rawText.match(
        /(?:Công\s*ty|Doanh\s*nghiệp|Đơn\s*vị|Company)\s*[:#-]\s*([^\n\r]+)/i
      );
    const bracketSubjectMatch = subjectLine.match(/\[([^\]]+)\]/);
    const dashSubjectMatch = subjectLine.split(/\s+[-–—]\s+/);
    let companyName =
      payload.companyName?.trim() ||
      (companyLineMatch ? companyLineMatch[1].trim() : '') ||
      matchedKnownCompany?.companyName ||
      '';

    if (!companyName && bracketSubjectMatch && !/tuyển|thực tập|intern|hk1/i.test(bracketSubjectMatch[1])) {
      companyName = bracketSubjectMatch[1].trim();
    }
    if (!companyName && dashSubjectMatch.length > 1) {
      companyName = dashSubjectMatch[dashSubjectMatch.length - 1].trim();
    }
    if (!companyName) {
      companyName = 'Doanh nghiệp Đối tác CNTT TDTU';
    }

    // 3. Trích xuất Vị trí tuyển dụng (jobTitle)
    const roleMatch =
      rawText.match(
        /^[\s•*-]*(?:Vị\s*trí(?:\s*tuyển\s*dụng|\s*thực\s*tập)?|Position|Role|Tuyển\s*dụng\s*vị\s*trí)\s*[:#-]\s*([^\n\r]+)/im
      ) ||
      rawText.match(
        /(?:Vị\s*trí(?:\s*tuyển\s*dụng|\s*thực\s*tập)?|Position|Role|Tuyển\s*dụng\s*vị\s*trí)\s*[:#-]\s*([^\n\r]+)/i
      );
    let jobTitle = payload.jobTitle?.trim() || (roleMatch ? roleMatch[1].trim() : '');
    if (!jobTitle) {
      // Làm sạch từ Subject
      const cleanSubj = subjectLine
        .replace(/^(?:Fwd|Fw|Re)\s*:\s*/gi, '')
        .replace(/\[[^\]]*\]\s*/g, '')
        .split(/\s+[-–—]\s+/)[0]
        .trim();
      jobTitle = cleanSubj || 'Software Engineer / IT Intern';
    }

    // 4. Trích xuất Mức trợ cấp / Học bổng
    const stipendMatch =
      rawText.match(
        /^[\s•*-]*(?:Mức\s*trợ\s*cấp|Trợ\s*cấp(?:\s*thực\s*tập)?|Học\s*bổng(?:\s*trợ\s*cấp)?|Phụ\s*cấp|Lương|Stipend)\s*[:#-]\s*([^\n\r]+)/im
      ) ||
      rawText.match(
        /(?:Mức\s*trợ\s*cấp|Trợ\s*cấp(?:\s*thực\s*tập)?|Học\s*bổng(?:\s*trợ\s*cấp)?|Phụ\s*cấp|Lương|Stipend)\s*[:#-]\s*([^\n\r]+)/i
      ) ||
      rawText.match(/(\d{1,2}(?:[.,]\d{3})*(?:[.,]\d+)?\s*(?:VNĐ|VND|đ|triệu|tr)\s*\/\s*tháng)/i);
    const stipend =
      payload.stipend?.trim() ||
      (stipendMatch ? stipendMatch[1].trim() : '6.000.000 - 8.500.000 VNĐ/tháng');

    // 5. Trích xuất Chỉ tiêu (quota)
    const quotaMatch = rawText.match(
      /(?:Số\s*lượng(?:\s*tiếp\s*nhận)?|Chỉ\s*tiêu|Quota)\s*[:#-]\s*(\d+)/i
    );
    const quota =
      payload.quota !== undefined && Number(payload.quota) > 0
        ? Number(payload.quota)
        : quotaMatch
          ? Number(quotaMatch[1])
          : 10;

    // 6. Trích xuất Hạn nộp (deadline)
    const deadlineMatch =
      rawText.match(/(?:Hạn\s*nộp(?:\s*hồ\s*sơ)?|Hạn\s*chót|Deadline|Trước\s*ngày)\s*[:#-]*\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
      rawText.match(/\b(\d{1,2}\/\d{1,2}\/202[6-9])\b/);
    const deadline =
      payload.deadline?.trim() || (deadlineMatch ? deadlineMatch[1].trim() : '30/11/2026');

    // 7. Trích xuất Kỹ năng (skills)
    let skills: string[] = [];
    if (Array.isArray(payload.skills) && payload.skills.length > 0) {
      skills = payload.skills.map((s) => s.trim()).filter(Boolean);
    } else {
      const skillLineMatch = rawText.match(
        /(?:Kỹ\s*năng(?:\s*yêu\s*cầu)?|Yêu\s*cầu(?:\s*kỹ\s*năng)?|Skills|Tech\s*Stack)\s*[:#-]\s*([^\n\r]+)/i
      );
      if (skillLineMatch) {
        skills = skillLineMatch[1]
          .split(/[,;/•|]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.length <= 32);
      }
      if (skills.length === 0) {
        skills = TECH_SKILL_DICTIONARY.filter((sk) =>
          new RegExp(`\\b${sk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(rawText)
        );
      }
      if (skills.length === 0) {
        skills = ['Software Engineering', 'Git', 'SQL', 'Agile'];
      }
    }

    // 8. Trích xuất Địa điểm & Mô tả
    const locationMatch =
      rawText.match(
        /^[\s•*-]*(?:Địa\s*điểm(?:\s*làm\s*việc)?|Địa\s*chỉ|Location)\s*[:#-]\s*([^\n\r]+)/im
      ) ||
      rawText.match(
        /(?:Địa\s*điểm(?:\s*làm\s*việc)?|Địa\s*chỉ|Location)\s*[:#-]\s*([^\n\r]+)/i
      );
    const location =
      payload.location?.trim() ||
      (locationMatch ? locationMatch[1].trim() : matchedKnownCompany?.location || 'TP. Hồ Chí Minh');

    const descMatch = rawText.match(/(?:Mô\s*tả(?:\s*công\s*việc)?|Description|Nội\s*dung)\s*[:#-]\s*([^\n\r]+)/i);
    const description =
      payload.description?.trim() ||
      (descMatch
        ? `Được trích xuất tự động từ Email Forward: ${descMatch[1].trim()}`
        : `Được trích xuất tự động từ Email Forward của Giảng viên (${forwardedBy}): Tuyển dụng ${jobTitle} tại ${companyName}. Hỗ trợ xác nhận thực tập cho sinh viên CNTT TDTU.`);

    const acceptsBothCourses =
      payload.acceptsBothCourses !== undefined
        ? Boolean(payload.acceptsBothCourses)
        : !/chỉ\s*nhận\s*1\s*môn/i.test(rawText);

    return {
      companyName,
      taxCode,
      jobTitle,
      description,
      skills,
      stipend,
      quota,
      acceptsBothCourses,
      deadline,
      contactEmail: extractedFromEmail,
      location,
      sourceEmail: `${extractedFromEmail} (Forwarded by ${forwardedBy})`,
      forwardedBy,
      rawEmailSubject: subjectLine,
      rawEmailBody: rawText || description,
    };
  }

  private static isTdtuEmail(email: string): boolean {
    const lower = (email || '').trim().toLowerCase();
    return lower.endsWith('@tdtu.edu.vn') || lower.endsWith('@student.tdtu.edu.vn');
  }

  private static extractHeaderField(text: string, fieldName: string): string {
    const regex = new RegExp(`^\\s*${fieldName}\\s*:\\s*(.+)$`, 'im');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private static extractAllHeaderFields(text: string, fieldName: string): string[] {
    const regex = new RegExp(`^\\s*${fieldName}\\s*:\\s*(.+)$`, 'gim');
    const results: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      results.push(match[1].trim());
    }
    return results;
  }

  private static extractTdtuEmailFromHeaders(text: string): string {
    const headers = [
      ...this.extractAllHeaderFields(text, 'From'),
      ...this.extractAllHeaderFields(text, 'To'),
    ];
    for (const h of headers) {
      const em = this.extractEmailFromLine(h);
      if (em && em.endsWith('@tdtu.edu.vn') && !em.endsWith('@student.tdtu.edu.vn')) {
        return em;
      }
    }
    return '';
  }

  private static extractNonTdtuFromHeaderEmail(text: string): string {
    const fromHeaders = this.extractAllHeaderFields(text, 'From');
    for (const h of fromHeaders) {
      const em = this.extractEmailFromLine(h);
      if (em && !this.isTdtuEmail(em)) {
        return em;
      }
    }
    return '';
  }

  private static extractEmailFromLine(line: string): string {
    if (!line) return '';
    const m = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return m ? m[1].toLowerCase() : '';
  }

  private static extractFirstNonTdtuEmail(text: string): string {
    const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const email of matches) {
      const lower = email.toLowerCase();
      if (!this.isTdtuEmail(lower)) {
        return lower;
      }
    }
    return '';
  }
}
