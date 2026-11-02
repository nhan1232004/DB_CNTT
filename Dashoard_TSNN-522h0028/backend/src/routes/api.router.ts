import { HttpRouter } from './http-router.ts';
import {
  corsMiddleware,
  bodyParserMiddleware,
  authMiddleware,
  requireAuth,
  requireRole
} from '../middlewares/middleware.ts';

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
  router.get('/api/auth/me', authCtrl.getMeHandler);
  router.get('/api/auth/firebase-users', authCtrl.getFirebaseUsersHandler);
  router.post('/api/auth/firebase-users', requireRole(['lecturer'], true), authCtrl.upsertFirebaseUserHandler);
  router.put('/api/auth/firebase-users/:uid/status', requireRole(['lecturer'], true), authCtrl.toggleUserStatusHandler);
  router.post('/api/auth/admin-role', requireRole(['lecturer'], true), authCtrl.updateAdminRoleHandler);

  // 3. Student Tracking & Eligibility Routes (AUTH-03)
  router.get('/api/students', studentsCtrl.getStudentsHandler);
  router.get('/api/students/summary', studentsCtrl.getSummaryHandler);
  router.get('/api/students/eligibility/:studentId', studentsCtrl.checkEligibilityHandler);
  router.get('/api/students/:studentId', studentsCtrl.getStudentDetailHandler);

  // 4. Internship Declaration & Tax Lookup Routes
  router.get('/api/internship/company-lookup/:taxCode', internshipCtrl.companyLookupHandler);
  router.post('/api/internship/declare', requireAuth, internshipCtrl.declareInternshipHandler);
  router.get('/api/internship/declaration/:studentId', requireAuth, internshipCtrl.getDeclarationHandler);
  router.delete('/api/internship/declaration/:studentId', requireAuth, internshipCtrl.deleteDeclarationHandler);

  // 5. Two-Tier Bulletin Board & Inbound Email Parser Routes
  router.get('/api/bulletin', bulletinCtrl.getBulletinPostsHandler);
  router.post('/api/bulletin', requireRole(['lecturer']), bulletinCtrl.createBulletinPostHandler);
  router.put('/api/bulletin/:id/status', requireRole(['lecturer']), bulletinCtrl.updateBulletinStatusHandler);
  router.post('/api/bulletin/parse-email', requireRole(['lecturer']), bulletinCtrl.parseEmailForwardHandler);
  router.post('/api/bulletin/apply', requireAuth, bulletinCtrl.applyToJobHandler);
  router.get('/api/bulletin/applications', requireRole(['lecturer']), bulletinCtrl.getApplicationsHandler);

  // 6. Documents & Regulations Routes (DATA-02: BM-01 -> BM-04)
  router.get('/api/documents', documentsCtrl.getDocumentsHandler);
  router.get('/api/documents/:id', documentsCtrl.getDocumentByIdHandler);

  // 7. Language Certificates Standards Routes (CERT-01)
  router.get('/api/certificates/standards', certCtrl.getStandardsHandler);
  router.post('/api/certificates/validate', certCtrl.validateCertificateHandler);
  router.get('/api/certificates', certCtrl.getAllCertificatesHandler);
  router.get('/api/certificates/:studentId', certCtrl.getStudentCertificatesHandler);
  router.post('/api/certificates', certCtrl.addCertificateHandler);
  router.delete('/api/certificates/:id', certCtrl.deleteCertificateHandler);

  // 8. Reporting Microservice Engine (Chart Router & Widget Registry)
  router.get('/api/dashboard/widgets', reportingCtrl.listWidgetsHandler);
  router.post('/api/dashboard/chart/dispatch', reportingCtrl.dispatchChartHandler);
  router.get('/api/dashboard/chart/:widgetId', reportingCtrl.getChartByIdHandler);

  // 9. Targeted Notifications & Anti-Spam Routes
  router.get('/api/notifications', notifCtrl.getNotificationsHandler);
  router.post('/api/notifications', requireAuth, notifCtrl.createNotificationHandler);
  router.post('/api/notifications/:id/read', requireAuth, notifCtrl.markAsReadHandler);
  router.post('/api/notifications/mark-all-read', requireAuth, notifCtrl.markAllAsReadHandler);
  router.delete('/api/notifications/:id', requireRole(['lecturer']), notifCtrl.deleteNotificationHandler);
  router.get('/api/notifications/audience-count', requireRole(['lecturer']), notifCtrl.getAudienceCountHandler);

  return router;
}
