const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('TDTU_DB_CNTT_System/backend/src/data/db_cntt.sqlite');

const newCols = [
  'academicAdvisor',
  'advisorEmail',
  'advisorNote',
  'contactRole',
  'taxDepartment',
  'companyStatus',
  'orgType',
  'taxUpdatedAt',
  'representative',
  'mainIndustry'
];

newCols.forEach(col => {
  try {
    db.exec(`ALTER TABLE declarations ADD COLUMN ${col} TEXT;`);
    console.log(`Added column ${col}`);
  } catch (e) {
    console.log(`Column ${col} already exists or error: ${e.message}`);
  }
});

const cols = db.prepare("PRAGMA table_info(declarations)").all().map(c => c.name);
console.log('Updated columns in declarations:', cols);
