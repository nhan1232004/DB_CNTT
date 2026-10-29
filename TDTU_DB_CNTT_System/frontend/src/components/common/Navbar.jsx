// Navbar Component - Chuẩn hóa giao diện theo Dashoard_TSNN-frontend_qvinh template & Figma
// Tích hợp Dark Theme Toggle, Notification Bell (Email Service), & Chế độ xem Học kỳ phân quyền

const Navbar = ({ currentUser, onLogout, activeSemester, onSemesterChange, theme, onToggleTheme }) => {
  const isLecturerOrAdmin = currentUser?.role === 'lecturer' || currentUser?.isAdmin;
  const isStudent = currentUser?.role === 'student';

  const [notifications, setNotifications] = React.useState([]);
  const [showDrawer, setShowDrawer] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const loadNotifications = () => {
    try {
      if (window.ApiClient && window.ApiClient.getNotifications) {
        const list = window.ApiClient.getNotifications();
        setNotifications(list);
      }
    } catch (e) {
      console.warn('Error loading notifications:', e);
    }
  };

  React.useEffect(() => {
    loadNotifications();

    const handleNotifSent = (e) => {
      const newNote = e.detail;
      loadNotifications();
      setToast({
        title: 'Thông báo Email tự động',
        message: `Đã gửi xác nhận tới: ${newNote.to}`,
        subject: newNote.subject
      });
      setTimeout(() => {
        setToast(null);
      }, 5000);
    };

    const handleNotifReceived = () => {
      loadNotifications();
    };

    window.addEventListener('tdtu_notification_sent', handleNotifSent);
    window.addEventListener('tdtu_notification_received', handleNotifReceived);
    return () => {
      window.removeEventListener('tdtu_notification_sent', handleNotifSent);
      window.removeEventListener('tdtu_notification_received', handleNotifReceived);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem('tdtu_notifications', JSON.stringify(updated));
    } catch {}
  };

  const handleMarkSingleRead = (id) => {
    if (window.ApiClient && window.ApiClient.markNotificationRead) {
      const updated = window.ApiClient.markNotificationRead(id);
      setNotifications([...updated]);
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-800 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        
        {/* Left: Hệ thống Quản lý Học tập - TDTU Navy Brand */}
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[14px] font-extrabold text-[#003087] dark:text-sky-400 tracking-[0.02em] uppercase leading-tight">
              HỆ THỐNG QUẢN LÝ HỌC TẬP
            </div>
            <div className="text-[12px] font-medium text-[#64748b] dark:text-slate-400">
              Quản lý thực tập KTCN / TSNN
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Semester Pill:
              - Sinh viên: Hiển thị tĩnh học kỳ đã đăng ký
              - Giảng viên / Admin: Dropdown chọn các học kỳ theo chuẩn template
          */}
          {isStudent && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ebf3ff] dark:bg-blue-950/60 text-[#0052cc] dark:text-sky-300 rounded-full text-[12px] font-bold border border-[#bfdbfe] dark:border-blue-800 whitespace-nowrap shadow-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{activeSemester === 'hk2_2025_2026' ? 'HK2 2025–2026' : (activeSemester === 'hk1_2025_2026' ? 'HK1 2025–2026' : 'HK1 2026–2027')}</span>
            </div>
          )}

          {isLecturerOrAdmin && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ebf3ff] dark:bg-blue-950/60 rounded-full border border-[#bfdbfe] dark:border-blue-800 shadow-xs">
              <svg className="w-3.5 h-3.5 text-[#0052cc] dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[11px] font-bold text-[#64748b] dark:text-slate-400 hidden sm:inline">Học kỳ:</span>
              <select
                value={activeSemester || 'hk1_2026_2027'}
                onChange={e => onSemesterChange(e.target.value)}
                className="bg-transparent text-[12px] font-bold text-[#0052cc] dark:text-sky-300 outline-none cursor-pointer"
              >
                <option value="hk1_2026_2027" className="dark:bg-slate-800 dark:text-white">HK1 2026–2027</option>
                <option value="hk2_2025_2026" className="dark:bg-slate-800 dark:text-white">HK2 2025–2026</option>
                <option value="hk1_2025_2026" className="dark:bg-slate-800 dark:text-white">HK1 2025–2026</option>
              </select>
            </div>
          )}

          {/* Department Label */}
          <div className="text-[13px] font-semibold text-[#475569] dark:text-slate-400 hidden md:inline">
            Khoa Công nghệ thông tin
          </div>

          {/* Email Notification Service Bell Icon */}
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            title="Hộp thư Thông báo Học vụ & Email Tự động"
            className="relative p-2 rounded-full text-[#64748b] hover:text-[#003087] hover:bg-[#f1f5f9] dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#e31837] rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#e31837] rounded-full"></span>
            )}
          </button>

          {/* Dark Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối (Dark Theme)'}
            className="p-2 rounded-full text-[#64748b] hover:text-[#003087] hover:bg-[#f1f5f9] dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-[#e2e8f0] dark:bg-slate-700"></div>

          {/* User Status / Quick Logout */}
          {currentUser && (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-[#0f172a] dark:text-slate-200 truncate max-w-[140px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-[#64748b] dark:text-slate-400">
                  {isStudent ? (currentUser.studentId || 'Sinh viên') : (currentUser.isAdmin ? 'Quản trị viên' : (currentUser.role === 'partner' ? 'Đối tác DN' : 'Giảng viên'))}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Đăng xuất khỏi hệ thống"
                className="px-3 py-1.5 bg-[#fef2f2] hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-[#dc2626] dark:text-rose-300 border border-[#fecaca] dark:border-rose-800/80 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Toast Notification khi có email gửi tự động */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-emerald-400">{toast.title}</div>
            <div className="text-slate-300 mt-0.5">{toast.subject}</div>
            <div className="text-[11px] text-slate-400 mt-1">{toast.message}</div>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Notification Drawer Modal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs transition">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-[#e2e8f0] dark:border-slate-800">
            <div className="p-4 border-b border-[#f1f5f9] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#003087] dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-bold text-sm text-[#003087] dark:text-white">Hộp thư Thông báo Học vụ</span>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#0052cc] dark:text-sky-400 hover:underline font-semibold"
                  >
                    Đã đọc tất cả
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-[#94a3b8] text-xs">
                  Không có thông báo mới nào.
                </div>
              ) : (
                notifications.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleMarkSingleRead(item.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                      item.read
                        ? 'bg-[#f8fafc] dark:bg-slate-800/40 border-[#e2e8f0] dark:border-slate-800 text-[#64748b]'
                        : 'bg-[#ebf3ff]/70 dark:bg-blue-950/30 border-[#bfdbfe] dark:border-blue-900 text-[#0f172a] dark:text-slate-200 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#003087] dark:text-sky-300">{item.subject}</span>
                      <span className="text-[10px] text-[#94a3b8]">{item.time}</span>
                    </div>
                    <div className="text-[11px] text-[#475569] dark:text-slate-400 mb-1">{item.body}</div>
                    <div className="text-[10px] text-[#94a3b8]">Gửi đến: {item.to}</div>
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
