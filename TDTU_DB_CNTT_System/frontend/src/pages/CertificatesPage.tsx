// Certificates Page Component - Quản lý Chứng chỉ Ngoại ngữ Tiếng Anh (TDTU CNTT)
// Hỗ trợ 2 chế độ hiển thị phân quyền chuẩn Prime RBAC:
// 1. Giảng viên & Admin Khoa (Scope All = 11, Read = 2): Bảng điều khiển tra cứu, tìm kiếm, lọc toàn bộ sinh viên, xem link Drive minh chứng (Read-only).
// 2. Sinh viên (Read=2, Create=3, Update=5, Delete=7): Quản lý nộp hồ sơ cá nhân, tự tính CEFR, tách riêng Ngày thi & Ngày cấp, cam kết trung thực.

const ENGLISH_CERTIFICATES = [
  { key: 'TOEIC', name: 'TOEIC', color: 'bg-[#ebf3ff] text-[#003087] border-[#bfdbfe]   ' },
  { key: 'IELTS', name: 'IELTS', color: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]   ' },
  { key: 'TOEFL_IBT', name: 'TOEFL iBT', color: 'bg-[#f8fafc] text-[#1f2937] border-[#e5e7eb]   ' },
  { key: 'APTIS_ESOL', name: 'Aptis ESOL', color: 'bg-[#ebf3ff] text-[#003087] border-[#bfdbfe]   ' },
  { key: 'CAMBRIDGE', name: 'Cambridge', color: 'bg-[#ebf3ff] text-[#003087] border-[#bfdbfe]   ' }
];

// Hàm tự động tính cấp độ CEFR (A1, A2, B1, B2, C1, C2) theo số điểm
const calculateCefrLevel = (certKey, rawScore) => {
  if (!rawScore) return '';
  const trimmed = String(rawScore).trim().toUpperCase();

  if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(trimmed)) {
    return trimmed;
  }

  const s = parseFloat(trimmed.replace(',', '.'));
  if (isNaN(s)) return '';

  if (certKey === 'TOEIC') {
    if (s < 225) return 'A1';
    if (s < 550) return 'A2';
    if (s < 785) return 'B1';
    if (s < 945) return 'B2';
    return 'C1';
  }

  if (certKey === 'IELTS') {
    if (s < 4.0) return 'A2';
    if (s < 5.5) return 'B1';
    if (s < 7.0) return 'B2';
    if (s < 8.5) return 'C1';
    return 'C2';
  }

  if (certKey === 'TOEFL_IBT') {
    if (s < 42) return 'A2';
    if (s < 72) return 'B1';
    if (s < 95) return 'B2';
    return 'C1';
  }

  if (certKey === 'APTIS_ESOL') {
    if (s < 80) return 'A2';
    if (s < 120) return 'B1';
    if (s < 160) return 'B2';
    return 'C1';
  }

  if (certKey === 'CAMBRIDGE') {
    if (s < 140) return 'A2';
    if (s < 160) return 'B1';
    if (s < 180) return 'B2';
    return 'C1';
  }

  return '';
};

// Chuẩn hóa ngày yyyy-mm-dd cho ô input type="date"
const normalizeDateForInput = (dStr) => {
  if (!dStr) return new Date().toISOString().split('T')[0];
  if (dStr.includes('/')) {
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return dStr;
};

// Chuẩn hóa ngày hiển thị dd-mm-yyyy chuẩn hệ thống
const formatDateForDisplay = (dStr) => {
  if (!dStr) return '—';
  if (dStr.includes('/')) {
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
    }
  }
  if (dStr.includes('-')) {
    const parts = dStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    }
  }
  return dStr;
};

// Helper tính dải số trang (Smart window pagination)
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

