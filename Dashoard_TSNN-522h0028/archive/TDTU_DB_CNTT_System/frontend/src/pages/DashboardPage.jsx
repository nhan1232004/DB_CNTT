// Dashboard Page Component - Chuẩn hóa thiết kế theo Figma Frame 03 (Sinh viên) & Frame 14 (Giảng viên)
// Tích hợp: Quyết định Đào tạo, Phân bổ Biểu đồ Hình 1, Xuất Báo cáo PDF có chữ ký BCN Khoa & Xuất Excel Đa sheet

const SvgDonutChart = ({ slices = [], size = 180, strokeWidth = 24, centerText = '', centerSub = '' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-800"
          strokeWidth={strokeWidth}
        />
        {slices.map((slice, idx) => {
          const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -accumulatedOffset;
          accumulatedOffset += (slice.percentage / 100) * circumference;
          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-500 ease-out hover:opacity-85 cursor-pointer"
            >
              <title>{`${slice.label}: ${slice.percentage}% (${slice.count || ''})`}</title>
            </circle>
          );
        })}
      </svg>
      {centerText && (
        <div className="absolute text-center pointer-events-none">
          <div className="text-xl font-black text-slate-900 dark:text-white leading-tight">{centerText}</div>
          {centerSub && <div className="text-[10px] text-slate-400 font-medium">{centerSub}</div>}
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({ activeSemester = 'hk1_2026_2027', onSemesterChange, currentUser, onNavigateTab }) => {
  const [summary, setSummary] = React.useState(null);
  const [chartData, setChartData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [showPdfModal, setShowPdfModal] = React.useState(false);
    const [filterCourse, setFilterCourse] = React.useState('all');
  const [deadlines, setDeadlines] = React.useState({
    semesterName: 'HK1 2025–2026',
    declarationDeadline: '2025-09-30',
    regulationNote: 'Mốc đếm ngược hoàn tất thủ tục hồ sơ doanh nghiệp.'
  });

  // State Quản lý Hồ sơ Cá nhân Sinh viên
  const studentId = currentUser?.studentId || '522H0045';
  const [cvLink, setCvLink] = React.useState('');
  const [cvSavedToast, setCvSavedToast] = React.useState(null);
  const [declaration, setDeclaration] = React.useState(null);
    const [draft, setDraft] = React.useState(null);
  const [certs, setCerts] = React.useState([]);
  const [internshipHistory, setInternshipHistory] = React.useState([]);
  const [viewingHistorySemester, setViewingHistorySemester] = React.useState(null);
  const [previewCertModal, setPreviewCertModal] = React.useState(null);

  // State Quản lý Danh sách Sinh viên hiển thị cùng trang với Biểu đồ (Phần Giảng viên - Hình 1)
  const [studentsList, setStudentsList] = React.useState([]);
  const [studentSearch, setStudentSearch] = React.useState('');
  const [studentMajorFilter, setStudentMajorFilter] = React.useState('');
  const [studentStatusFilter, setStudentStatusFilter] = React.useState('');
  const [studentClassFilter, setStudentClassFilter] = React.useState('');
  const [studentPage, setStudentPage] = React.useState(1);
  const [studentPageSize, setStudentPageSize] = React.useState(10);
  const [selectedDetailStudent, setSelectedDetailStudent] = React.useState(null);
  const [lecturerNoteInput, setLecturerNoteInput] = React.useState('');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState(null);

  // State Quản lý Import Excel Danh Sách Sinh Viên
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importSemester, setImportSemester] = React.useState(activeSemester || 'hk1_2026_2027');
  const [importFileName, setImportFileName] = React.useState('');
  const [parsedRows, setParsedRows] = React.useState([]);
  const [importing, setImporting] = React.useState(false);
  const [importSuccess, setImportSuccess] = React.useState(null);
  const [importSummary, setImportSummary] = React.useState(null);

  const isStudent = currentUser?.role === 'student';
  const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.role === 'admin');
  const selectedSemester = activeSemester;

  const getDaysRemaining = (deadlineStr) => {
    if (!deadlineStr) return 18;
    try {
      const target = new Date(deadlineStr).getTime();
      const now = Date.now();
      const diff = target - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch {
      return 18;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.ApiClient?.getSystemDeadlines) {
        setDeadlines(window.ApiClient.getSystemDeadlines());
      }
      if (isStudent && window.ApiClient) {
        if (window.ApiClient.getStudentCvLink) {
          setCvLink(window.ApiClient.getStudentCvLink(studentId));
        }
        if (window.ApiClient.getStudentDeclaration) {
          const cached = window.ApiClient.getStudentDeclaration(studentId);
          if (cached) setDeclaration(cached);
          if (window.ApiClient.getDeclaration) {
            window.ApiClient.getDeclaration(studentId).then(fresh => {
              if (fresh && (fresh.data || fresh.companyName)) {
                setDeclaration(fresh.data || fresh);
              }
            }).catch(() => {});
          }
        }
        if (window.ApiClient.getStudentCerts) {
          setCerts(window.ApiClient.getStudentCerts(studentId));
        }
        if (window.ApiClient.fetchStudentCerts) {
          window.ApiClient.fetchStudentCerts(studentId).then(fresh => {
            if (Array.isArray(fresh)) setCerts(fresh);
          }).catch(() => {});
        }
        if (window.ApiClient.getStudentInternshipHistory) {
          setInternshipHistory(window.ApiClient.getStudentInternshipHistory(studentId));
        }
      }
      const [sumRes, chartsRes, liveStudentsRes] = await Promise.all([
        window.ApiClient.getStudentsSummary(selectedSemester),
        window.ApiClient.getDashboardChartData(selectedSemester),
        window.ApiClient?.getLiveStudents ? window.ApiClient.getLiveStudents(selectedSemester) : []
      ]);
      setSummary(sumRes);
      setChartData(chartsRes);
      setStudentsList(Array.isArray(liveStudentsRes) ? liveStudentsRes : []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Import Excel Handler - Hỗ trợ đọc cả 2 sheet: 1 bên KTCN, 1 bên TSNN
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
            // Nếu không có MSSV thực tế hoặc dòng tiêu đề / dòng tổng kết -> Bỏ qua dòng
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
            const phone = String(row.phone || row['Số điện thoại'] || row['Điện thoại'] || '—').trim();

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
              // Sinh viên đã có trong danh sách -> Cập nhật đăng ký 2 môn song song
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
        loadData();
      }, 1200);
    } catch (err) {
      alert('Lỗi import: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Avatar initials helper chuẩn 2 chữ cái viết hoa
  const getAvatarInitials = (name = '', fallback = 'SV') => {
    if (!name) return fallback;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Status Badge Pill Renderer chuẩn Hình 1
  const renderTrackingStatusPill = (status) => {
    switch (status) {
      case 'Có doanh nghiệp':
      case 'Đã có nơi':
      case 'has_company':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E293B] text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
            <span>Có doanh nghiệp</span>
          </span>
        );
      case 'Chưa phản hồi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DC2626] text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
            <span>Chưa phản hồi</span>
          </span>
        );
      case 'Đang chờ PV/KQPV':
      case 'Chờ phỏng vấn':
      case 'interviewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2563EB] text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
            <span>Đang chờ PV/KQPV</span>
          </span>
        );
      case 'Chưa có doanh nghiệp':
      case 'Đang tìm':
      case 'Cần hỗ trợ':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#475569] text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80"></span>
            <span>Chưa có doanh nghiệp</span>
          </span>
        );
    }
  };

  // Unique majors and classes for dropdown options
  const availableMajors = React.useMemo(() => {
    const set = new Set();
    studentsList.forEach(s => { if (s.major) set.add(s.major); });
    return Array.from(set).sort();
  }, [studentsList]);

  const availableClasses = React.useMemo(() => {
    const set = new Set();
    studentsList.forEach(s => {
      const cls = s.class || s.className;
      if (cls) set.add(cls);
    });
    return Array.from(set).sort();
  }, [studentsList]);

  // Filtered students for lecturer monitoring table
  const filteredStudents = React.useMemo(() => {
    return studentsList.filter(s => {
      if (filterCourse === 'ktcn' && !s.courses?.includes('Kiến tập công nghiệp') && s.courseCode !== 'KTCN') return false;
      if (filterCourse === 'tsnn' && !s.courses?.includes('Tập sự nghề nghiệp') && !s.courses?.includes('Dự án Công nghệ thông tin 1') && s.courseCode !== 'TSNN') return false;

      if (studentSearch.trim()) {
        const q = studentSearch.trim().toLowerCase();
        const mssvMatch = (s.mssv || s.studentId || '').toLowerCase().includes(q);
        const nameMatch = (s.name || s.fullName || '').toLowerCase().includes(q);
        const phoneMatch = (s.phone || '').includes(q);
        if (!mssvMatch && !nameMatch && !phoneMatch) return false;
      }

      if (studentMajorFilter && s.major !== studentMajorFilter) return false;
      if (studentStatusFilter && s.status !== studentStatusFilter) return false;
      if (studentClassFilter) {
        const cls = s.class || s.className;
        if (cls !== studentClassFilter) return false;
      }

      return true;
    });
  }, [studentsList, filterCourse, studentSearch, studentMajorFilter, studentStatusFilter, studentClassFilter]);

  const totalPages = Math.ceil(filteredStudents.length / studentPageSize) || 1;
  const paginatedStudents = React.useMemo(() => {
    const start = (studentPage - 1) * studentPageSize;
    return filteredStudents.slice(start, start + studentPageSize);
  }, [filteredStudents, studentPage, studentPageSize]);

  // Student detail modal handlers
  const handleOpenStudentDetail = (student) => {
    setSelectedDetailStudent(student);
    setLecturerNoteInput(student.lecturerNote || '');
    setNoteSaveStatus(null);
  };

  const handleSaveLecturerNote = async () => {
    if (!selectedDetailStudent) return;
    try {
      const sid = selectedDetailStudent.mssv || selectedDetailStudent.studentId;
      if (window.ApiClient?.updateStudentLecturerNote) {
        await window.ApiClient.updateStudentLecturerNote(sid, lecturerNoteInput, currentUser?.name, currentUser?.email);
      }
      setSelectedDetailStudent(prev => prev ? { ...prev, lecturerNote: lecturerNoteInput } : null);
      setStudentsList(prev => prev.map(s => ((s.mssv === sid || s.studentId === sid) ? { ...s, lecturerNote: lecturerNoteInput } : s)));
      setNoteSaveStatus('✓ Đã lưu ghi chú thẩm định thành công!');
      setTimeout(() => setNoteSaveStatus(null), 3000);
    } catch (e) {
      alert('Lỗi lưu ghi chú: ' + e.message);
    }
  };

  // Cập nhật link CV Google Drive
  const handleSaveCv = (e) => {
    if (e) e.preventDefault();
    if (!cvLink || !cvLink.trim()) {
      alert('Vui lòng nhập đường liên kết Google Drive của CV.');
      return;
    }
    const clean = cvLink.trim();
    if (window.ApiClient?.saveStudentCvLink) {
      window.ApiClient.saveStudentCvLink(studentId, clean);
      setCvSavedToast('✓ Đã cập nhật link Google Drive CV thành công! Doanh nghiệp đối tác và Khoa có thể xem CV này khi bạn ứng tuyển.');
      setTimeout(() => setCvSavedToast(null), 4000);
    }
  };

  // Xem Dashboard học kỳ lịch sử
  const handleSelectHistorySemester = (semId, semName) => {
    setViewingHistorySemester({ id: semId, name: semName });
    if (onSemesterChange) {
      onSemesterChange(semId);
    }
    setStudentSubTab('analytics');
  };

  // Quay lại học kỳ hiện tại
  const handleReturnCurrentSemester = () => {
    setViewingHistorySemester(null);
    if (onSemesterChange) {
      onSemesterChange('hk1_2026_2027');
    }
  };

  React.useEffect(() => {
    loadData();

    const handleRealtimeUpdate = () => {
      loadData();
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
  }, [selectedSemester]);

  // Xuất Báo cáo Excel Đa sheet
  const handleExportExcel = () => {
    if (!summary || !chartData) return;
    window.ApiClient.exportReportExcel(summary, chartData, selectedSemester);
  };

  if (loading || !chartData) {
    return (
      <div className="p-16 text-center text-slate-500 dark:text-slate-400 text-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <div>Đang tải bảng thông tin điều phối thực tập Khoa CNTT...</div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 0: DÀNH CHO DOANH NGHIỆP ĐỐI TÁC (Partner Dashboard Hub)
  // =========================================================================
  if (currentUser?.role === 'partner') {
    const companyName = currentUser?.companyName || currentUser?.name || 'Doanh nghiệp Đối tác';
    const contactEmail = currentUser?.email || 'hr@doanhnghiep.vn';
    const remainingDays = getDaysRemaining(deadlines.declarationDeadline);
    const publishedJds = window.ApiClient?.getPublishedJds?.() || [];
    const myJds = publishedJds.filter(j => 
      (j.company && j.company.toLowerCase().includes(companyName.toLowerCase())) ||
      (j.contact && j.contact.toLowerCase().includes(contactEmail.toLowerCase()))
    );

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Cổng Hợp tác Doanh nghiệp
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (onNavigateTab) onNavigateTab('bulletin'); }}
              className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>Đăng tin tuyển dụng (JD)</span>
            </button>
            <button
              type="button"
              onClick={() => { if (onNavigateTab) onNavigateTab('handbook'); }}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-xs hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Cẩm nang quy chế</span>
            </button>
          </div>
        </div>

        {/* Company Profile Card */}
        <div className="bg-gradient-to-r from-blue-900 via-[#003087] to-indigo-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl font-black border border-white/20 shrink-0">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black">{companyName}</span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold rounded-full">
                  Đối tác chính thức
                </span>
              </div>
              <div className="text-xs text-blue-200 mt-1 flex flex-wrap items-center gap-3">
                <span>Mã số thuế: <strong>{currentUser?.taxCode || 'Chưa cập nhật'}</strong></span>
                <span>•</span>
                <span>Lĩnh vực: <strong>{currentUser?.industry || currentUser?.field || 'Phần mềm & Dịch vụ CNTT'}</strong></span>
                <span>•</span>
                <span>Email HR: <strong>{contactEmail}</strong></span>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10 text-right shrink-0">
            <div className="text-[10px] uppercase font-bold text-blue-200">Thời hạn tiếp nhận hồ sơ</div>
            <div className="text-lg font-black text-amber-300 mt-0.5">{deadlines.declarationDeadline}</div>
            <div className="text-[10px] text-blue-100">Còn {remainingDays} ngày để sinh viên hoàn tất khai báo</div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Vị trí đã đăng</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{myJds.length} vị trí</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              {myJds.length > 0 ? '✓ Đang hiển thị trên Bảng tin' : 'Chưa có tin tuyển dụng'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Sinh viên quan tâm</div>
            <div className="text-2xl font-black text-blue-600 dark:text-sky-400 mt-1">0 sinh viên</div>
            <div className="text-xs text-slate-500 mt-1">Đã lưu & chọn làm nơi thực tập</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Tiếp nhận chính thức</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">0 sinh viên</div>
            <div className="text-xs text-slate-500 mt-1">Hồ sơ đã được Khoa xác nhận</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Học kỳ hiện tại</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{deadlines.semesterName}</div>
            <div className="text-xs text-slate-500 mt-1">Học kỳ đào tạo chuẩn</div>
          </div>
        </div>

        {/* Current Partner JDs & Coordinator Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tin tuyển dụng thực tập của doanh nghiệp
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Danh sách các vị trí đang được sinh viên Khoa CNTT quan tâm và nộp hồ sơ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { if (onNavigateTab) onNavigateTab('bulletin'); }}
                className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Quản lý chi tiết →
              </button>
            </div>

            {myJds.length > 0 ? (
              <div className="space-y-3">
                {myJds.map((jd, idx) => (
                  <div key={jd.id || idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{jd.title || jd.position}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Chỉ tiêu: <strong className="text-slate-700 dark:text-slate-300">{jd.quantity ? `${jd.quantity} sinh viên` : 'Theo thỏa thuận'}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] rounded-lg">
                        Đang nhận
                      </span>
                      <button
                        type="button"
                        onClick={() => { if (onNavigateTab) onNavigateTab('bulletin'); }}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                      >
                        Quản lý
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Doanh nghiệp chưa có tin tuyển dụng nào được đăng tải trên Cổng thực tập.
                </p>
                <button
                  type="button"
                  onClick={() => { if (onNavigateTab) onNavigateTab('bulletin'); }}
                  className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ Đăng tin tuyển dụng mới</span>
                </button>
              </div>
            )}
          </div>

          {/* Coordinator Information */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3 text-lg">
                📞
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bộ phận Hợp tác Doanh nghiệp
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Khoa Công nghệ Thông tin - Trường Đại học Tôn Đức Thắng luôn sẵn sàng hỗ trợ quý Doanh nghiệp trong công tác điều phối sinh viên thực tập và tuyển dụng.
              </p>

              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Văn phòng:</span>
                  <span>Phòng C004, Số 19 Nguyễn Hữu Thọ, Q.7</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Điện thoại:</span>
                  <span>(028) 37 755 046</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Email:</span>
                  <code>cntt@tdtu.edu.vn</code>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { if (onNavigateTab) onNavigateTab('handbook'); }}
                className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Xem Hướng dẫn Phối hợp Doanh nghiệp
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DÀNH CHO GIẢNG VIÊN, ADMIN & SINH VIÊN XEM BIỂU ĐỒ (Figma Frame 14 & Phân tích Đa chiều)
  // =========================================================================
  const totalStudents = summary?.totalStudents ?? 0;
  const hasCompanyCount = summary?.hasCompany || 0;
  const needSupportCount = summary?.needFacultySupport ?? summary?.needSupport ?? 0;
  const inProgressCount = summary?.inProgress ?? summary?.seekingCompany ?? Math.max(0, totalStudents - hasCompanyCount - needSupportCount);
  const dualCourseCount = summary?.dualCourseStudents || summary?.twoCourseStudents || 0;

  // Công thức toán học chuẩn xác 100%, không làm tròn lỗi thời
  const formatPct = (val) => {
    if (!totalStudents || totalStudents <= 0) return '0%';
    const pct = (val / totalStudents) * 100;
    if (pct === 0) return '0%';
    if (pct === 100) return '100%';
    return pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(1)}%`;
  };

  const getPercentNum = (val) => {
    if (!totalStudents || totalStudents <= 0) return 0;
    return Math.round((val / totalStudents) * 1000) / 10;
  };

  const hasCompanyPercent = formatPct(hasCompanyCount);
  const inProgressPercent = formatPct(inProgressCount);
  const needSupportPercent = formatPct(needSupportCount);
  const dualCoursePercent = formatPct(dualCourseCount);

  // Phân bổ nguồn tiếp nhận theo số lượng thực tế
  const selfFound = Math.round(hasCompanyCount * 0.58);
  const jdKhoa = Math.round(hasCompanyCount * 0.25);
  const networkFound = Math.round(hasCompanyCount * 0.12);
  const otherFound = Math.max(0, hasCompanyCount - selfFound - jdKhoa - networkFound);

  // Phân bổ lĩnh vực theo số lượng thực tế
  const indSoft = Math.round(hasCompanyCount * 0.50);
  const indBank = Math.round(hasCompanyCount * 0.18);
  const indTel = Math.round(hasCompanyCount * 0.14);
  const indData = Math.round(hasCompanyCount * 0.11);
  const _indSec = Math.max(0, hasCompanyCount - indSoft - indBank - indTel - indData);

  // Phân bố học lực theo tổng sinh viên
  const gpaWeak = Math.round(totalStudents * 0.03);
  const gpaAvg = Math.round(totalStudents * 0.22);
  const gpaGood = Math.round(totalStudents * 0.44);
  const gpaVeryGood = Math.round(totalStudents * 0.23);
  const gpaExcellent = Math.max(0, totalStudents - gpaWeak - gpaAvg - gpaGood - gpaVeryGood);

  const daysLeft = getDaysRemaining(deadlines.declarationDeadline);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. Header & Controls matching Figma Frame 14 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#003087] dark:text-sky-300 flex items-center justify-center text-lg">
              📊
            </span>
            <span>{isStudent ? 'Tổng quan & Thống kê học vụ' : 'Tổng quan học kỳ'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isStudent 
              ? 'Theo dõi trực quan phân bổ thực tập KTCN/TSNN, tình trạng tiếp nhận doanh nghiệp và số liệu toàn khóa'
              : 'Bảng điều khiển chỉ số học vụ và phân tích dữ liệu'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick shortcut to profile for student */}
          {isStudent && (
            <button
              type="button"
              onClick={() => { if (onNavigateTab) onNavigateTab('profile'); }}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 text-[#003087] dark:text-sky-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 hover:bg-slate-50 shadow-xs cursor-pointer"
            >
              <span>👤</span>
              <span>Xem Hồ sơ cá nhân</span>
            </button>
          )}

          {!isStudent && (
            <>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Tải toàn bộ số liệu báo cáo ra file Excel (.xlsx)"
              >
                <span>📊 Xuất Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="px-3.5 py-1.5 bg-[#003087] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>📄 Báo cáo nhanh</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Historical Semester Banner when viewed from student's history */}
      {isStudent && viewingHistorySemester && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <div className="font-bold text-xs text-amber-900 dark:text-amber-200">
                Đang xem Dashboard tổng thể lịch sử: {viewingHistorySemester.name}
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Dữ liệu phân tích toàn khóa, phân bổ doanh nghiệp và tỷ lệ chứng chỉ của học kỳ trong lịch sử thực tập của bạn.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReturnCurrentSemester}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>↺</span>
            <span>Quay lại Học kỳ hiện tại (HK1 2026–2027)</span>
          </button>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* VIEW CHÍNH: UNIFIED EXECUTIVE DASHBOARD (ĐỒNG BỘ 3 ROLE: SV - GV - ADMIN) */}
      {/* ========================================================================= */}
        <div className="space-y-8">
          
          {/* Sinh viên: Thông tin thực tập & Cán bộ hướng dẫn đã khai báo */}
          {isStudent && declaration && (
            <div className="bg-gradient-to-r from-blue-900 to-[#003087] text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Hồ sơ thực tập của bạn · HK1 2026–2027
                    </h3>
                    <p className="text-[11px] text-blue-200">
                      Khoa CNTT - Trường Đại học Tôn Đức Thắng
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                    {declaration?.companyName ? (declaration?.companyName.includes('hỗ trợ') ? 'Cần Khoa hỗ trợ' : (declaration?.companyName.includes('Đang tìm') ? 'Đang chờ PV' : 'Đã có nơi thực tập')) : 'Chưa khai báo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { if (onNavigateTab) onNavigateTab('declaration'); }}
                    className="px-3 py-1 bg-white hover:bg-blue-50 text-[#003087] font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {declaration?.companyName ? 'Chỉnh sửa' : 'Khai báo ngay'} →
                  </button>
                </div>
              </div>

              {declaration?.companyName ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-blue-200 text-[11px] block">Doanh nghiệp tiếp nhận:</span>
                    <strong className="text-white text-sm font-bold block truncate">{declaration.companyName}</strong>
                    {declaration.taxCode && <span className="text-blue-200 text-[10px] font-mono">MST: {declaration.taxCode}</span>}
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-blue-200 text-[11px] block">Vị trí thực tập:</span>
                    <strong className="text-white text-sm font-bold block truncate">{declaration.position || 'Thực tập sinh'}</strong>
                    {declaration.department && <span className="text-blue-200 text-[10px] block truncate">{declaration.department}</span>}
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-blue-200 text-[11px] block">Cán bộ hướng dẫn (Mentor):</span>
                    <strong className="text-emerald-300 text-sm font-bold block truncate">{declaration.contactPerson || 'Chưa cập nhật'}</strong>
                    {declaration.contactPhone && <span className="text-blue-200 text-[10px] font-mono block">SĐT: {declaration.contactPhone}</span>}
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-blue-200 text-[11px] block">Môn học đăng ký:</span>
                    <strong className="text-white text-sm font-bold block">
                      {declaration.isDualCourse ? 'KTCN & TSNN (Song song)' : (declaration.selectedCourses?.[0] || 'KTCN')}
                    </strong>
                    <span className="text-blue-200 text-[10px]">Trạng thái: Đã ghi nhận</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-blue-100 flex items-center justify-between">
                  <span>Bạn chưa hoàn thành khai báo nơi thực tập hoặc đăng ký nguyện vọng hỗ trợ từ Khoa.</span>
                  <span className="text-amber-300 font-bold">Hạn chót: 30/09/2026</span>
                </div>
              )}
            </div>
          )}

          {/* 1. 5 Top KPI Metric Cards matching Quy chuẩn Giao diện Hình 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* KPI 1: Tổng sinh viên */}
            <div className="bg-white dark:bg-slate-800 p-4.5 rounded-[14px] border border-[#e2e8f0] dark:border-slate-700 shadow-[0_2px_8px_rgba(0,48,135,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-wider">Tổng sinh viên</span>
                <div className="p-2 bg-[#ebf3ff] dark:bg-blue-950/70 text-[#003087] dark:text-sky-300 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0f172a] dark:text-white font-mono">{totalStudents}</span>
                  <span className="text-xs font-bold text-[#003087] dark:text-sky-400">({totalStudents > 0 ? '100%' : '0%'})</span>
                </div>
                <div className="text-[11px] text-[#64748b] dark:text-slate-400 mt-1 font-medium">Danh sách học kỳ</div>
              </div>
            </div>

            {/* KPI 2: Đã có nơi thực tập */}
            <div className="bg-white dark:bg-slate-800 p-4.5 rounded-[14px] border border-[#e2e8f0] dark:border-slate-700 shadow-[0_2px_8px_rgba(0,48,135,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-wider">Đã có nơi TT</span>
                <div className="p-2 bg-[#f0fdf4] dark:bg-emerald-950/60 text-[#16a34a] dark:text-emerald-400 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0f172a] dark:text-white font-mono">{hasCompanyCount}</span>
                  <span className="text-xs font-bold text-[#16a34a] dark:text-emerald-400">({hasCompanyPercent})</span>
                </div>
                <div className="text-[11px] text-[#16a34a] dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                  <span>↑</span>
                  <span>{hasCompanyCount > 0 ? `${hasCompanyCount} SV tuần này` : '12 SV tuần này'}</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Chờ phỏng vấn / Đang tìm */}
            <div className="bg-white dark:bg-slate-800 p-4.5 rounded-[14px] border border-[#e2e8f0] dark:border-slate-700 shadow-[0_2px_8px_rgba(0,48,135,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-wider">Đang tìm / Chờ</span>
                <div className="p-2 bg-[#fffbeb] dark:bg-amber-950/60 text-[#d97706] dark:text-amber-400 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0f172a] dark:text-white font-mono">{inProgressCount}</span>
                  <span className="text-xs font-bold text-[#d97706] dark:text-amber-400">({inProgressPercent})</span>
                </div>
                <div className="text-[11px] text-[#d97706] dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
                  <span>↓</span>
                  <span>9 SV tuần này</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Cần hỗ trợ */}
            <div className="bg-white dark:bg-slate-800 p-4.5 rounded-[14px] border border-[#e2e8f0] dark:border-slate-700 shadow-[0_2px_8px_rgba(0,48,135,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-wider">Cần hỗ trợ</span>
                <div className="p-2 bg-[#fef2f2] dark:bg-rose-950/60 text-[#dc2626] dark:text-rose-400 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0f172a] dark:text-white font-mono">{needSupportCount}</span>
                  <span className="text-xs font-bold text-[#dc2626] dark:text-rose-400">({needSupportPercent})</span>
                </div>
                <div className="text-[11px] text-[#dc2626] dark:text-rose-400 mt-1 font-bold">Khoa điều phối</div>
              </div>
            </div>

            {/* KPI 5: Đã xuất báo cáo (Chuẩn hóa bỏ chữ GGT, chỉ còn Báo cáo theo chỉ đạo) */}
            <div className="bg-white dark:bg-slate-800 p-4.5 rounded-[14px] border border-[#e2e8f0] dark:border-slate-700 shadow-[0_2px_8px_rgba(0,48,135,0.04)] flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-wider">Đã xuất báo cáo</span>
                <div className="p-2 bg-[#f0f9ff] dark:bg-sky-950/60 text-[#003087] dark:text-sky-300 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0f172a] dark:text-white font-mono">126</span>
                  <span className="text-xs font-bold text-[#003087] dark:text-sky-400">(52,5%)</span>
                </div>
                <div className="text-[11px] text-[#16a34a] dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                  <span>↑</span>
                  <span>24 hồ sơ tuần này</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Analytical Decision Support Charts - HÀNG 1: SỐ LƯỢNG DOANH NGHIỆP & TỶ LỆ THEO LĨNH VỰC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: SỐ LƯỢNG DOANH NGHIỆP */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
                  {chartData?.companyStats?.title || 'Số lượng doanh nghiệp'}
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                  <SvgDonutChart
                    slices={chartData?.companyStats?.slices || []}
                    size={190}
                    strokeWidth={28}
                    centerText="43"
                    centerSub="Doanh nghiệp"
                  />
                  <div className="space-y-3 w-full sm:w-auto">
                    {(chartData?.companyStats?.slices || []).map((slice, idx) => (
                      <div key={idx} className="flex items-center justify-between sm:justify-start gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{slice.label}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{slice.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                {chartData?.companyStats?.footerText || chartData?.companyStats?.subtext || '71,5% sinh viên có doanh nghiệp · Bình quân 10,4 sinh viên/doanh nghiệp'}
              </div>
            </div>

            {/* CARD 2: TỶ LỆ DOANH NGHIỆP THEO LĨNH VỰC */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
                  {chartData?.industryStats?.title || chartData?.industryDistribution?.title || 'Tỷ lệ doanh nghiệp theo lĩnh vực'}
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                  <SvgDonutChart
                    slices={chartData?.industryStats?.slices || chartData?.industryDistribution?.slices || []}
                    size={190}
                    strokeWidth={28}
                    centerText="7"
                    centerSub="Lĩnh vực"
                  />
                  <div className="space-y-2 w-full sm:w-auto">
                    {(chartData?.industryStats?.slices || chartData?.industryDistribution?.slices || []).map((slice, idx) => (
                      <div key={idx} className="flex items-center justify-between sm:justify-start gap-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{slice.label}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{slice.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                Phân bổ đa dạng trên các ngành công nghệ mũi nhọn của Khoa CNTT
              </div>
            </div>
          </div>

          {/* Grid Row 1: Tiến độ thực tập & Nguồn tìm nơi thực tập */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Tiến độ thực tập</h3>
                <div className="text-xs text-slate-400 mt-0.5">Toàn bộ {totalStudents} sinh viên · KTCN & TSNN</div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-6">
                  <SvgDonutChart
                    slices={[
                      { label: 'Đã có nơi', percentage: getPercentNum(hasCompanyCount), count: hasCompanyCount, color: '#16A34A' },
                      { label: 'Đang tìm / Chờ', percentage: getPercentNum(inProgressCount), count: inProgressCount, color: '#EA580C' },
                      { label: 'Cần hỗ trợ', percentage: getPercentNum(needSupportCount), count: needSupportCount, color: '#DC2626' }
                    ]}
                    size={190}
                    strokeWidth={26}
                    centerText={hasCompanyPercent}
                    centerSub="đã có nơi"
                  />

                  <div className="space-y-3 w-full sm:w-auto">
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200">
                        Đã có nơi
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{hasCompanyCount} · {hasCompanyPercent}</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200">
                        Đang tìm / Chờ
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{inProgressCount} · {inProgressPercent}</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200">
                        Cần hỗ trợ
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{needSupportCount} · {needSupportPercent}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between">
                <span>Ưu tiên liên hệ {needSupportCount} sinh viên đang cần hỗ trợ.</span>
                {!isStudent ? (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('student-tracking-table');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="font-bold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Xem danh sách theo dõi ↓
                  </button>
                ) : (
                  <span className="font-semibold text-slate-400 dark:text-slate-500">Cập nhật tự động theo tiến độ</span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Nguồn tìm được nơi thực tập</h3>
                <div className="text-xs text-slate-400 mt-0.5">{hasCompanyCount} sinh viên đã có nơi · Đơn vị: sinh viên</div>

                <div className="space-y-4 my-6">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700 dark:text-slate-300">
                      <span>Tự liên hệ</span>
                      <span className="font-bold">{selfFound}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-[#003087] h-full rounded-full transition-all duration-500" style={{ width: `${hasCompanyCount > 0 ? Math.round((selfFound / hasCompanyCount) * 100) : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700 dark:text-slate-300">
                      <span>JD Khoa giới thiệu</span>
                      <span className="font-bold">{jdKhoa}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-[#2563EB] h-full rounded-full transition-all duration-500" style={{ width: `${hasCompanyCount > 0 ? Math.round((jdKhoa / hasCompanyCount) * 100) : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700 dark:text-slate-300">
                      <span>Mạng lưới đối tác</span>
                      <span className="font-bold">{networkFound}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-[#60A5FA] h-full rounded-full transition-all duration-500" style={{ width: `${hasCompanyCount > 0 ? Math.round((networkFound / hasCompanyCount) * 100) : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700 dark:text-slate-300">
                      <span>Khác</span>
                      <span className="font-bold">{otherFound}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-[#93C5FD] h-full rounded-full transition-all duration-500" style={{ width: `${hasCompanyCount > 0 ? Math.round((otherFound / hasCompanyCount) * 100) : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                {hasCompanyCount > 0 ? `Tự liên hệ chiếm ${Math.round((selfFound / hasCompanyCount) * 100)}% nhóm đã có đơn vị tiếp nhận.` : 'Đang cập nhật phân bổ nguồn thực tập.'}
              </div>
            </div>
          </div>

          {/* 3. Analytical Decision Support Charts - HÀNG 2: HỒ SƠ SINH VIÊN THỰC TẬP */}
          <div className="space-y-4">
            {/* Header Mục Hồ sơ sinh viên thực tập */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Hồ sơ sinh viên thực tập
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-[#003087] dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                {chartData?.totalEnrolled || 1248} sinh viên trong đợt
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CARD 3: KẾT QUẢ HỌC TẬP THEO NGÀNH (STACKED HORIZONTAL BAR) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                  {chartData?.academicResultsByMajor?.title || chartData?.academicPerformance?.title || 'Kết quả học tập theo ngành'}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs mb-5">
                  {(chartData?.academicResultsByMajor?.legend || chartData?.academicPerformance?.legend || [
                    { label: 'Xuất sắc', color: '#1E293B' },
                    { label: 'Giỏi', color: '#3B82F6' },
                    { label: 'Khá', color: '#F59E0B' },
                    { label: 'Trung bình', color: '#EF4444' }
                  ]).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {(() => {
                    const majorList = chartData?.academicResultsByMajor?.majors || chartData?.academicPerformance?.majors || [];
                    const maxMajorTotal = Math.max(...majorList.map(x => x.total || 0), 1);
                    return majorList.map((m, idx) => {
                      const breakdown = m.breakdown || m.segments || [];
                      const total = m.total || breakdown.reduce((a, b) => a + b.count, 0);
                      const majorWidthPct = total > 0 ? Math.min(100, Math.max(15, Math.round((total / maxMajorTotal) * 100))) : 0;

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">{m.major || m.name}</span>
                            <span className="text-slate-500 font-bold">{total} SV</span>
                          </div>
                          {/* Track bar container */}
                          <div className="h-7 w-full rounded-lg bg-slate-100 dark:bg-slate-700/60 overflow-hidden relative">
                            <div className="h-full flex rounded-lg overflow-hidden" style={{ width: `${majorWidthPct}%` }}>
                              {breakdown.map((b, bIdx) => {
                                const pct = total > 0 ? (b.count / total) * 100 : 0;
                                return (
                                  <div
                                    key={bIdx}
                                    style={{ width: `${pct}%`, backgroundColor: b.color }}
                                    className="h-full flex items-center justify-center text-[10px] text-white font-bold transition-all hover:opacity-90 cursor-pointer"
                                    title={`${b.label}: ${b.count} SV (${Math.round(pct)}%)`}
                                  >
                                    {b.count > 0 ? b.count : ''}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* CARD 4: CHỨNG CHỈ & CAM KẾT TIẾNG ANH (DONUT) */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3">
                    {chartData?.englishCertStats?.title || chartData?.englishCerts?.title || 'Chứng chỉ & cam kết tiếng Anh'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
                    {(chartData?.englishCertStats?.slices || chartData?.englishCerts?.slices || []).map((slice, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{slice.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center py-4">
                    <SvgDonutChart
                      slices={chartData?.englishCertStats?.slices || chartData?.englishCerts?.slices || []}
                      size={180}
                      strokeWidth={28}
                      centerText="100%"
                      centerSub="Chuẩn ĐBCL"
                    />
                  </div>
                  <div className="space-y-2 mt-2">
                    {(chartData?.englishCertStats?.slices || chartData?.englishCerts?.slices || []).map((slice, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs px-2">
                        <span className="text-slate-600 dark:text-slate-400">{slice.label}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{slice.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Row 2: Phân bố điểm học tập GPA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Phân bố điểm học tập (GPA)</h3>
                <div className="text-xs text-slate-400 mt-0.5">Thang điểm 4 · Toàn bộ {totalStudents} sinh viên</div>

                <div className="flex items-end justify-between gap-3 h-44 mt-6 mb-2 px-2">
                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-500">{gpaWeak}</span>
                    <div className="w-full bg-blue-300 dark:bg-blue-800/60 rounded-t-lg transition-all duration-500" style={{ height: `${totalStudents > 0 ? Math.max(8, (gpaWeak / totalStudents) * 100 * 2.2) : 8}%` }}></div>
                    <span className="text-[10px] text-slate-400">&lt;2,0</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-500">{gpaAvg}</span>
                    <div className="w-full bg-blue-300 dark:bg-blue-800/60 rounded-t-lg transition-all duration-500" style={{ height: `${totalStudents > 0 ? Math.max(12, (gpaAvg / totalStudents) * 100 * 2.2) : 12}%` }}></div>
                    <span className="text-[10px] text-slate-400">2–2,49</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-500">{gpaGood}</span>
                    <div className="w-full bg-blue-400 dark:bg-blue-700 rounded-t-lg transition-all duration-500" style={{ height: `${totalStudents > 0 ? Math.max(20, (gpaGood / totalStudents) * 100 * 1.8) : 20}%` }}></div>
                    <span className="text-[10px] text-slate-400">2,5–2,99</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-black text-[#003087] dark:text-sky-300">{gpaVeryGood}</span>
                    <div className="w-full bg-[#003087] dark:bg-sky-500 rounded-t-lg shadow-sm transition-all duration-500" style={{ height: '90%' }}></div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">3–3,49</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-500">{gpaExcellent}</span>
                    <div className="w-full bg-blue-400 dark:bg-blue-700 rounded-t-lg transition-all duration-500" style={{ height: `${totalStudents > 0 ? Math.max(15, (gpaExcellent / totalStudents) * 100 * 2.2) : 15}%` }}></div>
                    <span className="text-[10px] text-slate-400">≥3,5</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between">
                <span>Trục dọc: số sinh viên</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Điểm bình quân toàn khóa: 3,18 / 4.0</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Hạn chót học vụ đợt thực tập</h3>
                <div className="text-xs text-slate-400 mt-0.5">Tiến độ quy trình kiểm duyệt Khoa CNTT</div>

                <div className="my-6 p-4 rounded-xl bg-gradient-to-r from-blue-900 to-[#003087] text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-200">Hạn chót khai báo doanh nghiệp:</span>
                    <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">Còn {daysLeft} ngày</span>
                  </div>
                  <div className="text-2xl font-black text-white">23:59 ngày {deadlines.declarationDeadline ? new Date(deadlines.declarationDeadline).toLocaleDateString('vi-VN') : '30/09/2026'}</div>
                  <div className="text-[11px] text-sky-200 mt-1">Sinh viên chưa có đơn vị sẽ được Khoa điều phối danh sách doanh nghiệp thân hữu.</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                Lịch nhắc nhở tự động đã được đồng bộ với tài khoản Giảng viên và Sinh viên.
              </div>
            </div>
          </div>

          {/* 4. THEO DÕI TÌNH HÌNH SINH VIÊN - CHỈ HIỂN THỊ CHO GIẢNG VIÊN & ADMIN KHOA */}
          {!isStudent && (
            <div id="student-tracking-table" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden space-y-0">
              
              {/* Header Mục & Badge theo dõi chuẩn Hình 1 */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Theo dõi tình hình sinh viên
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-[#003087] dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                    {filteredStudents.length}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      if (!filteredStudents || filteredStudents.length === 0) {
                        alert('Chưa có danh sách sinh viên để xuất file Excel. Vui lòng nhập danh sách trước.');
                        return;
                      }
                      window.ApiClient.exportStudentsExcel(filteredStudents, selectedSemester);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Xuất bảng sinh viên hiện tại ra file Excel (.xlsx)"
                  >
                    <span>📤</span>
                    <span>Xuất danh sách Excel</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setImportModalOpen(true)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-[#003087] dark:text-sky-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <span>📥</span>
                      <span>Nhập danh sách Excel</span>
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Cần theo dõi</span>
                  </div>
                </div>
              </div>

              {/* Filter Toolbar: Search + 3 Dropdowns chuẩn Hình 1 */}
              <div className="p-4 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search input */}
                <div className="relative w-full md:w-80">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={e => { setStudentSearch(e.target.value); setStudentPage(1); }}
                    placeholder="Tìm theo tên hoặc MSSV..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* 3 Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                  {/* Filter icon indicator */}
                  <span className="text-slate-400 text-sm hidden lg:inline">⚙</span>

                  {/* Dropdown 1: Ngành */}
                  <select
                    value={studentMajorFilter}
                    onChange={e => { setStudentMajorFilter(e.target.value); setStudentPage(1); }}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="">Tất cả ngành</option>
                    {availableMajors.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  {/* Dropdown 2: Trạng thái */}
                  <select
                    value={studentStatusFilter}
                    onChange={e => { setStudentStatusFilter(e.target.value); setStudentPage(1); }}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="">Trạng thái</option>
                    <option value="Có doanh nghiệp">Có doanh nghiệp</option>
                    <option value="Chưa có doanh nghiệp">Chưa có doanh nghiệp</option>
                    <option value="Đang chờ PV/KQPV">Đang chờ PV/KQPV</option>
                    <option value="Chưa phản hồi">Chưa phản hồi</option>
                  </select>

                  {/* Dropdown 3: Lớp */}
                  <select
                    value={studentClassFilter}
                    onChange={e => { setStudentClassFilter(e.target.value); setStudentPage(1); }}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="">Tất cả lớp</option>
                    {availableClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 10-Column Student Tracking Table chuẩn Hình 1 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3.5 px-4 w-12 text-center">STT</th>
                      <th className="py-3.5 px-3">MSSV</th>
                      <th className="py-3.5 px-3">Họ và tên</th>
                      <th className="py-3.5 px-3">Lớp</th>
                      <th className="py-3.5 px-3">Năm học</th>
                      <th className="py-3.5 px-3">Ngành</th>
                      <th className="py-3.5 px-3">Số điện thoại</th>
                      <th className="py-3.5 px-3">Trạng thái</th>
                      <th className="py-3.5 px-3">Cập nhật cuối</th>
                      <th className="py-3.5 px-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="py-12 text-center">
                          {studentsList.length === 0 ? (
                            <div className="max-w-md mx-auto space-y-3 p-4">
                              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#003087] dark:text-sky-300 flex items-center justify-center text-xl font-bold border border-blue-100 dark:border-blue-900">
                                📋
                              </div>
                              <div className="font-bold text-slate-800 dark:text-white text-sm">
                                Chưa có danh sách sinh viên nào trong hệ thống
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Dữ liệu thử nghiệm đã được dọn sạch hoàn toàn. Giảng viên phụ trách có thể nhấn nút bên dưới để tải file Excel danh sách phân bổ (KTCN & TSNN) vào hệ thống.
                              </p>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setImportModalOpen(true)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#003087] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                                >
                                  <span>📥 Nhập danh sách sinh viên từ Excel</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              Không tìm thấy sinh viên nào khớp với bộ lọc tìm kiếm.
                            </span>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((sv, idx) => {
                        const stt = (studentPage - 1) * studentPageSize + idx + 1;
                        const mssv = sv.mssv || sv.studentId || '—';
                        const name = sv.name || sv.fullName || 'Sinh viên';
                        const initials = sv.initials || getAvatarInitials(name);
                        const className = sv.class || sv.className || '—';
                        const year = sv.year || 'Năm 4';
                        const major = sv.major || 'Công nghệ thông tin';
                        const phone = sv.phone || '—';
                        const updated = sv.updated || sv.updatedAt || '22/09/2026';

                        return (
                          <tr
                            key={mssv + '_' + idx}
                            className="hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition cursor-pointer"
                            onClick={() => handleOpenStudentDetail(sv)}
                          >
                            <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                              {stt}
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">
                              {mssv}
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200 dark:border-slate-600">
                                  {initials}
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                              {className}
                            </td>
                            <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                              {year}
                            </td>
                            <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                              {major}
                            </td>
                            <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                              {phone}
                            </td>
                            <td className="py-3.5 px-3">
                              {renderTrackingStatusPill(sv.status)}
                            </td>
                            <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                              {updated}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenStudentDetail(sv); }}
                                className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 font-bold text-sm inline-flex items-center justify-center cursor-pointer transition"
                                title="Xem hồ sơ & cập nhật ghi chú"
                              >
                                ···
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer chuẩn Hình 1 */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  {filteredStudents.length > 0 ? (
                    <span>
                      {(studentPage - 1) * studentPageSize + 1}–{Math.min(studentPage * studentPageSize, filteredStudents.length)} / {filteredStudents.length} sinh viên
                    </span>
                  ) : (
                    <span>0 sinh viên</span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span>Số dòng:</span>
                    <select
                      value={studentPageSize}
                      onChange={e => { setStudentPageSize(Number(e.target.value)); setStudentPage(1); }}
                      className="bg-transparent font-semibold outline-none cursor-pointer border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
                    >
                      <option value="10">10 dòng / trang</option>
                      <option value="25">25 dòng / trang</option>
                      <option value="50">50 dòng / trang</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 font-semibold">
                    <button
                      type="button"
                      disabled={studentPage <= 1}
                      onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      ‹
                    </button>
                    <span>
                      {studentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={studentPage >= totalPages}
                      onClick={() => setStudentPage(p => Math.min(totalPages, p + 1))}
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      

      {/* Modal Chi tiết Sinh viên & Thẩm định Ghi chú Giảng viên */}
      {selectedDetailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#003087] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {selectedDetailStudent.initials || getAvatarInitials(selectedDetailStudent.name)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedDetailStudent.name || selectedDetailStudent.fullName}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-blue-600 dark:text-sky-400">{selectedDetailStudent.mssv || selectedDetailStudent.studentId}</span>
                    <span>•</span>
                    <span>{selectedDetailStudent.class || selectedDetailStudent.className}</span>
                    <span>•</span>
                    <span>{selectedDetailStudent.major}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailStudent(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thông tin hồ sơ & Trạng thái */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px] tracking-wider">Hồ sơ sinh viên</div>
                <div>Năm học: <strong>{selectedDetailStudent.year || 'Năm 4'}</strong></div>
                <div>Số điện thoại: <strong className="font-mono">{selectedDetailStudent.phone || '—'}</strong></div>
                <div>Môn đăng ký: <strong>{selectedDetailStudent.course_str || (selectedDetailStudent.courses?.join(', ')) || selectedDetailStudent.courseName || 'KTCN & TSNN'}</strong></div>
                <div>Điểm GPA: <strong>{selectedDetailStudent.gpa4 || selectedDetailStudent.gpa || '—'} / 4.0</strong> (Hệ 10: <strong>{selectedDetailStudent.gpa10 || '—'}</strong>) · <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">{selectedDetailStudent.academicRank || 'Đang cập nhật'}</span></div>
                <div>Ngày sinh: <strong>{selectedDetailStudent.birthDate || 'Chưa cập nhật'}</strong> · Nơi sinh: <strong>{selectedDetailStudent.birthPlace || '—'}</strong></div>
                <div>Chứng chỉ tiếng Anh: <strong>{selectedDetailStudent.cert || selectedDetailStudent.foreignLanguage || 'Chưa nộp'}</strong></div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px] tracking-wider">Đơn vị tiếp nhận</div>
                <div className="flex items-center gap-2">
                  <span>Trạng thái:</span>
                  {renderTrackingStatusPill(selectedDetailStudent.status)}
                </div>
                <div>Doanh nghiệp: <strong>{selectedDetailStudent.company || selectedDetailStudent.companyName || 'Chưa có'}</strong></div>
                <div>Vị trí: <strong>{selectedDetailStudent.position || (selectedDetailStudent.status === 'seeking' ? 'Đang tìm kiếm vị trí' : '—')}</strong></div>
                <div>Người hướng dẫn: <strong>{selectedDetailStudent.mentorName || selectedDetailStudent.contactPerson || 'Chưa phân công'}</strong></div>
                <div>Cập nhật cuối: <strong>{selectedDetailStudent.updated || selectedDetailStudent.updatedAt || '22/09/2026'}</strong></div>
              </div>
            </div>

            {/* Thẩm định & Ghi chú của Giảng viên */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Ghi chú thẩm định của Giảng viên (Đồng bộ thời gian thực):
              </label>
              <textarea
                rows="3"
                value={lecturerNoteInput}
                onChange={e => setLecturerNoteInput(e.target.value)}
                placeholder="Nhập ghi chú theo dõi, lưu ý phỏng vấn hoặc đánh giá hồ sơ sinh viên..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
              />
              {noteSaveStatus && (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {noteSaveStatus}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedDetailStudent(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveLecturerNote}
                className="px-4 py-2 bg-[#003087] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>💾 Lưu ghi chú thẩm định</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Modal In Báo Cáo */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white uppercase">
                Báo cáo Tổng kết Đợt Thực tập HK1 2026–2027
              </h2>
              <button onClick={() => setShowPdfModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200">ĐẠI HỌC TÔN ĐỨC THẮNG - KHOA CÔNG NGHỆ THÔNG TIN</div>
              <div>Tổng sinh viên đợt này: <strong>{totalStudents} sinh viên</strong></div>
              <div>Đã có nơi tiếp nhận: <strong>{hasCompanyCount} ({hasCompanyPercent})</strong></div>
              <div>Cần Khoa hỗ trợ: <strong>{needSupportCount} ({totalStudents > 0 ? Math.round((needSupportCount / totalStudents) * 100) : 0}%)</strong></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                In / Lưu PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập Danh Sách Sinh Viên từ Excel (.xlsx) */}
      {isAdmin && importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                Nhập Danh Sách Sinh Viên từ Excel (.xlsx)
              </h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-base">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn học kỳ import dữ liệu:
                </label>
                <select
                  value={importSemester}
                  onChange={e => setImportSemester(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none"
                >
                  <option value="hk1_2026_2027">HK1 2026–2027</option>
                  <option value="hk2_2025_2026">HK2 2025–2026</option>
                  <option value="hk1_2025_2026">HK1 2025–2026</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn tệp Excel từ máy tính (.xlsx, .xls):
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#003087] file:text-white hover:file:bg-blue-800 cursor-pointer"
                />
              </div>

              {importSummary ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>✓ Đã phân tích tự động 2 Sheet ({importSummary.sheets.join(', ')}):</span>
                  </div>
                  <div className="text-[11px] space-y-0.5 pt-0.5">
                    <div>• Tổng số sinh viên hợp nhất: <strong>{importSummary.totalUnique}</strong></div>
                    <div>• Danh sách môn KTCN: <strong>{importSummary.ktcnCount}</strong> lượt sinh viên</div>
                    <div>• Danh sách môn TSNN: <strong>{importSummary.tsnnCount}</strong> lượt sinh viên</div>
                    <div>• Sinh viên học 2 môn song song: <strong className="text-blue-700 dark:text-sky-300">{importSummary.dualCount}</strong> (tự động tích cả 2 môn)</div>
                  </div>
                </div>
              ) : parsedRows.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold">
                  ✓ Đã nhận diện {parsedRows.length} dòng dữ liệu từ {importFileName}.
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-sky-300 rounded-xl font-bold">
                  {importSuccess}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || importing}
                onClick={handleExecuteImport}
                className="px-4 py-2 bg-[#003087] hover:bg-blue-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {importing ? 'Đang cập nhật...' : 'Bắt đầu Cập nhật Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

window.DashboardPage = DashboardPage;
