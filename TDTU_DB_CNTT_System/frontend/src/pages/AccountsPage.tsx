// Accounts & RBAC Admin Management Page Component
// Tính năng:
// 1. Quản trị viên có quyền tạo tài khoản đăng nhập cho các đối tác bên ngoài (Doanh nghiệp)
// 2. Quản lý phân quyền, cấp Admin, khóa/mở khóa tài khoản
// 3. Tùy chỉnh các thông tin mốc thời gian & hạn chót học kỳ (Deadlines)

const AccountsPage = ({ currentUser, onNavigateTab, onSemesterChange, activeSemester }) => {
  const cleanEmail = String(currentUser?.email || '').toLowerCase();
  const isAdmin = cleanEmail === 'duonghuuphuc@tdtu.edu.vn' || cleanEmail === 'phamvanc@tdtu.edu.vn' || Boolean(currentUser?.isAdmin) || currentUser?.role === 'admin';
  const [activeSubTab, setActiveSubTab] = React.useState('accounts'); // 'accounts' | 'deadlines'
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  // 'all' | 'lecturer' | 'student' | 'partner'
  const [message, setMessage] = React.useState(null);

  // Modal Tạo tài khoản Đối tác bên ngoài
  const [showPartnerModal, setShowPartnerModal] = React.useState(false);
  const [partnerForm, setPartnerForm] = React.useState({
    companyName: '',
    contactName: '',
    email: '',
    password: '',
    taxCode: '',
    industry: 'Phát triển phần mềm'
  });
  const [creatingPartner, setCreatingPartner] = React.useState(false);

  // Form Cấu hình Mốc thời gian & Hạn chót (Deadlines)
  const [deadlinesForm, setDeadlinesForm] = React.useState({
    semesterName: 'HK1 2026–2027',
    declarationDeadline: '2026-11-15',
    certDeadline: '2026-11-30',
    reviewDeadline: '2026-12-05',
    reportDeadline: '2027-01-10',
    regulationNote: 'Sinh viên hoàn thành khai báo doanh nghiệp trước hạn chót để Khoa CNTT kịp thời thẩm định.'
  });
  const [savingDeadlines, setSavingDeadlines] = React.useState(false);

  // Ma trận Phân quyền Tích Số Nguyên tố (Thầy Phúc)
  const [primeMatrix, setPrimeMatrix] = React.useState(() => {
    if (window.ApiClient && window.ApiClient.getPrimeRoleMatrix) {
      return window.ApiClient.getPrimeRoleMatrix();
    }
    return {};
  });
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = React.useState('thay_phuc');
  const [showNewRoleModal, setShowNewRoleModal] = React.useState(false);
  const [newRoleForm, setNewRoleForm] = React.useState({ roleId: '', roleName: '' });
  const [savingMatrix, setSavingMatrix] = React.useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await window.ApiClient.getFirebaseUsers();
      setUsers(res.items || (Array.isArray(res) ? res : []));
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Lỗi lấy danh sách tài khoản' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
    if (window.ApiClient?.getSystemDeadlines) {
      const current = window.ApiClient.getSystemDeadlines();
      if (current) setDeadlinesForm(prev => ({ ...prev, ...current }));
    }

    const handleUsersUpdate = (e) => {
      if (e?.detail?.users && Array.isArray(e.detail.users)) {
        setUsers(e.detail.users);
      } else {
        fetchUsers();
      }
    };

    const handleDeadlinesUpdate = (e) => {
      if (window.ApiClient?.getSystemDeadlines) {
        const current = window.ApiClient.getSystemDeadlines();
        if (current) {
          setDeadlinesForm(prev => ({ ...prev, ...current }));
          return;
        }
      }
      if (e?.detail && !Array.isArray(e.detail.list)) {
        setDeadlinesForm(prev => ({ ...prev, ...e.detail }));
      }
    };

    window.addEventListener('tdtu_users_updated', handleUsersUpdate);
    window.addEventListener('tdtu_deadlines_updated', handleDeadlinesUpdate);
    window.addEventListener('tdtu_semesters_updated', handleDeadlinesUpdate);
    window.addEventListener('tdtu_semester_changed', handleDeadlinesUpdate);

    return () => {
      window.removeEventListener('tdtu_users_updated', handleUsersUpdate);
      window.removeEventListener('tdtu_deadlines_updated', handleDeadlinesUpdate);
      window.removeEventListener('tdtu_semesters_updated', handleDeadlinesUpdate);
      window.removeEventListener('tdtu_semester_changed', handleDeadlinesUpdate);
    };
  }, []);

  const handleToggleStatus = async (uid, currentActive) => {
    try {
      await window.ApiClient.toggleUserStatus(uid, !currentActive);
      setMessage({ type: 'success', text: `Đã ${!currentActive ? 'mở khóa' : 'khóa'} tài khoản thành công` });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Lỗi cập nhật trạng thái tài khoản' });
    }
  };

  const handleToggleAdmin = async (email, currentAdmin) => {
    try {
      await window.ApiClient.updateAdminRole(email, !currentAdmin);
      setMessage({ type: 'success', text: `Đã ${!currentAdmin ? 'cấp quyền' : 'thu hồi quyền'} Admin cho ${email}` });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Lỗi thay đổi quyền Admin' });
    }
  };

  const handleDeleteUser = async (uid, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản đối tác "${name}" không?`)) return;
    try {
      await window.ApiClient.deleteUser(uid);
      setMessage({ type: 'success', text: `Đã xóa tài khoản "${name}" thành công` });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Lỗi xóa tài khoản' });
    }
  };

  const handleCreatePartnerSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!partnerForm.companyName.trim() || !partnerForm.email.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập Tên công ty và Email đăng nhập của đối tác.' });
      return;
    }

    setCreatingPartner(true);
    try {
      await window.ApiClient.createPartnerUser({
        ...partnerForm,
        password: partnerForm.password || 'Partner@2026'
      });
      setMessage({
        type: 'success',
        text: ` Đã tạo thành công tài khoản đối tác: ${partnerForm.companyName} (${partnerForm.email})`
      });
      setShowPartnerModal(false);
      setPartnerForm({
        companyName: '',
        contactName: '',
        email: '',
        password: '',
        taxCode: '',
        industry: 'Phát triển phần mềm'
      });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Lỗi tạo tài khoản đối tác' });
    } finally {
      setCreatingPartner(false);
    }
  };

  const handleSaveDeadlines = (e) => {
    if (e) e.preventDefault();
    setSavingDeadlines(true);
    try {
      window.ApiClient.saveSystemDeadlines(deadlinesForm);
      setMessage({
        type: 'success',
        text: 'Đã cập nhật hạn chót học kỳ.'
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi lưu hạn chót: ' + err.message });
    } finally {
      setSavingDeadlines(false);
    }
  };

  const handleTogglePrimePermission = (feature, primeValue) => {
    const currentMask = primeMatrix[selectedRoleForMatrix]?.[feature] || 1;
    let nextMask = 1;
    if (currentMask % primeValue === 0) {
      nextMask = Math.floor(currentMask / primeValue);
      if (nextMask <= 0) nextMask = 1;
    } else {
      nextMask = currentMask <= 1 ? primeValue : currentMask * primeValue;
    }

    setPrimeMatrix(prev => ({
      ...prev,
      [selectedRoleForMatrix]: {
        ...(prev[selectedRoleForMatrix] || {}),
        [feature]: nextMask
      }
    }));
  };

  const handleSavePrimeMatrix = () => {
    setSavingMatrix(true);
    try {
      if (window.ApiClient?.savePrimeRoleMatrix) {
        window.ApiClient.savePrimeRoleMatrix(primeMatrix);
      }
      setMessage({
        type: 'success',
        text: 'Đã lưu phân quyền.'
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi lưu ma trận quyền: ' + err.message });
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleResetPrimeMatrix = () => {
    if (!window.confirm('Bạn có chắc chắn muốn khôi phục Ma trận quyền nguyên tố về giá trị mặc định của Thầy Phúc?')) return;
    if (window.PrimeRbac?.DEFAULT_ROLE_MATRIX) {
      const def = window.PrimeRbac.DEFAULT_ROLE_MATRIX;
      setPrimeMatrix(def);
      if (window.ApiClient?.savePrimeRoleMatrix) {
        window.ApiClient.savePrimeRoleMatrix(def);
      }
      setMessage({ type: 'success', text: ' Đã khôi phục Ma trận Phân quyền mặc định của Thầy Phúc thành công!' });
    }
  };

  const handleCreateNewRole = (e) => {
    if (e) e.preventDefault();
    const cleanId = newRoleForm.roleId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanId) {
      alert('Vui lòng nhập Mã vai trò hợp lệ (chữ cái thường, số, dấu gạch dưới)');
      return;
    }
    if (primeMatrix[cleanId]) {
      alert(`Mã vai trò "${cleanId}" đã tồn tại trên hệ thống!`);
      return;
    }

    const newPermissions = {
      login: 2, dashboard: 2, declaration: 1, students: 1,
      profile: 210, certificates: 2, bulletin: 2, email_jd: 1,
      semesters: 1, import: 1, export: 1, reporting: 1
    };

    setPrimeMatrix(prev => ({
      ...prev,
      [cleanId]: newPermissions
    }));
    setSelectedRoleForMatrix(cleanId);
    setShowNewRoleModal(false);
    setNewRoleForm({ roleId: '', roleName: '' });
    setMessage({
      type: 'success',
      text: ` Đã tạo thành công Role mới: "${newRoleForm.roleName || cleanId}". Hãy tùy biến các quyền bên dưới!`
    });
  };

  const nonStudentUsers = users.filter(u => u.role !== 'student');
  const filteredUsers = nonStudentUsers.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(s)) ||
      (u.email && u.email.toLowerCase().includes(s)) ||
      (u.studentId && u.studentId.toLowerCase().includes(s)) ||
      (u.taxCode && u.taxCode.toLowerCase().includes(s)) ||
      (u.displayName && u.displayName.toLowerCase().includes(s))
    );
  });

  // Nếu là sinh viên, hiển thị giao diện Profile đầy đủ như trong ProfilePage
  if (currentUser?.role === 'student' && window.ProfilePage) {
    return (
      <window.ProfilePage
        currentUser={currentUser}
        activeSemester={activeSemester || localStorage.getItem('tdtu_active_semester') || 'hk1_2026_2027'}
        onNavigateTab={onNavigateTab}
        onSemesterChange={onSemesterChange}
      />
    );
  }

  return (
    <div className="space-y-6 w-full pb-12">

      {/* Header & Sub-Tabs */}
      <div className="bg-white  p-6 rounded-xl border border-[#e5e7eb]  shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1f2937] ">
            {isAdmin ? 'Quản trị Tài khoản & Phân quyền' : 'Hồ sơ & Tài khoản cá nhân'}
          </h1>
          <p className="text-[13px] text-[#4b5563] mt-1">
            {isAdmin ? 'Quản lý tài khoản hệ thống, cấp quyền & ma trận phân quyền RBAC' : 'Thông tin chi tiết tài khoản và trạng thái xác thực hệ thống Khoa CNTT'}
          </p>
        </div>

        {/* Menu chọn mục dạng danh sách Dropdown gọn gàng (chỉ Admin) */}
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <label htmlFor="subTabDropdown" className="text-[13.5px] font-bold text-[#4b5563] shrink-0">
              Chế độ xem:
            </label>
            <select
              id="subTabDropdown"
              value={activeSubTab}
              onChange={e => setActiveSubTab(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[#cbd5e1] bg-white text-[#003087] font-bold text-[14px] outline-none cursor-pointer focus:border-[#003087] focus:ring-2 focus:ring-[#003087] shadow-xs"
            >
              <option value="accounts">Tài khoản & Phân quyền ({nonStudentUsers.length})</option>
              <option value="prime_matrix">Ma trận Prime RBAC (Phân quyền chi tiết)</option>
            </select>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe] text-[13px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#003087]"></span>
            <span>Hồ sơ tài khoản cá nhân</span>
          </div>
        )}
      </div>




      {/* Global Toast Alert */}
      {message && (
        <div className={`p-3.5 rounded-xl border text-[14px] font-semibold flex items-center justify-between ${message.type === 'success'
          ? 'bg-[#ebf3ff]  border-[#bfdbfe]  text-[#003087] '
          : 'bg-[#fef2f2]  border-[#fecaca]  text-[#dc2626] '
          }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="underline ml-4 font-bold">Đóng</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: QUẢN LÝ TÀI KHOẢN (Bảng dữ liệu chuẩn mực, không màu mè dư thừa) */}
      {/* ======================================================== */}
      {activeSubTab === 'accounts' && isAdmin && (
        <div className="space-y-4">

          {/* Action Bar: Lọc vai trò, Ô Tìm kiếm & Nút Tạo Đối tác */}
          <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            {/* Dropdown chọn phân loại tài khoản: Giảng viên & Đối tác */}
            <div className="flex items-center gap-2">
              <label htmlFor="roleFilterDropdown" className="text-[13.5px] font-bold text-[#4b5563] shrink-0">
                Phân loại:
              </label>
              <select
                id="roleFilterDropdown"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] bg-white text-[#1f2937] font-bold text-[14px] outline-none cursor-pointer focus:border-[#003087] focus:ring-2 focus:ring-[#003087]"
              >
                <option value="all">Tất cả tài khoản ({nonStudentUsers.length})</option>
                <option value="lecturer">Giảng viên ({nonStudentUsers.filter(u => u.role === 'lecturer').length})</option>
                <option value="partner">Đối tác Doanh nghiệp ({nonStudentUsers.filter(u => u.role === 'partner').length})</option>
              </select>
            </div>

            {/* Ô Tìm kiếm (chuẩn padding không đè chữ) & Nút Tạo Đối tác */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72 flex items-center">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#4b5563]">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  style={{ paddingLeft: '44px' }}
                  className="w-full pr-3.5 py-2.5 text-[14.5px] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:bg-white focus:border-[#003087] focus:ring-2 focus:ring-[#003087] text-[#1f2937]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowPartnerModal(true)}
                className="px-8 py-3 min-w-[250px] h-12 whitespace-nowrap bg-[#003087] hover:bg-[#002266] text-white text-[14px] font-bold rounded-xl transition shadow-xs hover:shadow-md flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
              >
                <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>Tạo tài khoản Đối tác</span>
              </button>
            </div>

          </div>

          {/* Bảng dữ liệu duy nhất (Table View chuẩn mực, không nhồi nhét, không chia thẻ card dư thừa) */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-[#4b5563] text-[15px] font-semibold">
                Đang tải danh sách tài khoản...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px] table-fixed min-w-[1100px]">
                  <thead className="bg-[#f8fafc] text-[#1f2937] uppercase tracking-wider font-extrabold text-[12.5px] border-b border-[#e2e8f0]">
                    <tr>
                      <th className="p-4 w-72">Họ tên / Đơn vị</th>
                      <th className="p-4 w-44">Mã định danh</th>
                      <th className="p-4 w-80">Email đăng nhập</th>
                      <th className="p-4 w-48 text-center">Vai trò hệ thống</th>
                      <th className="p-4 w-32 text-center">Phân quyền</th>
                      <th className="p-4 w-36 text-center">Trạng thái</th>
                      <th className="p-4 w-72 min-w-[260px] whitespace-nowrap text-right sticky right-0 bg-[#f8fafc] z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Tác vụ Quản trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-10 text-center text-[#4b5563]">
                          Không tìm thấy tài khoản nào khớp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.uid} className="group hover:bg-[#f8fafc] transition">
                          <td className="p-4">
                            <div className="font-bold text-[#1f2937] text-[14.5px]">
                              {u.name || u.displayName}
                            </div>
                            <div className="text-[12.5px] text-[#4b5563] mt-0.5">
                              {u.role === 'partner' ? (u.contactName ? `LH: ${u.contactName}` : 'Đối tác') : (u.department || 'Khoa CNTT')}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-mono text-[13.5px] font-bold text-[#003087] bg-[#ebf3ff] px-2.5 py-1 rounded-md border border-[#bfdbfe] whitespace-nowrap inline-block">
                              {u.taxCode || u.lecturerCode || u.studentId || u.uid || '—'}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-[13.5px] text-[#1f2937] whitespace-nowrap">
                            {u.email}
                          </td>

                          <td className="p-4 text-center">
                            {u.role === 'partner' ? (
                              <span className="inline-block px-3 py-1 rounded-full text-[12.5px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]">
                                Đối tác Doanh nghiệp
                              </span>
                            ) : u.role === 'lecturer' ? (
                              <span className="inline-block px-3 py-1 rounded-full text-[12.5px] font-bold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                                Giảng viên
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-[12.5px] font-bold bg-[#f8fafc] text-[#1f2937] border border-[#e2e8f0]">
                                Sinh viên
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            {u.isAdmin ? (
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-[#dc2626] text-white">
                                ADMIN
                              </span>
                            ) : (
                              <span className="text-[13px] text-[#9ca3af] font-mono">—</span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                                <span>Hoạt động</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                                <span>Đã khóa</span>
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right space-x-2 sticky right-0 bg-white group-hover:bg-[#f8fafc] z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] w-72 min-w-[260px] whitespace-nowrap">
                            {u.role === 'lecturer' && (
                              <button
                                type="button"
                                onClick={() => handleToggleAdmin(u.email, Boolean(u.isAdmin))}
                                className={`px-4 py-2 rounded-lg text-[12.5px] font-bold transition cursor-pointer min-w-[95px] whitespace-nowrap ${u.isAdmin ? 'bg-[#f1f5f9] text-[#1f2937] hover:bg-[#e2e8f0]' : 'bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe] hover:bg-[#dbeafe]'
                                  }`}
                              >
                                {u.isAdmin ? 'Hủy Admin' : 'Cấp Admin'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u.uid, Boolean(u.isActive))}
                              className={`px-4 py-2 rounded-lg text-[12.5px] font-bold transition cursor-pointer min-w-[90px] whitespace-nowrap ${u.isActive ? 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] hover:bg-[#fee2e2]' : 'bg-[#003087] text-white hover:bg-[#002266]'
                                }`}
                            >
                              {u.isActive ? 'Khóa' : 'Mở khóa'}
                            </button>

                            {u.role === 'partner' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.uid, u.name)}
                                className="px-3.5 py-2 rounded-lg text-[12.5px] font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] hover:bg-[#fee2e2] transition cursor-pointer whitespace-nowrap"
                                title="Xóa tài khoản đối tác"
                              >
                                Xóa
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MA TRẬN PHÂN QUYỀN NGUYÊN TỐ (THẦY PHÚC)         */}
      {/* ======================================================== */}
      {activeSubTab === 'prime_matrix' && (
        <div className="space-y-6">

          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#003087] to-[#001a4d] text-white p-6 rounded-xl shadow-md border border-blue-800">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Ma trận Phân quyền Chức năng
            </h2>
          </div>

          {/* Role Selector Pills & Button "Thêm Role Mới" */}
          <div className="bg-white  p-4 rounded-xl border border-[#e5e7eb]  shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-bold text-[#1f2937] mr-1">Chọn vai trò tùy chỉnh:</span>
              {Object.keys(primeMatrix).map(rId => {
                const roleLabels = {
                  thay_phuc: 'Thầy Phúc (Admin)',
                  giang_vien: 'Giảng viên',
                  sv_trong_ky: 'SV trong kỳ',
                  sv_ngoai_ky: 'SV ngoài kỳ',
                  partner: 'Đối tác DN'
                };
                const isSelected = selectedRoleForMatrix === rId;
                return (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => setSelectedRoleForMatrix(rId)}
                    className={`px-3 py-1.5 rounded-xl text-[14px] font-bold transition flex items-center gap-1.5 cursor-pointer ${isSelected
                      ? 'bg-[#003087] text-white shadow-xs'
                      : 'bg-white text-[#1f2937] border border-[#e5e7eb] hover:bg-[#ebf3ff] hover:text-[#003087]'
                      }`}
                  >
                    <span>{roleLabels[rId] || rId}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowNewRoleModal(true)}
              className="px-6 py-2.5 min-w-[160px] h-11 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-[14px] font-bold transition shadow-xs hover:shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>+ Thêm Role Mới</span>
            </button>
          </div>

          {/* Main Matrix Table */}
          <div className="bg-white  rounded-xl border border-[#e5e7eb]  shadow-sm overflow-hidden">
            <div className="p-4 bg-[#f8fafc]  border-b border-[#e5e7eb]  flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[#1f2937]  uppercase tracking-wider">
                  Bảng ma trận chức năng cho Role: <span className="text-[#003087] ">[{selectedRoleForMatrix}]</span>
                </h3>
                <p className="text-[13px] text-[#1f2937]">
                  Tích để cấp quyền, bỏ tích để thu hồi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetPrimeMatrix}
                  className="px-3 py-1.5 rounded-xl text-[14px] font-semibold border border-[#e5e7eb]  hover:bg-[#f8fafc]  text-[#1f2937]  transition cursor-pointer"
                >
                  ↺ Mặc định Thầy Phúc
                </button>
                <button
                  type="button"
                  onClick={handleSavePrimeMatrix}
                  disabled={savingMatrix}
                  className="px-4 py-1.5 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-[14px] font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <span>{savingMatrix ? 'Đang lưu...' : ' Lưu lên Cloud Firestore'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e5e7eb] font-bold text-[#1f2937] text-[13.5px]">
                    <th className="py-3 px-4 text-left">Chức năng hệ thống</th>
                    <th className="py-3 px-3 text-center">Xem</th>
                    <th className="py-3 px-3 text-center">Thêm</th>
                    <th className="py-3 px-3 text-center">Sửa</th>
                    <th className="py-3 px-3 text-center">Xóa</th>
                    <th className="py-3 px-3 text-center">Scope All</th>
                    <th className="py-3 px-3 text-center">Import</th>
                    <th className="py-3 px-3 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 ">
                  {[
                    { id: 'login', name: '1. Đăng nhập hệ thống' },
                    { id: 'dashboard', name: '2. Bảng điều khiển (Dashboard)' },
                    { id: 'declaration', name: '3. Khai báo thực tập (KTCN / TSNN)' },
                    { id: 'students', name: '4. Quản lý danh sách sinh viên' },
                    { id: 'profile', name: '5. Quản lý hồ sơ cá nhân' },
                    { id: 'certificates', name: '6. Quản lý chứng chỉ ngoại ngữ' },
                    { id: 'bulletin', name: '7. Thông báo học vụ & Bảng tin' },
                    { id: 'email_jd', name: '8. Duyệt JD từ Email Forward' },
                    { id: 'semesters', name: '9. Quản lý học kỳ & Hạn chót' },
                    { id: 'import', name: '10. Nhập dữ liệu Excel/CSV' },
                    { id: 'export', name: '11. Xuất báo cáo Ra quyết định' },
                    { id: 'reporting', name: '12. Thống kê & Đồ thị báo cáo' }
                  ].map(feat => {
                    const mask = primeMatrix[selectedRoleForMatrix]?.[feat.id] || 1;

                    return (
                      <tr key={feat.id} className="hover:bg-[#f8fafc]  transition">
                        <td className="py-3 px-4 font-semibold text-[#1f2937] ">
                          {feat.name}
                        </td>

                        {/* Checkboxes for 2, 3, 5, 7, 11, 13, 17 */}
                        {[2, 3, 5, 7, 11, 13, 17].map(primeVal => {
                          const isChecked = mask > 1 && mask % primeVal === 0;
                          return (
                            <td key={primeVal} className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePrimePermission(feat.id, primeVal)}
                                className="w-4 h-4 rounded text-[#003087] focus:ring-blue-500 border-[#e5e7eb] cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Tạo Role Mới */}
          {showNewRoleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white  rounded-xl border border-[#e5e7eb]  p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#e5e7eb]  pb-3">
                  <h3 className="text-base font-bold text-[#1f2937] ">
                    + Thêm Role Mới vào Hệ thống
                  </h3>
                  <button onClick={() => setShowNewRoleModal(false)} className="text-[#1f2937] hover:text-[#1f2937] font-bold">✕</button>
                </div>

                <form onSubmit={handleCreateNewRole} className="space-y-3">
                  <div>
                    <label className="block text-[14px] font-bold text-[#1f2937]  mb-1">
                      Mã định danh vai trò (Role ID) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: truong_bo_mon, tro_ly_khoa"
                      value={newRoleForm.roleId}
                      onChange={e => setNewRoleForm({ ...newRoleForm, roleId: e.target.value })}
                      className="w-full px-3 py-2 text-[14px] rounded-xl border border-[#e5e7eb]  bg-white  text-[#1f2937]  outline-none focus:ring-2 focus:ring-[#003087]"
                      required
                    />
                    <span className="text-[12.5px] text-[#1f2937]">Viết liền không dấu, chữ thường và dấu gạch dưới.</span>
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold text-[#1f2937]  mb-1">
                      Tên hiển thị vai trò (Role Name)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Trưởng Bộ môn, Cán bộ Khảo thí"
                      value={newRoleForm.roleName}
                      onChange={e => setNewRoleForm({ ...newRoleForm, roleName: e.target.value })}
                      className="w-full px-3 py-2 text-[14px] rounded-xl border border-[#e5e7eb]  bg-white  text-[#1f2937]  outline-none focus:ring-2 focus:ring-[#003087]"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e5e7eb] ">
                    <button
                      type="button"
                      onClick={() => setShowNewRoleModal(false)}
                      className="px-4 py-2 text-[14px] font-bold rounded-xl border border-[#e5e7eb]  text-[#1f2937]  hover:bg-[#f8fafc] transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#003087] hover:bg-[#002266] text-white text-[14px] font-bold rounded-xl transition shadow-xs"
                    >
                      Khởi tạo Role
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TẠO TÀI KHOẢN ĐỐI TÁC DOANH NGHIỆP BÊN NGOÀI       */}
      {/* ======================================================== */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white  rounded-2xl border border-[#e5e7eb]  p-7 max-w-2xl w-full shadow-2xl space-y-5">

            <div className="flex items-center justify-between border-b border-[#e5e7eb]  pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1f2937] ">
                  Tạo tài khoản Đối tác Doanh nghiệp
                </h3>
                <p className="text-[14px] text-[#1f2937]">
                  Cấp tài khoản cho doanh nghiệp tuyển dụng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPartnerModal(false)}
                className="text-[#1f2937] hover:text-[#1f2937] text-lg font-bold"
              >

              </button>
            </div>

            <form onSubmit={handleCreatePartnerSubmit} className="space-y-3.5">

              <div>
                <label className="block text-[14px] font-bold text-[#1f2937]  mb-1">
                  Tên Doanh nghiệp / Tổ chức Đối tác *
                </label>
                <input
                  type="text"
                  value={partnerForm.companyName}
                  onChange={e => setPartnerForm({ ...partnerForm, companyName: e.target.value })}
                  placeholder="VD: FPT Software, KMS Technology, Viettel..."
                  className="w-full px-3 py-2 text-[14px] rounded-xl border border-[#e5e7eb]  bg-white  text-[#1f2937]  outline-none focus:ring-2 focus:ring-[#003087]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-bold text-[#1f2937]  mb-1">
                    Người đại diện / HR liên hệ
                  </label>
                  <input
                    type="text"
                    value={partnerForm.contactName}
                    onChange={e => setPartnerForm({ ...partnerForm, contactName: e.target.value })}
                    placeholder="VD: Trần Thị Bích Thảo"
                    className="w-full px-3 py-2 text-[14px] rounded-xl border border-[#e5e7eb]  bg-white  text-[#1f2937]  outline-none focus:ring-2 focus:ring-[#003087]"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-[#1f2937]  mb-1">
                    Mã số thuế (MST)
                  </label>
                  <input
                    type="text"
                    value={partnerForm.taxCode}
                    onChange={e => setPartnerForm({ ...partnerForm, taxCode: e.target.value })}
                    placeholder="VD: 0101778115"
                    className="w-full px-3 py-2 text-[14px] rounded-xl border border-[#e5e7eb]  bg-white  text-[#1f2937]  outline-none focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-bold text-[#1f2937]  mb-1">
                  Email đăng nhập đối tác *
                </label>
                <input
                  type="email"
                  value={partnerForm.email}
                  onChange={e => setPartnerForm({ ...partnerForm, email: e.target.value })}
                  placeholder="VD: tuyendung@fpt.com hoặc hr@kms-technology.com"
                  className="w-full px-3 py-2 text-[14px] rounded-xl border border-[#e5e7eb]  bg-white  text-[#1f2937]  outline-none focus:ring-2 focus:ring-[#003087]"
                  required
                />
                <span className="text-[12.5px] text-[#1f2937] mt-0.5 block">Email công ty bên ngoài, không cần đuôi @tdtu.edu.vn</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-bold text-[#1f2937]  mb-1">
                    Mật khẩu khởi tạo
                  </label>
                  <input
                    type="text"
                    value={partnerForm.password}
                    onChange={e => setPartnerForm({ ...partnerForm, password: e.target.value })}
                    placeholder="Mặc định: Partner@2026"
                    className="w-full px-3 py-2 text-[14px] rounded-xl border border-[#e5e7eb]  bg-white  text-[#1f2937]  outline-none focus:ring-2 focus:ring-[#003087]"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-[#1f2937]  mb-1">
                    Lĩnh vực hoạt động
                  </label>
                  <select
                    value={partnerForm.industry}
                    onChange={e => setPartnerForm({ ...partnerForm, industry: e.target.value })}
                    className="w-full px-3 py-2 text-[14px] rounded-xl border border-[#e5e7eb]  bg-white  text-[#1f2937]  outline-none focus:ring-2 focus:ring-[#003087]"
                  >
                    <option value="Phát triển phần mềm">Phát triển phần mềm</option>
                    <option value="Trí tuệ nhân tạo & Dữ liệu">Trí tuệ nhân tạo & Dữ liệu</option>
                    <option value="An ninh mạng & Hệ thống">An ninh mạng & Hệ thống</option>
                    <option value="Tài chính số (Fintech)">Tài chính số (Fintech)</option>
                    <option value="Kiểm thử QA/QC">Kiểm thử QA/QC</option>
                    <option value="Khác">Lĩnh vực khác</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5e7eb]  flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="px-4 py-2 bg-[#f8fafc]  hover:bg-[#e5e7eb] text-[#1f2937]  text-[14px] font-bold rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingPartner}
                  className="px-5 py-2 bg-[#003087] hover:bg-[#002266] text-white text-[14px] font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {creatingPartner ? 'Đang tạo...' : 'Xác nhận tạo tài khoản'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

window.AccountsPage = AccountsPage;
