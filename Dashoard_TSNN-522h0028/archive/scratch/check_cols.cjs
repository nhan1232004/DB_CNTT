const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('TDTU_DB_CNTT_System/backend/src/data/db_cntt.sqlite');
const cols = db.prepare("PRAGMA table_info(declarations)").all().map(c => c.name);
console.log('Columns in declarations:', cols);
