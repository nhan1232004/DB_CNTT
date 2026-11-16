// Student Course & Enrollment Normalization Helper
// Chuẩn hóa chính xác học phần KTCN (504044 / IT1) vs TSNN (504045 / IT2) vs Song song cả hai
// Đồng thời quản lý lịch sử các học kỳ sinh viên đã tham gia (enrolledSemesters)

export interface NormalizedCourseInfo {
  ktcnEnrolled: number;
  tsnnEnrolled: number;
  isDualCourse: number;
  courseCode: 'KTCN' | 'TSNN' | 'KTCN & TSNN';
  courseName: string;
  enrolledSemesters: string[];
  enrolledSemestersJson: string;
}

export function normalizeStudentCourse(dto: Record<string, any> = {}, existingSemesters?: string | string[]): NormalizedCourseInfo {
  let ktcn = dto.ktcnEnrolled !== undefined ? (Number(dto.ktcnEnrolled) ? 1 : 0) : 0;
  let tsnn = dto.tsnnEnrolled !== undefined ? (Number(dto.tsnnEnrolled) ? 1 : 0) : 0;

  if (dto.isDualCourse === true || dto.isDualCourse === 1 || dto.isDual === true || dto.isDual === 1) {
    ktcn = 1;
    tsnn = 1;
  }

  const rawTokens: string[] = [];
  if (Array.isArray(dto.courses)) {
    for (const c of dto.courses) {
      if (c !== null && c !== undefined) rawTokens.push(String(c));
    }
  }
  const singleCourseFields = [
    dto.courseCode,
    dto.course_str,
    dto.course,
    dto.courseName,
    dto.subject,
    dto.monHoc,
    dto.hocPhan
  ];
  for (const field of singleCourseFields) {
    if (field !== null && field !== undefined && String(field).trim() !== '') {
      rawTokens.push(String(field));
    }
  }

  if (rawTokens.length > 0) {
    const joined = rawTokens.join(' | ').toUpperCase();
    const hasKtcn =
      joined.includes('KTCN') ||
      joined.includes('504044') ||
      joined.includes('IT1') ||
      joined.includes('KIẾN TẬP') ||
      joined.includes('KIEN TAP');
    const hasTsnn =
      joined.includes('TSNN') ||
      joined.includes('504045') ||
      joined.includes('IT2') ||
      joined.includes('TẬP SỰ') ||
      joined.includes('TAP SU') ||
      joined.includes('DỰ ÁN');
    const hasBothKeyword =
      joined.includes('SONG SONG') ||
      joined.includes('CẢ HAI') ||
      joined.includes('CA HAI') ||
      joined.includes('BOTH') ||
      joined.includes('2 HỌC PHẦN') ||
      joined.includes('2 MÔN');

    if (hasBothKeyword) {
      ktcn = 1;
      tsnn = 1;
    } else if (hasKtcn || hasTsnn) {
      ktcn = hasKtcn ? 1 : 0;
      tsnn = hasTsnn ? 1 : 0;
    }
  }

  // Mặc định nếu hoàn toàn không có thông tin môn học thì gán KTCN (trừ khi đã có TSNN)
  if (!ktcn && !tsnn) {
    ktcn = 1;
  }

  const isDual = ktcn === 1 && tsnn === 1 ? 1 : 0;
  const courseCode: 'KTCN' | 'TSNN' | 'KTCN & TSNN' = isDual
    ? 'KTCN & TSNN'
    : ktcn === 1
      ? 'KTCN'
      : 'TSNN';
  const courseName = isDual
    ? 'Kiến tập & Tập sự nghề nghiệp (Song song)'
    : ktcn === 1
      ? 'Kiến tập công nghiệp'
      : 'Tập sự nghề nghiệp';

  // Chuẩn hóa lịch sử các học kỳ sinh viên đã tham gia (enrolledSemesters)
  const semSet = new Set<string>();
  const addSem = (val: unknown) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach(addSem);
      return;
    }
    const str = String(val).trim();
    if (!str) return;
    if (str.startsWith('[')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          parsed.forEach(s => {
            if (s && String(s).trim()) semSet.add(String(s).trim());
          });
          return;
        }
      } catch {}
    }
    semSet.add(str);
  };

  addSem(existingSemesters);
  addSem(dto.enrolledSemesters);
  addSem(dto.semester);
  addSem(dto.semesterId);

  if (semSet.size === 0) {
    semSet.add('hk1_2026_2027');
  }

  const enrolledSemesters = Array.from(semSet);

  return {
    ktcnEnrolled: ktcn,
    tsnnEnrolled: tsnn,
    isDualCourse: isDual,
    courseCode,
    courseName,
    enrolledSemesters,
    enrolledSemestersJson: JSON.stringify(enrolledSemesters)
  };
}

export function isStudentOwnerOrStaff(user: any, targetStudentId: string): boolean {
  if (!user) return false;
  if (user.isAdmin || user.role === 'lecturer' || user.role === 'admin') return true;
  if (user.role === 'student') {
    const ownId = String(user.studentId || '').trim().toUpperCase();
    const targetId = String(targetStudentId || '').trim().toUpperCase();
    if (!ownId || !targetId) return false;
    return ownId === targetId;
  }
  return false;
}
