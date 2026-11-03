import { getDatabase } from '../models/sqlite.db.ts';

export class StudentsService {
  private db = getDatabase();

  getAllStudents(query: { search?: string; status?: string; major?: string; course?: string; isDual?: string; class?: string; semester?: string } = {}): any[] {
    let sql = `
      SELECT 
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
        d.contactRole,
        d.contactEmail,
        d.contactPhone,
        d.address as companyAddress,
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
        cert_info.status as certStatus,
        CASE 
          WHEN cert_info.name IS NOT NULL THEN cert_info.name || ' ' || cert_info.score
          WHEN s.cert IS NOT NULL THEN s.cert
          WHEN d.foreignLanguage IS NOT NULL THEN d.foreignLanguage || ' ' || COALESCE(d.foreignScore, '')
          ELSE NULL
        END as certificateDisplay,
        CASE 
          WHEN s.isDualCourse = 1 THEN 'KTCN & TSNN'
          WHEN s.ktcnEnrolled = 1 THEN 'KTCN'
          ELSE 'TSNN'
        END as courseCode,
        CASE 
          WHEN s.isDualCourse = 1 THEN 'Kiến tập & Tập sự nghề nghiệp (Song song)'
          WHEN s.ktcnEnrolled = 1 THEN 'Kiến tập công nghiệp'
          ELSE 'Tập sự nghề nghiệp'
        END as courseName
      FROM students s
      LEFT JOIN declarations d ON UPPER(d.studentId) = UPPER(s.studentId)
      LEFT JOIN (
        SELECT studentId, name, score, level, driveLink, status,
               ROW_NUMBER() OVER (PARTITION BY UPPER(studentId) ORDER BY createdAt DESC) as rn
        FROM student_uploaded_certs
      ) cert_info ON UPPER(cert_info.studentId) = UPPER(s.studentId) AND cert_info.rn = 1
      WHERE 1=1
    `;
    const params: any[] = [];

    // 0. Bộ lọc học kỳ (Cách ly tuyệt đối dữ liệu sinh viên giữa các học kỳ)
    if (query.semester && query.semester.trim()) {
      const targetSem = query.semester.trim();
      sql += ' AND (s.semester = ? OR (? = \'hk1_2026_2027\' AND (s.semester IS NULL OR s.semester = \'\')))';
      params.push(targetSem, targetSem);
    }

    // 1. Tìm kiếm tổng hợp theo MSSV, Họ tên, Email, Lớp, hoặc Tên doanh nghiệp, Vị trí thực tập
    if (query.search && query.search.trim()) {
      sql += ' AND (s.studentId LIKE ? OR s.fullName LIKE ? OR s.email LIKE ? OR s.className LIKE ? OR d.companyName LIKE ? OR d.position LIKE ?)';
      const s = `%${query.search.trim()}%`;
      params.push(s, s, s, s, s, s);
    }

    // 2. Bộ lọc trạng thái (Hỗ trợ cả mã code lẫn text tiếng Việt từ giao diện)
    if (query.status && query.status.trim()) {
      const st = query.status.trim().toLowerCase();
      if (st === 'has_company' || st === 'có doanh nghiệp' || st === 'đã có nơi') {
        sql += " AND s.status = 'has_company'";
      } else if (st === 'need_support' || st === 'cần hỗ trợ') {
        sql += " AND (s.status = 'seeking' AND d.noCompanyOption = 'faculty')";
      } else if (st === 'interviewing' || st === 'đang chờ pv/kqpv' || st === 'chờ phỏng vấn') {
        sql += " AND (s.status = 'seeking' AND (d.noCompanyOption IS NULL OR d.noCompanyOption != 'faculty'))";
      } else if (st === 'seeking' || st === 'chưa có doanh nghiệp' || st === 'đang tìm') {
        sql += " AND s.status = 'seeking'";
      } else {
        sql += ' AND s.status = ?';
        params.push(query.status);
      }
    }

    // 3. Bộ lọc ngành học
    if (query.major && query.major.trim()) {
      sql += ' AND s.major = ?';
      params.push(query.major.trim());
    }

    // 4. Bộ lọc lớp
    if (query.class && query.class.trim()) {
      sql += ' AND s.className = ?';
      params.push(query.class.trim());
    }

    // 5. Bộ lọc môn học thực tập
    if (query.course && query.course.trim()) {
      const c = query.course.trim().toUpperCase();
      if (c === 'KTCN') {
        sql += ' AND s.ktcnEnrolled = 1';
      } else if (c === 'TSNN') {
        sql += ' AND s.tsnnEnrolled = 1';
      } else if (c === 'DUAL') {
        sql += ' AND s.isDualCourse = 1';
      }
    }

    if (query.isDual !== undefined && query.isDual !== '') {
      sql += ' AND s.isDualCourse = ?';
      params.push(Number(query.isDual) ? 1 : 0);
    }

    sql += ' ORDER BY s.studentId ASC';
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(r => {
      if (r.declarationHistory) {
        try {
          r.declarationHistoryList = JSON.parse(r.declarationHistory);
        } catch {
          r.declarationHistoryList = [];
        }
      }
      return r;
    });
  }

