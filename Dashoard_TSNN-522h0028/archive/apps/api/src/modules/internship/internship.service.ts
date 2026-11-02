// ============================================================================
// INTERNSHIP SERVICE: Khai báo 1 môn HOẶC 2 môn cùng lúc & Xác nhận MST
// ============================================================================

import type {
  InternshipDeclarationPayload,
  StudentRecord,
  IntroductionLetterPayload,
  IntroductionLetterRecord,
  InternshipDocumentRecord,
} from '../../../../../packages/shared-types/src/index.ts';
import type { StudentsService } from '../students/students.service.ts';
import { CompanyTaxAdapter } from './tax-lookup.adapter.ts';

export class InternshipService {
  private readonly taxAdapter: CompanyTaxAdapter;
  private readonly studentsService: StudentsService;

  constructor(studentsService: StudentsService, taxAdapter: CompanyTaxAdapter) {
    this.studentsService = studentsService;
    this.taxAdapter = taxAdapter;
  }

  async lookupCompanyByMst(mst: string) {
    return this.taxAdapter.lookupByTaxCode(mst);
  }

  /**
   * Sinh viên xác nhận thông tin sau khi đọc bảng đối soát MST và nộp lại
   * Hỗ trợ đăng ký 1 môn hoặc đồng thời cả 2 môn (KTCN + TSNN / DA CNTT 1) cho cùng 1 doanh nghiệp
   * Hoặc chọn 1 trong 2 option khi chưa có doanh nghiệp (Tự tìm vs Cần Khoa hỗ trợ)
   */
  submitDeclaration(payload: InternshipDeclarationPayload): {
    success: boolean;
    message: string;
    updatedStudent: StudentRecord | null;
  } {
    if (!payload.mssv || !payload.mssv.trim()) {
      throw new Error('Thiếu mã số sinh viên (MSSV).');
    }

    if (!payload.selectedCourses || payload.selectedCourses.length === 0) {
      throw new Error('Sinh viên phải chọn ít nhất 1 môn học (hoặc cả 2 môn cùng lúc).');
    }

    const existing = this.studentsService.getByMssv(payload.mssv);
    if (!existing) {
      throw new Error(`Không tìm thấy hồ sơ sinh viên với MSSV: ${payload.mssv}`);
    }

    const courseShortLabels = payload.selectedCourses.map((c) => {
      if (c.includes('Kiến tập')) return 'KTCN';
      if (c.includes('Tập sự')) return 'TSNN';
      if (c.includes('Dự án')) return 'DA CNTT 1';
      return c;
    });
    const courseStr = courseShortLabels.join(' + ');

    if (payload.hasCompany) {
      if (!payload.isConfirmedByStudent) {
        throw new Error('Sinh viên cần đọc kỹ thông tin thu thập từ MST và tích xác nhận trước khi nộp.');
      }

      const shortCompany = payload.companyName
        ? payload.companyName
            .replace('CÔNG TY CỔ PHẦN PHẦN MỀM FPT (FPT SOFTWARE)', 'FPT Software')
            .replace('TẬP ĐOÀN CÔNG NGHIỆP - VIỄN THÔNG QUÂN ĐỘI (VIETTEL)', 'Viettel Cyber Security')
            .replace('CÔNG TY CỔ PHẦN VNG (VNG CORPORATION)', 'VNG Corporation')
            .replace('CÔNG TY TNHH KMS TECHNOLOGY VIỆT NAM', 'KMS Technology')
            .replace('CÔNG TY TNHH DXC TECHNOLOGY VIỆT NAM', 'DXC Technology')
            .replace('CÔNG TY CỔ PHẦN MISA (MISA JSC)', 'MISA JSC')
            .replace('CÔNG TY TNHH NASHTECH VIỆT NAM', 'NashTech')
            .replace('CÔNG TY CỔ PHẦN NETNAM (NETNAM CORP)', 'NetNam Corp')
        : 'Doanh nghiệp tiếp nhận';

      const updated = this.studentsService.updateStudentRecord(payload.mssv, {
        courses: payload.selectedCourses,
        course_str: courseStr,
        status: 'Có doanh nghiệp',
        company: shortCompany,
        taxCode: payload.taxCode?.trim() || '0303882213',
        companyAddress: payload.companyAddress?.trim() || existing.companyAddress,
        industry: payload.industry?.trim() || existing.industry,
        representative: payload.representative?.trim() || existing.representative,
        position: payload.internPosition?.trim() || 'Thực tập sinh CNTT',
        mentor: payload.mentorContact?.trim() || 'Chưa cập nhật',
        supportOption: undefined,
        preferredField: undefined,
      });

      return {
        success: true,
        message: `Đã xác nhận thông tin MST (${payload.taxCode || '0303882213'}) và nộp hồ sơ thực tập cho ${payload.selectedCourses.length} môn (${courseStr}) tại ${shortCompany}!`,
        updatedStudent: updated,
      };
    } else {
      const opt = payload.supportOption === 'faculty' ? 'faculty' : 'self';
      const status = opt === 'faculty' ? 'Cần Khoa hỗ trợ' : 'Chưa có doanh nghiệp';
      const companyNote =
        opt === 'faculty'
          ? `Chưa có (Nhờ Khoa hỗ trợ: ${payload.preferredField || 'CNTT'})`
          : 'Chưa có (Đang tự tìm kiếm)';

      const updated = this.studentsService.updateStudentRecord(payload.mssv, {
        courses: payload.selectedCourses,
        course_str: courseStr,
        status,
        company: companyNote,
        taxCode: undefined,
        companyAddress: undefined,
        industry: undefined,
        representative: undefined,
        position: undefined,
        mentor: undefined,
        supportOption: opt,
        preferredField: payload.preferredField || 'Phát triển phần mềm & Hệ thống CNTT',
      });

      return {
        success: true,
        message: `Đã cập nhật trạng thái "${status}" cho môn ${courseStr}. Hệ thống Dashboard đã đồng bộ tức thì!`,
        updatedStudent: updated,
      };
    }
  }

