import React, { useEffect, useState } from 'react';
import type { InternshipDocumentRecord } from '../../types/index';
import { apiClient } from '../../services/api.client';

export const InternshipDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<InternshipDocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiClient
      .getInternshipDocuments()
      .then((res) => {
        if (res.success && Array.isArray(res.documents)) {
          setDocuments(res.documents);
        }
      })
      .catch(() => {
        // Fallback default
        setDocuments([
          {
            id: 'doc-01',
            code: 'BM-01',
            title: 'Đề cương chi tiết môn học Thực tập Doanh nghiệp (KTCN & TSNN)',
            category: 'ĐỀ CƯƠNG',
            description:
              'Quy định mục tiêu, chuẩn đầu ra, khối lượng thời gian tối thiểu 320 giờ tại doanh nghiệp và cách thức đánh giá.',
            fileFormat: 'PDF',
            fileSize: '1.2 MB',
            downloadUrl: '/docs/BM-01_De_Cuong_Chi_Tiet_Thuc_Tap_TDTU.pdf',
            updatedAt: '15/10/2026',
          },
          {
            id: 'doc-02',
            code: 'BM-02',
            title: 'Mẫu Nhật ký thực tập tuần & Báo cáo tiến độ chuyên môn',
            category: 'BIỂU MẪU',
            description:
              'Mẫu sinh viên ghi chép công việc hàng tuần, có xác nhận chữ ký của Mentor/Người hướng dẫn doanh nghiệp.',
            fileFormat: 'DOCX',
            fileSize: '420 KB',
            downloadUrl: '/docs/BM-02_Mau_Nhat_Ky_Thuc_Tap_Tuan.docx',
            updatedAt: '18/10/2026',
          },
          {
            id: 'doc-03',
            code: 'BM-03',
            title: 'Phiếu nhận xét & Đánh giá kết quả thực tập của Doanh nghiệp (Có mộc)',
            category: 'BIỂU MẪU',
            description:
              'Mẫu đánh giá thái độ, kỹ năng, chuyên môn và điểm số do Doanh nghiệp chấm gửi về Khoa.',
            fileFormat: 'DOCX',
            fileSize: '350 KB',
            downloadUrl: '/docs/BM-03_Phieu_Danh_Gia_Doanh_Nghiep.docx',
            updatedAt: '20/10/2026',
          },
          {
            id: 'doc-04',
            code: 'BM-04',
            title: 'Quy chế Thực tập & Hướng dẫn bảo vệ Báo cáo tốt nghiệp',
            category: 'QUY ĐỊNH',
            description:
              'Quy chế đào tạo chính quy Khoa CNTT - ĐH Tôn Đức Thắng về điều kiện công nhận điểm thực tập.',
            fileFormat: 'PDF',
            fileSize: '2.5 MB',
            downloadUrl: '/docs/BM-04_Quy_Che_Thuc_Tap_Khoa_CNTT.pdf',
            updatedAt: '22/10/2026',
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs text-amber-200">
            <span>Cổng Văn Bản Học Thuật Khoa CNTT</span>
            <span>·</span>
            <span>DATA-02</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Biểu Mẫu, Quy Định &amp; Đề Cương Thực Tập TDTU
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
            Toàn bộ biểu mẫu chuẩn, quy chế đào tạo thực tập doanh nghiệp và cẩm nang hướng dẫn chính thức từ Khoa CNTT - Đại học Tôn Đức Thắng dành cho sinh viên và doanh nghiệp đối tác.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Đang tải danh mục biểu mẫu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {documents.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold font-mono">
                    {d.code}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        d.fileFormat === 'PDF'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {d.fileFormat}
                    </span>
                    <span className="text-slate-400 text-[11px]">{d.fileSize}</span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{d.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{d.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Cập nhật: {d.updatedAt}</span>
                <a
                  href={d.downloadUrl}
                  download
                  onClick={() => alert(`Đang tải văn bản ${d.code} (${d.fileFormat})...`)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors inline-flex items-center space-x-1 shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Tải Biểu Mẫu</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regulations Box */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
        <div className="font-bold text-sm text-amber-950 flex items-center space-x-2">
          <span>Lưu Ý Quan Trọng Về Thời Lượng &amp; Tiến Độ</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
          <li>
            Thời gian thực tập tối thiểu: <strong>320 giờ làm việc thực tế</strong> tại doanh nghiệp (tương đương 8-10 tuần).
          </li>
          <li>
            Sinh viên đi cả 2 môn (Kiến tập công nghiệp + Tập sự nghề nghiệp) nộp chung 1 bộ nhật ký và phiếu đánh giá của doanh nghiệp tiếp nhận.
          </li>
          <li>
            Phiếu nhận xét & đánh giá kết quả thực tập (BM-03) <strong>bắt buộc phải có chữ ký của người hướng dẫn và dấu mộc đỏ tròn</strong> của Doanh nghiệp.
          </li>
          <li>
            Sinh viên chưa đạt chuẩn đầu ra ngoại ngữ TDTU phải nộp Đơn cam kết hạn chót hoàn thành trước ngày bảo vệ báo cáo tốt nghiệp.
          </li>
        </ul>
      </div>
    </div>
  );
};
