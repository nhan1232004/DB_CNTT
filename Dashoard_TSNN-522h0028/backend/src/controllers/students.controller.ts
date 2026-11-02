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
