import React, { useEffect, useState } from 'react';
import type {
  IntroductionLetterRecord,
  UserProfile,
  StudentRecord,
} from '../../types/index';
import { apiClient } from '../../services/api.client';

interface IntroductionLettersProps {
  currentUser: UserProfile;
  currentStudent?: StudentRecord;
  onLetterCreated?: () => void;
}

export const IntroductionLetters: React.FC<IntroductionLettersProps> = ({
  currentUser,
  currentStudent,
  onLetterCreated,
}) => {
  const [letters, setLetters] = useState<IntroductionLetterRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [companyName, setCompanyName] = useState<string>('');
  const [representative, setRepresentative] = useState<string>('Ban Giám đốc / Phòng Nhân sự');
  const [address, setAddress] = useState<string>('Tòa nhà Flemington, 182 Lê Đại Hành, Quận 11, TP. HCM');
  const [position, setPosition] = useState<string>('Thực tập sinh Phát triển phần mềm (Fullstack Intern)');
  const [purpose, setPurpose] = useState<string>(
    'Liên hệ thực tập tốt nghiệp & hoàn thành học phần KTCN/TSNN'
  );
  const [courses, setCourses] = useState<string[]>(['Tập sự nghề nghiệp', 'Kiến tập công nghiệp']);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isStudent = currentUser.role === 'SV';

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const studentId = isStudent ? currentUser.studentId : undefined;
      const res = await apiClient.getIntroductionLetters(studentId);
      if (res.success && Array.isArray(res.letters)) {
        setLetters(res.letters);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [currentUser]);

  const handleCourseToggle = (courseName: string) => {
    setCourses((prev) =>
      prev.includes(courseName) ? prev.filter((c) => c !== courseName) : [...prev, courseName]
    );
  };

  const handleRequestLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setMessage({ text: 'Vui lòng nhập tên công ty tiếp nhận.', type: 'error' });
      return;
    }
    const mssv = currentUser.studentId || currentStudent?.mssv || '51900839';
    setSubmitting(true);
    try {
      const res = await apiClient.requestIntroductionLetter({
        mssv,
        recipientCompany: companyName.trim(),
        recipientRepresentative: representative.trim(),
        recipientAddress: address.trim(),
        positionApplied: position.trim(),
        courses: courses.length > 0 ? courses : ['Tập sự nghề nghiệp'],
        purpose: purpose.trim(),
      });

      if (res.success) {
        setMessage({
          text: `Nộp đơn xin cấp Giấy giới thiệu thành công! Mã số: ${res.letter?.letterNo || 'Mới'}`,
          type: 'success',
        });
        setCompanyName('');
        fetchLetters();
        if (onLetterCreated) onLetterCreated();
      } else {
        setMessage({ text: (res as any).error || 'Lỗi gửi yêu cầu', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi kết nối máy chủ', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await apiClient.approveIntroductionLetter(id, currentUser.fullName);
      if (res.success) {
        setMessage({ text: 'Đã phê duyệt Giấy giới thiệu thành công!', type: 'success' });
        fetchLetters();
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi phê duyệt', type: 'error' });
    }
  };

  const handlePrint = (id: string) => {
    const url = apiClient.getPrintableLetterUrl(id);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs text-sky-200">
            <span>Khoa Công Nghệ Thông Tin - ĐH Tôn Đức Thắng</span>
            <span>·</span>
            <span>INT-02 &amp; INT-03</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Giấy Giới Thiệu Thực Tập Doanh Nghiệp (GGT)
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
            Sinh viên nộp đơn đăng ký cấp Giấy giới thiệu có xác nhận điện tử từ Khoa CNTT gửi Doanh nghiệp tiếp nhận. Giấy giới thiệu được ký duyệt và có thể in trực tiếp (chuẩn A4) kèm mã tra cứu bảo mật.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Request GGT */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Đăng Ký Cấp Giấy Giới Thiệu</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Thời hạn hiệu lực của GGT là 60 ngày kể từ ngày Khoa CNTT phê duyệt
            </p>
          </div>

          <form onSubmit={handleRequestLetter} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã số sinh viên (MSSV) *</label>
              <input
                type="text"
                readOnly={isStudent}
                value={currentUser.studentId || currentStudent?.mssv || '51900839'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Đơn vị / Doanh nghiệp tiếp nhận *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="VD: CÔNG TY TNHH KMS TECHNOLOGY VIỆT NAM"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người đại diện / Ban Nhân sự</label>
              <input
                type="text"
                value={representative}
                onChange={(e) => setRepresentative(e.target.value)}
                placeholder="VD: Ban Giám đốc / Phòng Nhân sự"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Địa chỉ doanh nghiệp tiếp nhận</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Tòa nhà Flemington, 182 Lê Đại Hành, Q.11, TP. HCM"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vị trí mong muốn thực tập</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="VD: Thực tập sinh Kỹ thuật phần mềm (Fullstack Intern)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Học phần đăng ký</label>
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courses.includes('Tập sự nghề nghiệp')}
                    onChange={() => handleCourseToggle('Tập sự nghề nghiệp')}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium">Tập sự nghề nghiệp / Dự án CNTT 1</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courses.includes('Kiến tập công nghiệp')}
                    onChange={() => handleCourseToggle('Kiến tập công nghiệp')}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium">Kiến tập công nghiệp (Đồng thời cả 2 môn)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mục đích liên hệ thực tập</label>
              <textarea
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="VD: Liên hệ thực tập tốt nghiệp và tiếp cận môi trường làm việc thực tế"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Đang gửi yêu cầu...' : 'Nộp Đơn Yêu Cầu Cấp GGT'}</span>
            </button>
          </form>
        </div>

        {/* Right Table: Letters List */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Danh Sách Giấy Giới Thiệu ({letters.length})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Theo dõi tiến độ ký duyệt điện tử và in bản PDF chính thức
              </p>
            </div>
            <button
              onClick={fetchLetters}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600"
            >
              Làm Mới
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Đang tải danh sách...</div>
          ) : letters.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có Giấy giới thiệu nào được tạo. Vui lòng điền form bên trái để nộp đơn.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
                    <th className="py-2.5 px-3">Số GGT</th>
                    <th className="py-2.5 px-3">Sinh Viên</th>
                    <th className="py-2.5 px-3">Đơn Vị Tiếp Nhận</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {letters.map((l) => {
                    const isApproved = l.status === 'DA_DUYET';
                    const canApprove = !isStudent && !isApproved;

                    return (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{l.letterNo}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{l.studentName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {l.studentId} · {l.className}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{l.recipientCompany}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">
                            {l.positionApplied}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isApproved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✓ Đã duyệt
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              Chờ duyệt
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {canApprove && (
                              <button
                                onClick={() => handleApprove(l.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Duyệt
                              </button>
                            )}
                            <button
                              onClick={() => handlePrint(l.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <span>In PDF</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
