// Certificates Page Component - Chuẩn hóa thiết kế theo Figma Frames (Frame 08 & Frame 09)
// Quản lý Chứng chỉ ngoại ngữ & Tin học, Minh chứng tệp, KPI cards & Modal thêm/sửa chứng chỉ

const CertificatesPage = ({ currentUser }) => {
  const studentId = currentUser?.studentId || '522H0001';
  const studentName = currentUser?.name || 'Nguyễn Minh Anh';

  // State danh sách chứng chỉ ban đầu theo Frame 08
  const [certs, setCerts] = React.useState([]);

  // Tải danh sách chứng chỉ từ Firestore & Lắng nghe Realtime
  React.useEffect(() => {
    const loadCerts = () => {
      if (window.ApiClient?.getStudentCerts) {
        const list = window.ApiClient.getStudentCerts(studentId);
        setCerts(Array.isArray(list) ? list : []);
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
    return () => window.removeEventListener('tdtu_certs_updated', handleUpdate);
  }, [studentId]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCert, setEditingCert] = React.useState(null);
  const [formData, setFormData] = React.useState({
    type: 'Ngoại ngữ',
    name: 'TOEIC',
    score: '825',
    maxScore: '990',
    level: 'B2',
    examDate: '2025-05-18',
    fileName: 'TOEIC_522H0001.pdf',
    fileType: 'PDF',
    fileSize: '1,2 MB'
  });

  const [notification, setNotification] = React.useState(null);
  const [showHistory, setShowHistory] = React.useState(false);

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingCert(null);
    setFormData({
      type: 'Ngoại ngữ',
      name: 'TOEIC',
      score: '',
      maxScore: '990',
      level: 'B2',
      examDate: '2025-05-18',
      fileName: 'minh_chung_chung_chi.pdf',
      fileType: 'PDF',
      fileSize: '1,2 MB'
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa (Frame 09)
  const handleOpenEditModal = (cert) => {
    setEditingCert(cert);
    const dateParts = cert.examDate.split('/');
    const formattedDate = dateParts.length === 3 
      ? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
      : '2025-05-18';

    setFormData({
      type: cert.type,
      name: cert.name,
      score: cert.score,
      maxScore: cert.maxScore,
      level: cert.level,
      examDate: formattedDate,
      fileName: cert.fileName,
      fileType: cert.fileType,
      fileSize: cert.fileSize
    });
    setIsModalOpen(true);
  };

  // Xóa chứng chỉ trên Firestore
  const handleDeleteCert = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chứng chỉ này?')) {
      if (window.ApiClient?.deleteStudentCert) {
        await window.ApiClient.deleteStudentCert(studentId, id);
      }
      setCerts(certs.filter(c => c.id !== id));
      setNotification({ type: 'success', text: 'Đã xóa chứng chỉ thành công.' });
    }
  };

  // Lưu chứng chỉ lên Firestore từ modal
  const handleSaveCert = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.score) {
      alert('Vui lòng điền đầy đủ tên chứng chỉ và điểm số.');
      return;
    }

    const dParts = formData.examDate.split('-');
    const displayDate = dParts.length === 3 
      ? `${dParts[2]}/${dParts[1]}/${dParts[0]}`
      : formData.examDate;

    if (editingCert) {
      // Cập nhật
      const updated = {
        ...editingCert,
        ...formData,
        examDate: displayDate,
        studentId
      };
      if (window.ApiClient?.saveStudentCert) {
        await window.ApiClient.saveStudentCert(studentId, updated);
      }
      setCerts(certs.map(c => c.id === editingCert.id ? updated : c));
      setNotification({ type: 'success', text: `Cập nhật thành công chứng chỉ ${formData.name}.` });
    } else {
      // Thêm mới
      const newCert = {
        id: 'cert_' + Date.now(),
        ...formData,
        examDate: displayDate,
        studentId,
        studentName
      };
      if (window.ApiClient?.saveStudentCert) {
        await window.ApiClient.saveStudentCert(studentId, newCert);
      }
      setCerts([newCert, ...certs]);
      setNotification({ type: 'success', text: `Đã thêm mới chứng chỉ ${formData.name}.` });
    }
    setIsModalOpen(false);
  };

  // Stats calculation
  const totalCerts = certs.length;
  const langCerts = certs.filter(c => c.type === 'Ngoại ngữ').length;
  const itCerts = certs.filter(c => c.type === 'Tin học').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Breadcrumb & Page Header (Frame 08) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Chứng chỉ của tôi
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Thêm chứng chỉ</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="font-bold underline ml-4">
            Đóng
          </button>
        </div>
      )}

      {/* 3 Top KPI Stat Cards (Frame 08) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {String(totalCerts).padStart(2, '0')}
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
            Chứng chỉ đã khai báo
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-3xl font-black text-[#003087] dark:text-sky-400 tracking-tight">
            {String(langCerts).padStart(2, '0')}
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
            Chứng chỉ ngoại ngữ
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {String(itCerts).padStart(2, '0')}
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
            Chứng chỉ tin học
          </div>
        </div>

      </div>

      {/* Main Table: Danh sách chứng chỉ (Frame 08) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Title Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Danh sách chứng chỉ
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {studentName} · MSSV {studentId}
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Học kỳ HK1 2025–2026
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-5">Loại</th>
                <th className="py-3 px-5">Tên CC</th>
                <th className="py-3 px-5">Điểm–Thang</th>
                <th className="py-3 px-5">Cấp độ</th>
                <th className="py-3 px-5">Ngày thi</th>
                <th className="py-3 px-5">Minh chứng</th>
                <th className="py-3 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
              {certs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3 p-4">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#003087] dark:text-sky-300 flex items-center justify-center text-xl font-bold border border-blue-100 dark:border-blue-900">
                        📜
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white text-sm">
                        Chưa có chứng chỉ nào được khai báo
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Bạn có thể nhấn nút "Thêm chứng chỉ" phía trên để tải lên minh chứng ngoại ngữ hoặc tin học của mình.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                certs.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750 transition-colors">
                  <td className="py-4 px-5">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      c.type === 'Ngoại ngữ'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#003087] dark:text-sky-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {c.type}
                    </span>
                  </td>

                  <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </td>

                  <td className="py-4 px-5 text-slate-700 dark:text-slate-300 font-semibold">
                    {c.score} / {c.maxScore}
                  </td>

                  <td className="py-4 px-5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                      {c.level}
                    </span>
                  </td>

                  <td className="py-4 px-5 text-slate-600 dark:text-slate-400">
                    {c.examDate}
                  </td>

                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#E31837] flex items-center justify-center font-bold text-[10px] shrink-0 border border-red-100 dark:border-red-900">
                        {c.fileType}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                          {c.fileName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.fileType} · {c.fileSize}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#003087] dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCert(c.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Table Footer (Frame 08) */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span>
            {certs.length > 0 ? `${certs.length} chứng chỉ đã khai báo` : '0 chứng chỉ'}
          </span>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-[#003087] dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{showHistory ? 'Ẩn lịch sử chỉnh sửa' : 'Xem lịch sử chỉnh sửa'}</span>
            <span>→</span>
          </button>
        </div>

      </div>

      {/* History Log Collapsible */}
      {showHistory && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Lịch sử chỉnh sửa minh chứng
          </div>
          <div className="space-y-2 text-xs">
            {certs.length > 0 ? (
              certs.map((c: any, i: number) => (
                <div key={c.id || i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                  <div>
                    <strong>{c.examDate || 'Gần đây'}</strong> — {studentName} cập nhật chứng chỉ <code>{c.name}</code> ({c.score}/{c.maxScore || 'chuẩn'}).
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-400 text-center">
                Chưa có nhật ký chỉnh sửa chứng chỉ nào.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2 Bottom Info Cards (Frame 08) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-[#003087] dark:text-sky-300 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Minh chứng rõ ràng, hồ sơ đầy đủ
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Tải lên bản chụp hoặc bản scan có đầy đủ họ tên, số chứng chỉ và kết quả. Kiểm tra thông tin khớp với nội dung đã khai báo.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md">
              JPG / PNG / PDF
            </span>
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md">
              Tối đa 5 MB / tệp
            </span>
          </div>
        </div>

        {/* Right Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Nhật ký gần nhất
            </h3>
          </div>
          <div className="text-xs space-y-1">
            {certs.length > 0 ? (
              <>
                <div className="text-slate-400 font-medium text-[11px]">
                  {certs[0].examDate || 'Gần đây'} — {studentName}
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Cập nhật minh chứng {certs[0].name} ({certs[0].score || 'Đạt'}).
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-xs">
                Chưa có chứng chỉ nào được tải lên trong đợt này.
              </div>
            )}
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            Lịch sử được lưu để Khoa đối chiếu khi xét hồ sơ tốt nghiệp.
          </div>
        </div>

      </div>

      {/* Modal: Chỉnh sửa / Thêm chứng chỉ (Frame 09) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-xl w-full p-6 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingCert ? 'Chỉnh sửa chứng chỉ' : 'Thêm chứng chỉ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCert} className="space-y-4 text-xs">
              
              {/* Loại & Tên chứng chỉ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Loại chứng chỉ *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  >
                    <option value="Ngoại ngữ">Ngoại ngữ</option>
                    <option value="Tin học">Tin học</option>
                    <option value="Kỹ năng nghề">Kỹ năng nghề</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên chứng chỉ *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: TOEIC, IELTS Academic..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-400">
                Loại hợp lệ: Ngoại ngữ / Tin học / Kỹ năng nghề
              </div>

              {/* Điểm - Thang điểm - Cấp độ */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Điểm đạt được *
                  </label>
                  <input
                    type="text"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    placeholder="VD: 825"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thang điểm tối đa *
                  </label>
                  <input
                    type="text"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                    placeholder="VD: 990"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cấp độ
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                  >
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="Associate">Associate</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              {/* Ngày thi */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ngày thi *
                </label>
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-[#003087] outline-none"
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  Ngày thi không được ở tương lai.
                </div>
              </div>

              {/* Upload Dropzone (Frame 09) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Minh chứng *
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center hover:border-[#003087] transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <svg className="w-6 h-6 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Kéo thả tệp hoặc chọn từ máy tính
                    </div>
                    <div className="text-[10px] text-slate-400">
                      JPG, PNG hoặc PDF · Dung lượng tối đa 5 MB
                    </div>
                  </div>
                </div>

                {/* Uploaded File Pill */}
                <div className="mt-2 p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-200 dark:bg-blue-800 text-[#003087] dark:text-sky-300 flex items-center justify-center font-bold text-[9px]">
                      {formData.fileType}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {formData.fileName}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {formData.fileSize} · Đã tải lên
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Chọn tệp mới')}
                    className="text-[11px] font-bold text-[#003087] dark:text-sky-300 hover:underline"
                  >
                    Thay tệp
                  </button>
                </div>
              </div>

              {/* History snippet inside modal (Frame 09) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-[10px] text-slate-500 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold uppercase text-slate-600 dark:text-slate-400">
                  Lịch sử chỉnh sửa · Chỉ đọc
                </div>
                <div>11/09/2025 · 15:20 — {studentName} cập nhật minh chứng.</div>
                <div>10/09/2025 · 10:05 — {studentName} thêm chứng chỉ.</div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-400">
                  Thông tin chỉ lưu khi bạn xác nhận.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl font-bold shadow-sm"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-4">
        © Khoa Công nghệ Thông tin · Trường Đại học Tôn Đức Thắng
      </div>

    </div>
  );
};

window.CertificatesPage = CertificatesPage;
