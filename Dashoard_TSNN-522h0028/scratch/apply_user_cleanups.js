const fs = require('fs');

console.log('--- 1. Updating AccountsPage.jsx ---');
{
  const file = 'frontend/src/pages/AccountsPage.jsx';
  let content = fs.readFileSync(file, 'utf8');
  
  const oldOnlineRegex = /<div className="flex items-center gap-2 mt-1\.5">\s*<span className="inline-flex items-center gap-1\.5 px-2\.5 py-0\.5 rounded-full text-\[11\.5px\] font-bold bg-\[#ebf3ff\]\s+text-\[#003087\]\s+border border-\[#bfdbfe\]\s*">\s*<span className="w-2 h-2 rounded-full bg-\[#003087\] animate-pulse"><\/span>\s*Hệ thống trực tuyến \(Online\)\s*<\/span>\s*<\/div>/;

  if (oldOnlineRegex.test(content)) {
    content = content.replace(oldOnlineRegex, '');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully removed "Hệ thống trực tuyến (Online)" from AccountsPage.jsx');
  } else {
    console.log('Regex did not match for AccountsPage.jsx online tag, trying direct string replace...');
    const target = `<div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#ebf3ff]  text-[#003087]  border border-[#bfdbfe] ">
              <span className="w-2 h-2 rounded-full bg-[#003087] animate-pulse"></span>
              Hệ thống trực tuyến (Online)
            </span>
          </div>`;
    if (content.includes(target)) {
      content = content.replace(target, '');
      fs.writeFileSync(file, content, 'utf8');
      console.log('Successfully replaced via string target');
    } else {
      console.error('Target not found in AccountsPage.jsx');
    }
  }
}

console.log('--- 2. Updating DocumentsPage.jsx and .tsx ---');
['frontend/src/pages/DocumentsPage.jsx', 'frontend/src/pages/DocumentsPage.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Remove subtitle under Thống kê & Báo cáo
  content = content.replace(
    /<p className="text-\[14px\] text-\[#1f2937\]\s+mt-1">\s*Học kỳ 1 · Năm học 2026–2027 · Phê duyệt hồ sơ & Thống kê Khoa CNTT\s*<\/p>/g,
    ''
  );
  content = content.replace(
    /<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">\s*Học kỳ 1 · Năm học 2026–2027 · Phê duyệt hồ sơ & Thống kê Khoa CNTT\s*<\/p>/g,
    ''
  );

  // Remove " · Tích chọn để xuất file Excel hoặc in báo cáo"
  content = content.replace(/ · Tích chọn để xuất file Excel hoặc in báo cáo/g, '');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});

console.log('--- 3. Updating SemestersPage.jsx and .tsx ---');
{
  // SemestersPage.jsx
  let content = fs.readFileSync('frontend/src/pages/SemestersPage.jsx', 'utf8');
  const targetJsx = `<div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-[#ebf3ff]  text-[#003087]  flex items-center justify-center text-lg font-bold">
            
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]  flex items-center gap-2">
              <span>Quản lý Học kỳ & Hạn chót Học vụ</span>
              <span className="px-2.5 py-0.5 text-[13px] font-mono font-bold rounded-full bg-[#ebf3ff]  text-[#003087]  border border-[#bfdbfe] ">
                Mã quyền: {mask}
              </span>
            </h1>
            <p className="text-[14.5px] text-[#4b5563] mt-1.5">
              Thiết lập kế hoạch học vụ, điều phối các mốc thời gian thực tập và quy chế Khoa CNTT
            </p>
          </div>
        </div>`;
  const replacementJsx = `<div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">
            Quản lý học kỳ
          </h1>
        </div>`;
  if (content.includes(targetJsx)) {
    content = content.replace(targetJsx, replacementJsx);
    fs.writeFileSync('frontend/src/pages/SemestersPage.jsx', content, 'utf8');
    console.log('Updated SemestersPage.jsx header');
  } else {
    console.error('Target not found in SemestersPage.jsx');
  }

  // SemestersPage.tsx
  let tsxContent = fs.readFileSync('frontend/src/pages/SemestersPage.tsx', 'utf8');
  const targetTsx = `<div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#003087] dark:text-sky-300 flex items-center justify-center text-lg font-bold">
            📅
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Quản lý Học kỳ & Hạn chót Học vụ</span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#003087] dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                Mã quyền: {mask}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thiết lập kế hoạch học vụ, điều phối các mốc thời gian thực tập và quy chế Khoa CNTT
            </p>
          </div>
        </div>`;
  const replacementTsx = `<div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Quản lý học kỳ
          </h1>
        </div>`;
  if (tsxContent.includes(targetTsx)) {
    tsxContent = tsxContent.replace(targetTsx, replacementTsx);
    fs.writeFileSync('frontend/src/pages/SemestersPage.tsx', tsxContent, 'utf8');
    console.log('Updated SemestersPage.tsx header');
  } else {
    console.error('Target not found in SemestersPage.tsx');
  }
}

