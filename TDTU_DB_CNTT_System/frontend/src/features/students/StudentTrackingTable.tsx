import React, { useState } from 'react';
import type {
  StudentRecord,
  UserRole,
  InternshipStatus,
} from '../../types/index';
import { apiClient } from '../../services/api.client';

interface StudentTrackingTableProps {
  role: UserRole;
  students: StudentRecord[];
  onFilterChange: (filter: { search?: string; course?: string; major?: string; status?: string }) => void;
  onRefresh: () => void;
}

export const StudentTrackingTable: React.FC<StudentTrackingTableProps> = ({
  role,
  students,
  onFilterChange,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [major, setMajor] = useState('');
  const [status, setStatus] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [openMenuMssv, setOpenMenuMssv] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<InternshipStatus>('Có doanh nghiệp');
  const [editCompany, setEditCompany] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvImportText, setCsvImportText] = useState(
    '52200999,Nguyễn Minh Khang,22050201,Kỹ thuật phần mềm,Tập sự nghề nghiệp + Kiến tập công nghiệp,Có doanh nghiệp,FPT Software,TOEIC 650 (B2)'
  );

  const triggerFilter = (next: { search?: string; course?: string; major?: string; status?: string }) => {
    const merged = {
      search: next.search ?? search,
      course: next.course ?? course,
      major: next.major ?? major,
      status: next.status ?? status,
    };
    onFilterChange(merged);
  };

  const handleOpenDetail = (stu: StudentRecord) => {
    setSelectedStudent(stu);
    setEditStatus(stu.status);
    setEditCompany(stu.company);
  };

  const handleSaveStatusIntervention = async () => {
    if (!selectedStudent) return;
    const res = await apiClient.interveneStudentStatus(selectedStudent.mssv, {
      status: editStatus,
      company: editCompany,
    });
    if (res.success) {
      alert(res.message);
      setSelectedStudent(null);
      onRefresh();
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvImportText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const parsedRows = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const coursesRaw = parts[4] || 'Tập sự nghề nghiệp';
      const courses = coursesRaw.includes('+')
        ? ['Kiến tập công nghiệp', 'Tập sự nghề nghiệp']
        : [coursesRaw];
      return {
        mssv: parts[0] || '',
        name: parts[1] || '',
        class: parts[2] || '22050201',
        major: parts[3] || 'Kỹ thuật phần mềm',
        courses,
        status: (parts[5] as InternshipStatus) || 'Chưa có doanh nghiệp',
        company: parts[6] || 'Chưa có',
        cert: parts[7] || 'Chưa có',
      };
    });

    const res = await apiClient.importStudentsBatch(parsedRows);
    if (res.success) {
      alert(res.message);
      setShowImportModal(false);
      onRefresh();
    } else if (res.error) {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Danh sách sinh viên thực tập trong kỳ ({students.length} SV hiển thị)
            </h2>
          </div>

          {role === 'GV' && (
            <button
              type="button"
              onClick={() => setShowImportModal(!showImportModal)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              + Import Excel / CSV Danh Sách Sinh Viên (GV)
            </button>
          )}
        </div>

        {showImportModal && role === 'GV' && (
          <form
            onSubmit={handleImportSubmit}
            className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3 text-xs"
          >
            <div className="font-bold text-slate-900">
              Import nhanh danh sách Sinh viên (Định dạng: MSSV, Họ tên, Lớp, Ngành, Môn đăng ký, Trạng thái, Công ty, Chứng chỉ)
            </div>
            <textarea
              rows={3}
              value={csvImportText}
              onChange={(e) => setCsvImportText(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg"
              >
                Thực Hiện Import Vào CSDL
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              triggerFilter({ search: e.target.value });
            }}
            placeholder="Tìm theo MSSV, Họ tên, Công ty, MST..."
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
          />

          <select
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              triggerFilter({ course: e.target.value });
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
          >
            <option value="">Tất cả môn học (134 lượt)</option>
            <option value="both">⭐ Sinh viên đi cả 2 môn (43 SV)</option>
            <option value="Tập sự nghề nghiệp">Tập sự nghề nghiệp (TSNN)</option>
            <option value="Kiến tập công nghiệp">Kiến tập công nghiệp (KTCN)</option>
            <option value="Dự án Công nghệ thông tin 1">Dự án CNTT 1</option>
          </select>

          <select
            value={major}
            onChange={(e) => {
              setMajor(e.target.value);
              triggerFilter({ major: e.target.value });
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
          >
            <option value="">Tất cả ngành (91 SV)</option>
            <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm (502 - 38 SV)</option>
            <option value="Khoa học máy tính">Khoa học máy tính (503 - 33 SV)</option>
            <option value="Mạng máy tính và truyền thông dữ liệu">Mạng máy tính & TT (504 - 20 SV)</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              triggerFilter({ status: e.target.value });
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Có doanh nghiệp">Có doanh nghiệp</option>
            <option value="Đang chờ PV/KQPV">Đang chờ PV/KQPV</option>
            <option value="Chưa có doanh nghiệp">Chưa có doanh nghiệp</option>
            <option value="Cần Khoa hỗ trợ">Cần Khoa hỗ trợ</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
            <tr>
              <th className="py-3 px-3">STT</th>
              <th className="py-3 px-3">MSSV</th>
              <th className="py-3 px-4">Họ và tên</th>
              <th className="py-3 px-3">Lớp / Ngành</th>
              <th className="py-3 px-3">Môn Đăng Ký</th>
              <th className="py-3 px-3">Trạng thái</th>
              <th className="py-3 px-3">Doanh nghiệp</th>
              <th className="py-3 px-3">Chuẩn Ngoại Ngữ TDTU</th>
              <th className="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.mssv} className="hover:bg-slate-50">
                <td className="py-3 px-3 font-mono text-slate-400">{s.stt}</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">{s.mssv}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                <td className="py-3 px-3 text-slate-600">
                  {s.class} · {s.major}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      s.courses.length >= 2 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {s.courses.length >= 2 ? `${s.course_str} (Song song)` : s.course_str}
                  </span>
                </td>
                <td className="py-3 px-3 font-semibold">{s.status}</td>
                <td className="py-3 px-3 font-medium text-slate-800">{s.company}</td>
                <td className="py-3 px-3 font-semibold text-blue-700">{s.cert}</td>
                <td className="py-3 px-3 text-center relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuMssv(openMenuMssv === s.mssv ? null : s.mssv);
                      }}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition cursor-pointer border shadow-2xs ${
                        openMenuMssv === s.mssv
                          ? 'bg-[#003087] text-white border-[#003087]'
                          : 'bg-white hover:bg-[#ebf3ff] text-[#1f2937] hover:text-[#003087] border-[#cbd5e1]'
                      }`}
                      title="Tùy chọn thao tác"
                    >
                      <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.75" />
                        <circle cx="12" cy="12" r="1.75" />
                        <circle cx="12" cy="19" r="1.75" />
                      </svg>
                    </button>

                    {openMenuMssv === s.mssv && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuMssv(null);
                          }}
                        />
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-[#e5e7eb] py-1.5 z-40 text-left"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuMssv(null);
                              handleOpenDetail(s);
                            }}
                            className="w-full px-4 py-2 text-[12.5px] font-bold text-[#1f2937] hover:bg-[#ebf3ff] hover:text-[#003087] flex items-center gap-2.5 transition text-left cursor-pointer"
                          >
                            <svg className="w-4 h-4 text-[#003087] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Hồ sơ chi tiết</span>
                          </button>

                          {role === 'GV' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuMssv(null);
                                handleOpenDetail(s);
                              }}
                              className="w-full px-4 py-2 text-[12.5px] font-bold text-[#1f2937] hover:bg-[#ebf3ff] hover:text-[#003087] flex items-center gap-2.5 transition text-left cursor-pointer"
                            >
                              <svg className="w-4 h-4 text-[#003087] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Can thiệp / Sửa</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Chi tiết & Can thiệp trạng thái (Dành cho Giảng viên) */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Hồ Sơ Thực Tập: {selectedStudent.name} ({selectedStudent.mssv})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl">
              <div>
                <span className="text-slate-400 block">Lớp / Ngành:</span>
                <strong>
                  {selectedStudent.class} · {selectedStudent.major}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Môn đăng ký:</span>
                <strong className="text-purple-700">{selectedStudent.course_str}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">MST Doanh nghiệp:</span>
                <strong>{selectedStudent.taxCode || 'Chưa khai báo'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Chuẩn ngoại ngữ TDTU:</span>
                <strong className="text-emerald-700">{selectedStudent.cert}</strong>
              </div>
            </div>

            {role === 'GV' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="font-bold text-slate-900">
                  Can thiệp trạng thái & Điều phối Doanh nghiệp (Quyền Giảng viên / Admin):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Trạng thái thực tập:</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as InternshipStatus)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
                    >
                      <option value="Có doanh nghiệp">Có doanh nghiệp</option>
                      <option value="Đang chờ PV/KQPV">Đang chờ PV/KQPV</option>
                      <option value="Chưa có doanh nghiệp">Chưa có doanh nghiệp</option>
                      <option value="Cần Khoa hỗ trợ">Cần Khoa hỗ trợ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Doanh nghiệp tiếp nhận / Ghi chú:</label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStatusIntervention}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                  >
                    Lưu Thay Đổi Vào CSDL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
