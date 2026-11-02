const fs = require('fs');

function updateStudentsPage(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Table column: add Mentor display
  const oldTableCol = `                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        <div>
                          {sv.companyName || (sv.noCompanyOption === 'faculty' ? 'Khoa CNTT hỗ trợ' : (sv.status === 'has_company' ? 'Doanh nghiệp tiếp nhận' : '—'))}
                        </div>
                        {sv.position && sv.position !== 'Chưa cập nhật' && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Vị trí: {sv.position}
                          </div>
                        )}
                      </td>`;

  const newTableCol = `                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        <div>
                          {sv.companyName || (sv.noCompanyOption === 'faculty' ? 'Khoa CNTT hỗ trợ' : (sv.status === 'has_company' ? 'Doanh nghiệp tiếp nhận' : '—'))}
                        </div>
                        {sv.position && sv.position !== 'Chưa cập nhật' && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Vị trí: {sv.position}
                          </div>
                        )}
                        {sv.contactPerson && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            Mentor: {sv.contactPerson} {sv.contactPhone ? \`(\${sv.contactPhone})\` : ''}
                          </div>
                        )}
                      </td>`;

  if (code.includes(oldTableCol)) {
    code = code.replace(oldTableCol, newTableCol);
  }

  // 2. Modal: clean up and display mentor name + phone, remove lecturer
  const oldModalBlock = `                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 font-medium">Tên công ty:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right">{selectedStudent.companyName || selectedStudent.assignedCompany || 'Chưa khai báo'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Mã số thuế:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.taxCode || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Vị trí thực tập:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.position || (selectedStudent.status === "seeking" ? "Đang tìm kiếm vị trí" : "—")}</span>
                    </div>
                    {selectedStudent.contactPerson && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Đại diện / Mentor DN:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-right">
                          {selectedStudent.contactPerson} {selectedStudent.contactRole ? \`(\${selectedStudent.contactRole})\` : ''}
                        </span>
                      </div>
                    )}
                    {(selectedStudent.contactPhone || selectedStudent.contactEmail) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Liên hệ DN:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {selectedStudent.contactPhone || ''} {selectedStudent.contactEmail ? \`· \${selectedStudent.contactEmail}\` : ''}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#003087] dark:text-sky-400 font-bold">Giảng viên hướng dẫn:</span>
                        <span className="font-bold text-blue-700 dark:text-sky-300">
                          {selectedStudent.academicAdvisor || 'Khoa CNTT phân công'}
                        </span>
                      </div>
                      {selectedStudent.advisorEmail && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Email GVHD:</span>
                          <span className="text-slate-600 dark:text-slate-400 font-mono">{selectedStudent.advisorEmail}</span>
                        </div>
                      )}
                      {selectedStudent.advisorNote && (
                        <div className="p-2 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg text-[11px] text-blue-900 dark:text-blue-200">
                          <strong>Ghi chú gửi GVHD:</strong> {selectedStudent.advisorNote}
                        </div>
                      )}
                    </div>
                  </div>`;

  const newModalBlock = `                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 font-medium">Tên công ty:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right">{selectedStudent.companyName || selectedStudent.assignedCompany || 'Chưa khai báo'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Mã số thuế:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedStudent.taxCode || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Vị trí thực tập:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.position || (selectedStudent.status === "seeking" ? "Đang tìm kiếm vị trí" : "—")}</span>
                    </div>
                    {selectedStudent.companyAddress && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Địa chỉ trụ sở:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right max-w-[65%]">{selectedStudent.companyAddress}</span>
                      </div>
                    )}
                    {selectedStudent.representative && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Người đại diện pháp luật:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.representative}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[#003087] dark:text-sky-400 font-bold">Cán bộ hướng dẫn (Mentor):</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedStudent.contactPerson || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">SĐT cán bộ hướng dẫn:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {selectedStudent.contactPhone || '—'}
                        </span>
                      </div>
                    </div>
                  </div>`;

  if (code.includes(oldModalBlock)) {
    code = code.replace(oldModalBlock, newModalBlock);
    console.log(`Updated modal in ${filePath}`);
  } else {
    console.error(`oldModalBlock not found in ${filePath}`);
  }

  fs.writeFileSync(filePath, code, 'utf8');
}

updateStudentsPage('TDTU_DB_CNTT_System/frontend/src/pages/StudentsPage.jsx');
updateStudentsPage('TDTU_DB_CNTT_System/frontend/src/pages/StudentsPage.tsx');
