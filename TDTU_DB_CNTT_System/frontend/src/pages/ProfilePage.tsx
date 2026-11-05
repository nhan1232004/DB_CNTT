// Profile Page Component - Quản lý Hồ sơ Cá nhân Sinh viên (TDTU CNTT)
// Chuẩn hóa theo Figma Frame 03 (Student Hub):
// Chứa đầy đủ: Thông tin học vụ, Link CV Google Drive, Thông tin DN thực tập, Stepper tiến trình, Lịch sử thực tập & Tra cứu chứng chỉ.

const ProfilePage = ({ currentUser, onNavigateTab, onSemesterChange, activeSemester = 'hk1_2026_2027' }) => {
  const studentId = currentUser?.studentId || '522H0045';
  const studentName = currentUser?.name || 'Nguyễn Minh Anh';

  // State Quản lý Hồ sơ Cá nhân
  const [cvLink, setCvLink] = React.useState('');
  const [cvSavedToast, setCvSavedToast] = React.useState(null);
  const [declaration, setDeclaration] = React.useState(null);
  const [draft, setDraft] = React.useState(null);
  const [certs, setCerts] = React.useState([]);
  const [internshipHistory, setInternshipHistory] = React.useState([]);
  const [previewCertModal, setPreviewCertModal] = React.useState(null);
  const [liveStudentInfo, setLiveStudentInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const [deadlines, setDeadlines] = React.useState({
    semesterName: 'HK1 2026–2027',
    declarationDeadline: '2026-11-15',
    regulationNote: 'Mốc đếm ngược hoàn tất thủ tục hồ sơ doanh nghiệp.'
  });

  const getDaysRemaining = (deadlineStr) => {
    if (!deadlineStr) return 18;
    try {
      const target = new Date(deadlineStr).getTime();
      const now = Date.now();
      const diff = target - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch {
      return 18;
    }
  };

  const remainingDays = getDaysRemaining(deadlines.declarationDeadline);

  const isEnrolledStudent = React.useMemo(() => {
    if (currentUser?.isEnrolledThisSemester === false) return false;
    const cleanSid = String(currentUser?.studentId || currentUser?.mssv || studentId).toUpperCase();
    if (cleanSid === '52100999') return false;
    if (window.PrimeRbac?.getUserRoleKey && window.PrimeRbac.getUserRoleKey(currentUser) === 'sv_ngoai_ky') return false;
    if (liveStudentInfo) return true;
    return currentUser?.isEnrolledThisSemester !== false;
  }, [currentUser, studentId, liveStudentInfo]);

  const isMountedRef = React.useRef(true);
  const lastUpdateRef = React.useRef(0);

  // Tải dữ liệu hồ sơ cá nhân
  const loadProfileData = (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      if (window.ApiClient) {
        if (window.ApiClient.getSystemDeadlines) {
          setDeadlines(window.ApiClient.getSystemDeadlines(activeSemester));
        }
        if (window.ApiClient.getStudentCvLink) {
          setCvLink(window.ApiClient.getStudentCvLink(studentId));
        }
        if (window.ApiClient.getStudentDeclaration) {
          const local = window.ApiClient.getStudentDeclaration(studentId);
          if (local) setDeclaration(local);
        }
        if (window.ApiClient.getDeclaration) {
          window.ApiClient.getDeclaration(studentId).then(remoteDecl => {
            if (remoteDecl && isMountedRef.current) {
              setDeclaration(prev => ({ ...prev, ...remoteDecl }));
            }
          }).catch(() => {});
        }
        if (window.ApiClient.getStudentCerts) {
          setCerts(window.ApiClient.getStudentCerts(studentId));
        }
        if (window.ApiClient.fetchStudentCerts) {
          window.ApiClient.fetchStudentCerts(studentId).then(fresh => {
            if (Array.isArray(fresh) && isMountedRef.current) setCerts(fresh);
          }).catch(() => {});
        }
        if (window.ApiClient.getStudentInternshipHistory) {
          setInternshipHistory(window.ApiClient.getStudentInternshipHistory(studentId));
        }
        if (window.ApiClient.getLiveStudents) {
          window.ApiClient.getLiveStudents(activeSemester).then(list => {
            if (Array.isArray(list) && isMountedRef.current) {
              const found = list.find(s => String(s.studentId || s.mssv || '').trim().toUpperCase() === String(studentId).trim().toUpperCase());
              if (found) setLiveStudentInfo(found);
            }
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Lỗi tải hồ sơ cá nhân:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  React.useEffect(() => {
    isMountedRef.current = true;
    loadProfileData(true);

    const handleUpdate = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 1000) return;
      lastUpdateRef.current = now;
      loadProfileData(false);
    };

    window.addEventListener('tdtu_certs_updated', handleUpdate);
    window.addEventListener('tdtu_decl_updated', handleUpdate);
    window.addEventListener('tdtu_declarations_updated', handleUpdate);
    window.addEventListener('tdtu_declaration_updated', handleUpdate);
    window.addEventListener('tdtu_data_updated', handleUpdate);
    window.addEventListener('tdtu_cv_updated', handleUpdate);
    window.addEventListener('tdtu_semester_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    let bc = null;
    try {
      bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.onmessage = () => {
        handleUpdate();
      };
    } catch {}

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('tdtu_certs_updated', handleUpdate);
      window.removeEventListener('tdtu_decl_updated', handleUpdate);
      window.removeEventListener('tdtu_declarations_updated', handleUpdate);
      window.removeEventListener('tdtu_declaration_updated', handleUpdate);
      window.removeEventListener('tdtu_data_updated', handleUpdate);
      window.removeEventListener('tdtu_cv_updated', handleUpdate);
      window.removeEventListener('tdtu_semester_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }, [studentId]);

  // Cập nhật link CV Google Drive
  const handleSaveCv = (e) => {
    if (e) e.preventDefault();
    if (!cvLink || !cvLink.trim()) {
      alert('Vui lòng nhập đường liên kết Google Drive của CV.');
      return;
    }
    const clean = cvLink.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      alert('Đường dẫn không hợp lệ. Vui lòng nhập link Google Drive bắt đầu bằng https://');
      return;
    }
    if (window.ApiClient?.saveStudentCvLink) {
      window.ApiClient.saveStudentCvLink(studentId, clean);
      setCvSavedToast(' Đã cập nhật link Google Drive CV thành công! Doanh nghiệp đối tác và Khoa có thể xem CV này khi bạn ứng tuyển.');
      setTimeout(() => setCvSavedToast(null), 4000);
    }
  };

  // Xem Dashboard học kỳ lịch sử
  const handleSelectHistorySemester = (semId, semName) => {
    if (onSemesterChange) {
      onSemesterChange(semId);
    }
    if (onNavigateTab) {
      onNavigateTab('dashboard');
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      
      {/* Breadcrumb & Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#003087]/10 text-[#003087] border border-[#bfdbfe] inline-flex items-center">
              <span>Không gian Sinh viên</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#ebf3ff] text-[#003087]  ">
              MSSV: {studentId}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1f2937]  flex items-center gap-2.5">
            <span>Hồ sơ cá nhân: {studentName}</span>
          </h1>
        </div>
      </div>

      {/* Status Alert Banner - Hiển thị tương ứng theo đúng tình trạng khai báo của sinh viên trong kỳ */}
      {isEnrolledStudent && declaration && (() => {
        const declStatus = String(declaration?.internshipStatus || declaration?.status || '').trim().toLowerCase().normalize('NFC');
        const noCompOpt = String(declaration?.noCompanyOption || '').trim().toLowerCase().normalize('NFC');
        const compNameLower = String(declaration?.companyName || '').trim().toLowerCase().normalize('NFC');

        const isWait = declStatus === 'interviewing' ||
                       declStatus === 'seeking' ||
                       noCompOpt === 'self' ||
                       compNameLower.includes('phỏng vấn') ||
                       compNameLower.includes('chờ pv') ||
                       compNameLower.includes('chờ') ||
                       compNameLower.includes('tuyển dụng') ||
                       compNameLower.includes('đang tìm') ||
                       compNameLower.includes('ứng tuyển');

        const isSupp = !isWait && (
          declStatus === 'need_support' ||
          noCompOpt === 'faculty' ||
          compNameLower.includes('hỗ trợ') ||
          compNameLower.includes('khoa cntt')
        );

        const isPlaceholder = compNameLower.includes('hỗ trợ') ||
                             compNameLower.includes('khoa cntt') ||
                             compNameLower.includes('đang tìm') ||
                             compNameLower.includes('phỏng vấn') ||
                             compNameLower.includes('chờ pv') ||
                             compNameLower.includes('chờ') ||
                             compNameLower.includes('tuyển dụng') ||
                             compNameLower.includes('ứng tuyển') ||
                             compNameLower === 'chưa có' ||
                             compNameLower === '—' ||
                             compNameLower === '-';

        const isComp = !isWait && !isSupp && !isPlaceholder && (
          declStatus === 'has_company' ||
          Boolean(declaration?.companyName && !isPlaceholder && declStatus !== 'not_declared')
        );

        if (isWait) {
          return (
            <div className="border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FFFBEB] border-[#FDE68A] shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[#FEF3C7] text-[#D97706] font-bold text-sm">
                  ⏳
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#B45309]">
                    Tình trạng thực tập: Đang tìm kiếm / Chờ kết quả phỏng vấn
                  </div>
                  <div className="text-[14px] text-[#4b5563]">
                    {declaration.pendingCompany ? `Đang ứng tuyển: ${declaration.pendingCompany}` : (declaration.companyName && !isPlaceholder ? `Đang ứng tuyển: ${declaration.companyName}` : 'Tự liên hệ nơi thực tập')} · Vị trí: <strong>{declaration.desiredPosition || declaration.position || 'Thực tập sinh'}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { if (onNavigateTab) onNavigateTab('declaration'); }}
                className="px-4 py-2 bg-white text-[#B45309] border border-[#FDE68A] rounded-xl text-[14px] font-bold hover:bg-[#FFFBEB] shadow-xs transition shrink-0 cursor-pointer"
              >
                Cập nhật kết quả
              </button>
            </div>
          );
        }

        if (isSupp) {
          return (
            <div className="border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FFF1F2] border-[#FECDD3] shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[#FFE4E6] text-[#E11D48] font-bold text-sm">
                  !
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#E11D48]">
                    Tình trạng thực tập: Cần Khoa CNTT hỗ trợ điều phối
                  </div>
                  <div className="text-[14px] text-[#4b5563]">
                    Vị trí định hướng: <strong>{declaration.desiredPosition || 'Chờ Khoa phân bổ'}</strong> · Khu vực: <strong>{declaration.desiredLocation || 'TP. Hồ Chí Minh'}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { if (onNavigateTab) onNavigateTab('declaration'); }}
                className="px-4 py-2 bg-white text-[#E11D48] border border-[#FECDD3] rounded-xl text-[14px] font-bold hover:bg-[#FFF1F2] shadow-xs transition shrink-0 cursor-pointer"
              >
                Cập nhật nguyện vọng
              </button>
            </div>
          );
        }

        if (isComp && declaration.companyName) {
          return (
            <div className="border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#ECFDF5] border-[#A7F3D0] shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[#ebf3ff] text-[#003087]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#1f2937]">
                    Đã có nơi thực tập: {declaration.companyName}
                  </div>
                  <div className="text-[14px] text-[#4b5563]">
                    {declaration.position || 'Thực tập sinh'}{declaration.department ? (' · ' + declaration.department) : ''}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { if (onNavigateTab) onNavigateTab('declaration'); }}
                className="px-4 py-2 bg-white text-[#1f2937] border border-[#e5e7eb] rounded-xl text-[14px] font-bold hover:bg-[#f8fafc] shadow-xs transition shrink-0 cursor-pointer"
              >
                Cập nhật trạng thái
              </button>
            </div>
          );
        }

        return null;
      })()}

      {/* 4 Summary Cards Row matching Student Academic Profile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Học kỳ hiện tại */}
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs">
          <div className="text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wider">Học kỳ hiện tại</div>
          <div className="text-2xl font-black text-[#1f2937] mt-1">{deadlines.semesterName}</div>
          <div className="mt-3 flex items-center justify-between text-[13.5px]">
            <span className="text-[#1f2937]">Hạn nộp: {new Date(deadlines.declarationDeadline).toLocaleDateString('vi-VN')}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f8fafc] text-[#1f2937] font-bold text-[11px] border border-[#e5e7eb]">
              Còn {remainingDays} ngày
            </span>
          </div>
        </div>

        {/* Card 2: Môn học đăng ký */}
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs">
          <div className="text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wider">Môn học đăng ký</div>
          {isEnrolledStudent && (liveStudentInfo || currentUser?.courses?.length) ? (
            (() => {
              const cArr = Array.isArray(liveStudentInfo?.courses) ? liveStudentInfo.courses.map((c: any) => String(c).toUpperCase()) : (Array.isArray(currentUser?.courses) ? currentUser.courses.map((c: any) => String(c).toUpperCase()) : []);
              const cCode = String(liveStudentInfo?.courseCode || liveStudentInfo?.course_str || liveStudentInfo?.courseName || currentUser?.courseCode || currentUser?.courseName || '').toUpperCase();
              const isDual = Boolean(liveStudentInfo?.isDualCourse || currentUser?.isDualCourse || cArr.length > 1 || (cCode.includes('KTCN') && cCode.includes('TSNN')) || cCode.includes('SONG SONG'));
              const isTsnnOnly = !isDual && (cArr.some((c: string) => c.includes('TSNN') || c.includes('TẬP SỰ') || c.includes('DỰ ÁN')) || cCode.includes('TSNN') || cCode.includes('TẬP SỰ') || cCode.includes('DỰ ÁN') || liveStudentInfo?.tsnnEnrolled === 1);
              const displayCode = isDual ? 'KTCN & TSNN' : (isTsnnOnly ? 'TSNN' : 'KTCN');
              const displaySubjId = isDual ? '504074 & 504075' : (isTsnnOnly ? '504075' : '504074');
              const displayName = isDual ? 'Kiến tập CN & Tập sự NN (Song song)' : (isTsnnOnly ? 'Tập sự Nghề nghiệp' : 'Kiến tập Công nghiệp');
              return (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#ebf3ff] text-[#003087] font-bold text-xs">
                      {displayCode}
                    </span>
                    <span className="text-xs text-[#1f2937]">Mã môn: {displaySubjId}</span>
                  </div>
                  <div className="text-[16px] font-bold text-[#1f2937] mt-2">
                    {displayName}
                  </div>
                </>
              );
            })()
          ) : (
            <div className="mt-2">
              <div className="text-[15px] font-bold text-gray-500">Chưa đăng ký môn học trong kỳ</div>
              <div className="text-xs text-gray-400 mt-1">Không có học phần thực tập</div>
            </div>
          )}
        </div>

        {/* Card 3: Tình trạng hồ sơ (Đồng bộ chính xác 100% với trạng thái đã khai báo) */}
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs">
          {(() => {
            const declStatus = String(declaration?.internshipStatus || declaration?.status || '').trim().toLowerCase().normalize('NFC');
            const noCompOpt = String(declaration?.noCompanyOption || '').trim().toLowerCase().normalize('NFC');
            const compNameLower = String(declaration?.companyName || '').trim().toLowerCase().normalize('NFC');

            const isWait = declStatus === 'interviewing' ||
                           declStatus === 'seeking' ||
                           noCompOpt === 'self' ||
                           compNameLower.includes('phỏng vấn') ||
                           compNameLower.includes('chờ pv') ||
                           compNameLower.includes('chờ') ||
                           compNameLower.includes('tuyển dụng') ||
                           compNameLower.includes('đang tìm') ||
                           compNameLower.includes('ứng tuyển');

            const isSupp = !isWait && (
              declStatus === 'need_support' ||
              noCompOpt === 'faculty' ||
              compNameLower.includes('hỗ trợ') ||
              compNameLower.includes('khoa cntt')
            );

            const isPlaceholder = compNameLower.includes('hỗ trợ') ||
                                 compNameLower.includes('khoa cntt') ||
                                 compNameLower.includes('đang tìm') ||
                                 compNameLower.includes('phỏng vấn') ||
                                 compNameLower.includes('chờ pv') ||
                                 compNameLower.includes('chờ') ||
                                 compNameLower.includes('tuyển dụng') ||
                                 compNameLower.includes('ứng tuyển') ||
                                 compNameLower === 'chưa có' ||
                                 compNameLower === '—' ||
                                 compNameLower === '-';

            const isComp = !isWait && !isSupp && !isPlaceholder && (
              declStatus === 'has_company' ||
              Boolean(declaration?.companyName && !isPlaceholder && declStatus !== 'not_declared')
            );

            let badgeClass = 'bg-gray-100 text-gray-600 border-gray-200';
            let badgeLabel = 'Chưa mở hồ sơ';
            let descText = 'Sinh viên chưa thuộc đợt thực tập kỳ này';

            if (isEnrolledStudent) {
              if (isWait) {
                badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                badgeLabel = 'Đang tìm / Chờ phỏng vấn';
                descText = (declaration?.pendingCompany && !compNameLower.includes('đang chờ'))
                  ? `Đang ứng tuyển: ${declaration.pendingCompany}`
                  : (declaration?.companyName && !isPlaceholder ? `Đang ứng tuyển: ${declaration.companyName}` : 'Tự liên hệ & đang chờ kết quả phỏng vấn');
              } else if (isSupp) {
                badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                badgeLabel = 'Cần Khoa hỗ trợ';
                descText = 'Khoa CNTT tiếp nhận hỗ trợ phân bổ doanh nghiệp';
              } else if (isComp) {
                badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                badgeLabel = 'Đã có nơi TT';
                descText = `Đã tiếp nhận tại ${declaration.companyName}`;
              } else {
                badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                badgeLabel = 'Chưa khai báo';
                descText = 'Khoa đang tiếp nhận thông tin khai báo thực tập';
              }
            }

            return (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wider">Tình trạng hồ sơ</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${badgeClass}`}>
                    {badgeLabel}
                  </span>
                </div>
                <div className="text-xs text-[#1f2937] mt-2">
                  {descText}
                </div>
                {isEnrolledStudent && (
                  <button
                    type="button"
                    onClick={() => { if (onNavigateTab) onNavigateTab('declaration'); }}
                    className="text-xs font-bold text-[#003087] hover:underline mt-3 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem hồ sơ khai báo</span>
                    <span>→</span>
                  </button>
                )}
              </>
            );
          })()}
        </div>

        {/* Card 4: Hồ sơ học tập & Điểm tích lũy (GPA Hệ 10 & Xếp loại học lực) */}
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wider">Hồ sơ học tập (GPA)</span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]">
              {liveStudentInfo?.academicRank || currentUser?.academicRank || '—'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#003087] font-mono">
              {liveStudentInfo?.gpa10 ?? currentUser?.gpa10 ?? (liveStudentInfo?.gpa4 ? (Number(liveStudentInfo.gpa4) * 2.5).toFixed(2) : (currentUser?.gpa ? Number(currentUser.gpa).toFixed(2) : '—'))}
            </span>
            <span className="text-xs text-[#1f2937] font-semibold">/ 10.0 (Hệ 10)</span>
          </div>
          <div className="text-[13px] text-[#4b5563] mt-2">
            Lớp: <strong className="text-[#1f2937]">{liveStudentInfo?.class || liveStudentInfo?.className || currentUser?.class || currentUser?.className || '—'}</strong>
            {((liveStudentInfo?.major || currentUser?.major) && (liveStudentInfo?.major !== '—' && currentUser?.major !== '—')) ? ` · ${liveStudentInfo?.major || currentUser?.major}` : ''}
          </div>
        </div>

      </div>

      {/* Stepper Card: Tiến trình hồ sơ (Chỉ hiển thị khi là sinh viên trong kỳ) */}
      {isEnrolledStudent && (
        <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1f2937] text-[17px]">Tiến trình hồ sơ</h3>
            <span className="text-[14px] font-bold text-[#003087]">
              {declaration ? (certs.length > 0 ? 'Hoàn thành 4/4 bước' : 'Hoàn thành 3/4 bước') : 'Đang xử lý 2/4 bước'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#003087] text-white flex items-center justify-center font-bold text-sm shrink-0 border border-[#003087] shadow-xs">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-[#1f2937] text-sm">Xác thực Email</div>
                <div className="text-xs text-[#4b5563]">Google SSO TDTU</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#003087] text-white flex items-center justify-center font-bold text-sm shrink-0 border border-[#003087] shadow-xs">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-[#1f2937] text-sm">Khai báo Nơi TT</div>
                <div className="text-xs text-[#4b5563]">Tra cứu MST tự động</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${declaration ? 'bg-[#003087] text-white border-[#003087]' : 'bg-gray-100 text-gray-500 border-gray-300'} flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs`}>
                {declaration ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>3</span>
                )}
              </div>
              <div>
                <div className="font-bold text-[#1f2937] text-sm">Cập nhật Trạng thái</div>
                <div className="text-xs text-[#4b5563]">
                  {(() => {
                    const ds = String(declaration?.internshipStatus || '').toLowerCase();
                    const cn = String(declaration?.companyName || '').toLowerCase();
                    const opt = String(declaration?.noCompanyOption || '').toLowerCase();
                    if (ds === 'interviewing' || opt === 'self' || cn.includes('chờ phỏng vấn') || cn.includes('phỏng vấn') || cn.includes('đang tìm') || cn.includes('chờ pv')) return 'Đang chờ PV';
                    if (ds === 'need_support' || opt === 'faculty' || cn.includes('hỗ trợ') || cn.includes('khoa cntt')) return 'Cần Khoa hỗ trợ';
                    if (ds === 'has_company' || (declaration?.companyName && declaration.companyName !== 'Chưa có' && declaration.companyName !== '—')) return 'Có doanh nghiệp';
                    return 'Đang cập nhật';
                  })()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${certs.length > 0 ? 'bg-[#003087] text-white border-[#003087]' : 'bg-gray-100 text-gray-500 border-gray-300'} flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs`}>
                {certs.length > 0 ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>4</span>
                )}
              </div>
              <div>
                <div className="font-bold text-[#1f2937] text-sm">Chứng chỉ ngoại ngữ</div>
                <div className="text-xs text-[#4b5563]">{certs.length > 0 ? 'Đã cập nhật' : 'Chưa nộp'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PHẦN 1: CẬP NHẬT LINK CV (GOOGLE DRIVE)                           */}
      {/* ================================================================= */}
      <div className="w-full bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ebf3ff] text-[#003087] flex items-center justify-center shrink-0 border border-[#bfdbfe]">
              <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1f2937]">
                Hồ sơ CV Ứng tuyển (Google Drive Link)
              </h3>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe] self-start sm:self-auto">
            CV Trực Tuyến
          </span>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSaveCv} className="mt-2 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-[#1f2937] mb-1.5">
              Đường dẫn Google Drive chia sẻ CV của bạn:
            </label>
            <div>
              <input
                type="url"
                value={cvLink}
                onChange={(e) => setCvLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] text-sm font-mono text-[#1f2937] focus:ring-2 focus:ring-[#003087] outline-none transition"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-sm font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Lưu link CV</span>
            </button>

            {cvLink && (
              <a
                href={cvLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white hover:bg-[#f1f5f9] text-[#003087] border border-[#cbd5e1] rounded-xl text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Mở trên Drive</span>
                <span>↗</span>
              </a>
            )}
          </div>
        </form>

        {/* Toast thông báo */}
        {cvSavedToast && (
          <div className="p-3 rounded-xl bg-[#ebf3ff] border border-[#bfdbfe] text-[#003087] text-sm font-medium flex items-center gap-2 animate-fadeIn">
            <svg className="w-4 h-4 text-[#003087] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{cvSavedToast}</span>
          </div>
        )}

        {/* Khung Review CV trực tiếp của sinh viên - Tự động hiển thị tinh gọn, không nút trùng lặp */}
        {cvLink && (
          <div className="mt-4 pt-4 border-t border-[#e5e7eb] space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[13.5px] font-bold text-[#003087]">
                Xem trước CV trực tuyến
              </span>
            </div>

            {(() => {
              const isGoogleDrive = cvLink.includes('drive.google.com') || cvLink.includes('docs.google.com');
              if (!isGoogleDrive) {
                return (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Đường dẫn liên kết không phải miền Google Drive hợp lệ (drive.google.com). Để đảm bảo an toàn bảo mật, hệ thống không cho phép nhúng trực tiếp website bên ngoài. Bạn có thể bấm "Mở trên Drive ↗" ở trên để kiểm tra.</span>
                  </div>
                );
              }
              return (
                <div className="w-full h-[540px] rounded-xl border border-[#cbd5e1] overflow-hidden bg-[#f8fafc] shadow-inner relative animate-fadeIn">
                  <iframe
                    src={window.ApiClient?.formatCvPreviewUrl ? window.ApiClient.formatCvPreviewUrl(cvLink) : cvLink}
                    title="Review CV Sinh viên"
                    className="w-full h-full border-0"
                    allow="autoplay"
                  />
                </div>
              );
            })()}

            <p className="text-[11.5px] text-[#6b7280]">
              * Lưu ý: Hãy đảm bảo bạn đã bật quyền <strong>"Bất kỳ ai có đường liên kết đều có thể xem (Anyone with the link can view)"</strong> trên Google Drive để Giảng viên có thể xem trực tiếp hồ sơ của bạn.
            </p>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* PHẦN 2: CHỨNG CHỈ CỦA MÌNH (NGOẠI NGỮ & TIN HỌC)                 */}
      {/* ================================================================= */}
      <div className="bg-white  p-6 rounded-xl border border-[#e5e7eb]  shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg"></span>
              <h3 className="text-base font-bold text-[#1f2937] ">
                Chứng chỉ Ngoại ngữ của bạn
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11.5px] font-bold bg-[#ebf3ff] text-[#003087]  ">
                {certs.length} chứng chỉ đã ghi nhận
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { if (onNavigateTab) onNavigateTab('certs'); }}
            className="px-3.5 py-1.5 bg-[#ebf3ff]  text-[#003087]  border border-[#bfdbfe]  rounded-xl text-xs font-bold hover:bg-[#ebf3ff] transition flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>+ Quản lý & Nộp chứng chỉ mới</span>
            <span>→</span>
          </button>
        </div>

        {certs.length === 0 ? (
          <div className="p-8 text-center text-[#1f2937] bg-[#f8fafc]  rounded-xl border border-dashed border-[#e5e7eb] ">
            <p className="text-xs">Bạn chưa nộp chứng chỉ ngoại ngữ nào.</p>
            <button
              type="button"
              onClick={() => { if (onNavigateTab) onNavigateTab('certs'); }}
              className="mt-2 text-xs text-[#003087]  font-bold hover:underline"
            >
              + Khai báo chứng chỉ ngay &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certs.map(cert => (
              <div
                key={cert.id}
                className="p-4 rounded-xl border border-[#e5e7eb]  bg-[#f8fafc]  flex flex-col justify-between space-y-3 hover:border-blue-400 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#ebf3ff]  text-blue-800  rounded text-[11.5px] font-bold">
                      {cert.type || 'Ngoại ngữ'}
                    </span>
                    <span className="text-[10px] text-[#1f2937]">
                      Thi: {cert.examDate || '—'} · Cấp: {cert.issueDate || cert.examDate || '—'}
                    </span>
                  </div>

                  <div className="font-bold text-[#1f2937]  text-sm">
                    {cert.name}
                  </div>

                  <div className="flex items-baseline gap-2 text-xs">
                    <span className="font-black text-lg text-[#003087] ">
                      {cert.score}
                    </span>
                    {cert.level && (
                      <span className="px-2 py-0.5 bg-[#ebf3ff]  text-[#003087]  rounded text-[11px] font-bold">
                        {cert.level}
                      </span>
                    )}
                  </div>

                  <div className="text-[12px] text-[#003087] font-semibold flex items-center gap-1">
                    <span>{cert.status || 'Đạt chuẩn tốt nghiệp TDTU'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e5e7eb]/60  flex items-center justify-between">
                  <div className="text-[10px] text-[#1f2937] truncate max-w-[140px]" title={cert.driveLink || cert.fileName}>
                    {cert.driveLink ? ' Google Drive' : ` ${cert.fileName || 'Minh chứng'}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const link = cert.driveLink || (cert.proofData && String(cert.proofData).startsWith('http') ? cert.proofData : null);
                      if (link) {
                        window.open(link, '_blank');
                      } else {
                        setPreviewCertModal(cert);
                      }
                    }}
                    className="text-xs font-bold text-[#003087]  hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Xem minh chứng</span>
                    <span>↗</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Preview Minh Chứng Chứng Chỉ */}
      {previewCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white  rounded-2xl border border-[#e5e7eb]  shadow-2xl max-w-4xl w-full p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[#e5e7eb]  pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl"></span>
                <div>
                  <h3 className="text-base font-bold text-[#1f2937] ">
                    Minh chứng: {previewCertModal.name}
                  </h3>
                  <p className="text-xs text-[#1f2937]">Mã sinh viên: {studentId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCertModal(null)}
                className="text-[#1f2937] hover:text-[#1f2937]  p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#f8fafc]  border border-[#e5e7eb]  space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#1f2937]">Loại chứng chỉ:</span>
                  <span className="font-bold text-[#1f2937] ">{previewCertModal.type || 'Ngoại ngữ'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1f2937]">Điểm số đạt được:</span>
                  <span className="font-black text-[#003087] ">
                    {previewCertModal.score} {previewCertModal.level ? `(${previewCertModal.level})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1f2937]">Ngày thi:</span>
                  <span className="font-medium text-[#1f2937] ">{previewCertModal.examDate || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1f2937]">Ngày cấp:</span>
                  <span className="font-medium text-[#1f2937] ">{previewCertModal.issueDate || previewCertModal.examDate || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewCertModal(null)}
                className="px-4 py-2 bg-[#f8fafc] hover:bg-[#e5e7eb]  text-[#1f2937]  rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-[10px] text-[#1f2937]  text-center pt-4">
        © Khoa Công nghệ Thông tin · Trường Đại học Tôn Đức Thắng
      </div>

    </div>
  );
};

window.ProfilePage = ProfilePage;
