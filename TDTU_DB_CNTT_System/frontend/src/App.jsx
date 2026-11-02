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
            <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] text-[#dc2626] mx-auto flex items-center justify-center font-bold">
              <svg className="w-8 h-8 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-[#1f2937]">Đang tải lại Cổng thông tin</h2>
            <p className="text-[12.5px] text-[#1f2937] leading-relaxed text-justify">
              Hệ thống đang đồng bộ dữ liệu phiên làm việc mới nhất. Bạn có thể bấm nút bên dưới để làm mới trang hoặc đăng nhập lại.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[12px] font-bold transition shadow-xs cursor-pointer"
              >
                Làm mới trang
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.ApiClient) window.ApiClient.clearToken();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg text-[12px] font-bold transition cursor-pointer"
              >
                Đăng nhập lại
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// App Main Router Component
const AppInner = () => {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [authChecking, setAuthChecking] = React.useState(true);
  const [activeSemester, setActiveSemester] = React.useState('hk1_2026_2027');

  React.useEffect(() => {
    if (window.ApiClient && window.ApiClient.initFirestoreSync) {
      window.ApiClient.initFirestoreSync();
    }
    const token = window.ApiClient?.getToken ? window.ApiClient.getToken() : null;
    if (token) {
      window.ApiClient.getMe()
        .then(res => {
          const u = res?.user || (res?.role ? res : null);
          if (u && u.role) {
            setCurrentUser(u);
            if (u.role === 'student' && u.isEnrolledThisSemester === false) {
              setActiveTab('handbook');
            }
          } else {
            const saved = window.ApiClient.getSavedUser();
            if (saved && saved.role) {
              setCurrentUser(saved);
            } else {
              window.ApiClient.clearToken();
              setCurrentUser(null);
            }
          }
        })
        .catch(() => {
          const saved = window.ApiClient.getSavedUser();
          if (saved && saved.role) {
            setCurrentUser(saved);
          } else {
            window.ApiClient.clearToken();
            setCurrentUser(null);
          }
        })
        .finally(() => setAuthChecking(false));
    } else {
      setAuthChecking(false);
    }
  }, []);

  // Bảo vệ phân quyền chuyển tab nghiêm ngặt theo Ma trận Số nguyên tố (Prime RBAC)
  React.useEffect(() => {
    if (!currentUser) return;
    
    const isAdmin = currentUser.email === 'phamvanc@tdtu.edu.vn' || (Boolean(currentUser.isAdmin) && currentUser.email !== 'nguyenvana@tdtu.edu.vn');
    const roleKey = window.PrimeRbac?.getUserRoleKey?.(currentUser) || (isAdmin ? 'thay_phuc' : (currentUser.role === 'student' ? 'sv_trong_ky' : 'giang_vien'));
    const isLecturer = roleKey === 'giang_vien' || (!isAdmin && currentUser.role === 'lecturer') || currentUser.email === 'nguyenvana@tdtu.edu.vn';
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
      const isAdm = currentUser.isAdmin || currentUser.role === 'admin' || currentUser.email === 'phamvanc@tdtu.edu.vn';
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
    let validUser = user?.user || (user?.role ? user : null);
    if (!validUser || !validUser.role) {
      const saved = window.ApiClient.getSavedUser();
      validUser = (saved && saved.role) ? saved : {
        name: 'Nguyễn Hữu Nhân',
        email: '522h0045@student.tdtu.edu.vn',
        studentId: '522H0045',
        role: 'student',
        isEnrolledThisSemester: true
      };
    }
    if (token) window.ApiClient.setToken(token);
    setCurrentUser(validUser);
    if (validUser.role === 'student' && validUser.isEnrolledThisSemester === false) {
      setActiveTab('handbook');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    if (window.ApiClient) window.ApiClient.clearToken();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleSwitchUser = async (email, name) => {
    try {
      const res = await window.ApiClient.loginGoogleSso(email, name);
      const user = res?.user || (res?.role ? res : null);
      const token = res?.token || window.ApiClient.getToken();
      if (user && user.role) {
        if (token) window.ApiClient.setToken(token);
        setCurrentUser(user);
        if (user.role === 'student' && user.isEnrolledThisSemester === false) {
          setActiveTab('handbook');
        } else {
          setActiveTab('dashboard');
        }
      }
    } catch (err) {
      console.error('Error switching user:', err);
    }
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
      />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH (HEADER + SCROLLABLE BODY) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <window.Navbar
          currentUser={currentUser}
          activeSemester={activeSemester}
          onSemesterChange={setActiveSemester}
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 lg:px-6 bg-white w-full">
          <div className="w-full">
            {activeTab === 'dashboard' && (
              <window.DashboardPage
                activeSemester={activeSemester}
                onSemesterChange={setActiveSemester}
                currentUser={currentUser}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'profile' && (
              <window.ProfilePage
                currentUser={currentUser}
                onNavigateTab={setActiveTab}
                onSemesterChange={setActiveSemester}
              />
            )}
            
            {activeTab === 'declaration' && (
              <window.DeclarationPage currentUser={currentUser} onNavigateTab={setActiveTab} />
            )}

            {activeTab === 'students' && (
              window.StudentsPage ? (
                <window.StudentsPage
                  currentUser={currentUser}
                  activeSemester={activeSemester}
                  onSemesterChange={setActiveSemester}
                />
              ) : (
                <div className="p-8 text-center text-[#1f2937] font-bold">
                  Đang tải trang Quản lý sinh viên...
                </div>
              )
            )}

            {activeTab === 'certs' && currentUser?.role !== 'partner' && (
              <window.CertificatesPage currentUser={currentUser} />
            )}

            {activeTab === 'bulletin' && (
              <window.BulletinPage currentUser={currentUser} />
            )}

            {activeTab === 'email_jd' && (
              <window.EmailJdPage currentUser={currentUser} onNavigateTab={setActiveTab} />
            )}

            {activeTab === 'semesters' && (
              <window.SemestersPage currentUser={currentUser} onNavigateTab={setActiveTab} />
            )}

            {activeTab === 'import' && (
              <window.ImportDataPage currentUser={currentUser} onNavigateTab={setActiveTab} />
            )}

            {activeTab === 'export' && (
              <window.DocumentsPage currentUser={currentUser} onNavigateTab={setActiveTab} />
            )}

            {activeTab === 'documents' && (
              <window.DocumentsPage currentUser={currentUser} onNavigateTab={setActiveTab} />
            )}

            {activeTab === 'accounts' && (currentUser?.isAdmin || currentUser?.role === 'admin' || currentUser?.email === 'phamvanc@tdtu.edu.vn') && (
              <window.AccountsPage currentUser={currentUser} />
            )}

            {activeTab === 'handbook' && (
              <window.HandbookPage currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <AppInner />
  </ErrorBoundary>
);

window.App = App;
