// ============================================================================
// BULLETIN SERVICE: Bảng Tin 2 Tầng Phân Cấp Rõ Rệt (Lưu trữ SQLite bền vững)
// - TẦNG TRÊN: Bảng tin Thông báo của Giảng viên & Khoa CNTT (Ghim tin, Đăng tin, Xóa tin)
// - TẦNG DƯỚI: Bảng tin Tuyển dụng JD & Luồng Email Forward Parser + Duyệt 1-Click + Ứng tuyển
// ============================================================================

import type {
  LecturerAnnouncement,
  JdPosting,
  InboundEmailPayload,
  JdApplicationPayload,
  JdApplicationRecord,
} from '../../../../../packages/shared-types/src/index.ts';
import { SqliteDatabase } from '../../database/sqlite.db.ts';
import { EmailForwardParser, SAMPLE_FORWARDED_EMAILS } from './email-parser.ts';
import type { StudentsService } from '../students/students.service.ts';

export class BulletinService {
  private readonly sqlite: SqliteDatabase;
  private readonly studentsService?: StudentsService;

  constructor(sqlite?: SqliteDatabase, studentsService?: StudentsService) {
    this.sqlite = sqlite || new SqliteDatabase(':memory:');
    this.studentsService = studentsService;
  }

  private mapRowToAnnouncement(row: any): LecturerAnnouncement {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category as LecturerAnnouncement['category'],
      isPinned: Boolean(row.is_pinned),
      authorName: row.author_name,
      authorEmail: row.author_email,
      createdAt: row.created_at,
    };
  }

  private mapRowToJd(row: any): JdPosting {
    let skills: string[] = [];
    try {
      skills = JSON.parse(row.skills_json || '[]');
    } catch {
      skills = [];
    }

    const appCountRow = this.sqlite.db
      .prepare('SELECT COUNT(*) as cnt FROM jd_applications WHERE jd_id = ?')
      .get(row.id) as { cnt: number } | undefined;

    return {
      id: row.id,
      companyName: row.company_name,
      taxCode: row.tax_code,
      jobTitle: row.job_title,
      description: row.description,
      skills,
      stipend: row.stipend,
      quota: Number(row.quota),
      acceptsBothCourses: Boolean(row.accepts_both_courses),
      deadline: row.deadline,
      contactEmail: row.contact_email || undefined,
      location: row.location || undefined,
      status: row.status as JdPosting['status'],
      sourceEmail: row.source_email,
      forwardedBy: row.forwarded_by || undefined,
      rawEmailSubject: row.raw_email_subject || undefined,
      rawEmailBody: row.raw_email_body || undefined,
      approvedBy: row.approved_by || undefined,
      applicationCount: appCountRow?.cnt || 0,
      createdAt: row.created_at,
    };
  }

  getAnnouncements(): LecturerAnnouncement[] {
    const rows = this.sqlite.db
      .prepare('SELECT * FROM lecturer_announcements ORDER BY is_pinned DESC, rowid DESC')
      .all() as any[];
    return rows.map((r) => this.mapRowToAnnouncement(r));
  }

  createAnnouncement(payload: {
    title: string;
    content: string;
    category: 'Khẩn' | 'Hướng dẫn' | 'Sự kiện';
    isPinned?: boolean;
    authorName?: string;
    authorEmail?: string;
  }): LecturerAnnouncement {
    if (!payload.title || !payload.title.trim()) {
      throw new Error('Tiêu đề thông báo không được để trống.');
    }
    if (!payload.content || !payload.content.trim()) {
      throw new Error('Nội dung thông báo không được để trống.');
    }

    const id = `ann-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const category = payload.category || 'Hướng dẫn';
    const isPinned = payload.isPinned !== undefined ? Boolean(payload.isPinned) : category === 'Khẩn';
    const authorName = payload.authorName || 'TS. Nguyễn Văn A (Phụ trách TSNN)';
    const authorEmail = payload.authorEmail || 'nguyenvana@tdtu.edu.vn';
    const createdAt = new Date().toLocaleString('vi-VN');

    this.sqlite.db
      .prepare(
        `INSERT INTO lecturer_announcements (id, title, content, category, is_pinned, author_name, author_email, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, payload.title.trim(), payload.content.trim(), category, isPinned ? 1 : 0, authorName, authorEmail, createdAt);

    const row = this.sqlite.db.prepare('SELECT * FROM lecturer_announcements WHERE id = ?').get(id);
    return this.mapRowToAnnouncement(row);
  }

  togglePinAnnouncement(id: string): LecturerAnnouncement | null {
    const row = this.sqlite.db.prepare('SELECT * FROM lecturer_announcements WHERE id = ?').get(id) as any;
    if (!row) return null;
    const nextPin = row.is_pinned ? 0 : 1;
    this.sqlite.db.prepare('UPDATE lecturer_announcements SET is_pinned = ? WHERE id = ?').run(nextPin, id);
    const updated = this.sqlite.db.prepare('SELECT * FROM lecturer_announcements WHERE id = ?').get(id);
    return this.mapRowToAnnouncement(updated);
  }

  deleteAnnouncement(id: string): boolean {
    const res = this.sqlite.db.prepare('DELETE FROM lecturer_announcements WHERE id = ?').run(id);
    return res.changes > 0;
  }

  getJdPostings(includePending = true): {
    approved: JdPosting[];
    pending: JdPosting[];
  } {
    const approvedRows = this.sqlite.db
      .prepare("SELECT * FROM jd_postings WHERE status = 'APPROVED' ORDER BY rowid DESC")
      .all() as any[];
    const pendingRows = includePending
      ? (this.sqlite.db
          .prepare("SELECT * FROM jd_postings WHERE status = 'PENDING' ORDER BY rowid DESC")
          .all() as any[])
      : [];

    return {
      approved: approvedRows.map((r) => this.mapRowToJd(r)),
      pending: pendingRows.map((r) => this.mapRowToJd(r)),
    };
  }

  getSampleEmails() {
    return SAMPLE_FORWARDED_EMAILS;
  }

  previewEmailForward(payload: InboundEmailPayload) {
    const totalCount = (
      this.sqlite.db.prepare('SELECT COUNT(*) as cnt FROM jd_postings').get() as { cnt: number }
    ).cnt;
    return EmailForwardParser.parse(payload, totalCount);
  }

  /**
   * Tiếp nhận & bóc tách tự động Email Forward JD từ Giảng viên (Inbound Email Webhook / Parser)
   */
  simulateInboundEmailForward(payload: InboundEmailPayload = {}): JdPosting {
    const totalCount = (
      this.sqlite.db.prepare('SELECT COUNT(*) as cnt FROM jd_postings').get() as { cnt: number }
    ).cnt;

    const parsed = EmailForwardParser.parse(payload, totalCount);
    const id = `jd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toLocaleDateString('vi-VN');

    this.sqlite.db
      .prepare(
        `INSERT INTO jd_postings (
          id, company_name, tax_code, job_title, description, skills_json, stipend,
          quota, accepts_both_courses, deadline, contact_email, location, status,
          source_email, forwarded_by, raw_email_subject, raw_email_body, approved_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, NULL, ?)`
      )
      .run(
        id,
        parsed.companyName,
        parsed.taxCode,
        parsed.jobTitle,
        parsed.description,
        JSON.stringify(parsed.skills),
        parsed.stipend,
        parsed.quota,
        parsed.acceptsBothCourses ? 1 : 0,
        parsed.deadline,
        parsed.contactEmail,
        parsed.location,
        parsed.sourceEmail,
        parsed.forwardedBy,
        parsed.rawEmailSubject,
        parsed.rawEmailBody,
        createdAt
      );

    // Ghi log bóc tách email forward
    this.sqlite.db
      .prepare(
        `INSERT INTO email_forward_logs (
          id, sender_email, original_from, subject, raw_body,
          extracted_tax_code, extracted_company, extracted_job_title,
          extracted_stipend, extracted_deadline, jd_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        `efwd-${Date.now()}`,
        parsed.forwardedBy,
        parsed.contactEmail,
        parsed.rawEmailSubject,
        parsed.rawEmailBody,
        parsed.taxCode,
        parsed.companyName,
        parsed.jobTitle,
        parsed.stipend,
        parsed.deadline,
        id,
        new Date().toISOString()
      );

    const row = this.sqlite.db.prepare('SELECT * FROM jd_postings WHERE id = ?').get(id);
    return this.mapRowToJd(row);
  }

  approveJdPosting(id: string, approvedBy = 'nguyenvana@tdtu.edu.vn'): JdPosting | null {
    const row = this.sqlite.db.prepare('SELECT * FROM jd_postings WHERE id = ?').get(id) as any;
    if (!row) return null;
    this.sqlite.db
      .prepare("UPDATE jd_postings SET status = 'APPROVED', approved_by = ? WHERE id = ?")
      .run(approvedBy, id);
    const updated = this.sqlite.db.prepare('SELECT * FROM jd_postings WHERE id = ?').get(id);
    return this.mapRowToJd(updated);
  }

  rejectJdPosting(id: string): boolean {
    const res = this.sqlite.db.prepare('DELETE FROM jd_postings WHERE id = ?').run(id);
    return res.changes > 0;
  }

  /**
   * Sinh viên ứng tuyển trực tiếp vào tin tuyển dụng JD trên Bảng tin
   */
  applyForJd(payload: JdApplicationPayload): {
    success: boolean;
    message: string;
    application: JdApplicationRecord;
  } {
    if (!payload.jdId || !payload.mssv) {
      throw new Error('Thiếu mã tin tuyển dụng (jdId) hoặc mã số sinh viên (MSSV).');
    }

    const jdRow = this.sqlite.db
      .prepare('SELECT * FROM jd_postings WHERE id = ?')
      .get(payload.jdId) as any;
    if (!jdRow) {
      throw new Error('Không tìm thấy tin tuyển dụng JD.');
    }
    if (jdRow.status !== 'APPROVED') {
      throw new Error('Tin tuyển dụng này đang chờ Giảng viên kiểm duyệt, chưa thể ứng tuyển.');
    }

    const cleanMssv = payload.mssv.trim().toUpperCase();
    const stu = this.studentsService?.getByMssv(cleanMssv);
    const studentName = stu?.name || `Sinh viên (${cleanMssv})`;
    const studentEmail = `${cleanMssv.toLowerCase()}@student.tdtu.edu.vn`;
    const selectedCourses =
      payload.selectedCourses && payload.selectedCourses.length > 0
        ? payload.selectedCourses
        : stu?.courses || ['Tập sự nghề nghiệp'];

    const appId = `app-${payload.jdId}-${cleanMssv}`;
    const appliedAt = new Date().toLocaleString('vi-VN');

    this.sqlite.db
      .prepare(
        `INSERT INTO jd_applications (
          id, jd_id, mssv, student_name, student_email, selected_courses_json, cv_note, status, applied_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'APPLIED', ?)
        ON CONFLICT(jd_id, mssv) DO UPDATE SET
          selected_courses_json = excluded.selected_courses_json,
          cv_note = excluded.cv_note,
          applied_at = excluded.applied_at`
      )
      .run(
        appId,
        payload.jdId,
        cleanMssv,
        studentName,
        studentEmail,
        JSON.stringify(selectedCourses),
        payload.cvNote || 'Ứng tuyển qua Bảng tin Khoa CNTT TDTU',
        appliedAt
      );

    // Nếu sinh viên đang chưa có doanh nghiệp hoặc cần Khoa hỗ trợ -> chuyển sang Đang chờ PV/KQPV
    if (
      this.studentsService &&
      stu &&
      (stu.status === 'Chưa có doanh nghiệp' || stu.status === 'Cần Khoa hỗ trợ')
    ) {
      this.studentsService.updateStudentRecord(cleanMssv, {
        status: 'Đang chờ PV/KQPV',
        company: `Đang ứng tuyển (${jdRow.company_name})`,
        taxCode: jdRow.tax_code,
        position: jdRow.job_title,
      });
    }

    return {
      success: true,
      message: `Đã gửi hồ sơ ứng tuyển vị trí "${jdRow.job_title}" tại ${jdRow.company_name} cho sinh viên ${studentName} (${cleanMssv})!`,
      application: {
        id: appId,
        jdId: payload.jdId,
        companyName: jdRow.company_name,
        roleTitle: jdRow.job_title,
        mssv: cleanMssv,
        studentName,
        studentEmail,
        selectedCourses,
        cvNote: payload.cvNote || 'Ứng tuyển qua Bảng tin Khoa CNTT TDTU',
        status: 'APPLIED',
        appliedAt,
      } as any,
    };
  }

  getJdApplications(jdId?: string, mssv?: string): JdApplicationRecord[] {
    let query = 'SELECT * FROM jd_applications';
    const params: any[] = [];
    const clauses: string[] = [];

    if (jdId) {
      clauses.push('jd_id = ?');
      params.push(jdId);
    }
    if (mssv) {
      clauses.push('LOWER(mssv) = LOWER(?)');
      params.push(mssv.trim());
    }
    if (clauses.length > 0) {
      query += ' WHERE ' + clauses.join(' AND ');
    }
    query += ' ORDER BY rowid DESC';

    const rows = this.sqlite.db.prepare(query).all(...params) as any[];
    return rows.map((r) => ({
      id: r.id,
      jdId: r.jd_id,
      mssv: r.mssv,
      studentName: r.student_name,
      studentEmail: r.student_email,
      selectedCourses: JSON.parse(r.selected_courses_json || '[]'),
      cvNote: r.cv_note || '',
      status: r.status,
      appliedAt: r.applied_at,
    }));
  }
}
