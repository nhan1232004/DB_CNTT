import { test } from 'node:test';
import assert from 'node:assert';
import {
  PRIME_ACTIONS,
  SYSTEM_FEATURES,
  DEFAULT_ROLE_MATRIX,
  hasPrimePermission,
  grantAction,
  revokeAction,
  calculateMaskFromActions,
  explainPermissionMask
} from '../src/middlewares/prime-rbac.ts';
import { normalizeStudentCourse, isStudentOwnerOrStaff } from '../src/utils/student-helper.ts';

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

test('4. Prime Product RBAC: Kiểm thử vét cạn 5 Vai trò x 12 Phân hệ x 8 Thừa số nguyên tố (480 Assertions)', () => {
  const allRoles = Object.keys(DEFAULT_ROLE_MATRIX);
  const allFeatures = Object.values(SYSTEM_FEATURES);
  const allPrimes = [
    PRIME_ACTIONS.READ,
    PRIME_ACTIONS.CREATE,
    PRIME_ACTIONS.UPDATE,
    PRIME_ACTIONS.DELETE,
    PRIME_ACTIONS.SCOPE_ALL,
    PRIME_ACTIONS.IMPORT,
    PRIME_ACTIONS.EXPORT,
    PRIME_ACTIONS.APPROVE
  ];

  assert.strictEqual(allRoles.length, 5, 'Phải có đủ 5 vai trò chuẩn');
  assert.strictEqual(allFeatures.length, 12, 'Phải có đủ 12 phân hệ nghiệp vụ');

  let checkedCount = 0;
  for (const role of allRoles) {
    const roleMap = DEFAULT_ROLE_MATRIX[role];
    assert.ok(roleMap, `Vai trò ${role} phải tồn tại trong ma trận`);
    for (const feature of allFeatures) {
      const mask = roleMap[feature];
      assert.strictEqual(typeof mask, 'number', `Mask của ${role}.${feature} phải là số nguyên`);
      assert.ok(mask >= 1, `Mask của ${role}.${feature} phải >= 1`);
      for (const prime of allPrimes) {
        const expected = mask > 1 && mask % prime === 0;
        const actual = hasPrimePermission(mask, prime);
        assert.strictEqual(
          actual,
          expected,
          `Sai lệch kiểm tra Modulo tại [${role}][${feature}] (mask=${mask}, prime=${prime})`
        );
        checkedCount++;
      }
    }
  }
  assert.strictEqual(checkedCount, 480, 'Đã kiểm chứng đủ 480 tổ hợp quyền');
});

test('5. Prime Product RBAC: Tính lũy đẳng (Idempotency) & Giao hoán (Commutativity) của Định lý Cơ bản Số học', () => {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19];

  // Cấp trùng lặp nhiều lần cùng 1 quyền không được làm nhân đôi thừa số
  let m = 1;
  for (const p of primes) {
    const once = grantAction(m, p);
    const twice = grantAction(once, p);
    const thrice = grantAction(twice, p);
    assert.strictEqual(once, twice, `grantAction phải lũy đẳng với prime=${p}`);
    assert.strictEqual(twice, thrice, `grantAction lần 3 phải giữ nguyên với prime=${p}`);
    m = once;
  }
  assert.strictEqual(m, 2 * 3 * 5 * 7 * 11 * 13 * 17 * 19); // 9699690

  // Thu hồi trùng lặp nhiều lần không làm hỏng các quyền còn lại
  for (const p of primes) {
    const afterFirstRevoke = revokeAction(m, p);
    const afterSecondRevoke = revokeAction(afterFirstRevoke, p);
    assert.strictEqual(afterFirstRevoke, afterSecondRevoke, `revokeAction phải lũy đẳng với prime=${p}`);
    assert.strictEqual(hasPrimePermission(afterFirstRevoke, p), false);
    m = afterFirstRevoke;
  }
  assert.strictEqual(m, 1, 'Sau khi thu hồi hết các thừa số, mask phải trở về 1 (NONE)');

  // Tính giao hoán: Cấp theo thứ tự xuôi hay ngược đều ra cùng 1 tích số nguyên tố
  const forwardMask = calculateMaskFromActions([2, 3, 5, 11, 17]);
  const reverseMask = calculateMaskFromActions([17, 11, 5, 3, 2]);
  assert.strictEqual(forwardMask, reverseMask);
  assert.strictEqual(forwardMask, 5610);
});

