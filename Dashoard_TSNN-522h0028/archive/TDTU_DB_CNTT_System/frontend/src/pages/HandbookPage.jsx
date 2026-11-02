// Handbook Page Component
const HandbookPage = ({ currentUser }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {currentUser && currentUser.isEnrolledThisSemester === false && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs mt-0.5">
            !
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Bạn chưa có trong danh sách kỳ học HK1 2026-2027
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Bạn vẫn có thể tham khảo quy định, tìm cơ hội thực tập và chuẩn bị hồ sơ. Liên hệ Khoa nếu bạn đã đăng ký môn nhưng chưa thấy thông tin trên hệ thống.
            </p>
          </div>
        </div>
      )}

      

      {/* Hero Banner (Frame 02) */}
      <div className="bg-gradient-to-r from-[#003087] to-[#0047AB] rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-wider text-sky-200">
            CHUẨN BỊ TỐT · KHỞI ĐẦU VỮNG VÀNG
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Cẩm nang thực tập
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-900/60 border border-white/20 text-xs font-bold rounded-lg">
              HK1 2026–2027
            </span>
          </div>
          <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
            Thông tin cần thiết cho học phần thực tập KTCN / TSNN. Quy định, biểu mẫu và kênh hướng dẫn chính thức từ Khoa CNTT.
          </p>
        </div>
        {/* Background emblem decoration */}
        <div className="absolute right-6 -bottom-6 text-white/5 font-black text-9xl select-none pointer-events-none">
          TDTU
        </div>
      </div>

      {/* Main Content: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Section (2 cols wide): Schedule, PDFs, Accordions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Quy định và lịch trình thực tập */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Quy định và lịch trình thực tập
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mốc thời gian tham khảo học kỳ HK1 2026–2027
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-lg self-start sm:self-auto">
                Đang mở
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sinh viên cần hoàn tất khai báo doanh nghiệp, cập nhật chứng chỉ và nộp hồ sơ đúng hạn. Hồ sơ sẽ được Khoa thẩm định trực tiếp trên hệ thống.
            </p>

            {/* Timeline Table (Frame 02) */}
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Tìm kiếm và xác nhận nơi thực tập
                </span>
                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-[#003087] dark:text-sky-300 font-bold text-xs rounded-lg">
                  01–15/09
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Hoàn thiện hồ sơ · Xác nhận doanh nghiệp
                </span>
                <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-lg">
                  16–30/09
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Thực tập và cập nhật tiến độ
                </span>
                <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold text-xs rounded-lg">
                  10–12/2026
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Nộp báo cáo và đánh giá doanh nghiệp
                </span>
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-lg">
                  Trước 05/01/2027
                </span>
              </div>
            </div>

            {/* 2 PDF Download Cards (Frame 02) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href="#download"
                onClick={(e) => { e.preventDefault(); alert('Tải xuống tệp: Quy định thực tập HK1 2026–2027.pdf'); }}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/30 transition flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#E31837] font-black text-xs flex items-center justify-center shrink-0">
                  PDF
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#003087] truncate">
                    Quy định thực tập HK1 2026–2027.pdf
                  </div>
                  <div className="text-[10px] text-slate-400">PDF · 248 KB</div>
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>

              <a
                href="#download"
                onClick={(e) => { e.preventDefault(); alert('Tải xuống tệp: Kế hoạch KTCN và TSNN.pdf'); }}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/30 transition flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#E31837] font-black text-xs flex items-center justify-center shrink-0">
                  PDF
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#003087] truncate">
                    Kế hoạch KTCN và TSNN.pdf
                  </div>
                  <div className="text-[10px] text-slate-400">PDF · 186 KB</div>
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>

          </div>

          {/* 4 Accordions Section (Frame 02) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Hướng dẫn chi tiết & Câu hỏi thường gặp
            </h3>

            {accordions.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-4 text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-between gap-3"
                >
                  <span>{item.title}</span>
                  <span className={`transform transition-transform text-slate-400 text-sm ${openAccordion === idx ? 'rotate-180 text-[#003087]' : ''}`}>
                    ▾
                  </span>
                </button>
                {openAccordion === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/30">
                    {item.content}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Right Section (1 col wide): Getting Started, CV Template, Contact Support */}
        <div className="space-y-6">
          
          {/* Card: Bắt đầu từ đâu? */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Bắt đầu từ đâu?
            </h3>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#003087] dark:text-sky-300 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <span>Đọc yêu cầu môn học</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#003087] dark:text-sky-300 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <span>Chuẩn bị CV và bảng điểm</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#003087] dark:text-sky-300 font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                <span>Tìm doanh nghiệp phù hợp</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#003087] dark:text-sky-300 font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                <span>Theo dõi thông báo từ Khoa</span>
              </div>
            </div>

            {/* Download CV Card (Frame 02) */}
            <div className="pt-2">
              <a
                href="#download-cv"
                onClick={(e) => { e.preventDefault(); alert('Tải xuống tệp: Mẫu CV sinh viên.docx'); }}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:border-blue-400 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-[#003087] font-bold text-[10px] flex items-center justify-center">
                    DOC
                  </span>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-[#003087]">
                      Mẫu CV sinh viên.docx
                    </div>
                    <div className="text-[10px] text-slate-400">DOCX · 95 KB</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>
          </div>

          {/* Card: Khoa luôn đồng hành (Frame 02) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Khoa luôn đồng hành
            </h3>

            <div className="text-xs space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Bộ phận hỗ trợ thực tập
              </div>
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:thuctap.cntt@tdtu.edu.vn" className="text-[#003087] dark:text-sky-400 hover:underline">
                  thuctap.cntt@tdtu.edu.vn
                </a>
              </div>

              <div className="text-slate-600 dark:text-slate-400 flex items-start gap-1.5 pt-1">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-slate-700 dark:text-slate-300">Thứ Hai–Thứ Sáu</div>
                  <div className="text-[11px] text-slate-400">07:30–11:30 · 13:00–17:00</div>
                </div>
              </div>

              <div className="text-slate-600 dark:text-slate-400 flex items-start gap-1.5 pt-1">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div className="font-medium text-slate-700 dark:text-slate-300">Văn phòng Khoa CNTT</div>
                  <div className="text-[11px] text-slate-400">Phòng C.005, ĐH Tôn Đức Thắng (Số 19 Nguyễn Hữu Thọ, Q.7)</div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              Thông tin liên hệ minh họa; xác nhận qua kênh chính thức của Khoa.
            </div>
          </div>

        </div>

      </div>

      {/* Footer Branding */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-4">
        © Khoa Công nghệ Thông tin · Trường Đại học Tôn Đức Thắng
      </div>

    </div>
  );
};

window.HandbookPage = HandbookPage;
