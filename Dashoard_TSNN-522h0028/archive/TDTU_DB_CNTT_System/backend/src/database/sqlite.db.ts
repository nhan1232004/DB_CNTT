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

  // 2. Students Master Table (91 real students, 134 course enrollments)
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      studentId TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      className TEXT,
      major TEXT NOT NULL,
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

    // 4 Key Lecturers
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
        INSERT INTO students (studentId, fullName, email, className, major, ktcnEnrolled, tsnnEnrolled, isDualCourse, isEligible, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (uid, email, name, role, isAdmin, isActive, studentId, department, avatarUrl, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      for (const s of studentsData) {
        const studentId = String(s.mssv || s.studentId);
        const fullName = String(s.name || s.fullName || s.hoTen || `Sinh viên ${studentId}`);
        const email = String(s.email || `${studentId}@student.tdtu.edu.vn`);
        const major = String(s.major || 'Kỹ thuật phần mềm');
        const className = String(s.class || s.className || s.lop || '20050101');

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
        const status = (s.status === 'Có doanh nghiệp' || s.hasCompany) ? 'has_company' : 'seeking';

        insertStudent.run(studentId, fullName, email, className, major, ktcn, tsnn, isDual, 1, status, now);
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
}
