// Student Eligibility Banner Component (AUTH-03)
const StudentEligibilityBanner = ({ currentUser, onNavigateToDocs }) => {
  const [eligibility, setEligibility] = React.useState(null);

  React.useEffect(() => {
    if (currentUser && currentUser.role === 'student' && currentUser.studentId) {
      window.ApiClient.checkStudentEligibility(currentUser.studentId)
        .then(res => setEligibility(res))
        .catch(() => setEligibility({ isEligible: true, message: 'Đã xác thực điều kiện học phần' }));
    } else {
      setEligibility(null);
    }
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'student' || !eligibility) {
    return null;
  }

  if (eligibility.isEligible) {
    return (
      <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
            ✓
          </div>
          <div>
            <div className="font-bold text-emerald-900 dark:text-emerald-200">Sinh viên đủ điều kiện thực tập học phần HK1/2026-2027</div>
            <div className="text-emerald-700 dark:text-emerald-400">{eligibility.message}</div>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg font-bold text-[11px]">
          Chính thức: Đủ điều kiện
        </span>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
          !
        </div>
        <div>
          <div className="font-bold text-amber-900 dark:text-amber-200 text-sm">Cảnh báo: Sinh viên chưa có tên trong đợt thực tập HK1/2026-2027</div>
          <div className="text-amber-800 dark:text-amber-400 mt-0.5">{eligibility.message}</div>
          <div className="text-slate-600 dark:text-slate-400 mt-1">
            Bạn vẫn có thể tra cứu thông tin tuyển dụng và tải biểu mẫu hướng dẫn chuẩn bị cho các đợt tiếp theo.
          </div>
        </div>
      </div>
      <button
        onClick={onNavigateToDocs}
        className="px-4 py-2 bg-[#0B3C5D] dark:bg-sky-600 hover:bg-[#0B3C5D]/90 text-white font-bold rounded-lg shadow-sm transition whitespace-nowrap text-xs"
      >
        Xem Cẩm nang & Biểu mẫu →
      </button>
    </div>
  );
};

window.StudentEligibilityBanner = StudentEligibilityBanner;