console.log('--- 4. Updating CertificatesPage.jsx and .tsx ---');
{
  // CertificatesPage.jsx
  let content = fs.readFileSync('frontend/src/pages/CertificatesPage.jsx', 'utf8');
  const targetBadgesJsx = `<div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#003087]/10 text-[#003087]   border border-[#bfdbfe]  inline-flex items-center gap-1">
              <span></span>
              <span>Scope All · Toàn khoa</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ebf3ff] text-[#003087]   border border-[#bfdbfe] ">
              {currentUser?.isAdmin ? ' Quản trị viên Khoa' : ' Giảng viên'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#ebf3ff] text-[#003087]  ">
              Quyền: Xem & Tra cứu (Read)
            </span>
          </div>`;
  if (content.includes(targetBadgesJsx)) {
    content = content.replace(targetBadgesJsx, '');
    fs.writeFileSync('frontend/src/pages/CertificatesPage.jsx', content, 'utf8');
    console.log('Updated CertificatesPage.jsx header badges');
  } else {
    console.error('targetBadgesJsx not found');
  }

  // CertificatesPage.tsx
  let tsxContent = fs.readFileSync('frontend/src/pages/CertificatesPage.tsx', 'utf8');
  const targetBadgesTsx = `<div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#003087]/10 text-[#003087] dark:bg-sky-950/80 dark:text-sky-300 border border-blue-200 dark:border-blue-900 inline-flex items-center gap-1">
              <span>🌐</span>
              <span>Scope All · Toàn khoa</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {currentUser?.isAdmin ? '👑 Quản trị viên Khoa' : '👨‍🏫 Giảng viên'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Quyền: Xem & Tra cứu (Read)
            </span>
          </div>`;
  if (tsxContent.includes(targetBadgesTsx)) {
    tsxContent = tsxContent.replace(targetBadgesTsx, '');
    fs.writeFileSync('frontend/src/pages/CertificatesPage.tsx', tsxContent, 'utf8');
    console.log('Updated CertificatesPage.tsx header badges');
  } else {
    console.error('targetBadgesTsx not found');
  }
}

console.log('--- 5. Updating ExportDataPage.jsx and .tsx ---');
{
  // ExportDataPage.jsx
  let content = fs.readFileSync('frontend/src/pages/ExportDataPage.jsx', 'utf8');
  const targetExpJsx = `<div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-[#ebf3ff]  text-[#003087]  flex items-center justify-center text-lg font-bold">
            
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]  flex items-center gap-2">
              <span>Trung tâm Export Dữ liệu & Báo cáo</span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-[#ebf3ff]  text-[#003087]  border border-[#bfdbfe] ">
                Mã quyền: {mask} (Read 2 × Export 17)
              </span>
            </h1>
            <p className="text-[14.5px] text-[#4b5563] mt-1.5">
              Kết xuất dữ liệu thô, báo cáo kiểm định chất lượng đào tạo và danh sách học vụ chuẩn định dạng Khoa CNTT
            </p>
          </div>
        </div>`;
  const replacementExpJsx = `<div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">
            Trung tâm Export Dữ liệu & Báo cáo
          </h1>
        </div>`;
  if (content.includes(targetExpJsx)) {
    content = content.replace(targetExpJsx, replacementExpJsx);
    fs.writeFileSync('frontend/src/pages/ExportDataPage.jsx', content, 'utf8');
    console.log('Updated ExportDataPage.jsx header');
  } else {
    console.error('targetExpJsx not found');
  }

  // ExportDataPage.tsx
  let tsxContent = fs.readFileSync('frontend/src/pages/ExportDataPage.tsx', 'utf8');
  const targetExpTsx = `<div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#003087] dark:text-sky-300 flex items-center justify-center text-lg font-bold">
            📊
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
  const replacementExpTsx = `<div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Trung tâm Export Dữ liệu & Báo cáo
          </h1>
        </div>`;
  if (tsxContent.includes(targetExpTsx)) {
    tsxContent = tsxContent.replace(targetExpTsx, replacementExpTsx);
    fs.writeFileSync('frontend/src/pages/ExportDataPage.tsx', tsxContent, 'utf8');
    console.log('Updated ExportDataPage.tsx header');
  } else {
    console.error('targetExpTsx not found');
  }
}
