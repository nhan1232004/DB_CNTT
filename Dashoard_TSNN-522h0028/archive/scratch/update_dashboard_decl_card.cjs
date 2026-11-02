const fs = require('fs');

function updateDashboardPage(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Update loadData to fetch declaration if not loaded
  const oldFetchDecl = `        if (window.ApiClient.getStudentDeclaration) {
          setDeclaration(window.ApiClient.getStudentDeclaration(studentId));
        }`;

  const newFetchDecl = `        if (window.ApiClient.getStudentDeclaration) {
          const cached = window.ApiClient.getStudentDeclaration(studentId);
          if (cached) setDeclaration(cached);
          if (window.ApiClient.getDeclaration) {
            window.ApiClient.getDeclaration(studentId).then(fresh => {
              if (fresh && (fresh.data || fresh.companyName)) {
                setDeclaration(fresh.data || fresh);
              }
            }).catch(() => {});
          }
        }`;

  if (code.includes(oldFetchDecl)) {
    code = code.replace(oldFetchDecl, newFetchDecl);
  }

  // 2. Insert student declaration card above the 5 KPI cards
  const targetKpi = `      {/* ========================================================================= */}
      {/* VIEW CHÍNH: UNIFIED EXECUTIVE DASHBOARD (ĐỒNG BỘ 3 ROLE: SV - GV - ADMIN) */}
      {/* ========================================================================= */}
        <div className="space-y-8">
          
          {/* 1. 5 Top KPI Metric Cards matching Quy chuẩn Giao diện Hình 1 */}`;

  const newStudentDeclCard = `      {/* ========================================================================= */}
      {/* VIEW CHÍNH: UNIFIED EXECUTIVE DASHBOARD (ĐỒNG BỘ 3 ROLE: SV - GV - ADMIN) */}
      {/* ========================================================================= */}
        <div className="space-y-8">
          
          {/* Sinh viên: Thông tin thực tập & Cán bộ hướng dẫn đã khai báo */}
          {isStudent && declaration && (
            <div className="bg-gradient-to-r from-blue-900 to-[#003087] text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Hồ sơ thực tập của bạn · HK1 2026–2027
                    </h3>
                    <p className="text-[11px] text-blue-200">
                      Khoa CNTT - Trường Đại học Tôn Đức Thắng
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                    {declaration?.companyName ? (declaration?.companyName.includes('hỗ trợ') ? 'Cần Khoa hỗ trợ' : (declaration?.companyName.includes('Đang tìm') ? 'Đang chờ PV' : 'Đã có nơi thực tập')) : 'Chưa khai báo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { if (onNavigateTab) onNavigateTab('declaration'); }}
                    className="px-3 py-1 bg-white hover:bg-blue-50 text-[#003087] font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {declaration?.companyName ? 'Chỉnh sửa' : 'Khai báo ngay'} →
                  </button>
                </div>
              </div>

              {declaration?.companyName ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-blue-200 text-[11px] block">Doanh nghiệp tiếp nhận:</span>
                    <strong className="text-white text-sm font-bold block truncate">{declaration.companyName}</strong>
                    {declaration.taxCode && <span className="text-blue-200 text-[10px] font-mono">MST: {declaration.taxCode}</span>}
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-blue-200 text-[11px] block">Vị trí thực tập:</span>
                    <strong className="text-white text-sm font-bold block truncate">{declaration.position || 'Thực tập sinh'}</strong>
                    {declaration.department && <span className="text-blue-200 text-[10px] block truncate">{declaration.department}</span>}
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-blue-200 text-[11px] block">Cán bộ hướng dẫn (Mentor):</span>
                    <strong className="text-emerald-300 text-sm font-bold block truncate">{declaration.contactPerson || 'Chưa cập nhật'}</strong>
                    {declaration.contactPhone && <span className="text-blue-200 text-[10px] font-mono block">SĐT: {declaration.contactPhone}</span>}
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-blue-200 text-[11px] block">Môn học đăng ký:</span>
                    <strong className="text-white text-sm font-bold block">
                      {declaration.isDualCourse ? 'KTCN & TSNN (Song song)' : (declaration.selectedCourses?.[0] || 'KTCN')}
                    </strong>
                    <span className="text-blue-200 text-[10px]">Trạng thái: Đã ghi nhận</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-blue-100 flex items-center justify-between">
                  <span>Bạn chưa hoàn thành khai báo nơi thực tập hoặc đăng ký nguyện vọng hỗ trợ từ Khoa.</span>
                  <span className="text-amber-300 font-bold">Hạn chót: 30/09/2026</span>
                </div>
              )}
            </div>
          )}

          {/* 1. 5 Top KPI Metric Cards matching Quy chuẩn Giao diện Hình 1 */}`;

  if (code.includes(targetKpi)) {
    code = code.replace(targetKpi, newStudentDeclCard);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Updated Dashboard in ${filePath}`);
  } else {
    console.error(`targetKpi not found in ${filePath}`);
  }
}

updateDashboardPage('TDTU_DB_CNTT_System/frontend/src/pages/DashboardPage.jsx');
updateDashboardPage('TDTU_DB_CNTT_System/frontend/src/pages/DashboardPage.tsx');
