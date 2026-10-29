import { getDatabase } from '../../database/sqlite.db.ts';
import { ENV } from '../../config/env.config.ts';
import { signJwtToken } from '../../core/middleware.ts';
import type { UserClaims } from '../../core/types.ts';

export class AuthService {
  private db = getDatabase();

  validateEmailDomain(email: string): { isValid: boolean; role?: 'student' | 'lecturer'; studentId?: string } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const isLecturer = ENV.ALLOWED_LECTURER_DOMAINS.some(domain => cleanEmail.endsWith(domain.toLowerCase()));
    if (isLecturer) {
      return { isValid: true, role: 'lecturer' };
    }

    const isStudent = ENV.ALLOWED_STUDENT_DOMAINS.some(domain => cleanEmail.endsWith(domain.toLowerCase()));
    if (isStudent) {
      const match = cleanEmail.match(/^([a-zA-Z0-9]+)@student\.tdtu\.edu\.vn$/);
      const studentId = match ? match[1].toUpperCase() : undefined;
      return { isValid: true, role: 'student', studentId };
    }

    return { isValid: false };
  }

  loginWithGoogle(email: string, name?: string, avatarUrl?: string): { token: string; user: UserClaims } {
    const domainCheck = this.validateEmailDomain(email);
    if (!domainCheck.isValid || !domainCheck.role) {
      throw new Error('Chỉ chấp nhận email thuộc trường Đại học Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn)');
    }

    const cleanEmail = email.trim().toLowerCase();
    let userRow = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail) as any;

    if (!userRow) {
      // Check if student exists in student master table
      const studentRow = domainCheck.studentId
        ? (this.db.prepare('SELECT * FROM students WHERE UPPER(studentId) = UPPER(?)').get(domainCheck.studentId) as any)
        : null;

      const userName = name || (studentRow ? studentRow.fullName : cleanEmail.split('@')[0]);
      const uid = `fb-tdtu-usr-${domainCheck.studentId || Date.now()}`;
      const now = new Date().toISOString();

      this.db.prepare(`
        INSERT INTO users (uid, email, name, role, isAdmin, isActive, studentId, department, avatarUrl, createdAt)
        VALUES (?, ?, ?, ?, 0, 1, ?, ?, ?, ?)
      `).run(
        uid,
        cleanEmail,
        userName,
        domainCheck.role,
        domainCheck.studentId || null,
        studentRow ? studentRow.major : 'Khoa CNTT',
        avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        now
      );

      userRow = this.db.prepare('SELECT * FROM users WHERE uid = ?').get(uid) as any;
    }

    if (!userRow.isActive) {
      throw new Error('Tài khoản đã bị tạm khóa bởi Quản trị viên Khoa CNTT');
    }

    const isEnrolled = userRow.role === 'student' && userRow.studentId ? Boolean(this.db.prepare('SELECT 1 FROM students WHERE UPPER(studentId) = UPPER(?)').get(userRow.studentId)) : undefined;

    const claims: Omit<UserClaims, 'iat' | 'exp'> = {
      uid: userRow.uid,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
      isAdmin: Boolean(userRow.isAdmin),
      studentId: userRow.studentId || undefined,
      isEnrolledThisSemester: isEnrolled,
      avatarUrl: userRow.avatarUrl,
      department: userRow.department
    };

    const token = signJwtToken(claims);
    return { token, user: claims as UserClaims };
  }

  loginWithFirebase(email: string, firebaseUid?: string, idToken?: string, name?: string): { token: string; user: UserClaims } {
    return this.loginWithGoogle(email, name);
  }

  getFirebaseUsers(): any[] {
    return this.db.prepare('SELECT uid, email, name, role, isAdmin, isActive, studentId, department, avatarUrl, createdAt FROM users ORDER BY role DESC, isAdmin DESC, name ASC').all();
  }

  upsertFirebaseUser(userData: { email: string; name: string; role?: 'student' | 'lecturer'; isAdmin?: boolean }): any {
    const domainCheck = this.validateEmailDomain(userData.email);
    if (!domainCheck.isValid || !domainCheck.role) {
      throw new Error('Chỉ chấp nhận email thuộc trường Đại học Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn)');
    }

    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail) as any;

    if (existing) {
      // If attempting to revoke admin, verify not the last active admin
      if (existing.isAdmin && userData.isAdmin === false) {
        const activeAdmins = (this.db.prepare('SELECT COUNT(*) as count FROM users WHERE isAdmin = 1 AND isActive = 1').get() as any).count;
        if (activeAdmins <= 1) {
          throw new Error('Không thể thu hồi quyền của Quản trị viên (Admin) hoạt động cuối cùng của hệ thống!');
        }
      }

      this.db.prepare(`
        UPDATE users SET name = ?, isAdmin = ?, role = ? WHERE LOWER(email) = LOWER(?)
      `).run(
        userData.name || existing.name,
        userData.isAdmin !== undefined ? (userData.isAdmin ? 1 : 0) : existing.isAdmin,
        userData.role || existing.role,
        cleanEmail
      );
      return this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
    } else {
      const uid = `fb-tdtu-usr-${domainCheck.studentId || Date.now()}`;
      const now = new Date().toISOString();
      const role = userData.role || domainCheck.role;
      const isAdmin = userData.isAdmin ? 1 : 0;

      this.db.prepare(`
        INSERT INTO users (uid, email, name, role, isAdmin, isActive, studentId, department, avatarUrl, createdAt)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
      `).run(
        uid,
        cleanEmail,
        userData.name,
        role,
        isAdmin,
        domainCheck.studentId || null,
        role === 'lecturer' ? 'Khoa CNTT' : 'Sinh viên',
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        now
      );
      return this.db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
    }
  }

  toggleUserStatus(uid: string, isActive: boolean): any {
    const user = this.db.prepare('SELECT * FROM users WHERE uid = ?').get(uid) as any;
    if (!user) throw new Error('Không tìm thấy tài khoản người dùng');

    if (user.isAdmin && !isActive) {
      const activeAdmins = (this.db.prepare('SELECT COUNT(*) as count FROM users WHERE isAdmin = 1 AND isActive = 1').get() as any).count;
      if (activeAdmins <= 1) {
        throw new Error('Không thể khóa Quản trị viên (Admin) hoạt động duy nhất của hệ thống!');
      }
    }

    this.db.prepare('UPDATE users SET isActive = ? WHERE uid = ?').run(isActive ? 1 : 0, uid);
    return this.db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
  }

  updateAdminRole(targetEmail: string, makeAdmin: boolean): any {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const user = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail) as any;
    if (!user) throw new Error('Không tìm thấy tài khoản để phân quyền Admin');

    if (!cleanEmail.endsWith('@tdtu.edu.vn')) {
      throw new Error('Chỉ Giảng viên có email @tdtu.edu.vn mới được cấp quyền Admin');
    }

    if (!makeAdmin && user.isAdmin) {
      const activeAdmins = (this.db.prepare('SELECT COUNT(*) as count FROM users WHERE isAdmin = 1 AND isActive = 1').get() as any).count;
      if (activeAdmins <= 1) {
        throw new Error('Không thể hủy quyền của Quản trị viên (Admin) duy nhất đang hoạt động!');
      }
    }

    this.db.prepare('UPDATE users SET isAdmin = ? WHERE LOWER(email) = LOWER(?)').run(makeAdmin ? 1 : 0, cleanEmail);
    return this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
  }
}

export const authService = new AuthService();
