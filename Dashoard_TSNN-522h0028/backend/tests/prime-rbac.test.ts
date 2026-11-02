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
} from '../src/middlewares/prime-rbac.ts';

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
  let mask = PRIME_ACTIONS.READ; // 2
  assert.strictEqual(mask, 2);

  // Cấp thêm quyền CREATE (3) -> 2 * 3 = 6
  mask = grantAction(mask, PRIME_ACTIONS.CREATE);
  assert.strictEqual(mask, 6);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.READ), true);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.CREATE), true);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.UPDATE), false);

  // Cấp thêm quyền UPDATE (5) -> 6 * 5 = 30
  mask = grantAction(mask, PRIME_ACTIONS.UPDATE);
  assert.strictEqual(mask, 30);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.UPDATE), true);

  // Gỡ quyền CREATE (3) -> 30 / 3 = 10
  mask = revokeAction(mask, PRIME_ACTIONS.CREATE);
  assert.strictEqual(mask, 10);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.CREATE), false);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.READ), true);
  assert.strictEqual(hasPrimePermission(mask, PRIME_ACTIONS.UPDATE), true);
});

test('3. Prime Product RBAC: Diễn giải mặt nạ quyền (Explain Mask)', () => {
  const mask = 2 * 3 * 17; // Xem (2), Thêm (3), Export (17) = 102
  const explanation = explainPermissionMask(mask);
  assert.ok(explanation.includes('Xem'));
  assert.ok(explanation.includes('Thêm'));
  assert.ok(explanation.includes('Export'));
  assert.strictEqual(explanation.includes('Xóa'), false);
});
