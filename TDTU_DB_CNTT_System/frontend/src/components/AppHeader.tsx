import React from 'react';
import type { UserProfile, UserRole } from '../../../../../packages/shared-types/src/index';

export type ActiveTab =
  | 'tab-overview'
  | 'tab-students'
  | 'tab-internship'
  | 'tab-cert'
  | 'tab-bulletin'
  | 'tab-letters'
  | 'tab-documents';

interface AppHeaderProps {
  currentUser: UserProfile;
  role: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onOpenLoginModal: () => void;
  onOpenAdminModal: () => void;
  onOpenFirebaseModal?: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  totalStudents: number;
  totalEnrollments: number;
  bothCoursesCount: number;
  pendingJdCount: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  role,
  onSwitchRole,
  onOpenLoginModal,
  onOpenAdminModal,
  onOpenFirebaseModal,
  activeTab,
  onSelectTab,
  totalStudents,
  totalEnrollments,
  bothCoursesCount,
  pendingJdCount,
}) => {
  const navItems: { id: ActiveTab; label: string; badge?: string; badgeColor?: string }[] = [
    {
      id: 'tab-overview',
      label: 'Dashboard Tổng Quan',
      badge: 'Chart Router',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'tab-students',
      label: 'Theo Dõi Sinh Viên',
      badge: `${totalStudents} SV (${totalEnrollments} lượt)`,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'tab-internship',
      label: 'Khai Báo Thực Tập & MST',
      badge: `1 hoặc 2 môn (${bothCoursesCount} SV)`,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'tab-cert',
      label: 'Chuẩn Ngoại Ngữ Tốt Nghiệp',
      badge: 'Chuẩn TDTU',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'tab-bulletin',
      label: 'Bảng Tin Giảng Viên & JD',
      badge: pendingJdCount > 0 ? `Tin GV + ${pendingJdCount} JD chờ duyệt` : 'Tin GV + JD',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'tab-letters',
      label: 'Giấy Giới Thiệu (GGT)',
      badge: 'Duyệt & In PDF',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'tab-documents',
      label: 'Biểu Mẫu & Quy Định',
      badge: 'BM-01 đến 04',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              T
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Khoa CNTT - ĐH Tôn Đức Thắng
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  HK1 / 2026-2027
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                Hệ Thống Quản Lý Thực Tập & Dashboard TSNN (DB_CNTT)
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Role Switcher */}
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => onSwitchRole('GV')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  role === 'GV' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {currentUser.isAdmin ? 'Admin / GV (@tdtu.edu.vn)' : 'Giảng viên (@tdtu.edu.vn)'}
              </button>
              <button
                type="button"
                onClick={() => onSwitchRole('SV')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  role === 'SV' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sinh viên (@student.tdtu.edu.vn)
              </button>
            </div>

            {/* Nút Quản lý Phân quyền Admin (Chỉ hiển thị khi tài khoản là Admin) */}
            {role === 'GV' && currentUser.isAdmin && (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#003087] text-xs font-bold transition-colors whitespace-nowrap"
              >
                Phân Quyền Admin
              </button>
            )}

            {/* Nút Quản lý Tài khoản Firebase (Dành cho Giảng viên / Admin) */}
            {role === 'GV' && onOpenFirebaseModal && (
              <button
                type="button"
                onClick={onOpenFirebaseModal}
                className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold transition-colors whitespace-nowrap"
              >
                Quản Lý TK Firebase
              </button>
            )}

            {/* Thông tin tài khoản & Nút đổi tài khoản Email TDTU */}
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="flex items-center space-x-2 border border-slate-200 hover:border-blue-400 bg-slate-50 px-3 py-1.5 rounded-xl text-left transition-colors"
            >
              <div
                className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs ${
                  role === 'GV'
                    ? currentUser.isAdmin
                      ? 'bg-amber-600'
                      : 'bg-blue-700'
                    : 'bg-emerald-600'
                }`}
              >
                {role === 'GV' ? (currentUser.isAdmin ? 'AD' : 'GV') : 'SV'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{currentUser.email}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenLoginModal}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Trang Đăng Nhập
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'font-bold text-blue-700 bg-blue-50 border border-blue-200'
                    : 'font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
