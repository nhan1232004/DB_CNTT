const fs = require('fs');

console.log('2. Updating ImportDataPage.jsx and .tsx...');
['frontend/src/pages/ImportDataPage.jsx', 'frontend/src/pages/ImportDataPage.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace header with clean H1
  const oldHeaderRegex = /\{\/\* Header \*\/\}\s*<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">[\s\S]*?<\/h1>[\s\S]*?<\/p>\s*<\/div>\s*<\/div>\s*<\/div>/;
  
  const newHeader = `{/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">
            Trung tâm Import Dữ liệu Excel
          </h1>
        </div>
      </div>`;

  if (oldHeaderRegex.test(content)) {
    content = content.replace(oldHeaderRegex, newHeader);
    console.log(`Replaced header via regex in ${file}`);
  } else {
    console.log(`Regex did not match in ${file}, checking manually`);
  }

  fs.writeFileSync(file, content, 'utf8');
});