// =========================================================================
// PHẦN 1: GIAO DIỆN SCOPE ALL DÀNH CHO GIẢNG VIÊN VÀ ADMIN KHOA
// =========================================================================
const ScopeAllCertificatesView = ({ currentUser, activeSemester = 'hk1_2026_2027', onSemesterChange }) => {
  const [currentSemester, setCurrentSemester] = React.useState(activeSemester || 'hk1_2026_2027');
  const [certs, setCerts] = React.useState([]);
  const [totalEnrolledStudents, setTotalEnrolledStudents] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCert, setFilterCert] = React.useState('ALL');
  const [filterCefr, setFilterCefr] = React.useState('ALL');
  const [filterGraduation, setFilterGraduation] = React.useState('ALL');
  const [selectedProofModal, setSelectedProofModal] = React.useState(null);

  // Phân trang Scope All
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Tải danh sách toàn bộ chứng chỉ và tổng số sinh viên thực tế theo học kỳ đã chọn (khai báo trước các useEffect)
  const loadData = React.useCallback(async (targetSemester) => {
    try {
      setLoading(true);
      const sem = targetSemester || currentSemester || 'hk1_2026_2027';
      let loadedStudentCount = 0;
      if (window.ApiClient?.getStudents) {
        try {
          const res = await window.ApiClient.getStudents({ semester: sem });
          const list = res?.items || res?.data?.items || res?.students || (Array.isArray(res) ? res : []);
          if (Array.isArray(list) && list.length > 0) loadedStudentCount = list.length;
        } catch {}
      }
      if (loadedStudentCount === 0 && window.ApiClient?.getLiveStudents) {
        try {
          const students = await window.ApiClient.getLiveStudents(sem);
          if (Array.isArray(students) && students.length > 0) loadedStudentCount = students.length;
        } catch {}
      }
      if (loadedStudentCount === 0) {
        try {
          const raw = localStorage.getItem('tdtu_imported_students_' + sem) || localStorage.getItem('tdtu_live_students_clean');
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length > 0) loadedStudentCount = arr.length;
          }
        } catch {}
      }
      if (loadedStudentCount === 0) {
        loadedStudentCount = 91; // Danh sách chuẩn toàn khoa
      }
      setTotalEnrolledStudents(loadedStudentCount);

      if (window.ApiClient?.fetchAllCertificates) {
        const data = await window.ApiClient.fetchAllCertificates(sem);
        if (Array.isArray(data)) {
          setCerts(data);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách Scope All theo học kỳ:', err);
    } finally {
      setLoading(false);
    }
  }, [currentSemester]);

  // Đồng bộ prop activeSemester từ App/Navbar xuống component
  React.useEffect(() => {
    if (activeSemester && activeSemester !== currentSemester) {
      setCurrentSemester(activeSemester);
      loadData(activeSemester);
    }
  }, [activeSemester, currentSemester, loadData]);

  React.useEffect(() => {
    loadData(currentSemester);

    const handleUpdate = () => {
      loadData(currentSemester);
    };

    const handleSemesterChange = (e) => {
      const newSem = e?.detail?.semesterId || e?.detail;
      if (newSem && newSem !== currentSemester) {
        setCurrentSemester(newSem);
        loadData(newSem);
      }
    };

    window.addEventListener('tdtu_certs_updated', handleUpdate);
    window.addEventListener('tdtu_data_updated', handleUpdate);
    window.addEventListener('tdtu_semester_changed', handleSemesterChange);
    window.addEventListener('storage', handleUpdate);

    let bc = null;
    try {
      bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.onmessage = (msg) => {
        if (!msg.data || msg.data.type === 'cert_updated' || msg.data.type === 'cert_deleted' || msg.data.type === 'semester_changed') {
          loadData(currentSemester);
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('tdtu_certs_updated', handleUpdate);
      window.removeEventListener('tdtu_data_updated', handleUpdate);
      window.removeEventListener('tdtu_semester_changed', handleSemesterChange);
      window.removeEventListener('storage', handleUpdate);
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }, [currentSemester, loadData]);

  // Lọc dữ liệu theo tìm kiếm và bộ lọc
  const filteredCerts = certs.filter(c => {
    // 1. Tìm kiếm MSSV hoặc Họ tên
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q ||
      (c.studentId && c.studentId.toLowerCase().includes(q)) ||
      (c.studentName && c.studentName.toLowerCase().includes(q)) ||
      (c.className && c.className.toLowerCase().includes(q));

    // 2. Lọc theo Loại chứng chỉ
    const matchCert = filterCert === 'ALL' ||
      (c.name && c.name.toLowerCase().includes(filterCert.toLowerCase()));

    // 3. Lọc theo Cấp độ CEFR
    const matchCefr = filterCefr === 'ALL' || (c.level === filterCefr);

    // 4. Lọc theo Chuẩn đầu ra tốt nghiệp (B1+)
    const isPass = ['B1', 'B2', 'C1', 'C2'].includes(c.level);
    const matchGrad = filterGraduation === 'ALL' ||
      (filterGraduation === 'PASS' && isPass) ||
      (filterGraduation === 'NOT_PASS' && !isPass);

    return matchSearch && matchCert && matchCefr && matchGrad;
  });

  // Tự động trở về trang 1 khi thay đổi điều kiện lọc hoặc từ khóa tìm kiếm
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCert, filterCefr, filterGraduation]);

  // Phân trang Scope All
  const totalItems = filteredCerts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCerts = filteredCerts.slice(startIndex, startIndex + pageSize);

  // Tính toán số liệu thống kê nhanh (KPIs) phản ánh chính xác học kỳ đang chọn
  const totalCount = certs.length;
  const passedCount = certs.filter(c => ['B1', 'B2', 'C1', 'C2'].includes(c.level)).length;
  const passedRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  
  // Tập hợp các MSSV duy nhất đã nộp chứng chỉ tiếng Anh trong học kỳ này
  const studentIdsWithCert = new Set(certs.map(c => String(c.studentId || c.mssv || '').trim().toUpperCase()).filter(Boolean));
  const certSubmittedStudentCount = studentIdsWithCert.size;
  
  // Tổng sinh viên thực tế toàn khoa theo học kỳ (tránh bị fallback về 0 khiến thẻ báo 0 SV)
  let effectiveTotalStudents = totalEnrolledStudents;
  if (effectiveTotalStudents <= certSubmittedStudentCount) {
    try {
      const raw = localStorage.getItem('tdtu_imported_students_' + (currentSemester || 'hk1_2026_2027')) || localStorage.getItem('tdtu_live_students_clean');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > certSubmittedStudentCount) effectiveTotalStudents = arr.length;
      }
    } catch {}
    if (effectiveTotalStudents <= certSubmittedStudentCount) effectiveTotalStudents = 91; // 91 sinh viên chuẩn theo danh sách Khoa CNTT
  }
  const totalEffectiveStudents = effectiveTotalStudents;
  const unsubmittedCount = Math.max(0, totalEffectiveStudents - certSubmittedStudentCount);

  // Thống kê phân bố chứng chỉ
  const toeicCount = certs.filter(c => (c.name || '').toUpperCase().includes('TOEIC')).length;
  const ieltsCount = certs.filter(c => (c.name || '').toUpperCase().includes('IELTS')).length;
  const aptisCount = certs.filter(c => (c.name || '').toUpperCase().includes('APTIS')).length;
  const toeflCount = certs.filter(c => (c.name || '').toUpperCase().includes('TOEFL')).length;
  const cambridgeCount = certs.filter(c => (c.name || '').toUpperCase().includes('CAMBRIDGE')).length;

  const semesterLabels = {
    'hk1_2026_2027': 'Học kỳ 1 / 2026–2027 (Hiện tại)',
    'hk2_2025_2026': 'Học kỳ 2 / 2025–2026',
    'hk1_2025_2026': 'Học kỳ 1 / 2025–2026'
  };

  const handleSemesterSelect = (e) => {
    const s = e.target.value;
    setCurrentSemester(s);
    if (onSemesterChange) onSemesterChange(s);
    try { localStorage.setItem('tdtu_active_semester', s); } catch {}
    window.dispatchEvent(new CustomEvent('tdtu_semester_changed', { detail: { semesterId: s } }));
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1f2937] flex items-center gap-2.5">
            <span>Quản lý Chứng chỉ Ngoại ngữ Toàn khoa</span>
          </h1>
          <p className="text-xs text-[#4b5563] mt-1">
            Học kỳ: <strong className="text-[#003087]">{semesterLabels[currentSemester] || currentSemester}</strong> · Tổng sinh viên: <strong>{totalEffectiveStudents} sinh viên</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#4b5563] whitespace-nowrap">Học kỳ:</span>
            <select
              value={currentSemester}
              onChange={handleSemesterSelect}
              className="px-3 py-2 bg-white text-[#003087] border border-[#cbd5e1] rounded-xl text-xs font-bold shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#003087]"
            >
              <option value="hk1_2026_2027">Học kỳ 1 / 2026–2027 (Hiện tại)</option>
              <option value="hk2_2025_2026">Học kỳ 2 / 2025–2026</option>
              <option value="hk1_2025_2026">Học kỳ 1 / 2025–2026</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => loadData(currentSemester)}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#003087] border border-[#e5e7eb] text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Đang đồng bộ...' : 'Làm mới dữ liệu'}</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống kê nhanh (KPIs) - Lớn, rõ ràng, không có ô icon rỗng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tổng hồ sơ đã nộp */}
        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wider">
            Tổng chứng chỉ nộp
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#1f2937] my-2">
            {totalCount} <span className="text-sm font-semibold text-[#64748b]">hồ sơ</span>
          </div>
        </div>

        {/* Card 2: Đạt chuẩn tốt nghiệp (B1+) */}
        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wider">
            Đạt chuẩn Tốt nghiệp (B1+)
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#003087] my-2">
            {passedCount} <span className="text-sm font-semibold text-[#003087]">sinh viên</span>
          </div>
        </div>

        {/* Card 3: Chưa có chứng chỉ tiếng Anh - Tính chuẩn xác theo số lượng thực tế toàn khóa */}
        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wider flex items-center justify-between">
            <span>Chưa có chứng chỉ tiếng Anh</span>
            <span className="text-[11px] font-bold text-[#dc2626] bg-[#fef2f2] px-2 py-0.5 rounded-full border border-[#fecaca]">
              {totalEffectiveStudents > 0 ? Math.round((unsubmittedCount / totalEffectiveStudents) * 100) : 0}%
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#dc2626] my-2">
            {unsubmittedCount} <span className="text-sm font-semibold text-[#dc2626]">sinh viên</span>
          </div>
          <div className="text-[11.5px] text-[#64748b] font-medium">
            {unsubmittedCount}/{totalEffectiveStudents} SV chưa nộp minh chứng
          </div>
        </div>

        {/* Card 4: Cơ cấu loại chứng chỉ */}
        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Cơ cấu chứng chỉ</span>
            <span className="text-[11.5px] text-[#003087] font-bold">Top phổ biến</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]">
              TOEIC: {toeicCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]">
              Aptis: {aptisCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
              IELTS: {ieltsCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]">
              Cambridge: {cambridgeCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#f8fafc] text-[#1f2937] border border-[#e2e8f0]">
              TOEFL: {toeflCount}
            </span>
          </div>
        </div>

      </div>

      {/* Thanh Tìm kiếm & Bộ lọc linh hoạt */}
      <div className="p-4 rounded-xl bg-white  border border-[#e5e7eb]  shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          
          {/* Ô Tìm kiếm MSSV, Họ tên */}
          <div className="lg:col-span-6 relative flex items-center">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#4b5563]">
              <svg className="w-5 h-5 text-[#4b5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              style={{ paddingLeft: '44px' }}
              className="w-full pr-4 py-3 text-[14.5px] font-medium rounded-xl border border-[#cbd5e1] bg-[#f8fafc] focus:bg-white focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937] transition"
            />
          </div>

          {/* Lọc theo Loại chứng chỉ */}
          <div className="lg:col-span-3">
            <select
              value={filterCert}
              onChange={(e) => setFilterCert(e.target.value)}
              className="w-full px-4 py-3 text-[14.5px] font-semibold rounded-xl border border-[#e5e7eb] bg-[#f8fafc] focus:bg-white focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937] cursor-pointer"
            >
              <option value="ALL">Tất cả loại chứng chỉ</option>
              <option value="TOEIC">TOEIC</option>
              <option value="IELTS">IELTS</option>
              <option value="Aptis ESOL">Aptis ESOL</option>
              <option value="TOEFL iBT">TOEFL iBT</option>
              <option value="Cambridge">Cambridge</option>
            </select>
          </div>

          {/* Lọc theo Cấp độ CEFR */}
          <div className="lg:col-span-3">
            <select
              value={filterCefr}
              onChange={(e) => setFilterCefr(e.target.value)}
              className="w-full px-4 py-3 text-[14.5px] font-semibold rounded-xl border border-[#e5e7eb] bg-[#f8fafc] focus:bg-white focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937] cursor-pointer"
            >
              <option value="ALL">Cấp độ CEFR: Tất cả</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>

        </div>

        {/* Thông tin kết quả lọc & Nút reset */}
        {(searchTerm || filterCert !== 'ALL' || filterCefr !== 'ALL') && (
          <div className="flex items-center justify-between text-xs text-[#1f2937] pt-2 border-t border-[#e5e7eb] ">
            <span>
              Tìm thấy <strong>{filteredCerts.length}</strong> kết quả phù hợp với bộ lọc.
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterCert('ALL');
                setFilterCefr('ALL');
                setFilterGraduation('ALL');
              }}
              className="text-[#003087]  hover:underline font-bold cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Bảng Dữ liệu Scope All Toàn khoa */}
      <div className="bg-white  rounded-xl border border-[#e5e7eb]  shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e7eb]  flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#1f2937] ">
              Bảng Tổng hợp Chứng chỉ Sinh viên Toàn khoa
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11.5px] font-bold bg-[#ebf3ff]  text-[#003087] ">
              {filteredCerts.length} bản ghi
            </span>
          </div>
          <div className="text-[11px] text-[#1f2937]">
            Chế độ xem: Read-only (Thẩm tra & Đối chiếu minh chứng)
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#1f2937]">
            <div className="w-8 h-8 border-3 border-[#003087] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Đang nạp dữ liệu chứng chỉ toàn khoa...</p>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="p-12 text-center text-[#1f2937]">
            <div className="w-12 h-12 rounded-full bg-[#f8fafc]  flex items-center justify-center text-2xl mx-auto mb-3">
              
            </div>
            <p className="text-sm font-bold text-[#1f2937] ">Không tìm thấy chứng chỉ nào</p>
            <p className="text-[13.5px] text-[#4b5563] mt-1">Hãy thử thay đổi từ khóa tìm kiếm hoặc làm mới bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] text-[#1f2937] table-fixed min-w-[1150px]">
              <thead className="bg-[#f8fafc] text-[13.5px] font-bold uppercase text-[#1f2937] border-b border-[#e5e7eb]">
                <tr>
                  <th className="py-4 px-4 w-16 text-center">STT</th>
                  <th className="py-4 px-4 w-64">Sinh viên</th>
                  <th className="py-4 px-4 w-36">Chứng chỉ</th>
                  <th className="py-4 px-4 w-28 text-center">Điểm số</th>
                  <th className="py-4 px-4 w-32 text-center">Cấp độ CEFR</th>
                  <th className="py-4 px-4 w-32 text-center">Ngày thi</th>
                  <th className="py-4 px-4 w-32 text-center">Ngày cấp</th>
                  <th className="py-4 px-4 w-52">Minh chứng Google Drive</th>
                  <th className="py-4 px-4 w-36 text-center">Cam kết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  font-medium">
                {paginatedCerts.map((cert, index) => {
                  const driveUrl = cert.driveLink || cert.proofData || '';
                  const hasDrive = driveUrl && (driveUrl.startsWith('http://') || driveUrl.startsWith('https://'));
                  const isPass = ['B1', 'B2', 'C1', 'C2'].includes(cert.level);

                  // Màu badge theo chứng chỉ
                  const certConfig = ENGLISH_CERTIFICATES.find(c => 
                    (cert.name || '').toUpperCase().includes(c.key) || 
                    c.name.toUpperCase() === (cert.name || '').toUpperCase()
                  );
                  const certColorClass = certConfig ? certConfig.color : 'bg-[#f8fafc] text-[#1f2937] border-[#e5e7eb]  ';

                  return (
                    <tr key={cert.id || index} className="hover:bg-[#f8fafc]  transition">
                      
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center text-[#1f2937] font-mono text-[14px] font-bold">
                        {startIndex + index + 1}
                      </td>

                      {/* Thông tin Sinh viên */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1f2937] ">
                          {cert.studentName || 'Sinh viên TDTU'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[13.5px] font-bold text-[#003087] ">
                            {cert.studentId}
                          </span>
                          {cert.className && (
                            <span className="text-[12.5px] text-[#4b5563] font-medium px-2 py-0.5 rounded bg-[#f1f5f9] ">
                              Lớp {cert.className}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tên Chứng chỉ */}
                      <td className="py-3.5 px-4">
                        <span className={`px-3 py-1 rounded-lg text-[13.5px] font-bold border inline-block ${certColorClass}`}>
                          {cert.name}
                        </span>
                      </td>

                      {/* Điểm số */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[16px] font-black text-[#1f2937] font-mono">
                          {cert.score}
                        </span>
                      </td>

                      {/* Cấp độ CEFR */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[13.5px] font-bold inline-flex items-center gap-1 ${
                          isPass
                            ? 'bg-[#ebf3ff] text-[#003087]   border border-[#bfdbfe] '
                            : 'bg-[#f8fafc] text-[#1f2937]   border border-[#e5e7eb] '
                        }`}>
                          <span>{isPass ? '' : ''}</span>
                          <span>{cert.level || 'B1'}</span>
                        </span>
                      </td>

                      {/* Ngày thi */}
                      <td className="py-3.5 px-4 text-[#1f2937] text-[13.5px] font-mono text-center">
                        {formatDateForDisplay(cert.examDate)}
                      </td>

                      {/* Ngày cấp */}
                      <td className="py-3.5 px-4 text-[#1f2937] text-[13.5px] font-mono text-center">
                        {formatDateForDisplay(cert.issueDate || cert.examDate)}
                      </td>

                      {/* Minh chứng Google Drive */}
                      <td className="py-3.5 px-4">
                        {hasDrive ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                              title="Mở Google Drive minh chứng của sinh viên trong tab mới"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                              </svg>
                              <span>Mở Google Drive</span>
                              <span className="text-[11px]">↗</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setSelectedProofModal(cert)}
                              className="p-1.5 text-[#1f2937] hover:text-[#1f2937]  rounded-lg hover:bg-[#f8fafc]  transition"
                              title="Xem chi tiết thông tin hồ sơ"
                            >
                              
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#1f2937] italic">Chưa có liên kết</span>
                        )}
                      </td>

                      {/* Trạng thái Cam kết */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11.5px] font-bold bg-[#ebf3ff] text-[#003087]   border border-[#bfdbfe] ">
                           Đã cam đoan
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination matching Figma Frame 12 */}
        {!loading && filteredCerts.length > 0 && (
          <div className="p-4 border-t border-[#e5e7eb]  flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#1f2937]">
            <div className="flex items-center gap-3">
              <span>
                Hiển thị <strong>{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> trên tổng số <strong>{totalItems}</strong> chứng chỉ
              </span>
              <span className="hidden sm:inline text-[#1f2937] ">|</span>
              <div className="flex items-center gap-1.5">
                <span>Mỗi trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded border border-[#e5e7eb]  bg-white  text-[#1f2937]  text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 rounded border border-[#e5e7eb]  disabled:opacity-40 hover:bg-[#f8fafc]  font-bold transition-colors"
                title="Trang đầu"
              >
                «
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-2.5 py-1 rounded border border-[#e5e7eb]  disabled:opacity-40 hover:bg-[#f8fafc]  font-bold transition-colors"
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
                    className={`min-w-[28px] px-2 py-1 rounded font-semibold text-xs transition-colors ${
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
                className="px-2.5 py-1 rounded border border-[#e5e7eb]  disabled:opacity-40 hover:bg-[#f8fafc]  font-bold transition-colors"
                title="Trang tiếp"
              >
                ›
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 rounded border border-[#e5e7eb]  disabled:opacity-40 hover:bg-[#f8fafc]  font-bold transition-colors"
                title="Trang cuối"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Xem chi tiết hồ sơ chứng chỉ sinh viên (Thẩm tra Read-only) */}
      {selectedProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-6xl xl:max-w-7xl w-[95vw] border border-[#cbd5e1] shadow-2xl p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb] ">
              <div className="flex items-center gap-2">
                
                <div>
                  <h3 className="text-sm font-bold text-[#1f2937] ">
                    Chi tiết Hồ sơ Chứng chỉ Tiếng Anh
                  </h3>
                  <p className="text-[11px] text-[#1f2937]">
                    Đối chiếu thông tin phục vụ xét chuẩn đầu ra
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofModal(null)}
                className="text-[#1f2937] hover:text-[#1f2937]  text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#f8fafc]  border border-[#e5e7eb] ">
                <div>
                  <span className="text-[#1f2937] block text-[10.5px]">Sinh viên:</span>
                  <strong className="text-[#1f2937] ">{selectedProofModal.studentName}</strong>
                </div>
                <div>
                  <span className="text-[#1f2937] block text-[10.5px]">MSSV:</span>
                  <strong className="font-mono text-[#003087] ">{selectedProofModal.studentId}</strong>
                </div>
                <div>
                  <span className="text-[#1f2937] block text-[10.5px]">Loại chứng chỉ:</span>
                  <strong className="text-[#1f2937] ">{selectedProofModal.name}</strong>
                </div>
                <div>
                  <span className="text-[#1f2937] block text-[10.5px]">Điểm đạt được / CEFR:</span>
                  <strong className="text-[#003087] ">{selectedProofModal.score} (Cấp độ {selectedProofModal.level})</strong>
                </div>
                <div>
                  <span className="text-[#1f2937] block text-[10.5px]">Ngày thi:</span>
                  <span className="text-[#1f2937] font-mono">{formatDateForDisplay(selectedProofModal.examDate)}</span>
                </div>
                <div>
                  <span className="text-[#1f2937] block text-[10.5px]">Ngày cấp bằng:</span>
                  <span className="text-[#1f2937] font-mono">{formatDateForDisplay(selectedProofModal.issueDate || selectedProofModal.examDate)}</span>
                </div>
              </div>

              <div>
                <span className="text-[#1f2937]  block text-[11px] mb-1 font-bold">
                  Đường dẫn Google Drive minh chứng:
                </span>
                <div className="p-2.5 rounded-xl bg-[#ebf3ff]/60  border border-[#bfdbfe]  flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[#003087]  truncate">
                    {selectedProofModal.driveLink || selectedProofModal.proofData}
                  </span>
                  <a
                    href={selectedProofModal.driveLink || selectedProofModal.proofData}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-[#003087] text-white text-[11px] font-bold rounded-lg shrink-0 hover:bg-[#002266] transition inline-flex items-center gap-1"
                  >
                    <span>Mở tab mới</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc]/70  border border-[#e5e7eb]  rounded-xl text-[11px] text-[#1f2937] ">
                <strong>Cam kết trung thực của sinh viên: </strong> 
                Sinh viên đã xác nhận cam đoan toàn bộ thông tin và minh chứng chứng chỉ tiếng Anh cung cấp là chính xác, hoàn toàn chịu trách nhiệm trước Nhà trường và Khoa CNTT nếu có sự sai lệch.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProofModal(null)}
                className="px-4 py-2 bg-[#f8fafc] hover:bg-[#e5e7eb]   text-[#1f2937]  rounded-xl font-semibold text-xs transition cursor-pointer"
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

// =========================================================================
// PHẦN 2: GIAO DIỆN QUẢN LÝ CỦA SINH VIÊN (CRUD CÁ NHÂN & NỘP CHỨNG CHỈ)
// =========================================================================
const StudentPersonalCertificatesView = ({ currentUser, activeSemester = 'hk1_2026_2027' }) => {
  const studentId = String(
    currentUser?.studentId ||
    currentUser?.mssv ||
    (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
    '522H0045'
  ).trim().toUpperCase();
  const studentName = currentUser?.fullName || currentUser?.name || currentUser?.displayName || 'Sinh viên Khoa CNTT';

  // State danh sách chứng chỉ tiếng Anh
  const [certs, setCerts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCert, setEditingCert] = React.useState(null);
  const [formData, setFormData] = React.useState({
    certKey: 'TOEIC',
    name: 'TOEIC',
    score: '',
    level: 'B1',
    examDate: new Date().toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    driveLink: '',
    commitment: false
  });

  const [notification, setNotification] = React.useState(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Phân trang hồ sơ chứng chỉ của Sinh viên
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(5);

  const totalItems = certs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCerts = certs.slice(startIndex, startIndex + pageSize);

  // Tải danh sách chứng chỉ từ LocalStorage / API & Lắng nghe Realtime
  React.useEffect(() => {
    const loadCerts = async () => {
      try {
        let hasCache = false;
        if (window.ApiClient?.getCachedCerts || window.ApiClient?.getStudentCerts) {
          const cached = window.ApiClient.getCachedCerts ? window.ApiClient.getCachedCerts(studentId) : window.ApiClient.getStudentCerts(studentId);
          if (Array.isArray(cached) && cached.length > 0) {
            setCerts(cached);
            hasCache = true;
          }
        }
        if (!hasCache) {
          setLoading(true);
        }
        if (window.ApiClient?.fetchStudentCerts) {
          const list = await window.ApiClient.fetchStudentCerts(studentId);
          if (Array.isArray(list)) {
            setCerts(list);
          }
        }
      } catch (err) {
        console.warn('Lỗi tải chứng chỉ:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCerts();

    const handleUpdate = (e) => {
      const map = e.detail;
      if (map && map[studentId]) {
        setCerts(map[studentId]);
      } else if (map && Object.keys(map).length === 0) {
        setCerts([]);
      } else {
        loadCerts();
      }
    };

    window.addEventListener('tdtu_certs_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    let bc = null;
    try {
      bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.onmessage = (msg) => {
        if (!msg.data || msg.data.studentId === studentId || msg.data.type === 'cert_updated' || msg.data.type === 'cert_deleted') {
          loadCerts();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('tdtu_certs_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }, [studentId, currentUser]);

  // Xử lý khi chọn chứng chỉ tiếng Anh
  const handleSelectCert = (key) => {
    const item = ENGLISH_CERTIFICATES.find(c => c.key === key) || ENGLISH_CERTIFICATES[0];
    const autoLevel = calculateCefrLevel(item.key, formData.score);
    setFormData(prev => ({
      ...prev,
      certKey: item.key,
      name: item.name,
      level: autoLevel || prev.level || 'B1'
    }));
  };

  // Xử lý khi nhập điểm số -> Tự động tính cấp độ CEFR (sinh viên vẫn có thể tự chọn lại)
  const handleScoreChange = (scoreVal) => {
    const autoLevel = calculateCefrLevel(formData.certKey, scoreVal);
    setFormData(prev => ({
      ...prev,
      score: scoreVal,
      level: autoLevel || prev.level || 'B1'
    }));
  };

  // Mở modal thêm mới chứng chỉ tiếng Anh
  const handleOpenAddModal = () => {
    const defaultCert = ENGLISH_CERTIFICATES[0];
    const today = new Date().toISOString().split('T')[0];
    setEditingCert(null);
    setFormData({
      certKey: defaultCert.key,
      name: defaultCert.name,
      score: '',
      level: 'B1',
      examDate: today,
      issueDate: today,
      driveLink: '',
      commitment: false
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa chứng chỉ
  const handleOpenEditModal = (cert) => {
    setEditingCert(cert);
    const formattedExamDate = normalizeDateForInput(cert.examDate);
    const formattedIssueDate = normalizeDateForInput(cert.issueDate || cert.examDate);

    const matched = ENGLISH_CERTIFICATES.find(c => 
      c.key.toLowerCase() === (cert.name || '').toLowerCase() || 
      c.name.toLowerCase() === (cert.name || '').toLowerCase() ||
      (cert.name || '').toLowerCase().includes(c.key.toLowerCase())
    ) || ENGLISH_CERTIFICATES[0];

    setFormData({
      certKey: matched.key,
      name: cert.name || matched.name,
      score: cert.score || '',
      level: cert.level || 'B1',
      examDate: formattedExamDate,
      issueDate: formattedIssueDate,
      driveLink: cert.driveLink || cert.proofData || '',
      commitment: true
    });
    setIsModalOpen(true);
  };

  // Xóa chứng chỉ (Full CRUD - Quyền sinh viên)
  const handleDeleteCert = async (id, certName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chứng chỉ ${certName || 'này'} khỏi danh sách?`)) {
      try {
        if (window.ApiClient?.deleteStudentCert) {
          await window.ApiClient.deleteStudentCert(studentId, id);
        }
        const updated = certs.filter(c => c.id !== id);
        setCerts(updated);
        setNotification({ type: 'success', text: `Đã xóa chứng chỉ ${certName || ''} thành công.` });
      } catch (err) {
        alert('Có lỗi xảy ra khi xóa chứng chỉ. Vui lòng thử lại.');
      }
    }
  };

  // Lưu chứng chỉ (Tạo mới hoặc Cập nhật)
  const handleSaveCert = async (e) => {
    e.preventDefault();

    if (!formData.score || !String(formData.score).trim()) {
      alert('Vui lòng nhập điểm số đạt được của chứng chỉ.');
      return;
    }

    if (!formData.examDate) {
      alert('Vui lòng chọn ngày thi chứng chỉ.');
      return;
    }

    if (!formData.issueDate) {
      alert('Vui lòng chọn ngày cấp chứng chỉ.');
      return;
    }

    if (formData.issueDate < formData.examDate) {
      alert('Ngày cấp chứng chỉ không thể trước ngày thi. Vui lòng kiểm tra lại.');
      return;
    }

    const trimmedDriveLink = (formData.driveLink || '').trim();
    if (!trimmedDriveLink) {
      alert('Vui lòng dán liên kết Google Drive minh chứng chứng chỉ.');
      return;
    }

    if (!trimmedDriveLink.startsWith('http://') && !trimmedDriveLink.startsWith('https://')) {
      alert('Đường dẫn Google Drive không hợp lệ. Vui lòng nhập link bắt đầu bằng https://');
      return;
    }

    if (!formData.commitment) {
      alert('Vui lòng đánh dấu xác nhận cam đoan thông tin và minh chứng là chính xác trước khi lưu.');
      return;
    }

    const displayExamDate = formatDateForDisplay(formData.examDate);
    const displayIssueDate = formatDateForDisplay(formData.issueDate);

    setSaving(true);
    try {
      const certPayload = {
        type: 'Ngoại ngữ',
        name: formData.name,
        semester: activeSemester || 'hk1_2026_2027',
        score: String(formData.score).trim(),
        maxScore: '',
        level: formData.level || 'B1',
        examDate: displayExamDate,
        issueDate: displayIssueDate,
        driveLink: trimmedDriveLink,
        proofData: trimmedDriveLink,
        fileName: 'Google Drive Minh chứng',
        fileType: 'LINK',
        fileSize: 'Google Drive',
        commitmentConfirmed: 1,
        studentId: studentId.toUpperCase(),
        studentName,
        className: currentUser?.class || currentUser?.className || 'Khoa CNTT'
      };

      if (editingCert) {
        const updatedItem = {
          ...editingCert,
          ...certPayload,
          id: editingCert.id
        };
        if (window.ApiClient?.saveStudentCert) {
          await window.ApiClient.saveStudentCert(studentId, updatedItem);
        }
        setCerts(certs.map(c => c.id === editingCert.id ? updatedItem : c));
        setNotification({ type: 'success', text: `Đã cập nhật thành công chứng chỉ ${formData.name}.` });
      } else {
        const newCert = {
          id: 'cert_' + Date.now(),
          ...certPayload,
          createdAt: new Date().toISOString()
        };
        if (window.ApiClient?.saveStudentCert) {
          await window.ApiClient.saveStudentCert(studentId, newCert);
        }
        setCerts([newCert, ...certs]);
        setNotification({ type: 'success', text: `Đã thêm mới thành công chứng chỉ ${formData.name}.` });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Lỗi khi lưu chứng chỉ:', err);
      alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Thống kê nhanh cá nhân
  const totalCerts = certs.length;
  const bestCert = certs.length > 0 ? certs[0] : null;

  return (
    <div className="space-y-6 w-full pb-12">
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1f2937]">
            Chứng chỉ tiếng Anh của tôi
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Khai báo chứng chỉ mới</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-[#ebf3ff]  text-[#003087]  border border-[#bfdbfe]  text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span></span>
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[#003087] hover:text-[#003087]  font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Overview Card */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#003087] to-[#001f5c] text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-wider text-sky-200 uppercase">
              <span></span>
              <span>Chuẩn ngoại ngữ TDTU · Khóa 2022 trở đi</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">
              Sinh viên: {studentName} ({studentId})
            </h2>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/15 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-black text-white">
                {totalCerts}
              </div>
              <div className="text-xs text-white/90 font-bold">
                Chứng chỉ đã nộp
              </div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-black text-white">
                {bestCert?.level || '—'}
              </div>
              <div className="text-xs text-white/90 font-bold">
                Cấp độ cao nhất
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Danh sách Chứng chỉ của sinh viên (Hỗ trợ Full CRUD) */}
      <div className="bg-white  rounded-xl border border-[#e5e7eb]  shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#e5e7eb]  flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-[#1f2937]  flex items-center gap-2">
              <span>Hồ sơ chứng chỉ tiếng Anh đã nộp</span>
              <span className="px-2 py-0.5 rounded-full text-[11.5px] font-bold bg-[#ebf3ff]  text-[#003087] ">
                {certs.length} chứng chỉ
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-[#003087]  font-bold hover:underline cursor-pointer"
            >
              {showHistory ? ' Ẩn danh mục chuẩn' : '▼ Xem 5 chuẩn ngoại ngữ TDTU'}
            </button>
          </div>
        </div>

        {/* Bảng tra cứu 5 Chuẩn ngoại ngữ TDTU công nhận */}
        {showHistory && (
          <div className="p-4 bg-[#f8fafc]  border-b border-[#e5e7eb]  text-xs">
            <div className="font-bold text-[#1f2937]  mb-2">
              Danh mục 5 chứng chỉ tiếng Anh được TDTU công nhận:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {ENGLISH_CERTIFICATES.map(c => (
                <div key={c.key} className="p-3 bg-white  border border-[#e5e7eb]  rounded-xl space-y-1">
                  <span className={`px-2 py-0.5 rounded text-[11.5px] font-bold border inline-block ${c.color}`}>
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nội dung danh sách chứng chỉ */}
        {loading ? (
          <div className="p-12 text-center text-[#1f2937]">
            <div className="w-8 h-8 border-3 border-[#003087] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Đang tải hồ sơ chứng chỉ...</p>
          </div>
        ) : certs.length === 0 ? (
          <div className="p-12 text-center text-[#1f2937]">
            <div className="w-16 h-16 rounded-xl bg-[#ebf3ff]  text-[#003087]  flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
              
            </div>
            <h4 className="text-sm font-bold text-[#1f2937] ">
              Bạn chưa khai báo chứng chỉ tiếng Anh nào
            </h4>
            <p className="text-xs text-[#1f2937] max-w-md mx-auto mt-1 mb-4">
              Nhấn nút "Khai báo chứng chỉ mới" bên dưới để nộp chứng chỉ tiếng Anh (TOEIC, IELTS, TOEFL iBT, Aptis ESOL, Cambridge) xét chuẩn thực tập và tốt nghiệp.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              + Khai báo chứng chỉ ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1f2937] ">
              <thead className="bg-[#f8fafc]  text-[11px] font-bold uppercase text-[#1f2937]  border-b border-[#e5e7eb] ">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Tên chứng chỉ</th>
                  <th className="py-3 px-4 text-center">Điểm số</th>
                  <th className="py-3 px-4 text-center">Cấp độ CEFR</th>
                  <th className="py-3 px-4">Ngày thi</th>
                  <th className="py-3 px-4">Ngày cấp</th>
                  <th className="py-3 px-4">Minh chứng Google Drive</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  font-medium">
                {paginatedCerts.map((c, index) => {
                  const driveUrl = c.driveLink || c.proofData || '';
                  const hasDrive = driveUrl && (driveUrl.startsWith('http://') || driveUrl.startsWith('https://'));

                  const certConfig = ENGLISH_CERTIFICATES.find(ec => 
                    (c.name || '').toUpperCase().includes(ec.key) || 
                    ec.name.toUpperCase() === (c.name || '').toUpperCase()
                  );
                  const certColorClass = certConfig ? certConfig.color : 'bg-[#f8fafc] text-[#1f2937] border-[#e5e7eb]  ';

                  return (
                    <tr key={c.id || index} className="hover:bg-[#f8fafc]  transition">
                      
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center text-[#1f2937] font-mono text-[11px]">
                        {startIndex + index + 1}
                      </td>

                      {/* Tên chứng chỉ */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-block ${certColorClass}`}>
                          {c.name}
                        </span>
                      </td>

                      {/* Điểm số */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-sm font-black text-[#1f2937]  font-mono">
                          {c.score}
                        </span>
                      </td>

                      {/* Cấp độ CEFR */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#ebf3ff] text-[#003087]   border border-[#bfdbfe]  inline-block">
                          {c.level || 'B1'}
                        </span>
                      </td>

                      {/* Ngày thi */}
                      <td className="py-3.5 px-4 text-[#1f2937] text-xs font-mono">
                        {formatDateForDisplay(c.examDate)}
                      </td>

                      {/* Ngày cấp chứng chỉ */}
                      <td className="py-3.5 px-4 text-[#1f2937] text-xs font-mono">
                        {formatDateForDisplay(c.issueDate || c.examDate)}
                      </td>

                      {/* Minh chứng Google Drive */}
                      <td className="py-3.5 px-4">
                        {hasDrive ? (
                          <a
                            href={driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Mở Google Drive minh chứng trong tab mới"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                            </svg>
                            <span>Mở Google Drive</span>
                            <span className="text-[11px]">↗</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#1f2937] italic">Chưa có liên kết</span>
                        )}
                      </td>

                      {/* Thao tác CRUD (Sửa / Xóa) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            title="Chỉnh sửa thông tin chứng chỉ"
                            className="w-8 h-8 rounded-lg text-[#003087] hover:text-[#002266] bg-[#ebf3ff] hover:bg-[#dbeafe] border border-[#bfdbfe] flex items-center justify-center transition cursor-pointer shadow-2xs"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCert(c.id, c.name)}
                            title="Xóa chứng chỉ này"
                            className="w-8 h-8 rounded-lg text-[#dc2626] hover:text-[#b91c1c] bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fecaca] flex items-center justify-center transition cursor-pointer shadow-2xs"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

        {/* Table Footer with Pagination for Student */}
        {!loading && certs.length > 0 && (
          <div className="p-4 border-t border-[#e5e7eb]  flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#1f2937]">
            <div className="flex items-center gap-3">
              <span>
                Hiển thị <strong>{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> trên tổng số <strong>{totalItems}</strong> chứng chỉ
              </span>
              <span className="hidden sm:inline text-[#1f2937] ">|</span>
              <div className="flex items-center gap-1.5">
                <span>Mỗi trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded border border-[#e5e7eb]  bg-white  text-[#1f2937]  text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 rounded border border-[#e5e7eb]  disabled:opacity-40 hover:bg-[#f8fafc]  font-bold transition-colors"
                title="Trang đầu"
              >
                «
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-2.5 py-1 rounded border border-[#e5e7eb]  disabled:opacity-40 hover:bg-[#f8fafc]  font-bold transition-colors"
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
                    className={`min-w-[28px] px-2 py-1 rounded font-semibold text-xs transition-colors ${
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
                className="px-2.5 py-1 rounded border border-[#e5e7eb]  disabled:opacity-40 hover:bg-[#f8fafc]  font-bold transition-colors"
                title="Trang tiếp"
              >
                ›
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 rounded border border-[#e5e7eb]  disabled:opacity-40 hover:bg-[#f8fafc]  font-bold transition-colors"
                title="Trang cuối"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm mới / Chỉnh sửa Chứng chỉ tiếng Anh */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-5xl w-[94vw] border border-[#cbd5e1] shadow-2xl p-8 space-y-6 max-h-[94vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb] ">
              <div>
                <h3 className="text-base font-bold text-[#1f2937] ">
                  {editingCert ? 'Chỉnh sửa chứng chỉ tiếng Anh' : 'Khai báo chứng chỉ tiếng Anh'}
                </h3>
                <p className="text-xs text-[#1f2937]  mt-0.5">
                  MSSV: {studentId} — {studentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#1f2937] hover:text-[#1f2937]  text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCert} className="space-y-4 text-xs">
              
              {/* Chọn loại Chứng chỉ */}
              <div>
                <label className="block font-bold text-[#1f2937]  mb-1.5">
                  Chứng chỉ tiếng Anh <span className="text-[#dc2626]">*</span>
                </label>
                <select
                  value={formData.certKey}
                  onChange={(e) => handleSelectCert(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e5e7eb]  bg-white  font-semibold focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937] "
                >
                  {ENGLISH_CERTIFICATES.map(c => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2 Cột: Điểm đạt được & Cấp độ CEFR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Điểm đạt được */}
                <div>
                  <label className="block font-bold text-[#1f2937]  mb-1.5">
                    Điểm đạt được <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.score}
                    onChange={(e) => handleScoreChange(e.target.value)}
                    placeholder="VD: 650 (TOEIC), 6.5 (IELTS)..."
                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb]  bg-white  font-bold focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937] "
                  />
                  <span className="text-[10px] text-[#1f2937] block mt-0.5">Nhập điểm thi thực tế</span>
                </div>

                {/* Cấp độ CEFR (Tự động fill theo điểm, cho phép chỉnh nếu muốn) */}
                <div>
                  <label className="block font-bold text-[#1f2937]  mb-1.5 flex items-center justify-between">
                    <span>Cấp độ CEFR</span>
                    <span className="text-[10px] text-[#003087]  font-bold">Tự động tính</span>
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb]  bg-white  font-bold focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937] "
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                  <span className="text-[10px] text-[#1f2937] block mt-0.5">(Tự động điền theo điểm, có thể chỉnh lại nếu cần)</span>
                </div>

              </div>

              {/* Tách biệt 2 ô ngày riêng biệt: Ngày thi & Ngày cấp chứng chỉ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Ngày thi */}
                <div>
                  <label className="block font-bold text-[#1f2937]  mb-1.5">
                    Ngày thi <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb]  bg-white  font-medium focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937] "
                  />
                  <span className="text-[10px] text-[#1f2937] block mt-0.5">Ngày tham gia kỳ thi</span>
                </div>

                {/* Ngày cấp chứng chỉ */}
                <div>
                  <label className="block font-bold text-[#1f2937]  mb-1.5">
                    Ngày cấp chứng chỉ <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb]  bg-white  font-medium focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937] "
                  />
                  <span className="text-[10px] text-[#1f2937] block mt-0.5">Ngày in trên bằng/phiếu</span>
                </div>
              </div>

              {/* Nhập Link Google Drive Minh Chứng */}
              <div>
                <label className="block font-bold text-[#1f2937]  mb-1.5 flex items-center justify-between">
                  <span>Liên kết Google Drive minh chứng <span className="text-[#dc2626]">*</span></span>
                  {formData.driveLink && (formData.driveLink.startsWith('http://') || formData.driveLink.startsWith('https://')) && (
                    <a
                      href={formData.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#003087]  font-bold hover:underline inline-flex items-center gap-0.5 text-[11px]"
                    >
                      <span>Mở thử</span>
                      <span>↗</span>
                    </a>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#1f2937]">
                    
                  </span>
                  <input
                    type="url"
                    required
                    value={formData.driveLink}
                    onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                    placeholder="https://drive.google.com/file/d/... hoặc https://drive.google.com/..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#e5e7eb]  bg-white  font-mono text-xs focus:ring-2 focus:ring-[#003087] outline-none text-[#1f2937] "
                  />
                </div>
                <div className="text-[10.5px] text-[#1f2937]  mt-1.5 flex items-center gap-1">
                  <span></span>
                  <span>Bật quyền chia sẻ: <strong>"Bất kỳ ai có đường liên kết đều có thể xem"</strong>.</span>
                </div>
              </div>

              {/* Mục Cam kết bắt buộc của sinh viên */}
              <div className="p-3.5 bg-[#f8fafc]/70  border border-[#e5e7eb]  rounded-xl space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="cert-commitment-check"
                    required
                    checked={formData.commitment}
                    onChange={(e) => setFormData({ ...formData, commitment: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded border-[#e5e7eb] text-[#003087] focus:ring-[#003087] cursor-pointer shrink-0"
                  />
                  <label htmlFor="cert-commitment-check" className="text-xs text-[#1f2937]  font-medium leading-relaxed select-none cursor-pointer">
                    <strong className="text-[#1f2937]  font-bold">Cam kết của sinh viên: </strong> 
                    Tôi xin cam đoan toàn bộ thông tin và liên kết minh chứng chứng chỉ tiếng Anh cung cấp là chính xác, trung thực. Tôi xin hoàn toàn chịu trách nhiệm trước Nhà trường và Khoa CNTT nếu có bất kỳ sự sai lệch nào.
                  </label>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end pt-3 border-t border-[#e5e7eb]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 min-w-[110px] border border-[#e5e7eb] hover:bg-[#f8fafc] rounded-lg font-bold text-[12.5px] text-[#1f2937] cursor-pointer whitespace-nowrap"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.commitment}
                    className={`px-6 py-2.5 min-w-[160px] text-white rounded-lg font-bold text-[12.5px] shadow-sm transition cursor-pointer whitespace-nowrap ${
                      saving || !formData.commitment
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-[#003087] hover:bg-[#002266]'
                    }`}
                  >
                    {saving ? 'Đang lưu...' : (editingCert ? 'Cập nhật thay đổi' : 'Lưu chứng chỉ')}
                  </button>
                </div>
              </div>

            </form>

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

// =========================================================================
// ROUTER CHÍNH CỦA TRANG CHỨNG CHỈ (PHÂN QUYỀN RBAC DUAL-VIEW)
// =========================================================================
const CertificatesPage = ({ currentUser, activeSemester = 'hk1_2026_2027', onSemesterChange }) => {
  const isLecturerOrAdmin = currentUser?.role === 'lecturer' || Boolean(currentUser?.isAdmin) || currentUser?.role === 'admin';

  if (isLecturerOrAdmin) {
    return (
      <ScopeAllCertificatesView
        currentUser={currentUser}
        activeSemester={activeSemester}
        onSemesterChange={onSemesterChange}
      />
    );
  }

  return <StudentPersonalCertificatesView currentUser={currentUser} activeSemester={activeSemester} />;
};

window.CertificatesPage = CertificatesPage;
