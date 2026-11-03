// Students List Page Component - Chuẩn hóa thiết kế theo TDTU Enterprise Design System
// 1. Màu sắc giao diện: Trắng (#ffffff), Xanh dương (#003087), Đỏ (#dc2626)
// 2. Màu chữ: Chỉ Đen (#1f2937) và Đỏ (#dc2626)
// 3. Phông chữ: Body 11px-13px, Tiêu đề in đậm (font-bold)
// 4. Bố cục: Cân đối, chuẩn doanh nghiệp, văn bản mô tả căn đều (justify)
// 5. Tuyệt đối không dùng Emoji, sử dụng SVG vector chuyên nghiệp

const StudentsPage = ({ currentUser, activeSemester = 'hk1_2026_2027', onSemesterChange, embedded = false }) => {
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  // Filters
  const [search, setSearch] = React.useState('');
  const [majorFilter, setMajorFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('');
  const [quickFilter, setQuickFilter] = React.useState('all');

  // Selected Row IDs for Export / Bulk Delete
  const [selectedIds, setSelectedIds] = React.useState([]);

  // Pagination
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Student Detail Modal
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [detailTab, setDetailTab] = React.useState('personal');
  const [internalNote, setInternalNote] = React.useState('');
  const [studentCerts, setStudentCerts] = React.useState([]);
  const [studentCertsLoading, setStudentCertsLoading] = React.useState(false);
  const [studentCvLink, setStudentCvLink] = React.useState('');
  const [noteSaved, setNoteSaved] = React.useState(false);
  const [openActionMenuId, setOpenActionMenuId] = React.useState(null);

  // Modal Import Excel Admin / Lecturer
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importSemester, setImportSemester] = React.useState(activeSemester);
  const [importMode, setImportMode] = React.useState('replace'); // 'replace' | 'append'
  const [importFileName, setImportFileName] = React.useState('');
  const [parsedRows, setParsedRows] = React.useState([]);
  const [importing, setImporting] = React.useState(false);
  const [importSuccess, setImportSuccess] = React.useState(null);
  const [importSummary, setImportSummary] = React.useState(null);

  // Modal CRUD Sinh viên (Thêm mới / Chỉnh sửa)
  const [crudModalOpen, setCrudModalOpen] = React.useState(false);
  const [editingStudentId, setEditingStudentId] = React.useState(null);
  const [crudForm, setCrudForm] = React.useState({
    studentId: '',
    fullName: '',
    className: '',
    major: 'Kỹ thuật phần mềm',
    birthDate: '',
    birthPlace: '',
    gender: 'Nam',
    phone: '',
    courseCode: 'KTCN',
    gpa10: '',
    gpa4: '',
    academicRank: 'Khá',
    status: 'Chưa có doanh nghiệp',
    companyName: '',
    position: ''
  });
  const [crudSaving, setCrudSaving] = React.useState(false);
  const [actionToast, setActionToast] = React.useState(null);

  const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.role === 'admin' || String(currentUser?.email || '').toLowerCase() === 'duonghuuphuc@tdtu.edu.vn' || String(currentUser?.email || '').toLowerCase() === 'phamvanc@tdtu.edu.vn');
  const isStaff = Boolean(isAdmin || currentUser?.role === 'lecturer');

  // Tải danh sách chứng chỉ và link CV thực tế khi mở Modal
  React.useEffect(() => {
    if (!selectedStudent) {
      setStudentCerts([]);
      setStudentCvLink('');
      return;
    }
    const sid = String(selectedStudent.studentId || selectedStudent.mssv || '').trim().toUpperCase();
    if (!sid) {
      setStudentCerts([]);
      setStudentCvLink('');
      return;
    }

    // Tải link CV nếu có
    if (selectedStudent.cvLink || selectedStudent.cvDriveLink) {
      setStudentCvLink(selectedStudent.cvLink || selectedStudent.cvDriveLink);
    } else if (window.ApiClient?.fetchStudentCvLink) {
      window.ApiClient.fetchStudentCvLink(sid).then(cv => {
        if (cv) setStudentCvLink(cv);
      });
    }

    // Tự động làm giàu thông tin doanh nghiệp nếu chưa đầy đủ
    if (!selectedStudent.taxCode || !selectedStudent.contactPerson || !selectedStudent.position || !selectedStudent.companyAddress) {
      let decl = selectedStudent.declarationData;
      if (!decl) {
        try {
          const raw = localStorage.getItem('tdtu_decl_' + sid);
          if (raw) decl = JSON.parse(raw);
        } catch {}
      }
      if (decl) {
        setSelectedStudent((prev: any) => prev ? ({
          ...prev,
          companyName: decl.companyName || prev.companyName || prev.company,
          company: decl.companyName || prev.company,
          taxCode: decl.taxCode || prev.taxCode,
          position: decl.position || prev.position,
          companyAddress: decl.address || decl.companyAddress || prev.companyAddress,
          address: decl.address || prev.address,
          contactPerson: decl.contactPerson || decl.mentorName || decl.mentor || prev.contactPerson,
          mentorName: decl.contactPerson || decl.mentorName || decl.mentor || prev.mentorName,
          contactPhone: decl.contactPhone || decl.mentorPhone || prev.contactPhone,
          mentorPhone: decl.contactPhone || decl.mentorPhone || prev.mentorPhone,
          contactEmail: decl.contactEmail || decl.mentorEmail || prev.contactEmail,
          mentorEmail: decl.mentorEmail || decl.contactEmail || prev.mentorEmail,
          representative: decl.representative || prev.representative,
          declarationData: decl
        }) : null);
      } else if (window.FirebaseService?.db) {
        window.FirebaseService.db.collection('tdtu_declarations').doc(sid).get().then((doc: any) => {
          if (doc.exists) {
            const docData = doc.data();
            setSelectedStudent((prev: any) => prev ? ({
              ...prev,
              companyName: docData.companyName || prev.companyName || prev.company,
              company: docData.companyName || prev.company,
              taxCode: docData.taxCode || prev.taxCode,
              position: docData.position || prev.position,
              companyAddress: docData.address || docData.companyAddress || prev.companyAddress,
              address: docData.address || prev.address,
              contactPerson: docData.contactPerson || docData.mentorName || docData.mentor || prev.contactPerson,
              mentorName: docData.contactPerson || docData.mentorName || docData.mentor || prev.mentorName,
              contactPhone: docData.contactPhone || docData.mentorPhone || prev.contactPhone,
              mentorPhone: docData.contactPhone || docData.mentorPhone || prev.mentorPhone,
              contactEmail: docData.contactEmail || docData.mentorEmail || prev.contactEmail,
              mentorEmail: docData.mentorEmail || docData.contactEmail || prev.mentorEmail,
              representative: docData.representative || prev.representative,
              declarationData: docData
            }) : null);
          }
        }).catch(() => {});
      }
    }

    setStudentCertsLoading(true);
    if (window.ApiClient?.fetchStudentCerts) {
      window.ApiClient.fetchStudentCerts(sid)
        .then(data => {
          setStudentCerts(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          const fallback = window.ApiClient?.getStudentCerts ? window.ApiClient.getStudentCerts(sid) : [];
          setStudentCerts(fallback);
        })
        .finally(() => setStudentCertsLoading(false));
    } else {
      setStudentCertsLoading(false);
    }
  }, [selectedStudent]);

  const handleOpenStudentDetail = async (sv) => {
    let enriched = { ...sv };
    const sid = String(sv.studentId || sv.mssv || '').trim().toUpperCase();
    let decl = sv.declarationData;

    try {
      if (!decl) {
        const saved = localStorage.getItem('tdtu_decl_' + sid);
        if (saved) decl = JSON.parse(saved);
      }
      if (!decl && window.FirebaseService?.db) {
        const doc = await window.FirebaseService.db.collection('tdtu_declarations').doc(sid).get();
        if (doc.exists) decl = doc.data();
      }
      if (!decl && window.FirebaseService?.db) {
        const sDoc = await window.FirebaseService.db.collection('tdtu_students').doc(sid).get();
        if (sDoc.exists) {
          const sData = sDoc.data();
          if (sData?.declarationData) decl = sData.declarationData;
          else if (sData?.companyName || sData?.company) decl = sData;
        }
      }
      if (decl) {
        enriched = {
          ...enriched,
          companyName: decl.companyName || enriched.companyName || enriched.company,
          company: decl.companyName || enriched.company,
          taxCode: decl.taxCode || enriched.taxCode,
          position: decl.position || enriched.position,
          companyAddress: decl.address || decl.companyAddress || enriched.companyAddress,
          address: decl.address || enriched.address,
          contactPerson: decl.contactPerson || decl.mentorName || decl.mentor || enriched.contactPerson,
          mentorName: decl.contactPerson || decl.mentorName || decl.mentor || enriched.mentorName,
          mentorPhone: decl.contactPhone || decl.mentorPhone || enriched.mentorPhone,
          contactPhone: decl.contactPhone || decl.mentorPhone || enriched.contactPhone,
          contactEmail: decl.contactEmail || decl.mentorEmail || enriched.contactEmail,
          mentorEmail: decl.mentorEmail || decl.contactEmail || enriched.mentorEmail,
          representative: decl.representative || enriched.representative,
          declarationData: decl,
          status: (decl.internshipStatus === 'has_company' ? 'Có doanh nghiệp' : (decl.internshipStatus === 'need_support' ? 'Cần Khoa hỗ trợ' : (decl.internshipStatus === 'interviewing' ? 'Đang chờ PV/KQPV' : enriched.status)))
        };
      }
    } catch (e) {
      console.warn('Error enriching student declaration:', e);
    }

    let cv = sv.cvLink || sv.cvDriveLink || enriched.cvLink || '';
    if (!cv && decl && decl.cvDriveLink) cv = decl.cvDriveLink;
    if (!cv && window.ApiClient?.getStudentCvLink) {
      cv = window.ApiClient.getStudentCvLink(sid);
    }
    setStudentCvLink(cv);
    enriched.cvLink = cv;

    setSelectedStudent(enriched);
    setDetailTab('personal');
    setInternalNote(enriched.lecturerNote || '');

    if (!cv && window.ApiClient?.fetchStudentCvLink) {
      window.ApiClient.fetchStudentCvLink(sid).then(remoteCv => {
        if (remoteCv) {
          setStudentCvLink(remoteCv);
          setSelectedStudent(prev => prev ? { ...prev, cvLink: remoteCv } : null);
        }
      }).catch(() => {});
    }
  };

  const handleSaveInternalNote = async () => {
    if (!selectedStudent) return;
    try {
      const sid = selectedStudent.mssv || selectedStudent.studentId;
      if (window.ApiClient?.updateStudentLecturerNote) {
        await window.ApiClient.updateStudentLecturerNote(sid, internalNote, currentUser?.name, currentUser?.email);
      }
      setSelectedStudent(prev => prev ? { ...prev, lecturerNote: internalNote } : null);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
      fetchStudents();
    } catch (e) {
      alert('Lỗi lưu ghi chú: ' + e.message);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = { semester: activeSemester };
      if (search.trim()) params.search = search.trim();
      if (majorFilter) params.major = majorFilter;
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.class = classFilter;

      const res = await window.ApiClient.getStudents(params);
      let list = res?.items || res?.data?.items || res?.students || (Array.isArray(res) ? res : []);

      if ((!list || list.length === 0) && window.ApiClient?.getLiveStudents) {
        try {
          const fallback = await window.ApiClient.getLiveStudents(activeSemester);
          if (Array.isArray(fallback)) list = fallback;
        } catch {}
      }

      // Lọc bỏ các bản ghi ảo / lỗi (SV_0_, Sinh viên 521...)
      const cleanList = (list || []).filter((s: any) => {
        const sid = String(s.studentId || s.mssv || '').trim();
        const sname = String(s.fullName || s.name || '').trim();
        if (!sid || sid.startsWith('SV_0_') || sid.startsWith('SV_')) return false;
        if (/^Sinh viên 5\d+/i.test(sname)) return false;
        return true;
      });

      // 1. Lấy toàn bộ chứng chỉ realtime để map sang từng sinh viên
      let allCerts = [];
      if (window.ApiClient?.fetchAllCertificates) {
        try {
          allCerts = await window.ApiClient.fetchAllCertificates();
        } catch {}
      }
      const certsByStudent = new Map();
      if (Array.isArray(allCerts)) {
        for (const c of allCerts) {
          const csid = String(c?.studentId || '').trim().toUpperCase();
          if (csid) {
            if (!certsByStudent.has(csid)) certsByStudent.set(csid, []);
            certsByStudent.get(csid).push(c);
          }
        }
      }

      // 2. Quét toàn bộ khai báo từ Cloud Firestore để đồng bộ giữa Sinh viên và Giảng viên
      const declMap = new Map();
      const firestoreStudentsMap = new Map();
      if (window.FirebaseService?.db) {
        try {
          const declSnap = await window.FirebaseService.db.collection('tdtu_declarations').get();
          if (declSnap && !declSnap.empty) {
            declSnap.forEach((doc: any) => {
              const data = doc.data();
              const dsid = String(doc.id || data.studentId || '').trim().toUpperCase();
              if (dsid) declMap.set(dsid, data);
            });
          }
        } catch (e) {
          console.warn('[StudentsPage] Error fetching Firestore declarations:', e);
        }

        try {
          const stSnap = await window.FirebaseService.db.collection('tdtu_students').get();
          if (stSnap && !stSnap.empty) {
            stSnap.forEach((doc: any) => {
              const data = doc.data();
              const dsid = String(doc.id || data.studentId || data.mssv || '').trim().toUpperCase();
              if (dsid) firestoreStudentsMap.set(dsid, data);
            });
          }
        } catch (e) {
          console.warn('[StudentsPage] Error fetching Firestore students:', e);
        }
      }

      // 3. Tự động làm giàu danh sách sinh viên với dữ liệu khai báo thực tế, doanh nghiệp & chứng chỉ
      const enrichedList = cleanList.map((s: any) => {
        const sid = String(s.studentId || s.mssv || '').trim().toUpperCase();
        const studentCertsList = certsByStudent.get(sid) || [];
        const certDisplay = studentCertsList.length > 1
          ? studentCertsList.map((c: any) => `${c.name || 'CC'} ${c.score || ''}`.trim()).join(' · ')
          : (studentCertsList[0] ? `${studentCertsList[0].name || 'CC'} ${studentCertsList[0].score || ''}`.trim() : (s.certificateDisplay || s.cert));

        let decl = s.declarationData || declMap.get(sid);
        if (!decl) {
          try {
            const raw = localStorage.getItem('tdtu_decl_' + sid);
            if (raw) decl = JSON.parse(raw);
          } catch {}
        }
        const fsStudent = firestoreStudentsMap.get(sid);
        if (!decl && fsStudent?.declarationData) {
          decl = fsStudent.declarationData;
        }

        const cvLink = s.cvLink || s.cvDriveLink || decl?.cvDriveLink || fsStudent?.cvLink || fsStudent?.cvDriveLink || (window.ApiClient?.getStudentCvLink ? window.ApiClient.getStudentCvLink(sid) : '');

        if (decl || fsStudent?.company || fsStudent?.companyName) {
          const compName = decl?.companyName || fsStudent?.companyName || fsStudent?.company || s.companyName || s.company;
          const isComp = (decl?.internshipStatus === 'has_company') || Boolean(compName && !compName.includes('hỗ trợ') && !compName.includes('Đang tìm'));
          return {
            ...s,
            ...(fsStudent || {}),
            companyName: compName,
            company: isComp ? compName : (fsStudent?.company || s.company),
            taxCode: decl?.taxCode || fsStudent?.taxCode || s.taxCode,
            position: decl?.position || fsStudent?.position || s.position,
            companyAddress: decl?.address || decl?.companyAddress || fsStudent?.companyAddress || fsStudent?.address || s.companyAddress,
            address: decl?.address || fsStudent?.address || s.address,
            contactPerson: decl?.contactPerson || decl?.mentorName || fsStudent?.contactPerson || fsStudent?.mentorName || s.contactPerson,
            mentorName: decl?.contactPerson || decl?.mentorName || fsStudent?.mentorName || fsStudent?.contactPerson || s.mentorName,
            contactPhone: decl?.contactPhone || decl?.mentorPhone || fsStudent?.contactPhone || fsStudent?.mentorPhone || s.contactPhone,
            mentorPhone: decl?.contactPhone || decl?.mentorPhone || fsStudent?.mentorPhone || fsStudent?.contactPhone || s.mentorPhone,
            contactEmail: decl?.contactEmail || decl?.mentorEmail || fsStudent?.contactEmail || fsStudent?.mentorEmail || s.contactEmail,
            mentorEmail: decl?.mentorEmail || decl?.contactEmail || fsStudent?.mentorEmail || fsStudent?.contactEmail || s.mentorEmail,
            representative: decl?.representative || fsStudent?.representative || s.representative,
            declarationData: decl || fsStudent?.declarationData,
            cvLink: cvLink,
            cert: certDisplay || fsStudent?.cert || s.cert,
            certificateDisplay: certDisplay || fsStudent?.certificateDisplay || s.certificateDisplay,
            certName: certObj?.name || fsStudent?.certName || s.certName,
            certScore: certObj?.score || fsStudent?.certScore || s.certScore,
            status: isComp ? 'Có doanh nghiệp' : (decl?.internshipStatus === 'need_support' ? 'Cần Khoa hỗ trợ' : (decl?.internshipStatus === 'interviewing' ? 'Đang chờ PV/KQPV' : (fsStudent?.status || s.status)))
          };
        }
        return {
          ...s,
          ...(fsStudent || {}),
          cvLink: cvLink,
          cert: certDisplay || fsStudent?.cert || s.cert,
          certificateDisplay: certDisplay || fsStudent?.certificateDisplay || s.certificateDisplay,
          certName: certObj?.name || fsStudent?.certName || s.certName,
          certScore: certObj?.score || fsStudent?.certScore || s.certScore,
        };
      });

      setStudents(enrichedList);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStudents();

    const handleRealtimeUpdate = () => {
      fetchStudents();
    };

    window.addEventListener('tdtu_data_updated', handleRealtimeUpdate);
    window.addEventListener('tdtu_decl_updated', handleRealtimeUpdate);
    window.addEventListener('tdtu_certs_updated', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);
    window.addEventListener('focus', handleRealtimeUpdate);

    let bc = null;
    try {
      bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.onmessage = () => {
        handleRealtimeUpdate();
      };
    } catch {}

    return () => {
      window.removeEventListener('tdtu_data_updated', handleRealtimeUpdate);
      window.removeEventListener('tdtu_decl_updated', handleRealtimeUpdate);
      window.removeEventListener('tdtu_certs_updated', handleRealtimeUpdate);
      window.removeEventListener('storage', handleRealtimeUpdate);
      window.removeEventListener('focus', handleRealtimeUpdate);
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }, [activeSemester]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
    setCurrentPage(1);
  };

  const getInitials = (name = '') => {
    if (!name) return 'SV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Status Badge Renderer - Tối ưu màu sắc trực quan theo phản hồi người dùng
  const renderStatusBadge = (status, noCompanyOption, hasChangedFromSupport) => {
    let mainBadge = null;
    if (noCompanyOption === 'faculty' || status === 'need_support' || status === 'Cần hỗ trợ') {
      mainBadge = (
        <span className="bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] px-3 py-1 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>
          <span>Cần hỗ trợ</span>
        </span>
      );
    } else if (status === 'Đã có nơi' || status === 'Có doanh nghiệp' || status === 'has_company') {
      mainBadge = (
        <span className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] px-3 py-1 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#15803d]"></span>
          <span>Đã có nơi</span>
        </span>
      );
    } else {
      mainBadge = (
        <span className="bg-[#fffbeb] text-[#b45309] border border-[#fde68a] px-3 py-1 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#b45309]"></span>
          <span>{status === 'interviewing' || status === 'Chờ phỏng vấn' ? 'Chờ phỏng vấn' : 'Đang tìm nơi TT'}</span>
        </span>
      );
    }

    if (hasChangedFromSupport) {
      return (
        <div className="flex flex-col items-start gap-1">
          {mainBadge}
          <span className="bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe] px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1" title="Sinh viên đã tự tìm được nơi thực tập">
            <span>Đã tự tìm được</span>
          </span>
        </div>
      );
    }
    return mainBadge;
  };

  // Trích xuất danh sách lớp và ngành từ dữ liệu thực tế
  const availableClasses = React.useMemo(() => {
    const set = new Set();
    (students || []).forEach(s => {
      const c = s.class || s.className;
      if (c && typeof c === 'string') set.add(c.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const availableMajors = React.useMemo(() => {
    const set = new Set();
    (students || []).forEach(s => {
      const m = s.major;
      if (m && typeof m === 'string') set.add(m.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Quick filter logic
  const filteredStudents = React.useMemo(() => {
    return students.filter(s => {
      if (quickFilter === 'need_support') {
        if (s.noCompanyOption !== 'faculty' && s.status !== 'need_support' && s.status !== 'Cần hỗ trợ') return false;
      } else if (quickFilter === 'has_company') {
        if (s.status !== 'has_company' && s.status !== 'Đã có nơi' && s.status !== 'Có doanh nghiệp') return false;
      } else if (quickFilter === 'no_company') {
        if (s.status === 'has_company' || s.status === 'Đã có nơi' || s.status === 'Có doanh nghiệp' || s.status === 'need_support' || s.noCompanyOption === 'faculty') return false;
      } else if (quickFilter === 'is_dual') {
        if (s.isDualCourse !== 1 && !s.courses?.includes('KTCN & TSNN')) return false;
      } else if (quickFilter === 'has_cert') {
        if (!s.certificateDisplay && !s.certName && !s.cert) return false;
      } else if (quickFilter === 'ktcn') {
        if (s.courseCode !== 'KTCN' && !s.courses?.includes('KTCN') && !s.courses?.includes('Kiến tập công nghiệp')) return false;
      } else if (quickFilter === 'tsnn') {
        if (s.courseCode !== 'TSNN' && !s.courses?.includes('TSNN') && !s.courses?.includes('Tập sự nghề nghiệp')) return false;
      }

      if (majorFilter && majorFilter !== 'all' && s.major !== majorFilter) return false;
      if (statusFilter && statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (classFilter && classFilter !== 'all' && (s.class !== classFilter && s.className !== classFilter)) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const mssvMatch = (s.studentId || s.mssv || '').toLowerCase().includes(q);
        const nameMatch = (s.fullName || s.name || '').toLowerCase().includes(q);
        const compMatch = (s.companyName || s.company || '').toLowerCase().includes(q);
        if (!mssvMatch && !nameMatch && !compMatch) return false;
      }

      return true;
    });
  }, [students, quickFilter, majorFilter, statusFilter, classFilter, search]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map(s => s.studentId || s.id || s.mssv));
    }
  };

  const getPaginationNumbers = (curr, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= curr - delta && i <= curr + delta)) {
        range.push(i);
      }
    }
    let l;
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  // Import Excel Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const XLSX = window.XLSX;
        if (!XLSX) {
          alert('Thư viện đọc file Excel chưa sẵn sàng.');
          return;
        }
        const wb = XLSX.read(bstr, { type: 'binary' });

        const studentMap = {};
        let ktcnCount = 0;
        let tsnnCount = 0;

        wb.SheetNames.forEach((sName, sIdx) => {
          const ws = wb.Sheets[sName];
          const rawData = XLSX.utils.sheet_to_json(ws);
          const lowerName = sName.toLowerCase();

          let defaultSheetCourse = 'KTCN';
          if (lowerName.includes('tsnn') || lowerName.includes('tập sự') || lowerName.includes('tap su')) {
            defaultSheetCourse = 'TSNN';
          } else if (lowerName.includes('ktcn') || lowerName.includes('kiến tập') || lowerName.includes('kien tap')) {
            defaultSheetCourse = 'KTCN';
          } else {
            defaultSheetCourse = sIdx === 1 ? 'KTCN' : 'TSNN';
          }

          rawData.forEach((row) => {
            const mssvRaw = row['Mã số'] || row['Mã số SV'] || row['Mã SV'] || row['Mã sinh viên'] || row.mssv || row.MSSV || row.studentId || row['Mã'] || '';
            const mssv = String(mssvRaw).trim();
            if (!mssv || mssv === 'Mã số' || mssv === 'MSSV' || mssv.toLowerCase().startsWith('stt') || mssv.toLowerCase().startsWith('số lượng')) return;

            let fullName = '';
            const hoLot = String(row['Họ lót'] || row['Họ'] || '').trim();
            const ten = String(row['Tên'] || '').trim();
            if (hoLot && ten) {
              fullName = `${hoLot} ${ten}`.trim();
            } else if (row['Họ và tên'] || row['Họ và Tên'] || row.fullName || row.name) {
              fullName = String(row['Họ và tên'] || row['Họ và Tên'] || row.fullName || row.name).trim();
            } else if (ten) {
              fullName = ten;
            } else {
              fullName = 'Sinh viên TDTU';
            }

            const className = String(row['Lớp'] || row.class || row['Lớp sinh hoạt'] || '20050401').trim();
            let major = String(row['Ngành'] || row.major || '').trim();
            if (!major) {
              if (className.includes('501')) major = 'Khoa học máy tính';
              else if (className.includes('502')) major = 'Kỹ thuật phần mềm';
              else if (className.includes('503')) major = 'Mạng máy tính và truyền thông dữ liệu';
              else if (className.includes('504')) major = 'Hệ thống thông tin';
              else major = 'Khoa học máy tính';
            }

            let year = 'Năm 4';
            if (className.startsWith('19') || className.startsWith('18')) year = 'Năm 5 / Chuẩn bị tốt nghiệp';
            else if (className.startsWith('20') || className.startsWith('21')) year = 'Năm 4';
            else if (className.startsWith('22')) year = 'Năm 3';

            const tenMH = String(row['Tên MH'] || row['Môn học'] || row['Học phần'] || row['Học phần ĐK'] || row['Môn học đăng ký'] || row['Mã MH'] || row.courseCode || row.course || '').toLowerCase();
            let rowCourse = defaultSheetCourse;
            if (tenMH.includes('dự án') || tenMH.includes('tập sự') || tenMH.includes('tsnn') || tenMH.includes('504075') || tenMH.includes('504096')) {
              rowCourse = 'TSNN';
            } else if (tenMH.includes('kiến tập') || tenMH.includes('ktcn') || tenMH.includes('504074') || tenMH.includes('504095')) {
              rowCourse = 'KTCN';
            }

            const gpa4Raw = row['GPA (Hệ 4)'] || row.gpa4 || row.gpa || row.GPA || row['Điểm TB'];
            const gpa4Val = parseFloat(gpa4Raw);
            const finalGpa4 = isNaN(gpa4Val) ? 3.0 : gpa4Val;

            const gpa10Raw = row['GPA (Hệ 10)'] || row.gpa10 || row['Điểm TB Hệ 10'];
            const gpa10Val = parseFloat(gpa10Raw);
            const finalGpa10 = isNaN(gpa10Val) ? Number((finalGpa4 * 2.5).toFixed(2)) : gpa10Val;

            const academicRank = String(row['Xếp loại'] || row['Xếp loại học lực'] || row.academicRank || (finalGpa10 >= 9.0 ? 'Xuất sắc' : (finalGpa10 >= 8.0 ? 'Giỏi' : (finalGpa10 >= 6.5 ? 'Khá' : 'Trung bình')))).trim();

            let birthDateStr = '';
            const rawBirth = row['Ngày sinh'] || row.birthDate || row['NgaySinh'];
            if (rawBirth) {
              if (typeof rawBirth === 'number' || (!isNaN(rawBirth) && !String(rawBirth).includes('/') && !String(rawBirth).includes('-'))) {
                const serial = parseFloat(rawBirth);
                const utc_days = Math.floor(serial - 25569);
                const date_info = new Date(utc_days * 86400 * 1000);
                birthDateStr = date_info.toLocaleDateString('vi-VN');
              } else {
                birthDateStr = String(rawBirth).trim();
              }
            }

            const birthPlace = String(row['Nơi sinh'] || row.birthPlace || row['NoiSinh'] || '').trim();
            const phone = String(row.phone || row['Số điện thoại'] || row['Điện thoại'] || '—').trim();

            if (!studentMap[mssv]) {
              studentMap[mssv] = {
                stt: Object.keys(studentMap).length + 1,
                mssv,
                studentId: mssv,
                name: fullName,
                fullName,
                class: className,
                className,
                major,
                year,
                gpa: finalGpa4,
                gpa4: finalGpa4,
                gpa10: finalGpa10,
                academicRank,
                birthDate: birthDateStr,
                birthPlace,
                phone,
                courses: [rowCourse],
                courseCode: rowCourse,
                courseName: rowCourse === 'KTCN' ? 'Kiến tập Công nghiệp' : 'Tập sự Nghề nghiệp',
                isDualCourse: 0,
                status: 'Chưa có doanh nghiệp',
                companyName: 'Chưa có',
                updatedAt: new Date().toLocaleDateString('vi-VN')
              };
              if (rowCourse === 'KTCN') ktcnCount++;
              if (rowCourse === 'TSNN') tsnnCount++;
            } else {
              if (!studentMap[mssv].courses.includes(rowCourse)) {
                studentMap[mssv].courses.push(rowCourse);
                studentMap[mssv].isDualCourse = 1;
                studentMap[mssv].courseCode = 'KTCN & TSNN';
                studentMap[mssv].courseName = 'Thực tập Song song (KTCN + TSNN)';
                if (rowCourse === 'KTCN') ktcnCount++;
                if (rowCourse === 'TSNN') tsnnCount++;
              }
              if (!studentMap[mssv].gpa10 && finalGpa10) studentMap[mssv].gpa10 = finalGpa10;
              if (finalGpa4 && studentMap[mssv].gpa === 3.0) {
                studentMap[mssv].gpa = finalGpa4;
                studentMap[mssv].gpa4 = finalGpa4;
                studentMap[mssv].academicRank = academicRank;
              }
              if (birthDateStr && !studentMap[mssv].birthDate) studentMap[mssv].birthDate = birthDateStr;
              if (birthPlace && !studentMap[mssv].birthPlace) studentMap[mssv].birthPlace = birthPlace;
            }
          });
        });

        const mergedStudents = Object.values(studentMap);
        const dualCount = mergedStudents.filter(s => s.isDualCourse === 1).length;

        setParsedRows(mergedStudents);
        setImportSummary({
          totalUnique: mergedStudents.length,
          ktcnCount,
          tsnnCount,
          dualCount,
          sheets: wb.SheetNames
        });
      } catch (err) {
        alert('Lỗi khi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    try {
      setImporting(true);
      const res = await window.ApiClient.importStudentsExcel(importSemester, parsedRows, importMode);
      setImportSuccess(`Đã import (${importMode === 'replace' ? 'Thay thế toàn bộ' : 'Gộp thêm'}) thành công ${res?.importedCount || parsedRows.length} sinh viên vào ${importSemester}!`);
      setTimeout(() => {
        setImportModalOpen(false);
        setImportSuccess(null);
        setParsedRows([]);
        setImportFileName('');
        fetchStudents();
      }, 1000);
    } catch (err) {
      alert('Lỗi import: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Mở Modal Thêm sinh viên mới
  const handleOpenAddStudent = () => {
    setEditingStudentId(null);
    setCrudForm({
      studentId: '',
      fullName: '',
      className: '22H50201',
      major: 'Kỹ thuật phần mềm',
      birthDate: '',
      birthPlace: 'TP. Hồ Chí Minh',
      gender: 'Nam',
      phone: '',
      courseCode: 'KTCN',
      gpa10: '7.80',
      gpa4: '3.12',
      academicRank: 'Khá',
      status: 'Chưa có doanh nghiệp',
      companyName: '',
      position: ''
    });
    setCrudModalOpen(true);
  };

  // Mở Modal Sửa sinh viên
  const handleOpenEditStudent = (sv) => {
    const sid = sv.studentId || sv.mssv;
    setEditingStudentId(sid);
    const cCode = sv.isDualCourse ? 'KTCN & TSNN' : (sv.courseCode || (sv.courses?.includes('TSNN') ? 'TSNN' : 'KTCN'));
    setCrudForm({
      studentId: sid,
      fullName: sv.fullName || sv.name || '',
      className: sv.className || sv.class || '',
      major: sv.major || 'Kỹ thuật phần mềm',
      birthDate: sv.birthDate || '',
      birthPlace: sv.birthPlace || '',
      gender: sv.gender || 'Nam',
      phone: sv.phone && sv.phone !== '—' ? sv.phone : '',
      courseCode: cCode,
      gpa10: sv.gpa10 != null ? String(sv.gpa10) : '',
      gpa4: (sv.gpa4 != null ? String(sv.gpa4) : (sv.gpa != null ? String(sv.gpa) : '')),
      academicRank: sv.academicRank || 'Khá',
      status: sv.status || 'Chưa có doanh nghiệp',
      companyName: sv.companyName && sv.companyName !== 'Chưa có' ? sv.companyName : (sv.company && sv.company !== 'Chưa có' ? sv.company : ''),
      position: sv.position && sv.position !== 'Chưa cập nhật' ? sv.position : ''
    });
    setCrudModalOpen(true);
  };

  // Lưu Thêm mới / Cập nhật Sinh viên
  const handleSaveCrudStudent = async (e) => {
    if (e) e.preventDefault();
    const sid = String(crudForm.studentId || '').trim().toUpperCase();
    const name = String(crudForm.fullName || '').trim();
    if (!sid || !name) {
      alert('Vui lòng nhập đầy đủ Mã số sinh viên (MSSV) và Họ tên.');
      return;
    }
    setCrudSaving(true);
    try {
      const gpa4Num = parseFloat(String(crudForm.gpa4).replace(',', '.')) || 0;
      const gpa10Num = parseFloat(String(crudForm.gpa10).replace(',', '.')) || (gpa4Num > 0 ? Number((gpa4Num * 2.5).toFixed(2)) : 0);
      const isDual = crudForm.courseCode === 'KTCN & TSNN';
      const courses = isDual ? ['KTCN', 'TSNN'] : [crudForm.courseCode || 'KTCN'];
      const payload = {
        studentId: sid,
        mssv: sid,
        fullName: name,
        name: name,
        className: crudForm.className || '22H50201',
        class: crudForm.className || '22H50201',
        major: crudForm.major || 'Kỹ thuật phần mềm',
        birthDate: crudForm.birthDate || '',
        birthPlace: crudForm.birthPlace || '',
        gender: crudForm.gender || 'Nam',
        phone: crudForm.phone || '—',
        courses,
        courseCode: crudForm.courseCode,
        courseName: isDual ? 'Thực tập Song song (KTCN + TSNN)' : (crudForm.courseCode === 'TSNN' ? 'Tập sự Nghề nghiệp' : 'Kiến tập Công nghiệp'),
        isDualCourse: isDual ? 1 : 0,
        gpa4: gpa4Num,
        gpa: gpa4Num,
        gpa10: gpa10Num,
        academicRank: crudForm.academicRank || (gpa4Num >= 3.6 ? 'Xuất sắc' : gpa4Num >= 3.2 ? 'Giỏi' : gpa4Num >= 2.5 ? 'Khá' : 'Trung bình'),
        status: crudForm.status || 'Chưa có doanh nghiệp',
        companyName: crudForm.companyName || (crudForm.status === 'need_support' ? 'Khoa CNTT hỗ trợ' : 'Chưa có'),
        company: crudForm.companyName || (crudForm.status === 'need_support' ? 'Khoa CNTT hỗ trợ' : 'Chưa có'),
        position: crudForm.position || 'Thực tập sinh',
        updatedAt: new Date().toLocaleDateString('vi-VN')
      };

      if (editingStudentId) {
        await window.ApiClient.updateStudent(editingStudentId, payload, activeSemester);
        setActionToast(`Đã cập nhật thông tin sinh viên ${name} (${sid}) thành công!`);
        if (selectedStudent && (selectedStudent.studentId === editingStudentId || selectedStudent.mssv === editingStudentId)) {
          setSelectedStudent(prev => ({ ...prev, ...payload }));
        }
      } else {
        await window.ApiClient.createStudent(payload, activeSemester);
        setActionToast(`Đã thêm mới sinh viên ${name} (${sid}) thành công!`);
      }
      setCrudModalOpen(false);
      setTimeout(() => setActionToast(null), 4000);
      fetchStudents();
    } catch (err) {
      alert('Lỗi lưu sinh viên: ' + err.message);
    } finally {
      setCrudSaving(false);
    }
  };

  // Xóa 1 sinh viên
  const handleDeleteSingleStudent = async (sv) => {
    const sid = sv.studentId || sv.mssv;
    const sname = sv.fullName || sv.name || sid;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sinh viên ${sname} (${sid}) khỏi danh sách?`)) return;
    try {
      await window.ApiClient.deleteStudent(sid, activeSemester);
      setSelectedIds(prev => prev.filter(id => id !== sid));
      if (selectedStudent && (selectedStudent.studentId === sid || selectedStudent.mssv === sid)) {
        setSelectedStudent(null);
      }
      setActionToast(`Đã xóa sinh viên ${sname} (${sid}) khỏi hệ thống.`);
      setTimeout(() => setActionToast(null), 3500);
      fetchStudents();
    } catch (err) {
      alert('Lỗi xóa sinh viên: ' + err.message);
    }
  };

  // Xóa hàng loạt sinh viên đã chọn
  const handleBulkDeleteStudents = async () => {
    if (!selectedIds || selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} sinh viên đang chọn khỏi danh sách?`)) return;
    try {
      await window.ApiClient.bulkDeleteStudents(selectedIds, activeSemester);
      setActionToast(`Đã xóa ${selectedIds.length} sinh viên thành công.`);
      setSelectedIds([]);
      setTimeout(() => setActionToast(null), 3500);
      fetchStudents();
    } catch (err) {
      alert('Lỗi xóa hàng loạt: ' + err.message);
    }
  };

  // Xóa sạch toàn bộ dữ liệu để test bộ data mới từ bên ngoài
  const handleClearAllStudents = async () => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ danh sách sinh viên hiện tại để nạp dữ liệu mới từ bên ngoài?')) return;
    try {
      await window.ApiClient.clearAllStudents(activeSemester);
      setSelectedIds([]);
      setStudents([]);
      setActionToast('Đã xóa sạch danh sách sinh viên. Bạn có thể Nhập file Excel mới hoặc Thêm sinh viên mới.');
      setTimeout(() => setActionToast(null), 4500);
      fetchStudents();
    } catch (err) {
      alert('Lỗi làm sạch dữ liệu: ' + err.message);
    }
  };

  // Tải file Excel mẫu chuẩn (kèm GPA & Học lực) để test Import
  const handleDownloadSampleExcel = () => {
    try {
      const XLSX = window.XLSX;
      if (!XLSX) {
        alert('Thư viện Excel đang tải, vui lòng thử lại.');
        return;
      }
      const wb = XLSX.utils.book_new();
      const sampleKTCN = [
        { 'STT': 1, 'Mã số': '522H0101', 'Họ lót': 'Nguyễn Hoàng', 'Tên': 'ách', 'Phái': 'Nam', 'Ngày sinh': '15/05/2004', 'Nơi sinh': 'TP. Hồ Chí Minh', 'Lớp': '22H50201', 'Ngành': 'Kỹ thuật phần mềm', 'GPA (Hệ 10)': 8.5, 'GPA (Hệ 4)': 3.4, 'Xếp loại': 'Giỏi', 'Số điện thoại': '0901234567' },
        { 'STT': 2, 'Mã số': '522H0102', 'Họ lót': 'Trần Thảo', 'Tên': 'My', 'Phái': 'Nữ', 'Ngày sinh': '20/08/2004', 'Nơi sinh': 'Đồng Nai', 'Lớp': '22H50101', 'Ngành': 'Khoa học máy tính', 'GPA (Hệ 10)': 9.1, 'GPA (Hệ 4)': 3.7, 'Xếp loại': 'Xuất sắc', 'Số điện thoại': '0902345678' }
      ];
      const sampleTSNN = [
        { 'STT': 1, 'Mã số': '522H0101', 'Họ lót': 'Nguyễn Hoàng', 'Tên': 'ách', 'Phái': 'Nam', 'Ngày sinh': '15/05/2004', 'Nơi sinh': 'TP. Hồ Chí Minh', 'Lớp': '22H50201', 'Ngành': 'Kỹ thuật phần mềm', 'GPA (Hệ 10)': 8.5, 'GPA (Hệ 4)': 3.4, 'Xếp loại': 'Giỏi', 'Số điện thoại': '0901234567' },
        { 'STT': 2, 'Mã số': '522H0103', 'Họ lót': 'Lê Minh', 'Tên': 'Khôi', 'Phái': 'Nam', 'Ngày sinh': '10/11/2003', 'Nơi sinh': 'Long An', 'Lớp': '21H50301', 'Ngành': 'Mạng máy tính và truyền thông dữ liệu', 'GPA (Hệ 10)': 7.2, 'GPA (Hệ 4)': 2.88, 'Xếp loại': 'Khá', 'Số điện thoại': '0903456789' }
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleKTCN), 'DSSV_KTCN');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleTSNN), 'DSSV_TSNN');
      XLSX.writeFile(wb, 'File_Mau_Import_DSSV_KTCN_TSNN_GPA.xlsx');
    } catch (err) {
      alert('Lỗi tạo file mẫu: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Toast thông báo thao tác CRUD */}
      {actionToast && (
        <div className="p-4 rounded-xl bg-[#ebf3ff] border border-[#bfdbfe] text-[#003087] text-[14px] font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <span>✓ {actionToast}</span>
          <button type="button" onClick={() => setActionToast(null)} className="underline ml-4 cursor-pointer">Đóng</button>
        </div>
      )}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`${embedded ? 'text-[22px] sm:text-[24px]' : 'text-[28px] sm:text-[30px]'} font-bold text-[#1f2937] text-left flex items-center gap-3`}>
            <span>Danh sách sinh viên thực tập</span>
            <span className="px-3 py-1 rounded-full text-[13px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]">
              {totalItems} sinh viên
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAddStudent}
              className="px-5 py-2.5 min-w-[160px] h-[38px] whitespace-nowrap bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[13px] font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
              title="Thêm mới 1 sinh viên vào học kỳ hiện tại"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-white font-bold">+ Thêm sinh viên</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="px-5 py-2.5 min-w-[140px] h-[38px] whitespace-nowrap bg-white text-[#003087] border border-[#003087] hover:bg-[#ebf3ff] rounded-lg text-[13px] font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
              title="Nhập danh sách sinh viên từ file Excel bên ngoài"
            >
              <svg className="w-4 h-4 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Nhập Excel</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!filteredStudents || filteredStudents.length === 0) {
                alert('Chưa có danh sách sinh viên để xuất Excel. Vui lòng nhập danh sách trước.');
                return;
              }
              window.ApiClient.exportStudentsExcel(filteredStudents, activeSemester);
            }}
            className="px-5 py-2.5 min-w-[140px] h-[38px] whitespace-nowrap bg-white text-[#1f2937] border border-[#cbd5e1] hover:bg-[#f8fafc] rounded-lg text-[13px] font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
            title="Xuất bảng sinh viên hiện tại ra file Excel (.xlsx)"
          >
            <svg className="w-4 h-4 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Xuất Excel</span>
          </button>

          {isAdmin && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDeleteStudents}
              className="px-5 py-2.5 min-w-[140px] h-[38px] whitespace-nowrap bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] hover:bg-[#fee2e2] rounded-lg text-[13px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              title="Xóa các sinh viên đang được đánh dấu"
            >
              <span>Xóa đã chọn ({selectedIds.length})</span>
            </button>
          )}

          {isAdmin && students.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllStudents}
              className="px-3.5 py-2.5 bg-white text-[#dc2626] border border-[#fecaca] hover:bg-[#fef2f2] rounded-lg text-[13px] font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              title="Xóa sạch toàn bộ danh sách để test import file Excel mới"
            >
              <span>Làm sạch DL</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Data Card with Compact Integrated Filters */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xs overflow-hidden">
        {/* Search & Filter Bar (Chuẩn tuyệt đối: Không đè chữ, Bộ lọc tinh gọn như thanh tìm kiếm) */}
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80 flex items-center">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#4b5563]">
              <svg className="w-5 h-5 text-[#4b5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              style={{ paddingLeft: '44px' }}
              className="w-full pr-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-[14.5px] font-medium text-[#1f2937] outline-none focus:bg-white focus:border-[#003087] focus:ring-2 focus:ring-[#003087]"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            {/* Bộ lọc trạng thái nhanh 8 lựa chọn (Hình 4: Tinh gọn chuẩn kiểu dáng thanh tìm kiếm) */}
            <select
              value={quickFilter}
              onChange={e => setQuickFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-[14px] font-bold text-[#1f2937] outline-none cursor-pointer focus:border-[#003087] focus:ring-2 focus:ring-[#003087]"
            >
              <option value="all">Trạng thái: Tất cả sinh viên ({totalItems})</option>
              <option value="need_support">Cần hỗ trợ</option>
              <option value="no_company">Đang tìm / Chờ PV</option>
              <option value="has_company">Đã có nơi TT</option>
              <option value="is_dual">Học song song</option>
              <option value="has_cert">Đã nộp chứng chỉ</option>
              <option value="ktcn">Kiến tập (KTCN)</option>
              <option value="tsnn">Tập sự (TSNN)</option>
            </select>

            {/* Học kỳ */}
            <select
              value={activeSemester}
              onChange={e => onSemesterChange && onSemesterChange(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-[14px] font-semibold text-[#1f2937] outline-none cursor-pointer focus:border-[#003087]"
            >
              <option value="hk1_2026_2027">HK1 2026–2027</option>
              <option value="hk2_2025_2026">HK2 2025–2026</option>
              <option value="hk1_2025_2026">HK1 2025–2026</option>
            </select>

            {/* Ngành */}
            <select
              value={majorFilter}
              onChange={e => setMajorFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-[14px] font-semibold text-[#1f2937] outline-none cursor-pointer focus:border-[#003087]"
            >
              <option value="all">Tất cả ngành</option>
              {availableMajors.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Lớp */}
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-[14px] font-semibold text-[#1f2937] outline-none cursor-pointer focus:border-[#003087]"
            >
              <option value="all">Tất cả lớp</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {(quickFilter !== 'all' || majorFilter !== 'all' || classFilter !== 'all' || search) && (
              <button
                type="button"
                onClick={() => {
                  setQuickFilter('all');
                  setMajorFilter('all');
                  setClassFilter('all');
                  setSearch('');
                }}
                className="px-3 py-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1f2937] text-[13.5px] font-bold rounded-xl transition cursor-pointer"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] border-collapse table-fixed min-w-[1200px]">
            <thead>
              <tr className="bg-[#f8fafc] text-[#1f2937] text-[13.5px] uppercase tracking-wider font-bold border-b border-[#e5e7eb]">
                <th className="py-4 px-4 w-12 text-center">
                  {isAdmin ? (
                    <input
                      type="checkbox"
                      checked={paginatedStudents.length > 0 && selectedIds.length === paginatedStudents.length}
                      onChange={handleSelectAll}
                      className="rounded border-[#cbd5e1] text-[#003087] focus:ring-[#003087]"
                    />
                  ) : (
                    <span className="text-[12px] font-bold text-[#64748b]">STT</span>
                  )}
                </th>
                <th className="py-4 px-3 w-28">MSSV</th>
                <th className="py-4 px-3 w-56">HỌ VÀ TÊN</th>
                <th className="py-4 px-3 w-32">MÔN HỌC</th>
                <th className="py-4 px-3 w-40 text-center">TRẠNG THÁI</th>
                <th className="py-4 px-3 w-64">DOANH NGHIỆP</th>
                <th className="py-4 px-3 w-36 text-center">NGÀY CẬP NHẬT</th>
                <th className="py-4 px-4 w-24 text-center">CHI TIẾT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[#1f2937] font-semibold">
                    Không tìm thấy sinh viên nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((sv, idx) => {
                  const id = sv.studentId || sv.id || `SV_${idx}`;
                  const isChecked = selectedIds.includes(id);
                  const displayName = sv.fullName || sv.name || "Sinh viên";
                  const initials = getInitials(displayName);

                  return (
                    <tr 
                      key={id}
                      className={`hover:bg-[#f8fafc] transition ${
                        isChecked ? 'bg-[#ebf3ff]/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        {isAdmin ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(id)}
                            className="rounded border-[#cbd5e1] text-[#003087] focus:ring-[#003087]"
                          />
                        ) : (
                          <span className="text-[12.5px] font-mono font-bold text-[#64748b]">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-bold font-mono text-[#003087] text-[14px]">
                        {sv.studentId || sv.mssv || '522H0001'}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#ebf3ff] text-[#003087] flex items-center justify-center font-bold text-[11px] shrink-0 border border-[#bfdbfe]">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#1f2937] text-[14.5px] flex items-center gap-1.5 flex-wrap">
                              <span 
                                onClick={() => handleOpenStudentDetail(sv)}
                                className="hover:text-[#003087] hover:underline cursor-pointer transition"
                                title="Nhấn để xem chi tiết hồ sơ sinh viên"
                              >
                                {displayName}
                              </span>
                              {(sv.certificateDisplay || sv.certName || sv.cert) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]" title="Chứng chỉ ngoại ngữ">
                                  <span>{sv.certificateDisplay || (sv.certName ? `${sv.certName} ${sv.certScore || ''}` : sv.cert)}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[13px] text-[#4b5563] font-medium">{sv.className || sv.class || sv.major || 'KTPM22A'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-3 py-1 rounded-lg font-bold text-[13px] bg-[#f1f5f9] text-[#1e293b] border border-[#cbd5e1]">
                          {(() => {
                            const cArr = Array.isArray(sv.courses) ? sv.courses.map((c: any) => String(c).toUpperCase()) : [];
                            const cCode = String(sv.courseCode || sv.course_str || sv.courseName || '').toUpperCase();
                            if (sv.isDualCourse || cArr.length > 1 || (cCode.includes('KTCN') && cCode.includes('TSNN')) || cCode.includes('SONG SONG')) return 'KTCN & TSNN';
                            if (cArr.some((c: string) => c.includes('TSNN') || c.includes('TẬP SỰ')) || cCode.includes('TSNN') || cCode.includes('TẬP SỰ') || sv.tsnnEnrolled === 1) return 'TSNN';
                            return 'KTCN';
                          })()}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {renderStatusBadge(sv.status, sv.noCompanyOption, sv.hasChangedFromSupport)}
                      </td>

                      <td className="py-3.5 px-3 text-[#1f2937]">
                        <div className="font-bold text-[14.5px] text-[#003087] truncate">
                          {sv.companyName || (sv.noCompanyOption === 'faculty' ? 'Khoa CNTT hỗ trợ' : (sv.status === 'has_company' ? 'Doanh nghiệp tiếp nhận' : '—'))}
                        </div>
                        {sv.position && sv.position !== 'Chưa cập nhật' && (
                          <div className="text-[13px] text-[#4b5563] truncate">
                            Vị trí: {sv.position}
                          </div>
                        )}
                        {sv.contactPerson && (
                          <div className="text-[13px] text-[#003087] font-semibold mt-0.5 truncate">
                            Mentor: {sv.contactPerson} {sv.contactPhone ? `(${sv.contactPhone})` : ''}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-[#4b5563] text-[13.5px] font-mono text-center">
                        {sv.updatedAt && typeof sv.updatedAt === 'string' && sv.updatedAt.includes('T') && !isNaN(Date.parse(sv.updatedAt))
                          ? new Date(sv.updatedAt).toLocaleDateString('vi-VN')
                          : (sv.updatedAt || sv.updated || '22/09/2026')}
                      </td>

                      <td className="py-3.5 px-4 text-center relative">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === id ? null : id);
                            }}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition cursor-pointer border shadow-2xs ${
                              openActionMenuId === id
                                ? 'bg-[#003087] text-white border-[#003087]'
                                : 'bg-white hover:bg-[#ebf3ff] text-[#1f2937] hover:text-[#003087] border-[#cbd5e1]'
                            }`}
                            title="Tùy chọn thao tác"
                          >
                            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="1.75" />
                              <circle cx="12" cy="12" r="1.75" />
                              <circle cx="12" cy="19" r="1.75" />
                            </svg>
                          </button>

                          {openActionMenuId === id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(null);
                                }}
                              />
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-[#e5e7eb] py-1.5 z-40 text-left"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenStudentDetail(sv);
                                  }}
                                  className="w-full px-4 py-2 text-[12.5px] font-bold text-[#1f2937] hover:bg-[#ebf3ff] hover:text-[#003087] flex items-center gap-2.5 transition text-left cursor-pointer"
                                >
                                  <svg className="w-4 h-4 text-[#003087] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>Hồ sơ</span>
                                </button>

                                {isAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleOpenEditStudent(sv);
                                      }}
                                      className="w-full px-4 py-2 text-[12.5px] font-bold text-[#1f2937] hover:bg-[#ebf3ff] hover:text-[#003087] flex items-center gap-2.5 transition text-left cursor-pointer"
                                    >
                                      <svg className="w-4 h-4 text-[#003087] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <span>Sửa</span>
                                    </button>

                                    <div className="my-1 border-t border-[#f1f5f9]"></div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleDeleteSingleStudent(sv);
                                      }}
                                      className="w-full px-4 py-2 text-[12.5px] font-bold text-[#dc2626] hover:bg-[#fef2f2] flex items-center gap-2.5 transition text-left cursor-pointer"
                                    >
                                      <svg className="w-4 h-4 text-[#dc2626] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      <span>Xóa</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-4 border-t border-[#e5e7eb] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#4b5563]">
          <div className="flex items-center gap-3">
            <span>
              Hiển thị <strong className="text-[#1f2937]">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> / <strong className="text-[#1f2937]">{totalItems}</strong> sinh viên
            </span>
            <span className="hidden sm:inline text-[#cbd5e1]">|</span>
            <div className="flex items-center gap-1.5">
              <span>Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded border border-[#e5e7eb] bg-white text-[#1f2937] text-[13px] font-semibold focus:outline-none focus:border-[#003087]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 font-bold">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="px-2 py-1 rounded border border-[#e5e7eb] disabled:opacity-30 hover:bg-[#ebf3ff] text-[#003087] transition-colors cursor-pointer"
              title="Trang đầu"
            >
              «
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-2.5 py-1 rounded border border-[#e5e7eb] disabled:opacity-30 hover:bg-[#ebf3ff] text-[#003087] transition-colors cursor-pointer"
              title="Trang trước"
            >
              ‹
            </button>

            {getPaginationNumbers(currentPage, totalPages).map((pNum, idx) => (
              pNum === '...' ? (
                <span key={`dots-${idx}`} className="px-2 py-1 text-[#1f2937] font-bold">...</span>
              ) : (
                <button
                  key={`page-${pNum}`}
                  type="button"
                  onClick={() => setCurrentPage(Number(pNum))}
                  className={`min-w-[28px] px-2 py-1 rounded font-bold text-[12px] transition-colors cursor-pointer ${
                    currentPage === Number(pNum)
                      ? 'bg-[#003087] text-white shadow-xs'
                      : 'border border-[#e5e7eb] hover:bg-[#ebf3ff] text-[#1f2937]'
                  }`}
                >
                  {pNum}
                </button>
              )
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-2.5 py-1 rounded border border-[#e5e7eb] disabled:opacity-30 hover:bg-[#ebf3ff] text-[#003087] transition-colors cursor-pointer"
              title="Trang tiếp"
            >
              ›
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2 py-1 rounded border border-[#e5e7eb] disabled:opacity-30 hover:bg-[#ebf3ff] text-[#003087] transition-colors cursor-pointer"
              title="Trang cuối"
            >
              »
            </button>
          </div>
        </div>
      </div>

            {/* 4. Student Detail Modal (Phóng to 150% max-w-6xl xl:max-w-7xl với cỡ chữ & ô thông tin thoáng rộng) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white w-[95vw] max-w-6xl xl:max-w-7xl rounded-3xl shadow-2xl border border-[#cbd5e1] overflow-hidden max-h-[94vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="px-6 py-5 md:px-8 md:py-6 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="font-extrabold text-[24px] md:text-[26px] text-[#1f2937]">Hồ sơ sinh viên</h3>
                <div className="text-[13.5px] md:text-[14px] text-[#4b5563] mt-1 font-medium">
                  HK1 2026–2027 · Cập nhật gần nhất lúc {(() => {
                    const raw = selectedStudent.updatedAt || selectedStudent.updated;
                    if (!raw) return '11/09/2026, 15:20';
                    if (typeof raw === 'string' && raw.includes('T') && !isNaN(Date.parse(raw))) {
                      return new Date(raw).toLocaleString('vi-VN');
                    }
                    return raw;
                  })()}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-11 h-11 rounded-xl bg-[#f8fafc] hover:bg-[#fee2e2] text-[#1f2937] hover:text-[#dc2626] flex items-center justify-center font-bold text-xl transition cursor-pointer border border-[#cbd5e1]"
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            {/* Profile Avatar Bar */}
            <div className="px-6 py-5 md:px-8 md:py-6 bg-[#f8fafc] border-b border-[#e5e7eb] flex flex-wrap items-center justify-between gap-5 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#ebf3ff] text-[#003087] font-extrabold text-xl flex items-center justify-center border-2 border-[#bfdbfe] shadow-2xs shrink-0">
                  {getInitials(selectedStudent.fullName || selectedStudent.name)}
                </div>
                <div>
                  <div className="text-[22px] md:text-[24px] font-bold text-[#1f2937] tracking-tight">
                    {selectedStudent.fullName || selectedStudent.name}
                  </div>
                  <div className="text-[14px] md:text-[15px] text-[#4b5563] font-semibold mt-1">
                    <span className="font-mono text-[#003087] font-bold text-[16px]">{selectedStudent.studentId || selectedStudent.mssv}</span> · Lớp {selectedStudent.className || selectedStudent.class || '220H01'} · Khoa CNTT
                  </div>
                </div>
              </div>

              <div className="scale-105 origin-right">
                {renderStatusBadge(selectedStudent.status, selectedStudent.noCompanyOption, selectedStudent.hasChangedFromSupport)}
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#e5e7eb] px-6 md:px-8 text-[15px] font-bold shrink-0 bg-white gap-8">
              <button
                type="button"
                onClick={() => setDetailTab('personal')}
                className={`py-4 border-b-2 font-bold cursor-pointer transition whitespace-nowrap ${
                  detailTab === 'personal'
                    ? 'border-[#003087] text-[#003087]'
                    : 'border-transparent text-[#4b5563] hover:text-[#003087]'
                }`}
              >
                Cá nhân & Học tập
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('company')}
                className={`py-4 border-b-2 font-bold cursor-pointer transition whitespace-nowrap ${
                  detailTab === 'company'
                    ? 'border-[#003087] text-[#003087]'
                    : 'border-transparent text-[#4b5563] hover:text-[#003087]'
                }`}
              >
                Doanh nghiệp & Tiến độ
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('certs')}
                className={`py-4 border-b-2 font-bold cursor-pointer transition whitespace-nowrap ${
                  detailTab === 'certs'
                    ? 'border-[#003087] text-[#003087]'
                    : 'border-transparent text-[#4b5563] hover:text-[#003087]'
                }`}
              >
                Chứng chỉ ({studentCerts.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('cv')}
                className={`py-4 border-b-2 font-bold cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
                  detailTab === 'cv'
                    ? 'border-[#003087] text-[#003087]'
                    : 'border-transparent text-[#4b5563] hover:text-[#003087]'
                }`}
              >
                <span>Hồ sơ CV</span>
                {(studentCvLink || selectedStudent.cvLink) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã có link CV trực tuyến"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('history')}
                className={`py-4 border-b-2 font-bold cursor-pointer transition whitespace-nowrap flex items-center gap-2 ${
                  detailTab === 'history'
                    ? 'border-[#003087] text-[#003087]'
                    : 'border-transparent text-[#4b5563] hover:text-[#003087]'
                }`}
              >
                <span>Lịch sử khai báo</span>
                <span className="w-5 h-5 rounded-full text-[12px] bg-[#ebf3ff] text-[#003087] flex items-center justify-center font-bold">
                  {(selectedStudent.declarationHistoryList || []).length || (selectedStudent.declarationUpdatedAt ? 1 : 0)}
                </span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[58vh]">
              {detailTab === 'personal' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <div className="text-[13px] md:text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">Mã số sinh viên:</div>
                      <div className="text-[17px] md:text-[17.5px] font-extrabold font-mono text-[#003087]">
                        {selectedStudent.studentId || selectedStudent.mssv}
                      </div>
                    </div>
                    <div>
                      <div className="text-[13px] md:text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">Email sinh viên:</div>
                      <div className="text-[16px] md:text-[17px] font-semibold text-[#1f2937]">
                        {selectedStudent.email || `${selectedStudent.studentId || selectedStudent.mssv}@student.tdtu.edu.vn`}
                      </div>
                    </div>
                    <div>
                      <div className="text-[13px] md:text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">Ngành đào tạo:</div>
                      <div className="text-[16px] md:text-[17px] font-semibold text-[#1f2937] leading-relaxed">
                        {selectedStudent.major || 'Kỹ thuật phần mềm'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[13px] md:text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">Lớp sinh hoạt:</div>
                      <div className="text-[16px] md:text-[17px] font-semibold font-mono text-[#1f2937]">
                        {selectedStudent.className || selectedStudent.class || '220H01'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[13px] md:text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">Ngày sinh / Nơi sinh:</div>
                      <div className="text-[16px] md:text-[17px] font-semibold text-[#1f2937]">
                        {selectedStudent.birthDate || '18/11/2004'} · {selectedStudent.birthPlace || 'TP. Hồ Chí Minh'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[13px] md:text-[13.5px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">Môn học đăng ký:</div>
                      <div className="text-[16px] md:text-[17px] font-bold text-[#003087] leading-relaxed">
                        {(() => {
                          const cArr = Array.isArray(selectedStudent.courses) ? selectedStudent.courses.map((c: any) => String(c).toUpperCase()) : [];
                          const cCode = String(selectedStudent.courseCode || selectedStudent.course_str || selectedStudent.courseName || '').toUpperCase();
                          const isDual = Boolean(selectedStudent.isDualCourse) || cArr.length > 1 || (cCode.includes('KTCN') && cCode.includes('TSNN')) || cCode.includes('SONG SONG');
                          if (isDual) return 'Kiến tập công nghiệp & Tập sự nghề nghiệp (Song song)';
                          if (cArr.some((c: string) => c.includes('TSNN') || c.includes('TẬP SỰ')) || cCode.includes('TSNN') || cCode.includes('TẬP SỰ') || selectedStudent.tsnnEnrolled === 1) {
                            return 'Tập sự nghề nghiệp (TSNN)';
                          }
                          return 'Kiến tập công nghiệp (KTCN)';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* GPA Metric Cards (Chỉ giữ lại Hệ 10 và Xếp loại học lực theo yêu cầu) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#e5e7eb]">
                    <div className="p-6 bg-[#ebf3ff] rounded-2xl border-2 border-[#bfdbfe] text-center shadow-2xs">
                      <div className="text-[36px] md:text-[40px] font-extrabold font-mono text-[#003087] leading-none mb-2">
                        {selectedStudent.gpa10 != null && Number(selectedStudent.gpa10) > 0
                          ? Number(selectedStudent.gpa10).toFixed(2)
                          : (selectedStudent.gpa4 ? (Number(selectedStudent.gpa4) * 2.5).toFixed(2) : '7.82')}
                      </div>
                      <div className="text-[14px] font-bold text-[#003087] uppercase tracking-wider">GPA Hệ 10</div>
                    </div>
                    <div className="p-6 bg-[#f8fafc] rounded-2xl border-2 border-[#cbd5e1] text-center shadow-2xs flex flex-col justify-center">
                      <div className="text-[30px] md:text-[34px] font-extrabold text-[#1f2937] leading-none mb-2">
                        {selectedStudent.academicRank || 'Khá'}
                      </div>
                      <div className="text-[14px] font-bold text-[#4b5563] uppercase tracking-wider">Xếp loại học lực</div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'company' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-[#f8fafc] p-7 rounded-2xl border-2 border-[#cbd5e1] space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-[#e5e7eb]">
                      <div>
                        <div className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wide mb-1.5">Tên công ty tiếp nhận:</div>
                        <div className="text-[18px] md:text-[20px] font-extrabold text-[#003087] leading-snug">
                          {selectedStudent.companyName || selectedStudent.company || selectedStudent.assignedCompany || selectedStudent.declarationData?.companyName || 'Chưa khai báo'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wide mb-1.5">Mã số thuế (MST):</div>
                        <div className="text-[17px] font-mono font-bold text-[#1f2937]">
                          {selectedStudent.taxCode || selectedStudent.companyTaxCode || selectedStudent.declarationData?.taxCode || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-[#e5e7eb]">
                      <div>
                        <div className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wide mb-1.5">Vị trí thực tập:</div>
                        <div className="text-[17px] font-bold text-[#1f2937]">
                          {selectedStudent.position || selectedStudent.declarationData?.position || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wide mb-1.5">Địa chỉ trụ sở doanh nghiệp:</div>
                        <div className="text-[15.5px] font-semibold text-[#1f2937] leading-relaxed">
                          {selectedStudent.companyAddress || selectedStudent.address || selectedStudent.declarationData?.address || selectedStudent.declarationData?.companyAddress || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[13px] font-bold text-[#003087] uppercase tracking-wide mb-1.5">Cán bộ hướng dẫn (Mentor):</div>
                        <div className="text-[17px] font-extrabold text-[#003087]">
                          {selectedStudent.contactPerson || selectedStudent.mentorName || selectedStudent.mentor || selectedStudent.declarationData?.contactPerson || 'Chưa cập nhật'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wide mb-1.5">SĐT cán bộ hướng dẫn:</div>
                        <div className="text-[16px] font-mono font-bold text-[#1f2937]">
                          {selectedStudent.contactPhone || selectedStudent.mentorPhone || selectedStudent.declarationData?.contactPhone || '—'}
                          {(selectedStudent.contactEmail || selectedStudent.mentorEmail || selectedStudent.declarationData?.contactEmail) ? ` · ${selectedStudent.contactEmail || selectedStudent.mentorEmail || selectedStudent.declarationData?.contactEmail}` : ''}
                        </div>
                      </div>
                    </div>

                    {(selectedStudent.representative || selectedStudent.declarationData?.representative) && (
                      <div className="pt-3 border-t border-[#e5e7eb] text-[13.5px] text-[#4b5563]">
                        Đại diện pháp luật: <strong className="text-[#1f2937]">{selectedStudent.representative || selectedStudent.declarationData?.representative}</strong>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold text-[#1f2937] mb-2 uppercase tracking-wide">
                      Ghi chú thẩm định của Giảng viên phụ trách:
                    </label>
                    <textarea
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="Nhập ghi chú theo dõi tiến độ, phản hồi doanh nghiệp hoặc điều phối hỗ trợ..."
                      className="w-full p-4 rounded-xl border border-[#cbd5e1] text-[15px] text-[#1f2937] focus:border-[#003087] focus:ring-2 focus:ring-[#003087] outline-none"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {detailTab === 'history' && (
                <div className="space-y-4 animate-fadeIn">
                  {(!selectedStudent.declarationHistoryList || selectedStudent.declarationHistoryList.length === 0) && !selectedStudent.declarationUpdatedAt ? (
                    <div className="p-8 text-center text-[#4b5563] font-semibold text-[15px]">
                      Chưa có lịch sử cập nhật khai báo nào được ghi nhận.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(selectedStudent.declarationHistoryList && selectedStudent.declarationHistoryList.length > 0
                        ? selectedStudent.declarationHistoryList
                        : [{
                            date: selectedStudent.declarationUpdatedAt || selectedStudent.updatedAt || '11/09/2026',
                            status: selectedStudent.status,
                            company: selectedStudent.companyName || selectedStudent.company || 'Đã khai báo',
                            position: selectedStudent.position || 'Thực tập sinh',
                            note: 'Khai báo trực tuyến qua Cổng thông tin Khoa CNTT'
                          }]
                      ).map((item, idx) => (
                        <div key={idx} className="p-5 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="text-[15px] font-bold text-[#003087]">
                              {item.company || 'Đơn vị thực tập'} · {item.position || 'Vị trí'}
                            </div>
                            <div className="text-[13px] text-[#4b5563] mt-1 font-medium">
                              Cập nhật: {item.date} {item.note ? `· ${item.note}` : ''}
                            </div>
                          </div>
                          <div>
                            {renderStatusBadge(item.status || selectedStudent.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'certs' && (
                <div className="space-y-4 animate-fadeIn">
                  {studentCerts.length === 0 ? (
                    <div className="p-8 text-center text-[#4b5563] font-semibold text-[15px]">
                      Sinh viên chưa nộp chứng chỉ ngoại ngữ nào trong học kỳ này.
                    </div>
                  ) : (
                    studentCerts.map((cert) => (
                      <div
                        key={cert.id}
                        className="p-5 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-[16px] font-bold text-[#1f2937]">
                            {cert.certType || 'Chứng chỉ tiếng Anh'} — Điểm: <strong className="text-[#003087] font-mono">{cert.score || 'Hợp lệ'}</strong>
                          </div>
                          <div className="text-[13.5px] text-[#4b5563] mt-1 font-medium">
                            {cert.level ? `Cấp độ ${cert.level}` : ''}
                            {cert.examDate ? ` · Ngày thi: ${cert.examDate}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {cert.driveLink ? (
                            <a
                              href={cert.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2.5 rounded-xl bg-[#ebf3ff] text-[#003087] text-[13.5px] font-bold border border-[#bfdbfe] hover:bg-[#dbeafe] transition cursor-pointer"
                            >
                              Xem minh chứng Drive ↗
                            </a>
                          ) : null}
                          <span className="px-4 py-2 rounded-full text-[13px] font-bold border bg-[#ebf3ff] text-[#003087] border-[#bfdbfe]">
                            {cert.status || (cert.verified ? 'Đã thẩm định' : 'Hợp lệ')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Hồ sơ CV (Review CV trực tiếp) */}
              {detailTab === 'cv' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-[#f8fafc] rounded-2xl border border-[#cbd5e1]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#ebf3ff] text-[#003087] flex items-center justify-center shrink-0 border border-[#bfdbfe]">
                        <svg className="w-6 h-6 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-[#1f2937]">Hồ sơ CV Ứng tuyển của Sinh viên</div>
                        <div className="text-[13px] text-[#4b5563]">
                          {(studentCvLink || selectedStudent.cvLink) ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Đã nộp liên kết CV trực tuyến
                            </span>
                          ) : (
                            <span className="text-[#dc2626] font-bold">Chưa cập nhật liên kết CV</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {(studentCvLink || selectedStudent.cvLink) && (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const link = studentCvLink || selectedStudent.cvLink;
                            navigator.clipboard.writeText(link);
                            alert('Đã sao chép đường link CV vào bộ nhớ tạm: ' + link);
                          }}
                          className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#1f2937] rounded-xl text-[13px] font-bold transition cursor-pointer shadow-2xs"
                        >
                          Sao chép link
                        </button>
                        <a
                          href={studentCvLink || selectedStudent.cvLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-[13px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Mở tab mới</span>
                          <span>↗</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {(studentCvLink || selectedStudent.cvLink) ? (
                    <div className="space-y-3">
                      <div className="w-full h-[600px] rounded-2xl border-2 border-[#cbd5e1] overflow-hidden bg-white shadow-inner relative">
                        <iframe
                          src={window.ApiClient?.formatCvPreviewUrl ? window.ApiClient.formatCvPreviewUrl(studentCvLink || selectedStudent.cvLink) : (studentCvLink || selectedStudent.cvLink)}
                          title={`Review CV - ${selectedStudent.fullName || selectedStudent.name}`}
                          className="w-full h-full border-0"
                          allow="autoplay"
                        />
                      </div>
                      <p className="text-[12px] text-[#6b7280]">
                        * Nếu khung xem trước không hiển thị do chính sách bảo mật Google Drive của trình duyệt, giảng viên có thể nhấn nút <strong>"Mở tab mới ↗"</strong> ở trên để đọc trực tiếp.
                      </p>
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-[#cbd5e1] rounded-2xl bg-[#f8fafc] p-8">
                      <div className="w-16 h-16 rounded-full bg-[#ebf3ff] text-[#003087] flex items-center justify-center mx-auto mb-4 border border-[#bfdbfe]">
                        <svg className="w-8 h-8 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-[16px] font-bold text-[#1f2937] mb-1">Sinh viên chưa cập nhật CV</div>
                      <p className="text-[13.5px] text-[#4b5563] max-w-md mx-auto">
                        Sinh viên <strong>{selectedStudent.fullName || selectedStudent.name}</strong> (MSSV: <span className="font-mono font-bold text-[#003087]">{selectedStudent.studentId || selectedStudent.mssv}</span>) chưa cập nhật đường dẫn CV (Google Drive/PDF) trên hệ thống.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions (Phóng to 150%) */}
            <div className="px-6 py-5 md:px-8 md:py-6 border-t border-[#e5e7eb] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-6 py-3 min-h-[46px] border border-[#cbd5e1] rounded-xl text-[14.5px] font-bold text-[#1f2937] hover:bg-white cursor-pointer transition min-w-[100px]"
                >
                  Đóng
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEditStudent(selectedStudent)}
                      className="px-6 py-3 min-h-[46px] bg-white border-2 border-[#003087] text-[#003087] hover:bg-[#ebf3ff] rounded-xl text-[14.5px] font-bold cursor-pointer transition shadow-2xs"
                    >
                      Sửa thông tin & GPA
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSingleStudent(selectedStudent)}
                      className="px-6 py-3 min-h-[46px] bg-[#fef2f2] border-2 border-[#fecaca] text-[#dc2626] hover:bg-[#fee2e2] rounded-xl text-[14.5px] font-bold cursor-pointer transition shadow-2xs"
                    >
                      Xóa sinh viên
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveInternalNote}
                className="px-8 py-3 min-h-[46px] bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-[14.5px] font-bold transition shadow-xs hover:shadow-md cursor-pointer"
              >
                Lưu ghi chú thẩm định
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Thêm mới / Chỉnh sửa Sinh viên (Full CRUD - Phóng to 150%) */}
      {isAdmin && crudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white w-[94vw] max-w-5xl rounded-3xl shadow-2xl border border-[#cbd5e1] p-8 space-y-6 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
              <div>
                <h3 className="font-extrabold text-[22px] md:text-[24px] text-[#1f2937] tracking-tight">
                  {editingStudentId ? `Chỉnh sửa hồ sơ sinh viên (${editingStudentId})` : 'Thêm sinh viên mới vào học kỳ'}
                </h3>
                <p className="text-[13.5px] text-[#4b5563] mt-1 font-medium">
                  Dữ liệu sẽ đồng bộ tức thì lên Biểu đồ Dashboard, SQLite Backend và Cloud Firestore.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setCrudModalOpen(false)} 
                className="w-11 h-11 rounded-xl bg-[#f8fafc] hover:bg-[#fee2e2] text-[#1f2937] hover:text-[#dc2626] flex items-center justify-center font-bold text-xl cursor-pointer border border-[#cbd5e1]"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCrudStudent} className="space-y-5 text-[14px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">MSSV *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingStudentId)}
                    value={crudForm.studentId}
                    onChange={e => setCrudForm({ ...crudForm, studentId: e.target.value })}
                    placeholder="VD: 522H0045"
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl font-mono font-bold text-[#003087] disabled:bg-[#f1f5f9] text-[14.5px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Họ và tên sinh viên *</label>
                  <input
                    type="text"
                    required
                    value={crudForm.fullName}
                    onChange={e => setCrudForm({ ...crudForm, fullName: e.target.value })}
                    placeholder="VD: Nguyễn Hữu Nhân"
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl font-semibold text-[#1f2937] text-[14.5px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Lớp sinh hoạt</label>
                  <input
                    type="text"
                    value={crudForm.className}
                    onChange={e => setCrudForm({ ...crudForm, className: e.target.value })}
                    placeholder="VD: 22H50201"
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl font-mono text-[#1f2937] text-[14.5px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Chuyên ngành</label>
                  <select
                    value={crudForm.major}
                    onChange={e => setCrudForm({ ...crudForm, major: e.target.value })}
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl font-semibold text-[#1f2937] text-[14.5px]"
                  >
                    <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
                    <option value="Khoa học máy tính">Khoa học máy tính</option>
                    <option value="Mạng máy tính và truyền thông dữ liệu">Mạng máy tính và truyền thông dữ liệu</option>
                    <option value="Hệ thống thông tin">Hệ thống thông tin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Học phần đăng ký</label>
                  <select
                    value={crudForm.courseCode}
                    onChange={e => setCrudForm({ ...crudForm, courseCode: e.target.value })}
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl font-bold text-[#003087] text-[14.5px]"
                  >
                    <option value="KTCN">Kiến tập công nghiệp (KTCN)</option>
                    <option value="TSNN">Tập sự nghề nghiệp (TSNN)</option>
                    <option value="KTCN & TSNN">Học song song (KTCN + TSNN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">GPA (Hệ 10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={crudForm.gpa10}
                    onChange={e => {
                      const g10 = e.target.value;
                      const num10 = parseFloat(g10);
                      const auto4 = !isNaN(num10) ? (num10 * 0.4).toFixed(2) : crudForm.gpa4;
                      const rank = !isNaN(num10) ? (num10 >= 9.0 ? 'Xuất sắc' : num10 >= 8.0 ? 'Giỏi' : num10 >= 6.5 ? 'Khá' : 'Trung bình') : crudForm.academicRank;
                      setCrudForm({ ...crudForm, gpa10: g10, gpa4: auto4, academicRank: rank });
                    }}
                    placeholder="VD: 8.25"
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl font-mono font-bold text-[#003087] text-[14.5px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Xếp loại học lực</label>
                  <select
                    value={crudForm.academicRank}
                    onChange={e => setCrudForm({ ...crudForm, academicRank: e.target.value })}
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl font-bold text-[#1f2937] text-[14.5px]"
                  >
                    <option value="Xuất sắc">Xuất sắc</option>
                    <option value="Giỏi">Giỏi</option>
                    <option value="Khá">Khá</option>
                    <option value="Trung bình">Trung bình</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Ngày sinh</label>
                  <input
                    type="text"
                    value={crudForm.birthDate}
                    onChange={e => setCrudForm({ ...crudForm, birthDate: e.target.value })}
                    placeholder="VD: 15/05/2004"
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl text-[#1f2937] text-[14.5px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Nơi sinh</label>
                  <input
                    type="text"
                    value={crudForm.birthPlace}
                    onChange={e => setCrudForm({ ...crudForm, birthPlace: e.target.value })}
                    placeholder="VD: TP. Hồ Chí Minh"
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl text-[#1f2937] text-[14.5px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Số điện thoại</label>
                  <input
                    type="text"
                    value={crudForm.phone}
                    onChange={e => setCrudForm({ ...crudForm, phone: e.target.value })}
                    placeholder="VD: 0901234567"
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl font-mono text-[#1f2937] text-[14.5px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#e5e7eb]">
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Trạng thái thực tập</label>
                  <select
                    value={crudForm.status}
                    onChange={e => setCrudForm({ ...crudForm, status: e.target.value })}
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl font-bold text-[#1f2937] text-[14.5px]"
                  >
                    <option value="Chưa có doanh nghiệp">Đang tìm nơi TT</option>
                    <option value="has_company">Đã có nơi thực tập</option>
                    <option value="interviewing">Chờ phỏng vấn</option>
                    <option value="need_support">Cần Khoa hỗ trợ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Doanh nghiệp tiếp nhận</label>
                  <input
                    type="text"
                    value={crudForm.companyName}
                    onChange={e => setCrudForm({ ...crudForm, companyName: e.target.value })}
                    placeholder="VD: FPT Software HCM"
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl text-[#1f2937] text-[14.5px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1f2937] uppercase tracking-wide text-[12.5px] mb-1.5">Vị trí thực tập</label>
                  <input
                    type="text"
                    value={crudForm.position}
                    onChange={e => setCrudForm({ ...crudForm, position: e.target.value })}
                    placeholder="VD: Backend Developer Intern"
                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl text-[#1f2937] text-[14.5px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setCrudModalOpen(false)}
                  className="px-6 py-3 min-h-[46px] border border-[#cbd5e1] rounded-xl font-bold text-[14.5px] text-[#1f2937] hover:bg-[#f8fafc] cursor-pointer transition min-w-[100px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={crudSaving}
                  className="px-8 py-3 min-h-[46px] bg-[#003087] hover:bg-[#002266] text-white rounded-xl font-bold text-[14.5px] shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 transition"
                >
                  {crudSaving ? 'Đang lưu...' : (editingStudentId ? 'Lưu cập nhật hồ sơ' : '+ Thêm sinh viên vào học kỳ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Import Excel (Enlarged max-w-5xl with Review Preview & Multichoice) */}
      {isAdmin && importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-[95vw] max-w-6xl xl:max-w-7xl rounded-3xl shadow-2xl border border-[#cbd5e1] max-h-[94vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="font-bold text-[18px] text-[#1f2937] uppercase tracking-wide">
                  Nhập danh sách sinh viên từ Excel (.xlsx, .xls, .csv)
                </h3>
                <p className="text-[12px] text-[#1f2937] mt-0.5">
                  Tự động phân tích đa Sheet môn học (KTCN & TSNN), kiểm tra GPA hệ 10, hệ 4, xếp loại học lực và cho phép xem trước trước khi nạp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="p-2 text-[#1f2937] hover:text-[#dc2626] font-bold text-lg rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[12.5px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#1f2937] mb-1.5 uppercase text-[11.5px]">
                    Học kỳ nạp dữ liệu:
                  </label>
                  <select
                    value={importSemester}
                    onChange={e => setImportSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#e5e7eb] rounded-lg font-bold text-[#1f2937] outline-none focus:border-[#003087]"
                  >
                    <option value="hk1_2026_2027">HK1 2026–2027 (Hiện tại)</option>
                    <option value="hk2_2025_2026">HK2 2025–2026</option>
                    <option value="hk1_2025_2026">HK1 2025–2026</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1f2937] mb-1.5 uppercase text-[11.5px]">
                    Chế độ nạp dữ liệu:
                  </label>
                  <select
                    value={importMode}
                    onChange={e => setImportMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#e5e7eb] rounded-lg font-bold text-[#003087] outline-none focus:border-[#003087]"
                  >
                    <option value="replace">Thay thế toàn bộ danh sách hiện tại</option>
                    <option value="append">Gộp thêm / Cập nhật vào danh sách đang có</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-[#1f2937] uppercase text-[11.5px]">
                      Chọn tệp Excel:
                    </label>
                    <button
                      type="button"
                      onClick={handleDownloadSampleExcel}
                      className="text-[11.5px] font-bold text-[#003087] hover:underline cursor-pointer"
                    >
                      Tải file mẫu
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="w-full p-2 border border-[#e5e7eb] rounded-lg bg-white text-[#1f2937] file:mr-2.5 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11.5px] file:font-bold file:bg-[#003087] file:text-white hover:file:bg-[#002266] cursor-pointer"
                  />
                </div>
              </div>

              {/* Thống kê tóm tắt tệp đã đọc */}
              {importSummary && (
                <div className="p-4 bg-[#ebf3ff] border border-[#bfdbfe] rounded-xl text-[#003087] space-y-2">
                  <div className="font-bold flex items-center justify-between">
                    <span>Tệp: {importFileName} (Sheet: {importSummary.sheets.join(', ')})</span>
                    <span className="text-[#dc2626]">Tổng: {importSummary.totalUnique} sinh viên</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] text-[#1f2937] pt-1">
                    <div>• Đăng ký môn KTCN: <strong>{importSummary.ktcnCount}</strong> SV</div>
                    <div>• Đăng ký môn TSNN: <strong>{importSummary.tsnnCount}</strong> SV</div>
                    <div>• Học song song 2 môn: <strong className="text-[#003087]">{importSummary.dualCount}</strong> SV</div>
                    <div>• Sẵn sàng nạp: <strong className="text-[#003087]">{parsedRows.length}</strong> SV</div>
                  </div>
                </div>
              )}

              {/* Bảng xem trước dữ liệu (Preview Table) */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-[#1f2937] text-[12px]">
                    <span>Bảng xem trước dữ liệu ({parsedRows.length} sinh viên):</span>
                    <span className="text-[#003087]">Kiểm tra thông tin trước khi xác nhận</span>
                  </div>
                  <div className="overflow-x-auto border border-[#e5e7eb] rounded-lg max-h-64">
                    <table className="w-full text-left text-[12px]">
                      <thead className="bg-[#f8fafc] text-[#1f2937] font-bold uppercase text-[10.5px] sticky top-0 border-b border-[#e5e7eb]">
                        <tr>
                          <th className="p-2.5 w-12 text-center">STT</th>
                          <th className="p-2.5">MSSV</th>
                          <th className="p-2.5">Họ và tên</th>
                          <th className="p-2.5">Lớp</th>
                          <th className="p-2.5">Ngành</th>
                          <th className="p-2.5 text-center">GPA (Hệ 10)</th>
                          <th className="p-2.5 text-center">Xếp loại</th>
                          <th className="p-2.5">Môn học</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {parsedRows.slice(0, 30).map((s, idx) => (
                          <tr key={idx} className="hover:bg-[#f8fafc]">
                            <td className="p-2.5 text-center font-mono text-[#1f2937]">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-[#003087]">{s.mssv}</td>
                            <td className="p-2.5 font-bold text-[#1f2937]">{s.fullName}</td>
                            <td className="p-2.5 font-mono text-[#1f2937]">{s.class}</td>
                            <td className="p-2.5 text-[#1f2937]">{s.major}</td>
                            <td className="p-2.5 font-mono text-center font-bold text-[#003087]">{s.gpa10 || '—'}</td>
                            <td className="p-2.5 text-center font-bold">{s.academicRank}</td>
                            <td className="p-2.5 font-bold text-[#003087]">{s.courseCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 30 && (
                    <div className="text-[11px] text-[#1f2937] text-center italic">
                      Hiển thị 30 / {parsedRows.length} dòng xem trước. Tất cả {parsedRows.length} dòng sẽ được nạp đầy đủ.
                    </div>
                  )}
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-[#ebf3ff] border border-[#bfdbfe] text-[#003087] rounded-lg font-bold">
                  {importSuccess}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#f8fafc] border-t border-[#e5e7eb] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-5 py-2.5 min-w-[110px] border border-[#e5e7eb] rounded-lg text-[12.5px] font-bold text-[#1f2937] hover:bg-white cursor-pointer whitespace-nowrap"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || importing}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 min-w-[180px] bg-[#003087] hover:bg-[#002266] disabled:opacity-40 text-white rounded-lg text-[12.5px] font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
              >
                {importing ? 'Đang cập nhật...' : `Xác nhận nạp (${parsedRows.length} SV)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.StudentsPage = StudentsPage;
