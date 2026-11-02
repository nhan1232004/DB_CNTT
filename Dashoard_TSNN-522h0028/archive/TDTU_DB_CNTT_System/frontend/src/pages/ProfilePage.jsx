// Profile Page Component - Quản lý Hồ sơ Cá nhân Sinh viên (TDTU CNTT)
// Chuẩn hóa theo Figma Frame 03 (Student Hub):
// Chứa đầy đủ: Thông tin học vụ, Link CV Google Drive, Thông tin DN thực tập, Stepper tiến trình, Lịch sử thực tập & Tra cứu chứng chỉ.

const ProfilePage = ({ currentUser, onNavigateTab, onSemesterChange }) => {
  const studentId = currentUser?.studentId || '522H0045';
  const studentName = currentUser?.name || 'Nguyễn Minh Anh';

  // State Quản lý Hồ sơ Cá nhân
  const [cvLink, setCvLink] = React.useState('');
  const [cvSavedToast, setCvSavedToast] = React.useState(null);
  const [declaration, setDeclaration] = React.useState(null);
  const [draft, setDraft] = React.useState(null);
  const [certs, setCerts] = React.useState([]);
  const [internshipHistory, setInternshipHistory] = React.useState([]);
  const [previewCertModal, setPreviewCertModal] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const [deadlines, setDeadlines] = React.useState({
    semesterName: 'HK1 2026–2027',
    declarationDeadline: '2026-11-15',
    regulationNote: 'Mốc đếm ngược hoàn tất thủ tục hồ sơ doanh nghiệp.'
  });

  const getDaysRemaining = (deadlineStr) => {
    if (!deadlineStr) return 18;
    try {
      const target = new Date(deadlineStr).getTime();
      const now = Date.now();
      const diff = target - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch {
      return 18;
    }
  };

  const remainingDays = getDaysRemaining(deadlines.declarationDeadline);

  // Tải dữ liệu hồ sơ cá nhân
  const loadProfileData = () => {
    try {
      setLoading(true);
      if (window.ApiClient) {
        if (window.ApiClient.getSystemDeadlines) {
          setDeadlines(window.ApiClient.getSystemDeadlines());
        }
        if (window.ApiClient.getStudentCvLink) {
          setCvLink(window.ApiClient.getStudentCvLink(studentId));
        }
        if (window.ApiClient.getStudentDeclaration) {
          const local = window.ApiClient.getStudentDeclaration(studentId);
          if (local) setDeclaration(local);
        }
        if (window.ApiClient.getDeclaration) {
          window.ApiClient.getDeclaration(studentId).then(remoteDecl => {
            if (remoteDecl) {
              setDeclaration(prev => ({ ...prev, ...remoteDecl }));
            }
          }).catch(() => {});
        }
        if (window.ApiClient.getStudentCerts) {
          setCerts(window.ApiClient.getStudentCerts(studentId));
        }
        if (window.ApiClient.fetchStudentCerts) {
          window.ApiClient.fetchStudentCerts(studentId).then(fresh => {
            if (Array.isArray(fresh)) setCerts(fresh);
          }).catch(() => {});
        }
        if (window.ApiClient.getStudentInternshipHistory) {
          setInternshipHistory(window.ApiClient.getStudentInternshipHistory(studentId));
        }
      }
    } catch (err) {
      console.warn('Lỗi tải hồ sơ cá nhân:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadProfileData();

    const handleUpdate = () => {
      loadProfileData();
    };

    window.addEventListener('tdtu_certs_updated', handleUpdate);
    window.addEventListener('tdtu_decl_updated', handleUpdate);
    window.addEventListener('tdtu_declaration_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    let bc = null;
    try {
      bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.onmessage = () => {
        loadProfileData();
      };
    } catch {}

    return () => {
      window.removeEventListener('tdtu_certs_updated', handleUpdate);
      window.removeEventListener('tdtu_decl_updated', handleUpdate);
      window.removeEventListener('tdtu_declaration_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }, [studentId]);

  // Cập nhật link CV Google Drive
  const handleSaveCv = (e) => {
    if (e) e.preventDefault();
    if (!cvLink || !cvLink.trim()) {
      alert('Vui lòng nhập đường liên kết Google Drive của CV.');
      return;
    }
    const clean = cvLink.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      alert('Đường dẫn không hợp lệ. Vui lòng nhập link Google Drive bắt đầu bằng https://');
      return;
    }
    if (window.ApiClient?.saveStudentCvLink) {
      window.ApiClient.saveStudentCvLink(studentId, clean);
      setCvSavedToast('✓ Đã cập nhật link Google Drive CV thành công! Doanh nghiệp đối tác và Khoa có thể xem CV này khi bạn ứng tuyển.');
      setTimeout(() => setCvSavedToast(null), 4000);
    }
  };

  // Xem Dashboard học kỳ lịch sử
  const handleSelectHistorySemester = (semId, semName) => {
    if (onSemesterChange) {
      onSemesterChange(semId);
    }
    if (onNavigateTab) {
      onNavigateTab('dashboard');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Breadcrumb & Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#003087]/10 text-[#003087] dark:bg-sky-950/80 dark:text-sky-300 border border-blue-200 dark:border-blue-900 inline-flex items-center gap-1">
              <span>👤</span>
              <span>Không gian Sinh viên</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              MSSV: {studentId}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Hồ sơ cá nhân: {studentName}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý thông tin học vụ cá nhân, liên kết CV ứng tuyển doanh nghiệp, hồ sơ thực tập và lịch sử đào tạo TDTU
          </p>
        </div>
      </div>

      {/* Status Alert Banner matching Figma Frame 03 - Chỉ hiện khi ĐÃ CÓ NƠI THỰC TẬP */}
      {currentUser?.isEnrolledThisSemester !== false && declaration?.internshipStatus === 'has_company' && declaration?.companyName && (
        <div className="border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#ECFDF5] dark:bg-emerald-950/30 border-[#A7F3D0] dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Đã có nơi thực tập: {declaration.companyName}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {declaration.position || 'Thực tập sinh'}{declaration.department ? (' · ' + declaration.department) : ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { if (onNavigateTab) onNavigateTab('declaration'); }}
            className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-xs transition shrink-0 cursor-pointer"
          >
            Cập nhật trạng thái
          </button>
        </div>
      )}

      {/* 4 Summary Cards Row matching Figma Frame 03 & Student Academic Profile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Học kỳ hiện tại */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Học kỳ hiện tại</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{deadlines.semesterName}</div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Hạn nộp: {new Date(deadlines.declarationDeadline).toLocaleDateString('vi-VN')}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800">
              Còn {remainingDays} ngày
            </span>
          </div>
        </div>

        {/* Card 2: Môn học đăng ký */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Môn học đăng ký</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs">
              {currentUser?.courseCode || 'KTCN'}
            </span>
            <span className="text-xs text-slate-400">Mã môn: {currentUser?.subjectCode || '504074'}</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-2">
            {currentUser?.courseName || 'Kiến tập Công nghiệp'}
          </div>
        </div>

        {/* Card 3: Tình trạng hồ sơ */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tình trạng hồ sơ</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200">
              Đã tiếp nhận
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Khoa đã xác nhận và đồng bộ hồ sơ
          </div>
          <button
            type="button"
            onClick={() => { if (onNavigateTab) onNavigateTab('declaration'); }}
            className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline mt-3 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Xem hồ sơ</span>
            <span>→</span>
          </button>
        </div>

        {/* Card 4: Hồ sơ học tập & Điểm tích lũy (GPA) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hồ sơ học tập (GPA)</span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {currentUser?.academicRank || 'Đang cập nhật'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {currentUser?.gpa4 || currentUser?.gpa || '—'}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 4.0</span>
            <span className="text-xs text-slate-500 ml-1">(Hệ 10: {currentUser?.gpa10 || '—'})</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Lớp: <strong className="text-slate-700 dark:text-slate-300">{currentUser?.class || currentUser?.className || "—"}</strong> · {currentUser?.major || 'Kỹ thuật phần mềm'}
          </div>
        </div>

      </div>

      {/* Stepper Card: Tiến trình hồ sơ matching Figma Frame 03 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Tiến trình hồ sơ</h3>
          <span className="text-xs font-semibold text-blue-600 dark:text-sky-400">Hoàn thành 4/4 bước</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Hồ sơ của bạn đã hoàn tất xác nhận nơi thực tập và minh chứng ngoại ngữ.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Xác thực Email</div>
              <div className="text-[10px] text-slate-400">Google SSO TDTU</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Khai báo Nơi TT</div>
              <div className="text-[10px] text-slate-400">Tra cứu MST tự động</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Cập nhật Trạng thái</div>
              <div className="text-[10px] text-slate-400">Có doanh nghiệp</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Chứng chỉ ngoại ngữ</div>
              <div className="text-[10px] text-slate-400">Đã cập nhật</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PHẦN 1: CẬP NHẬT LINK CV (GOOGLE DRIVE) & THÔNG TIN DOANH NGHIỆP */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: Cập nhật Link Drive CV */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center font-bold text-lg">
                  📁
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Hồ sơ CV Ứng tuyển (Google Drive Link)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Link CV dùng để nộp trực tuyến cho Doanh nghiệp khi chọn JD từ Bảng tin
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#003087] dark:bg-blue-950/80 dark:text-sky-300">
                CV Trực Tuyến
              </span>
            </div>

            {/* Form Input */}
            <form onSubmit={handleSaveCv} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Đường dẫn Google Drive chia sẻ CV của bạn:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={cvLink}
                    onChange={(e) => setCvLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none transition"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔗</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💾</span>
                  <span>Lưu link CV</span>
                </button>

                {cvLink && (
                  <a
                    href={cvLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Mở xem CV trên Drive</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
            </form>

            {/* Toast thông báo */}
            {cvSavedToast && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <span>✓</span>
                <span>{cvSavedToast}</span>
              </div>
            )}
          </div>

          {/* Note hướng dẫn quyền chia sẻ Google Drive */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-[#003087] dark:text-sky-300 flex items-center gap-1">
              <span>💡</span>
              <span>Hướng dẫn thiết lập quyền chia sẻ:</span>
            </div>
            <p>
              Mở tệp CV trên Google Drive &rarr; chọn <strong>Chia sẻ (Share)</strong> &rarr; chuyển quyền truy cập chung thành <strong>“Bất kỳ ai có đường liên kết” (Anyone with the link)</strong> với vai trò <strong>“Người xem” (Viewer)</strong> để Doanh nghiệp không bị chặn quyền.
            </p>
          </div>
        </div>

        {/* Box 2: Thông tin Doanh nghiệp Thực tập & Tình trạng Khai báo */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                  declaration?.companyName 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                    : (declaration?.internshipStatus === 'interviewing' || declaration?.internshipStatus === 'need_support' || draft)
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}>
                  🏢
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Thông tin Doanh nghiệp Tiếp nhận
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Đơn vị doanh nghiệp tiếp nhận thực tập của học kỳ hiện tại
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                declaration?.companyName
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
              }`}>
                {declaration?.companyName ? 'Đã có nơi TT' : 'Đang xử lý'}
              </span>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-slate-500">Đơn vị tiếp nhận:</span>
                <strong className="text-slate-900 dark:text-white text-right font-bold">
                  {declaration?.companyName || 'Công ty TNHH An Việt Digital'}
                </strong>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500">Mã số thuế (MST):</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {declaration?.taxCode || '0314567890'}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500">Vị trí thực tập:</span>
                <span className="font-semibold text-blue-600 dark:text-sky-400">
                  {declaration?.position || 'Frontend Web Developer (ReactJS)'}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500">Cán bộ hướng dẫn (Mentor):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {declaration?.contactPerson || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500">Số điện thoại CBHD:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {declaration?.contactPhone || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Có thay đổi nơi thực tập?
            </span>
            <button
              type="button"
              onClick={() => { if (onNavigateTab) onNavigateTab('declaration'); }}
              className="text-xs font-bold text-[#003087] dark:text-sky-400 hover:underline cursor-pointer"
            >
              Cập nhật phiếu khai báo &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* ================================================================= */}
      {/* PHẦN 2: CHỨNG CHỈ CỦA MÌNH (NGOẠI NGỮ & TIN HỌC)                 */}
      {/* ================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chứng chỉ Ngoại ngữ của bạn
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                {certs.length} chứng chỉ đã ghi nhận
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Các chứng chỉ tiếng Anh (TOEIC, IELTS, TOEFL iBT, Aptis ESOL, Cambridge) được Khoa CNTT công nhận để xét chuẩn đầu ra.
            </p>
          </div>

          <button
            type="button"
            onClick={() => { if (onNavigateTab) onNavigateTab('certs'); }}
            className="px-3.5 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>+ Quản lý & Nộp chứng chỉ mới</span>
            <span>→</span>
          </button>
        </div>

        {certs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-xs">Bạn chưa nộp chứng chỉ ngoại ngữ nào.</p>
            <button
              type="button"
              onClick={() => { if (onNavigateTab) onNavigateTab('certs'); }}
              className="mt-2 text-xs text-[#003087] dark:text-sky-400 font-bold hover:underline"
            >
              + Khai báo chứng chỉ ngay &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certs.map(cert => (
              <div
                key={cert.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-3 hover:border-blue-400 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 rounded text-[10px] font-bold">
                      {cert.type || 'Ngoại ngữ'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Thi: {cert.examDate || '—'} · Cấp: {cert.issueDate || cert.examDate || '—'}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {cert.name}
                  </div>

                  <div className="flex items-baseline gap-2 text-xs">
                    <span className="font-black text-lg text-[#003087] dark:text-sky-400">
                      {cert.score}
                    </span>
                    {cert.level && (
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-[#003087] dark:text-sky-300 rounded text-[11px] font-bold">
                        {cert.level}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span>✓</span>
                    <span>{cert.status || 'Đạt chuẩn tốt nghiệp TDTU'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={cert.driveLink || cert.fileName}>
                    {cert.driveLink ? '🔗 Google Drive' : `📎 ${cert.fileName || 'Minh chứng'}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const link = cert.driveLink || (cert.proofData && String(cert.proofData).startsWith('http') ? cert.proofData : null);
                      if (link) {
                        window.open(link, '_blank');
                      } else {
                        setPreviewCertModal(cert);
                      }
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Xem minh chứng</span>
                    <span>↗</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Preview Minh Chứng Chứng Chỉ */}
      {previewCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Minh chứng: {previewCertModal.name}
                  </h3>
                  <p className="text-xs text-slate-500">Mã sinh viên: {studentId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCertModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Loại chứng chỉ:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{previewCertModal.type || 'Ngoại ngữ'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Điểm số đạt được:</span>
                  <span className="font-black text-blue-700 dark:text-sky-400">
                    {previewCertModal.score} {previewCertModal.level ? `(${previewCertModal.level})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày thi:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{previewCertModal.examDate || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày cấp:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{previewCertModal.issueDate || previewCertModal.examDate || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewCertModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-4">
        © Khoa Công nghệ Thông tin · Trường Đại học Tôn Đức Thắng
      </div>

    </div>
  );
};

window.ProfilePage = ProfilePage;
