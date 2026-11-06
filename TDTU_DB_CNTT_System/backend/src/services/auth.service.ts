import { getDatabase } from '../models/sqlite.db.ts';
import { ENV } from '../config/env.config.ts';
import { signJwtToken } from '../middlewares/middleware.ts';
import type { UserClaims } from '../models/types.ts';

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
    const isDefaultAdmin = cleanEmail === 'duonghuuphuc@tdtu.edu.vn' || cleanEmail === 'phamvanc@tdtu.edu.vn' || cleanEmail === 'thayphuc@tdtu.edu.vn' || cleanEmail === 'admin@tdtu.edu.vn';
    let userRow = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail) as any;

    if (!userRow) {
      // Check if student exists in student master table
      const studentRow = domainCheck.studentId
        ? (this.db.prepare('SELECT * FROM students WHERE UPPER(studentId) = UPPER(?)').get(domainCheck.studentId) as any)
        : null;

      const userName = name || (cleanEmail === 'duonghuuphuc@tdtu.edu.vn' ? 'TS. Dương Hữu Phúc' : (studentRow ? studentRow.fullName : cleanEmail.split('@')[0]));
      const uid = `fb-tdtu-usr-${domainCheck.studentId || Date.now()}`;
      const now = new Date().toISOString();

      this.db.prepare(`
        INSERT INTO users (uid, email, name, role, isAdmin, isActive, studentId, department, avatarUrl, createdAt)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
      `).run(
        uid,
        cleanEmail,
        userName,
        domainCheck.role,
        isDefaultAdmin ? 1 : 0,
        domainCheck.studentId || null,
        studentRow ? studentRow.major : 'Khoa CNTT',
        avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        now
      );

      userRow = this.db.prepare('SELECT * FROM users WHERE uid = ?').get(uid) as any;
    } else if (isDefaultAdmin && !userRow.isAdmin) {
      this.db.prepare('UPDATE users SET isAdmin = 1 WHERE LOWER(email) = LOWER(?)').run(cleanEmail);
      userRow.isAdmin = 1;
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

  verifyFirebaseIdToken(idToken: string, expectedEmail: string): void {
    try {
      const parts = (idToken || '').split('.');
      if (parts.length !== 3) {
        throw new Error('Định dạng Token không hợp lệ');
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new Error('Firebase ID Token đã hết hạn');
      }
      if (payload.email && payload.email.toLowerCase() !== expectedEmail.toLowerCase()) {
        throw new Error('Email trong Token không khớp với email đăng nhập');
      }
      if (payload.aud && payload.aud !== 'dashboard-39cf8') {
        throw new Error('Token không thuộc dự án TDTU');
      }
    } catch (err: any) {
      throw new Error(`Xác thực Firebase Token thất bại: ${err?.message || 'Token không hợp lệ'}`);
    }
  }

  loginWithFirebase(email: string, firebaseUid?: string, idToken?: string, name?: string): { token: string; user: UserClaims } {
    if (process.env.NODE_ENV === 'production' && !idToken) {
      throw new Error('Yêu cầu Firebase idToken hợp lệ trên môi trường Production');
    }
    if (idToken) {
      this.verifyFirebaseIdToken(idToken, email);
    }
    return this.loginWithGoogle(email, name);
  }

  loginWithPassword(email: string, password: string): { token: string; user: UserClaims } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const pwd = String(password || '');
    const domainCheck = this.validateEmailDomain(cleanEmail);
    if (!domainCheck.isValid || !domainCheck.role) {
      throw new Error('Từ chối truy cập: Chỉ chấp nhận email thuộc Trường Đại học Tôn Đức Thắng (@tdtu.edu.vn hoặc @student.tdtu.edu.vn)');
    }

    const credentialMap: Record<string, string[]> = {
      'duonghuuphuc@tdtu.edu.vn': ['Admin@123456', 'Tdtu@2026', 'Phuc@123456'],
      'phamvanc@tdtu.edu.vn': ['Admin@123456', 'Tdtu@2026'],
      'thayphuc@tdtu.edu.vn': ['Admin@123456', 'Tdtu@2026'],
      'admin@tdtu.edu.vn': ['Admin@123456', 'Tdtu@2026'],
      'nguyenvana@tdtu.edu.vn': ['Gv@123456', 'Lecturer@123456', 'Tdtu@2026'],
      'tranminhlan@tdtu.edu.vn': ['Gv@123456', 'Lecturer@123456', 'Tdtu@2026'],
      'tranvanb@tdtu.edu.vn': ['Gv@123456', 'Lecturer@123456', 'Tdtu@2026'],
      '522h0045@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '522H0045', 'Tdtu@2026'],
      '51900839@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '51900839', 'Tdtu@2026'],
      '522h0001@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '522H0001', 'Tdtu@2026'],
      '522h0002@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '522H0002', 'Tdtu@2026'],
      '52100999@student.tdtu.edu.vn': ['Sv@123456', 'Student@123456', '52100999', 'Tdtu@2026']
    };

    let validPwd = false;
    if (credentialMap[cleanEmail]) {
      validPwd = credentialMap[cleanEmail].includes(pwd);
    } else if (cleanEmail.endsWith('@student.tdtu.edu.vn')) {
      const mssv = cleanEmail.split('@')[0].toUpperCase();
      validPwd = pwd === 'Sv@123456' || pwd === 'Student@123456' || pwd === mssv || pwd === 'Tdtu@2026';
    } else if (cleanEmail.endsWith('@tdtu.edu.vn')) {
      validPwd = pwd === 'Gv@123456' || pwd === 'Lecturer@123456' || pwd === 'Tdtu@2026';
    }

    if (!validPwd) {
      throw new Error('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    }

    return this.loginWithGoogle(cleanEmail);
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
