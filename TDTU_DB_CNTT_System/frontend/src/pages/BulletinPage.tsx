// Bulletin Page Component - Chuẩn hóa thiết kế theo TDTU Enterprise Design System
// 1. Màu sắc giao diện: Trắng (#ffffff), Xanh dương (#003087), Đỏ (#dc2626)
// 2. Màu chữ: Chỉ Đen (#1f2937) và Đỏ (#dc2626)
// 3. Phông chữ: Body 11px-13px, Tiêu đề in đậm (font-bold)
// 4. Bố cục: Cân đối, chuẩn doanh nghiệp, văn bản mô tả căn đều (justify)
// 5. Tuyệt đối không dùng Emoji, sử dụng SVG vector chuyên nghiệp

const BulletinPage = ({ currentUser }) => {
  const isStudent = currentUser?.role === 'student';
  const isAdmin = Boolean(currentUser?.isAdmin);
  const isLecturer = currentUser?.role === 'lecturer';
  const isPartner = currentUser?.role === 'partner';

  // Sub-tab cho Giảng viên: 'review' | 'manage'
  const [lecturerSubTab, setLecturerSubTab] = React.useState('review');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [fieldFilter, setFieldFilter] = React.useState('all');
  const [validityFilter, setValidityFilter] = React.useState('valid');
  const [sortBy, setSortBy] = React.useState('deadline');

  // Selected JD for detail modal
  const [selectedJdModal, setSelectedJdModal] = React.useState(null);
  const [notification, setNotification] = React.useState(null);

  // Email Parser & Create Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [rawEmailText, setRawEmailText] = React.useState('');
  const [parsingEmail, setParsingEmail] = React.useState(false);

  // Dữ liệu Bảng tin JD, Hàng đợi Duyệt & Thông báo Giảng viên
  const [publishedJds, setPublishedJds] = React.useState([]);
  const [reviewQueue, setReviewQueue] = React.useState([]);
  const [announcements, setAnnouncements] = React.useState([]);
  const [showBroadcastModal, setShowBroadcastModal] = React.useState(false);

  // Modal Đăng thông báo mới từ Giảng viên / Admin
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = React.useState(false);
  const [newAnnouncement, setNewAnnouncement] = React.useState({
    title: '',
    content: '',
    priority: 'normal',
    pinned: false
  });
  const [savingAnnouncement, setSavingAnnouncement] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      if (window.ApiClient) {
        setPublishedJds(window.ApiClient.getPublishedJds());
        setReviewQueue(window.ApiClient.getJdReviewQueue());

        // Hợp nhất thông báo học vụ hệ thống (tdtu_notifications) và thông báo giảng viên
        const sysNotifs = (window.ApiClient.getNotifications ? window.ApiClient.getNotifications(currentUser) : []) || [];
        const normSysNotifs = sysNotifs.map((n: any) => ({
          id: n.id,
          title: n.title || n.subject || 'Thông báo học vụ',
          content: n.content || '',
          priority: n.priority || 'normal',
          date: n.timestamp || n.time || (n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : '01/09/2026'),
          author: n.senderName || 'Ban Quản trị Khoa CNTT',
          authorRole: n.senderRole === 'admin' ? 'Ban Quản trị Khoa' : 'Giảng viên',
          targetAudience: n.targetAudienceLabel || n.targetAudience || 'Toàn trường',
          isBroadcast: true
        }));

        let lecturerAncs = window.ApiClient.getLecturerAnnouncements ? window.ApiClient.getLecturerAnnouncements() : [];
        if (window.ApiClient.fetchLecturerAnnouncements) {
          try {
            const remoteAncs = await window.ApiClient.fetchLecturerAnnouncements();
            if (Array.isArray(remoteAncs)) lecturerAncs = remoteAncs;
          } catch {}
        }

        const seenIds = new Set();
        const merged = [];
        for (const item of [...normSysNotifs, ...lecturerAncs]) {
          if (item && item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            merged.push(item);
          }
        }
        setAnnouncements(merged);
      }
    };
    loadData();

    const handleJds = (e) => { if (e.detail) setPublishedJds(e.detail); else loadData(); };
    const handleQueue = (e) => { if (e.detail) setReviewQueue(e.detail); else loadData(); };
    const handleAncs = (e) => { if (e.detail) setAnnouncements(e.detail); else loadData(); };
    const handleStorage = () => { loadData(); };

    let bc = null;
    try {
      bc = new BroadcastChannel('tdtu_realtime_sync');
      bc.onmessage = (msg) => {
        if (!msg.data || msg.data.type === 'announcements_updated' || msg.data.type === 'jd_updated' || msg.data.type === 'notification_sent') {
          loadData();
        }
      };
    } catch {}

    window.addEventListener('tdtu_jds_updated', handleJds);
    window.addEventListener('tdtu_jd_queue_updated', handleQueue);
    window.addEventListener('tdtu_announcements_updated', handleAncs);
    window.addEventListener('tdtu_notification_sent', loadData);
    window.addEventListener('tdtu_notification_received', loadData);
    window.addEventListener('tdtu_notifications_updated', loadData);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);
    return () => {
      window.removeEventListener('tdtu_jds_updated', handleJds);
      window.removeEventListener('tdtu_jd_queue_updated', handleQueue);
      window.removeEventListener('tdtu_announcements_updated', handleAncs);
      window.removeEventListener('tdtu_notification_sent', loadData);
      window.removeEventListener('tdtu_notification_received', loadData);
      window.removeEventListener('tdtu_notifications_updated', loadData);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
      if (bc) { try { bc.close(); } catch {} }
    };
  }, [currentUser]);

  const handleSelectAsInternship = async (jd) => {
    try {
      const studentId = currentUser?.studentId || '522H0045';
      const existing = JSON.parse(localStorage.getItem('tdtu_decl_' + studentId) || '{}');
      const updated = {
        ...existing,
        studentId,
        internshipStatus: 'has_company',
        companyName: jd.company,
        taxCode: jd.taxCode,
        address: jd.address,
        position: jd.position,
        contactPerson: jd.contact?.split('·')[0]?.trim() || '',
        contactEmail: jd.contact?.split('·')[1]?.trim() || jd.sourceEmail || '',
        isConfirmed: true
      };
      localStorage.setItem('tdtu_decl_' + studentId, JSON.stringify(updated));

      if (window.ApiClient?.applyToJd) {
        await window.ApiClient.applyToJd(studentId, jd.id, {
          companyName: jd.company,
          taxCode: jd.taxCode,
          position: jd.position
        });
      }
      if (window.ApiClient?.declareInternship) {
        await window.ApiClient.declareInternship(updated);
      }

      setNotification({
        type: 'success',
        text: `Đã chọn [${jd.company}] làm đơn vị thực tập và tự động cập nhật vào Hồ sơ khai báo của bạn!`
      });
      setSelectedJdModal(null);
    } catch (e) {
      alert('Lỗi lưu đăng ký: ' + e.message);
    }
  };

  const handleApproveReview = async (item: any) => {
    try {
      if ((window as any).ApiClient?.approveJdReview) {
        await (window as any).ApiClient.approveJdReview(item);
      } else if ((window as any).ApiClient?.approveJd) {
        await (window as any).ApiClient.approveJd(item);
      }
      setNotification({
        type: 'success',
        text: `Đã phê duyệt và xuất bản tin tuyển dụng của [${item.company}] lên Bảng tin sinh viên!`
      });
      if ((window as any).ApiClient?.getPublishedJds) {
        setPublishedJds((window as any).ApiClient.getPublishedJds());
      }
      if ((window as any).ApiClient?.getJdReviewQueue) {
        setReviewQueue((window as any).ApiClient.getJdReviewQueue());
      }
    } catch (e: any) {
      alert('Lỗi duyệt: ' + e.message);
    }
  };

  const handleRejectReview = async (item: any) => {
    try {
      if ((window as any).ApiClient?.rejectJdReview) {
        await (window as any).ApiClient.rejectJdReview(item);
      } else if ((window as any).ApiClient?.rejectJd) {
        await (window as any).ApiClient.rejectJd(item.id);
      }
      setNotification({
        type: 'success',
        text: `Đã từ chối tin tuyển dụng của [${item.company}].`
      });
      if ((window as any).ApiClient?.getJdReviewQueue) {
        setReviewQueue((window as any).ApiClient.getJdReviewQueue());
      }
    } catch (e: any) {
      alert('Lỗi từ chối: ' + e.message);
    }
  };

  const handleParseEmail = async () => {
    if (!rawEmailText.trim()) return;
    setParsingEmail(true);
    try {
      let companyName = 'Doanh nghiệp Đối tác';
      const lines = rawEmailText.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes('công ty') || line.toLowerCase().includes('tập đoàn') || line.toLowerCase().includes('company')) {
          companyName = line.replace(/công ty|tnhh|cổ phần|cp|tập đoàn/gi, '').trim() || companyName;
          break;
        }
      }

      const newQueueItem = {
        id: 'JD_' + Date.now(),
        company: isPartner ? (currentUser?.companyName || currentUser?.name || companyName) : companyName,
        taxCode: currentUser?.taxCode || '0101778115',
        position: 'Thực tập sinh Công nghệ Thông tin',
        senderEmail: currentUser?.email || 'forwarded-partner@tdtu.edu.vn',
        emailDate: new Date().toLocaleDateString('vi-VN'),
        field: currentUser?.field || 'Phần mềm',
        slots: 2,
        salary: '4.500.000 VNĐ/tháng',
        summary: rawEmailText.slice(0, 160) + '...',
        pdfFile: 'JD_Attached_' + (companyName.replace(/\s+/g, '')) + '.pdf',
        status: 'Chờ duyệt'
      };

      if (window.ApiClient?.createJd) {
        await window.ApiClient.createJd(newQueueItem, isPartner ? 'partner' : 'lecturer');
      }

      setIsEmailModalOpen(false);
      setRawEmailText('');
      setNotification({
        type: 'success',
        text: isPartner
          ? `Tin tuyển dụng từ [${companyName}] đã được gửi tới Khoa CNTT để phê duyệt.`
          : 'Bóc tách Email Forward thành công! JD mới đã được thêm vào hàng đợi duyệt.'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        text: err?.message || 'Không thể bóc tách nội dung email.'
      });
    } finally {
      setParsingEmail(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    if (e) e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      alert('Vui lòng nhập Tiêu đề và Nội dung thông báo.');
      return;
    }
    setSavingAnnouncement(true);
    try {
      if (window.ApiClient?.createLecturerAnnouncement) {
        await window.ApiClient.createLecturerAnnouncement({
          ...newAnnouncement,
          author: currentUser?.name || 'Giảng viên Khoa CNTT',
          authorRole: currentUser?.department || (isAdmin ? 'Ban Quản trị Khoa CNTT' : 'Giảng viên Hướng dẫn')
        });
      }
      try {
        const bc = new BroadcastChannel('tdtu_realtime_sync');
        bc.postMessage({ type: 'new_announcement', announcement: { ...newAnnouncement, author: currentUser?.name || 'Giảng viên Khoa CNTT', date: new Date().toLocaleDateString('vi-VN') } });
        bc.close();
      } catch {}
      window.dispatchEvent(new CustomEvent('tdtu_announcements_updated', { detail: { ...newAnnouncement, author: currentUser?.name || 'Giảng viên Khoa CNTT', date: new Date().toLocaleDateString('vi-VN') } }));

      setNotification({ type: 'success', text: 'Đã đăng thông báo mới thành công lên Bảng tin!' });
      setIsAnnouncementModalOpen(false);
      setNewAnnouncement({ title: '', content: '', priority: 'normal', pinned: false });
    } catch (err) {
      alert('Lỗi đăng thông báo: ' + err.message);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    try {
      if (String(id).startsWith('notif_')) {
        if (window.ApiClient?.deleteNotification) {
          await window.ApiClient.deleteNotification(id, currentUser);
        }
      } else {
        if (window.ApiClient?.deleteLecturerAnnouncement) {
          await window.ApiClient.deleteLecturerAnnouncement(id);
        }
      }
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      setNotification({ type: 'success', text: 'Đã xóa thông báo thành công.' });
    } catch (err) {
      alert('Lỗi xóa thông báo: ' + err.message);
    }
  };

  const filteredJds = publishedJds.filter(jd => {
    if (fieldFilter !== 'all' && jd.field !== fieldFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCompany = jd.company.toLowerCase().includes(q);
      const matchPos = jd.position.toLowerCase().includes(q);
      const matchTag = jd.tags.some(t => t.toLowerCase().includes(q));
      if (!matchCompany && !matchPos && !matchTag) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 w-full pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-bold text-[#1f2937] text-left">
            {isStudent 
              ? 'Bảng tin cơ hội thực tập doanh nghiệp' 
              : isPartner 
                ? 'Đăng & Quản lý Tin tuyển dụng đối tác'
                : 'Quản trị JD & Cơ hội thực tập'}
          </h1>
        </div>

        {(isAdmin || isLecturer || isPartner) && (
          <div className="flex items-center gap-2">
            {(isAdmin || isLecturer) && (
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2.5 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[13.5px] font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Dán Email Forward (Parser)</span>
              </button>
            )}
            {isPartner && (
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2.5 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[13.5px] font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Đăng tin tuyển dụng mới</span>
              </button>
            )}
          </div>
        )}

        {isLecturer && !isAdmin && (
          <div className="px-3.5 py-2 bg-white text-[#1f2937] text-[14.5px] font-bold rounded-lg border border-[#e5e7eb] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#003087]"></span>
            <span>Chế độ Giảng viên: Theo dõi JD và hỗ trợ sinh viên chọn nơi thực tập</span>
          </div>
        )}
      </div>

      {/* Global Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-[12.5px] font-bold flex items-center justify-between border shadow-xs ${
          notification.type === 'success'
            ? 'bg-[#ebf3ff] text-[#003087] border-[#bfdbfe]'
            : 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]'
        }`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="font-bold underline ml-4 cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* 2. KHUNG THÔNG BÁO TỪ GIẢNG VIÊN & KHOA CNTT */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e7eb] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ebf3ff] text-[#003087] flex items-center justify-center font-bold text-sm shrink-0 border border-[#bfdbfe]">
              <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#003087] text-left">
                Thông báo & Hướng dẫn chính thức từ Khoa CNTT
              </h2>
            </div>
          </div>

          {(isLecturer || isAdmin) && (
            <button
              type="button"
              onClick={() => setShowBroadcastModal(true)}
              title="Phát thông báo học vụ tới Toàn trường, Giảng viên hoặc Nhóm sinh viên"
              className="px-5 py-2.5 min-w-[190px] h-[38px] whitespace-nowrap bg-[#003087] hover:bg-[#002266] text-white text-[13px] font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <span>Phát thông báo học vụ</span>
            </button>
          )}
        </div>

        {/* Danh sách thông báo */}
        {announcements.length === 0 ? (
          <div className="text-center py-6 text-[14.5px] text-[#1f2937] font-semibold">
            Chưa có thông báo nào từ Giảng viên trong đợt này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map(anc => (
              <div
                key={anc.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  anc.priority === 'high'
                    ? 'bg-[#fef2f2] border-[#fecaca]'
                    : 'bg-[#f8fafc] border-[#e5e7eb]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[12.5px] font-bold ${
                        anc.priority === 'high'
                          ? 'bg-white text-[#dc2626] border border-[#fecaca]'
                          : 'bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]'
                      }`}>
                        {anc.priority === 'high' ? 'Khẩn' : 'Chính thức'}
                      </span>
                      {anc.targetAudience && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f1f5f9] text-[#4b5563] border border-[#e2e8f0]">
                          {anc.targetAudience}
                        </span>
                      )}
                    </div>
                    <span className="text-[14px] text-[#1f2937] font-mono">{anc.date || '01/09/2026'}</span>
                  </div>

                  <h3 className={`text-[13px] font-bold line-clamp-2 ${
                    anc.priority === 'high' ? 'text-[#dc2626]' : 'text-[#1f2937]'
                  }`}>
                    {anc.title}
                  </h3>

                  <p className="text-[13.5px] text-[#4b5563] leading-relaxed line-clamp-3 text-justify">
                    {anc.content}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-[#e5e7eb] flex items-center justify-between text-[14px] text-[#1f2937]">
                  <span className="font-semibold truncate max-w-[200px]">{anc.author} · {anc.authorRole}</span>
                  {(isLecturer || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(anc.id)}
                      className="text-[#dc2626] font-bold hover:underline cursor-pointer"
                      title="Xóa thông báo"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. STUDENT VIEW: BẢNG TIN JD */}
      {isStudent && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..." style={{ paddingLeft: "44px" }} className="w-full pr-4 py-2.5 rounded-xl border border-[#cbd5e1] bg-white text-[14.5px] text-[#1f2937] font-medium outline-none focus:ring-2 focus:ring-[#003087]"
              />
              <svg className="w-4 h-4 text-[#1f2937]/50 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[14.5px] font-semibold text-[#1f2937] focus:border-[#003087] outline-none cursor-pointer"
              >
                <option value="all">Lĩnh vực: Tất cả</option>
                <option value="Phần mềm">Phần mềm</option>
                <option value="Dữ liệu">Dữ liệu</option>
                <option value="Ngân hàng">Ngân hàng</option>
                <option value="Viễn thông">Viễn thông</option>
                <option value="An toàn thông tin">An toàn thông tin</option>
              </select>

              <div className="flex items-center bg-[#f8fafc] border border-[#e5e7eb] p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setValidityFilter('valid')}
                  className={`px-3 py-1.5 rounded text-[14px] font-bold transition cursor-pointer ${
                    validityFilter === 'valid'
                      ? 'bg-[#003087] text-white shadow-xs'
                      : 'text-white hover:text-[#003087]'
                  }`}
                >
                  Còn hạn
                </button>
                <button
                  type="button"
                  onClick={() => setValidityFilter('all')}
                  className={`px-3 py-1.5 rounded text-[14px] font-bold transition cursor-pointer ${
                    validityFilter === 'all'
                      ? 'bg-[#003087] text-white shadow-xs'
                      : 'text-white hover:text-[#003087]'
                  }`}
                >
                  Tất cả
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[14.5px] font-semibold text-[#1f2937] focus:border-[#003087] outline-none cursor-pointer"
              >
                <option value="deadline">Hạn nộp gần nhất</option>
                <option value="newest">Mới nhất</option>
              </select>
            </div>
          </div>

          <div className="text-[14.5px] font-bold text-[#1f2937] px-1">
            Hiển thị {filteredJds.length} cơ hội thực tập đang mở
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJds.length === 0 ? (
              <div className="col-span-full bg-white border border-[#e5e7eb] rounded-xl p-10 text-center space-y-3 shadow-xs">
                <div className="font-bold text-[#1f2937] text-[15px]">
                  Chưa có tin tuyển dụng thực tập nào
                </div>
                <p className="text-[13.5px] text-[#4b5563] max-w-md mx-auto text-justify">
                  Hiện tại danh sách tin tuyển dụng cho chuyên ngành đã chọn đang trống. Vui lòng quay lại sau hoặc liên hệ Bộ phận hỗ trợ thực tập Khoa CNTT.
                </p>
              </div>
            ) : (
              filteredJds.map(jd => (
                <div
                  key={jd.id}
                  className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-xs hover:border-[#003087] transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#ebf3ff] text-[#003087] font-bold text-[13px] flex items-center justify-center shrink-0 border border-[#bfdbfe]">
                          {jd.shortName || 'DN'}
                        </div>
                        <div>
                          <h3 className="font-bold text-[14px] text-[#1f2937] leading-tight">
                            {jd.company}
                          </h3>
                          <span className="text-[14px] text-[#1f2937] font-semibold">
                            {jd.field}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[12.5px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe] whitespace-nowrap shrink-0">
                        {jd.field}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-[15px] font-bold text-[#1f2937]">
                        {jd.position}
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {jd.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[14px] font-semibold bg-[#f8fafc] text-[#1f2937] border border-[#e5e7eb]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-[14px] text-[#1f2937] flex items-center gap-1.5 mt-3">
                      <svg className="w-3.5 h-3.5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{jd.location}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#e5e7eb] space-y-3">
                    <div className="flex items-center justify-between text-[14.5px]">
                      <div>
                        <span className="text-[12.5px] uppercase font-bold text-[#1f2937] block">
                          HẠN NỘP
                        </span>
                        <span className="font-bold text-[#1f2937]">
                          {jd.deadline}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[13.5px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                        {jd.deadlineDays}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedJdModal(jd)}
                        className="px-4 py-2.5 rounded-lg border border-[#003087] text-[#003087] hover:bg-[#ebf3ff] text-[13px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>Chi tiết</span>
                        <span>→</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAsInternship(jd)}
                        className="px-4 py-2.5 rounded-lg bg-[#003087] hover:bg-[#002266] text-white text-[13px] font-bold transition flex items-center justify-center cursor-pointer whitespace-nowrap"
                      >
                        Chọn làm nơi thực tập
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. LECTURER & ADMIN VIEW: DUYỆT & QUẢN LÝ JD */}
      {!isStudent && (
        <div className="space-y-6">
          <div className="flex border-b border-[#e5e7eb] text-[14.5px] font-bold gap-4">
            <button
              type="button"
              onClick={() => setLecturerSubTab('review')}
              className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 cursor-pointer ${
                lecturerSubTab === 'review'
                  ? 'border-[#003087] text-[#003087]'
                  : 'border-transparent text-[#1f2937] hover:text-[#003087]'
              }`}
            >
              <span>Hàng đợi duyệt JD</span>
              <span className="w-5 h-5 rounded-full bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] text-[12.5px] font-bold flex items-center justify-center">
                {reviewQueue.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLecturerSubTab('manage')}
              className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 cursor-pointer ${
                lecturerSubTab === 'manage'
                  ? 'border-[#003087] text-[#003087]'
                  : 'border-transparent text-[#1f2937] hover:text-[#003087]'
              }`}
            >
              <span>Quản lý JD đã đăng</span>
              <span className="px-2 py-0.5 rounded-full bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe] text-[12.5px] font-bold">
                {publishedJds.length}
              </span>
            </button>
          </div>

          {/* SubTab 1: Hàng đợi duyệt */}
          {lecturerSubTab === 'review' && (
            <div className="space-y-4">
              <div className="bg-[#ebf3ff] border border-[#bfdbfe] rounded-xl p-4 text-[14.5px] text-[#1f2937]">
                <div className="font-bold text-[#003087] mb-1">
                  Nguồn nhận JD tự động & Thẩm định đối tác
                </div>
                <p className="text-[14px] text-[#1f2937] text-justify">
                  Chỉ email và văn bản từ doanh nghiệp đối tác hợp lệ mới được đưa vào hàng đợi. Nội dung cần được ban điều phối xác minh mã số thuế, tính pháp lý và chế độ đãi ngộ trước khi công khai lên Bảng tin sinh viên.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reviewQueue.length === 0 ? (
                  <div className="col-span-full bg-white border border-[#e5e7eb] rounded-xl p-10 text-center space-y-3 shadow-xs">
                    <div className="font-bold text-[#1f2937] text-[15px]">
                      Hàng đợi duyệt tin tuyển dụng hiện đang trống
                    </div>
                    <p className="text-[13.5px] text-[#4b5563] text-justify max-w-md mx-auto">
                      Hiện tại không có tin tuyển dụng nào đang chờ phê duyệt. Bạn có thể sử dụng chức năng "Dán Email Forward" để đưa tin mới vào hệ thống.
                    </p>
                  </div>
                ) : (
                  reviewQueue.map(item => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2 text-[14.5px]">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] font-bold text-[12.5px] rounded-full">
                            Chờ duyệt
                          </span>
                          <span className="text-[14px] text-[#1f2937] font-mono">
                            {item.receiveDate || 'Hôm nay'}
                          </span>
                        </div>

                        <h3 className="font-bold text-[15px] text-[#1f2937] mt-1">
                          {item.position}
                        </h3>
                        <div className="text-[13px] font-bold text-[#003087]">
                          {item.company}
                        </div>

                        <div className="text-[14px] text-[#1f2937] space-y-1 pt-1">
                          <div>Email gửi: <strong className="font-mono">{item.senderEmail}</strong></div>
                          <div>Chỉ tiêu: <strong className="text-[#003087] font-bold">{item.slots} sinh viên</strong> · Trợ cấp: <strong>{item.salary}</strong></div>
                        </div>

                        <p className="text-[13.5px] text-[#4b5563] line-clamp-3 pt-1 text-justify">
                          {item.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-[#e5e7eb]">
                        {(isAdmin || isLecturer) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRejectReview(item)}
                              className="px-4 py-2 border border-[#dc2626] text-[#dc2626] text-[13px] font-bold rounded-lg hover:bg-[#fef2f2] transition cursor-pointer"
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveReview(item)}
                              className="flex-1 py-2 bg-[#003087] hover:bg-[#002266] text-white text-[13px] font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Duyệt & Xuất bản</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-[13px] text-[#1f2937] font-semibold py-1 text-center w-full">
                            Chỉ Giảng viên hoặc Quản trị viên mới có thẩm quyền duyệt xuất bản
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SubTab 2: Quản lý JD đã đăng */}
          {lecturerSubTab === 'manage' && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-xs overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[14.5px]">
                  <span className="px-3 py-1.5 bg-[#003087] text-white rounded-lg font-bold">
                    Đang đăng ({publishedJds.length})
                  </span>
                  <span className="px-3 py-1.5 bg-white border border-[#e5e7eb] text-[#1f2937] rounded-lg font-bold">
                    Hết hạn (0)
                  </span>
                </div>

                <div className="text-[14.5px] text-[#1f2937] font-semibold">
                  Học kỳ đào tạo: HK1 2026–2027
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14.5px]">
                  <thead className="bg-[#f8fafc] text-[#1f2937] font-bold border-b border-[#e5e7eb]">
                    <tr>
                      <th className="py-3 px-4">Công ty / Vị trí</th>
                      <th className="py-3 px-4">Ngày đăng</th>
                      <th className="py-3 px-4">Hạn nộp</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-center">Lượt sinh viên chọn</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {publishedJds.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-[#1f2937] font-semibold">
                          Chưa có tin tuyển dụng nào được đăng.
                        </td>
                      </tr>
                    ) : (
                      publishedJds.map(jd => (
                        <tr key={jd.id} className="hover:bg-[#f8fafc] transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#1f2937]">
                              {jd.company}
                            </div>
                            <div className="text-[14px] text-[#003087] font-semibold">
                              {jd.position}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[#1f2937]">
                            {jd.postDate || '01/09/2026'}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-[#1f2937]">
                            {jd.deadline}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[14px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]">
                              Đang nhận hồ sơ
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-[#003087] font-mono text-[14px]">
                              {jd.selectCount || 0}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedJdModal(jd)}
                                className="text-[#003087] hover:underline font-bold cursor-pointer"
                              >
                                Xem trước
                              </button>
                              <span className="text-[#e5e7eb]">·</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Lưu trữ tin tuyển dụng ${jd.position}?`)) {
                                    setPublishedJds(publishedJds.filter(item => item.id !== jd.id));
                                  }
                                }}
                                className="text-[#dc2626] hover:underline font-bold cursor-pointer"
                              >
                                Lưu trữ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL: JD Detail Modal */}
      {selectedJdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-2xl max-w-4xl w-full p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#e5e7eb] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#ebf3ff] text-[#003087] font-bold text-base flex items-center justify-center border border-[#bfdbfe]">
                  {selectedJdModal.shortName || 'DN'}
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#1f2937]">
                    {selectedJdModal.position}
                  </h3>
                  <div className="text-[14.5px] font-semibold text-[#003087]">
                    {selectedJdModal.company} · {selectedJdModal.location}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJdModal(null)}
                className="text-[#1f2937] hover:text-[#dc2626] p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[14.5px]">
              <div className="flex flex-wrap gap-1.5">
                {selectedJdModal.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 bg-[#ebf3ff] text-[#003087] font-bold rounded-lg text-[14px] border border-[#bfdbfe]">
                    {t}
                  </span>
                ))}
                <span className="px-2.5 py-1 bg-[#fef2f2] text-[#dc2626] font-bold rounded-lg text-[14px] border border-[#fecaca]">
                  Hạn nộp: {selectedJdModal.deadline} ({selectedJdModal.deadlineDays})
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#1f2937] uppercase tracking-wider text-[14px]">
                  Mô tả công việc
                </h4>
                <p className="text-[#1f2937] leading-relaxed text-justify">
                  {selectedJdModal.description}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#1f2937] uppercase tracking-wider text-[14px]">
                  Yêu cầu ứng viên
                </h4>
                <p className="text-[#1f2937] leading-relaxed text-justify">
                  {selectedJdModal.requirements}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#1f2937] uppercase tracking-wider text-[14px]">
                  Quyền lợi & Trợ cấp
                </h4>
                <p className="text-[#1f2937] leading-relaxed text-justify">
                  {selectedJdModal.benefits}
                </p>
              </div>

              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e5e7eb] space-y-2">
                <div className="font-bold text-[#003087]">
                  Thông tin pháp lý doanh nghiệp
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[14px] text-[#1f2937]">
                  <div>Mã số thuế: <strong className="font-mono">{selectedJdModal.taxCode}</strong></div>
                  <div>Liên hệ: <strong>{selectedJdModal.contact}</strong></div>
                  <div className="sm:col-span-2">Địa chỉ: <strong>{selectedJdModal.address}</strong></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb]">
              <button
                type="button"
                onClick={() => setSelectedJdModal(null)}
                className="px-4 py-2 border border-[#e5e7eb] rounded-lg font-bold text-[14.5px] text-[#1f2937] hover:bg-[#f8fafc] cursor-pointer"
              >
                Đóng
              </button>

              {isStudent && (
                <button
                  type="button"
                  onClick={() => handleSelectAsInternship(selectedJdModal)}
                  className="px-5 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[14.5px] font-bold shadow-xs cursor-pointer"
                >
                  Chọn làm nơi thực tập
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Email Forward Parser */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-2xl max-w-3xl w-full p-7 space-y-4">
            <div className="flex items-start justify-between border-b border-[#e5e7eb] pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#1f2937]">
                  {isPartner ? 'Đăng tin tuyển dụng thực tập sinh mới' : 'Dán nội dung Email Forward nhận từ Doanh nghiệp'}
                </h3>
                <p className="text-[14px] text-[#1f2937] text-justify mt-0.5">
                  {isPartner 
                    ? 'Nhập nội dung mô tả vị trí, yêu cầu kỹ năng và quyền lợi trợ cấp để gửi tới Khoa CNTT thẩm định.'
                    : 'Hệ thống tự động trích xuất Tên công ty, Vị trí, Yêu cầu, Trợ cấp và Hạn nộp.'}
                </p>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-[#1f2937] hover:text-[#dc2626] font-bold">✕</button>
            </div>

            <textarea
              rows={8}
              value={rawEmailText}
              onChange={(e) => setRawEmailText(e.target.value)}
              placeholder="---------- Forwarded message ---------\\nFrom: hr@doanhnghiep.com\\nSubject: Thông báo Tuyển dụng Thực tập sinh...\\n\\nKính gửi Khoa CNTT Trường ĐH Tôn Đức Thắng..."
              className="w-full p-3 rounded-lg border border-[#e5e7eb] bg-white text-[14.5px] font-mono outline-none focus:border-[#003087] text-[#1f2937]"
            ></textarea>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 border border-[#e5e7eb] rounded-lg text-[14.5px] font-bold text-[#1f2937] hover:bg-[#f8fafc] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleParseEmail}
                disabled={parsingEmail || !rawEmailText.trim()}
                className="px-5 py-2 bg-[#003087] text-white rounded-lg text-[14.5px] font-bold hover:bg-[#002266] disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {parsingEmail ? 'Đang trích xuất...' : 'Phân tích & Thêm vào hàng đợi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: Đăng thông báo mới */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-2xl max-w-3xl w-full p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <h3 className="text-[16px] font-bold text-[#1f2937]">
                Đăng Thông báo & Hướng dẫn Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="text-[#1f2937] hover:text-[#dc2626] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-[14.5px]">
              <div>
                <label className="block text-[14px] font-bold text-[#1f2937] uppercase mb-1">
                  Tiêu đề thông báo *
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="VD: Thông báo hướng dẫn nộp phiếu tiếp nhận thực tập đợt 1..."
                  className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg font-medium text-[#1f2937] outline-none focus:border-[#003087]"
                  required
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-[#1f2937] uppercase mb-1">
                  Mức độ ưu tiên
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#1f2937]">
                    <input
                      type="radio"
                      name="anc_priority"
                      checked={newAnnouncement.priority === 'normal'}
                      onChange={() => setNewAnnouncement({ ...newAnnouncement, priority: 'normal' })}
                      className="accent-[#003087]"
                    />
                    <span>Chính thức</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#dc2626]">
                    <input
                      type="radio"
                      name="anc_priority"
                      checked={newAnnouncement.priority === 'high'}
                      onChange={() => setNewAnnouncement({ ...newAnnouncement, priority: 'high' })}
                      className="accent-[#dc2626]"
                    />
                    <span>Khẩn cấp</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer ml-auto font-semibold text-[#1f2937]">
                    <input
                      type="checkbox"
                      checked={newAnnouncement.pinned}
                      onChange={e => setNewAnnouncement({ ...newAnnouncement, pinned: e.target.checked })}
                      className="accent-[#003087]"
                    />
                    <span>Ghim đầu trang</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-bold text-[#1f2937] uppercase mb-1">
                  Nội dung chi tiết *
                </label>
                <textarea
                  rows={4}
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Nhập nội dung thông báo gửi tới toàn thể sinh viên..."
                  className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg font-medium text-[#1f2937] outline-none focus:border-[#003087]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-5 py-2.5 min-w-[110px] border border-[#e5e7eb] rounded-lg font-bold text-[12.5px] text-[#1f2937] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingAnnouncement}
                  className="px-6 py-2.5 min-w-[160px] bg-[#003087] hover:bg-[#002266] text-white rounded-lg font-bold text-[12.5px] transition shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {savingAnnouncement ? 'Đang lưu...' : 'Đăng thông báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Phát thông báo Học vụ / Phân quyền cho Giảng viên & Admin */}
      {window.AdminNotificationModal && (
        <window.AdminNotificationModal
          isOpen={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
          currentUser={currentUser}
          onNotificationSent={() => {
            if (window.ApiClient) {
              setAnnouncements(window.ApiClient.getLecturerAnnouncements());
              if (window.ApiClient.fetchLecturerAnnouncements) {
                window.ApiClient.fetchLecturerAnnouncements().then(res => {
                  if (Array.isArray(res)) setAnnouncements(res);
                });
              }
            }
          }}
        />
      )}
    </div>
  );
};

window.BulletinPage = BulletinPage;
