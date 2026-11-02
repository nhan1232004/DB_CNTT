import { getDatabase } from '../models/sqlite.db.ts';
import { parseInboundEmailForward } from './email-parser.ts';
import { notificationService } from './notification.service.ts';

export interface CreatePostDto {
  type: 'announcement' | 'recruitment_jd';
  title: string;
  content: string;
  author: string;
  authorEmail: string;
  authorRole: string;
  companyName?: string;
  taxCode?: string;
  position?: string;
  salary?: string;
  location?: string;
  slots?: number;
  status?: 'published' | 'draft' | 'archived';
  sourceEmail?: string;
}

export class BulletinService {
  private db = getDatabase();

  getPosts(options: { type?: string; status?: string } = {}): any[] {
    let sql = 'SELECT * FROM bulletin_posts WHERE 1=1';
    const params: any[] = [];

    if (options.type) {
      sql += ' AND type = ?';
      params.push(options.type);
    }
    if (options.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY createdAt DESC';
    return this.db.prepare(sql).all(...params);
  }

  createPost(dto: CreatePostDto): any {
    const id = `post-${Date.now()}`;
    const now = new Date().toISOString();
    const status = dto.status || 'published';

    this.db.prepare(`
      INSERT INTO bulletin_posts (
        id, type, title, content, author, authorEmail, authorRole,
        companyName, taxCode, position, salary, location, slots,
        status, sourceEmail, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      dto.type,
      dto.title,
      dto.content,
      dto.author,
      dto.authorEmail,
      dto.authorRole,
      dto.companyName || null,
      dto.taxCode || null,
      dto.position || null,
      dto.salary || null,
      dto.location || null,
      dto.slots || null,
      status,
      dto.sourceEmail || null,
      now,
      now
    );

    return this.db.prepare('SELECT * FROM bulletin_posts WHERE id = ?').get(id);
  }

  updatePostStatus(id: string, status: 'published' | 'draft' | 'archived'): any {
    const post = this.db.prepare('SELECT * FROM bulletin_posts WHERE id = ?').get(id) as any;
    if (!post) throw new Error(`Không tìm thấy bài đăng có ID: ${id}`);

    const now = new Date().toISOString();
    this.db.prepare('UPDATE bulletin_posts SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, id);
    return this.db.prepare('SELECT * FROM bulletin_posts WHERE id = ?').get(id);
  }

  processEmailForward(rawEmail: string, lecturerEmail: string, lecturerName: string): any {
    const parsed = parseInboundEmailForward(rawEmail);
    return this.createPost({
      type: 'recruitment_jd',
      title: `[Email Forward] ${parsed.title}`,
      content: parsed.content,
      author: lecturerName,
      authorEmail: lecturerEmail,
      authorRole: 'Giảng viên Điều phối',
      companyName: parsed.companyName,
      position: parsed.position,
      salary: parsed.salary,
      location: parsed.location,
      slots: parsed.slots,
      status: 'draft', // Saved as draft for 1-click approval
      sourceEmail: parsed.sourceEmail
    });
  }

  applyToJob(postId: string, studentId: string, studentName: string, studentEmail: string, resumeNote?: string): any {
    const post = this.db.prepare('SELECT * FROM bulletin_posts WHERE id = ?').get(postId) as any;
    if (!post) throw new Error('Không tìm thấy tin tuyển dụng này');

    const id = `app-${Date.now()}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO applications (id, postId, studentId, studentName, studentEmail, resumeNote, status, appliedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?)
    `).run(id, postId, studentId, studentName, studentEmail, resumeNote || null, now);

    try {
      notificationService.createNotification({
        title: `Ứng tuyển thành công: ${post.title}`,
        content: `Khoa CNTT xác nhận bạn đã nộp hồ sơ ứng tuyển vị trí "${post.position || post.title}" tại ${post.companyName || 'Doanh nghiệp'}. Hồ sơ đã được chuyển tiếp đến Bộ phận Tuyển dụng.`,
        type: 'job_applied',
        priority: 'normal',
        targetAudience: 'specific_student',
        targetStudentId: studentId,
        targetEmail: studentEmail,
        senderRole: 'system',
        senderName: 'Cổng Thực tập TDTU',
        senderEmail: 'khoacntt@tdtu.edu.vn'
      });
    } catch {}

    return this.db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  }

  getApplications(postId?: string): any[] {
    if (postId) {
      return this.db.prepare('SELECT * FROM applications WHERE postId = ? ORDER BY appliedAt DESC').all(postId);
    }
    return this.db.prepare('SELECT * FROM applications ORDER BY appliedAt DESC').all();
  }
}

export const bulletinService = new BulletinService();
