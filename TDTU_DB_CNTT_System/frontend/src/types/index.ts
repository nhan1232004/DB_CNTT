// ============================================================================
// SHARED TYPES & CONTRACTS (FE <-> BE)
// Hệ thống Quản lý Thực tập & Dashboard TSNN (DB_CNTT) - Khoa CNTT TDTU
// ============================================================================

export type UserRole = 'GV' | 'SV';
export type UserSubRole = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isAdmin?: boolean;
  subRole?: UserSubRole;
  studentId?: string;
  department: string;
  permissions?: string[];
  grantedBy?: string;
  firebaseUid?: string;
  authProvider?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  loginCount?: number;
  photoUrl?: string;
  createdAt?: string;
}

export interface FirebaseAuthPayload {
  email?: string;
  idToken?: string;
  firebaseUid?: string;
  displayName?: string;
  fullName?: string;
  studentName?: string;
  photoUrl?: string;
  providerId?: string;
  expectedRole?: UserRole;
}

export interface FirebaseUsersSummary {
  totalUsers: number;
  totalLecturers: number;
  totalAdmins: number;
  totalStudents: number;
  activeUsers: number;
  lockedUsers: number;
  firebaseLinkedUsers: number;
}


export type InternshipStatus =
  | 'Có doanh nghiệp'
  | 'Đang chờ PV/KQPV'
  | 'Chưa có doanh nghiệp'
  | 'Cần Khoa hỗ trợ';

export type CourseName =
  | 'Kiến tập công nghiệp'
  | 'Tập sự nghề nghiệp'
  | 'Dự án Công nghệ thông tin 1';

export interface CourseEnrollmentRecord {
  id: string;
  studentId: string;
  courseCode: string;
  courseName: string;
  groupCode: string;
  campus: string;
  semester: string;
  registeredAt: string;
}

export interface StudentRecord {
  stt: number;
  mssv: string;
  name: string;
  dob: string;
  pob: string;
  gender: string;
  class: string;
  major: 'Kỹ thuật phần mềm' | 'Khoa học máy tính' | 'Mạng máy tính và truyền thông dữ liệu' | string;
  courses: string[];
  course_str: string;
  status: InternshipStatus;
  company: string;
  taxCode?: string;
  companyAddress?: string;
  industry?: string;
  representative?: string;
  position?: string;
  mentor?: string;
  supportOption?: 'self' | 'faculty';
  preferredField?: string;
  cert: string;
  certStatus?: 'Đã thẩm định' | 'Chờ duyệt' | 'Cam kết nộp sau' | 'Chưa nộp';
  certCode?: string;
  certScore?: string;
  certNumber?: string;
  examDate?: string;
  commitmentDeadline?: string;
  proofFileName?: string;
  gpa: number;
  updated: string;
  enrollments?: CourseEnrollmentRecord[];
}

// Quy trình Tra cứu Mã Số Thuế (MST) qua Adapter
export interface CompanyTaxInfo {
  taxCode: string;
  companyName: string;
  shortName: string;
  industry: string;
  address: string;
  representative: string;
  taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)' | 'Tạm ngừng kinh doanh';
  isPartner: boolean;
  suggestedPosition: string;
}

export interface InternshipDeclarationPayload {
  mssv: string;
  selectedCourses: string[]; // Cho phép chọn 1 môn hoặc 2 môn cùng lúc (KTCN + TSNN / DA CNTT 1)
  hasCompany: boolean;
  taxCode?: string;
  companyName?: string;
  companyAddress?: string;
  industry?: string;
  representative?: string;
  internPosition?: string;
  mentorContact?: string;
  isConfirmedByStudent: boolean;
  supportOption?: 'self' | 'faculty';
  preferredField?: string;
}

// Danh mục Chứng chỉ Ngoại ngữ Chuẩn Đầu Ra Xét Tốt Nghiệp TDTU
export interface TdtuLanguageStandard {
  code: string;
  name: string;
  category: 'Tiếng Anh Quốc Tế' | 'Khung NLNN Việt Nam' | 'Ngoại Ngữ 2' | 'Cam Kết';
  minStandard: string;
  minHighQuality: string;
  description: string;
}

export interface CertificateSubmissionPayload {
  mssv: string;
  certCode: string;
  certName: string;
  scoreOrLevel: string;
  certNumber: string;
  examDate: string;
  commitmentDeadline?: string;
  proofFileName?: string;
}

// Bảng tin 2 tầng: Tầng trên (Thông báo Giảng viên) & Tầng dưới (Tin tuyển dụng JD)
export interface LecturerAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'Khẩn' | 'Hướng dẫn' | 'Sự kiện';
  isPinned: boolean;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

