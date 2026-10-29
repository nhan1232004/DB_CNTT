import { internshipService } from './internship.service.ts';
import { taxLookupAdapter } from './tax-lookup.adapter.ts';
import { sendSuccess, sendError } from '../../core/response.ts';
import type { RouteHandler } from '../../core/types.ts';

export const companyLookupHandler: RouteHandler = async (req, res) => {
  try {
    const { taxCode } = req.params;
    const result = await taxLookupAdapter.lookupTaxCode(taxCode);
    sendSuccess(res, result, 'Tra cứu thông tin doanh nghiệp thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi tra cứu mã số thuế');
  }
};

export const declareInternshipHandler: RouteHandler = (req, res) => {
  try {
    const body = req.body || {};
    // If student is logged in, ensure student can only declare for themselves
    if (req.user && req.user.role === 'student') {
      if (req.user.studentId && body.studentId && req.user.studentId.toUpperCase() !== body.studentId.toUpperCase()) {
        sendError(res, 403, 'Bạn không thể khai báo thay cho sinh viên khác!', 'FORBIDDEN_MODIFICATION');
        return;
      }
      body.studentId = req.user.studentId;
    }

    const result = internshipService.declareInternship(body);
    sendSuccess(res, result, 'Khai báo nơi thực tập thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi khai báo nơi thực tập');
  }
};

export const getDeclarationHandler: RouteHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    // Check permission
    if (req.user && req.user.role === 'student' && req.user.studentId) {
      if (req.user.studentId.toUpperCase() !== studentId.toUpperCase()) {
        sendError(res, 403, 'Bạn chỉ có quyền xem thông tin của chính mình!', 'FORBIDDEN');
        return;
      }
    }

    const declaration = internshipService.getDeclarationByStudentId(studentId);
    if (!declaration) {
      sendError(res, 404, 'Chưa có thông tin khai báo cho sinh viên này', 'DECLARATION_NOT_FOUND');
      return;
    }
    sendSuccess(res, declaration, 'Thông tin khai báo thực tập');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy thông tin khai báo');
  }
};
