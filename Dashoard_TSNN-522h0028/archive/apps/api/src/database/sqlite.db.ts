// ============================================================================
// PERSISTENT SQLITE DATABASE ENGINE (Synchronized with Prisma Schema)
// Sử dụng node:sqlite (DatabaseSync) tích hợp sẵn trong Node.js 24
// Khởi tạo & lưu trữ bền vững 91 sinh viên, 134 lượt đăng ký môn, Users, RBAC,
// Khai báo MST, Chứng chỉ ngoại ngữ TDTU, Bảng tin GV và Email Forward JD
// ============================================================================

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StudentRecord } from '../../../../packages/shared-types/src/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_DB_FILE_PATH = path.resolve(__dirname, '../data/db_cntt.sqlite');

export class SqliteDatabase {
  public readonly db: DatabaseSync;
  public readonly dbPath: string;

  getDb(): DatabaseSync {
    return this.db;
  }

  constructor(customDbPath?: string) {
    this.dbPath = customDbPath || DEFAULT_DB_FILE_PATH;
    if (this.dbPath !== ':memory:') {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.initializeSchema();
    this.seedInitialDataIfNeeded();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('GV', 'SV')),
        is_admin INTEGER NOT NULL DEFAULT 0,
        student_id TEXT,
        department TEXT NOT NULL DEFAULT 'Khoa Công Nghệ Thông Tin - TDTU',
        granted_by TEXT,
        firebase_uid TEXT,
        auth_provider TEXT NOT NULL DEFAULT 'google.com',
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        login_count INTEGER NOT NULL DEFAULT 0,
        photo_url TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS students (
        mssv TEXT PRIMARY KEY,
        stt INTEGER NOT NULL,
        last_name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        name TEXT NOT NULL,
        dob TEXT NOT NULL,
        pob TEXT NOT NULL,
        gender TEXT NOT NULL,
        class_name TEXT NOT NULL,
        campus TEXT NOT NULL DEFAULT '0 - TP. Hồ Chí Minh',
        major TEXT NOT NULL,
        courses_json TEXT NOT NULL,
        course_str TEXT NOT NULL,
        status TEXT NOT NULL,
        company TEXT NOT NULL,
        tax_code TEXT,
        company_address TEXT,
        industry TEXT,
        representative TEXT,
        position TEXT,
        mentor TEXT,
        support_option TEXT,
        preferred_field TEXT,
        cert TEXT NOT NULL,
        cert_status TEXT NOT NULL,
        cert_code TEXT,
        cert_score TEXT,
        cert_number TEXT,
        exam_date TEXT,
        commitment_deadline TEXT,
        proof_file_name TEXT,
        gpa REAL NOT NULL DEFAULT 3.0,
        updated TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS course_enrollments (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        course_code TEXT NOT NULL,
        course_name TEXT NOT NULL,
        group_code TEXT NOT NULL,
        campus TEXT NOT NULL DEFAULT '0 - TP. Hồ Chí Minh',
        semester TEXT NOT NULL DEFAULT 'HK1_2026-2027',
        registered_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(mssv) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS internship_declarations (
        id TEXT PRIMARY KEY,
        student_id TEXT UNIQUE NOT NULL,
        selected_courses_json TEXT NOT NULL,
        has_company INTEGER NOT NULL DEFAULT 0,
        tax_code TEXT,
        company_name TEXT,
        company_address TEXT,
        industry TEXT,
        representative TEXT,
        intern_position TEXT,
        mentor_contact TEXT,
        status TEXT NOT NULL,
        support_option TEXT,
        preferred_field TEXT,
        is_confirmed_by_student INTEGER NOT NULL DEFAULT 0,
        confirmed_at TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(mssv) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS graduation_language_certs (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        cert_code TEXT NOT NULL,
        cert_name TEXT NOT NULL,
        score_or_level TEXT NOT NULL,
        cert_number TEXT,
        exam_date TEXT,
        commitment_deadline TEXT,
        proof_file_name TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(mssv) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS lecturer_announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Hướng dẫn',
        is_pinned INTEGER NOT NULL DEFAULT 0,
        author_name TEXT NOT NULL,
        author_email TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS jd_postings (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        tax_code TEXT NOT NULL,
        job_title TEXT NOT NULL,
        description TEXT NOT NULL,
        skills_json TEXT NOT NULL,
        stipend TEXT NOT NULL,
        quota INTEGER NOT NULL DEFAULT 5,
        accepts_both_courses INTEGER NOT NULL DEFAULT 1,
        deadline TEXT NOT NULL,
        contact_email TEXT,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        source_email TEXT NOT NULL,
        forwarded_by TEXT,
        raw_email_subject TEXT,
        raw_email_body TEXT,
        approved_by TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS jd_applications (
        id TEXT PRIMARY KEY,
        jd_id TEXT NOT NULL,
        mssv TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_email TEXT NOT NULL,
        selected_courses_json TEXT NOT NULL,
        cv_note TEXT,
        status TEXT NOT NULL DEFAULT 'APPLIED',
        applied_at TEXT NOT NULL,
        UNIQUE(jd_id, mssv),
        FOREIGN KEY (jd_id) REFERENCES jd_postings(id) ON DELETE CASCADE,
        FOREIGN KEY (mssv) REFERENCES students(mssv) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS email_forward_logs (
        id TEXT PRIMARY KEY,
        sender_email TEXT NOT NULL,
        original_from TEXT NOT NULL,
        subject TEXT NOT NULL,
        raw_body TEXT NOT NULL,
        extracted_tax_code TEXT,
        extracted_company TEXT,
        extracted_job_title TEXT,
        extracted_stipend TEXT,
        extracted_deadline TEXT,
        jd_id TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS introduction_letters (
        id TEXT PRIMARY KEY,
        letter_no TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        major TEXT NOT NULL,
        courses_json TEXT NOT NULL,
        recipient_company TEXT NOT NULL,
        recipient_representative TEXT NOT NULL,
        recipient_address TEXT NOT NULL,
        position_applied TEXT NOT NULL,
        purpose TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'CHO_DUYET',
        requested_at TEXT NOT NULL,
        approved_at TEXT,
        approved_by TEXT,
        valid_until TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(mssv) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS internship_documents (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        file_format TEXT NOT NULL,
        file_size TEXT NOT NULL,
        download_url TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Tự động nâng cấp cấu trúc bảng users nếu CSDL SQLite cũ chưa có các cột Firebase Auth
    const userCols = this.db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
    const existingColNames = new Set(userCols.map((c) => c.name));
    if (!existingColNames.has('firebase_uid')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN firebase_uid TEXT;`);
    }
    if (!existingColNames.has('auth_provider')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'google.com';`);
    }
    if (!existingColNames.has('is_active')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;`);
    }
    if (!existingColNames.has('last_login_at')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN last_login_at TEXT;`);
    }
    if (!existingColNames.has('login_count')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0;`);
    }
    if (!existingColNames.has('photo_url')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN photo_url TEXT;`);
    }

    // Backfill firebase_uid mặc định cho các tài khoản đã có trong CSDL
    this.db.exec(`
      UPDATE users
      SET firebase_uid = 'fb-tdtu-' || id,
          auth_provider = COALESCE(auth_provider, 'google.com'),
          is_active = COALESCE(is_active, 1)
      WHERE firebase_uid IS NULL OR firebase_uid = '';

      INSERT OR IGNORE INTO users (
        id, email, full_name, role, is_admin, student_id, department, granted_by,
        firebase_uid, auth_provider, is_active, created_at
      )
      SELECT
        'usr-sv-' || mssv,
        LOWER(mssv) || '@student.tdtu.edu.vn',
        name,
        'SV',
        0,
        mssv,
        'Khoa Công Nghệ Thông Tin - TDTU',
        NULL,
        'fb-tdtu-usr-sv-' || mssv,
        'google.com',
        1,
        COALESCE(updated, '2026-10-23T00:00:00.000Z')
      FROM students;
    `);

    // Khởi tạo các biểu mẫu & tài liệu thực tập mặc định (DATA-02)
    const docCount = (this.db.prepare('SELECT COUNT(*) as count FROM internship_documents').get() as any)?.count || 0;
    if (docCount === 0) {
      const insertDoc = this.db.prepare(`
        INSERT INTO internship_documents (id, code, title, category, description, file_format, file_size, download_url, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const defaultDocs = [
        ['doc-01', 'BM-01', 'Đề cương chi tiết môn học Thực tập Doanh nghiệp (KTCN & TSNN)', 'ĐỀ CƯƠNG', 'Quy định mục tiêu, chuẩn đầu ra, khối lượng thời gian tối thiểu 320 giờ tại doanh nghiệp và cách thức đánh giá.', 'PDF', '1.2 MB', '/docs/BM-01_De_Cuong_Chi_Tiet_Thuc_Tap_TDTU.pdf', '15/10/2026'],
        ['doc-02', 'BM-02', 'Mẫu Nhật ký thực tập tuần & Báo cáo tiến độ chuyên môn', 'BIỂU MẪU', 'Mẫu sinh viên ghi chép công việc hàng tuần, có xác nhận chữ ký của Mentor/Người hướng dẫn doanh nghiệp.', 'DOCX', '420 KB', '/docs/BM-02_Mau_Nhat_Ky_Thuc_Tap_Tuan.docx', '18/10/2026'],
        ['doc-03', 'BM-03', 'Phiếu nhận xét & Đánh giá kết quả thực tập của Doanh nghiệp (Có mộc)', 'BIỂU MẪU', 'Mẫu đánh giá thái độ, kỹ năng, chuyên môn và điểm số do Doanh nghiệp chấm gửi về Khoa.', 'DOCX', '350 KB', '/docs/BM-03_Phieu_Danh_Gia_Doanh_Nghiep.docx', '20/10/2026'],
        ['doc-04', 'BM-04', 'Quy chế Thực tập & Hướng dẫn bảo vệ Báo cáo tốt nghiệp', 'QUY ĐỊNH', 'Quy chế đào tạo chính quy Khoa CNTT - ĐH Tôn Đức Thắng về điều kiện công nhận điểm thực tập.', 'PDF', '2.5 MB', '/docs/BM-04_Quy_Che_Thuc_Tap_Khoa_CNTT.pdf', '22/10/2026'],
      ];
      for (const d of defaultDocs) {
        insertDoc.run(...d);
      }
    }
  }

  private parseCsvLine(line: string): string[] {
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  }

  private seedInitialDataIfNeeded(): void {
    const countRow = this.db.prepare('SELECT COUNT(*) as cnt FROM students').get() as { cnt: number };
    if (countRow && countRow.cnt > 0) {
      return;
    }

    const nowIso = new Date().toISOString();

    // 1. Seed Users (Admin toàn quyền + các Giảng viên Khoa CNTT)
    const insertUser = this.db.prepare(`
      INSERT OR IGNORE INTO users (
        id, email, full_name, role, is_admin, student_id, department, granted_by,
        firebase_uid, auth_provider, is_active, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'google.com', 1, ?)
    `);

    const initialLecturers = [
      {
        id: 'usr-gv-01',
        email: 'nguyenvana@tdtu.edu.vn',
        fullName: 'TS. Nguyễn Văn A (Phụ trách TSNN - Admin)',
        role: 'GV',
        isAdmin: 1,
        grantedBy: 'System Root',
      },
      {
        id: 'usr-gv-02',
        email: 'tranvanb@tdtu.edu.vn',
        fullName: 'TS. Trần Văn B (Giảng viên Bộ môn KTPM)',
        role: 'GV',
        isAdmin: 0,
        grantedBy: null,
      },
      {
        id: 'usr-gv-03',
        email: 'lethic@tdtu.edu.vn',
        fullName: 'ThS. Lê Thị C (Giảng viên Bộ môn KHMT)',
        role: 'GV',
        isAdmin: 0,
        grantedBy: null,
      },
      {
        id: 'usr-gv-04',
        email: 'phamvand@tdtu.edu.vn',
        fullName: 'ThS. Phạm Văn D (Giảng viên Bộ môn MMT)',
        role: 'GV',
        isAdmin: 0,
        grantedBy: null,
      },
    ];

    for (const gv of initialLecturers) {
      insertUser.run(
        gv.id,
        gv.email,
        gv.fullName,
        gv.role,
        gv.isAdmin,
        null,
        'Khoa Công Nghệ Thông Tin - TDTU',
        gv.grantedBy,
        `fb-tdtu-${gv.id}`,
        nowIso
      );
    }

    // 2. Seed 91 Real Students from real-students.json
    const dataPath = path.resolve(__dirname, '../data/real-students.json');
    const rawStudents = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as StudentRecord[];

    const insertStudent = this.db.prepare(`
      INSERT INTO students (
        mssv, stt, last_name, first_name, name, dob, pob, gender, class_name, campus, major,
        courses_json, course_str, status, company, tax_code, company_address, industry,
        representative, position, mentor, support_option, preferred_field,
        cert, cert_status, cert_code, cert_score, cert_number, exam_date, commitment_deadline,
        gpa, updated
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    const insertDeclaration = this.db.prepare(`
      INSERT OR IGNORE INTO internship_declarations (
        id, student_id, selected_courses_json, has_company, tax_code, company_name,
        company_address, industry, representative, intern_position, mentor_contact,
        status, support_option, preferred_field, is_confirmed_by_student, confirmed_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const companyMetaMap: Record<
      string,
      { taxCode: string; address: string; industry: string; rep: string }
    > = {
      'FPT Software': {
        taxCode: '0303882213',
        address: 'Tòa nhà F-Town 3, Đường D2, Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh',
        industry: 'Lập trình máy vi tính, Xuất khẩu phần mềm & Chuyển đổi số',
        rep: 'Phạm Minh Tuấn',
      },
      'VNG Corporation': {
        taxCode: '0312345678',
        address: 'Z06 Đường số 13, Khu chế xuất Tân Thuận, Quận 7, TP. Hồ Chí Minh',
        industry: 'Nền tảng số, Trò chơi trực tuyến, Fintech (ZaloPay) & AI Cloud',
        rep: 'Lê Hồng Minh',
      },
      'Viettel Cyber Security': {
        taxCode: '0100109106',
        address: 'Số 285 Cách Mạng Tháng Tám, Phường 12, Quận 10, TP. Hồ Chí Minh',
        industry: 'An ninh mạng, Viễn thông, Trí tuệ nhân tạo & Hạ tầng số',
        rep: 'Tào Đức Thắng',
      },
      'KMS Technology': {
        taxCode: '0309876543',
        address: 'Số 2 Tản Viên, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh',
        industry: 'Phát triển sản phẩm phần mềm, Kiểm thử tự động (Automation QA) & Data',
        rep: 'Trần Trọng Đại',
      },
      'DXC Technology': {
        taxCode: '0304567891',
        address: 'Tòa nhà eTown 5, 364 Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh',
        industry: 'Tư vấn giải pháp CNTT doanh nghiệp & Hệ thống thông tin toàn cầu',
        rep: 'Nguyễn Hữu Minh',
      },
      'MISA JSC': {
        taxCode: '0101243150',
        address: 'Tòa nhà MISA, Công viên Phần mềm Quang Trung, Quận 12, TP. Hồ Chí Minh',
        industry: 'Phần mềm Quản trị Doanh nghiệp, Kế toán số & AI ERP',
        rep: 'Lữ Thành Long',
      },
      NashTech: {
        taxCode: '0302030405',
        address: 'Tòa nhà eTown 2, 364 Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh',
        industry: 'Gia công quy trình phần mềm quốc tế & Giải pháp Cloud/AI',
        rep: 'Nguyễn Hùng Cường',
      },
      'NetNam Corp': {
        taxCode: '0100681042',
        address: 'Số 242 Cống Quỳnh, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
        industry: 'Dịch vụ Hạ tầng Mạng, An toàn thông tin & Managed ISP',
        rep: 'Vũ Thế Bình',
      },
    };

    this.db.exec('BEGIN TRANSACTION');
    try {
      for (const s of rawStudents) {
        const nameParts = s.name.trim().split(/\s+/);
        const firstName = nameParts[nameParts.length - 1] || s.name;
        const lastName = nameParts.slice(0, -1).join(' ') || s.name;

        const hasComp = s.status === 'Có doanh nghiệp';
        const compMeta = hasComp
          ? companyMetaMap[s.company] || {
              taxCode: '0309876543',
              address: 'Khu Công nghệ Phần mềm, TP. Hồ Chí Minh',
              industry: 'Phát triển phần mềm & Dịch vụ CNTT',
              rep: 'Đại diện Pháp luật Doanh nghiệp',
            }
          : null;

        const certStatus =
          s.cert === 'Chưa có'
            ? 'Chưa nộp'
            : s.cert === 'Cam kết nộp sau'
              ? 'Cam kết nộp sau'
              : 'Đã thẩm định';

        let certCode = 'TOEIC';
        if (s.cert.startsWith('IELTS')) certCode = 'IELTS';
        else if (s.cert.startsWith('VSTEP')) certCode = 'VSTEP';
        else if (s.cert.startsWith('Cambridge')) certCode = 'CAMBRIDGE';
        else if (s.cert.startsWith('Aptis')) certCode = 'APTIS';
        else if (s.cert === 'Cam kết nộp sau') certCode = 'COMMITMENT';
        else if (s.cert === 'Chưa có') certCode = '';

        const position = hasComp ? 'Thực tập sinh Kỹ thuật Phần mềm / CNTT' : null;
        const mentor = hasComp ? 'Kỹ sư Hướng dẫn Doanh nghiệp' : null;
        const supportOption =
          s.status === 'Cần Khoa hỗ trợ'
            ? 'faculty'
            : s.status === 'Chưa có doanh nghiệp'
              ? 'self'
              : null;
        const preferredField =
          s.status === 'Cần Khoa hỗ trợ' ? 'Phát triển phần mềm & Hệ thống CNTT' : null;

        insertStudent.run(
          s.mssv,
          s.stt,
          lastName,
          firstName,
          s.name,
          s.dob,
          s.pob,
          s.gender,
          s.class,
          '0 - TP. Hồ Chí Minh',
          s.major,
          JSON.stringify(s.courses),
          s.course_str,
          s.status,
          s.company,
          compMeta?.taxCode ?? null,
          compMeta?.address ?? null,
          compMeta?.industry ?? null,
          compMeta?.rep ?? null,
          position,
          mentor,
          supportOption,
          preferredField,
          s.cert,
          certStatus,
          certCode || null,
          s.cert,
          hasComp ? `CERT-${s.mssv}-2026` : null,
          '2026-08-15',
          s.cert === 'Cam kết nộp sau' ? '2027-01-15' : null,
          s.gpa,
          s.updated
        );

        // Seed corresponding user account for student
        insertUser.run(
          `usr-sv-${s.mssv}`,
          `${s.mssv.toLowerCase()}@student.tdtu.edu.vn`,
          s.name,
          'SV',
          0,
          s.mssv,
          'Khoa Công Nghệ Thông Tin - TDTU',
          null,
          `fb-tdtu-usr-sv-${s.mssv}`,
          nowIso
        );

        // Seed internship declaration record
        insertDeclaration.run(
          `decl-${s.mssv}`,
          s.mssv,
          JSON.stringify(s.courses),
          hasComp ? 1 : 0,
          compMeta?.taxCode ?? null,
          hasComp ? s.company : null,
          compMeta?.address ?? null,
          compMeta?.industry ?? null,
          compMeta?.rep ?? null,
          position,
          mentor,
          s.status,
          supportOption,
          preferredField,
          hasComp ? 1 : 0,
          hasComp ? nowIso : null,
          nowIso
        );
      }

      // 3. Seed 134 Course Enrollments directly from data_sinhvien.csv if present
      const csvPath = path.resolve(__dirname, '../../../../data_sinhvien.csv');
      const insertEnrollment = this.db.prepare(`
        INSERT INTO course_enrollments (
          id, student_id, course_code, course_name, group_code, campus, semester, registered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      if (fs.existsSync(csvPath)) {
        const csvLines = fs
          .readFileSync(csvPath, 'utf-8')
          .split(/\r?\n/)
          .filter((l) => l.trim().length > 0);
        // Skip header line
        for (let i = 1; i < csvLines.length; i++) {
          const cols = this.parseCsvLine(csvLines[i]);
          if (cols.length >= 14) {
            const mssv = cols[0];
            const campus = cols[7] || '0 - TP. Hồ Chí Minh';
            const courseCode = cols[8] || '504074';
            const courseName = cols[9] || 'Kiến tập công nghiệp';
            const groupCode = cols[10] || '01';
            const registeredAt = cols[13] || '2026-07-13';
            insertEnrollment.run(
              `enr-${i}-${mssv}-${courseCode}`,
              mssv,
              courseCode,
              courseName,
              groupCode,
              campus,
              'HK1_2026-2027',
              registeredAt
            );
          }
        }
      } else {
        // Fallback from students.courses
        let enrIdx = 1;
        for (const s of rawStudents) {
          for (const cName of s.courses) {
            const code = cName.includes('Kiến tập')
              ? '504074'
              : cName.includes('Tập sự')
                ? '502090'
                : '504078';
            insertEnrollment.run(
              `enr-${enrIdx++}-${s.mssv}-${code}`,
              s.mssv,
              code,
              cName,
              '01',
              '0 - TP. Hồ Chí Minh',
              'HK1_2026-2027',
              '2026-07-13'
            );
          }
        }
      }

      // 4. Seed Initial Lecturer Announcements (Tier 1)
      const insertAnn = this.db.prepare(`
        INSERT INTO lecturer_announcements (id, title, content, category, is_pinned, author_name, author_email, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const initialAnnouncements = [
        {
          id: 'ann-01',
          title: 'Hạn chót khai báo Mã Số Thuế & Xác nhận Doanh nghiệp tiếp nhận HK1/2026-2027',
          content:
            'Tất cả sinh viên đăng ký môn Kiến tập công nghiệp (KTCN) và Tập sự nghề nghiệp (TSNN) bắt buộc hoàn tất tra cứu MST doanh nghiệp, đọc bảng đối soát thông tin pháp lý và bấm xác nhận nộp lại trước 17h00 ngày 15/11/2026. Sinh viên chưa có công ty cần chọn trạng thái "Cần Khoa hỗ trợ" để Bộ môn phân bổ về doanh nghiệp đối tác thân hữu.',
          category: 'Khẩn',
          isPinned: 1,
          authorName: 'TS. Nguyễn Văn A (Phụ trách TSNN)',
          authorEmail: 'nguyenvana@tdtu.edu.vn',
          createdAt: '23/10/2026 08:30',
        },
        {
          id: 'ann-02',
          title: 'Quy định đối với Sinh viên đăng ký thực tập đồng thời 2 môn (KTCN + TSNN)',
          content:
            'Trong học kỳ này có 43/91 sinh viên đăng ký song song cả 2 môn học. Nếu sinh viên thực tập cả 2 môn tại cùng 1 doanh nghiệp, sinh viên chỉ cần tích chọn đồng thời 2 môn trên Cổng Khai Báo và thực hiện tra cứu MST một lần duy nhất.',
          category: 'Hướng dẫn',
          isPinned: 1,
          authorName: 'Văn phòng Khoa CNTT - TDTU',
          authorEmail: 'it@tdtu.edu.vn',
          createdAt: '21/10/2026 14:15',
        },
        {
          id: 'ann-03',
          title: 'Rà soát Chuẩn Ngoại Ngữ Đầu Ra Xét Tốt Nghiệp ĐH Tôn Đức Thắng',
          content:
            'Sinh viên tham gia TSNN lưu ý cập nhật thông tin chứng chỉ ngoại ngữ theo đúng danh mục chuẩn đầu ra của Nhà trường (TOEIC ≥ 500/600, IELTS ≥ 5.0, TOEFL iBT ≥ 45, Cambridge B2/C1, VSTEP B1/B2, Aptis ESOL...). Trường hợp đang đợi lịch thi, sinh viên phải khai báo Giấy cam kết bổ sung đúng hạn.',
          category: 'Hướng dẫn',
          isPinned: 0,
          authorName: 'TS. Nguyễn Văn A (Phụ trách TSNN)',
          authorEmail: 'nguyenvana@tdtu.edu.vn',
          createdAt: '19/10/2026 09:00',
        },
      ];

      for (const a of initialAnnouncements) {
        insertAnn.run(a.id, a.title, a.content, a.category, a.isPinned, a.authorName, a.authorEmail, a.createdAt);
      }

      // 5. Seed Initial JD Postings (Tier 2)
      const insertJd = this.db.prepare(`
        INSERT INTO jd_postings (
          id, company_name, tax_code, job_title, description, skills_json, stipend,
          quota, accepts_both_courses, deadline, contact_email, location, status,
          source_email, forwarded_by, raw_email_subject, raw_email_body, approved_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const initialJds = [
        {
          id: 'jd-01',
          companyName: 'FPT Software (F-Town 3)',
          taxCode: '0303882213',
          jobTitle: 'Full-Stack Web Developer Intern (React 19 & Node.js/NestJS)',
          description:
            'Tham gia phát triển các phân hệ Microservice và Dashboard doanh nghiệp. Chấp nhận sinh viên đăng ký thực tập đồng thời 2 môn KTCN + TSNN tại dự án.',
          skills: ['React', 'TypeScript', 'NestJS', 'PostgreSQL'],
          stipend: '6.000.000 VNĐ/tháng',
          quota: 15,
          acceptsBothCourses: 1,
          deadline: '15/11/2026',
          contactEmail: 'recruitment@fsoft.com.vn',
          location: 'Khu Công nghệ cao, TP. Thủ Đức, TP.HCM',
          status: 'APPROVED',
          sourceEmail: 'recruitment@fsoft.com.vn (Forwarded by TS. Nguyễn Văn A)',
          forwardedBy: 'nguyenvana@tdtu.edu.vn',
          approvedBy: 'nguyenvana@tdtu.edu.vn',
          createdAt: '22/10/2026',
        },
        {
          id: 'jd-02',
          companyName: 'Viettel Cyber Security (VCS)',
          taxCode: '0100109106',
          jobTitle: 'Security Operations Center (SOC) & Network Engineer Intern',
          description:
            'Thực tập giám sát an toàn thông tin, phân tích mã độc và vận hành hệ thống mạng lõi. Hỗ trợ số liệu thực tế cho báo cáo KTCN & TSNN.',
          skills: ['SOC', 'SIEM', 'Linux', 'Network Security'],
          stipend: '7.500.000 VNĐ/tháng',
          quota: 8,
          acceptsBothCourses: 1,
          deadline: '20/11/2026',
          contactEmail: 'talent@viettel.com.vn',
          location: '285 Cách Mạng Tháng Tám, Quận 10, TP.HCM',
          status: 'APPROVED',
          sourceEmail: 'talent@viettel.com.vn (Forwarded by BCN Khoa CNTT)',
          forwardedBy: 'nguyenvana@tdtu.edu.vn',
          approvedBy: 'nguyenvana@tdtu.edu.vn',
          createdAt: '21/10/2026',
        },
        {
          id: 'jd-03',
          companyName: 'KMS Technology Vietnam',
          taxCode: '0309876543',
          jobTitle: 'AI Engineer & Automation QA Testing Intern',
          description:
            'Xây dựng pipeline kiểm thử tự động (Playwright/Cypress) và tích hợp mô hình AI cho khách hàng Bắc Mỹ.',
          skills: ['Automation QA', 'Playwright', 'Python AI', 'Agile'],
          stipend: '6.500.000 VNĐ/tháng',
          quota: 10,
          acceptsBothCourses: 1,
          deadline: '25/11/2026',
          contactEmail: 'campus@kms-technology.com',
          location: 'Số 2 Tản Viên, Quận Tân Bình, TP.HCM',
          status: 'APPROVED',
          sourceEmail: 'campus@kms-technology.com (Forwarded by TS. Nguyễn Văn A)',
          forwardedBy: 'nguyenvana@tdtu.edu.vn',
          approvedBy: 'nguyenvana@tdtu.edu.vn',
          createdAt: '20/10/2026',
        },
      ];

      for (const jd of initialJds) {
        insertJd.run(
          jd.id,
          jd.companyName,
          jd.taxCode,
          jd.jobTitle,
          jd.description,
          JSON.stringify(jd.skills),
          jd.stipend,
          jd.quota,
          jd.acceptsBothCourses,
          jd.deadline,
          jd.contactEmail,
          jd.location,
          jd.status,
          jd.sourceEmail,
          jd.forwardedBy,
          `Fwd: [Tuyển dụng Thực tập] ${jd.jobTitle} - ${jd.companyName}`,
          jd.description,
          jd.approvedBy,
          jd.createdAt
        );
      }

      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  close(): void {
    try {
      this.db.close();
    } catch {
      // Ignore already closed
    }
  }
}
