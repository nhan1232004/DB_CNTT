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

      window.FirebaseService = {
        config: firebaseConfig,
        auth,
        db,
        googleProvider,
        formatUser,
        isTdtuDomain,
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
