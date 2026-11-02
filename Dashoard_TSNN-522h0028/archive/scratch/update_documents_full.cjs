const fs = require('fs');

function updateDocFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(/\r\n/g, '\n');

  // 1. In loadStudents, ensure res?.data?.items is handled
  const oldLoad = `      if (window.ApiClient && window.ApiClient.getStudents) {
        try {
          const res = await window.ApiClient.getStudents({ semester: 'hk1_2026_2027' });
          rawList = res?.items || res?.students || (Array.isArray(res) ? res : []);
        } catch (apiErr) {
          console.warn('[DocumentsPage] ApiClient.getStudents error, falling back:', apiErr);
        }
      }`;

  const newLoad = `      if (window.ApiClient && window.ApiClient.getStudents) {
        try {
          const res = await window.ApiClient.getStudents({ semester: 'hk1_2026_2027' });
          rawList = res?.data?.items || res?.items || res?.students || (Array.isArray(res) ? res : []);
        } catch (apiErr) {
          console.warn('[DocumentsPage] ApiClient.getStudents error, falling back:', apiErr);
        }
      }`;

  if (c.includes(oldLoad)) {
    c = c.replace(oldLoad, newLoad);
    console.log(`Updated loadStudents in ${filePath}`);
  }

  // 2. Filter logic for has_company and has_cert
  const oldFilter = `  // Filter logic
  const filteredStudents = studentsList.filter(s => {
    if (courseFilter === 'KTCN' && !s.course.includes('KTCN')) return false;
    if (courseFilter === 'TSNN' && !s.course.includes('TSNN')) return false;
    if (courseFilter === 'dual' && !s.isDual) return false;
    if (courseFilter === 'need_support' && s.statusCode !== 'need_support') return false;`;

  const newFilter = `  // Filter logic
  const filteredStudents = studentsList.filter(s => {
    if (courseFilter === 'KTCN' && !s.course.includes('KTCN')) return false;
    if (courseFilter === 'TSNN' && !s.course.includes('TSNN')) return false;
    if (courseFilter === 'dual' && !s.isDual) return false;
    if (courseFilter === 'need_support' && s.statusCode !== 'need_support') return false;
    if (courseFilter === 'has_company' && s.statusCode !== 'has_company') return false;
    if (courseFilter === 'has_cert' && !s.hasCert) return false;`;

  if (c.includes(oldFilter)) {
    c = c.replace(oldFilter, newFilter);
    console.log(`Updated filter logic in ${filePath}`);
  }

  // 3. Filter chips in UI
  const oldChips = `            <button
              type="button"
              onClick={() => setCourseFilter('need_support')}
              className={\`px-3 py-1.5 rounded-xl font-bold transition \${
                courseFilter === 'need_support'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }\`}
            >
              Cần hỗ trợ ({needSupportCount})
            </button>
          </div>`;

  const newChips = `            <button
              type="button"
              onClick={() => setCourseFilter('has_company')}
              className={\`px-3 py-1.5 rounded-xl font-bold transition \${
                courseFilter === 'has_company'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }\`}
            >
              Đã có nơi TT ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('need_support')}
              className={\`px-3 py-1.5 rounded-xl font-bold transition \${
                courseFilter === 'need_support'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }\`}
            >
              Cần hỗ trợ ({needSupportCount})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('has_cert')}
              className={\`px-3 py-1.5 rounded-xl font-bold transition \${
                courseFilter === 'has_cert'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }\`}
            >
              Đã nộp CC ({studentsList.filter(s => s.hasCert).length})
            </button>
          </div>`;

  if (c.includes(oldChips)) {
    c = c.replace(oldChips, newChips);
    console.log(`Updated filter chips in ${filePath}`);
  }

  // 4. Excel Export columns
  const oldExcelKTCN = `          'Mã số thuế': s.taxCode,
          'Tình trạng thẩm định': s.status
        }));`;

  const newExcelKTCN = `          'Mã số thuế': s.taxCode,
          'Chứng chỉ ngoại ngữ': s.certificate || 'Chưa nộp',
          'Khung CEFR': s.certLevel || '—',
          'Tình trạng thẩm định': s.status
        }));`;

  if (c.includes(oldExcelKTCN)) {
    c = c.replaceAll(oldExcelKTCN, newExcelKTCN);
    console.log(`Updated Excel columns in ${filePath}`);
  }

  // 5. Excel Summary rows
  const oldExcelSummary = `        { 'Chỉ tiêu': 'Cần Khoa hỗ trợ kết nối khẩn', 'Số lượng': targetList.filter(s => s.statusCode === 'need_support').length },
        { 'Chỉ tiêu': 'Thời gian xuất dữ liệu', 'Số lượng': new Date().toLocaleString('vi-VN') }`;

  const newExcelSummary = `        { 'Chỉ tiêu': 'Cần Khoa hỗ trợ kết nối khẩn', 'Số lượng': targetList.filter(s => s.statusCode === 'need_support').length },
        { 'Chỉ tiêu': 'Số sinh viên đã nộp chứng chỉ ngoại ngữ', 'Số lượng': targetList.filter(s => s.hasCert).length },
        { 'Chỉ tiêu': 'Thời gian xuất dữ liệu', 'Số lượng': new Date().toLocaleString('vi-VN') }`;

  if (c.includes(oldExcelSummary)) {
    c = c.replace(oldExcelSummary, newExcelSummary);
    console.log(`Updated Excel summary in ${filePath}`);
  }

  // 6. PDF Report KPI Box
  const oldPdfKpi = `                  <div className="col-span-2 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                    • Môn học: <strong>KTCN ({studentsList.filter(s => s.course.includes('KTCN')).length}) · TSNN ({studentsList.filter(s => s.course.includes('TSNN')).length}) · Song song ({dualCount})</strong>
                  </div>`;

  const newPdfKpi = `                  <div className="col-span-2 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                    • Môn học: <strong>KTCN ({studentsList.filter(s => s.course.includes('KTCN')).length}) · TSNN ({studentsList.filter(s => s.course.includes('TSNN')).length}) · Song song ({dualCount})</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                    • Chứng chỉ ngoại ngữ: <strong className="text-violet-700 font-bold">{studentsList.filter(s => s.hasCert).length} SV ({totalCount ? Math.round((studentsList.filter(s => s.hasCert).length/totalCount)*100) : 0}%)</strong>
                  </div>`;

  if (c.includes(oldPdfKpi)) {
    c = c.replace(oldPdfKpi, newPdfKpi);
    console.log(`Updated PDF KPI in ${filePath}`);
  }

  // 7. Table Header and Body: Add Certificate Column
  const oldTh = `                  <th className="py-2.5 px-3">Doanh nghiệp / Vị trí</th>
                  <th className="py-2.5 px-3">Trạng thái</th>`;

  const newTh = `                  <th className="py-2.5 px-3">Doanh nghiệp / Vị trí</th>
                  <th className="py-2.5 px-3">Chứng chỉ ngoại ngữ</th>
                  <th className="py-2.5 px-3">Trạng thái</th>`;

  if (c.includes(oldTh)) {
    c = c.replace(oldTh, newTh);
    console.log(`Updated Table TH in ${filePath}`);
  }

  const oldTd = `                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {s.company}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s.position}
                          </div>
                        </td>

                        <td className="py-3 px-3">`;

  const newTd = `                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {s.company}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s.position}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {s.hasCert ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                {s.certificate}
                              </span>
                              {s.certLevel && s.certLevel !== '—' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  {s.certLevel}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Chưa nộp</span>
                          )}
                        </td>

                        <td className="py-3 px-3">`;

  if (c.includes(oldTd)) {
    c = c.replace(oldTd, newTd);
    console.log(`Updated Table TD in ${filePath}`);
  }

  // Update colSpan={5} to colSpan={6}
  c = c.replaceAll('colSpan={5}', 'colSpan={6}');

  fs.writeFileSync(filePath, c, 'utf8');
}

updateDocFile('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.jsx');
updateDocFile('TDTU_DB_CNTT_System/frontend/src/pages/DocumentsPage.tsx');
