// Navbar Component - Tuân thủ nghiêm ngặt TDTU Enterprise Design System
// 1. Màu sắc giao diện: Trắng (#ffffff), Xanh dương (#003087), Đỏ (#dc2626)
// 2. Màu chữ: Chỉ Đen (#1f2937) và Đỏ (#dc2626)
// 3. Phông chữ: Body 11px-13px, Tiêu đề & Nhãn in đậm (font-bold)
// 4. Bố cục: Gọn gàng, thông thoáng, không trùng lặp User Profile/Logout với Sidebar

const Navbar = ({ currentUser, activeSemester, onSemesterChange }) => {
  const isLecturerOrAdmin = currentUser?.role === 'lecturer' || currentUser?.isAdmin;
  const isStudent = currentUser?.role === 'student';

  const [notifications, setNotifications] = React.useState([]);
  const [showDrawer, setShowDrawer] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [semesters, setSemesters] = React.useState(() => {
    try {
      const saved = localStorage.getItem('tdtu_semesters_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'hk1_2026_2027', name: 'HK1 2026–2027 (Hiện tại)' },
      { id: 'hk2_2025_2026', name: 'HK2 2025–2026' },
      { id: 'hk1_2025_2026', name: 'HK1 2025–2026' }
    ];
  });
  const [deadlineText, setDeadlineText] = React.useState('Hạn chót: Còn 18 ngày');
  const [isSemesterOpen, setIsSemesterOpen] = React.useState(false);
  const semesterDropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (semesterDropdownRef.current && !semesterDropdownRef.current.contains(e.target)) {
        setIsSemesterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const computeDeadline = React.useCallback(() => {
    try {
      const dl = window.ApiClient?.getSystemDeadlines ? window.ApiClient.getSystemDeadlines() : null;
      const targetDateStr = dl?.declarationDeadline || '2026-11-30';
      const targetTime = new Date(targetDateStr).getTime();
      const nowTime = new Date().getTime();
      const diffDays = Math.ceil((targetTime - nowTime) / (1000 * 3600 * 24));
      if (diffDays > 0) {
        setDeadlineText(`Hạn chót: Còn ${diffDays} ngày`);
      } else if (diffDays === 0) {
        setDeadlineText('Hạn chót: Hôm nay');
      } else {
        setDeadlineText('Hạn chót: Đã kết thúc');
      }
    } catch {
      setDeadlineText('Hạn chót: Đang cập nhật');
    }
  }, []);

  const loadNotifications = async () => {
    try {
      if (window.ApiClient?.fetchNotifications) {
        const list = await window.ApiClient.fetchNotifications(currentUser);
        setNotifications(list || []);
      } else if (window.ApiClient?.getNotifications) {
        const list = window.ApiClient.getNotifications(currentUser);
        setNotifications(list || []);
      }
    } catch (e) {
      console.warn('Error loading notifications:', e);
    }
  };

  React.useEffect(() => {
    loadNotifications();
    computeDeadline();

    const handleNotifSent = (e) => {
      const newNote = e.detail;
      loadNotifications();
      setToast({
        title: 'Thông báo hệ thống',
        message: 'Đã tiếp nhận và cập nhật hồ sơ vào hệ thống học vụ thành công',
        subject: newNote.subject || newNote.title || 'Khai báo thực tập'
      });
      setTimeout(() => {
        setToast(null);
      }, 4000);
    };

    const handleNotifReceived = () => {
      loadNotifications();
    };

    const handleSemestersUpdated = (e) => {
      if (e?.detail?.list && Array.isArray(e.detail.list)) {
        setSemesters(e.detail.list);
      }
      computeDeadline();
    };

    const handleDeadlinesUpdated = () => {
      computeDeadline();
    };

    window.addEventListener('tdtu_notification_sent', handleNotifSent);
    window.addEventListener('tdtu_notification_received', handleNotifReceived);
    window.addEventListener('tdtu_semesters_updated', handleSemestersUpdated);
    window.addEventListener('tdtu_semester_changed', handleDeadlinesUpdated);
    window.addEventListener('tdtu_deadlines_updated', handleDeadlinesUpdated);

    return () => {
      window.removeEventListener('tdtu_notification_sent', handleNotifSent);
      window.removeEventListener('tdtu_notification_received', handleNotifReceived);
      window.removeEventListener('tdtu_semesters_updated', handleSemestersUpdated);
      window.removeEventListener('tdtu_semester_changed', handleDeadlinesUpdated);
      window.removeEventListener('tdtu_deadlines_updated', handleDeadlinesUpdated);
    };
  }, [currentUser, computeDeadline]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  const handleMarkAllRead = () => {
    if (window.ApiClient && window.ApiClient.markAllNotificationsRead) {
      window.ApiClient.markAllNotificationsRead().then(updated => {
        setNotifications([...updated]);
      });
    } else {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      try {
        localStorage.setItem('tdtu_notifications', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleMarkSingleRead = (id) => {
    if (window.ApiClient && window.ApiClient.markNotificationRead) {
      const updated = window.ApiClient.markNotificationRead(id);
      setNotifications([...updated]);
    }
  };

  const handleClearAll = async () => {
    try {
      setNotifications([]);
      if (window.ApiClient && window.ApiClient.clearAllNotifications) {
        await window.ApiClient.clearAllNotifications(currentUser);
      } else {
        localStorage.setItem('tdtu_notifications', JSON.stringify([]));
      }
    } catch (err) {
      console.warn('Error clearing all notifications:', err);
    }
  };

  const handleClearRead = async () => {
    try {
      if (window.ApiClient && window.ApiClient.clearReadNotifications) {
        const remaining = await window.ApiClient.clearReadNotifications(currentUser);
        setNotifications([...remaining]);
      } else {
        const remaining = notifications.filter(n => !n.read);
        setNotifications(remaining);
        try {
          localStorage.setItem('tdtu_notifications', JSON.stringify(remaining));
        } catch {}
      }
    } catch (err) {
      console.warn('Error clearing read notifications:', err);
    }
  };

  const handleDeleteSingle = async (e, id) => {
    e.stopPropagation();
    try {
      // Cập nhật UI ngay lập tức để người dùng thấy phản hồi tức thì
      setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));
      if (window.ApiClient && window.ApiClient.deleteNotification) {
        const remaining = await window.ApiClient.deleteNotification(id, currentUser);
        setNotifications([...remaining]);
      } else {
        const remaining = notifications.filter(n => String(n.id) !== String(id));
        setNotifications(remaining);
        try {
          localStorage.setItem('tdtu_notifications', JSON.stringify(remaining));
        } catch {}
      }
    } catch (err) {
      console.warn('Error deleting notification:', err);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-[#e5e7eb] px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
        
        {/* Left Side: System Title Context */}
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[15px] font-bold text-[#003087] uppercase tracking-tight leading-tight">
              CỔNG THÔNG TIN THỰC TẬP DOANH NGHIỆP
            </div>
            <div className="text-[12.5px] font-medium text-[#4b5563] hidden sm:block">
              Học phần KTCN & TSNN
            </div>
          </div>
        </div>

        {/* Right Side Controls: Semester Selector, Deadline Pill, Notification Bell */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Custom Semester Selector Dropdown (Loại bỏ hoàn toàn thẻ select native, chống 100% lỗi 2 mũi tên) */}
          {(() => {
            const currentSemesterObj = semesters.find(s => s.id === (activeSemester || 'hk1_2026_2027')) || semesters[0];
            const currentSemesterLabel = currentSemesterObj ? (currentSemesterObj.name || currentSemesterObj.id) : 'HK1 2026–2027 (Hiện tại)';
            return (
              <div className="relative" ref={semesterDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSemesterOpen(prev => !prev)}
                  title="Chọn học kỳ để xem dữ liệu tương ứng"
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#ebf3ff] hover:bg-[#dbeafe] rounded-lg border border-[#bfdbfe] transition cursor-pointer shadow-2xs select-none"
                >
                  <svg className="w-4 h-4 text-[#003087] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[12.5px] font-bold text-[#1f2937] hidden md:inline">Học kỳ:</span>
                  <span className="text-[13px] font-bold text-[#003087]">
                    {currentSemesterLabel}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-[#003087] transition-transform duration-200 shrink-0 ${isSemesterOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu Popup */}
                {isSemesterOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#cbd5e1] py-1.5 z-50 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] border-b border-[#f1f5f9]">
                      Danh sách Học kỳ
                    </div>
                    {semesters.map(sem => {
                      const isSelected = (activeSemester || 'hk1_2026_2027') === sem.id;
                      const label = `${sem.name || sem.id} ${sem.isActive && !String(sem.name || '').includes('Hiện tại') ? '(Hiện tại)' : ''}`.trim();
                      return (
                        <button
                          key={sem.id}
                          type="button"
                          onClick={() => {
                            onSemesterChange(sem.id);
                            setIsSemesterOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-[13px] flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#ebf3ff] text-[#003087] font-bold'
                              : 'text-[#1f2937] hover:bg-[#f8fafc] font-medium'
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          {isSelected && (
                            <svg className="w-4 h-4 text-[#003087] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Urgent Deadline Alert Badge (Cập nhật động theo hạn chót học kỳ) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#fef2f2] text-[#dc2626] font-bold text-[12.5px] rounded-full border border-[#fecaca] whitespace-nowrap shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>
            <span>{deadlineText}</span>
          </div>

          {/* Notification Service Bell Icon */}
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            title="Hộp thư Thông báo Học vụ & Email Tự động"
            className="relative p-2 rounded-lg text-[#1f2937] hover:text-[#003087] hover:bg-[#ebf3ff] transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#dc2626] rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      {/* Toast Notification khi có email gửi tự động */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-white text-[#1f2937] p-4 rounded-xl shadow-xl border-2 border-[#003087] flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#ebf3ff] text-[#003087] flex items-center justify-center shrink-0 font-bold text-[12px]">
            ✓
          </div>
          <div className="flex-1 text-[12px]">
            <div className="font-bold text-[#003087]">{toast.title}</div>
            <div className="font-bold text-[#1f2937] mt-0.5">{toast.subject}</div>
            <div className="text-[11.5px] text-[#1f2937] mt-1 text-justify leading-relaxed">{toast.message}</div>
          </div>
          <button onClick={() => setToast(null)} className="text-[#1f2937] hover:text-[#dc2626] font-bold text-sm">✕</button>
        </div>
      )}

      {/* Notification Drawer Modal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#e5e7eb]">
            <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-bold text-[15px] text-[#003087]">Hộp thư Thông báo Học vụ</span>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11.5px] text-[#003087] hover:underline font-bold cursor-pointer"
                        title="Đánh dấu tất cả thông báo là đã đọc"
                      >
                        Đã đọc tất cả
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClearRead}
                      className="text-[11.5px] text-[#dc2626] hover:underline font-bold cursor-pointer"
                      title="Dọn dẹp và xóa các thông báo đã đọc khỏi danh sách"
                    >
                      Dọn đã đọc
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-[11.5px] text-[#6b7280] hover:text-[#dc2626] hover:underline font-bold cursor-pointer"
                      title="Xóa toàn bộ thông báo trong hộp thư"
                    >
                      Xóa tất cả
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-lg text-[#1f2937] hover:text-[#dc2626] font-bold text-sm cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-[#1f2937] font-semibold text-[13px]">
                  Không có thông báo mới nào.
                </div>
              ) : (
                notifications.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleMarkSingleRead(item.id)}
                    className={`p-3.5 rounded-xl border text-[12px] cursor-pointer transition relative group ${
                      item.read
                        ? 'bg-white border-[#e5e7eb] text-[#1f2937]'
                        : 'bg-[#ebf3ff] border-[#bfdbfe] text-[#1f2937] font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Target Audience Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.isPrivate || item.targetAudience === 'specific_student'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : item.targetAudience === 'all_lecturers'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              : item.targetAudience === 'students_seeking'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : item.targetAudience === 'students_need_support'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : item.targetAudience === 'students_no_cert'
                                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                                    : 'bg-blue-100 text-[#003087] border-blue-200'
                        }`}>
                          {item.targetAudienceLabel || ((item.isPrivate || item.targetAudience === 'specific_student') ? 'Cá nhân' : 'Toàn trường')}
                        </span>

                        {/* Priority Badge */}
                        {item.priority === 'urgent' && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#dc2626] text-white">
                            Khẩn cấp
                          </span>
                        )}
                        {item.priority === 'high' && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-500 text-white">
                            Quan trọng
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-bold text-[#dc2626]">
                          {item.time || (item.timestamp || item.createdAt ? new Date(item.timestamp || item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '')}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(e, item.id)}
                          className="px-2 py-0.5 rounded flex items-center gap-1 text-[#dc2626] hover:bg-[#fee2e2] bg-[#fef2f2] border border-[#fecaca] transition text-[10.5px] font-bold cursor-pointer shrink-0"
                          title="Xóa thông báo này"
                        >
                          <svg className="w-3 h-3 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>

                    <div className="font-bold text-[#003087] mb-1">
                      {item.title || item.subject}
                    </div>

                    <div className="text-[12px] text-[#1f2937] mb-1.5 leading-relaxed text-justify">
                      {item.content || item.body}
                    </div>

                    <div className="text-[10.5px] font-medium text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1">
                      <span>Người gửi: {item.senderName || 'Khoa CNTT'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

window.Navbar = Navbar;
