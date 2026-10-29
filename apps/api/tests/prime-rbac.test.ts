import { test } from 'node:test';
import assert from 'node:assert';
import {
  PRIME_ACTIONS,
  DEFAULT_ROLE_MATRIX,
  hasPrimePermission,
  grantAction,
  revokeAction,
  calculateMaskFromActions,
  explainPermissionMask
} from '../../../TDTU_DB_CNTT_System/backend/src/core/prime-rbac.ts';

test('1. Prime Product RBAC: Khớp 100% Ma trận chuẩn của Thầy Phúc', () => {
  const thayPhuc = DEFAULT_ROLE_MATRIX.thay_phuc;
  const giangVien = DEFAULT_ROLE_MATRIX.giang_vien;
  const svTrongKy = DEFAULT_ROLE_MATRIX.sv_trong_ky;
  const svNgoaiKy = DEFAULT_ROLE_MATRIX.sv_ngoai_ky;

  // Thầy Phúc (Admin tối cao)
  assert.strictEqual(thayPhuc.students, 2310); // 2 * 3 * 5 * 7 * 11
  assert.strictEqual(hasPrimePermission(thayPhuc.students, PRIME_ACTIONS.READ), true);
  assert.strictEqual(hasPrimePermission(thayPhuc.students, PRIME_ACTIONS.CREATE), true);
  assert.strictEqual(hasPrimePermission(thayPhuc.students, PRIME_ACTIONS.UPDATE), true);
  assert.strictEqual(hasPrimePermission(thayPhuc.students, PRIME_ACTIONS.DELETE), true);
  assert.strictEqual(hasPrimePermission(thayPhuc.students, PRIME_ACTIONS.SCOPE_ALL), true);
  assert.strictEqual(hasPrimePermission(thayPhuc.import, PRIME_ACTIONS.IMPORT), true); // 26 = 2 * 13
  assert.strictEqual(hasPrimePermission(thayPhuc.export, PRIME_ACTIONS.EXPORT), true); // 34 = 2 * 17

  // Giảng viên thông thường (Chỉ xem và Scope All trên danh sách sinh viên)
  assert.strictEqual(giangVien.students, 22); // 2 * 11
  assert.strictEqual(hasPrimePermission(giangVien.students, PRIME_ACTIONS.READ), true);
  assert.strictEqual(hasPrimePermission(giangVien.students, PRIME_ACTIONS.SCOPE_ALL), true);
  assert.strictEqual(hasPrimePermission(giangVien.students, PRIME_ACTIONS.DELETE), false); // 22 % 7 !== 0
  assert.strictEqual(hasPrimePermission(giangVien.students, PRIME_ACTIONS.CREATE), false); // 22 % 3 !== 0

  // Sinh viên trong kỳ (Khai báo thực tập: 330 = 2 * 3 * 5 * 11)
  assert.strictEqual(svTrongKy.declaration, 330);
  assert.strictEqual(hasPrimePermission(svTrongKy.declaration, PRIME_ACTIONS.READ), true);
  assert.strictEqual(hasPrimePermission(svTrongKy.declaration, PRIME_ACTIONS.CREATE), true);
  assert.strictEqual(hasPrimePermission(svTrongKy.declaration, PRIME_ACTIONS.UPDATE), true);
  assert.strictEqual(hasPrimePermission(svTrongKy.declaration, PRIME_ACTIONS.DELETE), false); // Không được xóa

  // Sinh viên ngoài kỳ (Chỉ xem lịch sử khai báo: 22 = 2 * 11)
  assert.strictEqual(svNgoaiKy.declaration, 22);
  assert.strictEqual(hasPrimePermission(svNgoaiKy.declaration, PRIME_ACTIONS.READ), true);
  assert.strictEqual(hasPrimePermission(svNgoaiKy.declaration, PRIME_ACTIONS.CREATE), false); // 22 % 3 !== 0
  assert.strictEqual(hasPrimePermission(svNgoaiKy.declaration, PRIME_ACTIONS.UPDATE), false); // 22 % 5 !== 0
});

test('2. Prime Product RBAC: Phép toán Cấp (Nhân) và Gỡ (Chia) quyền', () => {
  // Bắt đầu từ quyền Xem cơ bản (M = 2)
  let mask = 2;
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.READ), true);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.CREATE), false);

  // Cấp thêm quyền Thêm (P = 3) -> 2 * 3 = 6
  mask = grantAction(mask, PRIME_ACTIONS.CREATE);
  assert.strictEqual(mask, 6);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.CREATE), true);

  // Cấp thêm quyền Sửa (P = 5) -> 6 * 5 = 30
  mask = grantAction(mask, PRIME_ACTIONS.UPDATE);
  assert.strictEqual(mask, 30);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.UPDATE), true);

  // Gỡ quyền Thêm (P = 3) -> 30 / 3 = 10
  mask = revokeAction(mask, PRIME_ACTIONS.CREATE);
  assert.strictEqual(mask, 10);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.CREATE), false);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.READ), true);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.UPDATE), true);
});

test('3. Prime Product RBAC: Xử lý giá trị Biên 1 (Không quyền) và Chuyển đổi Checkbox', () => {
  // Giá trị 1 (None) phải từ chối mọi quyền
  assert.strictEqual(hasPrimePermission(1, PRIME_ACTIONS.READ), false);
  assert.strictEqual(hasPrimePermission(1, PRIME_ACTIONS.CREATE), false);
  assert.strictEqual(hasPrimePermission(1, PRIME_ACTIONS.DELETE), false);

  // Tính toán mask từ danh sách checkbox [2, 3, 5, 7] -> 210
  const fullCrud = calculateMaskFromActions([2, 3, 5, 7]);
  assert.strictEqual(fullCrud, 210);

  // Mảng rỗng -> Mask = 1
  assert.strictEqual(calculateMaskFromActions([]), 1);

  // Giải mã quyền người dùng hiểu được
  const explanation = explainPermissionMask(330);
  assert.deepStrictEqual(explanation, ['Xem', 'Thêm', 'Sửa', 'Scope All']);
});

test('4. Prime Product RBAC: Tạo Role Mới (Trưởng Bộ Môn) không làm vỡ kiến trúc cũ', () => {
  // Tạo role 'truong_bo_mon' với các quyền tích lũy
  const truongBoMon = {
    students: calculateMaskFromActions([PRIME_ACTIONS.READ, PRIME_ACTIONS.SCOPE_ALL, PRIME_ACTIONS.EXPORT]), // 2 * 11 * 17 = 374
    bulletin: calculateMaskFromActions([PRIME_ACTIONS.READ, PRIME_ACTIONS.CREATE, PRIME_ACTIONS.UPDATE]),    // 2 * 3 * 5 = 30
    declaration: calculateMaskFromActions([PRIME_ACTIONS.READ, PRIME_ACTIONS.SCOPE_ALL, PRIME_ACTIONS.APPROVE]) // 2 * 11 * 19 = 418
  };

  assert.strictEqual(truongBoMon.students, 374);
  assert.strictEqual(hasPrimePermission(truongBoMon.students, PRIME_ACTIONS.EXPORT), true);
  assert.strictEqual(hasPrimePermission(truongBoMon.students, PRIME_ACTIONS.DELETE), false);

  assert.strictEqual(truongBoMon.bulletin, 30);
  assert.strictEqual(hasPrimePermission(truongBoMon.bulletin, PRIME_ACTIONS.CREATE), true);

  assert.strictEqual(truongBoMon.declaration, 418);
  assert.strictEqual(hasPrimePermission(truongBoMon.declaration, PRIME_ACTIONS.APPROVE), true);
});
