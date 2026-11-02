// Sidebar.tsx - Chuẩn hóa thiết kế theo Dashoard_TSNN & Figma
// Tích hợp Prime RBAC Core Engine - Tự động hiển thị/ẩn menu dựa trên Ma trận Số nguyên tố của Thầy Phúc

import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: any;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  featureKey: string;
  label: string;
  badge?: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const isStudent = currentUser?.role === 'student';
  const isPartner = currentUser?.role === 'partner';
  const isAdmin = currentUser?.email === 'phamvanc@tdtu.edu.vn' || (Boolean(currentUser?.isAdmin) && currentUser?.email !== 'nguyenvana@tdtu.edu.vn');
  const roleKey = (window as any).PrimeRbac?.getUserRoleKey?.(currentUser) || (isAdmin ? 'thay_phuc' : (isStudent ? 'sv_trong_ky' : 'giang_vien'));
  const isLecturer = roleKey === 'giang_vien' || (!isAdmin && currentUser?.role === 'lecturer') || currentUser?.email === 'nguyenvana@tdtu.edu.vn';
  const isFacultyStaff = isAdmin || roleKey === 'thay_phuc' || isLecturer;

  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
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

  const allNavItems: NavItem[] = [
    {
      id: 'dashboard',
      featureKey: 'dashboard',
      label: 'Tổng quan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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
      label: 'Quản lý chứng chỉ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    },
    {
      id: 'bulletin',
      featureKey: 'bulletin',
      label: 'Bảng tin & Thông báo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'email_jd',
      featureKey: 'email_jd',
      label: 'Duyệt Email JD',
      badge: 'Email',
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
      label: 'Import Excel',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    {
      id: 'documents',
      featureKey: 'reporting',
      label: 'Thống kê & Báo cáo',
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
      badge: 'Admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'handbook',
      featureKey: 'handbook',
      label: 'Cẩm nang thực tập',
      badge: 'Quy chế',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  const menuItems = allNavItems.filter(item => {
    if (item.id === 'accounts') {
      return isAdmin || roleKey === 'thay_phuc';
    }
    if (isFacultyStaff && (item.id === 'declaration' || item.id === 'profile')) {
      return false;
    }
    if (isLecturer) {
      if (['declaration', 'profile', 'email_jd', 'semesters', 'import', 'export', 'accounts', 'handbook'].includes(item.id)) {
        return false;
      }
    }
    if (item.id === 'handbook') {
      if (isLecturer) return false;
      return true;
    }
    if (isPartner) {
      return ['dashboard', 'profile', 'bulletin', 'handbook'].includes(item.id);
    }
    if ((window as any).PrimeRbac?.checkUserPermission) {
      return (window as any).PrimeRbac.checkUserPermission(currentUser, item.featureKey, 2);
    }
    return true;
  });

  const initials = getInitials(currentUser?.name);

  const handleMenuClick = (item: NavItem) => {
    setActiveTab(item.id);
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 border-r border-[#e2e8f0] dark:border-slate-800 transition-all duration-300 z-30 flex flex-col justify-between ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className={`border-b border-[#f1f5f9] dark:border-slate-800 flex items-center ${
          isCollapsed ? 'p-3 justify-center' : 'p-4.5 justify-between'
        }`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#003087] flex items-center justify-center p-1.5 shadow-xs shrink-0">
                <img
                  src="./assets/logo_tdtu.png"
                  alt="TDTU"
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-black tracking-tight text-[#003087] dark:text-sky-400 truncate">
                  KHOA CNTT
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] dark:text-slate-400 truncate">
                  ĐH TÔN ĐỨC THẮNG
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleCollapse}
              title={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
              className="p-1.5 text-[#64748b] hover:text-[#003087] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <nav className={`space-y-1.5 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMenuClick(item)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-[10px] text-[13px] transition-all duration-200 cursor-pointer ${
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
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 ${
                    item.badge === 'Admin'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : item.badge === 'Email'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
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

      <div className={`${isCollapsed ? 'p-2' : 'p-3'} space-y-2`}>
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

(window as any).Sidebar = Sidebar;
export default Sidebar;
