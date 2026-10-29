export interface CertificateStandard {
  type: string;
  name: string;
  minScore: string;
  equivalentLevel: string;
  description: string;
}

export const TDTU_LANGUAGE_STANDARDS: CertificateStandard[] = [
  { type: 'TOEIC', name: 'TOEIC (Listening & Reading)', minScore: '500', equivalentLevel: 'B1 (CEFR)', description: 'Chuẩn xét tốt nghiệp ĐH Tôn Đức Thắng ngành CNTT' },
  { type: 'IELTS', name: 'IELTS Academic', minScore: '5.0', equivalentLevel: 'B1 / B2', description: 'Chứng chỉ tiếng Anh học thuật quốc tế' },
  { type: 'TOEFL_IBT', name: 'TOEFL iBT', minScore: '45', equivalentLevel: 'B1', description: 'Chứng chỉ khảo thí tiếng Anh quốc tế ETS' },
  { type: 'CAMBRIDGE', name: 'Cambridge English (PET / FCE / CAE)', minScore: '140', equivalentLevel: 'B1 / B2', description: 'Khung năng lực Cambridge quốc tế' },
  { type: 'VSTEP', name: 'VSTEP (Khung NLNN 6 bậc VN)', minScore: 'Bậc 3 (B1)', equivalentLevel: 'B1', description: 'Đánh giá năng lực tiếng Anh theo chuẩn Bộ GD&ĐT' }
];

export class CertificatesService {
  getStandards(): CertificateStandard[] {
    return TDTU_LANGUAGE_STANDARDS;
  }

  validateCertificate(type: string, score?: string): { isValid: boolean; message: string; standard?: CertificateStandard } {
    const cleanType = (type || '').trim().toUpperCase();
    const standard = TDTU_LANGUAGE_STANDARDS.find(
      s => s.type.toUpperCase() === cleanType || s.name.toUpperCase().includes(cleanType)
    );

    if (!standard) {
      return {
        isValid: false,
        message: `Chứng chỉ [${type}] không thuộc danh mục chuẩn ngoại ngữ xét tốt nghiệp của Trường ĐH Tôn Đức Thắng (Chỉ công nhận TOEIC, IELTS, TOEFL iBT, Cambridge, VSTEP).`
      };
    }

    return {
      isValid: true,
      message: `Chứng chỉ [${standard.name}] hợp lệ theo quy định TDTU.`,
      standard
    };
  }
}

export const certificatesService = new CertificatesService();
