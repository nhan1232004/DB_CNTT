// Admin Notification Broadcast Modal Component
// Cho phép Role Admin phát thông báo phân quyền hướng mục tiêu (Targeted Broadcasting)
// & Quản lý lịch sử thông báo đã gửi kèm tính năng Anti-spam

const TARGET_AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Toàn hệ thống (Tất cả người dùng)', desc: 'Giảng viên, Sinh viên & Quản trị viên' },
  { value: 'all_lecturers', label: 'Toàn bộ Giảng viên', desc: 'Cố vấn học tập & Ban chủ nhiệm Khoa' },
  { value: 'all_students', label: 'Toàn bộ Sinh viên trong kỳ', desc: 'Tất cả sinh viên có tên trong danh sách học kỳ' },
  { value: 'students_seeking', label: 'Sinh viên chưa có nơi thực tập', desc: 'Đang tìm kiếm doanh nghiệp hoặc chờ phỏng vấn' },
  { value: 'students_need_support', label: 'Sinh viên cần Khoa hỗ trợ', desc: 'Đã nộp nguyện vọng nhờ Khoa điều phối doanh nghiệp' },
  { value: 'students_no_cert', label: 'Sinh viên chưa nộp chứng chỉ ngoại ngữ', desc: 'Chưa cập nhật chứng chỉ B1 xét chuẩn tốt nghiệp' },
  { value: 'students_dual_course', label: 'Sinh viên thực tập song song 2 môn', desc: 'Học cùng lúc cả KTCN (160h) và TSNN (320h)' },
  { value: 'students_by_major', label: 'Sinh viên theo chuyên ngành cụ thể', desc: 'Chỉ gửi tới sinh viên thuộc ngành đào tạo chỉ định' },
  { value: 'specific_student', label: 'Đích danh 1 sinh viên (theo MSSV)', desc: 'Chỉ gửi riêng tư tới 1 sinh viên có mã số chỉ định' }
];

const MAJOR_OPTIONS = [
  'Kỹ thuật phần mềm',
  'Khoa học máy tính',
  'Mạng máy tính và Truyền thông dữ liệu'
];

