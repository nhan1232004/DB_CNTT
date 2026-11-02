import React, { useState } from 'react';
import type {
  LecturerAnnouncement,
  JdPosting,
  UserRole,
  StudentRecord,
} from '../../types/index';
import { apiClient } from '../../services/api.client';

interface TwoTierBulletinBoardProps {
  role: UserRole;
  currentStudent: StudentRecord;
  announcements: LecturerAnnouncement[];
  approvedJds: JdPosting[];
  pendingJds: JdPosting[];
  sampleEmails?: Array<{ subject: string; from: string; forwardedBy: string; rawEmail: string }>;
  onRefresh: () => void;
}

export const TwoTierBulletinBoard: React.FC<TwoTierBulletinBoardProps> = ({
  role,
  currentStudent,
  announcements,
  approvedJds,
  pendingJds,
  sampleEmails = [],
  onRefresh,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'Khẩn' | 'Hướng dẫn' | 'Sự kiện'>('Khẩn');
  const [showModal, setShowModal] = useState(false);

  // State cho Email Forward Parser Modal
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [rawEmailInput, setRawEmailInput] = useState(
    sampleEmails[0]?.rawEmail ||
      `---------- Forwarded message ---------
From: Phòng Tuyển dụng VNG Campus <campus-hr@vng.com.vn>
Subject: Fwd: [Tuyển dụng Thực tập] Software Engineer Intern (Backend & AI) - VNG Corporation
To: nguyenvana@tdtu.edu.vn

Công ty: VNG Corporation (ZaloPay & VNG Cloud)
Mã số thuế (MST): 0312345678
Vị trí: Software Engineer Intern (Distributed Backend & AI)
Số lượng: 12 sinh viên
Kỹ năng: Golang, Node.js, System Design, Docker
Mức trợ cấp: 8.500.000 VNĐ/tháng
Hạn nộp: 30/11/2026
Mô tả: Tuyển thực tập sinh CNTT TDTU làm đồng thời 2 môn KTCN + TSNN.`
  );
  const [parsedPreview, setParsedPreview] = useState<any>(null);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const res = await apiClient.createLecturerAnnouncement({
      title,
      content,
      category,
      isPinned: category === 'Khẩn',
    });
    if (!res.success && res.error) {
      alert(res.error);
      return;
    }
    setTitle('');
    setContent('');
    setShowModal(false);
    onRefresh();
  };

  const handleTogglePin = async (id: string) => {
    await apiClient.togglePinAnnouncement(id);
    onRefresh();
  };

  const handlePreviewParseEmail = async () => {
    const res = await apiClient.previewEmailForward({ rawEmail: rawEmailInput });
    if (res.success) {
      setParsedPreview(res.parsed);
    }
  };

  const handleSubmitEmailForward = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiClient.simulateEmailForwardJd({
      rawEmail: rawEmailInput,
      ...(parsedPreview || {}),
    });
    if (res.success) {
      alert(res.message);
      setShowForwardModal(false);
      setParsedPreview(null);
      onRefresh();
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleApproveJd = async (id: string) => {
    const res = await apiClient.approvePendingJd(id);
    if (!res.success && res.error) {
      alert(res.error);
      return;
    }
    onRefresh();
  };

  const handleRejectJd = async (id: string) => {
    await apiClient.rejectPendingJd(id);
    onRefresh();
  };

  const handleStudentApplyJd = async (jd: JdPosting) => {
    const res = await apiClient.applyForJd(jd.id, {
      mssv: currentStudent.mssv,
      selectedCourses: currentStudent.courses,
      cvNote: `Sinh viên ${currentStudent.name} (${currentStudent.mssv}) ứng tuyển ${currentStudent.course_str}`,
    });
    if (res.success) {
      alert(res.message);
      onRefresh();
    } else if (res.error) {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-8">
      {/* ================= TẦNG 1 (Ở TRÊN): BẢNG TIN THÔNG BÁO CỦA GIẢNG VIÊN ================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded">
              Tầng 1 (Ở trên) · Thông báo chính thức của Giảng viên
            </span>
            <h2 className="text-lg font-bold mt-1">
              BẢNG TIN THÔNG BÁO CỦA GIẢNG VIÊN & KHOA CNTT
            </h2>
          </div>

          {role === 'GV' && (
            <button
              type="button"
              onClick={() => setShowModal(!showModal)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
            >
              + Đăng Thông Báo Mới (Giảng viên)
            </button>
          )}
        </div>

        {showModal && role === 'GV' && (
          <form
            onSubmit={handleCreateAnnouncement}
            className="bg-white p-5 rounded-2xl border-2 border-blue-500 space-y-3 text-xs"
          >
            <div className="font-bold text-slate-900 text-sm">Soạn Thông Báo Mới Gửi Sinh Viên</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề thông báo..."
                className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
              >
                <option value="Khẩn">Thông báo Khẩn (Tự động ghim)</option>
                <option value="Hướng dẫn">Hướng dẫn học vụ</option>
                <option value="Sự kiện">Lịch gặp mặt / Sự kiện</option>
              </select>
            </div>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung chi tiết..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg"
              >
                Xuất Bản Thông Báo
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white p-5 rounded-2xl border shadow-xs space-y-2 ${
                ann.isPinned ? 'border-l-4 border-l-rose-500 border-slate-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {ann.isPinned && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                      Đã ghim
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {ann.category}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{ann.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-[11px]">
                    {ann.createdAt} · <strong>{ann.authorName}</strong>
                  </span>
                  {role === 'GV' && (
                    <button
                      type="button"
                      onClick={() => handleTogglePin(ann.id)}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      {ann.isPinned ? 'Bỏ ghim' : 'Ghim tin'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{ann.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TẦNG 2 (Ở DƯỚI): BẢNG TIN VIỆC LÀM & EMAIL FORWARD JD ================= */}
      <section className="space-y-4 pt-6 border-t-2 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              Tầng 2 (Ở dưới) · Email Forward Parser & Tuyển dụng JD
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              BẢNG TIN TUYỂN DỤNG THỰC TẬP (TỰ ĐỘNG BÓC TÁCH TỪ EMAIL FORWARD)
            </h2>
          </div>

          {role === 'GV' && (
            <button
              type="button"
              onClick={() => setShowForwardModal(!showForwardModal)}
              className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl"
            >
              Chuyển Tiếp (Forward) Email JD Doanh Nghiệp
            </button>
          )}
        </div>

        {/* Form / Modal Bóc tách Raw Email Forward */}
        {showForwardModal && role === 'GV' && (
          <form
            onSubmit={handleSubmitEmailForward}
            className="bg-indigo-950 text-white p-5 rounded-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">
                  Bộ Bóc Tách Tự Động Email Forward Tuyển Dụng (Inbound Email Parser)
                </div>
                <div className="text-indigo-200 text-[11px]">
                  Dán nội dung email doanh nghiệp gửi cho Giảng viên để tự động bóc tách MST, Công ty, Vị trí, Trợ cấp và Hạn nộp
                </div>
              </div>
              <button
                type="button"
                onClick={handlePreviewParseEmail}
                className="px-5 py-2.5 min-w-[170px] h-[38px] whitespace-nowrap bg-[#003087] hover:bg-[#002266] text-white font-bold rounded-lg text-xs cursor-pointer transition"
              >
                Chạy Bóc Tách Thử
              </button>
            </div>

            <textarea
              rows={7}
              value={rawEmailInput}
              onChange={(e) => {
                setRawEmailInput(e.target.value);
                setParsedPreview(null);
              }}
              className="w-full p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs border border-indigo-700"
            />

            {parsedPreview && (
              <div className="bg-slate-900/90 border border-emerald-500/60 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block">Doanh nghiệp & MST:</span>
                  <strong className="text-white">
                    {parsedPreview.companyName} (MST: {parsedPreview.taxCode})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Vị trí & Chỉ tiêu:</span>
                  <strong className="text-emerald-300">
                    {parsedPreview.jobTitle} ({parsedPreview.quota} SV)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Trợ cấp & Hạn nộp:</span>
                  <strong className="text-amber-300">
                    {parsedPreview.stipend} · Hạn: {parsedPreview.deadline}
                  </strong>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForwardModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg"
              >
                Đưa Vào Hàng Đợi Kiểm Duyệt
              </button>
            </div>
          </form>
        )}

        {/* Hàng đợi chờ Giảng viên duyệt 1-Click */}
        {pendingJds.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold uppercase text-amber-900">
              Hàng đợi kiểm duyệt JD từ Email Forward ({pendingJds.length} tin đang chờ duyệt)
            </div>
            {pendingJds.map((jd) => (
              <div
                key={jd.id}
                className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {jd.companyName} — {jd.jobTitle}
                  </div>
                  <div className="text-slate-600">
                    MST: <strong>{jd.taxCode}</strong> · Trợ cấp: <strong>{jd.stipend}</strong> · Chỉ tiêu:{' '}
                    <strong>{jd.quota} SV</strong> · Nguồn: {jd.sourceEmail}
                  </div>
                </div>
                {role === 'GV' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveJd(jd.id)}
                      className="px-5 py-2.5 h-10 bg-[#003087] hover:bg-[#002266] text-white font-bold text-xs rounded-xl whitespace-nowrap inline-flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Duyệt & Công Khai</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectJd(jd.id)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {approvedJds.map((jd) => (
            <div
              key={jd.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {jd.companyName}
                  </span>
                  <span className="text-slate-400">Hạn: {jd.deadline}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{jd.jobTitle}</h3>
                <p className="text-xs text-slate-600 mt-1">{jd.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {jd.skills.map((sk) => (
                    <span
                      key={sk}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700">{jd.stipend}</span>
                  <span className="text-[11px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded">
                    {jd.acceptsBothCourses ? 'Nhận cả 2 môn KTCN+TSNN' : 'Nhận 1 môn'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    MST: {jd.taxCode} · Đã ĐK: {jd.applicationCount || 0}/{jd.quota} SV
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStudentApplyJd(jd)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                  >
                    Ứng tuyển ngay
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
