// Accounts & RBAC Admin Management Page Component
// Tính năng:
// 1. Quản trị viên có quyền tạo tài khoản đăng nhập cho các đối tác bên ngoài (Doanh nghiệp)
// 2. Quản lý phân quyền, cấp Admin, khóa/mở khóa tài khoản
// 3. Tùy chỉnh các thông tin mốc thời gian & hạn chót học kỳ (Deadlines)

const AccountsPage = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = React.useState('accounts'); // 'accounts' | 'deadlines'
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all'); // 'all' | 'lecturer' | 'student' | 'partner'
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
    semesterName: 'HK1 2025–2026',
    declarationDeadline: '2025-09-30',
    certDeadline: '2025-10-15',
    reviewDeadline: '2025-10-20',
    reportDeadline: '2026-01-05',
    regulationNote: 'Sinh viên hoàn thành khai báo doanh nghiệp trước ngày 30/09/2025 để Khoa kịp thời thẩm định.'
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
      if (e?.detail) setDeadlinesForm(prev => ({ ...prev, ...e.detail }));
    };

    window.addEventListener('tdtu_users_updated', handleUsersUpdate);
    window.addEventListener('tdtu_deadlines_updated', handleDeadlinesUpdate);

    return () => {
      window.removeEventListener('tdtu_users_updated', handleUsersUpdate);
      window.removeEventListener('tdtu_deadlines_updated', handleDeadlinesUpdate);
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
        text: `✓ Đã tạo thành công tài khoản đối tác: ${partnerForm.companyName} (${partnerForm.email})`
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
        text: '✓ Đã cập nhật thành công các mốc thời gian & hạn chót học kỳ! Toàn bộ đồng hồ đếm ngược và bảng theo dõi trên hệ thống đã được đồng bộ.'
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
        text: '✓ Đã lưu thành công Ma trận Phân quyền Nguyên tố lên Cloud Firestore & Hệ thống!'
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
      setMessage({ type: 'success', text: '✓ Đã khôi phục Ma trận Phân quyền mặc định của Thầy Phúc thành công!' });
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
      text: `✓ Đã tạo thành công Role mới: "${newRoleForm.roleName || cleanId}". Hãy tùy biến các quyền bên dưới!`
    });
  };

  const filteredUsers = users.filter(u => {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header & Sub-Tabs */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Quản trị Tài khoản & Cấu hình Hạn chót
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Hệ thống trực tuyến (Online)
            </span>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('accounts')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeSubTab === 'accounts'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            👥 Tài khoản & Phân quyền
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('deadlines')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeSubTab === 'deadlines'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ⏱️ Tùy chỉnh Hạn chót
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('prime_matrix')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeSubTab === 'prime_matrix'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🔢 Ma trận Quyền Nguyên tố (Thầy Phúc)
          </button>
        </div>
      </div>

      {/* Global Toast Alert */}
      {message && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="underline ml-4 font-bold">Đóng</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: QUẢN LÝ TÀI KHOẢN & TẠO ĐỐI TÁC BÊN NGOÀI          */}
      {/* ======================================================== */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          
          {/* Action Bar: Search, Filters & Button "Tạo tài khoản đối tác" */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  roleFilter === 'all'
                    ? 'bg-[#003087] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tất cả ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('lecturer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  roleFilter === 'lecturer'
                    ? 'bg-[#003087] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Giảng viên ({users.filter(u => u.role === 'lecturer').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('student')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  roleFilter === 'student'
                    ? 'bg-[#003087] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Sinh viên ({users.filter(u => u.role === 'student').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('partner')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  roleFilter === 'partner'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                🏢 Đối tác Doanh nghiệp ({users.filter(u => u.role === 'partner').length})
              </button>
            </div>

            {/* Search Box & Create Partner Button */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email, MST..."
                className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#003087] w-full sm:w-56"
              />

              <button
                type="button"
                onClick={() => setShowPartnerModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <span>+</span>
                <span>Tạo tài khoản Đối tác</span>
              </button>
            </div>

          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách tài khoản...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5">Người dùng / Đơn vị</th>
                      <th className="p-3.5">Email đăng nhập</th>
                      <th className="p-3.5">Vai trò</th>
                      <th className="p-3.5">Phân quyền Admin</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Tác vụ Quản trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400">
                          Không tìm thấy tài khoản nào khớp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name || u.displayName}</span>
                              {u.role === 'partner' && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded">DN</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {u.role === 'partner' 
                                ? `MST: ${u.taxCode || 'Chưa cập nhật'} · LH: ${u.contactName || 'Người đại diện'}`
                                : (u.department || (u.studentId ? `MSSV: ${u.studentId}` : 'Khoa CNTT'))}
                            </div>
                          </td>

                          <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {u.email}
                          </td>

                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              u.role === 'partner'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200'
                                : u.role === 'lecturer'
                                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}>
                              {u.role === 'partner' ? '🏢 Đối tác Doanh nghiệp' : (u.role === 'lecturer' ? 'Giảng viên' : 'Sinh viên')}
                            </span>
                          </td>

                          <td className="p-3.5">
                            {u.isAdmin ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200">
                                ★ ADMIN
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {u.isActive ? (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Hoạt động
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Đã khóa
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right space-x-2">
                            {u.role === 'lecturer' && (
                              <button
                                type="button"
                                onClick={() => handleToggleAdmin(u.email, Boolean(u.isAdmin))}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                  u.isAdmin ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200' : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-200'
                                }`}
                              >
                                {u.isAdmin ? 'Hủy Admin' : 'Cấp Admin'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u.uid, Boolean(u.isActive))}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                u.isActive ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                              }`}
                            >
                              {u.isActive ? 'Khóa' : 'Mở khóa'}
                            </button>

                            {u.role === 'partner' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.uid, u.name)}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Xóa tài khoản đối tác"
                              >
                                ✕
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
      {/* TAB 2: TÙY CHỈNH CẤU HÌNH HẠN CHÓT & MỐC THỜI GIAN       */}
      {/* ======================================================== */}
      {activeSubTab === 'deadlines' && (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Cấu hình Mốc thời gian & Hạn chót học kỳ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quản trị viên có toàn quyền thay đổi các mốc ngày hạn chót. Khi lưu, các đồng hồ đếm ngược và bảng theo dõi của sinh viên, giảng viên sẽ được cập nhật đồng bộ tức thì.
            </p>
          </div>

          <form onSubmit={handleSaveDeadlines} className="space-y-5 max-w-3xl">
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Tên học kỳ áp dụng *
              </label>
              <input
                type="text"
                value={deadlinesForm.semesterName}
                onChange={e => setDeadlinesForm({ ...deadlinesForm, semesterName: e.target.value })}
                placeholder="VD: HK1 2025–2026"
                className="w-full px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-2">
                <label className="block text-xs font-bold text-blue-900 dark:text-blue-300">
                  1. Hạn chót Khai báo Doanh nghiệp (Sinh viên) *
                </label>
                <input
                  type="date"
                  value={deadlinesForm.declarationDeadline}
                  onChange={e => setDeadlinesForm({ ...deadlinesForm, declarationDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                  2. Hạn chót Nộp Chứng chỉ ngoại ngữ & Tin học *
                </label>
                <input
                  type="date"
                  value={deadlinesForm.certDeadline}
                  onChange={e => setDeadlinesForm({ ...deadlinesForm, certDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-600"
                  required
                />
              </div>

              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 space-y-2">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-300">
                  3. Hạn chót Giảng viên Thẩm định hồ sơ *
                </label>
                <input
                  type="date"
                  value={deadlinesForm.reviewDeadline}
                  onChange={e => setDeadlinesForm({ ...deadlinesForm, reviewDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  4. Hạn chót Nộp Báo cáo Tổng kết thực tập *
                </label>
                <input
                  type="date"
                  value={deadlinesForm.reportDeadline}
                  onChange={e => setDeadlinesForm({ ...deadlinesForm, reportDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Ghi chú / Quy chế mốc thời gian học kỳ
              </label>
              <textarea
                rows={3}
                value={deadlinesForm.regulationNote}
                onChange={e => setDeadlinesForm({ ...deadlinesForm, regulationNote: e.target.value })}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
              ></textarea>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={savingDeadlines}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {savingDeadlines ? 'Đang lưu...' : '✓ Lưu cấu hình Mốc thời gian'}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MA TRẬN PHÂN QUYỀN NGUYÊN TỐ (THẦY PHÚC)         */}
      {/* ======================================================== */}
      {activeSubTab === 'prime_matrix' && (
        <div className="space-y-6">
          
          {/* Top Banner Explaining the Concept */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md border border-blue-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-800 text-blue-200 border border-blue-700">
                ⭐ Thiết kế bởi Thầy Phúc — Fundamental Theorem of Arithmetic
              </span>
              <span className="text-[11px] font-mono text-blue-300">
                Độ phức tạp: O(1) Modulo (M % P === 0)
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white">
              Ma trận Phân quyền Chức năng bằng Tích các Thừa số Nguyên tố
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed max-w-4xl">
              Mỗi hành động nghiệp vụ được gán duy nhất 1 số nguyên tố. Mã quyền trên chức năng (M) bằng tích các quyền được cấp.
              Khi người dùng thao tác, hệ thống chỉ cần thực hiện 1 phép tính chia lấy dư <code className="bg-blue-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">M % P === 0</code> để xác định thẩm quyền ngay tức thì.
            </p>

            {/* Quick Prime Numbers Legend */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-800/80 text-[11px]">
              <span className="font-bold text-blue-300 mr-1">Quy ước số nguyên tố:</span>
              <span className="px-2 py-0.5 rounded bg-blue-800 text-blue-200 font-mono">2: Xem</span>
              <span className="px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 font-mono">3: Thêm</span>
              <span className="px-2 py-0.5 rounded bg-amber-800 text-amber-200 font-mono">5: Sửa</span>
              <span className="px-2 py-0.5 rounded bg-rose-800 text-rose-200 font-mono">7: Xóa</span>
              <span className="px-2 py-0.5 rounded bg-purple-800 text-purple-200 font-mono">11: Scope All</span>
              <span className="px-2 py-0.5 rounded bg-indigo-800 text-indigo-200 font-mono">13: Import</span>
              <span className="px-2 py-0.5 rounded bg-teal-800 text-teal-200 font-mono">17: Export</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">1: Không quyền</span>
            </div>
          </div>

          {/* Role Selector Pills & Button "Thêm Role Mới" */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1">Chọn vai trò tùy chỉnh:</span>
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#003087] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>➕ Thêm Role Mới</span>
            </button>
          </div>

          {/* Main Matrix Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Bảng ma trận chức năng cho Role: <span className="text-[#003087] dark:text-blue-400">[{selectedRoleForMatrix}]</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tích chọn để cấp quyền (nhân thừa số nguyên tố), bỏ tích để thu hồi quyền (chia bớt thừa số).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetPrimeMatrix}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  ↺ Mặc định Thầy Phúc
                </button>
                <button
                  type="button"
                  onClick={handleSavePrimeMatrix}
                  disabled={savingMatrix}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <span>{savingMatrix ? 'Đang lưu...' : '💾 Lưu lên Cloud Firestore'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400">
                    <th className="py-3 px-4">Chức năng hệ thống</th>
                    <th className="py-3 px-3 text-center">Xem (2)</th>
                    <th className="py-3 px-3 text-center">Thêm (3)</th>
                    <th className="py-3 px-3 text-center">Sửa (5)</th>
                    <th className="py-3 px-3 text-center">Xóa (7)</th>
                    <th className="py-3 px-3 text-center">Scope All (11)</th>
                    <th className="py-3 px-3 text-center">Import (13)</th>
                    <th className="py-3 px-3 text-center">Export (17)</th>
                    <th className="py-3 px-4 text-right">Mã quyền tích (M)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                    const breakdown = [];
                    if (mask % 2 === 0) breakdown.push('2');
                    if (mask % 3 === 0) breakdown.push('3');
                    if (mask % 5 === 0) breakdown.push('5');
                    if (mask % 7 === 0) breakdown.push('7');
                    if (mask % 11 === 0) breakdown.push('11');
                    if (mask % 13 === 0) breakdown.push('13');
                    if (mask % 17 === 0) breakdown.push('17');

                    return (
                      <tr key={feat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
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
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-900 border-slate-300 dark:border-slate-600 cursor-pointer"
                              />
                            </td>
                          );
                        })}

                        {/* Calculated Prime Product M */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              mask === 1
                                ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              M = {mask}
                            </span>
                            {mask > 1 && breakdown.length > 1 && (
                              <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                = {breakdown.join(' × ')}
                              </span>
                            )}
                          </div>
                        </td>
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ➕ Thêm Role Mới vào Hệ thống
                  </h3>
                  <button onClick={() => setShowNewRoleModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                </div>

                <form onSubmit={handleCreateNewRole} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Mã định danh vai trò (Role ID) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: truong_bo_mon, tro_ly_khoa"
                      value={newRoleForm.roleId}
                      onChange={e => setNewRoleForm({ ...newRoleForm, roleId: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
                      required
                    />
                    <span className="text-[10px] text-slate-400">Viết liền không dấu, chữ thường và dấu gạch dưới.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Tên hiển thị vai trò (Role Name)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Trưởng Bộ môn, Cán bộ Khảo thí"
                      value={newRoleForm.roleName}
                      onChange={e => setNewRoleForm({ ...newRoleForm, roleName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setShowNewRoleModal(false)}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-lg w-full shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tạo tài khoản Đối tác Doanh nghiệp
                </h3>
                <p className="text-xs text-slate-500">
                  Cấp tài khoản đăng nhập cho đơn vị tuyển dụng bên ngoài vào hệ thống thực tập TDTU.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPartnerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePartnerSubmit} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Doanh nghiệp / Tổ chức Đối tác *
                </label>
                <input
                  type="text"
                  value={partnerForm.companyName}
                  onChange={e => setPartnerForm({ ...partnerForm, companyName: e.target.value })}
                  placeholder="VD: FPT Software, KMS Technology, Viettel..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Người đại diện / HR liên hệ
                  </label>
                  <input
                    type="text"
                    value={partnerForm.contactName}
                    onChange={e => setPartnerForm({ ...partnerForm, contactName: e.target.value })}
                    placeholder="VD: Trần Thị Bích Thảo"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã số thuế (MST)
                  </label>
                  <input
                    type="text"
                    value={partnerForm.taxCode}
                    onChange={e => setPartnerForm({ ...partnerForm, taxCode: e.target.value })}
                    placeholder="VD: 0101778115"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email đăng nhập đối tác *
                </label>
                <input
                  type="email"
                  value={partnerForm.email}
                  onChange={e => setPartnerForm({ ...partnerForm, email: e.target.value })}
                  placeholder="VD: tuyendung@fpt.com hoặc hr@kms-technology.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Email công ty bên ngoài, không cần đuôi @tdtu.edu.vn</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu khởi tạo
                  </label>
                  <input
                    type="text"
                    value={partnerForm.password}
                    onChange={e => setPartnerForm({ ...partnerForm, password: e.target.value })}
                    placeholder="Mặc định: Partner@2026"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lĩnh vực hoạt động
                  </label>
                  <select
                    value={partnerForm.industry}
                    onChange={e => setPartnerForm({ ...partnerForm, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#003087]"
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

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingPartner}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
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
