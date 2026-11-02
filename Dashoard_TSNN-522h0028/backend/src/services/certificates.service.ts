import { getDatabase } from '../models/sqlite.db.ts';
import { notificationService } from './notification.service.ts';

export interface CertificateStandard {
  type: string;
  name: string;
  minScore: string;
  equivalentLevel: string;
  description: string;
}

export interface StudentCertificateDto {
  id?: string;
  studentId: string;
  studentName?: string;
  type?: string;
  name: string;
  score: string;
  maxScore?: string;
  level?: string;
  examDate?: string;
  issueDate?: string;
  proofFileName?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  proofData?: string;
  driveLink?: string;
  commitmentConfirmed?: number;
  status?: string;
}

export const TDTU_LANGUAGE_STANDARDS: CertificateStandard[] = [
  { type: 'TOEIC', name: 'TOEIC', minScore: '500', equivalentLevel: 'B1', description: 'Chứng chỉ TOEIC' },
  { type: 'IELTS', name: 'IELTS', minScore: '5.0', equivalentLevel: 'B1', description: 'Chứng chỉ IELTS' },
  { type: 'TOEFL_IBT', name: 'TOEFL iBT', minScore: '45', equivalentLevel: 'B1', description: 'Chứng chỉ TOEFL iBT' },
  { type: 'APTIS_ESOL', name: 'Aptis ESOL', minScore: 'B1', equivalentLevel: 'B1', description: 'Chứng chỉ Aptis ESOL' },
  { type: 'CAMBRIDGE', name: 'Cambridge', minScore: '140', equivalentLevel: 'B1', description: 'Chứng chỉ Cambridge' },
  { type: 'VSTEP', name: 'VSTEP', minScore: 'B1', equivalentLevel: 'B1', description: 'Chứng chỉ VSTEP (tương thích)' }
];

export class CertificatesService {
  private getDb() {
    return getDatabase();
  }

  getStandards(): CertificateStandard[] {
    return TDTU_LANGUAGE_STANDARDS;
  }

  validateCertificate(type: string, score?: string): { isValid: boolean; message: string; standard?: CertificateStandard } {
    const cleanType = (type || '').trim().toUpperCase();
    const standard = TDTU_LANGUAGE_STANDARDS.find(
      s => s.type.toUpperCase() === cleanType || s.name.toUpperCase().includes(cleanType) || cleanType.includes(s.type.toUpperCase())
    );

    if (!standard) {
      return {
        isValid: false,
        message: `Chứng chỉ [${type}] không thuộc danh mục chuẩn ngoại ngữ xét tốt nghiệp của Trường ĐH Tôn Đức Thắng (Chỉ công nhận TOEIC, IELTS, TOEFL iBT, Cambridge, Aptis ESOL).`
      };
    }

    return {
      isValid: true,
      message: `Chứng chỉ [${standard.name}] hợp lệ theo quy định TDTU.`,
      standard
    };
  }

  getStudentCertificates(studentId: string): any[] {
    const db = this.getDb();
    const sid = (studentId || '').trim().toUpperCase();
    try {
      const rows = db.prepare(`
        SELECT * FROM student_uploaded_certs WHERE UPPER(studentId) = ? ORDER BY createdAt DESC
      `).all(sid);
      return rows;
    } catch {
      return [];
    }
  }

  getAllCertificates(): any[] {
    const db = this.getDb();
    try {
      const rows = db.prepare(`
        SELECT 
          c.*,
          COALESCE(s.fullName, c.studentName) as studentName,
          s.className,
          s.major
        FROM student_uploaded_certs c
        LEFT JOIN students s ON UPPER(s.studentId) = UPPER(c.studentId)
        ORDER BY c.createdAt DESC
      `).all();
      return rows;
    } catch {
      return [];
    }
  }

