import { authService } from '../services/auth.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import type { RouteHandler } from '../models/types.ts';

export const googleSsoHandler: RouteHandler = (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body || {};
    if (!email) {
      sendError(res, 400, 'Email đăng nhập là bắt buộc', 'EMAIL_REQUIRED');
      return;
    }
    const result = authService.loginWithGoogle(email, name, avatarUrl);
    sendSuccess(res, result, 'Đăng nhập Google SSO TDTU thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Đăng nhập thất bại', 'AUTH_FAILED');
  }
};

export const firebaseLoginHandler: RouteHandler = (req, res) => {
  try {
    const { email, firebaseUid, idToken, name } = req.body || {};
    if (!email) {
      sendError(res, 400, 'Email đăng nhập là bắt buộc', 'EMAIL_REQUIRED');
      return;
    }
    const result = authService.loginWithFirebase(email, firebaseUid, idToken, name);
    sendSuccess(res, result, 'Đăng nhập Firebase Auth thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Đăng nhập Firebase thất bại', 'AUTH_FAILED');
  }
};

export const getMeHandler: RouteHandler = (req, res) => {
  if (!req.user) {
    sendError(res, 401, 'Chưa đăng nhập hoặc phiên đã hết hạn', 'UNAUTHORIZED');
    return;
  }
  sendSuccess(res, req.user, 'Thông tin người dùng hiện tại');
};

export const getFirebaseUsersHandler: RouteHandler = (req, res) => {
  try {
    const users = authService.getFirebaseUsers();
    sendSuccess(res, { items: users, total: users.length }, 'Danh sách tài khoản hệ thống');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh sách tài khoản');
  }
};

export const upsertFirebaseUserHandler: RouteHandler = (req, res) => {
  try {
    const user = authService.upsertFirebaseUser(req.body);
    sendSuccess(res, user, 'Đồng bộ tài khoản thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi cập nhật tài khoản');
  }
};

export const toggleUserStatusHandler: RouteHandler = (req, res) => {
  try {
    const { uid } = req.params;
    const { isActive } = req.body || {};
    const updated = authService.toggleUserStatus(uid, Boolean(isActive));
    sendSuccess(res, updated, 'Cập nhật trạng thái tài khoản thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi cập nhật trạng thái tài khoản');
  }
};

export const updateAdminRoleHandler: RouteHandler = (req, res) => {
  try {
    const { email, isAdmin } = req.body || {};
    if (!email) {
      sendError(res, 400, 'Email là bắt buộc', 'EMAIL_REQUIRED');
      return;
    }
    const updated = authService.updateAdminRole(email, Boolean(isAdmin));
    sendSuccess(res, updated, 'Cập nhật quyền Quản trị viên thành công');
  } catch (err: any) {
    sendError(res, 400, err?.message || 'Lỗi phân quyền Admin');
  }
};
