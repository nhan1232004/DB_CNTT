const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/ImportDataPage.tsx', 'utf8');

const target = `<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg font-bold">
            📥
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Trung tâm Import Dữ liệu Excel</span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Mã quyền: {mask} (Read 2 × Import 13)
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Nạp danh sách sinh viên hàng loạt, tự động hợp nhất 2 Sheet KTCN / TSNN và phân loại học phần song song
            </p>
          </div>
        </div>
      </div>`;

const replacement = `<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Trung tâm Import Dữ liệu Excel
          </h1>
        </div>
      </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('frontend/src/pages/ImportDataPage.tsx', content, 'utf8');
  console.log('Successfully updated ImportDataPage.tsx');
} else {
  console.error('Target not found in ImportDataPage.tsx');
}
