// ============================================================================
// STUDENTS SERVICE: Quản lý 91 Sinh viên thực tế (134 lượt đăng ký môn, 43 SV đi 2 môn)
// Lưu trữ bền vững trực tiếp trên SQLite Database (Đồng bộ Prisma Schema)
// ============================================================================

import type {
  StudentRecord,
  InternshipStatus,
  CourseEnrollmentRecord,
} from '../../../../../packages/shared-types/src/index.ts';
import { SqliteDatabase } from '../../database/sqlite.db.ts';

export interface StudentFilterQuery {
  search?: string;
  course?: string; // 'both' | 'Tập sự nghề nghiệp' | 'Kiến tập công nghiệp' | 'Dự án Công nghệ thông tin 1'
  major?: string;
  status?: string;
}

export class StudentsService {
  private readonly sqlite: SqliteDatabase;

  constructor(sqlite?: SqliteDatabase) {
    this.sqlite = sqlite || new SqliteDatabase(':memory:');
  }

  getSqlite(): SqliteDatabase {
    return this.sqlite;
  }

  private mapRowToStudent(row: any, includeEnrollments = false): StudentRecord {
    let courses: string[] = [];
    try {
      courses = JSON.parse(row.courses_json || '[]');
    } catch {
      courses = [];
    }

    const record: StudentRecord = {
      stt: Number(row.stt),
      mssv: row.mssv,
      name: row.name,
      dob: row.dob,
      pob: row.pob,
      gender: row.gender,
      class: row.class_name,
      major: row.major,
      courses,
      course_str: row.course_str,
      status: row.status as InternshipStatus,
      company: row.company,
      taxCode: row.tax_code || undefined,
      companyAddress: row.company_address || undefined,
      industry: row.industry || undefined,
      representative: row.representative || undefined,
      position: row.position || undefined,
      mentor: row.mentor || undefined,
      supportOption: row.support_option || undefined,
      preferredField: row.preferred_field || undefined,
      cert: row.cert,
      certStatus: row.cert_status as StudentRecord['certStatus'],
      certCode: row.cert_code || undefined,
      certScore: row.cert_score || undefined,
      certNumber: row.cert_number || undefined,
      examDate: row.exam_date || undefined,
      commitmentDeadline: row.commitment_deadline || undefined,
      proofFileName: row.proof_file_name || undefined,
      gpa: Number(row.gpa),
      updated: row.updated,
    };

    if (includeEnrollments) {
      const enrRows = this.sqlite.db
        .prepare('SELECT * FROM course_enrollments WHERE LOWER(student_id) = LOWER(?) ORDER BY registered_at ASC')
        .all(row.mssv) as any[];
      record.enrollments = enrRows.map((e) => ({
        id: e.id,
        studentId: e.student_id,
        courseCode: e.course_code,
        courseName: e.course_name,
        groupCode: e.group_code,
        campus: e.campus,
        semester: e.semester,
        registeredAt: e.registered_at,
      }));
    }

    return record;
  }

