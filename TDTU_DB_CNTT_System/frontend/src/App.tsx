// App.jsx - Main Application Shell & RBAC Layout Router
// Tuân thủ nghiêm ngặt TDTU Enterprise Design System:
// Layout Chuẩn SaaS: Sidebar cố định bên trái, Header bên phải trên cùng, Content cuộn mượt mà

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[TDTU Portal ErrorBoundary]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-[#1f2937]">
          <div className="bg-white p-8 rounded-2xl border border-[#e5e7eb] shadow-xl max-w-lg w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ebf3ff] text-[#003087] mx-auto flex items-center justify-center font-bold">
              <svg className="w-8 h-8 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-[#1f2937]">Đang tải lại Cổng thông tin</h2>
            <p className="text-[12.5px] text-[#4b5563] leading-relaxed">
              Vui lòng tải lại trang.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[12.5px] font-bold transition shadow-xs cursor-pointer"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this._retryInterval = null;
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('[TDTU TabErrorBoundary caught]:', error, errorInfo);
  }
  componentDidMount() {
    this._retryInterval = setInterval(() => {
      if (this.state.hasError) {
        // Tự động kiểm tra và phục hồi nếu do script tải bất đồng bộ chậm
        this.setState({ hasError: false, error: null });
      }
    }, 2000);
  }
  componentWillUnmount() {
    if (this._retryInterval) clearInterval(this._retryInterval);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.activeTab !== this.props.activeTab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-8 bg-white border border-[#e5e7eb] rounded-2xl shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#ebf3ff] text-[#003087] mx-auto flex items-center justify-center font-bold">
            <svg className="w-6 h-6 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-[17px] font-bold text-[#1f2937]">Đang đồng bộ dữ liệu giao diện</h3>
          <p className="text-[12.5px] text-[#4b5563] leading-relaxed">
            Không tải được nội dung. Vui lòng thử lại.
          </p>
          {this.state.error && (
            <p className="text-[11px] text-red-500 font-mono bg-red-50 p-2 rounded-lg border border-red-100 text-left overflow-x-auto">
              {String(this.state.error?.message || this.state.error)}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[12px] font-bold transition shadow-xs cursor-pointer"
            >
              Thử lại mục này
            </button>
            <button
              type="button"
              onClick={() => this.props.onResetToDashboard && this.props.onResetToDashboard()}
              className="px-4 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1f2937] rounded-lg text-[12px] font-bold transition cursor-pointer"
            >
              Về Bảng điều khiển
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// App Main Router Component
// -------------------------------------------------------------
// Component: Popup Thông Báo Nổi Góc Dưới Bên Phải Màn Hình cho Sinh Viên
// Tự động kích hoạt khi Giảng viên đăng thông báo hoặc khi Sinh viên đăng nhập
// -------------------------------------------------------------
const StudentNotificationToast = ({ currentUser, onNavigateToBulletin }) => {
  const isStudent = currentUser?.role === 'student';
  const studentId = String(currentUser?.studentId || currentUser?.mssv || currentUser?.uid || '522H0045').trim().toUpperCase();
  const [activeAnnouncement, setActiveAnnouncement] = React.useState(null);

  React.useEffect(() => {
    if (!isStudent) return;

    const checkLatestAnnouncement = async () => {
      try {
        let list = [];
        if (window.ApiClient?.getLecturerAnnouncements) {
          list = window.ApiClient.getLecturerAnnouncements();
        }
        if ((!list || list.length === 0) && window.FirebaseService?.db) {
          try {
            const snap = await window.FirebaseService.db.collection('tdtu_announcements').orderBy('createdAt', 'desc').limit(5).get();
            if (!snap.empty) {
              list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
          } catch {}
        }
        if (Array.isArray(list) && list.length > 0) {
          const unread = list.find(a => {
            const aId = a.id || a.title;
            const dismissed = localStorage.getItem(`tdtu_dismissed_ann_${studentId}_${aId}`);
            if (dismissed) return false;
            // Lọc phân luồng theo nhóm đối tượng
            const aud = a.targetAudience;
            if (!aud || aud === 'all' || aud === 'all_students') return true;
            if (aud === 'specific_student') return String(a.targetStudentId || '').toUpperCase() === studentId;
            if (aud === 'students_seeking' && (currentUser?.status === 'seeking' || currentUser?.status === 'Chưa có doanh nghiệp')) return true;
            if (aud === 'students_need_support' && (currentUser?.noCompanyOption === 'faculty' || currentUser?.status === 'Cần hỗ trợ' || currentUser?.status === 'Cần Khoa hỗ trợ')) return true;
            if (aud === 'students_by_major' && a.targetMajor && currentUser?.major) return currentUser.major.toLowerCase().includes(a.targetMajor.toLowerCase());
            return false;
          });
          if (unread) {
            setActiveAnnouncement(unread);
          }
        }
      } catch (err) {
        console.warn('Error checking student announcements:', err);
      }
    };

    // Kiểm tra ngay khi Sinh viên đăng nhập vào hệ thống
    const timer = setTimeout(checkLatestAnnouncement, 600);

    // Lắng nghe thông báo thời gian thực khi Giảng viên đăng hoặc xóa tin
    const handleRealtimeUpdate = () => {
      checkLatestAnnouncement();
    };

    window.addEventListener('tdtu_announcements_updated', handleRealtimeUpdate);
    window.addEventListener('tdtu_notifications_updated', handleRealtimeUpdate);
    window.addEventListener('tdtu_broadcast_notif', handleRealtimeUpdate);

    let bc = null;
    try {
      bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'new_announcement' && msg.data?.announcement) {
          setActiveAnnouncement(msg.data.announcement);
        } else if (msg.data?.type === 'announcement_deleted' || msg.data?.type === 'notification_deleted') {
          setActiveAnnouncement(prev => (prev && String(prev.id) === String(msg.data.id)) ? null : prev);
          checkLatestAnnouncement();
        }
      };
    } catch {}

    return () => {
      clearTimeout(timer);
      window.removeEventListener('tdtu_announcements_updated', handleRealtimeUpdate);
      window.removeEventListener('tdtu_notifications_updated', handleRealtimeUpdate);
      window.removeEventListener('tdtu_broadcast_notif', handleRealtimeUpdate);
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }, [isStudent, studentId]);

  if (!isStudent || !activeAnnouncement) return null;

  const handleDismiss = () => {
    try {
      const aId = activeAnnouncement.id || activeAnnouncement.title;
      localStorage.setItem(`tdtu_dismissed_ann_${studentId}_${aId}`, 'true');
    } catch {}
    setActiveAnnouncement(null);
  };

  const handleViewDetail = () => {
    handleDismiss();
    if (onNavigateToBulletin) {
      onNavigateToBulletin('bulletin');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-[92vw] sm:w-[420px] bg-white rounded-2xl shadow-2xl border-2 border-[#003087] p-5 transition-all duration-300 animate-slideUp">
      {/* Toast Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb] mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] animate-ping shrink-0" />
          <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#003087] bg-[#ebf3ff] border border-[#bfdbfe] px-2.5 py-1 rounded-full">
            Thông báo từ Giảng viên / Khoa
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="w-8 h-8 rounded-lg text-[#64748b] hover:text-[#dc2626] hover:bg-[#fee2e2] flex items-center justify-center font-bold text-sm transition cursor-pointer"
          title="Đóng thông báo"
        >
          ✕
        </button>
      </div>

      {/* Toast Body */}
      <div className="space-y-2 mb-4">
        <h4 className="font-extrabold text-[15px] md:text-[16px] text-[#1f2937] leading-snug">
          {activeAnnouncement.title}
        </h4>
        <p className="text-[12.5px] text-[#4b5563] text-justify leading-relaxed line-clamp-3">
          {activeAnnouncement.content}
        </p>
      </div>

      {/* Toast Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#f1f5f9] text-[12px]">
        <div className="text-[#64748b] font-medium truncate max-w-[190px]">
          {activeAnnouncement.author || 'Khoa CNTT'} · {activeAnnouncement.date || 'Vừa đăng'}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-[12.5px] font-bold text-[#64748b] hover:text-[#1f2937] cursor-pointer"
          >
            Đã hiểu
          </button>
          <button
            type="button"
            onClick={handleViewDetail}
            className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-[12.5px] font-bold transition shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <span>Xem bảng tin</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AppInner = () => {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [authChecking, setAuthChecking] = React.useState(true);
  const [activeSemester, setActiveSemester] = React.useState(() => {
    try {
      return localStorage.getItem('tdtu_active_semester') || 'hk1_2026_2027';
    } catch {}
    return 'hk1_2026_2027';
  });

  const handleSemesterChange = React.useCallback((newSem) => {
    setActiveSemester(newSem);
    try {
      localStorage.setItem('tdtu_active_semester', newSem);
    } catch {}
    window.dispatchEvent(new CustomEvent('tdtu_semester_changed', { detail: { semesterId: newSem } }));
  }, []);

  // Helper kiểm tra sinh viên có tên trong danh sách của học kỳ cụ thể hay không
  const isStudentEnrolledInSemester = React.useCallback((sid, semId) => {
    if (!sid) return false;
    const cleanSid = String(sid).trim().toUpperCase();
    if (cleanSid === '52100999') return false; // Sinh viên ngoài kỳ mẫu

    // 1. Kiểm tra danh sách đã nạp trong LocalStorage của học kỳ đó
    try {
      const raw = localStorage.getItem(`tdtu_imported_students_${semId}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          return arr.some(s => String(s.studentId || s.mssv || s.id || '').trim().toUpperCase() === cleanSid);
        }
      }
    } catch {}

    // 2. Học kỳ chính HK1 2026-2027
    if (semId === 'hk1_2026_2027') {
      try {
        const liveRaw = localStorage.getItem('tdtu_live_students_clean') || localStorage.getItem('tdtu_live_students');
        if (liveRaw) {
          const liveArr = JSON.parse(liveRaw);
          if (Array.isArray(liveArr) && liveArr.length > 0) {
            return liveArr.some(s => String(s.studentId || s.mssv || s.id || '').trim().toUpperCase() === cleanSid);
          }
        }
      } catch {}

      if (currentUser?.isEnrolledThisSemester !== false && cleanSid !== '52100999') {
        return true;
      }
    }

    return false;
  }, [currentUser]);

  // Xác định học kỳ thực tế:
  // - Giảng viên & Quản trị viên: Hiển thị đầy đủ thông tin sinh viên và thời gian của học kỳ được kích hoạt/chọn
  // - Sinh viên: Chỉ khi sinh viên có trong danh sách kỳ đó thì mới hiện theo, không thì chỉ hiển thị kỳ hiện tại hoặc kỳ sinh viên có trong danh sách
  const effectiveSemester = React.useMemo(() => {
    const isStudent = currentUser?.role === 'student';
    if (!isStudent) return activeSemester;

    const sid = String(currentUser?.studentId || currentUser?.mssv || '').toUpperCase();
    if (!sid || sid === '52100999') return activeSemester;

    if (isStudentEnrolledInSemester(sid, activeSemester)) {
      return activeSemester;
    }

    const semList = window.ApiClient?.getSemesters ? window.ApiClient.getSemesters() : [];
    const allSemesters = (Array.isArray(semList) && semList.length > 0)
      ? semList.map(s => s.id)
      : ['hk2_2026_2027', 'hk1_2026_2027', 'hk2_2025_2026', 'hk1_2025_2026'];
    for (const s of allSemesters) {
      if (isStudentEnrolledInSemester(sid, s)) {
        return s;
      }
    }
    return 'hk1_2026_2027';
  }, [currentUser, activeSemester, isStudentEnrolledInSemester]);

  // Chống can thiệp URL & LocalStorage để chuyển đổi tài khoản hoặc vượt quyền trái phép
  React.useEffect(() => {
    const sanitizeUrl = () => {
      try {
        const path = window.location.pathname || '/';
        const search = window.location.search || '';
        const hash = window.location.hash || '';
        if ((path !== '/' && path !== '/index.html') || search !== '' || hash !== '') {
          window.history.replaceState(null, '', '/');
        }
      } catch {}
    };

    sanitizeUrl();
    window.addEventListener('popstate', sanitizeUrl);
    window.addEventListener('hashchange', sanitizeUrl);

    const handleStorageTamper = (e) => {
      if (e && (e.key === 'tdtu_auth_user' || e.key === 'tdtu_auth_token')) {
        const rawToken = localStorage.getItem('tdtu_auth_token');
        const rawData = localStorage.getItem('tdtu_auth_user');
        if (!rawToken || !rawData) {
          setCurrentUser(null);
          setActiveTab('dashboard');
          return;
        }
        const verified = window.ApiClient?.getSavedUser ? window.ApiClient.getSavedUser() : null;
        if (verified) {
          setCurrentUser(prev => {
            if (!prev) return verified;
            const pEmail = String(prev.email || '').toLowerCase().trim();
            const vEmail = String(verified.email || '').toLowerCase().trim();
            if (pEmail !== vEmail || prev.role !== verified.role) {
              window.ApiClient?.clearToken?.();
              return null;
            }
            return prev;
          });
        }
      }
    };
    window.addEventListener('storage', handleStorageTamper);

    if (window.ApiClient && window.ApiClient.initFirestoreSync) {
      window.ApiClient.initFirestoreSync();
    }

    const token = window.ApiClient?.getToken ? window.ApiClient.getToken() : null;
    const saved = window.ApiClient?.getSavedUser ? window.ApiClient.getSavedUser() : null;

    if (token && saved && saved.role && window.ApiClient?.isTdtuEmail?.(saved.email)) {
      window.ApiClient.getMe()
        .then(res => {
          const u = res?.user || (res?.role ? res : null);
          if (u && u.role && window.ApiClient?.isTdtuEmail?.(u.email) && u.email.toLowerCase() === saved.email.toLowerCase()) {
            setCurrentUser(u);
            if (u.role === 'student' && u.isEnrolledThisSemester === false) {
              setActiveTab('dashboard');
            }
          } else {
            setCurrentUser(saved);
          }
        })
        .catch(() => {
          const recheck = window.ApiClient.getSavedUser() || saved;
          if (recheck && recheck.role && window.ApiClient?.isTdtuEmail?.(recheck.email)) {
            setCurrentUser(recheck);
            if (recheck.role === 'student' && recheck.isEnrolledThisSemester === false) {
              setActiveTab('dashboard');
            }
          }
        })
        .finally(() => setAuthChecking(false));
    } else {
      if (window.ApiClient) window.ApiClient.clearToken();
      setCurrentUser(null);
      setAuthChecking(false);
    }

    const handleSemesterEvt = (e) => {
      if (e?.detail?.semesterId) {
        setActiveSemester(e.detail.semesterId);
      }
    };
    window.addEventListener('tdtu_semester_changed', handleSemesterEvt);

    return () => {
      window.removeEventListener('popstate', sanitizeUrl);
      window.removeEventListener('hashchange', sanitizeUrl);
      window.removeEventListener('storage', handleStorageTamper);
      window.removeEventListener('tdtu_semester_changed', handleSemesterEvt);
    };
  }, []);

  // Bảo vệ phân quyền chuyển tab nghiêm ngặt theo Ma trận Số nguyên tố (Prime RBAC)
  React.useEffect(() => {
    if (!currentUser) return;
    
    const cleanEmail = String(currentUser.email || '').toLowerCase();
    const isAdmin = cleanEmail === 'duonghuuphuc@tdtu.edu.vn' || cleanEmail === 'phamvanc@tdtu.edu.vn' || (Boolean(currentUser.isAdmin) && cleanEmail !== 'nguyenvana@tdtu.edu.vn');
    const roleKey = window.PrimeRbac?.getUserRoleKey?.(currentUser) || (isAdmin ? 'thay_phuc' : (currentUser.role === 'student' ? 'sv_trong_ky' : 'giang_vien'));
    const isLecturer = roleKey === 'giang_vien' || (!isAdmin && currentUser.role === 'lecturer') || cleanEmail === 'nguyenvana@tdtu.edu.vn';
    const isFacultyStaff = isAdmin || roleKey === 'thay_phuc' || isLecturer;

    // Cả Admin & Giảng viên: Không vào declaration và profile -> Tự động chuyển về dashboard
    if (isFacultyStaff && (activeTab === 'declaration' || activeTab === 'profile')) {
      setActiveTab('dashboard');
      return;
    }

    // Giảng viên: Nếu đang ở các tab đã bỏ, tự động chuyển về dashboard
    if (isLecturer && ['declaration', 'profile', 'email_jd', 'semesters', 'import', 'export', 'accounts', 'handbook'].includes(activeTab)) {
      setActiveTab('dashboard');
      return;
    }

    // Kiểm tra sinh viên có tên trong danh sách kỳ học đang được kích hoạt hay không
    const isStudent = currentUser.role === 'student';
    let isStudentEnrolledInActiveSem = true;
    if (isStudent) {
      const sid = String(currentUser.studentId || currentUser.mssv || '').toUpperCase();
      if (sid === '52100999' || currentUser.isEnrolledThisSemester === false || roleKey === 'sv_ngoai_ky') {
        isStudentEnrolledInActiveSem = false;
      } else {
        isStudentEnrolledInActiveSem = isStudentEnrolledInSemester(sid, activeSemester);
      }
    }

    // Sinh viên không có trong danh sách kỳ đang kích hoạt: chuyển thành SV ngoài kỳ, chỉ xem được dashboard, profile và bulletin
    if (isStudent && (!isStudentEnrolledInActiveSem || currentUser.isEnrolledThisSemester === false || roleKey === 'sv_ngoai_ky')) {
      if (!['dashboard', 'profile', 'bulletin'].includes(activeTab)) {
        setActiveTab('dashboard');
        return;
      }
    }

    const tabFeatureMap = {
      dashboard: 'dashboard',
      profile: 'profile',
      declaration: 'declaration',
      students: 'students',
      certs: 'certificates',
      bulletin: 'bulletin',
      email_jd: 'email_jd',
      semesters: 'semesters',
      import: 'import',
      export: 'export',
      documents: 'reporting',
      accounts: 'accounts',
      handbook: 'handbook'
    };

    const featKey = tabFeatureMap[activeTab];
    if (featKey === 'handbook') {
      if (isLecturer) setActiveTab('dashboard');
      return;
    }
    if (featKey === 'accounts') {
      const isAdm = currentUser.isAdmin || currentUser.role === 'admin' || cleanEmail === 'duonghuuphuc@tdtu.edu.vn' || cleanEmail === 'phamvanc@tdtu.edu.vn';
      if (!isAdm) setActiveTab('dashboard');
      return;
    }

    if (window.PrimeRbac?.checkUserPermission && featKey) {
      const hasRead = window.PrimeRbac.checkUserPermission(currentUser, featKey, 2);
      if (!hasRead) {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser, activeTab]);

  const handleLoginSuccess = (user, token) => {
    const candidate = user?.user || (user?.role ? user : null);
    if (!candidate || !candidate.role || !candidate.email || !window.ApiClient?.isTdtuEmail?.(candidate.email)) {
      if (window.ApiClient) window.ApiClient.clearToken();
      setCurrentUser(null);
      return;
    }
    if (token) window.ApiClient.setToken(token);
    window.ApiClient.setSavedUser(candidate);
    const verifiedUser = window.ApiClient.getSavedUser() || candidate;
    try {
      window.history.replaceState(null, '', '/');
    } catch {}
    setCurrentUser(verifiedUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (window.ApiClient) window.ApiClient.clearToken();
    try {
      window.history.replaceState(null, '', '/');
    } catch {}
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-[#1f2937] text-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#003087] mr-3"></div>
        <span className="font-bold text-[#1f2937]">Đang kiểm tra phiên làm việc TDTU...</span>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị trang đăng nhập chuyên nghiệp
  if (!currentUser) {
    return <window.LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-white text-[#1f2937] overflow-hidden font-sans">
      {/* 1. SIDEBAR CỐ ĐỊNH BÊN TRÁI (FULL-HEIGHT) */}
      <window.Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeSemester={activeSemester}
      />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH (HEADER + SCROLLABLE BODY) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <window.Navbar
          currentUser={currentUser}
          activeSemester={activeSemester}
          onSemesterChange={handleSemesterChange}
          onNavigateTab={setActiveTab}
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 lg:px-6 bg-white w-full">
          <div className="w-full">
            <TabErrorBoundary activeTab={activeTab} onResetToDashboard={() => setActiveTab('dashboard')}>
              {activeTab === 'dashboard' && (
                window.DashboardPage ? (
                  <window.DashboardPage
                    activeSemester={activeSemester}
                    onSemesterChange={handleSemesterChange}
                    currentUser={currentUser}
                    onNavigateTab={setActiveTab}
                  />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Bảng điều khiển...</div>
                )
              )}

              {activeTab === 'profile' && (
                window.ProfilePage ? (
                  <window.ProfilePage
                    currentUser={currentUser}
                    activeSemester={effectiveSemester}
                    onNavigateTab={setActiveTab}
                    onSemesterChange={handleSemesterChange}
                  />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Hồ sơ cá nhân...</div>
                )
              )}
              
              {activeTab === 'declaration' && (
                window.DeclarationPage ? (
                  <window.DeclarationPage
                    currentUser={currentUser}
                    activeSemester={effectiveSemester}
                    onNavigateTab={setActiveTab}
                  />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Khai báo thực tập...</div>
                )
              )}

              {activeTab === 'students' && (
                window.StudentsPage ? (
                  <window.StudentsPage
                    currentUser={currentUser}
                    activeSemester={effectiveSemester}
                    onSemesterChange={handleSemesterChange}
                  />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">
                    Đang tải trang Quản lý sinh viên...
                  </div>
                )
              )}

              {activeTab === 'certs' && currentUser?.role !== 'partner' && (
                window.CertificatesPage ? (
                  <window.CertificatesPage
                    currentUser={currentUser}
                    activeSemester={effectiveSemester}
                    onSemesterChange={handleSemesterChange}
                  />
                ) : (
                  <div className="p-12 text-center text-[#1f2937]">
                    <div className="w-8 h-8 border-3 border-[#003087] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-bold">Đang nạp dữ liệu chứng chỉ ngoại ngữ...</p>
                  </div>
                )
              )}

              {activeTab === 'bulletin' && (
                window.BulletinPage ? (
                  <window.BulletinPage currentUser={currentUser} />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Bảng tin & Tuyển dụng...</div>
                )
              )}

              {activeTab === 'email_jd' && (
                window.EmailJdPage ? (
                  <window.EmailJdPage currentUser={currentUser} onNavigateTab={setActiveTab} />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Duyệt Email JD...</div>
                )
              )}

              {activeTab === 'semesters' && (
                window.SemestersPage ? (
                  <window.SemestersPage currentUser={currentUser} onNavigateTab={setActiveTab} />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Quản lý học kỳ...</div>
                )
              )}

              {activeTab === 'import' && (
                window.ImportDataPage ? (
                  <window.ImportDataPage currentUser={currentUser} onNavigateTab={setActiveTab} />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Nhập file Excel...</div>
                )
              )}

              {activeTab === 'export' && (
                window.DocumentsPage ? (
                  <window.DocumentsPage currentUser={currentUser} onNavigateTab={setActiveTab} />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Xuất báo cáo...</div>
                )
              )}

              {activeTab === 'documents' && (
                window.DocumentsPage ? (
                  <window.DocumentsPage currentUser={currentUser} onNavigateTab={setActiveTab} />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Báo cáo & Quyết định...</div>
                )
              )}

              {activeTab === 'accounts' && (currentUser?.isAdmin || currentUser?.role === 'admin' || String(currentUser?.email || '').toLowerCase() === 'duonghuuphuc@tdtu.edu.vn' || String(currentUser?.email || '').toLowerCase() === 'phamvanc@tdtu.edu.vn') && (
                window.AccountsPage ? (
                  <window.AccountsPage currentUser={currentUser} />
                ) : (
                  <div className="p-8 text-center text-[#1f2937] font-bold">Đang tải Cài đặt hệ thống...</div>
                )
              )}
            </TabErrorBoundary>
          </div>
        </main>
      </div>

      {/* Popup thông báo nổi ở góc dưới bên phải màn hình khi Giảng viên đăng bài / Sinh viên đăng nhập */}
      <StudentNotificationToast
        currentUser={currentUser}
        onNavigateToBulletin={() => setActiveTab('bulletin')}
      />
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <AppInner />
  </ErrorBoundary>
);

window.App = App;
