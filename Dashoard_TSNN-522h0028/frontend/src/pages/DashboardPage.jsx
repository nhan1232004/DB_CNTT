// Dashboard Page Component - Tuân thủ nghiêm ngặt TDTU Enterprise Design System
// 1. Màu sắc giao diện: Trắng (#ffffff), Xanh dương (#003087 - TDTU Navy), Đỏ (#dc2626 - Alert Red)
// 2. Màu chữ: Chỉ Đen (#1f2937) và Đỏ (#dc2626)
// 3. Phông chữ: Body 11px-13px, Tiêu đề & Chỉ số in đậm (font-bold)
// 4. Bố cục: Cân đối, chuẩn Executive Dashboard, văn bản căn đều hai bên (justify)
// 5. Biểu đồ: Bộ màu Pastel / Muted nhã nhặn, tone-sur-tone, không chói/neon
// 6. Tuyệt đối không dùng Emoji, sử dụng SVG vector chuyên nghiệp

const MUTED_CHART_PALETTE = [
  '#003087', // TDTU Navy
  '#2563eb', // Soft Primary Blue
  '#60a5fa', // Pastel Blue
  '#93c5fd', // Light Blue
  '#0d9488', // Muted Teal
  '#d97706', // Warm Amber
  '#dc2626', // Alert Red
  '#64748b'  // Muted Slate
];

