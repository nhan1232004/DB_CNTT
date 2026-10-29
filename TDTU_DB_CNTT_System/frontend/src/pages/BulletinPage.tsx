// Bulletin Page Component - Chuẩn hóa thiết kế theo Figma Frames (Frame 10, 11, 15, 16)
// Giao diện Sinh viên: Bảng tin cơ hội thực tập, 6 thẻ cơ hội, Xem chi tiết modal & Chọn làm nơi thực tập
// Giao diện Giảng viên / Quản trị: Hàng đợi duyệt JD (Frame 15) & Quản lý JD đã đăng (Frame 16)

const BulletinPage = ({ currentUser }) => {
  const isStudent = currentUser?.role === 'student';
  const isAdmin = Boolean(currentUser?.isAdmin);
  const isLecturer = currentUser?.role === 'lecturer';
  const isPartner = currentUser?.role === 'partner';

  // Sub-tab cho Giảng viên: 'review' (Duyệt JD - Frame 15) | 'manage' (Quản lý JD - Frame 16)
  const [lecturerSubTab, setLecturerSubTab] = React.useState('review');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [fieldFilter, setFieldFilter] = React.useState('all');
  const [validityFilter, setValidityFilter] = React.useState('valid'); // 'valid' | 'all'
  const [sortBy, setSortBy] = React.useState('deadline');

  // Selected JD for detail modal (Frame 11)
  const [selectedJdModal, setSelectedJdModal] = React.useState(null);
  const [reviewJdModal, setReviewJdModal] = React.useState(null);
  const [notification, setNotification] = React.useState(null);

  // Email Parser & Create Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [rawEmailText, setRawEmailText] = React.useState('');
  const [parsingEmail, setParsingEmail] = React.useState(false);

  // Dữ liệu Bảng tin JD, Hàng đợi Duyệt & Thông báo Giảng viên (Đồng bộ Real-time Cloud Firestore)
  const [publishedJds, setPublishedJds] = React.useState([]);
  const [reviewQueue, setReviewQueue] = React.useState([]);
  const [announcements, setAnnouncements] = React.useState([]);

  // Modal Đăng thông báo mới từ Giảng viên / Admin
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = React.useState(false);
  const [newAnnouncement, setNewAnnouncement] = React.useState({
    title: '',
    content: '',
    priority: 'normal',
    pinned: false
  });
  const [savingAnnouncement, setSavingAnnouncement] = React.useState(false);

  // Tải dữ liệu từ Firestore & Đăng ký Lắng nghe Realtime
  React.useEffect(() => {
    const loadData = () => {
      if (window.ApiClient) {
        setPublishedJds(window.ApiClient.getPublishedJds());
        setReviewQueue(window.ApiClient.getJdReviewQueue());
        setAnnouncements(window.ApiClient.getLecturerAnnouncements());
      }
    };
    loadData();

    const handleJds = (e) => { if (e.detail) setPublishedJds(e.detail); else loadData(); };
    const handleQueue = (e) => { if (e.detail) setReviewQueue(e.detail); else loadData(); };
    const handleAncs = (e) => { if (e.detail) setAnnouncements(e.detail); else loadData(); };

    window.addEventListener('tdtu_jds_updated', handleJds);
    window.addEventListener('tdtu_jd_queue_updated', handleQueue);
    window.addEventListener('tdtu_announcements_updated', handleAncs);
    return () => {
      window.removeEventListener('tdtu_jds_updated', handleJds);
      window.removeEventListener('tdtu_jd_queue_updated', handleQueue);
      window.removeEventListener('tdtu_announcements_updated', handleAncs);
    };
  }, []);

  // Chọn JD làm nơi thực tập -> Tự động điền vào Khai báo
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

      // Lưu đơn ứng tuyển Firestore tdtu_applications
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
        text: `✓ Đã chọn [${jd.company} - ${jd.position}] làm nơi thực tập! Thông tin đã được tự động điền sẵn vào trang Khai báo.`
      });
      setSelectedJdModal(null);
    } catch {
      setNotification({
        type: 'error',
        text: 'Không thể ghi dữ liệu tự động. Vui lòng chuyển sang mục Khai báo để hoàn tất.'
      });
    }
  };

  // Giảng viên duyệt JD (Đồng bộ Cloud Firestore tdtu_jds)
  const handleApproveReview = async (item) => {
    if (window.ApiClient?.approveJd) {
      await window.ApiClient.approveJd(item);
    }
    setReviewQueue(reviewQueue.filter(q => q.id !== item.id));
    setReviewJdModal(null);
    setNotification({
      type: 'success',
      text: `✓ Đã phê duyệt và đăng công khai JD [${item.position} - ${item.company}] lên Bảng tin Sinh viên!`
    });
  };

  // Giảng viên từ chối JD
  const handleRejectReview = async (item) => {
    if (window.ApiClient?.rejectJd) {
      await window.ApiClient.rejectJd(item.id);
    }
    setReviewQueue(reviewQueue.filter(q => q.id !== item.id));
    setReviewJdModal(null);
    setNotification({
      type: 'error',
      text: `Đã từ chối tin tuyển dụng từ [${item.company}].`
    });
  };

  // Parse Raw Email Parser / Doanh nghiệp đăng tin (Lưu Firestore)
  const handleParseEmail = async () => {
    if (!rawEmailText.trim()) return;
    setParsingEmail(true);
    try {
      await window.ApiClient.parseEmailForward(rawEmailText);
      const companyName = isPartner ? (currentUser?.companyName || currentUser?.name || 'Doanh nghiệp Đối tác') : 'Công ty Đối tác Mới (Email)';
      const newQueueItem = {
        company: companyName,
        shortName: 'DN',
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
          ? `✓ Tin tuyển dụng từ [${companyName}] đã được gửi tới Khoa CNTT! Quản trị viên sẽ phê duyệt và đưa lên Bảng tin sớm nhất.`
          : '✓ Bóc tách Email Forward thành công! JD mới đã được thêm vào hàng đợi duyệt trên Cloud Firestore.'
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

  // Đăng thông báo mới từ Giảng viên / Admin
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
      setNotification({ type: 'success', text: '✓ Đã đăng thông báo mới thành công lên Bảng tin!' });
      setIsAnnouncementModalOpen(false);
      setNewAnnouncement({ title: '', content: '', priority: 'normal', pinned: false });
    } catch (err) {
      alert('Lỗi đăng thông báo: ' + err.message);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Xóa thông báo từ Giảng viên / Admin
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    try {
      if (window.ApiClient?.deleteLecturerAnnouncement) {
        await window.ApiClient.deleteLecturerAnnouncement(id);
      }
      setNotification({ type: 'success', text: '✓ Đã xóa thông báo thành công.' });
    } catch (err) {
      alert('Lỗi xóa thông báo: ' + err.message);
    }
  };

  // Filtered published JDs for student view
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            {isStudent 
              ? 'Bảng tin cơ hội thực tập' 
              : isPartner 
                ? 'Đăng & Quản lý Tin tuyển dụng'
                : 'Quản trị JD & Cơ hội Thực tập'}
          </h1>
        </div>

        {/* Action Buttons: Only Admin and Enterprise Partner can create/submit JDs */}
        {(isAdmin || isPartner) && (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>✉️</span>
                <span>Dán Email Forward (Parser)</span>
              </button>
            )}
            {isPartner && (
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span>
                <span>Đăng tin tuyển dụng mới</span>
              </button>
            )}
          </div>
        )}

        {/* Regular Lecturer Notice (User requirement: Giảng viên bình thường không được tạo JD) */}
        {isLecturer && !isAdmin && (
          <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <span>ℹ️</span>
            <span>Chế độ Giảng viên: Theo dõi JD (Chỉ Quản trị viên và Doanh nghiệp đối tác được tạo JD)</span>
          </div>
        )}
      </div>

      {/* Global Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          notification.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="font-bold underline ml-4">
            Đóng
          </button>
        </div>
      )}

      {/* KHUNG THÔNG BÁO TỪ GIẢNG VIÊN & KHOA CNTT (Tích hợp cùng mục JD) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-blue-900/50 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#003087] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              📢
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#003087] dark:text-sky-400">
                Thông báo & Hướng dẫn từ Giảng viên
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Các mốc hạn chót, quy định phỏng vấn và điều phối thực tập chính thức của Khoa
              </p>
            </div>
          </div>

          {(isLecturer || isAdmin) && (
            <button
              type="button"
              onClick={() => setIsAnnouncementModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>+</span>
              <span>Đăng thông báo mới</span>
            </button>
          )}
        </div>

        {/* Danh sách thông báo */}
        {announcements.length === 0 ? (
          <div className="text-center py-5 text-xs text-slate-400">
            Chưa có thông báo nào từ Giảng viên trong đợt này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {announcements.map(anc => (
              <div
                key={anc.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  anc.priority === 'high'
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {anc.pinned && <span title="Được ghim">📌</span>}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        anc.priority === 'high'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-sky-300'
                      }`}>
                        {anc.priority === 'high' ? 'Khẩn' : 'Chính thức'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{anc.date || '01/09/2026'}</span>
                  </div>

                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2">
                    {anc.title}
                  </h3>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {anc.content}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-semibold truncate max-w-[200px]">{anc.author} · {anc.authorRole}</span>
                  {(isLecturer || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(anc.id)}
                      className="text-slate-400 hover:text-rose-600 font-bold transition cursor-pointer"
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

      {/* ========================================================= */}
      {/* 1. STUDENT VIEW: Frame 10 (Grid 6 Cards & Search Filters) */}
      {/* ========================================================= */}
      {isStudent && (
        <div className="space-y-6">
          
          {/* Filter Bar (Frame 10) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm công ty hoặc vị trí thực tập..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#003087] outline-none"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Dropdown & Pills */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[#003087] outline-none"
              >
                <option value="all">Lĩnh vực: Tất cả</option>
                <option value="Phần mềm">Phần mềm</option>
                <option value="Dữ liệu">Dữ liệu</option>
                <option value="Ngân hàng">Ngân hàng</option>
                <option value="Viễn thông">Viễn thông</option>
                <option value="An toàn thông tin">An toàn thông tin</option>
              </select>

              <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setValidityFilter('valid')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    validityFilter === 'valid'
                      ? 'bg-white dark:bg-slate-800 text-[#003087] dark:text-sky-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Còn hạn
                </button>
                <button
                  type="button"
                  onClick={() => setValidityFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    validityFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-[#003087] dark:text-sky-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tất cả
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[#003087] outline-none"
              >
                <option value="deadline">Sắp xếp: Hạn nộp gần nhất</option>
                <option value="newest">Mới nhất</option>
              </select>
            </div>

          </div>

          {/* Result counter */}
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
            {filteredJds.length} cơ hội đang mở
          </div>

          {/* 6 Opportunity Cards Grid (Frame 10) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJds.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#003087] dark:text-sky-300 flex items-center justify-center text-xl font-bold border border-blue-100 dark:border-blue-900">
                  💼
                </div>
                <div className="font-bold text-slate-800 dark:text-white text-sm">
                  Chưa có tin tuyển dụng thực tập nào
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Hiện tại danh sách tin tuyển dụng đang trống. Giảng viên phụ trách có thể đăng tin mới hoặc duyệt từ hàng đợi tiếp nhận.
                </p>
              </div>
            ) : (
              filteredJds.map(jd => (
              <div
                key={jd.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Logo avatar, Company name, Field badge */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#003087] dark:text-sky-300 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                        {jd.shortName}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {jd.company}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          {jd.field}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {jd.field}
                    </span>
                  </div>

                  {/* Position Title */}
                  <div className="mt-3">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {jd.position}
                    </h4>
                  </div>

                  {/* Tech Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {jd.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Location */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-3">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{jd.location}</span>
                  </div>
                </div>

                {/* Card Bottom: Deadline & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                  
                  {/* Deadline Box */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        HẠN NỘP
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {jd.deadline}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      {jd.deadlineDays}
                    </span>
                  </div>

                  {/* 2 Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJdModal(jd)}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <span>Xem chi tiết</span>
                      <span>↗</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAsInternship(jd)}
                      className="px-3 py-2 rounded-xl bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold transition flex items-center justify-center"
                    >
                      Chọn làm nơi TT
                    </button>
                  </div>

                </div>

              </div>
            )))}
          </div>

          {/* Bottom Notice Card (Frame 10) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-1 text-xs">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Lưu ý trước khi chọn doanh nghiệp</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              “Chọn làm nơi thực tập” chỉ điền trước thông tin vào hồ sơ khai báo, không thay thế việc ứng tuyển hoặc xác nhận tiếp nhận từ doanh nghiệp. Các doanh nghiệp và JD trong bản danh sách đã được thẩm định tính xác thực bởi Khoa CNTT.
            </p>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* 2. LECTURER VIEW: Frame 15 (Duyệt JD) & Frame 16 (Quản lý JD) */}
      {/* ============================================================ */}
      {!isStudent && (
        <div className="space-y-6">
          
          {/* Dual Sub-Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 text-xs font-bold gap-4">
            <button
              type="button"
              onClick={() => setLecturerSubTab('review')}
              className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 ${
                lecturerSubTab === 'review'
                  ? 'border-[#003087] text-[#003087] dark:text-sky-400 dark:border-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>Hàng đợi duyệt JD</span>
              <span className="w-5 h-5 rounded-full bg-red-100 text-[#E31837] text-[10px] font-black flex items-center justify-center">
                {reviewQueue.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLecturerSubTab('manage')}
              className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 ${
                lecturerSubTab === 'manage'
                  ? 'border-[#003087] text-[#003087] dark:text-sky-400 dark:border-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>Quản lý JD đã đăng</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                {publishedJds.length}
              </span>
            </button>
          </div>

          {/* SubTab 1: Hàng đợi duyệt JD (Frame 15) */}
          {lecturerSubTab === 'review' && (
            <div className="space-y-4">
              
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-bold text-[#003087] dark:text-sky-300 flex items-center gap-1.5 mb-1">
                  <span>Nguồn nhận JD tự động</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Chỉ email thuộc danh sách cho phép được đưa vào hàng đợi. Nội dung cần được giảng viên thẩm định và xác minh tính pháp lý của doanh nghiệp trước khi xuất bản lên bảng tin sinh viên.
                </p>
              </div>

              {/* Review Queue Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reviewQueue.length === 0 ? (
                  <div className="col-span-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-100 dark:border-amber-900">
                      📬
                    </div>
                    <div className="font-bold text-slate-800 dark:text-white text-sm">
                      Hàng đợi duyệt tin trống
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Hiện tại không có tin tuyển dụng nào đang chờ phê duyệt. Bạn có thể sử dụng tính năng "Nhập Email JD" để đưa tin vào hàng đợi.
                    </p>
                  </div>
                ) : (
                  reviewQueue.map(item => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] rounded-lg">
                          Chờ duyệt
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.receiveDate}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                        {item.position}
                      </h3>
                      <div className="text-xs font-semibold text-[#003087] dark:text-sky-400">
                        {item.company}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                        <div>Email gửi: <code>{item.senderEmail}</code></div>
                        <div>Chỉ tiêu: <strong>{item.slots} sinh viên</strong> · Trợ cấp: <strong>{item.salary}</strong></div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 pt-1">
                        {item.summary}
                      </p>

                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                        <span className="w-5 h-5 rounded bg-red-100 text-red-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                          PDF
                        </span>
                        <span className="truncate">{item.pdfFile}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      {isAdmin ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRejectReview(item)}
                            className="px-3 py-1.5 border border-rose-200 dark:border-rose-800 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 transition cursor-pointer"
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveReview(item)}
                            className="flex-1 py-1.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Duyệt & Đăng</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic py-1 text-center w-full">
                          Chỉ Quản trị viên (Admin) có quyền duyệt đăng
                        </div>
                      )}
                    </div>

                  </div>
                )))}
              </div>

            </div>
          )}

          {/* SubTab 2: Quản lý JD đã đăng (Frame 16) */}
          {lecturerSubTab === 'manage' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
              
              {/* Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 bg-[#003087] text-white rounded-xl font-bold">
                    Đang đăng ({publishedJds.length})
                  </span>
                  <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold">
                    Hết hạn (0)
                  </span>
                  <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold">
                    Lưu trữ (0)
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  Học kỳ: HK1 2025–2026
                </div>
              </div>

              {/* Table of Managed JDs */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Công ty / Vị trí</th>
                      <th className="py-3 px-4">Ngày đăng</th>
                      <th className="py-3 px-4">Hạn nộp</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-center">Lượt chọn</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                    {publishedJds.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-slate-400">
                          Chưa có tin tuyển dụng nào được đăng.
                        </td>
                      </tr>
                    ) : (
                      publishedJds.map(jd => (
                      <tr key={jd.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {jd.company}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {jd.position}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {jd.postDate}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {jd.deadline}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            jd.status === 'Sắp hết hạn'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {jd.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-black text-blue-600 dark:text-sky-400">
                            {jd.selectCount}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedJdModal(jd)}
                              className="text-[#003087] dark:text-sky-400 hover:underline font-semibold"
                            >
                              Xem trước
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              type="button"
                              onClick={() => alert('Chỉnh sửa JD')}
                              className="text-slate-600 dark:text-slate-300 hover:underline font-semibold"
                            >
                              Sửa
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Lưu trữ JD ${jd.position}?`)) {
                                  setPublishedJds(publishedJds.filter(item => item.id !== jd.id));
                                }
                              }}
                              className="text-rose-600 hover:underline font-semibold"
                            >
                              Lưu trữ
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              {/* Notice Frame 16 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Xuất bản và lưu trữ:</strong> JD trong danh sách này đã được thẩm định. JD lưu trữ không còn hiển thị cho sinh viên nhưng được giữ lại để đối chiếu hồ sơ. 3 JD chờ duyệt nằm ở tab riêng.
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL: JD Detail Modal (Frame 11)                      */}
      {/* ========================================================= */}
      {selectedJdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#003087] dark:text-sky-300 font-black text-lg flex items-center justify-center border border-blue-100 dark:border-blue-900">
                  {selectedJdModal.shortName}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedJdModal.position}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500">
                    {selectedJdModal.company} · {selectedJdModal.location}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJdModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs">
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {selectedJdModal.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-[#003087] dark:text-sky-300 font-bold rounded-lg text-[11px]">
                    {t}
                  </span>
                ))}
                <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold rounded-lg text-[11px]">
                  Hạn nộp: {selectedJdModal.deadline} ({selectedJdModal.deadlineDays})
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Mô tả công việc
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedJdModal.description}
                </p>
              </div>

              {/* Requirements */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Yêu cầu ứng viên
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedJdModal.requirements}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Quyền lợi & Trợ cấp
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedJdModal.benefits}
                </p>
              </div>

              {/* Company Info Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Thông tin doanh nghiệp
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <div>Mã số thuế: <strong>{selectedJdModal.taxCode}</strong></div>
                  <div>Liên hệ: <strong>{selectedJdModal.contact}</strong></div>
                  <div className="sm:col-span-2">Địa chỉ: <strong>{selectedJdModal.address}</strong></div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedJdModal(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300"
              >
                Đóng
              </button>

              {isStudent && (
                <button
                  type="button"
                  onClick={() => handleSelectAsInternship(selectedJdModal)}
                  className="px-5 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Chọn làm nơi thực tập
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL: Dán Email Forward Parser                        */}
      {/* ========================================================= */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isPartner ? 'Đăng tin tuyển dụng thực tập sinh mới' : 'Dán nội dung Email Forward nhận từ Doanh nghiệp'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isPartner 
                    ? 'Nhập nội dung mô tả vị trí, yêu cầu kỹ năng và quyền lợi trợ cấp để gửi tới Khoa CNTT thẩm định.'
                    : 'Hệ thống sẽ tự động bóc tách và trích xuất Tên công ty, Vị trí, Yêu cầu, Trợ cấp và Hạn nộp.'}
                </p>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 p-1">✕</button>
            </div>

            <textarea
              rows={8}
              value={rawEmailText}
              onChange={(e) => setRawEmailText(e.target.value)}
              placeholder="---------- Forwarded message ---------\nFrom: hr@doanhnghiep.com\nSubject: Thông báo Tuyển dụng Thực tập sinh...\n\nKính gửi Khoa CNTT Trường ĐH Tôn Đức Thắng..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-[#003087]"
            ></textarea>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleParseEmail}
                disabled={parsingEmail || !rawEmailText.trim()}
                className="px-5 py-2 bg-[#003087] text-white rounded-xl text-xs font-bold hover:bg-[#002266] disabled:opacity-50"
              >
                {parsingEmail ? 'Đang trích xuất...' : 'Phân tích & Thêm vào hàng đợi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đăng Thông báo Mới từ Giảng viên / Admin */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Đăng Thông báo & Hướng dẫn Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tiêu đề thông báo *
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="VD: Thông báo hướng dẫn nộp phiếu tiếp nhận thực tập đợt 1..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#003087]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mức độ ưu tiên
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="anc_priority"
                      checked={newAnnouncement.priority === 'normal'}
                      onChange={() => setNewAnnouncement({ ...newAnnouncement, priority: 'normal' })}
                    />
                    <span>Chính thức</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="anc_priority"
                      checked={newAnnouncement.priority === 'high'}
                      onChange={() => setNewAnnouncement({ ...newAnnouncement, priority: 'high' })}
                    />
                    <span className="text-rose-600 font-bold">Khẩn cấp</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                    <input
                      type="checkbox"
                      checked={newAnnouncement.pinned}
                      onChange={e => setNewAnnouncement({ ...newAnnouncement, pinned: e.target.checked })}
                    />
                    <span>Ghim đầu trang</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nội dung chi tiết *
                </label>
                <textarea
                  rows={4}
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Nhập nội dung thông báo gửi tới toàn thể sinh viên..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#003087]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingAnnouncement}
                  className="px-5 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50"
                >
                  {savingAnnouncement ? 'Đang lưu...' : '✓ Đăng thông báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-4">
        © Khoa Công nghệ Thông tin · Đại học Tôn Đức Thắng
      </div>

    </div>
  );
};

window.BulletinPage = BulletinPage;
