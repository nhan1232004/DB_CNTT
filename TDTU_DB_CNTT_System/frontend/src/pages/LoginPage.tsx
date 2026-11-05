// Cổng Đăng nhập Xác thực & Phân quyền Khoa CNTT - Đại học Tôn Đức Thắng
// Cập nhật UI/UX theo chuẩn referUI/Login.jsx và FRONTEND_SPEC.md
// Đảm bảo đầy đủ logic xác thực nội bộ & Google SSO của TDTU

const LoginPage = ({ onLoginSuccess }) => {
  const [roleTab, setRoleTab] = React.useState('student'); // 'student' | 'lecturer'
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState('');
  const [passwordInput, setPasswordInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Kiểm tra tên miền bắt buộc của Trường ĐH Tôn Đức Thắng
  const isStrictTdtuEmail = (userEmail) => {
    const clean = String(userEmail || '').trim().toLowerCase();
    return clean.endsWith('@tdtu.edu.vn') || clean.endsWith('@student.tdtu.edu.vn');
  };

  // Helper: Khởi tạo đối tượng Người dùng hợp lệ theo quy chế TDTU
  const resolveUserFromEmail = (userEmail, userName) => {
    const clean = String(userEmail || '').trim().toLowerCase();
    if (!isStrictTdtuEmail(clean)) {
      throw new Error(
        `Chỉ chấp nhận email @tdtu.edu.vn hoặc @student.tdtu.edu.vn.`
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
      if (clean === 'duonghuuphuc@tdtu.edu.vn' || clean === 'phamvanc@tdtu.edu.vn' || clean === 'thayphuc@tdtu.edu.vn' || clean === 'admin@tdtu.edu.vn') {
        name = name || (clean === 'duonghuuphuc@tdtu.edu.vn' ? 'GV. Dương Hữu Phúc' : (clean.includes('thayphuc') ? 'GV. BCN Khoa CNTT' : 'GV. Phạm Văn C'));
        isAdmin = true;
      } else if (clean.includes('nguyenvana') || clean.includes('tranminhlan') || clean.includes('tranvanb')) {
        name = name || (clean.includes('tranminhlan') ? 'GV. Trần Minh Lan' : (clean.includes('tranvanb') ? 'GV. Trần Văn B' : 'GV. Nguyễn Văn A'));
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
        try {
          const raw = localStorage.getItem('tdtu_imported_students_hk1_2026_2027') || localStorage.getItem('tdtu_live_students_clean');
          if (raw) {
            const list = JSON.parse(raw);
            isEnrolledThisSemester = Array.isArray(list) && list.some(s => String(s.mssv || s.studentId).toUpperCase() === studentId);
          } else {
            isEnrolledThisSemester = false;
          }
        } catch {
          isEnrolledThisSemester = false;
        }
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
              `Chỉ chấp nhận email @tdtu.edu.vn hoặc @student.tdtu.edu.vn.`
            );
            return;
          }
          let apiRes = null;
          if (window.ApiClient?.loginGoogleSso) {
            apiRes = await window.ApiClient.loginGoogleSso(cleanEmail, gUser.displayName, gUser.photoURL);
          }
          const loggedInUser = apiRes?.user || (apiRes?.role ? apiRes : resolveUserFromEmail(cleanEmail, gUser.displayName));
          const token = apiRes?.token || (window.ApiClient?.getToken ? window.ApiClient.getToken() : 'token_' + Date.now());
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

  // Đăng nhập Google SSO
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!window.FirebaseService?.signInWithGoogle) {
        throw new Error('Dịch vụ xác thực Google SSO chưa sẵn sàng. Vui lòng thử lại hoặc sử dụng Đăng nhập nội bộ.');
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
          `Chỉ chấp nhận email @tdtu.edu.vn hoặc @student.tdtu.edu.vn.`
        );
        setLoading(false);
        return;
      }

      // Kiểm tra tab đăng nhập phù hợp với domain
      if (roleTab === 'student' && !cleanEmail.endsWith('@student.tdtu.edu.vn')) {
        setError(`Tài khoản "${cleanEmail}" là tài khoản Giảng viên / Cán bộ. Vui lòng chuyển sang tab "Giảng viên / Nội bộ" để đăng nhập.`);
        setLoading(false);
        return;
      }

      if (roleTab === 'lecturer' && cleanEmail.endsWith('@student.tdtu.edu.vn')) {
        setError(`Tài khoản "${cleanEmail}" là tài khoản Sinh viên. Vui lòng chuyển sang tab "Sinh viên" để đăng nhập.`);
        setLoading(false);
        return;
      }

      let apiRes = null;
      if (window.ApiClient?.loginGoogleSso) {
        apiRes = await window.ApiClient.loginGoogleSso(cleanEmail, googleUser.displayName, googleUser.photoURL);
      }
      let loggedInUser = apiRes?.user || (apiRes?.role ? apiRes : null);
      const token = apiRes?.token || (window.ApiClient?.getToken ? window.ApiClient.getToken() : 'token_' + Date.now());

      if (!loggedInUser || !loggedInUser.role) {
        loggedInUser = resolveUserFromEmail(cleanEmail, googleUser.displayName);
        if (googleUser.photoURL) loggedInUser.avatarUrl = googleUser.photoURL;
      }

      window.ApiClient?.setSavedUser?.(loggedInUser);
      if (token && window.ApiClient?.setToken) window.ApiClient.setToken(token);
      onLoginSuccess(loggedInUser, token);
    } catch (err) {
      console.warn('[Google SSO Warning]:', err);
      window.ApiClient?.clearToken?.();
      setError(err?.message || 'Đăng nhập Google SSO thất bại hoặc đã bị hủy. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập Email & Mật khẩu nội bộ TDTU
  const handlePasswordLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = String(emailInput || '').trim().toLowerCase();
    const rawPassword = String(passwordInput || '');

    if (!clean || !rawPassword) {
      setError('Vui lòng nhập đầy đủ Email TDTU và Mật khẩu.');
      return;
    }

    if (!isStrictTdtuEmail(clean)) {
      setError(
        `Chỉ chấp nhận email @tdtu.edu.vn hoặc @student.tdtu.edu.vn.`
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'var(--font-main)',
        backgroundColor: '#ffffff',
      }}
      className="flex-col lg:flex-row"
    >
      {/* CỘT TRÁI: HERO BANNER (50%) với login_background.jpg */}
      <div
        className="login-hero-pane w-full lg:w-1/2"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          color: '#ffffff',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(155deg, rgba(0, 22, 66, 0.82) 0%, rgba(0, 48, 135, 0.65) 50%, rgba(0, 22, 66, 0.85) 100%), url('./src/assets/login_background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '420px',
        }}
      >
        {/* Top Branding */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              marginBottom: '14px',
            }}
          >
            <img
              src="./src/assets/logo_tdtu.png"
              alt="Logo TDTU"
              style={{
                height: '42px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>

          <div
            style={{
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ffffff',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            HỆ THỐNG QUẢN LÝ THỰC TẬP & HỌC VỤ
          </div>
          <div
            style={{
              width: '40px',
              height: '3px',
              backgroundColor: '#e31837',
              borderRadius: '2px',
              margin: '8px 0 28px',
            }}
          />

          {/* Slogan */}
          <h1
            style={{
              fontSize: '38px',
              fontWeight: '800',
              lineHeight: 1.25,
              marginBottom: '14px',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
            }}
          >
            Từ giảng đường, đến hành trình nghề nghiệp.
          </h1>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#f1f5f9',
              maxWidth: '480px',
              marginBottom: '28px',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
            }}
          >
            Kết nối cơ hội thực tập cho sinh viên Khoa CNTT.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '440px' }}>
          </div>
        </div>

        {/* Bottom Hero Info */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.25)',
            paddingTop: '16px',
            marginTop: '32px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93c5fd', marginBottom: '4px' }}>
            KIẾN TẬP CÔNG NGHIỆP / TẬP SỰ NGHỀ NGHIỆP
          </div>
          <div style={{ fontSize: '13px', color: '#e2e8f0', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            Khoa Công nghệ thông tin – Đại học Tôn Đức Thắng
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP (50%) */}
      <div
        className="login-form-pane w-full lg:w-1/2"
        style={{
          padding: '40px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Header of Right Pane */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '14px',
            borderBottom: '1px solid #f1f5f9',
            width: '100%',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: '#334155',
              fontWeight: '700',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            Khoa Công nghệ thông tin
          </span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#0052cc',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
            }}
          >
            <span>Cổng Thực tập TSNN & KTCN</span>
          </div>
        </div>

        {/* Center Container: Login Card */}
        <div style={{ maxWidth: '440px', width: '100%', margin: 'auto' }}>
          {/* TDTU Campus Gate Banner */}
          <div style={{ marginBottom: '22px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#0052cc',
                marginBottom: '6px',
              }}
            >
              CỔNG THỰC TẬP CNTT — KHOA CNTT
            </div>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: '800',
                color: '#0f172a',
                margin: '0 0 6px',
                letterSpacing: '-0.02em',
              }}
            >
              Chào mừng bạn trở lại
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Đăng nhập bằng email TDTU.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#b91c1c',
                fontSize: '13px',
                marginBottom: '20px',
                lineHeight: 1.5,
              }}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Role Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '24px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setRoleTab('student');
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '700',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: roleTab === 'student' ? '#ffffff' : 'transparent',
                color: roleTab === 'student' ? '#003087' : '#64748b',
                boxShadow: roleTab === 'student' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Sinh viên
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('lecturer');
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '700',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: roleTab === 'lecturer' ? '#ffffff' : 'transparent',
                color: roleTab === 'lecturer' ? '#003087' : '#64748b',
                boxShadow: roleTab === 'lecturer' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Giảng viên / Nội bộ
            </button>
          </div>

          {/* TAB 1: SINH VIÊN */}
          {roleTab === 'student' && (
            <div className="fade-in">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#0f172a',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s',
                  marginBottom: '10px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                {/* Google Icon */}
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{loading ? 'Đang kết nối SSO...' : 'Đăng nhập bằng Google'}</span>
              </button>

              <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                Sử dụng tài khoản <strong>@student.tdtu.edu.vn</strong>
              </div>

              {/* Informative Security Notice Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '10px',
                  border: '1px solid #bfdbfe',
                  fontSize: '13px',
                  color: '#1e40af',
                  lineHeight: 1.5,
                  marginBottom: '10px',
                }}
              >
                <svg className="w-5 h-5 shrink-0 text-[#2563eb] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>
                  Chỉ chấp nhận email do trường cấp.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: GIẢNG VIÊN / NỘI BỘ */}
          {roleTab === 'lecturer' && (
            <div className="fade-in">
              <form onSubmit={handlePasswordLogin}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Email nhà trường / Mã số GV
                  </label>
                  <input
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="VD: tranvannam@tdtu.edu.vn"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px', position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Mật khẩu
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu nội bộ"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '36px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: 0,
                    }}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#003087', cursor: 'pointer' }} />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ quản trị IT Khoa để đặt lại mật khẩu.'); }}
                    style={{ fontSize: '13px', color: '#0052cc', fontWeight: '600', textDecoration: 'none' }}
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: '#003087',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0, 48, 135, 0.2)',
                    marginBottom: '16px',
                  }}
                >
                  <span>{loading ? 'Đang xác thực...' : 'Đăng nhập nội bộ'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>

              {/* Dòng HOẶC */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                <span style={{ padding: '0 10px', fontSize: '12px', color: '#94a3b8' }}>HOẶC</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              </div>

              {/* Google SSO cho giảng viên */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{loading ? 'Đang kết nối SSO...' : 'Đăng nhập bằng Google'}</span>
              </button>
              <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                Sử dụng tài khoản <strong>@tdtu.edu.vn</strong>
              </div>

              {/* Dòng ghi chú */}
              <div
                style={{
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '20px',
                  paddingTop: '16px',
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                Giảng viên: đăng nhập bằng email @tdtu.edu.vn.
              </div>
            </div>
          )}
        </div>

        {/* Footer of Right Pane */}
        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#64748b' }}>
          <div>Không truy cập được tài khoản?</div>
          <a
            href="mailto:thuctap.cntt@tdtu.edu.vn"
            style={{ color: '#0052cc', fontWeight: '700', textDecoration: 'none' }}
          >
            Liên hệ Văn phòng Khoa CNTT (C004)
          </a>
        </div>
      </div>
    </div>
  );
};

window.LoginPage = LoginPage;
