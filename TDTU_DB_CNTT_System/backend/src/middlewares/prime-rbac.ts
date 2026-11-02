// Prime Product RBAC Core Engine - Backend TypeScript Module
// Tác giả thiết kế: Thầy Phúc & Nhóm Đồ án Khoa CNTT TDTU

export const PRIME_ACTIONS = {
  NONE: 1,       // Giá trị mặc định chống chia cho 0
  READ: 2,       // Xem (Read)
  CREATE: 3,     // Thêm (Create)
  UPDATE: 5,     // Sửa (Update)
  DELETE: 7,     // Xóa (Delete)
  SCOPE_ALL: 11, // Lọc toàn bộ / Xuyên học kỳ
  IMPORT: 13,    // Nhập file Excel/CSV
  EXPORT: 17,    // Xuất file Excel/PDF
  APPROVE: 19    // Duyệt / Thẩm định
} as const;

export type PrimeActionValue = typeof PRIME_ACTIONS[keyof typeof PRIME_ACTIONS];

export const SYSTEM_FEATURES = {
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
} as const;

export type SystemFeatureKey = typeof SYSTEM_FEATURES[keyof typeof SYSTEM_FEATURES];

export const DEFAULT_ROLE_MATRIX: Record<string, Record<string, number>> = {
  thay_phuc: {
    login: 2,
    dashboard: 22,
    declaration: 22,
    students: 2310,
    profile: 2,
    certificates: 22,
    bulletin: 210,
    email_jd: 210,
    semesters: 2310,
    import: 26,
    export: 34,
    reporting: 22
  },
  giang_vien: {
    login: 2,
    dashboard: 22,
    declaration: 22,
    students: 22,
    profile: 2,
    certificates: 22,
    bulletin: 2,
    email_jd: 2,
    semesters: 22,
    import: 1,
    export: 1,
    reporting: 22
  },
  sv_trong_ky: {
    login: 2,
    dashboard: 2,
    declaration: 330,
    students: 1,
    profile: 210,
    certificates: 210,
    bulletin: 2,
    email_jd: 1,
    semesters: 1,
    import: 1,
    export: 1,
    reporting: 1
  },
  sv_ngoai_ky: {
    login: 2,
    dashboard: 2,
    declaration: 22,
    students: 1,
    profile: 2,
    certificates: 22,
    bulletin: 2,
    email_jd: 1,
    semesters: 22,
    import: 1,
    export: 1,
    reporting: 1
  },
  partner: {
    login: 2,
    dashboard: 2,
    declaration: 1,
    students: 1,
    profile: 210,
    certificates: 1,
    bulletin: 2,
    email_jd: 30,
    semesters: 1,
    import: 1,
    export: 1,
    reporting: 1
  }
};

export function hasPrimePermission(mask: number | undefined | null, actionPrime: number): boolean {
  if (!mask || mask <= 1) return false;
  if (!actionPrime || actionPrime <= 1) return false;
  return mask % actionPrime === 0;
}

export function grantAction(currentMask: number, actionPrime: number): number {
  if (!currentMask || currentMask <= 1) return actionPrime;
  if (currentMask % actionPrime === 0) return currentMask;
  return currentMask * actionPrime;
}

export function revokeAction(currentMask: number, actionPrime: number): number {
  if (!currentMask || currentMask <= 1) return 1;
  if (currentMask % actionPrime !== 0) return currentMask;
  const next = Math.floor(currentMask / actionPrime);
  return next <= 0 ? 1 : next;
}

export function calculateMaskFromActions(actionsArray: number[]): number {
  if (!Array.isArray(actionsArray) || actionsArray.length === 0) return 1;
  const valid = actionsArray.filter(p => p > 1);
  if (valid.length === 0) return 1;
  return valid.reduce((acc, p) => acc * p, 1);
}

export function explainPermissionMask(mask: number): string[] {
  if (!mask || mask <= 1) return ['Không quyền'];
  const actions: string[] = [];
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
