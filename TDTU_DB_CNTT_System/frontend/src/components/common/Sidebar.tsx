// Sidebar Component - Tuân thủ nghiêm ngặt TDTU Enterprise Design System
// 1. Màu sắc giao diện: Trắng (#ffffff), Xanh dương (#003087 - TDTU Navy), Đỏ (#dc2626 - Alert Red)
// 2. Màu chữ: Chỉ Đen (#1f2937) và Đỏ (#dc2626)
// 3. Phông chữ: Body 11px-13px, Tiêu đề & Nhãn in đậm (font-bold)
// 4. Bố cục: Chuẩn SaaS Enterprise, độ rộng cân đối (320px), viền đệm cân xứng hai bên

const Sidebar = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const isStudent = currentUser?.role === 'student';
  const isPartner = currentUser?.role === 'partner';
  const cleanEmail = String(currentUser?.email || '').toLowerCase();
  const isAdmin = cleanEmail === 'duonghuuphuc@tdtu.edu.vn' || cleanEmail === 'phamvanc@tdtu.edu.vn' || (Boolean(currentUser?.isAdmin) && cleanEmail !== 'nguyenvana@tdtu.edu.vn');
  const roleKey = window.PrimeRbac?.getUserRoleKey?.(currentUser) || (isAdmin ? 'thay_phuc' : (isStudent ? 'sv_trong_ky' : 'giang_vien'));
  const isLecturer = roleKey === 'giang_vien' || (!isAdmin && currentUser?.role === 'lecturer') || cleanEmail === 'nguyenvana@tdtu.edu.vn';
  const isFacultyStaff = isAdmin || roleKey === 'thay_phuc' || isLecturer;

  // Trạng thái thu gọn Sidebar
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem('tdtu_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('tdtu_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const getInitials = (name = '') => {
    if (!name) return 'TU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const roleBadgeLabel = () => {
    if (isStudent) return currentUser?.studentId || 'Sinh viên';
    if (isAdmin || roleKey === 'thay_phuc') return 'Quản trị viên';
    if (isPartner) return 'Đối tác DN';
    return 'Giảng viên';
  };

  // Danh mục phân nhóm các chức năng
  const mainFeatures = [
    {
      id: 'dashboard',
      featureKey: 'dashboard',
      label: 'Bảng điều khiển',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      id: 'declaration',
      featureKey: 'declaration',
      label: 'Khai báo thực tập',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'profile',
      featureKey: 'profile',
      label: 'Hồ sơ cá nhân',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'students',
      featureKey: 'students',
      label: 'Quản lý sinh viên',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'certs',
      featureKey: 'certificates',
      label: 'Chứng chỉ ngoại ngữ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      id: 'bulletin',
      featureKey: 'bulletin',
      label: 'Bảng tin & Tuyển dụng',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    }
  ];

  const adminFeatures = [
    {
      id: 'email_jd',
      featureKey: 'email_jd',
      label: 'Duyệt Email JD',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'semesters',
      featureKey: 'semesters',
      label: 'Quản lý học kỳ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'import',
      featureKey: 'import',
      label: 'Nhập file Excel',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    {
      id: 'documents',
      featureKey: 'reporting',
      label: 'Báo cáo & Ra quyết định',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'accounts',
      featureKey: 'accounts',
      label: 'Cài đặt hệ thống',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  const guideFeatures = [
    {
      id: 'handbook',
      featureKey: 'handbook',
      label: 'Cẩm nang thực tập',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  const filterItem = (item) => {
    if (item.id === 'accounts') return isAdmin || roleKey === 'thay_phuc';
    if (isFacultyStaff && (item.id === 'declaration' || item.id === 'profile')) return false;
    if (isLecturer && ['declaration', 'profile', 'email_jd', 'semesters', 'import', 'export', 'accounts', 'handbook'].includes(item.id)) return false;
    if (item.id === 'handbook' && isLecturer) return false;
    if (item.id === 'handbook') return true;
    if (isPartner) return ['dashboard', 'profile', 'bulletin', 'handbook'].includes(item.id);

    // Sinh viên không có trong danh sách kỳ thực tập hiện tại: CHỈ THẤY ĐÚNG 3 MỤC: Bảng điều khiển, Hồ sơ cá nhân & Bảng tin
    if (isStudent && (currentUser?.isEnrolledThisSemester === false || roleKey === 'sv_ngoai_ky')) {
      return ['dashboard', 'profile', 'bulletin'].includes(item.id);
    }

    if (window.PrimeRbac?.checkUserPermission) {
      return window.PrimeRbac.checkUserPermission(currentUser, item.featureKey, 2);
    }
    return true;
  };

  const visibleMain = mainFeatures.filter(filterItem);
  const visibleAdmin = adminFeatures.filter(filterItem);
  const visibleGuide = guideFeatures.filter(filterItem);

  const renderNavButton = (item) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveTab(item.id)}
        title={isCollapsed ? item.label : undefined}
        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-bold transition-all cursor-pointer ${
          isActive
            ? 'bg-[#003087] text-white shadow-xs'
            : 'text-[#1f2937] hover:bg-[#f1f5f9] hover:text-[#003087]'
        } ${isCollapsed ? 'justify-center px-0' : ''}`}
      >
        <span className={`shrink-0 [&_svg]:w-[22px] [&_svg]:h-[22px] ${isActive ? 'text-white' : 'text-[#4b5563]'}`}>
          {item.icon}
        </span>
        {!isCollapsed && (
          <span className="text-left font-bold text-[15px] leading-snug select-none truncate">{item.label}</span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`shrink-0 bg-white border-r border-[#e5e7eb] transition-all duration-200 z-30 flex flex-col justify-between h-screen sticky top-0 ${
        isCollapsed ? 'w-20' : 'w-[320px]'
      }`}
    >
      {/* 1. TOP BRANDING HEADER */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className={`h-20 border-b border-[#e5e7eb] flex items-center px-5 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#003087] flex items-center justify-center p-2.5 shrink-0 shadow-xs">
                <img
                  src="./src/assets/logo_tdtu.png"
                  alt="TDTU"
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[17px] font-black text-[#003087] uppercase tracking-tight leading-tight">
                  KHOA CNTT
                </div>
                <div className="text-[12.5px] font-bold text-[#64748b] uppercase tracking-wider whitespace-nowrap">
                  ĐH TÔN ĐỨC THẮNG
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className="p-2 text-[#4b5563] hover:text-[#003087] hover:bg-[#f1f5f9] rounded-xl transition cursor-pointer"
          >
            {isCollapsed ? (
              <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#4b5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* 2. NAVIGATION LIST (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto px-[18px] py-4 space-y-4">
          {/* Group 1: CHỨC NĂNG HỌC VỤ */}
          <div className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-3 text-[12px] font-bold text-[#64748b] uppercase tracking-wider mb-2">
                Học vụ & Thực tập
              </div>
            )}
            {visibleMain.map(renderNavButton)}
          </div>

          {/* Divider between Group 1 and Group 2 */}
          {visibleAdmin.length > 0 && (
            <div className="my-3 border-t border-[#e5e7eb] mx-2"></div>
          )}

          {/* Group 2: QUẢN TRỊ & ĐIỀU PHỐI (NẾU CÓ) */}
          {visibleAdmin.length > 0 && (
            <div className="space-y-1.5">
              {!isCollapsed && (
                <div className="px-3 text-[12px] font-bold text-[#64748b] uppercase tracking-wider mb-2">
                  Điều phối & Báo cáo
                </div>
              )}
              {visibleAdmin.map(renderNavButton)}
            </div>
          )}

          {/* Divider between Group 2 and Group 3 */}
          {visibleGuide.length > 0 && (
            <div className="my-3 border-t border-[#e5e7eb] mx-2"></div>
          )}

          {/* Group 3: QUY CHẾ & CẨM NANG */}
          {visibleGuide.length > 0 && (
            <div className="space-y-1.5">
              {!isCollapsed && (
                <div className="px-3 text-[12px] font-bold text-[#64748b] uppercase tracking-wider mb-2">
                  Văn bản & Quy chế
                </div>
              )}
              {visibleGuide.map(renderNavButton)}
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM USER PROFILE & LOGOUT SECTION */}
      <div className="p-4 border-t border-[#e5e7eb] bg-white">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f8fafc] border border-[#e5e7eb]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#003087] text-white flex items-center justify-center font-black text-[15px] shrink-0 shadow-2xs">
                {getInitials(currentUser?.name)}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-[#1f2937] truncate leading-tight">
                  {currentUser?.name || 'Người dùng TDTU'}
                </div>
                <div className="text-[12.5px] font-bold text-[#dc2626] uppercase truncate mt-0.5">
                  {roleBadgeLabel()}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
              className="p-2.5 text-[#dc2626] hover:bg-[#fef2f2] rounded-xl transition cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLogout}
            title={`Đăng xuất (${currentUser?.name || 'TDTU'})`}
            className="w-full p-2.5 text-[#dc2626] hover:bg-[#fef2f2] rounded-xl transition flex items-center justify-center cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
