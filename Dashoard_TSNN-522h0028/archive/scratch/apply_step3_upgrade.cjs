const fs = require('fs');

const fileContent = `// Declaration Page Component - Chuẩn hóa thiết kế theo Figma Frames (Frame 04, 05, 06, 07)
// Nghiệp vụ: Tự động nhận diện môn học từ 2 sheet (KTCN & TSNN) do Khoa nhập; bỏ hoàn toàn phần Giấy giới thiệu (GGT).
// Quy trình Wizard 4 bước: Học phần thực tập -> Trạng thái hiện tại -> Thông tin doanh nghiệp (MST Realtime Xinvoice API, Đại diện DN, Giảng viên HD) -> Vị trí & Xác nhận

const TDTU_LECTURERS = [
  { name: 'ThS. Đặng Huỳnh Trung', title: 'Điều phối TSNN & Quan hệ Doanh nghiệp', email: 'danghuynhtrung@tdtu.edu.vn' },
  { name: 'TS. Trần Thị B', title: 'Phó Trưởng Khoa CNTT (Cố vấn học tập)', email: 'tranthib@tdtu.edu.vn' },
  { name: 'TS. Phạm Văn C', title: 'Trưởng Khoa CNTT (Phụ trách Đào tạo)', email: 'phamvanc@tdtu.edu.vn' },
  { name: 'ThS. Lê Hoàng D', title: 'Bộ môn Mạng máy tính & Viễn thông', email: 'lehoangd@tdtu.edu.vn' },
  { name: 'ThS. Nguyễn Văn A', title: 'Bộ môn Kỹ thuật Phần mềm', email: 'nguyenvana@tdtu.edu.vn' },
  { name: 'TS. Vũ Đình Bảy', title: 'Trưởng Bộ môn Khoa học Máy tính', email: 'vudinhbay@tdtu.edu.vn' },
  { name: 'ThS. Bùi Thị Thanh Tuyền', title: 'Bộ môn Mạng & ATTT', email: 'buithithanhtuyen@tdtu.edu.vn' },
  { name: 'Khoa CNTT phân công', title: 'Ban Chủ nhiệm Khoa điều phối', email: 'khoacntt@tdtu.edu.vn' }
];

const DeclarationPage = ({ currentUser, onNavigateTab }) => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const studentId = currentUser?.studentId || '522H0045';
  const studentName = currentUser?.name || 'Nguyễn Minh Anh';

  // Phân quyền theo Ma trận Prime RBAC: Quyền Tạo mới (3) & Cập nhật (5)
  const canCreate = window.PrimeRbac?.checkUserPermission ? window.PrimeRbac.checkUserPermission(currentUser, 'declaration', 3) : true;
  const canUpdate = window.PrimeRbac?.checkUserPermission ? window.PrimeRbac.checkUserPermission(currentUser, 'declaration', 5) : true;
  const isReadOnly = !canCreate && !canUpdate;

  // Step 1: Môn học - Tự động phát hiện từ danh sách 2 sheet KTCN & TSNN của Khoa
  const [selectedCourses, setSelectedCourses] = React.useState(['KTCN']);
  const [isDualCourse, setIsDualCourse] = React.useState(false);
  const [enrolledInfo, setEnrolledInfo] = React.useState('Đang đối chiếu dữ liệu danh sách Khoa...');

  // Step 2: Trạng thái hiện tại ('has_company' | 'interviewing' | 'need_support')
  const [internshipStatus, setInternshipStatus] = React.useState('has_company');
  const [supportReason, setSupportReason] = React.useState('');

  // Step 3: Thông tin doanh nghiệp (Tra cứu MST Xinvoice API thực tế)
  const [taxCode, setTaxCode] = React.useState('');
  const [isSearchingTax, setIsSearchingTax] = React.useState(false);
  const [taxCooldown, setTaxCooldown] = React.useState(0);
  const [taxSearchError, setTaxSearchError] = React.useState('');
  const [companyInfo, setCompanyInfo] = React.useState({
    name: '',
    address: '',
    industry: '',
    representative: '',
    taxDepartment: '',
    status: '',
    updatedAt: '',
    orgType: '',
  });
  const [taxConfirmed, setTaxConfirmed] = React.useState(false);

  // Phần Đại diện Doanh nghiệp & Cán bộ hướng dẫn tại DN
  const [contactPerson, setContactPerson] = React.useState('');
  const [contactRole, setContactRole] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');

  // Phần Giảng viên hướng dẫn học phần (Khoa CNTT - TDTU)
  const [academicAdvisor, setAcademicAdvisor] = React.useState('ThS. Đặng Huỳnh Trung');
  const [advisorEmail, setAdvisorEmail] = React.useState('danghuynhtrung@tdtu.edu.vn');
  const [advisorNote, setAdvisorNote] = React.useState('');

  // Step 4: Vị trí & Xác nhận (Đã bỏ hoàn toàn Giấy giới thiệu)
  const [position, setPosition] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [supportNote, setSupportNote] = React.useState('');
  const [finalConfirmed, setFinalConfirmed] = React.useState(false);

  // UI & Network State
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState(null);
  const [lastSavedTime, setLastSavedTime] = React.useState('');
  const [isEditingExisting, setIsEditingExisting] = React.useState(false);

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
    const cleanTax = (taxCode || '').trim().replace(/\\s+/g, '');
    if (!cleanTax || cleanTax.length < 10) {
      setTaxSearchError('Vui lòng nhập Mã số thuế hợp lệ (10 hoặc 13 chữ số)');
      return;
    }
    if (taxCooldown > 0 || isSearchingTax) {
      return;
    }

    setTaxSearchError('');
    setIsSearchingTax(true);

    try {
      let data = null;
      try {
        const response = await fetch(\`https://api.xinvoice.vn/gdt-api/tax-payer/\${encodeURIComponent(cleanTax)}\`, {
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          data = await response.json().catch(() => null);
        } else if (response.status === 404) {
          throw new Error('Mã số thuế chưa có trong dữ liệu trực tuyến. Bạn có thể tự điền thông tin công ty bên dưới.');
        } else {
          throw new Error(\`Tra cứu thất bại (Mã lỗi: \${response.status})\`);
        }
      } catch (fetchErr) {
        if (window.ApiClient?.lookupTaxCode) {
          try {
            data = await window.ApiClient.lookupTaxCode(cleanTax);
          } catch {}
        }
        if (!data) throw fetchErr;
      }

      if (!data || !(data.name || data.companyName)) {
        throw new Error('Không tìm thấy thông tin doanh nghiệp cho Mã số thuế này. Bạn có thể tự điền thông tin công ty bên dưới.');
      }

      setCompanyInfo({
        name: data.name || data.companyName || '',
        address: data.address || '',
        industry: data.industry || data.mainIndustry || '',
        representative: data.legalRep || data.representative || '',
        taxDepartment: data.taxDepartment || '',
        status: data.status || 'NNT đang hoạt động',
        updatedAt: data.updatedAt || '',
        orgType: data.orgType || 'Doanh nghiệp',
      });
      setTaxConfirmed(true);
      // Cooldown 15 giây sau khi tra cứu thành công
      setTaxCooldown(15);
    } catch (err) {
      console.error('[xinvoice API] Error:', err);
      setTaxSearchError(err.message || 'Không thể tra cứu thông tin MST. Vui lòng tự điền thông tin bên dưới.');
      // Giảm thời gian chờ xuống 5s nếu lỗi để sinh viên có thể thử lại nhanh
      setTaxCooldown(5);
    } finally {
      setIsSearchingTax(false);
      const now = new Date();
      setLastSavedTime(\`\${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`);
    }
  };

  const handleLecturerChange = (lecturerName) => {
    setAcademicAdvisor(lecturerName);
    const found = TDTU_LECTURERS.find(l => l.name === lecturerName);
    if (found) {
      setAdvisorEmail(found.email);
    }
  };

  // Helper lưu bản nháp tức thì vào localStorage
  const saveDraft = (customData = {}) => {
    try {
      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      const draft = {
        selectedCourses,
        isDualCourse,
        internshipStatus,
        supportReason,
        taxCode,
        companyInfo,
        taxConfirmed,
        contactPerson,
        contactRole,
        contactPhone,
        contactEmail,
        academicAdvisor,
        advisorEmail,
        advisorNote,
        position,
        department,
        supportNote,
        finalConfirmed,
        currentStep,
        savedAt: timeStr,
        ...customData
      };
      localStorage.setItem('tdtu_decl_draft_' + studentId, JSON.stringify(draft));
      setLastSavedTime(timeStr);
    } catch {}
  };

  // Tự động nhận diện môn học và tải thông tin hồ sơ
  React.useEffect(() => {
    if (!studentId) return;

    // 1. Đối chiếu danh sách sinh viên thực tế của học kỳ
    if (window.ApiClient?.getLiveStudents) {
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
              setEnrolledInfo('Bạn có tên trong cả 2 danh sách KTCN & TSNN (Thực tập song song 320h)');
            } else if (hasTSNN) {
              courses = ['TSNN'];
              setEnrolledInfo('Bạn có tên trong danh sách Tập sự Nghề nghiệp (TSNN)');
            } else {
              courses = ['KTCN'];
              setEnrolledInfo('Bạn có tên trong danh sách Kiến tập Công nghiệp (KTCN)');
            }

            setSelectedCourses(courses);
            setIsDualCourse(courses.length > 1);
          } else {
            setSelectedCourses(['KTCN']);
            setIsDualCourse(false);
          }
        })
        .catch(() => {
          setSelectedCourses(['KTCN']);
          setIsDualCourse(false);
        });
    }

    // 2. Tải hồ sơ chính thức từ API Backend hoặc LocalStorage (Tự động đồng bộ 2 chiều)
    let hasOfficial = false;
    const applyDeclarationData = (decl) => {
      if (!decl) return;
      if (decl.selectedCourses) {
        try {
          const parsed = typeof decl.selectedCourses === 'string' ? JSON.parse(decl.selectedCourses) : decl.selectedCourses;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedCourses(parsed);
            setIsDualCourse(parsed.length > 1);
          }
        } catch {}
      }
      if (decl.isDualCourse !== undefined) setIsDualCourse(Boolean(decl.isDualCourse));
      if (decl.noCompanyOption === 'faculty' || decl.internshipStatus === 'need_support') {
        setInternshipStatus('need_support');
      } else if (decl.noCompanyOption === 'self' || decl.internshipStatus === 'interviewing') {
        setInternshipStatus('interviewing');
      } else if (decl.companyName && !decl.companyName.includes('Khoa CNTT') && !decl.companyName.includes('Đang tìm')) {
        setInternshipStatus('has_company');
      }

      if (decl.taxCode) setTaxCode(decl.taxCode);
      setCompanyInfo({
        name: decl.companyName || decl.name || '',
        address: decl.address || '',
        industry: decl.mainIndustry || decl.industry || '',
        representative: decl.representative || '',
        taxDepartment: decl.taxDepartment || '',
        status: decl.companyStatus || decl.status || 'NNT đang hoạt động',
        updatedAt: decl.taxUpdatedAt || '',
        orgType: decl.orgType || 'Doanh nghiệp'
      });
      if (decl.contactPerson) setContactPerson(decl.contactPerson);
      if (decl.contactRole) setContactRole(decl.contactRole);
      if (decl.contactPhone) setContactPhone(decl.contactPhone);
      if (decl.contactEmail) setContactEmail(decl.contactEmail);
      if (decl.academicAdvisor) {
        setAcademicAdvisor(decl.academicAdvisor);
        const l = TDTU_LECTURERS.find(x => x.name === decl.academicAdvisor);
        if (l) setAdvisorEmail(l.email);
      }
      if (decl.advisorEmail) setAdvisorEmail(decl.advisorEmail);
      if (decl.advisorNote) setAdvisorNote(decl.advisorNote);
      if (decl.position) setPosition(decl.position);
      if (decl.department) setDepartment(decl.department);
      if (decl.supportNote) setSupportNote(decl.supportNote);
      if (decl.isConfirmed !== undefined) setFinalConfirmed(Boolean(decl.isConfirmed));
      setTaxConfirmed(Boolean(decl.companyName));
    };

    if (window.ApiClient?.getDeclaration) {
      window.ApiClient.getDeclaration(studentId)
        .then(res => {
          const d = res?.declaration || res?.record || res;
          if (d && (d.companyName || d.studentId || d.status)) {
            hasOfficial = true;
            applyDeclarationData(d);
            try {
              localStorage.setItem('tdtu_decl_' + studentId, JSON.stringify(d));
            } catch {}
          } else {
            const saved = localStorage.getItem('tdtu_decl_' + studentId);
            if (saved) {
              hasOfficial = true;
              applyDeclarationData(JSON.parse(saved));
            }
          }
        })
        .catch(() => {
          const saved = localStorage.getItem('tdtu_decl_' + studentId);
          if (saved) {
            hasOfficial = true;
            applyDeclarationData(JSON.parse(saved));
          }
        });
    } else {
      try {
        const saved = localStorage.getItem('tdtu_decl_' + studentId);
        if (saved) {
          hasOfficial = true;
          applyDeclarationData(JSON.parse(saved));
        }
      } catch {}
    }

    // 3. Nếu chưa có hồ sơ chính thức, khôi phục từ bản lưu tạm (draft)
    if (!hasOfficial) {
      try {
        const localDraft = localStorage.getItem('tdtu_decl_draft_' + studentId);
        if (localDraft) {
          const d = JSON.parse(localDraft);
          if (d.savedAt) setLastSavedTime(d.savedAt);
          if (d.taxCode) setTaxCode(d.taxCode);
          if (d.companyInfo) setCompanyInfo(d.companyInfo);
          if (d.contactPerson) setContactPerson(d.contactPerson);
          if (d.contactRole) setContactRole(d.contactRole);
          if (d.contactPhone) setContactPhone(d.contactPhone);
          if (d.contactEmail) setContactEmail(d.contactEmail);
          if (d.academicAdvisor) setAcademicAdvisor(d.academicAdvisor);
          if (d.advisorEmail) setAdvisorEmail(d.advisorEmail);
          if (d.advisorNote) setAdvisorNote(d.advisorNote);
          if (d.position) setPosition(d.position);
          if (d.department) setDepartment(d.department);
          if (d.supportNote) setSupportNote(d.supportNote);
          if (d.supportReason) setSupportReason(d.supportReason);
          if (d.internshipStatus) setInternshipStatus(d.internshipStatus);
          if (d.taxConfirmed) setTaxConfirmed(Boolean(d.taxConfirmed));
        } else {
          const now = new Date();
          setLastSavedTime(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'));
        }
      } catch {}
    }
  }, [studentId]);

  const handleSubmitInterviewing = async () => {
    if (isReadOnly) {
      setMessage({ type: 'error', text: 'Tài khoản của bạn chỉ có quyền Xem (Mã 22), không có quyền nộp hồ sơ khai báo.' });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        studentId,
        selectedCourses,
        isDualCourse,
        internshipStatus: 'interviewing',
        noCompanyOption: 'self',
        companyName: 'Đang tìm / Chờ PV',
        taxCode: '',
        address: '',
        mainIndustry: '',
        representative: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        position: 'Đang phỏng vấn',
        department: '',
        supportNote: supportReason || 'Sinh viên đang chủ động tìm kiếm và phỏng vấn tại các doanh nghiệp.',
        isConfirmed: true
      };

      await window.ApiClient.declareInternship(payload);
      try {
        localStorage.setItem('tdtu_decl_' + studentId, JSON.stringify(payload));
      } catch {}
      window.dispatchEvent(new CustomEvent('tdtu_decl_updated', { detail: payload }));
      window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: payload }));
      setMessage({
        type: 'success',
        text: '✓ Đã cập nhật trạng thái "Đang tìm / Chờ phỏng vấn" thành công tới Khoa CNTT! Hệ thống đang chuyển về trang Tổng quan...'
      });
      try {
        localStorage.removeItem('tdtu_decl_draft_' + studentId);
      } catch {}
      if (onNavigateTab) {
        setTimeout(() => onNavigateTab('dashboard'), 1400);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Không thể lưu trạng thái. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedCourses || selectedCourses.length === 0) {
        alert('Vui lòng chọn môn học thực tập!');
        return;
      }
      setCurrentStep(2);
      saveDraft({ currentStep: 2 });
    } else if (currentStep === 2) {
      if (!internshipStatus) {
        alert('Vui lòng chọn trạng thái hiện tại của bạn!');
        return;
      }
      if (internshipStatus === 'has_company') {
        setCurrentStep(3);
        saveDraft({ currentStep: 3 });
      } else if (internshipStatus === 'need_support') {
        // Xóa sạch thông tin doanh nghiệp ở bước 3 và chuyển thẳng qua bước 4
        setTaxCode('');
        setCompanyInfo({ name: '', address: '', industry: '', representative: '', taxDepartment: '', status: '', updatedAt: '', orgType: '' });
        setContactPerson('');
        setContactRole('');
        setContactPhone('');
        setContactEmail('');
        setCurrentStep(4);
        saveDraft({
          currentStep: 4,
          taxCode: '',
          companyInfo: { name: '', address: '', industry: '', representative: '', taxDepartment: '', status: '', updatedAt: '', orgType: '' },
          contactPerson: '',
          contactRole: '',
          contactPhone: '',
          contactEmail: ''
        });
      } else if (internshipStatus === 'interviewing') {
        handleSubmitInterviewing();
        return;
      }
    } else if (currentStep === 3) {
      if (internshipStatus === 'has_company') {
        if (!companyInfo.name || !companyInfo.name.trim()) {
          alert('Vui lòng nhập tên công ty hoặc tra cứu mã số thuế doanh nghiệp!');
          return;
        }
        if (!contactPerson || !contactPerson.trim()) {
          alert('Vui lòng nhập Họ tên người đại diện / người liên hệ tại doanh nghiệp!');
          return;
        }
        if (!taxConfirmed) {
          alert('Vui lòng tích chọn cam kết xác nhận thông tin doanh nghiệp phía dưới!');
          return;
        }
      }
      setCurrentStep(4);
      saveDraft({ currentStep: 4 });
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 4) {
      if (internshipStatus === 'need_support') {
        setCurrentStep(2);
        saveDraft({ currentStep: 2 });
      } else {
        setCurrentStep(3);
        saveDraft({ currentStep: 3 });
      }
    } else if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveDraft({ currentStep: prev });
    }
  };

  const handleSubmitFinal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isReadOnly) {
      setMessage({ type: 'error', text: 'Tài khoản của bạn chỉ có quyền Xem (Mã 22), không có quyền nộp hồ sơ khai báo.' });
      return;
    }
    if (internshipStatus === 'has_company' && !position.trim()) {
      alert('Vui lòng nhập tên vị trí thực tập!');
      return;
    }
    if (!finalConfirmed) {
      alert('Vui lòng tích chọn xác nhận tính chính xác của hồ sơ trước khi gửi.');
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
        internshipStatus,
        companyName: internshipStatus === 'has_company' ? (companyInfo.name || '') : (internshipStatus === 'interviewing' ? 'Đang tìm / Chờ PV' : 'Khoa CNTT hỗ trợ'),
        taxCode: internshipStatus === 'has_company' ? taxCode : '',
        address: internshipStatus === 'has_company' ? companyInfo.address : '',
        mainIndustry: internshipStatus === 'has_company' ? companyInfo.industry : '',
        representative: internshipStatus === 'has_company' ? companyInfo.representative : '',
        contactPerson: internshipStatus === 'has_company' ? contactPerson : '',
        contactRole: internshipStatus === 'has_company' ? contactRole : '',
        contactPhone: internshipStatus === 'has_company' ? contactPhone : '',
        contactEmail: internshipStatus === 'has_company' ? contactEmail : '',
        academicAdvisor: internshipStatus === 'has_company' ? academicAdvisor : 'Khoa CNTT',
        advisorEmail: internshipStatus === 'has_company' ? advisorEmail : 'khoacntt@tdtu.edu.vn',
        advisorNote: internshipStatus === 'has_company' ? advisorNote : '',
        taxDepartment: companyInfo.taxDepartment || '',
        companyStatus: companyInfo.status || '',
        orgType: companyInfo.orgType || '',
        taxUpdatedAt: companyInfo.updatedAt || '',
        position,
        department,
        supportNote: supportNote || supportReason,
        isConfirmed: finalConfirmed
      };

      await window.ApiClient.declareInternship(payload);
      window.dispatchEvent(new CustomEvent('tdtu_decl_updated', { detail: payload }));
      window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: payload }));
      setMessage({
        type: 'success',
        text: internshipStatus === 'has_company'
          ? 'Chúc mừng! Hồ sơ khai báo thực tập của bạn đã được ghi nhận thành công.'
          : '✓ Đã gửi yêu cầu hỗ trợ tới Khoa CNTT thành công! Giảng viên sẽ liên hệ và điều phối doanh nghiệp cho bạn.'
      });
      try {
        localStorage.removeItem('tdtu_decl_draft_' + studentId);
      } catch {}
      if (onNavigateTab) {
        setTimeout(() => onNavigateTab('dashboard'), 1400);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Không thể lưu hồ sơ khai báo. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: 'Chọn môn học' },
    { num: 2, label: 'Trạng thái' },
    { num: 3, label: 'Doanh nghiệp' },
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
          <h1 className="text-2xl md:text-3xl font-black text-[#003087] dark:text-sky-400">
            Khai báo thực tập
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chọn môn học và cung cấp thông tin nơi thực tập để Khoa xét duyệt và thẩm định hồ sơ học phần.
          </p>
        </div>
      </div>

      {/* Global Message Banner */}
      {message && (
        <div className={\`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs \${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }\`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold underline ml-4 cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Main Grid: Left Wizard (70%), Right Profile Summary (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Stepper Header */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              {stepsMeta.map((s, idx) => {
                const isPassed = currentStep > s.num;
                const isCurrent = currentStep === s.num;
                return (
                  <React.Fragment key={s.num}>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all \${
                        isPassed 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : isCurrent 
                            ? 'bg-[#003087] text-white shadow-xs ring-4 ring-blue-100 dark:ring-blue-900/40' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400'
                      }\`}>
                        {isPassed ? '✓' : s.num}
                      </div>
                      <div className="hidden sm:block">
                        <div className={\`text-xs font-bold \${
                          isCurrent ? 'text-[#003087] dark:text-sky-400' : isPassed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                        }\`}>
                          {s.label}
                        </div>
                      </div>
                    </div>
                    {idx < stepsMeta.length - 1 && (
                      <div className={\`flex-1 h-0.5 mx-2 rounded \${isPassed ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}\`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* STEP 1: CHỌN MÔN HỌC */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bước 1: Chọn môn học thực tập
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Hệ thống nhận diện bạn thuộc danh sách đăng ký môn trong HK1 2026–2027. Hãy chọn môn bạn đang học:
                </p>
              </div>

              {/* Course Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. KTCN */}
                <div
                  onClick={() => {
                    if (selectedCourses.includes('KTCN')) {
                      if (selectedCourses.length > 1) {
                        setSelectedCourses(selectedCourses.filter(c => c !== 'KTCN'));
                        setIsDualCourse(false);
                      }
                    } else {
                      const next = [...selectedCourses, 'KTCN'];
                      setSelectedCourses(next);
                      setIsDualCourse(next.length > 1);
                    }
                  }}
                  className={\`p-5 rounded-2xl border-2 transition-all cursor-pointer relative \${
                    selectedCourses.includes('KTCN')
                      ? 'border-[#003087] bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }\`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-[#003087] dark:text-sky-300 text-[11px] font-bold rounded-lg">
                      2 TÍN CHỈ · MÃ 503112
                    </span>
                    <div className={\`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold \${
                      selectedCourses.includes('KTCN')
                        ? 'bg-[#003087] text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-600 text-slate-300'
                    }\`}>
                      {selectedCourses.includes('KTCN') ? '✓' : '—'}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                    Kiến tập Công nghiệp
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Dành cho sinh viên năm 3 làm quen với quy trình tổ chức, văn hóa làm việc và công nghệ tại doanh nghiệp.
                  </p>
                </div>

                {/* 2. TSNN */}
                <div
                  onClick={() => {
                    if (selectedCourses.includes('TSNN')) {
                      if (selectedCourses.length > 1) {
                        setSelectedCourses(selectedCourses.filter(c => c !== 'TSNN'));
                        setIsDualCourse(false);
                      }
                    } else {
                      const next = [...selectedCourses, 'TSNN'];
                      setSelectedCourses(next);
                      setIsDualCourse(next.length > 1);
                    }
                  }}
                  className={\`p-5 rounded-2xl border-2 transition-all cursor-pointer relative \${
                    selectedCourses.includes('TSNN')
                      ? 'border-[#003087] bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }\`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold rounded-lg">
                      4 TÍN CHỈ · MÃ 503113
                    </span>
                    <div className={\`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold \${
                      selectedCourses.includes('TSNN')
                        ? 'bg-[#003087] text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-600 text-slate-300'
                    }\`}>
                      {selectedCourses.includes('TSNN') ? '✓' : '—'}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                    Tập sự Nghề nghiệp
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Dành cho sinh viên năm cuối tham gia trực tiếp vào dự án kỹ thuật thực tế với vai trò kỹ sư tập sự.
                  </p>
                </div>

              </div>

              {/* Course confirmation footer */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <span>Học phần của bạn: <strong className="text-[#003087] dark:text-sky-300">{courseDisplay}</strong> · HK1 2026–2027</span>
                {selectedCourses.length === 2 && (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded">
                    Thực tập song song (320h)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: TRẠNG THÁI HIỆN TẠI */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bước 2: Trạng thái hiện tại
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tình trạng tìm kiếm nơi thực tập của bạn tại thời điểm này:
                </p>
              </div>

              {/* 3 Radio Status Cards */}
              <div className="space-y-3">
                
                {/* 1. Has Company */}
                <div
                  onClick={() => setInternshipStatus('has_company')}
                  className={\`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 \${
                    internshipStatus === 'has_company'
                      ? 'border-[#16a34a] bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-200 dark:ring-emerald-900'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }\`}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={internshipStatus === 'has_company'}
                    onChange={() => setInternshipStatus('has_company')}
                    className="w-4 h-4 mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Đã có nơi thực tập</span>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded">
                        Phổ biến
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Đã nhận được offer, phỏng vấn thành công và có thông tin doanh nghiệp cụ thể.
                    </p>
                  </div>
                </div>

                {/* 2. Interviewing */}
                <div
                  onClick={() => setInternshipStatus('interviewing')}
                  className={\`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 \${
                    internshipStatus === 'interviewing'
                      ? 'border-[#d97706] bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-200 dark:ring-amber-900'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }\`}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={internshipStatus === 'interviewing'}
                    onChange={() => setInternshipStatus('interviewing')}
                    className="w-4 h-4 mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      Đang tìm / Chờ phỏng vấn
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Đã nộp CV và đang tham gia phỏng vấn tại các doanh nghiệp.
                    </p>
                  </div>
                </div>

                {/* 3. Need Faculty Support */}
                <div
                  onClick={() => setInternshipStatus('need_support')}
                  className={\`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 \${
                    internshipStatus === 'need_support'
                      ? 'border-[#dc2626] bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-200 dark:ring-rose-900'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }\`}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={internshipStatus === 'need_support'}
                    onChange={() => setInternshipStatus('need_support')}
                    className="w-4 h-4 mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Cần Khoa hỗ trợ</span>
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-[10px] font-bold rounded">
                        Hỗ trợ khẩn
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Chưa tìm được doanh nghiệp, mong muốn Khoa kết nối với công ty đối tác chiến lược.
                    </p>
                  </div>
                </div>

              </div>

              {internshipStatus === 'need_support' && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Vui lòng mô tả mong muốn hoặc khó khăn gặp phải:
                  </label>
                  <textarea
                    rows={3}
                    value={supportReason}
                    onChange={(e) => setSupportReason(e.target.value)}
                    placeholder="Ví dụ: Em muốn thực tập vị trí Backend Java hoặc DevOps tại TP.HCM, nhờ Thầy/Cô giới thiệu doanh nghiệp..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: THÔNG TIN DOANH NGHIỆP */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bước 3: Thông tin Doanh nghiệp
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nhập Mã số thuế để hệ thống tự động điền các thông tin pháp lý từ Tổng cục Thuế:
                </p>
              </div>

              {/* MST Lookup Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Mã số thuế doanh nghiệp (MST) *
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="Nhập 10 hoặc 13 chữ số (VD: 0312345678)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold tracking-wide focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTaxSearch}
                    disabled={isSearchingTax || taxCooldown > 0}
                    className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shrink-0"
                  >
                    {isSearchingTax ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tra cứu...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>
                          {taxCooldown > 0 ? \`Thử lại sau (\${taxCooldown}s)\` : 'Tra cứu MST'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
                {taxSearchError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{taxSearchError}</span>
                  </div>
                )}
                {companyInfo.name && !taxSearchError && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <span>✓</span>
                    <span>Tra cứu thành công · Đã điền thông tin pháp lý từ Cổng Thuế Doanh nghiệp Quốc gia</span>
                  </div>
                )}
              </div>

              {/* 1. Auto-filled Company Details Card */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Thông tin pháp lý doanh nghiệp (Tổng cục Thuế)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    TÊN CÔNG TY / DOANH NGHIỆP: *
                  </label>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    placeholder="Tên công ty sẽ hiển thị sau khi tra cứu MST"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ĐỊA CHỈ TRỤ SỞ ĐĂNG KÝ: *
                  </label>
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    placeholder="Địa chỉ trụ sở chính"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NGƯỜI ĐẠI DIỆN PHÁP LUẬT:
                    </label>
                    <input
                      type="text"
                      value={companyInfo.representative}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, representative: e.target.value })}
                      placeholder="Họ tên người đại diện pháp luật"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NGÀNH NGHỀ KINH DOANH CHÍNH:
                    </label>
                    <input
                      type="text"
                      value={companyInfo.industry}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                      placeholder="Ngành nghề kinh doanh"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CƠ QUAN THUẾ QUẢN LÝ:
                    </label>
                    <input
                      type="text"
                      value={companyInfo.taxDepartment}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, taxDepartment: e.target.value })}
                      placeholder="Chi cục Thuế quản lý"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      TRẠNG THÁI DOANH NGHIỆP:
                    </label>
                    <div className="flex items-center h-[38px]">
                      <span className={\`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border \${
                        companyInfo.status && companyInfo.status.toLowerCase().includes('hoạt động')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }\`}>
                        <span className={\`w-1.5 h-1.5 rounded-full \${
                          companyInfo.status && companyInfo.status.toLowerCase().includes('hoạt động') ? 'bg-emerald-500' : 'bg-slate-400'
                        }\`}></span>
                        <span>{companyInfo.status || 'Chưa tra cứu'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      LOẠI HÌNH TỔ CHỨC:
                    </label>
                    <input
                      type="text"
                      value={companyInfo.orgType}
                      readOnly
                      placeholder="Loại hình doanh nghiệp"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NGÀY CẬP NHẬT DỮ LIỆU THUẾ:
                    </label>
                    <input
                      type="text"
                      value={companyInfo.updatedAt ? new Date(companyInfo.updatedAt).toLocaleString('vi-VN') : ''}
                      readOnly
                      placeholder="Thời gian cập nhật của cơ quan thuế"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Đại diện Doanh nghiệp & Người hướng dẫn tại DN */}
              <div className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#003087] dark:text-sky-400 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Đại diện Doanh nghiệp & Cán bộ hướng dẫn (Mentor)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Họ và tên người đại diện / liên hệ DN: *
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="VD: Anh/Chị Nguyễn Văn B (HR Manager / Mentor)"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chức vụ / Bộ phận tại DN:
                    </label>
                    <input
                      type="text"
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                      placeholder="VD: HR Manager / Tech Lead / Senior Developer"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Số điện thoại liên hệ DN: *
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="VD: 0909 123 456 hoặc 028 3822..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email liên hệ doanh nghiệp: *
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="VD: hr@congty.com hoặc mentor@congty.com"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Giảng viên hướng dẫn học phần (Khoa CNTT - TDTU) */}
              <div className="p-5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#003087] dark:text-sky-400 pb-2 border-b border-blue-200 dark:border-blue-900/60">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Giảng viên hướng dẫn học phần (Khoa CNTT - TDTU)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Giảng viên hướng dẫn phụ trách: *
                    </label>
                    <select
                      value={academicAdvisor}
                      onChange={(e) => handleLecturerChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#003087] outline-none cursor-pointer"
                    >
                      {TDTU_LECTURERS.map((lec) => (
                        <option key={lec.name} value={lec.name}>
                          {lec.name} — {lec.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Giảng viên hướng dẫn:
                    </label>
                    <input
                      type="text"
                      value={advisorEmail}
                      readOnly
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi chú gửi Giảng viên hướng dẫn:
                  </label>
                  <textarea
                    rows={2}
                    value={advisorNote}
                    onChange={(e) => setAdvisorNote(e.target.value)}
                    placeholder="Ghi chú nguyện vọng, thời gian làm việc hoặc lời nhắn gửi Thầy/Cô cố vấn..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>
              </div>

              {/* Checkbox confirmation */}
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxConfirmed}
                  onChange={(e) => setTaxConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-[#003087] focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Tôi xác nhận thông tin doanh nghiệp, người đại diện và giảng viên hướng dẫn phía trên là chính xác
                </span>
              </label>
            </div>
          )}

          {/* STEP 4: VỊ TRÍ & XÁC NHẬN */}
          {currentStep === 4 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bước 4: Vị trí & Xác nhận
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cung cấp vị trí thực tập, nguyện vọng và xác nhận hồ sơ của bạn:
                </p>
              </div>

              {/* Position & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên vị trí thực tập {internshipStatus === 'has_company' ? '*' : ''}:
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="VD: Kỹ sư Frontend ReactJS, Lập trình viên Backend..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bộ phận:
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="VD: Phòng Công nghệ Thông tin, Trung tâm R&D..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>
              </div>

              {/* Support Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú thêm:
                </label>
                <textarea
                  rows={3}
                  value={supportNote}
                  onChange={(e) => setSupportNote(e.target.value)}
                  placeholder="Ghi chú nguyện vọng, thời gian thực tập dự kiến hoặc yêu cầu đặc biệt từ doanh nghiệp..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                ></textarea>
              </div>

              {/* Review summary box: "Tóm tắt thông tin khai báo" */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>Tóm tắt thông tin khai báo</span>
                  <span className="text-[10px] text-slate-400">HK1 2026–2027</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Sinh viên:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{studentName} · {studentId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Môn học:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{courseDisplay}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Trạng thái:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{statusLabel}</span>
                  </div>
                  {internshipStatus === 'has_company' && companyInfo.name && (
                    <>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Doanh nghiệp tiếp nhận:</span>
                        <strong className="text-[#003087] dark:text-sky-300">{companyInfo.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Đại diện / Người liên hệ DN:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{contactPerson} ({contactPhone || contactEmail})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Giảng viên hướng dẫn:</span>
                        <strong className="text-blue-700 dark:text-sky-300">{academicAdvisor} ({advisorEmail})</strong>
                      </div>
                    </>
                  )}
                  {position && (
                    <div>
                      <span className="text-slate-400 text-[11px] block">Vị trí thực tập:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{position} {department ? \`(\${department})\` : ''}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Commitment Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={finalConfirmed}
                    onChange={(e) => setFinalConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-[#003087] focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    Tôi cam đoan mọi thông tin khai báo trên là hoàn toàn chính xác và chịu mọi trách nhiệm theo Quy định thực tập của Khoa CNTT - Trường Đại học Tôn Đức Thắng.
                  </div>
                </label>
              </div>

            </div>
          )}

          {/* Navigation Bottom Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700/60">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>←</span>
                  <span>Quay lại</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Tiếp tục</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={submitting || isReadOnly}
                  className={\`px-6 py-2.5 text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 \${
                    isReadOnly 
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed' 
                      : 'bg-[#16a34a] hover:bg-[#15803d] text-white disabled:opacity-60 cursor-pointer'
                  }\`}
                >
                  {isReadOnly ? (
                    <span>Chỉ xem hồ sơ (Mã quyền 22)</span>
                  ) : submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span>Lưu & Gửi thông tin</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Sticky Column: "Hồ sơ của bạn" */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
          
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
                Học kỳ: HK1 2026–2027
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
                Mã môn: {selectedCourses.includes('KTCN') ? '503112' : '503113'} · Học kỳ: HK1 2026–2027
              </div>
            </div>

            {/* Company & Advisor Preview if filled */}
            {companyInfo.name && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1 text-xs">
                <div className="text-slate-400 text-[11px]">Doanh nghiệp đã chọn:</div>
                <div className="font-bold text-[#003087] dark:text-sky-300 truncate">{companyInfo.name}</div>
                {contactPerson && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    Đại diện: {contactPerson}
                  </div>
                )}
                {academicAdvisor && (
                  <div className="text-[11px] text-blue-700 dark:text-sky-400 truncate">
                    GVHD: {academicAdvisor}
                  </div>
                )}
              </div>
            )}

            {/* Declaration Deadline Box */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                Hạn chót nộp khai báo:
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

          {/* Card 2: Hỗ trợ sinh viên */}
          <div className="bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#003087] dark:text-sky-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Bạn cần hỗ trợ?</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Nếu doanh nghiệp chưa có MST hoặc bạn cần hỗ trợ tìm nơi thực tập phù hợp, hãy trao đổi trực tiếp với GV phụ trách.
            </p>
            <div className="pt-1">
              <a href="mailto:khoacntt@tdtu.edu.vn" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
                Email: khoacntt@tdtu.edu.vn
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

window.DeclarationPage = DeclarationPage;
`;

fs.writeFileSync('TDTU_DB_CNTT_System/frontend/src/pages/DeclarationPage.jsx', fileContent, 'utf8');
fs.writeFileSync('TDTU_DB_CNTT_System/frontend/src/pages/DeclarationPage.tsx', fileContent, 'utf8');
console.log('Successfully written DeclarationPage.jsx and DeclarationPage.tsx');