  // ============================================================================
  // INT-02 & INT-03: GIẤY GIỚI THIỆU THỰC TẬP (GGT) - NỘP ĐƠN, DUYỆT & IN PDF
  // ============================================================================

  /**
   * Sinh viên nộp yêu cầu cấp Giấy giới thiệu thực tập (GGT) gửi Doanh nghiệp
   */
  requestIntroductionLetter(payload: IntroductionLetterPayload): IntroductionLetterRecord {
    if (!payload.mssv || !payload.mssv.trim()) {
      throw new Error('Mã số sinh viên (MSSV) không được để trống.');
    }
    if (!payload.recipientCompany || !payload.recipientCompany.trim()) {
      throw new Error('Tên đơn vị tiếp nhận (Công ty/Doanh nghiệp) không được để trống.');
    }

    const student = this.studentsService.getByMssv(payload.mssv.trim());
    if (!student) {
      throw new Error(`Không tìm thấy hồ sơ sinh viên MSSV ${payload.mssv} trong danh sách được phép đăng ký thực tập kỳ này.`);
    }

    const year = new Date().getFullYear();
    const randomSeq = Math.floor(Math.random() * 9000 + 1000);
    const letterNo = `GGT-${year}/${randomSeq}/CNTT`;
    const id = `ggt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const courses = (payload.courses && payload.courses.length > 0) ? payload.courses : student.courses;
    const nowIso = new Date().toISOString();
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 60);
    const validUntil = validUntilDate.toISOString().split('T')[0];

    const rep = payload.recipientRepresentative?.trim() || 'Ban Giám đốc / Phòng Nhân sự';
    const addr = payload.recipientAddress?.trim() || 'Trụ sở / Chi nhánh tiếp nhận thực tập sinh';
    const pos = payload.positionApplied?.trim() || 'Thực tập sinh Công nghệ thông tin';
    const purpose = payload.purpose?.trim() || 'Liên hệ thực tập tốt nghiệp & hoàn thành học phần KTCN/TSNN';

    const db = this.studentsService.getSqlite().getDb();
    const stmt = db.prepare(`
      INSERT INTO introduction_letters (
        id, letter_no, student_id, student_name, class_name, major, courses_json,
        recipient_company, recipient_representative, recipient_address, position_applied,
        purpose, status, requested_at, valid_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CHO_DUYET', ?, ?)
    `);

    stmt.run(
      id,
      letterNo,
      student.mssv,
      student.name,
      student.class,
      student.major,
      JSON.stringify(courses),
      payload.recipientCompany.trim(),
      rep,
      addr,
      pos,
      purpose,
      nowIso,
      validUntil
    );

    return {
      id,
      letterNo,
      studentId: student.mssv,
      studentName: student.name,
      className: student.class,
      major: student.major,
      courses,
      recipientCompany: payload.recipientCompany.trim(),
      recipientRepresentative: rep,
      recipientAddress: addr,
      positionApplied: pos,
      purpose,
      status: 'CHO_DUYET',
      requestedAt: nowIso,
      validUntil,
    };
  }

  /**
   * Lấy danh sách Giấy giới thiệu (Lọc theo studentId nếu là sinh viên, hoặc lấy tất cả cho Giảng viên)
   */
  getIntroductionLetters(studentId?: string): IntroductionLetterRecord[] {
    const db = this.studentsService.getSqlite().getDb();
    let rows: any[];
    if (studentId && studentId.trim()) {
      rows = db.prepare(`
        SELECT * FROM introduction_letters
        WHERE student_id = ?
        ORDER BY requested_at DESC
      `).all(studentId.trim());
    } else {
      rows = db.prepare(`
        SELECT * FROM introduction_letters
        ORDER BY requested_at DESC
      `).all();
    }

    return rows.map((r) => {
      let courses: string[] = [];
      try {
        courses = JSON.parse(r.courses_json || '[]');
      } catch {
        courses = [];
      }
      return {
        id: r.id,
        letterNo: r.letter_no,
        studentId: r.student_id,
        studentName: r.student_name,
        className: r.class_name,
        major: r.major,
        courses,
        recipientCompany: r.recipient_company,
        recipientRepresentative: r.recipient_representative,
        recipientAddress: r.recipient_address,
        positionApplied: r.position_applied,
        purpose: r.purpose,
        status: r.status,
        requestedAt: r.requested_at,
        approvedAt: r.approved_at || undefined,
        approvedBy: r.approved_by || undefined,
        validUntil: r.valid_until,
      };
    });
  }

  /**
   * Lấy chi tiết 1 Giấy giới thiệu theo ID
   */
  getIntroductionLetterById(id: string): IntroductionLetterRecord | null {
    const db = this.studentsService.getSqlite().getDb();
    const r = db.prepare('SELECT * FROM introduction_letters WHERE id = ?').get(id) as any;
    if (!r) return null;
    let courses: string[] = [];
    try {
      courses = JSON.parse(r.courses_json || '[]');
    } catch {
      courses = [];
    }
    return {
      id: r.id,
      letterNo: r.letter_no,
      studentId: r.student_id,
      studentName: r.student_name,
      className: r.class_name,
      major: r.major,
      courses,
      recipientCompany: r.recipient_company,
      recipientRepresentative: r.recipient_representative,
      recipientAddress: r.recipient_address,
      positionApplied: r.position_applied,
      purpose: r.purpose,
      status: r.status,
      requestedAt: r.requested_at,
      approvedAt: r.approved_at || undefined,
      approvedBy: r.approved_by || undefined,
      validUntil: r.valid_until,
    };
  }

  /**
   * Giảng viên duyệt Giấy giới thiệu thực tập
   */
  approveIntroductionLetter(id: string, approverName = 'TS. Trưởng Khoa CNTT'): IntroductionLetterRecord {
    const letter = this.getIntroductionLetterById(id);
    if (!letter) {
      throw new Error(`Không tìm thấy Giấy giới thiệu với ID: ${id}`);
    }

    const db = this.studentsService.getSqlite().getDb();
    const approvedAt = new Date().toISOString();
    db.prepare(`
      UPDATE introduction_letters
      SET status = 'DA_DUYET',
          approved_at = ?,
          approved_by = ?
      WHERE id = ?
    `).run(approvedAt, approverName, id);

    return {
      ...letter,
      status: 'DA_DUYET',
      approvedAt,
      approvedBy: approverName,
    };
  }

  /**
   * Sinh mẫu in HTML chuẩn học thuật Đại học Tôn Đức Thắng (A4 Print Preview)
   */
  generatePrintableLetterHtml(id: string): string {
    const letter = this.getIntroductionLetterById(id);
    if (!letter) {
      throw new Error(`Không tìm thấy Giấy giới thiệu với ID: ${id}`);
    }

    const courseListText = letter.courses.join(' & ');
    const printDate = new Date();
    const dayStr = String(printDate.getDate()).padStart(2, '0');
    const monthStr = String(printDate.getMonth() + 1).padStart(2, '0');
    const yearStr = printDate.getFullYear();

    const isApproved = letter.status === 'DA_DUYET';
    const stampHtml = isApproved
      ? `
        <div style="border: 2px dashed #005baa; padding: 8px 16px; border-radius: 8px; display: inline-block; background: #f0f7ff; margin-top: 10px;">
          <div style="font-size: 11px; font-weight: 800; color: #005baa; text-transform: uppercase;">Xác nhận điện tử hợp lệ</div>
          <div style="font-size: 11px; color: #1e3a8a;">Ký bởi: <strong>${letter.approvedBy || 'Ban Chủ nhiệm Khoa CNTT'}</strong></div>
          <div style="font-size: 10px; color: #64748b;">Thời gian phê duyệt: ${new Date(letter.approvedAt || letter.requestedAt).toLocaleString('vi-VN')}</div>
          <div style="font-size: 9px; color: #059669; font-weight: 700;">Mã tra cứu: ${letter.id}</div>
        </div>
      `
      : `
        <div style="border: 2px dashed #f59e0b; padding: 8px 16px; border-radius: 8px; display: inline-block; background: #fffbeb; margin-top: 10px;">
          <div style="font-size: 11px; font-weight: 800; color: #d97706; text-transform: uppercase;">Đang chờ Khoa CNTT ký duyệt</div>
          <div style="font-size: 10px; color: #78350f;">(Bản xem trước phục vụ kiểm tra thông tin đối soát)</div>
        </div>
      `;

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Giấy giới thiệu thực tập - ${letter.studentName} (${letter.studentId})</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 20mm 20mm 20mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.5;
      color: #111827;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
    }
    .sheet {
      background: #ffffff;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 50px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .header-table td {
      vertical-align: top;
      font-size: 12pt;
    }
    .university-title {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11pt;
      color: #005baa;
    }
    .faculty-title {
      font-weight: 700;
      font-size: 11pt;
      text-decoration: underline;
    }
    .letter-no {
      font-size: 10.5pt;
      margin-top: 6px;
      color: #334155;
    }
    .motto-country {
      text-align: center;
      font-weight: 700;
      font-size: 11.5pt;
      text-transform: uppercase;
    }
    .motto-subtitle {
      text-align: center;
      font-weight: 700;
      font-size: 11.5pt;
      border-bottom: 1px solid #111;
      padding-bottom: 4px;
      display: inline-block;
    }
    .date-city {
      text-align: center;
      font-style: italic;
      font-size: 11pt;
      margin-top: 6px;
    }
    .doc-title {
      text-align: center;
      margin-top: 30px;
      margin-bottom: 20px;
    }
    .doc-title h1 {
      font-size: 18pt;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0;
      color: #005baa;
      letter-spacing: 0.5px;
    }
    .doc-title p {
      font-style: italic;
      margin: 6px 0 0 0;
      font-size: 12pt;
      color: #334155;
    }
    .recipient-box {
      margin: 20px 0 24px 0;
      padding: 12px 18px;
      background: #f8fafc;
      border-left: 4px solid #005baa;
      font-size: 12.5pt;
    }
    .content-body {
      text-align: justify;
      margin-bottom: 30px;
    }
    .content-body p {
      margin: 10px 0;
    }
    .student-info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .student-info-table td {
      padding: 5px 8px;
      vertical-align: top;
      font-size: 12.5pt;
    }
    .student-info-table td.label {
      width: 220px;
      font-weight: 600;
      color: #1f2937;
    }
    .signatures {
      width: 100%;
      margin-top: 40px;
      border-collapse: collapse;
    }
    .signatures td {
      text-align: center;
      vertical-align: top;
      width: 50%;
      font-size: 12.5pt;
    }
    .btn-bar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-print {
      background: #005baa;
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 6px;
      border: none;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(0,91,170,0.3);
    }
    .btn-print:hover {
      background: #004480;
    }
    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .sheet {
        box-shadow: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
      }
      .btn-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="btn-bar">
    <div style="font-size: 13px; color: #475569;">
      Hệ thống Quản lý Thực tập & Tập sự nghề nghiệp - Khoa CNTT TDTU
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ In Giấy Giới Thiệu (PDF)
    </button>
  </div>

  <div class="sheet">
    <table class="header-table">
      <tr>
        <td style="width: 48%; text-align: center;">
          <div class="university-title">TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG</div>
          <div class="faculty-title">KHOA CÔNG NGHỆ THÔNG TIN</div>
          <div class="letter-no">Số: <strong>${letter.letterNo}</strong></div>
        </td>
        <td style="width: 52%; text-align: center;">
          <div class="motto-country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div><span class="motto-subtitle">Độc lập - Tự do - Hạnh phúc</span></div>
          <div class="date-city">TP. Hồ Chí Minh, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</div>
        </td>
      </tr>
    </table>

    <div class="doc-title">
      <h1>GIẤY GIỚI THIỆU</h1>
      <p>(V/v Tiếp nhận sinh viên thực tập doanh nghiệp - Học kỳ 1, Năm học 2026-2027)</p>
    </div>

    <div class="recipient-box">
      <div><strong>Kính gửi:</strong> BAN LÃNH ĐẠO / PHÒNG NHÂN SỰ</div>
      <div style="font-weight: 700; color: #005baa; font-size: 13.5pt; margin-top: 4px;">${letter.recipientCompany}</div>
      <div style="font-size: 11.5pt; color: #475569; margin-top: 3px;">Địa chỉ: ${letter.recipientAddress}</div>
      <div style="font-size: 11.5pt; color: #475569; margin-top: 2px;">Người đại diện liên hệ: ${letter.recipientRepresentative}</div>
    </div>

    <div class="content-body">
      <p>
        Khoa Công nghệ Thông tin - Trường Đại học Tôn Đức Thắng trân trọng gửi lời chào hợp tác và lời chúc phát triển thịnh vượng đến Quý Doanh nghiệp.
      </p>
      <p>
        Thực hiện chương trình đào tạo định hướng ứng dụng thực tế của Nhà trường, Khoa Công nghệ Thông tin trân trọng giới thiệu sinh viên sau đây được đến liên hệ thực tập và tham gia làm việc thực tế tại Quý Doanh nghiệp:
      </p>

      <table class="student-info-table">
        <tr>
          <td class="label">Họ và tên sinh viên:</td>
          <td><strong style="text-transform: uppercase; font-size: 13pt;">${letter.studentName}</strong></td>
        </tr>
        <tr>
          <td class="label">Mã số sinh viên (MSSV):</td>
          <td><strong style="color: #005baa;">${letter.studentId}</strong></td>
        </tr>
        <tr>
          <td class="label">Lớp sinh hoạt:</td>
          <td>${letter.className}</td>
        </tr>
        <tr>
          <td class="label">Ngành đào tạo:</td>
          <td>${letter.major}</td>
        </tr>
        <tr>
          <td class="label">Học phần đăng ký:</td>
          <td><strong>${courseListText}</strong></td>
        </tr>
        <tr>
          <td class="label">Vị trí mong muốn thực tập:</td>
          <td><strong>${letter.positionApplied}</strong></td>
        </tr>
        <tr>
          <td class="label">Mục đích thực tập:</td>
          <td>${letter.purpose}</td>
        </tr>
        <tr>
          <td class="label">Thời hạn giấy giới thiệu:</td>
          <td>Có hiệu lực đến hết ngày <strong>${letter.validUntil}</strong></td>
        </tr>
      </table>

      <p>
        Kính mong Quý Doanh nghiệp tạo điều kiện thuận lợi để sinh viên được tiếp cận môi trường làm việc chuyên nghiệp, rèn luyện kỹ năng thực tế và hoàn thành tốt nội dung chương trình học phần.
      </p>
      <p>
        Khoa Công nghệ Thông tin - Trường Đại học Tôn Đức Thắng xin chân thành cảm ơn sự đồng hành và hỗ trợ quý báu của Quý Doanh nghiệp.
      </p>
    </div>

    <table class="signatures">
      <tr>
        <td>
          <div style="font-weight: 700;">SINH VIÊN THỰC HIỆN</div>
          <div style="font-style: italic; font-size: 11pt; color: #64748b;">(Ký và ghi rõ họ tên)</div>
          <div style="height: 65px;"></div>
          <div style="font-weight: 700;">${letter.studentName}</div>
        </td>
        <td>
          <div style="font-weight: 700; text-transform: uppercase;">TRƯỞNG KHOA CÔNG NGHỆ THÔNG TIN</div>
          <div style="font-style: italic; font-size: 11pt; color: #64748b;">(Ký tên, đóng dấu hoặc xác thực điện tử)</div>
          ${stampHtml}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  // ============================================================================
  // DATA-02: BIỂU MẪU & QUY ĐỊNH THỰC TẬP (INTERNSHIP DOCUMENTS)
  // ============================================================================

  /**
   * Lấy danh mục biểu mẫu, quy chế và tài liệu hướng dẫn thực tập TDTU
   */
  getInternshipDocuments(): InternshipDocumentRecord[] {
    const db = this.studentsService.getSqlite().getDb();
    const rows = db.prepare('SELECT * FROM internship_documents ORDER BY code ASC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      category: r.category,
      description: r.description,
      fileFormat: r.file_format,
      fileSize: r.file_size,
      downloadUrl: r.download_url,
      updatedAt: r.updated_at,
    }));
  }
}
