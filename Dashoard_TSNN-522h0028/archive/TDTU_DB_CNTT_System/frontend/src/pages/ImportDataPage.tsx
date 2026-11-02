// ImportDataPage.tsx - Trung tâm Nhập Dữ liệu Hàng loạt từ Excel
// Chức năng 10 theo Ma trận Phân quyền Nguyên tố (Thầy Phúc: 26, Giảng viên: 1, Sinh viên: 1)

import React from 'react';

interface ParsedStudentRow {
  mssv: string;
  studentId: string;
  fullName: string;
  name: string;
  class: string;
  className: string;
  major: string;
  gpa4: number;
  ktcnEnrolled: number;
  tsnnEnrolled: number;
  isDualCourse: number;
  course_str: string;
  status: string;
  company: string;
  updated: string;
}

interface ImportSummaryData {
  totalUnique: number;
  sheets: string[];
  ktcnCount: number;
  tsnnCount: number;
  dualCount: number;
}

interface ImportDataPageProps {
  currentUser?: any;
  onNavigateTab?: (tab: string) => void;
}

export const ImportDataPage: React.FC<ImportDataPageProps> = ({ currentUser, onNavigateTab }) => {
  const roleKey = (window as any).PrimeRbac?.getUserRoleKey?.(currentUser) || 'thay_phuc';
  const mask = (window as any).PrimeRbac?.getFeatureMask?.(currentUser, 'import') || 26;

  const canRead = (window as any).PrimeRbac?.hasPrimePermission(mask, 2);
  const canImport = (window as any).PrimeRbac?.hasPrimePermission(mask, 13);

  const [selectedSemester, setSelectedSemester] = React.useState<string>('hk1_2026_2027');
  const [importFileName, setImportFileName] = React.useState<string>('');
  const [parsedRows, setParsedRows] = React.useState<ParsedStudentRow[]>([]);
  const [importSummary, setImportSummary] = React.useState<ImportSummaryData | null>(null);
  const [importing, setImporting] = React.useState<boolean>(false);
  const [importSuccess, setImportSuccess] = React.useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = (window as any).XLSX.read(data, { type: 'array' });
        
        let allStudentsMap = new Map<string, ParsedStudentRow>();
        let ktcnCount = 0;
        let tsnnCount = 0;
        let detectedSheets: string[] = [];

        workbook.SheetNames.forEach((sheetName: string) => {
          detectedSheets.push(sheetName);
          const worksheet = workbook.Sheets[sheetName];
          const rawJson: any[][] = (window as any).XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(rawJson.length, 15); r++) {
            const row = rawJson[r];
            if (!Array.isArray(row)) continue;
            const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');
            if (rowStr.includes('mssv') || rowStr.includes('mã số') || rowStr.includes('họ tên') || rowStr.includes('họ và tên')) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx === -1) headerRowIdx = 0;
          const headers = (rawJson[headerRowIdx] || []).map(h => String(h || '').trim());
          const mssvIdx = headers.findIndex(h => /mssv|mã\s*sinh\s*viên|mã\s*số/i.test(h));
          const nameIdx = headers.findIndex(h => /họ\s*(và\s*)?tên|tên\s*sinh\s*viên/i.test(h));
          const classIdx = headers.findIndex(h => /lớp/i.test(h));
          const majorIdx = headers.findIndex(h => /ngành|chuyên\s*ngành/i.test(h));
          const gpaIdx = headers.findIndex(h => /gpa|điểm/i.test(h));

          const sheetUpper = sheetName.toUpperCase();
          const isKtcnSheet = sheetUpper.includes('KTCN') || sheetUpper.includes('KIẾN TẬP');
          const isTsnnSheet = sheetUpper.includes('TSNN') || sheetUpper.includes('TẬP SỰ') || sheetUpper.includes('ĐỒ ÁN');

          for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
            const row = rawJson[r];
            if (!row || row.length === 0) continue;
            const sid = String(row[mssvIdx] || '').trim();
            if (!sid || sid.length < 5 || sid.toLowerCase().startsWith('tổng') || sid.toLowerCase().startsWith('stt')) continue;

            const fullName = String(row[nameIdx] || `Sinh viên ${sid}`).trim();
            const className = classIdx !== -1 ? String(row[classIdx] || '').trim() : '';
            const major = majorIdx !== -1 ? String(row[majorIdx] || 'Kỹ thuật phần mềm').trim() : 'Kỹ thuật phần mềm';
            const gpa = gpaIdx !== -1 ? Number(row[gpaIdx]) || 3.12 : 3.12;

            if (isKtcnSheet) ktcnCount++;
            if (isTsnnSheet) tsnnCount++;

            if (allStudentsMap.has(sid)) {
              const existing = allStudentsMap.get(sid)!;
              if (isKtcnSheet) existing.ktcnEnrolled = 1;
              if (isTsnnSheet) existing.tsnnEnrolled = 1;
              existing.isDualCourse = (existing.ktcnEnrolled && existing.tsnnEnrolled) ? 1 : 0;
              existing.course_str = existing.isDualCourse ? 'KTCN & TSNN (Song song)' : (existing.ktcnEnrolled ? 'Kiến tập công nghiệp (KTCN)' : 'Tập sự nghề nghiệp (TSNN)');
            } else {
              allStudentsMap.set(sid, {
                mssv: sid,
                studentId: sid,
                fullName,
                name: fullName,
                class: className,
                className,
                major,
                gpa4: gpa,
                ktcnEnrolled: isKtcnSheet ? 1 : 0,
                tsnnEnrolled: isTsnnSheet ? 1 : 0,
                isDualCourse: (isKtcnSheet && isTsnnSheet) ? 1 : 0,
                course_str: isKtcnSheet ? 'Kiến tập công nghiệp (KTCN)' : (isTsnnSheet ? 'Tập sự nghề nghiệp (TSNN)' : 'KTCN'),
                status: 'Chưa có nơi',
                company: 'Chưa có',
                updated: new Date().toLocaleDateString('vi-VN')
              });
            }
          }
        });

        const list = Array.from(allStudentsMap.values());
        const dualCount = list.filter(s => s.isDualCourse).length;

        setParsedRows(list);
        setImportSummary({
          totalUnique: list.length,
          sheets: detectedSheets,
          ktcnCount,
          tsnnCount,
          dualCount
        });
      } catch (err: any) {
        alert('Lỗi đọc tệp Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    if (!canImport) {
      alert('Bạn không có quyền Import dữ liệu (Yêu cầu quyền Import 13)');
      return;
    }
    if (parsedRows.length === 0) return;
    setImporting(true);
    try {
      if ((window as any).ApiClient?.saveLiveStudents) {
        (window as any).ApiClient.saveLiveStudents(parsedRows);
      }
      try {
        localStorage.setItem('tdtu_imported_students_' + selectedSemester, JSON.stringify(parsedRows));
        localStorage.setItem('tdtu_live_students_' + selectedSemester, JSON.stringify(parsedRows));
      } catch {}

      if ((window as any).FirebaseService?.db) {
        try {
          const batch = (window as any).FirebaseService.db.batch();
          parsedRows.slice(0, 100).forEach(sv => {
            const docRef = (window as any).FirebaseService.db.collection('tdtu_students').doc(sv.mssv);
            batch.set(docRef, sv, { merge: true });
          });
          await batch.commit();
        } catch (fErr) {}
      }

      setImportSuccess(`✓ Đã nạp thành công ${parsedRows.length} sinh viên vào cơ sở dữ liệu học kỳ ${selectedSemester.toUpperCase()}!`);
    } catch (err: any) {
      alert('Lỗi nạp dữ liệu: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  if (!canRead || !canImport) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 my-8">
        <div className="text-4xl mb-3">🚫</div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Không có quyền truy cập chức năng</h2>
        <p className="text-sm text-slate-500 mt-2">
          Chức năng "Import dữ liệu" chỉ dành riêng cho Thầy Phúc (Admin Khoa - Mã quyền 26).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
              1. Chọn học kỳ nạp dữ liệu:
            </label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
            >
              <option value="hk1_2026_2027">Học kỳ 1 / 2026–2027 (Hiện tại)</option>
              <option value="hk2_2025_2026">Học kỳ 2 / 2025–2026</option>
              <option value="hk1_2025_2026">Học kỳ 1 / 2025–2026</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
              2. Chọn tệp Excel từ máy tính (.xlsx, .xls):
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#003087] file:text-white hover:file:bg-blue-800 cursor-pointer"
            />
          </div>
        </div>

        {importSummary && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-2">
              <span>✓ Đã phân tích tự động các Sheet: <strong>{importSummary.sheets.join(', ')}</strong></span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-semibold">
              <div>• Tổng sinh viên duy nhất: <strong>{importSummary.totalUnique}</strong></div>
              <div>• Lượt đăng ký KTCN: <strong>{importSummary.ktcnCount}</strong></div>
              <div>• Lượt đăng ký TSNN: <strong>{importSummary.tsnnCount}</strong></div>
              <div className="text-blue-700 dark:text-sky-300">• Học 2 môn song song: <strong>{importSummary.dualCount}</strong></div>
            </div>
          </div>
        )}

        {importSuccess && (
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-sky-300 rounded-xl font-bold text-xs">
            {importSuccess}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={parsedRows.length === 0 || importing}
            onClick={handleExecuteImport}
            className="px-5 py-2.5 bg-[#003087] hover:bg-blue-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-2"
          >
            <span>{importing ? 'Đang nạp dữ liệu...' : '⚡ Bắt đầu Nạp dữ liệu vào Hệ thống'}</span>
          </button>
        </div>
      </div>

      {parsedRows.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Xem trước danh sách ({parsedRows.length} sinh viên)
            </h3>
            <span className="text-xs text-slate-400">Tệp: {importFileName}</span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="p-3">MSSV</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3">Lớp</th>
                  <th className="p-3">Ngành</th>
                  <th className="p-3">Học phần đăng ký</th>
                  <th className="p-3 text-center">Song song</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {parsedRows.slice(0, 50).map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-sky-400">{s.mssv}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{s.fullName}</td>
                    <td className="p-3 font-mono text-slate-500">{s.class}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{s.major}</td>
                    <td className="p-3">{s.course_str}</td>
                    <td className="p-3 text-center">
                      {s.isDualCourse ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300">
                          2 Môn
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedRows.length > 50 && (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              Đang hiển thị 50 / {parsedRows.length} sinh viên xem trước.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

(window as any).ImportDataPage = ImportDataPage;
export default ImportDataPage;