export interface JdPosting {
  id: string;
  companyName: string;
  taxCode: string;
  jobTitle: string;
  description: string;
  skills: string[];
  stipend: string;
  quota: number;
  acceptsBothCourses: boolean;
  deadline: string;
  contactEmail?: string;
  location?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  sourceEmail: string;
  forwardedBy?: string;
  rawEmailSubject?: string;
  rawEmailBody?: string;
  approvedBy?: string;
  applicationCount?: number;
  createdAt: string;
}

export interface InboundEmailPayload {
  rawEmail?: string;
  from?: string;
  forwardedBy?: string;
  subject?: string;
  body?: string;
  companyName?: string;
  taxCode?: string;
  jobTitle?: string;
  description?: string;
  skills?: string[];
  stipend?: string;
  quota?: number;
  acceptsBothCourses?: boolean;
  deadline?: string;
  contactEmail?: string;
  location?: string;
}

export interface JdApplicationPayload {
  jdId: string;
  mssv: string;
  selectedCourses?: string[];
  cvNote?: string;
}

export interface JdApplicationRecord {
  id: string;
  jdId: string;
  mssv: string;
  studentName: string;
  studentEmail: string;
  selectedCourses: string[];
  cvNote: string;
  status: 'APPLIED' | 'SHORTLISTED' | 'ACCEPTED';
  appliedAt: string;
}

// Reporting Microservice Contracts (Adapter + Chart Router)
export interface ChartWidgetMeta {
  id: string;
  title: string;
  subtitle: string;
  type: 'pie' | 'donut' | 'bar' | 'stacked-bar';
  endpoint: string;
}

export interface ChartResponse {
  chartId: string;
  title: string;
  subtitle: string;
  type: 'pie' | 'donut' | 'bar' | 'stacked-bar';
  data: {
    labels: string[];
    values: number[];
    colors?: string[];
    extraSeries?: { label: string; values: number[]; color: string }[];
  };
}

// INT-02 & INT-03: Giấy giới thiệu thực tập (GGT)
export type LetterStatus = 'CHO_DUYET' | 'DA_DUYET' | 'DA_CAP';

export interface IntroductionLetterPayload {
  mssv: string;
  recipientCompany: string;
  recipientRepresentative?: string;
  recipientAddress?: string;
  positionApplied?: string;
  courses: string[];
  purpose?: string;
}

export interface IntroductionLetterRecord {
  id: string;
  letterNo: string;
  studentId: string;
  studentName: string;
  className: string;
  major: string;
  courses: string[];
  recipientCompany: string;
  recipientRepresentative: string;
  recipientAddress: string;
  positionApplied: string;
  purpose: string;
  status: LetterStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  validUntil: string;
}

// DATA-02: Biểu mẫu, quy định, tài liệu hướng dẫn thực tập
export interface InternshipDocumentRecord {
  id: string;
  code: string;
  title: string;
  category: 'BIỂU MẪU' | 'QUY ĐỊNH' | 'HƯỚNG DẪN' | 'ĐỀ CƯƠNG';
  description: string;
  fileFormat: 'DOCX' | 'PDF' | 'XLSX';
  fileSize: string;
  downloadUrl: string;
  updatedAt: string;
}



// ============================================================================
// FRONTEND SPECIFIC COMPONENT CONTRACTS
// ============================================================================

export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'lecturer';
  isAdmin: boolean;
  studentId?: string;
  department?: string;
  avatarUrl?: string;
}

export interface Student {
  studentId: string;
  fullName: string;
  email: string;
  className: string;
  major: string;
  ktcnEnrolled: number;
  tsnnEnrolled: number;
  isDualCourse: number;
  isEligible: number;
  status: 'has_company' | 'seeking';
  createdAt: string;
}

export interface Declaration {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  companyName: string;
  taxCode: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  position: string;
  isDualCourse: number;
  selectedCourses: string;
  noCompanyOption?: 'faculty' | 'self';
  foreignLanguage?: string;
  foreignScore?: string;
  foreignStatus: string;
  isConfirmed: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulletinPost {
  id: string;
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
  status: 'published' | 'draft' | 'archived';
  sourceEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTemplate {
  id: string;
  code: string;
  name: string;
  category: 'bieu_mau' | 'quy_dinh';
  fileFormat: string;
  size: string;
  description: string;
  downloadUrl: string;
  isMandatory: boolean;
}

export interface WidgetMetadata {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultSize: string;
  supportedChartTypes: string[];
}

export interface StandardChartPayload {
  widgetId: string;
  title: string;
  chartType: string;
  categories: string[];
  series: { name: string; type: string; data: number[]; color?: string }[];
  summaryStats?: Record<string, string | number>;
  generatedAt: string;
}
