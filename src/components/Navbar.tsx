import React, { useState } from 'react';
import {
  Flame,
  Bell,
  LogOut,
  User,
  CheckCircle2,
  Menu,
  X,
  BookOpen,
  Calendar,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FlameStreakBadge } from './FlameStreakBadge';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, streak, logout, setShowLoginModal } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, requestPushPermission, pushPermission } =
    useNotifications();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTeacher = user?.role === 'teacher';

  const teacherTabs = [
    { id: 'dashboard', label: 'Tổng quan', icon: BookOpen },
    { id: 'assignments', label: 'Quản lý Bài tập', icon: BookOpen },
    { id: 'students', label: 'Học sinh', icon: Users },
    { id: 'calendar', label: 'Lịch sử & Chuỗi', icon: Calendar },
    { id: 'settings', label: 'Cài đặt & Nhật ký', icon: Settings },
  ];

  const studentTabs = [
    { id: 'dashboard', label: 'Nhiệm vụ hôm nay', icon: Sparkles },
    { id: 'assignments', label: 'Danh sách bài tập', icon: BookOpen },
    { id: 'calendar', label: 'Lịch sử & Chuỗi 🔥', icon: Calendar },
  ];

  const activeTabs = isTeacher ? teacherTabs : studentTabs;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 p-0.5 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
                </div>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-red-400 bg-clip-text text-transparent">
                  Finn
                </span>
                <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                  Học Tập &amp; Giữ Chuỗi
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {activeTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Streak flame badge for students */}
            {user?.role === 'student' && (
              <button
                onClick={() => onTabChange('calendar')}
                className="hover:opacity-90 transition-opacity"
              >
                <FlameStreakBadge streak={streak} />
              </button>
            )}

            {/* Notifications Dropdown */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-200 animate-fade-in">
                    <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold text-white">Thông báo</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                            {unreadCount} mới
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-amber-400 hover:underline"
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>

                    {/* Push permission prompt if not yet granted */}
                    {pushPermission !== 'granted' && (
                      <div className="px-3 py-2 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                        <span>Bật thông báo đẩy khi Thầy chấm bài?</span>
                        <button
                          onClick={requestPushPermission}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold"
                        >
                          Bật ngay
                        </button>
                      </div>
                    )}

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          Chưa có thông báo nào.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              setShowNotifDropdown(false);
                              if (n.link?.includes('assignments')) {
                                onTabChange('assignments');
                              } else {
                                onTabChange('dashboard');
                              }
                            }}
                            className={`p-3 text-xs cursor-pointer transition-colors ${
                              n.read ? 'hover:bg-slate-800/40 opacity-70' : 'bg-slate-800/60 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-slate-100">{n.title}</span>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1"></span>}
                            </div>
                            <p className="text-slate-300 mt-1 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Switch Account / Login Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setShowLoginModal(true)}
                  className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition-colors"
                  title="Nhấn để đổi tài khoản hoặc xem thông tin"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.displayName.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                      {user.displayName}
                    </p>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {isTeacher ? 'Quản trị hệ thống' : `Lớp ${user.className || '12A'}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Đăng Nhập
              </button>
            )}

            {/* Mobile menu trigger */}
            {user && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && user && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {activeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
