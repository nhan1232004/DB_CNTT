const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('TDTU_DB_CNTT_System/backend/src/data/db_cntt.sqlite');
console.log('Tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name));
console.log('Students count:', db.prepare('SELECT COUNT(*) as count FROM students').get());
console.log('Declarations count:', db.prepare('SELECT COUNT(*) as count FROM declarations').get());
console.log('Certs count:', db.prepare('SELECT COUNT(*) as count FROM student_uploaded_certs').get());
console.log('Users count:', db.prepare('SELECT COUNT(*) as count FROM users').get());
console.log('Declarations sample:', db.prepare('SELECT * FROM declarations LIMIT 3').all());
console.log('Certs sample:', db.prepare('SELECT * FROM student_uploaded_certs LIMIT 3').all());

console.log('Target students:');
console.log(db.prepare("SELECT studentId, fullName, status, isDualCourse, cert FROM students WHERE studentId IN ('522H0045', '522H0028', '51900839')").all());
