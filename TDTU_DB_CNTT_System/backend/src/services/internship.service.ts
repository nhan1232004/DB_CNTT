import { getDatabase } from '../models/sqlite.db.ts';
import { studentsService } from './students.service.ts';
import { certificatesService } from './certificates.service.ts';
import { notificationService } from './notification.service.ts';

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
  supportReason?: string;
  desiredLocation?: string;
  cvDriveLink?: string;
  pendingCompany?: string;
  interviewProgress?: string;
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

    // 2. Cập nhật hoặc Thêm mới phiếu khai báo (declarations) & Quản lý lịch sử mốc thời gian (Audit Trail)
    const existing = this.db.prepare('SELECT * FROM declarations WHERE UPPER(studentId) = UPPER(?)').get(dto.studentId) as any;

    const wasNeedSupport = Boolean(
      existing && (
        existing.noCompanyOption === 'faculty' || 
        (existing.companyName && (existing.companyName.includes('hỗ trợ') || existing.companyName.includes('Khoa CNTT')))
      )
    );
    const isNowHasCompany = (dto.internshipStatus === 'has_company') || 
      (!noCompanyOption && Boolean(finalCompanyName) && !finalCompanyName.includes('hỗ trợ') && !finalCompanyName.includes('Đang tìm'));

    let hasChangedFromSupport = existing?.hasChangedFromSupport || 0;
    let withdrawnSupportAt = existing?.withdrawnSupportAt || null;

    if (wasNeedSupport && isNowHasCompany) {
      hasChangedFromSupport = 1;
      withdrawnSupportAt = now;
    }

    let historyList: any[] = [];
    if (existing?.declarationHistory) {
      try {
        historyList = JSON.parse(existing.declarationHistory);
      } catch {}
    }

    if (historyList.length === 0 && existing) {
      historyList.push({
        id: `hist-prev-${Date.now() - 10000}`,
        timestamp: existing.updatedAt || existing.createdAt || now,
        status: existing.noCompanyOption === 'faculty' ? 'need_support' : (existing.noCompanyOption === 'self' ? 'interviewing' : 'has_company'),
        statusLabel: existing.noCompanyOption === 'faculty' ? 'Cần Khoa hỗ trợ' : (existing.noCompanyOption === 'self' ? 'Đang tìm / Chờ PV' : 'Đã có nơi thực tập'),
        companyName: existing.companyName || '',
        taxCode: existing.taxCode || '',
        contactPerson: existing.contactPerson || '',
        contactPhone: existing.contactPhone || '',
        position: existing.position || '',
        actionType: 'initial_declaration',
        note: existing.noCompanyOption === 'faculty' ? 'Khai báo cần Khoa hỗ trợ' : 'Khai báo thực tập'
      });
    }

    const currentStatusKey = dto.internshipStatus || (noCompanyOption === 'faculty' ? 'need_support' : noCompanyOption === 'self' ? 'interviewing' : 'has_company');
    const currentStatusLabel = isNowHasCompany || currentStatusKey === 'has_company'
      ? 'Đã có nơi thực tập'
      : currentStatusKey === 'interviewing'
        ? 'Đang tìm / Chờ PV'
        : 'Cần Khoa hỗ trợ';

    let eventNote = '';
    if (wasNeedSupport && isNowHasCompany) {
      eventNote = `Sinh viên tự cập nhật: Đã trúng tuyển doanh nghiệp "${finalCompanyName}" (Tự động rút yêu cầu Khoa hỗ trợ điều phối)`;
    } else if (currentStatusKey === 'need_support' || noCompanyOption === 'faculty') {
      const parts = [
        dto.supportReason ? `Lý do: ${dto.supportReason}` : 'Cần Khoa hỗ trợ điều phối doanh nghiệp',
        dto.desiredLocation ? `Khu vực: ${dto.desiredLocation}` : null,
        dto.cvDriveLink ? `CV Drive: ${dto.cvDriveLink}` : null,
        dto.supportNote ? `Ghi chú: ${dto.supportNote}` : null
      ].filter(Boolean);
      eventNote = parts.join(' · ');
    } else if (currentStatusKey === 'interviewing' || noCompanyOption === 'self') {
      const parts = [
        dto.pendingCompany ? `Đang ứng tuyển: ${dto.pendingCompany}` : 'Đang chủ động tìm nơi thực tập',
        dto.interviewProgress ? `Tiến độ: ${dto.interviewProgress}` : null,
        dto.supportNote ? `Ghi chú: ${dto.supportNote}` : null
      ].filter(Boolean);
      eventNote = parts.join(' · ');
    } else {
      eventNote = dto.supportNote ? `Ghi chú: ${dto.supportNote}` : (existing ? 'Cập nhật lại hồ sơ thực tập' : 'Khai báo nơi thực tập thành công');
    }

    historyList.push({
      id: `hist-${Date.now()}`,
      timestamp: now,
      status: currentStatusKey,
      statusLabel: currentStatusLabel,
      companyName: finalCompanyName,
      taxCode: dto.taxCode || '',
      contactPerson: dto.contactPerson || '',
      contactPhone: dto.contactPhone || '',
      position: dto.position || '',
      department: dto.department || '',
      supportReason: dto.supportReason || '',
      desiredLocation: dto.desiredLocation || '',
      cvDriveLink: dto.cvDriveLink || '',
      pendingCompany: dto.pendingCompany || '',
      interviewProgress: dto.interviewProgress || '',
      actionType: wasNeedSupport && isNowHasCompany ? 'withdraw_support_to_company' : (existing ? 'update' : 'create'),
      note: eventNote
    });

    const declarationHistoryStr = JSON.stringify(historyList);

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
          declarationHistory = ?, hasChangedFromSupport = ?, withdrawnSupportAt = ?,
          supportNote = ?, supportReason = ?, desiredLocation = ?, cvDriveLink = ?, pendingCompany = ?, interviewProgress = ?,
          status = 'submitted', updatedAt = ?
        WHERE UPPER(studentId) = UPPER(?)
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
        declarationHistoryStr,
        hasChangedFromSupport,
        withdrawnSupportAt,
        dto.supportNote || '',
        dto.supportReason || '',
        dto.desiredLocation || '',
        dto.cvDriveLink || '',
        dto.pendingCompany || '',
        dto.interviewProgress || '',
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
          declarationHistory, hasChangedFromSupport, withdrawnSupportAt,
          supportNote, supportReason, desiredLocation, cvDriveLink, pendingCompany, interviewProgress,
          status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
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
        declarationHistoryStr,
        hasChangedFromSupport,
        withdrawnSupportAt,
        dto.supportNote || '',
        dto.supportReason || '',
        dto.desiredLocation || '',
        dto.cvDriveLink || '',
        dto.pendingCompany || '',
        dto.interviewProgress || '',
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

    // 5. Gửi thông báo học vụ CHỈ ĐẾN GIẢNG VIÊN VÀ ADMIN ở thanh thông báo bên hông (Gọn tối đa, hỗ trợ Popup xem chi tiết)
    try {
      let shortTitle = '';
      if (isNowHasCompany || currentStatusKey === 'has_company') {
        shortTitle = `SV ${dto.studentId} - ${studentName} đã khai báo DN: ${finalCompanyName}`;
      } else if (currentStatusKey === 'interviewing' || noCompanyOption === 'self') {
        const comp = dto.pendingCompany ? ` (${dto.pendingCompany})` : '';
        shortTitle = `SV ${dto.studentId} - ${studentName} đã cập nhật: Đang chờ PV${comp}`;
      } else {
        shortTitle = `SV ${dto.studentId} - ${studentName} đã cập nhật: Cần Khoa hỗ trợ`;
      }

      const shortContent = `Sinh viên ${studentName} (${dto.studentId} - Lớp ${student.classId || 'CNTT'}) vừa cập nhật thông tin thực tập. Nhấn để xem chi tiết hồ sơ.`;

      const metadataPayload = {
        isStudentDeclaration: true,
        studentId: dto.studentId,
        studentName: studentName,
        classId: student.classId || '',
        major: student.major || '',
        internshipStatus: currentStatusKey,
        statusLabel: currentStatusLabel,
        companyName: finalCompanyName,
        pendingCompany: dto.pendingCompany || '',
        position: dto.position || '',
        desiredPosition: dto.desiredPosition || '',
        taxCode: dto.taxCode || '',
        address: dto.address || '',
        contactPerson: dto.contactPerson || '',
        contactPhone: dto.contactPhone || '',
        contactEmail: dto.contactEmail || '',
        supportReason: dto.supportReason || '',
        desiredLocation: dto.desiredLocation || '',
        cvDriveLink: dto.cvDriveLink || '',
        supportNote: dto.supportNote || '',
        submittedAt: now
      };

      // Theo quy định mới: Không gửi thông báo đến giảng viên khi sinh viên thay đổi hay cập nhật trạng thái
    } catch (notifErr) {
      console.warn('[InternshipService] Notification creation warning:', notifErr);
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
    const decl = this.db.prepare('SELECT * FROM declarations WHERE UPPER(studentId) = UPPER(?)').get(studentId) as any;
    if (decl && decl.declarationHistory) {
      try {
        decl.history = JSON.parse(decl.declarationHistory);
      } catch {
        decl.history = [];
      }
    }
    return decl;
  }

  deleteDeclaration(studentId: string): void {
    this.db.prepare('DELETE FROM declarations WHERE UPPER(studentId) = UPPER(?)').run(studentId);
    this.db.prepare('UPDATE students SET status = ? WHERE UPPER(studentId) = UPPER(?)').run('seeking', studentId);
  }
}

export const internshipService = new InternshipService();
