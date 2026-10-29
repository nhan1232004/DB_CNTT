import React from 'react';
import type { UserProfile, StudentRecord } from '../../../../../packages/shared-types/src/index';

interface StudentEligibilityBannerProps {
  currentUser: UserProfile;
  students: StudentRecord[];
  onNavigateToLetters: () => void;
  onNavigateToDocuments: () => void;
}

export const StudentEligibilityBanner: React.FC<StudentEligibilityBannerProps> = ({
  currentUser,
  students,
  onNavigateToLetters,
  onNavigateToDocuments,
}) => {
  if (currentUser.role === 'SV') {
    const mssv = (currentUser.studentId || '').toUpperCase();
    const student = students.find((s) => s.mssv.toUpperCase() === mssv);

    if (student) {
      return (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                ✓
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-emerald-900 uppercase tracking-wide">
                    Hồ Sơ Hợp Lệ · Đủ Điều Kiện Thực Tập HK1/2026-2027
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px] font-bold">
                    AUTH-03 PASSED
                  </span>
                </div>
                <div className="text-emerald-700 mt-0.5">
                  Sinh viên <strong>{student.name}</strong> (MSSV: <strong>{student.mssv}</strong>) đủ
                  điều kiện tham gia học phần <strong>{student.course_str}</strong> (
                  {student.courses.length} môn). Lớp sinh hoạt: <strong>{student.class}</strong> ·
                  Ngành: <strong>{student.major}</strong>.
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={onNavigateToLetters}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Xin Giấy Giới Thiệu (GGT) &rarr;
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Ineligible student (not in current semester list)
    return (
      <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              ⚠️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-amber-950 uppercase tracking-wide">
                  Chưa Ghi Nhận Trong Danh Sách Đợt Thực Tập HK1/2026-2027
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                  AUTH-03 THÔNG BÁO
                </span>
              </div>
              <div className="text-amber-800 mt-0.5">
                Mã số sinh viên <strong>{mssv || 'Chưa xác định'}</strong> hiện chưa nằm trong danh sách
                91 sinh viên đủ điều kiện làm học phần Thực tập doanh nghiệp kỳ này. Vui lòng xem{' '}
                <strong>Biểu mẫu & Quy định</strong> hoặc liên hệ Văn phòng Khoa CNTT (Phòng C.003).
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onNavigateToDocuments}
              className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Xem Quy Chế Thực Tập &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lecturer header banner
  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2.5">
          <span className="px-2 py-0.5 rounded bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wide">
            Cổng Giảng Viên
          </span>
          <span className="text-slate-700">
            Đang quản lý <strong>{students.length} sinh viên</strong> (134 lượt môn học KTCN, TSNN &amp;
            DA CNTT 1) · Tiến độ đợt thực tập HK1/2026-2027
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToLetters}
            className="text-blue-700 font-bold hover:underline cursor-pointer"
          >
            Duyệt Giấy Giới Thiệu &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
