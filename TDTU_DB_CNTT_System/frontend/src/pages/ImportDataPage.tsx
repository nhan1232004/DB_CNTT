// ImportDataPage.tsx - Trung tâm Nhập Dữ liệu Học phần Thực tập từ Excel
// Tuân thủ nghiêm ngặt Bộ Quy chuẩn Thiết kế (Design System & Guidelines):
// 1. Màu sắc: Trắng (#ffffff), Xanh dương (#003087), Đỏ (#dc2626)
// 2. Màu chữ: Chỉ Đen/Xám đậm (#1f2937) và Đỏ (#dc2626)
// 3. Phông chữ: Body 11px-13px, Tiêu đề in đậm (font-bold)
// 4. Bố cục: Cân đối, văn bản mô tả căn đều (text-justify)
// 5. Tính năng nâng cao: Xem trước (Preview & Review), chọn nhiều (Multichoice checkboxes), Không dùng Emoji/AI

const { useState, useMemo, useEffect } = React;

interface ImportDataPageProps {
  currentUser?: any;
  onNavigateTab?: (tab: string) => void;
}

const ImportDataPage: React.FC<ImportDataPageProps> = ({ currentUser, onNavigateTab }) => {
  const roleKey = (window as any).PrimeRbac?.getUserRoleKey?.(currentUser) || 'thay_phuc';
  const mask = (window as any).PrimeRbac?.getFeatureMask?.(currentUser, 'import') || 26;

  const canRead = (window as any).PrimeRbac?.hasPrimePermission(mask, 2);
  const canImport = (window as any).PrimeRbac?.hasPrimePermission(mask, 13);

  const [selectedSemester, setSelectedSemester] = useState<string>('hk1_2026_2027');
  const [semestersList, setSemestersList] = useState<any[]>(() => {
    return (window as any).ApiClient?.getSemesters ? (window as any).ApiClient.getSemesters() : [
      { id: 'hk2_2026_2027', name: 'Học kỳ 2 / 2026–2027' },
      { id: 'hk1_2026_2027', name: 'Học kỳ 1 / 2026–2027 (Hiện tại)' },
      { id: 'hk2_2025_2026', name: 'Học kỳ 2 / 2025–2026' },
      { id: 'hk1_2025_2026', name: 'Học kỳ 1 / 2025–2026' }
    ];
  });

  useEffect(() => {
    const handleSemUpdate = () => {
      if ((window as any).ApiClient?.getSemesters) {
        setSemestersList((window as any).ApiClient.getSemesters());
      }
    };
    window.addEventListener('tdtu_semesters_updated', handleSemUpdate);
    window.addEventListener('storage', handleSemUpdate);
    let bc: any = null;
    try {
      bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.onmessage = (msg: any) => {
        if (msg.data?.type === 'semesters_updated') {
          handleSemUpdate();
        }
      };
    } catch {}
    return () => {
      window.removeEventListener('tdtu_semesters_updated', handleSemUpdate);
      window.removeEventListener('storage', handleSemUpdate);
      if (bc) {
        try { bc.close(); } catch {}
      }
    };
  }, []);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [importFileName, setImportFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [selectedMssvs, setSelectedMssvs] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [previewCourseFilter, setPreviewCourseFilter] = useState<string>('all');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
          alert('Thư viện xử lý Excel chưa sẵn sàng. Vui lòng tải lại trang.');
          return;
        }
        const wb = XLSX.read(bstr, { type: 'binary' });

        const studentMap: Record<string, any> = {};
        let ktcnCount = 0;
        let tsnnCount = 0;

        wb.SheetNames.forEach((sName: string, sIdx: number) => {
          const ws = wb.Sheets[sName];
          const rawData: any[] = XLSX.utils.sheet_to_json(ws);
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

            const className = String(row['Lớp'] || row.class || row['Lớp sinh hoạt'] || '22H50201').trim();
            let major = String(row['Ngành'] || row.major || '').trim();
            if (!major) {
              if (className.includes('501')) major = 'Khoa học máy tính';
              else if (className.includes('502')) major = 'Kỹ thuật phần mềm';
              else if (className.includes('503')) major = 'Mạng máy tính và truyền thông dữ liệu';
              else if (className.includes('504')) major = 'Hệ thống thông tin';
              else major = 'Kỹ thuật phần mềm';
            }

            const tenMH = String(row['Tên MH'] || row['Môn học'] || row['Học phần'] || row['Học phần ĐK'] || row['Môn học đăng ký'] || row['Mã MH'] || row.courseCode || row.course || '').toLowerCase();
            let rowCourse = defaultSheetCourse;
            if (tenMH.includes('dự án') || tenMH.includes('tập sự') || tenMH.includes('tsnn') || tenMH.includes('504075') || tenMH.includes('504096')) {
              rowCourse = 'TSNN';
            } else if (tenMH.includes('kiến tập') || tenMH.includes('ktcn') || tenMH.includes('504074') || tenMH.includes('504095')) {
              rowCourse = 'KTCN';
            }

            const gpa4Raw = row['GPA (Hệ 4)'] || row.gpa4 || row.gpa || row.GPA || row['Điểm TB'];
            const gpa4Val = parseFloat(String(gpa4Raw || '').replace(',', '.'));
            const finalGpa4 = isNaN(gpa4Val) ? 3.0 : gpa4Val;

            const gpa10Raw = row['GPA (Hệ 10)'] || row.gpa10 || row['Điểm TB Hệ 10'];
            const gpa10Val = parseFloat(String(gpa10Raw || '').replace(',', '.'));
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
            const gender = String(row['Phái'] || row['Giới tính'] || row.gender || '').trim();
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
                gpa: finalGpa4,
                gpa4: finalGpa4,
                gpa10: finalGpa10,
                academicRank,
                birthDate: birthDateStr,
                birthPlace,
                gender,
                phone,
                courses: [rowCourse],
                courseCode: rowCourse,
                courseName: rowCourse === 'KTCN' ? 'Kiến tập Công nghiệp' : 'Tập sự Nghề nghiệp',
                course_str: rowCourse === 'KTCN' ? 'Kiến tập công nghiệp (KTCN)' : 'Tập sự nghề nghiệp (TSNN)',
                isDualCourse: 0,
                status: 'Chưa có doanh nghiệp',
                companyName: 'Chưa có',
                company: 'Chưa có',
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
                studentMap[mssv].course_str = 'KTCN & TSNN (Song song)';
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

        const list = Object.values(studentMap);
        const dualCount = list.filter(s => s.isDualCourse === 1).length;

        setParsedRows(list);
        setSelectedMssvs(list.map(s => s.mssv));
        setImportSummary({
          totalUnique: list.length,
          sheets: wb.SheetNames,
          ktcnCount,
          tsnnCount,
          dualCount
        });
      } catch (err: any) {
        alert('Lỗi đọc tệp Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleToggleSelectRow = (mssv: string) => {
    setSelectedMssvs(prev =>
      prev.includes(mssv) ? prev.filter(x => x !== mssv) : [...prev, mssv]
    );
  };

  const handleSelectAllPreview = () => {
    if (selectedMssvs.length === displayedRows.length) {
      setSelectedMssvs([]);
    } else {
      setSelectedMssvs(displayedRows.map(s => s.mssv));
    }
  };

  const displayedRows = useMemo(() => {
    return parsedRows.filter(s => {
      if (previewCourseFilter === 'dual' && s.isDualCourse !== 1) return false;
      if (previewCourseFilter === 'KTCN' && s.courseCode !== 'KTCN' && !s.courses?.includes('KTCN')) return false;
      if (previewCourseFilter === 'TSNN' && s.courseCode !== 'TSNN' && !s.courses?.includes('TSNN')) return false;

      if (previewSearch.trim()) {
        const q = previewSearch.trim().toLowerCase();
        const mssvMatch = (s.mssv || '').toLowerCase().includes(q);
        const nameMatch = (s.fullName || s.name || '').toLowerCase().includes(q);
        const classMatch = (s.class || '').toLowerCase().includes(q);
        const majorMatch = (s.major || '').toLowerCase().includes(q);
        if (!mssvMatch && !nameMatch && !classMatch && !majorMatch) return false;
      }
      return true;
    });
  }, [parsedRows, previewCourseFilter, previewSearch]);

  const handleExecuteImport = async () => {
    if (!canImport) {
      alert('Bạn không có quyền cập nhật dữ liệu vào hệ thống.');
      return;
    }
    const finalImportList = parsedRows.filter(s => selectedMssvs.includes(s.mssv));
    if (finalImportList.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sinh viên trong danh sách xem trước để nạp.');
      return;
    }

    setImporting(true);
    try {
      if ((window as any).ApiClient?.importStudentsExcel) {
        await (window as any).ApiClient.importStudentsExcel(selectedSemester, finalImportList, importMode);
      } else if ((window as any).ApiClient?.saveLiveStudents) {
        (window as any).ApiClient.saveLiveStudents(finalImportList);
      }

      setImportSuccess(`Đã nạp thành công ${finalImportList.length} sinh viên vào cơ sở dữ liệu học kỳ ${selectedSemester.toUpperCase()} (${importMode === 'replace' ? 'Thay thế toàn bộ' : 'Gộp thêm'})!`);
    } catch (err: any) {
      alert('Lỗi nạp dữ liệu: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSampleExcel = () => {
    try {
      const XLSX = (window as any).XLSX;
      if (!XLSX) return;
      const wb = XLSX.utils.book_new();
      const sampleKTCN = [
        { 'STT': 1, 'Mã số': '522H0101', 'Họ lót': 'Nguyễn Hoàng', 'Tên': 'Bách', 'Phái': 'Nam', 'Ngày sinh': '15/05/2004', 'Nơi sinh': 'TP. Hồ Chí Minh', 'Lớp': '22H50201', 'Ngành': 'Kỹ thuật phần mềm', 'GPA (Hệ 10)': 8.5, 'GPA (Hệ 4)': 3.4, 'Xếp loại': 'Giỏi', 'Số điện thoại': '0901234567' },
        { 'STT': 2, 'Mã số': '522H0102', 'Họ lót': 'Trần Thảo', 'Tên': 'My', 'Phái': 'Nữ', 'Ngày sinh': '20/08/2004', 'Nơi sinh': 'Đồng Nai', 'Lớp': '22H50101', 'Ngành': 'Khoa học máy tính', 'GPA (Hệ 10)': 9.1, 'GPA (Hệ 4)': 3.7, 'Xếp loại': 'Xuất sắc', 'Số điện thoại': '0902345678' }
      ];
      const sampleTSNN = [
        { 'STT': 1, 'Mã số': '522H0101', 'Họ lót': 'Nguyễn Hoàng', 'Tên': 'Bách', 'Phái': 'Nam', 'Ngày sinh': '15/05/2004', 'Nơi sinh': 'TP. Hồ Chí Minh', 'Lớp': '22H50201', 'Ngành': 'Kỹ thuật phần mềm', 'GPA (Hệ 10)': 8.5, 'GPA (Hệ 4)': 3.4, 'Xếp loại': 'Giỏi', 'Số điện thoại': '0901234567' },
        { 'STT': 2, 'Mã số': '522H0103', 'Họ lót': 'Lê Minh', 'Tên': 'Khôi', 'Phái': 'Nam', 'Ngày sinh': '10/11/2003', 'Nơi sinh': 'Long An', 'Lớp': '21H50301', 'Ngành': 'Mạng máy tính và truyền thông dữ liệu', 'GPA (Hệ 10)': 7.2, 'GPA (Hệ 4)': 2.88, 'Xếp loại': 'Khá', 'Số điện thoại': '0903456789' }
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleKTCN), 'DSSV_KTCN');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleTSNN), 'DSSV_TSNN');
      XLSX.writeFile(wb, 'File_Mau_Import_DSSV_KTCN_TSNN_GPA.xlsx');
    } catch {}
  };

  const handleResetPreview = () => {
    setParsedRows([]);
    setSelectedMssvs([]);
    setImportSummary(null);
    setImportFileName('');
    setImportSuccess(null);
  };

  if (!canRead || !canImport) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-xl border border-[#e5e7eb] my-8">
        <h2 className="text-[19px] font-bold text-[#dc2626]">Không có quyền truy cập chức năng</h2>
        <p className="text-[12.5px] text-[#1f2937] mt-2 text-justify leading-relaxed">
          Bạn không có quyền truy cập mục này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1f2937] leading-tight">
            Nhập Dữ Liệu Học Phần Thực Tập
          </h1>
          <p className="text-[12.5px] text-[#1f2937] mt-1 text-justify leading-relaxed">
            Nạp danh sách sinh viên từ file Excel.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadSampleExcel}
          className="px-5 py-2.5 min-w-[180px] bg-white text-[#003087] border border-[#003087] hover:bg-[#ebf3ff] rounded-lg text-[12.5px] font-bold transition cursor-pointer self-start md:self-auto whitespace-nowrap"
        >
          Tải file Excel mẫu chuẩn
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs space-y-5">
        <h2 className="text-[19px] font-bold text-[#1f2937]">
          Bước 1: Thiết lập Thông số & Chọn Tệp Excel
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-[12px] font-bold text-[#1f2937] mb-1.5 uppercase tracking-wide">
              Học kỳ nạp dữ liệu:
            </label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#e5e7eb] rounded-lg text-[12.5px] font-bold text-[#1f2937] outline-none focus:border-[#003087]"
            >
              {semestersList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#1f2937] mb-1.5 uppercase tracking-wide">
              Chế độ nạp dữ liệu:
            </label>
            <select
              value={importMode}
              onChange={e => setImportMode(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-white border border-[#e5e7eb] rounded-lg text-[12.5px] font-bold text-[#003087] outline-none focus:border-[#003087]"
            >
              <option value="replace">Thay thế toàn bộ danh sách hiện tại</option>
              <option value="append">Gộp thêm / Cập nhật vào danh sách đang có</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#1f2937] mb-1.5 uppercase tracking-wide">
              Chọn tệp Excel từ thiết bị:
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="w-full p-2 border border-[#e5e7eb] rounded-lg bg-white text-[#1f2937] text-[12px] file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-[12px] file:font-bold file:bg-[#003087] file:text-white hover:file:bg-[#002266] cursor-pointer"
            />
          </div>
        </div>

        {importSuccess && (
          <div className="p-4 bg-white border-2 border-[#003087] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-[12.5px] font-bold text-[#003087]">
              {importSuccess}
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                className="px-5 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[12.5px] font-bold transition cursor-pointer whitespace-nowrap min-w-[140px]"
              >
                Xem Tổng quan Dashboard
              </button>
            )}
          </div>
        )}
      </div>

      {parsedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
            <div>
              <h2 className="text-[19px] font-bold text-[#1f2937]">
                Bước 2: Xem Trước & Lựa Chọn Dữ Liệu Cần Nạp
              </h2>
              <p className="text-[12px] text-[#1f2937] mt-0.5">
                Tệp tin: <strong className="text-[#003087]">{importFileName}</strong> (Đã nhận diện: {importSummary?.sheets?.join(', ') || 'Sheet'})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetPreview}
                className="px-4 py-2 border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f8fafc] rounded-lg text-[12.5px] font-bold cursor-pointer whitespace-nowrap min-w-[100px]"
              >
                Hủy xem trước
              </button>
              <button
                type="button"
                disabled={selectedMssvs.length === 0 || importing}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-[#003087] hover:bg-[#002266] disabled:opacity-40 text-white rounded-lg text-[12.5px] font-bold transition cursor-pointer shadow-xs whitespace-nowrap min-w-[200px]"
              >
                {importing ? 'Đang cập nhật...' : `Xác nhận nạp (${selectedMssvs.length} sinh viên)`}
              </button>
            </div>
          </div>

          {importSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg text-left">
                <div className="text-[11px] font-bold text-[#1f2937] uppercase">Tổng nhận diện</div>
                <div className="text-[18px] font-bold text-[#003087] mt-0.5 font-mono">{importSummary.totalUnique} SV</div>
              </div>
              <div className="p-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg text-left">
                <div className="text-[11px] font-bold text-[#1f2937] uppercase">Đăng ký KTCN</div>
                <div className="text-[18px] font-bold text-[#1f2937] mt-0.5 font-mono">{importSummary.ktcnCount} SV</div>
              </div>
              <div className="p-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg text-left">
                <div className="text-[11px] font-bold text-[#1f2937] uppercase">Đăng ký TSNN</div>
                <div className="text-[18px] font-bold text-[#1f2937] mt-0.5 font-mono">{importSummary.tsnnCount} SV</div>
              </div>
              <div className="p-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg text-left">
                <div className="text-[11px] font-bold text-[#1f2937] uppercase">Học song song 2 môn</div>
                <div className="text-[18px] font-bold text-[#003087] mt-0.5 font-mono">{importSummary.dualCount} SV</div>
              </div>
              <div className="p-3 bg-white border-2 border-[#003087] rounded-lg text-left">
                <div className="text-[11px] font-bold text-[#003087] uppercase">Đang chọn để nạp</div>
                <div className="text-[18px] font-bold text-[#dc2626] mt-0.5 font-mono">{selectedMssvs.length} SV</div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAllPreview}
                className="px-4 py-2 bg-white border border-[#003087] text-[#003087] hover:bg-[#ebf3ff] rounded-lg text-[12px] font-bold cursor-pointer whitespace-nowrap min-w-[120px]"
              >
                {selectedMssvs.length === displayedRows.length ? 'Bỏ chọn tất cả' : `Chọn tất cả (${displayedRows.length})`}
              </button>

              <div className="flex items-center gap-1 border border-[#e5e7eb] rounded-lg p-1 bg-[#f8fafc]">
                <button
                  type="button"
                  onClick={() => setPreviewCourseFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-[11.5px] font-bold transition cursor-pointer whitespace-nowrap ${
                    previewCourseFilter === 'all' ? 'bg-[#003087] text-white' : 'text-[#1f2937] hover:text-[#003087]'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCourseFilter('dual')}
                  className={`px-3 py-1.5 rounded-md text-[11.5px] font-bold transition cursor-pointer whitespace-nowrap ${
                    previewCourseFilter === 'dual' ? 'bg-[#003087] text-white' : 'text-[#1f2937] hover:text-[#003087]'
                  }`}
                >
                  Song song 2 môn
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCourseFilter('KTCN')}
                  className={`px-3 py-1.5 rounded-md text-[11.5px] font-bold transition cursor-pointer whitespace-nowrap ${
                    previewCourseFilter === 'KTCN' ? 'bg-[#003087] text-white' : 'text-[#1f2937] hover:text-[#003087]'
                  }`}
                >
                  Kiến tập (KTCN)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCourseFilter('TSNN')}
                  className={`px-3 py-1.5 rounded-md text-[11.5px] font-bold transition cursor-pointer whitespace-nowrap ${
                    previewCourseFilter === 'TSNN' ? 'bg-[#003087] text-white' : 'text-[#1f2937] hover:text-[#003087]'
                  }`}
                >
                  Tập sự (TSNN)
                </button>
              </div>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                value={previewSearch}
                onChange={e => setPreviewSearch(e.target.value)}
                placeholder="Tìm nhanh theo MSSV, họ tên, lớp..."
                className="w-full px-3.5 py-2 border border-[#e5e7eb] rounded-lg text-[12px] text-[#1f2937] outline-none focus:border-[#003087]"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-[#e5e7eb] rounded-lg max-h-[500px]">
            <table className="w-full text-left text-[12.5px]">
              <thead className="bg-[#f8fafc] text-[#1f2937] font-bold uppercase text-[11px] sticky top-0 border-b border-[#e5e7eb] z-10">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={displayedRows.length > 0 && selectedMssvs.length === displayedRows.length}
                      onChange={handleSelectAllPreview}
                      className="w-4 h-4 accent-[#003087] cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Mã số SV</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3">Lớp</th>
                  <th className="p-3">Chuyên ngành</th>
                  <th className="p-3 text-center">GPA (Hệ 10)</th>
                  <th className="p-3 text-center">Xếp loại</th>
                  <th className="p-3">Học phần đăng ký</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#1f2937] font-bold">
                      Không tìm thấy sinh viên nào khớp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((s, idx) => {
                    const isChecked = selectedMssvs.includes(s.mssv);
                    return (
                      <tr
                        key={s.mssv}
                        onClick={() => handleToggleSelectRow(s.mssv)}
                        className={`transition cursor-pointer ${
                          isChecked ? 'bg-[#ebf3ff]/40 hover:bg-[#ebf3ff]/60' : 'hover:bg-[#f8fafc]'
                        }`}
                      >
                        <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectRow(s.mssv)}
                            className="w-4 h-4 accent-[#003087] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center font-mono text-[#1f2937]">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-[#003087]">{s.mssv}</td>
                        <td className="p-3 font-bold text-[#1f2937]">{s.fullName}</td>
                        <td className="p-3 font-mono text-[#1f2937]">{s.class}</td>
                        <td className="p-3 text-[#1f2937]">{s.major}</td>
                        <td className="p-3 font-mono text-center font-bold text-[#003087]">
                          {s.gpa10 || '—'}
                        </td>
                        <td className="p-3 text-center font-bold text-[#1f2937]">
                          {s.academicRank}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            s.isDualCourse === 1
                              ? 'bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]'
                              : 'bg-[#f8fafc] text-[#1f2937] border border-[#e5e7eb]'
                          }`}>
                            {s.courseCode}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[11px] font-bold text-[#003087]">
                            Hợp lệ
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[12px] text-[#1f2937] pt-2">
            <div>
              Hiển thị <strong>{displayedRows.length}</strong> / {parsedRows.length} sinh viên đã phân tích.
            </div>
            <div>
              Đã đánh dấu chọn: <strong className="text-[#003087]">{selectedMssvs.length}</strong> sinh viên để nạp.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

(window as any).ImportDataPage = ImportDataPage;
