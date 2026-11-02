import { certificatesService } from '../services/certificates.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import type { RouteHandler } from '../models/types.ts';

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

export const getStudentCertificatesHandler: RouteHandler = (req, res) => {
  try {
    const studentId = req.params.studentId || (req.user?.studentId) || '522H0045';
    const certs = certificatesService.getStudentCertificates(studentId);
    sendSuccess(res, certs, `Danh sách chứng chỉ của sinh viên ${studentId}`);
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh sách chứng chỉ');
  }
};

export const getAllCertificatesHandler: RouteHandler = (_req, res) => {
  try {
    const certs = certificatesService.getAllCertificates();
    sendSuccess(res, certs, 'Danh sách chứng chỉ toàn bộ sinh viên (Scope All)');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh sách chứng chỉ toàn bộ');
  }
};

export const addCertificateHandler: RouteHandler = (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || !body.score) {
      sendError(res, 400, 'Tên chứng chỉ và điểm số là bắt buộc', 'NAME_SCORE_REQUIRED');
      return;
    }
    const studentId = body.studentId || (req.user?.studentId) || '522H0045';
    const cert = certificatesService.saveStudentCertificate({
      ...body,
      studentId
    });
    sendSuccess(res, cert, 'Lưu chứng chỉ thành công', 201);
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lưu chứng chỉ');
  }
};

export const deleteCertificateHandler: RouteHandler = (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      sendError(res, 400, 'Mã chứng chỉ (id) là bắt buộc', 'ID_REQUIRED');
      return;
    }
    certificatesService.deleteStudentCertificate(id);
    sendSuccess(res, { id }, 'Xóa chứng chỉ thành công');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi xóa chứng chỉ');
  }
};

export const updateCertificateHandler: RouteHandler = (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const updated = certificatesService.updateStudentCertificate(id, body);
    sendSuccess(res, updated, 'Cập nhật chứng chỉ thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi cập nhật chứng chỉ');
  }
};
