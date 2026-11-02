import React, { useState, useEffect } from 'react';
import type { CompanyTaxInfo, StudentRecord } from '../../../../../packages/shared-types/src/index';
import { apiClient } from '../../services/api.client';

interface InternshipDeclarationFormProps {
  currentStudent: StudentRecord;
  onDeclarationSuccess: (updated: StudentRecord, message: string) => void;
}

export const InternshipDeclarationForm: React.FC<InternshipDeclarationFormProps> = ({
  currentStudent,
  onDeclarationSuccess,
}) => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>(
    currentStudent.courses?.length ? currentStudent.courses : ['Kiến tập công nghiệp', 'Tập sự nghề nghiệp']
  );
  const [hasCompany, setHasCompany] = useState<boolean>(currentStudent.status === 'Có doanh nghiệp');
  const [mstInput, setMstInput] = useState<string>(currentStudent.taxCode || '0303882213');
  const [loadingMst, setLoadingMst] = useState<boolean>(false);

  // Dữ liệu thu thập tự động từ API MST để sinh viên đọc, chỉnh sửa nếu cần & đối soát
  const [taxInfo, setTaxInfo] = useState<CompanyTaxInfo>({
    taxCode: currentStudent.taxCode || '0303882213',
    companyName:
      currentStudent.company && currentStudent.status === 'Có doanh nghiệp'
        ? currentStudent.company
        : 'CÔNG TY CỔ PHẦN PHẦN MỀM FPT (FPT SOFTWARE)',
    shortName: 'FPT Software',
    industry: currentStudent.industry || 'Lập trình máy vi tính, Xuất khẩu phần mềm & Chuyển đổi số',
    address:
      currentStudent.companyAddress ||
      'Tòa nhà F-Town 3, Đường D2, Khu Công nghệ cao, P. Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh',
    representative: currentStudent.representative || 'Phạm Minh Tuấn',
    taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
    isPartner: true,
    suggestedPosition:
      currentStudent.position || 'Thực tập sinh Phát triển Phần mềm (React / Node.js / Cloud)',
  });

  const [internPosition, setInternPosition] = useState<string>(taxInfo.suggestedPosition);
  const [mentorContact, setMentorContact] = useState<string>(
    currentStudent.mentor || 'Anh Nguyễn Minh Tuấn - Tech Lead (0903123456)'
  );
  const [isConfirmedByStudent, setIsConfirmedByStudent] = useState<boolean>(true);
  const [supportOption, setSupportOption] = useState<'self' | 'faculty'>(
    currentStudent.supportOption || (currentStudent.status === 'Cần Khoa hỗ trợ' ? 'faculty' : 'self')
  );
  const [preferredField, setPreferredField] = useState<string>(
    currentStudent.preferredField || 'Phát triển phần mềm (Web Full-Stack / Mobile)'
  );

  useEffect(() => {
    setSelectedCourses(
      currentStudent.courses?.length ? currentStudent.courses : ['Kiến tập công nghiệp', 'Tập sự nghề nghiệp']
    );
    setHasCompany(currentStudent.status === 'Có doanh nghiệp');
    if (currentStudent.taxCode) setMstInput(currentStudent.taxCode);
  }, [currentStudent.mssv]);

  const toggleCourse = (courseName: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseName) ? prev.filter((c) => c !== courseName) : [...prev, courseName]
    );
  };

  const handleLookupMst = async (codeToLookup?: string) => {
    const targetMst = (codeToLookup ?? mstInput).trim();
    if (!targetMst) return;
    setMstInput(targetMst);
    setLoadingMst(true);
    try {
      const res = await apiClient.lookupCompanyByMst(targetMst);
      if (res.success && res.data) {
        setTaxInfo(res.data);
        setInternPosition(res.data.suggestedPosition);
        setIsConfirmedByStudent(false); // Yêu cầu sinh viên đọc lại và tích xác nhận
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setLoadingMst(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourses.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 môn học (hoặc cả 2 môn nếu thực tập cùng công ty)!');
      return;
    }

    const res = await apiClient.submitInternshipDeclaration({
      mssv: currentStudent.mssv,
      selectedCourses,
      hasCompany,
      taxCode: taxInfo.taxCode,
      companyName: taxInfo.companyName,
      companyAddress: taxInfo.address,
      industry: taxInfo.industry,
      representative: taxInfo.representative,
      internPosition,
      mentorContact,
      isConfirmedByStudent,
      supportOption,
      preferredField,
    });

    if (res.success && res.updatedStudent) {
      onDeclarationSuccess(res.updatedStudent, res.message);
    } else if (res.error) {
      alert(res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      {/* Banner thông tin sinh viên đang thao tác */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-blue-200 font-medium">Hồ sơ Sinh viên đang khai báo:</div>
          <div className="text-base font-bold">
            {currentStudent.name} ({currentStudent.mssv}) — Lớp {currentStudent.class}
          </div>
          <div className="text-xs text-blue-100">{currentStudent.major}</div>
        </div>
        <div className="text-right text-xs">
          <span className="px-2.5 py-1 rounded-full bg-white/20 font-bold">
            Trạng thái hiện tại: {currentStudent.status}
          </span>
        </div>
      </div>

      {/* Bước 1: Chọn 1 môn hoặc 2 môn cùng lúc */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-slate-900">
            1. Chọn môn học đăng ký thực tập (Có thể chọn 1 môn hoặc cả 2 môn cùng lúc)
          </h3>
          <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
            Đang chọn {selectedCourses.length} môn
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['Kiến tập công nghiệp', 'Tập sự nghề nghiệp', 'Dự án Công nghệ thông tin 1'].map((course) => {
            const checked = selectedCourses.includes(course);
            return (
              <label
                key={course}
                className={`p-3.5 rounded-xl border-2 flex items-start space-x-3 cursor-pointer transition-all ${
                  checked ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCourse(course)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{course}</div>
                  <div className="text-[11px] text-slate-500">
                    {course === 'Kiến tập công nghiệp'
                      ? 'Mã MH: 504074 · 2 tín chỉ'
                      : course === 'Tập sự nghề nghiệp'
                        ? 'Mã MH: 502090 / 503090 · 3 tín chỉ'
                        : 'Mã MH: 504078 · 3 tín chỉ'}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Bước 2: Chuyển đổi trạng thái Đã có DN vs Chưa có DN */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-base font-bold text-slate-900 mb-3">2. Tình trạng nơi thực tập hiện tại</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setHasCompany(true)}
            className={`p-3.5 rounded-xl border-2 text-xs font-bold flex items-center justify-between transition-all ${
              hasCompany
                ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>✓ Đã Có Doanh Nghiệp Tiếp Nhận (Tra cứu MST)</span>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              Tự động điền từ MST
            </span>
          </button>

          <button
            type="button"
            onClick={() => setHasCompany(false)}
            className={`p-3.5 rounded-xl border-2 text-xs font-bold flex items-center justify-between transition-all ${
              !hasCompany
                ? 'border-amber-500 bg-amber-50 text-amber-950'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>⏳ Chưa Có Doanh Nghiệp (2 lựa chọn hỗ trợ)</span>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              Tự tìm / Nhờ Khoa hỗ trợ
            </span>
          </button>
        </div>
      </div>

      {/* Bước 3A: Đã có DN -> Tra cứu MST & Bảng đối soát chỉnh sửa được */}
      {hasCompany ? (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Nhập Mã Số Thuế (MST) Doanh Nghiệp — Hệ thống tự động thu thập thông tin pháp lý qua API xinvoice
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mstInput}
                onChange={(e) => setMstInput(e.target.value)}
                placeholder="VD: 0303882213 (FPT), 0100109106 (Viettel), 0312345678 (VNG)..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => handleLookupMst()}
                disabled={loadingMst}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
              >
                {loadingMst ? 'Đang tra cứu API...' : 'Thu thập thông tin MST'}
              </button>
            </div>
            <div className="text-[11px] text-slate-600 flex flex-wrap gap-2 pt-1">
              <span>Tra cứu nhanh MST đối tác:</span>
              {[
                { code: '0303882213', label: 'FPT Software' },
                { code: '0100109106', label: 'Viettel' },
                { code: '0312345678', label: 'VNG Corp' },
                { code: '0309876543', label: 'KMS Tech' },
                { code: '0101243150', label: 'MISA JSC' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleLookupMst(item.code)}
                  className="text-blue-700 underline font-semibold hover:text-blue-900"
                >
                  {item.code} ({item.label})
                </button>
              ))}
            </div>
          </div>

          {/* Bảng thông tin thu thập cho sinh viên đọc, chỉnh sửa nếu cần và xác nhận */}
          <div className="bg-emerald-50/40 border-2 border-emerald-500 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Bảng Đối Soát Thông Tin Pháp Lý Thu Thập Từ Mã Số Thuế ({taxInfo.taxCode})
              </h4>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                ✓ {taxInfo.taxStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-600 font-semibold block mb-1">
                  Tên pháp lý doanh nghiệp (Sinh viên kiểm tra / chỉnh sửa nếu cần):
                </label>
                <input
                  type="text"
                  value={taxInfo.companyName}
                  onChange={(e) => setTaxInfo({ ...taxInfo, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-600 font-semibold block mb-1">
                  Địa chỉ trụ sở / Chi nhánh thực tập:
                </label>
                <input
                  type="text"
                  value={taxInfo.address}
                  onChange={(e) => setTaxInfo({ ...taxInfo, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Lĩnh vực hoạt động:</label>
                <input
                  type="text"
                  value={taxInfo.industry}
                  onChange={(e) => setTaxInfo({ ...taxInfo, industry: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Người đại diện pháp luật:</label>
                <input
                  type="text"
                  value={taxInfo.representative}
                  onChange={(e) => setTaxInfo({ ...taxInfo, representative: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Vị trí chuyên môn thực tập:</label>
                <input
                  type="text"
                  value={internPosition}
                  onChange={(e) => setInternPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">
                  Người hướng dẫn (Mentor) tại Doanh nghiệp:
                </label>
                <input
                  type="text"
                  value={mentorContact}
                  onChange={(e) => setMentorContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
            </div>

            <label className="flex items-center space-x-2 pt-2 cursor-pointer text-xs font-semibold text-emerald-950">
              <input
                type="checkbox"
                checked={isConfirmedByStudent}
                onChange={(e) => setIsConfirmedByStudent(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>
                Tôi đã đọc kỹ, kiểm tra thông tin doanh nghiệp thu thập từ MST nêu trên là hoàn toàn chính xác.
              </span>
            </label>
          </div>
        </div>
      ) : (
        /* Bước 3B: Chưa có doanh nghiệp -> Cho sinh viên 2 Option (Tự tìm hoặc Cần Khoa hỗ trợ) */
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-5 space-y-4 text-xs">
            <div className="font-bold text-amber-950 text-sm">
              Lựa chọn phương án khi chưa có doanh nghiệp tiếp nhận (Khi có công ty bạn có thể bật lại trạng thái Đã có DN bất cứ lúc nào):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-start space-x-3 ${
                  supportOption === 'self'
                    ? 'border-blue-600 bg-white shadow-xs'
                    : 'border-slate-200 bg-white/60'
                }`}
              >
                <input
                  type="radio"
                  name="supportOption"
                  checked={supportOption === 'self'}
                  onChange={() => setSupportOption('self')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="font-bold text-slate-900">Option 1: Em đang chủ động tự tìm kiếm</div>
                  <div className="text-slate-600 mt-0.5">
                    Đang nộp CV và chờ lịch phỏng vấn tại các doanh nghiệp. Sẽ cập nhật MST ngay khi có kết quả.
                  </div>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-start space-x-3 ${
                  supportOption === 'faculty'
                    ? 'border-amber-600 bg-white shadow-xs'
                    : 'border-slate-200 bg-white/60'
                }`}
              >
                <input
                  type="radio"
                  name="supportOption"
                  checked={supportOption === 'faculty'}
                  onChange={() => setSupportOption('faculty')}
                  className="mt-0.5 text-amber-600"
                />
                <div>
                  <div className="font-bold text-amber-950">Option 2: Em cần Khoa CNTT hỗ trợ điều phối</div>
                  <div className="text-slate-600 mt-0.5">
                    Nhờ Bộ môn & Giảng viên phụ trách giới thiệu về các doanh nghiệp đối tác thân hữu của TDTU.
                  </div>
                </div>
              </label>
            </div>

            {supportOption === 'faculty' && (
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Định hướng chuyên môn mong muốn Khoa giới thiệu:
                </label>
                <select
                  value={preferredField}
                  onChange={(e) => setPreferredField(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option>Phát triển phần mềm (Web Full-Stack / Mobile)</option>
                  <option>Trí tuệ nhân tạo (AI, Machine Learning & Data)</option>
                  <option>An toàn thông tin & Mạng máy tính (SOC / Pentest)</option>
                  <option>Cloud, DevOps & Quản trị hệ thống</option>
                  <option>Kiểm thử phần mềm (Automation QA / QC) & BA</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
        >
          {hasCompany
            ? 'Xác Nhận Thông Tin MST Chính Xác & Nộp Lại Hồ Sơ'
            : 'Cập Nhật Trạng Thái Thực Tập Lên Dashboard'}
        </button>
      </div>
    </form>
  );
};
