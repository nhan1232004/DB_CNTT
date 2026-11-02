import test from 'node:test';
import assert from 'node:assert/strict';
import { certificatesService } from '../../../TDTU_DB_CNTT_System/backend/src/modules/certificates/certificates.service.ts';
import { getDatabase } from '../../../TDTU_DB_CNTT_System/backend/src/database/sqlite.db.ts';

test('1. Certificate Service: SQLite student_uploaded_certs table exists', () => {
  const db = getDatabase();
  const tableCheck = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='student_uploaded_certs'"
  ).get() as { name: string } | undefined;
  assert.ok(tableCheck, 'student_uploaded_certs table should exist');
  assert.strictEqual(tableCheck.name, 'student_uploaded_certs');
});

test('2. Certificate Service: Add, Get, and Delete Certificate for Student', () => {
  const testStudentId = '522H9999';
  const testCertId = 'cert_test_' + Date.now();

  // 1. Add certificate
  const certData = {
    id: testCertId,
    studentId: testStudentId,
    type: 'Ngoại ngữ',
    name: 'TOEIC',
    score: '850',
    maxScore: '990',
    level: 'B2',
    examDate: '15/06/2026',
    issueDate: '28/06/2026',
    driveLink: 'https://drive.google.com/file/d/test/view',
    proofFileName: 'TOEIC_522H9999.pdf'
  };

  const saved = certificatesService.saveStudentCertificate(certData);
  assert.ok(saved);
  assert.strictEqual(saved.id, testCertId);
  assert.strictEqual(saved.studentId, testStudentId);
  assert.strictEqual(saved.score, '850');
  assert.strictEqual(saved.issueDate, '28/06/2026');

  // 2. Query student certificates
  const certs = certificatesService.getStudentCertificates(testStudentId);
  assert.ok(Array.isArray(certs));
  assert.strictEqual(certs.length, 1);
  assert.strictEqual(certs[0].id, testCertId);
  assert.strictEqual(certs[0].name, 'TOEIC');

  // 3. Delete certificate
  const deleted = certificatesService.deleteStudentCertificate(testCertId);
  assert.strictEqual(deleted, true);

  const certsAfterDelete = certificatesService.getStudentCertificates(testStudentId);
  assert.strictEqual(certsAfterDelete.length, 0);
});

test('3. Certificate Service: Scope All retrieval for Lecturer and Faculty Admin', () => {
  const allCerts = certificatesService.getAllCertificates();
  assert.ok(Array.isArray(allCerts), 'getAllCertificates should return an array');
  assert.ok(allCerts.length > 0, 'Should return certificates across multiple students');
  
  // Verify that records have studentId and cert details
  const first = allCerts[0];
  assert.ok(first.studentId, 'Certificate record should have studentId');
  assert.ok(first.name, 'Certificate record should have name');
  assert.ok(first.score, 'Certificate record should have score');
});
