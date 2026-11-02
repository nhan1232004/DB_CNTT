import React, { useEffect, useState } from 'react';
import type {
  UserRole,
  UserProfile,
  StudentRecord,
  TdtuLanguageStandard,
  LecturerAnnouncement,
  JdPosting,
  ChartResponse,
} from '../../../../packages/shared-types/src/index';
import { apiClient } from './services/api.client';
import { AppHeader, type ActiveTab } from './components/layout/AppHeader';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { StudentTrackingTable } from './features/students/StudentTrackingTable';
import { InternshipDeclarationForm } from './features/internship/InternshipDeclarationForm';
import { TdtuLanguageStandards } from './features/certificates/TdtuLanguageStandards';
import { TwoTierBulletinBoard } from './features/bulletin/TwoTierBulletinBoard';
import { IntroductionLetters } from './features/letters/IntroductionLetters';
import { InternshipDocuments } from './features/documents/InternshipDocuments';
import { StudentEligibilityBanner } from './features/students/StudentEligibilityBanner';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'usr-gv-01',
    email: 'nguyenvana@tdtu.edu.vn',
    fullName: 'TS. Nguyễn Văn A (Phụ trách TSNN - Admin)',
    role: 'GV',
    isAdmin: true,
    subRole: 'ADMIN',
    department: 'Khoa Công Nghệ Thông Tin - TDTU',
  });
  const [role, setRole] = useState<UserRole>('GV');
  const [activeTab, setActiveTab] = useState<ActiveTab>('tab-overview');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [metrics, setMetrics] = useState({
    totalStudents: 91,
    totalEnrollments: 134,
    bothCoursesCount: 43,
    placedCount: 52,
    interviewCount: 13,
    selfFindingCount: 13,
    needSupportCount: 13,
  });
  const [standards, setStandards] = useState<TdtuLanguageStandard[]>([]);
  const [announcements, setAnnouncements] = useState<LecturerAnnouncement[]>([]);
  const [approvedJds, setApprovedJds] = useState<JdPosting[]>([]);
  const [pendingJds, setPendingJds] = useState<JdPosting[]>([]);
  const [sampleEmails, setSampleEmails] = useState<any[]>([]);
  const [charts, setCharts] = useState<Record<string, ChartResponse>>({});

  // Modals: Đăng nhập SSO TDTU, Quản lý TK Firebase & Quản lý phân quyền Admin
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPortal, setLoginPortal] = useState<UserRole>('GV');
  const [loginEmailInput, setLoginEmailInput] = useState('nguyenvana@tdtu.edu.vn');
  const [loginError, setLoginError] = useState('');

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [lecturers, setLecturers] = useState<UserProfile[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [firebaseUsers, setFirebaseUsers] = useState<UserProfile[]>([]);
  const [firebaseSummary, setFirebaseSummary] = useState({
    totalUsers: 95,
    totalLecturers: 4,
    totalAdmins: 1,
    totalStudents: 91,
    activeUsers: 95,
    lockedUsers: 0,
    firebaseLinkedUsers: 95,
  });
  const [fbSearch, setFbSearch] = useState('');
  const [fbRoleFilter, setFbRoleFilter] = useState('');
  const [fbStatusFilter, setFbStatusFilter] = useState('');
  const [fbNewEmail, setFbNewEmail] = useState('');
  const [fbNewName, setFbNewName] = useState('');
  const [fbNewAdmin, setFbNewAdmin] = useState(false);

  const loadAllData = async () => {
    const [summaryRes, stuRes, stdRes, bulRes, widgetsRes] = await Promise.all([
      apiClient.getSummaryMetrics(),
      apiClient.getStudents(),
      apiClient.getLanguageStandards(),
      apiClient.getBulletinBoard(),
      apiClient.getDashboardWidgets(),
    ]);

    if (summaryRes.success) setMetrics(summaryRes.metrics);
    if (stuRes.success) setStudents(stuRes.items);
    if (stdRes.success) setStandards(stdRes.standards);
    if (bulRes.success) {
      setAnnouncements(bulRes.tier1_lecturerAnnouncements);
      setApprovedJds(bulRes.tier2_jdPostings.approved);
      setPendingJds(bulRes.tier2_jdPostings.pending);
      if (bulRes.sampleEmails) setSampleEmails(bulRes.sampleEmails);
    }

    if (widgetsRes.success) {
      const chartMap: Record<string, ChartResponse> = {};
      await Promise.all(
        widgetsRes.widgets.map(async (w) => {
          const cRes = await apiClient.getChartData(w.id);
          if (cRes.success) chartMap[w.id] = cRes.chart;
        })
      );
      setCharts(chartMap);
    }
  };

  useEffect(() => {
    // Khởi tạo phiên đăng nhập mặc định Admin Giảng viên
    apiClient.loginWithEmail('nguyenvana@tdtu.edu.vn').then((res) => {
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setRole(res.user.role);
      }
      loadAllData();
    });
  }, []);

  const handleQuickSwitchRole = async (targetRole: UserRole) => {
    const targetEmail =
      targetRole === 'GV' ? 'nguyenvana@tdtu.edu.vn' : '51900839@student.tdtu.edu.vn';
    const res = await apiClient.loginWithEmail(targetEmail, undefined, targetRole);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setRole(res.user.role);
      setLoginPortal(res.user.role);
      setLoginEmailInput(res.user.email);
    }
  };

  const handleSelectLoginPortal = (portal: UserRole) => {
    setLoginPortal(portal);
    setLoginError('');
    if (portal === 'GV' && loginEmailInput.endsWith('@student.tdtu.edu.vn')) {
      setLoginEmailInput('nguyenvana@tdtu.edu.vn');
    } else if (
      portal === 'SV' &&
      loginEmailInput.endsWith('@tdtu.edu.vn') &&
      !loginEmailInput.endsWith('@student.tdtu.edu.vn')
    ) {
      setLoginEmailInput('51900839@student.tdtu.edu.vn');
    }
  };

  const executeFirebaseLogin = async (emailToUse: string, portalToUse: UserRole) => {
    setLoginError('');
    const res = await apiClient.loginWithEmail(emailToUse, undefined, portalToUse);
    if (!res.success || !res.user) {
      setLoginError(res.error || 'Đăng nhập thất bại');
      return;
    }
    setCurrentUser(res.user);
    setRole(res.user.role);
    setLoginPortal(res.user.role);
    setShowLoginModal(false);
    loadAllData();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeFirebaseLogin(loginEmailInput, loginPortal);
  };

  const loadFirebaseUsersData = async (
    search = fbSearch,
    roleFilter = fbRoleFilter,
    statusFilter = fbStatusFilter
  ) => {
    const res = await apiClient.getFirebaseUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    });
    if (res.success) {
      setFirebaseUsers(res.items || []);
      if (res.summary) setFirebaseSummary(res.summary);
    }
  };

  const handleOpenFirebaseModal = async () => {
    await loadFirebaseUsersData();
    setShowFirebaseModal(true);
  };

  const handleCreateFirebaseUser = async () => {
    if (!fbNewEmail.trim()) return;
    const res = await apiClient.upsertFirebaseUser({
      email: fbNewEmail.trim(),
      fullName: fbNewName.trim() || undefined,
      isAdmin: fbNewAdmin,
      isActive: true,
    });
    if (res.success) {
      setFbNewEmail('');
      setFbNewName('');
      setFbNewAdmin(false);
      await loadFirebaseUsersData();
      alert(res.message);
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleToggleFirebaseLock = async (targetEmail: string, isActive: boolean) => {
    const res = await apiClient.setFirebaseAccountStatus({ targetEmail, isActive });
    if (res.success) {
      await loadFirebaseUsersData();
      alert(res.message);
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleOpenAdminModal = async () => {
    const res = await apiClient.getLecturers();
    if (res.success) setLecturers(res.lecturers);
    setShowAdminModal(true);
  };

  const handleGrantOrRevokeAdmin = async (email: string, isAdmin: boolean, fullName?: string) => {
    const res = await apiClient.grantOrRevokeAdmin({ targetEmail: email, isAdmin, fullName });
    if (res.success && res.lecturers) {
      setLecturers(res.lecturers);
      alert(res.message);
      setNewAdminEmail('');
      setNewAdminName('');
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleTransferAdmin = async (targetEmail: string) => {
    const res = await apiClient.transferAdminOwnership({ targetEmail });
    if (res.success && res.previousAdmin) {
      setCurrentUser(res.previousAdmin);
      if (res.lecturers) setLecturers(res.lecturers);
      alert(res.message);
      setShowAdminModal(false);
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleFilterStudents = async (filter: {
    search?: string;
    course?: string;
    major?: string;
    status?: string;
  }) => {
    const res = await apiClient.getStudents(filter);
    if (res.success) setStudents(res.items);
  };

  const activeMssv = currentUser.studentId || '51900839';
  const currentStudent =
    students.find((s) => s.mssv.toUpperCase() === activeMssv.toUpperCase()) ||
    students[0] || {
      stt: 1,
      mssv: '51900839',
      name: 'Võ Duy Trí',
      dob: '2001-11-18',
      pob: 'Long An',
      gender: 'Nam',
      class: '19050402',
      major: 'Mạng máy tính và truyền thông dữ liệu',
      courses: ['Dự án Công nghệ thông tin 1', 'Kiến tập công nghiệp'],
      course_str: 'DA CNTT 1 + KTCN',
      status: 'Có doanh nghiệp',
      company: 'FPT Software',
      cert: 'TOEIC 650 (B2)',
      gpa: 2.7,
      updated: '23/10/2026',
    };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <AppHeader
        currentUser={currentUser}
        role={role}
        onSwitchRole={handleQuickSwitchRole}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onOpenAdminModal={handleOpenAdminModal}
        onOpenFirebaseModal={handleOpenFirebaseModal}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalStudents={metrics.totalStudents}
        totalEnrollments={metrics.totalEnrollments}
        bothCoursesCount={metrics.bothCoursesCount}
        pendingJdCount={pendingJds.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StudentEligibilityBanner
          currentUser={currentUser}
          students={students}
          onNavigateToLetters={() => setActiveTab('tab-letters')}
          onNavigateToDocuments={() => setActiveTab('tab-documents')}
        />
        {activeTab === 'tab-overview' && <DashboardOverview metrics={metrics} charts={charts} />}
        {activeTab === 'tab-students' && (
          <StudentTrackingTable
            role={role}
            students={students}
            onFilterChange={handleFilterStudents}
            onRefresh={loadAllData}
          />
        )}
        {activeTab === 'tab-internship' && (
          <InternshipDeclarationForm
            currentStudent={currentStudent}
            onDeclarationSuccess={(_, msg) => {
              alert(msg);
              loadAllData();
            }}
          />
        )}
        {activeTab === 'tab-cert' && (
          <TdtuLanguageStandards
            standards={standards}
            currentStudent={currentStudent}
            onCertUpdated={(_, msg) => {
              alert(msg);
              loadAllData();
            }}
          />
        )}
        {activeTab === 'tab-bulletin' && (
          <TwoTierBulletinBoard
            role={role}
            currentStudent={currentStudent}
            announcements={announcements}
            approvedJds={approvedJds}
            pendingJds={pendingJds}
            sampleEmails={sampleEmails}
            onRefresh={loadAllData}
          />
        )}
        {activeTab === 'tab-letters' && (
          <IntroductionLetters
            currentUser={currentUser}
            currentStudent={currentStudent}
            onLetterCreated={loadAllData}
          />
        )}
        {activeTab === 'tab-documents' && <InternshipDocuments />}
      </main>

      {/* ================= TRANG ĐĂNG NHẬP GMAIL TDTU & FIREBASE AUTHENTICATION ================= */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 text-xs">
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white p-7 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center font-extrabold text-base">
                    TDTU
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-sky-300 font-bold">
                      Đại học Tôn Đức Thắng
                    </div>
                    <div className="text-sm font-bold">Khoa Công Nghệ Thông Tin</div>
                  </div>
                </div>
                <h3 className="text-xl font-extrabold leading-snug">
                  Cổng Đăng Nhập Thực Tập &amp; Quản Lý Tài Khoản Firebase
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Chỉ chấp nhận tài khoản Gmail thuộc tên miền chính thức của Trường ĐH Tôn Đức Thắng:
                  <strong> @tdtu.edu.vn</strong> (Giảng viên/Admin) và <strong>@student.tdtu.edu.vn</strong> (Sinh viên).
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-[11px] text-sky-300 font-mono">
                Firebase Auth · GoogleAuthProvider
              </div>
            </div>

            <div className="lg:col-span-7 p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                    Firebase Authentication &amp; TDTU Domain Guard
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Đăng Nhập Bằng Gmail Trường ĐH Tôn Đức Thắng
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Bộ chọn cổng đăng nhập GV vs SV */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectLoginPortal('GV')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    loginPortal === 'GV'
                      ? 'border-2 border-blue-600 bg-blue-50/70 font-bold text-blue-950'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>👨‍🏫 Cổng Giảng Viên / Admin</div>
                  <div className="text-[10px] font-mono text-blue-700 mt-0.5">...@tdtu.edu.vn</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectLoginPortal('SV')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    loginPortal === 'SV'
                      ? 'border-2 border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>🎓 Cổng Sinh Viên Thực Tập</div>
                  <div className="text-[10px] font-mono text-emerald-700 mt-0.5">...@student.tdtu.edu.vn</div>
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Gmail TDTU ({loginPortal === 'GV' ? '@tdtu.edu.vn' : '@student.tdtu.edu.vn'})
                  </label>
                  <input
                    type="email"
                    value={loginEmailInput}
                    onChange={(e) => setLoginEmailInput(e.target.value)}
                    placeholder="VD: nguyenvana@tdtu.edu.vn hoặc 51900839@student.tdtu.edu.vn"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                  />
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                    {loginError}
                  </div>
                )}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-700">
                    Chọn nhanh tài khoản Firebase TDTU để kiểm thử phân quyền:
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginPortal('GV');
                        setLoginEmailInput('nguyenvana@tdtu.edu.vn');
                        executeFirebaseLogin('nguyenvana@tdtu.edu.vn', 'GV');
                      }}
                      className="text-left px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 font-semibold"
                    >
                      👑 Admin Toàn Quyền: nguyenvana@tdtu.edu.vn (TS. Nguyễn Văn A)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginPortal('GV');
                        setLoginEmailInput('tranvanb@tdtu.edu.vn');
                        executeFirebaseLogin('tranvanb@tdtu.edu.vn', 'GV');
                      }}
                      className="text-left px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold"
                    >
                      👨‍🏫 Giảng viên: tranvanb@tdtu.edu.vn (TS. Trần Văn B)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginPortal('SV');
                        setLoginEmailInput('51900839@student.tdtu.edu.vn');
                        executeFirebaseLogin('51900839@student.tdtu.edu.vn', 'SV');
                      }}
                      className="text-left px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold"
                    >
                      🎓 Sinh viên (Đã có DN): 51900839@student.tdtu.edu.vn (Võ Duy Trí)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginPortal('SV');
                        setLoginEmailInput('519h0230@student.tdtu.edu.vn');
                        executeFirebaseLogin('519h0230@student.tdtu.edu.vn', 'SV');
                      }}
                      className="text-left px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold"
                    >
                      🎓 Sinh viên (Chưa có DN): 519h0230@student.tdtu.edu.vn (Trần Thiên Tấn)
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => executeFirebaseLogin(loginEmailInput, loginPortal)}
                    className="px-4 py-2 border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl"
                  >
                    Đăng nhập bằng Google (Firebase Auth)
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                  >
                    🔥 Xác Thực Firebase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: QUẢN LÝ TÀI KHOẢN FIREBASE AUTHENTICATION ================= */}
      {showFirebaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                  Firebase Authentication Console
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Quản Lý Tài Khoản Firebase &amp; Kiểm Soát Truy Cập Domain TDTU ({firebaseSummary.totalUsers} TK)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFirebaseModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {currentUser.isAdmin && (
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="email"
                  value={fbNewEmail}
                  onChange={(e) => setFbNewEmail(e.target.value)}
                  placeholder="Email @tdtu.edu.vn hoặc @student.tdtu.edu.vn..."
                  className="sm:col-span-5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
                <input
                  type="text"
                  value={fbNewName}
                  onChange={(e) => setFbNewName(e.target.value)}
                  placeholder="Họ tên người dùng..."
                  className="sm:col-span-4 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <label className="sm:col-span-1 flex items-center space-x-1 font-semibold justify-center">
                  <input
                    type="checkbox"
                    checked={fbNewAdmin}
                    onChange={(e) => setFbNewAdmin(e.target.checked)}
                  />
                  <span>Admin</span>
                </label>
                <button
                  type="button"
                  onClick={handleCreateFirebaseUser}
                  className="sm:col-span-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
                >
                  + Đồng Bộ TK
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={fbSearch}
                onChange={(e) => {
                  setFbSearch(e.target.value);
                  loadFirebaseUsersData(e.target.value, fbRoleFilter, fbStatusFilter);
                }}
                placeholder="Tìm theo Email TDTU, Họ tên, MSSV hoặc Firebase UID..."
                className="sm:col-span-6 px-3 py-2 rounded-xl border border-slate-200"
              />
              <select
                value={fbRoleFilter}
                onChange={(e) => {
                  setFbRoleFilter(e.target.value);
                  loadFirebaseUsersData(fbSearch, e.target.value, fbStatusFilter);
                }}
                className="sm:col-span-3 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="">Tất cả vai trò</option>
                <option value="ADMIN">Chỉ Admin (@tdtu.edu.vn)</option>
                <option value="GV">Giảng viên (@tdtu.edu.vn)</option>
                <option value="SV">Sinh viên (@student.tdtu.edu.vn)</option>
              </select>
              <select
                value={fbStatusFilter}
                onChange={(e) => {
                  setFbStatusFilter(e.target.value);
                  loadFirebaseUsersData(fbSearch, fbRoleFilter, e.target.value);
                }}
                className="sm:col-span-3 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động (Active)</option>
                <option value="locked">Đã khóa (Disabled)</option>
              </select>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-bold">Người dùng &amp; Email TDTU</th>
                    <th className="py-2 px-3 font-bold">Firebase UID</th>
                    <th className="py-2 px-3 font-bold">Vai trò</th>
                    <th className="py-2 px-3 font-bold">Trạng thái</th>
                    <th className="py-2 px-3 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {firebaseUsers.map((u) => (
                    <tr key={u.email} className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                        {u.firebaseUid || `fb-tdtu-${u.id}`}
                      </td>
                      <td className="py-2 px-3">
                        {u.role === 'GV' ? (
                          u.isAdmin ? (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                              👑 ADMIN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                              GIẢNG VIÊN
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            SINH VIÊN ({u.studentId})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {u.isActive === false ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                            🔒 Đã khóa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            ✓ Active
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right space-x-1">
                        {currentUser.isAdmin && u.email !== currentUser.email && (
                          <button
                            type="button"
                            onClick={() => handleToggleFirebaseLock(u.email, u.isActive === false)}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              u.isActive === false
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {u.isActive === false ? 'Mở khóa' : 'Khóa TK'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: QUẢN LÝ & CHUYỂN QUYỀN ADMIN CHO GIẢNG VIÊN KHÁC ================= */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  Admin Privilege Delegation (@tdtu.edu.vn)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Quản Lý & Chuyển Nhượng Quyền Admin Giữa Các Giảng Viên
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Thêm quyền Admin cho GV mới */}
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-2">
              <div className="font-bold text-amber-950">
                + Cấp thêm quyền Admin cho Giảng viên Khoa CNTT (@tdtu.edu.vn):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Email GV: ...@tdtu.edu.vn"
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                />
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Họ tên Giảng viên..."
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleGrantOrRevokeAdmin(newAdminEmail, true, newAdminName)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg"
                >
                  + Thêm Quyền Admin
                </button>
              </div>
            </div>

            {/* Danh sách Giảng viên */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lecturers.map((gv) => (
                <div
                  key={gv.email}
                  className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center space-x-2">
                      <span>{gv.fullName}</span>
                      {gv.isAdmin ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                          👑 Admin Toàn Quyền
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          Giảng viên
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">{gv.email}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!gv.isAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleGrantOrRevokeAdmin(gv.email, true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                        >
                          + Cấp thêm Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTransferAdmin(gv.email)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg"
                        >
                          ⇄ Chuyển quyền Admin chính
                        </button>
                      </>
                    ) : (
                      gv.email !== currentUser.email && (
                        <button
                          type="button"
                          onClick={() => handleGrantOrRevokeAdmin(gv.email, false)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg"
                        >
                          Thu hồi Admin
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
