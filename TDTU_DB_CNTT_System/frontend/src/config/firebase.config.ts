// Firebase Configuration & Authentication & Firestore Initialization - TDTU Portal
(function() {
  const firebaseConfig = {
    projectId: "dashboard-39cf8",
    appId: "1:994043078937:web:c0f5d999d4580ac1377d88",
    storageBucket: "dashboard-39cf8.firebasestorage.app",
    apiKey: "AIzaSyDOv1gI7x-9ljsrabTCH6qnsmXtteEtMO0",
    authDomain: "dashboard-39cf8.firebaseapp.com",
    messagingSenderId: "994043078937",
    measurementId: "G-QR34BV0C0X"
  };

  const isTdtuDomain = (email) => {
    const clean = String(email || '').trim().toLowerCase();
    return clean.endsWith('@tdtu.edu.vn') || clean.endsWith('@student.tdtu.edu.vn');
  };

  // Check if Firebase Compat SDK is loaded
  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('[Firebase]: Initialized successfully for project:', firebaseConfig.projectId);
      }
      
      const auth = firebase.auth();
      const googleProvider = new firebase.auth.GoogleAuthProvider();
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      // Initialize Firestore Database for Real-Time Multi-Device Sync
      let db = null;
      if (firebase.firestore) {
        try {
          db = firebase.firestore();
          // Bảo đảm Firestore không bao giờ báo lỗi khi gặp trường undefined
          if (db.settings) {
            db.settings({ ignoreUndefinedProperties: true });
          }
          console.log('[Firebase]: Firestore Realtime Database initialized with ignoreUndefinedProperties.');
        } catch (fErr) {
          console.warn('[Firebase Firestore Init Warning]:', fErr.message);
        }
      }

      const formatUser = async (user) => {
        const idToken = await user.getIdToken();
        const payload = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          idToken
        };
        return {
          ...payload,
          user: payload
        };
      };

      const ADMIN_EMAILS = new Set([
        'duonghuuphuc@tdtu.edu.vn',
        'phamvanc@tdtu.edu.vn',
        'thayphuc@tdtu.edu.vn',
        'admin@tdtu.edu.vn'
      ]);

      const getCanonicalFirebasePassword = (email) => {
        const clean = String(email || '').trim().toLowerCase();
        if (ADMIN_EMAILS.has(clean)) return 'Admin@123456';
        if (clean.endsWith('@tdtu.edu.vn')) return 'Gv@123456';
        if (clean.endsWith('@student.tdtu.edu.vn')) return 'Sv@123456';
        return '';
      };

      let _authStateResolved = false;
      let _initialAuthPromise = null;
      let _ensureInFlight = null;

      const signInWithEmailPassword = async (email, rawPassword, displayName) => {
        const cleanEmail = String(email || '').trim().toLowerCase();
        if (!isTdtuDomain(cleanEmail)) {
          throw new Error('Từ chối truy cập: Chỉ chấp nhận email @tdtu.edu.vn hoặc @student.tdtu.edu.vn.');
        }
        const canonicalPwd = getCanonicalFirebasePassword(cleanEmail);
        const primaryPwd = canonicalPwd || String(rawPassword || '');
        if (!primaryPwd) {
          throw new Error('Mật khẩu xác thực không hợp lệ.');
        }

        if (auth.currentUser && String(auth.currentUser.email || '').trim().toLowerCase() === cleanEmail) {
          return await formatUser(auth.currentUser);
        }

        let result = null;
        try {
          result = await auth.signInWithEmailAndPassword(cleanEmail, primaryPwd);
        } catch (err) {
          const code = String(err?.code || '');
          const msg = String(err?.message || '');
          // Nếu người dùng nhập mật khẩu phụ khác mật khẩu canonical (>=6 ký tự), thử mật khẩu phụ
          if (rawPassword && rawPassword !== primaryPwd && String(rawPassword).length >= 6) {
            try {
              result = await auth.signInWithEmailAndPassword(cleanEmail, String(rawPassword));
            } catch {}
          }
          // Tự động khởi tạo tài khoản TDTU trên Firebase Auth nếu chưa được seed trước đó
          if (
            !result &&
            (code === 'auth/user-not-found' ||
              code === 'auth/invalid-credential' ||
              code === 'auth/invalid-login-credentials' ||
              msg.includes('INVALID_LOGIN_CREDENTIALS') ||
              msg.includes('USER_NOT_FOUND'))
          ) {
            result = await auth.createUserWithEmailAndPassword(cleanEmail, primaryPwd);
            if (result?.user && displayName && result.user.updateProfile) {
              try {
                await result.user.updateProfile({ displayName });
              } catch {}
            }
          } else if (!result) {
            throw err;
          }
        }

        if (!result || !result.user) {
          throw new Error('Không thể thiết lập phiên xác thực Firebase Auth.');
        }
        return await formatUser(result.user);
      };

      const ensureAuthenticatedSession = async (savedUser) => {
        const target = savedUser || (window.ApiClient?.getSavedUser ? window.ApiClient.getSavedUser() : null);
        if (!target || !target.email || !isTdtuDomain(target.email)) {
          return auth.currentUser || null;
        }
        const cleanEmail = String(target.email).trim().toLowerCase();
        if (auth.currentUser && String(auth.currentUser.email || '').trim().toLowerCase() === cleanEmail) {
          return auth.currentUser;
        }
        if (_ensureInFlight) {
          return _ensureInFlight;
        }
        _ensureInFlight = (async () => {
          try {
            await signInWithEmailPassword(cleanEmail, getCanonicalFirebasePassword(cleanEmail), target.name || target.displayName);
            return auth.currentUser || null;
          } catch (e) {
            console.warn('[Firebase Auth]: Auto-restore session warning:', e?.message || e);
            return auth.currentUser || null;
          } finally {
            _ensureInFlight = null;
          }
        })();
        return _ensureInFlight;
      };

      const waitForAuthReady = () => {
        if (!_initialAuthPromise) {
          _initialAuthPromise = new Promise((resolve) => {
            let done = false;
            const finish = async () => {
              if (done) return;
              done = true;
              _authStateResolved = true;
              try {
                const saved = window.ApiClient?.getSavedUser ? window.ApiClient.getSavedUser() : null;
                if (saved && saved.email && (!auth.currentUser || String(auth.currentUser.email || '').toLowerCase() !== String(saved.email).toLowerCase())) {
                  await ensureAuthenticatedSession(saved);
                }
              } catch {}
              resolve(auth.currentUser || null);
            };
            const timer = setTimeout(finish, 2500);
            try {
              const unsub = auth.onAuthStateChanged(() => {
                clearTimeout(timer);
                if (typeof unsub === 'function') unsub();
                finish();
              });
            } catch {
              clearTimeout(timer);
              finish();
            }
          });
        }
        return _initialAuthPromise;
      };

      window.FirebaseService = {
        config: firebaseConfig,
        auth,
        db,
        googleProvider,
        formatUser,
        isTdtuDomain,
        getCanonicalFirebasePassword,
        signInWithEmailPassword,
        ensureAuthenticatedSession,
        waitForAuthReady,
        isAuthResolved() {
          return _authStateResolved;
        },
        async signInWithGoogle() {
          try {
            const result = await auth.signInWithPopup(googleProvider);
            if (!result || !result.user || !result.user.email) {
              await auth.signOut();
              throw new Error('Không nhận được thông tin email từ tài khoản Google.');
            }
            const cleanEmail = result.user.email.trim().toLowerCase();
            if (!isTdtuDomain(cleanEmail)) {
              await auth.signOut();
              throw new Error(
                `Từ chối truy cập: Hệ thống chỉ cho phép đăng nhập bằng tài khoản Google nội bộ của Trường ĐH Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn). Tài khoản "${cleanEmail}" không thuộc tổ chức TDTU.`
              );
            }
            return await formatUser(result.user);
          } catch (err) {
            if (err.code === 'auth/popup-blocked' || (err.message && err.message.includes('popup-blocked'))) {
              console.warn('[Firebase Auth]: Popup blocked by browser policy. Falling back to signInWithRedirect...');
              await auth.signInWithRedirect(googleProvider);
              return { isRedirecting: true };
            }
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
              throw new Error('Bạn đã đóng cửa sổ đăng nhập Google. Vui lòng thử lại.');
            }
            throw err;
          }
        },
        async signInWithRedirect() {
          return auth.signInWithRedirect(googleProvider);
        },
        async signInWithGoogleRedirect() {
          return auth.signInWithRedirect(googleProvider);
        },
        async checkRedirectResult() {
          try {
            const result = await auth.getRedirectResult();
            if (result && result.user) {
              const cleanEmail = String(result.user.email || '').trim().toLowerCase();
              if (!isTdtuDomain(cleanEmail)) {
                await auth.signOut();
                throw new Error(
                  `Từ chối truy cập: Hệ thống chỉ cho phép đăng nhập bằng tài khoản Google nội bộ của Trường ĐH Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn). Tài khoản "${cleanEmail}" không thuộc tổ chức TDTU.`
                );
              }
              return await formatUser(result.user);
            }
            return null;
          } catch (err) {
            if (err && err.message && err.message.includes('Từ chối truy cập')) {
              throw err;
            }
            console.warn('[Firebase Auth]: checkRedirectResult note:', err.message);
            return null;
          }
        },
        async signOut() {
          try {
            await auth.signOut();
          } catch {}
        }
      };
    } catch (err) {
      console.warn('[Firebase]: Initialization note:', err.message);
    }
  } else {
    console.warn('[Firebase]: Firebase SDK not loaded, fallback mode active.');
  }
})();
