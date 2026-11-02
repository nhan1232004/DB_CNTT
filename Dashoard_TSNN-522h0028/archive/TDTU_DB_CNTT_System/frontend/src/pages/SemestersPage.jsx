// SemestersPage.jsx - Quản lý Học kỳ & Hạn chót Học vụ Component
// Chức năng 9 theo Ma trận Phân quyền Nguyên tố (Thầy Phúc: 2310, Giảng viên: 22, SV ngoài kỳ: 22, SV trong kỳ: 1)

const SemestersPage = ({ currentUser, onNavigateTab }) => {
  const roleKey = window.PrimeRbac?.getUserRoleKey?.(currentUser) || 'thay_phuc';
  const mask = window.PrimeRbac?.getFeatureMask?.(currentUser, 'semesters') || 2310;

  const canRead = window.PrimeRbac?.hasPrimePermission(mask, 2);
  const canCreate = window.PrimeRbac?.hasPrimePermission(mask, 3);
  const canUpdate = window.PrimeRbac?.hasPrimePermission(mask, 5);
  const canDelete = window.PrimeRbac?.hasPrimePermission(mask, 7);
  const canScopeAll = window.PrimeRbac?.hasPrimePermission(mask, 11);

  // Danh sách các học kỳ trong hệ thống
  const [semestersList, setSemestersList] = React.useState(() => {
    try {
      const saved = localStorage.getItem('tdtu_semesters_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'hk1_2026_2027',
        name: 'Học kỳ 1 / 2026–2027',
        academicYear: '2026–2027',
        isActive: true,
        declarationDeadline: '2026-09-30',
        certDeadline: '2026-10-15',
        reviewDeadline: '2026-10-20',
        reportDeadline: '2027-01-05',
        regulationNote: 'Sinh viên hoàn thành khai báo doanh nghiệp trước 23:59 ngày 30/09/2026 để Khoa kịp thời thẩm định.',
        totalStudents: 91,
        enrolledCourses: ['Kiến tập công nghiệp (KTCN)', 'Tập sự nghề nghiệp (TSNN)']
      },
      {
        id: 'hk2_2025_2026',
        name: 'Học kỳ 2 / 2025–2026',
        academicYear: '2025–2026',
        isActive: false,
        declarationDeadline: '2026-02-28',
        certDeadline: '2026-03-15',
        reviewDeadline: '2026-03-25',
        reportDeadline: '2026-06-10',
        regulationNote: 'Đợt thực tập học kỳ hè và học kỳ 2 dành cho sinh viên hoàn thành chứng chỉ tiếng Anh.',
        totalStudents: 145,
        enrolledCourses: ['Tập sự nghề nghiệp (TSNN)']
      },
      {
        id: 'hk1_2025_2026',
        name: 'Học kỳ 1 / 2025–2026',
        academicYear: '2025–2026',
        isActive: false,
        declarationDeadline: '2025-09-30',
        certDeadline: '2025-10-15',
        reviewDeadline: '2025-10-20',
        reportDeadline: '2026-01-05',
        regulationNote: 'Đã hoàn tất báo cáo và nghiệm thu điểm học phần.',
        totalStudents: 128,
        enrolledCourses: ['Kiến tập công nghiệp (KTCN)', 'Tập sự nghề nghiệp (TSNN)']
      }
    ];
  });

  const [editingSemester, setEditingSemester] = React.useState(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState(null);

  // Form tạo mới học kỳ
  const [newSemesterName, setNewSemesterName] = React.useState('');
  const [newAcademicYear, setNewAcademicYear] = React.useState('2026–2027');
  const [newDeclarationDeadline, setNewDeclarationDeadline] = React.useState('2026-11-30');
  const [newCertDeadline, setNewCertDeadline] = React.useState('2026-12-15');
  const [newReviewDeadline, setNewReviewDeadline] = React.useState('2026-12-25');
  const [newReportDeadline, setNewReportDeadline] = React.useState('2027-02-10');
  const [newRegulationNote, setNewRegulationNote] = React.useState('');

  const saveSemesters = (list) => {
    setSemestersList(list);
    try {
      localStorage.setItem('tdtu_semesters_list', JSON.stringify(list));
    } catch {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Kích hoạt học kỳ hiện tại
  const handleActivate = (id) => {
    if (!canUpdate) return;
    const updated = semestersList.map(s => ({
      ...s,
      isActive: s.id === id
    }));
    saveSemesters(updated);
    showToast(`✓ Đã kích hoạt học kỳ chính thức thành công!`);
  };

  // Xóa học kỳ
  const handleDelete = (id) => {
    if (!canDelete) {
      alert('Bạn không có quyền xóa học kỳ (Yêu cầu quyền Delete 7)');
      return;
    }
    if (semestersList.find(s => s.id === id)?.isActive) {
      alert('Không thể xóa học kỳ đang hoạt động chính thức!');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa học kỳ này?')) return;
    const updated = semestersList.filter(s => s.id !== id);
    saveSemesters(updated);
    showToast('✓ Đã xóa học kỳ thành công.');
  };

  // Lưu chỉnh sửa học kỳ
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!canUpdate) return;
    const updated = semestersList.map(s => s.id === editingSemester.id ? editingSemester : s);
    saveSemesters(updated);
    // Cập nhật cả deadline hệ thống
    if (editingSemester.isActive && window.ApiClient?.saveSystemDeadlines) {
      window.ApiClient.saveSystemDeadlines(editingSemester);
    }
    setEditingSemester(null);
    showToast('✓ Đã cập nhật thông tin học kỳ và các mốc hạn chót!');
  };

  // Tạo mới học kỳ
  const handleCreateSemester = (e) => {
    e.preventDefault();
    if (!canCreate) {
      alert('Bạn không có quyền tạo mới học kỳ (Yêu cầu quyền Create 3)');
      return;
    }
    if (!newSemesterName.trim()) {
      alert('Vui lòng nhập tên học kỳ!');
      return;
    }
    const newId = 'hk_' + Date.now();
    const newSem = {
      id: newId,
      name: newSemesterName.trim(),
      academicYear: newAcademicYear,
      isActive: false,
      declarationDeadline: newDeclarationDeadline,
      certDeadline: newCertDeadline,
      reviewDeadline: newReviewDeadline,
      reportDeadline: newReportDeadline,
      regulationNote: newRegulationNote.trim() || 'Học kỳ mới được tạo trên hệ thống.',
      totalStudents: 0,
      enrolledCourses: ['Kiến tập công nghiệp (KTCN)', 'Tập sự nghề nghiệp (TSNN)']
    };
    const updated = [newSem, ...semestersList];
    saveSemesters(updated);
    setShowCreateModal(false);
    setNewSemesterName('');
    showToast(`✓ Đã tạo thành công học kỳ "${newSem.name}"!`);
  };

  if (!canRead) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 my-8">
        <div className="text-4xl mb-3">🚫</div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Không có quyền truy cập chức năng</h2>
        <p className="text-sm text-slate-500 mt-2">
          Chức năng "Quản lý học kỳ" có mã quyền 1 đối với vai trò của bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#003087] dark:text-sky-300 flex items-center justify-center text-lg font-bold">
            📅
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Quản lý Học kỳ & Hạn chót Học vụ</span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#003087] dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                Mã quyền: {mask}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thiết lập kế hoạch học vụ, điều phối các mốc thời gian thực tập và quy chế Khoa CNTT
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#003087] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>➕ Tạo Học kỳ Mới</span>
          </button>
        )}
      </div>

      {/* Semesters Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {semestersList.map(sem => {
          return (
            <div
              key={sem.id}
              className={`p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                sem.isActive
                  ? 'bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/30 dark:to-slate-800 border-blue-400 dark:border-blue-700 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Năm học {sem.academicYear}
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {sem.name}
                    </h3>
                  </div>
                  {sem.isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                      ● Đang Kích Hoạt
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500">
                      Lưu trữ
                    </span>
                  )}
                </div>

                {/* Deadlines Timeline Preview */}
                <div className="space-y-2 py-3 border-y border-slate-100 dark:border-slate-700 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">1. Hạn khai báo DN:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">{sem.declarationDeadline}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">2. Hạn nộp chứng chỉ:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">{sem.certDeadline}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">3. Hạn GV thẩm định:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">{sem.reviewDeadline}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">4. Hạn nộp Báo cáo:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">{sem.reportDeadline}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 italic line-clamp-2">
                  "{sem.regulationNote}"
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-400">
                  {sem.totalStudents} sinh viên
                </div>

                <div className="flex items-center gap-2">
                  {canUpdate && !sem.isActive && (
                    <button
                      type="button"
                      onClick={() => handleActivate(sem.id)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Kích hoạt
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => setEditingSemester({ ...sem })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Sửa
                    </button>
                  )}
                  {canDelete && !sem.isActive && (
                    <button
                      type="button"
                      onClick={() => handleDelete(sem.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg text-xs cursor-pointer"
                      title="Xóa học kỳ"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Chỉnh sửa Học kỳ */}
      {editingSemester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                Chỉnh sửa Học kỳ & Thời hạn
              </h3>
              <button
                type="button"
                onClick={() => setEditingSemester(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên học kỳ:
                </label>
                <input
                  type="text"
                  value={editingSemester.name}
                  onChange={e => setEditingSemester({ ...editingSemester, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1. Hạn khai báo DN:
                  </label>
                  <input
                    type="date"
                    value={editingSemester.declarationDeadline}
                    onChange={e => setEditingSemester({ ...editingSemester, declarationDeadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Hạn nộp chứng chỉ:
                  </label>
                  <input
                    type="date"
                    value={editingSemester.certDeadline}
                    onChange={e => setEditingSemester({ ...editingSemester, certDeadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Hạn GV thẩm định:
                  </label>
                  <input
                    type="date"
                    value={editingSemester.reviewDeadline}
                    onChange={e => setEditingSemester({ ...editingSemester, reviewDeadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4. Hạn nộp Báo cáo:
                  </label>
                  <input
                    type="date"
                    value={editingSemester.reportDeadline}
                    onChange={e => setEditingSemester({ ...editingSemester, reportDeadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú quy chế học vụ:
                </label>
                <textarea
                  value={editingSemester.regulationNote}
                  onChange={e => setEditingSemester({ ...editingSemester, regulationNote: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSemester(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003087] hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Mới Học Kỳ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                Tạo Học kỳ Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSemester} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên học kỳ * (VD: Học kỳ 2 / 2026–2027):
                </label>
                <input
                  type="text"
                  value={newSemesterName}
                  onChange={e => setNewSemesterName(e.target.value)}
                  placeholder="Học kỳ 2 / 2026–2027"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Năm học:
                </label>
                <input
                  type="text"
                  value={newAcademicYear}
                  onChange={e => setNewAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn khai báo DN:
                  </label>
                  <input
                    type="date"
                    value={newDeclarationDeadline}
                    onChange={e => setNewDeclarationDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn nộp chứng chỉ:
                  </label>
                  <input
                    type="date"
                    value={newCertDeadline}
                    onChange={e => setNewCertDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn GV thẩm định:
                  </label>
                  <input
                    type="date"
                    value={newReviewDeadline}
                    onChange={e => setNewReviewDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn nộp Báo cáo:
                  </label>
                  <input
                    type="date"
                    value={newReportDeadline}
                    onChange={e => setNewReportDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú quy chế học vụ:
                </label>
                <textarea
                  value={newRegulationNote}
                  onChange={e => setNewRegulationNote(e.target.value)}
                  rows="3"
                  placeholder="Ghi chú quy định, điều kiện hoặc lưu ý..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003087] hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Tạo Học kỳ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

window.SemestersPage = SemestersPage;