  getAll(filter: StudentFilterQuery = {}): {
    totalStudents: number;
    totalEnrollments: number;
    bothCoursesCount: number;
    filteredCount: number;
    items: StudentRecord[];
  } {
    const rows = this.sqlite.db.prepare('SELECT * FROM students ORDER BY stt ASC').all() as any[];
    const allStudents = rows.map((r) => this.mapRowToStudent(r));
    let list = [...allStudents];

    if (filter.search) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.mssv.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.company.toLowerCase().includes(q) ||
          s.class.toLowerCase().includes(q) ||
          (s.taxCode && s.taxCode.toLowerCase().includes(q))
      );
    }

    if (filter.course) {
      if (filter.course === 'both') {
        list = list.filter((s) => s.courses.length >= 2);
      } else {
        list = list.filter((s) => s.courses.some((c) => c.includes(filter.course!)));
      }
    }

    if (filter.major) {
      list = list.filter((s) => s.major === filter.major);
    }

    if (filter.status) {
      list = list.filter((s) => s.status === filter.status);
    }

    const totalEnrollments = allStudents.reduce((sum, s) => sum + s.courses.length, 0);
    const bothCoursesCount = allStudents.filter((s) => s.courses.length >= 2).length;

    return {
      totalStudents: allStudents.length,
      totalEnrollments,
      bothCoursesCount,
      filteredCount: list.length,
      items: list,
    };
  }

  getByMssv(mssv: string): StudentRecord | undefined {
    const row = this.sqlite.db
      .prepare('SELECT * FROM students WHERE LOWER(mssv) = LOWER(?)')
      .get(mssv.trim()) as any;
    if (!row) return undefined;
    return this.mapRowToStudent(row, true);
  }

  updateStudentRecord(mssv: string, patch: Partial<StudentRecord>): StudentRecord | null {
    const existing = this.getByMssv(mssv);
    if (!existing) return null;

    const nowStr = new Date().toLocaleDateString('vi-VN');
    const merged: StudentRecord = {
      ...existing,
      ...patch,
      updated: nowStr,
    };

    this.sqlite.db
      .prepare(
        `UPDATE students SET
          name = ?,
          class_name = ?,
          major = ?,
          courses_json = ?,
          course_str = ?,
          status = ?,
          company = ?,
          tax_code = ?,
          company_address = ?,
          industry = ?,
          representative = ?,
          position = ?,
          mentor = ?,
          support_option = ?,
          preferred_field = ?,
          cert = ?,
          cert_status = ?,
          cert_code = ?,
          cert_score = ?,
          cert_number = ?,
          exam_date = ?,
          commitment_deadline = ?,
          proof_file_name = ?,
          gpa = ?,
          updated = ?
        WHERE LOWER(mssv) = LOWER(?)`
      )
      .run(
        merged.name,
        merged.class,
        merged.major,
        JSON.stringify(merged.courses),
        merged.course_str,
        merged.status,
        merged.company,
        merged.taxCode ?? null,
        merged.companyAddress ?? null,
        merged.industry ?? null,
        merged.representative ?? null,
        merged.position ?? null,
        merged.mentor ?? null,
        merged.supportOption ?? null,
        merged.preferredField ?? null,
        merged.cert,
        merged.certStatus || 'Đã thẩm định',
        merged.certCode ?? null,
        merged.certScore ?? null,
        merged.certNumber ?? null,
        merged.examDate ?? null,
        merged.commitmentDeadline ?? null,
        merged.proofFileName ?? null,
        merged.gpa,
        merged.updated,
        existing.mssv
      );

    // Đồng bộ bảng internship_declarations
    const hasComp = merged.status === 'Có doanh nghiệp' ? 1 : 0;
    const nowIso = new Date().toISOString();
    this.sqlite.db
      .prepare(
        `INSERT INTO internship_declarations (
          id, student_id, selected_courses_json, has_company, tax_code, company_name,
          company_address, industry, representative, intern_position, mentor_contact,
          status, support_option, preferred_field, is_confirmed_by_student, confirmed_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id) DO UPDATE SET
          selected_courses_json = excluded.selected_courses_json,
          has_company = excluded.has_company,
          tax_code = excluded.tax_code,
          company_name = excluded.company_name,
          company_address = excluded.company_address,
          industry = excluded.industry,
          representative = excluded.representative,
          intern_position = excluded.intern_position,
          mentor_contact = excluded.mentor_contact,
          status = excluded.status,
          support_option = excluded.support_option,
          preferred_field = excluded.preferred_field,
          is_confirmed_by_student = excluded.is_confirmed_by_student,
          confirmed_at = excluded.confirmed_at,
          updated_at = excluded.updated_at`
      )
      .run(
        `decl-${existing.mssv}`,
        existing.mssv,
        JSON.stringify(merged.courses),
        hasComp,
        merged.taxCode ?? null,
        merged.company,
        merged.companyAddress ?? null,
        merged.industry ?? null,
        merged.representative ?? null,
        merged.position ?? null,
        merged.mentor ?? null,
        merged.status,
        merged.supportOption ?? null,
        merged.preferredField ?? null,
        hasComp,
        hasComp ? nowIso : null,
        nowIso
      );

    return this.getByMssv(existing.mssv) || null;
  }

  /**
   * Giảng viên / Admin can thiệp trực tiếp trạng thái thực tập & điều phối doanh nghiệp cho sinh viên
   */
  interveneStudentStatus(
    mssv: string,
    payload: {
      status: InternshipStatus;
      company?: string;
      taxCode?: string;
      position?: string;
      mentor?: string;
      certStatus?: StudentRecord['certStatus'];
    }
  ): StudentRecord | null {
    const existing = this.getByMssv(mssv);
    if (!existing) return null;

    const patch: Partial<StudentRecord> = {
      status: payload.status,
    };

    if (payload.company !== undefined) {
      patch.company = payload.company;
    } else if (payload.status === 'Chưa có doanh nghiệp' && existing.company === 'FPT Software') {
      patch.company = 'Chưa có';
    }

    if (payload.taxCode !== undefined) patch.taxCode = payload.taxCode;
    if (payload.position !== undefined) patch.position = payload.position;
    if (payload.mentor !== undefined) patch.mentor = payload.mentor;
    if (payload.certStatus !== undefined) patch.certStatus = payload.certStatus;

    return this.updateStudentRecord(mssv, patch);
  }

  /**
   * Giảng viên / Admin import bổ sung hoặc cập nhật danh sách sinh viên từ CSV / Excel
   */
  importStudentsBatch(
    rows: Array<{
      mssv: string;
      name: string;
      dob?: string;
      pob?: string;
      gender?: string;
      class?: string;
      major?: string;
      courses?: string[];
      status?: InternshipStatus;
      company?: string;
      cert?: string;
      gpa?: number;
    }>
  ): { importedCount: number; updatedCount: number; totalStudents: number } {
    let importedCount = 0;
    let updatedCount = 0;

    for (const item of rows) {
      if (!item.mssv || !item.name) continue;
      const cleanMssv = item.mssv.trim().toUpperCase();
      const existing = this.getByMssv(cleanMssv);
      const courses =
        item.courses && item.courses.length > 0 ? item.courses : ['Tập sự nghề nghiệp'];
      const shortLabels = courses.map((c) => {
        if (c.includes('Kiến tập')) return 'KTCN';
        if (c.includes('Tập sự')) return 'TSNN';
        if (c.includes('Dự án')) return 'DA CNTT 1';
        return c;
      });
      const course_str = shortLabels.join(' + ');

      if (existing) {
        this.updateStudentRecord(cleanMssv, {
          name: item.name.trim(),
          class: item.class || existing.class,
          major: item.major || existing.major,
          courses: item.courses ? courses : existing.courses,
          course_str: item.courses ? course_str : existing.course_str,
          status: item.status || existing.status,
          company: item.company || existing.company,
          cert: item.cert || existing.cert,
        });
        this.sqlite.db
          .prepare(
            `INSERT INTO users (
              id, email, full_name, role, is_admin, student_id, department, granted_by,
              firebase_uid, auth_provider, is_active, created_at
            ) VALUES (?, ?, ?, 'SV', 0, ?, 'Khoa Công Nghệ Thông Tin - TDTU', NULL, ?, 'google.com', 1, ?)
            ON CONFLICT(email) DO UPDATE SET
              full_name = excluded.full_name,
              student_id = excluded.student_id`
          )
          .run(
            `usr-sv-${cleanMssv}`,
            `${cleanMssv.toLowerCase()}@student.tdtu.edu.vn`,
            item.name.trim(),
            cleanMssv,
            `fb-tdtu-usr-sv-${cleanMssv}`,
            new Date().toISOString()
          );
        updatedCount++;
      } else {
        const maxSttRow = this.sqlite.db
          .prepare('SELECT MAX(stt) as maxStt FROM students')
          .get() as { maxStt: number | null };
        const nextStt = (maxSttRow?.maxStt || 0) + 1;
        const nameParts = item.name.trim().split(/\s+/);
        const firstName = nameParts[nameParts.length - 1] || item.name;
        const lastName = nameParts.slice(0, -1).join(' ') || item.name;
        const status = item.status || 'Chưa có doanh nghiệp';
        const company = item.company || 'Chưa có';
        const cert = item.cert || 'Chưa có';
        const certStatus =
          cert === 'Chưa có' ? 'Chưa nộp' : cert === 'Cam kết nộp sau' ? 'Cam kết nộp sau' : 'Đã thẩm định';
        const nowStr = new Date().toLocaleDateString('vi-VN');

        this.sqlite.db
          .prepare(
            `INSERT INTO students (
              mssv, stt, last_name, first_name, name, dob, pob, gender, class_name, campus, major,
              courses_json, course_str, status, company, cert, cert_status, gpa, updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            cleanMssv,
            nextStt,
            lastName,
            firstName,
            item.name.trim(),
            item.dob || '2004-01-01',
            item.pob || 'TP. Hồ Chí Minh',
            item.gender || 'Nam',
            item.class || '22050201',
            '0 - TP. Hồ Chí Minh',
            item.major || 'Kỹ thuật phần mềm',
            JSON.stringify(courses),
            course_str,
            status,
            company,
            cert,
            certStatus,
            item.gpa ?? 3.0,
            nowStr
          );

        for (const cName of courses) {
          const code = cName.includes('Kiến tập')
            ? '504074'
            : cName.includes('Tập sự')
              ? '502090'
              : '504078';
          this.sqlite.db
            .prepare(
              `INSERT OR IGNORE INTO course_enrollments (
                id, student_id, course_code, course_name, group_code, campus, semester, registered_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .run(
              `enr-${Date.now()}-${cleanMssv}-${code}`,
              cleanMssv,
              code,
              cName,
              '01',
              '0 - TP. Hồ Chí Minh',
              'HK1_2026-2027',
              new Date().toISOString().slice(0, 10)
            );
        }

        // Tự động đồng bộ tài khoản Firebase cho sinh viên mới được import
        this.sqlite.db
          .prepare(
            `INSERT INTO users (
              id, email, full_name, role, is_admin, student_id, department, granted_by,
              firebase_uid, auth_provider, is_active, created_at
            ) VALUES (?, ?, ?, 'SV', 0, ?, 'Khoa Công Nghệ Thông Tin - TDTU', NULL, ?, 'google.com', 1, ?)
            ON CONFLICT(email) DO UPDATE SET
              full_name = excluded.full_name,
              student_id = excluded.student_id`
          )
          .run(
            `usr-sv-${cleanMssv}`,
            `${cleanMssv.toLowerCase()}@student.tdtu.edu.vn`,
            item.name.trim(),
            cleanMssv,
            `fb-tdtu-usr-sv-${cleanMssv}`,
            new Date().toISOString()
          );

        importedCount++;
      }
    }

    const totalRow = this.sqlite.db
      .prepare('SELECT COUNT(*) as cnt FROM students')
      .get() as { cnt: number };

    return {
      importedCount,
      updatedCount,
      totalStudents: totalRow.cnt,
    };
  }

  getSummaryMetrics() {
    const { items, totalStudents, totalEnrollments, bothCoursesCount } = this.getAll();
    const placedCount = items.filter((s) => s.status === 'Có doanh nghiệp').length;
    const interviewCount = items.filter((s) => s.status === 'Đang chờ PV/KQPV').length;
    const selfFindingCount = items.filter((s) => s.status === 'Chưa có doanh nghiệp').length;
    const needSupportCount = items.filter((s) => s.status === 'Cần Khoa hỗ trợ').length;

    return {
      totalStudents,
      totalEnrollments,
      bothCoursesCount,
      placedCount,
      interviewCount,
      selfFindingCount,
      needSupportCount,
    };
  }
}