  getStudentById(studentId: string): any {
    const sql = `
      SELECT 
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
        d.contactRole,
        d.contactEmail,
        d.contactPhone,
        d.address as companyAddress,
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
        cert_info.status as certStatus,
        CASE 
          WHEN cert_info.name IS NOT NULL THEN cert_info.name || ' ' || cert_info.score
          WHEN s.cert IS NOT NULL THEN s.cert
          WHEN d.foreignLanguage IS NOT NULL THEN d.foreignLanguage || ' ' || COALESCE(d.foreignScore, '')
          ELSE NULL
        END as certificateDisplay,
        CASE 
          WHEN s.isDualCourse = 1 THEN 'KTCN & TSNN'
          WHEN s.ktcnEnrolled = 1 THEN 'KTCN'
          ELSE 'TSNN'
        END as courseCode,
        CASE 
          WHEN s.isDualCourse = 1 THEN 'Kiến tập & Tập sự nghề nghiệp (Song song)'
          WHEN s.ktcnEnrolled = 1 THEN 'Kiến tập công nghiệp'
          ELSE 'Tập sự nghề nghiệp'
        END as courseName
      FROM students s
      LEFT JOIN declarations d ON UPPER(d.studentId) = UPPER(s.studentId)
      LEFT JOIN (
        SELECT studentId, name, score, level, driveLink, status,
               ROW_NUMBER() OVER (PARTITION BY UPPER(studentId) ORDER BY createdAt DESC) as rn
        FROM student_uploaded_certs
      ) cert_info ON UPPER(cert_info.studentId) = UPPER(s.studentId) AND cert_info.rn = 1
      WHERE UPPER(s.studentId) = UPPER(?)
    `;
    const student = this.db.prepare(sql).get(studentId) as any;
    if (student && student.declarationHistory) {
      try {
        student.declarationHistoryList = JSON.parse(student.declarationHistory);
      } catch {
        student.declarationHistoryList = [];
      }
    }
    return student;
  }

