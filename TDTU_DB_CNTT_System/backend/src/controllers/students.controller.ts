import { studentsService } from '../services/students.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import type { RouteHandler } from '../models/types.ts';

export const getStudentsHandler: RouteHandler = (req, res) => {
  try {
    const students = studentsService.getAllStudents(req.query);
    sendSuccess(res, { items: students, total: students.length }, 'Danh sách sinh viên thực tập');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh sách sinh viên');
  }
};

export const getSummaryHandler: RouteHandler = (_req, res) => {
  try {
    const summary = studentsService.getSummary();
    sendSuccess(res, summary, 'Tổng quan đợt thực tập HK1/2026-2027');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy dữ liệu tổng quan');
  }
};

export const checkEligibilityHandler: RouteHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      sendError(res, 400, 'Mã số sinh viên là bắt buộc', 'STUDENT_ID_REQUIRED');
      return;
    }
    const result = studentsService.checkEligibility(studentId);
    sendSuccess(res, result, result.message);
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi kiểm tra thẩm định điều kiện');
  }
};

export const getStudentDetailHandler: RouteHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    const student = studentsService.getStudentById(studentId);
    if (!student) {
      sendError(res, 404, `Không tìm thấy sinh viên có MSSV: ${studentId}`, 'STUDENT_NOT_FOUND');
      return;
    }
    sendSuccess(res, student, 'Chi tiết sinh viên');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi tìm sinh viên');
  }
};

export const createStudentHandler: RouteHandler = (req, res) => {
  try {
    const body = req.body || {};
    const created = studentsService.createStudent(body);
    sendSuccess(res, created, 'Thêm / cập nhật sinh viên thành công', 201);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi thêm sinh viên');
  }
};

export const updateStudentHandler: RouteHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    const body = req.body || {};
    const updated = studentsService.updateStudent(studentId, body);
    sendSuccess(res, updated, 'Cập nhật hồ sơ sinh viên thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi cập nhật sinh viên');
  }
};

export const deleteStudentHandler: RouteHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    const deleted = studentsService.deleteStudent(studentId);
    sendSuccess(res, { studentId, deleted }, 'Đã xóa sinh viên thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi xóa sinh viên');
  }
};

export const bulkImportStudentsHandler: RouteHandler = (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.students) ? body.students : (Array.isArray(body) ? body : []);
    const mode = body.mode === 'replace' ? 'replace' : 'append';
    const result = studentsService.bulkImportStudents(items, mode);
    sendSuccess(res, result, `Đã import thành công ${result.imported} sinh viên (Tổng: ${result.total})`);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi import danh sách sinh viên');
  }
};

export const clearAllStudentsHandler: RouteHandler = (_req, res) => {
  try {
    const count = studentsService.clearAllStudents();
    sendSuccess(res, { deleted: count }, `Đã xóa toàn bộ ${count} sinh viên`);
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi xóa toàn bộ danh sách sinh viên');
  }
};
