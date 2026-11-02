// Error Boundary to prevent any blank white screen
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
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-6 text-slate-800 dark:text-slate-200">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-lg w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Đang tải lại Cổng thông tin</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hệ thống đang đồng bộ dữ liệu phiên làm việc mới nhất. Bạn có thể bấm nút bên dưới để làm mới trang.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Làm mới trang
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.ApiClient) window.ApiClient.clearToken();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
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
  const [theme, setTheme] = React.useState(() => localStorage.getItem('tdtu_theme') || 'light');
  const [activeSemester, setActiveSemester] = React.useState('hk1_2026_2027');

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('tdtu_theme', next);
    } catch {}
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  React.useEffect(() => {
    if (window.ApiClient && window.ApiClient.initFirestoreSync) {
      window.ApiClient.initFirestoreSync();
    }
    const token = window.ApiClient.getToken();
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
      const roleKey = window.PrimeRbac?.getUserRoleKey?.(currentUser);
      const isLecturer = roleKey === 'giang_vien' || (!currentUser.isAdmin && currentUser.role === 'lecturer');
      if (isLecturer) {
        setActiveTab('dashboard');
      }
      return;
    }
    if (featKey === 'accounts') {
      const isAdmin = currentUser.isAdmin || currentUser.role === 'admin' || currentUser.email === 'phamvanc@tdtu.edu.vn';
      if (!isAdmin) setActiveTab('dashboard');
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
    window.ApiClient.clearToken();
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B3C5D] dark:border-[#E0A96D] mr-3"></div>
        <span>Đang kiểm tra phiên làm việc TDTU...</span>
      </div>
    );
  }

  // If not logged in, render the dedicated LoginPage
  if (!currentUser) {
    return <window.LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-900 text-slate-100' : 'bg-[#f0f4f8] text-[#0f172a]'} flex flex-col font-sans transition-colors duration-200`}>
      <window.Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        activeSemester={activeSemester}
        onSemesterChange={setActiveSemester}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="flex-1 flex overflow-hidden">
        <window.Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
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
            <window.StudentsPage
              currentUser={currentUser}
              activeSemester={activeSemester}
              onSemesterChange={setActiveSemester}
            />
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
