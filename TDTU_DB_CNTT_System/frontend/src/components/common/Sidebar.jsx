// Sidebar Component - Chuẩn hóa thiết kế theo Dashoard_TSNN-frontend_qvinh template & Figma
// Phân định rạch ròi 4 vai trò: Sinh viên, Giảng viên thường, Quản trị viên (Admin), Đối tác Doanh nghiệp
// Đảm bảo tính nhất quán logic, không bị lẫn tab, highlight chuẩn xác 100%, hỗ trợ Thu gọn / Mở rộng

const Sidebar = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const isStudent = currentUser?.role === 'student';
  const isPartner = currentUser?.role === 'partner';
  const isAdmin = Boolean(currentUser?.isAdmin);
  const isLecturer = currentUser?.role === 'lecturer' && !isAdmin;

  // Sidebar collapse state with localStorage persistence
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

  // Avatar initials helper
  const getInitials = (name = '') => {
    if (!name) return 'TU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const menuItems = [];

  if (isStudent) {
    // 1. Menu cho Sinh viên
    menuItems.push({
      id: 'dashboard',
      label: 'Tổng quan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    });

    if (currentUser?.isEnrolledThisSemester !== false) {
      menuItems.push({
        id: 'declaration',
        label: 'Khai báo thực tập',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      });
    }

    menuItems.push({
      id: 'certs',
      label: 'Chứng chỉ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    });

    menuItems.push({
      id: 'bulletin',
      label: 'Bảng tin JD',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    });

    menuItems.push({
      id: 'handbook',
      label: 'Cẩm nang thực tập',
      badge: 'Quy chế',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    });
  } else if (isPartner) {
    // 2. Menu cho Đối tác Doanh nghiệp
    menuItems.push({
      id: 'dashboard',
      label: 'Tổng quan tiếp nhận',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    });

    menuItems.push({
      id: 'bulletin',
      label: 'Tin tuyển dụng (JD)',
      badge: 'Đăng tin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    });

    menuItems.push({
      id: 'handbook',
      label: 'Quy chế & Hướng dẫn',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    });
  } else if (isAdmin) {
    // 3. Menu cho Quản trị viên (Admin)
    menuItems.push({
      id: 'dashboard',
      label: 'Tổng quan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    });

    menuItems.push({
      id: 'bulletin',
      label: 'Quản lý & Duyệt JD',
      badge: '3',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    });

    menuItems.push({
      id: 'documents',
      label: 'Xuất báo cáo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )
    });

    menuItems.push({
      id: 'accounts',
      label: 'Cài đặt hệ thống',
      badge: 'Admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    });
  } else {
    // 4. Menu cho Giảng viên thường (Không có quyền tạo/duyệt JD hoặc vào Cài đặt Quản trị)
    menuItems.push({
      id: 'dashboard',
      label: 'Tổng quan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    });

    menuItems.push({
      id: 'bulletin',
      label: 'Bảng tin JD (Xem tin)',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    });

    menuItems.push({
      id: 'documents',
      label: 'Xuất báo cáo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )
    });
  }

  const handleMenuClick = (item) => {
    setActiveTab(item.id);
  };

  const initials = getInitials(currentUser?.name);

  // Role tag label matching template
  const sectionTitle = isStudent
    ? 'KHÔNG GIAN SINH VIÊN'
    : isPartner
      ? 'KHÔNG GIAN DOANH NGHIỆP'
      : isAdmin
        ? 'KHÔNG GIAN QUẢN TRỊ'
        : 'KHÔNG GIAN GIẢNG VIÊN';

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-[#e2e8f0] dark:border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-20 ${
        isCollapsed ? 'w-[76px]' : 'w-[260px]'
      }`}
      style={{
        boxShadow: isCollapsed ? '0 2px 10px rgba(0, 48, 135, 0.04)' : 'none'
      }}
    >
      {/* BRAND & LOGO HEADER */}
      <div>
        <div
          className={`border-b border-[#f1f5f9] dark:border-slate-800 flex flex-col items-center relative ${
            isCollapsed ? 'p-3' : 'p-4'
          }`}
        >
          {/* Top: Logo TDTU */}
          <div className="flex items-center justify-center w-full mb-2">
            <img
              src="./assets/logo_tdtu.png"
              alt="Logo TDTU"
              className={`object-contain transition-all duration-300 ${
                isCollapsed ? 'h-8 max-w-[42px]' : 'h-10 max-w-[140px]'
              }`}
              onError={(e) => {
                // Fallback nếu ảnh không load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Row with Title + Collapse Button */}
          <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
            {!isCollapsed && (
              <div className="fade-in flex-1 text-left min-w-0">
                <div className="text-[13px] font-extrabold text-[#003087] dark:text-sky-400 tracking-[0.04em] uppercase leading-tight truncate">
                  CỔNG THỰC TẬP CNTT
                </div>
                <div className="text-[11px] font-bold text-[#94a3b8] dark:text-slate-400 tracking-[0.06em] uppercase mt-0.5 truncate">
                  {sectionTitle}
                </div>
              </div>
            )}

            {/* Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              className="p-1.5 rounded-lg bg-[#f8fafc] hover:bg-[#ebf3ff] dark:bg-slate-800 dark:hover:bg-slate-700 border border-[#e2e8f0] hover:border-[#93c5fd] dark:border-slate-700 text-[#003087] dark:text-sky-400 transition cursor-pointer shrink-0"
            >
              {isCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Menu List */}
        <nav className={`space-y-1.5 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMenuClick(item)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-[10px] text-[14px] transition-all duration-200 cursor-pointer ${
                  isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between py-2.5 px-3.5'
                } ${
                  isActive
                    ? 'bg-[#ebf3ff] text-[#003087] font-bold dark:bg-blue-950/80 dark:text-sky-300 shadow-xs'
                    : 'text-[#475569] dark:text-slate-300 hover:bg-[#f8fafc] dark:hover:bg-slate-800 hover:text-[#003087] dark:hover:text-white font-medium'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <span className={`shrink-0 ${isActive ? 'text-[#003087] dark:text-sky-400' : 'text-[#64748b] dark:text-slate-400'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`px-2 py-0.5 text-[11px] font-extrabold rounded-full shrink-0 ${
                    item.badge === 'Admin'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : item.badge === 'Quy chế'
                        ? 'bg-blue-100 dark:bg-blue-950 text-[#003087] dark:text-sky-300'
                        : 'bg-[#dc2626] text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION: USER PROFILE */}
      <div className={`${isCollapsed ? 'p-2' : 'p-3'} space-y-2`}>

        {/* User Profile Card */}
        <div className="pt-2 border-t border-[#f1f5f9] dark:border-slate-800">
          {!isCollapsed ? (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-[#e2e8f0] dark:border-slate-700/60 flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-[#003087] text-white font-bold text-xs flex items-center justify-center shrink-0 border border-[#003087] shadow-xs">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#0f172a] dark:text-white truncate">
                  {currentUser?.name || 'Người dùng TDTU'}
                </div>
                <div className="text-[10px] font-medium text-[#64748b] dark:text-slate-400 truncate">
                  {currentUser?.email || (isStudent ? `${currentUser?.studentId || '52200001'}@student.tdtu.edu.vn` : 'Giảng viên Khoa CNTT')}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2.5">
              <div
                title={currentUser?.name || 'Tài khoản'}
                className="w-8 h-8 rounded-full bg-[#003087] text-white font-bold text-xs flex items-center justify-center border border-[#003087] shadow-xs cursor-pointer"
              >
                {initials}
              </div>
            </div>
          )}

          {/* Logout Action */}
          <button
            type="button"
            onClick={onLogout}
            title={isCollapsed ? 'Đăng xuất' : undefined}
            className={`w-full py-2 bg-[#fef2f2] hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-[#dc2626] dark:text-rose-300 border border-[#fecaca] dark:border-rose-900/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
              isCollapsed ? 'px-0' : 'px-3'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
