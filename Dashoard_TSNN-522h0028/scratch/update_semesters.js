const fs = require('fs');

console.log('1. Updating SemestersPage.jsx and .tsx...');
['frontend/src/pages/SemestersPage.jsx', 'frontend/src/pages/SemestersPage.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace default regulationNotes with empty string
  content = content.replace(
    /regulationNote:\s*'Sinh viên hoàn thành khai báo doanh nghiệp trước 23:59 ngày 30\/09\/2026 để Khoa kịp thời thẩm định\.',/g,
    "regulationNote: '',"
  );
  content = content.replace(
    /regulationNote:\s*'Đợt thực tập học kỳ hè và học kỳ 2 dành cho sinh viên hoàn thành chứng chỉ tiếng Anh\.',/g,
    "regulationNote: '',"
  );
  content = content.replace(
    /regulationNote:\s*'Đã hoàn tất báo cáo và nghiệm thu điểm học phần\.',/g,
    "regulationNote: '',"
  );

  // In newSemester creation, remove default text
  content = content.replace(
    /regulationNote:\s*newRegulationNote\.trim\(\)\s*\|\|\s*'Học kỳ mới được tạo trên hệ thống\.',/g,
    "regulationNote: newRegulationNote.trim(),"
  );

  // In localStorage load, sanitize old notes
  const oldLoadPattern = `if (Array.isArray(parsed) && parsed.length > 0) return parsed;`;
  const newLoadPattern = `if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => {
            if (s.regulationNote && (
              s.regulationNote.includes('Sinh viên hoàn thành khai báo') ||
              s.regulationNote.includes('Đợt thực tập học kỳ hè') ||
              s.regulationNote.includes('Đã hoàn tất báo cáo')
            )) {
              return { ...s, regulationNote: '' };
            }
            return s;
          });
        }`;
  if (content.includes(oldLoadPattern)) {
    content = content.replace(oldLoadPattern, newLoadPattern);
  }

  // Ensure card only renders regulationNote if non-empty
  const oldCardNote = `<div className="text-[11px] text-[#1f2937]  mt-3 italic line-clamp-2">
                  "{sem.regulationNote}"
                </div>`;
  const newCardNote = `{sem.regulationNote ? (
                  <div className="text-[11px] text-[#1f2937] mt-3 italic line-clamp-2">
                    "{sem.regulationNote}"
                  </div>
                ) : null}`;
  if (content.includes(oldCardNote)) {
    content = content.replace(oldCardNote, newCardNote);
  } else {
    // Also try without spaces before mt-3
    content = content.replace(
      /<div className="text-\[11px\] text-\[#1f2937\]\s+mt-3 italic line-clamp-2">\s*"\{sem\.regulationNote\}"\s*<\/div>/g,
      `{sem.regulationNote ? (
                  <div className="text-[11px] text-[#1f2937] mt-3 italic line-clamp-2">
                    "{sem.regulationNote}"
                  </div>
                ) : null}`
    );
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Saved ${file}`);
});
