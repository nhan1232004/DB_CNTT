// Student Eligibility & Placement Banner Component (Item 1 - Note_Fix.docx)
// Tách làm 2 trường hợp loại trừ lẫn nhau:
// - TH1: Chưa đủ điều kiện (không đăng ký học phần nào trong kỳ) -> Chỉ hiển thị khung "Chưa đủ điều kiện thực tập", ẩn khung chưa có nơi thực tập.
// - TH2: Đủ điều kiện (đăng ký 1 hoặc 2 học phần) ->
//    + Nếu chưa xác nhận có doanh nghiệp: Chỉ hiển thị 1 khung "Sinh viên đủ điều kiện thực tập".
//    + Nếu đã xác nhận có doanh nghiệp (has_company): Ẩn khung "Đủ điều kiện thực tập", chỉ hiển thị 1 khung "Đã có nơi thực tập".

const StudentEligibilityBanner = ({ currentUser, declaration, studentRecord, onNavigateTab }) => {
  if (!currentUser || currentUser.role !== 'student') return null;

  const studentId = (currentUser.studentId || currentUser.mssv || '522H0045').toUpperCase();
  // Đối với sinh viên ngoài kỳ / không có trong danh sách đăng ký: Ẩn hoàn toàn banner điều kiện thực tập
  if (currentUser.isEnrolledThisSemester === false || studentId === '52100999' || studentId === '523H0077') {
    return null;
  }
  const enrolledCourses = (() => {
    if (studentRecord) {
      const cArr = Array.isArray(studentRecord.courses) ? studentRecord.courses.map((c: any) => String(c).toUpperCase()) : [];
      const cCode = String(studentRecord.courseCode || studentRecord.course_str || studentRecord.courseName || '').toUpperCase();
      const hasKtcn = cArr.some((c: string) => c.includes('KTCN') || c.includes('KIẾN TẬP')) || cCode.includes('KTCN') || cCode.includes('KIẾN TẬP') || Boolean(studentRecord.ktcnEnrolled);
      const hasTsnn = cArr.some((c: string) => c.includes('TSNN') || c.includes('TẬP SỰ') || c.includes('DỰ ÁN')) || cCode.includes('TSNN') || cCode.includes('TẬP SỰ') || cCode.includes('DỰ ÁN') || Boolean(studentRecord.tsnnEnrolled);
      if ((hasKtcn && hasTsnn) || studentRecord.isDualCourse === true || studentRecord.isDualCourse === 1 || cCode.includes('SONG SONG')) {
        return ['KTCN', 'TSNN'];
      }
      if (hasTsnn && !hasKtcn) return ['TSNN'];
      if (hasKtcn) return ['KTCN'];
    }
    if (Array.isArray(declaration?.selectedCourses) && declaration.selectedCourses.length > 0) {
      return declaration.selectedCourses;
    }
    if (currentUser.isEnrolledThisSemester === false) return [];
    const uCode = String(currentUser.courseCode || currentUser.courseName || '').toUpperCase();
    if (uCode.includes('KTCN') && uCode.includes('TSNN')) return ['KTCN', 'TSNN'];
    if (uCode.includes('TSNN') || uCode.includes('TẬP SỰ')) return ['TSNN'];
    return ['KTCN'];
  })();
  const isEligible = currentUser.isEnrolledThisSemester !== false && studentId !== '52100999' && Array.isArray(enrolledCourses) && enrolledCourses.length > 0;
  const hasConfirmedCompany = isEligible && declaration?.internshipStatus === 'has_company' && Boolean(declaration?.companyName);

  // TH1: Chưa đủ điều kiện (không có đăng ký bất kỳ học phần nào) -> Chỉ hiển thị khung Chưa đủ điều kiện
  if (!isEligible) {
    return (
      <div className="bg-[#fef2f2] rounded-xl p-6 border border-[#fecaca] border-l-4 border-l-[#dc2626] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white text-[#dc2626] flex items-center justify-center font-bold shrink-0 border border-[#fecaca]">
              <svg className="w-6 h-6 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-bold text-[19px] text-[#dc2626]">
                  Sinh viên chưa đủ điều kiện thực tập · Học kỳ HK1 2026–2027
                </h3>
                <span className="px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-white text-[#dc2626] border border-[#fecaca]">
                  Chưa đăng ký học phần
                </span>
              </div>
              <p className="text-[12.5px] text-[#1f2937] mt-1.5 leading-relaxed text-justify">
                Mã số SV: <strong className="font-mono text-[#003087]">{studentId}</strong> · <strong>{currentUser.name}</strong>. Bạn chưa có tên trong danh sách đăng ký học phần <strong>Kiến tập Công nghiệp (KTCN)</strong> hoặc <strong>Tập sự Nghề nghiệp (TSNN)</strong> trong học kỳ này nên chưa mở cổng khai báo doanh nghiệp.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('bulletin')}
            className="px-5 py-2.5 min-w-[160px] bg-[#003087] hover:bg-[#002266] text-white font-bold text-[12.5px] rounded-lg shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            Xem Bảng tin tuyển dụng
          </button>
        </div>
      </div>
    );
  }

  // TH2 - Nhánh B: Khi sinh viên đã tích nhận có doanh nghiệp thực tập -> Mất khung đủ điều kiện, chỉ hiển thị 1 khung Đã có nơi thực tập
  if (hasConfirmedCompany) {
    return (
      <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] border-l-4 border-l-[#15803d] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#f0fdf4] text-[#15803d] flex items-center justify-center font-bold shrink-0 border border-[#bbf7d0]">
              <svg className="w-6 h-6 text-[#15803d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[19px] text-[#1f2937] text-left">
                Đã có nơi thực tập · Học kỳ HK1 2026–2027
              </h3>
              <p className="text-[14px] text-[#4b5563] mt-0.5">
                Mã số SV: <strong className="text-[#003087] font-mono">{studentId}</strong> · <span className="font-bold text-[#1f2937]">{currentUser?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 rounded-full text-[13px] font-bold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
              ✓ Đã có đơn vị tiếp nhận
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('declaration')}
              className="px-5 py-2.5 min-w-[150px] bg-[#003087] hover:bg-[#002266] text-white font-bold text-[12.5px] rounded-lg shadow-xs transition cursor-pointer whitespace-nowrap"
            >
              Chỉnh sửa khai báo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[12.5px]">
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e5e7eb]">
            <span className="text-[#1f2937] text-[11px] block font-bold uppercase tracking-wider">Doanh nghiệp tiếp nhận</span>
            <strong className="text-[#1f2937] text-[14px] block truncate mt-1">{declaration.companyName}</strong>
            {declaration.taxCode && <span className="text-[#1f2937] text-[11.5px] font-mono block mt-1">MST: {declaration.taxCode}</span>}
          </div>
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e5e7eb]">
            <span className="text-[#1f2937] text-[11px] block font-bold uppercase tracking-wider">Vị trí thực tập</span>
            <strong className="text-[#1f2937] text-[14px] block truncate mt-1">{declaration.position || 'Thực tập sinh'}</strong>
            {declaration.department && <span className="text-[#1f2937] text-[11.5px] block truncate mt-1">{declaration.department}</span>}
          </div>
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e5e7eb]">
            <span className="text-[#1f2937] text-[11px] block font-bold uppercase tracking-wider">Người hướng dẫn</span>
            <strong className="text-[#003087] text-[14px] block truncate mt-1">{declaration.contactPerson || 'Đang cập nhật'}</strong>
          </div>
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e5e7eb]">
            <span className="text-[#1f2937] text-[11px] block font-bold uppercase tracking-wider">Học phần đăng ký</span>
            <strong className="text-[#1f2937] text-[14px] block mt-1">
              {enrolledCourses.length > 1 ? 'KTCN & TSNN (Song song)' : (enrolledCourses[0] || 'KTCN')}
            </strong>
            <span className="text-[#003087] text-[11.5px] font-bold block mt-1">Đã xác nhận đơn vị tiếp nhận</span>
          </div>
        </div>
      </div>
    );
  }

  // TH2 - Nhánh A: Sinh viên có đăng ký 1 hay 2 học phần nhưng CHƯA có doanh nghiệp -> Chỉ hiển thị 1 khung "Sinh viên đủ điều kiện thực tập"
  return (
    <div className="bg-white rounded-xl p-6 border border-[#bfdbfe] border-l-4 border-l-[#003087] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#ebf3ff] text-[#003087] flex items-center justify-center font-bold shrink-0 border border-[#bfdbfe]">
            <svg className="w-6 h-6 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-[19px] text-[#003087]">
                Sinh viên đủ điều kiện thực tập · Học kỳ HK1 2026–2027
              </h3>
              <span className="px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe]">
                Đã đăng ký {enrolledCourses.length} học phần ({enrolledCourses.join(' + ')})
              </span>
              {declaration?.internshipStatus === 'need_support' && (
                <span className="px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                  Đã đăng ký Khoa hỗ trợ
                </span>
              )}
              {declaration?.internshipStatus === 'interviewing' && (
                <span className="px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-white text-[#1f2937] border border-[#e5e7eb]">
                  Đang tìm / Chờ phỏng vấn
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-[#1f2937] mt-1.5 leading-relaxed text-justify">
              Mã số SV: <strong className="font-mono text-[#003087]">{studentId}</strong> · <strong>{currentUser.name}</strong>
              {studentRecord?.gpa10 ? ` · GPA (Hệ 10): ${studentRecord.gpa10} (${studentRecord.academicRank || 'Khá'})` : ''}.
              Bạn đã đủ điều kiện tham gia đợt thực tập học kỳ này. Khi có doanh nghiệp tiếp nhận chính thức, vui lòng tích chọn <strong>"Đã có nơi thực tập"</strong> trong mục Khai báo để cập nhật đơn vị thực tập.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('declaration')}
          className="px-5 py-2.5 min-w-[160px] bg-[#003087] hover:bg-[#002266] text-white font-bold text-[12.5px] rounded-lg shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
        >
          Khai báo nơi thực tập
        </button>
      </div>
    </div>
  );
};

window.StudentEligibilityBanner = StudentEligibilityBanner;
