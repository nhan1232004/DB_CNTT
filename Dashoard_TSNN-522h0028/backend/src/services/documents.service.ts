export interface DocumentTemplate {
  id: string;
  code: string;
  name: string;
  category: 'bieu_mau' | 'quy_dinh';
  fileFormat: string;
  size: string;
  description: string;
  downloadUrl: string;
  isMandatory: boolean;
}

export const TDTU_DOCUMENTS: DocumentTemplate[] = [
  {
    id: 'doc-bm-01',
    code: 'BM-01',
    name: 'Phiếu tiếp nhận Sinh viên Thực tập (Bản xác nhận của Doanh nghiệp)',
    category: 'bieu_mau',
    fileFormat: 'DOCX',
    size: '29 KB',
    description: 'Doanh nghiệp ký tên đóng dấu xác nhận tiếp nhận sinh viên thực tập KTCN/TSNN. Nộp trong vòng 2 tuần đầu kỳ.',
    downloadUrl: '/api/documents/download/BM01_XacNhanThucTap.docx',
    isMandatory: true
  },
  {
    id: 'doc-bm-02',
    code: 'BM-02',
    name: 'Đề cương chi tiết nội dung Thực tập Doanh nghiệp',
    category: 'bieu_mau',
    fileFormat: 'DOCX',
    size: '35 KB',
    description: 'Mô tả mục tiêu kỹ thuật, công nghệ áp dụng, kế hoạch tuần làm việc tại doanh nghiệp.',
    downloadUrl: '/api/documents/download/BM02_DeCuongThucTap.docx',
    isMandatory: true
  },
  {
    id: 'doc-bm-03',
    code: 'BM-03',
    name: 'Nhật ký Thực tập Doanh nghiệp (Minh chứng tối thiểu 320 giờ làm việc)',
    category: 'bieu_mau',
    fileFormat: 'DOCX',
    size: '42 KB',
    description: 'Ghi chép công việc hàng ngày, có chữ ký xác nhận của cán bộ hướng dẫn tại doanh nghiệp (Mentor).',
    downloadUrl: '/api/documents/download/BM03_NhatKy320h.docx',
    isMandatory: true
  },
  {
    id: 'doc-bm-04',
    code: 'BM-04',
    name: 'Phiếu Đánh giá Kết quả Thực tập của Doanh nghiệp tiếp nhận',
    category: 'bieu_mau',
    fileFormat: 'DOCX',
    size: '31 KB',
    description: 'Cán bộ hướng dẫn chấm điểm thái độ kỷ luật, năng lực chuyên môn và kỹ năng mềm của sinh viên.',
    downloadUrl: '/api/documents/download/BM04_DanhGiaDoanhNghiep.docx',
    isMandatory: true
  },
  {
    id: 'doc-reg-01',
    code: 'REG-320H',
    name: 'Quy chế và Quy định Thực tập Doanh nghiệp 320 giờ - Khoa CNTT TDTU',
    category: 'quy_dinh',
    fileFormat: 'PDF',
    size: '185 KB',
    description: 'Quy chế học vụ chi tiết, điều kiện tiên quyết, trách nhiệm và quyền lợi của sinh viên Khoa CNTT.',
    downloadUrl: '/api/documents/download/QuyChe_ThucTap_320h_TDTU.pdf',
    isMandatory: false
  }
];

export class DocumentsService {
  getAllDocuments(): DocumentTemplate[] {
    return TDTU_DOCUMENTS;
  }

  getDocumentById(id: string): DocumentTemplate | undefined {
    return TDTU_DOCUMENTS.find(d => d.id === id || d.code === id);
  }
}

export const documentsService = new DocumentsService();
