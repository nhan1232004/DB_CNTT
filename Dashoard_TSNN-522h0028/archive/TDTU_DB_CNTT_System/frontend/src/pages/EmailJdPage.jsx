// EmailJdPage.jsx - Auto Forward from Email JD Management Component
// Chức năng 8 theo Ma trận Phân quyền Nguyên tố (Thầy Phúc: 210, Giảng viên: 2, Sinh viên: 1)

const EmailJdPage = ({ currentUser, onNavigateTab }) => {
  const roleKey = window.PrimeRbac?.getUserRoleKey?.(currentUser) || 'thay_phuc';
  const mask = window.PrimeRbac?.getFeatureMask?.(currentUser, 'email_jd') || 210;

  const canRead = window.PrimeRbac?.hasPrimePermission(mask, 2);
  const canCreate = window.PrimeRbac?.hasPrimePermission(mask, 3);
  const canUpdate = window.PrimeRbac?.hasPrimePermission(mask, 5);
  const canDelete = window.PrimeRbac?.hasPrimePermission(mask, 7);

  // Danh sách email JD mô phỏng đã tiếp nhận qua luồng forwarding
  const [emailJds, setEmailJds] = React.useState(() => {
    try {
      const saved = localStorage.getItem('tdtu_email_forwarded_jds');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'em-001',
        fromEmail: 'tuyendung@fpt.com',
        senderName: 'HR FPT Software HCM',
        subject: 'FPT Software tuyển dụng 25 Thực tập sinh Java & Frontend React HK1 2026-2027',
        receivedAt: '2026-10-28 09:15',
        companyName: 'Công ty TNHH Phần mềm FPT (FPT Software HCM)',
        taxCode: '0101778115',
        position: 'Thực tập sinh Phần mềm (Java / ReactJS)',
        slots: 25,
        salary: '6.000.000 - 8.500.000 VNĐ/tháng',
        location: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM',
        deadline: '2026-11-20',
        status: 'pending', // 'pending' | 'approved' | 'rejected'
        rawBody: 'Kính gửi Khoa CNTT - Đại học Tôn Đức Thắng,\nFPT Software trân trọng gửi quý Khoa thông tin đợt tuyển dụng Thực tập sinh Doanh nghiệp đợt 1 năm học 2026-2027...'
      },
      {
        id: 'em-002',
        fromEmail: 'recruitment@kms-technology.com',
        senderName: 'Talent Acquisition Team KMS',
        subject: '[KMS Technology] Tuyển dụng Intern QA/QC Automation & Software Tester',
        receivedAt: '2026-10-29 14:30',
        companyName: 'KMS Technology Vietnam',
        taxCode: '0309998877',
        position: 'Thực tập sinh Kiểm thử Phần mềm (Automation QA)',
        slots: 12,
        salary: '5.500.000 - 7.500.000 VNĐ/tháng',
        location: 'Số 2 Tản Viên, Q. Tân Bình, TP.HCM',
        deadline: '2026-11-25',
        status: 'approved',
        rawBody: 'Dear TDTU Faculty of Information Technology,\nKMS Technology is seeking passionate student interns for QA Automation...'
      },
      {
        id: 'em-003',
        fromEmail: 'hr@vng.com.vn',
        senderName: 'VNG Campus Recruitment',
        subject: 'VNG Tech Fresher & Intern Program 2026 - Data Engineering & AI Track',
        receivedAt: '2026-10-30 08:00',
        companyName: 'Công ty Cổ phần VNG',
        taxCode: '0303576603',
        position: 'AI & Data Engineering Intern',
        slots: 10,
        salary: '8.000.000 - 10.000.000 VNĐ/tháng',
        location: 'VNG Campus, Khu chế xuất Tân Thuận, Q.7, TP.HCM',
        deadline: '2026-11-30',
        status: 'pending',
        rawBody: 'Kính gửi Ban Chủ nhiệm Khoa CNTT TDTU,\nVNG mở cổng tiếp nhận sinh viên thực tập các mảng AI, NLP và Big Data...'
      }
    ];
  });

  const [selectedJd, setSelectedJd] = React.useState(null);
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState(null);

  // Lưu state vào localStorage
  const saveJds = (list) => {
    setEmailJds(list);
    try {
      localStorage.setItem('tdtu_email_forwarded_jds', JSON.stringify(list));
    } catch {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Duyệt đăng tuyển JD (Create/Update -> Post to Bulletin)
  const handleApproveJd = (jd) => {
    if (!canUpdate) {
      alert('Bạn không có quyền thẩm duyệt (Yêu cầu quyền Update 5)');
      return;
    }
    const updated = emailJds.map(item => item.id === jd.id ? { ...item, status: 'approved' } : item);
    saveJds(updated);
    showToast(`✓ Đã duyệt và tự động công bố JD "${jd.position}" lên Bảng tin Sinh viên!`);
    setSelectedJd(null);
  };

  // Từ chối JD
  const handleRejectJd = (id) => {
    if (!canUpdate) return;
    const updated = emailJds.map(item => item.id === id ? { ...item, status: 'rejected' } : item);
    saveJds(updated);
    showToast('✓ Đã chuyển trạng thái JD sang Từ chối.');
    setSelectedJd(null);
  };

  // Xóa JD
  const handleDeleteJd = (id) => {
    if (!canDelete) {
      alert('Bạn không có quyền xóa bản ghi (Yêu cầu quyền Delete 7)');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa thư tuyển dụng này khỏi hệ thống?')) return;
    const updated = emailJds.filter(item => item.id !== id);
    saveJds(updated);
    showToast('✓ Đã xóa email tuyển dụng thành công.');
    setSelectedJd(null);
  };

  const filteredList = emailJds.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.companyName.toLowerCase().includes(q) ||
        item.position.toLowerCase().includes(q) ||
        item.fromEmail.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!canRead) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 my-8">
        <div className="text-4xl mb-3">🚫</div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Không có quyền truy cập chức năng</h2>
        <p className="text-sm text-slate-500 mt-2">
          Chức năng "Auto forward from email JD" có mã quyền 1 đối với vai trò của bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#003087] dark:text-sky-300 flex items-center justify-center text-lg font-bold">
              📨
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Duyệt JD từ Email Forward</span>
                <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#003087] dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                  Mã quyền: {mask}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tự động nhận diện và trích xuất tin tuyển dụng chuyển tiếp từ hộp thư doanh nghiệp (Forwarded Email)
              </p>
            </div>
          </div>
        </div>

        {/* Forward Email Gateway Badge */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">Gateway nhận tin tự động:</div>
            <code className="text-[11px] font-mono text-blue-600 dark:text-sky-400">thuctap.cntt-inbound@tdtu.edu.vn</code>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tất cả ({emailJds.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Chờ duyệt ({emailJds.filter(x => x.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Đã duyệt ({emailJds.filter(x => x.status === 'approved').length})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo doanh nghiệp, vị trí, email..."
            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Main List of Forwarded Email JDs */}
      <div className="grid grid-cols-1 gap-4">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
            Không tìm thấy email tuyển dụng nào phù hợp.
          </div>
        ) : (
          filteredList.map(jd => {
            const isPending = jd.status === 'pending';
            const isApproved = jd.status === 'approved';
            return (
              <div
                key={jd.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-400 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{jd.receivedAt}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Từ: <strong className="text-slate-800 dark:text-slate-200">{jd.fromEmail}</strong></span>
                      {isPending && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200">
                          ⏳ Chờ Thẩm Duyệt
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                          ✓ Đã Đăng Tuyển
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {jd.subject}
                    </h3>
                  </div>

                  {/* Action Buttons for Thầy Phúc */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedJd(jd)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Xem chi tiết email
                    </button>
                    {canUpdate && isPending && (
                      <button
                        type="button"
                        onClick={() => handleApproveJd(jd)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        ✓ Duyệt đăng tin
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteJd(jd.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Xóa email"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Extracted Structured Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Doanh nghiệp</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{jd.companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Vị trí</span>
                    <span className="font-bold text-[#003087] dark:text-sky-400 truncate block">{jd.position}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Chỉ tiêu / Lương</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{jd.slots} SV · {jd.salary}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Hạn nộp hồ sơ</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{jd.deadline}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Xem chi tiết Email Raw & Chỉnh sửa */}
      {selectedJd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                Chi tiết Email Tuyển dụng Gốc
              </h3>
              <button
                type="button"
                onClick={() => setSelectedJd(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-500">Tiêu đề:</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedJd.subject}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>Người gửi: <strong>{selectedJd.senderName}</strong> ({selectedJd.fromEmail})</div>
                <div>Thời gian nhận: <strong>{selectedJd.receivedAt}</strong></div>
                <div>Doanh nghiệp: <strong>{selectedJd.companyName}</strong></div>
                <div>Địa điểm: <strong>{selectedJd.location}</strong></div>
              </div>
              <div>
                <span className="font-bold text-slate-500">Nội dung thư gốc (Raw Body):</span>
                <pre className="mt-1 p-3.5 bg-slate-100 dark:bg-slate-950 rounded-xl text-[11px] text-slate-800 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800">
                  {selectedJd.rawBody}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedJd(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              {canUpdate && selectedJd.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => handleApproveJd(selectedJd)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  ✓ Duyệt & Công bố JD
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

window.EmailJdPage = EmailJdPage;