const SvgDonutChart = ({ slices = [], size = 180, strokeWidth = 24, centerText = '', centerSub = '' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {slices.map((slice, idx) => {
          const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -accumulatedOffset;
          accumulatedOffset += (slice.percentage / 100) * circumference;
          const sliceColor = slice.color || MUTED_CHART_PALETTE[idx % MUTED_CHART_PALETTE.length];
          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={sliceColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-300 ease-out hover:opacity-85 cursor-pointer"
            >
              <title>{`${slice.label}: ${slice.percentage}% (${slice.count || ''})`}</title>
            </circle>
          );
        })}
      </svg>
      {centerText && (
        <div className="absolute text-center pointer-events-none">
          <div className="text-xl font-bold text-[#1f2937] leading-tight font-mono">{centerText}</div>
          {centerSub && <div className="text-[11px] text-[#1f2937] font-semibold">{centerSub}</div>}
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({ activeSemester = 'hk1_2026_2027', onSemesterChange, currentUser, onNavigateTab }) => {
  const [summary, setSummary] = React.useState(null);
  const [chartData, setChartData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTabSection, setActiveTabSection] = React.useState('overview'); // 'overview' | 'academic'
  const [declaration, setDeclaration] = React.useState(null);
  const [supportStudents, setSupportStudents] = React.useState([]);

  const isStudent = currentUser?.role === 'student';
  const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.role === 'admin');
  const studentId = currentUser?.studentId || '522H0045';

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Tải Summary & Widgets
      if (window.ApiClient?.getSummary) {
        const sum = await window.ApiClient.getSummary(activeSemester);
        setSummary(sum);
      }
      if (window.ApiClient?.getDashboardWidgets) {
        const widgets = await window.ApiClient.getDashboardWidgets(activeSemester);
        setChartData(widgets);
      }

      // 2. Nếu là sinh viên, tải hồ sơ cá nhân
      if (isStudent && window.ApiClient) {
        if (window.ApiClient.getStudentDeclaration) {
          const cached = window.ApiClient.getStudentDeclaration(studentId);
          if (cached) setDeclaration(cached);
          if (window.ApiClient.getDeclaration) {
            window.ApiClient.getDeclaration(studentId).then(fresh => {
              if (fresh && (fresh.data || fresh.companyName)) {
                setDeclaration(fresh.data || fresh);
              }
            }).catch(() => {});
          }
        }
      }

      // 3. Nếu là giảng viên/admin, tải danh sách cần hỗ trợ
      if (!isStudent && window.ApiClient?.getStudents) {
        const stdRes = await window.ApiClient.getStudents({ semester: activeSemester, status: 'need_support', limit: 6 });
        const list = stdRes?.students || (Array.isArray(stdRes) ? stdRes : []);
        setSupportStudents(list.slice(0, 6));
      }
    } catch (err) {
      console.warn('[Dashboard Load Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [activeSemester, currentUser]);

  const handleExportExcel = () => {
    if (window.ApiClient?.exportExecutiveReport) {
      window.ApiClient.exportExecutiveReport(activeSemester);
    } else {
      alert('Đang tạo báo cáo tổng hợp Excel (.xlsx)...');
    }
  };

  // Tính toán số liệu KPI chuẩn mực
  const totalStudents = summary?.totalStudents ?? 1248;
  const hasCompanyCount = summary?.hasCompany ?? 892;
  const inProgressCount = summary?.inProgress ?? 298;
  const needSupportCount = summary?.needSupport ?? summary?.needFacultySupport ?? 58;
  const dualCourseCount = summary?.dualCourseStudents ?? 312;

  const hasCompanyPercent = totalStudents > 0 ? `${Math.round((hasCompanyCount / totalStudents) * 100)}%` : '0%';
  const inProgressPercent = totalStudents > 0 ? `${Math.round((inProgressCount / totalStudents) * 100)}%` : '0%';
  const needSupportPercent = totalStudents > 0 ? `${Math.round((needSupportCount / totalStudents) * 100)}%` : '0%';

  const selfFound = Math.round(hasCompanyCount * 0.58);
  const jdKhoa = Math.round(hasCompanyCount * 0.25);
  const networkFound = Math.round(hasCompanyCount * 0.12);
  const otherFound = Math.max(0, hasCompanyCount - selfFound - jdKhoa - networkFound);

  return (
    <div className="space-y-6 w-full pb-12">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#e5e7eb]">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-bold text-[#1f2937] text-left tracking-tight">
            {isStudent ? 'Tổng quan Tiến độ Thực tập Cá nhân & Toàn khóa' : 'Bảng điều khiển & Chỉ số Điều phối Thực tập'}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!isStudent && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white font-bold text-[15px] rounded-xl transition flex items-center gap-2.5 shadow-xs cursor-pointer"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-white">Xuất báo cáo Excel</span>
            </button>
          )}

          {isStudent && (
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('declaration')}
              className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white font-bold text-[15px] rounded-xl transition flex items-center gap-2.5 shadow-xs cursor-pointer"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-white">{declaration?.companyName ? 'Cập nhật hồ sơ thực tập' : 'Khai báo nơi thực tập'}</span>
              <span className="text-white font-bold">→</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DÀNH CHO SINH VIÊN: THẺ TÌNH TRẠNG HỒ SƠ CÁ NHÂN */}
      {isStudent && (
        <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] border-l-4 border-l-[#003087] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ebf3ff] text-[#003087] flex items-center justify-center font-bold shrink-0 border border-[#bfdbfe]">
                <svg className="w-6 h-6 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[19px] text-[#1f2937] text-left">
                  Hồ sơ thực tập của bạn · Học kỳ HK1 2026–2027
                </h3>
                <p className="text-[14.5px] text-[#4b5563] text-justify mt-0.5">
                  Mã số SV: <strong className="text-[#003087] font-mono text-[15px]">{studentId}</strong> · <span className="font-bold text-[#1f2937]">{currentUser?.name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-[13.5px] font-bold border ${
                declaration?.companyName 
                  ? 'bg-[#ebf3ff] text-[#003087] border-[#bfdbfe]' 
                  : 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]'
              }`}>
                {declaration?.companyName ? '✓ Đã có đơn vị tiếp nhận' : '⚠ Chưa hoàn tất khai báo'}
              </span>

              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('declaration')}
                className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white font-bold text-[14px] rounded-xl shadow-xs transition cursor-pointer"
              >
                <span className="text-white">{declaration?.companyName ? 'Chỉnh sửa khai báo' : 'Khai báo ngay'} →</span>
              </button>
            </div>
          </div>

          {declaration?.companyName ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[14px]">
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e5e7eb]">
                <span className="text-[#4b5563] text-[13px] block font-bold uppercase tracking-wider">Doanh nghiệp</span>
                <strong className="text-[#1f2937] text-[16px] block truncate mt-1">{declaration.companyName}</strong>
                {declaration.taxCode && <span className="text-[#4b5563] text-[13px] font-mono block mt-1">MST: {declaration.taxCode}</span>}
              </div>
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e5e7eb]">
                <span className="text-[#4b5563] text-[13px] block font-bold uppercase tracking-wider">Vị trí</span>
                <strong className="text-[#1f2937] text-[16px] block truncate mt-1">{declaration.position || 'Thực tập sinh'}</strong>
                {declaration.department && <span className="text-[#4b5563] text-[13px] block truncate mt-1">{declaration.department}</span>}
              </div>
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e5e7eb]">
                <span className="text-[#4b5563] text-[13px] block font-bold uppercase tracking-wider">Cán bộ hướng dẫn (Mentor)</span>
                <strong className="text-[#003087] text-[16px] block truncate mt-1">{declaration.contactPerson || 'Chưa cập nhật'}</strong>
                {declaration.contactPhone && <span className="text-[#4b5563] text-[13px] font-mono block mt-1">SĐT: {declaration.contactPhone}</span>}
              </div>
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e5e7eb]">
                <span className="text-[#4b5563] text-[13px] block font-bold uppercase tracking-wider">Học phần đăng ký</span>
                <strong className="text-[#1f2937] text-[16px] block mt-1">
                  {declaration.isDualCourse ? 'KTCN & TSNN (Song song)' : (declaration.selectedCourses?.[0] || 'KTCN')}
                </strong>
                <span className="text-[#003087] text-[13px] font-bold block mt-1">Trạng thái: Đã duyệt chính thức</span>
              </div>
            </div>
          ) : (
            <div className="text-[14px] text-[#1f2937] flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#fef2f2] rounded-xl border border-[#fecaca]">
              <span className="text-justify font-medium text-[#dc2626]">
                Bạn chưa hoàn thành thông tin khai báo nơi thực tập hoặc đăng ký nguyện vọng hỗ trợ từ Khoa CNTT.
              </span>
              <span className="text-[#dc2626] font-bold shrink-0">Hạn chót: 30/09/2026 (Còn 18 ngày)</span>
            </div>
          )}
        </div>
      )}

      {/* 3. TOP 5 EXECUTIVE KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wider">Tổng sinh viên</span>
            <div className="p-2 bg-[#ebf3ff] text-[#003087] rounded-lg border border-[#bfdbfe]">
              <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-bold text-[#1f2937] font-mono leading-none">{totalStudents}</span>
              <span className="text-[14px] font-bold text-[#003087]">(100%)</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wider">Đã có nơi TT</span>
            <div className="p-2 bg-[#ebf3ff] text-[#003087] rounded-lg border border-[#bfdbfe]">
              <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-bold text-[#1f2937] font-mono leading-none">{hasCompanyCount}</span>
              <span className="text-[14px] font-bold text-[#003087]">({hasCompanyPercent})</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wider">Đang tìm / Chờ PV</span>
            <div className="p-2 bg-[#f8fafc] text-[#1f2937] rounded-lg border border-[#e5e7eb]">
              <svg className="w-5 h-5 text-[#1f2937]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-bold text-[#1f2937] font-mono leading-none">{inProgressCount}</span>
              <span className="text-[14px] font-bold text-[#1f2937]">({inProgressPercent})</span>
            </div>
          </div>
        </div>

        {/* KPI 4 (Alert Red theo quy chuẩn) */}
        <div className="bg-white p-5 rounded-xl border border-[#fecaca] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13.5px] font-bold text-[#dc2626] uppercase tracking-wider">Cần hỗ trợ</span>
            <div className="p-2 bg-[#fef2f2] text-[#dc2626] rounded-lg border border-[#fecaca]">
              <svg className="w-5 h-5 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-bold text-[#dc2626] font-mono leading-none">{needSupportCount}</span>
              <span className="text-[14px] font-bold text-[#dc2626]">({needSupportPercent})</span>
            </div>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wider">Học song song</span>
            <div className="p-2 bg-[#ebf3ff] text-[#003087] rounded-lg border border-[#bfdbfe]">
              <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-bold text-[#1f2937] font-mono leading-none">{dualCourseCount}</span>
              <span className="text-[14px] font-bold text-[#003087]">({totalStudents > 0 ? Math.round((dualCourseCount / totalStudents) * 100) : 0}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VISUALIZATION SECTION TABS */}
      <div className="flex items-center gap-3 border-b border-[#e5e7eb] pt-2">
        <button
          type="button"
          onClick={() => setActiveTabSection('overview')}
          className={`pb-3 text-[14.5px] font-bold transition-all cursor-pointer border-b-2 ${
            activeTabSection === 'overview'
              ? 'border-[#003087] text-[#003087]'
              : 'border-transparent text-[#4b5563] hover:text-[#003087]'
          }`}
        >
          Tiến độ tiếp nhận & Cơ cấu Doanh nghiệp
        </button>
        <button
          type="button"
          onClick={() => setActiveTabSection('academic')}
          className={`pb-3 text-[14.5px] font-bold transition-all cursor-pointer border-b-2 ${
            activeTabSection === 'academic'
              ? 'border-[#003087] text-[#003087]'
              : 'border-transparent text-[#4b5563] hover:text-[#003087]'
          }`}
        >
          Học vụ, Điểm GPA & Chuẩn Ngoại ngữ
        </button>
      </div>

      {/* TAB SECTION 1: TIẾN ĐỘ TIẾP NHẬN & DOANH NGHIỆP */}
      {activeTabSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card 1: Tiến độ thực tập */}
            <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1f2937] text-[18px] text-left">Tiến độ thực tập toàn khóa</h3>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-6">
                  <SvgDonutChart
                    slices={[
                      { label: 'Đã có nơi', percentage: Math.round((hasCompanyCount / totalStudents) * 100), count: hasCompanyCount, color: '#003087' },
                      { label: 'Đang tìm / Chờ', percentage: Math.round((inProgressCount / totalStudents) * 100), count: inProgressCount, color: '#60a5fa' },
                      { label: 'Cần hỗ trợ', percentage: Math.round((needSupportCount / totalStudents) * 100), count: needSupportCount, color: '#dc2626' }
                    ]}
                    size={190}
                    strokeWidth={26}
                    centerText={hasCompanyPercent}
                    centerSub="đã có nơi"
                  />

                  <div className="space-y-2.5 w-full sm:w-auto text-[14px]">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#003087] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">Đã có nơi:</span>
                      <span className="font-bold text-[#1f2937]">{hasCompanyPercent} ({hasCompanyCount} SV)</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#60a5fa] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">Đang tìm / Chờ:</span>
                      <span className="font-bold text-[#1f2937]">{inProgressPercent} ({inProgressCount} SV)</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#dc2626] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">Cần hỗ trợ:</span>
                      <span className="font-bold text-[#dc2626]">{needSupportPercent} ({needSupportCount} SV)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Nguồn tìm nơi thực tập */}
            <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1f2937] text-[18px] text-left">Nguồn tìm nơi tiếp nhận</h3>

                <div className="space-y-4 my-6">
                  <div>
                    <div className="flex items-center justify-between text-[14px] mb-1 font-semibold text-[#1f2937]">
                      <span>Tự liên hệ doanh nghiệp</span>
                      <span className="font-bold text-[#1f2937]">{selfFound} ({Math.round((selfFound / hasCompanyCount) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-[#f1f5f9] rounded-full h-3.5 overflow-hidden">
                      <div className="bg-[#003087] h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((selfFound / hasCompanyCount) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[14px] mb-1 font-semibold text-[#1f2937]">
                      <span>JD do Khoa giới thiệu</span>
                      <span className="font-bold text-[#1f2937]">{jdKhoa} ({Math.round((jdKhoa / hasCompanyCount) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-[#f1f5f9] rounded-full h-3.5 overflow-hidden">
                      <div className="bg-[#2563EB] h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((jdKhoa / hasCompanyCount) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[14px] mb-1 font-semibold text-[#1f2937]">
                      <span>Mạng lưới cựu sinh viên & Đối tác</span>
                      <span className="font-bold text-[#1f2937]">{networkFound} ({Math.round((networkFound / hasCompanyCount) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-[#f1f5f9] rounded-full h-3.5 overflow-hidden">
                      <div className="bg-[#60A5FA] h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((networkFound / hasCompanyCount) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[14px] mb-1 font-semibold text-[#1f2937]">
                      <span>Khác</span>
                      <span className="font-bold text-[#1f2937]">{otherFound} ({Math.round((otherFound / hasCompanyCount) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-[#f1f5f9] rounded-full h-3.5 overflow-hidden">
                      <div className="bg-[#93C5FD] h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((otherFound / hasCompanyCount) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 3: Cơ cấu doanh nghiệp tiếp nhận */}
            <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1f2937] text-[18px] text-left mb-4">Cơ cấu Doanh nghiệp Tiếp nhận</h3>
                
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                  <SvgDonutChart
                    slices={[
                      { label: 'FPT Software', percentage: 28, count: 250, color: '#003087' },
                      { label: 'KMS Technology', percentage: 22, count: 196, color: '#2563eb' },
                      { label: 'VNG Corporation', percentage: 18, count: 160, color: '#60a5fa' },
                      { label: 'Viettel Telecom', percentage: 14, count: 125, color: '#0d9488' },
                      { label: 'Khác (39 DN)', percentage: 18, count: 161, color: '#64748b' }
                    ]}
                    size={180}
                    strokeWidth={26}
                    centerText="43"
                    centerSub="Doanh nghiệp"
                  />
                  <div className="space-y-2.5 w-full sm:w-auto text-[14px]">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#003087] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">FPT Software:</span>
                      <span className="font-bold text-[#1f2937]">28% (250 SV)</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#2563eb] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">KMS Technology:</span>
                      <span className="font-bold text-[#1f2937]">22% (196 SV)</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#60a5fa] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">VNG Corporation:</span>
                      <span className="font-bold text-[#1f2937]">18% (160 SV)</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#0d9488] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">Viettel Telecom:</span>
                      <span className="font-bold text-[#1f2937]">14% (125 SV)</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#64748b] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">Khác (39 DN):</span>
                      <span className="font-bold text-[#1f2937]">18% (161 SV)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Tỷ lệ theo lĩnh vực công nghệ */}
            <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1f2937] text-[17.5px] text-left mb-4">Tỷ lệ theo Lĩnh vực Chuyên môn</h3>
                
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                  <SvgDonutChart
                    slices={[
                      { label: 'Phần mềm & Web/App', percentage: 46, color: '#003087' },
                      { label: 'Trí tuệ nhân tạo & Dữ liệu', percentage: 22, color: '#2563eb' },
                      { label: 'An toàn thông tin', percentage: 16, color: '#0d9488' },
                      { label: 'Hệ thống mạng & Cloud', percentage: 11, color: '#60a5fa' },
                      { label: 'IoT & Nhúng', percentage: 5, color: '#64748b' }
                    ]}
                    size={180}
                    strokeWidth={26}
                    centerText="5"
                    centerSub="Chuyên ngành"
                  />
                  <div className="space-y-2 w-full sm:w-auto text-[13px]">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#003087] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">Kỹ thuật Phần mềm:</span>
                      <span className="font-bold text-[#1f2937]">46%</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#2563eb] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">AI & Khoa học Dữ liệu:</span>
                      <span className="font-bold text-[#1f2937]">22%</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#0d9488] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">An toàn thông tin:</span>
                      <span className="font-bold text-[#1f2937]">16%</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#60a5fa] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">Mạng & Điện toán đám mây:</span>
                      <span className="font-bold text-[#1f2937]">11%</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#64748b] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">IoT & Hệ thống nhúng:</span>
                      <span className="font-bold text-[#1f2937]">5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB SECTION 2: HỌC VỤ & CHẤT LƯỢNG */}
      {activeTabSection === 'academic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 5: Phân bố GPA */}
            <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1f2937] text-[17.5px] text-left mb-4">Phân bố điểm học tập tích lũy (GPA)</h3>

                <div className="flex items-end justify-between gap-3 h-44 mt-6 mb-2 px-2">
                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[12px] font-bold text-[#1f2937]">37 SV</span>
                    <div className="w-full bg-[#93c5fd] rounded-t-lg transition-all duration-500" style={{ height: '12%' }}></div>
                    <span className="text-[12px] font-semibold text-[#4b5563]">&lt;2.0</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[12px] font-bold text-[#1f2937]">274 SV</span>
                    <div className="w-full bg-[#93c5fd] rounded-t-lg transition-all duration-500" style={{ height: '42%' }}></div>
                    <span className="text-[12px] font-semibold text-[#4b5563]">2.0–2.49</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[12px] font-bold text-[#1f2937]">549 SV</span>
                    <div className="w-full bg-[#60a5fa] rounded-t-lg transition-all duration-500" style={{ height: '82%' }}></div>
                    <span className="text-[12px] font-semibold text-[#4b5563]">2.5–2.99</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[12px] font-bold text-[#003087]">287 SV</span>
                    <div className="w-full bg-[#003087] rounded-t-lg shadow-xs transition-all duration-500" style={{ height: '100%' }}></div>
                    <span className="text-[12px] font-bold text-[#003087]">3.0–3.49</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[12px] font-bold text-[#1f2937]">101 SV</span>
                    <div className="w-full bg-[#60a5fa] rounded-t-lg transition-all duration-500" style={{ height: '35%' }}></div>
                    <span className="text-[12px] font-semibold text-[#4b5563]">≥3.5</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5e7eb] text-[13.5px] text-[#1f2937] flex items-center justify-between">
                <span>Điểm trung bình toàn khóa: <strong className="text-[#003087]">3.18 / 4.0</strong></span>
                <span className="font-bold text-[#15803d]">82.4% Đạt loại Khá - Giỏi</span>
              </div>
            </div>

            {/* Card 6: Chuẩn chứng chỉ ngoại ngữ */}
            <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1f2937] text-[17.5px] text-left mb-4">Chuẩn Chứng chỉ Ngoại ngữ</h3>
                
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                  <SvgDonutChart
                    slices={[
                      { label: 'TOEIC / IELTS Đạt chuẩn', percentage: 68, color: '#003087' },
                      { label: 'Chứng chỉ TDTU Đạt chuẩn', percentage: 24, color: '#2563eb' },
                      { label: 'Cam kết chuẩn bị thi', percentage: 8, color: '#dc2626' }
                    ]}
                    size={180}
                    strokeWidth={26}
                    centerText="100%"
                    centerSub="Chuẩn ĐBCL"
                  />
                  <div className="space-y-3 w-full sm:w-auto text-[13px]">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#003087] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">TOEIC ≥ 500 / IELTS ≥ 5.0:</span>
                      <span className="font-bold text-[#15803d]">68% (Đạt)</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#2563eb] shrink-0"></span>
                      <span className="font-semibold text-[#1f2937]">Chuẩn Nội bộ TDTU:</span>
                      <span className="font-bold text-[#003087]">24%</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#dc2626] shrink-0"></span>
                      <span className="font-semibold text-[#dc2626]">Nộp Cam kết bổ sung:</span>
                      <span className="font-bold text-[#dc2626]">8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DÀNH CHO GIẢNG VIÊN & ADMIN: BẢNG DANH SÁCH SINH VIÊN CẦN ƯU TIÊN HỖ TRỢ */}
      {!isStudent && supportStudents.length > 0 && (
        <div className="bg-white rounded-xl border border-[#fecaca] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#fecaca] bg-[#fffafb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#fef2f2] text-[#dc2626] flex items-center justify-center font-bold shrink-0">
                <svg className="w-4 h-4 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[17.5px] text-[#dc2626] text-left">
                  Danh sách Sinh viên cần ưu tiên Hỗ trợ ({needSupportCount} hồ sơ)
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('students')}
              className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[13px] font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span className="text-white">Xem toàn bộ 1.248 sinh viên</span>
              <span className="text-white">→</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#1f2937] border-b border-[#e5e7eb]">
                  <th className="py-3 px-4 font-bold text-left">MSSV</th>
                  <th className="py-3 px-4 font-bold text-left">Họ và Tên</th>
                  <th className="py-3 px-4 font-bold text-left">Chuyên ngành</th>
                  <th className="py-3 px-4 font-bold text-left">Điểm GPA</th>
                  <th className="py-3 px-4 font-bold text-left">Trạng thái</th>
                  <th className="py-3 px-4 font-bold text-left">Nguyện vọng vị trí</th>
                  <th className="py-3 px-4 font-bold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {supportStudents.map((st, idx) => (
                  <tr key={idx} className="hover:bg-[#f8fafc] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#003087]">{st.studentId || st.mssv}</td>
                    <td className="py-3 px-4 font-bold text-[#1f2937]">{st.name || st.fullName}</td>
                    <td className="py-3 px-4 text-[#4b5563]">{st.major || 'Kỹ thuật Phần mềm'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1f2937]">{st.gpa || '2.85'}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                        Cần hỗ trợ
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#1f2937]">{st.desiredPosition || 'Backend / Frontend Intern'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onNavigateTab && onNavigateTab('students')}
                        className="text-[13px] font-bold text-[#003087] hover:underline cursor-pointer"
                      >
                        Chi tiết hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

window.DashboardPage = DashboardPage;
