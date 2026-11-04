// Declaration Page Component - Chuẩn hóa thiết kế theo quy chuẩn Khoa CNTT - TDTU
// Nghiệp vụ: Lưu và quản lý thông tin khai báo thực tập theo dạng bảng dữ liệu có cấu trúc (tương tự Hồ sơ chứng chỉ tiếng Anh)
// - Danh sách hồ sơ đã nộp với STT, Học phần, Trạng thái, Doanh nghiệp, Vị trí & Mentor, Thời gian thực, Minh chứng Drive, Thao tác CRUD
// - Cho phép xem chi tiết, thêm mới, chỉnh sửa/cập nhật, hoặc xóa/rút hồ sơ
// - Quy trình Wizard phân nhánh thông minh:
//   * Đã có nơi thực tập (3 bước): 1. Trạng thái -> 2. Doanh nghiệp & Mentor -> 3. Vị trí & Xác nhận
//   * Đang tìm / Chờ phỏng vấn (2 bước): 1. Trạng thái -> 2. Kế hoạch tìm kiếm & Xác nhận
//   * Cần Khoa hỗ trợ (2 bước): 1. Trạng thái -> 2. Nguyện vọng & Yêu cầu Khoa hỗ trợ

const DeclarationPage = ({ currentUser, onNavigateTab }) => {
  // Chế độ xem: 'list' (Bảng danh sách hồ sơ đã nộp) hoặc 'form' (Biểu mẫu khai báo/cập nhật 3 bước)
  const [viewMode, setViewMode] = React.useState('list');
  const [currentStep, setCurrentStep] = React.useState(1);
  const [savedDraft, setSavedDraft] = React.useState(null);
  const studentId = String(
    currentUser?.studentId ||
    currentUser?.mssv ||
    (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
    '522H0045'
  ).trim().toUpperCase();
  const studentName = currentUser?.fullName || currentUser?.name || currentUser?.displayName || 'Sinh viên Khoa CNTT';

  // Phân quyền theo Ma trận Prime RBAC: Read (2), Create (3), Update (5), Delete (7)
  const [roleMatrixTick, setRoleMatrixTick] = React.useState(0);
  React.useEffect(() => {
    const handler = () => setRoleMatrixTick(t => t + 1);
    window.addEventListener('tdtu_prime_matrix_updated', handler);
    return () => window.removeEventListener('tdtu_prime_matrix_updated', handler);
  }, []);

  const canRead = React.useMemo(() => {
    if (!window.PrimeRbac?.checkUserPermission) return true;
    return window.PrimeRbac.checkUserPermission(currentUser, 'declaration', 2);
  }, [currentUser, roleMatrixTick]);

  const canCreate = React.useMemo(() => {
    if (!window.PrimeRbac?.checkUserPermission) return true;
    return window.PrimeRbac.checkUserPermission(currentUser, 'declaration', 3);
  }, [currentUser, roleMatrixTick]);

  const canUpdate = React.useMemo(() => {
    if (!window.PrimeRbac?.checkUserPermission) return true;
    return window.PrimeRbac.checkUserPermission(currentUser, 'declaration', 5);
  }, [currentUser, roleMatrixTick]);

  const canDelete = React.useMemo(() => {
    if (!window.PrimeRbac?.checkUserPermission) return true;
    return window.PrimeRbac.checkUserPermission(currentUser, 'declaration', 7);
  }, [currentUser, roleMatrixTick]);

  const isReadOnly = canRead && !canCreate && !canUpdate;

  // Môn học gán cứng từ danh sách Admin import (Sinh viên không chọn)
  const [selectedCourses, setSelectedCourses] = React.useState(['KTCN']);
  const [isDualCourse, setIsDualCourse] = React.useState(false);
  const [enrolledInfo, setEnrolledInfo] = React.useState('Đang đối chiếu dữ liệu danh sách Khoa...');

  // Step 1: Trạng thái ('has_company' | 'interviewing' | 'need_support')
  const [internshipStatus, setInternshipStatus] = React.useState('has_company');

  // Dành riêng cho 'has_company' (Bước 2 & 3)
  const [taxCode, setTaxCode] = React.useState('');
  const [isSearchingTax, setIsSearchingTax] = React.useState(false);
  const [taxCooldown, setTaxCooldown] = React.useState(0);
  const [taxSearchError, setTaxSearchError] = React.useState('');
  const [companyInfo, setCompanyInfo] = React.useState({
    name: '',
    address: '',
    representative: '',
    taxDepartment: '',
    status: '',
    updatedAt: '',
    orgType: '',
  });
  const [taxConfirmed, setTaxConfirmed] = React.useState(false);
  const [contactPerson, setContactPerson] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [position, setPosition] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [finalConfirmed, setFinalConfirmed] = React.useState(false);

  // Dành riêng cho 'interviewing' (Bước 2 rút gọn)
  const [pendingCompany, setPendingCompany] = React.useState('');
  const [interviewProgress, setInterviewProgress] = React.useState('');
  const [interviewCommitment, setInterviewCommitment] = React.useState(false);

  // Dành riêng cho 'need_support' (Bước 2 rút gọn)
  const [supportReason, setSupportReason] = React.useState('Chưa tìm được doanh nghiệp phù hợp với định hướng');
  const [desiredLocation, setDesiredLocation] = React.useState('');
  const [cvDriveLink, setCvDriveLink] = React.useState('');
  const [supportCommitment, setSupportCommitment] = React.useState(false);

  // Chung cho các trường hợp
  const [desiredPosition, setDesiredPosition] = React.useState('');
  const [supportNote, setSupportNote] = React.useState('');

  // UI & Network State
  const [submitting, setSubmitting] = React.useState(false);
  const lastSubmitRef = React.useRef(0);
  const [deleting, setDeleting] = React.useState(false);
  const [message, setMessage] = React.useState(null);
  const [lastSavedTime, setLastSavedTime] = React.useState('');
  const [isEditingExisting, setIsEditingExisting] = React.useState(false);

  // Quản lý Lịch sử mốc thời gian & Các Modal
  const [serverDeclaration, setServerDeclaration] = React.useState(null);
  const [declarationHistory, setDeclarationHistory] = React.useState([]);
  const [showWithdrawConfirmModal, setShowWithdrawConfirmModal] = React.useState(false);
  const [selectedDetailModal, setSelectedDetailModal] = React.useState(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showRulesInfo, setShowRulesInfo] = React.useState(false);

  // Dynamic Stepper Meta theo ngữ cảnh (Đã bỏ hoàn toàn bước Chọn môn học)
  const stepsMeta = React.useMemo(() => {
    if (internshipStatus === 'has_company') {
      return [
        { num: 1, label: 'Trạng thái' },
        { num: 2, label: 'Doanh nghiệp' },
        { num: 3, label: 'Vị trí & Xác nhận' }
      ];
    } else if (internshipStatus === 'interviewing') {
      return [
        { num: 1, label: 'Trạng thái' },
        { num: 2, label: 'Kế hoạch & Xác nhận' }
      ];
    } else {
      return [
        { num: 1, label: 'Trạng thái' },
        { num: 2, label: 'Nguyện vọng & Gửi Khoa' }
      ];
    }
  }, [internshipStatus]);

  // Quản lý đếm ngược cooldown 15s cho nút tra cứu MST
  React.useEffect(() => {
    let timer;
    if (taxCooldown > 0) {
      timer = setInterval(() => {
        setTaxCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [taxCooldown]);

  // Tra cứu MST thực tế qua API xinvoice
  const handleTaxSearch = async () => {
    const cleanTax = (taxCode || '').trim().replace(/\s+/g, '');
    if (!cleanTax || cleanTax.length < 10) {
      setTaxSearchError('Vui lòng nhập Mã số thuế hợp lệ');
      return;
    }
    if (taxCooldown > 0 || isSearchingTax) {
      return;
    }

    setTaxSearchError('');
    setIsSearchingTax(true);

    try {
      if (window.ApiClient?.lookupTaxCode) {
        try {
          const res = await window.ApiClient.lookupTaxCode(cleanTax);
          if (res?.data && res.data.name) {
            setCompanyInfo({
              name: res.data.name || '',
              address: res.data.address || '',
              representative: res.data.representative || res.data.legalRep || '',
              taxDepartment: res.data.taxDepartment || '',
              status: res.data.status || 'NNT đang hoạt động',
              updatedAt: res.data.updatedAt || '',
              orgType: res.data.orgType || '',
            });
            setTaxConfirmed(true);
            setTaxCooldown(15);
            setIsSearchingTax(false);
            return;
          }
        } catch (apiErr) {
          console.warn('[ApiClient Tax Lookup] fallback direct fetch:', apiErr);
        }
      }

      const response = await fetch(`https://api.xinvoice.vn/gdt-api/tax-payer/${encodeURIComponent(cleanTax)}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Mã số thuế chưa có trên CSDL trực tuyến. Bạn có thể tự điền thông tin doanh nghiệp bên dưới.');
        }
        throw new Error(`Tra cứu thất bại (Mã lỗi: ${response.status})`);
      }
      const data = await response.json();

      if (!data || !data.name) {
        throw new Error('Không tìm thấy thông tin doanh nghiệp cho Mã số thuế này. Bạn có thể tự điền tên công ty bên dưới.');
      }

      setCompanyInfo({
        name: data.name || '',
        address: data.address || '',
        representative: data.legalRep || data.representative || '',
        taxDepartment: data.taxDepartment || '',
        status: data.status || 'NNT đang hoạt động',
        updatedAt: data.updatedAt || '',
        orgType: data.orgType || '',
      });
      setTaxConfirmed(true);
      setTaxCooldown(15);
    } catch (err) {
      console.error('[xinvoice API] Error:', err);
      setTaxSearchError(err.message || 'Không thể tra cứu thông tin MST. Vui lòng tự điền thông tin bên dưới.');
      setTaxCooldown(5);
    } finally {
      setIsSearchingTax(false);
    }
  };

  // 1. Nhận diện môn học gán cứng từ danh sách Admin import (Chuẩn hóa cho cả KTCN, TSNN và Song song KTCN + TSNN)
  React.useEffect(() => {
    let isMounted = true;

    const extractCoursesFromRecord = (found: any) => {
      const cArr = Array.isArray(found.courses) ? found.courses.map((c: any) => String(c).toUpperCase()) : [];
      const cCode = String(found.courseCode || found.course_str || found.courseName || found['Môn học'] || found['Học phần'] || '').toUpperCase();
      const hasKtcn = cArr.some((c: string) => c.includes('KTCN') || c.includes('KIẾN TẬP')) || cCode.includes('KTCN') || cCode.includes('KIẾN TẬP') || found.ktcnEnrolled === 1 || found.ktcnEnrolled === true;
      const hasTsnn = cArr.some((c: string) => c.includes('TSNN') || c.includes('TẬP SỰ') || c.includes('DỰ ÁN')) || cCode.includes('TSNN') || cCode.includes('TẬP SỰ') || cCode.includes('DỰ ÁN') || found.tsnnEnrolled === 1 || found.tsnnEnrolled === true;
      if ((hasKtcn && hasTsnn) || found.isDualCourse === true || found.isDualCourse === 1 || cCode.includes('SONG SONG')) {
        return { isDual: true, courses: ['KTCN', 'TSNN'] };
      }
      if (hasTsnn && !hasKtcn) {
        return { isDual: false, courses: ['TSNN'] };
      }
      return { isDual: false, courses: ['KTCN'] };
    };

    const fetchStudentEnrolledCourse = async () => {
      try {
        let enrolledCourses: string[] = [];
        let isDual = false;
        let majorStr = '';
        const normSid = String(studentId || '').trim().toUpperCase();

        // Ưu tiên 1: Tìm trong danh sách sinh viên thực tế (getLiveStudents)
        if (window.ApiClient?.getLiveStudents) {
          try {
            const list = await window.ApiClient.getLiveStudents('hk1_2026_2027');
            const found = (list || []).find((s: any) => String(s.mssv || s.studentId || s.id || '').trim().toUpperCase() === normSid);
            if (found) {
              const extracted = extractCoursesFromRecord(found);
              isDual = extracted.isDual;
              enrolledCourses = extracted.courses;
              majorStr = found.major ? ` · Chuyên ngành: ${found.major}` : '';
            }
          } catch {}
        }

        // Ưu tiên 2: Tra cứu trực tiếp từ helper getStudentEnrolledCourse (quét toàn bộ học kỳ trong LocalStorage)
        if (enrolledCourses.length === 0 && window.ApiClient?.getStudentEnrolledCourse) {
          const courseData = window.ApiClient.getStudentEnrolledCourse(normSid);
          if (courseData) {
            const extracted = extractCoursesFromRecord(courseData);
            isDual = extracted.isDual;
            enrolledCourses = extracted.courses;
            if (courseData.major && !majorStr) majorStr = ` · Chuyên ngành: ${courseData.major}`;
          }
        }

        // Ưu tiên 3: Tra cứu trực tiếp từ Cloud Firestore tdtu_students nếu chưa có trong bộ nhớ đệm
        if (enrolledCourses.length === 0 && window.FirebaseService?.db) {
          try {
            const doc = await window.FirebaseService.db.collection('tdtu_students').doc(normSid).get();
            if (doc.exists) {
              const docData = doc.data();
              const extracted = extractCoursesFromRecord(docData);
              isDual = extracted.isDual;
              enrolledCourses = extracted.courses;
              if (docData?.major && !majorStr) majorStr = ` · Chuyên ngành: ${docData.major}`;
            }
          } catch {}
        }

        // Ưu tiên 4: Fallback từ thông tin phiên đăng nhập currentUser
        if (enrolledCourses.length === 0) {
          if (currentUser) {
            const extracted = extractCoursesFromRecord(currentUser);
            isDual = extracted.isDual;
            enrolledCourses = extracted.courses;
          } else {
            isDual = false;
            enrolledCourses = ['KTCN'];
          }
        }

        if (isMounted) {
          setSelectedCourses(enrolledCourses);
          setIsDualCourse(isDual);
          const txt = isDual 
            ? 'Phân bổ chính thức: KTCN-TSNN'
            : enrolledCourses.includes('TSNN')
              ? 'Phân bổ chính thức: TSNN'
              : 'Phân bổ chính thức: KTCN';
          setEnrolledInfo(txt + majorStr);
        }
      } catch (err) {
        console.warn('Cannot resolve enrolled course:', err);
      }
    };

    fetchStudentEnrolledCourse();
    window.addEventListener('tdtu_data_updated', fetchStudentEnrolledCourse);
    window.addEventListener('storage', fetchStudentEnrolledCourse);
    return () => {
      isMounted = false;
      window.removeEventListener('tdtu_data_updated', fetchStudentEnrolledCourse);
      window.removeEventListener('storage', fetchStudentEnrolledCourse);
    };
  }, [studentId, currentUser]);

  // 2. Khôi phục hồ sơ đã nộp từ Server hoặc localStorage
  const loadExistingOrDraft = React.useCallback(async () => {
    let decl = null;
    try {
      if (window.ApiClient?.getStudentDeclaration) {
        decl = window.ApiClient.getStudentDeclaration(studentId);
      }
      if (!decl && window.ApiClient?.getDeclaration) {
        const res = await window.ApiClient.getDeclaration(studentId);
        if (res?.data) decl = res.data;
      }
    } catch (err) {
      console.warn('Cannot fetch remote declaration, using fallback draft:', err);
    }

    if (decl) {
      setIsEditingExisting(true);
      setServerDeclaration(decl);
      let hist = [];
      if (decl.history && Array.isArray(decl.history)) {
        hist = decl.history;
      } else if (decl.declarationHistory) {
        try { hist = JSON.parse(decl.declarationHistory); } catch {}
      }
      setDeclarationHistory(hist);
      if (decl.internshipStatus) {
        setInternshipStatus(decl.internshipStatus);
      } else if (decl.noCompanyOption === 'faculty') {
        setInternshipStatus('need_support');
      } else if (decl.noCompanyOption === 'self') {
        setInternshipStatus('interviewing');
      } else if (decl.companyName && !decl.companyName.includes('hỗ trợ') && !decl.companyName.includes('Đang tìm')) {
        setInternshipStatus('has_company');
      }

      setTaxCode(decl.taxCode || '');
      setCompanyInfo({
        name: decl.companyName || '',
        address: decl.address || '',
        representative: decl.representative || '',
        taxDepartment: decl.taxDepartment || '',
        status: decl.companyStatus || (decl.companyName ? 'NNT đang hoạt động' : ''),
        updatedAt: decl.taxUpdatedAt || '',
        orgType: decl.orgType || '',
      });

      if (decl.contactPerson) setContactPerson(decl.contactPerson);
      if (decl.contactPhone) setContactPhone(decl.contactPhone);

      const isDeclComp = decl.internshipStatus === 'has_company';
      if (isDeclComp) {
        setPosition(decl.position || '');
        setDesiredPosition('');
      } else {
        // Trạng thái đang chờ hoặc cần hỗ trợ: Xóa sạch vị trí của doanh nghiệp cũ
        setPosition('');
        const cleanDesired = (decl.desiredPosition && !decl.desiredPosition.includes('Fullstack') && !decl.desiredPosition.includes('NodeJS')) ? decl.desiredPosition : '';
        setDesiredPosition(cleanDesired);
        if (decl.position && (decl.position.includes('Fullstack') || decl.position.includes('NodeJS') || decl.position === 'Thực tập sinh')) {
          decl.position = decl.internshipStatus === 'need_support' ? 'Chờ Khoa phân bổ' : 'Đang tìm kiếm / Chờ PV';
        }
      }
      if (decl.department) setDepartment(decl.department);
      if (decl.supportReason) setSupportReason(decl.supportReason);
      if (decl.desiredLocation) setDesiredLocation(decl.desiredLocation);
      if (decl.cvDriveLink) setCvDriveLink(decl.cvDriveLink);
      if (decl.pendingCompany) setPendingCompany(decl.pendingCompany);
      if (decl.interviewProgress) setInterviewProgress(decl.interviewProgress);

      if (decl.supportNote) {
        let cleanNote = decl.supportNote;
        if (cleanNote.includes(' - Ghi chú: ')) {
          cleanNote = cleanNote.split(' - Ghi chú: ').pop();
        } else if (cleanNote.startsWith('Lý do: ')) {
          cleanNote = '';
        }
        setSupportNote(cleanNote.trim());
      }

      setTaxConfirmed(Boolean(decl.companyName));
      setFinalConfirmed(Boolean(decl.isConfirmed));
      return;
    }

    // Khôi phục bản nháp nếu chưa có hồ sơ nộp
    try {
      const raw = localStorage.getItem('tdtu_decl_draft_' + studentId);
      if (raw) {
        const d = JSON.parse(raw);
        setSavedDraft(d);
        if (d.currentStep && d.currentStep <= 3) setCurrentStep(d.currentStep);
        if (d.internshipStatus) setInternshipStatus(d.internshipStatus);
        if (d.taxCode) setTaxCode(d.taxCode);
        if (d.companyInfo) setCompanyInfo(d.companyInfo);
        if (d.contactPerson) setContactPerson(d.contactPerson);
        if (d.contactPhone) setContactPhone(d.contactPhone);
        if (d.position) setPosition(d.position);
        if (d.department) setDepartment(d.department);
        if (d.supportReason) setSupportReason(d.supportReason);
        if (d.pendingCompany) setPendingCompany(d.pendingCompany);
        if (d.desiredPosition) setDesiredPosition(d.desiredPosition);
        if (d.desiredLocation) setDesiredLocation(d.desiredLocation);
        if (d.cvDriveLink) setCvDriveLink(d.cvDriveLink);
        if (d.supportNote) setSupportNote(d.supportNote);
        if (d.taxConfirmed) setTaxConfirmed(d.taxConfirmed);
        if (d.finalConfirmed) setFinalConfirmed(d.finalConfirmed);
        if (d.interviewCommitment) setInterviewCommitment(d.interviewCommitment);
        if (d.supportCommitment) setSupportCommitment(d.supportCommitment);
        if (d.savedAt) setLastSavedTime(d.savedAt);
      }
    } catch {}
  }, [studentId]);

  React.useEffect(() => {
    loadExistingOrDraft();
    if (window.ApiClient?.getStudentCvLink) {
      const cv = window.ApiClient.getStudentCvLink(studentId);
      if (cv) setCvDriveLink(cv);
    }
  }, [loadExistingOrDraft, studentId]);

  // Navigation handlers
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!internshipStatus) {
        alert('Vui lòng chọn trạng thái của bạn!');
        return;
      }
      setCurrentStep(2);
      saveDraft({ currentStep: 2 });
    } else if (currentStep === 2) {
      if (internshipStatus === 'has_company') {
        if (!companyInfo.name || !companyInfo.name.trim()) {
          alert('Vui lòng nhập tên công ty hoặc tra cứu mã số thuế doanh nghiệp!');
          return;
        }
        if (!contactPerson || !contactPerson.trim()) {
          alert('Vui lòng nhập Họ và tên cán bộ hướng dẫn (Mentor) tại doanh nghiệp!');
          return;
        }
        if (!contactPhone || !contactPhone.trim()) {
          alert('Vui lòng nhập Số điện thoại cán bộ hướng dẫn!');
          return;
        }
        if (!taxConfirmed) {
          alert('Vui lòng tích chọn cam kết xác nhận thông tin doanh nghiệp và cán bộ hướng dẫn phía dưới!');
          return;
        }
        setCurrentStep(3);
        saveDraft({ currentStep: 3 });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveDraft({ currentStep: prev });
    }
  };

  // Submit cho trường hợp "Đang tìm / Chờ phỏng vấn"
  const handleSubmitInterviewing = async () => {
    const clickNow = Date.now();
    if (submitting || (clickNow - lastSubmitRef.current < 4000)) {
      return;
    }
    lastSubmitRef.current = clickNow;

    if (isEditingExisting && !canUpdate) {
      setMessage({ type: 'error', text: 'Tài khoản của bạn không có quyền Sửa (Update - Mã 5) hồ sơ khai báo.' });
      return;
    }
    if (!isEditingExisting && !canCreate) {
      setMessage({ type: 'error', text: 'Tài khoản của bạn không có quyền Thêm (Create - Mã 3) hồ sơ khai báo mới.' });
      return;
    }
    if (!desiredPosition.trim()) {
      alert('Vui lòng nhập định hướng / vị trí thực tập mục tiêu!');
      return;
    }
    if (!interviewCommitment) {
      alert('Vui lòng tích chọn xác nhận cam kết tự tìm kiếm nơi thực tập và cập nhật kết quả khi trúng tuyển!');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        studentId,
        studentName,
        selectedCourses,
        isDualCourse,
        internshipStatus: 'interviewing',
        noCompanyOption: 'self',
        companyName: pendingCompany.trim() || 'Đang chờ phỏng vấn / kết quả tuyển dụng',
        taxCode: '',
        address: '',
        representative: '',
        contactPerson: '',
        contactPhone: '',
        position: desiredPosition.trim() || (pendingCompany.trim() ? `Ứng tuyển: ${pendingCompany.trim()}` : 'Đang tìm kiếm / Chờ PV'),
        desiredPosition: desiredPosition.trim(),
        department: '',
        pendingCompany: pendingCompany.trim(),
        interviewProgress: interviewProgress.trim(),
        supportNote: supportNote.trim(),
        isConfirmed: true
      };

      const res = await window.ApiClient.declareInternship(payload);
      if (res?.data?.declaration) {
        setServerDeclaration(res.data.declaration);
        if (res.data.declaration.declarationHistory) {
          try {
            const parsed = typeof res.data.declaration.declarationHistory === 'string'
              ? JSON.parse(res.data.declaration.declarationHistory)
              : res.data.declaration.declarationHistory;
            setDeclarationHistory(parsed);
          } catch {}
        }
      }
      window.dispatchEvent(new CustomEvent('tdtu_decl_updated', { detail: payload }));
      window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: payload }));
      setMessage({
        type: 'success',
        text: '✓ Đã cập nhật trạng thái "Đang tìm / Chờ phỏng vấn" thành công tới Khoa CNTT!'
      });
      try {
        localStorage.removeItem('tdtu_decl_draft_' + studentId);
      } catch {}
      setViewMode('list');
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Không thể lưu trạng thái. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit cho trường hợp "Cần Khoa hỗ trợ"
  const handleSubmitNeedSupport = async () => {
    const clickNow = Date.now();
    if (submitting || (clickNow - lastSubmitRef.current < 4000)) {
      return;
    }
    lastSubmitRef.current = clickNow;

    if (isReadOnly) {
      setMessage({ type: 'error', text: 'Tài khoản của bạn chỉ có quyền Xem (Mã 22), không có quyền nộp hồ sơ khai báo.' });
      return;
    }
    if (!desiredPosition.trim()) {
      alert('Vui lòng nhập định hướng / vị trí mong muốn thực tập để Khoa phân bổ doanh nghiệp phù hợp!');
      return;
    }
    if (!supportCommitment) {
      alert('Vui lòng tích chọn xác nhận cam kết tham gia phỏng vấn nghiêm túc theo điều phối của Khoa!');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        studentId,
        studentName,
        selectedCourses,
        isDualCourse,
        internshipStatus: 'need_support',
        noCompanyOption: 'faculty',
        companyName: 'Khoa CNTT hỗ trợ',
        taxCode: '',
        address: '',
        representative: '',
        contactPerson: '',
        contactPhone: '',
        position: desiredPosition.trim() || 'Chờ Khoa phân bổ',
        department: '',
        supportReason: supportReason.trim(),
        desiredLocation: desiredLocation.trim(),
        cvDriveLink: cvDriveLink.trim(),
        supportNote: supportNote.trim(),
        isConfirmed: true
      };

      const res = await window.ApiClient.declareInternship(payload);
      if (res?.data?.declaration) {
        setServerDeclaration(res.data.declaration);
        if (res.data.declaration.declarationHistory) {
          try {
            const parsed = typeof res.data.declaration.declarationHistory === 'string'
              ? JSON.parse(res.data.declaration.declarationHistory)
              : res.data.declaration.declarationHistory;
            setDeclarationHistory(parsed);
          } catch {}
        }
      }
      window.dispatchEvent(new CustomEvent('tdtu_decl_updated', { detail: payload }));
      window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: payload }));
      setMessage({
        type: 'success',
        text: '✓ Đã gửi yêu cầu hỗ trợ tới Khoa CNTT thành công! Thầy/Cô Trợ lý Doanh nghiệp sẽ liên hệ sắp xếp lịch phỏng vấn cho bạn.'
      });
      try {
        localStorage.removeItem('tdtu_decl_draft_' + studentId);
      } catch {}
      setViewMode('list');
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit cho trường hợp "Đã có nơi thực tập"
  const handleSubmitFinal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isReadOnly) {
      setMessage({ type: 'error', text: 'Tài khoản của bạn chỉ có quyền Xem (Mã 22), không có quyền nộp hồ sơ khai báo.' });
      return;
    }
    if (!position.trim()) {
      alert('Vui lòng nhập tên vị trí thực tập chính thức!');
      return;
    }
    if (!finalConfirmed) {
      alert('Vui lòng xác nhận cam kết tính chính xác của toàn bộ thông tin đã khai báo!');
      return;
    }

    const wasNeedSupportBefore = Boolean(
      serverDeclaration && (
        serverDeclaration.internshipStatus === 'need_support' ||
        serverDeclaration.noCompanyOption === 'faculty' ||
        (serverDeclaration.companyName && serverDeclaration.companyName.includes('hỗ trợ'))
      )
    );

    if (wasNeedSupportBefore) {
      setShowWithdrawConfirmModal(true);
      return;
    }

    await doSubmitFinal();
  };

  const doSubmitFinal = async () => {
    const clickNow = Date.now();
    if (submitting || (clickNow - lastSubmitRef.current < 4000)) {
      return;
    }
    lastSubmitRef.current = clickNow;

    setSubmitting(true);
    setMessage(null);

    try {
      const wasFacultySupport = Boolean(
        serverDeclaration && (
          serverDeclaration.internshipStatus === 'need_support' ||
          serverDeclaration.noCompanyOption === 'faculty' ||
          (serverDeclaration.companyName && serverDeclaration.companyName.includes('hỗ trợ'))
        )
      );

      const payload = {
        studentId,
        studentName,
        selectedCourses,
        isDualCourse,
        internshipStatus: 'has_company',
        hasChangedFromSupport: wasFacultySupport ? 1 : (serverDeclaration?.hasChangedFromSupport || 0),
        noCompanyOption: null,
        companyName: companyInfo.name || '',
        taxCode: taxCode,
        address: companyInfo.address,
        representative: companyInfo.representative,
        contactPerson: contactPerson,
        contactPhone: contactPhone,
        taxDepartment: companyInfo.taxDepartment || '',
        companyStatus: companyInfo.status || '',
        orgType: companyInfo.orgType || '',
        taxUpdatedAt: companyInfo.updatedAt || '',
        position,
        department,
        supportNote,
        isConfirmed: finalConfirmed
      };

      const sid = String(studentId || '').trim().toUpperCase();
      try {
        localStorage.setItem('tdtu_decl_' + sid, JSON.stringify(payload));
        localStorage.setItem('tdtu_decl_last_sync', String(Date.now()));

        const updateCachedList = (key: string) => {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const idx = list.findIndex((s: any) => String(s.mssv || s.studentId).toUpperCase() === sid);
              if (idx !== -1) {
                list[idx].company = payload.companyName;
                list[idx].companyName = payload.companyName;
                list[idx].taxCode = payload.taxCode;
                list[idx].position = payload.position;
                list[idx].contactPerson = payload.contactPerson;
                list[idx].contactPhone = payload.contactPhone;
                list[idx].mentorName = payload.contactPerson;
                list[idx].mentorPhone = payload.contactPhone;
                list[idx].address = payload.address;
                list[idx].companyAddress = payload.address;
                list[idx].representative = payload.representative;
                list[idx].status = 'Có doanh nghiệp';
                list[idx].noCompanyOption = null;
                if (wasFacultySupport) {
                  list[idx].hasChangedFromSupport = 1;
                }
                list[idx].declarationData = payload;
                list[idx].updated = new Date().toLocaleDateString('vi-VN');
                localStorage.setItem(key, JSON.stringify(list));
              }
            }
          }
        };
        updateCachedList('tdtu_imported_students_hk1_2026_2027');
        updateCachedList('tdtu_live_students');
      } catch {}

      if (window.FirebaseService?.db) {
        try {
          window.FirebaseService.db.collection('tdtu_declarations').doc(sid).set(payload, { merge: true });
          window.FirebaseService.db.collection('tdtu_students').doc(sid).set({
            company: payload.companyName,
            companyName: payload.companyName,
            taxCode: payload.taxCode,
            position: payload.position,
            contactPerson: payload.contactPerson,
            contactPhone: payload.contactPhone,
            mentorName: payload.contactPerson,
            mentorPhone: payload.contactPhone,
            address: payload.address,
            companyAddress: payload.address,
            representative: payload.representative,
            status: 'Có doanh nghiệp',
            noCompanyOption: null,
            hasChangedFromSupport: wasFacultySupport ? 1 : (serverDeclaration?.hasChangedFromSupport || 0),
            declarationData: payload,
            updated: new Date().toLocaleDateString('vi-VN')
          }, { merge: true });
        } catch {}
      }

      const res = await window.ApiClient.declareInternship(payload);
      if (res?.data?.declaration) {
        setServerDeclaration(res.data.declaration);
        if (res.data.declaration.declarationHistory) {
          try {
            const parsed = typeof res.data.declaration.declarationHistory === 'string'
              ? JSON.parse(res.data.declaration.declarationHistory)
              : res.data.declaration.declarationHistory;
            setDeclarationHistory(parsed);
          } catch {}
        }
      }
      window.dispatchEvent(new CustomEvent('tdtu_decl_updated', { detail: payload }));
      window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: payload }));
      setMessage({
        type: 'success',
        text: 'Chúc mừng! Hồ sơ khai báo thực tập của bạn đã được ghi nhận thành công và cập nhật mốc thời gian tới Khoa CNTT.'
      });
      try {
        localStorage.removeItem('tdtu_decl_draft_' + studentId);
      } catch {}
      setViewMode('list');
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Không thể lưu hồ sơ khai báo. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa / Rút hồ sơ khai báo
  const handleDeleteDeclaration = async () => {
    setDeleting(true);
    setMessage(null);
    try {
      if (window.ApiClient?.deleteDeclaration) {
        await window.ApiClient.deleteDeclaration(studentId);
      } else {
        localStorage.removeItem('tdtu_decl_' + studentId);
        localStorage.removeItem('tdtu_decl_draft_' + studentId);
      }
      setServerDeclaration(null);
      setDeclarationHistory([]);
      setIsEditingExisting(false);
      setShowDeleteModal(false);
      setMessage({
        type: 'success',
        text: 'Đã xóa / rút hồ sơ khai báo thực tập thành công. Bạn có thể tiến hành khai báo mới bất kỳ lúc nào.'
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.message || 'Không thể xóa hồ sơ. Vui lòng thử lại.'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Mốc thời gian thực tế sinh viên nộp / cập nhật hồ sơ
  const actualSubmissionTime = React.useMemo(() => {
    if (serverDeclaration?.updatedAt) {
      return new Date(serverDeclaration.updatedAt).toLocaleString('vi-VN');
    }
    if (serverDeclaration?.createdAt) {
      return new Date(serverDeclaration.createdAt).toLocaleString('vi-VN');
    }
    if (declarationHistory && declarationHistory.length > 0) {
      const last = declarationHistory[declarationHistory.length - 1];
      if (last?.timestamp) return new Date(last.timestamp).toLocaleString('vi-VN');
    }
    return null;
  }, [serverDeclaration, declarationHistory]);

  const courseDisplay = isDualCourse || selectedCourses.length === 2
    ? 'KTCN-TSNN'
    : selectedCourses.includes('TSNN')
      ? 'TSNN'
      : 'KTCN';

  const statusLabel = internshipStatus === 'has_company'
    ? 'Đã có nơi thực tập'
    : internshipStatus === 'interviewing'
      ? 'Đang tìm / Chờ phỏng vấn'
      : 'Cần Khoa hỗ trợ';

  const saveDraft = (overrides = {}) => {
    try {
      const draft = {
        studentId,
        currentStep: overrides.currentStep || currentStep,
        internshipStatus: overrides.internshipStatus || internshipStatus,
        taxCode,
        companyInfo,
        contactPerson,
        contactPhone,
        position,
        department,
        supportReason,
        pendingCompany,
        desiredPosition,
        desiredLocation,
        cvDriveLink,
        supportNote,
        taxConfirmed,
        finalConfirmed,
        interviewCommitment,
        supportCommitment,
        savedAt: new Date().toLocaleTimeString('vi-VN'),
      };
      localStorage.setItem('tdtu_decl_draft_' + studentId, JSON.stringify(draft));
      setLastSavedTime(draft.savedAt);
      setSavedDraft(draft);
    } catch {}
  };

  // Chuẩn bị danh sách hồ sơ cho Bảng (Table records)
  const activeDeclarationList = React.useMemo(() => {
    const list = [];
    if (serverDeclaration || (companyInfo.name && isEditingExisting)) {
      list.push({
        id: serverDeclaration?.id || `dec-${studentId}`,
        stt: 1,
        isCurrent: true,
        courseCode: isDualCourse ? 'KTCN-TSNN' : selectedCourses.includes('TSNN') ? 'TSNN' : 'KTCN',
        courseName: courseDisplay,
        status: internshipStatus,
        statusLabel: statusLabel,
        companyName: internshipStatus === 'has_company'
          ? (companyInfo.name || (serverDeclaration?.internshipStatus === 'has_company' ? serverDeclaration?.companyName : '') || 'Doanh nghiệp đã khai báo')
          : internshipStatus === 'need_support'
            ? 'Khoa CNTT hỗ trợ điều phối'
            : (pendingCompany || (serverDeclaration?.internshipStatus === 'interviewing' ? serverDeclaration?.pendingCompany : '') || 'Đang tìm kiếm / Chờ PV'),
        taxCode: internshipStatus === 'has_company' ? (taxCode || (serverDeclaration?.internshipStatus === 'has_company' ? serverDeclaration?.taxCode : '') || '') : '',
        mentor: internshipStatus === 'has_company'
          ? (() => {
              const raw = contactPerson || (serverDeclaration?.internshipStatus === 'has_company' ? serverDeclaration?.contactPerson : '') || 'Chưa chỉ định';
              return raw.split('·')[0].split('(')[0].trim() || 'Chưa chỉ định';
            })()
          : internshipStatus === 'need_support'
            ? 'Trợ lý Doanh nghiệp Khoa CNTT'
            : 'Chờ kết quả phỏng vấn',
        position: (() => {
          if (internshipStatus === 'has_company') {
            return position || (serverDeclaration?.internshipStatus === 'has_company' ? serverDeclaration?.position : '') || 'Thực tập sinh';
          }
          if (internshipStatus === 'need_support') {
            const pos = desiredPosition || (serverDeclaration?.internshipStatus === 'need_support' ? (serverDeclaration?.desiredPosition || serverDeclaration?.position) : '');
            return (pos && !pos.includes('Fullstack') && !pos.includes('NodeJS')) ? pos : 'Chờ Khoa phân bổ';
          }
          // interviewing
          const pos = desiredPosition || (serverDeclaration?.internshipStatus === 'interviewing' ? (serverDeclaration?.desiredPosition || serverDeclaration?.position) : '');
          if (pos && !pos.includes('Fullstack') && !pos.includes('NodeJS')) return pos;
          if (pendingCompany) return `Ứng tuyển: ${pendingCompany}`;
          return 'Đang tìm kiếm / Chờ PV';
        })(),
        submissionTime: actualSubmissionTime || new Date().toLocaleString('vi-VN'),
        receiptId: `KBTT-${studentId}-20261`,
        cvDriveLink: cvDriveLink || serverDeclaration?.cvDriveLink || '',
        supportReason: supportReason || serverDeclaration?.supportReason || '',
        desiredLocation: desiredLocation || serverDeclaration?.desiredLocation || '',
        supportNote: supportNote || serverDeclaration?.supportNote || '',
        address: companyInfo.address || serverDeclaration?.address || '',
        representative: companyInfo.representative || serverDeclaration?.representative || '',
        taxDepartment: companyInfo.taxDepartment || serverDeclaration?.taxDepartment || '',
      });
    }
    return list;
  }, [serverDeclaration, companyInfo, isEditingExisting, isDualCourse, selectedCourses, courseDisplay, internshipStatus, statusLabel, studentId, taxCode, contactPerson, contactPhone, position, desiredPosition, actualSubmissionTime, cvDriveLink, supportReason, desiredLocation, supportNote, pendingCompany]);

  if (!canRead) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn">
        <div className="p-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-white text-[#dc2626] border border-[#fecaca] flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-6 h-6 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-900 ">
            Giới hạn quyền truy cập: Chưa được cấp quyền Xem (Read)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            Tài khoản của bạn (<strong>{currentUser?.email || studentId}</strong>) chưa được kích hoạt quyền <strong>Xem (Read - Mã 2)</strong> đối với chức năng Khai báo thực tập theo Ma trận phân quyền Prime RBAC của Khoa CNTT.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('dashboard')}
              className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              ← Quay về Trang tổng quan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12">
      
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1f2937]">
            Hồ sơ khai báo thực tập của tôi
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {viewMode === 'form' ? (
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span>
              <span>Xem danh sách hồ sơ</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={serverDeclaration ? !canUpdate : !canCreate}
              onClick={() => {
                if (serverDeclaration && !canUpdate) {
                  alert('Tài khoản của bạn chưa được cấp quyền Cập nhật (Update - Mã 5) hồ sơ khai báo.');
                  return;
                }
                if (!serverDeclaration && !canCreate) {
                  alert('Tài khoản của bạn chưa được cấp quyền Thêm mới (Create - Mã 3) hồ sơ khai báo.');
                  return;
                }
                setViewMode('form');
                setCurrentStep(1);
              }}
              className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 ${
                (serverDeclaration ? !canUpdate : !canCreate)
                  ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed opacity-60'
                  : 'bg-[#003087] hover:bg-[#002266] cursor-pointer'
              }`}
              title={serverDeclaration ? (!canUpdate ? 'Chưa có quyền Sửa (Update)' : 'Cập nhật nơi thực tập') : (!canCreate ? 'Chưa có quyền Thêm (Create)' : 'Khai báo nơi thực tập mới')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{serverDeclaration ? 'Cập nhật nơi thực tập' : 'Khai báo nơi thực tập mới'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Alert Notification */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-bold">{message.type === 'success' ? '✓' : '!'}</span>
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="font-bold underline ml-4 cursor-pointer text-slate-600 dark:text-slate-300">
            Đóng
          </button>
        </div>
      )}

      {/* Hero Overview Card (Chuẩn nhận diện TDTU - Tương tự Chứng chỉ ngoại ngữ) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#003087] to-[#001f5c] text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-wider text-sky-200 uppercase">
              <span>Học kỳ HK1 2026–2027 · Khoa CNTT - ĐH Tôn Đức Thắng</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">
              Sinh viên: {studentName} ({studentId})
            </h2>
            <div className="text-xs text-sky-100 max-w-2xl leading-relaxed flex items-center gap-2 flex-wrap">
              <span>Học phần:</span>
              <strong className="text-white font-bold">{courseDisplay}</strong>
              
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/15 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-black text-amber-300">
                {activeDeclarationList.length}
              </div>
              <div className="text-[11px] text-sky-100 font-medium">
                Hồ sơ đã nộp
              </div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-sm md:text-base font-black text-emerald-300">
                {serverDeclaration ? (
                  internshipStatus === 'has_company' ? 'Đã có nơi TT' : internshipStatus === 'interviewing' ? 'Đang ứng tuyển' : 'Cần Khoa hỗ trợ'
                ) : (
                  'Chưa nộp'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: BẢNG DANH SÁCH HỒ SƠ ĐÃ NỘP (THEO ĐÚNG MẪU NGƯỜI DÙNG YÊU CẦU) */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          
          {/* Card Table Header */}
          <div className="p-5 border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1f2937] flex items-center gap-2">
                <span>Hồ sơ khai báo thực tập đã nộp</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ebf3ff] text-[#003087]">
                  {activeDeclarationList.length} hồ sơ
                </span>
              </h3>
            </div>
          </div>

          {/* Table Content or Empty State */}
          {activeDeclarationList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-14 h-14 rounded-xl bg-[#ebf3ff] text-[#003087] flex items-center justify-center mx-auto mb-3 border border-[#bfdbfe]">
                <svg className="w-6 h-6 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Bạn chưa khai báo thông tin nơi thực tập nào
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                Hệ thống ghi nhận bạn đã được phân bổ học phần <strong>{courseDisplay}</strong>. Nhấn nút "Khai báo nơi thực tập ngay" bên dưới để đăng ký nơi thực tập hoặc đề xuất Khoa hỗ trợ.
              </p>
              <button
                type="button"
                disabled={!canCreate}
                onClick={() => {
                  if (!canCreate) {
                    alert('Tài khoản của bạn chưa được cấp quyền Thêm mới (Create - Mã 3) hồ sơ khai báo.');
                    return;
                  }
                  setViewMode('form');
                  setCurrentStep(1);
                }}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition ${
                  !canCreate
                    ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed opacity-60'
                    : 'bg-[#003087] hover:bg-[#002266] cursor-pointer'
                }`}
              >
                + Khai báo nơi thực tập ngay
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1f2937]">
                <thead className="bg-[#f8fafc] text-xs font-bold uppercase text-[#1f2937] border-b border-[#e5e7eb]">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    <th className="py-3.5 px-4">Học phần</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4">Doanh nghiệp</th>
                    <th className="py-3.5 px-4">Vị trí</th>
                    <th className="py-3.5 px-4">Người hướng dẫn</th>
                    <th className="py-3.5 px-4 text-center">Link CV</th>
                    <th className="py-3.5 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                  {activeDeclarationList.map((row) => {
                    const hasDrive = row.cvDriveLink && (row.cvDriveLink.startsWith('http://') || row.cvDriveLink.startsWith('https://'));
                    
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition">
                        
                        {/* STT */}
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                          {row.stt}
                        </td>

                        {/* Học phần */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold border inline-block bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 w-fit">
                              {row.courseCode}
                            </span>
                            
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border inline-block ${
                            row.status === 'has_company'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : row.status === 'interviewing'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}>
                            {row.statusLabel}
                          </span>
                        </td>

                        {/* Doanh nghiệp / Nơi thực tập */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-[#003087] dark:text-sky-300">
                            {row.status === 'has_company'
                              ? row.companyName
                              : row.status === 'interviewing'
                                ? (row.pendingCompany || 'Đang tìm kiếm / Chờ PV')
                                : 'Khoa CNTT hỗ trợ điều phối'}
                          </div>
                          {row.status === 'has_company' && row.taxCode ? (
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                              MST: {row.taxCode}
                            </div>
                          ) : null}
                          {row.status === 'has_company' && row.address ? (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                              {row.address}
                            </div>
                          ) : null}
                        </td>

                        {/* Vị trí thực tập */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {row.status === 'has_company'
                              ? (row.position || 'Thực tập sinh')
                              : row.status === 'interviewing'
                                ? (row.desiredPosition || row.position || 'Đang chờ phỏng vấn')
                                : (row.desiredPosition || row.position || 'Chờ Khoa hỗ trợ')}
                          </div>
                        </td>

                        {/* Người hướng dẫn */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-700 dark:text-slate-300">
                            {row.status === 'has_company'
                              ? (row.mentor || 'Chưa chỉ định')
                              : (row.status === 'need_support' ? 'Trợ lý DN Khoa' : '—')}
                          </div>
                        </td>

                        

                        {/* Link CV */}
                        <td className="py-3.5 px-4 text-center">
                          {hasDrive ? (
                            <a
                              href={row.cvDriveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                              title="Mở liên kết CV của bạn trong tab mới"
                            >
                              <span>Xem CV</span>
                              <span className="text-[11px]">↗</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa có liên kết</span>
                          )}
                        </td>

                        {/* Thao tác CRUD: Xem chi tiết, Sửa, Xóa */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Nút Xem chi tiết */}
                            <button
                              type="button"
                              onClick={() => setSelectedDetailModal(row)}
                              title="Xem chi tiết đầy đủ hồ sơ khai báo"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {/* Nút Chỉnh sửa */}
                            <button
                              type="button"
                              disabled={!canUpdate}
                              onClick={() => {
                                if (!canUpdate) {
                                  alert('Tài khoản của bạn chưa được cấp quyền Sửa (Update - Mã 5) hồ sơ khai báo.');
                                  return;
                                }
                                setViewMode('form');
                                setCurrentStep(1);
                              }}
                              title={canUpdate ? 'Chỉnh sửa hoặc cập nhật nơi thực tập' : 'Chưa có quyền Sửa (Update - Mã 5)'}
                              className={`p-1.5 rounded-lg transition ${
                                canUpdate
                                  ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer'
                                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BIỂU MẪU KHAI BÁO / CẬP NHẬT (WIZARD 3 BƯỚC HOÀN CHỈNH) */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header thanh điều hướng quay lại */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="text-xs font-bold text-[#003087] dark:text-sky-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span>
              <span>Quay lại bảng hồ sơ đã nộp</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                {isEditingExisting ? 'Cập nhật hồ sơ thực tập' : 'Biểu mẫu khai báo thực tập mới'}
              </div>
            </div>
          </div>

          {/* Main Grid: Left Wizard (70%), Right Profile Summary (30%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Form (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Stepper Header (Dynamic theo ngữ cảnh) */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                  {stepsMeta.map((s, idx) => {
                    const isPassed = currentStep > s.num;
                    const isCurrent = currentStep === s.num;
                    return (
                      <React.Fragment key={s.num}>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isPassed 
                              ? 'bg-emerald-600 text-white shadow-xs' 
                              : isCurrent 
                                ? (internshipStatus === 'has_company' ? 'bg-[#003087]' : internshipStatus === 'interviewing' ? 'bg-amber-600' : 'bg-rose-600') + ' text-white shadow-xs ring-4 ring-blue-100 dark:ring-blue-900/40' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400'
                          }`}>
                            {isPassed ? '✓' : s.num}
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Bước {s.num}
                            </div>
                            <div style={{ color: isCurrent ? '#1f2937' : '#94a3b8' }} className="text-xs font-extrabold">
                              {s.label}
                            </div>
                          </div>
                        </div>

                        {idx < stepsMeta.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 min-w-[20px] transition-colors ${
                            currentStep > s.num ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Step 1: Chọn trạng thái của sinh viên */}
              {currentStep === 1 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-base font-black text-[#1f2937] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-[#003087] dark:text-sky-300 flex items-center justify-center text-xs">1</span>
                      <span>Xác định trạng thái nơi thực tập của bạn</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Khoa sẽ căn cứ vào lựa chọn của bạn để hướng dẫn thủ tục tiếp theo hoặc điều phối doanh nghiệp hỗ trợ.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Option 1: Đã có nơi thực tập */}
                    <div
                      onClick={() => {
                        setInternshipStatus('has_company');
                        setPendingCompany('');
                        setDesiredPosition('');
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        internshipStatus === 'has_company'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-100 dark:ring-emerald-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            internshipStatus === 'has_company' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                          }`}>
                            {internshipStatus === 'has_company' && <span className="text-[10px]">✓</span>}
                          </span>
                        </div>
                        <div style={{ color: '#1f2937' }} className="font-extrabold text-sm text-[#1f2937]">
                          Đã có nơi thực tập
                        </div>
                        <p className="text-xs text-[#4b5563] leading-relaxed">
                          Doanh nghiệp đã đồng ý tiếp nhận bạn làm thực tập sinh. Bạn cần nhập MST và thông tin người hướng dẫn.
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Đang tìm / Chờ phỏng vấn */}
                    <div
                      onClick={() => {
                        setInternshipStatus('interviewing');
                        setTaxCode('');
                        setCompanyInfo({ name: '', address: '', representative: '', taxDepartment: '', status: '', updatedAt: '', orgType: '' });
                        setContactPerson('');
                        setContactPhone('');
                        setPosition('');
                        setDesiredPosition('');
                        setPendingCompany('');
                        setTaxConfirmed(false);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        internshipStatus === 'interviewing'
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-sm ring-2 ring-amber-100 dark:ring-amber-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">⏳</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            internshipStatus === 'interviewing' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                          }`}>
                            {internshipStatus === 'interviewing' && <span className="text-[10px]">✓</span>}
                          </span>
                        </div>
                        <div style={{ color: '#1f2937' }} className="font-extrabold text-sm text-[#1f2937]">
                          Đang tìm / Chờ phỏng vấn
                        </div>
                        <p className="text-xs text-[#4b5563] leading-relaxed">
                          Bạn đang chủ động nộp hồ sơ, chờ kết quả phỏng vấn. Bạn sẽ cập nhật khi có kết quả chính thức.
                        </p>
                      </div>
                    </div>

                    {/* Option 3: Cần Khoa hỗ trợ */}
                    <div
                      onClick={() => {
                        setInternshipStatus('need_support');
                        setTaxCode('');
                        setCompanyInfo({ name: '', address: '', representative: '', taxDepartment: '', status: '', updatedAt: '', orgType: '' });
                        setContactPerson('');
                        setContactPhone('');
                        setPosition('');
                        setDesiredPosition('');
                        setPendingCompany('');
                        setTaxConfirmed(false);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        internshipStatus === 'need_support'
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 shadow-sm ring-2 ring-rose-100 dark:ring-rose-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-[#fef2f2] text-[#dc2626] font-bold text-xs flex items-center justify-center border border-[#fecaca]">!</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            internshipStatus === 'need_support' ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300'
                          }`}>
                            {internshipStatus === 'need_support' && <span className="text-[10px]">✓</span>}
                          </span>
                        </div>
                        <div style={{ color: '#1f2937' }} className="font-extrabold text-sm text-[#1f2937]">
                          Cần Khoa hỗ trợ
                        </div>
                        <p className="text-xs text-[#4b5563] leading-relaxed">
                          Bạn chưa tìm được nơi thực tập. Khoa CNTT sẽ kết nối doanh nghiệp đối tác và sắp xếp phỏng vấn.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Rẽ nhánh theo trạng thái đã chọn */}
              {currentStep === 2 && (
                <>
                  {/* Trường hợp A: Đã có nơi thực tập -> Bước 2: Tra cứu Doanh nghiệp & Thông tin Mentor */}
                  {internshipStatus === 'has_company' && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-6">
                      <div>
                        <h2 className="text-base font-black text-[#1f2937] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-[#003087] dark:text-sky-300 flex items-center justify-center text-xs">2</span>
                          <span>Thông tin Doanh nghiệp & Cán bộ hướng dẫn</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Nhập Mã số thuế để tra cứu thông tin doanh nghiệp, sau đó nhập thông tin người hướng dẫn.
                        </p>
                      </div>

                      {/* Hộp tra cứu MST */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>MÃ SỐ THUẾ DOANH NGHIỆP: *</span>
                          
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <input
                            type="text"
                            value={taxCode}
                            onChange={(e) => {
                              setTaxCode(e.target.value);
                              setTaxSearchError('');
                            }}
                            placeholder=""
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleTaxSearch}
                            disabled={isSearchingTax || taxCooldown > 0}
                            className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                          >
                            {isSearchingTax ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang tra cứu...</span>
                              </>
                            ) : taxCooldown > 0 ? (
                              <span>Chờ {taxCooldown}s</span>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span>Tra cứu MST</span>
                              </>
                            )}
                          </button>
                        </div>

                        {taxSearchError && (
                          <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                            {taxSearchError}
                          </div>
                        )}
                      </div>

                      {/* Thông tin doanh nghiệp (Tự động điền hoặc sinh viên tự nhập) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            TÊN DOANH NGHIỆP TIẾP NHẬN: *
                          </label>
                          <input
                            type="text"
                            value={companyInfo.name}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                            placeholder=""
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-[#003087] dark:text-sky-300 focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            ĐỊA CHỈ THỰC TẬP: *
                          </label>
                          <input
                            type="text"
                            value={companyInfo.address}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            NGƯỜI ĐẠI DIỆN PHÁP LUẬT:
                          </label>
                          <input
                            type="text"
                            value={companyInfo.representative}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, representative: e.target.value })}
                            placeholder="Họ tên người đại diện pháp luật..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            CƠ QUAN THUẾ QUẢN LÝ:
                          </label>
                          <input
                            type="text"
                            value={companyInfo.taxDepartment}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, taxDepartment: e.target.value })}
                            placeholder="Cục Thuế / Chi cục Thuế quản lý..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* KHỐI THÔNG TIN CÁN BỘ HƯỚNG DẪN (MENTOR) - Gộp chung tinh gọn */}
                      <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#003087] dark:text-sky-300 uppercase tracking-wider">
                          <span>Cán bộ hướng dẫn tại Doanh nghiệp:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              HỌ VÀ TÊN CÁN BỘ HƯỚNG DẪN: *
                            </label>
                            <input
                              type="text"
                              value={contactPerson}
                              onChange={(e) => setContactPerson(e.target.value)}
                              placeholder=""
                              className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              SỐ ĐIỆN THOẠI CÁN BỘ HƯỚNG DẪN: *
                            </label>
                            <input
                              type="text"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              placeholder=""
                              className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cam kết tính chính xác thông tin DN */}
                      <label className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taxConfirmed}
                          onChange={(e) => setTaxConfirmed(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-[#003087] rounded border-slate-300 focus:ring-[#003087]"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                          Tôi cam kết các thông tin về Doanh nghiệp tiếp nhận và Cán bộ hướng dẫn nêu trên là hoàn toàn chính xác và đã có sự đồng thuận từ phía doanh nghiệp.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Trường hợp B: Đang tìm / Chờ phỏng vấn -> Bước 2: Kế hoạch tìm kiếm & Cam kết */}
                  {internshipStatus === 'interviewing' && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-6">
                      <div>
                        <h2 className="text-base font-black text-[#1f2937] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs">2</span>
                          <span>Kế hoạch tìm kiếm & phỏng vấn nơi thực tập</span>
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            VỊ TRÍ THỰC TẬP: *
                          </label>
                          <input
                            type="text"
                            value={desiredPosition}
                            onChange={(e) => setDesiredPosition(e.target.value)}
                            placeholder=""
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-[#003087] dark:text-sky-300 focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            DOANH NGHIỆP BẠN ĐANG ỨNG TUYỂN / PHỎNG VẤN (NẾU CÓ):
                          </label>
                          <input
                            type="text"
                            value={pendingCompany}
                            onChange={(e) => setPendingCompany(e.target.value)}
                            placeholder=""
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            TRẠNG THÁI:
                          </label>
                          <input
                            type="text"
                            value={interviewProgress}
                            onChange={(e) => setInterviewProgress(e.target.value)}
                            placeholder=""
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            GHI CHÚ:
                          </label>
                          <textarea
                            rows={3}
                            value={supportNote}
                            onChange={(e) => setSupportNote(e.target.value)}
                            placeholder=""
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none resize-none"
                          />
                        </div>
                      </div>

                      <label className="flex items-start gap-3 p-3.5 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={interviewCommitment}
                          onChange={(e) => setInterviewCommitment(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                        />
                        <span className="text-xs text-amber-900 dark:text-amber-200 leading-snug">
                          Tôi cam kết sẽ chủ động hoàn tất phỏng vấn và quay lại hệ thống để cập nhật thông tin doanh nghiệp chính thức trước hạn chót (30/09/2026).
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Trường hợp C: Cần Khoa hỗ trợ -> Bước 2: Nguyện vọng & Nộp đơn cho Khoa */}
                  {internshipStatus === 'need_support' && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-6">
                      <div>
                        <h2 className="text-base font-black text-[#1f2937] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 flex items-center justify-center text-xs">2</span>
                          <span>Nguyện vọng & Yêu cầu Khoa CNTT hỗ trợ điều phối</span>
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            LÝ DO CẦN KHOA HỖ TRỢ: *
                          </label>
                          <select
                            value={supportReason}
                            onChange={(e) => setSupportReason(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          >
                            <option value="Chưa tìm được doanh nghiệp phù hợp với định hướng">
                              Chưa tìm được doanh nghiệp phù hợp với định hướng
                            </option>
                            <option value="Doanh nghiệp ứng tuyển đã hết chỉ tiêu tiếp nhận">
                              Doanh nghiệp ứng tuyển đã hết chỉ tiêu tiếp nhận
                            </option>
                            <option value="Cần Khoa giới thiệu vào đối tác chiến lược TDTU">
                              Cần Khoa giới thiệu vào đối tác chiến lược TDTU (TMA, FPT, VNG, Gameloft...)
                            </option>
                            <option value="Thời gian gấp cần Khoa hỗ trợ khẩn cấp">
                              Thời gian gấp cần Khoa hỗ trợ khẩn cấp để kịp tiến độ học phần
                            </option>
                            <option value="Khác">
                              Khác
                            </option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            VỊ TRÍ / CHUYÊN MÔN MONG MUỐN THỰC TẬP: *
                          </label>
                          <input
                            type="text"
                            value={desiredPosition}
                            onChange={(e) => setDesiredPosition(e.target.value)}
                            placeholder=""
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-[#003087] dark:text-sky-300 focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            KHU VỰC LÀM VIỆC MONG MUỐN (QUẬN / THÀNH PHỐ):
                          </label>
                          <input
                            type="text"
                            value={desiredLocation}
                            onChange={(e) => setDesiredLocation(e.target.value)}
                            placeholder=""
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            LIÊN KẾT CV ỨNG TUYỂN (GOOGLE DRIVE HOẶC LINK CÁ NHÂN):
                          </label>
                          <input
                            type="url"
                            value={cvDriveLink}
                            onChange={(e) => setCvDriveLink(e.target.value)}
                            placeholder=""
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono text-blue-600 dark:text-sky-400 focus:ring-2 focus:ring-[#003087] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            GHI CHÚ / NGUYỆN VỌNG BỔ SUNG GỬI KHOA:
                          </label>
                          <textarea
                            rows={3}
                            value={supportNote}
                            onChange={(e) => setSupportNote(e.target.value)}
                            placeholder=""
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none resize-none"
                          />
                        </div>
                      </div>

                      <label className="flex items-start gap-3 p-3.5 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={supportCommitment}
                          onChange={(e) => setSupportCommitment(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500"
                        />
                        <span className="text-xs text-rose-900 dark:text-rose-200 leading-snug">
                          Tôi cam kết sẽ tham gia phỏng vấn nghiêm túc, đúng giờ khi Khoa bố trí lịch và tuân thủ quy chế thực tập của doanh nghiệp được điều phối.
                        </span>
                      </label>
                    </div>
                  )}
                </>
              )}

              {/* Step 3: Dành riêng cho "Đã có nơi thực tập" -> Vị trí & Xác nhận cam kết toàn bộ */}
              {currentStep === 3 && internshipStatus === 'has_company' && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-base font-black text-[#1f2937] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs">3</span>
                      <span>Vị trí thực tập & Cam kết xác nhận hồ sơ</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        VỊ TRÍ THỰC TẬP CHÍNH THỨC: *
                      </label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-[#003087] dark:text-sky-300 focus:ring-2 focus:ring-[#003087] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        PHÒNG BAN / BỘ PHẬN LÀM VIỆC:
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        GHI CHÚ / ĐỀ XUẤT THÊM (NẾU CÓ):
                      </label>
                      <textarea
                        rows={2}
                        value={supportNote}
                        onChange={(e) => setSupportNote(e.target.value)}
                        placeholder=""
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={finalConfirmed}
                      onChange={(e) => setFinalConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                      Tôi xác nhận các thông tin trên là chính xác và cam kết hoàn thành đúng khối lượng thời gian của môn học thực tập theo quy chế của Khoa CNTT - ĐH Tôn Đức Thắng.
                    </span>
                  </label>
                </div>
              )}

              {/* Form Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <span>←</span>
                    <span>Quay lại</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                )}

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Trường hợp: has_company Bước 1 hoặc 2 -> Nút Tiếp tục */}
                  {internshipStatus === 'has_company' && currentStep < 3 && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2.5 rounded-xl bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Tiếp tục</span>
                      <span>→</span>
                    </button>
                  )}

                  {/* Trường hợp: interviewing Bước 1 -> Tiếp tục */}
                  {internshipStatus === 'interviewing' && currentStep === 1 && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Kế hoạch tìm kiếm</span>
                      <span>→</span>
                    </button>
                  )}

                  {/* Trường hợp: interviewing Bước 2 -> Nộp lưu trạng thái */}
                  {internshipStatus === 'interviewing' && currentStep === 2 && (
                    <button
                      type="button"
                      onClick={handleSubmitInterviewing}
                      disabled={!interviewCommitment || submitting || isReadOnly}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        !interviewCommitment || submitting || isReadOnly
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-600 cursor-not-allowed shadow-none'
                          : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer'
                      }`}
                    >
                      {submitting ? 'Đang lưu...' : 'Gửi cập nhật trạng thái ✓'}
                    </button>
                  )}

                  {/* Trường hợp: need_support Bước 1 -> Tiếp tục */}
                  {internshipStatus === 'need_support' && currentStep === 1 && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Gửi nguyện vọng</span>
                      <span>→</span>
                    </button>
                  )}

                  {/* Trường hợp: need_support Bước 2 -> Gửi yêu cầu Khoa hỗ trợ */}
                  {internshipStatus === 'need_support' && currentStep === 2 && (
                    <button
                      type="button"
                      onClick={handleSubmitNeedSupport}
                      disabled={!supportCommitment || submitting || isReadOnly}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        !supportCommitment || submitting || isReadOnly
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-600 cursor-not-allowed shadow-none'
                          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer'
                      }`}
                    >
                      {submitting ? 'Đang gửi...' : 'Nộp đề xuất tới Khoa CNTT ✓'}
                    </button>
                  )}

                  {/* Trường hợp: has_company Bước 3 -> Nộp hoàn tất */}
                  {internshipStatus === 'has_company' && currentStep === 3 && (
                    <button
                      type="button"
                      onClick={handleSubmitFinal}
                      disabled={!finalConfirmed || submitting || isReadOnly}
                      className={`px-7 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        !finalConfirmed || submitting || isReadOnly
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-600 cursor-not-allowed shadow-none'
                          : 'bg-[#16a34a] hover:bg-[#15803d] text-white shadow-sm cursor-pointer'
                      }`}
                    >
                      {submitting ? 'Đang lưu hồ sơ...' : 'Xác nhận & Hoàn tất khai báo ✓'}
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Right Sticky Column: Profile summary card */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
              
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      HỒ SƠ CỦA BẠN
                    </div>
                    {actualSubmissionTime ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>ĐÃ LƯU HỒ SƠ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        <span>ĐANG SOẠN THẢO</span>
                      </span>
                    )}
                  </div>
                  <div className="text-base font-extrabold text-slate-900  mt-1">
                    {studentName} · {studentId}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center justify-between mt-0.5">
                    <span>Học kỳ: HK1 2026–2027</span>
                    <span className="font-mono text-[10px] text-slate-400">Mã SV: {studentId}</span>
                  </div>
                </div>

                {/* Hộp ghi nhận mốc thời gian thực tế */}
                {actualSubmissionTime ? (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Thời gian thực ghi nhận:</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-emerald-200/80 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-200">
                        Chính thức
                      </span>
                    </div>
                    <div className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300 font-mono tracking-tight">
                      {actualSubmissionTime}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-emerald-200/50 dark:border-emerald-800/50">
                      <span>Mã biên nhận:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">KBTT-{studentId}-20261</span>
                    </div>
                  </div>) : null}

                {/* Status Pill */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  internshipStatus === 'has_company'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : internshipStatus === 'interviewing'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Trạng thái khai báo</div>
                    <div className="text-xs font-extrabold mt-0.5">{statusLabel}</div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    internshipStatus === 'has_company'
                      ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950'
                      : internshipStatus === 'interviewing'
                        ? 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950'
                        : 'bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950 animate-pulse'
                  }`}></span>
                </div>

                {/* Course Summary */}
                <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Học phần phân bổ chính thức:</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <span>{courseDisplay}</span>
                  </div>
                </div>

                {/* Help Box */}
                <div className="bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#003087] dark:text-sky-400">
                    <span>Bạn cần hỗ trợ thêm?</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Nếu bạn có vướng mắc về học phần thực tập hoặc quy chế xét tốt nghiệp, hãy liên hệ trực tiếp với Khoa CNTT.
                  </p>
                  <div>
                    <a href="mailto:khoacntt@tdtu.edu.vn" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
                      Email: khoacntt@tdtu.edu.vn
                    </a>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: XEM CHI TIẾT ĐẦY ĐỦ HỒ SƠ ĐÃ KHAI BÁO (POPUP TRANG TRỌNG) */}
      {/* ========================================================================= */}
      {selectedDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-[95vw] max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-up max-h-[94vh] flex flex-col">
            
            <div className="p-5 bg-[#003087] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">
                    Chi tiết Hồ sơ Khai báo Thực tập
                  </h3>
                  <div className="text-xs text-white/80">
                    Trạng thái: <strong className="text-white">{selectedDetailModal.statusLabel}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 text-xl font-bold cursor-pointer transition"
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-5 text-sm">
              
              {/* Sinh viên & Môn học */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Họ và tên sinh viên:</span>
                  <div className="font-extrabold text-slate-900 dark:text-white mt-1 text-base">{studentName}</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Mã số sinh viên:</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 text-base">{studentId}</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Học phần thực tập:</span>
                  <div className="font-extrabold text-[#003087] dark:text-sky-300 mt-1 text-base">{selectedDetailModal.courseName}</div>
                </div>
              </div>

              {/* Thông tin nơi thực tập & Doanh nghiệp */}
              <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="font-bold text-[#003087] dark:text-sky-300 uppercase tracking-wider text-xs flex items-center gap-2">
                  <span>🏢</span>
                  <span>{selectedDetailModal.status === 'has_company' ? 'Doanh nghiệp tiếp nhận thực tập:' : (selectedDetailModal.status === 'need_support' ? 'Điều phối tiếp nhận:' : 'Tình trạng ứng tuyển:')}</span>
                </div>
                <div className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {selectedDetailModal.status === 'has_company'
                    ? (selectedDetailModal.companyName || 'Doanh nghiệp đã khai báo')
                    : (selectedDetailModal.status === 'need_support'
                        ? 'Khoa CNTT hỗ trợ điều phối doanh nghiệp'
                        : (selectedDetailModal.pendingCompany || 'Đang tìm kiếm / Chờ kết quả phỏng vấn'))}
                </div>
                {selectedDetailModal.status === 'has_company' && selectedDetailModal.taxCode && (
                  <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
                    Mã số thuế doanh nghiệp: <strong className="text-slate-900 dark:text-white">{selectedDetailModal.taxCode}</strong>
                  </div>
                )}
                {selectedDetailModal.status === 'has_company' && selectedDetailModal.address && (
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Địa chỉ làm việc: <strong className="text-slate-900 dark:text-white">{selectedDetailModal.address}</strong>
                  </div>
                )}
                {selectedDetailModal.status === 'has_company' && selectedDetailModal.representative && (
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Đại diện pháp luật: <strong className="text-slate-900 dark:text-white">{selectedDetailModal.representative}</strong>
                  </div>
                )}
              </div>

              {/* Vị trí & Người hướng dẫn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                    {selectedDetailModal.status === 'has_company' ? 'Vị trí thực tập tiếp nhận:' : (selectedDetailModal.status === 'need_support' ? 'Vị trí nguyện vọng đề xuất:' : 'Vị trí đang phỏng vấn:')}
                  </span>
                  <div className="font-extrabold text-[#003087] dark:text-sky-300 text-base mt-1">
                    {selectedDetailModal.status === 'has_company'
                      ? (selectedDetailModal.position || 'Thực tập sinh')
                      : (selectedDetailModal.status === 'need_support'
                          ? (selectedDetailModal.desiredPosition || selectedDetailModal.position || 'Chờ Khoa hỗ trợ phân bổ')
                          : (selectedDetailModal.desiredPosition || selectedDetailModal.position || 'Đang chờ kết quả phỏng vấn'))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Người hướng dẫn:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-base mt-1">
                    {selectedDetailModal.status === 'has_company'
                      ? (selectedDetailModal.mentor || 'Chưa chỉ định')
                      : (selectedDetailModal.status === 'need_support'
                          ? 'Trợ lý Doanh nghiệp Khoa CNTT'
                          : 'Chưa có (Đang chờ phỏng vấn)')}
                  </div>
                </div>
              </div>

              {/* Minh chứng Drive nếu có */}
              {selectedDetailModal.cvDriveLink && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Hồ sơ năng lực (Link CV):</span>
                  <div>
                    <a
                      href={selectedDetailModal.cvDriveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                      </svg>
                      <span>Mở xem CV trên Google Drive</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Ghi chú */}
              {selectedDetailModal.supportNote && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Ghi chú bổ sung:</span>
                  <div className="text-slate-800 dark:text-slate-200 text-sm italic mt-1 leading-relaxed">
                    "{selectedDetailModal.supportNote}"
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Cơ quan xét duyệt: Khoa CNTT - ĐH Tôn Đức Thắng
              </span>
              <button
                type="button"
                onClick={() => setSelectedDetailModal(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition text-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL 3: CẢNH BÁO RÚT HỖ TRỢ KHI SINH VIÊN TỰ TÌM ĐƯỢC DOANH NGHIỆP */}
      {/* ========================================================================= */}
      {showWithdrawConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="p-5 bg-white border-b border-[#e5e7eb] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] flex items-center justify-center shrink-0 font-bold">
                <svg className="w-5 h-5 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-[#1f2937]">
                  Xác nhận cập nhật nơi thực tập chính thức
                </h3>
                <p className="text-[12px] text-[#1f2937] mt-0.5">
                  Hệ thống ghi nhận trước đó bạn đã nộp đơn "Cần Khoa hỗ trợ"
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1.5">
                <div className="font-bold text-[#003087] dark:text-sky-300 uppercase tracking-wider text-[11px]">
                  Doanh nghiệp mới tiếp nhận thực tập:
                </div>
                <div className="font-bold text-slate-900  text-sm">
                  {companyInfo.name || 'Doanh nghiệp đã khai báo'}
                </div>
                {taxCode && <div className="text-slate-500 font-mono">Mã số thuế: {taxCode}</div>}
                {contactPerson && (
                  <div className="text-slate-700 dark:text-slate-300 pt-1 border-t border-blue-200/50 dark:border-blue-800/50">
                    Cán bộ hướng dẫn (Mentor): <strong>{contactPerson}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Khi bạn xác nhận lưu thông tin này:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    Hệ thống tự động <strong>ghi nhận mốc thời gian chính xác</strong> ({new Date().toLocaleString('vi-VN')}) bạn tìm được nơi thực tập.
                  </li>
                  <li>
                    Hồ sơ sẽ <strong>tự động rút yêu cầu Khoa hỗ trợ</strong> để Thầy/Cô kịp thời thu hồi lịch phỏng vấn và nhường chỉ tiêu điều phối cho sinh viên khác.
                  </li>
                  <li>
                    Trạng thái của bạn được đồng bộ sang <strong>"Đã có nơi thực tập"</strong> trên hệ thống của Giảng viên và Ban Chủ nhiệm Khoa.
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWithdrawConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition text-xs cursor-pointer"
              >
                Hủy bỏ / Xem lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawConfirmModal(false);
                  doSubmitFinal();
                }}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Đang lưu...' : 'Xác nhận & Cập nhật mốc thời gian ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

window.DeclarationPage = DeclarationPage;
