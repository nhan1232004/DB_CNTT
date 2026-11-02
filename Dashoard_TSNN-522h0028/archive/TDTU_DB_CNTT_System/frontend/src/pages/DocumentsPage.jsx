// Documents Page Component - Chuẩn hóa thiết kế theo Figma Frame 17 (Xuất Báo cáo Thực tập & Dữ liệu Tổng kết)
// Nghiệp vụ: Xuất Báo cáo Thực tập & Dữ liệu Tổng kết
// Tính năng: 
// 1. Xuất Excel Báo cáo Tổng kết (Multi-sheet: Sheet KTCN, Sheet TSNN, Sheet Thống kê tổng hợp) qua SheetJS
// 2. Xuất / In Báo cáo Họp Khoa & Ra quyết định (PDF chuẩn văn bản TDTU)
// 3. Bảng dữ liệu sinh viên tổng kết học kỳ kèm bộ lọc theo Môn học và Tình trạng hồ sơ

const DocumentsPage = ({ currentUser }) => {
  const [activeReportMode, setActiveReportMode] = React.useState('excel'); // 'excel' | 'pdf_meeting' | 'partner_data'
  const [searchQuery, setSearchQuery] = React.useState('');
  const [courseFilter, setCourseFilter] = React.useState('all'); // 'all' | 'KTCN' | 'TSNN' | 'dual' | 'need_support'
  const [exportNotice, setExportNotice] = React.useState(null);
  const [studentsList, setStudentsList] = React.useState([]);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load real students from ApiClient with joined declaration & certificate sync
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      let rawList = [];

      // 1. Fetch from live API (joins SQLite students, declarations & certificates)
      if (window.ApiClient && window.ApiClient.getStudents) {
        try {
          const res = await window.ApiClient.getStudents({ semester: 'hk1_2026_2027' });
          rawList = res?.data?.items || res?.items || res?.students || (Array.isArray(res) ? res : []);
        } catch (apiErr) {
          console.warn('[DocumentsPage] ApiClient.getStudents error, falling back:', apiErr);
        }
      }

      // 2. Fallback to getLiveStudents if getStudents returned empty
      if ((!rawList || rawList.length === 0) && window.ApiClient && window.ApiClient.getLiveStudents) {
        try {
          const fallback = await window.ApiClient.getLiveStudents('hk1_2026_2027');
          if (Array.isArray(fallback) && fallback.length > 0) {
            rawList = fallback;
          }
        } catch {}
      }

      // 3. Fetch all certificates to cross-check latest student uploads
      let allCerts = [];
      if (window.ApiClient?.fetchAllCertificates) {
        try {
          allCerts = await window.ApiClient.fetchAllCertificates();
        } catch {}
      }
      const certsByStudent = new Map();
      (allCerts || []).forEach(c => {
        const sid = String(c.studentId || c.mssv || '').trim().toUpperCase();
        if (sid) {
          if (!certsByStudent.has(sid)) certsByStudent.set(sid, []);
          certsByStudent.get(sid).push(c);
        }
      });

      if (rawList && rawList.length > 0) {
        const formatted = rawList.map((s, idx) => {
          const sid = String(s.studentId || s.mssv || s.id || ('522H00' + String(idx + 1).padStart(2, '0'))).trim();
          
          // Check local declaration fallback
          let localDecl = null;
          try {
            const rawDecl = localStorage.getItem('tdtu_decl_' + sid);
            if (rawDecl) localDecl = JSON.parse(rawDecl);
          } catch {}

          const companyName = localDecl?.companyName || s.companyName || s.company || '';
          const position = localDecl?.position || s.position || '';
          const taxCode = localDecl?.taxCode || s.taxCode || '';
          const noComp = localDecl?.noCompanyOption || s.noCompanyOption;
          const rawStatus = localDecl?.internshipStatus || s.status || 'seeking';

          const cStr = (s.course_str || (s.courses && s.courses.join(' ')) || s.courseCode || s.courseName || '').toUpperCase();
          const isDual = Boolean(s.isDualCourse || (s.ktcnEnrolled && s.tsnnEnrolled) || localDecl?.isDualCourse || (cStr.includes('KTCN') && cStr.includes('TSNN')) || cStr.includes('&'));
          const isTSNN = Boolean(s.tsnnEnrolled || cStr.includes('TSNN') || isDual);
          const isKTCN = Boolean(s.ktcnEnrolled || cStr.includes('KTCN') || isDual);

          let courseBadge = 'KTCN';
          if (isDual) courseBadge = 'KTCN + TSNN';
          else if (isTSNN) courseBadge = 'TSNN';

          // Correct status resolution
          let displayStatus = 'Chưa có doanh nghiệp';
          let statusCode = 'seeking';

          if (rawStatus === 'need_support' || noComp === 'faculty' || (companyName && companyName.includes('Khoa CNTT hỗ trợ'))) {
            displayStatus = 'Cần Khoa hỗ trợ';
            statusCode = 'need_support';
          } else if (rawStatus === 'interviewing' || noComp === 'self' || (companyName && (companyName.includes('Đang tìm') || companyName.includes('Chờ PV')))) {
            displayStatus = 'Đang tìm / Chờ PV';
            statusCode = 'interviewing';
          } else if (rawStatus === 'has_company' || (companyName && !companyName.includes('Chưa có') && !companyName.includes('Khoa CNTT hỗ trợ') && !companyName.includes('Đang tìm'))) {
            displayStatus = 'Đã có nơi TT';
            statusCode = 'has_company';
          }

          // Certificate info
          const studentCerts = certsByStudent.get(sid.toUpperCase()) || [];
          let primaryCert = studentCerts[0] || null;
          if (!primaryCert) {
            try {
              const cached = JSON.parse(localStorage.getItem('tdtu_certs_' + sid) || '[]');
              if (Array.isArray(cached) && cached.length > 0) primaryCert = cached[0];
            } catch {}
          }
          const certDisplay = primaryCert
            ? `${primaryCert.name || primaryCert.type || 'Ngoại ngữ'} ${primaryCert.score || ''}`.trim()
            : (s.certificateDisplay || s.cert || 'Chưa nộp');
          const certLevel = primaryCert?.level || s.certLevel || (certDisplay !== 'Chưa nộp' && certDisplay !== '—' ? 'B1' : '—');
          const hasCert = certDisplay !== 'Chưa nộp' && certDisplay !== '—' && Boolean(certDisplay);

          return {
            id: sid,
            mssv: sid,
            name: s.fullName || s.name || s.hoten || ('Sinh viên ' + (idx + 1)),
            course: courseBadge,
            isDual: Boolean(isDual),
            company: companyName ? companyName : (statusCode === 'need_support' ? 'Khoa CNTT hỗ trợ' : 'Chưa có nơi thực tập'),
            position: position ? position : (statusCode === 'need_support' ? 'Chưa xác định' : 'Chưa cập nhật'),
            taxCode: taxCode || '—',
            academicAdvisor: localDecl?.academicAdvisor || s.academicAdvisor || 'Khoa CNTT',
            advisorEmail: localDecl?.advisorEmail || s.advisorEmail || '',
            contactPerson: localDecl?.contactPerson || s.contactPerson || '—',
            contactRole: localDecl?.contactRole || s.contactRole || '',
            contactPhone: localDecl?.contactPhone || s.contactPhone || '',
            contactEmail: localDecl?.contactEmail || s.contactEmail || '',
            status: displayStatus,
            statusCode: statusCode,
            certificate: certDisplay,
            certLevel: certLevel,
            hasCert: hasCert,
            certDetails: primaryCert
          };
        });

        setStudentsList(formatted);
        setSelectedIds(prev => prev.length > 0 ? prev : formatted.map(s => s.id));
      } else {
        setStudentsList([]);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error('Error loading documents students:', err);
      setStudentsList([]);
      setSelectedIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadStudents();

    const handleRealtimeUpdate = () => {
      loadStudents();
    };

    window.addEventListener('tdtu_data_updated', handleRealtimeUpdate);
    window.addEventListener('tdtu_decl_updated', handleRealtimeUpdate);
    window.addEventListener('tdtu_certs_updated', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);
    window.addEventListener('focus', handleRealtimeUpdate);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleRealtimeUpdate();
    });

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
  }, [currentUser]);

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  // Filter logic
  const filteredStudents = studentsList.filter(s => {
    if (courseFilter === 'KTCN' && !s.course.includes('KTCN')) return false;
    if (courseFilter === 'TSNN' && !s.course.includes('TSNN')) return false;
    if (courseFilter === 'dual' && !s.isDual) return false;
    if (courseFilter === 'need_support' && s.statusCode !== 'need_support') return false;
    if (courseFilter === 'has_company' && s.statusCode !== 'has_company') return false;
    if (courseFilter === 'has_cert' && !s.hasCert) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.mssv.toLowerCase().includes(q) || s.company.toLowerCase().includes(q) || s.position.toLowerCase().includes(q);
  });

  // Xuất file Excel Báo cáo Tổng kết (Multi-sheet: Sheet KTCN, Sheet TSNN, Sheet Thống kê)
  const handleExportExcel = () => {
    try {
      const XLSX = window.XLSX || (typeof window.XLSX !== 'undefined' ? window.XLSX : null);
      if (!XLSX) {
        alert('Thư viện XLSX đang tải. Vui lòng thử lại sau vài giây.');
        return;
      }

      const targetList = studentsList.filter(s => selectedIds.includes(s.id));
      if (targetList.length === 0) {
        alert('Vui lòng chọn ít nhất 1 sinh viên để xuất báo cáo.');
        return;
      }

      const wb = XLSX.utils.book_new();

      // Sheet 1: KTCN
      const ktcnRows = targetList
        .filter(s => s.course.includes('KTCN'))
        .map((s, idx) => ({
          'STT': idx + 1,
          'MSSV': s.mssv,
          'Họ và Tên': s.name,
          'Môn học': s.course,
          'Doanh nghiệp tiếp nhận': s.company,
          'Vị trí thực tập': s.position,
          'Mã số thuế': s.taxCode,
          'Cán bộ hướng dẫn (Mentor)': s.contactPerson || '—',
          'SĐT Cán bộ hướng dẫn': s.contactPhone || '—',
          'Chứng chỉ ngoại ngữ': s.certificate || 'Chưa nộp',
          'Khung CEFR': s.certLevel || '—',
          'Tình trạng thẩm định': s.status
        }));
      const wsKTCN = XLSX.utils.json_to_sheet(ktcnRows);
      XLSX.utils.book_append_sheet(wb, wsKTCN, 'DSSV_KTCN');

      // Sheet 2: TSNN
      const tsnnRows = targetList
        .filter(s => s.course.includes('TSNN'))
        .map((s, idx) => ({
          'STT': idx + 1,
          'MSSV': s.mssv,
          'Họ và Tên': s.name,
          'Môn học': s.course,
          'Doanh nghiệp tiếp nhận': s.company,
          'Vị trí thực tập': s.position,
          'Mã số thuế': s.taxCode,
          'Cán bộ hướng dẫn (Mentor)': s.contactPerson || '—',
          'SĐT Cán bộ hướng dẫn': s.contactPhone || '—',
          'Chứng chỉ ngoại ngữ': s.certificate || 'Chưa nộp',
          'Khung CEFR': s.certLevel || '—',
          'Tình trạng thẩm định': s.status
        }));
      const wsTSNN = XLSX.utils.json_to_sheet(tsnnRows);
      XLSX.utils.book_append_sheet(wb, wsTSNN, 'DSSV_TSNN');

      // Sheet 3: Thống kê & Song song
      const summaryRows = [
        { 'Chỉ tiêu': 'Tổng số sinh viên báo cáo', 'Số lượng': targetList.length },
        { 'Chỉ tiêu': 'Số sinh viên Kiến tập KTCN', 'Số lượng': targetList.filter(s => s.course.includes('KTCN')).length },
        { 'Chỉ tiêu': 'Số sinh viên Tập sự TSNN', 'Số lượng': targetList.filter(s => s.course.includes('TSNN')).length },
        { 'Chỉ tiêu': 'Số sinh viên Thực tập song song cả 2 môn', 'Số lượng': targetList.filter(s => s.isDual).length },
        { 'Chỉ tiêu': 'Hồ sơ đã phê duyệt hợp lệ', 'Số lượng': targetList.filter(s => s.statusCode === 'approved' || s.statusCode === 'has_company').length },
        { 'Chỉ tiêu': 'Đang tìm / Chờ phỏng vấn', 'Số lượng': targetList.filter(s => s.statusCode === 'interviewing').length },
        { 'Chỉ tiêu': 'Cần Khoa hỗ trợ kết nối khẩn', 'Số lượng': targetList.filter(s => s.statusCode === 'need_support').length },
        { 'Chỉ tiêu': 'Số sinh viên đã nộp chứng chỉ ngoại ngữ', 'Số lượng': targetList.filter(s => s.hasCert).length },
        { 'Chỉ tiêu': 'Thời gian xuất dữ liệu', 'Số lượng': new Date().toLocaleString('vi-VN') }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'ThongKe_TongKet');

      // Download file (Cập nhật học kỳ HK1 2026-2027)
      XLSX.writeFile(wb, 'TDTU_BaoCao_ThucTap_HK1_2026_2027.xlsx');

      setExportNotice({
        type: 'success',
        text: `✓ Đã xuất thành công file Excel gồm 3 sheets (DSSV_KTCN, DSSV_TSNN, ThongKe_TongKet) với ${targetList.length} sinh viên!`
      });
    } catch (err) {
      alert('Lỗi xuất file Excel: ' + err.message);
    }
  };



  
  // Xuất danh sách chứng chỉ tiếng Anh (.xlsx)
  const handleExportCerts = async () => {
    try {
      let certsList = [];
      if (window.ApiClient?.fetchAllCertificates) {
        certsList = await window.ApiClient.fetchAllCertificates();
      } else if (window.ApiClient?.getAllCertsScopeAll) {
        certsList = await window.ApiClient.getAllCertsScopeAll();
      }

      if (!certsList || certsList.length === 0) {
        try {
          const res = await window.ApiClient?.getCertificates?.();
          certsList = res?.items || res || [];
        } catch {}
      }

      // Check localStorage cached certs if backend list is empty or needs merging
      const cachedCerts = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('tdtu_certs_')) {
            const arr = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(arr)) cachedCerts.push(...arr);
          }
        }
      } catch {}

      const existingIds = new Set((certsList || []).map(c => c.id || c.studentId + '_' + c.name));
      cachedCerts.forEach(c => {
        const key = c.id || c.studentId + '_' + c.name;
        if (!existingIds.has(key)) {
          certsList.push(c);
          existingIds.add(key);
        }
      });

      if (!certsList || certsList.length === 0) {
        setExportNotice({
          type: 'info',
          text: 'Hiện tại chưa có chứng chỉ ngoại ngữ nào được sinh viên nộp lên hệ thống.'
        });
        return;
      }

      const rows = certsList.map((c, idx) => ({
        'STT': idx + 1,
        'MSSV': c.studentId || c.mssv,
        'Họ và tên': c.studentName || c.student_name || c.name || c.fullName,
        'Lớp': c.className || c.class_name || '—',
        'Chứng chỉ': c.name || c.cert_type || c.certType || c.type || 'Ngoại ngữ',
        'Điểm đạt': c.score || '—',
        'Cấp độ CEFR': c.level || c.cefr_level || c.cefrLevel || 'B1',
        'Ngày thi': c.examDate || c.exam_date || '—',
        'Ngày cấp': c.issueDate || c.issue_date || '—',
        'Trạng thái': c.status === 'approved' || c.status === 'Đã duyệt' || c.status === 'Đã nộp' ? (c.status || 'Hợp lệ') : 'Chờ duyệt',
        'Link minh chứng': c.driveLink || c.drive_link || c.proofData || '—'
      }));

      const XLSX = window.XLSX;
      if (!XLSX) {
        alert('Thư viện XLSX đang tải. Vui lòng thử lại.');
        return;
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ChungChiNgoaiNgu');
      XLSX.writeFile(wb, 'TDTU_BaoCao_ChungChi_HK1_2026_2027.xlsx');
      setExportNotice({
        type: 'success',
        text: '✓ Đã xuất thành công file Bảng tổng hợp Chứng chỉ ngoại ngữ (' + rows.length + ' hồ sơ)!'
      });
    } catch (err) {
      alert('Lỗi xuất chứng chỉ: ' + err.message);
    }
  };

  // Xuất phân bổ doanh nghiệp tiếp nhận (.xlsx)
  const handleExportCompanies = () => {
    try {
      const companyMap = new Map();
      studentsList.forEach(s => {
        const comp = s.company && s.company !== 'Chưa có nơi thực tập' && !s.company.includes('Chưa có') ? s.company : null;
        if (comp) {
          if (!companyMap.has(comp)) {
            companyMap.set(comp, {
              company: comp,
              count: 0,
              students: []
            });
          }
          const item = companyMap.get(comp);
          item.count++;
          item.students.push(s.name);
        }
      });

      const rows = Array.from(companyMap.values()).map((c, idx) => ({
        'STT': idx + 1,
        'Tên Doanh Nghiệp': c.company,
        'Số lượng SV Tiếp Nhận': c.count,
        'Danh sách Sinh viên': c.students.join('; ')
      }));

      const XLSX = window.XLSX;
      const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Thông báo': 'Chưa có dữ liệu phân bổ' }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'PhanBoDoanhNghiep');
      XLSX.writeFile(wb, 'TDTU_PhanBo_DoanhNghiep_HK1_2026_2027.xlsx');
      setExportNotice({
        type: 'success',
        text: '✓ Đã xuất thành công Báo cáo Phân bổ Doanh nghiệp tiếp nhận (' + rows.length + ' doanh nghiệp)!'
      });
    } catch (err) {
      alert('Lỗi xuất báo cáo phân bổ: ' + err.message);
    }
  };

  const totalCount = studentsList.length;
  const approvedCount = studentsList.filter(s => s.statusCode === 'approved' || s.statusCode === 'has_company').length;
  const interviewingCount = studentsList.filter(s => s.statusCode === 'interviewing').length;
  const needSupportCount = studentsList.filter(s => s.statusCode === 'need_support').length;
  const dualCount = studentsList.filter(s => s.isDual).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 documents-page-root">
      
      

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Thống kê & Báo cáo
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Học kỳ 1 · Năm học 2026–2027 · Phê duyệt hồ sơ & Thống kê Khoa CNTT
          </p>
        </div>

        {/* Action Buttons for Merged Export & Reporting */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Xuất file Excel tổng kết đa sheet (KTCN, TSNN, Thống kê)"
          >
            <span>📥</span>
            <span>Xuất Excel Báo cáo</span>
          </button>

          <button
            type="button"
            onClick={handleExportCerts}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Xuất danh sách chứng chỉ ngoại ngữ của sinh viên ra Excel"
          >
            <span>🎓</span>
            <span>Xuất Chứng chỉ</span>
          </button>

          <button
            type="button"
            onClick={handleExportCompanies}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Xuất bảng phân bổ doanh nghiệp tiếp nhận thực tập"
          >
            <span>🏢</span>
            <span>Xuất Doanh nghiệp</span>
          </button>


        </div>
      </div>

      {/* Global Alert */}
      {exportNotice && (
        <div className={`no-print p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          exportNotice.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <span>{exportNotice.text}</span>
          <button onClick={() => setExportNotice(null)} className="font-bold underline ml-4">
            Đóng
          </button>
        </div>
      )}


            {/* Main Section: Full Width Student Data Table & Reports */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Dữ liệu sinh viên tổng kết học kỳ
              </h2>
              <div className="text-[11px] text-slate-400">
                HK1 2026–2027 · Tích chọn để xuất file Excel hoặc in báo cáo
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-[11px] font-bold text-[#003087] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 transition"
              >
                {selectedIds.length === filteredStudents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs flex items-center gap-1"
              >
                <span>Xuất Excel ({selectedIds.length})</span>
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCourseFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'all'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Tất cả ({studentsList.length})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('KTCN')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'KTCN'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              KTCN
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('TSNN')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'TSNN'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              TSNN
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('dual')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'dual'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Song song ({dualCount})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('has_company')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'has_company'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              Đã có nơi TT ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('need_support')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'need_support'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              Cần hỗ trợ ({needSupportCount})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('has_cert')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'has_cert'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
            >
              Đã nộp CC ({studentsList.filter(s => s.hasCert).length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo MSSV, họ tên, doanh nghiệp, vị trí..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-[#003087]"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-[#003087] focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Sinh viên</th>
                  <th className="py-2.5 px-3">Môn học</th>
                  <th className="py-2.5 px-3">Doanh nghiệp / Vị trí</th>
                  <th className="py-2.5 px-3">Chứng chỉ ngoại ngữ</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Đang tải danh sách sinh viên...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không tìm thấy sinh viên nào khớp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(s => {
                    const isChecked = selectedIds.includes(s.id);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => handleToggleSelect(s.id)}
                        className={`transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/50 dark:bg-blue-950/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(s.id)}
                            className="w-4 h-4 rounded text-[#003087] focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {s.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s.mssv}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            s.isDual
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : s.course === 'TSNN'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}>
                            {s.course}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {s.company}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s.position}
                          </div>
                          {s.contactPerson && s.contactPerson !== '—' && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              Mentor: {s.contactPerson} {s.contactPhone ? `(${s.contactPhone})` : ''}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {s.hasCert ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                {s.certificate}
                              </span>
                              {s.certLevel && s.certLevel !== '—' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  {s.certLevel}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Chưa nộp</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (s.statusCode === 'approved' || s.statusCode === 'has_company')
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : s.statusCode === 'interviewing'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : s.statusCode === 'need_support'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-[11px] text-slate-500 border border-slate-200 dark:border-slate-700 leading-relaxed flex items-center justify-between">
            <span>Hiển thị <strong>{filteredStudents.length}</strong> / {studentsList.length} sinh viên</span>
            <span>Đã chọn: <strong className="text-emerald-600">{selectedIds.length}</strong> sinh viên</span>
          </div>

        </div>

      {/* Footer Branding */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-4 no-print">
        © Khoa Công nghệ Thông tin · Trường Đại học Tôn Đức Thắng
      </div>

    </div>
  );
};

window.DocumentsPage = DocumentsPage;

