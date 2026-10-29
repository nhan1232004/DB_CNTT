// ============================================================================
// CERTIFICATES SERVICE: Chuẩn Ngoại Ngữ Đầu Ra Xét Tốt Nghiệp ĐH Tôn Đức Thắng
// Chỉ chấp nhận các chứng chỉ được Nhà trường công nhận chính thức
// ============================================================================

import type {
  TdtuLanguageStandard,
  CertificateSubmissionPayload,
  StudentRecord,
} from '../../../../../packages/shared-types/src/index.ts';
import type { StudentsService } from '../students/students.service.ts';
import type { SqliteDatabase } from '../../database/sqlite.db.ts';

export class CertificatesService {
  private readonly studentsService: StudentsService;
  private readonly sqlite?: SqliteDatabase;

  private readonly tdtuStandards: TdtuLanguageStandard[] = [
    {
      code: 'TOEIC',
      name: 'TOEIC (Listening & Reading + Speaking & Writing)',
      category: 'Tiếng Anh Quốc Tế',
      minStandard: 'L&R ≥ 500 (hoặc 4 kỹ năng tương đương)',
      minHighQuality: 'L&R ≥ 600',
      description: 'Chứng chỉ TOEIC quốc tế do IIG Việt Nam / ETS cấp còn hiệu lực.',
    },
    {
      code: 'IELTS',
      name: 'IELTS Academic',
      category: 'Tiếng Anh Quốc Tế',
      minStandard: 'Overall ≥ 5.0',
      minHighQuality: 'Overall ≥ 5.5 - 6.0',
      description: 'Chứng chỉ IELTS Academic quốc tế (British Council / IDP).',
    },
    {
      code: 'TOEFL_IBT',
      name: 'TOEFL iBT',
      category: 'Tiếng Anh Quốc Tế',
      minStandard: '≥ 45 điểm',
      minHighQuality: '≥ 60 điểm',
      description: 'Chứng chỉ TOEFL iBT do ETS cấp.',
    },
    {
      code: 'CAMBRIDGE',
      name: 'Cambridge English (B1 Preliminary / B2 First / C1 Advanced)',
      category: 'Tiếng Anh Quốc Tế',
      minStandard: 'PET / FCE ≥ 150 - 160',
      minHighQuality: 'FCE (B2) ≥ 160 / CAE (C1)',
      description: 'Chứng chỉ Cambridge Assessment English có giá trị vĩnh viễn.',
    },
    {
      code: 'VSTEP',
      name: 'VSTEP (Khung năng lực ngoại ngữ 6 bậc Việt Nam)',
      category: 'Khung NLNN Việt Nam',
      minStandard: 'Bậc 3 (B1) / Bậc 4 (B2)',
      minHighQuality: 'Bậc 4 (B2)',
      description: 'Do các trường Đại học được Bộ GD&ĐT cấp phép tổ chức thi và cấp chứng chỉ.',
    },
    {
      code: 'APTIS',
      name: 'Aptis ESOL (British Council)',
      category: 'Tiếng Anh Quốc Tế',
      minStandard: 'B1 / B2',
      minHighQuality: 'B2 trở lên',
      description: 'Chứng chỉ Aptis ESOL theo quy định quy đổi tương đương của TDTU.',
    },
    {
      code: 'SECOND_LANG',
      name: 'Ngoại ngữ 2 (JLPT N4/N3, HSK 3/4, TOPIK II Cấp 3)',
      category: 'Ngoại Ngữ 2',
      minStandard: 'JLPT N4 / HSK 3 / TOPIK 3',
      minHighQuality: 'JLPT N3 / HSK 4 / TOPIK 4',
      description: 'Áp dụng đối với chương trình hoặc diện sinh viên quy đổi chuẩn ngoại ngữ 2.',
    },
    {
      code: 'COMMITMENT',
      name: 'Giấy cam kết nộp bổ sung chứng chỉ trước đợt xét tốt nghiệp',
      category: 'Cam Kết',
      minStandard: 'Đang chờ thi / Đợi cấp bằng',
      minHighQuality: 'Nộp trước hạn xét tốt nghiệp',
      description: 'Sinh viên ký cam kết thời hạn nộp bản gốc chứng chỉ ngoại ngữ đạt chuẩn TDTU.',
    },
  ];

