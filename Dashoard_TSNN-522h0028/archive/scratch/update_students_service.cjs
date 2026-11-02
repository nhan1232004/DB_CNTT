const fs = require('fs');
let code = fs.readFileSync('TDTU_DB_CNTT_System/backend/src/modules/students/students.service.ts', 'utf8');

const oldSelect = `      SELECT 
        s.*,
        COALESCE(s.fullName, d.studentName) as name,
        COALESCE(s.fullName, d.studentName) as fullName,
        d.companyName,
        d.position,
        d.contactPerson,
        d.contactEmail,
        d.contactPhone,
        d.address as companyAddress,`;

const newSelect = `      SELECT 
        s.*,
        COALESCE(s.fullName, d.studentName) as name,
        COALESCE(s.fullName, d.studentName) as fullName,
        d.companyName,
        d.companyName as company,
        d.position,
        d.taxCode,
        d.academicAdvisor,
        d.advisorEmail,
        d.advisorNote,
        d.contactPerson,
        d.contactRole,
        d.contactEmail,
        d.contactPhone,
        d.address as companyAddress,
        d.representative,
        d.mainIndustry,
        d.taxDepartment,
        d.companyStatus,
        d.orgType,
        d.taxUpdatedAt,`;

if (code.includes(oldSelect)) {
  code = code.split(oldSelect).join(newSelect);
  fs.writeFileSync('TDTU_DB_CNTT_System/backend/src/modules/students/students.service.ts', code, 'utf8');
  console.log('Successfully updated students.service.ts with all Step 3 fields!');
} else {
  console.error('oldSelect not found in students.service.ts');
}
