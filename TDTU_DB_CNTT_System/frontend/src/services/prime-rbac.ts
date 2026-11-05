// Prime Product RBAC Core Engine - TDTU Internship Portal
// Dựa trên Bài toán Tích các Thừa số Nguyên tố (Fundamental Theorem of Arithmetic)
// Tác giả thiết kế: Thầy Phúc & Nhóm Đồ án Khoa CNTT TDTU

(function(root) {
  // 1. Bảng số nguyên tố đại diện cho Quyền thao tác (P)
  const PRIME_ACTIONS = {
    NONE: 1,       // Giá trị mặc định chống chia cho 0
    READ: 2,       // Xem (Read)
    CREATE: 3,     // Thêm (Create)
    UPDATE: 5,     // Sửa (Update)
    DELETE: 7,     // Xóa (Delete)
    SCOPE_ALL: 11, // Lọc toàn bộ / Xuyên học kỳ
    IMPORT: 13,    // Nhập file Excel/CSV
    EXPORT: 17,    // Xuất file Excel/PDF
    APPROVE: 19    // Duyệt / Thẩm định
  };

  // 2. Danh mục 12 Chức năng Hệ thống
  const SYSTEM_FEATURES = {
    LOGIN: 'login',
    DASHBOARD: 'dashboard',
    DECLARATION: 'declaration',
    STUDENTS: 'students',
    PROFILE: 'profile',
    CERTIFICATES: 'certificates',
    BULLETIN: 'bulletin',
    EMAIL_JD: 'email_jd',
    SEMESTERS: 'semesters',
    IMPORT: 'import',
    EXPORT: 'export',
    REPORTING: 'reporting'
  };

  // Tên hiển thị tiếng Việt của các chức năng
  const FEATURE_LABELS = {
    login: 'Đăng nhập hệ thống',
    dashboard: 'Bảng điều khiển (Dashboard)',
    declaration: 'Khai báo thực tập (KTCN / TSNN)',
    students: 'Quản lý danh sách sinh viên',
    profile: 'Quản lý hồ sơ cá nhân',
    certificates: 'Quản lý chứng chỉ ngoại ngữ',
    bulletin: 'Thông báo học vụ & Bảng tin',
    email_jd: 'Duyệt JD từ Email Forward',
    semesters: 'Quản lý học kỳ & Hạn chót',
    import: 'Nhập dữ liệu Excel/CSV',
    export: 'Xuất báo cáo Ra quyết định',
    reporting: 'Thống kê & Đồ thị báo cáo'
  };

  const ACTION_LABELS = {
    1: 'Không quyền (None)',
    2: 'Xem (Read)',
    3: 'Thêm (Create)',
    5: 'Sửa (Update)',
    7: 'Xóa (Delete)',
    11: 'Scope All (Lọc toàn bộ)',
    13: 'Import Excel',
    17: 'Export Báo cáo',
    19: 'Duyệt (Approve)'
  };

  // 3. Ma trận Quyền chuẩn theo Google Sheet của Thầy Phúc
  const DEFAULT_ROLE_MATRIX = {
    // Thầy Phúc (Quản trị viên cấp cao / BCN Khoa - Đã bỏ Khai báo thực tập & Hồ sơ cá nhân)
    thay_phuc: {
      login: 2,
      dashboard: 22,     // 2 * 11
      declaration: 1,    // 1 (None - Đã bỏ theo yêu cầu)
      students: 2310,    // 2 * 3 * 5 * 7 * 11
      profile: 1,        // 1 (None - Đã bỏ theo yêu cầu)
      certificates: 22,  // 2 * 11
      bulletin: 210,     // 2 * 3 * 5 * 7
      email_jd: 210,     // 2 * 3 * 5 * 7
      semesters: 2310,   // 2 * 3 * 5 * 7 * 11
      import: 26,        // 2 * 13
      export: 34,        // 2 * 17
      reporting: 22      // 2 * 11
    },

    // Giảng viên thông thường (Bỏ Khai báo thực tập, Hồ sơ cá nhân, Duyệt JD, Quản lý học kỳ, Import, Export)
    giang_vien: {
      login: 2,
      dashboard: 22,     // 2 * 11
      declaration: 1,    // 1 (None - Đã xóa theo yêu cầu)
      students: 22,      // 2 * 11
      profile: 1,        // 1 (None - Đã bỏ theo yêu cầu)
      certificates: 22,  // 2 * 11
      bulletin: 2,       // 2
      email_jd: 1,       // 1 (None - Đã bỏ theo yêu cầu)
      semesters: 1,      // 1 (None - Đã bỏ theo yêu cầu)
      import: 1,         // 1 (None - Không có quyền)
      export: 1,         // 1 (None - Không có quyền)
      reporting: 22      // 2 * 11
    },

    // Sinh viên trong kỳ thực tập
    sv_trong_ky: {
      login: 2,
      dashboard: 2,      // 2
      declaration: 330,  // 2 * 3 * 5 * 11
      students: 1,       // None
      profile: 210,      // 2 * 3 * 5 * 7
      certificates: 210, // 2 * 3 * 5 * 7
      bulletin: 2,       // 2
      email_jd: 1,       // None
      semesters: 1,      // None
      import: 1,         // None
      export: 1,         // None
      reporting: 1       // None
    },

    // Sinh viên ngoài kỳ / đã hoàn thành
    sv_ngoai_ky: {
      login: 2,
      dashboard: 2,      // 2
      declaration: 22,   // 2 * 11 (Chỉ xem lịch sử, không Thêm/Sửa)
      students: 1,       // None
      profile: 2,        // 2
      certificates: 22,  // 2 * 11
      bulletin: 2,       // 2
      email_jd: 1,       // None
      semesters: 22,     // 2 * 11
      import: 1,         // None
      export: 1,         // None
      reporting: 1       // None
    },

    // Doanh nghiệp Đối tác tuyển dụng (Partner)
    partner: {
      login: 2,
      dashboard: 2,      // 2
      declaration: 1,    // None
      students: 1,       // None
      profile: 210,      // 2 * 3 * 5 * 7
      certificates: 1,   // None
      bulletin: 2,       // 2
      email_jd: 30,      // 2 * 3 * 5 (Xem, Tạo JD, Sửa JD)
      semesters: 1,      // None
      import: 1,         // None
      export: 1,         // None
      reporting: 1       // None
    }
  };

  // 4. Thuật toán Kiểm tra Quyền O(1)
  function hasPrimePermission(mask, actionPrime) {
    if (!mask || mask <= 1) return false;
    if (!actionPrime || actionPrime <= 1) return false;
    return mask % actionPrime === 0;
  }

  // 5. Thuật toán Cấp quyền (Nhân thêm thừa số nguyên tố)
  function grantAction(currentMask, actionPrime) {
    if (!currentMask || currentMask <= 1) return actionPrime;
    if (currentMask % actionPrime === 0) return currentMask;
    return currentMask * actionPrime;
  }

  // 6. Thuật toán Thu hồi quyền (Chia bớt thừa số nguyên tố)
  function revokeAction(currentMask, actionPrime) {
    if (!currentMask || currentMask <= 1) return 1;
    if (currentMask % actionPrime !== 0) return currentMask;
    const next = Math.floor(currentMask / actionPrime);
    return next <= 0 ? 1 : next;
  }

  // 7. Chuyển đổi mảng checkbox thành con số tích nguyên tố M
  function calculateMaskFromActions(actionsArray) {
    if (!Array.isArray(actionsArray) || actionsArray.length === 0) return 1;
    const valid = actionsArray.filter(p => p > 1);
    if (valid.length === 0) return 1;
    return valid.reduce((acc, p) => acc * p, 1);
  }

  // 8. Giải mã con số M ra danh sách các quyền được cấp
  function explainPermissionMask(mask) {
    if (!mask || mask <= 1) return ['Không quyền'];
    const actions = [];
    if (mask % 2 === 0) actions.push('Xem');
    if (mask % 3 === 0) actions.push('Thêm');
    if (mask % 5 === 0) actions.push('Sửa');
    if (mask % 7 === 0) actions.push('Xóa');
    if (mask % 11 === 0) actions.push('Scope All');
    if (mask % 13 === 0) actions.push('Import');
    if (mask % 17 === 0) actions.push('Export');
    if (mask % 19 === 0) actions.push('Duyệt');
    return actions.length > 0 ? actions : ['Không quyền'];
  }

  // Khởi tạo và Lưu trữ Ma trận Quyền
  // Tự động làm sạch localStorage cũ nếu chưa cập nhật quyền giảng viên mới
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('tdtu_prime_roles_matrix');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.thay_phuc?.declaration !== 1 || parsed?.thay_phuc?.profile !== 1 || parsed?.giang_vien?.declaration !== 1 || parsed?.giang_vien?.profile !== 1 || parsed?.giang_vien?.email_jd !== 1 || parsed?.giang_vien?.semesters !== 1) {
          localStorage.removeItem('tdtu_prime_roles_matrix');
        }
      }
    }
  } catch {}

  function getCustomRoleMatrix() {
    try {
      const saved = localStorage.getItem('tdtu_prime_roles_matrix');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.thay_phuc) {
            parsed.thay_phuc.declaration = 1;
            parsed.thay_phuc.profile = 1;
          }
          if (parsed.giang_vien) {
            parsed.giang_vien.declaration = 1;
            parsed.giang_vien.profile = 1;
            parsed.giang_vien.email_jd = 1;
            parsed.giang_vien.semesters = 1;
            parsed.giang_vien.import = 1;
            parsed.giang_vien.export = 1;
          }
          return { ...DEFAULT_ROLE_MATRIX, ...parsed };
        }
      }
    } catch {}
    return { ...DEFAULT_ROLE_MATRIX };
  }

  function saveCustomRoleMatrix(matrix) {
    try {
      localStorage.setItem('tdtu_prime_roles_matrix', JSON.stringify(matrix));
      window.dispatchEvent(new CustomEvent('tdtu_prime_matrix_updated', { detail: matrix }));
    } catch {}

    // Đồng bộ lên Cloud Firestore collection tdtu_roles
    if (window.FirebaseService?.db) {
      try {
        const batch = window.FirebaseService.db.batch();
        Object.entries(matrix).forEach(([roleId, permissions]) => {
          const docRef = window.FirebaseService.db.collection('tdtu_roles').doc(roleId);
          batch.set(docRef, { roleId, permissions, updatedAt: new Date().toISOString() }, { merge: true });
        });
        batch.commit().catch(e => console.warn('[Firestore Roles Sync Warning]:', e.message));
      } catch (err) {}
    }
    return matrix;
  }

  // Helper: Xác định RoleKey từ thông tin User
  function getUserRoleKey(user) {
    if (!user) return 'sv_trong_ky';
    if (user.roleKey) return user.roleKey;
    const cleanEmail = String(user.email || '').trim().toLowerCase();
    // Nguyenvana là Giảng viên (không phải Admin)
    if (cleanEmail === 'nguyenvana@tdtu.edu.vn') {
      return 'giang_vien';
    }
    // Quản trị viên Khoa CNTT (Thầy Dương Hữu Phúc / Phạm Văn C / Admin)
    if (
      cleanEmail === 'duonghuuphuc@tdtu.edu.vn' ||
      cleanEmail === 'phamvanc@tdtu.edu.vn' ||
      cleanEmail === 'thayphuc@tdtu.edu.vn' ||
      cleanEmail === 'admin@tdtu.edu.vn' ||
      user.role === 'admin' ||
      Boolean(user.isAdmin)
    ) {
      return 'thay_phuc';
    }
    if (user.role === 'lecturer') {
      return 'giang_vien';
    }
    if (user.role === 'student') {
      const sid = String(user.studentId || user.mssv || '').toUpperCase();
      if (user.isEnrolledThisSemester === false || user.isEnrolled === false || sid === '52100999') {
        return 'sv_ngoai_ky';
      }
      try {
        const activeSem = localStorage.getItem('tdtu_active_semester') || 'hk1_2026_2027';
        // Nếu giảng viên kích hoạt học kỳ khác, sinh viên không thuộc kỳ đó sẽ chuyển sang sv_ngoai_ky
        const rawImported = localStorage.getItem(`tdtu_imported_students_${activeSem}`);
        if (rawImported) {
          const list = JSON.parse(rawImported);
          if (Array.isArray(list) && list.length > 0) {
            const hasStudent = list.some(s => String(s.studentId || s.mssv || s.id || '').toUpperCase() === sid);
            if (!hasStudent) return 'sv_ngoai_ky';
          } else if (activeSem !== 'hk1_2026_2027') {
            return 'sv_ngoai_ky';
          }
        } else if (activeSem !== 'hk1_2026_2027') {
          return 'sv_ngoai_ky';
        }
      } catch {}
      return 'sv_trong_ky';
    }
    if (user.role === 'partner') {
      return 'partner';
    }
    return 'sv_trong_ky';
  }

  // Helper: Lấy Mask của User cho 1 tính năng
  function getFeatureMask(user, featureKey) {
    const roleKey = getUserRoleKey(user);
    const matrix = getCustomRoleMatrix();
    const rolePermissions = matrix[roleKey] || DEFAULT_ROLE_MATRIX[roleKey] || DEFAULT_ROLE_MATRIX.sv_trong_ky;
    return rolePermissions[featureKey] ?? 1;
  }

  // Helper: Kiểm tra quyền User đối với Action trên Feature
  function checkUserPermission(user, featureKey, actionPrime) {
    const mask = getFeatureMask(user, featureKey);
    return hasPrimePermission(mask, actionPrime);
  }

  // Xuất module cho Browser Window & NodeJS Module
  const PrimeRbac = {
    PRIME_ACTIONS,
    SYSTEM_FEATURES,
    FEATURE_LABELS,
    ACTION_LABELS,
    DEFAULT_ROLE_MATRIX,
    hasPrimePermission,
    grantAction,
    revokeAction,
    calculateMaskFromActions,
    explainPermissionMask,
    getCustomRoleMatrix,
    saveCustomRoleMatrix,
    getUserRoleKey,
    getFeatureMask,
    checkUserPermission
  };

  if (typeof module !== 'undefined' && module.exports) {
    Object.assign(module.exports, PrimeRbac);
    module.exports.PrimeRbac = PrimeRbac;
  }
  if (typeof window !== 'undefined') {
    window.PrimeRbac = PrimeRbac;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.PrimeRbac = PrimeRbac;
  }
})(typeof window !== 'undefined' ? window : globalThis);
