import { certificatesService } from './certificates.service.ts';
import { sendSuccess, sendError } from '../../core/response.ts';
import type { RouteHandler } from '../../core/types.ts';

export const getStandardsHandler: RouteHandler = (_req, res) => {
  try {
    const standards = certificatesService.getStandards();
    sendSuccess(res, standards, 'Danh mục chứng chỉ ngoại ngữ chuẩn xét tốt nghiệp TDTU');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh mục chuẩn ngoại ngữ');
  }
};

export const validateCertificateHandler: RouteHandler = (req, res) => {
  try {
    const { type, score } = req.body || {};
    if (!type) {
      sendError(res, 400, 'Loại chứng chỉ là bắt buộc', 'TYPE_REQUIRED');
      return;
    }
    const result = certificatesService.validateCertificate(type, score);
    sendSuccess(res, result, result.message);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi xác thực chứng chỉ');
  }
};
