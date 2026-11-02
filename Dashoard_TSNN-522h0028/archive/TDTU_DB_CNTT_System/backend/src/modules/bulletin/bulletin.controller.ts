import { bulletinService } from './bulletin.service.ts';
import { sendSuccess, sendError } from '../../core/response.ts';
import type { RouteHandler } from '../../core/types.ts';

export const getBulletinPostsHandler: RouteHandler = (req, res) => {
  try {
    const { type, status } = req.query;
    const posts = bulletinService.getPosts({ type, status });
    sendSuccess(res, { items: posts, total: posts.length }, 'Bảng tin Khoa CNTT');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy bảng tin');
  }
};

export const createBulletinPostHandler: RouteHandler = (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.content) {
      sendError(res, 400, 'Tiêu đề và nội dung là bắt buộc', 'TITLE_CONTENT_REQUIRED');
      return;
    }

    const author = req.user ? req.user.name : (body.author || 'Khoa CNTT');
    const authorEmail = req.user ? req.user.email : (body.authorEmail || 'khoa.cntt@tdtu.edu.vn');
    const authorRole = req.user ? (req.user.isAdmin ? 'Giảng viên Quản trị' : 'Giảng viên Khoa') : 'Giảng viên';

    const post = bulletinService.createPost({
      ...body,
      author,
      authorEmail,
      authorRole
    });
    sendSuccess(res, post, 'Tạo bài đăng bảng tin thành công', 201);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi tạo bài đăng');
  }
};

export const updateBulletinStatusHandler: RouteHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status || !['published', 'draft', 'archived'].includes(status)) {
      sendError(res, 400, 'Trạng thái không hợp lệ (published, draft, archived)', 'INVALID_STATUS');
      return;
    }
    const updated = bulletinService.updatePostStatus(id, status);
    sendSuccess(res, updated, `Cập nhật trạng thái bài đăng sang [${status}] thành công`);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi cập nhật trạng thái');
  }
};

export const parseEmailForwardHandler: RouteHandler = (req, res) => {
  try {
    const { rawEmail } = req.body || {};
    if (!rawEmail) {
      sendError(res, 400, 'Nội dung email forward (rawEmail) là bắt buộc', 'RAW_EMAIL_REQUIRED');
      return;
    }
    const lecturerEmail = req.user ? req.user.email : 'giangvien@tdtu.edu.vn';
    const lecturerName = req.user ? req.user.name : 'Giảng viên Điều phối';

    const post = bulletinService.processEmailForward(rawEmail, lecturerEmail, lecturerName);
    sendSuccess(res, post, 'Đã bóc tách nội dung email và tạo bản nháp JD chờ phê duyệt', 201);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi xử lý email forward');
  }
};

export const applyToJobHandler: RouteHandler = (req, res) => {
  try {
    const { postId, resumeNote } = req.body || {};
    if (!postId) {
      sendError(res, 400, 'ID tin tuyển dụng là bắt buộc', 'POST_ID_REQUIRED');
      return;
    }
    if (!req.user) {
      sendError(res, 401, 'Yêu cầu đăng nhập trước khi ứng tuyển', 'AUTH_REQUIRED');
      return;
    }

    const application = bulletinService.applyToJob(
      postId,
      req.user.studentId || req.user.uid,
      req.user.name,
      req.user.email,
      resumeNote
    );
    sendSuccess(res, application, 'Nộp hồ sơ ứng tuyển thành công! Nhà tuyển dụng sẽ liên hệ qua email sinh viên.', 201);
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi nộp hồ sơ ứng tuyển');
  }
};

export const getApplicationsHandler: RouteHandler = (req, res) => {
  try {
    const { postId } = req.query;
    const apps = bulletinService.getApplications(postId);
    sendSuccess(res, { items: apps, total: apps.length }, 'Danh sách hồ sơ ứng tuyển');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh sách hồ sơ ứng tuyển');
  }
};