  getSummary(): any {
    const totalStudents = (this.db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count;
    const dualCourseStudents = (this.db.prepare('SELECT COUNT(*) as count FROM students WHERE isDualCourse = 1').get() as any).count;
    const ktcnEnrollments = (this.db.prepare('SELECT COUNT(*) as count FROM students WHERE ktcnEnrolled = 1').get() as any).count;
    const tsnnEnrollments = (this.db.prepare('SELECT COUNT(*) as count FROM students WHERE tsnnEnrolled = 1').get() as any).count;
    const totalCourseEnrollments = ktcnEnrollments + tsnnEnrollments;

    const hasCompany = (this.db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'has_company'").get() as any).count;
    const needSupport = (this.db.prepare("SELECT COUNT(*) as count FROM declarations WHERE noCompanyOption = 'faculty'").get() as any).count;
    const seeking = (this.db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'seeking'").get() as any).count;
    const totalCerts = (this.db.prepare("SELECT COUNT(*) as count FROM student_uploaded_certs").get() as any).count;
    const studentsWithCert = (this.db.prepare("SELECT COUNT(DISTINCT studentId) as count FROM student_uploaded_certs").get() as any).count;

    return {
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
      period: 'Học kỳ 1 / 2026-2027',
      faculty: 'Khoa Công nghệ Thông tin - Đại học Tôn Đức Thắng'
    };
  }

  checkEligibility(studentId: string): { isEligible: boolean; student?: any; message: string } {
    const student = this.getStudentById(studentId);
    if (!student) {
      return {
        isEligible: false,
        message: `Sinh viên MSSV [${studentId}] không nằm trong danh sách được cấp phép thực tập HK1/2026-2027 của Khoa CNTT. Vui lòng tham khảo Cẩm nang Quy định Thực tập.`
      };
    }
    return {
      isEligible: true,
      student,
      message: `Sinh viên [${student.fullName}] (${student.studentId}) đủ điều kiện tham gia đợt thực tập.`
    };
  }

  createStudent(dto: any): any {
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

    let ktcn = dto.ktcnEnrolled !== undefined ? (dto.ktcnEnrolled ? 1 : 0) : 0;
    let tsnn = dto.tsnnEnrolled !== undefined ? (dto.tsnnEnrolled ? 1 : 0) : 0;
    if (Array.isArray(dto.courses)) {
      ktcn = dto.courses.some((c: string) => c.toUpperCase().includes('KTCN') || c.includes('Kiến tập')) ? 1 : ktcn;
      tsnn = dto.courses.some((c: string) => c.toUpperCase().includes('TSNN') || c.includes('Tập sự') || c.includes('Dự án')) ? 1 : tsnn;
    } else if (dto.courseCode || dto.course_str) {
      const cStr = String(dto.courseCode || dto.course_str).toUpperCase();
      if (cStr.includes('KTCN')) ktcn = 1;
      if (cStr.includes('TSNN') || cStr.includes('DA')) tsnn = 1;
    }
    if (!ktcn && !tsnn) ktcn = 1;
    const isDual = (ktcn && tsnn) ? 1 : 0;
    const status = String(dto.status || 'seeking').trim();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO students (
        studentId, fullName, email, className, major,
        birthDate, birthPlace, gender, phone, gpa10, gpa4, academicRank, lecturerNote,
        ktcnEnrolled, tsnnEnrolled, isDualCourse, isEligible, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
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
        status = excluded.status
    `).run(
      studentId, fullName, email, className, major,
      birthDate, birthPlace, gender, phone, gpa10, gpa4, academicRank, lecturerNote,
      ktcn, tsnn, isDual, status, now
    );

    try {
      this.db.prepare(`
        INSERT OR IGNORE INTO users (uid, email, name, role, isAdmin, isActive, studentId, department, avatarUrl, createdAt)
        VALUES (?, ?, ?, 'student', 0, 1, ?, ?, ?, ?)
      `).run(`fb-tdtu-usr-${studentId}`, email, fullName, studentId, major, `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`, now);
    } catch {}

    return this.getStudentById(studentId);
  }

  updateStudent(studentId: string, dto: any): any {
    const existing = this.getStudentById(studentId);
    if (!existing) throw new Error(`Không tìm thấy sinh viên có MSSV: ${studentId}`);
    return this.createStudent({
      ...existing,
      ...dto,
      studentId: existing.studentId
    });
  }

  deleteStudent(studentId: string): boolean {
    const sid = (studentId || '').trim().toUpperCase();
    const res = this.db.prepare('DELETE FROM students WHERE UPPER(studentId) = ?').run(sid);
    return Number(res.changes) > 0;
  }

  clearAllStudents(): number {
    const res = this.db.prepare('DELETE FROM students').run();
    return Number(res.changes) || 0;
  }

  bulkImportStudents(items: any[], mode: 'append' | 'replace' = 'append'): { imported: number; total: number } {
    if (mode === 'replace') {
      this.clearAllStudents();
    }
    let imported = 0;
    for (const item of items) {
      const sid = String(item.studentId || item.mssv || '').trim().toUpperCase();
      if (!sid || sid.startsWith('SV_') || sid.includes('SỐ LƯỢNG')) continue;
      this.createStudent(item);
      imported++;
    }
    const total = (this.db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count;
    return { imported, total };
  }
}

export const studentsService = new StudentsService();
