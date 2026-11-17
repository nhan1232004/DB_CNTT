import { getDatabase, withWriteRetry } from '../models/sqlite.db.ts';
import { normalizeStudentCourse } from '../utils/student-helper.ts';

export class StudentsService {
  private db = getDatabase();

  private resolveTargetSemester(semester?: string): string {
    const clean = (semester || '').trim();
    if (clean) return clean;
    try {
      const row = this.db.prepare("SELECT value FROM system_state WHERE key = 'active_semester'").get() as any;
      if (row && row.value) return String(row.value).trim() || 'hk1_2026_2027';
    } catch {}
    return 'hk1_2026_2027';
  }

  private setSemesterMeta(semester: string, patch: { cleared: boolean; totalStudents: number }): void {
    try {
      const now = new Date().toISOString();
      const value = JSON.stringify({
        cleared: patch.cleared,
        totalStudents: patch.totalStudents,
        datasetVersion: Date.now(),
        updatedAt: now
      });
      this.db.prepare(`
        INSERT INTO system_state (key, value, updatedAt)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(`students_meta_${semester}`, value, now);
    } catch {}
  }

  private formatSemesterPeriodLabel(semester: string): string {
    if (semester === 'hk1_2026_2027') return 'Học kỳ 1 / 2026-2027';
    if (semester === 'hk2_2026_2027') return 'Học kỳ 2 / 2026-2027';
    if (semester === 'hk1_2025_2026') return 'Học kỳ 1 / 2025-2026';
    if (semester === 'hk2_2025_2026') return 'Học kỳ 2 / 2025-2026';
    return semester;
  }

  private mapEnrollmentRow(r: any): any {
    let semJson: Record<string, any> = {};
    if (r.studentDataJson) {
      try {
        semJson = JSON.parse(r.studentDataJson);
      } catch {}
    }

    const merged: any = {
      ...r,
      ...semJson,
      studentId: String(r.studentId || semJson.studentId || '').trim().toUpperCase(),
      semester: r.enrollSemester || semJson.semester || r.semester || 'hk1_2026_2027'
    };
    delete merged.studentDataJson;
    delete merged.enrollSemester;

    const ktcn = Number(merged.ktcnEnrolled) ? 1 : 0;
    const tsnn = Number(merged.tsnnEnrolled) ? 1 : 0;
    const isDual = (ktcn && tsnn) || Number(merged.isDualCourse) ? 1 : 0;
    merged.ktcnEnrolled = ktcn;
    merged.tsnnEnrolled = tsnn;
    merged.isDualCourse = isDual;
    merged.courseCode = isDual ? 'KTCN & TSNN' : (tsnn && !ktcn ? 'TSNN' : 'KTCN');
    merged.courseName = isDual
      ? 'Kiến tập & Tập sự nghề nghiệp (Song song)'
      : (tsnn && !ktcn ? 'Tập sự nghề nghiệp' : 'Kiến tập công nghiệp');

    merged.name = merged.fullName || merged.name;
    merged.fullName = merged.fullName || merged.name;
    if (r.companyName !== null && r.companyName !== undefined) {
      merged.companyName = r.companyName;
      merged.company = r.companyName;
    }
    if (r.certName) {
      merged.certificateDisplay = `${r.certName} ${r.certScore || ''}`.trim();
    }
    if (merged.declarationHistory) {
      try {
        merged.declarationHistoryList = JSON.parse(merged.declarationHistory);
      } catch {
        merged.declarationHistoryList = [];
      }
    }
    return merged;
  }

  getAllStudents(query: { search?: string; status?: string; major?: string; course?: string; isDual?: string; class?: string; semester?: string } = {}): any[] {
    const targetSem = this.resolveTargetSemester(query.semester);
    const sql = `
      SELECT 
        se.semester as enrollSemester,
        se.studentDataJson,
        s.*,
        COALESCE(s.fullName, d.studentName) as name,
        COALESCE(s.fullName, d.studentName) as fullName,
        d.companyName,
        d.companyName as company,
        d.position,
        d.taxCode,
        d.academicAdvisor,
        d.advisorEmail,
        d.advisorNote,
        d.contactPerson,
        d.contactPerson as mentorName,
        d.contactRole,
        d.contactEmail,
        d.contactPhone,
        d.contactPhone as mentorPhone,
        d.address as companyAddress,
        d.address as address,
        d.representative,
        d.mainIndustry,
        d.taxDepartment,
        d.companyStatus,
        d.orgType,
        d.taxUpdatedAt,
        d.noCompanyOption,
        d.foreignLanguage,
        d.foreignScore,
        d.foreignStatus,
        d.status as declarationStatus,
        d.updatedAt as declarationUpdatedAt,
        d.declarationHistory,
        d.hasChangedFromSupport,
        d.withdrawnSupportAt,
        d.supportNote,
        d.supportReason,
        d.desiredLocation,
        d.cvDriveLink,
        d.pendingCompany,
        d.interviewProgress,
        cert_info.name as certName,
        cert_info.score as certScore,
        cert_info.level as certLevel,
        cert_info.driveLink as certDriveLink,
        cert_info.status as certStatus
      FROM semester_enrollments se
      LEFT JOIN students s ON UPPER(s.studentId) = UPPER(se.studentId)
      LEFT JOIN declarations d ON UPPER(d.studentId) = UPPER(se.studentId)
      LEFT JOIN (
        SELECT studentId, name, score, level, driveLink, status,
               ROW_NUMBER() OVER (PARTITION BY UPPER(studentId) ORDER BY createdAt DESC) as rn
        FROM student_uploaded_certs
      ) cert_info ON UPPER(cert_info.studentId) = UPPER(se.studentId) AND cert_info.rn = 1
      WHERE se.semester = ?
      ORDER BY se.studentId ASC
    `;

    const rawRows = this.db.prepare(sql).all(targetSem) as any[];
    let rows = rawRows.map(r => this.mapEnrollmentRow(r));

    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      rows = rows.filter(r =>
        String(r.studentId || '').toLowerCase().includes(q) ||
        String(r.fullName || '').toLowerCase().includes(q) ||
        String(r.email || '').toLowerCase().includes(q) ||
        String(r.className || '').toLowerCase().includes(q) ||
        String(r.companyName || '').toLowerCase().includes(q) ||
        String(r.position || '').toLowerCase().includes(q)
      );
    }

    if (query.status && query.status.trim()) {
      const st = query.status.trim().toLowerCase();
      if (st === 'has_company' || st === 'có doanh nghiệp' || st === 'đã có nơi') {
        rows = rows.filter(r => r.status === 'has_company' || r.status === 'Có doanh nghiệp');
      } else if (st === 'need_support' || st === 'cần hỗ trợ' || st === 'cần khoa hỗ trợ') {
        rows = rows.filter(r => (r.status === 'seeking' && r.noCompanyOption === 'faculty') || r.status === 'Cần Khoa hỗ trợ');
      } else if (st === 'interviewing' || st === 'đang chờ pv/kqpv' || st === 'chờ phỏng vấn') {
        rows = rows.filter(r => (r.status === 'seeking' && r.noCompanyOption !== 'faculty') || r.status === 'Đang chờ PV/KQPV');
      } else if (st === 'seeking' || st === 'chưa có doanh nghiệp' || st === 'đang tìm') {
        rows = rows.filter(r => r.status === 'seeking' || r.status === 'Chưa có doanh nghiệp');
      } else {
        rows = rows.filter(r => String(r.status || '').toLowerCase() === st);
      }
    }

    if (query.major && query.major.trim()) {
      const m = query.major.trim();
      rows = rows.filter(r => r.major === m);
    }

    if (query.class && query.class.trim()) {
      const c = query.class.trim();
      rows = rows.filter(r => r.className === c || r.class === c);
    }

    if (query.course && query.course.trim()) {
      const c = query.course.trim().toUpperCase();
      if (c === 'KTCN') rows = rows.filter(r => r.ktcnEnrolled === 1);
      else if (c === 'TSNN') rows = rows.filter(r => r.tsnnEnrolled === 1);
      else if (c === 'DUAL') rows = rows.filter(r => r.isDualCourse === 1);
    }

    if (query.isDual !== undefined && query.isDual !== '') {
      const expected = Number(query.isDual) ? 1 : 0;
      rows = rows.filter(r => Number(r.isDualCourse) === expected);
    }

    return rows;
  }

  getStudentById(studentId: string, semester?: string): any {
    const sid = (studentId || '').trim().toUpperCase();
    if (!sid) return null;
    const targetSem = this.resolveTargetSemester(semester);
    const sql = `
      SELECT 
        se.semester as enrollSemester,
        se.studentDataJson,
        s.*,
        COALESCE(s.fullName, d.studentName) as name,
        COALESCE(s.fullName, d.studentName) as fullName,
        d.companyName,
        d.companyName as company,
        d.position,
        d.taxCode,
        d.academicAdvisor,
        d.advisorEmail,
        d.advisorNote,
        d.contactPerson,
        d.contactPerson as mentorName,
        d.contactRole,
        d.contactEmail,
        d.contactPhone,
        d.contactPhone as mentorPhone,
        d.address as companyAddress,
        d.address as address,
        d.representative,
        d.mainIndustry,
        d.taxDepartment,
        d.companyStatus,
        d.orgType,
        d.taxUpdatedAt,
        d.noCompanyOption,
        d.foreignLanguage,
        d.foreignScore,
        d.foreignStatus,
        d.status as declarationStatus,
        d.updatedAt as declarationUpdatedAt,
        d.declarationHistory,
        d.hasChangedFromSupport,
        d.withdrawnSupportAt,
        d.supportNote,
        d.supportReason,
        d.desiredLocation,
        d.cvDriveLink,
        d.pendingCompany,
        d.interviewProgress,
        cert_info.name as certName,
        cert_info.score as certScore,
        cert_info.level as certLevel,
        cert_info.driveLink as certDriveLink,
        cert_info.status as certStatus
      FROM semester_enrollments se
      LEFT JOIN students s ON UPPER(s.studentId) = UPPER(se.studentId)
      LEFT JOIN declarations d ON UPPER(d.studentId) = UPPER(se.studentId)
      LEFT JOIN (
        SELECT studentId, name, score, level, driveLink, status,
               ROW_NUMBER() OVER (PARTITION BY UPPER(studentId) ORDER BY createdAt DESC) as rn
        FROM student_uploaded_certs
      ) cert_info ON UPPER(cert_info.studentId) = UPPER(se.studentId) AND cert_info.rn = 1
      WHERE se.semester = ? AND UPPER(se.studentId) = UPPER(?)
      LIMIT 1
    `;
    const row = this.db.prepare(sql).get(targetSem, sid) as any;
    return row ? this.mapEnrollmentRow(row) : null;
  }

  getSummary(semester?: string): any {
    const targetSem = this.resolveTargetSemester(semester);
    const list = this.getAllStudents({ semester: targetSem });
    const totalStudents = list.length;
    const dualCourseStudents = list.filter(s => s.isDualCourse === 1).length;
    const ktcnEnrollments = list.filter(s => s.ktcnEnrolled === 1).length;
    const tsnnEnrollments = list.filter(s => s.tsnnEnrolled === 1).length;
    const totalCourseEnrollments = ktcnEnrollments + tsnnEnrollments;

    const hasCompany = list.filter(s => s.status === 'has_company' || s.status === 'Có doanh nghiệp').length;
    const needSupport = list.filter(s => s.noCompanyOption === 'faculty' || s.status === 'Cần Khoa hỗ trợ').length;
    const seeking = Math.max(0, totalStudents - hasCompany);
    const totalCerts = (this.db.prepare("SELECT COUNT(*) as count FROM student_uploaded_certs").get() as any).count;
    const studentsWithCert = (this.db.prepare("SELECT COUNT(DISTINCT studentId) as count FROM student_uploaded_certs").get() as any).count;

    return {
      semester: targetSem,
      totalStudents,
      dualCourseStudents,
      ktcnEnrollments,
      tsnnEnrollments,
      totalCourseEnrollments,
      hasCompany,
      needFacultySupport: needSupport,
      seekingCompany: seeking,
      totalCertificates: totalCerts,
      studentsWithCert,
      period: this.formatSemesterPeriodLabel(targetSem),
      faculty: 'Khoa Công nghệ Thông tin - Đại học Tôn Đức Thắng'
    };
  }

  checkEligibility(studentId: string, semester?: string): { isEligible: boolean; student?: any; message: string } {
    const targetSem = this.resolveTargetSemester(semester);
    const student = this.getStudentById(studentId, targetSem);
    if (!student) {
      return {
        isEligible: false,
        message: `Sinh viên MSSV [${studentId}] không nằm trong danh sách được cấp phép thực tập học kỳ ${this.formatSemesterPeriodLabel(targetSem)} của Khoa CNTT. Vui lòng tham khảo Cẩm nang Quy định Thực tập.`
      };
    }
    return {
      isEligible: true,
      student,
      message: `Sinh viên [${student.fullName}] (${student.studentId}) đủ điều kiện tham gia đợt thực tập.`
    };
  }

  private upsertStudentAndEnrollment(dto: any, targetSem: string, now: string): void {
    const studentId = String(dto.studentId || dto.mssv || '').trim().toUpperCase();
    if (!studentId) throw new Error('Mã số sinh viên (studentId / mssv) là bắt buộc');
    const fullName = String(dto.fullName || dto.name || `Sinh viên ${studentId}`).trim();
    const email = String(dto.email || `${studentId.toLowerCase()}@student.tdtu.edu.vn`).trim();
    const className = String(dto.className || dto.class || '').trim();
    const major = String(dto.major || 'Kỹ thuật phần mềm').trim();
    const birthDate = String(dto.birthDate || dto.dob || '').trim();
    const birthPlace = String(dto.birthPlace || dto.pob || '').trim();
    const gender = String(dto.gender || 'Nam').trim();
    const phone = String(dto.phone || '').trim();
    const gpa10 = Number(dto.gpa10) || 0;
    const gpa4 = Number(dto.gpa4 ?? dto.gpa) || 0;
    const academicRank = String(dto.academicRank || 'Khá').trim();
    const lecturerNote = String(dto.lecturerNote || '').trim();

    const normalizedCourse = normalizeStudentCourse({ ...dto, semester: targetSem });
    const ktcn = normalizedCourse.ktcnEnrolled;
    const tsnn = normalizedCourse.tsnnEnrolled;
    const isDual = normalizedCourse.isDualCourse;
    const status = String(dto.status || 'seeking').trim();

    this.db.prepare(`
      INSERT INTO students (
        studentId, fullName, email, className, major,
        birthDate, birthPlace, gender, phone, gpa10, gpa4, academicRank, lecturerNote,
        ktcnEnrolled, tsnnEnrolled, isDualCourse, isEligible, status, semester, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      ON CONFLICT(studentId) DO UPDATE SET
        fullName = excluded.fullName,
        email = excluded.email,
        className = excluded.className,
        major = excluded.major,
        birthDate = excluded.birthDate,
        birthPlace = excluded.birthPlace,
        gender = excluded.gender,
        phone = excluded.phone,
        gpa10 = excluded.gpa10,
        gpa4 = excluded.gpa4,
        academicRank = excluded.academicRank,
        lecturerNote = COALESCE(NULLIF(excluded.lecturerNote, ''), students.lecturerNote),
        ktcnEnrolled = excluded.ktcnEnrolled,
        tsnnEnrolled = excluded.tsnnEnrolled,
        isDualCourse = excluded.isDualCourse,
        status = excluded.status,
        semester = excluded.semester
    `).run(
      studentId, fullName, email, className, major,
      birthDate, birthPlace, gender, phone, gpa10, gpa4, academicRank, lecturerNote,
      ktcn, tsnn, isDual, status, targetSem, now
    );

    const enrollmentData = {
      ...dto,
      studentId,
      mssv: studentId,
      fullName,
      name: fullName,
      email,
      className,
      class: className,
      major,
      birthDate,
      birthPlace,
      gender,
      phone,
      gpa10,
      gpa4,
      gpa: gpa4,
      academicRank,
      lecturerNote,
      ktcnEnrolled: ktcn,
      tsnnEnrolled: tsnn,
      isDualCourse: isDual,
      courseCode: normalizedCourse.courseCode,
      courseName: normalizedCourse.courseName,
      status,
      semester: targetSem
    };

    this.db.prepare(`
      INSERT INTO semester_enrollments (semester, studentId, studentDataJson, updatedAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(semester, studentId) DO UPDATE SET
        studentDataJson = excluded.studentDataJson,
        updatedAt = excluded.updatedAt
    `).run(targetSem, studentId, JSON.stringify(enrollmentData), now);

    try {
      this.db.prepare(`
        INSERT OR IGNORE INTO users (uid, email, name, role, isAdmin, isActive, studentId, department, avatarUrl, createdAt)
        VALUES (?, ?, ?, 'student', 0, 1, ?, ?, ?, ?)
      `).run(`fb-tdtu-usr-${studentId}`, email, fullName, studentId, major, `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`, now);
    } catch {}
  }

  createStudent(dto: any, semester?: string): any {
    const targetSem = this.resolveTargetSemester(semester || dto?.semester);
    const now = new Date().toISOString();
    const studentId = String(dto.studentId || dto.mssv || '').trim().toUpperCase();

    withWriteRetry(() => {
      this.upsertStudentAndEnrollment(dto, targetSem, now);
      const count = (this.db.prepare('SELECT COUNT(*) as c FROM semester_enrollments WHERE semester = ?').get(targetSem) as any)?.c || 0;
      this.setSemesterMeta(targetSem, { cleared: false, totalStudents: count });
    });

    return this.getStudentById(studentId, targetSem);
  }

  updateStudent(studentId: string, dto: any, semester?: string): any {
    const targetSem = this.resolveTargetSemester(semester || dto?.semester);
    const existing = this.getStudentById(studentId, targetSem);
    if (!existing) throw new Error(`Không tìm thấy sinh viên có MSSV: ${studentId}`);
    return this.createStudent({
      ...existing,
      ...dto,
      studentId: existing.studentId
    }, targetSem);
  }

  deleteStudent(studentId: string, semester?: string): boolean {
    const sid = (studentId || '').trim().toUpperCase();
    if (!sid) return false;
    const targetSem = this.resolveTargetSemester(semester);

    let removed = false;
    withWriteRetry(() => {
      const enrollRes = this.db.prepare('DELETE FROM semester_enrollments WHERE semester = ? AND UPPER(studentId) = ?').run(targetSem, sid);
      const remaining = (this.db.prepare('SELECT COUNT(*) as c FROM semester_enrollments WHERE UPPER(studentId) = ?').get(sid) as any)?.c || 0;
      let studentResChanges = 0;
      if (remaining === 0) {
        const sRes = this.db.prepare('DELETE FROM students WHERE UPPER(studentId) = ?').run(sid);
        studentResChanges = Number(sRes.changes) || 0;
      }
      const semCount = (this.db.prepare('SELECT COUNT(*) as c FROM semester_enrollments WHERE semester = ?').get(targetSem) as any)?.c || 0;
      this.setSemesterMeta(targetSem, { cleared: semCount === 0, totalStudents: semCount });
      removed = (Number(enrollRes.changes) || 0) > 0 || studentResChanges > 0;
    });

    return removed;
  }

  clearAllStudents(semester?: string): number {
    let deleted = 0;
    const hasSpecificSem = Boolean(semester && semester.trim());
    const targetSem = this.resolveTargetSemester(semester);

    withWriteRetry(() => {
      if (hasSpecificSem) {
        const enrollRes = this.db.prepare('DELETE FROM semester_enrollments WHERE semester = ?').run(targetSem);
        deleted = Number(enrollRes.changes) || 0;
        // Xóa khỏi bảng students các MSSV không còn nằm ở học kỳ nào khác
        this.db.prepare(`
          DELETE FROM students
          WHERE UPPER(studentId) NOT IN (SELECT DISTINCT UPPER(studentId) FROM semester_enrollments)
        `).run();
        this.setSemesterMeta(targetSem, { cleared: true, totalStudents: 0 });
      } else {
        const sRes = this.db.prepare('DELETE FROM students').run();
        const eRes = this.db.prepare('DELETE FROM semester_enrollments').run();
        deleted = Math.max(Number(eRes.changes) || 0, Number(sRes.changes) || 0);
        this.setSemesterMeta(targetSem, { cleared: true, totalStudents: 0 });
      }
    });

    return deleted;
  }

  bulkImportStudents(items: any[], mode: 'append' | 'replace' = 'append', semester?: string): { imported: number; total: number; semester: string } {
    const targetSem = this.resolveTargetSemester(semester);
    const now = new Date().toISOString();
    let imported = 0;

    withWriteRetry(() => {
      this.db.exec('BEGIN IMMEDIATE');
      try {
        if (mode === 'replace') {
          this.db.prepare('DELETE FROM semester_enrollments WHERE semester = ?').run(targetSem);
          this.db.prepare(`
            DELETE FROM students
            WHERE UPPER(studentId) NOT IN (SELECT DISTINCT UPPER(studentId) FROM semester_enrollments)
          `).run();
        }

        for (const item of items) {
          const sid = String(item.studentId || item.mssv || '').trim().toUpperCase();
          if (!sid || sid.startsWith('SV_') || sid.includes('SỐ LƯỢNG')) continue;
          this.upsertStudentAndEnrollment(item, targetSem, now);
          imported++;
        }

        const total = (this.db.prepare('SELECT COUNT(*) as count FROM semester_enrollments WHERE semester = ?').get(targetSem) as any).count;
        this.setSemesterMeta(targetSem, { cleared: total === 0, totalStudents: total });
        this.db.exec('COMMIT');
      } catch (err) {
        try { this.db.exec('ROLLBACK'); } catch {}
        throw err;
      }
    });

    const total = (this.db.prepare('SELECT COUNT(*) as count FROM semester_enrollments WHERE semester = ?').get(targetSem) as any).count;
    return { imported, total, semester: targetSem };
  }
}

export const studentsService = new StudentsService();