const AdminNotificationModal = ({ isOpen, onClose, currentUser, activeSemester, onNotificationSent }) => {
  const [activeTab, setActiveTab] = React.useState('compose'); // 'compose' | 'history'
  const [targetAudience, setTargetAudience] = React.useState('all');
  const [targetMajor, setTargetMajor] = React.useState('Kỹ thuật phần mềm');
  const [targetStudentId, setTargetStudentId] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [priority, setPriority] = React.useState('normal');
  const [type, setType] = React.useState('announcement');
  const [submitting, setSubmitting] = React.useState(false);
  const [audienceData, setAudienceData] = React.useState({ count: 0, label: '', description: '' });
  const [loadingAudience, setLoadingAudience] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState(null);

  // Lịch sử thông báo đã gửi
  const [historyList, setHistoryList] = React.useState([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  // Load preview số lượng người nhận thực tế khi thay đổi targetAudience hoặc targetMajor
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingAudience(true);

    if (window.ApiClient?.getAudienceCount) {
      window.ApiClient.getAudienceCount(targetAudience, targetAudience === 'students_by_major' ? targetMajor : undefined)
        .then(data => {
          if (isMounted && data) {
            setAudienceData(data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingAudience(false);
        });
    } else {
      setLoadingAudience(false);
    }

    return () => { isMounted = false; };
  }, [isOpen, targetAudience, targetMajor]);

  // Load lịch sử thông báo
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      if (window.ApiClient?.fetchNotifications) {
        const list = await window.ApiClient.fetchNotifications(currentUser);
        setHistoryList(list || []);
      }
    } catch {}
    finally {
      setLoadingHistory(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSendBroadcast = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề thông báo!');
      return;
    }
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung thông báo!');
      return;
    }
    if (targetAudience === 'specific_student' && !targetStudentId.trim()) {
      alert('Vui lòng nhập Mã số sinh viên (MSSV) nhận thông báo!');
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        priority,
        type,
        semesterId: activeSemester || localStorage.getItem('tdtu_active_semester') || 'hk1_2026_2027',
        targetAudience,
        targetMajor: targetAudience === 'students_by_major' ? targetMajor : undefined,
        targetStudentId: targetAudience === 'specific_student' ? targetStudentId.trim().toUpperCase() : undefined,
        senderRole: currentUser?.isAdmin ? 'admin' : (currentUser?.role || 'lecturer'),
        senderName: currentUser?.name || (currentUser?.role === 'lecturer' ? 'Giảng viên Khoa CNTT' : 'Ban Quản trị Khoa CNTT'),
        senderEmail: currentUser?.email || 'khoacntt@tdtu.edu.vn'
      };

      if (window.ApiClient?.createAdminNotification) {
        await window.ApiClient.createAdminNotification(payload);
      } else {
        window.ApiClient?.sendEmailNotification?.({
          subject: payload.title,
          content: payload.content,
          type: payload.type,
          priority: payload.priority,
          targetAudience: payload.targetAudience,
          targetStudentId: payload.targetStudentId
        });
      }

      setStatusMessage({ type: 'success', text: `✓ Đã phát thông báo thành công tới đối tượng: ${audienceData.label || targetAudience}!` });
      setTitle('');
      setContent('');
      if (onNotificationSent) onNotificationSent();

      setTimeout(() => {
        setStatusMessage(null);
        setActiveTab('history');
        loadHistory();
      }, 1500);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err?.message || 'Không thể phát thông báo. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotif = async (id, notifTitle) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa/thu hồi thông báo: "${notifTitle}"?`)) return;
    try {
      if (window.ApiClient?.deleteNotification) {
        await window.ApiClient.deleteNotification(id, currentUser);
      }
      if (window.ApiClient?.deleteLecturerAnnouncement) {
        await window.ApiClient.deleteLecturerAnnouncement(id);
      }
      setHistoryList(prev => prev.filter(n => String(n.id) !== String(id)));
      if (onNotificationSent) onNotificationSent();
    } catch (err) {
      alert('Lỗi xóa thông báo: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-3xl w-full border border-[#e5e7eb] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
          <div>
            <h3 className="text-[17px] font-bold text-[#1f2937] uppercase tracking-tight">
              Phát Thông Báo Học Vụ Phân Quyền
            </h3>
            <p className="text-[12px] text-[#1f2937] mt-0.5">
              Gửi thông báo theo nhóm đối tượng
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#1f2937] hover:text-[#dc2626] text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-[#e5e7eb] flex gap-4 text-[12.5px] font-bold bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'compose'
                ? 'border-[#003087] text-[#003087]'
                : 'border-transparent text-[#1f2937] hover:text-[#003087]'
            }`}
          >
            Soạn thông báo mới
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#003087] text-[#003087]'
                : 'border-transparent text-[#1f2937] hover:text-[#003087]'
            }`}
          >
            <span>Lịch sử thông báo đã gửi</span>
            {historyList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#ebf3ff] text-[#003087]">
                {historyList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[12.5px]">
          
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-[#dc2626] border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }`}>
              <span className="font-bold">{statusMessage.type === 'success' ? '✓' : '!'}</span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'compose' ? (
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              
              {/* 1. Chọn Đối tượng nhận (Target Audience) */}
              <div>
                <label className="block text-[13px] font-bold text-[#1f2937] mb-2">
                  1. Phân quyền đối tượng nhận thông báo <span className="text-[#dc2626]">*</span>
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-4 py-3 text-[13px] rounded-xl border border-[#cbd5e1] bg-white text-[#1f2937] font-bold focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087] cursor-pointer shadow-xs"
                >
                  {TARGET_AUDIENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngành học phụ thuộc nếu chọn 'students_by_major' */}
              {targetAudience === 'students_by_major' && (
                <div className="p-3 bg-blue-50/60 dark:bg-slate-900/60 border border-blue-200 dark:border-slate-700 rounded-xl space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#003087] dark:text-sky-300">
                    Chọn Chuyên ngành áp dụng:
                  </label>
                  <select
                    value={targetMajor}
                    onChange={(e) => setTargetMajor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    {MAJOR_OPTIONS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nhập MSSV nếu chọn 'specific_student' */}
              {targetAudience === 'specific_student' && (
                <div className="p-3 bg-purple-50/60 dark:bg-slate-900/60 border border-purple-200 dark:border-slate-700 rounded-xl space-y-1.5">
                  <label className="block text-[11px] font-bold text-purple-800 dark:text-purple-300">
                    Nhập Mã số Sinh viên (MSSV) nhận thông báo riêng:
                  </label>
                  <input
                    type="text"
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: 522H0045"
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                  <p className="text-[10.5px] text-purple-600 dark:text-purple-400">
                    Chỉ sinh viên này nhìn thấy thông báo.
                  </p>
                </div>
              )}

              {/* Live Audience Preview Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Dự kiến người nhận: </span>
                    {loadingAudience ? (
                      <span className="text-slate-400 italic">Đang tính toán...</span>
                    ) : (
                      <span className="font-black text-[#003087] dark:text-sky-400 text-sm">
                        {audienceData.count} đối tượng
                      </span>
                    )}
                    <span className="text-slate-400 text-[11px] ml-1">({audienceData.label})</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  {audienceData.description}
                </div>
              </div>

              {/* 2. Tiêu đề & Mức độ ưu tiên */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Tiêu đề thông báo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề ngắn gọn, rõ ràng..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value="normal">Bình thường (Xanh)</option>
                    <option value="high">Quan trọng (Vàng)</option>
                    <option value="urgent">Khẩn cấp (Đỏ)</option>
                  </select>
                </div>
              </div>

              {/* 3. Loại thông báo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  3. Phân loại nội dung học vụ
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'announcement', label: 'Kế hoạch / Học vụ' },
                    { key: 'reminder', label: 'Nhắc nhở hạn chót' },
                    { key: 'job_applied', label: 'Cơ hội việc làm JD' },
                    { key: 'urgent', label: 'Thông báo khẩn cấp' }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setType(item.key)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition text-center ${
                        type === item.key
                          ? 'bg-[#003087] text-white border-[#003087] shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Nội dung thông báo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  4. Nội dung thông báo chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung thông báo, hướng dẫn cụ thể cho đối tượng người nhận..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#003087]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-[#e5e7eb]">
                <div className="text-[11.5px] text-[#1f2937]">
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 min-w-[110px] rounded-lg border border-[#e5e7eb] text-[12.5px] font-bold text-[#1f2937] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 min-w-[180px] rounded-lg bg-[#003087] hover:bg-[#002266] text-white text-[12.5px] font-bold transition shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    {submitting ? 'Đang phát...' : 'Xác nhận phát thông báo'}
                  </button>
                </div>
              </div>

            </form>
          ) : (
            /* Tab Lịch sử thông báo */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] font-bold text-[#1f2937]">
                  Danh sách thông báo hệ thống đã phát:
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="text-[12px] text-[#003087] font-bold hover:underline cursor-pointer"
                >
                  Làm mới danh sách
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Đang tải lịch sử thông báo...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có thông báo nào được lưu trong hệ thống.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
                  {historyList.map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300'
                              : item.priority === 'high'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-blue-100 text-[#003087] border-blue-200 dark:bg-blue-950/80 dark:text-sky-300'
                          }`}>
                            {item.targetAudienceLabel || item.targetAudience}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotif(item.id, item.title)}
                            className="px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 text-xs font-bold rounded-lg transition border border-rose-200 dark:border-rose-800"
                            title="Xóa/Thu hồi thông báo này"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed">
                        {item.content}
                      </p>
                      <div className="text-[10.5px] text-slate-400 flex items-center gap-3">
                        <span>Người phát: {item.senderName || 'Ban Quản trị'}</span>
                        {item.targetStudentId && <span>MSSV: {item.targetStudentId}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

window.AdminNotificationModal = AdminNotificationModal;
