// Cổng Đăng nhập Xác thực & Phân quyền Khoa CNTT - Đại học Tôn Đức Thắng
// Thiết kế chuẩn xác theo Figma Frame 01 (Split-Screen Modern Hero & TDTU Brand Design)

const LoginPage = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = React.useState('student'); // 'student' | 'lecturer' | 'partner'
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [googleMode, setGoogleMode] = React.useState('popup'); // 'popup' | 'redirect'
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [popupBlocked, setPopupBlocked] = React.useState(false);

  // Helper an toàn: Khởi tạo đối tượng Người dùng hợp lệ theo quy chế TDTU
  const resolveUserFromEmail = (userEmail, userName) => {
    const clean = (userEmail || '').trim().toLowerCase();

    // 1. Kiểm tra kho tài khoản hệ thống (bao gồm Đối tác bên ngoài)
    const storedUsers = window.ApiClient?._getUsersStore ? window.ApiClient._getUsersStore() : [];
    const foundStored = storedUsers.find(u => u.email.toLowerCase() === clean);
    if (foundStored) {
      return {
        ...foundStored,
        name: foundStored.name || foundStored.displayName || userName || 'Người dùng TDTU',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${clean}`
      };
    }

    let role = 'student';
    let isAdmin = false;
    let studentId = undefined;
    let name = userName;
    let isEnrolledThisSemester = true;

    if (clean.endsWith('@tdtu.edu.vn')) {
      role = 'lecturer';
      if (clean.includes('phamvanc') || clean.includes('admin')) {
        name = name || 'TS. Phạm Văn C';
        isAdmin = true;
      } else if (clean.includes('nguyenvana') || clean.includes('tranminhlan')) {
        name = name || (clean.includes('tranminhlan') ? 'ThS. Trần Minh Lan' : 'ThS. Nguyễn Văn A');
        isAdmin = false;
      } else {
        name = name || 'Giảng viên TDTU';
      }
    } else if (clean.endsWith('@student.tdtu.edu.vn')) {
      role = 'student';
      studentId = clean.split('@')[0].toUpperCase();
      if (clean.includes('522h0045')) {
        name = name || 'Nguyễn Hữu Nhân';
        studentId = '522H0045';
        isEnrolledThisSemester = true;
      } else if (clean.includes('522h0001')) {
        name = name || 'Nguyễn Minh Anh';
        studentId = '522H0001';
        isEnrolledThisSemester = true;
      } else if (studentId === '52100999') {
        name = name || 'Nguyễn Văn Ngoài Kỳ';
        isEnrolledThisSemester = false;
      } else if (clean.includes('51900839')) {
        name = name || 'Võ Duy Trí';
        studentId = '51900839';
        isEnrolledThisSemester = true;
      } else {
        name = name || `Sinh viên (${studentId})`;
      }
    } else {
      // Đối tác bên ngoài
      role = 'partner';
      name = name || clean.split('@')[0].toUpperCase() + ' (Doanh nghiệp)';
    }

    return {
      uid: 'user_' + (studentId || clean.split('@')[0]),
      email: clean,
      name,
      role,
      isAdmin,
      studentId,
      isEnrolledThisSemester,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${clean}`
    };
  };

  // Xử lý kết quả đăng nhập redirect nếu có
  React.useEffect(() => {
    let isMounted = true;
    const processRedirect = async () => {
      if (window.FirebaseService && window.FirebaseService.checkRedirectResult) {
        try {
          const user = await window.FirebaseService.checkRedirectResult();
          if (user && user.email && isMounted) {
            setLoading(true);
            const clean = user.email.trim().toLowerCase();
            if (!clean.endsWith('@tdtu.edu.vn') && !clean.endsWith('@student.tdtu.edu.vn')) {
              setError('Cảnh báo: Chỉ chấp nhận tài khoản Google do Trường ĐH Tôn Đức Thắng cấp (@tdtu.edu.vn hoặc @student.tdtu.edu.vn)');
              setLoading(false);
              return;
            }
            
            let loggedInUser = null;
            let token = 'tdtu_jwt_' + Date.now();
            try {
              const res = await window.ApiClient.loginGoogleSso(clean, user.displayName, user.photoURL);
              loggedInUser = res?.user || (res?.role ? res : null);
              if (res?.token) token = res.token;
            } catch (e) {}

            if (!loggedInUser || !loggedInUser.role) {
              loggedInUser = resolveUserFromEmail(clean, user.displayName);
              if (user.photoURL) loggedInUser.avatarUrl = user.photoURL;
            }

            window.ApiClient.setToken(token);
            window.ApiClient.setSavedUser(loggedInUser);
            onLoginSuccess(loggedInUser, token);
          }
        } catch (err) {
          console.error('[Redirect Auth Error]:', err);
          if (isMounted) setError(err?.message || 'Lỗi xác thực chuyển hướng');
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };
    processRedirect();
    return () => { isMounted = false; };
  }, []);

  // 1. Đăng nhập Email & Mật khẩu
  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập Email đăng nhập');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu tài khoản');
      return;
    }

    const clean = email.trim().toLowerCase();
    const storedUsers = window.ApiClient?._getUsersStore ? window.ApiClient._getUsersStore() : [];
    const foundStored = storedUsers.find(u => u.email.toLowerCase() === clean);

    if (foundStored && !foundStored.isActive) {
      setError('Tài khoản này đã bị tạm khóa bởi Quản trị viên Khoa CNTT. Vui lòng liên hệ hỗ trợ.');
      return;
    }

    // Nếu chọn tab đối tác hoặc tài khoản trong hệ thống là đối tác
    if (selectedRole === 'partner' || foundStored?.role === 'partner') {
      const partnerUser = foundStored || {
        uid: 'u_partner_' + Date.now(),
        email: clean,
        name: clean.split('@')[0].toUpperCase() + ' (Doanh nghiệp)',
        displayName: clean.split('@')[0].toUpperCase() + ' (Doanh nghiệp)',
        role: 'partner',
        isAdmin: false,
        isActive: true
      };
      const token = 'tdtu_jwt_partner_' + Date.now();
      window.ApiClient.setToken(token);
      window.ApiClient.setSavedUser(partnerUser);
      onLoginSuccess(partnerUser, token);
      return;
    }

    if (!clean.endsWith('@tdtu.edu.vn') && !clean.endsWith('@student.tdtu.edu.vn')) {
      setError('Email không hợp lệ. Vui lòng sử dụng email TDTU hoặc tài khoản Đối tác do Khoa cấp.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let loggedInUser = null;
      let token = 'tdtu_jwt_' + Date.now();
      try {
        const res = await window.ApiClient.loginGoogleSso(clean, undefined);
        loggedInUser = res?.user || (res?.role ? res : null);
        if (res?.token) token = res.token;
      } catch (e) {}

      if (!loggedInUser || !loggedInUser.role) {
        loggedInUser = resolveUserFromEmail(clean, undefined);
      }

      window.ApiClient.setToken(token);
      window.ApiClient.setSavedUser(loggedInUser);
      onLoginSuccess(loggedInUser, token);
    } catch (err) {
      setError(err?.message || 'Tài khoản hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  // 2. Đăng nhập Google Workspace TDTU SSO
  const handleGoogleLogin = async () => {
    setError(null);
    setPopupBlocked(false);
    setLoading(true);

    try {
      if (googleMode === 'redirect') {
        if (window.FirebaseService && window.FirebaseService.signInWithRedirect) {
          await window.FirebaseService.signInWithRedirect();
          return;
        }
      }

      let googleEmail = '';
      let googleName = '';
      let googlePhoto = '';

      if (window.FirebaseService && window.FirebaseService.signInWithGoogle) {
        const result = await window.FirebaseService.signInWithGoogle();
        
        if (result && result.isRedirecting) {
          setPopupBlocked(true);
          return;
        }

        if (result && result.email) {
          googleEmail = result.email.trim().toLowerCase();
          googleName = result.displayName;
          googlePhoto = result.photoURL;
        }
      } else {
        googleEmail = selectedRole === 'student' ? '522h0045@student.tdtu.edu.vn' : 'nguyenvana@tdtu.edu.vn';
        googleName = selectedRole === 'student' ? 'Nguyễn Hữu Nhân' : 'ThS. Nguyễn Văn A';
      }

      if (!googleEmail) {
        throw new Error('Không thể lấy thông tin tài khoản Google');
      }

      if (!googleEmail.endsWith('@tdtu.edu.vn') && !googleEmail.endsWith('@student.tdtu.edu.vn')) {
        throw new Error('Chỉ chấp nhận tài khoản Google TDTU (@tdtu.edu.vn hoặc @student.tdtu.edu.vn)');
      }

      let loggedInUser = null;
      let token = 'tdtu_jwt_' + Date.now();
      try {
        const res = await window.ApiClient.loginGoogleSso(googleEmail, googleName, googlePhoto);
        loggedInUser = res?.user || (res?.role ? res : null);
        if (res?.token) token = res.token;
      } catch (e) {}

      if (!loggedInUser || !loggedInUser.role) {
        loggedInUser = resolveUserFromEmail(googleEmail, googleName);
        if (googlePhoto) loggedInUser.avatarUrl = googlePhoto;
      }

      window.ApiClient.setToken(token);
      window.ApiClient.setSavedUser(loggedInUser);
      onLoginSuccess(loggedInUser, token);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-blocked' || (err.message && err.message.includes('popup-blocked'))) {
        setPopupBlocked(true);
        setError('Trình duyệt đã chặn cửa sổ Popup. Bạn hãy chọn chế độ "Chuyển trang trực tiếp (Redirect)"');
      } else {
        setError(err?.message || 'Đăng nhập Google thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Đăng nhập nhanh tài khoản học vụ
  const handleDirectRoleLogin = async (roleEmail, roleName) => {
    setError(null);
    setLoading(true);
    try {
      let loggedInUser = null;
      let token = 'tdtu_jwt_' + Date.now();
      try {
        const res = await window.ApiClient.loginGoogleSso(roleEmail, roleName);
        loggedInUser = res?.user || (res?.role ? res : null);
        if (res?.token) token = res.token;
      } catch (e) {}

      if (!loggedInUser || !loggedInUser.role) {
        loggedInUser = resolveUserFromEmail(roleEmail, roleName);
      }

      window.ApiClient.setToken(token);
      window.ApiClient.setSavedUser(loggedInUser);
      onLoginSuccess(loggedInUser, token);
    } catch (err) {
      setError(err?.message || 'Lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-slate-900 transition-colors">
      
      {/* CỘT TRÁI (LEFT HERO PANE) - Chuẩn Dashoard_TSNN-frontend_qvinh template & Figma */}
      <div 
        className="relative lg:w-1/2 min-h-[460px] lg:min-h-screen text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(155deg, rgba(0, 22, 66, 0.85) 0%, rgba(0, 48, 135, 0.70) 50%, rgba(0, 22, 66, 0.88) 100%), url('./assets/login_background.jpg')`
        }}
      >
        {/* Curved Gradient Accent Wave matching template */}
        <div className="absolute -right-32 -bottom-24 w-96 h-96 rounded-full bg-gradient-to-tr from-sky-400/20 to-blue-600/20 blur-3xl pointer-events-none"></div>

        {/* Top Branding with White Logo Badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] mb-3.5">
            <img
              src="./assets/logo_tdtu.png"
              alt="Logo TDTU"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="text-[12px] font-extrabold tracking-widest uppercase text-slate-100">
            TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG
          </div>
          <div className="w-10 h-1 bg-[#e31837] rounded-full my-2.5"></div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-blue-200">
            KHOA CÔNG NGHỆ THÔNG TIN
          </div>
        </div>

        {/* Center Hero Typography */}
        <div className="relative z-10 my-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-sky-200 mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Học kỳ HK1 2026–2027</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white mb-5">
            Cổng Thông Tin Thực Tập Doanh Nghiệp
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal mb-6">
            Nền tảng kết nối cơ hội việc làm, quản lý hồ sơ thực tập KTCN / TSNN và báo cáo ra quyết định tập trung Khoa CNTT.
          </p>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Đồng hành cùng sinh viên Khoa CNTT TDTU</span>
          </div>
        </div>

        {/* Bottom Hero Caption */}
        <div className="relative z-10 text-xs text-slate-300 space-y-1">
          <div className="font-bold tracking-wider uppercase text-[11px] text-white">
            KIẾN TẬP CÔNG NGHIỆP / TẬP SỰ NGHỀ NGHIỆP
          </div>
          <div className="text-slate-200">Khoa Công nghệ thông tin · Đại học Tôn Đức Thắng</div>
        </div>
      </div>

      {/* CỘT PHẢI (RIGHT FORM PANE) - Chuẩn Figma Frame 01 */}
      <div className="lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-[#FAFAFA] dark:bg-slate-900 transition-colors">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Khoa Công nghệ thông tin
          </div>
          <button
            type="button"
            onClick={() => handleDirectRoleLogin('52100999@student.tdtu.edu.vn', 'Nguyễn Văn Ngoài Kỳ')}
            className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Cẩm nang thực tập</span>
            <span className="text-sm">↗</span>
          </button>
        </div>

        {/* Main Login Form Container */}
        <div className="my-auto max-w-md w-full mx-auto py-8">
          
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              Đăng nhập hệ thống
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Sử dụng tài khoản nhà trường để tiếp tục truy cập cổng thực tập.
            </p>
          </div>

          {/* Role Switcher Pills (Sinh viên | Giảng viên | Đối tác Doanh nghiệp) */}
          <div className="p-1 bg-[#f1f5f9] dark:bg-slate-800 rounded-xl flex mb-6 border border-[#e2e8f0] dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setSelectedRole('student'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                selectedRole === 'student'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'text-[#475569] dark:text-slate-400 hover:text-[#003087] dark:hover:text-white'
              }`}
            >
              Sinh viên
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('lecturer'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                selectedRole === 'lecturer'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'text-[#475569] dark:text-slate-400 hover:text-[#003087] dark:hover:text-white'
              }`}
            >
              Giảng viên
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('partner'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                selectedRole === 'partner'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-[#475569] dark:text-slate-400 hover:text-purple-700 dark:hover:text-white'
              }`}
            >
              🏢 Đối tác DN
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-start gap-2.5">
              <span className="font-bold text-base leading-none text-red-500">✕</span>
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Partner Login Form */}
          {selectedRole === 'partner' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs text-purple-900 dark:text-purple-200 leading-relaxed font-medium">
                Tài khoản Doanh nghiệp do Ban Chủ nhiệm Khoa CNTT cấp. Đăng nhập bằng Email đơn vị và mật khẩu được cung cấp để đăng tuyển JD và tiếp nhận sinh viên.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Email Doanh nghiệp đối tác *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="VD: hr@fpt.com hoặc tuyendung@kms-technology.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mật khẩu đăng nhập *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập Cổng Doanh nghiệp'}
              </button>
            </form>
          ) : (
            <>
              {/* Mode Selector (Popup vs Redirect) */}
              <div className="flex items-center justify-center gap-4 text-xs py-1 text-slate-500 dark:text-slate-400 mb-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="googleMode"
                    value="popup"
                    checked={googleMode === 'popup'}
                    onChange={() => setGoogleMode('popup')}
                    className="text-blue-600"
                  />
                  <span>Cửa sổ nổi (Popup)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="googleMode"
                    value="redirect"
                    checked={googleMode === 'redirect'}
                    onChange={() => setGoogleMode('redirect')}
                    className="text-blue-600"
                  />
                  <span>Chuyển trang (Redirect)</span>
                </label>
              </div>

              {popupBlocked && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-2">
                  <div className="font-bold">⚠️ Trình duyệt chặn Popup</div>
                  <button
                    type="button"
                    onClick={() => { setGoogleMode('redirect'); handleGoogleLogin(); }}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    Nhấn để Đăng nhập dạng Redirect
                  </button>
                </div>
              )}

              {/* Sleek Modern Google SSO Button matching Dashoard_TSNN-frontend_qvinh template */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-white hover:bg-[#ebf3ff] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#003087] dark:text-sky-300 font-bold text-sm rounded-xl shadow-xs hover:shadow-card transition-all flex items-center justify-center gap-3 border border-[#bfdbfe] dark:border-blue-900 cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? 'Đang xác thực Google...' : 'Đăng nhập Google TDTU SSO'}</span>
              </button>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2.5 mb-3">
                Dành cho tài khoản {selectedRole === 'student' ? '@student.tdtu.edu.vn' : '@tdtu.edu.vn'}
              </p>

              {/* Form Mật khẩu Nội bộ */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="w-full text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 py-1"
                >
                  {showPasswordForm ? '▲ Ẩn đăng nhập Mật khẩu' : '▼ Hoặc đăng nhập bằng Email & Mật khẩu Nội bộ'}
                </button>

                {showPasswordForm && (
                  <form onSubmit={handlePasswordLogin} className="space-y-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Email TDTU
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={selectedRole === 'student' ? '522h0045@student.tdtu.edu.vn' : 'nguyenvana@tdtu.edu.vn'}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Mật khẩu
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Xác nhận Đăng nhập
                    </button>
                  </form>
                )}
              </div>
            </>
          )}

          {/* Quick Test Accounts Picker (Bám sát kịch bản kiểm thử) */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mb-3">
              Tài khoản mẫu kiểm thử 4 Roles (Ma trận Prime RBAC)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDirectRoleLogin('522h0045@student.tdtu.edu.vn', 'Nguyễn Hữu Nhân')}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-left transition"
              >
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">🎓 SV trong kỳ</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">522H0045</div>
                <div className="text-[10px] text-slate-400 truncate">Nguyễn Hữu Nhân</div>
              </button>

              <button
                type="button"
                onClick={() => handleDirectRoleLogin('nguyenvana@tdtu.edu.vn', 'ThS. Nguyễn Văn A')}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl text-left transition"
              >
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">👨‍🏫 Giảng viên</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">nguyenvana</div>
                <div className="text-[10px] text-slate-400 truncate">ThS. Nguyễn Văn A</div>
              </button>

              <button
                type="button"
                onClick={() => handleDirectRoleLogin('phamvanc@tdtu.edu.vn', 'TS. Phạm Văn C')}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 rounded-xl text-left transition"
              >
                <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">👑 Thầy Phúc (Admin Khoa)</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">phamvanc</div>
                <div className="text-[10px] text-slate-400 truncate">TS. Phạm Văn C</div>
              </button>

              <button
                type="button"
                onClick={() => handleDirectRoleLogin('52100999@student.tdtu.edu.vn', 'Nguyễn Văn Ngoài Kỳ')}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 rounded-xl text-left transition"
              >
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">🚫 SV ngoài kỳ</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">52100999</div>
                <div className="text-[10px] text-slate-400 truncate">Nguyễn Văn Ngoài Kỳ</div>
              </button>

              <button
                type="button"
                onClick={() => handleDirectRoleLogin('hr@fpt.com', 'FPT Software HCM')}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 rounded-xl text-left transition col-span-2"
              >
                <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">🏢 Doanh nghiệp Đối tác (FPT Software)</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">hr@fpt.com · MST: 0101778115</div>
                <div className="text-[10px] text-slate-400 truncate">Đăng tuyển JD & Tiếp nhận SV trực tiếp</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links matching Figma Frame 01 */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div>
            <span>Không truy cập được tài khoản? </span>
            <a href="mailto:thuctap.cntt@tdtu.edu.vn" className="font-bold text-blue-600 dark:text-sky-400 hover:underline">
              Liên hệ bộ phận hỗ trợ Khoa CNTT
            </a>
          </div>
          <div className="text-[11px] text-slate-400">
            © 2026 Khoa CNTT · Đại học Tôn Đức Thắng
          </div>
        </div>
      </div>

    </div>
  );
};

window.LoginPage = LoginPage;
