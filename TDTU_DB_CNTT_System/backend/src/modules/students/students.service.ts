import { getDatabase } from '../../database/sqlite.db.ts';

export class StudentsService {
  private db = getDatabase();

  getAllStudents(query: { search?: string; status?: string; major?: string; isDual?: string } = {}): any[] {
    let sql = 'SELECT * FROM students WHERE 1=1';
    const params: any[] = [];

    if (query.search) {
      sql += ' AND (studentId LIKE ? OR fullName LIKE ? OR email LIKE ?)';
      const s = `%${query.search}%`;
      params.push(s, s, s);
    }
    if (query.status) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    if (query.major) {
      sql += ' AND major = ?';
      params.push(query.major);
    }
    if (query.isDual !== undefined && query.isDual !== '') {
      sql += ' AND isDualCourse = ?';
      params.push(Number(query.isDual) ? 1 : 0);
    }

    sql += ' ORDER BY studentId ASC';
    return this.db.prepare(sql).all(...params);
  }

  getStudentById(studentId: string): any {
    return this.db.prepare('SELECT * FROM students WHERE UPPER(studentId) = UPPER(?)').get(studentId);
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

    return {
      totalStudents,
      dualCourseStudents,
      ktcnEnrollments,
      tsnnEnrollments,
      totalCourseEnrollments,
      hasCompany,
      needFacultySupport: needSupport,
      seekingCompany: seeking,
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
}

export const studentsService = new StudentsService();
