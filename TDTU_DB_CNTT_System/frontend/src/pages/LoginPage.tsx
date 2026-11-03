// Cổng Đăng nhập Xác thực & Phân quyền Khoa CNTT - Đại học Tôn Đức Thắng
// Chuẩn thiết kế Enterprise Design System: Trắng (#ffffff), Xanh dương (#003087), Đỏ (#dc2626)
// Màu chữ: Đen (#1f2937) và Đỏ (#dc2626)

const LoginPage = ({ onLoginSuccess }) => {
  const [activeLoginTab, setActiveLoginTab] = React.useState('sso'); // 'sso' | 'credential'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Kiểm tra tên miền bắt buộc của Trường ĐH Tôn Đức Thắng
  const isStrictTdtuEmail = (userEmail) => {
    const clean = String(userEmail || '').trim().toLowerCase();
    return clean.endsWith('@tdtu.edu.vn') || clean.endsWith('@student.tdtu.edu.vn');
  };

  // Helper: Khởi tạo đối tượng Người dùng hợp lệ theo quy chế TDTU (chỉ sau khi đã xác thực thành công)
  const resolveUserFromEmail = (userEmail, userName) => {
    const clean = String(userEmail || '').trim().toLowerCase();
    if (!isStrictTdtuEmail(clean)) {
      throw new Error(
        `Từ chối truy cập: Hệ thống chỉ chấp nhận email nội bộ Trường ĐH Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn).`
      );
    }

    const storedUsers = window.ApiClient?._getUsersStore ? window.ApiClient._getUsersStore() : [];
    const foundStored = storedUsers.find(u => String(u.email || '').toLowerCase() === clean);
    if (foundStored) {
      if (foundStored.isActive === false) {
        throw new Error('Tài khoản này đã bị khóa bởi Quản trị viên Khoa CNTT.');
      }
      return {
        ...foundStored,
        email: clean,
        name: foundStored.name || foundStored.displayName || userName || 'Người dùng TDTU',
        avatarUrl: foundStored.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${clean}`
      };
    }

    let role = 'student';
    let isAdmin = false;
    let studentId = undefined;
    let name = userName;
    let isEnrolledThisSemester = true;

    if (clean.endsWith('@tdtu.edu.vn')) {
      role = 'lecturer';
      if (clean === 'phamvanc@tdtu.edu.vn' || clean === 'thayphuc@tdtu.edu.vn' || clean === 'admin@tdtu.edu.vn') {
        name = name || (clean.includes('thayphuc') ? 'TS. BCN Khoa CNTT' : 'TS. Phạm Văn C');
        isAdmin = true;
      } else if (clean.includes('nguyenvana') || clean.includes('tranminhlan') || clean.includes('tranvanb')) {
        name = name || (clean.includes('tranminhlan') ? 'ThS. Trần Minh Lan' : (clean.includes('tranvanb') ? 'TS. Trần Văn B' : 'ThS. Nguyễn Văn A'));
        isAdmin = false;
      } else {
        name = name || 'Giảng viên TDTU';
        isAdmin = false;
      }
    } else if (clean.endsWith('@student.tdtu.edu.vn')) {
      role = 'student';
      studentId = clean.split('@')[0].toUpperCase();
      if (studentId === '522H0045') {
        name = name || 'Nguyễn Hữu Nhân';
        isEnrolledThisSemester = true;
      } else if (studentId === '522H0001') {
        name = name || 'Nguyễn Minh Anh';
        isEnrolledThisSemester = true;
      } else if (studentId === '522H0002') {
        name = name || 'Trần Hoàng Nam';
        isEnrolledThisSemester = true;
      } else if (studentId === '52100999' || clean.includes('chuadk') || clean.includes('ngoaiky')) {
        name = name || 'Nguyễn Văn Ngoài Kỳ';
        studentId = '52100999';
        isEnrolledThisSemester = false;
      } else if (studentId === '51900839') {
        name = name || 'Võ Duy Trí';
        isEnrolledThisSemester = true;
      } else {
        name = name || `Sinh viên (${studentId})`;
        isEnrolledThisSemester = true;
      }
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

  // Kiểm tra kết quả Redirect từ Google SSO (nếu trình duyệt chặn popup trước đó)
  React.useEffect(() => {
    let mounted = true;
    const handleRedirectCheck = async () => {
      if (!window.FirebaseService?.checkRedirectResult) return;
      try {
        const redirectRes = await window.FirebaseService.checkRedirectResult();
        if (!mounted || !redirectRes) return;
        const gUser = redirectRes.user || (redirectRes.email ? redirectRes : null);
        if (gUser && gUser.email) {
          const cleanEmail = gUser.email.trim().toLowerCase();
          if (!isStrictTdtuEmail(cleanEmail)) {
            if (window.FirebaseService?.signOut) await window.FirebaseService.signOut();
            window.ApiClient?.clearToken?.();
            setError(
              `Từ chối truy cập: Hệ thống chỉ cho phép đăng nhập bằng tài khoản Google nội bộ của Trường ĐH Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn). Tài khoản "${cleanEmail}" không được phép truy cập.`
            );
            return;
          }
          const apiRes = await window.ApiClient.loginGoogleSso(cleanEmail, gUser.displayName, gUser.photoURL);
          const loggedInUser = apiRes?.user || (apiRes?.role ? apiRes : resolveUserFromEmail(cleanEmail, gUser.displayName));
          const token = apiRes?.token || window.ApiClient.getToken();
          onLoginSuccess(loggedInUser, token);
        }
      } catch (err) {
        if (mounted && err?.message) {
          setError(err.message);
        }
      }
    };
    handleRedirectCheck();
    return () => { mounted = false; };
  }, []);

  // Đăng nhập Google SSO (Chỉ chấp nhận @tdtu.edu.vn và @student.tdtu.edu.vn - Không bao giờ tự nhảy sang tài khoản kiểm thử)
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!window.FirebaseService?.signInWithGoogle) {
        throw new Error('Dịch vụ xác thực Google SSO chưa sẵn sàng. Vui lòng sử dụng tab "Tài khoản Nội bộ TDTU" để đăng nhập bằng Email và Mật khẩu.');
      }

      const authResult = await window.FirebaseService.signInWithGoogle();
      if (authResult?.isRedirecting) {
        return;
      }

      const googleUser = authResult?.user || (authResult?.email ? authResult : null);
      if (!googleUser || !googleUser.email) {
        throw new Error('Không nhận được thông tin xác thực từ Google. Vui lòng thử lại.');
      }

      const cleanEmail = googleUser.email.toLowerCase().trim();
      if (!isStrictTdtuEmail(cleanEmail)) {
        if (window.FirebaseService?.signOut) {
          await window.FirebaseService.signOut();
        }
        window.ApiClient?.clearToken?.();
        setError(
          `Từ chối truy cập: Hệ thống chỉ cho phép đăng nhập bằng tài khoản Google nội bộ của Trường ĐH Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn). Tài khoản "${cleanEmail}" không thuộc tổ chức TDTU.`
        );
        setLoading(false);
        return;
      }

      const apiRes = await window.ApiClient.loginGoogleSso(cleanEmail, googleUser.displayName, googleUser.photoURL);
      let loggedInUser = apiRes?.user || (apiRes?.role ? apiRes : null);
      const token = apiRes?.token || window.ApiClient.getToken();

      if (!loggedInUser || !loggedInUser.role) {
        loggedInUser = resolveUserFromEmail(cleanEmail, googleUser.displayName);
        if (googleUser.photoURL) loggedInUser.avatarUrl = googleUser.photoURL;
      }

      window.ApiClient.setSavedUser(loggedInUser);
      if (token) window.ApiClient.setToken(token);
      onLoginSuccess(loggedInUser, token);
    } catch (err) {
      console.warn('[Google SSO Warning]:', err);
      window.ApiClient?.clearToken?.();
      setError(err?.message || 'Xác thực Google SSO thất bại. Vui lòng sử dụng tài khoản @tdtu.edu.vn hoặc @student.tdtu.edu.vn.');
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập Email & Mật khẩu nội bộ TDTU (Kiểm tra nghiêm ngặt tên miền TDTU và mật khẩu)
  const handlePasswordLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    if (!clean || !rawPassword) {
      setError('Vui lòng nhập đầy đủ Email TDTU và Mật khẩu.');
      return;
    }

    if (!isStrictTdtuEmail(clean)) {
      setError(
        `Từ chối truy cập: Chỉ chấp nhận tài khoản thuộc tên miền @tdtu.edu.vn (Giảng viên / Quản trị) hoặc @student.tdtu.edu.vn (Sinh viên). Email "${clean}" không hợp lệ.`
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!window.ApiClient?.login) {
        throw new Error('Hệ thống xác thực đang bảo trì. Vui lòng thử lại.');
      }

      const res = await window.ApiClient.login(clean, rawPassword);
      const loggedInUser = res?.user || (res?.role ? res : null);
      const token = res?.token || window.ApiClient.getToken();

      if (!loggedInUser || !loggedInUser.role || !isStrictTdtuEmail(loggedInUser.email)) {
        throw new Error('Thông tin tài khoản hoặc mật khẩu không hợp lệ.');
      }

      onLoginSuccess(loggedInUser, token);
    } catch (err) {
      window.ApiClient?.clearToken?.();
      setError(err?.message || 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      
      {/* 1. CỘT TRÁI: INSTITUTIONAL BRAND HERO PANE */}
      <div 
        className="relative lg:w-1/2 min-h-[460px] lg:min-h-screen text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(150deg, rgba(0, 30, 90, 0.94) 0%, rgba(0, 48, 135, 0.88) 55%, rgba(0, 15, 50, 0.96) 100%), url('./src/assets/login_background.jpg')`
        }}
      >
        {/* Top Branding Crest */}
        <div className="relative z-10">
          <div className="inline-flex items-center px-4 py-2.5 bg-white rounded-xl shadow-md mb-4">
            <img
              src="./src/assets/logo_tdtu.png"
              alt="Logo TDTU"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="text-[13px] font-bold tracking-wider uppercase text-white">
            TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG
          </div>
          <div className="w-12 h-1 bg-[#dc2626] rounded-full my-2.5"></div>
          <div className="text-[12px] font-bold tracking-wider uppercase text-blue-200">
            KHOA CÔNG NGHỆ THÔNG TIN
          </div>
        </div>

        {/* Center Main Slogan */}
        <div className="relative z-10 my-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-[12px] font-bold text-white mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>
            <span>Học kỳ HK1 2026–2027</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-white mb-4 text-left">
            Cổng Thông Tin Thực Tập Doanh Nghiệp
          </h1>
          <p className="text-[14px] text-white/95 leading-relaxed font-normal mb-6 text-justify">
            Hệ thống điều phối, quản lý hồ sơ và hỗ trợ ra quyết định toàn diện cho học phần Thực tập doanh nghiệp và Kiến tập công nghiệp (TSNN & KTCN) Khoa CNTT TDTU.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="text-[15px] font-bold text-white">100+ Đối tác</div>
              <div className="text-[12px] text-blue-100 font-medium">Doanh nghiệp công nghệ liên kết</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="text-[15px] font-bold text-white">Chuẩn AUN-QA</div>
              <div className="text-[12px] text-blue-100 font-medium">Kiểm định chất lượng học vụ</div>
            </div>
          </div>
        </div>

        {/* Bottom Hero Caption */}
        <div className="relative z-10 text-[12.5px] text-white/85 space-y-1">
          <div className="font-bold tracking-wider uppercase text-white">
            KHOA CÔNG NGHỆ THÔNG TIN · TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG
          </div>
          <div>Số 19 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh</div>
        </div>
      </div>

      {/* 2. CỘT PHẢI: FOCUSED ENTERPRISE LOGIN FORM */}
      <div className="lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-white">
        
        {/* Top Mini Nav */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e7eb]">
          <div className="text-[12.5px] font-bold text-[#1f2937] uppercase tracking-wider">
            Cổng Dịch Vụ Học Vụ
          </div>
          <div className="text-[12.5px] font-bold text-[#003087] inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#003087]"></span>
            <span>Xác thực Tập trung TDTU</span>
          </div>
        </div>

        {/* Center Login Container */}
        <div className="my-auto max-w-md w-full mx-auto py-8">
          
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1f2937] mb-2 tracking-tight text-left">
              Đăng nhập hệ thống
            </h2>
            <p className="text-[14px] text-[#4b5563] text-justify leading-relaxed">
              Vui lòng đăng nhập bằng tài khoản nội bộ do Trường Đại học Tôn Đức Thắng cấp (@tdtu.edu.vn hoặc @student.tdtu.edu.vn) để truy cập hệ thống.
            </p>
          </div>

          {/* Segmented Login Tabs */}
          <div className="p-1 bg-[#f8fafc] rounded-xl flex mb-6 border border-[#e5e7eb]">
            <button
              type="button"
              onClick={() => { setActiveLoginTab('sso'); setError(null); }}
              className={`flex-1 py-2.5 text-[13.5px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLoginTab === 'sso'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'text-[#1f2937] hover:text-[#003087]'
              }`}
            >
              Google TDTU SSO
            </button>
            <button
              type="button"
              onClick={() => { setActiveLoginTab('credential'); setError(null); }}
              className={`flex-1 py-2.5 text-[13.5px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLoginTab === 'credential'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'text-[#1f2937] hover:text-[#003087]'
              }`}
            >
              Tài khoản Nội bộ TDTU
            </button>
          </div>

          {/* Error Alert Box (Màu Đỏ theo quy chuẩn) */}
          {error && (
            <div className="mb-5 p-3.5 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-[13px] font-bold rounded-xl flex items-start gap-2.5">
              <span className="font-bold text-base leading-none text-[#dc2626]">✕</span>
              <div className="flex-1 text-justify leading-relaxed">{error}</div>
            </div>
          )}

          {/* TAB 1: GOOGLE TDTU SSO */}
          {activeLoginTab === 'sso' ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#ebf3ff] border border-[#bfdbfe] rounded-xl text-[13px] text-[#1f2937] text-justify leading-relaxed">
                Đăng nhập xác thực Google chỉ dành cho tài khoản thuộc tổ chức Trường Đại học Tôn Đức Thắng:
                <strong className="block text-[#003087] mt-1">
                  @student.tdtu.edu.vn (Sinh viên) hoặc @tdtu.edu.vn (Giảng viên / BCN Khoa)
                </strong>
                <span className="block text-[12px] text-[#dc2626] font-semibold mt-1">
                  * Các tài khoản Gmail cá nhân (@gmail.com) hoặc ngoài TDTU sẽ bị từ chối truy cập.
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#003087] hover:bg-[#002266] text-white font-bold text-[14px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-3 border border-[#003087] cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? 'Đang xác thực Google TDTU...' : 'Đăng nhập bằng Google TDTU SSO'}</span>
              </button>
            </div>
          ) : (
            /* TAB 2: EMAIL & PASSWORD CREDENTIALS */
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="p-3.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-[13px] text-[#4b5563] leading-relaxed text-justify">
                Đăng nhập bằng tài khoản Email nội bộ TDTU (<strong className="text-[#003087]">@tdtu.edu.vn</strong> hoặc <strong className="text-[#003087]">@student.tdtu.edu.vn</strong>) và mật khẩu được Khoa CNTT cấp.
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#1f2937] uppercase mb-1">
                  Email nội bộ TDTU *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="VD: phamvanc@tdtu.edu.vn hoặc 522h0045@student.tdtu.edu.vn"
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#1f2937] uppercase mb-1">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu tài khoản..."
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#003087] hover:bg-[#002266] text-white font-bold text-[14px] rounded-xl transition shadow-xs cursor-pointer"
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
              </button>
            </form>
          )}
        </div>

        {/* Bottom Support Footnote */}
        <div className="pt-4 border-t border-[#e5e7eb] text-center text-[11.5px] text-[#1f2937] space-y-1">
          <div>
            <span>Cần hỗ trợ tài khoản? </span>
            <a href="mailto:thuctap.cntt@tdtu.edu.vn" className="font-bold text-[#003087] hover:underline">
              Liên hệ Văn phòng Khoa CNTT (C004)
            </a>
          </div>
          <div className="font-semibold text-[#1f2937]">
            © 2026 Khoa CNTT · Trường Đại học Tôn Đức Thắng
          </div>
        </div>

      </div>

    </div>
  );
};

window.LoginPage = LoginPage;
