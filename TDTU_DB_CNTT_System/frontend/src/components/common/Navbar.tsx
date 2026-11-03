// Navbar Component - Tuân thủ nghiêm ngặt TDTU Enterprise Design System & FRONTEND_SPEC.md
// Cải thiện UI/UX:
// 1. Branding: CỔNG THỰC TẬP CNTT — KHOA CNTT chuẩn TDTU Navy & Red accent
// 2. Select học kỳ, badge hạn chót (Màu đỏ cảnh báo), chuông thông báo học vụ
// 3. Giữ nguyên toàn bộ logic xử lý thông báo & realtime sync

const Navbar = ({ currentUser, activeSemester, onSemesterChange }) => {
  const isLecturerOrAdmin = currentUser?.role === 'lecturer' || currentUser?.isAdmin;
  const isStudent = currentUser?.role === 'student';

  const [notifications, setNotifications] = React.useState([]);
  const [showDrawer, setShowDrawer] = React.useState(false);
  const [toast, setToast] = React.useState(null);

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

    const handleNotifSent = (e) => {
      const newNote = e.detail;
      loadNotifications();
      setToast({
        title: 'Thông báo Email tự động',
        message: `Đã gửi xác nhận tới: ${newNote.to || newNote.targetStudentId || 'Hệ thống'}`,
        subject: newNote.subject || newNote.title
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
  }, [currentUser]);

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
      <header
        style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Left Side: System Title Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: '800',
                color: '#003087',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
            >
              CỔNG THỰC TẬP CNTT — KHOA CNTT
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                fontWeight: '500',
                marginTop: '2px',
              }}
              className="hidden sm:block"
            >
              Học phần KTCN & TSNN · Trường Đại học Tôn Đức Thắng
            </div>
          </div>
        </div>

        {/* Right Side Controls: Semester Selector, Deadline Pill, Notification Bell */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Semester Selector */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
            }}
          >
            <svg className="w-4 h-4 text-[#0052cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a' }} className="hidden md:inline">
              Học kỳ:
            </span>
            {isLecturerOrAdmin ? (
              <select
                value={activeSemester || 'hk1_2026_2027'}
                onChange={e => onSemesterChange(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#003087',
                  outline: 'none',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                }}
              >
                <option value="hk1_2026_2027">HK1 2026–2027</option>
                <option value="hk2_2025_2026">HK2 2025–2026</option>
                <option value="hk1_2025_2026">HK1 2025–2026</option>
              </select>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#003087' }}>
                {activeSemester === 'hk2_2025_2026' ? 'HK2 2025–2026' : (activeSemester === 'hk1_2025_2026' ? 'HK1 2025–2026' : 'HK1 2026–2027')}
              </span>
            )}
          </div>

          {/* Urgent Deadline Alert Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontWeight: '700',
              fontSize: '12px',
              borderRadius: '9999px',
              border: '1px solid #fecaca',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
              }}
              className="animate-pulse"
            />
            <span>Hạn chót: Còn 18 ngày</span>
          </div>

          {/* Notification Service Bell Icon */}
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            title="Hộp thư Thông báo Học vụ & Email Tự động"
            style={{
              position: 'relative',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#dc2626',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 2px #ffffff',
                }}
                className="animate-pulse"
              />
            )}
          </button>
        </div>
      </header>

      {/* Toast Notification khi có email gửi tự động */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 50,
            maxWidth: '380px',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '2px solid #003087',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#003087',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div style={{ flex: 1, fontSize: '12px' }}>
            <div style={{ fontWeight: '700', color: '#003087' }}>{toast.title}</div>
            <div style={{ fontWeight: '700', color: '#1f2937', marginTop: '2px' }}>{toast.subject}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1.5 }}>{toast.message}</div>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Notification Drawer Modal */}
      {showDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#ffffff',
              height: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderLeft: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span style={{ fontWeight: '800', fontSize: '15px', color: '#003087' }}>Hộp thư Thông báo Học vụ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{ fontSize: '12px', color: '#0052cc', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Đánh dấu tất cả thông báo là đã đọc"
                      >
                        Đã đọc tất cả
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClearRead}
                      style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="Dọn dẹp và xóa các thông báo đã đọc"
                    >
                      Dọn đã đọc
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="Xóa toàn bộ thông báo"
                    >
                      Xóa tất cả
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    borderRadius: '6px',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    marginLeft: '4px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>
                  Không có thông báo mới nào.
                </div>
              ) : (
                notifications.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleMarkSingleRead(item.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: item.read ? '#e2e8f0' : '#bfdbfe',
                      backgroundColor: item.read ? '#ffffff' : '#eff6ff',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: '700',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3',
                          }}
                        >
                          {item.targetAudienceLabel || (item.isPrivate ? 'Cá nhân bạn' : 'Toàn trường')}
                        </span>

                        {item.priority === 'urgent' && (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', backgroundColor: '#dc2626', color: '#ffffff' }}>
                            Khẩn cấp
                          </span>
                        )}
                        {item.priority === 'high' && (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', backgroundColor: '#f59e0b', color: '#ffffff' }}>
                            Quan trọng
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>
                          {item.time || (item.timestamp || item.createdAt ? new Date(item.timestamp || item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '')}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(e, item.id)}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#dc2626',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            fontSize: '10.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                          title="Xóa thông báo này"
                        >
                          <svg className="w-3 h-3 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ fontWeight: '800', color: '#003087', marginBottom: '4px', fontSize: '13px' }}>
                      {item.title || item.subject}
                    </div>

                    <div style={{ fontSize: '12px', color: '#334155', marginBottom: '8px', lineHeight: 1.5 }}>
                      {item.content || item.body}
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                      <span>Người gửi: {item.senderName || 'Khoa CNTT'}</span>
                      {item.targetStudentId && (
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#6d28d9', fontWeight: '700' }}>MSSV: {item.targetStudentId}</span>
                      )}
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
