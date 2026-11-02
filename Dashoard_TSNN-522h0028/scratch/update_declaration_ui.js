const fs = require('fs');

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // 1. stepsMeta label for step 2
  content = content.replace(
    "{ num: 2, label: 'Doanh nghiệp & Mentor' }",
    "{ num: 2, label: 'Doanh nghiệp' }"
  );

  // 2. fetchStudentEnrolledCourse txt
  content = content.replace(
    /const txt = isDual\s*\?\s*'Phân bổ chính thức: KTCN \(Kiến tập công nghiệp - 160h\) & TSNN \(Tập sự nghề nghiệp - 320h\) \[Học song song\]'\s*:\s*enrolledCourses\.includes\('TSNN'\)\s*\?\s*'Phân bổ chính thức: TSNN \(Tập sự nghề nghiệp - 320h\)'\s*:\s*'Phân bổ chính thức: KTCN \(Kiến tập công nghiệp - 160h\)';/,
    `const txt = isDual 
            ? 'Phân bổ chính thức: KTCN & TSNN'
            : enrolledCourses.includes('TSNN')
              ? 'Phân bổ chính thức: TSNN'
              : 'Phân bổ chính thức: KTCN';`
  );

  // 3. courseDisplay
  content = content.replace(
    /const courseDisplay = isDualCourse \|\| selectedCourses\.length === 2\s*\?\s*'KTCN & TSNN — Thực tập Song song \(2 môn\)'\s*:\s*selectedCourses\.includes\('TSNN'\)\s*\?\s*'TSNN — Tập sự Nghề nghiệp'\s*:\s*'KTCN — Kiến tập Công nghiệp';/,
    `const courseDisplay = isDualCourse || selectedCourses.length === 2
    ? 'KTCN & TSNN'
    : selectedCourses.includes('TSNN')
      ? 'TSNN'
      : 'KTCN';`
  );

  // 4. Hero banner: Remove (Mã 503112 + 503113 - 480 giờ)
  content = content.replace(
    /<span className="text-sky-300">\(\{isDualCourse \? 'Mã 503112 \+ 503113 - 480 giờ' : selectedCourses\.includes\('TSNN'\) \? 'Mã 503113 - 320 giờ' : 'Mã 503112 - 160 giờ'\}\)<\/span>/,
    ''
  );
  content = content.replace(
    /<strong className="text-white underline underline-offset-2">\{courseDisplay\}<\/strong>/,
    '<strong className="text-white font-bold">{courseDisplay}</strong>'
  );

  // 5. Stepper active label color
  content = content.replace(
    "isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'",
    "isCurrent ? 'text-[#1f2937]' : 'text-slate-400'"
  );

  // 6. Step 1 cards titles & texts
  content = content.replace(
    '<div className="font-extrabold text-sm text-slate-900 dark:text-white">\n                          Đã có nơi thực tập\n                        </div>\n                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">\n                          Doanh nghiệp đã đồng ý tiếp nhận bạn làm thực tập sinh. Bạn cần nhập MST và thông tin Mentor.\n                        </p>',
    '<div className="font-extrabold text-sm text-[#1f2937]">\n                          Đã có nơi thực tập\n                        </div>\n                        <p className="text-xs text-[#4b5563] leading-relaxed">\n                          Doanh nghiệp đã đồng ý tiếp nhận bạn làm thực tập sinh. Bạn cần nhập MST và thông tin người hướng dẫn.\n                        </p>'
  );

  content = content.replace(
    '<div className="font-extrabold text-sm text-slate-900 dark:text-white">\n                          Đang tìm / Chờ phỏng vấn\n                        </div>\n                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">',
    '<div className="font-extrabold text-sm text-[#1f2937]">\n                          Đang tìm / Chờ phỏng vấn\n                        </div>\n                        <p className="text-xs text-[#4b5563] leading-relaxed">'
  );

  content = content.replace(
    '<div className="font-extrabold text-sm text-slate-900 dark:text-white">\n                          Cần Khoa hỗ trợ\n                        </div>\n                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">',
    '<div className="font-extrabold text-sm text-[#1f2937]">\n                          Cần Khoa hỗ trợ\n                        </div>\n                        <p className="text-xs text-[#4b5563] leading-relaxed">'
  );

  // Step 2 Step Titles
  content = content.replace(
    '<span>Thông tin Doanh nghiệp & Cán bộ hướng dẫn (Mentor)</span>',
    '<span>Thông tin Doanh nghiệp & Cán bộ hướng dẫn</span>'
  );
  content = content.replace(
    'Nhập Mã số thuế để tự động điền dữ liệu trực tuyến từ Tổng cục Thuế, sau đó nhập thông tin Mentor.',
    'Nhập Mã số thuế để tra cứu thông tin doanh nghiệp, sau đó nhập thông tin người hướng dẫn.'
  );

  // 7. Remove (10 hoặc 13 chữ số)
  content = content.replace(
    '<span className="text-[11px] text-slate-400 font-normal">(10 hoặc 13 chữ số)</span>',
    ''
  );

  // 8. Placeholders for MST and Company Name
  content = content.replace(
    'placeholder="VD: 0302722146 hoặc 0101248141..."',
    'placeholder=""'
  );
  content = content.replace(
    'placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ THÔNG TIN FPT..."',
    'placeholder=""'
  );

  // 9. Address label: ĐỊA CHỈ TRỤ SỞ / ĐỊA ĐIỂM THỰC TẬP: * -> ĐỊA CHỈ THỰC TẬP: *
  content = content.replace(
    'ĐỊA CHỈ TRỤ SỞ / ĐỊA ĐIỂM THỰC TẬP: *',
    'ĐỊA CHỈ THỰC TẬP: *'
  );

  // 10. Mentor label: HỌ VÀ TÊN CÁN BỘ HƯỚNG DẪN / MENTOR: * -> HỌ VÀ TÊN CÁN BỘ HƯỚNG DẪN: *
  content = content.replace(
    'HỌ VÀ TÊN CÁN BỘ HƯỚNG DẪN / MENTOR: *',
    'HỌ VÀ TÊN CÁN BỘ HƯỚNG DẪN: *'
  );
  content = content.replace(
    '<span>Cán bộ hướng dẫn trực tiếp tại Doanh nghiệp (Mentor):</span>',
    '<span>Cán bộ hướng dẫn tại Doanh nghiệp:</span>'
  );
  content = content.replace(
    'placeholder="VD: Nguyễn Văn Mentor / Tech Lead / Trưởng nhóm..."',
    'placeholder=""'
  );
  content = content.replace(
    'Cán bộ hướng dẫn (Mentor)',
    'Cán bộ hướng dẫn'
  );

  // 11. Headers text color fix (text-slate-900 dark:text-white -> text-[#1f2937])
  content = content.replace(
    /<h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">/g,
    '<h2 className="text-base font-black text-[#1f2937] flex items-center gap-2">'
  );

  // 12. Final confirmation checkbox text
  content = content.replace(
    /Tôi xác nhận các thông tin trên là chính xác và cam kết hoàn thành đúng khối lượng <strong>\{isDualCourse \? '480 giờ \(KTCN 160h \+ TSNN 320h\)' : selectedCourses\.includes\('TSNN'\) \? '320 giờ \(TSNN\)' : '160 giờ \(KTCN\)'\}<\/strong> thực tập theo quy chế của Khoa CNTT - ĐH Tôn Đức Thắng\./,
    'Tôi xác nhận các thông tin trên là chính xác và cam kết hoàn thành đúng khối lượng thời gian của môn học thực tập theo quy chế của Khoa CNTT - ĐH Tôn Đức Thắng.'
  );

  // 13. Right sidebar: remove "Hồ sơ đang soạn thảo. Hãy hoàn tất các bước để hệ thống ghi nhận thời gian thực nộp về Khoa."
  content = content.replace(
    /\s*\)\s*:\s*\(\s*<div className="p-3 bg-blue-50\/70 dark:bg-blue-950\/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">\s*<span>ℹ️<\/span>\s*<span>Hồ sơ đang soạn thảo\. Hãy hoàn tất các bước để hệ thống ghi nhận thời gian thực nộp về Khoa\.<\/span>\s*<\/div>\s*\)/,
    ') : null'
  );

  // 14. Right sidebar: remove Khối lượng: KTCN (160h) + TSNN (320h)
  content = content.replace(
    /\s*<div className="text-\[11px\] text-slate-500">\s*Khối lượng:\s*<strong>\{isDualCourse \? 'KTCN \(160h\) \+ TSNN \(320h\)' : selectedCourses\.includes\('TSNN'\) \? 'TSNN \(320h\)' : 'KTCN \(160h\)'\}<\/strong>\s*<\/div>/,
    ''
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Successfully updated:', filePath);
  } else {
    console.log('No modifications made to:', filePath);
  }
}

updateFile('frontend/src/pages/DeclarationPage.jsx');
updateFile('frontend/src/pages/DeclarationPage.tsx');
