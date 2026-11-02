// ============================================================================
// API CLIENT SERVICE (apps/web/src/services/api.client.ts)
// Kết nối trực tiếp tới Backend Node API (/api/*) kèm JWT Authorization Header
// ============================================================================

import type {
  UserProfile,
  StudentRecord,
  InternshipStatus,
  CompanyTaxInfo,
  InternshipDeclarationPayload,
  TdtuLanguageStandard,
  CertificateSubmissionPayload,
  LecturerAnnouncement,
  JdPosting,
  InboundEmailPayload,
  JdApplicationRecord,
  ChartWidgetMeta,
  ChartResponse,
  IntroductionLetterPayload,
  IntroductionLetterRecord,
  InternshipDocumentRecord,
} from '../../../../packages/shared-types/src/index';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

let currentJwtToken: string | null = null;

function getHeaders(hasJsonBody = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (currentJwtToken) {
    headers['Authorization'] = `Bearer ${currentJwtToken}`;
  }
  return headers;
}

export const apiClient = {
  setToken(token: string | null) {
    currentJwtToken = token;
  },

  getToken(): string | null {
    return currentJwtToken;
  },

  async loginWithEmail(email: string, customName?: string, expectedRole?: 'GV' | 'SV') {
    const res = await fetch(`${API_BASE}/api/auth/firebase`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ email, studentName: customName, expectedRole, providerId: 'google.com' }),
    });
    const data = (await res.json()) as {
      success: boolean;
      user?: UserProfile;
      token?: string;
      error?: string;
    };
    if (data.success && data.token) {
      currentJwtToken = data.token;
    }
    return data;
  },

  async getFirebaseUsers(params: { search?: string; role?: string; status?: string } = {}) {
    const url = new URL(`${API_BASE || window.location.origin}/api/auth/firebase/users`);
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString(), {
      headers: getHeaders(false),
    });
    return res.json();
  },

  async upsertFirebaseUser(payload: {
    email: string;
    fullName?: string;
    isAdmin?: boolean;
    isActive?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/api/auth/firebase/users`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async setFirebaseAccountStatus(payload: { targetEmail: string; isActive: boolean }) {
    const res = await fetch(`${API_BASE}/api/auth/firebase/users/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  },

  async getLecturers() {
    const res = await fetch(`${API_BASE}/api/auth/lecturers`, {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{ success: boolean; lecturers: UserProfile[]; error?: string }>;
  },

  async grantOrRevokeAdmin(payload: { targetEmail: string; fullName?: string; isAdmin: boolean }) {
    const res = await fetch(`${API_BASE}/api/auth/admin/grant`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json() as Promise<{
      success: boolean;
      message?: string;
      targetUser?: UserProfile;
      lecturers?: UserProfile[];
      error?: string;
    }>;
  },

  async transferAdminOwnership(payload: { targetEmail: string; fullName?: string }) {
    const res = await fetch(`${API_BASE}/api/auth/admin/transfer`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      success: boolean;
      message?: string;
      previousAdmin?: UserProfile;
      newAdmin?: UserProfile;
      newActorToken?: string;
      lecturers?: UserProfile[];
      error?: string;
    };
    if (data.success && data.newActorToken) {
      currentJwtToken = data.newActorToken;
    }
    return data;
  },

  async getSummaryMetrics() {
    const res = await fetch(`${API_BASE}/api/students/summary`, {
      headers: getHeaders(false),
    });
    return res.json();
  },

  async getStudents(params: { search?: string; course?: string; major?: string; status?: string } = {}) {
    const url = new URL(`${API_BASE || window.location.origin}/api/students`);
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString(), {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{
      success: boolean;
      totalStudents: number;
      totalEnrollments: number;
      bothCoursesCount: number;
      filteredCount: number;
      items: StudentRecord[];
    }>;
  },

  async interveneStudentStatus(
    mssv: string,
    payload: {
      status: InternshipStatus;
      company?: string;
      taxCode?: string;
      position?: string;
      mentor?: string;
    }
  ) {
    const res = await fetch(`${API_BASE}/api/students/${encodeURIComponent(mssv)}/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json() as Promise<{
      success: boolean;
      message?: string;
      student?: StudentRecord;
      error?: string;
    }>;
  },

  async importStudentsBatch(
    students: Array<{
      mssv: string;
      name: string;
      class?: string;
      major?: string;
      courses?: string[];
      status?: InternshipStatus;
      company?: string;
      cert?: string;
    }>
  ) {
    const res = await fetch(`${API_BASE}/api/students/import`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ students }),
    });
    return res.json() as Promise<{
      success: boolean;
      message?: string;
      importedCount?: number;
      updatedCount?: number;
      totalStudents?: number;
      error?: string;
    }>;
  },

  async lookupCompanyByMst(mst: string) {
    const res = await fetch(`${API_BASE}/api/internship/company-lookup/${encodeURIComponent(mst)}`, {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{ success: boolean; data: CompanyTaxInfo; error?: string }>;
  },

  async submitInternshipDeclaration(payload: InternshipDeclarationPayload) {
    const res = await fetch(`${API_BASE}/api/internship/confirm-declaration`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json() as Promise<{
      success: boolean;
      message: string;
      updatedStudent: StudentRecord | null;
      error?: string;
    }>;
  },

  async getLanguageStandards() {
    const res = await fetch(`${API_BASE}/api/certificates/standards`, {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{ success: boolean; standards: TdtuLanguageStandard[] }>;
  },

  async submitCertificate(payload: CertificateSubmissionPayload) {
    const res = await fetch(`${API_BASE}/api/certificates/submit`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json() as Promise<{
      success: boolean;
      message: string;
      updatedStudent: StudentRecord | null;
      error?: string;
    }>;
  },

  async getBulletinBoard() {
    const res = await fetch(`${API_BASE}/api/bulletin`, {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{
      success: boolean;
      tier1_lecturerAnnouncements: LecturerAnnouncement[];
      tier2_jdPostings: { approved: JdPosting[]; pending: JdPosting[] };
      applications?: JdApplicationRecord[];
      sampleEmails?: Array<{ subject: string; from: string; forwardedBy: string; rawEmail: string }>;
    }>;
  },

  async createLecturerAnnouncement(payload: {
    title: string;
    content: string;
    category: 'Khẩn' | 'Hướng dẫn' | 'Sự kiện';
    isPinned?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/api/bulletin/announcements`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async togglePinAnnouncement(id: string) {
    const res = await fetch(`${API_BASE}/api/bulletin/announcements/${encodeURIComponent(id)}/pin`, {
      method: 'PATCH',
      headers: getHeaders(false),
    });
    return res.json();
  },

  async deleteAnnouncement(id: string) {
    const res = await fetch(`${API_BASE}/api/bulletin/announcements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders(false),
    });
    return res.json();
  },

  async previewEmailForward(payload: InboundEmailPayload) {
    const res = await fetch(`${API_BASE}/api/bulletin/jd/parse-preview`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async simulateEmailForwardJd(payload: InboundEmailPayload = {}) {
    const res = await fetch(`${API_BASE}/api/bulletin/jd/webhook-forward`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async approvePendingJd(id: string) {
    const res = await fetch(`${API_BASE}/api/bulletin/jd/${encodeURIComponent(id)}/approve`, {
      method: 'PATCH',
      headers: getHeaders(false),
    });
    return res.json();
  },

  async rejectPendingJd(id: string) {
    const res = await fetch(`${API_BASE}/api/bulletin/jd/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders(false),
    });
    return res.json();
  },

  async applyForJd(jdId: string, payload: { mssv: string; selectedCourses?: string[]; cvNote?: string }) {
    const res = await fetch(`${API_BASE}/api/bulletin/jd/${encodeURIComponent(jdId)}/apply`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getDashboardWidgets() {
    const res = await fetch(`${API_BASE}/api/dashboard/widgets`, {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{ success: boolean; widgets: ChartWidgetMeta[] }>;
  },

  async getChartData(chartId: string, schema?: string) {
    const url = new URL(`${API_BASE || window.location.origin}/api/dashboard/charts/${chartId}`);
    if (schema) url.searchParams.set('schema', schema);
    const res = await fetch(url.toString(), {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{ success: boolean; chart: ChartResponse }>;
  },

  async getIntroductionLetters(studentId?: string) {
    const url = new URL(`${API_BASE || window.location.origin}/api/internship/letters`);
    if (studentId) url.searchParams.set('studentId', studentId);
    const res = await fetch(url.toString(), {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{ success: boolean; letters: IntroductionLetterRecord[] }>;
  },

  async requestIntroductionLetter(payload: IntroductionLetterPayload) {
    const res = await fetch(`${API_BASE}/api/internship/letters/request`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return res.json() as Promise<{ success: boolean; message: string; letter: IntroductionLetterRecord }>;
  },

  async approveIntroductionLetter(id: string, approverName?: string) {
    const res = await fetch(`${API_BASE}/api/internship/letters/${encodeURIComponent(id)}/approve`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ approverName }),
    });
    return res.json() as Promise<{ success: boolean; message: string; letter: IntroductionLetterRecord }>;
  },

  getPrintableLetterUrl(id: string) {
    return `${API_BASE}/api/internship/letters/${encodeURIComponent(id)}/print`;
  },

  async getInternshipDocuments() {
    const res = await fetch(`${API_BASE}/api/documents`, {
      headers: getHeaders(false),
    });
    return res.json() as Promise<{ success: boolean; documents: InternshipDocumentRecord[] }>;
  },
};
