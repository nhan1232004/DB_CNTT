import type { RouteHandler } from '../models/types.ts';
import { notificationService } from '../services/notification.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';

export const getNotificationsHandler: RouteHandler = (req, res) => {
  try {
    const user = req.user;
    const notifications = notificationService.getNotificationsForUser(user);
    sendSuccess(res, notifications, 'Lấy danh sách thông báo thành công');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh sách thông báo');
  }
};

export const createNotificationHandler: RouteHandler = (req, res) => {
  try {
    const user = req.user;
    const body = req.body || {};

    if (!body.title || !body.content) {
      sendError(res, 400, 'Thiếu tiêu đề hoặc nội dung thông báo', 'VALIDATION_ERROR');
      return;
    }

    const created = notificationService.createNotification(body, user);
    sendSuccess(res, created, 'Tạo và phát thông báo thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Không thể tạo thông báo');
  }
};

export const markAsReadHandler: RouteHandler = (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      sendError(res, 401, 'Vui lòng đăng nhập để đánh dấu đã đọc');
      return;
    }
    const id = req.params?.id;
    if (!id) {
      sendError(res, 400, 'Thiếu mã thông báo');
      return;
    }

    notificationService.markAsRead(id, user);
    sendSuccess(res, { id, read: true }, 'Đã đánh dấu thông báo là đã đọc');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi cập nhật trạng thái thông báo');
  }
};

export const markAllAsReadHandler: RouteHandler = (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      sendError(res, 401, 'Vui lòng đăng nhập để đánh dấu đã đọc');
      return;
    }

    notificationService.markAllAsRead(user);
    sendSuccess(res, { success: true }, 'Đã đánh dấu tất cả thông báo là đã đọc');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi cập nhật trạng thái thông báo');
  }
};

export const deleteNotificationHandler: RouteHandler = (req, res) => {
  try {
    const user = req.user;
    if (!user || (!user.isAdmin && user.role !== 'lecturer')) {
      sendError(res, 403, 'Chỉ Giảng viên / Quản trị viên mới có quyền xóa thông báo');
      return;
    }

    const id = req.params?.id;
    if (!id) {
      sendError(res, 400, 'Thiếu mã thông báo cần xóa');
      return;
    }

    const ok = notificationService.deleteNotification(id);
    if (!ok) {
      sendError(res, 404, 'Không tìm thấy thông báo cần xóa');
      return;
    }

    sendSuccess(res, { id, deleted: true }, 'Đã xóa thông báo thành công');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi khi xóa thông báo');
  }
};

export const getAudienceCountHandler: RouteHandler = (req, res) => {
  try {
    const targetAudience = (req.query?.targetAudience || 'all') as string;
    const targetMajor = req.query?.targetMajor as string | undefined;

    const data = notificationService.getAudienceCount(targetAudience, targetMajor);
    sendSuccess(res, data, 'Tính toán số lượng đối tượng nhận thông báo thành công');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi tính toán số lượng người nhận');
  }
};
