import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { ENV } from '../config/env.config.ts';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    const dbDir = path.dirname(ENV.DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    dbInstance = new DatabaseSync(ENV.DB_PATH);
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    initDatabaseSchema(dbInstance);
  }
  return dbInstance;
}

export function initDatabaseSchema(db: DatabaseSync): void {
  // 1. Users Table (Firebase Auth & Internal RBAC)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'lecturer')),
      isAdmin INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      studentId TEXT,
      department TEXT,
      avatarUrl TEXT,
      createdAt TEXT NOT NULL
    );
  `);

  // 2. Students Master Table (Real students with GPA & Academic Rank)
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      studentId TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      className TEXT,
      major TEXT NOT NULL,
      birthDate TEXT,
      birthPlace TEXT,
      gender TEXT DEFAULT 'Nam',
      phone TEXT,
      gpa10 REAL DEFAULT 0,
      gpa4 REAL DEFAULT 0,
      academicRank TEXT DEFAULT 'Khá',
      lecturerNote TEXT,
      ktcnEnrolled INTEGER NOT NULL DEFAULT 0,
      tsnnEnrolled INTEGER NOT NULL DEFAULT 0,
      isDualCourse INTEGER NOT NULL DEFAULT 0,
      isEligible INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'seeking',
      createdAt TEXT NOT NULL
    );
  `);

  // 3. Internship Declarations Table (1 or 2 courses simultaneously)
  db.exec(`
    CREATE TABLE IF NOT EXISTS declarations (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      studentEmail TEXT NOT NULL,
      companyName TEXT NOT NULL,
      taxCode TEXT NOT NULL,
      address TEXT NOT NULL,
      contactPerson TEXT NOT NULL,
      contactPhone TEXT NOT NULL,
      contactEmail TEXT NOT NULL,
      position TEXT NOT NULL,
      isDualCourse INTEGER NOT NULL DEFAULT 0,
      selectedCourses TEXT NOT NULL,
      noCompanyOption TEXT,
      foreignLanguage TEXT,
      foreignScore TEXT,
      foreignStatus TEXT NOT NULL DEFAULT 'unverified',
      isConfirmed INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'submitted',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students(studentId) ON DELETE CASCADE
    );
  `);

  // 4. Two-Tier Bulletin Board Table (Tier 1: Lecturer Notices, Tier 2: Email Forward JDs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS bulletin_posts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('announcement', 'recruitment_jd')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      authorEmail TEXT NOT NULL,
      authorRole TEXT NOT NULL,
      companyName TEXT,
      taxCode TEXT,
      position TEXT,
      salary TEXT,
      location TEXT,
      slots INTEGER,
      status TEXT NOT NULL CHECK(status IN ('published', 'draft', 'archived')),
      sourceEmail TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // 5. Job Applications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      studentEmail TEXT NOT NULL,
      resumeNote TEXT,
      status TEXT NOT NULL DEFAULT 'submitted',
      appliedAt TEXT NOT NULL,
      FOREIGN KEY (postId) REFERENCES bulletin_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (studentId) REFERENCES students(studentId) ON DELETE CASCADE
    );
  `);

  // 6. Student Uploaded Certificates Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_uploaded_certs (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentName TEXT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      score TEXT,
      maxScore TEXT,
      level TEXT,
      examDate TEXT,
      issueDate TEXT,
      proofFileName TEXT,
      fileName TEXT,
      fileType TEXT,
      fileSize TEXT,
      status TEXT NOT NULL DEFAULT 'unverified',
      verified INTEGER NOT NULL DEFAULT 0,
      proofData TEXT,
      driveLink TEXT,
      commitmentConfirmed INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    );
  `);

  // 7. Targeted Notifications & Anti-Spam Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      senderRole TEXT NOT NULL,
      senderName TEXT,
      senderEmail TEXT,
      targetAudience TEXT NOT NULL,
      targetMajor TEXT,
      targetStudentId TEXT,
      targetEmail TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      metadata TEXT,
      createdAt TEXT NOT NULL,
      readBy TEXT NOT NULL DEFAULT '[]'
    );
  `);

  // Ensure driveLink and issueDate columns exist on existing databases
  try {
    db.exec(`ALTER TABLE student_uploaded_certs ADD COLUMN driveLink TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE student_uploaded_certs ADD COLUMN issueDate TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE students ADD COLUMN cert TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE students ADD COLUMN birthDate TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE students ADD COLUMN birthPlace TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE students ADD COLUMN gender TEXT DEFAULT 'Nam';`);
  } catch {}
  try {
    db.exec(`ALTER TABLE students ADD COLUMN phone TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE students ADD COLUMN gpa10 REAL DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE students ADD COLUMN gpa4 REAL DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE students ADD COLUMN academicRank TEXT DEFAULT 'Khá';`);
  } catch {}
  try {
    db.exec(`ALTER TABLE students ADD COLUMN lecturerNote TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN academicAdvisor TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN advisorEmail TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN advisorNote TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN contactRole TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN taxDepartment TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN companyStatus TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN orgType TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN taxUpdatedAt TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN representative TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN mainIndustry TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN declarationHistory TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN hasChangedFromSupport INTEGER DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN withdrawnSupportAt TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN supportNote TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN supportReason TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN desiredLocation TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN cvDriveLink TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN pendingCompany TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN interviewProgress TEXT;`);
  } catch {}

  // Seed default data if empty
  seedInitialData(db);
}

function seedInitialData(db: DatabaseSync): void {
  // Check if users already seeded
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount === 0) {
    const now = new Date().toISOString();
    const insertUser = db.prepare(`
      INSERT INTO users (uid, email, name, role, isAdmin, isActive, studentId, department, avatarUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Key Admin & Lecturers
    insertUser.run('fb-usr-admin-phuc', 'duonghuuphuc@tdtu.edu.vn', 'TS. Dương Hữu Phúc', 'lecturer', 1, 1, null, 'Ban Chủ nhiệm Khoa CNTT', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DuongHuuPhuc', now);
    insertUser.run('fb-usr-admin-01', 'phamvanc@tdtu.edu.vn', 'TS. Phạm Văn C', 'lecturer', 1, 1, null, 'Khoa CNTT - Phụ trách Học vụ & Thực tập', 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhamVanC', now);
    insertUser.run('fb-usr-admin-02', 'nguyenvana@tdtu.edu.vn', 'ThS. Nguyễn Văn A', 'lecturer', 0, 1, null, 'Khoa CNTT - Điều phối Doanh nghiệp', 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenVanA', now);
    insertUser.run('fb-usr-lec-03', 'tranthib@tdtu.edu.vn', 'TS. Trần Thị B', 'lecturer', 0, 1, null, 'Bộ môn Kỹ thuật Phần mềm (Cố vấn học tập)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=TranThiB', now);
    insertUser.run('fb-usr-lec-04', 'lehoangd@tdtu.edu.vn', 'ThS. Lê Hoàng D', 'lecturer', 0, 1, null, 'Bộ môn Mạng máy tính & Viễn thông', 'https://api.dicebear.com/7.x/avataaars/svg?seed=LeHoangD', now);
  }

  // Check if students seeded
  const studentCount = (db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count;
  if (studentCount === 0 && fs.existsSync(ENV.REAL_STUDENTS_PATH)) {
    try {
      const raw = fs.readFileSync(ENV.REAL_STUDENTS_PATH, 'utf-8');
      const studentsData = JSON.parse(raw);
      const insertStudent = db.prepare(`
        INSERT INTO students (
          studentId, fullName, email, className, major,
          birthDate, birthPlace, gender, phone, gpa10, gpa4, academicRank,
          ktcnEnrolled, tsnnEnrolled, isDualCourse, isEligible, status, createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (uid, email, name, role, isAdmin, isActive, studentId, department, avatarUrl, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      for (const s of studentsData) {
        const studentId = String(s.mssv || s.studentId).trim().toUpperCase();
        if (!studentId || studentId.startsWith('SV_')) continue;
        const fullName = String(s.name || s.fullName || s.hoTen || `Sinh viên ${studentId}`);
        const email = String(s.email || `${studentId.toLowerCase()}@student.tdtu.edu.vn`);
        const major = String(s.major || 'Kỹ thuật phần mềm');
        const className = String(s.class || s.className || s.lop || '20050101');
        const birthDate = String(s.birthDate || s.dob || '');
        const birthPlace = String(s.birthPlace || s.pob || '');
        const gender = String(s.gender || 'Nam');
        const phone = String(s.phone || '');
        const gpa10 = Number(s.gpa10) || 0;
        const gpa4 = Number(s.gpa4 ?? s.gpa) || 0;
        const academicRank = String(s.academicRank || 'Khá');

        let ktcn = 0;
        let tsnn = 0;
        if (Array.isArray(s.courses)) {
          ktcn = s.courses.some((c: string) => c.includes('Kiến tập') || c.includes('KTCN')) ? 1 : 0;
          tsnn = s.courses.some((c: string) => c.includes('Dự án') || c.includes('Tập sự') || c.includes('TSNN')) ? 1 : 0;
        } else if (s.course_str) {
          ktcn = s.course_str.includes('KTCN') ? 1 : 0;
          tsnn = (s.course_str.includes('DA CNTT') || s.course_str.includes('TSNN')) ? 1 : 0;
        } else {
          ktcn = s.ktcnEnrolled ? 1 : 0;
          tsnn = s.tsnnEnrolled ? 1 : 0;
        }

        const isDual = (ktcn && tsnn) ? 1 : 0;
        const status = (s.status === 'Có doanh nghiệp' || s.hasCompany || s.companyName) ? 'has_company' : 'seeking';

        insertStudent.run(
          studentId, fullName, email, className, major,
          birthDate, birthPlace, gender, phone, gpa10, gpa4, academicRank,
          ktcn, tsnn, isDual, 1, status, now
        );
        insertUser.run(`fb-tdtu-usr-${studentId}`, email, fullName, 'student', 0, 1, studentId, major, `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`, now);
      }
    } catch (err) {
      console.error('[Database Seed Error]:', err);
    }
  }

  // Seed sample bulletin notices
  const bulletinCount = (db.prepare('SELECT COUNT(*) as count FROM bulletin_posts').get() as any).count;
  if (bulletinCount === 0) {
    const now = new Date().toISOString();
    const insertPost = db.prepare(`
      INSERT INTO bulletin_posts (id, type, title, content, author, authorEmail, authorRole, companyName, taxCode, position, salary, location, slots, status, sourceEmail, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPost.run(
      'post-ann-01',
      'announcement',
      'Thông báo v/v Khai báo Nơi thực tập và Nộp biểu mẫu BM-01 Học kỳ 1 (2026-2027)',
      'Khoa CNTT thông báo: Tất cả sinh viên đã đăng ký học phần Kiến tập công nghiệp (KTCN) và Tập sự nghề nghiệp (TSNN) phải hoàn tất khai báo thông tin doanh nghiệp tiếp nhận và xác thực Mã số thuế trước ngày 15 của tháng đầu học kỳ. Sinh viên đi 2 môn đồng thời tại 1 doanh nghiệp chỉ cần khai báo 1 lần duy nhất trên hệ thống.',
      'TS. Phạm Văn C',
      'phamvanc@tdtu.edu.vn',
      'Giảng viên Quản trị',
      null, null, null, null, null, null,
      'published', null, now, now
    );

    insertPost.run(
      'post-jd-01',
      'recruitment_jd',
      'FPT Software Tuyển dụng 20 Thực tập sinh Fullstack (NodeJS + React) & AI Engineer',
      'FPT Software Hồ Chí Minh tuyển dụng sinh viên Khoa CNTT TDTU thực tập có phụ cấp. Cơ hội trở thành nhân viên chính thức sau 320 giờ thực tập. Yêu cầu: Nắm chắc kiến thức cấu trúc dữ liệu, React, NodeJS hoặc Python.',
      'ThS. Nguyễn Văn A',
      'nguyenvana@tdtu.edu.vn',
      'Giảng viên Điều phối DN',
      'Công ty TNHH Phần mềm FPT',
      '0101778162',
      'Thực tập sinh NodeJS / React / AI',
      '6,000,000 - 10,000,000 VNĐ/tháng',
      'Khu Công nghệ Cao, TP. Thủ Đức, TP.HCM',
      20,
      'published',
      'fpt-recruitment@fsoft.com.vn',
      now, now
    );

    insertPost.run(
      'post-jd-draft-01',
      'recruitment_jd',
      '[Email Forward Draft] VNG Corporation Tuyển Thực tập sinh Backend Golang / Node.js',
      'Email chuyển tiếp từ VP Doanh nghiệp: VNG tuyển 5 thực tập sinh làm việc tại VNG Campus Quận 7. Hỗ trợ phụ cấp 8,000,000 VNĐ + Cơm trưa và xe buýt đưa đón từ TDTU.',
      'TS. Phạm Văn C',
      'phamvanc@tdtu.edu.vn',
      'Giảng viên Quản trị',
      'Công ty Cổ phần VNG',
      '0303882213',
      'Backend Intern (Node.js/Go)',
      '8,000,000 VNĐ/tháng',
      'VNG Campus, Tân Thuận Đông, Quận 7, TP.HCM',
      5,
      'draft',
      'recruitment@vng.com.vn',
      now, now
    );
  }

  // Check if notifications seeded
  const notifCount = (db.prepare('SELECT COUNT(*) as count FROM notifications').get() as any).count;
  if (notifCount === 0) {
    const now = new Date().toISOString();
    const insertNotif = db.prepare(`
      INSERT INTO notifications (
        id, title, content, type, senderRole, senderName, senderEmail,
        targetAudience, targetMajor, targetStudentId, targetEmail,
        priority, metadata, createdAt, readBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Toàn hệ thống
    insertNotif.run(
      'notif-sys-01',
      '[TDTU Khoa CNTT] Thông báo Kế hoạch Thực tập Doanh nghiệp HK1/2026-2027',
      'Khoa Công nghệ Thông tin thông báo thời gian hoàn thành nộp Phiếu tiếp nhận BM-01 trước ngày 15/11/2026. Sinh viên đi 2 môn song song được áp dụng chế độ thực tập tập trung 320 giờ.',
      'announcement',
      'admin',
      'Ban Chủ nhiệm Khoa CNTT',
      'phamvanc@tdtu.edu.vn',
      'all',
      null, null, null,
      'high',
      null,
      now,
      '[]'
    );

    // 2. Cơ hội tuyển dụng JD
    insertNotif.run(
      'notif-sys-02',
      '[Cơ hội Tuyển dụng] FPT Software Tuyển 20 Thực tập sinh Fullstack React & AI',
      'FPT Software HCM tuyển dụng sinh viên KTPM/KHMT thực tập trợ cấp 6.000.000 - 10.000.000 VNĐ/tháng. Đã mở cổng nhận hồ sơ ứng tuyển trực tiếp trên hệ thống.',
      'job_applied',
      'admin',
      'Ban Hợp tác Doanh nghiệp',
      'nguyenvana@tdtu.edu.vn',
      'all_students',
      null, null, null,
      'normal',
      null,
      now,
      '[]'
    );

    // 3. Nhắc nhở riêng nhóm sinh viên chưa có nơi thực tập
    insertNotif.run(
      'notif-target-seeking-01',
      '[Nhắc nhở Quan trọng] Hạn chót hoàn tất Khai báo Thực tập HK1/2026-2027',
      'Thầy/Cô nhắc nhở các bạn sinh viên hiện vẫn đang trong trạng thái tìm kiếm doanh nghiệp hoặc chờ phỏng vấn: Hãy nhanh chóng liên hệ Khoa để được hỗ trợ kết nối doanh nghiệp đối tác trước ngày 30/11/2026.',
      'reminder',
      'admin',
      'TS. Phạm Văn C',
      'phamvanc@tdtu.edu.vn',
      'students_seeking',
      null, null, null,
      'urgent',
      null,
      now,
      '[]'
    );
  }
}
