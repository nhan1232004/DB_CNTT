const fs = require('fs');

function enrichLiveStudentDecl(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  const oldTarget = `          students[idx].position = declaration.position || '';
          students[idx].noCompanyOption = declaration.noCompanyOption;`;

  const newTarget = `          students[idx].position = declaration.position || '';
          students[idx].contactPerson = declaration.contactPerson || '';
          students[idx].contactPhone = declaration.contactPhone || '';
          students[idx].taxCode = declaration.taxCode || '';
          students[idx].noCompanyOption = declaration.noCompanyOption;`;

  if (code.includes(oldTarget)) {
    code = code.replace(oldTarget, newTarget);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Enriched live student cache in ${filePath}`);
  }
}

enrichLiveStudentDecl('TDTU_DB_CNTT_System/frontend/src/services/api.client.js');
enrichLiveStudentDecl('TDTU_DB_CNTT_System/frontend/src/services/api.client.ts');
