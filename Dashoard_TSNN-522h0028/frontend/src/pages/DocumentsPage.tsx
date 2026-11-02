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
        text: ` Đã xuất thành công file Excel gồm 3 sheets (DSSV_KTCN, DSSV_TSNN, ThongKe_TongKet) với ${targetList.length} sinh viên!`
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
        text: ' Đã xuất thành công file Bảng tổng hợp Chứng chỉ ngoại ngữ (' + rows.length + ' hồ sơ)!'
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
        text: ' Đã xuất thành công Báo cáo Phân bổ Doanh nghiệp tiếp nhận (' + rows.length + ' doanh nghiệp)!'
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
    <div className="space-y-6 w-full pb-12 documents-page-root">
      
      {/* Print-Only Official TDTU Administrative Header */}
      <div className="print-only mb-6 pb-4 border-b-2 border-[#1f2937]">
        <div className="flex items-start justify-between">
          <div className="text-center w-72">
            <div className="text-[10pt] font-bold uppercase">TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG</div>
            <div className="text-[10pt] font-bold uppercase text-[#003087]">KHOA CÔNG NGHỆ THÔNG TIN</div>
            <div className="w-24 h-[1px] bg-[#1f2937] mx-auto mt-1"></div>
          </div>
          <div className="text-center w-80">
            <div className="text-[10pt] font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="text-[10pt] font-bold">Độc lập - Tự do - Hạnh phúc</div>
            <div className="w-36 h-[1px] bg-[#1f2937] mx-auto mt-1"></div>
            <div className="text-[9pt] italic mt-2">TP. Hồ Chí Minh, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
          </div>
        </div>

        <div className="text-center mt-6">
          <h1 className="text-[14pt] font-bold uppercase tracking-wide">
            BÁO CÁO TỔNG KẾT HỌC PHẦN THỰC TẬP DOANH NGHIỆP
          </h1>
          <div className="text-[10pt] font-semibold mt-1">
            Học phần: Kiến tập Công nghiệp (KTCN) & Tập sự Nghề nghiệp (TSNN) · Học kỳ 1, Năm học 2026–2027
          </div>
        </div>

        {/* Bảng Tóm tắt Thống kê Đợt Thực tập (Print-Only) */}
        <div className="mt-4">
          <table className="w-full text-center border-collapse text-[9pt]">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="border border-[#1f2937] p-1.5 font-bold">Tổng SV Tham gia</th>
                <th className="border border-[#1f2937] p-1.5 font-bold">Đã có nơi tiếp nhận</th>
                <th className="border border-[#1f2937] p-1.5 font-bold">Đang tìm / Chờ PV</th>
                <th className="border border-[#1f2937] p-1.5 font-bold">Cần Khoa hỗ trợ</th>
                <th className="border border-[#1f2937] p-1.5 font-bold">Học song song 2 môn</th>
                <th className="border border-[#1f2937] p-1.5 font-bold">Đạt chuẩn ngoại ngữ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#1f2937] p-1.5 font-bold">{studentsList.length}</td>
                <td className="border border-[#1f2937] p-1.5 font-bold">{approvedCount} ({studentsList.length > 0 ? Math.round((approvedCount / studentsList.length) * 100) : 0}%)</td>
                <td className="border border-[#1f2937] p-1.5">{interviewingCount}</td>
                <td className="border border-[#1f2937] p-1.5 font-bold text-[#dc2626]">{needSupportCount}</td>
                <td className="border border-[#1f2937] p-1.5">{dualCount}</td>
                <td className="border border-[#1f2937] p-1.5">{studentsList.filter(s => s.hasCert).length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print border-b border-[#e5e7eb] pb-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1f2937] leading-tight">
            Thống kê & Báo cáo Thực tập
          </h1>
          <p className="text-[12.5px] text-[#1f2937] mt-1 text-justify leading-relaxed">
            Tổng hợp dữ liệu thực tập doanh nghiệp, trích xuất báo cáo học vụ đa Sheet (.xlsx) và in ấn quyết định tiếp nhận chuẩn mẫu văn bản lưu trữ của Khoa Công nghệ Thông tin.
          </p>
        </div>

        {/* Action Buttons with comfortable fit */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-5 py-2.5 min-w-[160px] bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[12.5px] font-bold transition flex items-center justify-center shadow-xs cursor-pointer whitespace-nowrap"
            title="Xuất file Excel tổng kết đa sheet (KTCN, TSNN, Thống kê)"
          >
            Xuất Excel Báo cáo
          </button>

          <button
            type="button"
            onClick={handleExportCerts}
            className="px-5 py-2.5 min-w-[140px] bg-white border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f8fafc] rounded-lg text-[12.5px] font-bold transition flex items-center justify-center shadow-xs cursor-pointer whitespace-nowrap"
            title="Xuất danh sách chứng chỉ ngoại ngữ của sinh viên ra Excel"
          >
            Xuất Chứng chỉ
          </button>

          <button
            type="button"
            onClick={handleExportCompanies}
            className="px-5 py-2.5 min-w-[150px] bg-white border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f8fafc] rounded-lg text-[12.5px] font-bold transition flex items-center justify-center shadow-xs cursor-pointer whitespace-nowrap"
            title="Xuất bảng phân bổ doanh nghiệp tiếp nhận thực tập"
          >
            Xuất Doanh nghiệp
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 min-w-[140px] bg-white border border-[#003087] text-[#003087] hover:bg-[#ebf3ff] rounded-lg text-[12.5px] font-bold transition flex items-center justify-center shadow-xs cursor-pointer whitespace-nowrap"
            title="In Báo cáo Tổng kết chuẩn trang A4"
          >
            In Báo cáo (PDF/A4)
          </button>
        </div>
      </div>

      {/* Global Alert */}
      {exportNotice && (
        <div className={`no-print p-4 rounded-xl text-[14px] font-semibold flex items-center justify-between ${
          exportNotice.type === 'success'
            ? 'bg-[#ebf3ff]  text-[#003087]  border border-[#bfdbfe] '
            : 'bg-[#fef2f2]  text-[#dc2626]  border border-[#fecaca] '
        }`}>
          <span>{exportNotice.text}</span>
          <button onClick={() => setExportNotice(null)} className="font-bold underline ml-4">
            Đóng
          </button>
        </div>
      )}


            {/* Main Section: Full Width Student Data Table & Reports */}
      <div className="bg-white  border border-[#e5e7eb]  rounded-xl p-5 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5e7eb]  pb-3 no-print">
            <div>
              <h2 className="text-sm font-bold text-[#1f2937] ">
                Dữ liệu sinh viên tổng kết học kỳ
              </h2>
              <div className="text-[13px] text-[#1f2937]">
                HK1 2026–2027
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-[13px] font-bold text-[#003087]  bg-[#ebf3ff]  rounded-lg hover:bg-[#ebf3ff] transition"
              >
                {selectedIds.length === filteredStudents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1 bg-[#003087] hover:bg-[#002266] text-white text-[13px] font-bold rounded-lg transition shadow-xs flex items-center gap-1"
              >
                <span>Xuất Excel ({selectedIds.length})</span>
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 text-[14px] no-print">
            <button
              type="button"
              onClick={() => setCourseFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'all'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'bg-white text-[#1f2937] border border-[#e5e7eb] hover:bg-[#ebf3ff] hover:text-[#003087]'
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
                  : 'bg-white text-[#1f2937] border border-[#e5e7eb] hover:bg-[#ebf3ff] hover:text-[#003087]'
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
                  : 'bg-white text-[#1f2937] border border-[#e5e7eb] hover:bg-[#ebf3ff] hover:text-[#003087]'
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
                  : 'bg-white text-[#1f2937] border border-[#e5e7eb] hover:bg-[#ebf3ff] hover:text-[#003087]'
              }`}
            >
              Song song ({dualCount})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('has_company')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'has_company'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'bg-white text-[#1f2937] border border-[#e5e7eb] hover:bg-[#ebf3ff] hover:text-[#003087]'
              }`}
            >
              Đã có nơi TT ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('need_support')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'need_support'
                  ? 'bg-[#dc2626] text-white shadow-xs'
                  : 'bg-[#fef2f2]  text-[#dc2626]  hover:bg-[#fef2f2]'
              }`}
            >
              Cần hỗ trợ ({needSupportCount})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('has_cert')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'has_cert'
                  ? 'bg-[#ebf3ff] text-white shadow-xs'
                  : 'bg-white text-[#1f2937] border border-[#e5e7eb] hover:bg-[#ebf3ff] hover:text-[#003087]'
              }`}
            >
              Đã nộp CC ({studentsList.filter(s => s.hasCert).length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative no-print">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..." style={{ paddingLeft: "44px" }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e5e7eb]  bg-white  text-[14px] outline-none focus:ring-2 focus:ring-[#003087]"
            />
            <svg className="w-4 h-4 text-[#1f2937] absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc]  text-[#1f2937] uppercase tracking-wider font-bold text-[10px] border-b border-[#e5e7eb] ">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center no-print">
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
              <tbody className="divide-y divide-slate-100  font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#1f2937]">
                      Đang tải danh sách sinh viên...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#1f2937]">
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
                            ? 'bg-[#ebf3ff]/50 '
                            : 'hover:bg-[#f8fafc] '
                        }`}
                      >
                        <td className="py-3 px-3 text-center no-print" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(s.id)}
                            className="w-4 h-4 rounded text-[#003087] focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-[#1f2937] ">
                            {s.name}
                          </div>
                          <div className="text-[13px] text-[#1f2937]">
                            {s.mssv}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            s.isDual
                              ? 'bg-[#ebf3ff] text-[#003087]  '
                              : s.course === 'TSNN'
                                ? 'bg-[#f8fafc] text-[#1f2937]  '
                                : 'bg-[#ebf3ff] text-blue-800  '
                          }`}>
                            {s.course}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#1f2937] ">
                            {s.company}
                          </div>
                          <div className="text-[13px] text-[#1f2937]">
                            {s.position}
                          </div>
                          {s.contactPerson && s.contactPerson !== '—' && (
                            <div className="text-[10px] text-[#003087]  font-medium mt-0.5">
                              Mentor: {s.contactPerson} {s.contactPhone ? `(${s.contactPhone})` : ''}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {s.hasCert ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ebf3ff] text-[#003087]   border border-[#bfdbfe] ">
                                {s.certificate}
                              </span>
                              {s.certLevel && s.certLevel !== '—' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#f8fafc] text-[#1f2937]  ">
                                  {s.certLevel}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[13px] text-[#1f2937]">Chưa nộp</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11.5px] font-bold ${
                            (s.statusCode === 'approved' || s.statusCode === 'has_company')
                              ? 'bg-[#ebf3ff] text-[#003087]  '
                              : s.statusCode === 'interviewing'
                                ? 'bg-[#f8fafc] text-[#1f2937]  '
                                : s.statusCode === 'need_support'
                                  ? 'bg-[#fef2f2] text-[#dc2626]  '
                                  : 'bg-[#f8fafc] text-[#1f2937]  '
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

          <div className="p-3 bg-[#f8fafc] rounded-xl text-[12.5px] text-[#1f2937] border border-[#e5e7eb] leading-relaxed flex items-center justify-between no-print">
            <span>Hiển thị <strong>{filteredStudents.length}</strong> / {studentsList.length} sinh viên</span>
            <span>Đã chọn: <strong className="text-[#003087]">{selectedIds.length}</strong> sinh viên để xuất/in</span>
          </div>

        </div>

      {/* Official University 3-Party Signatures for Printed Report */}
      <div className="print-only mt-8 pt-4">
        <div className="print-signatures grid grid-cols-3 text-center gap-6 text-[9.5pt]">
          <div>
            <div className="font-bold uppercase">NGƯỜI LẬP BÁO CÁO</div>
            <div className="italic text-[8.5pt] mt-0.5">(Ký và ghi rõ họ tên)</div>
            <div className="h-24"></div>
            <div className="font-bold text-[9.5pt]">{currentUser?.name || 'Văn phòng Khoa CNTT'}</div>
          </div>
          <div>
            <div className="font-bold uppercase">GIẢNG VIÊN PHỤ TRÁCH</div>
            <div className="italic text-[8.5pt] mt-0.5">(Ký và ghi rõ họ tên)</div>
            <div className="h-24"></div>
            <div className="font-bold text-[9.5pt]">ThS. Nguyễn Văn A</div>
          </div>
          <div>
            <div className="font-bold uppercase">TRƯỞNG KHOA CNTT</div>
            <div className="italic text-[8.5pt] mt-0.5">(Ký, đóng dấu và ghi rõ họ tên)</div>
            <div className="h-24"></div>
            <div className="font-bold text-[9.5pt]">TS. Phạm Văn C</div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-[11px] text-[#1f2937] text-center pt-4 no-print border-t border-[#e5e7eb] mt-6">
        Khoa Công nghệ Thông tin · Trường Đại học Tôn Đức Thắng
      </div>

    </div>
  );
};

window.DocumentsPage = DocumentsPage;

