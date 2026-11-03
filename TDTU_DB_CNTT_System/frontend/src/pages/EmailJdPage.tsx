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
  const handleApproveJd = async (jd: any) => {
    if (!canUpdate) {
      alert('Bạn không có quyền thẩm duyệt (Yêu cầu quyền Update 5)');
      return;
    }
    const updated = emailJds.map(item => item.id === jd.id ? { ...item, status: 'approved' } : item);
    saveJds(updated);

    try {
      if ((window as any).ApiClient?.publishForwardedJd) {
        await (window as any).ApiClient.publishForwardedJd(jd);
      } else if ((window as any).ApiClient?.approveJd) {
        await (window as any).ApiClient.approveJd({
          id: 'jd_email_' + jd.id,
          company: jd.companyName,
          position: jd.position,
          field: jd.field || 'Phần mềm',
          location: jd.location || 'TP. Hồ Chí Minh',
          deadline: jd.deadline || '15/11/2026',
          slots: Number(jd.slots) || 5,
          salary: jd.salary || 'Hỗ trợ thực tập',
          tags: ['Email Forward', 'TDTU', jd.position],
          summary: jd.rawContent || jd.position,
          description: jd.rawContent || '',
          sourceEmail: jd.emailSender || 'tuyendung@tdtu.edu.vn'
        });
      }
    } catch (err) {
      console.warn('Lỗi xuất bản JD:', err);
    }

    showToast(`Đã duyệt và tự động công bố JD "${jd.position}" lên Bảng tin Sinh viên!`);
    setSelectedJd(null);
  };

  // Từ chối JD
  const handleRejectJd = (id) => {
    if (!canUpdate) return;
    const updated = emailJds.map(item => item.id === id ? { ...item, status: 'rejected' } : item);
    saveJds(updated);
    showToast(' Đã chuyển trạng thái JD sang Từ chối.');
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
    showToast(' Đã xóa email tuyển dụng thành công.');
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
      <div className="max-w-4xl mx-auto p-8 text-center bg-white  rounded-xl border border-[#fecaca]  my-8">
        <div className="text-4xl mb-3"></div>
        <h2 className="text-xl font-bold text-[#dc2626] ">Không có quyền truy cập chức năng</h2>
        <p className="text-sm text-[#1f2937] mt-2">
          Chức năng "Auto forward from email JD" có mã quyền 1 đối với vai trò của bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-[#003087] text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">
            Duyệt JD từ Email Forward
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="inline-flex p-2 bg-[#f1f5f9] rounded-2xl border border-[#e2e8f0] gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-2.5 rounded-xl text-[15px] font-bold transition flex items-center justify-center gap-2.5 min-w-[125px] cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'bg-white text-[#1f2937] border border-[#e2e8f0] hover:bg-[#ebf3ff] hover:text-[#003087]'
            }`}
          >
            <span>Tất cả</span>
            <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${
              filterStatus === 'all' ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#4b5563]'
            }`}>{emailJds.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-6 py-2.5 rounded-xl text-[15px] font-bold transition flex items-center justify-center gap-2.5 min-w-[125px] cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'bg-white text-[#1f2937] border border-[#e2e8f0] hover:bg-[#ebf3ff] hover:text-[#003087]'
            }`}
          >
            <span>Chờ duyệt</span>
            <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${
              filterStatus === 'pending' ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#4b5563]'
            }`}>{emailJds.filter(x => x.status === 'pending').length}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-6 py-2.5 rounded-xl text-[15px] font-bold transition flex items-center justify-center gap-2.5 min-w-[125px] cursor-pointer ${
              filterStatus === 'approved'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'bg-white text-[#1f2937] border border-[#e2e8f0] hover:bg-[#ebf3ff] hover:text-[#003087]'
            }`}
          >
            <span>Đã duyệt</span>
            <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${
              filterStatus === 'approved' ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#4b5563]'
            }`}>{emailJds.filter(x => x.status === 'approved').length}</span>
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm..." style={{ paddingLeft: "44px" }} className="w-full pr-4 py-2.5 text-[14.5px] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:ring-2 focus:ring-[#003087] text-[#1f2937]"
          />
        </div>
      </div>

      {/* Main List of Forwarded Email JDs */}
      <div className="grid grid-cols-1 gap-4">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center bg-white  rounded-xl border border-[#e5e7eb]  text-[#1f2937] text-xs">
            Không tìm thấy email tuyển dụng nào phù hợp.
          </div>
        ) : (
          filteredList.map(jd => {
            const isPending = jd.status === 'pending';
            const isApproved = jd.status === 'approved';
            return (
              <div
                key={jd.id}
                className="bg-white  p-5 rounded-xl border border-[#e5e7eb]  shadow-xs hover:border-blue-400 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-bold text-[#4b5563]">{jd.receivedAt}</span>
                      <span className="text-[#1f2937]">•</span>
                      <span className="text-[13.5px] font-bold text-[#1f2937] ">Từ: <strong className="text-[#1f2937] ">{jd.fromEmail}</strong></span>
                      {isPending && (
                        <span className="px-2 py-0.5 rounded-full text-[13px] font-bold bg-[#f8fafc] text-[#1f2937] px-3 py-1  border border-[#e5e7eb]">
                           Chờ Thẩm Duyệt
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2 py-0.5 rounded-full text-[13px] font-bold bg-[#ebf3ff] text-[#003087] px-3 py-1  border border-[#bfdbfe]">
                           Đã Đăng Tuyển
                        </span>
                      )}
                    </div>
                    <h3 className="text-[18px] font-bold text-[#1f2937] mt-1">
                      {jd.subject}
                    </h3>
                  </div>

                  {/* Action Buttons for Thầy Phúc */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedJd(jd)}
                      className="px-7 py-3 min-w-[180px] h-12 whitespace-nowrap bg-[#f8fafc] hover:bg-[#e5e7eb] text-[#1f2937] border border-[#cbd5e1] rounded-xl text-[14px] font-bold transition cursor-pointer flex items-center justify-center shadow-2xs"
                    >
                      Xem chi tiết email
                    </button>
                    {canUpdate && isPending && (
                      <button
                        type="button"
                        onClick={() => handleApproveJd(jd)}
                        className="px-8 py-3 min-w-[180px] h-12 whitespace-nowrap bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-[14px] font-bold transition flex items-center justify-center gap-2.5 shadow-xs hover:shadow-md cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Duyệt đăng tin</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteJd(jd.id)}
                        className="px-6 py-3 min-w-[110px] h-12 whitespace-nowrap bg-white hover:bg-[#fef2f2] text-[#dc2626] border-2 border-[#fecaca] rounded-xl text-[13.5px] font-bold transition cursor-pointer flex items-center justify-center shadow-2xs"
                        title="Xóa email"
                      >
                        Xóa tin
                      </button>
                    )}
                  </div>
                </div>

                {/* Extracted Structured Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#f8fafc]  rounded-xl border border-[#e5e7eb]  text-xs">
                  <div>
                    <span className="text-[#1f2937] block text-[12.5px] uppercase font-extrabold text-[#4b5563] tracking-wider mb-1">Doanh nghiệp</span>
                    <span className="font-bold text-[#1f2937] text-[15.5px] truncate block">{jd.companyName}</span>
                  </div>
                  <div>
                    <span className="text-[#1f2937] block text-[12.5px] uppercase font-extrabold text-[#4b5563] tracking-wider mb-1">Vị trí</span>
                    <span className="font-bold text-[#003087] text-[15.5px] truncate block">{jd.position}</span>
                  </div>
                  <div>
                    <span className="text-[#1f2937] block text-[12.5px] uppercase font-extrabold text-[#4b5563] tracking-wider mb-1">Chỉ tiêu / Lương</span>
                    <span className="font-bold text-[#1f2937] text-[15px]">{jd.slots} SV · {jd.salary}</span>
                  </div>
                  <div>
                    <span className="text-[#1f2937] block text-[12.5px] uppercase font-extrabold text-[#4b5563] tracking-wider mb-1">Hạn nộp hồ sơ</span>
                    <span className="font-mono font-bold text-[#dc2626] text-[15px]">{jd.deadline}</span>
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
          <div className="bg-white  w-full max-w-4xl rounded-2xl shadow-2xl border border-[#e5e7eb]  p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e5e7eb]  pb-3">
              <h3 className="font-black text-sm text-[#1f2937]  uppercase">
                Chi tiết Email Tuyển dụng Gốc
              </h3>
              <button
                type="button"
                onClick={() => setSelectedJd(null)}
                className="text-[#1f2937] hover:text-[#1f2937]  text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-[#1f2937]">Tiêu đề:</span>
                <div className="text-sm font-bold text-[#1f2937]  mt-0.5">{selectedJd.subject}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#f8fafc]  rounded-xl">
                <div>Người gửi: <strong>{selectedJd.senderName}</strong> ({selectedJd.fromEmail})</div>
                <div>Thời gian nhận: <strong>{selectedJd.receivedAt}</strong></div>
                <div>Doanh nghiệp: <strong>{selectedJd.companyName}</strong></div>
                <div>Địa điểm: <strong>{selectedJd.location}</strong></div>
              </div>
              <div>
                <span className="font-bold text-[#1f2937]">Nội dung thư gốc (Raw Body):</span>
                <pre className="mt-1 p-3.5 bg-[#f8fafc]  rounded-xl text-[11px] text-[#1f2937]  font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-[#e5e7eb] ">
                  {selectedJd.rawBody}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e5e7eb] ">
              <button
                type="button"
                onClick={() => setSelectedJd(null)}
                className="px-4 py-2 border border-[#e5e7eb]  rounded-xl text-xs font-semibold text-[#1f2937]  hover:bg-[#f8fafc] cursor-pointer"
              >
                Đóng
              </button>
              {canUpdate && selectedJd.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => handleApproveJd(selectedJd)}
                  className="px-8 py-3 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-[13px] font-bold transition shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap min-w-[180px]"
                >
                  Duyệt & Công bố JD
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
