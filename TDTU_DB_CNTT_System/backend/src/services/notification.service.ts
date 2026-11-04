import { getDatabase } from '../models/sqlite.db.ts';
import type { NotificationDto, TargetAudienceType, UserClaims } from '../models/types.ts';

interface AntiSpamEntry {
  notification: any;
  timestamp: number;
}

export class NotificationService {
  private db = getDatabase();
  // Bộ nhớ đệm chống Spam / Click đúp liên tục (20 giây cooldown)
  private antiSpamCache = new Map<string, AntiSpamEntry>();

  constructor() {
    // Dọn dẹp cache định kỳ mỗi 5 phút
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.antiSpamCache.entries()) {
        if (now - entry.timestamp > 30000) {
          this.antiSpamCache.delete(key);
        }
      }
    }, 300000);
    if (typeof timer.unref === 'function') timer.unref();
  }

  /**
   * Tạo thông báo mới kèm cơ chế Anti-Spam & Phân quyền đối tượng nghiêm ngặt
   */
  createNotification(dto: NotificationDto, sender?: UserClaims): any {
    if (!dto.title || !dto.title.trim()) {
      throw new Error('Tiêu đề thông báo không được để trống');
    }
    if (!dto.content || !dto.content.trim()) {
      throw new Error('Nội dung thông báo không được để trống');
    }

    // 1. Phân quyền người gửi (RBAC Enforcement)
    if (sender && sender.role === 'student') {
      // Nếu là sinh viên gửi thông báo cập nhật hồ sơ tới Giảng viên/Admin: giữ nguyên targetAudience là 'all_lecturers'
      if (dto.targetAudience !== 'all_lecturers') {
        dto.targetAudience = 'specific_student';
      }
      dto.targetStudentId = sender.studentId || dto.targetStudentId;
      dto.targetEmail = sender.email || dto.targetEmail;
      dto.senderRole = 'student';
      dto.senderName = sender.name || dto.senderName || 'Sinh viên';
      dto.senderEmail = sender.email || dto.senderEmail;
    } else {
      dto.senderRole = sender?.isAdmin ? 'admin' : (sender?.role || dto.senderRole || 'admin');
      dto.senderName = sender?.name || dto.senderName || 'Ban Quản trị Khoa CNTT';
      dto.senderEmail = sender?.email || dto.senderEmail || 'admin-cntt@tdtu.edu.vn';
    }

    // 2. Cơ chế Anti-Spam / Idempotency: Ngăn ngừa spam nút "Lưu & Gửi thông tin" liên tiếp
    const spamKey = `${dto.targetAudience}_${(dto.targetStudentId || '').toUpperCase()}_${dto.type || ''}_${dto.title.trim().toLowerCase()}`;
    const now = Date.now();
    const existingSpam = this.antiSpamCache.get(spamKey);

    if (existingSpam && (now - existingSpam.timestamp < 20000)) {
      console.log(`[Anti-Spam Filter]: Bỏ qua thông báo spam trùng lặp trong 20s cho key: ${spamKey}`);
      return existingSpam.notification;
    }

    // Kiểm tra trong DB xem đã có thông báo cùng loại trong 20s gần nhất chưa
    const recentDbEntry = this.db.prepare(`
      SELECT * FROM notifications 
      WHERE targetAudience = ? 
        AND (targetStudentId = ? OR (targetStudentId IS NULL AND ? IS NULL))
        AND title = ?
      ORDER BY createdAt DESC LIMIT 1
    `).get(dto.targetAudience, dto.targetStudentId || null, dto.targetStudentId || null, dto.title.trim()) as any;

    if (recentDbEntry && (now - new Date(recentDbEntry.createdAt).getTime() < 20000)) {
      console.log(`[Anti-Spam DB]: Bỏ qua lưu trùng lặp thông báo đã tồn tại gần đây (${recentDbEntry.id})`);
      this.antiSpamCache.set(spamKey, { notification: recentDbEntry, timestamp: now });
      return recentDbEntry;
    }

    // 3. Chuẩn hóa dữ liệu và ghi vào SQLite
    const id = dto.id || `notif_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = dto.createdAt || new Date().toISOString();
    const metadataStr = dto.metadata ? JSON.stringify(dto.metadata) : null;
    const priority = dto.priority || 'normal';
    const type = dto.type || 'announcement';

    this.db.prepare(`
      INSERT INTO notifications (
        id, title, content, type, senderRole, senderName, senderEmail,
        targetAudience, targetMajor, targetStudentId, targetEmail,
        priority, metadata, createdAt, readBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')
    `).run(
      id,
      dto.title.trim(),
      dto.content.trim(),
      type,
      dto.senderRole,
      dto.senderName,
      dto.senderEmail,
      dto.targetAudience,
      dto.targetMajor || null,
      dto.targetStudentId || null,
      dto.targetEmail || null,
      priority,
      metadataStr,
      createdAt
    );

    const saved = this.db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as any;
    this.antiSpamCache.set(spamKey, { notification: saved, timestamp: now });

    console.log(`[Notification Service]: Đã tạo thông báo [${id}] - Target: [${dto.targetAudience}] - Người nhận: [${dto.targetStudentId || 'Tất cả'}]`);
    return saved;
  }

  /**
   * Lấy danh sách thông báo theo đúng Phân quyền của Người dùng hiện tại
   * - Sinh viên: CHỈ xem thông báo của chính mình (chứng chỉ, khai báo, ứng tuyển) + thông báo chung của toàn trường/khoa/phân đoạn sinh viên
   * - Giảng viên & Admin: KHÔNG bị tràn ngập thông báo cá nhân của từng sinh viên (để tránh loãng hộp thư)
   */
  getNotificationsForUser(user?: UserClaims): any[] {
    // Tự động xóa thông báo thường sau 5 ngày theo quy định
    try {
      this.db.prepare("DELETE FROM notifications WHERE datetime(createdAt) < datetime('now', '-5 days')").run();
    } catch {}

    if (!user) {
      // Khách vãng lai chưa đăng nhập: chỉ thấy thông báo toàn trường chung
      return this.db.prepare(`
        SELECT * FROM notifications 
        WHERE targetAudience = 'all' 
        ORDER BY createdAt DESC LIMIT 20
      `).all() as any[];
    }

    const allNotifs = this.db.prepare(`
      SELECT * FROM notifications 
      ORDER BY createdAt DESC
    `).all() as any[];

    // 1. Nếu là ROLE ADMIN: Xem được toàn bộ thông báo hệ thống và các chiến dịch phát thông báo
    if (user.isAdmin || user.role === 'admin') {
      return allNotifs.map(n => this.formatNotificationForUser(n, user));
    }

    // 2. Nếu là ROLE GIẢNG VIÊN (không phải Admin):
    // CHỈ nhận thông báo cho toàn hệ thống ('all') hoặc thông báo nội bộ cho toàn bộ giảng viên ('all_lecturers')
    // TUYỆT ĐỐI KHÔNG nhận thông báo nộp bài / nộp chứng chỉ / khai báo cá nhân của từng sinh viên để tránh spam!
    if (user.role === 'lecturer') {
      return allNotifs
        .filter(n => n.targetAudience === 'all' || n.targetAudience === 'all_lecturers')
        .map(n => this.formatNotificationForUser(n, user));
    }

    // 3. Nếu là ROLE SINH VIÊN:
    // Kiểm tra thông tin hồ sơ của sinh viên này để xác định các nhóm phân đoạn (segments)
    const sid = (user.studentId || user.uid || '').toUpperCase();
    const student = this.db.prepare(`
      SELECT s.*, d.noCompanyOption, d.companyName as declCompanyName
      FROM students s
      LEFT JOIN declarations d ON UPPER(d.studentId) = UPPER(s.studentId)
      WHERE UPPER(s.studentId) = UPPER(?) OR UPPER(s.email) = UPPER(?)
    `).get(sid, user.email) as any;

    const studentStatus = student?.status || 'seeking';
    const isSeeking = studentStatus === 'seeking' || studentStatus === 'Chưa có doanh nghiệp' || studentStatus === 'Đang tìm';
    const isNeedSupport = student?.noCompanyOption === 'faculty' || (student?.declCompanyName && student.declCompanyName.includes('hỗ trợ'));
    const isDualCourse = Boolean(student?.isDualCourse === 1 || (student?.ktcnEnrolled === 1 && student?.tsnnEnrolled === 1));
    const studentMajor = student?.major || '';

    // Kiểm tra xem sinh viên đã có chứng chỉ ngoại ngữ đạt chuẩn B1 chưa
    const certCount = (this.db.prepare(`
      SELECT COUNT(*) as count FROM student_uploaded_certs 
      WHERE UPPER(studentId) = UPPER(?) AND level IN ('B1', 'B2', 'C1', 'C2')
    `).get(sid) as any)?.count || 0;
    const hasValidCert = certCount > 0 || Boolean(student?.cert && student.cert.length > 2);

    const filtered = allNotifs.filter(n => {
      // 3.1. Thông báo tới toàn hệ thống
      if (n.targetAudience === 'all') return true;

      // 3.2. Thông báo tới toàn thể sinh viên
      if (n.targetAudience === 'all_students') return true;

      // 3.3. Thông báo đích danh cho chính sinh viên này (Khai báo thực tập / Nộp chứng chỉ / Ứng tuyển JD)
      // TUYỆT ĐỐI KHÔNG để lộ cho sinh viên khác xem!
      if (n.targetAudience === 'specific_student') {
        const targetSid = (n.targetStudentId || '').toUpperCase();
        const targetMail = (n.targetEmail || '').toLowerCase();
        return targetSid === sid || (targetMail && targetMail === user.email.toLowerCase());
      }

      // 3.4. Phân đoạn: Sinh viên chưa có chỗ thực tập
      if (n.targetAudience === 'students_seeking' && isSeeking) {
        return true;
      }

      // 3.5. Phân đoạn: Sinh viên cần Khoa hỗ trợ
      if (n.targetAudience === 'students_need_support' && isNeedSupport) {
        return true;
      }

      // 3.6. Phân đoạn: Sinh viên chưa nộp chứng chỉ tiếng Anh
      if (n.targetAudience === 'students_no_cert' && !hasValidCert) {
        return true;
      }

      // 3.7. Phân đoạn: Sinh viên học song song 2 môn KTCN & TSNN
      if (n.targetAudience === 'students_dual_course' && isDualCourse) {
        return true;
      }

      // 3.8. Phân đoạn: Sinh viên theo ngành học cụ thể
      if (n.targetAudience === 'students_by_major' && n.targetMajor) {
        return studentMajor.toLowerCase().includes(n.targetMajor.toLowerCase());
      }

      return false;
    });

    return filtered.map(n => this.formatNotificationForUser(n, user));
  }

  /**
   * Tính toán trước số lượng đối tượng nhận thông báo (Audience Preview cho Admin)
   */
  getAudienceCount(targetAudience: TargetAudienceType | string, targetMajor?: string): { count: number; label: string; description: string } {
    switch (targetAudience) {
      case 'all': {
        const userCount = (this.db.prepare('SELECT COUNT(*) as c FROM users WHERE isActive = 1').get() as any)?.c || 0;
        return {
          count: userCount,
          label: 'Toàn bộ Hệ thống',
          description: 'Tất cả Giảng viên, Sinh viên và Quản trị viên trong hệ thống'
        };
      }
      case 'all_lecturers': {
        const count = (this.db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'lecturer' AND isActive = 1").get() as any)?.c || 0;
        return {
          count,
          label: 'Toàn bộ Giảng viên',
          description: 'Tất cả Thầy/Cô và Ban chủ nhiệm Khoa'
        };
      }
      case 'all_students': {
        const count = (this.db.prepare('SELECT COUNT(*) as c FROM students').get() as any)?.c || 0;
        return {
          count,
          label: 'Toàn bộ Sinh viên',
          description: 'Tất cả sinh viên trong danh sách xét duyệt thực tập HK1'
        };
      }
      case 'students_seeking': {
        const count = (this.db.prepare("SELECT COUNT(*) as c FROM students WHERE status = 'seeking'").get() as any)?.c || 0;
        return {
          count,
          label: 'Sinh viên chưa có nơi thực tập',
          description: 'Các sinh viên đang trong trạng thái tìm kiếm hoặc chờ phỏng vấn'
        };
      }
      case 'students_need_support': {
        const count = (this.db.prepare("SELECT COUNT(*) as c FROM declarations WHERE noCompanyOption = 'faculty'").get() as any)?.c || 0;
        return {
          count,
          label: 'Sinh viên cần Khoa hỗ trợ',
          description: 'Các sinh viên đã nộp nguyện vọng nhờ Khoa CNTT điều phối doanh nghiệp'
        };
      }
      case 'students_no_cert': {
        // Đếm số sinh viên chưa có chứng chỉ B1 trong bảng uploaded certs
        const count = (this.db.prepare(`
          SELECT COUNT(*) as c FROM students s
          WHERE s.studentId NOT IN (
            SELECT DISTINCT studentId FROM student_uploaded_certs WHERE level IN ('B1', 'B2', 'C1', 'C2')
          )
        `).get() as any)?.c || 0;
        return {
          count,
          label: 'Sinh viên chưa nộp chứng chỉ tiếng Anh',
          description: 'Các sinh viên chưa cập nhật chứng chỉ B1 quốc tế xét tốt nghiệp'
        };
      }
      case 'students_dual_course': {
        const count = (this.db.prepare('SELECT COUNT(*) as c FROM students WHERE isDualCourse = 1 OR (ktcnEnrolled = 1 AND tsnnEnrolled = 1)').get() as any)?.c || 0;
        return {
          count,
          label: 'Sinh viên thực tập song song 2 môn',
          description: 'Các sinh viên học đồng thời cả KTCN (160h) và TSNN (320h)'
        };
      }
      case 'students_by_major': {
        const m = targetMajor || 'Kỹ thuật phần mềm';
        const count = (this.db.prepare('SELECT COUNT(*) as c FROM students WHERE UPPER(major) LIKE UPPER(?)').get(`%${m}%`) as any)?.c || 0;
        return {
          count,
          label: `Sinh viên ngành ${m}`,
          description: `Tất cả sinh viên thuộc chuyên ngành ${m}`
        };
      }
      case 'specific_student': {
        return {
          count: 1,
          label: 'Đích danh 1 Sinh viên cụ thể',
          description: 'Chỉ gửi tới sinh viên có MSSV được chỉ định'
        };
      }
      default:
        return {
          count: 0,
          label: 'Không xác định',
          description: 'Vui lòng chọn đối tượng nhận hợp lệ'
        };
    }
  }

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  markAsRead(notificationId: string, user: UserClaims): boolean {
    const notif = this.db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId) as any;
    if (!notif) return false;

    let readBy: string[] = [];
    try {
      readBy = JSON.parse(notif.readBy || '[]');
    } catch {}

    const readerId = user.studentId || user.uid || user.email;
    if (!readBy.includes(readerId)) {
      readBy.push(readerId);
      this.db.prepare('UPDATE notifications SET readBy = ? WHERE id = ?').run(JSON.stringify(readBy), notificationId);
    }
    return true;
  }

  /**
   * Đánh dấu toàn bộ thông báo của người dùng là đã đọc
   */
  markAllAsRead(user: UserClaims): boolean {
    const list = this.getNotificationsForUser(user);
    const readerId = user.studentId || user.uid || user.email;

    const stmt = this.db.prepare('UPDATE notifications SET readBy = ? WHERE id = ?');
    for (const item of list) {
      let readBy: string[] = [];
      try {
        readBy = JSON.parse(item.readBy || '[]');
      } catch {}
      if (!readBy.includes(readerId)) {
        readBy.push(readerId);
        stmt.run(JSON.stringify(readBy), item.id);
      }
    }
    return true;
  }

  /**
   * Xóa thông báo (Dành cho Admin)
   */
  deleteNotification(notificationId: string): boolean {
    const res = this.db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);
    return res.changes > 0;
  }

  /**
   * Format thông báo và tính cờ read theo từng user
   */
  private formatNotificationForUser(notif: any, user: UserClaims): any {
    let readBy: string[] = [];
    try {
      readBy = JSON.parse(notif.readBy || '[]');
    } catch {}

    const readerId = user.studentId || user.uid || user.email;
    const isRead = readBy.includes(readerId);

    // Diễn giải nhãn đối tượng hiển thị
    let audienceLabel = 'Toàn trường';
    if (notif.type === 'student_declaration_update') {
      audienceLabel = 'Cập nhật SV';
    } else {
      switch (notif.targetAudience) {
        case 'all': audienceLabel = 'Toàn hệ thống'; break;
        case 'all_students': audienceLabel = 'Toàn bộ Sinh viên'; break;
        case 'all_lecturers': audienceLabel = 'Toàn bộ Giảng viên'; break;
        case 'students_seeking': audienceLabel = 'Nhóm: Chưa có nơi thực tập'; break;
        case 'students_need_support': audienceLabel = 'Nhóm: Cần Khoa hỗ trợ'; break;
        case 'students_no_cert': audienceLabel = 'Nhóm: Chưa nộp chứng chỉ'; break;
        case 'students_dual_course': audienceLabel = 'Nhóm: Học song song 2 môn'; break;
        case 'students_by_major': audienceLabel = `Ngành: ${notif.targetMajor || 'Chuyên ngành'}`; break;
        case 'specific_student': audienceLabel = 'Cá nhân bạn'; break;
      }
    }

    let parsedMeta = null;
    if (notif.metadata) {
      try {
        parsedMeta = typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata;
      } catch {}
    }

    return {
      id: notif.id,
      title: notif.title,
      content: notif.content,
      type: notif.type,
      priority: notif.priority,
      targetAudience: notif.targetAudience,
      targetAudienceLabel: audienceLabel,
      targetMajor: notif.targetMajor,
      targetStudentId: notif.targetStudentId,
      senderRole: notif.senderRole,
      senderName: notif.senderName,
      senderEmail: notif.senderEmail,
      createdAt: notif.createdAt,
      read: isRead,
      metadata: parsedMeta,
      isPrivate: notif.targetAudience === 'specific_student'
    };
  }
}

export const notificationService = new NotificationService();
