// Navbar Component - Tuân thủ nghiêm ngặt TDTU Enterprise Design System & FRONTEND_SPEC.md
// Cải thiện UI/UX:
// 1. Branding: CỔNG THỰC TẬP CNTT — KHOA CNTT chuẩn TDTU Navy & Red accent
// 2. Select học kỳ tùy chỉnh thanh lịch, badge hạn chót (Màu đỏ cảnh báo pulse), chuông thông báo học vụ
// 3. Giữ nguyên 100% logic: realtime notifications, sync email tự động, modal chi tiết thông báo/khai báo SV, phân quyền học kỳ

const Navbar = ({ currentUser, activeSemester, onSemesterChange, onNavigateTab }) => {
  const isLecturerOrAdmin = currentUser?.role === 'lecturer' || currentUser?.isAdmin;
  const isStudent = currentUser?.role === 'student';

  const [notifications, setNotifications] = React.useState([]);
  const [showDrawer, setShowDrawer] = React.useState(false);
  const [selectedNotifDetail, setSelectedNotifDetail] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [semesters, setSemesters] = React.useState(() => {
    if (window.ApiClient?.getSemesters) {
      return window.ApiClient.getSemesters();
    }
    try {
      const saved = localStorage.getItem('tdtu_semesters_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'hk2_2026_2027', name: 'Học kỳ 2 / 2026–2027' },
      { id: 'hk1_2026_2027', name: 'Học kỳ 1 / 2026–2027 (Hiện tại)' },
      { id: 'hk2_2025_2026', name: 'Học kỳ 2 / 2025–2026' },
      { id: 'hk1_2025_2026', name: 'Học kỳ 1 / 2025–2026' }
    ];
  });
  const [deadlineText, setDeadlineText] = React.useState('Hạn chót: Còn 18 ngày');
  const [isSemesterOpen, setIsSemesterOpen] = React.useState(false);
  const semesterDropdownRef = React.useRef(null);

  // Helper kiểm tra sinh viên có tên trong danh sách của học kỳ cụ thể hay không
  const isStudentEnrolledInSemester = React.useCallback((sid, semId) => {
    if (!sid) return false;
    const cleanSid = String(sid).trim().toUpperCase();
    if (cleanSid === '52100999') return false; // Sinh viên ngoài kỳ mẫu không thuộc đợt nào

    // 1. Kiểm tra danh sách sinh viên đã nạp của học kỳ đó trong LocalStorage
    try {
      const raw = localStorage.getItem(`tdtu_imported_students_${semId}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          const match = arr.some(s => String(s.studentId || s.mssv || s.id || '').trim().toUpperCase() === cleanSid);
          if (match) return true;
        }
      }
    } catch {}

    // 2. Đối với học kỳ chính HK1 2026-2027
    if (semId === 'hk1_2026_2027') {
      try {
        const liveRaw = localStorage.getItem('tdtu_live_students_clean') || localStorage.getItem('tdtu_live_students');
        if (liveRaw) {
          const liveArr = JSON.parse(liveRaw);
          if (Array.isArray(liveArr) && liveArr.length > 0) {
            const match = liveArr.some(s => String(s.studentId || s.mssv || s.id || '').trim().toUpperCase() === cleanSid);
            if (match) return true;
          }
        }
      } catch {}

      // Sinh viên hợp lệ trong hệ thống (không bị đánh dấu isEnrolledThisSemester: false)
      if (currentUser?.isEnrolledThisSemester !== false && cleanSid !== '52100999') {
        return true;
      }
    }

    return false;
  }, [currentUser]);

  // Danh sách học kỳ cho Dropdown
  const availableSemesters = React.useMemo(() => {
    return semesters;
  }, [semesters]);

  // Xác định học kỳ thực tế hiển thị trên thanh điều hướng
  const displaySemester = React.useMemo(() => {
    return semesters.find(s => s.id === (activeSemester || 'hk1_2026_2027')) || semesters[0];
  }, [activeSemester, semesters]);

  const displaySemesterId = displaySemester?.id || 'hk1_2026_2027';

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
      let rawSemList = [];
      if (window.ApiClient?.getSemesters) {
        rawSemList = window.ApiClient.getSemesters();
      } else {
        const saved = localStorage.getItem('tdtu_semesters_list');
        if (saved) rawSemList = JSON.parse(saved);
      }
      if (Array.isArray(rawSemList) && rawSemList.length > 0) {
        setSemesters(rawSemList);
      }
      const targetSem = (Array.isArray(rawSemList) && rawSemList.length > 0)
        ? (rawSemList.find(s => s.id === (activeSemester || 'hk1_2026_2027')) || rawSemList[0])
        : null;

      const dl = targetSem?.registrationDeadline || targetSem?.deadline || '2026-11-24';
      const deadlineDate = new Date(dl);
      const today = new Date();
      deadlineDate.setHours(23, 59, 59, 999);
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        setDeadlineText(`Hạn chót: Còn ${diffDays} ngày`);
      } else if (diffDays === 0) {
        setDeadlineText('Hạn chót: Hôm nay');
      } else {
        setDeadlineText('Đã kết thúc kỳ');
      }
    } catch {
      setDeadlineText('Hạn chót: Còn 18 ngày');
    }
  }, [activeSemester]);

  React.useEffect(() => {
    computeDeadline();
    const handleDeadlineUpdated = () => computeDeadline();
    window.addEventListener('tdtu_semester_deadline_updated', handleDeadlineUpdated);
    window.addEventListener('storage', handleDeadlineUpdated);
    return () => {
      window.removeEventListener('tdtu_semester_deadline_updated', handleDeadlineUpdated);
      window.removeEventListener('storage', handleDeadlineUpdated);
    };
  }, [computeDeadline]);

  const loadNotifications = React.useCallback(async () => {
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
  }, [currentUser]);

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
  }, [currentUser, loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

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
    } else {
      const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      setNotifications(updated);
      try {
        localStorage.setItem('tdtu_notifications', JSON.stringify(updated));
      } catch {}
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
      if (window.ApiClient && window.ApiClient.deleteLecturerAnnouncement) {
        await window.ApiClient.deleteLecturerAnnouncement(id);
      }
    } catch (err) {
      console.warn('Error deleting notification:', err);
    }
  };

  return (
    <>
      <header
        style={{
          minHeight: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          flexShrink: 0,
          boxSizing: 'border-box',
          gap: '12px',
        }}
        className="px-4 sm:px-6"
      >
        {/* Left Side: System Title Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 auto' }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: '800',
                color: '#003087',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              className="sm:text-[15px] truncate"
            >
              CỔNG THỰC TẬP CNTT — KHOA CNTT
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: '500',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              className="hidden md:block truncate"
            >
              Học phần KTCN & TSNN · Trường Đại học Tôn Đức Thắng
            </div>
          </div>
        </div>

        {/* Right Side Controls: Semester Selector, Deadline Pill, Notification Bell */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Custom Semester Selector Dropdown */}
          {(() => {
            const currentSemesterObj = displaySemester;
            const currentSemesterLabel = currentSemesterObj ? (currentSemesterObj.name || currentSemesterObj.id) : 'HK1 2026–2027 (Hiện tại)';
            return (
              <div className="relative" ref={semesterDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSemesterOpen(prev => !prev)}
                  title="Chọn học kỳ để xem dữ liệu tương ứng"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dbeafe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                  }}
                >
                  <svg className="w-4 h-4 text-[#0052cc] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a' }} className="hidden md:inline">
                    Học kỳ:
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#003087' }}>
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
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: '6px',
                      width: '260px',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 48, 135, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      padding: '6px 0',
                      zIndex: 50,
                    }}
                    className="animate-fadeIn"
                  >
                    <div
                      style={{
                        padding: '6px 14px',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#64748b',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      Danh sách Học kỳ
                    </div>
                    {availableSemesters.map(sem => {
                      const isSelected = displaySemesterId === sem.id;
                      const isStudentInSem = !isStudent || isStudentEnrolledInSemester(currentUser?.studentId || currentUser?.mssv, sem.id);
                      let label = `${sem.name || sem.id}`;
                      if (sem.isActive && !String(sem.name || '').includes('Hiện tại')) {
                        label += isStudent && !isStudentInSem ? ' (Hiện tại - Ngoài kỳ)' : ' (Hiện tại)';
                      } else if (isStudent && !isStudentInSem) {
                        label += ' (Ngoài kỳ)';
                      }
                      return (
                        <button
                          key={sem.id}
                          type="button"
                          onClick={() => {
                            onSemesterChange(sem.id);
                            setIsSemesterOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 14px',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isSelected ? '#ebf3ff' : 'transparent',
                            color: isSelected ? '#003087' : '#0f172a',
                            fontWeight: isSelected ? '700' : '500',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
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
            <span>{deadlineText}</span>
          </div>

          {/* Notification Service Bell Icon */}
          <button
            type="button"
            onClick={() => {
              loadNotifications();
              setShowDrawer(true);
            }}
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
          onClick={() => setShowDrawer(false)}
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
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

            {/* Notification List Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>
                  Không có thông báo mới nào.
                </div>
              ) : (
                notifications.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedNotifDetail(item);
                      handleMarkSingleRead(item.id);
                    }}
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
                            backgroundColor: item.type === 'student_declaration_update' ? '#e0e7ff' : '#e0e7ff',
                            color: item.type === 'student_declaration_update' ? '#3730a3' : '#3730a3',
                          }}
                        >
                          {item.type === 'student_declaration_update'
                            ? 'Cập nhật SV'
                            : (item.targetAudienceLabel || ((item.isPrivate || item.targetAudience === 'specific_student') ? 'Cá nhân bạn' : 'Toàn trường'))}
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

                    <div style={{ fontSize: '12px', color: '#334155', marginBottom: '8px', lineHeight: 1.5, textAlign: 'justify' }}>
                      {item.content || item.body}
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                      <span>Người gửi: <strong>{item.senderName || 'Khoa CNTT'}</strong></span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotifDetail(item);
                          handleMarkSingleRead(item.id);
                        }}
                        style={{
                          padding: '3px 8px',
                          backgroundColor: '#eff6ff',
                          color: '#0052cc',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Xem chi tiết"
                      >
                        <span>Chi tiết</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Bottom Toolbar */}
            {notifications.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                  {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Đã đọc tất cả'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#003087',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: '1px solid #bfdbfe',
                        cursor: 'pointer',
                      }}
                      title="Đánh dấu tất cả thông báo là đã đọc"
                    >
                      Đã đọc tất cả
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearRead}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                    }}
                    title="Dọn dẹp các thông báo đã đọc"
                  >
                    Dọn đã đọc
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: '1px solid #fecaca',
                      cursor: 'pointer',
                    }}
                    title="Xóa toàn bộ thông báo trong hộp thư"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Xem chi tiết Thông báo & Khai báo Thực tập */}
      {selectedNotifDetail && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          style={{ zIndex: 99999 }}
          onClick={() => setSelectedNotifDetail(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full border border-[#cbd5e1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#eff6ff] text-[#003087] flex items-center justify-center font-bold text-sm shrink-0">
                  <svg className="w-4 h-4 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-[15px] font-bold text-[#0f172a]">
                  {selectedNotifDetail.type === 'student_declaration_update' || selectedNotifDetail.metadata?.isStudentDeclaration
                    ? 'Chi tiết Khai báo Thực tập Sinh viên'
                    : 'Chi tiết Thông báo Học vụ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotifDetail(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-[#64748b] hover:text-[#dc2626] font-bold text-sm transition cursor-pointer"
                title="Đóng cửa sổ chi tiết"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-[13px] text-[#0f172a]">
              {(() => {
                let meta = selectedNotifDetail.metadata || {};
                if (typeof meta === 'string') {
                  try { meta = JSON.parse(meta); } catch {}
                }
                if (!meta || typeof meta !== 'object') meta = {};

                const sid = String(meta.studentId || selectedNotifDetail.targetStudentId || (selectedNotifDetail.content?.match(/522[a-zA-Z0-9]{5}/i)?.[0]) || '').trim().toUpperCase();
                let localDecl = null;
                if (sid && window.ApiClient?.getStudentDeclaration) {
                  try { localDecl = window.ApiClient.getStudentDeclaration(sid); } catch {}
                }

                const isStudentUpdate = selectedNotifDetail.type === 'student_declaration_update' ||
                                        selectedNotifDetail.type === 'declaration' ||
                                        Boolean(meta.isStudentDeclaration) ||
                                        Boolean(sid);

                if (isStudentUpdate) {
                  const studentName = meta.studentName || selectedNotifDetail.senderName || localDecl?.studentName || 'Sinh viên Khoa CNTT';
                  const studentId = sid || '—';
                  const classId = meta.classId || localDecl?.classId || localDecl?.className || '';
                  const major = meta.major || localDecl?.major || '';

                  const statusStr = String(meta.internshipStatus || localDecl?.internshipStatus || '').toLowerCase();
                  const compNameLower = String(meta.companyName || localDecl?.companyName || '').toLowerCase();

                  const isWait = statusStr === 'interviewing' ||
                                 meta.noCompanyOption === 'self' ||
                                 localDecl?.noCompanyOption === 'self' ||
                                 compNameLower.includes('chờ phỏng vấn') ||
                                 compNameLower.includes('phỏng vấn') ||
                                 compNameLower.includes('đang tìm') ||
                                 compNameLower.includes('chờ pv') ||
                                 compNameLower.includes('tuyển dụng') ||
                                 compNameLower.includes('ứng tuyển');

                  const isSupp = !isWait && (
                    statusStr === 'need_support' ||
                    meta.noCompanyOption === 'faculty' ||
                    localDecl?.noCompanyOption === 'faculty' ||
                    compNameLower.includes('hỗ trợ') ||
                    compNameLower.includes('khoa cntt')
                  );

                  const isPlaceholder = compNameLower.includes('hỗ trợ') ||
                                       compNameLower.includes('khoa cntt') ||
                                       compNameLower.includes('đang tìm') ||
                                       compNameLower.includes('phỏng vấn') ||
                                       compNameLower.includes('chờ pv') ||
                                       compNameLower.includes('tuyển dụng') ||
                                       compNameLower.includes('chưa có') ||
                                       compNameLower === '—' ||
                                       compNameLower === '-';

                  const isComp = !isWait && !isSupp && !isPlaceholder && (statusStr === 'has_company' || Boolean(meta.companyName && meta.companyName.trim()));

                  const statusLabel = isComp ? 'Đã có nơi thực tập' : (isWait ? 'Đang tìm / Chờ phỏng vấn' : (isSupp ? 'Cần Khoa hỗ trợ' : 'Đang cập nhật'));
                  const companyName = isComp
                    ? (meta.companyName || localDecl?.companyName || 'Doanh nghiệp đã khai báo')
                    : (isSupp ? 'Khoa CNTT hỗ trợ điều phối doanh nghiệp' : (meta.pendingCompany || localDecl?.pendingCompany || 'Tự liên hệ & đang chờ kết quả phỏng vấn'));

                  const position = meta.position || meta.desiredPosition || localDecl?.position || localDecl?.desiredPosition || (isSupp ? 'Chờ Khoa phân bổ' : 'Thực tập sinh');
                  const taxCode = meta.taxCode || localDecl?.taxCode || '';
                  const address = meta.address || localDecl?.address || '';
                  const contactPerson = meta.contactPerson || localDecl?.contactPerson || '';
                  const contactPhone = meta.contactPhone || localDecl?.contactPhone || '';
                  const supportReason = meta.supportReason || localDecl?.supportReason || '';
                  const desiredLocation = meta.desiredLocation || localDecl?.desiredLocation || '';
                  const supportNote = meta.supportNote || localDecl?.supportNote || '';
                  const cvDriveLink = meta.cvDriveLink || localDecl?.cvDriveLink || '';
                  const submittedAt = meta.submittedAt || selectedNotifDetail.time || selectedNotifDetail.timestamp || selectedNotifDetail.createdAt || new Date().toLocaleString('vi-VN');

                  return (
                    <div className="space-y-4">
                      {/* Banner Trạng thái */}
                      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                        isComp
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : isWait
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isComp ? 'bg-emerald-500' : isWait ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                          <span className="font-bold text-[13.5px]">
                            {statusLabel}
                          </span>
                        </div>
                        <span className="text-[11.5px] font-semibold text-slate-500">
                          {submittedAt}
                        </span>
                      </div>

                      {/* Thông tin Sinh viên */}
                      <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-2">
                        <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Thông tin sinh viên</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px]">
                          <div>
                            <span className="text-slate-500 font-medium">Họ và tên: </span>
                            <span className="font-bold text-[#0f172a]">{studentName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">MSSV: </span>
                            <span className="font-mono font-bold text-[#003087]">{studentId}</span>
                          </div>
                          {classId && (
                            <div>
                              <span className="text-slate-500 font-medium">Lớp: </span>
                              <span className="font-semibold text-[#0f172a]">{classId}</span>
                            </div>
                          )}
                          {major && (
                            <div>
                              <span className="text-slate-500 font-medium">Ngành: </span>
                              <span className="font-semibold text-[#0f172a]">{major}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chi tiết Khai báo doanh nghiệp / Nguyện vọng */}
                      <div className="p-4 bg-white rounded-xl border border-[#e2e8f0] space-y-2.5">
                        <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                          {isSupp ? 'Nội dung yêu cầu Khoa hỗ trợ' : (isWait ? 'Tiến độ ứng tuyển / Phỏng vấn' : 'Thông tin Doanh nghiệp tiếp nhận')}
                        </div>

                        <div className="space-y-1.5 text-[12.5px]">
                          {companyName && (
                            <div>
                              <span className="text-slate-500 font-medium">Đơn vị / Nơi thực tập: </span>
                              <span className="font-bold text-[#003087]">{companyName}</span>
                            </div>
                          )}

                          {position && (
                            <div>
                              <span className="text-slate-500 font-medium">Vị trí: </span>
                              <span className="font-semibold text-[#0f172a]">{position}</span>
                            </div>
                          )}

                          {taxCode && (
                            <div>
                              <span className="text-slate-500 font-medium">Mã số thuế (MST): </span>
                              <span className="font-mono font-semibold text-[#0f172a]">{taxCode}</span>
                            </div>
                          )}

                          {address && (
                            <div>
                              <span className="text-slate-500 font-medium">Địa chỉ: </span>
                              <span className="text-[#0f172a]">{address}</span>
                            </div>
                          )}

                          {(contactPerson || contactPhone) && (
                            <div>
                              <span className="text-slate-500 font-medium">Người liên hệ: </span>
                              <span className="font-semibold text-[#0f172a]">{contactPerson} {contactPhone ? `(${contactPhone})` : ''}</span>
                            </div>
                          )}

                          {isSupp && supportReason && (
                            <div>
                              <span className="text-slate-500 font-medium">Lý do cần hỗ trợ: </span>
                              <span className="text-rose-700 font-semibold">{supportReason}</span>
                            </div>
                          )}

                          {desiredLocation && (
                            <div>
                              <span className="text-slate-500 font-medium">Khu vực mong muốn: </span>
                              <span className="text-[#0f172a]">{desiredLocation}</span>
                            </div>
                          )}

                          {supportNote && (
                            <div className="p-2.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-xs">
                              <span className="font-bold text-slate-600 block mb-0.5">Ghi chú bổ sung:</span>
                              <span className="text-[#0f172a]">{supportNote}</span>
                            </div>
                          )}

                          {cvDriveLink && (
                            <div className="pt-2">
                              <a
                                href={cvDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 bg-[#eff6ff] text-[#003087] hover:bg-[#dbeafe] rounded-lg font-bold text-xs inline-flex items-center gap-1.5 border border-[#bfdbfe] transition cursor-pointer"
                              >
                                <span>Mở xem CV trên Drive</span>
                                <span>↗</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                /* Thông báo thông thường (Học vụ / Bảng tin) */
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#eff6ff] text-[#003087] border border-[#bfdbfe]">
                        {selectedNotifDetail.targetAudienceLabel || ((selectedNotifDetail.isPrivate || selectedNotifDetail.targetAudience === 'specific_student') ? 'Cá nhân bạn' : 'Toàn trường')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {selectedNotifDetail.timestamp || selectedNotifDetail.time || selectedNotifDetail.createdAt || ''}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#003087]">
                      {selectedNotifDetail.title || selectedNotifDetail.subject || 'Thông báo học vụ'}
                    </h4>

                    <div className="text-[13px] text-[#0f172a] leading-relaxed whitespace-pre-wrap text-justify bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]">
                      {selectedNotifDetail.content || selectedNotifDetail.body}
                    </div>

                    <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>Người phát hành: <strong>{selectedNotifDetail.senderName || 'Khoa CNTT'}</strong></span>
                      {selectedNotifDetail.priority && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          selectedNotifDetail.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : selectedNotifDetail.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Mức độ: {selectedNotifDetail.priority === 'urgent' ? 'Khẩn cấp' : selectedNotifDetail.priority === 'high' ? 'Quan trọng' : 'Tiêu chuẩn'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedNotifDetail(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-[#4b5563] border border-[#cbd5e1] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>

              {onNavigateTab && (currentUser?.role === 'lecturer' || currentUser?.isAdmin) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNotifDetail(null);
                    setShowDrawer(false);
                    onNavigateTab('students');
                  }}
                  className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Đến trang Quản lý sinh viên</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

window.Navbar = Navbar;
