// ExportDataPage.jsx - Trung tâm Kết xuất Dữ liệu & Báo cáo Excel
// Chức năng 11 theo Ma trận Phân quyền Nguyên tố (Thầy Phúc: 34, Giảng viên: 1, Sinh viên: 1)

const ExportDataPage = ({ currentUser, onNavigateTab }) => {
  const roleKey = window.PrimeRbac?.getUserRoleKey?.(currentUser) || 'thay_phuc';
  const mask = window.PrimeRbac?.getFeatureMask?.(currentUser, 'export') || 34;

  const canRead = window.PrimeRbac?.hasPrimePermission(mask, 2);
  const canExport = window.PrimeRbac?.hasPrimePermission(mask, 17);

  const [selectedSemester, setSelectedSemester] = React.useState('hk1_2026_2027');
  const [students, setStudents] = React.useState([]);
  const [exportingType, setExportingType] = React.useState(null);
  const [toastMessage, setToastMessage] = React.useState(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        let list = [];
        if (window.ApiClient?.getStudents) {
          try {
            const res = await window.ApiClient.getStudents({ semester: selectedSemester });
            list = res?.items || res?.students || (Array.isArray(res) ? res : []);
          } catch {}
        }
        if ((!list || list.length === 0) && window.ApiClient?.getLiveStudents) {
          list = await window.ApiClient.getLiveStudents(selectedSemester);
        }
        setStudents(Array.isArray(list) ? list : []);
      } catch {}
    };
    load();

    const handleRealtimeUpdate = () => { load(); };
    window.addEventListener('tdtu_data_updated', handleRealtimeUpdate);
    window.addEventListener('tdtu_decl_updated', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);
    window.addEventListener('focus', handleRealtimeUpdate);

    let bc = null;
    try {
      bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.onmessage = () => { load(); };
    } catch {}

    return () => {
      window.removeEventListener('tdtu_data_updated', handleRealtimeUpdate);
      window.removeEventListener('tdtu_decl_updated', handleRealtimeUpdate);
      window.removeEventListener('storage', handleRealtimeUpdate);
      window.removeEventListener('focus', handleRealtimeUpdate);
      if (bc) { try { bc.close(); } catch {} }
    };
  }, [selectedSemester]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Xuất danh sách sinh viên thực tập (.xlsx)
  const handleExportStudents = () => {
    if (!canExport) {
      alert('Bạn không có quyền Export dữ liệu (Yêu cầu quyền Export 17)');
      return;
    }
    setExportingType('students');
    setTimeout(() => {
      try {
        if (window.ApiClient?.exportStudentsExcel) {
          window.ApiClient.exportStudentsExcel(students, selectedSemester);
        } else {
          // Fallback direct XLSX export
          const exportData = students.map((s, idx) => ({
            'STT': idx + 1,
            'MSSV': s.mssv || s.studentId,
            'Họ và tên': s.name || s.fullName,
            'Lớp': s.class || s.className,
            'Ngành': s.major,
            'Học phần': s.course_str || 'KTCN & TSNN',
            'Điểm GPA (Hệ 4)': s.gpa4 || 3.12,
            'Trạng thái': s.status || 'Chưa có nơi',
            'Doanh nghiệp': s.company || 'Chưa có',
            'Vị trí thực tập': s.position || 'Thực tập sinh',
            'Cán bộ hướng dẫn (Mentor)': s.contactPerson || '—',
            'SĐT Cán bộ hướng dẫn': s.contactPhone || '—',
            'Ngày cập nhật': s.updated || new Date().toLocaleDateString('vi-VN')
          }));
          const ws = window.XLSX.utils.json_to_sheet(exportData);
          const wb = window.XLSX.utils.book_new();
          window.XLSX.utils.book_append_sheet(wb, ws, 'DanhSachSinhVien');
          window.XLSX.writeFile(wb, `TDTU_DS_SinhVien_${selectedSemester.toUpperCase()}.xlsx`);
        }
        showToast(' Đã xuất file Danh sách Sinh viên (.xlsx) thành công!');
      } catch (err) {
        alert('Lỗi xuất Excel: ' + err.message);
      } finally {
        setExportingType(null);
      }
    }, 500);
  };

  // 2. Xuất danh sách chứng chỉ tiếng Anh (.xlsx)
  const handleExportCerts = async () => {
    if (!canExport) return;
    setExportingType('certs');
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

      // Merge cached certs from localStorage
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
        showToast(' Hiện tại chưa có chứng chỉ ngoại ngữ nào được sinh viên nộp lên hệ thống.');
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
        'Link Google Drive': c.driveLink || c.drive_link || c.proofData || '—',
        'Trạng thái': c.status === 'approved' || c.status === 'Đã duyệt' || c.status === 'Đã nộp' ? (c.status || 'Hợp lệ') : 'Chờ đối chiếu'
      }));

      const ws = window.XLSX.utils.json_to_sheet(rows);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'ChungChiTiengAnh');
      window.XLSX.writeFile(wb, `TDTU_ChungChi_TiengAnh_${selectedSemester.toUpperCase()}.xlsx`);
      showToast(' Đã xuất file Bảng tổng hợp Chứng chỉ (.xlsx) thành công!');
    } catch (err) {
      alert('Lỗi xuất chứng chỉ: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  // 3. Xuất danh sách phân bổ doanh nghiệp tiếp nhận
  const handleExportCompanies = () => {
    if (!canExport) return;
    setExportingType('companies');
    try {
      const companyMap = new Map();
      students.forEach(s => {
        const comp = s.company || 'Chưa có';
        if (comp !== 'Chưa có' && comp !== '') {
          if (!companyMap.has(comp)) {
            companyMap.set(comp, {
              company: comp,
              count: 0,
              students: []
            });
          }
          const item = companyMap.get(comp);
          item.count++;
          item.students.push(s.name || s.fullName);
        }
      });

      const rows = Array.from(companyMap.values()).map((c, idx) => ({
        'STT': idx + 1,
        'Tên Doanh Nghiệp': c.company,
        'Số lượng SV Tiếp Nhận': c.count,
        'Danh sách Sinh viên': c.students.join('; ')
      }));

      const ws = window.XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Thông báo': 'Chưa có dữ liệu phân bổ' }]);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'PhanBoDoanhNghiep');
      window.XLSX.writeFile(wb, `TDTU_PhanBo_DoanhNghiep_${selectedSemester.toUpperCase()}.xlsx`);
      showToast(' Đã xuất Báo cáo Doanh nghiệp tiếp nhận (.xlsx) thành công!');
    } catch (err) {
      alert('Lỗi xuất báo cáo: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  if (!canRead || !canExport) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white  rounded-xl border border-[#fecaca]  my-8">
        <div className="text-4xl mb-3"></div>
        <h2 className="text-xl font-bold text-[#dc2626] ">Không có quyền truy cập chức năng</h2>
        <p className="text-sm text-[#1f2937] mt-2">
          Chức năng "Export dữ liệu" chỉ dành riêng cho Thầy Phúc (Admin Khoa - Mã quyền 34).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-[#003087] text-white text-[14.5px] font-bold rounded-xl shadow-lg flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">
            Trung tâm Export Dữ liệu & Báo cáo
          </h1>
        </div>

        {/* Semester Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-bold text-[#1f2937]">Học kỳ:</span>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="px-4 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-[14.5px] font-bold text-[#1f2937]  outline-none shadow-xs"
          >
            <option value="hk1_2026_2027">Học kỳ 1 / 2026–2027</option>
            <option value="hk2_2025_2026">Học kỳ 2 / 2025–2026</option>
            <option value="hk1_2025_2026">Học kỳ 1 / 2025–2026</option>
          </select>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Danh sách sinh viên */}
        <div className="bg-white  p-6 rounded-xl border border-[#e5e7eb]  shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#ebf3ff]  text-[#003087] flex items-center justify-center font-bold text-lg mb-3">
              
            </div>
            <h3 className="text-[18px] font-bold text-[#1f2937] ">
              Danh sách Sinh viên Thực tập
            </h3>
            <p className="text-[14.5px] text-[#1f2937]  mt-1 leading-relaxed">
              Xuất toàn bộ {students.length} sinh viên gồm MSSV, Họ tên, Lớp, Ngành, Môn học, Doanh nghiệp tiếp nhận và Điểm GPA.
            </p>
          </div>

          <div className="pt-3 border-t border-[#e5e7eb] ">
            <button
              type="button"
              disabled={exportingType === 'students'}
              onClick={handleExportStudents}
              className="w-full py-3 bg-[#003087] hover:bg-[#002266] disabled:opacity-40 text-white rounded-xl text-[14.5px] font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{exportingType === 'students' ? 'Đang xuất...' : ' Tải file Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Chứng chỉ tiếng Anh */}
        <div className="bg-white  p-6 rounded-xl border border-[#e5e7eb]  shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#ebf3ff]  text-[#003087]  flex items-center justify-center font-bold text-lg mb-3">
              
            </div>
            <h3 className="text-base font-bold text-[#1f2937] ">
              Bảng Tổng hợp Chứng chỉ ĐBCL
            </h3>
            <p className="text-[14.5px] text-[#1f2937]  mt-1 leading-relaxed">
              Xuất danh sách sinh viên đã nộp chứng chỉ tiếng Anh (Aptis, TOEIC, IELTS...), điểm số, cấp độ CEFR và link Drive đối chiếu.
            </p>
          </div>

          <div className="pt-3 border-t border-[#e5e7eb] ">
            <button
              type="button"
              disabled={exportingType === 'certs'}
              onClick={handleExportCerts}
              className="w-full py-3 bg-[#003087] hover:bg-blue-800 disabled:opacity-40 text-white rounded-xl text-[14.5px] font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{exportingType === 'certs' ? 'Đang xuất...' : ' Tải file Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Phân bổ doanh nghiệp */}
        <div className="bg-white  p-6 rounded-xl border border-[#e5e7eb]  shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#ebf3ff]  text-[#003087] flex items-center justify-center font-bold text-lg mb-3">
              <svg className="w-4 h-4 text-[#003087] inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 className="text-base font-bold text-[#1f2937] ">
              Báo cáo Doanh nghiệp Tiếp nhận
            </h3>
            <p className="text-[14.5px] text-[#1f2937]  mt-1 leading-relaxed">
              Thống kê số lượng sinh viên tiếp nhận theo từng đối tác doanh nghiệp, phục vụ công tác liên kết và khen thưởng.
            </p>
          </div>

          <div className="pt-3 border-t border-[#e5e7eb] ">
            <button
              type="button"
              disabled={exportingType === 'companies'}
              onClick={handleExportCompanies}
              className="w-full py-2.5 bg-[#ebf3ff] hover:bg-[#ebf3ff] disabled:opacity-40 text-white rounded-xl text-[14.5px] font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{exportingType === 'companies' ? 'Đang xuất...' : ' Tải file Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

window.ExportDataPage = ExportDataPage;
