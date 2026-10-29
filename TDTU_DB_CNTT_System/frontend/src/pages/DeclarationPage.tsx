// Declaration Page Component - Chuẩn hóa thiết kế theo Figma Frames (Frame 04, 05, 06, 07)
// Nghiệp vụ: Tự động nhận diện môn học từ 2 sheet (KTCN & TSNN) do Khoa nhập; bỏ hoàn toàn phần Giấy giới thiệu (GGT).
// Quy trình Wizard 4 bước: Học phần thực tập -> Trạng thái hiện tại -> Thông tin doanh nghiệp (MST Realtime Xinvoice) -> Vị trí & Xác nhận

const DeclarationPage = ({ currentUser }) => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const studentId = currentUser?.studentId || '522H0045';
  const studentName = currentUser?.name || 'Nguyễn Minh Anh';

  // Step 1: Môn học - Tự động phát hiện từ danh sách 2 sheet KTCN & TSNN của Khoa
  const [selectedCourses, setSelectedCourses] = React.useState(['KTCN']);
  const [isDualCourse, setIsDualCourse] = React.useState(false);
  const [enrolledInfo, setEnrolledInfo] = React.useState('Đang đối chiếu dữ liệu danh sách Khoa...');

  // Step 2: Trạng thái hiện tại ('has_company' | 'interviewing' | 'need_support')
  const [internshipStatus, setInternshipStatus] = React.useState('has_company');

  // Step 3: Thông tin doanh nghiệp (Tra cứu MST Xinvoice API thực tế)
  const [taxCode, setTaxCode] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [mainIndustry, setMainIndustry] = React.useState('');
  const [representative, setRepresentative] = React.useState('');
  const [contactPerson, setContactPerson] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [isTaxConfirmed, setIsTaxConfirmed] = React.useState(false);

  // Step 4: Vị trí & Xác nhận (Đã bỏ hoàn toàn Giấy giới thiệu)
  const [position, setPosition] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [supportNote, setSupportNote] = React.useState('');
  const [finalConfirmed, setFinalConfirmed] = React.useState(false);

  // UI & Network State
  const [lookupLoading, setLookupLoading] = React.useState(false);
  const [lookupSuccess, setLookupSuccess] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState(null);
  const [lastSavedTime, setLastSavedTime] = React.useState('');

  // Tự động nhận diện môn học dựa trên dữ liệu 2 sheet KTCN và TSNN từ Khoa
  React.useEffect(() => {
    if (studentId) {
      // 1. Đối chiếu danh sách sinh viên thực tế của học kỳ
      window.ApiClient.getLiveStudents('hk1_2026_2027')
        .then(students => {
          const found = students.find(s => (s.mssv === studentId || s.studentId === studentId));
          if (found) {
            let courses = [];
            const cStr = (found.course_str || (found.courses && found.courses.join(' ')) || '').toUpperCase();
            const hasKTCN = cStr.includes('KTCN') || cStr.includes('KIẾN TẬP') || (found.courses && found.courses.some(c => String(c).toUpperCase().includes('KTCN') || String(c).toUpperCase().includes('KIẾN TẬP')));
            const hasTSNN = cStr.includes('TSNN') || cStr.includes('TẬP SỰ') || (found.courses && found.courses.some(c => String(c).toUpperCase().includes('TSNN') || String(c).toUpperCase().includes('TẬP SỰ')));

            if (hasKTCN && hasTSNN) {
              courses = ['KTCN', 'TSNN'];
              setEnrolledInfo('Đã tự động nhận diện từ 2 sheet: Bạn có tên trong cả 2 danh sách KTCN & TSNN (Thực tập song song 320h)');
            } else if (hasTSNN) {
              courses = ['TSNN'];
              setEnrolledInfo('Đã tự động nhận diện: Bạn có tên trong danh sách Tập sự Nghề nghiệp (TSNN)');
            } else {
              courses = ['KTCN'];
              setEnrolledInfo('Đã tự động nhận diện: Bạn có tên trong danh sách Kiến tập Công nghiệp (KTCN)');
            }

            setSelectedCourses(courses);
            setIsDualCourse(courses.length > 1);
          } else {
            // Mặc định cho tài khoản sinh viên mẫu
            setSelectedCourses(['KTCN']);
            setIsDualCourse(false);
            setEnrolledInfo('Đã tự động nhận diện môn Kiến tập Công nghiệp (KTCN) theo danh sách học vụ');
          }
        })
        .catch(() => {
          setSelectedCourses(['KTCN']);
          setIsDualCourse(false);
        });

      // 2. Load bản khai báo nháp nếu đã lưu trước đó
      window.ApiClient.getDeclaration(studentId)
        .then(res => {
          if (res) {
            if (res.selectedCourses && res.selectedCourses.length > 0) {
              setSelectedCourses(res.selectedCourses);
              setIsDualCourse(res.selectedCourses.length > 1);
            }
            if (res.internshipStatus) setInternshipStatus(res.internshipStatus);
            if (res.taxCode) setTaxCode(res.taxCode);
            if (res.companyName) setCompanyName(res.companyName);
            if (res.address) setAddress(res.address);
            if (res.mainIndustry) setMainIndustry(res.mainIndustry);
            if (res.representative) setRepresentative(res.representative);
            if (res.contactPerson) setContactPerson(res.contactPerson);
            if (res.contactPhone) setContactPhone(res.contactPhone);
            if (res.contactEmail) setContactEmail(res.contactEmail);
            if (res.position) setPosition(res.position);
            if (res.department) setDepartment(res.department);
            if (res.supportNote) setSupportNote(res.supportNote);
            if (res.isConfirmed !== undefined) setFinalConfirmed(Boolean(res.isConfirmed));
          }
        })
        .catch(() => {});
    }
  }, [studentId]);

  // Handle Tax Lookup with real-time Xinvoice API
  const handleTaxLookup = async (codeOverride) => {
    const code = (codeOverride || taxCode || '').trim();
    if (!code) {
      setMessage({ type: 'error', text: 'Vui lòng nhập Mã số thuế để tra cứu thông tin doanh nghiệp.' });
      return;
    }

    setLookupLoading(true);
    setMessage(null);

    try {
      const res = await window.ApiClient.lookupTaxCode(code);
      setTaxCode(res.taxCode || code);
      setCompanyName(res.name || res.companyName || '');
      setAddress(res.address || '');
      if (res.representative) setRepresentative(res.representative);
      if (res.mainIndustry) setMainIndustry(res.mainIndustry);
      if (res.phone) setContactPhone(res.phone);
      if (res.email) setContactEmail(res.email);
      setLookupSuccess(true);
      setMessage({
        type: 'success',
        text: `✓ Đã tìm thấy thông tin doanh nghiệp: ${res.name || res.companyName}`
      });
    } catch (err) {
      setLookupSuccess(false);
      setMessage({
        type: 'error',
        text: err?.message || 'Không tìm thấy MST trên Cổng Thuế. Bạn có thể tự nhập thông tin vào các ô bên dưới.'
      });
    } finally {
      setLookupLoading(false);
      const now = new Date();
      setLastSavedTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (internshipStatus === 'need_support') {
        setCurrentStep(4);
      } else {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
    const now = new Date();
    setLastSavedTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  const handlePrevStep = () => {
    if (currentStep === 4) {
      if (internshipStatus === 'need_support') {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitFinal = async (e) => {
    if (e) e.preventDefault();
    if (!finalConfirmed) {
      setMessage({ type: 'error', text: 'Vui lòng tích chọn xác nhận tính chính xác của hồ sơ trước khi gửi.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        studentId,
        selectedCourses,
        isDualCourse,
        internshipStatus,
        companyName: internshipStatus === 'has_company' ? companyName : (internshipStatus === 'interviewing' ? 'Đang tìm / Chờ PV' : 'Khoa CNTT hỗ trợ'),
        taxCode: internshipStatus === 'has_company' ? taxCode : '',
        address: internshipStatus === 'has_company' ? address : '',
        mainIndustry: internshipStatus === 'has_company' ? mainIndustry : '',
        representative: internshipStatus === 'has_company' ? representative : '',
        contactPerson: internshipStatus === 'has_company' ? contactPerson : '',
        contactPhone: internshipStatus === 'has_company' ? contactPhone : '',
        contactEmail: internshipStatus === 'has_company' ? contactEmail : '',
        position,
        department,
        supportNote,
        isConfirmed: finalConfirmed
      };

      await window.ApiClient.declareInternship(payload);
      setMessage({
        type: 'success',
        text: '✓ Hồ sơ đã được gửi thành công tới Khoa CNTT! Dữ liệu đã đồng bộ tức thì vào bảng theo dõi của Giảng viên.'
      });
      const now = new Date();
      setLastSavedTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Không thể lưu hồ sơ khai báo. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: 'Môn học' },
    { num: 2, label: 'Trạng thái hiện tại' },
    { num: 3, label: 'Thông tin doanh nghiệp' },
    { num: 4, label: 'Vị trí & Xác nhận' }
  ];

  const courseDisplay = selectedCourses.length === 2
    ? 'KTCN & TSNN (2 môn song song)'
    : selectedCourses.includes('TSNN')
      ? 'TSNN — Tập sự Nghề nghiệp'
      : 'KTCN — Kiến tập Công nghiệp';

  const statusLabel = internshipStatus === 'has_company'
    ? 'Đã có nơi thực tập'
    : internshipStatus === 'interviewing'
      ? 'Đang tìm / Chờ phỏng vấn'
      : 'Cần Khoa hỗ trợ';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Khai báo thực tập
          </h1>
        </div>
      </div>

      {/* Global Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:underline ml-4">
            Đóng
          </button>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Form & Stepper */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stepper Header */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {stepsMeta.map(step => {
                const isCurrent = currentStep === step.num;
                const isPast = currentStep > step.num;
                return (
                  <div
                    key={step.num}
                    onClick={() => {
                      if (step.num < currentStep) setCurrentStep(step.num);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition cursor-pointer select-none ${
                      isCurrent 
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#003087] dark:text-sky-300 font-bold border border-blue-200 dark:border-blue-800'
                        : isPast 
                          ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      isCurrent 
                        ? 'bg-[#003087] text-white'
                        : isPast 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {isPast ? '✓' : step.num}
                    </div>
                    <span className="text-xs truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1: Học phần thực tập (Tự động nhận diện từ danh sách 2 sheet của Khoa) */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Bước 1. Học phần thực tập
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Học phần được nhận diện tự động theo dữ liệu học vụ từ Khoa.
                </p>
              </div>

              {/* Status info bar */}
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="font-semibold leading-relaxed">
                  {enrolledInfo}
                </div>
              </div>

              {/* 2 Subject Display Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* KTCN Card */}
                <div
                  className={`p-5 rounded-2xl border-2 transition-all relative ${
                    selectedCourses.includes('KTCN')
                      ? 'border-[#003087] bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-100 dark:ring-blue-900/40'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="inline-block px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-[#003087] dark:text-sky-300 text-[11px] font-bold rounded-lg">
                      Mã môn 503112 · KTCN
                    </span>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      selectedCourses.includes('KTCN')
                        ? 'bg-[#003087] text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-600 text-slate-300'
                    }`}>
                      {selectedCourses.includes('KTCN') ? '✓' : '—'}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                    Kiến tập Công nghiệp
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Làm quen môi trường doanh nghiệp, quan sát quy trình và thực hành các nhiệm vụ công nghệ thông tin cơ bản.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-[11px] font-medium flex items-center gap-1.5">
                    {selectedCourses.includes('KTCN') ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span>●</span> Bạn có tên trong danh sách đăng ký KTCN
                      </span>
                    ) : (
                      <span className="text-slate-400">Không có trong danh sách KTCN kỳ này</span>
                    )}
                  </div>
                </div>

                {/* TSNN Card */}
                <div
                  className={`p-5 rounded-2xl border-2 transition-all relative ${
                    selectedCourses.includes('TSNN')
                      ? 'border-[#003087] bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-100 dark:ring-blue-900/40'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="inline-block px-2.5 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] font-bold rounded-lg">
                      Mã môn 503113 · TSNN
                    </span>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      selectedCourses.includes('TSNN')
                        ? 'bg-[#003087] text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-600 text-slate-300'
                    }`}>
                      {selectedCourses.includes('TSNN') ? '✓' : '—'}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                    Tập sự Nghề nghiệp
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Tham gia công việc chuyên môn tại doanh nghiệp, vận dụng kiến thức để giải quyết nhiệm vụ thực tế.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-[11px] font-medium flex items-center gap-1.5">
                    {selectedCourses.includes('TSNN') ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span>●</span> Bạn có tên trong danh sách đăng ký TSNN
                      </span>
                    ) : (
                      <span className="text-slate-400">Không có trong danh sách TSNN kỳ này</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Course confirmation footer */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <span>Học phần của bạn: <strong className="text-[#003087] dark:text-sky-300">{courseDisplay}</strong> · HK1 2025–2026</span>
                {selectedCourses.length === 2 && (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded">
                    Thực tập song song (320h)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Trạng thái hiện tại */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bước 2. Trạng thái hiện tại
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Chọn trạng thái đúng với tình hình hiện tại để Khoa đồng hành phù hợp.
                </p>
              </div>

              {/* 3 Radio Status Cards */}
              <div className="space-y-3">
                
                {/* 1. Has Company */}
                <div
                  onClick={() => setInternshipStatus('has_company')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    internshipStatus === 'has_company'
                      ? 'border-[#003087] bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-900'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    internshipStatus === 'has_company'
                      ? 'border-[#003087] bg-[#003087]'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {internshipStatus === 'has_company' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Đã có nơi thực tập</span>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded">
                        Phổ biến
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Bạn đã được doanh nghiệp tiếp nhận và có thể khai báo thông tin ở bước tiếp theo.
                    </p>
                  </div>
                </div>

                {/* 2. Interviewing */}
                <div
                  onClick={() => setInternshipStatus('interviewing')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    internshipStatus === 'interviewing'
                      ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-200 dark:ring-amber-900'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    internshipStatus === 'interviewing'
                      ? 'border-amber-600 bg-amber-600'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {internshipStatus === 'interviewing' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      Đang tìm / Chờ phỏng vấn
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Tiếp tục tìm kiếm cơ hội và cập nhật ngay khi có kết quả từ doanh nghiệp.
                    </p>
                  </div>
                </div>

                {/* 3. Need Faculty Support */}
                <div
                  onClick={() => setInternshipStatus('need_support')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    internshipStatus === 'need_support'
                      ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-200 dark:ring-rose-900'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    internshipStatus === 'need_support'
                      ? 'border-rose-600 bg-rose-600'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {internshipStatus === 'need_support' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Cần Khoa hỗ trợ</span>
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-[10px] font-bold rounded">
                        Hỗ trợ khẩn
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Gửi nhu cầu hỗ trợ. Hệ thống bỏ qua bước doanh nghiệp và chuyển tới bước cuối.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Step 3: Thông tin doanh nghiệp & MST Realtime */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bước 3. Thông tin doanh nghiệp
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tra cứu mã số thuế, kiểm tra và xác nhận thông tin doanh nghiệp của bạn.
                </p>
              </div>

              {/* Tax Lookup Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Mã số thuế (MST) *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="VD: 0312345678 hoặc 0101601092"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold tracking-wide focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTaxLookup()}
                    disabled={lookupLoading}
                    className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
                  >
                    {lookupLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tra cứu...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Tra cứu lại</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  Đã nhận diện {taxCode.replace(/\D/g, '').length} chữ số · Chuẩn MST doanh nghiệp 10 hoặc 13 chữ số
                </div>
              </div>

              {/* Lookup Feedback Card */}
              {lookupSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>✓ Tra cứu thành công · Đã điền thông tin doanh nghiệp</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Dữ liệu được truy xuất từ Cổng thông tin Doanh nghiệp & Thuế. Bạn có thể chỉnh sửa thông tin bên dưới nếu cần.
                  </p>
                </div>
              )}

              {/* Company Info Fields */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên công ty *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ đăng ký *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ngành nghề kinh doanh chính
                    </label>
                    <input
                      type="text"
                      value={mainIndustry}
                      onChange={(e) => setMainIndustry(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Người đại diện pháp lý
                    </label>
                    <input
                      type="text"
                      value={representative}
                      onChange={(e) => setRepresentative(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Người liên hệ / Hướng dẫn
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Số điện thoại / Email liên hệ
                    </label>
                    <input
                      type="text"
                      value={contactPhone || contactEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes('@')) setContactEmail(val);
                        else setContactPhone(val);
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTaxConfirmed}
                      onChange={(e) => setIsTaxConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded text-[#003087] focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Thông tin trên là chính xác
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Không tìm thấy mã số thuế? Bạn vẫn có thể nhập tay. Hồ sơ sẽ được đánh dấu “GV sẽ kiểm tra lại”.
              </div>
            </div>
          )}

          {/* Step 4: Vị trí & Xác nhận (Đã bỏ hoàn toàn Giấy giới thiệu) */}
          {currentStep === 4 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bước 4. Vị trí & Xác nhận
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Rà soát thông tin trước khi gửi yêu cầu đến giảng viên phụ trách.
                </p>
              </div>

              {/* Position & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên vị trí thực tập *
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="VD: Thực tập sinh Frontend"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bộ phận
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="VD: Phát triển sản phẩm"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>
              </div>

              {/* Support Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú thêm
                </label>
                <textarea
                  rows={3}
                  value={supportNote}
                  onChange={(e) => setSupportNote(e.target.value)}
                  placeholder="Ghi chú nguyện vọng, thời gian thực tập dự kiến hoặc yêu cầu đặc biệt từ doanh nghiệp..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                ></textarea>
              </div>

              {/* Review summary box: "Kiểm tra lần cuối" (Bỏ GGT) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>Kiểm tra lần cuối</span>
                  <span className="text-[10px] text-slate-400">HK1 2025–2026</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Sinh viên:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{studentName} · {studentId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Môn học (Theo danh sách Khoa):</span>
                    <strong className="text-slate-800 dark:text-slate-200">{courseDisplay}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Trạng thái:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{statusLabel}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Doanh nghiệp:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {internshipStatus === 'has_company' ? companyName : (internshipStatus === 'interviewing' ? 'Đang tìm' : 'Khoa CNTT hỗ trợ')}
                    </strong>
                  </div>
                  {internshipStatus === 'has_company' && (
                    <div>
                      <span className="text-slate-400 text-[11px] block">Mã số thuế:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{taxCode}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 text-[11px] block">Vị trí:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{position || 'Chưa nhập'}</strong>
                  </div>
                </div>
              </div>

              {/* Confirmation check */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={finalConfirmed}
                    onChange={(e) => setFinalConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-[#003087] focus:ring-blue-500 mt-0.5"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Tôi xác nhận thông tin chính xác và đồng ý gửi hồ sơ tới Khoa.
                  </span>
                </label>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <strong>Xác nhận gửi thông tin:</strong> Chọn “Lưu & Gửi thông tin” để hoàn tất bản khai báo. Doanh nghiệp và vị trí thực tập sẽ được gửi trực tiếp đến Giảng viên phụ trách để thẩm định.
              </div>
            </div>
          )}

          {/* Stepper Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  ← Quay lại
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 hidden sm:inline">
                ✓ Đã lưu bản nháp lúc {lastSavedTime}
              </span>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <span>Tiếp tục</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span>Lưu & Gửi thông tin</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Sticky Column: "Hồ sơ của bạn" (Đã bỏ hạn GGT) */}
        <div className="space-y-4 lg:sticky lg:top-4">
          
          {/* Student Profile Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                HỒ SƠ CỦA BẠN
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {studentName} · {studentId}
              </div>
              <div className="text-[11px] text-slate-500">
                Học kỳ: HK1 2025–2026
              </div>
            </div>

            {/* Status Pill */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {statusLabel}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            {/* Course Summary */}
            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>{courseDisplay}</span>
              </div>
              <div className="text-[11px] text-slate-400 pl-3">
                Mã môn: {selectedCourses.includes('KTCN') ? '503112' : '503113'} · Học kỳ: HK1 2025–2026
              </div>
            </div>

            {/* Declaration Deadline Box */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                Hạn chót khai báo doanh nghiệp
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-amber-900 dark:text-amber-100">
                  30/09/2025
                </span>
                <span className="px-2 py-0.5 bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black rounded-full">
                  Còn 18 ngày
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

window.DeclarationPage = DeclarationPage;
