import { studentsService } from '../services/students.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { isStudentOwnerOrStaff } from '../utils/student-helper.ts';
import type { RouteHandler } from '../models/types.ts';

export const getStudentsHandler: RouteHandler = (req, res) => {
  try {
    const students = studentsService.getAllStudents(req.query);
    sendSuccess(res, { items: students, total: students.length }, 'Danh sách sinh viên thực tập');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh sách sinh viên');
  }
};

export const getSummaryHandler: RouteHandler = (req, res) => {
  try {
    const semester = req.query?.semester;
    const summary = studentsService.getSummary(semester);
    sendSuccess(res, summary, `Tổng quan đợt thực tập (${summary.period || semester || 'HK1/2026-2027'})`);
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
    if (!isStudentOwnerOrStaff(req.user, studentId)) {
      sendError(res, 403, 'Sinh viên chỉ có quyền tra cứu điều kiện thực tập của chính mình', 'FORBIDDEN_ELIGIBILITY');
      return;
    }
    const semester = req.query?.semester;
    const result = studentsService.checkEligibility(studentId, semester);
    sendSuccess(res, result, result.message);
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi kiểm tra thẩm định điều kiện');
  }
};

export const getStudentDetailHandler: RouteHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      sendError(res, 400, 'MSSV là bắt buộc', 'STUDENT_ID_REQUIRED');
      return;
    }
    // P0 Security: Sinh viên chỉ có quyền xem hồ sơ của chính mình
    if (!isStudentOwnerOrStaff(req.user, studentId)) {
      sendError(res, 403, 'Sinh viên chỉ có quyền truy cập hồ sơ của chính mình', 'FORBIDDEN_PROFILE');
      return;
    }
    const semester = req.query?.semester;
    const student = studentsService.getStudentById(studentId, semester);
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
    const semester = req.query?.semester || body.semester;
    const created = studentsService.createStudent(body, semester);
    sendSuccess(res, created, 'Thêm / cập nhật sinh viên thành công', 201);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi thêm sinh viên');
  }
};

export const updateStudentHandler: RouteHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    if (!isStudentOwnerOrStaff(req.user, studentId)) {
      sendError(res, 403, 'Sinh viên không được phép chỉnh sửa hồ sơ của sinh viên khác', 'FORBIDDEN_PROFILE_UPDATE');
      return;
    }
    if (req.user?.role === 'student' && req.user?.isEnrolledThisSemester === false) {
      sendError(res, 403, 'Sinh viên ngoài kỳ thực tập không có quyền chỉnh sửa hồ sơ học kỳ hiện tại', 'OUT_OF_SEMESTER_READONLY');
      return;
    }
    const body = req.body || {};
    const semester = req.query?.semester || body.semester;
    const updated = studentsService.updateStudent(studentId, body, semester);
    sendSuccess(res, updated, 'Cập nhật hồ sơ sinh viên thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi cập nhật sinh viên');
  }
};

export const deleteStudentHandler: RouteHandler = (req, res) => {
  try {
    const { studentId } = req.params;
    const semester = req.query?.semester;
    const deleted = studentsService.deleteStudent(studentId, semester);
    sendSuccess(res, { studentId, semester, deleted }, 'Đã xóa sinh viên thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi xóa sinh viên');
  }
};

export const bulkImportStudentsHandler: RouteHandler = (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.students) ? body.students : (Array.isArray(body) ? body : []);
    const mode = body.mode === 'replace' ? 'replace' : 'append';
    const semester = body.semester || req.query?.semester;
    const result = studentsService.bulkImportStudents(items, mode, semester);
    sendSuccess(res, result, `Đã import thành công ${result.imported} sinh viên (Tổng: ${result.total})`);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi import danh sách sinh viên');
  }
};

export const clearAllStudentsHandler: RouteHandler = (req, res) => {
  try {
    const semester = req.query?.semester || req.body?.semester;
    const count = studentsService.clearAllStudents(semester);
    sendSuccess(res, { deleted: count, semester }, `Đã xóa toàn bộ ${count} sinh viên`);
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi xóa toàn bộ danh sách sinh viên');
  }
};
