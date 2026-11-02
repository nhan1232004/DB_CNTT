// Handbook Page Component - Tuân thủ nghiêm ngặt TDTU Design System & Guidelines
// 1. Màu sắc: Trắng (#ffffff), Xanh dương (#003087), Đỏ (#dc2626)
// 2. Màu chữ: Chỉ Đen (#1f2937) và Đỏ (#dc2626)
// 3. Phông chữ: Body 11px-13px, Tiêu đề in đậm (font-bold)
// 4. Căn lề: Tiêu đề căn trái, đoạn văn mô tả BẮT BUỘC căn đều hai bên (text-justify)

const HandbookPage = ({ currentUser }) => {
  const [openAccordion, setOpenAccordion] = React.useState(null);

  const toggleAccordion = (idx) => {
    setOpenAccordion(openAccordion === idx ? null : idx);
  };

  const accordions = [
    {
      title: '1. Điều kiện tiên quyết để đăng ký học phần thực tập KTCN & TSNN',
      content: 'Sinh viên cần tích lũy tối thiểu 70% tổng số tín chỉ của chương trình đào tạo, hoàn thành đầy đủ các học phần cơ sở ngành và không bị cảnh báo học vụ mức 2 trở lên. Đối với học phần Kiến tập công nghiệp (KTCN), sinh viên cần đáp ứng chuẩn đầu ra ngoại ngữ theo quy định tại thời điểm xét điều kiện học vụ.'
    },
    {
      title: '2. Quy trình liên hệ và thẩm định doanh nghiệp tiếp nhận thực tập',
      content: 'Sinh viên chủ động liên hệ doanh nghiệp phù hợp với chuyên ngành đào tạo (Công nghệ phần mềm, Mạng máy tính, Khoa học dữ liệu...). Sau khi nhận được Thư tiếp nhận hoặc Hợp đồng thực tập, sinh viên phải điền đầy đủ Mã số thuế, Tên người phụ trách và nộp hồ sơ trên cổng để Ban Chủ nhiệm Khoa thẩm định tính hợp lệ.'
    },
    {
      title: '3. Quy định về thời gian, khối lượng công việc và viết báo cáo',
      content: 'Thời gian thực tập tối thiểu kéo dài 8 đến 12 tuần làm việc thực tế tại doanh nghiệp (tương đương 320 giờ làm việc có chấm công). Trong quá trình thực tập, sinh viên phải viết nhật ký công việc hằng tuần, cập nhật tiến độ cho Giảng viên hướng dẫn và chuẩn bị Báo cáo tổng kết có chữ ký xác nhận, đóng dấu của người đại diện doanh nghiệp.'
    },
    {
      title: '4. Hướng dẫn nộp chứng chỉ ngoại ngữ và xử lý cam kết bổ sung',
      content: 'Chứng chỉ ngoại ngữ (TOEIC, IELTS, TOEFL) nộp qua cổng thông tin phải còn thời hạn tối thiểu 6 tháng tính đến ngày khai mạc học kỳ. Trường hợp sinh viên chưa có chứng chỉ chính thức nhưng đã dự thi, cần nộp Bảng điểm tạm thời kèm Giấy cam kết bổ sung chứng chỉ đúng hạn trước khi xét điểm tốt nghiệp học phần.'
    }
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Alert Banner khi sinh viên ngoài kỳ */}
      {currentUser && currentUser.isEnrolledThisSemester === false && (
        <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-xl flex items-start gap-3.5 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#dc2626] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
            !
          </div>
          <div className="space-y-1">
            <div className="text-[13px] font-bold text-[#dc2626]">
              Bạn chưa có trong danh sách kỳ học HK1 2026–2027
            </div>
            <p className="text-[13.5px] text-[#4b5563] text-justify leading-relaxed">
              Bạn vẫn có thể tham khảo quy định, tìm kiếm cơ hội thực tập và chuẩn bị hồ sơ. Vui lòng liên hệ Văn phòng Khoa CNTT nếu bạn đã hoàn tất đăng ký môn học nhưng chưa thấy thông tin cập nhật trên hệ thống.
            </p>
          </div>
        </div>
      )}

      {/* Hero Banner (Primary Blue #003087) */}
      <div className="bg-[#003087] rounded-xl p-6 md:p-8 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-[11px] font-bold uppercase tracking-wider text-white">
            CHUẨN BỊ TỐT · KHỞI ĐẦU VỮNG VÀNG
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white text-left">
              Cẩm nang thực tập
            </h1>
            <span className="px-2.5 py-0.5 bg-white/20 border border-white/30 text-[12px] font-bold rounded-lg text-white">
              HK1 2026–2027
            </span>
          </div>
          <p className="text-[12.5px] text-white/95 text-justify leading-relaxed">
            Cung cấp toàn diện thông tin cần thiết cho học phần thực tập KTCN / TSNN. Tra cứu quy định, tải biểu mẫu chuẩn và nhận kênh hướng dẫn chính thức từ Khoa Công nghệ thông tin Trường Đại học Tôn Đức Thắng.
          </p>
        </div>
      </div>

      {/* Main Content: 2 Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Section (2 cols wide): Schedule, PDFs, Accordions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Quy định và lịch trình thực tập */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5e7eb] pb-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#1f2937] text-left">
                  Quy định và lịch trình thực tập
                </h2>
                <div className="text-[12px] font-semibold text-[#1f2937] mt-0.5">
                  Mốc thời gian tham khảo học kỳ HK1 2026–2027
                </div>
              </div>
              <span className="px-3 py-1 bg-[#ebf3ff] text-[#003087] border border-[#bfdbfe] text-[11px] font-bold rounded-full self-start sm:self-auto">
                Đang mở đăng ký
              </span>
            </div>

            <p className="text-[12.5px] text-[#1f2937] text-justify leading-relaxed">
              Sinh viên cần hoàn tất việc khai báo thông tin doanh nghiệp, cập nhật các chứng chỉ ngoại ngữ bắt buộc và nộp hồ sơ theo đúng thời hạn quy định. Tất cả hồ sơ sẽ được Ban Chủ nhiệm Khoa thẩm định trực tiếp trên hệ thống số hóa.
            </p>

            {/* Timeline Table */}
            <div className="space-y-3">
              <div className="p-3.5 bg-white rounded-xl border border-[#e5e7eb] flex items-center justify-between shadow-xs">
                <span className="text-[12.5px] font-bold text-[#1f2937]">
                  Tìm kiếm và xác nhận nơi thực tập
                </span>
                <span className="px-2.5 py-1 bg-[#ebf3ff] text-[#003087] font-bold text-[12px] rounded-lg border border-[#bfdbfe]">
                  01–15/09
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5e7eb] flex items-center justify-between shadow-xs">
                <span className="text-[12.5px] font-bold text-[#1f2937]">
                  Hoàn thiện hồ sơ · Xác nhận doanh nghiệp
                </span>
                <span className="px-2.5 py-1 bg-[#ebf3ff] text-[#003087] font-bold text-[12px] rounded-lg border border-[#bfdbfe]">
                  16–30/09
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5e7eb] flex items-center justify-between shadow-xs">
                <span className="text-[12.5px] font-bold text-[#1f2937]">
                  Thực tập và cập nhật tiến độ
                </span>
                <span className="px-2.5 py-1 bg-[#ebf3ff] text-[#003087] font-bold text-[12px] rounded-lg border border-[#bfdbfe]">
                  10–12/2026
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5e7eb] flex items-center justify-between shadow-xs">
                <span className="text-[12.5px] font-bold text-[#1f2937]">
                  Nộp báo cáo và đánh giá doanh nghiệp
                </span>
                <span className="px-2.5 py-1 bg-[#fef2f2] text-[#dc2626] font-bold text-[12px] rounded-lg border border-[#fecaca]">
                  Trước 05/01/2027
                </span>
              </div>
            </div>

            {/* 2 PDF Download Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href="#download"
                onClick={(e) => { e.preventDefault(); alert('Tải xuống tệp: Quy định thực tập HK1 2026–2027.pdf'); }}
                className="p-3.5 rounded-xl border border-[#e5e7eb] hover:border-[#003087] bg-white transition flex items-center gap-3 group shadow-xs cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#fef2f2] text-[#dc2626] font-bold text-xs flex items-center justify-center shrink-0 border border-[#fecaca]">
                  PDF
                </div>
                <div className="flex-1 truncate">
                  <div className="text-[12.5px] font-bold text-[#1f2937] group-hover:text-[#003087] truncate">
                    Quy định thực tập HK1 2026–2027.pdf
                  </div>
                  <div className="text-[11px] font-semibold text-[#1f2937]">PDF · 248 KB</div>
                </div>
                <span className="text-[12px] font-bold text-[#003087]">↓</span>
              </a>

              <a
                href="#download"
                onClick={(e) => { e.preventDefault(); alert('Tải xuống tệp: Kế hoạch KTCN và TSNN.pdf'); }}
                className="p-3.5 rounded-xl border border-[#e5e7eb] hover:border-[#003087] bg-white transition flex items-center gap-3 group shadow-xs cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#fef2f2] text-[#dc2626] font-bold text-xs flex items-center justify-center shrink-0 border border-[#fecaca]">
                  PDF
                </div>
                <div className="flex-1 truncate">
                  <div className="text-[12.5px] font-bold text-[#1f2937] group-hover:text-[#003087] truncate">
                    Kế hoạch KTCN và TSNN.pdf
                  </div>
                  <div className="text-[11px] font-semibold text-[#1f2937]">PDF · 186 KB</div>
                </div>
                <span className="text-[12px] font-bold text-[#003087]">↓</span>
              </a>
            </div>

          </div>

          {/* 4 Accordions Section */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-xs space-y-3">
            <h3 className="text-[15px] font-bold text-[#1f2937] uppercase tracking-wider mb-2 text-left">
              Hướng dẫn chi tiết & Câu hỏi thường gặp
            </h3>

            {accordions.map((item, idx) => (
              <div
                key={idx}
                className="border border-[#e5e7eb] rounded-xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-4 text-left font-bold text-[12.5px] text-[#1f2937] hover:bg-[#ebf3ff] flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span>{item.title}</span>
                  <span className={`transform transition-transform text-[#003087] font-bold text-sm ${openAccordion === idx ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>
                {openAccordion === idx && (
                  <div className="px-4 pb-4 pt-2 text-[12px] text-[#1f2937] text-justify leading-relaxed border-t border-[#e5e7eb] bg-white">
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
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-[15px] font-bold text-[#1f2937] text-left">
              Bắt đầu từ đâu?
            </h3>

            <div className="space-y-2.5 text-[12.5px] text-[#1f2937]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#ebf3ff] text-[#003087] font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#bfdbfe]">1</span>
                <span className="font-semibold text-[#1f2937]">Đọc kỹ yêu cầu môn học</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#ebf3ff] text-[#003087] font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#bfdbfe]">2</span>
                <span className="font-semibold text-[#1f2937]">Chuẩn bị CV và bảng điểm</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#ebf3ff] text-[#003087] font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#bfdbfe]">3</span>
                <span className="font-semibold text-[#1f2937]">Tìm doanh nghiệp phù hợp</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#ebf3ff] text-[#003087] font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#bfdbfe]">4</span>
                <span className="font-semibold text-[#1f2937]">Theo dõi thông báo từ Khoa</span>
              </div>
            </div>

            {/* Download CV Card */}
            <div className="pt-2">
              <a
                href="#download-cv"
                onClick={(e) => { e.preventDefault(); alert('Tải xuống tệp: Mẫu CV sinh viên.docx'); }}
                className="p-3 rounded-xl border border-[#e5e7eb] bg-white hover:border-[#003087] transition flex items-center justify-between group shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#ebf3ff] text-[#003087] font-bold text-[10px] flex items-center justify-center border border-[#bfdbfe]">
                    DOC
                  </span>
                  <div>
                    <div className="font-bold text-[12.5px] text-[#1f2937] group-hover:text-[#003087]">
                      Mẫu CV sinh viên.docx
                    </div>
                    <div className="text-[11px] font-semibold text-[#1f2937]">DOCX · 95 KB</div>
                  </div>
                </div>
                <span className="text-[12px] font-bold text-[#003087]">↓</span>
              </a>
            </div>
          </div>

          {/* Card: Khoa luôn đồng hành */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-[15px] font-bold text-[#1f2937] text-left">
              Khoa luôn đồng hành
            </h3>

            <div className="text-[12px] space-y-2">
              <div className="font-bold text-[#1f2937]">
                Bộ phận hỗ trợ thực tập Khoa CNTT
              </div>
              <div className="text-[#1f2937] flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#003087] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:thuctap.cntt@tdtu.edu.vn" className="text-[#003087] font-bold hover:underline">
                  thuctap.cntt@tdtu.edu.vn
                </a>
              </div>

              <div className="text-[#1f2937] flex items-start gap-1.5 pt-1">
                <svg className="w-4 h-4 text-[#003087] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-bold text-[#1f2937]">Thứ Hai – Thứ Sáu</div>
                  <div className="text-[11px] font-semibold text-[#1f2937]">07:30–11:30 · 13:00–17:00</div>
                </div>
              </div>

              <div className="text-[#1f2937] flex items-start gap-1.5 pt-1">
                <svg className="w-4 h-4 text-[#003087] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div className="font-bold text-[#1f2937]">Văn phòng Khoa CNTT</div>
                  <div className="text-[11px] text-[#1f2937] text-justify leading-relaxed">Phòng C.005, Trường ĐH Tôn Đức Thắng (Số 19 Nguyễn Hữu Thọ, P. Tân Phong, Q.7, TP.HCM)</div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#1f2937] font-medium pt-2 border-t border-[#e5e7eb] text-justify">
              Mọi thắc mắc về hồ sơ và thủ tục xin liên hệ trực tiếp văn phòng Khoa trong giờ hành chính.
            </div>
          </div>

        </div>

      </div>

      {/* Footer Branding */}
      <div className="text-[11px] font-bold text-[#1f2937] text-center pt-4">
        © Khoa Công nghệ Thông tin · Trường Đại học Tôn Đức Thắng
      </div>

    </div>
  );
};

window.HandbookPage = HandbookPage;