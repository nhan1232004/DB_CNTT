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

  // Load real students from ApiClient or fallback
  React.useEffect(() => {
    setIsLoading(true);
    if (window.ApiClient && window.ApiClient.getLiveStudents) {
      window.ApiClient.getLiveStudents('hk1_2026_2027')
        .then(students => {
          if (students && students.length > 0) {
            const formatted = students.map((s, idx) => {
              const cStr = (s.course_str || (s.courses && s.courses.join(' ')) || '').toUpperCase();
              const isKTCN = cStr.includes('KTCN') || cStr.includes('KIẾN TẬP');
              const isTSNN = cStr.includes('TSNN') || cStr.includes('TẬP SỰ');
              const isDual = (isKTCN && isTSNN) || s.isDualCourse;
              
              let courseBadge = 'KTCN';
              if (isDual) courseBadge = 'KTCN + TSNN';
              else if (isTSNN) courseBadge = 'TSNN';

              return {
                id: s.id || s.mssv || `sv_${idx + 1}`,
                mssv: s.mssv || `522H00${String(idx + 1).padStart(2, '0')}`,
                name: s.name || s.hoten || `Sinh viên ${idx + 1}`,
                course: courseBadge,
                isDual: Boolean(isDual),
                company: s.company || s.companyName || (s.status === 'need_support' ? '— (Cần hỗ trợ)' : 'Chưa có nơi thực tập'),
                position: s.position || (s.status === 'need_support' ? 'Chưa xác định' : 'Chưa cập nhật'),
                taxCode: s.taxCode || '—',
                status: s.status === 'need_support' ? 'Cần Khoa hỗ trợ' : (s.status === 'interviewing' ? 'Đang tìm / Chờ PV' : (s.company ? 'Đã duyệt' : 'Đang tìm')),
                statusCode: s.status || 'seeking'
              };
            });
            setStudentsList(formatted);
            setSelectedIds(formatted.map((s: any) => s.id));
          } else {
            setStudentsList([]);
            setSelectedIds([]);
          }
        })
        .catch(() => {
          setStudentsList([]);
          setSelectedIds([]);
        })
        .finally(() => setIsLoading(false));
    } else {
      setStudentsList([]);
      setSelectedIds([]);
      setIsLoading(false);
    }
  }, []);

  const initSampleData = () => {
    setStudentsList([]);
    setSelectedIds([]);
  };

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

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.mssv.toLowerCase().includes(q) || s.company.toLowerCase().includes(q) || s.position.toLowerCase().includes(q);
  });

  // Xuất file Excel Báo cáo Tổng kết (Multi-sheet: Sheet KTCN, Sheet TSNN, Sheet Thống kê)
  const handleExportExcel = () => {
    try {
      const XLSX = (window as any).XLSX || (typeof XLSX !== 'undefined' ? XLSX : null);
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
        { 'Chỉ tiêu': 'Hồ sơ đã phê duyệt hợp lệ', 'Số lượng': targetList.filter(s => s.statusCode === 'approved').length },
        { 'Chỉ tiêu': 'Đang tìm / Chờ phỏng vấn', 'Số lượng': targetList.filter(s => s.statusCode === 'interviewing').length },
        { 'Chỉ tiêu': 'Cần Khoa hỗ trợ kết nối khẩn', 'Số lượng': targetList.filter(s => s.statusCode === 'need_support').length },
        { 'Chỉ tiêu': 'Thời gian xuất dữ liệu', 'Số lượng': new Date().toLocaleString('vi-VN') }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'ThongKe_TongKet');

      // Download file
      XLSX.writeFile(wb, `TDTU_BaoCao_ThucTap_HK1_2025_2026.xlsx`);

      setExportNotice({
        type: 'success',
        text: `✓ Đã xuất thành công file Excel gồm 3 sheets (DSSV_KTCN, DSSV_TSNN, ThongKe_TongKet) với ${targetList.length} sinh viên!`
      });
    } catch (err) {
      alert('Lỗi xuất file Excel: ' + err.message);
    }
  };

  // In Báo cáo Họp Khoa & Ra quyết định (PDF)
  const handlePrintReport = () => {
    setActiveReportMode('pdf_meeting');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const totalCount = studentsList.length;
  const approvedCount = studentsList.filter(s => s.statusCode === 'approved').length;
  const interviewingCount = studentsList.filter(s => s.statusCode === 'interviewing').length;
  const needSupportCount = studentsList.filter(s => s.statusCode === 'need_support').length;
  const dualCount = studentsList.filter(s => s.isDual).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Xuất Báo cáo Thực tập & Dữ liệu Tổng kết
          </h1>
        </div>
      </div>

      {/* Global Alert */}
      {exportNotice && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
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

      {/* Top 3 Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Excel Báo cáo Tổng kết */}
        <div
          onClick={handleExportExcel}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-800 shadow-sm ${
            activeReportMode === 'excel'
              ? 'border-emerald-600 ring-2 ring-emerald-100 dark:ring-emerald-900/40'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center">
              XLSX
            </span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <span>Tải file Excel</span>
              <span>↓</span>
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3">
            Báo cáo Tổng kết Thực tập (Excel)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multi-sheet: Sheet KTCN, Sheet TSNN, Sheet Thống kê
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Toàn bộ <strong>{totalCount}</strong> sinh viên</span>
            <span className="text-emerald-600 font-semibold">{selectedIds.length} đã chọn</span>
          </div>
        </div>

        {/* Card 2: PDF Báo cáo Họp Khoa & Ra quyết định */}
        <div
          onClick={handlePrintReport}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-800 shadow-sm ${
            activeReportMode === 'pdf_meeting'
              ? 'border-[#003087] ring-2 ring-blue-100 dark:ring-blue-900/40'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#003087] dark:text-sky-300 font-black text-xs flex items-center justify-center">
              PDF
            </span>
            <span className="text-[11px] font-bold text-[#003087] dark:text-sky-300 flex items-center gap-1">
              <span>In báo cáo</span>
              <span>⎙</span>
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3">
            Báo cáo Họp Khoa & Ra quyết định
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mẫu văn bản họp Ban Chủ nhiệm Khoa & BGH
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Đã duyệt: <strong className="text-emerald-600">{approvedCount}</strong></span>
            <span>Cần hỗ trợ: <strong className="text-rose-600">{needSupportCount}</strong></span>
          </div>
        </div>

        {/* Card 3: Thống kê & Phân bổ môn học */}
        <div
          onClick={() => {
            setCourseFilter('dual');
            setActiveReportMode('partner_data');
          }}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-800 shadow-sm ${
            activeReportMode === 'partner_data'
              ? 'border-purple-600 ring-2 ring-purple-100 dark:ring-purple-900/40'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center">
              DATA
            </span>
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
              Lọc song song →
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3">
            Thống kê Sinh viên Thực tập Song song
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Có tên trong cả 2 danh sách KTCN & TSNN
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tổng số: <strong>{dualCount}</strong> SV</span>
            <span>Khối lượng: <strong>320 giờ</strong></span>
          </div>
        </div>

      </div>

      {/* Main Split Section: Left Student Table (7 cols) | Right Decision Report Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Student Selection Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Dữ liệu sinh viên tổng kết học kỳ
              </h2>
              <div className="text-[11px] text-slate-400">
                HK1 2025–2026 · Tích chọn để xuất file Excel hoặc in báo cáo
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
              onClick={() => setCourseFilter('need_support')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                courseFilter === 'need_support'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              Cần hỗ trợ ({needSupportCount})
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
                  <th className="py-2.5 px-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      Đang tải danh sách sinh viên...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
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
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.statusCode === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : s.statusCode === 'interviewing'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
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

        {/* Right Column: Faculty Decision Report Preview (Official Letterhead) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bản xem trước Báo cáo Họp Khoa
              </h3>
              <span className="text-[10px] uppercase font-bold text-[#003087] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                Chuẩn TDTU · PDF Print
              </span>
            </div>

            {/* Official TDTU Letterhead Document Paper Preview */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-300 dark:border-slate-700 font-serif text-slate-900 dark:text-slate-100 space-y-4 shadow-inner text-xs">
              
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-slate-300 dark:border-slate-700 pb-3">
                <div className="font-bold uppercase tracking-wider text-[11px] text-[#003087] dark:text-sky-400">
                  TRƯỜNG ĐẠI HỌC TÔN ĐỨC THẮNG
                </div>
                <div className="font-bold uppercase text-[10px] text-slate-600 dark:text-slate-300">
                  KHOA CÔNG NGHỆ THÔNG TIN
                </div>
                <div className="w-16 h-0.5 bg-[#E31837] mx-auto my-1"></div>
                <div className="text-[10px] text-slate-500 italic">
                  Số: 2025/BC-CNTT-TT · TP. Hồ Chí Minh, ngày 12 tháng 09 năm 2025
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  BÁO CÁO TIẾN ĐỘ THỰC TẬP DOANH NGHIỆP
                </h4>
                <div className="text-[10px] italic text-slate-500 font-sans">
                  Học kỳ 1 · Năm học 2025–2026 (Môn KTCN & TSNN)
                </div>
              </div>

              {/* Section 1: KPI Metrics */}
              <div className="space-y-1.5 text-[11px] leading-relaxed font-sans">
                <div className="font-bold text-[#003087] dark:text-sky-300 uppercase text-[10px]">
                  1. Thống kê tổng quan số liệu:
                </div>
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
                  <div>• Tổng số sinh viên: <strong>{totalCount} SV</strong></div>
                  <div>• Đã có nơi thực tập: <strong className="text-emerald-600">{approvedCount} SV ({Math.round((approvedCount/totalCount)*100)}%)</strong></div>
                  <div>• Đang tìm / Chờ PV: <strong className="text-amber-600">{interviewingCount} SV</strong></div>
                  <div>• Cần Khoa hỗ trợ khẩn: <strong className="text-rose-600">{needSupportCount} SV</strong></div>
                  <div className="col-span-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                    • Môn học: <strong>KTCN (130) · TSNN (90) · Song song ({dualCount})</strong>
                  </div>
                </div>
              </div>

              {/* Section 2: Action items */}
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div className="font-bold text-[#003087] dark:text-sky-300 uppercase text-[10px] font-sans">
                  2. Đề xuất & Phương án chỉ đạo:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                  <li>
                    Phê duyệt danh sách {approvedCount} sinh viên đã hoàn thành khai báo và được thẩm định MST doanh nghiệp hợp lệ.
                  </li>
                  <li>
                    Phân công Trợ lý Doanh nghiệp kết nối phỏng vấn khẩn cho {needSupportCount} sinh viên thuộc nhóm cần hỗ trợ vào mạng lưới đối tác (FPT, TMA, KMS).
                  </li>
                  <li>
                    Đóng cổng khai báo đợt 1 vào ngày 30/09/2025 để tổng hợp hồ sơ chuyển sang giai đoạn thực tập chính thức.
                  </li>
                </ul>
              </div>

              {/* Signatures */}
              <div className="pt-4 flex justify-between items-end text-[10px] font-sans">
                <div className="text-center space-y-8">
                  <div>
                    <div className="font-bold">CÁN BỘ LẬP BÁO CÁO</div>
                    <div className="text-slate-400 text-[9px]">Điều phối thực tập Khoa</div>
                  </div>
                  <div className="font-bold text-[#003087] dark:text-sky-400">
                    ThS. Nguyễn Văn A
                  </div>
                </div>
                <div className="text-center space-y-8">
                  <div>
                    <div className="font-bold">TRƯỞNG BAN CHỦ NHIỆM KHOA</div>
                    <div className="text-slate-400 text-[9px]">Khoa Công nghệ Thông tin</div>
                  </div>
                  <div className="font-bold text-[#003087] dark:text-sky-400 uppercase">
                    TS. Phạm Văn C
                  </div>
                </div>
              </div>

            </div>

            {/* Print & Export Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handlePrintReport}
                className="w-full py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>In / Xuất Báo cáo Họp Khoa (PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Tải dữ liệu Excel đầy đủ ({selectedIds.length} SV)</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Footer Branding */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-4">
        © Khoa Công nghệ Thông tin · Trường Đại học Tôn Đức Thắng
      </div>

    </div>
  );
};

window.DocumentsPage = DocumentsPage;
