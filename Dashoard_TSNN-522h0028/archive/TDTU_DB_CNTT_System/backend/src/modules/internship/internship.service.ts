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
  department?: string;
  supportNote?: string;
  internshipStatus?: 'has_company' | 'interviewing' | 'need_support';
  isDualCourse?: boolean;
  selectedCourses?: string[];
  noCompanyOption?: 'faculty' | 'self';
  foreignLanguage?: string;
  foreignScore?: string;
  isConfirmed: boolean;
  // Bổ sung thông tin doanh nghiệp chi tiết & Giảng viên hướng dẫn
  academicAdvisor?: string;
  advisorEmail?: string;
  advisorNote?: string;
  contactRole?: string;
  representative?: string;
  mainIndustry?: string;
  taxDepartment?: string;
  companyStatus?: string;
  orgType?: string;
  taxUpdatedAt?: string;
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

    const selectedCourses = dto.selectedCourses && dto.selectedCourses.length > 0
      ? dto.selectedCourses
      : (dto.isDualCourse ? ['KTCN', 'TSNN'] : ['KTCN']);

    const isDualCourse = Boolean(dto.isDualCourse || selectedCourses.length > 1);
    const hasKtcn = selectedCourses.includes('KTCN') ? 1 : 0;
    const hasTsnn = selectedCourses.includes('TSNN') ? 1 : 0;
    const selectedCoursesStr = JSON.stringify(selectedCourses);
    const now = new Date().toISOString();
    const id = `dec-${dto.studentId}`;

    const studentName = dto.studentName || student.fullName;
    const studentEmail = student.email;

    // 1. Phân định chính xác trạng thái thực tập & lựa chọn hỗ trợ
    let noCompanyOption: 'faculty' | 'self' | null = dto.noCompanyOption || null;
    let studentStatus = 'has_company';

    if (dto.internshipStatus === 'need_support' || dto.noCompanyOption === 'faculty') {
      noCompanyOption = 'faculty';
      studentStatus = 'seeking';
    } else if (dto.internshipStatus === 'interviewing' || dto.noCompanyOption === 'self') {
      noCompanyOption = 'self';
      studentStatus = 'seeking';
    } else if (dto.internshipStatus === 'has_company') {
      noCompanyOption = null;
      studentStatus = 'has_company';
    } else {
      // Fallback thông minh dựa trên tên doanh nghiệp khai báo
      const cName = (dto.companyName || '').trim();
      if (!cName || cName.includes('Khoa CNTT') || cName.includes('hỗ trợ')) {
        noCompanyOption = 'faculty';
        studentStatus = 'seeking';
      } else if (cName.includes('Đang tìm') || cName.includes('Chờ PV')) {
        noCompanyOption = 'self';
        studentStatus = 'seeking';
      } else {
        noCompanyOption = null;
        studentStatus = 'has_company';
      }
    }

    // Tên công ty lưu trữ chuẩn tắc
    let finalCompanyName = dto.companyName || '';
    if (noCompanyOption === 'faculty') {
      finalCompanyName = 'Khoa CNTT hỗ trợ';
    } else if (noCompanyOption === 'self' && !finalCompanyName) {
      finalCompanyName = 'Đang tìm / Chờ PV';
    }

    // 2. Cập nhật hoặc Thêm mới phiếu khai báo (declarations)
    const existing = this.db.prepare('SELECT * FROM declarations WHERE studentId = ?').get(dto.studentId);

    if (existing) {
      this.db.prepare(`
        UPDATE declarations SET
          studentName = ?, studentEmail = ?, companyName = ?, taxCode = ?, address = ?,
          contactPerson = ?, contactPhone = ?, contactEmail = ?, position = ?,
          isDualCourse = ?, selectedCourses = ?, noCompanyOption = ?,
          foreignLanguage = ?, foreignScore = ?, foreignStatus = ?, isConfirmed = ?,
          academicAdvisor = ?, advisorEmail = ?, advisorNote = ?, contactRole = ?,
          representative = ?, mainIndustry = ?, taxDepartment = ?, companyStatus = ?,
          orgType = ?, taxUpdatedAt = ?,
          status = 'submitted', updatedAt = ?
        WHERE studentId = ?
      `).run(
        studentName,
        studentEmail,
        finalCompanyName,
        dto.taxCode || '',
        dto.address || '',
        dto.contactPerson || '',
        dto.contactPhone || '',
        dto.contactEmail || '',
        dto.position || '',
        isDualCourse ? 1 : 0,
        selectedCoursesStr,
        noCompanyOption,
        dto.foreignLanguage || null,
        dto.foreignScore || null,
        foreignStatus,
        1,
        dto.academicAdvisor || null,
        dto.advisorEmail || null,
        dto.advisorNote || null,
        dto.contactRole || null,
        dto.representative || null,
        dto.mainIndustry || null,
        dto.taxDepartment || null,
        dto.companyStatus || null,
        dto.orgType || null,
        dto.taxUpdatedAt || null,
        now,
        dto.studentId
      );
    } else {
      this.db.prepare(`
        INSERT INTO declarations (
          id, studentId, studentName, studentEmail, companyName, taxCode, address,
          contactPerson, contactPhone, contactEmail, position,
          isDualCourse, selectedCourses, noCompanyOption,
          foreignLanguage, foreignScore, foreignStatus, isConfirmed,
          academicAdvisor, advisorEmail, advisorNote, contactRole,
          representative, mainIndustry, taxDepartment, companyStatus,
          orgType, taxUpdatedAt,
          status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
      `).run(
        id,
        dto.studentId,
        studentName,
        studentEmail,
        finalCompanyName,
        dto.taxCode || '',
        dto.address || '',
        dto.contactPerson || '',
        dto.contactPhone || '',
        dto.contactEmail || '',
        dto.position || '',
        isDualCourse ? 1 : 0,
        selectedCoursesStr,
        noCompanyOption,
        dto.foreignLanguage || null,
        dto.foreignScore || null,
        foreignStatus,
        1,
        dto.academicAdvisor || null,
        dto.advisorEmail || null,
        dto.advisorNote || null,
        dto.contactRole || null,
        dto.representative || null,
        dto.mainIndustry || null,
        dto.taxDepartment || null,
        dto.companyStatus || null,
        dto.orgType || null,
        dto.taxUpdatedAt || null,
        now,
        now
      );
    }

    // 3. Đồng bộ hóa trực tiếp vào bảng Master sinh viên (students)
    this.db.prepare(`
      UPDATE students 
      SET status = ?, 
          isDualCourse = ?,
          ktcnEnrolled = ?,
          tsnnEnrolled = ?
      WHERE studentId = ?
    `).run(
      studentStatus,
      isDualCourse ? 1 : 0,
      hasKtcn,
      hasTsnn,
      dto.studentId
    );

    // 4. Tự động đồng bộ chứng chỉ ngoại ngữ vào bảng student_uploaded_certs & students.cert nếu sinh viên điền thông tin chứng chỉ
    if (dto.foreignLanguage && dto.foreignLanguage.trim()) {
      const fLang = dto.foreignLanguage.trim();
      const fScore = (dto.foreignScore || 'Đạt').trim();
      try {
        const existingCert = this.db.prepare('SELECT id FROM student_uploaded_certs WHERE UPPER(studentId) = UPPER(?) AND UPPER(name) = UPPER(?)').get(dto.studentId, fLang) as any;
        certificatesService.saveStudentCertificate({
          id: existingCert ? existingCert.id : undefined,
          studentId: dto.studentId,
          studentName: studentName,
          type: 'Ngoại ngữ',
          name: fLang,
          score: fScore,
          maxScore: fLang.toUpperCase().includes('IELTS') ? '9.0' : '990',
          level: foreignStatus === 'valid' ? 'B1' : 'B1',
          status: 'Đã nộp',
          commitmentConfirmed: 1,
          driveLink: ''
        });
      } catch (certErr) {
        console.error('[InternshipService] Error auto-syncing cert to student_uploaded_certs:', certErr);
      }
    }

    const record = this.db.prepare('SELECT * FROM declarations WHERE studentId = ?').get(dto.studentId) as any;
    return {
      declaration: record,
      record,
      studentStatus,
      isDualCourse,
      updatedStudentId: dto.studentId
    };
  }

  getDeclarationByStudentId(studentId: string): any {
    return this.db.prepare('SELECT * FROM declarations WHERE UPPER(studentId) = UPPER(?)').get(studentId);
  }
}

export const internshipService = new InternshipService();
