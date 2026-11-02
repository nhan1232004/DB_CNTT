const fs = require('fs');

function updateStudentsModal(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  const oldBlock = `                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Tên công ty:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedStudent.companyName || selectedStudent.assignedCompany || 'Chưa khai báo'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Mã số thuế:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.taxCode || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Vị trí thực tập:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.position || (selectedStudent.status === "seeking" ? "Đang tìm kiếm vị trí" : "—")}</span>
                    </div>
                  </div>`;

  const newBlock = `                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
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

  if (code.includes(oldBlock)) {
    code = code.replace(oldBlock, newBlock);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Updated company modal in ${filePath}`);
  } else {
    console.error(`oldBlock not found in ${filePath}`);
  }
}

updateStudentsModal('TDTU_DB_CNTT_System/frontend/src/pages/StudentsPage.jsx');
