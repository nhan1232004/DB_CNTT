const fs = require('fs');

function updateDeclarationPage() {
  const filePathJsx = 'TDTU_DB_CNTT_System/frontend/src/pages/DeclarationPage.jsx';
  const filePathTsx = 'TDTU_DB_CNTT_System/frontend/src/pages/DeclarationPage.tsx';

  let code = fs.readFileSync(filePathJsx, 'utf8');

  // 1. Remove TDTU_LECTURERS array
  code = code.replace(/const TDTU_LECTURERS = \[[\s\S]*?\];\n\n/, '');

  // 2. Remove lecturer states: academicAdvisor, advisorEmail, advisorNote
  code = code.replace(/\s*\/\/ Phần Giảng viên hướng dẫn học phần \(Khoa CNTT - TDTU\)[\s\S]*?const \[advisorNote, setAdvisorNote\] = React\.useState\(''\);/, '');

  // 3. Remove contactRole and contactEmail states
  code = code.replace(/const \[contactRole, setContactRole\] = React\.useState\(''\);\s*/, '');
  code = code.replace(/const \[contactEmail, setContactEmail\] = React\.useState\(''\);\s*/, '');

  // 4. Remove handleLecturerChange
  code = code.replace(/\s*const handleLecturerChange = \(lecturerName\) => {[\s\S]*?};\n/, '');

  // 5. In saveDraft, remove academicAdvisor, advisorEmail, advisorNote, contactRole, contactEmail
  code = code.replace(/\s*academicAdvisor,\s*advisorEmail,\s*advisorNote,\s*contactRole,\s*contactEmail,\s*/g, '\n');

  // 6. In loadDraft / existing, remove academicAdvisor, advisorEmail, advisorNote
  code = code.replace(/\s*if \(decl\.academicAdvisor\) {[\s\S]*?if \(decl\.advisorNote\) setAdvisorNote\(decl\.advisorNote\);/g, '');
  code = code.replace(/\s*if \(d\.academicAdvisor\) setAcademicAdvisor\(d\.academicAdvisor\);[\s\S]*?if \(d\.advisorNote\) setAdvisorNote\(d\.advisorNote\);/g, '');

  // 7. In handleNextStep for Step 3:
  const oldStep3Next = `    } else if (currentStep === 3) {
      if (internshipStatus === 'has_company') {
        if (!companyInfo.name || !companyInfo.name.trim()) {
          alert('Vui lòng nhập tên công ty hoặc tra cứu mã số thuế doanh nghiệp!');
          return;
        }
        if (!contactPerson || !contactPerson.trim()) {
          alert('Vui lòng nhập Họ tên người đại diện / người liên hệ tại doanh nghiệp!');
          return;
        }
        if (!taxConfirmed) {
          alert('Vui lòng tích chọn cam kết xác nhận thông tin doanh nghiệp phía dưới!');
          return;
        }
      }
      setCurrentStep(4);
      saveDraft({ currentStep: 4 });
    }`;

  const newStep3Next = `    } else if (currentStep === 3) {
      if (internshipStatus === 'has_company') {
        if (!companyInfo.name || !companyInfo.name.trim()) {
          alert('Vui lòng nhập tên công ty hoặc tra cứu mã số thuế doanh nghiệp!');
          return;
        }
        if (!contactPerson || !contactPerson.trim()) {
          alert('Vui lòng nhập Họ và tên cán bộ hướng dẫn (Mentor) tại doanh nghiệp!');
          return;
        }
        if (!contactPhone || !contactPhone.trim()) {
          alert('Vui lòng nhập Số điện thoại cán bộ hướng dẫn!');
          return;
        }
        if (!taxConfirmed) {
          alert('Vui lòng tích chọn cam kết xác nhận thông tin doanh nghiệp và cán bộ hướng dẫn phía dưới!');
          return;
        }
      }
      setCurrentStep(4);
      saveDraft({ currentStep: 4 });
    }`;

  code = code.replace(oldStep3Next, newStep3Next);

  // 8. In handleSubmitFinal, clean up payload
  const oldPayloadAdvisor = `        academicAdvisor: internshipStatus === 'has_company' ? academicAdvisor : 'Khoa CNTT',
        advisorEmail: internshipStatus === 'has_company' ? advisorEmail : 'khoacntt@tdtu.edu.vn',
        advisorNote: internshipStatus === 'has_company' ? advisorNote : '',`;
  code = code.replace(oldPayloadAdvisor, '');
  code = code.replace(/\s*contactRole: internshipStatus === 'has_company' \? contactRole : '',/, '');
  code = code.replace(/\s*contactEmail: internshipStatus === 'has_company' \? contactEmail : '',/, '');

  // 9. Replace Step 3 render block completely
  const step3RenderRegex = /\{currentStep === 3 && \([\s\S]*?\{\/\* STEP 4: VỊ TRÍ & XÁC NHẬN \*\/\}/;

  const newStep3Render = `{currentStep === 3 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bước 3: Thông tin Doanh nghiệp & Cán bộ hướng dẫn
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nhập Mã số thuế để hệ thống tự động điền các thông tin pháp lý từ Tổng cục Thuế, sau đó nhập thông tin Cán bộ hướng dẫn (Mentor):
                </p>
              </div>

              {/* MST Lookup Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Mã số thuế doanh nghiệp (MST) *
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="Nhập 10 hoặc 13 chữ số (VD: 0312345678)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold tracking-wide focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTaxSearch}
                    disabled={isSearchingTax || taxCooldown > 0}
                    className="px-5 py-2.5 bg-[#003087] hover:bg-[#002266] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shrink-0"
                  >
                    {isSearchingTax ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tra cứu...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>
                          {taxCooldown > 0 ? \`Thử lại sau (\${taxCooldown}s)\` : 'Tra cứu MST'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
                {taxSearchError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{taxSearchError}</span>
                  </div>
                )}
                {companyInfo.name && !taxSearchError && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <span>✓</span>
                    <span>Tra cứu thành công · Đã điền thông tin pháp lý từ Cổng Thuế Doanh nghiệp Quốc gia</span>
                  </div>
                )}
              </div>

              {/* Thông tin Doanh nghiệp & Cán bộ hướng dẫn (Mentor) gộp chung */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Thông tin pháp lý doanh nghiệp (Tổng cục Thuế)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    TÊN CÔNG TY / DOANH NGHIỆP: *
                  </label>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    placeholder="Tên công ty sẽ hiển thị sau khi tra cứu MST"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ĐỊA CHỈ TRỤ SỞ ĐĂNG KÝ: *
                  </label>
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    placeholder="Địa chỉ trụ sở chính"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NGƯỜI ĐẠI DIỆN PHÁP LUẬT:
                    </label>
                    <input
                      type="text"
                      value={companyInfo.representative}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, representative: e.target.value })}
                      placeholder="Họ tên người đại diện pháp luật"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CƠ QUAN THUẾ QUẢN LÝ:
                    </label>
                    <input
                      type="text"
                      value={companyInfo.taxDepartment}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, taxDepartment: e.target.value })}
                      placeholder="Chi cục Thuế quản lý"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      TRẠNG THÁI DOANH NGHIỆP:
                    </label>
                    <div className="flex items-center h-[38px]">
                      <span className={\`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border \${
                        companyInfo.status && companyInfo.status.toLowerCase().includes('hoạt động')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }\`}>
                        <span className={\`w-1.5 h-1.5 rounded-full \${
                          companyInfo.status && companyInfo.status.toLowerCase().includes('hoạt động') ? 'bg-emerald-500' : 'bg-slate-400'
                        }\`}></span>
                        <span>{companyInfo.status || 'Chưa tra cứu'}</span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      LOẠI HÌNH TỔ CHỨC:
                    </label>
                    <input
                      type="text"
                      value={companyInfo.orgType}
                      readOnly
                      placeholder="Loại hình doanh nghiệp"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NGÀY CẬP NHẬT DỮ LIỆU THUẾ:
                    </label>
                    <input
                      type="text"
                      value={companyInfo.updatedAt ? new Date(companyInfo.updatedAt).toLocaleString('vi-VN') : ''}
                      readOnly
                      placeholder="Thời gian cập nhật"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                {/* Phần Cán bộ hướng dẫn (Mentor) gộp chung trong thông tin doanh nghiệp */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#003087] dark:text-sky-400">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Cán bộ hướng dẫn tại doanh nghiệp (Mentor)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Họ và tên cán bộ hướng dẫn: *
                      </label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="VD: Anh/Chị Nguyễn Văn B"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Số điện thoại cán bộ hướng dẫn: *
                      </label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="VD: 0909 123 456"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#003087] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox confirmation */}
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxConfirmed}
                  onChange={(e) => setTaxConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-[#003087] focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Tôi xác nhận thông tin doanh nghiệp và cán bộ hướng dẫn phía trên là chính xác
                </span>
              </label>
            </div>
          )}

          {/* STEP 4: VỊ TRÍ & XÁC NHẬN */}`;

  code = code.replace(step3RenderRegex, newStep3Render);

  // 10. In Step 4 review card, update preview to show company and mentor cleanly
  const oldStep4ReviewRegex = /\{internshipStatus === 'has_company' && \([\s\S]*?\{\/\* Form Vị trí thực tập \*\/\}/;

  const newStep4Review = `{internshipStatus === 'has_company' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                  <div className="font-bold text-[#003087] dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Thông tin doanh nghiệp & Cán bộ hướng dẫn đã khai báo</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <span className="text-slate-400 font-medium">Doanh nghiệp:</span>{' '}
                      <strong className="text-slate-900 dark:text-white">{companyInfo.name || 'Chưa nhập'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Mã số thuế:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">{taxCode || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Cán bộ hướng dẫn (Mentor):</span>{' '}
                      <strong className="text-emerald-700 dark:text-emerald-400">{contactPerson || 'Chưa nhập'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">SĐT cán bộ hướng dẫn:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">{contactPhone || 'Chưa nhập'}</strong>
                    </div>
                    {companyInfo.address && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-medium">Địa chỉ trụ sở:</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">{companyInfo.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Vị trí thực tập */}`;

  code = code.replace(oldStep4ReviewRegex, newStep4Review);

  // 11. In Right Sticky Summary card, clean up preview
  const oldRightCardReviewRegex = /\{companyInfo\.name && \([\s\S]*?\{academicAdvisor && \([\s\S]*?\)\}\s*<\/div>\s*\)\}/;

  const newRightCardReview = `{companyInfo.name && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="text-slate-400 text-[11px] font-semibold">Doanh nghiệp thực tập:</div>
                <div className="font-bold text-[#003087] dark:text-sky-300 leading-snug">{companyInfo.name}</div>
                {taxCode && <div className="text-[11px] text-slate-500 font-mono">MST: {taxCode}</div>}
                {contactPerson && (
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <div><strong>CBHD (Mentor):</strong> {contactPerson}</div>
                    {contactPhone && <div><strong>SĐT:</strong> {contactPhone}</div>}
                  </div>
                )}
              </div>
            )}`;

  code = code.replace(oldRightCardReviewRegex, newRightCardReview);

  fs.writeFileSync(filePathJsx, code, 'utf8');
  fs.writeFileSync(filePathTsx, code, 'utf8');
  console.log('Successfully updated DeclarationPage.jsx and DeclarationPage.tsx');
}

updateDeclarationPage();