  saveStudentCertificate(dto: StudentCertificateDto): any {
    const db = this.getDb();
    const id = dto.id || ('cert_' + Date.now());
    const studentId = (dto.studentId || '522H0045').trim().toUpperCase();
    const now = new Date().toISOString();
    const status = dto.status || 'Đã nộp';
    const driveLink = (dto.driveLink || dto.proofData || '').trim();
    const proofData = driveLink;
    const fileName = dto.fileName || (driveLink ? 'Google Drive Minh chứng' : 'Chưa có minh chứng');
    const fileType = dto.fileType || 'LINK';
    const fileSize = dto.fileSize || 'Google Drive';
    const commitmentConfirmed = dto.commitmentConfirmed !== undefined ? dto.commitmentConfirmed : 1;

    const issueDate = dto.issueDate || dto.examDate || '';

    db.prepare(`
      INSERT INTO student_uploaded_certs (id, studentId, studentName, type, name, score, maxScore, level, examDate, issueDate, proofFileName, fileName, fileType, fileSize, proofData, driveLink, commitmentConfirmed, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        name = excluded.name,
        score = excluded.score,
        maxScore = excluded.maxScore,
        level = excluded.level,
        examDate = excluded.examDate,
        issueDate = excluded.issueDate,
        proofFileName = excluded.proofFileName,
        fileName = excluded.fileName,
        fileType = excluded.fileType,
        fileSize = excluded.fileSize,
        proofData = excluded.proofData,
        driveLink = excluded.driveLink,
        commitmentConfirmed = excluded.commitmentConfirmed,
        status = excluded.status,
        updatedAt = excluded.createdAt
    `).run(
      id,
      studentId,
      dto.studentName || '',
      dto.type || 'Ngoại ngữ',
      dto.name || 'TOEIC',
      dto.score || '500',
      dto.maxScore || '990',
      dto.level || 'B1',
      dto.examDate || '',
      issueDate,
      fileName,
      fileName,
      fileType,
      fileSize,
      proofData,
      driveLink,
      commitmentConfirmed,
      status,
      now
    );

    // Cập nhật trạng thái chứng chỉ vào bảng students nếu là chứng chỉ Ngoại ngữ
    try {
      db.prepare(`
        UPDATE students SET
          cert = ?,
          status = CASE WHEN status = 'unregistered' THEN 'submitted' ELSE status END
        WHERE UPPER(studentId) = ?
      `).run(`${dto.name} ${dto.score}`, studentId);

      // Đồng bộ hai chiều sang bảng declarations nếu sinh viên đã khai báo
      db.prepare(`
        UPDATE declarations SET
          foreignLanguage = ?,
          foreignScore = ?,
          foreignStatus = 'valid'
        WHERE UPPER(studentId) = ?
      `).run(dto.name, dto.score, studentId);
    } catch {}

    return {
      id,
      studentId,
      studentName: dto.studentName || '',
      type: dto.type || 'Ngoại ngữ',
      name: dto.name,
      score: dto.score,
      maxScore: dto.maxScore,
      level: dto.level,
      examDate: dto.examDate,
      issueDate: issueDate,
      proofFileName: fileName,
      fileName,
      fileType,
      fileSize,
      proofData,
      driveLink,
      commitmentConfirmed,
      status,
      createdAt: now
    };

    try {
      notificationService.createNotification({
        title: `Tiếp nhận Hồ sơ Chứng chỉ ${dto.name} (${dto.score || 'Đạt'})`,
        content: `Khoa CNTT đã ghi nhận chứng chỉ tiếng Anh "${dto.name}" với điểm số ${dto.score} (CEFR: ${dto.level || 'B1'}) của bạn. Minh chứng đã được lưu vào hồ sơ xét tốt nghiệp.`,
        type: 'cert',
        priority: 'normal',
        targetAudience: 'specific_student',
        targetStudentId: studentId,
        senderRole: 'system',
        senderName: 'Khoa Công nghệ Thông tin',
        senderEmail: 'khoacntt@tdtu.edu.vn'
      });
    } catch {}

    return result;
  }

  deleteStudentCertificate(id: string): boolean {
    const db = this.getDb();
    try {
      const cert = db.prepare('SELECT studentId FROM student_uploaded_certs WHERE id = ?').get(id) as any;
      db.prepare(`DELETE FROM student_uploaded_certs WHERE id = ?`).run(id);
      if (cert && cert.studentId) {
        const remaining = db.prepare('SELECT name, score FROM student_uploaded_certs WHERE UPPER(studentId) = UPPER(?) ORDER BY createdAt DESC LIMIT 1').get(cert.studentId) as any;
        const newCert = remaining ? `${remaining.name} ${remaining.score}` : null;
        try {
          db.prepare('UPDATE students SET cert = ? WHERE UPPER(studentId) = UPPER(?)').run(newCert, cert.studentId);
          db.prepare(`
            UPDATE declarations SET
              foreignLanguage = ?,
              foreignScore = ?,
              foreignStatus = ?
            WHERE UPPER(studentId) = ?
          `).run(
            remaining ? remaining.name : null,
            remaining ? remaining.score : null,
            remaining ? 'valid' : 'unverified',
            cert.studentId
          );
        } catch {}
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const certificatesService = new CertificatesService();
