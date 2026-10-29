// Students List Page Component - Chuẩn hóa thiết kế theo Figma Frame 12 & Frame 13 (Student Tracking System)
// Tích hợp: Quick Filter Pills, Data Table có Checkbox, Avatar 2 chữ cái, Drawer Hồ sơ 3 Tab & Modal Import Excel Admin

const StudentsPage = ({ currentUser, activeSemester = 'hk1_2026_2027', onSemesterChange }) => {
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  // Filters theo Figma Frame 12
  const [search, setSearch] = React.useState('');
  const [majorFilter, setMajorFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('');
  const [quickFilter, setQuickFilter] = React.useState('all'); // 'all' | 'need_support' | 'no_company' | 'ktcn' | 'tsnn'

  // Selected Row IDs for Export
  const [selectedIds, setSelectedIds] = React.useState(['522H0001', '522H0002']);

  // Pagination
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Student Detail Modal (Figma Frame 13)
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [detailTab, setDetailTab] = React.useState('personal'); // 'personal' | 'company' | 'certs'
  const [internalNote, setInternalNote] = React.useState('');
  const [noteSaved, setNoteSaved] = React.useState(false);

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

  // Modal Import Excel cho Giảng viên Quản trị (Admin)
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importSemester, setImportSemester] = React.useState(activeSemester);
  const [importFileName, setImportFileName] = React.useState('');
  const [parsedRows, setParsedRows] = React.useState([]);
  const [importing, setImporting] = React.useState(false);
  const [importSuccess, setImportSuccess] = React.useState(null);

  const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.role === 'admin' || currentUser?.role === 'lecturer');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = { semester: activeSemester };
      if (search.trim()) params.search = search.trim();
      if (majorFilter) params.major = majorFilter;
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.class = classFilter;

      const res = await window.ApiClient.getStudents(params);
      let list = res.items || res.students || [];

      // Apply Quick Filter
      if (quickFilter === 'need_support') {
        list = list.filter(s => s.status === 'Chưa có doanh nghiệp' || s.status === 'seeking' || s.noCompanyOption === 'faculty');
      } else if (quickFilter === 'no_company') {
        list = list.filter(s => s.status === 'Chưa phản hồi' || s.status === 'Chưa có doanh nghiệp');
      } else if (quickFilter === 'ktcn') {
        list = list.filter(s => s.courseCode === 'KTCN' || s.courseName?.includes('Kiến tập'));
      } else if (quickFilter === 'tsnn') {
        list = list.filter(s => s.courseCode === 'TSNN' || s.courseName?.includes('Tập sự'));
      }

      setStudents(list);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStudents();
    setCurrentPage(1);
  }, [activeSemester, majorFilter, statusFilter, classFilter, quickFilter]);

  React.useEffect(() => {
    const handleRealtimeUpdate = () => {
      fetchStudents();
    };
    window.addEventListener('tdtu_data_updated', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('tdtu_data_updated', handleRealtimeUpdate);
    };
  }, [activeSemester]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
    setCurrentPage(1);
  };

  // Avatar initials helper
  const getInitials = (name = '') => {
    if (!name) return 'SV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Status Badge Renderer chuẩn Figma Frame 12 & Hình 2
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Đã có nơi':
      case 'Có doanh nghiệp':
      case 'has_company':
        return (
          <span className="bg-[#ECFDF5] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Đã có nơi</span>
          </span>
        );
      case 'Chờ phỏng vấn':
      case 'Đang chờ PV/KQPV':
      case 'interviewing':
        return (
          <span className="bg-[#FEF3C7] text-[#B45309] dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Chờ phỏng vấn</span>
          </span>
        );
      case 'Cần hỗ trợ':
      case 'need_faculty':
        return (
          <span className="bg-[#FFE4E6] text-[#BE123C] dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Cần hỗ trợ</span>
          </span>
        );
      case 'Đang tìm':
      case 'Chưa có doanh nghiệp':
      case 'seeking':
      default:
        return (
          <span className="bg-[#FEF9C3] text-[#A16207] dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            <span>Đang tìm</span>
          </span>
        );
    }
  };

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map(s => s.studentId || s.id));
    }
  };

  // Pagination calculation
  const totalItems = students.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = students.slice(startIndex, startIndex + pageSize);

  // Import Excel Handler - Hỗ trợ đọc cả 2 sheet: 1 bên KTCN, 1 bên TSNN
  const [importSummary, setImportSummary] = React.useState(null);

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

        const studentMap = {}; // mssv -> merged student object
        let ktcnCount = 0;
        let tsnnCount = 0;

        wb.SheetNames.forEach((sName, sIdx) => {
          const ws = wb.Sheets[sName];
          const rawData = XLSX.utils.sheet_to_json(ws);
          const lowerName = sName.toLowerCase();

          // Phân định môn học mặc định theo tên sheet
          let defaultSheetCourse = 'KTCN';
          if (lowerName.includes('tsnn') || lowerName.includes('tập sự') || lowerName.includes('tap su')) {
            defaultSheetCourse = 'TSNN';
          } else if (lowerName.includes('ktcn') || lowerName.includes('kiến tập') || lowerName.includes('kien tap')) {
            defaultSheetCourse = 'KTCN';
          } else {
            defaultSheetCourse = sIdx === 1 ? 'KTCN' : 'TSNN';
          }

          rawData.forEach((row, rIdx) => {
            // 1. Nhận diện chính xác Mã số sinh viên từ các cột file TDTU
            const mssvRaw = row['Mã số'] || row['Mã số SV'] || row['Mã SV'] || row['Mã sinh viên'] || row.mssv || row.MSSV || row.studentId || row['Mã'] || '';
            const mssv = String(mssvRaw).trim();
            if (!mssv || mssv === 'Mã số' || mssv === 'MSSV' || mssv.toLowerCase().startsWith('stt') || mssv.toLowerCase().startsWith('số lượng')) return;

            // 2. Nhận diện Họ và Tên (Ghép Họ lót + Tên theo chuẩn TDTU hoặc đọc cột Họ và tên)
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

            // 3. Nhận diện Lớp và Chuyên ngành
            const className = String(row['Lớp'] || row.class || row['Lớp sinh hoạt'] || '20050401').trim();
            let major = String(row['Ngành'] || row.major || '').trim();
            if (!major) {
              if (className.includes('501')) major = 'Khoa học máy tính';
              else if (className.includes('502')) major = 'Kỹ thuật phần mềm';
              else if (className.includes('503')) major = 'Mạng máy tính và truyền thông dữ liệu';
              else if (className.includes('504')) major = 'Hệ thống thông tin';
              else major = 'Khoa học máy tính';
            }

            // 4. Nhận diện Năm học
            let year = 'Năm 4';
            if (className.startsWith('19') || className.startsWith('18')) year = 'Năm 5 / Chuẩn bị tốt nghiệp';
            else if (className.startsWith('20') || className.startsWith('21')) year = 'Năm 4';
            else if (className.startsWith('22')) year = 'Năm 3';

            // 5. Nhận diện Môn học theo cột 'Tên MH' của hàng hoặc Sheet
            const tenMH = String(row['Tên MH'] || row['Môn học'] || row['Học phần'] || '').toLowerCase();
            let rowCourse = defaultSheetCourse;
            if (tenMH.includes('dự án') || tenMH.includes('tập sự') || tenMH.includes('tsnn')) {
              rowCourse = 'TSNN';
            } else if (tenMH.includes('kiến tập') || tenMH.includes('ktcn')) {
              rowCourse = 'KTCN';
            }

            // 6. Nhận diện GPA & Xếp loại học lực
            const gpa4Raw = row['GPA (Hệ 4)'] || row.gpa4 || row.gpa || row.GPA || row['Điểm TB'];
            const gpa4Val = parseFloat(gpa4Raw);
            const finalGpa4 = isNaN(gpa4Val) ? 3.0 : gpa4Val;

            const gpa10Raw = row['GPA (Hệ 10)'] || row.gpa10;
            const gpa10Val = parseFloat(gpa10Raw);
            const finalGpa10 = isNaN(gpa10Val) ? 0 : gpa10Val;

            const academicRank = String(row['Xếp loại'] || row.academicRank || (finalGpa4 >= 3.6 ? 'Xuất sắc' : (finalGpa4 >= 3.2 ? 'Giỏi' : (finalGpa4 >= 2.5 ? 'Khá' : 'Trung bình')))).trim();

            // 7. Nhận diện Ngày sinh, Nơi sinh, Phái
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
            const gender = String(row['Phái'] || row.gender || row['Giới tính'] || 'Nam').trim();
            const subjectCode = String(row['Mã MH'] || row.subjectCode || '').trim();
            const subjectName = String(row['Tên MH'] || row.subjectName || '').trim();
            const group = String(row['Nhóm'] || row.group || '01').trim();
            const campus = String(row['Cơ sở'] || row.campus || 'TP. Hồ Chí Minh').trim();
            const phone = String(row.phone || row['Số điện thoại'] || row['Điện thoại'] || '0910000000').trim();

            if (!studentMap[mssv]) {
              studentMap[mssv] = {
                stt: Object.keys(studentMap).length + 1,
                mssv,
                studentId: mssv,
                name: fullName,
                fullName,
                class: className,
                major,
                year,
                gpa: finalGpa4,
                gpa4: finalGpa4,
                gpa10: finalGpa10,
                academicRank,
                birthDate: birthDateStr,
                birthPlace,
                gender,
                subjectCode,
                subjectName,
                group,
                campus,
                phone,
                courses: [rowCourse],
                courseCode: rowCourse,
                courseName: rowCourse === 'KTCN' ? 'Kiến tập Công nghiệp' : 'Tập sự Nghề nghiệp',
                isDualCourse: 0,
                status: 'Chưa có doanh nghiệp',
                company: 'Chưa có',
                updated: new Date().toLocaleDateString('vi-VN')
              };
              if (rowCourse === 'KTCN') ktcnCount++;
              if (rowCourse === 'TSNN') tsnnCount++;
            } else {
              // Sinh viên xuất hiện ở cả 2 sheet -> Đăng ký cả 2 môn song song!
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
      const res = await window.ApiClient.importStudentsExcel(importSemester, parsedRows);
      setImportSuccess(`Đã import thành công ${res?.importedCount || parsedRows.length} sinh viên vào ${importSemester}!`);
      setTimeout(() => {
        setImportModalOpen(false);
        setImportSuccess(null);
        setParsedRows([]);
        setImportFileName('');
        fetchStudents();
      }, 1500);
    } catch (err) {
      alert('Lỗi import: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header & Actions matching Figma Frame 12 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Danh sách sinh viên
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (!filteredStudents || filteredStudents.length === 0) {
                alert('Chưa có danh sách sinh viên để xuất Excel. Vui lòng nhập danh sách trước.');
                return;
              }
              window.ApiClient.exportStudentsExcel(filteredStudents, activeSemester);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            title="Xuất bảng sinh viên hiện tại ra file Excel (.xlsx)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Xuất danh sách Excel</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <svg className="w-4 h-4 text-blue-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Nhập danh sách Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Quick Filter Pills matching Dashoard_TSNN-frontend_qvinh template */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setQuickFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            quickFilter === 'all'
              ? 'bg-[#ebf3ff] text-[#003087] border-[#bfdbfe] dark:bg-blue-950 dark:text-sky-300 dark:border-blue-800 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-[#64748b] dark:text-slate-300 border-[#e2e8f0] dark:border-slate-700 hover:bg-[#f8fafc]'
          }`}
        >
          Tất cả sinh viên ({totalItems})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'need_support' ? 'all' : 'need_support')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            quickFilter === 'need_support'
              ? 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca] dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 shadow-xs ring-1 ring-rose-400'
              : 'bg-[#fef2f2]/60 text-[#dc2626] border-[#fecaca]/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 hover:bg-[#fef2f2]'
          }`}
        >
          Cần hỗ trợ
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'no_company' ? 'all' : 'no_company')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            quickFilter === 'no_company'
              ? 'bg-[#fffbeb] text-[#d97706] border-[#fde68a] dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 shadow-xs ring-1 ring-amber-400'
              : 'bg-[#fffbeb]/60 text-[#d97706] border-[#fde68a]/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-[#fffbeb]'
          }`}
        >
          Đang tìm / Chờ PV
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'ktcn' ? 'all' : 'ktcn')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            quickFilter === 'ktcn'
              ? 'bg-[#ebf3ff] text-[#003087] border-[#bfdbfe] dark:bg-blue-950 dark:text-sky-300 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-[#64748b] dark:text-slate-300 border-[#e2e8f0] dark:border-slate-700 hover:bg-[#f8fafc]'
          }`}
        >
          KTCN
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'tsnn' ? 'all' : 'tsnn')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            quickFilter === 'tsnn'
              ? 'bg-[#ebf3ff] text-[#003087] border-[#bfdbfe] dark:bg-blue-950 dark:text-sky-300 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-[#64748b] dark:text-slate-300 border-[#e2e8f0] dark:border-slate-700 hover:bg-[#f8fafc]'
          }`}
        >
          TSNN
        </button>
      </div>

      {/* 3. Main Data Card matching Figma Frame 12 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo MSSV, họ tên hoặc doanh nghiệp..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="Có doanh nghiệp">Đã có nơi</option>
              <option value="Đang chờ PV/KQPV">Chờ phỏng vấn</option>
              <option value="Cần hỗ trợ">Cần hỗ trợ</option>
              <option value="Chưa có doanh nghiệp">Đang tìm</option>
            </select>

            <select
              value={activeSemester}
              onChange={e => onSemesterChange(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="hk1_2026_2027">HK1 2026–2027</option>
              <option value="hk2_2025_2026">HK2 2025–2026</option>
              <option value="hk1_2025_2026">HK1 2025–2026</option>
            </select>

            {selectedIds.length > 0 && (
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                Đã chọn {selectedIds.length} hồ sơ
              </span>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={paginatedStudents.length > 0 && selectedIds.length === paginatedStudents.length}
                    onChange={handleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3">MSSV ⇅</th>
                <th className="py-3 px-3">HỌ VÀ TÊN ⇅</th>
                <th className="py-3 px-3">MÔN HỌC</th>
                <th className="py-3 px-3">TRẠNG THÁI</th>
                <th className="py-3 px-3">DOANH NGHIỆP</th>
                <th className="py-3 px-3">NGÀY CẬP NHẬT</th>
                <th className="py-3 px-3 text-right">CHI TIẾT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Không tìm thấy sinh viên nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((sv, idx) => {
                  const id = sv.studentId || sv.id || `SV_${idx}`;
                  const isChecked = selectedIds.includes(id);
                  const initials = getInitials(sv.name);

                  return (
                    <tr 
                      key={id}
                      className={`hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition ${
                        isChecked ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {sv.studentId || '522H0001'}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-200 dark:border-slate-600">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{sv.name}</div>
                            <div className="text-[10px] text-slate-400">{sv.className || sv.major || 'KTPM22A'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {sv.courseCode || 'KTCN'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {renderStatusBadge(sv.status || (sv.companyName ? 'Có doanh nghiệp' : 'Cần hỗ trợ'))}
                      </td>

                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {sv.companyName || sv.assignedCompany || '—'}
                      </td>

                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {sv.updatedAt || '22/09/2026'}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => { setSelectedStudent(sv); setDetailTab('personal'); setInternalNote(sv.lecturerNote || ''); }}
                          className="px-2.5 py-1 text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          <span>Xem</span>
                          <span>→</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination matching Figma Frame 12 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Hiển thị <strong>{startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)}</strong> / {totalItems} sinh viên
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              ‹
            </button>
            <span className="font-bold text-slate-800 dark:text-white px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>

      </div>

      {/* 4. Student Detail Modal matching Figma Frame 13 */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up max-h-[90vh] flex flex-col justify-between">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Hồ sơ sinh viên</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  HK1 2026–2027 · Cập nhật gần nhất lúc {selectedStudent.updatedAt || '11/09/2026, 15:20'}
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Profile Avatar Bar */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0052CC] font-black text-sm flex items-center justify-center border border-blue-200">
                  {getInitials(selectedStudent.name)}
                </div>
                <div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {selectedStudent.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedStudent.studentId} · Lớp {selectedStudent.className || '220H01'} · Khoa CNTT
                  </div>
                </div>
              </div>

              <div>
                {renderStatusBadge(selectedStudent.status || (selectedStudent.companyName ? 'Có doanh nghiệp' : 'Cần hỗ trợ'))}
              </div>
            </div>

            {/* Modal Tabs matching Figma Frame 13 */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold px-5 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setDetailTab('personal')}
                className={`py-3 border-b-2 transition mr-6 ${
                  detailTab === 'personal'
                    ? 'border-blue-600 text-blue-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Cá nhân & Học tập
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('company')}
                className={`py-3 border-b-2 transition mr-6 ${
                  detailTab === 'company'
                    ? 'border-blue-600 text-blue-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Doanh nghiệp & Tiến độ
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('certs')}
                className={`py-3 border-b-2 transition ${
                  detailTab === 'certs'
                    ? 'border-blue-600 text-blue-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Chứng chỉ (3)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {detailTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 font-medium">Mã số sinh viên:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.studentId || selectedStudent.mssv}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Email sinh viên:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{(selectedStudent.studentId || selectedStudent.mssv || '').toLowerCase()}@student.tdtu.edu.vn</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Ngành đào tạo:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.major || 'Kỹ thuật phần mềm'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Lớp sinh hoạt:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.class || selectedStudent.className || '19050402'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Ngày sinh / Nơi sinh:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.birthDate || '18/11/2001'} {selectedStudent.birthPlace ? `· ${selectedStudent.birthPlace}` : ''}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Môn học đăng ký:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.courseName || selectedStudent.courses?.join(', ') || 'KTCN & TSNN'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900">
                      <div className="text-xl font-black text-blue-700 dark:text-sky-300">
                        {selectedStudent.gpa4 || selectedStudent.gpa || '3.13'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">GPA Hệ 4</div>
                    </div>
                    <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900">
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                        {selectedStudent.gpa10 || '7.82'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">GPA Hệ 10</div>
                    </div>
                    <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900">
                      <div className="text-base font-black text-amber-700 dark:text-amber-300">
                        {selectedStudent.academicRank || 'Khá'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">Xếp loại học lực</div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'company' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Tên công ty:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedStudent.companyName || selectedStudent.assignedCompany || 'Chưa khai báo'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Mã số thuế:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.taxCode || '0312345678'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Vị trí thực tập:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Thực tập sinh Lập trình Web</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                      Ghi chú nội bộ Giảng viên phụ trách:
                    </label>
                    <textarea
                      value={internalNote}
                      onChange={e => setInternalNote(e.target.value)}
                      placeholder="Nhập ghi chú hỗ trợ, liên hệ hoặc tình trạng phỏng vấn của sinh viên..."
                      rows="3"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                    ></textarea>
                    {noteSaved && (
                      <div className="text-emerald-600 font-bold text-[11px] mt-1">✓ Đã lưu ghi chú nội bộ</div>
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'certs' && (
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">TOEIC 825 / 990</div>
                      <div className="text-[11px] text-slate-400">Cấp độ B2 · Ngày thi: 18/05/2025 · TOEIC.pdf</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      Hợp lệ
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">MOS Excel 2019: 920 / 1000</div>
                      <div className="text-[11px] text-slate-400">Associate · Ngày thi: 23/03/2025 · MOS.pdf</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      Hợp lệ
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleSaveInternalNote}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Lưu ghi chú
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Import Excel (Dành cho Admin) */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                Import Danh Sách Sinh Viên Mỗi Kỳ (.xlsx)
              </h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn học kỳ import dữ liệu:
                </label>
                <select
                  value={importSemester}
                  onChange={e => setImportSemester(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="hk1_2026_2027">HK1 2026–2027</option>
                  <option value="hk2_2025_2026">HK2 2025–2026</option>
                  <option value="hk1_2025_2026">HK1 2025–2026</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn tệp Excel từ máy tính (.xlsx, .xls, .csv):
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {importSummary ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>✓ Đã phân tích tự động 2 Sheet ({importSummary.sheets.join(', ')}):</span>
                  </div>
                  <div className="text-[11px] space-y-0.5 pt-0.5">
                    <div>• Tổng số sinh viên duy nhất: <strong>{importSummary.totalUnique}</strong></div>
                    <div>• Danh sách môn KTCN: <strong>{importSummary.ktcnCount}</strong> lượt sinh viên</div>
                    <div>• Danh sách môn TSNN: <strong>{importSummary.tsnnCount}</strong> lượt sinh viên</div>
                    <div>• Sinh viên học 2 môn song song: <strong className="text-blue-700 dark:text-sky-300">{importSummary.dualCount}</strong> (tự động tích cả 2 môn)</div>
                  </div>
                </div>
              ) : parsedRows.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold">
                  ✓ Đã nhận diện {parsedRows.length} dòng dữ liệu từ {importFileName}.
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl font-bold">
                  {importSuccess}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || importing}
                onClick={handleExecuteImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
              >
                {importing ? 'Đang import...' : 'Bắt đầu Cập nhật Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

window.StudentsPage = StudentsPage;
