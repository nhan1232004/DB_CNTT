// Sidebar Component - Tuân thủ nghiêm ngặt TDTU Enterprise Design System & FRONTEND_SPEC.md
// Cập nhật theo yêu cầu:
// 1. Loại bỏ phần card "Cẩm nang thực tập"
// 2. Gộp phần "Hồ sơ cá nhân" từ menu chính xuống thanh user profile ở footer:
//    - Khi user click vào khối Profile, chuyển trực tiếp sang trang AccountsPage ('accounts')
//    - Thiết kế hover/active card đẹp mắt, tinh tế theo chuẩn SaaS TDTU
// 3. Chuẩn hóa màu sắc các khối, badge, trạng thái đồng bộ FRONTEND_SEPC.md (#003087, #0052cc, #dc2626, #16a34a, #d97706)

const Sidebar = ({ activeTab, setActiveTab, currentUser, onLogout, activeSemester = 'hk1_2026_2027' }) => {
  const isStudent = currentUser?.role === 'student';
  const isPartner = currentUser?.role === 'partner';
  const cleanEmail = String(currentUser?.email || '').toLowerCase();
  const isAdmin = cleanEmail === 'duonghuuphuc@tdtu.edu.vn' || cleanEmail === 'phamvanc@tdtu.edu.vn' || (Boolean(currentUser?.isAdmin) && cleanEmail !== 'nguyenvana@tdtu.edu.vn');
  const roleKey = window.PrimeRbac?.getUserRoleKey?.(currentUser) || (isAdmin ? 'thay_phuc' : (isStudent ? 'sv_trong_ky' : 'giang_vien'));
  const isLecturer = roleKey === 'giang_vien' || (!isAdmin && currentUser?.role === 'lecturer') || cleanEmail === 'nguyenvana@tdtu.edu.vn';
  const isFacultyStaff = isAdmin || roleKey === 'thay_phuc' || isLecturer;

  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

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

  const handleLogoutAction = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (window.FirebaseService?.signOut) {
        await window.FirebaseService.signOut();
      }
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    } finally {
      setIsLoggingOut(false);
      if (onLogout) onLogout();
    }
  };

  const normalizeTeacherDisplayName = (name = '', role = '', isAdmin = false) => {
    if (!name) return 'Người dùng TDTU';
    const str = String(name).trim();
    const isTeacher = role === 'lecturer' || Boolean(isAdmin) || role === 'admin';
    if (!isTeacher) return str;

    // Xóa các học vị TS., ThS., PGS.TS., GS.TS., Thạc sĩ, Tiến sĩ
    let clean = str.replace(/^(TS\.|ThS\.|PGS\.TS\.|GS\.TS\.|PGS\.|GS\.|Ths\.|Ts\.|Thạc sĩ|Tiến sĩ)\s*/i, '').trim();
    if (clean.startsWith('GV.')) {
      clean = clean.substring(3).trim();
    } else if (clean.startsWith('GV ')) {
      clean = clean.substring(3).trim();
    }
    return `GV. ${clean}`;
  };

  const getInitials = (name = '') => {
    if (!name) return 'TU';
    const clean = name.replace(/^(GV\.|GV\s+|TS\.|ThS\.|PGS\.TS\.|GS\.TS\.|PGS\.|GS\.|Ths\.|Ts\.|Thạc sĩ|Tiến sĩ)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const roleBadgeLabel = () => {
    if (isStudent) {
      if (roleKey === 'sv_ngoai_ky') return 'Sinh viên (Ngoài kỳ)';
      return currentUser?.studentId ? `${currentUser.studentId} · Trong kỳ` : 'Sinh viên trong kỳ';
    }
    if (isAdmin || roleKey === 'thay_phuc') return 'Quản trị viên';
    if (isPartner) return 'Đối tác DN';
    return 'Giảng viên';
  };

  const sectionTitle = (isAdmin || isLecturer) ? 'KHÔNG GIAN GIẢNG VIÊN' : (isPartner ? 'KHÔNG GIAN ĐỐI TÁC' : 'KHÔNG GIAN SINH VIÊN');

  // Danh mục phân nhóm các chức năng (Đã gộp Hồ sơ cá nhân xuống bottom user profile card)
  const mainFeatures = [
    {
      id: 'dashboard',
      featureKey: 'dashboard',
      label: 'Tổng quan',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      id: 'declaration',
      featureKey: 'declaration',
      label: 'Khai báo thực tập',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      id: 'students',
      featureKey: 'students',
      label: 'Danh sách sinh viên',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'certs',
      featureKey: 'certificates',
      label: 'Chứng chỉ ngoại ngữ',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      id: 'bulletin',
      featureKey: 'bulletin',
      label: 'Bảng tin JD & Tuyển dụng',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'semesters',
      featureKey: 'semesters',
      label: 'Quản lý học kỳ',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'import',
      featureKey: 'import',
      label: 'Nhập file Excel SV',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    {
      id: 'documents',
      featureKey: 'reporting',
      label: 'Báo cáo & Ra quyết định',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const filterItem = (item) => {
    if (item.id === 'accounts') return false; // Đã tích hợp xuống Bottom Profile
    if (item.id === 'profile') return false;  // Đã gộp xuống Bottom Profile
    if (isFacultyStaff && (item.id === 'declaration' || item.id === 'profile')) return false;
    if (isLecturer && ['declaration', 'profile', 'email_jd', 'semesters', 'import', 'export', 'accounts', 'handbook'].includes(item.id)) return false;
    if (item.id === 'handbook' && isLecturer) return false;
    if (isPartner) return ['dashboard', 'bulletin'].includes(item.id);

    // Sinh viên không có trong danh sách kỳ thực tập đang chọn: CHỈ THẤY Bảng điều khiển & Bảng tin
    if (isStudent) {
      let isEnrolled = currentUser?.isEnrolledThisSemester !== false && roleKey !== 'sv_ngoai_ky';
      const sem = activeSemester || 'hk1_2026_2027';
      const sid = String(currentUser?.studentId || currentUser?.mssv || '').toUpperCase();
      if (sid === '52100999' || currentUser?.isEnrolledThisSemester === false || roleKey === 'sv_ngoai_ky') {
        isEnrolled = false;
      } else {
        try {
          const raw = localStorage.getItem(`tdtu_imported_students_${sem}`) || (sem === 'hk1_2026_2027' ? (localStorage.getItem('tdtu_live_students_clean') || localStorage.getItem('tdtu_live_students')) : null);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length > 0) {
              isEnrolled = arr.some(s => String(s.studentId || s.mssv || s.id || '').toUpperCase() === sid);
            }
          }
        } catch {
          isEnrolled = false;
        }
      }
      if (!isEnrolled) {
        return ['dashboard', 'bulletin'].includes(item.id);
      }
    }

    if (window.PrimeRbac?.checkUserPermission) {
      return window.PrimeRbac.checkUserPermission(currentUser, item.featureKey, 2);
    }
    return true;
  };

  const visibleMain = mainFeatures.filter(filterItem);
  const visibleAdmin = adminFeatures.filter(filterItem);

  const renderNavButton = (item) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveTab(item.id)}
        title={isCollapsed ? item.label : undefined}
        className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
          isActive
            ? 'bg-[#ebf3ff] text-[#003087] font-bold shadow-xs'
            : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#003087]'
        } ${isCollapsed ? 'justify-center px-0' : ''}`}
      >
        <span className={`shrink-0 ${isActive ? 'text-[#003087]' : 'text-[#64748b]'}`}>
          {item.icon}
        </span>
        {!isCollapsed && (
          <span className="text-left text-[14px] leading-snug select-none truncate">{item.label}</span>
        )}
      </button>
    );
  };

  const sidebarWidth = isCollapsed ? '76px' : '260px';
  const isProfileActive = activeTab === 'accounts' || activeTab === 'profile';

  return (
    <aside
      style={{
        width: sidebarWidth,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isCollapsed ? '0 2px 10px rgba(0, 48, 135, 0.04)' : 'none',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {/* 1. BRAND & LOGO HEADER */}
      <div
        style={{
          padding: isCollapsed ? '16px 8px' : '16px 14px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          minHeight: '84px',
          boxSizing: 'border-box',
        }}
      >
        {/* Top: Logo TDTU */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginBottom: isCollapsed ? '10px' : '8px',
          }}
        >
          <img
            src="./src/assets/logo_tdtu.png"
            alt="Logo TDTU"
            style={{
              height: isCollapsed ? '32px' : '38px',
              maxWidth: isCollapsed ? '42px' : '140px',
              objectFit: 'contain',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        {/* Row with Title + Collapse Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            width: '100%',
            gap: '8px',
          }}
        >
          {!isCollapsed && (
            <div className="fade-in" style={{ flex: 1, textAlign: 'left', padding: '0 4px', minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#003087',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                CỔNG THỰC TẬP CNTT
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#94a3b8',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginTop: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {sectionTitle}
              </div>
            </div>
          )}

          {/* Collapse / Expand Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#003087',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ebf3ff';
              e.currentTarget.style.borderColor = '#93c5fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
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

      {/* 2. NAVIGATION LIST (SCROLLABLE) */}
      <nav
        style={{
          flex: 1,
          padding: isCollapsed ? '14px 8px' : '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Nhóm chức năng chính */}
        {!isCollapsed && (
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 4px' }}>
            Học vụ & Thực tập
          </div>
        )}
        {visibleMain.map(renderNavButton)}

        {/* Nhóm Quản trị & Điều phối */}
        {visibleAdmin.length > 0 && (
          <>
            <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '8px 4px' }} />
            {!isCollapsed && (
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px' }}>
                Quản trị & Điều phối
              </div>
            )}
            {visibleAdmin.map(renderNavButton)}
          </>
        )}
      </nav>

      {/* 3. USER PROFILE (HỒ SƠ CÁ NHÂN / CÀI ĐẶT TÀI KHOẢN) & LOGOUT */}
      <div
        style={{
          padding: isCollapsed ? '12px 8px' : '14px 12px',
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Khối Profile tương tác - Nhấn để chuyển sang trang AccountsPage */}
        {!isCollapsed ? (
          <div
            onClick={() => setActiveTab('accounts')}
            role="button"
            tabIndex={0}
            title="Xem hồ sơ & quản lý tài khoản (Accounts)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '12px',
              border: isProfileActive ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
              backgroundColor: isProfileActive ? '#ebf3ff' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (!isProfileActive) {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProfileActive) {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }
            }}
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name || 'Avatar'}
                referrerPolicy="no-referrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: isProfileActive ? '2px solid #003087' : '1.5px solid #003087',
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#003087',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                {getInitials(currentUser?.name)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: isProfileActive ? '#003087' : '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.3,
                }}
              >
                {normalizeTeacherDisplayName(currentUser?.name, currentUser?.role, currentUser?.isAdmin)}
              </div>
              {isStudent ? (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '1px',
                  }}
                  title={currentUser?.email || ''}
                >
                  {currentUser?.email || ''}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#dc2626',
                    fontWeight: '700',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textTransform: 'uppercase',
                    marginTop: '1px',
                  }}
                >
                  {roleBadgeLabel()}
                </div>
              )}
            </div>
            <svg
              className={`w-4 h-4 shrink-0 transition-transform ${isProfileActive ? 'text-[#003087] translate-x-0.5' : 'text-[#94a3b8]'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ) : (
          <div
            onClick={() => setActiveTab('accounts')}
            role="button"
            tabIndex={0}
            title={`Hồ sơ cá nhân: ${currentUser?.name || 'Tài khoản'}`}
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '6px 0',
              borderRadius: '10px',
              backgroundColor: isProfileActive ? '#ebf3ff' : 'transparent',
              border: isProfileActive ? '1px solid #bfdbfe' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name || 'Avatar'}
                referrerPolicy="no-referrer"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: isProfileActive ? '2px solid #003087' : '1.5px solid #003087',
                }}
              />
            ) : (
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#003087',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '12px',
                }}
              >
                {getInitials(currentUser?.name)}
              </div>
            )}
          </div>
        )}

        {/* Logout Action */}
        <button
          type="button"
          onClick={handleLogoutAction}
          disabled={isLoggingOut}
          title={isCollapsed ? (isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất') : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: isCollapsed ? '8px 0' : '8px 12px',
            backgroundColor: isLoggingOut ? '#fee2e2' : '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            color: isLoggingOut ? '#991b1b' : '#dc2626',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            opacity: isLoggingOut ? 0.8 : 1,
            transition: 'all 0.2s',
          }}
        >
          {isLoggingOut ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              {!isCollapsed && <span>Đang đăng xuất...</span>}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!isCollapsed && <span>Đăng xuất</span>}
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