test('6. Prime Product RBAC: Xử lý an toàn các giá trị biên (Boundary & Invalid Inputs)', () => {
  assert.strictEqual(hasPrimePermission(0, 2), false);
  assert.strictEqual(hasPrimePermission(1, 2), false);
  assert.strictEqual(hasPrimePermission(-22, 2), false);
  assert.strictEqual(hasPrimePermission(null, 2), false);
  assert.strictEqual(hasPrimePermission(undefined, 2), false);
  assert.strictEqual(hasPrimePermission(2310, 1), false);
  assert.strictEqual(hasPrimePermission(2310, 0), false);
  assert.strictEqual(hasPrimePermission(2310, -3), false);

  assert.strictEqual(revokeAction(0, 2), 1);
  assert.strictEqual(revokeAction(-10, 2), 1);
  assert.strictEqual(calculateMaskFromActions([]), 1);
  assert.strictEqual(calculateMaskFromActions([1, 0, -5]), 1);
  assert.deepStrictEqual(explainPermissionMask(1), ['Không quyền']);
  assert.deepStrictEqual(explainPermissionMask(0), ['Không quyền']);
});

test('7. Chuẩn hóa Học phần Sinh viên (normalizeStudentCourse) & Lịch sử Học kỳ (enrolledSemesters)', () => {
  // 1. Chỉ học KTCN (504044 / IT1)
  const c1 = normalizeStudentCourse({ courseCode: '504044 - Kiến tập công nghiệp (IT1)' });
  assert.strictEqual(c1.ktcnEnrolled, 1);
  assert.strictEqual(c1.tsnnEnrolled, 0);
  assert.strictEqual(c1.isDualCourse, 0);
  assert.strictEqual(c1.courseCode, 'KTCN');

  // 2. Chỉ học TSNN (504045 / IT2)
  const c2 = normalizeStudentCourse({ course: 'TSNN (504045)' });
  assert.strictEqual(c2.ktcnEnrolled, 0);
  assert.strictEqual(c2.tsnnEnrolled, 1);
  assert.strictEqual(c2.isDualCourse, 0);
  assert.strictEqual(c2.courseCode, 'TSNN');

  // 3. Học song song cả 2 môn (KTCN & TSNN)
  const c3 = normalizeStudentCourse({ courses: ['KTCN', 'TSNN'], semester: 'hk2_2026_2027' }, ['hk1_2026_2027']);
  assert.strictEqual(c3.ktcnEnrolled, 1);
  assert.strictEqual(c3.tsnnEnrolled, 1);
  assert.strictEqual(c3.isDualCourse, 1);
  assert.strictEqual(c3.courseCode, 'KTCN & TSNN');
  assert.deepStrictEqual(c3.enrolledSemesters, ['hk1_2026_2027', 'hk2_2026_2027']);

  // 4. Kiểm tra quyền sở hữu hồ sơ cá nhân (isStudentOwnerOrStaff)
  const studentA = { role: 'student', studentId: '522H0045', isAdmin: false };
  const lecturer = { role: 'lecturer', isAdmin: false };
  assert.strictEqual(isStudentOwnerOrStaff(studentA, '522H0045'), true);
  assert.strictEqual(isStudentOwnerOrStaff(studentA, '522h0045'), true);
  assert.strictEqual(isStudentOwnerOrStaff(studentA, '522H0001'), false, 'Sinh viên A không được truy cập hồ sơ Sinh viên B');
  assert.strictEqual(isStudentOwnerOrStaff(lecturer, '522H0001'), true, 'Giảng viên được phép xem hồ sơ sinh viên');
});
