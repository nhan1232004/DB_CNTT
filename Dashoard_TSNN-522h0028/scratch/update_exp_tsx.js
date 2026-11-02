const fs = require('fs');

const path = 'frontend/src/pages/ExportDataPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `<div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#003087] dark:text-sky-300 flex items-center justify-center text-lg font-bold">
            📤
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Trung tâm Export Dữ liệu & Báo cáo</span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#003087] dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                Mã quyền: {mask} (Read 2 × Export 17)
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kết xuất dữ liệu thô, báo cáo kiểm định chất lượng đào tạo và danh sách học vụ chuẩn định dạng Khoa CNTT
            </p>
          </div>
        </div>`;

const replacement = `<div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Trung tâm Export Dữ liệu & Báo cáo
          </h1>
        </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated ExportDataPage.tsx header');
} else {
  console.error('Target not found in ExportDataPage.tsx');
}
