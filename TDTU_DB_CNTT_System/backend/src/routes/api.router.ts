import { HttpRouter } from './http-router.ts';
import {
  corsMiddleware,
  bodyParserMiddleware,
  authMiddleware,
  requireAuth,
  requireRole,
  requirePrime
} from '../middlewares/middleware.ts';
import { PRIME_ACTIONS, SYSTEM_FEATURES } from '../middlewares/prime-rbac.ts';

// Controllers
import * as authCtrl from '../controllers/auth.controller.ts';
import * as studentsCtrl from '../controllers/students.controller.ts';
import * as internshipCtrl from '../controllers/internship.controller.ts';
import * as bulletinCtrl from '../controllers/bulletin.controller.ts';
import * as documentsCtrl from '../controllers/documents.controller.ts';
import * as certCtrl from '../controllers/certificates.controller.ts';
import * as reportingCtrl from '../controllers/reporting.controller.ts';
import * as notifCtrl from '../controllers/notification.controller.ts';

// Import plugins to ensure auto-registration in WidgetRegistry
import '../services/charts/top-companies.plugin.ts';
import '../services/charts/status-pie.plugin.ts';
import '../services/charts/major-distribution.plugin.ts';
import '../services/charts/salary-trend.plugin.ts';

export function createApiRouter(): HttpRouter {
  const router = new HttpRouter();

  // 1. Global Middlewares
  router.use(corsMiddleware);
  router.use(bodyParserMiddleware);
  router.use(authMiddleware);

  // 2. Authentication & Firebase RBAC Routes
  router.post('/api/auth/google-sso', authCtrl.googleSsoHandler);
  router.post('/api/auth/firebase-login', authCtrl.firebaseLoginHandler);
  router.post('/api/auth/login', authCtrl.passwordLoginHandler);
  router.get('/api/auth/me', requireAuth, authCtrl.getMeHandler);
  router.get('/api/auth/firebase-users', requireRole(['lecturer'], true), authCtrl.getFirebaseUsersHandler);
  router.post('/api/auth/firebase-users', requireRole(['lecturer'], true), authCtrl.upsertFirebaseUserHandler);
  router.put('/api/auth/firebase-users/:uid/status', requireRole(['lecturer'], true), authCtrl.toggleUserStatusHandler);
  router.post('/api/auth/admin-role', requireRole(['lecturer'], true), authCtrl.updateAdminRoleHandler);

  // 3. Student Tracking & Eligibility Routes (P0: Prime RBAC + Role Protected)
  router.get('/api/students', requirePrime(SYSTEM_FEATURES.STUDENTS, PRIME_ACTIONS.READ), studentsCtrl.getStudentsHandler);
  router.post('/api/students', requirePrime(SYSTEM_FEATURES.STUDENTS, PRIME_ACTIONS.CREATE), studentsCtrl.createStudentHandler);
  router.post('/api/students/bulk-import', requireRole(['lecturer'], true), studentsCtrl.bulkImportStudentsHandler);
  router.delete('/api/students', requirePrime(SYSTEM_FEATURES.STUDENTS, PRIME_ACTIONS.DELETE), studentsCtrl.clearAllStudentsHandler);
  router.get('/api/students/summary', requireAuth, studentsCtrl.getSummaryHandler);
  router.get('/api/students/eligibility/:studentId', requireAuth, studentsCtrl.checkEligibilityHandler);
  router.get('/api/students/:studentId', requireAuth, studentsCtrl.getStudentDetailHandler);
  router.put('/api/students/:studentId', requireAuth, studentsCtrl.updateStudentHandler);
  router.delete('/api/students/:studentId', requirePrime(SYSTEM_FEATURES.STUDENTS, PRIME_ACTIONS.DELETE), studentsCtrl.deleteStudentHandler);

  // 4. Internship Declaration & Tax Lookup Routes
  router.get('/api/internship/company-lookup/:taxCode', internshipCtrl.companyLookupHandler); // Tra cứu MST công khai
  router.post('/api/internship/declare', requireAuth, requirePrime(SYSTEM_FEATURES.DECLARATION, PRIME_ACTIONS.CREATE), internshipCtrl.declareInternshipHandler);
  router.get('/api/internship/declaration/:studentId', requireAuth, requirePrime(SYSTEM_FEATURES.DECLARATION, PRIME_ACTIONS.READ), internshipCtrl.getDeclarationHandler);
  router.delete('/api/internship/declaration/:studentId', requireAuth, internshipCtrl.deleteDeclarationHandler);

  // 5. Two-Tier Bulletin Board & Inbound Email Parser Routes
  router.get('/api/bulletin', requireAuth, bulletinCtrl.getBulletinPostsHandler);
  router.post('/api/bulletin', requireRole(['lecturer']), bulletinCtrl.createBulletinPostHandler);
  router.put('/api/bulletin/:id/status', requireRole(['lecturer']), bulletinCtrl.updateBulletinStatusHandler);
  router.delete('/api/bulletin/:id', requireRole(['lecturer']), bulletinCtrl.deleteBulletinPostHandler);
  router.post('/api/bulletin/parse-email', requireRole(['lecturer']), bulletinCtrl.parseEmailForwardHandler);
  router.post('/api/bulletin/apply', requireAuth, bulletinCtrl.applyToJobHandler);
  router.get('/api/bulletin/applications', requireRole(['lecturer']), bulletinCtrl.getApplicationsHandler);

  // 6. Documents & Regulations Routes (DATA-02: BM-01 -> BM-04)
  router.get('/api/documents', requireAuth, documentsCtrl.getDocumentsHandler);
  router.get('/api/documents/:id', requireAuth, documentsCtrl.getDocumentByIdHandler);

  // 7. Language Certificates Standards Routes (CERT-01)
  router.get('/api/certificates/standards', requireAuth, certCtrl.getStandardsHandler);
  router.post('/api/certificates/validate', requireAuth, certCtrl.validateCertificateHandler);
  router.get('/api/certificates', requireRole(['lecturer']), certCtrl.getAllCertificatesHandler);
  router.get('/api/certificates/:studentId', requireAuth, certCtrl.getStudentCertificatesHandler);
  router.post('/api/certificates', requireAuth, certCtrl.addCertificateHandler);
  router.put('/api/certificates/:id', requireRole(['lecturer']), certCtrl.updateCertificateHandler);
  router.delete('/api/certificates/:id', requireRole(['lecturer']), certCtrl.deleteCertificateHandler);

  // 8. Reporting Microservice Engine (Chart Router & Widget Registry)
  router.get('/api/dashboard/widgets', requireAuth, reportingCtrl.listWidgetsHandler);
  router.post('/api/dashboard/chart/dispatch', requireAuth, reportingCtrl.dispatchChartHandler);
  router.get('/api/dashboard/chart/:widgetId', requireAuth, reportingCtrl.getChartByIdHandler);

  // 9. Targeted Notifications & Anti-Spam Routes
  router.get('/api/notifications', requireAuth, notifCtrl.getNotificationsHandler);
  router.post('/api/notifications', requireAuth, notifCtrl.createNotificationHandler);
  router.post('/api/notifications/:id/read', requireAuth, notifCtrl.markAsReadHandler);
  router.post('/api/notifications/mark-all-read', requireAuth, notifCtrl.markAllAsReadHandler);
  router.delete('/api/notifications/:id', requireRole(['lecturer']), notifCtrl.deleteNotificationHandler);
  router.get('/api/notifications/audience-count', requireRole(['lecturer']), notifCtrl.getAudienceCountHandler);

  return router;
}
