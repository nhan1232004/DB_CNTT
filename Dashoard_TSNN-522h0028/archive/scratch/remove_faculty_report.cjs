const fs = require('fs');

function removeFacultyReport(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(/\r\n/g, '\n');

  // 1. Remove In Báo cáo (PDF) button from top header
  const oldPrintBtn = `          <button
            type="button"
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="In hoặc xuất file PDF văn bản báo cáo họp Khoa"
          >
            <span>🖨️</span>
            <span>In Báo cáo (PDF)</span>
          </button>`;

  if (c.includes(oldPrintBtn)) {
    c = c.replace(oldPrintBtn, '');
    console.log(`Removed print button in ${filePath}`);
  }

  // 2. Replace grid layout and remove right column (Bản xem trước Báo cáo Họp Khoa)
  // Find from '{/* Main Split Section:' to '© Khoa Công nghệ Thông tin'
  const startPattern = '{/* Main Split Section:';
  const endPattern = '{/* Footer Branding */}';

  const startIndex = c.indexOf(startPattern);
  const endIndex = c.indexOf(endPattern);

  if (startIndex !== -1 && endIndex !== -1) {
    // Extract the section inside and inspect
    const targetSection = c.slice(startIndex, endIndex);

    // Let's create the replacement full-width student table section
    // Keep everything inside Left Column, but remove grid-12, col-span-7, and col-span-5
    const leftColStart = targetSection.indexOf('<div className="lg:col-span-7');
    if (leftColStart !== -1) {
      // Find where Left Column ends: before '{/* Right Column:'
      const rightColStart = targetSection.indexOf('{/* Right Column:');
      if (rightColStart !== -1) {
        // Extract the content of the left column (inside lg:col-span-7)
        let leftContent = targetSection.slice(leftColStart, rightColStart);
        // Remove the outer '<div className="lg:col-span-7...' tag and its matching closing '</div>'
        // Actually we can replace the outer wrapper of Left Column with full-width container
        leftContent = leftContent.replace(
          /<div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 no-print">/,
          '<div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">'
        );
        // Trim trailing whitespace and the last '</div>' which closed the left column
        // In the original, before '{/* Right Column:', there was a '</div>\n\n        '
        const lastDivIndex = leftContent.lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
          leftContent = leftContent.slice(0, lastDivIndex + 6);
        }

        const newSection = `      {/* Main Section: Full Width Student Data Table & Reports */}
      ${leftContent.trim()}

      `;

        c = c.slice(0, startIndex) + newSection + c.slice(endIndex);
        console.log(`Replaced split section with full-width table in ${filePath}`);
      } else {
        console.error(`Right column start not found in ${filePath}`);
      }
    } else {
      console.error(`Left col start not found in ${filePath}`);
    }
  } else {
    console.error(`Start or end pattern not found in ${filePath}`);
  }

  // 3. Remove the print styles for #official-faculty-report if any
  fs.writeFileSync(filePath, c, 'utf8');
}

removeFacultyReport('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.jsx');
removeFacultyReport('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.tsx');
