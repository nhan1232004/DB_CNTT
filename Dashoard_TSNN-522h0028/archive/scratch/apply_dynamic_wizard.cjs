const fs = require('fs');

const declarationPageContent = `// Declaration Page Component - Chuẩn hóa thiết kế theo Figma Frames
// Nghiệp vụ: Tự động nhận diện môn học từ 2 sheet (KTCN & TSNN) do Khoa nhập; bỏ hoàn toàn phần Giấy giới thiệu (GGT).
// Quy trình Wizard thông minh (Dynamic Branching):
// - Đã có nơi thực tập (4 bước): Chọn môn học -> Trạng thái -> Doanh nghiệp & Mentor -> Vị trí & Xác nhận
// - Đang tìm / Chờ phỏng vấn (3 bước): Chọn môn học -> Trạng thái -> Kế hoạch tìm kiếm & Xác nhận
// - Cần Khoa hỗ trợ (3 bước): Chọn môn học -> Trạng thái -> Nguyện vọng & Yêu cầu Khoa hỗ trợ

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

  // Dành riêng cho 'has_company' (Bước 3 & 4)
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

  // Dành riêng cho 'interviewing' (Bước 3 rút gọn)
  const [pendingCompany, setPendingCompany] = React.useState('');
  const [interviewProgress, setInterviewProgress] = React.useState('');
  const [interviewCommitment, setInterviewCommitment] = React.useState(false);

  // Dành riêng cho 'need_support' (Bước 3 rút gọn)
  const [supportReason, setSupportReason] = React.useState('Chưa tìm được doanh nghiệp phù hợp với định hướng');
  const [desiredLocation, setDesiredLocation] = React.useState('');
  const [cvDriveLink, setCvDriveLink] = React.useState('');
  const [supportCommitment, setSupportCommitment] = React.useState(false);

  // Chung cho các trường hợp
  const [desiredPosition, setDesiredPosition] = React.useState('');
  const [supportNote, setSupportNote] = React.useState('');

  // UI & Network State
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState(null);
  const [lastSavedTime, setLastSavedTime] = React.useState('');
  const [isEditingExisting, setIsEditingExisting] = React.useState(false);

  // Dynamic Stepper Meta theo từng trường hợp
  const stepsMeta = React.useMemo(() => {
    if (internshipStatus === 'has_company') {
      return [
        { num: 1, label: 'Chọn môn học' },
        { num: 2, label: 'Trạng thái' },
        { num: 3, label: 'Doanh nghiệp & Mentor' },
        { num: 4, label: 'Vị trí & Xác nhận' }
      ];
    } else if (internshipStatus === 'interviewing') {
      return [
        { num: 1, label: 'Chọn môn học' },
        { num: 2, label: 'Trạng thái' },
        { num: 3, label: 'Kế hoạch & Xác nhận' }
      ];
    } else {
      return [
        { num: 1, label: 'Chọn môn học' },
        { num: 2, label: 'Trạng thái' },
        { num: 3, label: 'Nguyện vọng & Gửi Khoa' }
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
        representative: data.legalRep || data.representative || '',
        taxDepartment: data.taxDepartment || '',
        status: data.status || 'NNT đang hoạt động',
        updatedAt: data.updatedAt || '',
        orgType: data.orgType || 'Doanh nghiệp',
      });
      setTaxConfirmed(true);
      setTaxCooldown(15);
    } catch (err) {
      console.error('[xinvoice API] Error:', err);
      setTaxSearchError(err.message || 'Không thể tra cứu thông tin MST. Vui lòng tự điền thông tin bên dưới.');
      setTaxCooldown(5);
    } finally {
      setIsSearchingTax(false);
      const now = new Date();
      setLastSavedTime(\`\${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`);
    }
  };

  // Helper lưu bản nháp tức thì vào localStorage
  const saveDraft = (customData = {}) => {
    try {
      const draftData = {
        studentId,
        currentStep,
        selectedCourses,
        isDualCourse,
        internshipStatus,
        taxCode,
        companyInfo,
        contactPerson,
        contactPhone,
        position,
        department,
        supportReason,
        pendingCompany,
        interviewProgress,
        desiredPosition,
        desiredLocation,
        cvDriveLink,
        supportNote,
        taxConfirmed,
        finalConfirmed,
        interviewCommitment,
        supportCommitment,
        savedAt: new Date().toISOString(),
        ...customData
      };
      localStorage.setItem('tdtu_decl_draft_' + studentId, JSON.stringify(draftData));
      const now = new Date();
      setLastSavedTime(\`\${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`);
    } catch {}
  };

  // 1. Khôi phục hồ sơ đã nộp từ Server hoặc localStorage
  React.useEffect(() => {
    let isMounted = true;
    const loadExistingOrDraft = async () => {
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

      if (!isMounted) return;

      if (decl) {
        setIsEditingExisting(true);
        if (decl.selectedCourses && Array.isArray(decl.selectedCourses)) {
          setSelectedCourses(decl.selectedCourses);
          setIsDualCourse(decl.selectedCourses.length > 1);
        } else if (decl.isDualCourse) {
          setSelectedCourses(['KTCN', 'TSNN']);
          setIsDualCourse(true);
        }

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
        if (decl.position) setPosition(decl.position);
        if (decl.department) setDepartment(decl.department);
        if (decl.supportNote) setSupportNote(decl.supportNote);

        setTaxConfirmed(Boolean(decl.companyName));
        setFinalConfirmed(Boolean(decl.isConfirmed));
        return;
      }

      // Khôi phục bản nháp nếu chưa có hồ sơ nộp
      try {
        const raw = localStorage.getItem('tdtu_decl_draft_' + studentId);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.currentStep) setCurrentStep(d.currentStep);
          if (d.selectedCourses) setSelectedCourses(d.selectedCourses);
          if (d.isDualCourse !== undefined) setIsDualCourse(d.isDualCourse);
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
        }
      } catch {}
    };

    loadExistingOrDraft();

    // Lấy link CV từ profile nếu có
    if (window.ApiClient?.getStudentCvLink) {
      const cv = window.ApiClient.getStudentCvLink(studentId);
      if (cv) setCvDriveLink(cv);
    }

    return () => { isMounted = false; };
  }, [studentId]);

  // 2. Tự động kiểm tra môn học thực tế
  React.useEffect(() => {
    const detectCourses = async () => {
      try {
        if (window.ApiClient?.getLiveStudents) {
          const list = await window.ApiClient.getLiveStudents('hk1_2026_2027');
          const me = list.find(s => (s.mssv === studentId || s.studentId === studentId));
          if (me) {
            const hasKTCN = Boolean(me.ktcnEnrolled || (me.course_str && me.course_str.includes('KTCN')) || (me.courses && me.courses.includes('KTCN')));
            const hasTSNN = Boolean(me.tsnnEnrolled || (me.course_str && me.course_str.includes('TSNN')) || (me.courses && me.courses.includes('TSNN')));
            if (hasKTCN && hasTSNN) {
              setSelectedCourses(['KTCN', 'TSNN']);
              setIsDualCourse(true);
              setEnrolledInfo('Được phân bổ: KTCN (Kiến tập công nghiệp) + TSNN (Tập sự nghề nghiệp) - Thực tập song song 2 môn.');
            } else if (hasTSNN) {
              setSelectedCourses(['TSNN']);
              setIsDualCourse(false);
              setEnrolledInfo('Được phân bổ: TSNN (Tập sự nghề nghiệp) - Khối lượng 320 giờ.');
            } else {
              setSelectedCourses(['KTCN']);
              setIsDualCourse(false);
              setEnrolledInfo('Được phân bổ: KTCN (Kiến tập công nghiệp) - Khối lượng 160 giờ.');
            }
          }
        }
      } catch {}
    };
    detectCourses();
  }, [studentId]);

  // Navigation handlers
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
      // Dù là has_company, interviewing hay need_support đều chuyển tới Bước 3 tương ứng
      setCurrentStep(3);
      saveDraft({ currentStep: 3 });
    } else if (currentStep === 3) {
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
        setCurrentStep(4);
        saveDraft({ currentStep: 4 });
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
    if (isReadOnly) {
      setMessage({ type: 'error', text: 'Tài khoản của bạn chỉ có quyền Xem (Mã 22), không có quyền nộp hồ sơ khai báo.' });
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
      const cName = pendingCompany.trim() ? \`Đang chờ PV: \${pendingCompany.trim()}\` : 'Đang tìm / Chờ PV';
      const payload = {
        studentId,
        studentName,
        selectedCourses,
        isDualCourse,
        internshipStatus: 'interviewing',
        noCompanyOption: 'self',
        companyName: cName,
        taxCode: '',
        address: '',
        representative: '',
        contactPerson: '',
        contactPhone: '',
        position: desiredPosition.trim() || 'Đang ứng tuyển',
        department: '',
        supportNote: interviewProgress.trim() || supportNote.trim() || 'Đang chủ động ứng tuyển và phỏng vấn tại doanh nghiệp',
        isConfirmed: true
      };

      await window.ApiClient.declareInternship(payload);
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

  // Submit cho trường hợp "Cần Khoa hỗ trợ"
  const handleSubmitNeedSupport = async () => {
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
      const fullNote = \`Lý do: \${supportReason}\${desiredLocation ? \` - Khu vực mong muốn: \${desiredLocation}\` : ''}\${cvDriveLink ? \` - Link CV: \${cvDriveLink}\` : ''}\${supportNote ? \` - Ghi chú: \${supportNote}\` : ''}\`;
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
        supportNote: fullNote,
        isConfirmed: true
      };

      await window.ApiClient.declareInternship(payload);
      window.dispatchEvent(new CustomEvent('tdtu_decl_updated', { detail: payload }));
      window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: payload }));
      setMessage({
        type: 'success',
        text: '✓ Đã gửi yêu cầu hỗ trợ tới Khoa CNTT thành công! Thầy/Cô Trợ lý Doanh nghiệp sẽ liên hệ sắp xếp lịch phỏng vấn cho bạn.'
      });
      try {
        localStorage.removeItem('tdtu_decl_draft_' + studentId);
      } catch {}
      if (onNavigateTab) {
        setTimeout(() => onNavigateTab('dashboard'), 1400);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit cho trường hợp "Đã có nơi thực tập" (Bước 4)
  const handleSubmitFinal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isReadOnly) {
      setMessage({ type: 'error', text: 'Tài khoản của bạn chỉ có quyền Xem (Mã 22), không có quyền nộp hồ sơ khai báo.' });
      return;
    }
    if (!position.trim()) {
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
        internshipStatus: 'has_company',
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

      await window.ApiClient.declareInternship(payload);
      window.dispatchEvent(new CustomEvent('tdtu_decl_updated', { detail: payload }));
      window.dispatchEvent(new CustomEvent('tdtu_data_updated', { detail: payload }));
      setMessage({
        type: 'success',
        text: 'Chúc mừng! Hồ sơ khai báo thực tập của bạn đã được ghi nhận thành công.'
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Khai báo thực tập doanh nghiệp
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chọn môn học và cung cấp thông tin nơi thực tập để Khoa xét duyệt và quản lý tiến độ.
          </p>
        </div>

        {/* Status Pill & Auto-save */}
        <div className="flex items-center gap-2">
          {lastSavedTime && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Đã lưu bản nháp lúc {lastSavedTime}
            </span>
          )}
          <span className={\`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold \${
            isEditingExisting
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
          }\`}>
            <span className={\`w-2 h-2 rounded-full \${isEditingExisting ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}\`}></span>
            <span>{isEditingExisting ? 'Đã có hồ sơ trên hệ thống' : 'Đang tạo mới hồ sơ'}</span>
          </span>
        </div>
      </div>

      {/* Global Alert Notification */}
      {message && (
        <div className={\`p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn \${
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
          
          {/* Stepper Header (Dynamic theo ngữ cảnh) */}
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
                            ? (internshipStatus === 'has_company' ? 'bg-[#003087]' : internshipStatus === 'interviewing' ? 'bg-amber-600' : 'bg-rose-600') + ' text-white shadow-xs ring-4 ring-blue-100 dark:ring-blue-900/40' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400'
                      }\`}>
                        {isPassed ? '✓' : s.num}
                      </div>
                      <div className="hidden sm:block">
                        <div className={\`text-xs font-bold \${
                          isCurrent ? 'text-slate-900 dark:text-white' : isPassed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
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

              {/* Tự động đối chiếu */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div className="text-xs">
                  <div className="font-bold text-[#003087] dark:text-sky-300">Dữ liệu đăng ký từ Phòng Đào tạo & Khoa CNTT:</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5 font-medium">{enrolledInfo}</div>
                </div>
              </div>

              {/* Course Options */}
              <div className="space-y-3">
                <div
                  onClick={() => { setSelectedCourses(['KTCN']); setIsDualCourse(false); saveDraft({ selectedCourses: ['KTCN'], isDualCourse: false }); }}
                  className={\`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between \${
                    selectedCourses.length === 1 && selectedCourses.includes('KTCN')
                      ? 'border-[#003087] bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }\`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>KTCN — Kiến tập Công nghiệp</span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-[#003087] dark:text-sky-300 text-[10px] font-bold rounded">Mã: 503112</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Khối lượng: 160 giờ · Dành cho sinh viên năm 3 hoặc năm 4 đợt 1</div>
                  </div>
                  <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${
                    selectedCourses.length === 1 && selectedCourses.includes('KTCN') ? 'border-[#003087] bg-[#003087]' : 'border-slate-300'
                  }\`}>
                    {selectedCourses.length === 1 && selectedCourses.includes('KTCN') && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>

                <div
                  onClick={() => { setSelectedCourses(['TSNN']); setIsDualCourse(false); saveDraft({ selectedCourses: ['TSNN'], isDualCourse: false }); }}
                  className={\`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between \${
                    selectedCourses.length === 1 && selectedCourses.includes('TSNN')
                      ? 'border-[#003087] bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }\`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>TSNN — Tập sự Nghề nghiệp</span>
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded">Mã: 503113</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Khối lượng: 320 giờ · Đợt thực tập tốt nghiệp chính thức</div>
                  </div>
                  <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${
                    selectedCourses.length === 1 && selectedCourses.includes('TSNN') ? 'border-[#003087] bg-[#003087]' : 'border-slate-300'
                  }\`}>
                    {selectedCourses.length === 1 && selectedCourses.includes('TSNN') && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>

                <div
                  onClick={() => { setSelectedCourses(['KTCN', 'TSNN']); setIsDualCourse(true); saveDraft({ selectedCourses: ['KTCN', 'TSNN'], isDualCourse: true }); }}
                  className={\`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between \${
                    selectedCourses.length === 2
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-200 dark:ring-purple-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  }\`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>KTCN & TSNN — Thực tập Song song (2 môn)</span>
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold rounded">Song song</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Học đồng thời cả 2 môn trong cùng một học kỳ theo danh sách được Khoa phê duyệt</div>
                  </div>
                  <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${
                    selectedCourses.length === 2 ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                  }\`}>
                    {selectedCourses.length === 2 && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
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
                  Chọn tình trạng tìm kiếm nơi thực tập của bạn tại thời điểm này:
                </p>
              </div>

              {/* 3 Radio Status Cards */}
              <div className="space-y-3">
                {/* 1. Has Company */}
                <div
                  onClick={() => { setInternshipStatus('has_company'); saveDraft({ internshipStatus: 'has_company' }); }}
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
                    onChange={() => { setInternshipStatus('has_company'); saveDraft({ internshipStatus: 'has_company' }); }}
                    className="w-4 h-4 mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Đã có nơi thực tập</span>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded">
                        Quy trình 4 bước
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Đã nhận được offer trúng tuyển và có thông tin doanh nghiệp, cán bộ hướng dẫn (Mentor) cụ thể.
                    </p>
                  </div>
                </div>

                {/* 2. Interviewing */}
                <div
                  onClick={() => { setInternshipStatus('interviewing'); saveDraft({ internshipStatus: 'interviewing' }); }}
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
                    onChange={() => { setInternshipStatus('interviewing'); saveDraft({ internshipStatus: 'interviewing' }); }}
                    className="w-4 h-4 mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Đang tìm / Chờ phỏng vấn</span>
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded">
                        Rút gọn 3 bước
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Đang chủ động nộp CV hoặc chờ kết quả phỏng vấn tại các doanh nghiệp.
                    </p>
                  </div>
                </div>

                {/* 3. Need Faculty Support */}
                <div
                  onClick={() => { setInternshipStatus('need_support'); saveDraft({ internshipStatus: 'need_support' }); }}
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
                    onChange={() => { setInternshipStatus('need_support'); saveDraft({ internshipStatus: 'need_support' }); }}
                    className="w-4 h-4 mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Cần Khoa hỗ trợ</span>
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-[10px] font-bold rounded">
                        Rút gọn 3 bước · Hỗ trợ khẩn
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Chưa tìm được nơi thực tập, đề xuất Khoa CNTT kết nối với mạng lưới doanh nghiệp đối tác chiến lược.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 - TRƯỜNG HỢP 1: ĐÃ CÓ NƠI THỰC TẬP (DOANH NGHIỆP & MENTOR) */}
          {currentStep === 3 && internshipStatus === 'has_company' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-[#003087] dark:bg-blue-950/60 dark:text-sky-300">
                    Bước 3 / 4
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Thông tin Doanh nghiệp & Cán bộ hướng dẫn
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nhập Mã số thuế để hệ thống tự động điền các thông tin pháp lý từ Tổng cục Thuế, sau đó nhập thông tin Cán bộ hướng dẫn (Mentor):
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

              {/* Thông tin Doanh nghiệp & Cán bộ hướng dẫn (Mentor) gộp chung */}
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      placeholder="Thời gian cập nhật"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                {/* Phần Cán bộ hướng dẫn (Mentor) gộp chung trong thông tin doanh nghiệp */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#003087] dark:text-sky-400">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Cán bộ hướng dẫn tại doanh nghiệp (Mentor)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Họ và tên cán bộ hướng dẫn: *
                      </label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="VD: Anh/Chị Nguyễn Văn B"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Số điện thoại cán bộ hướng dẫn: *
                      </label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="VD: 0909 123 456"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                      />
                    </div>
                  </div>
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
                  Tôi xác nhận thông tin doanh nghiệp và cán bộ hướng dẫn phía trên là chính xác
                </span>
              </label>
            </div>
          )}

          {/* STEP 3 - TRƯỜNG HỢP 2: ĐANG TÌM / CHỜ PHỎNG VẤN (RÚT GỌN 3 BƯỚC) */}
          {currentStep === 3 && internshipStatus === 'interviewing' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Bước 3 / 3
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Kế hoạch tìm kiếm & Xác nhận tiến độ
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cập nhật tiến độ ứng tuyển để Khoa CNTT nắm bắt tình hình và sẵn sàng hỗ trợ khi cần thiết:
                </p>
              </div>

              {/* Status Alert Banner */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Lưu ý quan trọng từ Ban Chủ nhiệm Khoa</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Sinh viên tự liên hệ nơi thực tập cần hoàn tất nhận offer và cập nhật thông tin doanh nghiệp chính thức lên hệ thống trước ngày <strong>30/09/2026</strong>. Sau thời hạn này, nếu chưa có nơi tiếp nhận, Khoa sẽ chủ động liên hệ điều phối bạn sang mạng lưới doanh nghiệp đối tác của Khoa.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Doanh nghiệp đang ứng tuyển / Đã tham gia phỏng vấn (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={pendingCompany}
                    onChange={(e) => setPendingCompany(e.target.value)}
                    placeholder="VD: FPT Software, TMA Solutions, Axon Active (hoặc để trống nếu đang gửi CV)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Định hướng / Vị trí thực tập mục tiêu: *
                    </label>
                    <input
                      type="text"
                      value={desiredPosition}
                      onChange={(e) => setDesiredPosition(e.target.value)}
                      placeholder="VD: Frontend ReactJS, Backend Java, QA Tester..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Thời gian dự kiến có kết quả phỏng vấn:
                    </label>
                    <input
                      type="text"
                      value={interviewProgress}
                      onChange={(e) => setInterviewProgress(e.target.value)}
                      placeholder="VD: Dự kiến có kết quả trước ngày 25/09"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi chú thêm về tình trạng ứng tuyển (nếu có):
                  </label>
                  <textarea
                    rows={2}
                    value={supportNote}
                    onChange={(e) => setSupportNote(e.target.value)}
                    placeholder="Chia sẻ thêm nếu bạn cần Khoa tư vấn chỉnh sửa CV hoặc giới thiệu thêm JD thực tập..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                {/* Cam kết của sinh viên */}
                <label className="flex items-start gap-3 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interviewCommitment}
                    onChange={(e) => setInterviewCommitment(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    Tôi xác nhận hiện đang trong quá trình tự ứng tuyển / phỏng vấn và cam kết sẽ cập nhật thông tin doanh nghiệp chính thức lên hệ thống ngay khi trúng tuyển (trước hạn chót 30/09/2026).
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3 - TRƯỜNG HỢP 3: CẦN KHOA HỖ TRỢ (RÚT GỌN 3 BƯỚC) */}
          {currentStep === 3 && internshipStatus === 'need_support' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    Bước 3 / 3
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Nguyện vọng thực tập & Đề xuất Khoa hỗ trợ
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cung cấp nguyện vọng định hướng nghề nghiệp để Trợ lý Doanh nghiệp Khoa CNTT kết nối bạn vào mạng lưới đối tác chiến lược:
                </p>
              </div>

              {/* Status Alert Banner */}
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-200">
                  <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Quy trình hỗ trợ kết nối doanh nghiệp của Khoa CNTT</span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                  Hồ sơ của bạn sẽ được ưu tiên chuyển tới các đối tác tiếp nhận thực tập của Khoa (FPT Software, TMA Solutions, KMS Technology, LogiGear, VNG...). Thầy/Cô Trợ lý Doanh nghiệp sẽ liên hệ trực tiếp với bạn qua email hoặc điện thoại để sắp xếp lịch phỏng vấn.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lý do đề xuất Khoa hỗ trợ: *
                  </label>
                  <select
                    value={supportReason}
                    onChange={(e) => setSupportReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none cursor-pointer"
                  >
                    <option value="Chưa tìm được doanh nghiệp phù hợp với định hướng">Chưa tìm được doanh nghiệp phù hợp với định hướng</option>
                    <option value="Doanh nghiệp đã nộp hủy tiếp nhận / hoãn tuyển dụng">Doanh nghiệp đã nộp hủy tiếp nhận / hoãn tuyển dụng</option>
                    <option value="Cần Khoa giới thiệu vào mạng lưới đối tác chiến lược">Cần Khoa giới thiệu vào mạng lưới đối tác chiến lược</option>
                    <option value="Lý do cá nhân / Cần tư vấn định hướng từ Giảng viên">Lý do cá nhân / Cần tư vấn định hướng từ Giảng viên</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Định hướng / Vị trí mong muốn thực tập: *
                    </label>
                    <input
                      type="text"
                      value={desiredPosition}
                      onChange={(e) => setDesiredPosition(e.target.value)}
                      placeholder="VD: Kỹ thuật phần mềm, Kiểm thử phần mềm, AI/Data..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Khu vực mong muốn làm việc:
                    </label>
                    <input
                      type="text"
                      value={desiredLocation}
                      onChange={(e) => setDesiredLocation(e.target.value)}
                      placeholder="VD: Quận 7, TP. Thủ Đức, Quận 1 hoặc Linh hoạt"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Link CV Google Drive (để Khoa chuyển cho Doanh nghiệp đối tác):
                  </label>
                  <input
                    type="url"
                    value={cvDriveLink}
                    onChange={(e) => setCvDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Vui lòng bật quyền xem "Bất kỳ ai có đường liên kết" trên Google Drive.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi chú thêm gửi Ban Chủ nhiệm Khoa:
                  </label>
                  <textarea
                    rows={2}
                    value={supportNote}
                    onChange={(e) => setSupportNote(e.target.value)}
                    placeholder="Mô tả kỹ năng thế mạnh, dự án đã làm hoặc hoàn cảnh cần hỗ trợ đặc biệt..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                {/* Cam kết của sinh viên */}
                <label className="flex items-start gap-3 p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={supportCommitment}
                    onChange={(e) => setSupportCommitment(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    Tôi cam kết sẽ tham gia đầy đủ các buổi phỏng vấn do Khoa kết nối và nghiêm túc chấp hành sự điều phối thực tập của Khoa CNTT - Trường Đại học Tôn Đức Thắng.
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: VỊ TRÍ & XÁC NHẬN (CHỈ DÀNH CHO 'HAS_COMPANY') */}
          {currentStep === 4 && internshipStatus === 'has_company' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Bước 4 / 4
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Vị trí & Xác nhận hồ sơ
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Kiểm tra lại thông tin doanh nghiệp đã khai báo, nhập vị trí thực tập và cam kết trước khi gửi hồ sơ:
                </p>
              </div>

              {/* Tóm tắt thông tin đã khai báo ở Bước 3 để sinh viên xem lại rõ ràng */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <div className="font-bold text-[#003087] dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Thông tin doanh nghiệp & Cán bộ hướng dẫn đã khai báo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <span className="text-slate-400 font-medium">Doanh nghiệp:</span>{' '}
                    <strong className="text-slate-900 dark:text-white">{companyInfo.name || 'Chưa nhập'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Mã số thuế:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{taxCode || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Cán bộ hướng dẫn (Mentor):</span>{' '}
                    <strong className="text-emerald-700 dark:text-emerald-400">{contactPerson || 'Chưa nhập'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">SĐT cán bộ hướng dẫn:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{contactPhone || 'Chưa nhập'}</strong>
                  </div>
                  {companyInfo.address && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-medium">Địa chỉ trụ sở:</span>{' '}
                      <span className="text-slate-700 dark:text-slate-300">{companyInfo.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Vị trí thực tập */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      VỊ TRÍ THỰC TẬP: *
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="VD: Frontend Developer / Data Analyst / QA Tester"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PHÒNG BAN / DỰ ÁN LÀM VIỆC:
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="VD: Phòng Phát triển phần mềm / Dự án AI Lab"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi chú bổ sung (nếu có):
                  </label>
                  <textarea
                    rows={2}
                    value={supportNote}
                    onChange={(e) => setSupportNote(e.target.value)}
                    placeholder="Ghi chú về thời gian làm việc, đề xuất hỗ trợ từ Khoa..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <label className="flex items-start gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl cursor-pointer">
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
              {/* Bước 1: Tiếp tục */}
              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Tiếp tục: Chọn trạng thái</span>
                  <span>→</span>
                </button>
              )}

              {/* Bước 2: Nút tiếp tục thông minh theo trạng thái */}
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={\`px-6 py-2.5 text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer text-white \${
                    internshipStatus === 'has_company'
                      ? 'bg-[#003087] hover:bg-[#002266]'
                      : internshipStatus === 'interviewing'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                  }\`}
                >
                  <span>
                    {internshipStatus === 'has_company'
                      ? 'Tiếp tục: Nhập thông tin doanh nghiệp (Bước 3/4)'
                      : internshipStatus === 'interviewing'
                        ? 'Tiếp tục: Kế hoạch tìm kiếm (Bước 3/3)'
                        : 'Tiếp tục: Điền nguyện vọng hỗ trợ (Bước 3/3)'}
                  </span>
                  <span>→</span>
                </button>
              )}

              {/* Bước 3: has_company -> Chuyển sang Bước 4 */}
              {currentStep === 3 && internshipStatus === 'has_company' && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Tiếp tục: Vị trí & Xác nhận (Bước 4/4)</span>
                  <span>→</span>
                </button>
              )}

              {/* Bước 3: interviewing -> Nộp hoàn tất */}
              {currentStep === 3 && internshipStatus === 'interviewing' && (
                <button
                  type="button"
                  onClick={handleSubmitInterviewing}
                  disabled={submitting || isReadOnly}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác nhận & Cập nhật tiến độ</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              )}

              {/* Bước 3: need_support -> Nộp gửi Khoa */}
              {currentStep === 3 && internshipStatus === 'need_support' && (
                <button
                  type="button"
                  onClick={handleSubmitNeedSupport}
                  disabled={submitting || isReadOnly}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <span>Gửi yêu cầu hỗ trợ tới Khoa CNTT</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              )}

              {/* Bước 4: has_company -> Nộp hoàn tất */}
              {currentStep === 4 && internshipStatus === 'has_company' && (
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
            <div className={\`p-3 rounded-xl border flex items-center justify-between \${
              internshipStatus === 'has_company'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : internshipStatus === 'interviewing'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }\`}>
              <span className="text-xs font-bold">
                {statusLabel}
              </span>
              <span className={\`w-2 h-2 rounded-full \${
                internshipStatus === 'has_company'
                  ? 'bg-emerald-500'
                  : internshipStatus === 'interviewing'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }\`}></span>
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

            {/* Thông tin theo từng trạng thái */}
            {internshipStatus === 'has_company' && companyInfo.name && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="text-slate-400 text-[11px] font-semibold">Doanh nghiệp thực tập:</div>
                <div className="font-bold text-[#003087] dark:text-sky-300 leading-snug">{companyInfo.name}</div>
                {taxCode && <div className="text-[11px] text-slate-500 font-mono">MST: {taxCode}</div>}
                {contactPerson && (
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <div><strong>CBHD (Mentor):</strong> {contactPerson}</div>
                    {contactPhone && <div><strong>SĐT:</strong> {contactPhone}</div>}
                  </div>
                )}
                {position && (
                  <div className="text-[11px] text-blue-700 dark:text-sky-400">
                    Vị trí: <strong>{position}</strong>
                  </div>
                )}
              </div>
            )}

            {internshipStatus === 'interviewing' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1 text-xs">
                <div className="text-slate-400 text-[11px]">Tiến độ tìm kiếm:</div>
                <div className="font-semibold text-amber-700 dark:text-amber-400">
                  {desiredPosition ? \`Định hướng: \${desiredPosition}\` : 'Đang chủ động ứng tuyển'}
                </div>
                {pendingCompany && (
                  <div className="text-[11px] text-slate-500">Đang PV tại: {pendingCompany}</div>
                )}
              </div>
            )}

            {internshipStatus === 'need_support' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1 text-xs">
                <div className="text-slate-400 text-[11px]">Yêu cầu hỗ trợ:</div>
                <div className="font-semibold text-rose-700 dark:text-rose-400">
                  {desiredPosition ? \`Nguyện vọng: \${desiredPosition}\` : 'Cần Khoa CNTT kết nối'}
                </div>
                <div className="text-[11px] text-slate-500">Điều phối: Đối tác chiến lược TDTU</div>
              </div>
            )}

            {/* Declaration Deadline Box */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                Hạn chót nộp khai báo:
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-amber-900 dark:text-amber-100">
                  30/09/2026
                </span>
                <span className="px-2 py-0.5 bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black rounded-full">
                  HK1 2026–2027
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
              <span>Bạn cần hỗ trợ thêm?</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Nếu bạn có vướng mắc về học phần thực tập hoặc quy chế xét tốt nghiệp, hãy liên hệ trực tiếp với Khoa CNTT.
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

fs.writeFileSync('TDTU_DB_CNTT_System/frontend/src/pages/DeclarationPage.jsx', declarationPageContent, 'utf8');
fs.writeFileSync('TDTU_DB_CNTT_System/frontend/src/pages/DeclarationPage.tsx', declarationPageContent, 'utf8');
console.log('Successfully written dynamic branching DeclarationPage.jsx and .tsx');
