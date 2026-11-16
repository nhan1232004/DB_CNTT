// Module Registry, SPA Deep-Linking Router, 3-Tier SyncManager & Namespace Container
// Thiết kế chuẩn Kiến trúc Mở rộng 5 Năm (Open-Closed Principle) - Khoa CNTT TDTU

(function (root) {
  // ============================================================================
  // 1. MODULE REGISTRY (Open-Closed Principle: Thêm module chỉ cần khai báo 1 dòng)
  // ============================================================================
  const MODULE_DEFINITIONS = [
    {
      id: 'dashboard',
      path: '/dashboard',
      aliases: ['/', '/index.html', '/overview', '/tong-quan'],
      featureKey: 'dashboard',
      componentName: 'DashboardPage',
      label: 'Tổng quan',
      group: 'main',
      allowOutSemesterStudent: true,
      allowPartner: true
    },
    {
      id: 'declaration',
      path: '/declarations',
      aliases: ['/declaration', '/khai-bao'],
      featureKey: 'declaration',
      componentName: 'DeclarationPage',
      label: 'Khai báo thực tập',
      group: 'main',
      allowOutSemesterStudent: false,
      allowPartner: false,
      disallowFacultyStaff: true
    },
    {
      id: 'students',
      path: '/students',
      aliases: ['/sinh-vien', '/student-list'],
      featureKey: 'students',
      componentName: 'StudentsPage',
      label: 'Danh sách sinh viên',
      group: 'main',
      allowOutSemesterStudent: false,
      allowPartner: false
    },
    {
      id: 'certs',
      path: '/certificates',
      aliases: ['/certs', '/chung-chi'],
      featureKey: 'certificates',
      componentName: 'CertificatesPage',
      label: 'Chứng chỉ ngoại ngữ',
      group: 'main',
      allowOutSemesterStudent: false,
      allowPartner: false
    },
    {
      id: 'bulletin',
      path: '/bulletin',
      aliases: ['/jobs', '/bang-tin', '/tuyen-dung'],
      featureKey: 'bulletin',
      componentName: 'BulletinPage',
      label: 'Bảng tin JD & Tuyển dụng',
      group: 'main',
      allowOutSemesterStudent: true,
      allowPartner: true
    },
    {
      id: 'email_jd',
      path: '/email-jd',
      aliases: ['/email_jd', '/duyet-jd'],
      featureKey: 'email_jd',
      componentName: 'EmailJdPage',
      label: 'Duyệt Email JD',
      group: 'admin',
      allowOutSemesterStudent: false,
      allowPartner: false,
      adminOnlyForStaff: true
    },
    {
      id: 'semesters',
      path: '/semesters',
      aliases: ['/hoc-ky', '/semester-plan'],
      featureKey: 'semesters',
      componentName: 'SemestersPage',
      label: 'Quản lý học kỳ',
      group: 'admin',
      allowOutSemesterStudent: false,
      allowPartner: false,
      adminOnlyForStaff: true
    },
    {
      id: 'import',
      path: '/import',
      aliases: ['/import-students', '/nhap-du-lieu'],
      featureKey: 'import',
      componentName: 'ImportDataPage',
      label: 'Nhập file Excel SV',
      group: 'admin',
      allowOutSemesterStudent: false,
      allowPartner: false,
      adminOnlyForStaff: true
    },
    {
      id: 'documents',
      path: '/documents',
      aliases: ['/reports', '/printing', '/in-an', '/bao-cao'],
      featureKey: 'reporting',
      componentName: 'DocumentsPage',
      label: 'Báo cáo & Ra quyết định',
      group: 'admin',
      allowOutSemesterStudent: false,
      allowPartner: false
    },
    {
      id: 'export',
      path: '/export',
      aliases: ['/xuat-bao-cao'],
      featureKey: 'export',
      componentName: 'DocumentsPage',
      label: 'Xuất báo cáo & In ấn',
      group: 'system',
      allowOutSemesterStudent: false,
      allowPartner: false,
      adminOnlyForStaff: true
    },
    {
      id: 'profile',
      path: '/profile',
      aliases: ['/ho-so', '/my-profile'],
      featureKey: 'profile',
      componentName: 'ProfilePage',
      label: 'Hồ sơ cá nhân',
      group: 'system',
      allowOutSemesterStudent: true,
      allowPartner: true,
      disallowFacultyStaff: true
    },
    {
      id: 'accounts',
      path: '/accounts',
      aliases: ['/settings', '/cai-dat', '/rbac'],
      featureKey: 'accounts',
      componentName: 'AccountsPage',
      label: 'Cài đặt hệ thống & Hồ sơ',
      group: 'system',
      allowOutSemesterStudent: true,
      allowPartner: true
    }
  ];

  const _registryMap = new Map();
  MODULE_DEFINITIONS.forEach(mod => _registryMap.set(mod.id, mod));

  function registerModule(moduleDef) {
    if (!moduleDef || !moduleDef.id || !moduleDef.path) {
      throw new Error('[ModuleRegistry]: Module phải có id và path hợp lệ');
    }
    const normalized = {
      aliases: [],
      group: 'main',
      allowOutSemesterStudent: false,
      allowPartner: false,
      ...moduleDef
    };
    _registryMap.set(normalized.id, normalized);
    return normalized;
  }

  function getAllModules() {
    return Array.from(_registryMap.values());
  }

  function getModuleById(tabId) {
    return _registryMap.get(tabId) || null;
  }

  function getPathByTabId(tabId) {
    const mod = _registryMap.get(tabId);
    return mod ? mod.path : '/dashboard';
  }

  function resolveRouteByPath(pathname) {
    const clean = String(pathname || '/').trim().toLowerCase().replace(/\/+$/, '') || '/';
    if (clean === '/' || clean === '/index.html') {
      return { found: true, tabId: 'dashboard', module: _registryMap.get('dashboard'), path: '/dashboard' };
    }
    for (const mod of _registryMap.values()) {
      if (mod.path.toLowerCase() === clean) {
        return { found: true, tabId: mod.id, module: mod, path: mod.path };
      }
      if (Array.isArray(mod.aliases) && mod.aliases.some(a => String(a).toLowerCase() === clean)) {
        return { found: true, tabId: mod.id, module: mod, path: mod.path };
      }
    }
    return { found: false, tabId: 'not_found', module: null, path: clean };
  }

  function isStudentEnrolledInActiveSemester(user, activeSemester) {
    if (!user || user.role !== 'student') return true;
    const sid = String(user.studentId || user.mssv || '').trim().toUpperCase();
    if (!sid || sid === '52100999' || user.isEnrolledThisSemester === false) return false;
    const roleKey = root.PrimeRbac?.getUserRoleKey?.(user);
    if (roleKey === 'sv_ngoai_ky') return false;

    const sem = activeSemester || localStorage.getItem('tdtu_active_semester') || 'hk1_2026_2027';
    try {
      const raw = localStorage.getItem('tdtu_imported_students_' + sem);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          return arr.some(s => String(s.studentId || s.mssv || s.id || '').trim().toUpperCase() === sid);
        }
      }
      if (sem === 'hk1_2026_2027') {
        const liveRaw = localStorage.getItem('tdtu_live_students_clean') || localStorage.getItem('tdtu_live_students');
        if (liveRaw) {
          const liveArr = JSON.parse(liveRaw);
          if (Array.isArray(liveArr) && liveArr.length > 0) {
            return liveArr.some(s => String(s.studentId || s.mssv || s.id || '').trim().toUpperCase() === sid);
          }
        }
        return true;
      }
    } catch {}
    return false;
  }

  function canAccessModule(user, tabId, activeSemester) {
    if (!user) return false;
    const mod = _registryMap.get(tabId);
    if (!mod) return false;

    const cleanEmail = String(user.email || '').toLowerCase().trim();
    const isAdmin =
      cleanEmail === 'duonghuuphuc@tdtu.edu.vn' ||
      cleanEmail === 'phamvanc@tdtu.edu.vn' ||
      (Boolean(user.isAdmin) && cleanEmail !== 'nguyenvana@tdtu.edu.vn');
    const roleKey = root.PrimeRbac?.getUserRoleKey?.(user) || (isAdmin ? 'thay_phuc' : user.role === 'student' ? 'sv_trong_ky' : 'giang_vien');
    const isLecturer = roleKey === 'giang_vien' || (!isAdmin && user.role === 'lecturer') || cleanEmail === 'nguyenvana@tdtu.edu.vn';
    const isFacultyStaff = isAdmin || roleKey === 'thay_phuc' || isLecturer;

    if (isFacultyStaff && mod.disallowFacultyStaff) return false;
    if (isLecturer && mod.adminOnlyForStaff) return false;
    if (user.role === 'partner') return Boolean(mod.allowPartner);

    if (user.role === 'student') {
      const enrolled = isStudentEnrolledInActiveSemester(user, activeSemester);
      if (!enrolled) {
        return Boolean(mod.allowOutSemesterStudent);
      }
    }

    if (mod.featureKey === 'accounts') return true;
    if (root.PrimeRbac?.checkUserPermission && mod.featureKey) {
      return root.PrimeRbac.checkUserPermission(user, mod.featureKey, 2);
    }
    return true;
  }

  // ============================================================================
  // 2. COMPONENT <Can /> (Kiểm tra quyền 2 cấp trên Frontend JSX)
  // ============================================================================
  const Can = ({ user, feature, action = 2, fallback = null, children }) => {
    const activeUser = user || (root.ApiClient?.getSavedUser ? root.ApiClient.getSavedUser() : null);
    if (!activeUser) return fallback;
    const actionPrime = typeof action === 'string' && root.PrimeRbac?.PRIME_ACTIONS
      ? (root.PrimeRbac.PRIME_ACTIONS[action.toUpperCase()] || 2)
      : Number(action || 2);
    const allowed = root.PrimeRbac?.checkUserPermission
      ? root.PrimeRbac.checkUserPermission(activeUser, feature, actionPrime)
      : false;
    return allowed ? children : fallback;
  };

  // ============================================================================
  // 3. 3-TIER REAL-TIME SYNC ENGINE (SyncManager)
  //    Tier 1: BroadcastChannel + CustomEvent
  //    Tier 2: LocalStorage Pulse (Cross-tab Storage Event)
  //    Tier 3: Window Focus / Visibility Revalidation + Cloud Firestore
  // ============================================================================
  const PULSE_STORAGE_KEY = 'tdtu_3tier_sync_pulse';
  const _syncSubscribers = new Set();
  let _syncInitialized = false;

  function emitSyncPulse(topic, payload = {}) {
    const packet = {
      topic,
      payload,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).slice(2, 8)
    };

    // Tier 1A: Intra-tab CustomEvent
    try {
      window.dispatchEvent(new CustomEvent('tdtu_sync_' + topic, { detail: packet }));
      if (topic === 'semester_changed' && payload?.semesterId) {
        window.dispatchEvent(new CustomEvent('tdtu_semester_changed', { detail: { semesterId: payload.semesterId } }));
      }
    } catch {}

    // Tier 1B: BroadcastChannel
    try {
      if (root.ApiClient?.postBroadcast) {
        root.ApiClient.postBroadcast({ type: topic, ...payload, timestamp: packet.timestamp });
      } else if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('tdtu_realtime_sync');
        bc.postMessage({ type: topic, ...payload, timestamp: packet.timestamp });
        bc.close();
      }
    } catch {}

    // Tier 2: LocalStorage Pulse (Kích hoạt window.onstorage ở mọi tab khác tức thì)
    try {
      localStorage.setItem(PULSE_STORAGE_KEY, JSON.stringify(packet));
    } catch {}

    // Notify registered callbacks
    _syncSubscribers.forEach(fn => {
      try {
        fn(packet);
      } catch {}
    });
  }

  function subscribeSync(callback) {
    if (typeof callback !== 'function') return () => {};
    _syncSubscribers.add(callback);
    return () => _syncSubscribers.delete(callback);
  }

  function initSyncManager() {
    if (_syncInitialized || typeof window === 'undefined') return;
    _syncInitialized = true;

    // Lắng nghe Tier 2 Storage Pulse từ các tab khác
    window.addEventListener('storage', (e) => {
      if (!e) return;
      if (e.key === 'tdtu_active_semester' && e.newValue) {
        window.dispatchEvent(new CustomEvent('tdtu_semester_changed', { detail: { semesterId: e.newValue, fromStorage: true } }));
      }
      if (e.key === PULSE_STORAGE_KEY && e.newValue) {
        try {
          const packet = JSON.parse(e.newValue);
          if (packet && packet.topic) {
            if (packet.topic === 'semester_changed' && packet.payload?.semesterId) {
              window.dispatchEvent(new CustomEvent('tdtu_semester_changed', { detail: { semesterId: packet.payload.semesterId, fromPulse: true } }));
            }
            if (packet.topic === 'certs_updated') {
              window.dispatchEvent(new CustomEvent('tdtu_certs_updated', { detail: packet.payload }));
            }
            if (packet.topic === 'students_updated') {
              window.dispatchEvent(new CustomEvent('tdtu_students_updated', { detail: packet.payload }));
            }
            if (packet.topic === 'semesters_updated') {
              window.dispatchEvent(new CustomEvent('tdtu_semesters_updated', { detail: packet.payload }));
            }
            _syncSubscribers.forEach(fn => {
              try { fn(packet); } catch {}
            });
          }
        } catch {}
      }
    });

    // Tier 3: Focus & Visibility Revalidation (Đồng bộ tức thì khi chuyển qua lại màn hình Giảng viên / Sinh viên)
    const revalidateOnFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const latestSem = localStorage.getItem('tdtu_active_semester');
        if (latestSem) {
          window.dispatchEvent(new CustomEvent('tdtu_semester_changed', { detail: { semesterId: latestSem, fromFocus: true } }));
        }
        window.dispatchEvent(new CustomEvent('tdtu_focus_revalidated', { detail: { timestamp: Date.now() } }));
      } catch {}
    };

    window.addEventListener('focus', revalidateOnFocus);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', revalidateOnFocus);
    }
  }

  initSyncManager();

  // ============================================================================
  // 4. STUDENT COURSE NORMALIZATION HELPER (KTCN vs TSNN vs Song song)
  // ============================================================================
  function normalizeStudentCourse(dto = {}) {
    let ktcn = dto.ktcnEnrolled !== undefined ? (Number(dto.ktcnEnrolled) ? 1 : 0) : 0;
    let tsnn = dto.tsnnEnrolled !== undefined ? (Number(dto.tsnnEnrolled) ? 1 : 0) : 0;
    if (dto.isDualCourse === true || dto.isDualCourse === 1 || dto.isDual === true || dto.isDual === 1) {
      ktcn = 1;
      tsnn = 1;
    }
    const raw = [
      ...(Array.isArray(dto.courses) ? dto.courses : []),
      dto.courseCode,
      dto.course_str,
      dto.course,
      dto.courseName,
      dto.subject
    ].filter(Boolean).join(' | ').toUpperCase();

    if (raw) {
      const hasBoth = raw.includes('SONG SONG') || raw.includes('CẢ HAI') || raw.includes('BOTH');
      const hasK = raw.includes('KTCN') || raw.includes('504044') || raw.includes('IT1') || raw.includes('KIẾN TẬP');
      const hasT = raw.includes('TSNN') || raw.includes('504045') || raw.includes('IT2') || raw.includes('TẬP SỰ');
      if (hasBoth) {
        ktcn = 1;
        tsnn = 1;
      } else if (hasK || hasT) {
        ktcn = hasK ? 1 : 0;
        tsnn = hasT ? 1 : 0;
      }
    }
    if (!ktcn && !tsnn) ktcn = 1;
    const isDualCourse = ktcn && tsnn ? 1 : 0;
    return {
      ktcnEnrolled: ktcn,
      tsnnEnrolled: tsnn,
      isDualCourse,
      courseCode: isDualCourse ? 'KTCN & TSNN' : ktcn ? 'KTCN' : 'TSNN',
      courseName: isDualCourse
        ? 'Kiến tập & Tập sự nghề nghiệp (Song song)'
        : ktcn
          ? 'Kiến tập công nghiệp'
          : 'Tập sự nghề nghiệp'
    };
  }

  const ModuleRegistry = {
    MODULE_DEFINITIONS,
    registerModule,
    getAllModules,
    getModuleById,
    getPathByTabId,
    resolveRouteByPath,
    canAccessModule,
    isStudentEnrolledInActiveSemester
  };

  const SyncManager = {
    emitSyncPulse,
    subscribeSync,
    initSyncManager,
    broadcastSemesterChange: (semesterId) => emitSyncPulse('semester_changed', { semesterId }),
    broadcastCertsUpdated: (studentId) => emitSyncPulse('certs_updated', { studentId }),
    broadcastStudentsUpdated: (semesterId) => emitSyncPulse('students_updated', { semesterId })
  };

  const StudentCourseHelper = {
    normalizeStudentCourse
  };

  // ============================================================================
  // 5. NAMESPACE CONTAINER (Chống ô nhiễm và ghi đè biến toàn cục)
  // ============================================================================
  root.ModuleRegistry = ModuleRegistry;
  root.SyncManager = SyncManager;
  root.StudentCourseHelper = StudentCourseHelper;
  root.Can = Can;

  root.TDTU = root.TDTU || {};
  Object.assign(root.TDTU, {
    version: '3.3.0-enterprise',
    ModuleRegistry,
    SyncManager,
    StudentCourseHelper,
    Can,
    get PrimeRbac() {
      return root.PrimeRbac;
    },
    get ApiClient() {
      return root.ApiClient;
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
