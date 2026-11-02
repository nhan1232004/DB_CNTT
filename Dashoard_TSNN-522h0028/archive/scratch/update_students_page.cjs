const fs = require('fs');

function updateFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(/\r\n/g, '\n');

  // 1. Update fetchStudents res handling and quick filters
  const oldFetch = `      const res = await window.ApiClient.getStudents(params);
      let list = res.items || res.students || [];

      // Apply Quick Filter
      if (quickFilter === 'need_support') {
        list = list.filter(s => (s.status === 'seeking' && s.noCompanyOption === 'faculty') || s.status === 'Cần hỗ trợ' || s.noCompanyOption === 'faculty');
      } else if (quickFilter === 'no_company') {
        list = list.filter(s => s.status === 'seeking' || s.status === 'Chưa có doanh nghiệp');
      } else if (quickFilter === 'ktcn') {
        list = list.filter(s => s.ktcnEnrolled === 1 || s.courseCode === 'KTCN' || s.courseCode?.includes('KTCN') || s.courseName?.includes('Kiến tập'));
      } else if (quickFilter === 'tsnn') {
        list = list.filter(s => s.tsnnEnrolled === 1 || s.courseCode === 'TSNN' || s.courseCode?.includes('TSNN') || s.courseName?.includes('Tập sự'));
      }`;

  const newFetch = `      const res = await window.ApiClient.getStudents(params);
      let list = res?.items || res?.data?.items || res?.students || (Array.isArray(res) ? res : []);

      if ((!list || list.length === 0) && window.ApiClient?.getLiveStudents) {
        try {
          const fallback = await window.ApiClient.getLiveStudents(activeSemester);
          if (Array.isArray(fallback) && fallback.length > 0) list = fallback;
        } catch {}
      }

      // Apply Quick Filter
      if (quickFilter === 'need_support') {
        list = list.filter(s => (s.status === 'seeking' && s.noCompanyOption === 'faculty') || s.status === 'Cần hỗ trợ' || s.noCompanyOption === 'faculty' || (s.companyName && s.companyName.includes('hỗ trợ')));
      } else if (quickFilter === 'no_company') {
        list = list.filter(s => (s.status === 'seeking' && s.noCompanyOption !== 'faculty') || s.status === 'Chưa có doanh nghiệp' || s.status === 'Đang tìm' || (s.companyName && s.companyName.includes('Đang tìm')));
      } else if (quickFilter === 'has_company') {
        list = list.filter(s => s.status === 'has_company' || s.status === 'Có doanh nghiệp' || (s.companyName && !s.companyName.includes('hỗ trợ') && !s.companyName.includes('Đang tìm')));
      } else if (quickFilter === 'is_dual') {
        list = list.filter(s => s.isDualCourse === 1 || s.isDualCourse === true || s.courseCode?.includes('&') || (s.ktcnEnrolled && s.tsnnEnrolled));
      } else if (quickFilter === 'has_cert') {
        list = list.filter(s => Boolean(s.certificateDisplay || s.certName || s.cert));
      } else if (quickFilter === 'ktcn') {
        list = list.filter(s => s.ktcnEnrolled === 1 || s.courseCode === 'KTCN' || s.courseCode?.includes('KTCN') || s.courseName?.includes('Kiến tập'));
      } else if (quickFilter === 'tsnn') {
        list = list.filter(s => s.tsnnEnrolled === 1 || s.courseCode === 'TSNN' || s.courseCode?.includes('TSNN') || s.courseName?.includes('Tập sự'));
      }`;

  if (c.includes(oldFetch)) {
    c = c.replace(oldFetch, newFetch);
    console.log(`Updated fetch in ${filePath}`);
  } else {
    console.log(`Fetch target not found in ${filePath}`);
  }

  // 2. Add quick filter pills for has_company, is_dual, has_cert
  const oldPills = `        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'no_company' ? 'all' : 'no_company')}
          className={\`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer \${
            quickFilter === 'no_company'
              ? 'bg-[#fffbeb] text-[#d97706] border-[#fde68a] dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 shadow-xs ring-1 ring-amber-400'
              : 'bg-[#fffbeb]/60 text-[#d97706] border-[#fde68a]/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-[#fffbeb]'
          }\`}
        >
          Đang tìm / Chờ PV
        </button>`;

  const newPills = `        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'no_company' ? 'all' : 'no_company')}
          className={\`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer \${
            quickFilter === 'no_company'
              ? 'bg-[#fffbeb] text-[#d97706] border-[#fde68a] dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 shadow-xs ring-1 ring-amber-400'
              : 'bg-[#fffbeb]/60 text-[#d97706] border-[#fde68a]/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-[#fffbeb]'
          }\`}
        >
          Đang tìm / Chờ PV
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'has_company' ? 'all' : 'has_company')}
          className={\`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer \${
            quickFilter === 'has_company'
              ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0] dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 shadow-xs ring-1 ring-emerald-400'
              : 'bg-[#f0fdf4]/60 text-[#16a34a] border-[#bbf7d0]/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-[#f0fdf4]'
          }\`}
        >
          Đã có nơi TT
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'is_dual' ? 'all' : 'is_dual')}
          className={\`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer \${
            quickFilter === 'is_dual'
              ? 'bg-[#faf5ff] text-[#9333ea] border-[#e9d5ff] dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 shadow-xs ring-1 ring-purple-400'
              : 'bg-[#faf5ff]/60 text-[#9333ea] border-[#e9d5ff]/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 hover:bg-[#faf5ff]'
          }\`}
        >
          Song song
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'has_cert' ? 'all' : 'has_cert')}
          className={\`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer \${
            quickFilter === 'has_cert'
              ? 'bg-[#eef2ff] text-[#4f46e5] border-[#c7d2fe] dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 shadow-xs ring-1 ring-indigo-400'
              : 'bg-[#eef2ff]/60 text-[#4f46e5] border-[#c7d2fe]/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 hover:bg-[#eef2ff]'
          }\`}
        >
          Đã nộp CC
        </button>`;

  if (c.includes(oldPills)) {
    c = c.replace(oldPills, newPills);
    console.log(`Updated pills in ${filePath}`);
  } else {
    console.log(`Pills target not found in ${filePath}`);
  }

  // 3. Update table row rendering for student name with cert badge and company with position
  const oldNameCell = `                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{displayName}</div>
                            <div className="text-[10px] text-slate-400">{sv.className || sv.major || 'KTPM22A'}</div>
                          </div>`;

  const newNameCell = `                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>{displayName}</span>
                              {(sv.certificateDisplay || sv.certName || sv.cert) && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200 dark:border-violet-800" title="Chứng chỉ ngoại ngữ">
                                  <span>📜</span>
                                  <span>{sv.certificateDisplay || (sv.certName ? \`\${sv.certName} \${sv.certScore || ''}\` : sv.cert)}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">{sv.className || sv.major || 'KTPM22A'}</div>
                          </div>`;

  if (c.includes(oldNameCell)) {
    c = c.replace(oldNameCell, newNameCell);
    console.log(`Updated name cell in ${filePath}`);
  } else {
    console.log(`Name cell target not found in ${filePath}`);
  }

  const oldCompCell = `                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {sv.companyName || (sv.noCompanyOption === 'faculty' ? 'Khoa hỗ trợ' : (sv.status === 'has_company' ? 'Doanh nghiệp tiếp nhận' : '—'))}
                      </td>`;

  const newCompCell = `                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        <div>
                          {sv.companyName || (sv.noCompanyOption === 'faculty' ? 'Khoa CNTT hỗ trợ' : (sv.status === 'has_company' ? 'Doanh nghiệp tiếp nhận' : '—'))}
                        </div>
                        {sv.position && sv.position !== 'Chưa cập nhật' && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Vị trí: {sv.position}
                          </div>
                        )}
                      </td>`;

  if (c.includes(oldCompCell)) {
    c = c.replace(oldCompCell, newCompCell);
    console.log(`Updated comp cell in ${filePath}`);
  } else {
    console.log(`Comp cell target not found in ${filePath}`);
  }

  fs.writeFileSync(filePath, c, 'utf8');
}

updateFile('TDTU_DB_CNTT_System/frontend/src/pages/StudentsPage.jsx');
updateFile('TDTU_DB_CNTT_System/frontend/src/pages/StudentsPage.tsx');
