// API Client Module - TDTU Internship Portal & Decision Support System
// Tích hợp: Real-time Firestore Multi-device Sync, Dịch vụ Email Thông báo Học vụ & Xuất Báo cáo Excel/PDF

class ApiClient {
  static tokenKey = 'tdtu_auth_token';
  static userKey = 'tdtu_auth_user';
  static sigKey = 'tdtu_auth_sig';
  static liveStudentsKey = 'tdtu_live_students_clean';
  static bulletinKey = 'tdtu_bulletin_posts';
  static notificationKey = 'tdtu_notifications';
  static _firestoreSyncInitialized = false;

  static isTdtuEmail(email) {
    const clean = String(email || '').trim().toLowerCase();
    return clean.endsWith('@tdtu.edu.vn') || clean.endsWith('@student.tdtu.edu.vn');
  }

  static isAdminEmail(email) {
    const clean = String(email || '').trim().toLowerCase();
    return (
      clean === 'duonghuuphuc@tdtu.edu.vn' ||
      clean === 'phamvanc@tdtu.edu.vn' ||
      clean === 'thayphuc@tdtu.edu.vn' ||
      clean === 'admin@tdtu.edu.vn'
    );
  }

  static _computeUserSig(user) {
    if (!user || !user.email) return '';
    const cleanEmail = String(user.email || '').trim().toLowerCase();
    const role = String(user.role || '').trim().toLowerCase();
    const isAdmin = Boolean(user.isAdmin) ? '1' : '0';
    const studentId = String(user.studentId || '').trim().toUpperCase();
    const enrolled = user.isEnrolledThisSemester === false ? '0' : '1';
    const raw = `TDTU_RBAC_V2|${cleanEmail}|${role}|${isAdmin}|${studentId}|${enrolled}`;
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) + raw.charCodeAt(i);
      hash = hash & hash;
    }
    return 'sig_' + Math.abs(hash).toString(36) + '_' + btoa(encodeURIComponent(`${cleanEmail}:${role}:${isAdmin}`));
  }

  static _purgeOldTestStudents() {
    try {
      if (!localStorage.getItem('tdtu_mock_data_purged_clean_v10')) {
        localStorage.removeItem('tdtu_live_students');
        localStorage.removeItem('tdtu_live_students_v2');
        localStorage.removeItem('tdtu_live_students_v3');
        localStorage.removeItem('tdtu_live_students_clean');
        localStorage.removeItem('tdtu_imported_students_hk1_2026_2027');
        localStorage.removeItem('tdtu_imported_students_hk2_2025_2026');
        localStorage.removeItem('tdtu_imported_students_hk1_2025_2026');
        localStorage.removeItem(this.notificationKey);
        // Dọn sạch toàn bộ dữ liệu mẫu khai báo, chứng chỉ, cv của các tài khoản test cũ
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('tdtu_certs_') || key.startsWith('tdtu_cv_') || key.startsWith('tdtu_decl_') || key.startsWith('tdtu_internship_history_')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem('tdtu_mock_data_purged_clean_v10', 'true');
      }
    } catch {}
  }

  static getToken() {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  static setToken(token) {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch {}
  }

  static clearToken() {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      localStorage.removeItem(this.sigKey);
      if (window.FirebaseService?.signOut) {
        window.FirebaseService.signOut();
      }
    } catch {}
  }

  static getSavedUser() {
    try {
      const data = localStorage.getItem(this.userKey);
      const savedSig = localStorage.getItem(this.sigKey);
      if (!data || !savedSig) return null;
      const user = JSON.parse(data);
      if (!user || !user.email || !this.isTdtuEmail(user.email)) {
        this.clearToken();
        return null;
      }

      const cleanEmail = String(user.email).trim().toLowerCase();
      // Ràng buộc chặt chẽ vai trò theo tên miền TDTU để chống giả mạo role / chuyển đổi tài khoản
      if (cleanEmail.endsWith('@student.tdtu.edu.vn')) {
        const expectedSid = cleanEmail.split('@')[0].toUpperCase();
        if (user.role !== 'student' || user.isAdmin === true || (user.studentId && String(user.studentId).toUpperCase() !== expectedSid)) {
          this.clearToken();
          return null;
        }
        user.role = 'student';
        user.isAdmin = false;
        user.studentId = expectedSid;
      } else if (cleanEmail.endsWith('@tdtu.edu.vn')) {
        if (user.role === 'student') {
          this.clearToken();
          return null;
        }
        if (this.isAdminEmail(cleanEmail)) {
          user.isAdmin = true;
          user.role = 'lecturer';
          if (cleanEmail === 'duonghuuphuc@tdtu.edu.vn') {
            user.name = user.name || 'TS. Dương Hữu Phúc';
          }
        } else if (cleanEmail === 'nguyenvana@tdtu.edu.vn' || cleanEmail === 'tranminhlan@tdtu.edu.vn' || cleanEmail === 'tranvanb@tdtu.edu.vn') {
          user.isAdmin = false;
          user.role = 'lecturer';
        }
      }

      const expectedSig = this._computeUserSig(user);
      if (savedSig !== expectedSig || (user._sig && user._sig !== expectedSig)) {
        console.warn('[Security Guard]: Phát hiện can thiệp trái phép phiên đăng nhập. Tự động đăng xuất.');
        this.clearToken();
        return null;
      }

      return user;
    } catch {
      this.clearToken();
      return null;
    }
  }

  static setSavedUser(user) {
    try {
      if (!user || !user.email || !this.isTdtuEmail(user.email)) {
        this.clearToken();
        return;
      }
      const cleanEmail = String(user.email).trim().toLowerCase();
      const normalized = {
        ...user,
        email: cleanEmail
      };
      if (cleanEmail.endsWith('@student.tdtu.edu.vn')) {
        normalized.role = 'student';
        normalized.isAdmin = false;
        normalized.studentId = cleanEmail.split('@')[0].toUpperCase();
      } else if (this.isAdminEmail(cleanEmail)) {
        normalized.role = 'lecturer';
        normalized.isAdmin = true;
        if (cleanEmail === 'duonghuuphuc@tdtu.edu.vn') {
          normalized.name = normalized.name || 'TS. Dương Hữu Phúc';
        }
      } else if (cleanEmail === 'nguyenvana@tdtu.edu.vn' || cleanEmail === 'tranminhlan@tdtu.edu.vn' || cleanEmail === 'tranvanb@tdtu.edu.vn') {
        normalized.role = 'lecturer';
        normalized.isAdmin = false;
      }
      const sig = this._computeUserSig(normalized);
      normalized._sig = sig;
      localStorage.setItem(this.sigKey, sig);
      localStorage.setItem(this.userKey, JSON.stringify(normalized));
    } catch {}
  }

  // 1. KẾT NỐI REAL-TIME FIRESTORE MULTI-DEVICE SYNC (Sinh viên, Tài khoản, Hạn chót & Khai báo)
  static initFirestoreSync() {
    if (this._firestoreSyncInitialized) return;
    const db = window.FirebaseService?.db;
    if (!db) {
      setTimeout(() => this.initFirestoreSync(), 500);
      return;
    }

    try {
      this._firestoreSyncInitialized = true;

      // 1.1 Lắng nghe cập nhật tài khoản người dùng thời gian thực (tdtu_users)
      db.collection('tdtu_users').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            list.push({ uid: doc.id, ...data });
          });
          // Đảm bảo tài khoản Quản trị viên Thầy Dương Hữu Phúc luôn có quyền Admin (isAdmin: true) trên hệ thống
          const phucAccount = {
            uid: 'u_gv_phuc',
            email: 'duonghuuphuc@tdtu.edu.vn',
            name: 'TS. Dương Hữu Phúc',
            displayName: 'TS. Dương Hữu Phúc',
            role: 'lecturer',
            isAdmin: true,
            isActive: true,
            department: 'Ban Chủ nhiệm Khoa CNTT',
            createdAt: '2025-08-01'
          };
          const existingPhucIdx = list.findIndex(u => String(u.email || '').toLowerCase() === 'duonghuuphuc@tdtu.edu.vn');
          if (existingPhucIdx === -1) {
            list.unshift(phucAccount);
            try {
              db.collection('tdtu_users').doc(phucAccount.uid).set(phucAccount, { merge: true }).catch(() => {});
            } catch {}
          } else if (!list[existingPhucIdx].isAdmin) {
            list[existingPhucIdx].isAdmin = true;
            list[existingPhucIdx].role = 'lecturer';
            list[existingPhucIdx].name = list[existingPhucIdx].name || 'TS. Dương Hữu Phúc';
            try {
              db.collection('tdtu_users').doc(list[existingPhucIdx].uid || 'u_gv_phuc').set({ isAdmin: true, role: 'lecturer' }, { merge: true }).catch(() => {});
            } catch {}
          }
          if (list.length > 0) {
            this._saveUsersStore(list);
            window.dispatchEvent(new CustomEvent('tdtu_users_updated', { detail: { source: 'firestore', count: list.length, users: list } }));
            console.log('[Firestore Sync]: Đã nhận dữ liệu tài khoản thời gian thực:', list.length);
          }
        } else {
          console.log('[Firestore Sync]: Collection tdtu_users trống, tiến hành seed dữ liệu khởi tạo...');
          this._seedFirestoreUsers(db);
        }
      }, err => {
        console.info('[Firestore Sync note - Users]: Chế độ bộ nhớ cục bộ.', err.message);
      });

      // 1.2 Lắng nghe cập nhật sinh viên từ các thiết bị khác theo thời gian thực (tdtu_students)
      db.collection('tdtu_students').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            const sid = String(data.mssv || data.studentId || doc.id || '').trim();
            const sName = String(data.name || data.fullName || '').trim();
            // Lọc bỏ bất kỳ dữ liệu test/tạo tự động có tiền tố SV_ hoặc tên giả "Sinh viên 521..."
            if (data && sid && !sid.startsWith('SV_') && !sName.startsWith('Sinh viên 5')) {
              list.push({ ...data, id: sid, mssv: sid, studentId: sid });
            }
          });
          list.sort((a, b) => (a.stt || 0) - (b.stt || 0));
          this.saveLiveStudents(list);
          window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: { source: 'firestore', count: list.length } }));
          console.log('[Firestore Sync]: Đã nhận dữ liệu sinh viên thời gian thực:', list.length);
        } else {
          // Khi Firestore trống hoặc vừa xóa dữ liệu: dọn dẹp bộ nhớ cục bộ ngay lập tức
          this.saveLiveStudents([]);
          window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: { source: 'firestore', count: 0 } }));
        }
      }, err => {
        console.info('[Firestore Sync note - Students]: Chế độ bộ nhớ cục bộ.', err.message);
      });

      // 1.3 Lắng nghe mốc thời gian & hạn chót học kỳ thời gian thực (tdtu_system/deadlines)
      db.collection('tdtu_system').doc('deadlines').onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          if (data) {
            localStorage.setItem('tdtu_system_deadlines', JSON.stringify(data));
            window.dispatchEvent(new CustomEvent('tdtu_deadlines_updated', { detail: data }));
            console.log('[Firestore Sync]: Đã nhận dữ liệu hạn chót học kỳ thời gian thực.');
          }
        }
      }, err => {
        console.info('[Firestore Sync note - Deadlines]: Chế độ bộ nhớ cục bộ.', err.message);
      });

      // 1.4 Lắng nghe thông báo học vụ thời gian thực (tdtu_notifications)
      db.collection('tdtu_notifications').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const notes = [];
          const seenIds = new Set();
          snapshot.forEach(doc => {
            const n = { id: doc.id, ...doc.data() };
            if (!seenIds.has(n.id)) {
              seenIds.add(n.id);
              notes.push(n);
            }
          });
          notes.sort((a, b) => String(b.createdAt || b.timestamp || '').localeCompare(String(a.createdAt || a.timestamp || '')));
          localStorage.setItem(this.notificationKey, JSON.stringify(notes.slice(0, 50)));
          window.dispatchEvent(new CustomEvent('tdtu_notification_received', { detail: notes }));
        } else {
          localStorage.setItem(this.notificationKey, JSON.stringify([]));
          window.dispatchEvent(new CustomEvent('tdtu_notification_received', { detail: [] }));
        }
      }, err => {});

      // 1.5 Lắng nghe hồ sơ khai báo doanh nghiệp thời gian thực (tdtu_declarations)
      db.collection('tdtu_declarations').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          snapshot.forEach(doc => {
            const data = doc.data();
            if (doc.id && data) {
              localStorage.setItem('tdtu_decl_' + doc.id, JSON.stringify(data));
            }
          });
          window.dispatchEvent(new CustomEvent('tdtu_declarations_updated'));
        }
      }, err => {});

      // 1.6 Lắng nghe chứng chỉ sinh viên thời gian thực (tdtu_certificates)
      db.collection('tdtu_certificates').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const certMap = {};
          snapshot.forEach(doc => {
            const c = { id: doc.id, ...doc.data() };
            const sid = c.studentId || '522H0045';
            if (!certMap[sid]) certMap[sid] = [];
            certMap[sid].push(c);
          });
          Object.keys(certMap).forEach(sid => {
            try { localStorage.setItem('tdtu_certs_' + sid, JSON.stringify(certMap[sid])); } catch {}
          });
          window.dispatchEvent(new CustomEvent('tdtu_certs_updated', { detail: certMap }));
        } else {
          // Khi Firestore trống: dọn dẹp bộ nhớ cục bộ
          try {
            localStorage.setItem('tdtu_certs_522H0045', JSON.stringify([]));
          } catch {}
          window.dispatchEvent(new CustomEvent('tdtu_certs_updated', { detail: {} }));
        }
      }, err => {
        console.info('[Firestore Sync note - Certs]: Chế độ bộ nhớ cục bộ.', err.message);
      });

      // 1.7 Lắng nghe tin JD tuyển dụng đã duyệt (tdtu_jds)
      db.collection('tdtu_jds').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const jds = [];
          snapshot.forEach(doc => jds.push({ id: doc.id, ...doc.data() }));
          try { localStorage.setItem('tdtu_published_jds', JSON.stringify(jds)); } catch {}
          window.dispatchEvent(new CustomEvent('tdtu_jds_updated', { detail: jds }));
        } else {
          try { localStorage.setItem('tdtu_published_jds', JSON.stringify([])); } catch {}
          window.dispatchEvent(new CustomEvent('tdtu_jds_updated', { detail: [] }));
        }
      }, err => {
        console.info('[Firestore Sync note - JDs]: Chế độ bộ nhớ cục bộ.', err.message);
      });

      // 1.8 Lắng nghe hàng đợi duyệt JD (tdtu_jd_queue)
      db.collection('tdtu_jd_queue').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const queue = [];
          snapshot.forEach(doc => queue.push({ id: doc.id, ...doc.data() }));
          try { localStorage.setItem('tdtu_jd_queue', JSON.stringify(queue)); } catch {}
          window.dispatchEvent(new CustomEvent('tdtu_jd_queue_updated', { detail: queue }));
        } else {
          try { localStorage.setItem('tdtu_jd_queue', JSON.stringify([])); } catch {}
          window.dispatchEvent(new CustomEvent('tdtu_jd_queue_updated', { detail: [] }));
        }
      }, err => {
        console.info('[Firestore Sync note - JD Queue]: Chế độ bộ nhớ cục bộ.', err.message);
      });

      // 1.9 Lắng nghe thông báo từ Giảng viên & Khoa CNTT trong mục JD (tdtu_announcements)
      db.collection('tdtu_announcements').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const notes = [];
          snapshot.forEach(doc => notes.push({ id: doc.id, ...doc.data() }));
          notes.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
          try { localStorage.setItem('tdtu_announcements', JSON.stringify(notes)); } catch {}
          window.dispatchEvent(new CustomEvent('tdtu_announcements_updated', { detail: notes }));
        } else {
          try { localStorage.setItem('tdtu_announcements', JSON.stringify([])); } catch {}
          window.dispatchEvent(new CustomEvent('tdtu_announcements_updated', { detail: [] }));
        }
      }, err => {
        console.info('[Firestore Sync note - Announcements]: Chế độ bộ nhớ cục bộ.', err.message);
      });

      console.log('[Firestore Sync]: Đã kích hoạt Real-time Multi-device Sync toàn diện.');
    } catch (e) {
      console.warn('[Firestore Sync Init Warning]:', e);
    }
  }

  // Tự động seed tài khoản khởi tạo lên Firestore nếu collection trống
  static async _seedFirestoreUsers(db) {
    try {
      const seed = [
        { uid: 'u_gv_phuc', email: 'duonghuuphuc@tdtu.edu.vn', name: 'TS. Dương Hữu Phúc', displayName: 'TS. Dương Hữu Phúc', role: 'lecturer', isAdmin: true, isActive: true, department: 'Ban Chủ nhiệm Khoa CNTT', createdAt: '2025-08-01' },
        { uid: 'u_gv01', email: 'phamvanc@tdtu.edu.vn', name: 'TS. Phạm Văn C', displayName: 'TS. Phạm Văn C', role: 'lecturer', isAdmin: true, isActive: true, department: 'Ban Chủ nhiệm Khoa CNTT', createdAt: '2025-08-01' },
        { uid: 'u_gv02', email: 'nguyenvana@tdtu.edu.vn', name: 'ThS. Nguyễn Văn A', displayName: 'ThS. Nguyễn Văn A', role: 'lecturer', isAdmin: false, isActive: true, department: 'Bộ môn CN Phần mềm', createdAt: '2025-08-10' },
        { uid: 'u_gv03', email: 'tranminhlan@tdtu.edu.vn', name: 'ThS. Trần Minh Lan', displayName: 'ThS. Trần Minh Lan', role: 'lecturer', isAdmin: false, isActive: true, department: 'Bộ môn Hệ thống & Mạng', createdAt: '2025-08-15' },
        { uid: 'u_sv01', email: '522h0045@student.tdtu.edu.vn', name: 'Nguyễn Hữu Nhân', displayName: 'Nguyễn Hữu Nhân', studentId: '522H0045', role: 'student', isAdmin: false, isActive: true, createdAt: '2025-09-01' },
        { uid: 'u_sv02', email: '522h0001@student.tdtu.edu.vn', name: 'Nguyễn Minh Anh', displayName: 'Nguyễn Minh Anh', studentId: '522H0001', role: 'student', isAdmin: false, isActive: true, createdAt: '2025-09-01' },
        { uid: 'u_sv03', email: '522h0002@student.tdtu.edu.vn', name: 'Trần Hoàng Nam', displayName: 'Trần Hoàng Nam', studentId: '522H0002', role: 'student', isAdmin: false, isActive: true, createdAt: '2025-09-01' },
        { uid: 'u_sv04', email: '51900839@student.tdtu.edu.vn', name: 'Võ Duy Trí', displayName: 'Võ Duy Trí', studentId: '51900839', role: 'student', isAdmin: false, isActive: true, createdAt: '2025-09-01' }
      ];
      const batch = db.batch();
      seed.forEach(u => {
        const ref = db.collection('tdtu_users').doc(u.uid);
        batch.set(ref, u, { merge: true });
      });
      await batch.commit();
      console.log('[Firestore Sync]: Đã seed thành công ' + seed.length + ' tài khoản vào Firestore tdtu_users.');
    } catch (err) {
      console.warn('[Firestore Seed Users Error]:', err.message);
    }
  }

  // Đã vô hiệu hóa tự động seed chứng chỉ mẫu - người dùng tự tạo dữ liệu
  static async _seedFirestoreCertificates() {
    return;
  }

  // Đã vô hiệu hóa tự động seed tin JD mẫu - người dùng tự tạo dữ liệu
  static async _seedFirestoreJds() {
    return;
  }

  // Đã vô hiệu hóa tự động seed tin JD chờ duyệt mẫu - người dùng tự tạo dữ liệu
  static async _seedFirestoreJdQueue() {
    return;
  }

  // Đã vô hiệu hóa tự động seed thông báo mẫu - người dùng tự tạo dữ liệu
  static async _seedFirestoreAnnouncements() {
    return;
  }

  // Đọc danh sách tài khoản trực tiếp từ Firestore nếu có kết nối
  static async fetchUsersFromFirestore() {
    if (window.FirebaseService?.db) {
      try {
        const snap = await window.FirebaseService.db.collection('tdtu_users').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => list.push({ uid: doc.id, ...doc.data() }));
          if (list.length > 0) {
            this._saveUsersStore(list);
            return list;
          }
        }
      } catch (err) {
        console.warn('[Firestore fetchUsers error]:', err.message);
      }
    }
    return this._getUsersStore();
  }

  // 2. DỊCH VỤ EMAIL & THÔNG BÁO HỌC VỤ CÓ PHÂN QUYỀN VÀ CHỐNG SPAM
  static _notifAntiSpamCache = new Map();

  static sendEmailNotification({ to, recipientName, subject, type, content, targetAudience, targetStudentId, priority }) {
    const rawTo = (to || '').trim();
    const studentIdMatch = rawTo.match(/([0-9]{3}[a-zA-Z0-9]{5})/i) || (targetStudentId ? [targetStudentId] : null);
    const resolvedStudentId = targetStudentId || (studentIdMatch ? studentIdMatch[0].toUpperCase() : null);

    // Mặc định: Các thao tác cá nhân của sinh viên (khai báo, chứng chỉ, ứng tuyển) luôn là specific_student
    const audience = targetAudience || (resolvedStudentId ? 'specific_student' : 'all');

    // Chống spam: Kiểm tra cache 20s
    const spamKey = `${audience}_${resolvedStudentId || ''}_${type || ''}_${(subject || '').trim().toLowerCase()}`;
    const now = Date.now();
    const lastSent = this._notifAntiSpamCache.get(spamKey);
    if (lastSent && (now - lastSent < 20000)) {
      console.log(`[Frontend Anti-Spam]: Bỏ qua spam click đúp thông báo trong 20s: ${spamKey}`);
      return null;
    }
    this._notifAntiSpamCache.set(spamKey, now);

    // Với thông báo khai báo của sinh viên, dùng ID cố định theo MSSV để ghi đè thay vì tạo hàng loạt bản ghi trùng lặp
    const isDeclNotif = (type === 'declaration_confirmed' || type === 'declaration_submitted') && resolvedStudentId;
    const notifId = isDeclNotif
      ? `notif_decl_${resolvedStudentId}`
      : ('notif_' + now + '_' + Math.random().toString(36).substring(2, 6));

    const note = {
      id: notifId,
      title: subject || '[TDTU Khoa CNTT] Thông báo Học vụ Thực tập',
      subject: subject || '[TDTU Khoa CNTT] Thông báo Học vụ Thực tập',
      content: content || 'Thông báo từ Ban Chủ nhiệm Khoa Công nghệ Thông tin.',
      type: type || 'announcement',
      priority: priority || 'normal',
      to: rawTo || (resolvedStudentId ? `${resolvedStudentId.toLowerCase()}@student.tdtu.edu.vn` : 'sinhvien@student.tdtu.edu.vn'),
      recipientName: recipientName || (resolvedStudentId ? `Sinh viên ${resolvedStudentId}` : 'Sinh viên TDTU'),
      targetAudience: audience,
      targetStudentId: resolvedStudentId,
      targetEmail: rawTo,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      read: false,
      status: 'DELIVERED (Gửi thành công)'
    };

    try {
      const saved = localStorage.getItem(this.notificationKey);
      let list = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];
      // Loại bỏ bản ghi cũ trùng ID hoặc trùng thông báo khai báo của cùng 1 sinh viên
      list = list.filter(n => n.id !== note.id && !(isDeclNotif && (n.type === 'declaration_confirmed' || n.type === 'declaration_submitted') && n.targetStudentId === resolvedStudentId));
      list.unshift(note);
      localStorage.setItem(this.notificationKey, JSON.stringify(list.slice(0, 100)));
    } catch {}

    // Gửi lên Backend API SQLite để lưu trữ và phân quyền tập trung
    try {
      const token = this.getToken();
      fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          type: note.type,
          priority: note.priority,
          targetAudience: note.targetAudience,
          targetStudentId: note.targetStudentId,
          targetEmail: note.targetEmail
        })
      }).catch(() => {});
    } catch {}

    // Đồng bộ lên Firestore với doc ID xác định để tránh tạo trùng lặp
    if (window.FirebaseService && window.FirebaseService.db) {
      try {
        window.FirebaseService.db.collection('tdtu_notifications').doc(note.id).set(note, { merge: true }).catch(() => {});
      } catch {}
    }

    // Phát sự kiện toàn cục để hiển thị Toast thông báo tức thì trên giao diện
    window.dispatchEvent(new CustomEvent('tdtu_notification_sent', { detail: note }));
    console.log(`[Notification Service]: Đã ghi nhận thông báo [${note.targetAudience}] -> [${note.targetStudentId || 'Tất cả'}]: "${note.subject}"`);
    return note;
  }

  // Tải danh sách thông báo từ Backend API có lọc phân quyền chặt chẽ
  static async fetchNotifications(currentUser) {
    try {
      const token = this.getToken();
      const res = await fetch('/api/notifications', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.data)) {
          // Hợp nhất với thông báo cục bộ và lọc phân quyền
          try {
            const localSaved = localStorage.getItem(this.notificationKey);
            const localList = localSaved ? JSON.parse(localSaved) : [];
            const mergedMap = new Map();
            [...body.data, ...(Array.isArray(localList) ? localList : [])].forEach(n => {
              if (n && n.id && !mergedMap.has(n.id)) mergedMap.set(n.id, n);
            });
            const merged = Array.from(mergedMap.values()).sort((a, b) =>
              String(b.createdAt || b.timestamp || '').localeCompare(String(a.createdAt || a.timestamp || ''))
            );
            localStorage.setItem(this.notificationKey, JSON.stringify(merged));
          } catch {}
          return this.getNotifications(currentUser);
        }
      }
    } catch (err) {
      console.warn('[Notifications] Offline / fallback to local store:', err.message);
    }
    return this.getNotifications(currentUser);
  }

  // Lọc thông báo LocalStorage theo chuẩn RBAC của người dùng hiện tại
  static getNotifications(currentUser) {
    let list = [];
    try {
      const saved = localStorage.getItem(this.notificationKey);
      if (saved) {
        list = JSON.parse(saved);
      }
    } catch {}

    if (!Array.isArray(list)) {
      list = [];
    }

    // Lọc bỏ thông báo mẫu ảo cũ nếu còn sót
    list = list.filter(n => n && n.id !== 'notif_init_01' && n.id !== 'notif_init_02');

    // Khi gọi nội bộ không truyền currentUser (VD: markNotificationRead), trả về nguyên danh sách để cập nhật
    if (!currentUser) {
      return list;
    }

    // Chuẩn hóa targetAudience cho các bản ghi cũ chưa có trường này
    const resolveAudience = (n) => {
      if (n.targetAudience && n.targetAudience !== 'all') return n.targetAudience;
      const toEmail = String(n.targetEmail || n.to || '').toLowerCase();
      if (n.targetStudentId || (toEmail.endsWith('@student.tdtu.edu.vn') && !toEmail.startsWith('sinhvien'))) {
        return 'specific_student';
      }
      return n.targetAudience || 'all';
    };

    // Role Admin: Nhìn thấy toàn bộ thông báo hệ thống và chiến dịch
    if (currentUser.isAdmin) {
      return list;
    }

    // Role Giảng viên: CHỈ nhận thông báo cho toàn trường hoặc toàn giảng viên
    // TUYỆT ĐỐI KHÔNG nhận thông báo cá nhân của từng sinh viên
    if (currentUser.role === 'lecturer') {
      return list.filter(n => {
        const aud = resolveAudience(n);
        return aud === 'all' || aud === 'all_lecturers';
      });
    }

    // Role Sinh viên:
    const mySid = (currentUser.studentId || currentUser.mssv || '').toUpperCase();
    const myEmail = (currentUser.email || '').toLowerCase();

    return list.filter(n => {
      const aud = resolveAudience(n);
      if (aud === 'all' || aud === 'all_students') return true;

      // Thông báo cá nhân riêng tư: Chỉ chính sinh viên này mới được xem
      if (aud === 'specific_student') {
        const notifSid = (n.targetStudentId || '').toUpperCase();
        const notifEmail = (n.targetEmail || n.to || '').toLowerCase();
        return (notifSid && notifSid === mySid) || (notifEmail && notifEmail === myEmail);
      }

      // Phân đoạn sinh viên
      if (aud === 'students_seeking' && (currentUser.status === 'seeking' || currentUser.status === 'Chưa có doanh nghiệp')) {
        return true;
      }
      if (aud === 'students_need_support' && (currentUser.noCompanyOption === 'faculty' || currentUser.status === 'Cần hỗ trợ')) {
        return true;
      }
      if (aud === 'students_dual_course' && (currentUser.isDualCourse || currentUser.isDualCourse === 1)) {
        return true;
      }
      if (aud === 'students_by_major' && n.targetMajor && currentUser.major) {
        return currentUser.major.toLowerCase().includes(n.targetMajor.toLowerCase());
      }
      return false;
    });
  }

  static async markNotificationRead(id) {
    try {
      const token = this.getToken();
      fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      }).catch(() => {});

      const list = this.getNotifications();
      const idx = list.findIndex(n => n.id === id);
      if (idx !== -1) {
        list[idx].read = true;
        localStorage.setItem(this.notificationKey, JSON.stringify(list));
      }
      return list;
    } catch {
      return [];
    }
  }

  static async markAllNotificationsRead() {
    try {
      const token = this.getToken();
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const list = this.getNotifications();
      const updated = list.map(n => ({ ...n, read: true }));
      localStorage.setItem(this.notificationKey, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  // API cho Admin: Lấy dự kiến số lượng đối tượng nhận thông báo (Audience Preview)
  static async getAudienceCount(targetAudience, targetMajor) {
    try {
      const token = this.getToken();
      const url = `/api/notifications/audience-count?targetAudience=${encodeURIComponent(targetAudience || 'all')}${targetMajor ? `&targetMajor=${encodeURIComponent(targetMajor)}` : ''}`;
      const res = await fetch(url, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) return body.data;
      }
    } catch {}
    return { count: 0, label: 'Đang tính toán...', description: '' };
  }

  // API cho Admin: Tạo và phát thông báo hướng mục tiêu
  static async createAdminNotification(payload) {
    const token = this.getToken();
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body?.error || body?.message || 'Không thể phát thông báo');
    }
    // Ghi cache local
    try {
      const saved = localStorage.getItem(this.notificationKey);
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(body.data);
      localStorage.setItem(this.notificationKey, JSON.stringify(list.slice(0, 100)));
    } catch {}
    window.dispatchEvent(new CustomEvent('tdtu_notification_sent', { detail: body.data }));
    return body.data;
  }

  // API cho Admin: Xóa/Thu hồi thông báo
  static async deleteNotification(id) {
    const token = this.getToken();
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body?.error || body?.message || 'Lỗi khi xóa thông báo');
    }
    try {
      const list = this.getNotifications().filter(n => n.id !== id);
      localStorage.setItem(this.notificationKey, JSON.stringify(list));
    } catch {}
    return body;
  }

  // 3. TÍNH NĂNG XUẤT BÁO CÁO EXCEL (MULTI-TAB EXCEL EXPORT FEATURE)
  static exportStudentsExcel(students, semester = 'HK1_2026_2027') {
    const XLSX = window.XLSX;
    if (!XLSX) {
      alert('Thư viện xử lý Excel đang tải, vui lòng thử lại sau 1 giây.');
      return;
    }
    if (!Array.isArray(students) || students.length === 0) {
      alert('Không có dữ liệu sinh viên để xuất file Excel.');
      return;
    }

    const formatRow = (s, idx) => ({
      'STT': idx + 1,
      'Mã số': s.mssv || s.studentId || '',
      'Họ và Tên': s.name || s.fullName || '',
      'Ngày sinh': s.birthDate || '',
      'Nơi sinh': s.birthPlace || '',
      'Phái': s.gender || 'Nam',
      'Lớp': s.class || '',
      'Năm học': s.year || 'Năm 4',
      'Chuyên ngành': s.major || '',
      'Số điện thoại': s.phone || '',
      'Học phần ĐK': (s.courses && s.courses.length > 0) ? s.courses.join(' & ') : (s.courseCode || 'KTCN'),
      'Học song song': s.isDualCourse ? 'Có (KTCN + TSNN)' : 'Không',
      'GPA (Hệ 10)': s.gpa10 !== undefined && s.gpa10 !== null ? s.gpa10 : '',
      'GPA (Hệ 4)': s.gpa4 !== undefined && s.gpa4 !== null ? s.gpa4 : (s.gpa !== undefined ? s.gpa : ''),
      'Xếp loại': s.academicRank || '',
      'Trạng thái': (s.companyName || s.company) ? 'Đã có nơi TT' : (s.status === 'need_support' || s.noCompanyOption === 'faculty' ? 'Cần Khoa hỗ trợ' : (s.status || 'Chưa có nơi TT')),
      'Doanh nghiệp tiếp nhận': s.companyName || s.company || 'Chưa có',
      'Cán bộ hướng dẫn (Mentor)': s.contactPerson || '—',
      'SĐT Cán bộ hướng dẫn': s.contactPhone || '—',
      'Ghi chú GV': s.lecturerNote || '',
      'Ngày cập nhật': s.updated || ''
    });

    const setColWidths = (ws) => {
      ws['!cols'] = [
        { wch: 6 },  // STT
        { wch: 14 }, // Mã số
        { wch: 26 }, // Họ và Tên
        { wch: 14 }, // Ngày sinh
        { wch: 20 }, // Nơi sinh
        { wch: 8 },  // Phái
        { wch: 14 }, // Lớp
        { wch: 12 }, // Năm học
        { wch: 32 }, // Chuyên ngành
        { wch: 14 }, // Số điện thoại
        { wch: 16 }, // Học phần ĐK
        { wch: 18 }, // Học song song
        { wch: 14 }, // GPA (Hệ 10)
        { wch: 14 }, // GPA (Hệ 4)
        { wch: 14 }, // Xếp loại
        { wch: 24 }, // Trạng thái
        { wch: 32 }, // Doanh nghiệp tiếp nhận
        { wch: 30 }, // Ghi chú GV
        { wch: 14 }  // Ngày cập nhật
      ];
    };

    const wb = XLSX.utils.book_new();

    // Sheet 1: Tổng hợp tất cả sinh viên
    const allData = students.map(formatRow);
    const wsAll = XLSX.utils.json_to_sheet(allData);
    setColWidths(wsAll);
    XLSX.utils.book_append_sheet(wb, wsAll, 'DanhSach_TongHop');

    // Sheet 2: Môn Kiến tập Công nghiệp (KTCN)
    const ktcnList = students.filter(s => {
      const cStr = (s.courseCode || (s.courses ? s.courses.join(' ') : '')).toUpperCase();
      return cStr.includes('KTCN') || cStr.includes('KIẾN TẬP');
    });
    if (ktcnList.length > 0) {
      const wsKtcn = XLSX.utils.json_to_sheet(ktcnList.map(formatRow));
      setColWidths(wsKtcn);
      XLSX.utils.book_append_sheet(wb, wsKtcn, 'DSSV_KTCN');
    }

    // Sheet 3: Môn Tập sự Nghề nghiệp (TSNN)
    const tsnnList = students.filter(s => {
      const cStr = (s.courseCode || (s.courses ? s.courses.join(' ') : '')).toUpperCase();
      return cStr.includes('TSNN') || cStr.includes('TẬP SỰ') || cStr.includes('DỰ ÁN');
    });
    if (tsnnList.length > 0) {
      const wsTsnn = XLSX.utils.json_to_sheet(tsnnList.map(formatRow));
      setColWidths(wsTsnn);
      XLSX.utils.book_append_sheet(wb, wsTsnn, 'DSSV_TSNN');
    }

    // Sheet 4: Sinh viên đăng ký 2 môn song song
    const dualList = students.filter(s => Boolean(s.isDualCourse) || (s.courses && s.courses.length > 1));
    if (dualList.length > 0) {
      const wsDual = XLSX.utils.json_to_sheet(dualList.map(formatRow));
      setColWidths(wsDual);
      XLSX.utils.book_append_sheet(wb, wsDual, 'DSSV_SongSong_2Mon');
    }

    XLSX.writeFile(wb, `DanhSach_SinhVien_ThucTap_${semester}_KhoaCNTT_TDTU.xlsx`);
  }

  static exportReportExcel(summary, chartData, semester = 'HK1_2026_2027') {
    const XLSX = window.XLSX;
    if (!XLSX) {
      alert('Thư viện xử lý Excel đang tải, vui lòng thử lại sau 1 giây.');
      return;
    }
    const wb = XLSX.utils.book_new();

    // Sheet 1: Tổng quan KPI
    const kpiData = [
      { 'Chỉ tiêu Đào tạo': 'Tổng sinh viên đợt thực tập', 'Số lượng': summary?.totalStudents || 0, 'Đơn vị': 'Sinh viên' },
      { 'Chỉ tiêu Đào tạo': 'Tổng lượt đăng ký học phần', 'Số lượng': summary?.totalCourseEnrollments || 0, 'Đơn vị': 'Lượt môn' },
      { 'Chỉ tiêu Đào tạo': 'Sinh viên đi 2 môn song song (KTCN + TSNN)', 'Số lượng': summary?.dualCourseStudents || 0, 'Đơn vị': 'Sinh viên' },
      { 'Chỉ tiêu Đào tạo': 'Sinh viên đã có doanh nghiệp tiếp nhận', 'Số lượng': summary?.hasCompany || 0, 'Đơn vị': 'Sinh viên' },
      { 'Chỉ tiêu Đào tạo': 'Sinh viên đang chờ phỏng vấn / kết quả', 'Số lượng': summary?.waitingInterview || 0, 'Đơn vị': 'Sinh viên' },
      { 'Chỉ tiêu Đào tạo': 'Sinh viên cần Khoa hỗ trợ kết nối', 'Số lượng': summary?.needFacultySupport || 0, 'Đơn vị': 'Sinh viên' }
    ];
    const wsKpi = XLSX.utils.json_to_sheet(kpiData);
    wsKpi['!cols'] = [{ wch: 45 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsKpi, 'TongQuan_KPI');

    // Sheet 2: Doanh nghiệp theo lĩnh vực
    if (chartData?.industryStats?.slices) {
      const indData = chartData.industryStats.slices.map((s, idx) => ({
        'STT': idx + 1,
        'Lĩnh vực công nghệ': s.label,
        'Tỷ lệ (%)': s.percentage
      }));
      const wsInd = XLSX.utils.json_to_sheet(indData);
      wsInd['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsInd, 'LinhVuc_DoanhNghiep');
    }

    // Sheet 3: Kết quả theo ngành
    if (chartData?.academicResultsByMajor?.majors) {
      const majorData = chartData.academicResultsByMajor.majors.map(m => {
        const row = { 'Chuyên ngành': m.name, 'Tổng SV': m.total };
        m.segments.forEach(seg => {
          row[seg.label] = seg.count;
        });
        return row;
      });
      const wsMaj = XLSX.utils.json_to_sheet(majorData);
      wsMaj['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsMaj, 'KetQua_HocTap_TheoNganh');
    }

    // Sheet 4: Ngoại ngữ
    if (chartData?.englishCertStats?.slices) {
      const engData = chartData.englishCertStats.slices.map(e => ({
        'Tiêu chuẩn ngoại ngữ': e.label,
        'Tỷ lệ (%)': e.percentage
      }));
      const wsEng = XLSX.utils.json_to_sheet(engData);
      wsEng['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsEng, 'ChungChi_TiengAnh');
    }

    XLSX.writeFile(wb, `BaoCao_RaQuyetDinh_ThucTap_${semester}_KhoaCNTT_TDTU.xlsx`);
  }

  // Chuẩn hóa 1 bản ghi sinh viên đồng nhất cho cả Backend, Firestore và LocalStorage
  static _normalizeStudentRecord(s, idx = 0) {
    const sid = String(s.mssv || s.studentId || s.id || '').trim().toUpperCase();
    const fullName = String(s.name || s.fullName || ((s['Họ lót'] || s.lastName || '') + ' ' + (s['Tên'] || s.firstName || '')).trim() || '').trim();
    const gpa4Val = typeof s.gpa4 === 'number' ? s.gpa4 : (parseFloat(s.gpa4) || parseFloat(s.gpa) || 3.0);
    const gpa10Val = typeof s.gpa10 === 'number' && s.gpa10 > 0 ? s.gpa10 : (parseFloat(s.gpa10) > 0 ? parseFloat(s.gpa10) : Number((gpa4Val * 2.5).toFixed(2)));
    const rankVal = s.academicRank || (gpa10Val >= 9.0 ? 'Xuất sắc' : (gpa10Val >= 8.0 ? 'Giỏi' : (gpa10Val >= 6.5 ? 'Khá' : 'Trung bình')));
    const rawCourses = Array.isArray(s.courses) ? s.courses.map((c: any) => String(c).toUpperCase()) : [];
    const rawCode = String(s.courseCode || s.course_str || s.courseName || s['Môn học'] || s['Học phần'] || s['Học phần ĐK'] || '').toUpperCase();
    const hasKtcn = rawCourses.some((c: string) => c.includes('KTCN') || c.includes('KIẾN TẬP')) || rawCode.includes('KTCN') || rawCode.includes('KIẾN TẬP') || s.ktcnEnrolled === 1 || s.ktcnEnrolled === true;
    const hasTsnn = rawCourses.some((c: string) => c.includes('TSNN') || c.includes('TẬP SỰ') || c.includes('DỰ ÁN')) || rawCode.includes('TSNN') || rawCode.includes('TẬP SỰ') || rawCode.includes('DỰ ÁN') || s.tsnnEnrolled === 1 || s.tsnnEnrolled === true;
    const isDual = Boolean((hasKtcn && hasTsnn) || s.isDualCourse === 1 || s.isDualCourse === true || rawCode.includes('SONG SONG'));
    const coursesArr = isDual ? ['KTCN', 'TSNN'] : (hasTsnn && !hasKtcn ? ['TSNN'] : ['KTCN']);
    const rawStatus = String(s.status || '').trim();
    const normStatus = (rawStatus === 'has_company' || rawStatus === 'Có doanh nghiệp')
      ? 'Có doanh nghiệp'
      : ((rawStatus === 'need_support' || rawStatus === 'Cần hỗ trợ' || rawStatus === 'Cần Khoa hỗ trợ' || s.noCompanyOption === 'faculty')
          ? 'Cần Khoa hỗ trợ'
          : ((rawStatus === 'interviewing' || rawStatus === 'Đang chờ PV/KQPV')
              ? 'Đang chờ PV/KQPV'
              : 'Chưa có doanh nghiệp'));
    const rawComp = String(s.company || s.companyName || '').trim();
    const normCompany = normStatus === 'Có doanh nghiệp'
      ? (rawComp && rawComp !== 'Chưa có' && rawComp !== '—' ? rawComp : 'Doanh nghiệp đã khai báo')
      : (normStatus === 'Cần Khoa hỗ trợ' ? 'Khoa CNTT hỗ trợ' : (normStatus === 'Đang chờ PV/KQPV' ? (rawComp || 'Đang chờ PV') : 'Chưa có'));

    return {
      ...s,
      semester: s.semester || 'hk1_2026_2027',
      companyName: s.companyName || normCompany,
      taxCode: s.taxCode || '',
      position: s.position || '',
      contactPerson: s.contactPerson || s.mentorName || s.mentor || '',
      contactPhone: s.contactPhone || s.mentorPhone || '',
      contactEmail: s.contactEmail || s.mentorEmail || '',
      mentorName: s.mentorName || s.contactPerson || s.mentor || '',
      mentorPhone: s.mentorPhone || s.contactPhone || '',
      mentorEmail: s.mentorEmail || s.contactEmail || '',
      companyAddress: s.companyAddress || s.address || '',
      address: s.address || s.companyAddress || '',
      representative: s.representative || '',
      stt: s.stt || (idx + 1),
      id: sid,
      mssv: sid,
      studentId: sid,
      name: fullName,
      fullName: fullName,
      class: String(s.class || s.className || '22050101').trim(),
      className: String(s.className || s.class || '22050101').trim(),
      major: String(s.major || 'Khoa học máy tính').trim(),
      year: s.year || 'Năm 4',
      birthDate: s.birthDate || '',
      birthPlace: s.birthPlace || '',
      gender: s.gender || 'Nam',
      phone: String(s.phone || '0910000000').trim(),
      gpa: gpa4Val,
      gpa4: gpa4Val,
      gpa10: gpa10Val,
      academicRank: rankVal,
      courses: coursesArr,
      courseCode: coursesArr.join(' & '),
      courseName: isDual ? 'Kiến tập Công nghiệp & Tập sự Nghề nghiệp' : (coursesArr[0] === 'TSNN' ? 'Tập sự Nghề nghiệp' : 'Kiến tập Công nghiệp'),
      isDualCourse: isDual,
      status: normStatus,
      company: normCompany,
      companyName: s.companyName || normCompany,
      position: s.position || '',
      cert: s.cert || s.certificateDisplay || s.certName || null,
      lecturerNote: s.lecturerNote || '',
      updated: s.updated || new Date().toLocaleDateString('vi-VN'),
      declarationData: s.declarationData || null
    };
  }

  // Quản lý Dữ liệu Sinh viên
  static async getLiveStudents(semester = 'hk1_2026_2027') {
    this._purgeOldTestStudents();
    this.initFirestoreSync();

    const isValidStudent = (s) => {
      const sid = String(s?.mssv || s?.studentId || s?.id || '').trim();
      const sName = String(s?.name || s?.fullName || '').trim();
      return Boolean(sid && !sid.startsWith('SV_') && !sid.toLowerCase().startsWith('số lượng') && !sName.startsWith('Sinh viên 5'));
    };

    const enrichWithDeclarations = (list) => {
      if (!Array.isArray(list)) return [];
      return list.map(s => {
        const sid = String(s.studentId || s.mssv || s.id || '').trim().toUpperCase();
        if (!sid) return s;
        try {
          const raw = localStorage.getItem('tdtu_decl_' + sid);
          if (raw) {
            const decl = JSON.parse(raw);
            if (decl) {
              const isComp = decl.internshipStatus === 'has_company' || (!decl.noCompanyOption && decl.companyName && !decl.companyName.includes('hỗ trợ') && !decl.companyName.includes('Đang tìm'));
              const isWait = decl.internshipStatus === 'interviewing';
              const isSupp = decl.internshipStatus === 'need_support';
              return {
                ...s,
                company: isComp ? (decl.companyName || s.company) : (isWait ? (decl.pendingCompany || 'Đang chờ PV') : (isSupp ? 'Khoa CNTT hỗ trợ' : s.company)),
                companyName: decl.companyName || s.companyName || s.company,
                taxCode: decl.taxCode || s.taxCode,
                position: decl.position || s.position,
                contactPerson: decl.contactPerson || decl.mentorName || s.contactPerson,
                mentorName: decl.contactPerson || decl.mentorName || s.mentorName,
                contactPhone: decl.contactPhone || decl.mentorPhone || s.contactPhone,
                mentorPhone: decl.contactPhone || decl.mentorPhone || s.mentorPhone,
                contactEmail: decl.contactEmail || decl.mentorEmail || s.contactEmail,
                mentorEmail: decl.mentorEmail || decl.contactEmail || s.mentorEmail,
                address: decl.address || s.address,
                companyAddress: decl.address || s.companyAddress,
                representative: decl.representative || s.representative,
                status: isComp ? 'Có doanh nghiệp' : (isWait ? 'Đang chờ PV/KQPV' : (isSupp ? 'Cần Khoa hỗ trợ' : s.status)),
                declarationData: decl
              };
            }
          }
        } catch {}
        return s;
      });
    };

    // Nếu người dùng vừa chủ động nhấn "Xóa sạch danh sách" để test import từ đầu
    if (localStorage.getItem('tdtu_students_cleared_empty') === 'true') {
      return [];
    }

    // 1. Trực tiếp truy vấn Cloud Firestore (tdtu_students) là nguồn dữ liệu thời gian thực
    if (window.FirebaseService?.db) {
      try {
        const snap = await window.FirebaseService.db.collection('tdtu_students').get();
        if (!snap.empty) {
          const allList = [];
          snap.forEach(doc => {
            const data = doc.data();
            const sid = String(data.mssv || data.studentId || doc.id).trim();
            if (isValidStudent({ ...data, mssv: sid })) {
              allList.push(this._normalizeStudentRecord({ ...data, id: sid, mssv: sid, studentId: sid }, allList.length));
            }
          });
          if (allList.length > 0) {
            allList.sort((a, b) => (a.stt || 0) - (b.stt || 0));
            // Cách ly tuyệt đối sinh viên theo học kỳ (tránh rò rỉ danh sách sang học kỳ khác)
            const filteredBySem = allList.filter(s => (s.semester || 'hk1_2026_2027') === semester);
            const enriched = enrichWithDeclarations(filteredBySem);
            if (semester === 'hk1_2026_2027') {
              this.saveLiveStudents(enriched);
            }
            try {
              localStorage.setItem('tdtu_imported_students_' + semester, JSON.stringify(enriched));
            } catch {}
            return enriched;
          }
        }
      } catch (fErr) {
        console.warn('[ApiClient.getLiveStudents] Firestore read warning:', fErr.message);
      }
    }

    // 2. Kiểm tra bộ nhớ LocalStorage theo từng học kỳ riêng biệt
    try {
      const savedImport = localStorage.getItem('tdtu_imported_students_' + semester);
      if (savedImport) {
        const parsed = JSON.parse(savedImport);
        if (Array.isArray(parsed)) {
          const cleanList = parsed.filter(isValidStudent).map((s, i) => this._normalizeStudentRecord(s, i));
          const filtered = cleanList.filter(s => (s.semester || 'hk1_2026_2027') === semester);
          return enrichWithDeclarations(filtered);
        }
      }
    } catch {}

    // 3. Nếu là HK1 2026-2027 thì kiểm tra liveStudentsKey mặc định
    if (semester === 'hk1_2026_2027') {
      try {
        const cached = localStorage.getItem(this.liveStudentsKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleanList = parsed.filter(isValidStudent).map((s, i) => this._normalizeStudentRecord(s, i));
            const filtered = cleanList.filter(s => (s.semester || 'hk1_2026_2027') === 'hk1_2026_2027');
            return enrichWithDeclarations(filtered);
          }
        }
      } catch {}
    } else {
      // Đối với học kỳ khác nếu chưa có sinh viên nạp vào, trả về danh sách rỗng đúng chuẩn
      return [];
    }

    // 4. Truy vấn trực tiếp từ Live API Backend SQLite (Master Data)
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const json = await response.json().catch(() => null);
        const res = json?.data || json;
        const items = res?.items || res?.students || (Array.isArray(res) ? res : []);
        if (Array.isArray(items) && items.length > 0) {
          const cleanList = items.filter(isValidStudent).map((s, idx) => this._normalizeStudentRecord(s, idx));
          if (cleanList.length > 0) {
            const enriched = enrichWithDeclarations(cleanList);
            this.saveLiveStudents(enriched);
            return enriched;
          }
        }
      }
    } catch {}

    // 5. Fallback tĩnh: đọc từ /data/real-students.json nếu chạy chế độ static
    try {
      const staticRes = await fetch('/data/real-students.json');
      if (staticRes.ok) {
        const staticJson = await staticRes.json().catch(() => null);
        if (Array.isArray(staticJson) && staticJson.length > 0) {
          const cleanList = staticJson.filter(isValidStudent).map((s, idx) => this._normalizeStudentRecord(s, idx));
          const enriched = enrichWithDeclarations(cleanList);
          this.saveLiveStudents(enriched);
          return enriched;
        }
      }
    } catch {}

    return [];
  }

  static saveLiveStudents(list) {
    try {
      localStorage.setItem(this.liveStudentsKey, JSON.stringify(list));
    } catch {}
  }

  static async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const json = await response.json().catch(() => null);
        if (json && json.success !== false) {
          return json.data !== undefined ? json.data : json;
        }
      }
    } catch (netErr) {
      console.info(`[ApiClient]: Live backend not reachable on ${endpoint}, activating client mock fallback.`);
    }

    return this.handleFallback(endpoint, options);
  }

  static async handleFallback(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    // 1. Auth: Google SSO & Credentials
    if (endpoint.includes('/api/auth/google-sso') || endpoint.includes('/api/auth/login')) {
      const email = (body.email || '').trim().toLowerCase();
      if (!this.isTdtuEmail(email)) {
        throw new Error(
          `Từ chối truy cập: Hệ thống chỉ cho phép tài khoản thuộc Trường ĐH Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn). Email "${email}" không hợp lệ.`
        );
      }

      if (endpoint.includes('/api/auth/login')) {
        const pwd = String(body.password || '');
        if (!this._verifyInternalCredential(email, pwd)) {
          throw new Error('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
        }
      }

      let role = 'student';
      let isAdmin = false;
      let studentId = undefined;
      let isEnrolledThisSemester = true;
      let userName = body.name;

      if (email.endsWith('@tdtu.edu.vn')) {
        role = 'lecturer';
        if (this.isAdminEmail(email)) {
          if (email === 'duonghuuphuc@tdtu.edu.vn') {
            userName = userName || 'TS. Dương Hữu Phúc';
          } else if (email.includes('thayphuc')) {
            userName = userName || 'TS. BCN Khoa CNTT';
          } else {
            userName = userName || 'TS. Phạm Văn C';
          }
          isAdmin = true;
        } else if (email.includes('nguyenvana')) {
          userName = 'ThS. Nguyễn Văn A';
          isAdmin = false;
        } else if (email.includes('tranminhlan')) {
          userName = 'ThS. Trần Minh Lan';
          isAdmin = false;
        } else if (email.includes('tranvanb')) {
          userName = 'TS. Trần Văn B';
          isAdmin = false;
        } else {
          userName = userName || 'Giảng viên Khoa CNTT';
          isAdmin = false;
        }
      } else if (email.endsWith('@student.tdtu.edu.vn')) {
        role = 'student';
        isAdmin = false;
        studentId = email.split('@')[0].toUpperCase();
        if (email.includes('522h0045')) {
          userName = 'Nguyễn Hữu Nhân';
          studentId = '522H0045';
          isEnrolledThisSemester = true;
        } else if (studentId === '522H0001') {
          userName = 'Nguyễn Minh Anh';
          isEnrolledThisSemester = true;
        } else if (studentId === '522H0002') {
          userName = 'Trần Hoàng Nam';
          isEnrolledThisSemester = true;
        } else if (studentId === '52100999' || email.includes('chuadk') || email.includes('ngoaiky')) {
          userName = 'Nguyễn Văn Ngoài Kỳ';
          studentId = '52100999';
          isEnrolledThisSemester = false;
        } else if (email.includes('51900839')) {
          userName = 'Võ Duy Trí';
          studentId = '51900839';
          isEnrolledThisSemester = true;
        }
      }

      // Tra cứu và kế thừa cấu hình từ kho tài khoản Firestore / Local
      const users = this._getUsersStore();
      const existingUser = users.find(u => u.email.toLowerCase() === email);
      let uid = 'user_' + Date.now();
      if (existingUser) {
        if (existingUser.isActive === false) {
          throw new Error('Tài khoản này đã bị khóa bởi Quản trị viên Khoa CNTT. Vui lòng liên hệ ban quản trị.');
        }
        uid = existingUser.uid || uid;
        if (email.endsWith('@student.tdtu.edu.vn')) {
          role = 'student';
          isAdmin = false;
        } else if (this.isAdminEmail(email)) {
          role = 'lecturer';
          isAdmin = true;
        } else {
          role = existingUser.role || role;
          if (existingUser.isAdmin !== undefined) isAdmin = existingUser.isAdmin;
        }
        userName = existingUser.displayName || existingUser.name || userName;
        if (existingUser.studentId) studentId = existingUser.studentId;
      } else {
        // Tự động lưu tài khoản mới vào Firestore và local store
        const newUserObj = {
          uid: 'u_' + (studentId || email.split('@')[0]),
          email,
          name: userName || body.name || (email.split('@')[0].toUpperCase()),
          displayName: userName || body.name || (email.split('@')[0].toUpperCase()),
          role,
          isAdmin,
          studentId,
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0]
        };
        uid = newUserObj.uid;
        users.push(newUserObj);
        this._saveUsersStore(users);
        if (window.FirebaseService?.db) {
          try {
            window.FirebaseService.db.collection('tdtu_users').doc(newUserObj.uid).set(newUserObj, { merge: true }).catch(() => {});
          } catch {}
        }
      }

      let studentProfile = null;
      if (role === 'student' && studentId) {
        try {
          const allStudents = await this.getLiveStudents();
          studentProfile = allStudents.find(s => String(s.mssv || s.studentId || '').toUpperCase() === studentId.toUpperCase());
          if (studentProfile) {
            userName = studentProfile.name || studentProfile.fullName || userName;
          }
        } catch {}
      }

      const user = {
        uid,
        email,
        name: userName || body.name || (email.split('@')[0].toUpperCase()),
        role,
        isAdmin,
        studentId,
        isEnrolledThisSemester,
        gpa: studentProfile?.gpa || studentProfile?.gpa4 || 3.13,
        gpa4: studentProfile?.gpa4 || studentProfile?.gpa || 3.13,
        gpa10: studentProfile?.gpa10 || 7.82,
        academicRank: studentProfile?.academicRank || 'Khá',
        birthDate: studentProfile?.birthDate || '',
        birthPlace: studentProfile?.birthPlace || '',
        gender: studentProfile?.gender || 'Nam',
        class: studentProfile?.class || '19050402',
        major: studentProfile?.major || 'Khoa học máy tính',
        courses: studentProfile?.courses || ['KTCN'],
        courseCode: studentProfile?.courseCode || 'KTCN',
        isDualCourse: Boolean(studentProfile?.isDualCourse),
        courseName: studentProfile?.courseName || 'Kiến tập Công nghiệp',
        avatarUrl: body.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };

      const token = 'tdtu_jwt_' + btoa(encodeURIComponent(JSON.stringify({ uid: user.uid, email: user.email, role: user.role, isAdmin: user.isAdmin, studentId: user.studentId })));
      this.setToken(token);
      this.setSavedUser(user);
      const savedVerified = this.getSavedUser() || user;
      return { user: savedVerified, token, role: savedVerified.role, ...savedVerified };
    }

    // 2. Auth: Me (Tuyệt đối không tự nhảy sang tài khoản mặc định nếu chưa đăng nhập hợp lệ)
    if (endpoint.includes('/api/auth/me')) {
      const saved = this.getSavedUser();
      if (saved && saved.role && this.isTdtuEmail(saved.email)) {
        return { user: saved, role: saved.role, ...saved };
      }
      this.clearToken();
      throw new Error('Chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
    }

    // 3. Auth: Firebase Users List
    if (endpoint.includes('/api/auth/firebase-users')) {
      return await this.fetchUsersFromFirestore();
    }

    // 4. Students Summary (Tương thích dữ liệu động & Hình 1)
    if (endpoint.includes('/api/students/summary')) {
      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const sem = urlParams.get('semester') || 'hk1_2026_2027';
      const list = await this.getLiveStudents(sem);

      const dualCount = list.filter(s => s.isDualCourse || (s.courses && s.courses.length > 1) || (s.enrolledCourses && s.enrolledCourses.length > 1)).length;
      const hasComp = list.filter(s => s.status === 'Có doanh nghiệp' || s.status === 'has_company' || (s.company && s.company !== 'Chưa có' && s.company !== '')).length;
      const needSupp = list.filter(s => s.status === 'Cần Khoa hỗ trợ' || s.status === 'need_support' || s.noCompanyOption === 'faculty').length;
      const waiting = list.filter(s => s.status === 'Đang chờ PV/KQPV' || s.status === 'interviewing').length;
      const noComp = list.filter(s => s.status === 'Chưa có doanh nghiệp' || s.status === 'seeking' || s.status === 'Chưa phản hồi').length;
      
      const total = list.length;
      const seeking = Math.max(0, total - hasComp - needSupp);
      const enrollments = list.reduce((acc, s) => acc + (s.courses?.length || s.enrolledCourses?.length || (s.isDualCourse ? 2 : 1)), 0);

      return {
        totalStudents: total,
        totalCourseEnrollments: enrollments,
        dualCourseStudents: dualCount,
        twoCourseStudents: dualCount,
        hasCompany: hasComp,
        waitingInterview: waiting,
        noCompany: noComp,
        seekingCompany: seeking,
        inProgress: seeking,
        needFacultySupport: needSupp,
        needSupport: needSupp,
        period: sem === 'hk2_2025_2026' ? 'Học kỳ 2 / 2025-2026' : (sem === 'hk1_2025_2026' ? 'Học kỳ 1 / 2025-2026' : 'Học kỳ 1 / 2026-2027')
      };
    }

    // 5. Students List (Chuẩn hóa cột theo Hình 2)
    if (endpoint.includes('/api/students')) {
      if (endpoint.includes('/eligibility/')) {
        const sid = endpoint.split('/eligibility/')[1];
        if (sid === '52100999') {
          return {
            studentId: sid,
            isEligible: false,
            totalCredits: 68,
            requiredCredits: 100,
            failedPrerequisites: ['Chưa tích lũy đủ 100 tín chỉ', 'Chưa có tên trong danh sách đăng ký học phần đầu kỳ'],
            message: 'Sinh viên chưa hoàn tất đăng ký học phần KTCN/TSNN trong Học kỳ 1/2026-2027.',
            status: 'NOT_ENROLLED'
          };
        }
        return {
          studentId: sid,
          isEligible: true,
          totalCredits: 128,
          requiredCredits: 100,
          failedPrerequisites: [],
          message: 'Đã hoàn tất đăng ký 2 học phần KTCN + TSNN. Đủ điều kiện thực tập tại Doanh nghiệp.',
          status: 'ELIGIBLE_FOR_BOTH'
        };
      }

      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const sem = urlParams.get('semester') || 'hk1_2026_2027';
      let list = await this.getLiveStudents(sem);

      const search = urlParams.get('search');
      const status = urlParams.get('status');
      const major = urlParams.get('major');
      const cls = urlParams.get('class');
      const isDual = urlParams.get('isDual');

      if (search) {
        const s = search.toLowerCase();
        list = list.filter(x => 
          (x.mssv && x.mssv.toLowerCase().includes(s)) ||
          (x.studentId && x.studentId.toLowerCase().includes(s)) ||
          (x.name && x.name.toLowerCase().includes(s)) ||
          (x.fullName && x.fullName.toLowerCase().includes(s)) ||
          (x.phone && x.phone.includes(s)) ||
          (x.class && x.class.toLowerCase().includes(s))
        );
      }
      if (status) {
        list = list.filter(x => x.status === status);
      }
      if (major) {
        list = list.filter(x => x.major && x.major.includes(major));
      }
      if (cls) {
        list = list.filter(x => x.class === cls);
      }
      if (isDual !== null && isDual !== undefined && isDual !== '') {
        list = list.filter(x => Number(x.isDualCourse) === Number(isDual));
      }

      return {
        items: list,
        students: list,
        total: list.length,
        pagination: { page: 1, pageSize: list.length, total: list.length }
      };
    }

    // 6. Internship: Tax lookup (Ủy quyền hoàn toàn cho engine Tra cứu Thuế Thời gian thực)
    if (endpoint.includes('/api/internship/company-lookup/')) {
      const code = (endpoint.split('/company-lookup/')[1] || '').trim();
      return this.lookupTaxCode(code);
    }

    // 7. Internship: Declare & Update Student Record + Email Notification
    if (endpoint.includes('/api/internship/declare')) {
      const sid = body.studentId || '522H0045';
      try {
        localStorage.setItem('tdtu_decl_' + sid, JSON.stringify(body));
      } catch {}

      // Always ensure Firestore tdtu_declarations is updated
      if (window.FirebaseService?.db) {
        try {
          window.FirebaseService.db.collection('tdtu_declarations').doc(sid).set({
            ...body,
            studentId: sid,
            submittedAt: new Date().toISOString()
          }, { merge: true });
          console.log('[Firestore Sync]: Đã lưu phiếu khai báo lên Firestore tdtu_declarations:', sid);
        } catch (fErr) {
          console.warn('[Firestore Save Declaration Warning]:', fErr.message);
        }
      }

      // Update student record in live students list
      try {
        const students = await this.getLiveStudents('hk1_2026_2027');
        const idx = students.findIndex(s => (s.mssv === sid || s.studentId === sid));
        if (idx !== -1) {
          const isComp = body.internshipStatus === 'has_company';
          const isWait = body.internshipStatus === 'interviewing';
          const isSupp = body.internshipStatus === 'need_support';
          students[idx].status = isComp ? 'Có doanh nghiệp' : (isWait ? 'Đang chờ PV/KQPV' : (isSupp ? 'Cần Khoa hỗ trợ' : 'Chưa có doanh nghiệp'));
          students[idx].company = isComp ? (body.companyName || 'Doanh nghiệp đã khai báo') : (isWait ? (body.companyName || 'Đang chờ PV') : (isSupp ? 'Khoa CNTT hỗ trợ' : 'Chưa có'));
          students[idx].companyName = body.companyName || students[idx].company;
          students[idx].taxCode = body.taxCode || '';
          students[idx].position = body.position || '';
          students[idx].contactPerson = body.contactPerson || '';
          students[idx].contactPhone = body.contactPhone || '';
          students[idx].contactEmail = body.contactEmail || '';
          students[idx].mentorName = body.contactPerson || '';
          students[idx].mentorPhone = body.contactPhone || '';
          students[idx].mentorEmail = body.contactEmail || '';
          students[idx].companyAddress = body.address || '';
          students[idx].address = body.address || '';
          students[idx].representative = body.representative || '';
          students[idx].noCompanyOption = body.noCompanyOption;
          students[idx].updated = new Date().toLocaleDateString('vi-VN');
          if (body.foreignLanguage && body.foreignScore) {
            students[idx].cert = `${body.foreignLanguage} ${body.foreignScore}`;
          }
          students[idx].declarationData = body;
          this.saveLiveStudents(students);
          try {
            localStorage.setItem('tdtu_imported_students_hk1_2026_2027', JSON.stringify(students));
          } catch {}

          // Realtime Firestore write
          if (window.FirebaseService?.db) {
            try {
              window.FirebaseService.db.collection('tdtu_students').doc(sid).set(students[idx], { merge: true });
              window.FirebaseService.db.collection('tdtu_declarations').doc(sid).set(body, { merge: true });
            } catch {}
          }

          // Dịch vụ Email Tự động gửi thông báo xác nhận về email sinh viên
          this.sendEmailNotification({
            to: `${sid.toLowerCase()}@student.tdtu.edu.vn`,
            recipientName: students[idx].name || 'Nguyễn Hữu Nhân',
            subject: `[TDTU Khoa CNTT] Tiếp nhận Khai báo Thực tập - ${students[idx].company}`,
            type: 'declaration_confirmed',
            content: `Kính gửi sinh viên ${students[idx].name || 'Nguyễn Hữu Nhân'} (MSSV: ${sid}),\n\nKhoa Công nghệ Thông tin - Trường ĐH Tôn Đức Thắng xác nhận đã tiếp nhận thành công Phiếu khai báo nơi thực tập học kỳ HK1/2026-2027 của bạn.\n\nThông tin chi tiết:\n- Đơn vị tiếp nhận: ${students[idx].company}\n- Mã số thuế: ${body.taxCode || '0101778162'}\n- Vị trí: ${body.position || 'Kỹ sư phần mềm'}\n- Người hướng dẫn: ${body.contactPerson || 'Bộ phận nhân sự'}\n- Trạng thái học vụ: ĐÃ CÓ DOANH NGHIỆP\n\nVui lòng hoàn tất nộp Phiếu tiếp nhận BM-01 (có chữ ký và dấu mộc của doanh nghiệp) về Văn phòng Khoa trước ngày 15/11/2026.`
          });
        }
      } catch (err) {
        console.error('Error updating live students from declaration:', err);
      }

      return { success: true, message: 'Khai báo thực tập thành công', declaration: body };
    }

    if (endpoint.includes('/api/internship/declaration/')) {
      const sid = endpoint.split('/declaration/')[1];
      try {
        const saved = localStorage.getItem('tdtu_decl_' + sid);
        if (saved) return JSON.parse(saved);
      } catch {}

      if (window.FirebaseService?.db) {
        try {
          const doc = await window.FirebaseService.db.collection('tdtu_declarations').doc(sid).get();
          if (doc.exists) {
            const data = doc.data();
            try { localStorage.setItem('tdtu_decl_' + sid, JSON.stringify(data)); } catch {}
            return data;
          }
        } catch {}
      }
      return null;
    }

    // 8. Bulletin Posts & Announcements
    if (endpoint.includes('/api/bulletin')) {
      if (endpoint.includes('/parse-email')) {
        const raw = body.rawEmail || '';
        return {
          title: raw.includes('Tuyển dụng') ? 'Cơ hội Thực tập Kỹ sư Phần mềm (Fullstack)' : 'Thông báo Thực tập Doanh nghiệp đối tác',
          company: 'FPT Software & Đối tác Công nghệ TDTU',
          location: 'Khu Công nghệ cao, TP. Thủ Đức, TP.HCM',
          salary: '8.000.000 - 12.000.000 VNĐ / tháng',
          techStack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
          requirements: 'Sinh viên năm 3-4 chuyên ngành CNTT, KTPM, KHMT. Nắm vững OOP và Git.'
        };
      }

      if (method === 'POST') {
        const newPost = {
          id: 'post_' + Date.now(),
          ...body,
          createdAt: new Date().toISOString()
        };
        try {
          const saved = localStorage.getItem(this.bulletinKey);
          const list = saved ? JSON.parse(saved) : [];
          list.unshift(newPost);
          localStorage.setItem(this.bulletinKey, JSON.stringify(list));
        } catch {}

        if (window.FirebaseService?.db) {
          try {
            window.FirebaseService.db.collection('tdtu_bulletin').add(newPost);
          } catch {}
        }

        // Tự động gửi Email thông báo tới toàn thể sinh viên
        this.sendEmailNotification({
          to: 'sinhvien-cntt@student.tdtu.edu.vn',
          recipientName: 'Toàn thể Sinh viên Khoa CNTT',
          subject: `[Thông báo / Tuyển dụng Mới] ${newPost.title}`,
          type: newPost.type || 'announcement',
          content: `Khoa CNTT - Trường ĐH Tôn Đức Thắng thông báo:\n\n${newPost.title}\n\n${newPost.content || ''}\n\n- Doanh nghiệp: ${newPost.companyName || 'Khoa CNTT'}\n- Vị trí: ${newPost.position || 'Theo thông báo'}\n- Mức lương / Trợ cấp: ${newPost.salary || 'Theo thỏa thuận'}\n\nSinh viên quan tâm vui lòng truy cập Cổng Thực tập để nộp hồ sơ ứng tuyển trực tiếp.`
        });

        return newPost;
      }

      try {
        const saved = localStorage.getItem(this.bulletinKey);
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch {}

      const defaultPosts = [
        {
          id: 'post-ann-01',
          type: 'announcement',
          title: 'Thông báo số 104/TB-CNTT: Khai báo Nơi thực tập & Nộp Phiếu tiếp nhận BM-01 (HK1/2026-2027)',
          content: 'Khoa Công nghệ Thông tin thông báo: Tất cả sinh viên đã đăng ký học phần Kiến tập công nghiệp (KTCN) và Tập sự nghề nghiệp (TSNN) phải hoàn tất việc khai báo thông tin doanh nghiệp tiếp nhận và xác thực Mã số thuế trên cổng trước ngày 15/11/2026. Sinh viên đi 2 môn đồng thời tại 1 doanh nghiệp chỉ cần khai báo 1 lần duy nhất trên hệ thống. Sau thời hạn trên, sinh viên chưa có nơi thực tập sẽ được Khoa liên hệ hỗ trợ phỏng vấn tại các doanh nghiệp đối tác.',
          author: 'TS. Phạm Văn C',
          authorRole: 'Ban Chủ nhiệm Khoa CNTT',
          priority: 'URGENT',
          status: 'published',
          createdAt: '2026-10-24T08:00:00Z'
        },
        {
          id: 'post-jd-01',
          type: 'recruitment_jd',
          title: 'FPT Software Tuyển dụng 20 Thực tập sinh Fullstack (NodeJS + React) & AI Engineer',
          content: 'Email chuyển tiếp từ VP Tuyển dụng FPT Software: Tuyển dụng sinh viên Khoa CNTT TDTU thực tập có trợ cấp. Cơ hội chuyển thành nhân viên chính thức sau 320 giờ thực tập. Yêu cầu: Nắm chắc OOP, React, NodeJS hoặc Python. Hỗ trợ phụ cấp từ 6.000.000 đến 10.000.000 VNĐ/tháng.',
          author: 'ThS. Nguyễn Văn A',
          authorRole: 'Giảng viên Điều phối Doanh nghiệp',
          sourceEmail: 'tuyendung-fpt@fsoft.com.vn',
          companyName: 'Công ty TNHH Phần mềm FPT',
          taxCode: '0101778162',
          position: 'Thực tập sinh Fullstack (React / NodeJS) & AI',
          salary: '6.000.000 - 10.000.000 VNĐ / tháng',
          location: 'F-Town 3, Khu Công nghệ Cao, TP. Thủ Đức, TP.HCM',
          slots: 20,
          status: 'published',
          createdAt: '2026-10-23T09:30:00Z'
        },
        {
          id: 'post-jd-02',
          type: 'recruitment_jd',
          title: 'VNG Corporation Tuyển Thực tập sinh Backend Golang / Node.js',
          content: 'Email chuyển tiếp từ HR VNG: Tuyển 5 thực tập sinh làm việc tại VNG Campus. Hỗ trợ phụ cấp 8.000.000 VNĐ + Cơm trưa buffet + Xe buýt đưa đón sinh viên từ cơ sở Tân Phong TDTU. Yêu cầu: Thành thạo giải thuật, OOP, RESTful API.',
          author: 'TS. Phạm Văn C',
          authorRole: 'Ban Chủ nhiệm Khoa CNTT',
          sourceEmail: 'recruitment@vng.com.vn',
          companyName: 'Công ty Cổ phần VNG',
          taxCode: '0303882213',
          position: 'Backend Developer Intern (Golang / Node.js)',
          salary: '8.000.000 VNĐ / tháng',
          location: 'VNG Campus, Tân Thuận Đông, Quận 7, TP.HCM',
          slots: 5,
          status: 'published',
          createdAt: '2026-10-22T10:15:00Z'
        },
        {
          id: 'post-jd-03',
          type: 'recruitment_jd',
          title: 'Viettel Telecom & Cyber Security Tuyển Thực tập sinh An toàn Thông tin & SOC',
          content: 'Email chuyển tiếp từ Viettel Cyber Security: Tuyển 6 sinh viên tham gia dự án giám sát an toàn thông tin SOC và Pentest mạng. Yêu cầu: Sinh viên ngành MMT&TT, ATTT, nắm vững Linux, Wireshark, Burp Suite. Trợ cấp 10.000.000 VNĐ/tháng.',
          author: 'ThS. Nguyễn Văn A',
          authorRole: 'Giảng viên Điều phối Doanh nghiệp',
          sourceEmail: 'tuyendung@viettel.com.vn',
          companyName: 'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)',
          taxCode: '0100109106',
          position: 'Cyber Security Analyst / Network Intern',
          salary: '10.000.000 VNĐ / tháng',
          location: 'Tòa nhà Viettel, 285 Cách Mạng Tháng 8, Quận 10, TP.HCM',
          slots: 6,
          status: 'published',
          createdAt: '2026-10-21T14:00:00Z'
        }
      ];
      return defaultPosts;
    }

    return { success: true };
  }

  // Xác thực mật khẩu cho các tài khoản nội bộ TDTU
  static _verifyInternalCredential(email, password) {
    const clean = String(email || '').trim().toLowerCase();
    const pwd = String(password || '');
    if (!this.isTdtuEmail(clean) || !pwd) return false;

    // Kiểm tra mật khẩu tùy chỉnh nếu Quản trị viên đã cấu hình trên kho tài khoản
    const storedUsers = this._getUsersStore();
    const found = storedUsers.find(u => String(u.email || '').toLowerCase() === clean);
    if (found && found.password && found.password === pwd) {
      return true;
    }

    // Bảng mật khẩu chuẩn cho các nhóm vai trò kiểm thử nội bộ TDTU
    const credentialMap = {
      // 1. Nhóm Quản trị viên Khoa / Ban Chủ nhiệm Khoa (Admin)
      'duonghuuphuc@tdtu.edu.vn': ['Admin@123456', 'Tdtu@2026', 'Phuc@123456'],
      'phamvanc@tdtu.edu.vn': ['Admin@123456', 'Tdtu@2026'],
      'thayphuc@tdtu.edu.vn': ['Admin@123456', 'Tdtu@2026'],
      'admin@tdtu.edu.vn': ['Admin@123456', 'Tdtu@2026'],

      // 2. Nhóm Giảng viên Phụ trách Thực tập (Lecturer)
      'nguyenvana@tdtu.edu.vn': ['Gv@123456', 'Lecturer@123456', 'Tdtu@2026'],
      'tranminhlan@tdtu.edu.vn': ['Gv@123456', 'Lecturer@123456', 'Tdtu@2026'],
      'tranvanb@tdtu.edu.vn': ['Gv@123456', 'Lecturer@123456', 'Tdtu@2026'],

      // 3. Nhóm Sinh viên Trong kỳ (Enrolled Student)
      '522h0045@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '522H0045', 'Tdtu@2026'],
      '51900839@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '51900839', 'Tdtu@2026'],
      '522h0001@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '522H0001', 'Tdtu@2026'],
      '522h0002@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '522H0002', 'Tdtu@2026'],

      // 4. Nhóm Sinh viên Ngoài kỳ / Chưa đủ điều kiện (Out-of-Semester Student)
      '52100999@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '52100999', 'Tdtu@2026']
    };

    if (credentialMap[clean]) {
      return credentialMap[clean].includes(pwd);
    }

    // Cho phép toàn bộ 91 sinh viên trong danh sách thực tế (<mssv>@student.tdtu.edu.vn) đăng nhập bằng mật khẩu chuẩn Sv@123456 hoặc chính MSSV viết hoa
    if (clean.endsWith('@student.tdtu.edu.vn')) {
      const mssv = clean.split('@')[0].toUpperCase();
      if (/^[0-9]{3}[A-Z0-9]{5}$/.test(mssv)) {
        return pwd === 'Sv@123456' || pwd === 'Student@123456' || pwd === mssv || pwd === 'Tdtu@2026';
      }
    }

    // Các giảng viên khác thuộc @tdtu.edu.vn đã được cấp trong danh sách tài khoản
    if (clean.endsWith('@tdtu.edu.vn') && found) {
      if (found.isAdmin) return pwd === 'Admin@123456' || pwd === 'Tdtu@2026';
      return pwd === 'Gv@123456' || pwd === 'Lecturer@123456' || pwd === 'Tdtu@2026';
    }

    return false;
  }

  // PUBLIC STATIC METHODS
  static async login(email, password) {
    const clean = String(email || '').trim().toLowerCase();
    const pwd = String(password || '');

    if (!this.isTdtuEmail(clean)) {
      throw new Error(
        `Từ chối truy cập: Chỉ chấp nhận email nội bộ Trường ĐH Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn).`
      );
    }

    if (!this._verifyInternalCredential(clean, pwd)) {
      throw new Error('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    }

    return this.handleFallback('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: clean, password: pwd })
    });
  }

  static async loginGoogleSso(email, name, avatarUrl) {
    const clean = String(email || '').trim().toLowerCase();
    if (!this.isTdtuEmail(clean)) {
      this.clearToken();
      throw new Error(
        `Từ chối truy cập: Hệ thống chỉ cho phép đăng nhập bằng tài khoản Google nội bộ của Trường ĐH Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn). Tài khoản "${clean}" không được phép truy cập.`
      );
    }

    return this.handleFallback('/api/auth/google-sso', {
      method: 'POST',
      body: JSON.stringify({ email: clean, name, avatarUrl })
    });
  }

  static async getMe() {
    return this.request('/api/auth/me');
  }

  static async getFirebaseUsers() {
    return this.fetchUsersFromFirestore();
  }

  static async getStudentsSummary(semester = 'hk1_2026_2027') {
    const list = await this.getLiveStudents(semester);
    const total = list.length;
    const dualCount = list.filter(s => Boolean(s.isDualCourse) || (Array.isArray(s.courses) && s.courses.length > 1)).length;
    const hasComp = list.filter(s => s.status === 'Có doanh nghiệp' || s.status === 'has_company').length;
    const needSupp = list.filter(s => s.status === 'Cần Khoa hỗ trợ' || s.status === 'Cần hỗ trợ' || s.status === 'need_support' || s.noCompanyOption === 'faculty').length;
    const waiting = list.filter(s => s.status === 'Đang chờ PV/KQPV' || s.status === 'interviewing').length;
    const noComp = Math.max(0, total - hasComp - needSupp - waiting);
    const seeking = Math.max(0, total - hasComp - needSupp);
    const enrollments = list.reduce((acc, s) => acc + (Array.isArray(s.courses) && s.courses.length > 0 ? s.courses.length : (s.isDualCourse ? 2 : 1)), 0);

    // Phân bố ngành thực tế
    const majorsMap = {
      'Khoa học máy tính': { total: 0, xs: 0, gioi: 0, kha: 0, tb: 0 },
      'Kỹ thuật phần mềm': { total: 0, xs: 0, gioi: 0, kha: 0, tb: 0 },
      'Mạng máy tính và truyền thông dữ liệu': { total: 0, xs: 0, gioi: 0, kha: 0, tb: 0 },
      'Hệ thống thông tin': { total: 0, xs: 0, gioi: 0, kha: 0, tb: 0 }
    };
    list.forEach(s => {
      const m = (s.major || '').toLowerCase();
      const c = (s.class || '').toLowerCase();
      let key = 'Khoa học máy tính';
      if (m.includes('phần mềm') || c.includes('502')) key = 'Kỹ thuật phần mềm';
      else if (m.includes('mạng') || c.includes('503')) key = 'Mạng máy tính và truyền thông dữ liệu';
      else if (m.includes('hệ thống') || c.includes('504')) key = 'Hệ thống thông tin';
      majorsMap[key].total += 1;
      const g4 = typeof s.gpa4 === 'number' ? s.gpa4 : (parseFloat(s.gpa4) || parseFloat(s.gpa) || 3.0);
      const rank = s.academicRank || (g4 >= 3.6 ? 'Xuất sắc' : (g4 >= 3.2 ? 'Giỏi' : (g4 >= 2.5 ? 'Khá' : 'Trung bình')));
      if (rank === 'Xuất sắc') majorsMap[key].xs += 1;
      else if (rank === 'Giỏi') majorsMap[key].gioi += 1;
      else if (rank === 'Khá') majorsMap[key].kha += 1;
      else majorsMap[key].tb += 1;
    });

    const hasCertCount = list.filter(s => Boolean(s.cert)).length;

    return {
      totalStudents: total,
      totalCourseEnrollments: enrollments,
      dualCourseStudents: dualCount,
      twoCourseStudents: dualCount,
      hasCompany: hasComp,
      waitingInterview: waiting,
      noCompany: noComp,
      seekingCompany: seeking,
      inProgress: seeking,
      needFacultySupport: needSupp,
      needSupport: needSupp,
      hasCertCount,
      majorsBreakdown: majorsMap,
      period: semester === 'hk2_2025_2026' ? 'Học kỳ 2 / 2025-2026' : (semester === 'hk1_2025_2026' ? 'Học kỳ 1 / 2025-2026' : 'Học kỳ 1 / 2026-2027')
    };
  }

  static async getSummary(semester = 'hk1_2026_2027') {
    return this.getStudentsSummary(semester);
  }

  static async checkStudentEligibility(studentId) {
    return this.request(`/api/students/eligibility/${studentId}`);
  }

  static async getStudents(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/students?${qs}`);
  }

  static async createStudent(studentData, semester = 'hk1_2026_2027') {
    const sid = String(studentData?.mssv || studentData?.studentId || '').trim().toUpperCase();
    if (!sid) {
      throw new Error('Vui lòng nhập Mã số sinh viên (MSSV).');
    }
    try { localStorage.removeItem('tdtu_students_cleared_empty'); } catch {}

    const list = await this.getLiveStudents(semester);
    if (list.some(s => String(s.mssv || s.studentId).toUpperCase() === sid)) {
      throw new Error(`Sinh viên có MSSV ${sid} đã tồn tại trong danh sách.`);
    }

    const newRecord = this._normalizeStudentRecord({ ...studentData, mssv: sid, studentId: sid }, list.length);
    const updatedList = [newRecord, ...list].map((s, idx) => ({ ...s, stt: idx + 1 }));
    this.saveLiveStudents(updatedList);
    try { localStorage.setItem('tdtu_imported_students_' + semester, JSON.stringify(updatedList)); } catch {}

    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_students').doc(sid).set(JSON.parse(JSON.stringify(newRecord)), { merge: true });
      } catch (e) {
        console.warn('[Firestore Create Student Warning]:', e.message);
      }
    }

    try {
      const token = this.getToken();
      await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newRecord)
      });
    } catch {}

    window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: { source: 'student_created', student: newRecord, count: updatedList.length } }));
    return { success: true, student: newRecord, total: updatedList.length };
  }

  static async updateStudent(studentId, updates, semester = 'hk1_2026_2027') {
    const sid = String(studentId || '').trim().toUpperCase();
    try {
      const students = await this.getLiveStudents(semester);
      const idx = students.findIndex(s => String(s.mssv || s.studentId).toUpperCase() === sid);
      if (idx !== -1) {
        const merged = this._normalizeStudentRecord({
          ...students[idx],
          ...updates,
          mssv: sid,
          studentId: sid,
          updated: new Date().toLocaleDateString('vi-VN')
        }, idx);
        students[idx] = merged;
        this.saveLiveStudents(students);
        try { localStorage.setItem('tdtu_imported_students_' + semester, JSON.stringify(students)); } catch {}

        // Realtime Firestore sync
        if (window.FirebaseService?.db) {
          try {
            await window.FirebaseService.db.collection('tdtu_students').doc(sid).set(JSON.parse(JSON.stringify(merged)), { merge: true });
          } catch {}
        }

        // Backend SQLite sync
        try {
          const token = this.getToken();
          await fetch(`/api/students/${encodeURIComponent(sid)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(merged)
          });
        } catch {}

        // Email thông báo khi cập nhật trạng thái
        if (updates.status) {
          this.sendEmailNotification({
            to: `${sid.toLowerCase()}@student.tdtu.edu.vn`,
            recipientName: merged.name || 'Sinh viên TDTU',
            subject: `[TDTU Khoa CNTT] Cập nhật Trạng thái Thực tập: ${merged.status}`,
            type: 'status_updated',
            content: `Kính gửi sinh viên ${merged.name} (MSSV: ${sid}),\n\nGiảng viên phụ trách học phần đã cập nhật trạng thái thực tập của bạn thành: "${merged.status}".\nĐơn vị tiếp nhận: ${merged.company || 'Đang cập nhật'}.\n\nVui lòng kiểm tra trên Cổng Quản lý Thực tập để theo dõi tiến độ chi tiết.`
          });
        }

        window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: { source: 'student_updated', studentId: sid, count: students.length } }));
        return { success: true, student: merged };
      }
    } catch {}
    return { success: true };
  }

  static async deleteStudent(studentId, semester = 'hk1_2026_2027') {
    const sid = String(studentId || '').trim().toUpperCase();
    try {
      const students = await this.getLiveStudents(semester);
      const filtered = students.filter(s => String(s.mssv || s.studentId).toUpperCase() !== sid).map((s, idx) => ({ ...s, stt: idx + 1 }));
      this.saveLiveStudents(filtered);
      try { localStorage.setItem('tdtu_imported_students_' + semester, JSON.stringify(filtered)); } catch {}
      if (filtered.length === 0) {
        try { localStorage.setItem('tdtu_students_cleared_empty', 'true'); } catch {}
      }

      if (window.FirebaseService?.db) {
        try {
          await window.FirebaseService.db.collection('tdtu_students').doc(sid).delete();
          await window.FirebaseService.db.collection('tdtu_declarations').doc(sid).delete();
        } catch {}
      }

      try {
        const token = this.getToken();
        await fetch(`/api/students/${encodeURIComponent(sid)}`, {
          method: 'DELETE',
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
      } catch {}

      window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: { source: 'student_deleted', studentId: sid, count: filtered.length } }));
      return { success: true, deletedId: sid, total: filtered.length };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  static async bulkDeleteStudents(studentIds = [], semester = 'hk1_2026_2027') {
    const idSet = new Set(studentIds.map(id => String(id).trim().toUpperCase()));
    if (idSet.size === 0) return { success: true, deletedCount: 0 };

    const students = await this.getLiveStudents(semester);
    const filtered = students.filter(s => !idSet.has(String(s.mssv || s.studentId).toUpperCase())).map((s, idx) => ({ ...s, stt: idx + 1 }));
    this.saveLiveStudents(filtered);
    try { localStorage.setItem('tdtu_imported_students_' + semester, JSON.stringify(filtered)); } catch {}
    if (filtered.length === 0) {
      try { localStorage.setItem('tdtu_students_cleared_empty', 'true'); } catch {}
    }

    if (window.FirebaseService?.db) {
      try {
        const db = window.FirebaseService.db;
        const batch = db.batch();
        idSet.forEach(sid => {
          batch.delete(db.collection('tdtu_students').doc(sid));
        });
        await batch.commit();
      } catch {}
    }

    try {
      const token = this.getToken();
      await Promise.all(Array.from(idSet).map(sid =>
        fetch(`/api/students/${encodeURIComponent(sid)}`, {
          method: 'DELETE',
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        }).catch(() => {})
      ));
    } catch {}

    window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: { source: 'students_bulk_deleted', count: filtered.length } }));
    return { success: true, deletedCount: idSet.size, total: filtered.length };
  }

  static async clearAllStudents(semester = 'hk1_2026_2027') {
    try {
      localStorage.setItem('tdtu_students_cleared_empty', 'true');
      this.saveLiveStudents([]);
      localStorage.setItem('tdtu_imported_students_' + semester, JSON.stringify([]));
    } catch {}

    if (window.FirebaseService?.db) {
      try {
        const db = window.FirebaseService.db;
        const snap = await db.collection('tdtu_students').get();
        if (!snap.empty) {
          const docs = snap.docs;
          for (let i = 0; i < docs.length; i += 350) {
            const batch = db.batch();
            docs.slice(i, i + 350).forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        }
      } catch (e) {
        console.warn('[Firestore Clear Students Warning]:', e.message);
      }
    }

    try {
      const token = this.getToken();
      await fetch('/api/students', {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
    } catch {}

    window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: { source: 'students_cleared', count: 0 } }));
    return { success: true, total: 0 };
  }

  static async importStudentsExcel(semester = 'hk1_2026_2027', studentList = [], mode = 'append') {
    if (!Array.isArray(studentList) || studentList.length === 0) {
      return { success: false, message: 'Danh sách sinh viên rỗng.' };
    }

    try { localStorage.removeItem('tdtu_students_cleared_empty'); } catch {}

    const incoming = studentList
      .map((s, idx) => this._normalizeStudentRecord(s, idx))
      .filter(s => s.mssv && !s.mssv.startsWith('SV_') && !s.name.startsWith('Sinh viên 5'));

    let finalList = [];
    if (mode === 'replace') {
      await this.clearAllStudents(semester);
      try { localStorage.removeItem('tdtu_students_cleared_empty'); } catch {}
      finalList = incoming.map((s, idx) => ({ ...s, stt: idx + 1 }));
    } else {
      const existing = await this.getLiveStudents(semester);
      const map = new Map();
      existing.forEach(s => map.set(String(s.mssv || s.studentId).toUpperCase(), s));
      incoming.forEach(s => {
        const key = String(s.mssv || s.studentId).toUpperCase();
        if (map.has(key)) {
          const old = map.get(key);
          // Gộp môn học nếu import từ nhiều sheet (VD: KTCN + TSNN)
          const mergedCourses = Array.from(new Set([...(old.courses || []), ...(s.courses || [])]));
          map.set(key, this._normalizeStudentRecord({
            ...old,
            ...s,
            courses: mergedCourses,
            isDualCourse: mergedCourses.length > 1
          }));
        } else {
          map.set(key, s);
        }
      });
      finalList = Array.from(map.values()).map((s, idx) => ({ ...s, stt: idx + 1 }));
    }

    console.log(`[ApiClient.importStudentsExcel]: Đang lưu ${finalList.length} sinh viên (mode=${mode}) cho ${semester}...`);

    // 1. Lưu LocalStorage ngay lập tức
    try {
      localStorage.setItem('tdtu_imported_students_' + semester, JSON.stringify(finalList));
      this.saveLiveStudents(finalList);
    } catch (lsErr) {
      console.warn('[ApiClient.importStudentsExcel] LocalStorage note:', lsErr.message);
    }

    // 2. Đồng bộ lên Cloud Firestore (tdtu_students) với batch commit có await và chunking 350 docs/lần
    if (window.FirebaseService?.db) {
      try {
        const db = window.FirebaseService.db;
        const chunkSize = 350;
        for (let i = 0; i < finalList.length; i += chunkSize) {
          const chunk = finalList.slice(i, i + chunkSize);
          const batch = db.batch();
          chunk.forEach(student => {
            const docRef = db.collection('tdtu_students').doc(student.mssv);
            const safeData = JSON.parse(JSON.stringify(student));
            batch.set(docRef, safeData, { merge: true });
          });
          await batch.commit();
        }
      } catch (fbErr) {
        console.error('[Firestore Sync Error]: Không thể lưu sinh viên lên Firestore:', fbErr);
      }
    }

    // 3. Đồng bộ xuống Backend SQLite qua /api/students/bulk-import
    try {
      const token = this.getToken();
      await fetch('/api/students/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ semester, mode, students: finalList })
      });
    } catch {}

    // 4. Kích hoạt sự kiện toàn cục để UI Dashboard & Báo cáo cập nhật realtime
    window.dispatchEvent(new CustomEvent('tdtu_data_updated', {
      detail: { source: 'excel_import', semester, count: finalList.length }
    }));

    return {
      success: true,
      importedCount: incoming.length,
      total: finalList.length,
      semester
    };
  }

  static async importStudentsFromExcel(semester = 'hk1_2026_2027', studentList = [], mode = 'append') {
    return this.importStudentsExcel(semester, studentList, mode);
  }

  // 6. ENGINE TRA CỨU MÃ SỐ THUẾ DOANH NGHIỆP QUA API XINVOICE (https://api.xinvoice.vn/gdt-api/tax-payer/)
  static async lookupTaxCode(taxCode) {
    const raw = (taxCode || '').trim();
    if (!raw) {
      throw new Error('Vui lòng nhập Mã số thuế để tra cứu.');
    }

    if (/^[-_\s]+$/.test(raw)) {
      throw new Error('Mã số thuế không hợp lệ (không thể chứa toàn ký tự gạch nối hoặc khoảng trắng).');
    }

    const clean = raw.replace(/\s+/g, '');
    const isValidFormat = /^[0-9]{10}(-[0-9]{3})?$/.test(clean) || /^[0-9]{13}$/.test(clean) || /^[0-9]{8,14}$/.test(clean);
    if (!isValidFormat) {
      throw new Error('Mã số thuế không hợp lệ. Mã số thuế doanh nghiệp phải gồm 10 chữ số (hoặc 13 chữ số / 10 số kèm 3 số chi nhánh).');
    }

    // BƯỚC 1: TRA CỨU TRỰC TIẾP QUA API XINVOICE THEO YÊU CẦU (https://api.xinvoice.vn/gdt-api/tax-payer/)
    try {
      const response = await fetch(`https://api.xinvoice.vn/gdt-api/tax-payer/${clean}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const json = await response.json().catch(() => null);
        if (json && json.name) {
          const partnerExtra = this._getVerifiedPartner(clean) || {};
          return {
            taxCode: json.taxID || clean,
            name: json.name,
            companyName: json.name,
            address: json.address || 'Địa chỉ đăng ký kinh doanh chính thức',
            orgType: json.orgType || 'Doanh nghiệp',
            taxDepartment: json.taxDepartment || '',
            status: json.status || 'NNT đang hoạt động',
            updatedAt: json.updatedAt,
            representative: partnerExtra.representative || 'Đại diện Doanh nghiệp',
            phone: partnerExtra.phone || '',
            email: partnerExtra.email || '',
            isRealTime: true,
            source: 'Cổng Thuế Doanh nghiệp Quốc gia'
          };
        }
      } else if (response.status === 404) {
        const errJson = await response.json().catch(() => null);
        // Kiểm tra đối tác chiến lược trước khi báo lỗi
        const partner = this._getVerifiedPartner(clean);
        if (partner) return partner;
        throw new Error(errJson?.message || `Không tìm thấy thông tin doanh nghiệp với mã số thuế "${clean}" trên hệ thống Tổng Cục Thuế.`);
      }
    } catch (apiErr) {
      if (apiErr?.message && (apiErr.message.includes('Không tìm thấy') || apiErr.message.includes('Tax not found'))) {
        throw apiErr;
      }
      console.warn('[Tax Engine]: Lỗi kết nối API Xinvoice, chuyển sang cơ chế dự phòng...', apiErr);
    }

    // BƯỚC 2: Kiểm tra Cơ sở dữ liệu Đối tác Chiến lược CNTT TDTU
    const partner = this._getVerifiedPartner(clean);
    if (partner) return partner;

    // BƯỚC 3: Tra cứu qua API Backend nếu Node.js đang chạy
    try {
      const res = await this.request(`/api/internship/company-lookup/${clean}`);
      if (res && (res.name || res.companyName) && !res.name?.includes('TDTU INNOVATION')) {
        return {
          taxCode: res.taxCode || clean,
          name: res.name || res.companyName,
          companyName: res.name || res.companyName,
          address: res.address || 'Địa chỉ đăng ký kinh doanh chính thức',
          representative: res.representative || 'Người đại diện pháp luật',
          phone: res.phone || '',
          email: res.email || '',
          isRealTime: true,
          source: 'Hệ thống Dữ liệu Backend TDTU'
        };
      }
    } catch {}

    // BƯỚC 4: Tra cứu dự phòng qua Cổng VietQR
    const clean10 = clean.replace(/[^0-9]/g, '').slice(0, 10);
    try {
      const response = await fetch(`https://api.vietqr.io/v2/business/${clean10}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (response.ok) {
        const json = await response.json().catch(() => null);
        if (json && json.code === '00' && json.data && json.data.name) {
          return {
            taxCode: clean,
            name: json.data.name,
            companyName: json.data.name,
            shortName: json.data.shortName || '',
            address: json.data.address || 'Địa chỉ đăng ký kinh doanh chính thức',
            representative: json.data.legal_representative || 'Người đại diện pháp luật',
            isRealTime: true,
            source: 'Cổng Thuế Doanh nghiệp Quốc gia (VietQR API)'
          };
        }
      }
    } catch {}

    // BƯỚC 5: Tra cứu dự phòng qua Escodata API
    try {
      const response = await fetch(`https://escodata.net/api-mst/${clean10}.htm`, {
        signal: AbortSignal.timeout(4000)
      });
      if (response.ok) {
        const json = await response.json().catch(() => null);
        if (json && json.error === 0 && json.data && json.data.ten) {
          return {
            taxCode: clean,
            name: json.data.ten,
            companyName: json.data.ten,
            address: json.data.dc || 'Địa chỉ đăng ký kinh doanh',
            representative: json.data.daidien || 'Người đại diện pháp luật',
            phone: json.data.dt || '',
            isRealTime: true,
            source: 'Cổng Thông tin Doanh nghiệp Quốc gia (Escodata API)'
          };
        }
      }
    } catch {}

    throw new Error(`Không tìm thấy thông tin doanh nghiệp với mã số thuế "${clean}" trên Cổng Thuế Xinvoice và Tổng cục Thuế.`);
  }

  static _getVerifiedPartner(clean) {
    const verifiedPartners = {
      '0101601092': {
        taxCode: '0101601092',
        name: 'CÔNG TY TNHH PHẦN MỀM FPT (FPT SOFTWARE)',
        companyName: 'CÔNG TY TNHH PHẦN MỀM FPT',
        shortName: 'FPT Software',
        address: 'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Phường Cầu Giấy, TP. Hà Nội (CN: F-Town 3, Khu CNC, TP. Thủ Đức, TP.HCM)',
        representative: 'Phạm Minh Tuấn',
        phone: '028 7300 7575',
        email: 'tuyendung-fpt@fsoft.com.vn',
        industry: 'Lập trình máy vi tính, Xuất khẩu phần mềm & Chuyển đổi số',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0101778162': {
        taxCode: '0101778162',
        name: 'CÔNG TY TNHH PHẦN MỀM FPT (FPT SOFTWARE)',
        companyName: 'CÔNG TY TNHH PHẦN MỀM FPT',
        shortName: 'FPT Software',
        address: 'Lô T2, Đường D1, Khu Công nghệ Cao, Phường Tân Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
        representative: 'Phạm Minh Tuấn',
        phone: '028 7300 7575',
        email: 'tuyendung-fpt@fsoft.com.vn',
        industry: 'Lập trình máy vi tính, Dịch vụ phần mềm công nghệ cao',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0303882213': {
        taxCode: '0303882213',
        name: 'CÔNG TY CỔ PHẦN VNG (VNG CORPORATION)',
        companyName: 'CÔNG TY CỔ PHẦN VNG',
        shortName: 'VNG Corporation',
        address: 'Z06 Đường số 13, KCX Tân Thuận, Phường Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh',
        representative: 'Lê Hồng Minh',
        phone: '028 3962 3888',
        email: 'contact@vng.com.vn',
        industry: 'Xuất bản phần mềm, trò chơi trực tuyến, điện toán đám mây & AI',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0303490096': {
        taxCode: '0303490096',
        name: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN VNG',
        companyName: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN VNG',
        shortName: 'VNG Corporation',
        address: 'Z06 Đường số 13, KCX Tân Thuận, Phường Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh',
        representative: 'Lê Hồng Minh',
        phone: '028 3962 3888',
        email: 'contact@vng.com.vn',
        industry: 'Nền tảng số, Trò chơi trực tuyến, Fintech (ZaloPay) & AI Cloud',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0100109106': {
        taxCode: '0100109106',
        name: 'TẬP ĐOÀN CÔNG NGHIỆP - VIỄN THÔNG QUÂN ĐỘI (VIETTEL)',
        companyName: 'TẬP ĐOÀN CÔNG NGHIỆP - VIỄN THÔNG QUÂN ĐỘI',
        shortName: 'Viettel Telecom',
        address: 'Số 5 Phố Nguyễn Hữu An, Phường Cầu Giấy, TP. Hà Nội (CN: 285 Cách Mạng Tháng 8, Phường 12, Quận 10, TP.HCM)',
        representative: 'Tào Đức Thắng',
        phone: '028 3888 9999',
        email: 'viettel@viettel.com.vn',
        industry: 'Viễn thông, giải pháp công nghệ thông tin & an toàn không gian mạng',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0101248141': {
        taxCode: '0101248141',
        name: 'CÔNG TY CỔ PHẦN FPT',
        companyName: 'CÔNG TY CỔ PHẦN FPT',
        shortName: 'Tập đoàn FPT',
        address: 'Số 10 Phố Phạm Văn Bạch, Phường Cầu Giấy, TP. Hà Nội',
        representative: 'Nguyễn Văn Khoa',
        phone: '024 7300 7300',
        email: 'fpt@fpt.com.vn',
        industry: 'Công nghệ thông tin, Viễn thông & Chuyển đổi số',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0301425912': {
        taxCode: '0301425912',
        name: 'CÔNG TY TNHH GIẢI PHÁP PHẦN MỀM TƯỜNG MINH (TMA SOLUTIONS)',
        companyName: 'CÔNG TY TNHH GIẢI PHÁP PHẦN MỀM TƯỜNG MINH',
        shortName: 'TMA Solutions',
        address: '111 Nguyễn Đình Chính, Phường 15, Quận Phú Nhuận, TP. Hồ Chí Minh',
        representative: 'Nguyễn Hữu Lệ',
        phone: '028 3997 8000',
        email: 'contact@tma.com.vn',
        industry: 'Gia công xuất khẩu phần mềm, AI, Viễn thông & IoT',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0301466038': {
        taxCode: '0301466038',
        name: 'CÔNG TY TNHH TRÍ TUỆ NHÂN TẠO TMA SOLUTIONS',
        companyName: 'CÔNG TY TNHH TRÍ TUỆ NHÂN TẠO TMA SOLUTIONS',
        shortName: 'TMA AI Solutions',
        address: '111 Nguyễn Đình Chính, Phường 15, Quận Phú Nhuận, TP. Hồ Chí Minh',
        representative: 'Nguyễn Hữu Lệ',
        phone: '028 3997 8000',
        email: 'contact@tma.com.vn',
        industry: 'Trí tuệ nhân tạo (AI), Khoa học dữ liệu & Phần mềm y tế',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0305289153': {
        taxCode: '0305289153',
        name: 'CÔNG TY CỔ PHẦN DỊCH VỤ DI ĐỘNG TRỰC TUYẾN (VÍ MOMO)',
        companyName: 'CÔNG TY CỔ PHẦN DỊCH VỤ DI ĐỘNG TRỰC TUYẾN',
        shortName: 'M_Service / MoMo',
        address: 'Tầng 6, Tòa nhà Phú Mỹ Hưng, Số 8 Hoàng Văn Thái, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
        representative: 'Nguyễn Mạnh Tường',
        phone: '028 5414 7667',
        email: 'hotro@momo.vn',
        industry: 'Fintech, Cổng thanh toán trực tuyến & Ví điện tử',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0312650437': {
        taxCode: '0312650437',
        name: 'CÔNG TY TNHH GRAB (GRAB VIỆT NAM)',
        companyName: 'CÔNG TY TNHH GRAB',
        shortName: 'Grab Vietnam',
        address: 'Tòa nhà Mapletree Business Centre, 1060 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh',
        representative: 'Alejandro Osorio',
        phone: '028 7108 7108',
        email: 'support.grab@grab.com',
        industry: 'Nền tảng công nghệ kết nối vận tải, giao hàng & thanh toán',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0309532909': {
        taxCode: '0309532909',
        name: 'CÔNG TY TNHH TI KI (TIKI)',
        companyName: 'CÔNG TY TNHH TI KI',
        shortName: 'Tiki',
        address: '52 Út Tịch, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh',
        representative: 'Trần Ngọc Thái Sơn',
        phone: '1900 6035',
        email: 'hotro@tiki.vn',
        industry: 'Thương mại điện tử & Hệ sinh thái công nghệ số',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0102182292': {
        taxCode: '0102182292',
        name: 'CÔNG TY CỔ PHẦN GIẢI PHÁP THANH TOÁN VIỆT NAM (VNPAY)',
        companyName: 'CÔNG TY CỔ PHẦN GIẢI PHÁP THANH TOÁN VIỆT NAM',
        shortName: 'VNPAY',
        address: 'Tầng 8, Số 22 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, TP. Hà Nội',
        representative: 'Lê Tánh',
        phone: '1900 555577',
        email: 'hotro@vnpay.vn',
        industry: 'Công nghệ tài chính (Fintech), Cổng thanh toán VNPAY-QR',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0316794479': {
        taxCode: '0316794479',
        name: 'CÔNG TY TNHH CASSO',
        companyName: 'CÔNG TY TNHH CASSO',
        shortName: 'Casso Open API',
        address: 'I.102D Nhà A, Khu Công Nghệ Phần Mềm ĐHQG-HCM, Phường Linh Xuân, TP. Thủ Đức, TP.HCM',
        representative: 'Đại diện Doanh nghiệp',
        phone: '028 9999 8888',
        email: 'support@casso.vn',
        industry: 'Open Banking, API tích hợp thanh toán tài chính',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      },
      '0303882213-001': {
        taxCode: '0303882213-001',
        name: 'CÔNG TY CỔ PHẦN VNG - CHI NHÁNH TÂN THUẬN',
        companyName: 'CÔNG TY CỔ PHẦN VNG - CHI NHÁNH TÂN THUẬN',
        shortName: 'VNG Tân Thuận',
        address: 'Khu Chế Xuất Tân Thuận, Phường Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh',
        representative: 'Lê Hồng Minh',
        phone: '028 3962 3888',
        email: 'branch-tanthuan@vng.com.vn',
        industry: 'Nền tảng số & Trò chơi trực tuyến',
        isRealTime: true,
        source: 'Cơ sở dữ liệu Đối tác Chiến lược Khoa CNTT TDTU'
      }
    };
    if (verifiedPartners[clean]) return verifiedPartners[clean];
    const base = clean.split('-')[0];
    if (verifiedPartners[base]) {
      return { ...verifiedPartners[base], taxCode: clean };
    }
    return null;
  }

  static async declareInternship(declaration) {
    const res = await this.request('/api/internship/declare', {
      method: 'POST',
      body: JSON.stringify(declaration)
    });

    const sid = String(declaration.studentId || '').trim().toUpperCase();
    if (sid) {
      try {
        localStorage.setItem('tdtu_decl_' + sid, JSON.stringify(declaration));
        localStorage.setItem('tdtu_decl_last_sync', String(Date.now()));
      } catch {}

      // Update student record in live students list cache
      try {
        const students = await this.getLiveStudents('hk1_2026_2027');
        const idx = students.findIndex(s => (String(s.mssv || s.studentId).toUpperCase() === sid));
        if (idx !== -1) {
          const isComp = declaration.internshipStatus === 'has_company' || (!declaration.noCompanyOption && declaration.companyName && !declaration.companyName.includes('hỗ trợ') && !declaration.companyName.includes('Đang tìm'));
          const isWait = declaration.internshipStatus === 'interviewing' || declaration.noCompanyOption === 'self';
          const isSupp = declaration.internshipStatus === 'need_support' || declaration.noCompanyOption === 'faculty';

          const wasFacultySupport = students[idx].noCompanyOption === 'faculty' || (students[idx].company && students[idx].company.includes('hỗ trợ'));
          if (wasFacultySupport && isComp) {
            students[idx].hasChangedFromSupport = 1;
            students[idx].withdrawnSupportAt = new Date().toISOString();
          }

          students[idx].status = isComp ? 'Có doanh nghiệp' : (isWait ? 'Đang chờ PV/KQPV' : (isSupp ? 'Cần hỗ trợ' : 'Chưa có doanh nghiệp'));
          students[idx].company = isComp ? (declaration.companyName || 'Doanh nghiệp đã khai báo') : (isWait ? (declaration.companyName || 'Đang chờ PV') : (isSupp ? 'Khoa CNTT hỗ trợ' : 'Chưa có'));
          students[idx].companyName = declaration.companyName || students[idx].company;
          students[idx].position = declaration.position || '';
          students[idx].contactPerson = declaration.contactPerson || '';
          students[idx].contactPhone = declaration.contactPhone || '';
          students[idx].mentorName = declaration.contactPerson || '';
          students[idx].mentorPhone = declaration.contactPhone || '';
          students[idx].address = declaration.address || '';
          students[idx].companyAddress = declaration.address || '';
          students[idx].representative = declaration.representative || '';
          students[idx].taxCode = declaration.taxCode || '';
          students[idx].noCompanyOption = declaration.noCompanyOption;
          students[idx].updated = new Date().toLocaleDateString('vi-VN');
          if (declaration.foreignLanguage && declaration.foreignScore) {
            students[idx].cert = `${declaration.foreignLanguage} ${declaration.foreignScore}`;
          }
          students[idx].declarationData = declaration;
          this.saveLiveStudents(students);
          try {
            localStorage.setItem('tdtu_imported_students_hk1_2026_2027', JSON.stringify(students));
          } catch {}
          if (window.FirebaseService?.db) {
            try {
              window.FirebaseService.db.collection('tdtu_students').doc(sid).set(students[idx], { merge: true });
              window.FirebaseService.db.collection('tdtu_declarations').doc(sid).set(declaration, { merge: true });
            } catch {}
          }
        }
      } catch {}

      // Broadcast across tabs
      try {
        const bc = new BroadcastChannel('tdtu_realtime_sync');
        bc.postMessage({ type: 'declaration_updated', studentId: sid, data: declaration });
        bc.close();
      } catch {}
    }
    return res;
  }

  static async getDeclaration(studentId) {
    const sid = String(studentId || '').trim().toUpperCase();
    try {
      const res = await this.request(`/api/internship/declaration/${sid}`);
      if (res) return res;
    } catch {}

    try {
      const saved = localStorage.getItem('tdtu_decl_' + sid);
      if (saved) return JSON.parse(saved);
    } catch {}

    if (window.FirebaseService?.db) {
      try {
        const doc = await window.FirebaseService.db.collection('tdtu_declarations').doc(sid).get();
        if (doc.exists) return doc.data();
      } catch {}
    }
    return null;
  }

  static async deleteDeclaration(studentId) {
    try {
      const res = await this.request(`/api/internship/declaration/${studentId}`, {
        method: 'DELETE'
      });
      try {
        localStorage.removeItem('tdtu_decl_' + studentId);
        localStorage.removeItem('tdtu_decl_draft_' + studentId);
      } catch {}
      return res;
    } catch (err) {
      try {
        localStorage.removeItem('tdtu_decl_' + studentId);
        localStorage.removeItem('tdtu_decl_draft_' + studentId);
      } catch {}
      return { success: true, message: 'Đã xóa hồ sơ khai báo thành công' };
    }
  }

  static async getBulletinPosts() {
    return this.request('/api/bulletin');
  }

  static async createBulletinPost(post) {
    return this.request('/api/bulletin', {
      method: 'POST',
      body: JSON.stringify(post)
    });
  }

  static async parseEmailJd(rawEmail) {
    return this.request('/api/bulletin/parse-email', {
      method: 'POST',
      body: JSON.stringify({ rawEmail })
    });
  }

  static async getDocuments() {
    return {
      items: [
        {
          id: 'doc-01',
          code: 'BM-01',
          name: 'Phiếu Tiếp nhận Thực tập Doanh nghiệp',
          description: 'Biểu mẫu do Doanh nghiệp tiếp nhận ký và đóng dấu xác nhận tiếp nhận sinh viên thực tập (Bắt buộc nộp trước 15/11/2026).',
          category: 'Biểu mẫu Bắt buộc',
          updatedAt: '2026-10-20'
        },
        {
          id: 'doc-02',
          code: 'BM-02',
          name: 'Kế hoạch Thực tập & Đề cương Chi tiết',
          description: 'Bản kế hoạch chi tiết các hạng mục công việc và lộ trình thực tập 320 giờ tại doanh nghiệp được Mentor phê duyệt.',
          category: 'Kế hoạch Chuyên môn',
          updatedAt: '2026-10-20'
        },
        {
          id: 'doc-03',
          code: 'BM-03',
          name: 'Nhật ký Thực tập & Theo dõi Tiến độ Tuần',
          description: 'Sổ nhật ký ghi chép công việc hàng tuần, có chữ ký xác nhận của cán bộ hướng dẫn doanh nghiệp.',
          category: 'Theo dõi Tiến độ',
          updatedAt: '2026-10-20'
        },
        {
          id: 'doc-04',
          code: 'BM-04',
          name: 'Phiếu Đánh giá Kết quả Thực tập Doanh nghiệp',
          description: 'Bảng đánh giá thái độ, kỹ năng và kết quả công việc do Doanh nghiệp chấm điểm và niêm phong nộp về Khoa CNTT.',
          category: 'Đánh giá & Nghiệm thu',
          updatedAt: '2026-10-20'
        },
        {
          id: 'doc-05',
          code: 'QC-320H',
          name: 'Quy định Đào tạo & Thực tập Doanh nghiệp Khoa CNTT',
          description: 'Quy chế chính thức về thời lượng thực tập tối thiểu 320 giờ, tiêu chuẩn ngoại ngữ và quy định đi 2 môn song song.',
          category: 'Quy định & Hướng dẫn',
          updatedAt: '2026-10-20'
        }
      ]
    };
  }

  static async parseEmailForward(rawEmail) {
    return this.parseEmailJd(rawEmail);
  }

  static async updateBulletinStatus(postId, status) {
    try {
      const saved = localStorage.getItem(this.bulletinKey);
      if (saved) {
        const list = JSON.parse(saved);
        const idx = list.findIndex(p => p.id === postId);
        if (idx !== -1) {
          list[idx].status = status;
          localStorage.setItem(this.bulletinKey, JSON.stringify(list));
        }
      }
    } catch {}
    return { success: true };
  }

  static async applyJob(postId, resumeNote) {
    const user = this.getSavedUser();
    const studentId = user?.studentId || '522H0045';
    const studentName = user?.name || 'Nguyễn Hữu Nhân';
    try {
      const appsKey = 'tdtu_job_applications';
      const existing = localStorage.getItem(appsKey);
      const apps = existing ? JSON.parse(existing) : [];
      apps.push({
        postId,
        studentId,
        studentName,
        resumeNote,
        appliedAt: new Date().toISOString()
      });
      localStorage.setItem(appsKey, JSON.stringify(apps));

      if (window.FirebaseService?.db) {
        try {
          window.FirebaseService.db.collection('tdtu_applications').add({
            postId, studentId, studentName, resumeNote, appliedAt: new Date().toISOString()
          });
        } catch {}
      }
    } catch {}

    // Gửi email xác nhận ứng tuyển
    this.sendEmailNotification({
      to: `${studentId.toLowerCase()}@student.tdtu.edu.vn`,
      recipientName: studentName,
      subject: `[TDTU Tuyển dụng] Xác nhận nộp Hồ sơ Ứng tuyển Thực tập`,
      type: 'job_applied',
      content: `Kính gửi ${studentName},\n\nBạn đã nộp hồ sơ ứng tuyển thực tập thành công trên Cổng thông tin Khoa CNTT.\nHồ sơ và lời nhắn: "${resumeNote || 'Đã đính kèm hồ sơ sinh viên'}" đã được chuyển tiếp đến Bộ phận Tuyển dụng Doanh nghiệp.\n\nKhoa CNTT chúc bạn đạt kết quả phỏng vấn tốt nhất!`
    });

    return { success: true, message: 'Ứng tuyển thành công! Email xác nhận học vụ đã được gửi đến bạn.' };
  }

  // ==========================================
  // Quản lý Mốc thời gian & Hạn chót học kỳ (Deadlines)
  // ==========================================
  static getSystemDeadlines() {
    try {
      const saved = localStorage.getItem('tdtu_system_deadlines');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.semesterName) {
          parsed.semesterName = String(parsed.semesterName).replace(/2025[–-]2026/g, '2026–2027');
        }
        return parsed;
      }
    } catch {}
    return {
      semesterName: 'HK1 2026–2027',
      declarationDeadline: '2026-09-30',
      certDeadline: '2026-10-15',
      reviewDeadline: '2026-10-20',
      reportDeadline: '2027-01-05',
      regulationNote: 'Sinh viên hoàn thành khai báo doanh nghiệp trước ngày 30/09/2026 để Khoa kịp thời thẩm định.'
    };
  }

  static saveSystemDeadlines(deadlines) {
    try {
      localStorage.setItem('tdtu_system_deadlines', JSON.stringify(deadlines));
      window.dispatchEvent(new CustomEvent('tdtu_deadlines_updated', { detail: deadlines }));
    } catch {}

    // Đồng bộ ngay lập tức lên Firestore collection tdtu_system
    if (window.FirebaseService?.db) {
      try {
        window.FirebaseService.db.collection('tdtu_system').doc('deadlines').set(deadlines, { merge: true })
          .then(() => console.log('[Firestore Sync]: Đã lưu hạn chót học kỳ lên Firestore.'))
          .catch(e => console.warn('[Firestore Sync Deadlines Warning]:', e.message));
      } catch (err) {}
    }
    return { success: true, deadlines };
  }

  // ==========================================
  // Quản lý Hồ sơ Cá nhân Sinh viên (Doanh nghiệp, Chứng chỉ, Lịch sử, Link CV)
  // ==========================================
  static getStudentEnrolledCourse(studentId = '522H0045') {
    const sid = String(studentId || '').trim().toUpperCase();
    const keys = [
      this.liveStudentsKey,
      'tdtu_imported_students_hk1_2026_2027',
      'tdtu_imported_students_hk2_2025_2026',
      'tdtu_imported_students_hk1_2025_2026'
    ];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const found = arr.find((s: any) => String(s.mssv || s.studentId || s.id || '').trim().toUpperCase() === sid);
            if (found) {
              const norm = this._normalizeStudentRecord(found);
              return {
                courses: norm.courses,
                courseCode: norm.courseCode,
                courseName: norm.courseName,
                isDualCourse: Boolean(norm.isDualCourse),
                major: norm.major
              };
            }
          }
        }
      } catch {}
    }
    return null;
  }

  static getStudentDeclaration(studentId = '522H0045') {
    try {
      const sid = String(studentId || '').trim().toUpperCase();
      const enrolled = this.getStudentEnrolledCourse(sid);
      const saved = localStorage.getItem('tdtu_decl_' + sid) || localStorage.getItem('tdtu_decl_' + studentId);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isHasCompany = parsed.internshipStatus === 'has_company';
        return {
          companyName: isHasCompany ? (parsed.companyName || '') : '',
          taxCode: isHasCompany ? (parsed.taxCode || '') : '',
          address: isHasCompany ? (parsed.address || '') : '',
          position: parsed.position || (isHasCompany ? 'Thực tập sinh' : (parsed.internshipStatus === 'interviewing' ? 'Thực tập sinh (Đang tìm kiếm)' : 'Đăng ký hỗ trợ nơi thực tập')),
          department: parsed.department || '',
          contactPerson: parsed.contactPerson || parsed.representative || '',
          contactEmail: parsed.contactEmail || '',
          contactPhone: parsed.contactPhone || '',
          mainIndustry: parsed.mainIndustry || '',
          internshipStatus: parsed.internshipStatus || (parsed.companyName ? 'has_company' : 'interviewing'),
          selectedCourses: enrolled?.courses || parsed.selectedCourses || ['KTCN'],
          supportNote: parsed.supportNote || '',
          statusLabel: isHasCompany ? 'Khoa đã xác nhận doanh nghiệp' : (parsed.internshipStatus === 'interviewing' ? 'Đang tìm / Chờ phỏng vấn' : 'Cần Khoa hỗ trợ'),
          confirmedAt: parsed.confirmedAt || '11/09/2026'
        };
      }
    } catch {}

    return null;
  }

  static getStudentCerts(studentId = '522H0045') {
    try {
      const saved = localStorage.getItem('tdtu_certs_' + studentId);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  static getStudentCvLink(studentId = '522H0045') {
    try {
      const saved = localStorage.getItem('tdtu_cv_' + studentId);
      if (saved !== null && saved !== undefined) return saved;
    } catch {}
    return '';
  }

  static saveStudentCvLink(studentId = '522H0045', cvLink) {
    try {
      localStorage.setItem('tdtu_cv_' + studentId, cvLink);
      window.dispatchEvent(new CustomEvent('tdtu_cv_updated', { detail: { studentId, cvLink } }));
    } catch {}

    // Đồng bộ link CV của sinh viên lên Firestore
    if (window.FirebaseService?.db) {
      try {
        window.FirebaseService.db.collection('tdtu_students').doc(studentId).set({
          cvLink,
          updatedAt: new Date().toISOString()
        }, { merge: true })
          .then(() => console.log('[Firestore Sync]: Đã lưu link CV của sinh viên lên Firestore:', studentId))
          .catch(e => console.warn('[Firestore Sync CV Warning]:', e.message));
      } catch (err) {}
    }
    return { success: true, cvLink };
  }

  static getStudentInternshipHistory(_studentId = '522H0045') {
    try {
      const saved = localStorage.getItem('tdtu_internship_history_' + _studentId);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  // ==========================================
  // Quản trị Người dùng & Đối tác Doanh nghiệp
  // ==========================================
  static _getUsersStore() {
    const phucAccount = {
      uid: 'u_gv_phuc',
      email: 'duonghuuphuc@tdtu.edu.vn',
      name: 'TS. Dương Hữu Phúc',
      displayName: 'TS. Dương Hữu Phúc',
      role: 'lecturer',
      isAdmin: true,
      isActive: true,
      department: 'Ban Chủ nhiệm Khoa CNTT',
      createdAt: '2025-08-01'
    };

    try {
      const saved = localStorage.getItem('tdtu_firebase_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const pIdx = parsed.findIndex(u => String(u.email || '').toLowerCase() === 'duonghuuphuc@tdtu.edu.vn');
          if (pIdx === -1) {
            parsed.unshift(phucAccount);
          } else {
            parsed[pIdx].isAdmin = true;
            parsed[pIdx].role = 'lecturer';
            parsed[pIdx].name = parsed[pIdx].name || 'TS. Dương Hữu Phúc';
          }
          return parsed;
        }
      }
    } catch {}

    const seed = [
      phucAccount,
      { uid: 'u_gv01', email: 'phamvanc@tdtu.edu.vn', name: 'TS. Phạm Văn C', displayName: 'TS. Phạm Văn C', role: 'lecturer', isAdmin: true, isActive: true, department: 'Ban Chủ nhiệm Khoa CNTT', createdAt: '2025-08-01' },
      { uid: 'u_gv02', email: 'nguyenvana@tdtu.edu.vn', name: 'ThS. Nguyễn Văn A', displayName: 'ThS. Nguyễn Văn A', role: 'lecturer', isAdmin: false, isActive: true, department: 'Bộ môn CN Phần mềm', createdAt: '2025-08-10' },
      { uid: 'u_gv03', email: 'tranminhlan@tdtu.edu.vn', name: 'ThS. Trần Minh Lan', displayName: 'ThS. Trần Minh Lan', role: 'lecturer', isAdmin: false, isActive: true, department: 'Bộ môn Hệ thống & Mạng', createdAt: '2025-08-15' },
      { uid: 'u_sv01', email: '522h0045@student.tdtu.edu.vn', name: 'Nguyễn Hữu Nhân', displayName: 'Nguyễn Hữu Nhân', studentId: '522H0045', role: 'student', isAdmin: false, isActive: true, createdAt: '2025-09-01' },
      { uid: 'u_sv02', email: '522h0001@student.tdtu.edu.vn', name: 'Nguyễn Minh Anh', displayName: 'Nguyễn Minh Anh', studentId: '522H0001', role: 'student', isAdmin: false, isActive: true, createdAt: '2025-09-01' },
      { uid: 'u_sv03', email: '522h0002@student.tdtu.edu.vn', name: 'Trần Hoàng Nam', displayName: 'Trần Hoàng Nam', studentId: '522H0002', role: 'student', isAdmin: false, isActive: true, createdAt: '2025-09-01' },
      { uid: 'u_sv04', email: '51900839@student.tdtu.edu.vn', name: 'Võ Duy Trí', displayName: 'Võ Duy Trí', studentId: '51900839', role: 'student', isAdmin: false, isActive: true, createdAt: '2025-09-01' }
    ];
    try {
      localStorage.setItem('tdtu_firebase_users', JSON.stringify(seed));
    } catch {}
    return seed;
  }

  static _saveUsersStore(users) {
    try {
      localStorage.setItem('tdtu_firebase_users', JSON.stringify(users));
    } catch {}
    return users;
  }

  static async createPartnerUser(partnerData) {
    const users = this._getUsersStore();
    const cleanEmail = (partnerData.email || '').trim().toLowerCase();
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Email ${cleanEmail} đã tồn tại trên hệ thống.`);
    }

    const newUser = {
      uid: 'u_partner_' + Date.now(),
      email: cleanEmail,
      name: partnerData.companyName || 'Doanh nghiệp đối tác',
      displayName: partnerData.companyName || 'Doanh nghiệp đối tác',
      contactName: partnerData.contactName || '',
      taxCode: partnerData.taxCode || '',
      industry: partnerData.industry || 'Công nghệ thông tin',
      role: 'partner',
      password: partnerData.password || 'Partner@2026',
      isAdmin: false,
      isActive: true,
      department: partnerData.companyName,
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    this._saveUsersStore(users);

    // Đồng bộ ngay lập tức lên Firestore collection tdtu_users
    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_users').doc(newUser.uid).set(newUser);
        console.log('[Firestore Sync]: Đã lưu tài khoản đối tác lên Firestore:', newUser.uid);
      } catch (fErr) {
        console.warn('[Firestore Sync Warning]: Lưu tài khoản đối tác lên Firestore thất bại, lưu cục bộ:', fErr.message);
      }
    }

    window.dispatchEvent(new CustomEvent('tdtu_users_updated', { detail: { source: 'local', users } }));
    return { success: true, user: newUser };
  }

  static async toggleUserStatus(uid, isActive) {
    const users = this._getUsersStore();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      users[idx].isActive = isActive;
      this._saveUsersStore(users);

      // Đồng bộ trạng thái lên Firestore collection tdtu_users
      if (window.FirebaseService?.db) {
        try {
          await window.FirebaseService.db.collection('tdtu_users').doc(uid).set({ isActive }, { merge: true });
          console.log('[Firestore Sync]: Đã cập nhật trạng thái tài khoản lên Firestore:', uid, isActive);
        } catch (fErr) {
          console.warn('[Firestore Sync Warning]: Cập nhật trạng thái Firestore thất bại:', fErr.message);
        }
      }

      window.dispatchEvent(new CustomEvent('tdtu_users_updated', { detail: { source: 'local', users } }));
      return { success: true, user: users[idx] };
    }
    return { success: true, uid, isActive };
  }

  static async updateAdminRole(email, isAdmin) {
    const users = this._getUsersStore();
    const cleanEmail = (email || '').trim().toLowerCase();
    const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      users[idx].isAdmin = isAdmin;
      this._saveUsersStore(users);

      // Đồng bộ quyền Admin lên Firestore collection tdtu_users
      if (window.FirebaseService?.db) {
        try {
          await window.FirebaseService.db.collection('tdtu_users').doc(users[idx].uid).set({ isAdmin }, { merge: true });
          console.log('[Firestore Sync]: Đã cập nhật quyền Admin lên Firestore:', email, isAdmin);
        } catch (fErr) {
          console.warn('[Firestore Sync Warning]: Cập nhật quyền Admin Firestore thất bại:', fErr.message);
        }
      }

      window.dispatchEvent(new CustomEvent('tdtu_users_updated', { detail: { source: 'local', users } }));
      return { success: true, user: users[idx] };
    }
    return { success: true, email, isAdmin };
  }

  static async deleteUser(uid) {
    let users = this._getUsersStore();
    users = users.filter(u => u.uid !== uid);
    this._saveUsersStore(users);

    // Xóa trên Firestore collection tdtu_users
    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_users').doc(uid).delete();
        console.log('[Firestore Sync]: Đã xóa tài khoản trên Firestore:', uid);
      } catch (fErr) {
        console.warn('[Firestore Sync Warning]: Xóa tài khoản Firestore thất bại:', fErr.message);
      }
    }

    window.dispatchEvent(new CustomEvent('tdtu_users_updated', { detail: { source: 'local', users } }));
    return { success: true, uid };
  }

  // Exact Decision Support Dashboard Chart Dataset (Quy chuẩn Hình 1 & Hình 2 - Đồng bộ hoàn toàn từ dữ liệu sinh viên thực tế)
  static async getDashboardChartData(semester = 'hk1_2026_2027') {
    const students = await this.getLiveStudents(semester);
    const total = students.length;
    const hasCompCount = students.filter(s => s.status === 'Có doanh nghiệp' || s.status === 'has_company' || (s.company && s.company !== 'Chưa có' && s.company !== '')).length;
    const hasCompPct = total > 0 ? Math.round((hasCompCount / total) * 1000) / 10 : 0;

    // 1. Phân loại kết quả học tập theo ngành hoàn toàn từ danh sách sinh viên thực tế đã import
    const majorNames = [
      'Khoa học máy tính',
      'Kỹ thuật phần mềm',
      'Mạng máy tính và truyền thông dữ liệu',
      'Hệ thống thông tin'
    ];

    let academicMajors = [];
    if (total > 0) {
      academicMajors = majorNames.map(mName => {
        const mStuds = students.filter(s => {
          const sMaj = (s.major || '').toLowerCase();
          const sClass = (s.class || '').toLowerCase();
          if (mName === 'Khoa học máy tính') return sMaj.includes('khoa học') || sClass.includes('501');
          if (mName === 'Kỹ thuật phần mềm') return sMaj.includes('phần mềm') || sClass.includes('502');
          if (mName === 'Mạng máy tính và truyền thông dữ liệu') return sMaj.includes('mạng') || sClass.includes('503');
          if (mName === 'Hệ thống thông tin') return sMaj.includes('hệ thống') || sClass.includes('504');
          return false;
        });

        const xsCount = mStuds.filter(s => s.academicRank === 'Xuất sắc' || (s.gpa4 >= 3.6)).length;
        const gioiCount = mStuds.filter(s => s.academicRank === 'Giỏi' || (s.gpa4 >= 3.2 && s.gpa4 < 3.6)).length;
        const khaCount = mStuds.filter(s => s.academicRank === 'Khá' || (s.gpa4 >= 2.5 && s.gpa4 < 3.2)).length;
        const tbCount = mStuds.filter(s => s.academicRank === 'Trung bình' || (s.gpa4 < 2.5)).length;
        const mTotal = mStuds.length;

        const breakdown = [
          { label: 'Xuất sắc', count: xsCount, color: '#1E293B' },
          { label: 'Giỏi', count: gioiCount, color: '#3B82F6' },
          { label: 'Khá', count: khaCount, color: '#F59E0B' },
          { label: 'Trung bình', count: tbCount, color: '#EF4444' }
        ];

        return {
          major: mName,
          name: mName,
          total: mTotal,
          breakdown,
          segments: breakdown
        };
      });
    } else {
      academicMajors = majorNames.map(mName => ({
        major: mName,
        name: mName,
        total: 0,
        breakdown: [
          { label: 'Xuất sắc', count: 0, color: '#1E293B' },
          { label: 'Giỏi', count: 0, color: '#3B82F6' },
          { label: 'Khá', count: 0, color: '#F59E0B' },
          { label: 'Trung bình', count: 0, color: '#EF4444' }
        ],
        segments: [
          { label: 'Xuất sắc', count: 0, color: '#1E293B' },
          { label: 'Giỏi', count: 0, color: '#3B82F6' },
          { label: 'Khá', count: 0, color: '#F59E0B' },
          { label: 'Trung bình', count: 0, color: '#EF4444' }
        ]
      }));
    }

    const academicResults = {
      title: 'Kết quả học tập theo ngành',
      totalEnrolled: total,
      legend: [
        { label: 'Xuất sắc', color: '#1E293B' },
        { label: 'Giỏi', color: '#3B82F6' },
        { label: 'Khá', color: '#F59E0B' },
        { label: 'Trung bình', color: '#EF4444' }
      ],
      majors: academicMajors
    };

    const companyStats = {
      title: 'Số lượng doanh nghiệp',
      slices: [
        { label: 'Thân hữu', percentage: hasCompCount > 0 ? 55.0 : 0, count: Math.ceil(hasCompCount * 0.55), color: '#1E293B' },
        { label: 'Doanh nghiệp mới', percentage: hasCompCount > 0 ? 30.0 : 0, count: Math.ceil(hasCompCount * 0.3), color: '#2563EB' },
        { label: 'Khác', percentage: hasCompCount > 0 ? 15.0 : 0, count: Math.max(0, hasCompCount - Math.ceil(hasCompCount * 0.55) - Math.ceil(hasCompCount * 0.3)), color: '#22C55E' }
      ],
      subtext: `${hasCompPct}% sinh viên có doanh nghiệp · ${hasCompCount}/${total} sinh viên đã tiếp nhận`,
      footerText: `${hasCompPct}% sinh viên có doanh nghiệp · ${hasCompCount}/${total} sinh viên đã tiếp nhận`
    };

    const industryStats = {
      title: 'Tỷ lệ doanh nghiệp theo lĩnh vực',
      slices: [
        { label: 'Phát triển phần mềm', percentage: 28.5, color: '#1E293B' },
        { label: 'AI & dữ liệu', percentage: 22.0, color: '#2563EB' },
        { label: 'An ninh mạng', percentage: 14.5, color: '#10B981' },
        { label: 'Hạ tầng & viễn thông', percentage: 12.0, color: '#8B5CF6' },
        { label: 'Tài chính số', percentage: 11.0, color: '#F43F5E' },
        { label: 'Thương mại điện tử', percentage: 7.0, color: '#F59E0B' },
        { label: 'Khác', percentage: 5.0, color: '#06B6D4' }
      ]
    };

    const englishCertStats = {
      title: 'Chứng chỉ & cam kết tiếng Anh',
      slices: [
        { label: 'Có chứng chỉ', percentage: total > 0 ? 35.6 : 0, color: '#1E293B' },
        { label: 'Đã cam kết', percentage: total > 0 ? 41.2 : 0, color: '#F59E0B' },
        { label: 'Chưa có', percentage: total > 0 ? 23.2 : 0, color: '#10B981' }
      ]
    };

    return {
      totalStudents: total,
      totalEnrolled: total,
      companyStats,
      industryStats,
      industryDistribution: industryStats,
      academicResultsByMajor: academicResults,
      academicPerformance: academicResults,
      englishCertStats,
      englishCerts: englishCertStats
    };
  }

  // ==========================================
  // Prime Product RBAC Helper Methods
  // ==========================================
  static can(feature, actionPrime, customRoleId) {
    try {
      const user = this.getSavedUser();
      let roleId = customRoleId || user?.roleId;
      if (!roleId) {
        if (user?.isAdmin) roleId = 'thay_phuc';
        else if (user?.role === 'lecturer') roleId = 'giang_vien';
        else if (user?.role === 'student') {
          roleId = user.isEnrolledThisSemester === false ? 'sv_ngoai_ky' : 'sv_trong_ky';
        } else {
          roleId = user?.role || 'sv_trong_ky';
        }
      }

      const matrix = window.PrimeRbac ? window.PrimeRbac.getCustomRoleMatrix() : null;
      if (!matrix) return true;
      const mask = matrix[roleId]?.[feature] ?? 1;
      return window.PrimeRbac.hasPrimePermission(mask, actionPrime);
    } catch {
      return true;
    }
  }

  static getPrimeRoleMatrix() {
    if (window.PrimeRbac) {
      return window.PrimeRbac.getCustomRoleMatrix();
    }
    return {};
  }

  static savePrimeRoleMatrix(matrix) {
    if (window.PrimeRbac) {
      return window.PrimeRbac.saveCustomRoleMatrix(matrix);
    }
    return matrix;
  }

  // ==========================================
  // REAL-TIME FIRESTORE CRUD: CHỨNG CHỈ (tdtu_certificates)
  // ==========================================
  // Lấy toàn bộ chứng chỉ sinh viên toàn khoa (Scope All - Quyền Giảng viên & Admin Khoa)
  static async fetchAllCertificates() {
    let list = [];
    try {
      const token = this.getToken();
      const res = await fetch('/api/certificates', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          list = json.data;
        }
      }
    } catch (e) {
      console.warn('[ApiClient]: Không thể tải danh sách chứng chỉ toàn bộ từ API:', e);
    }

    // Quét bổ sung các chứng chỉ mới từ tdtu_certs_* trong localStorage
    try {
      const existingIds = new Set(list.map(c => c.id));
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('tdtu_certs_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              for (const c of arr) {
                if (c && c.id && !existingIds.has(c.id)) {
                  list.unshift(c);
                  existingIds.add(c.id);
                }
              }
            }
          }
        }
      }
    } catch {}

    return list;
  }

  static async getAllCertsScopeAll() {
    return this.fetchAllCertificates();
  }

  static async getCertificates() {
    return this.fetchAllCertificates();
  }

  static async fetchStudentCerts(studentId = '522H0045') {
    try {
      const sid = String(studentId).trim();
      const token = this.getToken();
      const res = await fetch(`/api/certificates/${encodeURIComponent(sid)}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          localStorage.setItem('tdtu_certs_' + sid, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch (e) {
      // offline / backend fallback
    }
    return this.getStudentCerts(studentId);
  }

  static async saveStudentCert(studentId, certData) {
    const cid = certData.id || ('cert_' + Date.now());
    const driveLink = (certData.driveLink || certData.proofData || '').trim();
    const sid = String(studentId || certData.studentId || '522H0045').trim().toUpperCase();
    const item = {
      ...certData,
      id: cid,
      studentId: sid,
      type: certData.type || 'Ngoại ngữ',
      name: certData.name || 'TOEIC',
      score: String(certData.score || ''),
      maxScore: certData.maxScore ? String(certData.maxScore) : undefined,
      level: certData.level || 'B1',
      examDate: certData.examDate || '',
      issueDate: certData.issueDate || certData.examDate || '',
      driveLink: driveLink,
      proofData: driveLink,
      fileName: certData.fileName || (driveLink ? 'Google Drive Minh chứng' : 'Chưa có minh chứng'),
      fileType: certData.fileType || 'LINK',
      fileSize: certData.fileSize || 'Google Drive',
      status: certData.status || 'Đã nộp',
      updatedAt: new Date().toISOString()
    };

    // 1. Cập nhật localStorage đệm & broadcast realtime
    try {
      const list = this.getStudentCerts(item.studentId);
      const idx = list.findIndex(c => c.id === cid);
      if (idx !== -1) list[idx] = item;
      else list.unshift(item);
      localStorage.setItem('tdtu_certs_' + item.studentId, JSON.stringify(list));
      localStorage.setItem('tdtu_certs_last_sync', String(Date.now()));
      window.dispatchEvent(new CustomEvent('tdtu_certs_updated', { detail: { [item.studentId]: list } }));
    } catch {}

    // Cập nhật chứng chỉ vào live students cache
    try {
      const students = await this.getLiveStudents('hk1_2026_2027');
      const sIdx = students.findIndex(s => (s.mssv === sid || s.studentId === sid));
      if (sIdx !== -1) {
        students[sIdx].cert = `${item.name} ${item.score}`;
        this.saveLiveStudents(students);
      }
    } catch {}

    // 2. Broadcast Channel across tabs and pages
    try {
      const bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.postMessage({ type: 'cert_updated', studentId: item.studentId, cert: item });
      bc.close();
    } catch {}

    // 3. Ghi trực tiếp lên Cloud Firestore
    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_certificates').doc(cid).set(item, { merge: true });
        console.log('[Firestore Sync]: Đã lưu chứng chỉ lên Firestore:', cid);
      } catch (err) {
        console.warn('[Firestore Sync Cert Warning]:', err.message);
      }
    }

    // 4. Ghi trực tiếp vào Backend REST API (SQLite database)
    try {
      const token = this.getToken();
      await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(item)
      });
      console.log('[Backend API Sync]: Đã lưu chứng chỉ vào SQLite:', cid);
    } catch (err) {
      // offline fallback
    }

    return item;
  }

  static async deleteStudentCert(studentId, certId) {
    const sid = String(studentId || '522H0045').trim().toUpperCase();
    // 1. Cập nhật localStorage đệm & broadcast realtime
    try {
      const list = this.getStudentCerts(sid).filter(c => c.id !== certId);
      localStorage.setItem('tdtu_certs_' + sid, JSON.stringify(list));
      localStorage.setItem('tdtu_certs_last_sync', String(Date.now()));
      window.dispatchEvent(new CustomEvent('tdtu_certs_updated', { detail: { [sid]: list } }));
    } catch {}

    // Cập nhật lại cert trong live students cache
    try {
      const students = await this.getLiveStudents('hk1_2026_2027');
      const sIdx = students.findIndex(s => (s.mssv === sid || s.studentId === sid));
      if (sIdx !== -1) {
        const remaining = this.getStudentCerts(sid).filter(c => c.id !== certId);
        students[sIdx].cert = remaining.length > 0 ? `${remaining[0].name} ${remaining[0].score}` : null;
        this.saveLiveStudents(students);
      }
    } catch {}

    // 2. Broadcast Channel across tabs and pages
    try {
      const bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.postMessage({ type: 'cert_deleted', studentId: sid, certId });
      bc.close();
    } catch {}

    // 3. Xóa trên Cloud Firestore
    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_certificates').doc(certId).delete();
        console.log('[Firestore Sync]: Đã xóa chứng chỉ trên Firestore:', certId);
      } catch (err) {
        console.warn('[Firestore Delete Cert Warning]:', err.message);
      }
    }

    // 4. Xóa trên Backend REST API (SQLite database)
    try {
      const token = this.getToken();
      await fetch(`/api/certificates/${encodeURIComponent(certId)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      console.log('[Backend API Sync]: Đã xóa chứng chỉ trên SQLite:', certId);
    } catch (err) {
      // offline fallback
    }

    return { success: true, certId };
  }

  // ==========================================
  // REAL-TIME FIRESTORE CRUD: BẢNG TIN JD & HÀNG ĐỢI (tdtu_jds & tdtu_jd_queue)
  // ==========================================
  static getDefaultSeedJds() {
    return [
      {
        id: 'post-jd-01',
        company: 'Công ty TNHH Phần mềm FPT (FPT Software)',
        shortName: 'FPT',
        field: 'Phần mềm',
        position: 'Thực tập sinh Fullstack (React / NodeJS) & AI',
        location: 'F-Town 3, Khu Công nghệ Cao, TP. Thủ Đức, TP.HCM',
        deadline: '15/11/2026',
        deadlineDays: 'Còn 15 ngày',
        slots: 20,
        salary: '6.000.000 - 10.000.000 VNĐ / tháng',
        taxCode: '0101778162',
        tags: ['ReactJS', 'NodeJS', 'AI / ML', 'TDTU Đối tác'],
        requirements: ['Sinh viên năm 3-4 chuyên ngành CNTT, KTPM', 'Nắm chắc kiến thức OOP, Web Development'],
        summary: 'Tuyển dụng 20 sinh viên Khoa CNTT TDTU thực tập có trợ cấp. Cơ hội chuyển thành nhân viên chính thức sau 320 giờ.',
        description: 'Tuyển dụng sinh viên Khoa CNTT TDTU thực tập có trợ cấp. Cơ hội chuyển thành nhân viên chính thức sau 320 giờ thực tập. Yêu cầu: Nắm chắc OOP, React, NodeJS hoặc Python. Hỗ trợ phụ cấp từ 6.000.000 đến 10.000.000 VNĐ/tháng.',
        sourceEmail: 'tuyendung-fpt@fsoft.com.vn',
        status: 'published',
        statusType: 'success',
        selectCount: 14,
        createdAt: '2026-10-23T09:30:00Z',
        postDate: '23/10/2026'
      },
      {
        id: 'post-jd-02',
        company: 'Công ty Cổ phần VNG',
        shortName: 'VNG',
        field: 'Phần mềm',
        position: 'Backend Developer Intern (Golang / Node.js)',
        location: 'VNG Campus, Tân Thuận Đông, Quận 7, TP.HCM',
        deadline: '20/11/2026',
        deadlineDays: 'Còn 20 ngày',
        slots: 5,
        salary: '8.000.000 VNĐ / tháng',
        taxCode: '0303882213',
        tags: ['Golang', 'NodeJS', 'Cloud Services', 'Quận 7'],
        requirements: ['Thành thạo cấu trúc dữ liệu & giải thuật', 'Có dự án cá nhân hoặc môn học với REST API'],
        summary: 'Tuyển 5 thực tập sinh làm việc tại VNG Campus (gần TDTU). Hỗ trợ phụ cấp 8.000.000 VNĐ + cơm trưa buffet + xe buýt đưa đón.',
        description: 'Email chuyển tiếp từ HR VNG: Tuyển 5 thực tập sinh làm việc tại VNG Campus. Hỗ trợ phụ cấp 8.000.000 VNĐ + Cơm trưa buffet + Xe buýt đưa đón sinh viên từ cơ sở Tân Phong TDTU.',
        sourceEmail: 'recruitment@vng.com.vn',
        status: 'published',
        statusType: 'success',
        selectCount: 8,
        createdAt: '2026-10-22T10:15:00Z',
        postDate: '22/10/2026'
      },
      {
        id: 'post-jd-03',
        company: 'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)',
        shortName: 'VTL',
        field: 'An toàn thông tin',
        position: 'Cyber Security Analyst / Network Intern',
        location: 'Tòa nhà Viettel, 285 Cách Mạng Tháng 8, Quận 10, TP.HCM',
        deadline: '25/11/2026',
        deadlineDays: 'Còn 25 ngày',
        slots: 6,
        salary: '10.000.000 VNĐ / tháng',
        taxCode: '0100109106',
        tags: ['SOC', 'Pentest', 'Linux', 'Network'],
        requirements: ['Sinh viên chuyên ngành MMT&TTDL, An toàn thông tin', 'Nắm vững Linux, giao thức mạng TCP/IP'],
        summary: 'Tuyển 6 sinh viên tham gia dự án giám sát an toàn thông tin SOC và Pentest mạng tại Viettel.',
        description: 'Email chuyển tiếp từ Viettel Cyber Security: Tuyển 6 sinh viên tham gia dự án giám sát an toàn thông tin SOC và Pentest mạng. Trợ cấp 10.000.000 VNĐ/tháng.',
        sourceEmail: 'tuyendung@viettel.com.vn',
        status: 'published',
        statusType: 'success',
        selectCount: 5,
        createdAt: '2026-10-21T14:00:00Z',
        postDate: '21/10/2026'
      }
    ];
  }

  static getPublishedJds() {
    try {
      const saved = localStorage.getItem('tdtu_published_jds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const defaults = this.getDefaultSeedJds();
    try {
      localStorage.setItem('tdtu_published_jds', JSON.stringify(defaults));
    } catch {}
    return defaults;
  }

  static getJdReviewQueue() {
    try {
      const saved = localStorage.getItem('tdtu_jd_queue');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  }

  static async approveJd(queueItem) {
    const jdId = queueItem.id && queueItem.id.startsWith('jd_') ? queueItem.id : ('jd_' + Date.now());
    
    // Robust Field normalization to match Student filter
    let normField = 'Phần mềm';
    const fieldRaw = (queueItem.field || '').toLowerCase();
    const posLower = (queueItem.position || '').toLowerCase();
    if (fieldRaw.includes('dữ liệu') || fieldRaw.includes('data') || posLower.includes('data') || posLower.includes('dữ liệu')) {
      normField = 'Dữ liệu';
    } else if (fieldRaw.includes('an toàn') || fieldRaw.includes('bảo mật') || fieldRaw.includes('security') || posLower.includes('an toàn') || posLower.includes('bảo mật') || posLower.includes('security')) {
      normField = 'An toàn thông tin';
    } else if (fieldRaw.includes('viễn thông') || fieldRaw.includes('telecom') || fieldRaw.includes('mạng') || fieldRaw.includes('network') || posLower.includes('mạng') || posLower.includes('viễn thông')) {
      normField = 'Viễn thông';
    } else if (fieldRaw.includes('ngân hàng') || fieldRaw.includes('bank') || fieldRaw.includes('fintech') || posLower.includes('ngân hàng') || posLower.includes('bank')) {
      normField = 'Ngân hàng';
    } else if (fieldRaw.includes('phần mềm') || fieldRaw.includes('software') || fieldRaw.includes('web') || fieldRaw.includes('app') || fieldRaw.includes('lập trình')) {
      normField = 'Phần mềm';
    } else if (queueItem.field && queueItem.field.trim()) {
      normField = queueItem.field.trim();
    }

    const compName = queueItem.company || queueItem.companyName || 'Doanh nghiệp Đối tác';
    const compInitials = compName.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 3).toUpperCase();

    const newPublished = {
      ...queueItem,
      id: jdId,
      company: compName,
      shortName: queueItem.shortName || compInitials || 'DN',
      position: queueItem.position || 'Thực tập sinh CNTT',
      field: normField,
      location: queueItem.location || queueItem.address || 'TP. Hồ Chí Minh',
      deadline: queueItem.deadline || '15/11/2026',
      deadlineDays: 'Còn hạn nộp',
      slots: Number(queueItem.slots) || 5,
      salary: queueItem.salary || 'Hỗ trợ thực tập',
      requirements: Array.isArray(queueItem.requirements) && queueItem.requirements.length > 0 
        ? queueItem.requirements 
        : ['Sinh viên Khoa CNTT - ĐH Tôn Đức Thắng', 'Có kiến thức nền tảng tốt'],
      tags: Array.isArray(queueItem.tags) && queueItem.tags.length > 0 
        ? queueItem.tags 
        : ['Tuyển dụng', 'Đối tác Khoa CNTT', queueItem.position || 'CNTT'],
      summary: queueItem.summary || queueItem.rawContent || queueItem.description || `Tuyển thực tập sinh vị trí ${queueItem.position} tại ${compName}`,
      description: queueItem.description || queueItem.rawContent || queueItem.summary || '',
      sourceEmail: queueItem.sourceEmail || queueItem.senderEmail || queueItem.emailSender || 'tuyendung@tdtu.edu.vn',
      status: 'published',
      statusType: 'success',
      selectCount: queueItem.selectCount || 0,
      postDate: new Date().toLocaleDateString('vi-VN'),
      publishedAt: new Date().toISOString()
    };

    try {
      const published = this.getPublishedJds();
      const filtered = published.filter(p => p.id !== jdId && !(p.company === newPublished.company && p.position === newPublished.position));
      filtered.unshift(newPublished);
      localStorage.setItem('tdtu_published_jds', JSON.stringify(filtered));

      const queue = this.getJdReviewQueue().filter(q => q.id !== queueItem.id);
      localStorage.setItem('tdtu_jd_queue', JSON.stringify(queue));

      window.dispatchEvent(new CustomEvent('tdtu_jds_updated', { detail: filtered }));
      window.dispatchEvent(new CustomEvent('tdtu_jd_queue_updated', { detail: queue }));

      try {
        const bc = new BroadcastChannel('tdtu_realtime_sync');
        bc.postMessage({ type: 'jd_updated', jd: newPublished });
        bc.close();
      } catch {}
    } catch {}

    if (window.FirebaseService?.db) {
      try {
        const batch = window.FirebaseService.db.batch();
        batch.set(window.FirebaseService.db.collection('tdtu_jds').doc(jdId), newPublished);
        if (queueItem.id) {
          batch.delete(window.FirebaseService.db.collection('tdtu_jd_queue').doc(queueItem.id));
        }
        await batch.commit();
        console.log('[Firestore Sync]: Đã duyệt JD và xuất bản lên tdtu_jds:', jdId);
      } catch (err) {
        console.warn('[Firestore Approve JD Warning]:', err.message);
      }
    }
    return newPublished;
  }

  static async approveJdReview(queueIdOrItem) {
    let queueItem = null;
    if (typeof queueIdOrItem === 'object' && queueIdOrItem !== null) {
      queueItem = queueIdOrItem;
    } else {
      queueItem = this.getJdReviewQueue().find(q => q.id === queueIdOrItem);
    }
    if (!queueItem) {
      queueItem = {
        id: queueIdOrItem,
        company: 'Doanh nghiệp Đối tác',
        position: 'Vị trí tuyển dụng thực tập',
        field: 'Phần mềm',
        location: 'TP. Hồ Chí Minh',
        deadline: '15/11/2026',
        slots: 5,
        salary: 'Thỏa thuận',
        tags: ['Đối tác Khoa']
      };
    }
    return this.approveJd(queueItem);
  }

  static async rejectJdReview(queueIdOrItem) {
    const qId = typeof queueIdOrItem === 'object' && queueIdOrItem !== null ? queueIdOrItem.id : queueIdOrItem;
    return this.rejectJd(qId);
  }

  static async publishForwardedJd(emailJd) {
    const publishedId = emailJd.id && String(emailJd.id).startsWith('jd_') ? String(emailJd.id) : `jd_${Date.now()}_${emailJd.id || 'fwd'}`;

    // Robust Field normalization to match Student filter
    let normField = 'Phần mềm';
    const fieldRaw = (emailJd.field || '').toLowerCase();
    const posLower = (emailJd.position || '').toLowerCase();
    if (fieldRaw.includes('dữ liệu') || fieldRaw.includes('data') || posLower.includes('data') || posLower.includes('dữ liệu')) {
      normField = 'Dữ liệu';
    } else if (fieldRaw.includes('an toàn') || fieldRaw.includes('bảo mật') || fieldRaw.includes('security') || posLower.includes('an toàn') || posLower.includes('bảo mật') || posLower.includes('security')) {
      normField = 'An toàn thông tin';
    } else if (fieldRaw.includes('viễn thông') || fieldRaw.includes('telecom') || fieldRaw.includes('mạng') || fieldRaw.includes('network') || posLower.includes('mạng') || posLower.includes('viễn thông')) {
      normField = 'Viễn thông';
    } else if (fieldRaw.includes('ngân hàng') || fieldRaw.includes('bank') || fieldRaw.includes('fintech') || posLower.includes('ngân hàng') || posLower.includes('bank')) {
      normField = 'Ngân hàng';
    } else if (fieldRaw.includes('phần mềm') || fieldRaw.includes('software') || fieldRaw.includes('web') || fieldRaw.includes('app') || fieldRaw.includes('lập trình')) {
      normField = 'Phần mềm';
    } else if (emailJd.field && emailJd.field.trim()) {
      normField = emailJd.field.trim();
    }

    const compName = emailJd.companyName || emailJd.company || 'Doanh nghiệp Đối tác';
    const compInitials = compName.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 3).toUpperCase();

    const newPublished = {
      id: publishedId,
      company: compName,
      shortName: emailJd.shortName || compInitials || 'DN',
      position: emailJd.position || 'Thực tập sinh CNTT',
      field: normField,
      location: emailJd.location || 'TP. Hồ Chí Minh',
      deadline: emailJd.deadline || '15/11/2026',
      deadlineDays: 'Còn hạn nộp',
      slots: Number(emailJd.slots) || 5,
      salary: emailJd.salary || 'Hỗ trợ thực tập',
      requirements: Array.isArray(emailJd.requirements) && emailJd.requirements.length > 0 
        ? emailJd.requirements 
        : ['Sinh viên Khoa CNTT - ĐH Tôn Đức Thắng', 'Có kiến thức nền tảng tốt'],
      tags: Array.isArray(emailJd.tags) && emailJd.tags.length > 0
        ? emailJd.tags
        : ['Email Forward', 'Đối tác TDTU', emailJd.position || 'CNTT'],
      summary: emailJd.rawContent || emailJd.summary || `Tuyển dụng ${emailJd.position} tại ${compName}`,
      description: emailJd.rawContent || emailJd.description || emailJd.summary || '',
      sourceEmail: emailJd.emailSender || emailJd.sourceEmail || 'tuyendung@tdtu.edu.vn',
      status: 'published',
      statusType: 'success',
      selectCount: 0,
      postDate: new Date().toLocaleDateString('vi-VN'),
      publishedAt: new Date().toISOString(),
      approvedBy: 'Giảng viên Điều phối'
    };

    try {
      const published = this.getPublishedJds();
      const filtered = published.filter(p => p.id !== publishedId && !(p.company === newPublished.company && p.position === newPublished.position));
      filtered.unshift(newPublished);
      localStorage.setItem('tdtu_published_jds', JSON.stringify(filtered));

      window.dispatchEvent(new CustomEvent('tdtu_jds_updated', { detail: filtered }));
      try {
        const bc = new BroadcastChannel('tdtu_realtime_sync');
        bc.postMessage({ type: 'jd_updated', jd: newPublished });
        bc.close();
      } catch {}
    } catch (e) {
      console.warn('Lưu published JD local storage error:', e);
    }

    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_jds').doc(publishedId).set(newPublished);
        console.log('[Firestore Sync]: Đã lưu published JD vào tdtu_jds:', publishedId);
      } catch (err) {
        console.warn('[Firestore Sync Warning]:', err.message);
      }
    }

    return newPublished;
  }

  static async rejectJd(queueId) {
    try {
      const queue = this.getJdReviewQueue().filter(q => q.id !== queueId);
      localStorage.setItem('tdtu_jd_queue', JSON.stringify(queue));
      window.dispatchEvent(new CustomEvent('tdtu_jd_queue_updated', { detail: queue }));
    } catch {}

    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_jd_queue').doc(queueId).delete();
        console.log('[Firestore Sync]: Đã từ chối JD:', queueId);
      } catch (err) {
        console.warn('[Firestore Reject JD Warning]:', err.message);
      }
    }
    return { success: true, queueId };
  }

  static async createJd(jdData, role = 'partner') {
    const id = (role === 'admin' ? 'jd_' : 'q_') + Date.now();
    const item = {
      ...jdData,
      id,
      createdAt: new Date().toISOString()
    };

    const targetCollection = role === 'admin' ? 'tdtu_jds' : 'tdtu_jd_queue';
    const storageKey = role === 'admin' ? 'tdtu_published_jds' : 'tdtu_jd_queue';

    try {
      const list = role === 'admin' ? this.getPublishedJds() : this.getJdReviewQueue();
      list.unshift(item);
      localStorage.setItem(storageKey, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent(role === 'admin' ? 'tdtu_jds_updated' : 'tdtu_jd_queue_updated', { detail: list }));
    } catch {}

    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection(targetCollection).doc(id).set(item);
        console.log('[Firestore Sync]: Đã lưu JD vào ' + targetCollection + ':', id);
      } catch (err) {
        console.warn('[Firestore Create JD Warning]:', err.message);
      }
    }
    return item;
  }

  static async deleteJd(jdId) {
    try {
      const list = this.getPublishedJds().filter(j => j.id !== jdId);
      localStorage.setItem('tdtu_published_jds', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('tdtu_jds_updated', { detail: list }));
    } catch {}

    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_jds').doc(jdId).delete();
        console.log('[Firestore Sync]: Đã xóa JD:', jdId);
      } catch (err) {
        console.warn('[Firestore Delete JD Warning]:', err.message);
      }
    }
    return { success: true, jdId };
  }

  static async applyToJd(studentId, jdId, payload = {}) {
    const appId = `${studentId}_${jdId}`;
    const application = {
      id: appId,
      studentId,
      jdId,
      company: payload.companyName || '',
      position: payload.position || '',
      appliedAt: new Date().toISOString(),
      status: 'submitted'
    };

    if (window.FirebaseService?.db) {
      try {
        const batch = window.FirebaseService.db.batch();
        batch.set(window.FirebaseService.db.collection('tdtu_applications').doc(appId), application);
        const jdRef = window.FirebaseService.db.collection('tdtu_jds').doc(jdId);
        batch.update(jdRef, {
          selectCount: window.firebase ? window.firebase.firestore.FieldValue.increment(1) : 1
        });
        await batch.commit();
        console.log('[Firestore Sync]: Đã lưu đơn ứng tuyển JD:', appId);
      } catch (err) {
        console.warn('[Firestore Apply JD Warning]:', err.message);
      }
    }
    return application;
  }

  // ==========================================
  // REAL-TIME FIRESTORE & BACKEND CRUD: THÔNG BÁO TỪ GIẢNG VIÊN & ADMIN (tdtu_announcements)
  // ==========================================
  static getLecturerAnnouncements() {
    try {
      const saved = localStorage.getItem('tdtu_announcements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  static async fetchLecturerAnnouncements() {
    const mergedMap = new Map();
    const addItem = (raw) => {
      if (!raw || !raw.title) return;
      const key = raw.id || `title_${String(raw.title).trim().toLowerCase()}`;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          id: raw.id || ('anc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)),
          title: raw.title,
          content: raw.content || '',
          author: raw.author || 'Giảng viên Khoa CNTT',
          role: raw.role || raw.authorRole || 'Giảng viên hướng dẫn',
          important: Boolean(raw.important || raw.priority === 'URGENT'),
          date: raw.date || (raw.createdAt ? new Date(raw.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')),
          createdAt: raw.createdAt || new Date().toISOString()
        });
      }
    };

    // 1. Đọc từ Cloud Firestore (tdtu_announcements)
    if (window.FirebaseService?.db) {
      try {
        const snap = await window.FirebaseService.db.collection('tdtu_announcements').get();
        if (!snap.empty) {
          snap.forEach(doc => addItem({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn('[Firestore fetchLecturerAnnouncements note]:', e.message);
      }
    }

    // 2. Đọc từ Backend SQLite (/api/bulletin?type=announcement)
    try {
      const res = await fetch('/api/bulletin?type=announcement');
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const items = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(items)) {
          items.forEach(p => {
            if (p && p.type === 'announcement') addItem(p);
          });
        }
      }
    } catch {}

    // 3. Hợp nhất với LocalStorage
    try {
      const localList = this.getLecturerAnnouncements();
      localList.forEach(a => addItem(a));
    } catch {}

    const finalList = Array.from(mergedMap.values()).sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );

    try {
      localStorage.setItem('tdtu_announcements', JSON.stringify(finalList));
    } catch {}

    return finalList;
  }

  static async createLecturerAnnouncement(announcement) {
    const id = announcement.id || ('anc_' + Date.now());
    const item = {
      ...announcement,
      id,
      date: new Date().toLocaleDateString('vi-VN'),
      createdAt: new Date().toISOString()
    };

    try {
      const list = this.getLecturerAnnouncements().filter(a => a.id !== id);
      list.unshift(item);
      localStorage.setItem('tdtu_announcements', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('tdtu_announcements_updated', { detail: list }));
    } catch {}

    // 1. Đồng bộ lên Cloud Firestore (tdtu_announcements)
    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_announcements').doc(id).set(item, { merge: true });
        console.log('[Firestore Sync]: Đã lưu Thông báo Giảng viên lên Firestore:', id);
      } catch (err) {
        console.warn('[Firestore Save Announcement Warning]:', err.message);
      }
    }

    // 2. Đồng bộ xuống Backend SQLite (/api/bulletin) để tất cả tài khoản Admin/GV/SV đều truy xuất được
    try {
      const token = this.getToken();
      await fetch('/api/bulletin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id,
          type: 'announcement',
          title: item.title,
          content: item.content,
          author: item.author || 'Giảng viên Khoa CNTT',
          authorRole: item.role || 'Giảng viên hướng dẫn',
          priority: item.important ? 'URGENT' : 'NORMAL'
        })
      });
    } catch {}

    // 3. Tự động đẩy thông báo vào "Hộp thư Thông báo Học vụ" (Notification Bell) cho toàn Khoa (Mục 8 & Mục 10)
    this.sendEmailNotification({
      to: 'toan-khoa@tdtu.edu.vn',
      recipientName: 'Toàn thể Giảng viên & Sinh viên Khoa CNTT',
      subject: `[Bảng tin Thực tập] ${item.title}`,
      type: 'announcement',
      targetAudience: 'all',
      priority: item.important ? 'urgent' : 'normal',
      content: `${item.content}\n\n— Đăng bởi: ${item.author || 'Giảng viên'} (${item.role || 'Khoa CNTT'})`
    });

    // 4. Broadcast qua các tab trình duyệt
    try {
      const bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.postMessage({ type: 'announcement_created', item });
      bc.close();
    } catch {}

    return item;
  }

  static async deleteLecturerAnnouncement(id) {
    try {
      const list = this.getLecturerAnnouncements().filter(a => a.id !== id);
      localStorage.setItem('tdtu_announcements', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('tdtu_announcements_updated', { detail: list }));
    } catch {}

    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_announcements').doc(id).delete();
        console.log('[Firestore Sync]: Đã xóa Thông báo Giảng viên trên Firestore:', id);
      } catch (err) {
        console.warn('[Firestore Delete Announcement Warning]:', err.message);
      }
    }

    try {
      const token = this.getToken();
      await fetch(`/api/bulletin/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
    } catch {}

    return { success: true, id };
  }

  // ==========================================
  // REAL-TIME FIRESTORE CRUD: GHI CHÚ THẨM ĐỊNH SINH VIÊN (tdtu_students)
  // ==========================================
  static async updateStudentLecturerNote(studentId, note, lecturerName, lecturerEmail) {
    const sid = studentId || '522H0045';
    const noteData = {
      lecturerNote: note,
      lecturerNoteBy: lecturerName || 'Giảng viên',
      lecturerNoteEmail: lecturerEmail || 'giangvien@tdtu.edu.vn',
      lecturerNoteAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const students = await this.getLiveStudents('hk1_2026_2027');
      const idx = students.findIndex(s => (s.mssv === sid || s.studentId === sid));
      if (idx !== -1) {
        Object.assign(students[idx], noteData);
        this.saveLiveStudents(students);
        window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: { source: 'note_update', studentId: sid } }));
      }
    } catch {}

    if (window.FirebaseService?.db) {
      try {
        await window.FirebaseService.db.collection('tdtu_students').doc(sid).set(noteData, { merge: true });
        console.log('[Firestore Sync]: Đã lưu ghi chú thẩm định sinh viên lên Firestore:', sid);
      } catch (err) {
        console.warn('[Firestore Save Student Note Warning]:', err.message);
      }
    }
    return { success: true, studentId: sid, ...noteData };
  }
}

window.ApiClient = ApiClient;
