import { getDatabase } from '../../database/sqlite.db.ts';
import { studentsService } from '../students/students.service.ts';
import { certificatesService } from '../certificates/certificates.service.ts';

export interface InternshipDeclarationDto {
  studentId: string;
  studentName?: string;
  companyName: string;
  taxCode: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  position: string;
  isDualCourse?: boolean;
  selectedCourses?: string[];
  noCompanyOption?: 'faculty' | 'self';
  foreignLanguage?: string;
  foreignScore?: string;
  isConfirmed: boolean;
}

export class InternshipService {
  private db = getDatabase();

  declareInternship(dto: InternshipDeclarationDto): any {
    if (!dto.isConfirmed) {
      throw new Error('Bạn bắt buộc phải tích chọn cam kết tính chính xác của thông tin trước khi gửi khai báo');
    }

    const student = studentsService.getStudentById(dto.studentId);
    if (!student) {
      throw new Error(`Sinh viên [${dto.studentId}] không hợp lệ hoặc không có tên trong đợt thực tập`);
    }

    // Validate foreign language if provided
    let foreignStatus = 'unverified';
    if (dto.foreignLanguage) {
      const certResult = certificatesService.validateCertificate(dto.foreignLanguage, dto.foreignScore);
      foreignStatus = certResult.isValid ? 'valid' : 'invalid';
    }

    const isDualCourse = Boolean(dto.isDualCourse || (dto.selectedCourses && dto.selectedCourses.length > 1));
    const selectedCoursesStr = dto.selectedCourses ? JSON.stringify(dto.selectedCourses) : JSON.stringify(isDualCourse ? ['KTCN', 'TSNN'] : ['KTCN']);
    const now = new Date().toISOString();
    const id = `dec-${dto.studentId}`;

    const studentName = dto.studentName || student.fullName;
    const studentEmail = student.email;

    // Check if declaration exists
    const existing = this.db.prepare('SELECT * FROM declarations WHERE studentId = ?').get(dto.studentId);

    if (existing) {
      this.db.prepare(`
        UPDATE declarations SET
          studentName = ?, studentEmail = ?, companyName = ?, taxCode = ?, address = ?,
          contactPerson = ?, contactPhone = ?, contactEmail = ?, position = ?,
          isDualCourse = ?, selectedCourses = ?, noCompanyOption = ?,
          foreignLanguage = ?, foreignScore = ?, foreignStatus = ?, isConfirmed = ?,
          status = 'submitted', updatedAt = ?
        WHERE studentId = ?
      `).run(
        studentName,
        studentEmail,
        dto.companyName,
        dto.taxCode,
        dto.address,
        dto.contactPerson,
        dto.contactPhone,
        dto.contactEmail,
        dto.position,
        isDualCourse ? 1 : 0,
        selectedCoursesStr,
        dto.noCompanyOption || null,
        dto.foreignLanguage || null,
        dto.foreignScore || null,
        foreignStatus,
        1,
        now,
        dto.studentId
      );
    } else {
      this.db.prepare(`
        INSERT INTO declarations (
          id, studentId, studentName, studentEmail, companyName, taxCode, address,
          contactPerson, contactPhone, contactEmail, position,
          isDualCourse, selectedCourses, noCompanyOption,
          foreignLanguage, foreignScore, foreignStatus, isConfirmed, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
      `).run(
        id,
        dto.studentId,
        studentName,
        studentEmail,
        dto.companyName,
        dto.taxCode,
        dto.address,
        dto.contactPerson,
        dto.contactPhone,
        dto.contactEmail,
        dto.position,
        isDualCourse ? 1 : 0,
        selectedCoursesStr,
        dto.noCompanyOption || null,
        dto.foreignLanguage || null,
        dto.foreignScore || null,
        foreignStatus,
        1,
        now,
        now
      );
    }

    // Update student status
    let studentStatus = 'has_company';
    if (dto.noCompanyOption === 'faculty' || dto.noCompanyOption === 'self') {
      studentStatus = 'seeking';
    }

    this.db.prepare(`
      UPDATE students SET status = ?, isDualCourse = ? WHERE studentId = ?
    `).run(studentStatus, isDualCourse ? 1 : 0, dto.studentId);

    const record = this.db.prepare('SELECT * FROM declarations WHERE studentId = ?').get(dto.studentId) as any;
    return {
      declaration: record,
      record
    };
  }

  getDeclarationByStudentId(studentId: string): any {
    return this.db.prepare('SELECT * FROM declarations WHERE UPPER(studentId) = UPPER(?)').get(studentId);
  }
}

export const internshipService = new InternshipService();
