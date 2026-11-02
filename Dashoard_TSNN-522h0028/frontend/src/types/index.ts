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
