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
          console.log('[Firebase]: Firestore Realtime Database initialized.');
        } catch (fErr) {
          console.warn('[Firebase Firestore Init Warning]:', fErr.message);
        }
      }

      const formatUser = async (user) => {
        const idToken = await user.getIdToken();
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          idToken
        };
      };

      window.FirebaseService = {
        config: firebaseConfig,
        auth,
        db,
        googleProvider,
        formatUser,
        async signInWithGoogle() {
          try {
            const result = await auth.signInWithPopup(googleProvider);
            return await formatUser(result.user);
          } catch (err) {
            if (err.code === 'auth/popup-blocked' || (err.message && err.message.includes('popup-blocked'))) {
              console.warn('[Firebase Auth]: Popup blocked by browser policy. Falling back to signInWithRedirect...');
              await auth.signInWithRedirect(googleProvider);
              return { isRedirecting: true };
            }
            throw err;
          }
        },
        async signInWithRedirect() {
          return auth.signInWithRedirect(googleProvider);
        },
        async checkRedirectResult() {
          try {
            const result = await auth.getRedirectResult();
            if (result && result.user) {
              return await formatUser(result.user);
            }
            return null;
          } catch (err) {
            console.warn('[Firebase Auth]: checkRedirectResult note:', err.message);
            return null;
          }
        },
        async signOut() {
          await auth.signOut();
        }
      };
    } catch (err) {
      console.warn('[Firebase]: Initialization note:', err.message);
    }
  } else {
    console.warn('[Firebase]: Firebase SDK not loaded, fallback mode active.');
  }
})();