  constructor(studentsService: StudentsService, sqlite?: SqliteDatabase) {
    this.studentsService = studentsService;
    this.sqlite = sqlite;
  }

  getRecognizedStandards(): TdtuLanguageStandard[] {
    return this.tdtuStandards;
  }

  submitCertificate(payload: CertificateSubmissionPayload): {
    success: boolean;
    message: string;
    updatedStudent: StudentRecord | null;
  } {
    if (!payload.mssv || !payload.mssv.trim()) {
      throw new Error('Thiếu mã số sinh viên (MSSV).');
    }

    const standard = this.tdtuStandards.find((s) => s.code === payload.certCode);
    if (!standard) {
      throw new Error(
        'Loại chứng chỉ không nằm trong danh mục công nhận xét tốt nghiệp của ĐH Tôn Đức Thắng.'
      );
    }

    const scoreClean = (payload.scoreOrLevel || '').trim();
    if (payload.certCode !== 'COMMITMENT' && !scoreClean) {
      throw new Error('Vui lòng nhập điểm số hoặc bậc năng lực ngoại ngữ đạt được.');
    }

    const prefixLabel =
      payload.certCode === 'TOEFL_IBT'
        ? 'TOEFL iBT'
        : payload.certCode === 'SECOND_LANG'
          ? 'NN2'
          : payload.certCode;

    const displayCert =
      payload.certCode === 'COMMITMENT'
        ? 'Cam kết nộp sau'
        : scoreClean.toUpperCase().startsWith(prefixLabel.toUpperCase())
          ? scoreClean
          : `${prefixLabel} ${scoreClean}`;

    const certStatus = payload.certCode === 'COMMITMENT' ? 'Cam kết nộp sau' : 'Đã thẩm định';

    const updated = this.studentsService.updateStudentRecord(payload.mssv, {
      cert: displayCert,
      certStatus,
      certCode: payload.certCode,
      certScore: scoreClean || 'Cam kết bổ sung',
      certNumber: payload.certNumber || undefined,
      examDate: payload.examDate || undefined,
      commitmentDeadline: payload.commitmentDeadline || undefined,
      proofFileName: payload.proofFileName || undefined,
    });

    if (!updated) {
      throw new Error(`Không tìm thấy sinh viên với MSSV: ${payload.mssv}`);
    }

    if (this.sqlite) {
      this.sqlite.db
        .prepare(
          `INSERT INTO graduation_language_certs (
            id, student_id, cert_code, cert_name, score_or_level, cert_number,
            exam_date, commitment_deadline, proof_file_name, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          `cert-${Date.now()}-${updated.mssv}`,
          updated.mssv,
          payload.certCode,
          standard.name,
          scoreClean || 'Cam kết nộp sau',
          payload.certNumber || null,
          payload.examDate || null,
          payload.commitmentDeadline || null,
          payload.proofFileName || null,
          certStatus,
          new Date().toISOString()
        );
    }

    return {
      success: true,
      message:
        payload.certCode === 'COMMITMENT'
          ? `Đã ghi nhận Giấy cam kết bổ sung chứng chỉ ngoại ngữ (Hạn cam kết: ${payload.commitmentDeadline || 'Trước đợt xét tốt nghiệp'}).`
          : `Đã lưu minh chứng ${displayCert} (Số hiệu: ${payload.certNumber || 'Đang đối chiếu'}) đạt chuẩn đầu ra ĐH Tôn Đức Thắng!`,
      updatedStudent: updated,
    };
  }
}
