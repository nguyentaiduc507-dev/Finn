/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { AssignmentList } from './components/AssignmentList';
import { CalendarHistory } from './components/CalendarHistory';
import { StudentManagement } from './components/StudentManagement';
import { TeacherSettings } from './components/TeacherSettings';
import { LoginModal } from './components/LoginModal';
import { Flame, Sparkles, Shield, GraduationCap, ArrowRight } from 'lucide-react';

function AppContent() {
  const { user, loading, showLoginModal, setShowLoginModal, loginAsTeacher, loginAsStudent } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  const isTeacher = user?.role === 'teacher';

  // If tab changed when role changes, reset to dashboard
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 animate-spin mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px]" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-400">
          Đang tải nền tảng Finn...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top Test Switcher Banner for Seamless Evaluation */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-1.5 text-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white text-[11px] sm:text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {user ? `${user.displayName} (${isTeacher ? 'GV' : user.className || '12A1'})` : 'Chưa đăng nhập'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
            Chuyển nhanh:
          </span>
          <button
            onClick={() => {
              if (isTeacher) return;
              setShowLoginModal(true);
            }}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
              isTeacher
                ? 'bg-amber-600 text-white shadow-sm cursor-default'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            👨‍🏫 Giáo viên {isTeacher ? '' : '(Cần PIN)'}
          </button>
          <button
            onClick={() => loginAsStudent('HS01', '123456')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
              user?.id === 'student-an'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🔥 An
          </button>
          <button
            onClick={() => loginAsStudent('HS02', '123456')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
              user?.id === 'student-linh'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ⭐ Linh
          </button>
          <button
            onClick={() => loginAsStudent('HS03', '123456')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
              user?.id === 'student-nam'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📝 Nam
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          /* Public / Welcome Screen if logged out */
          <div className="py-12 sm:py-20 text-center max-w-2xl mx-auto space-y-6">
            <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-400">
              <Flame className="w-12 h-12 fill-orange-500 text-orange-500 animate-bounce" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Finn
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Nền tảng học tập trực tuyến, giao bài hằng ngày, nộp bài giải và duy trì ngọn lửa chuỗi học tập (Streak) bền bỉ.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl shadow-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Đăng Nhập Giáo Viên (Nhập mã PIN)
              </button>
              <button
                onClick={() => loginAsStudent('HS01', '123456')}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-2xl border border-slate-700 shadow-md transition-all text-sm flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-sky-400" />
                Vào Với Vai Trò Học Sinh (HS01)
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Views */
          <div>
            {currentTab === 'dashboard' && (
              isTeacher ? (
                <TeacherDashboard onNavigate={setCurrentTab} />
              ) : (
                <StudentDashboard onNavigate={setCurrentTab} />
              )
            )}

            {currentTab === 'assignments' && <AssignmentList />}

            {currentTab === 'calendar' && <CalendarHistory />}

            {currentTab === 'students' && isTeacher && <StudentManagement />}

            {currentTab === 'settings' && isTeacher && <TeacherSettings />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="font-bold text-slate-200">Finn</span>
            <span>— Đồng hành cùng học sinh chinh phục mục tiêu</span>
          </div>
          <p className="text-slate-400">
            Múi giờ Asia/Ho_Chi_Minh &bull; Bảo mật xác thực máy chủ &bull; Mã PIN khởi tạo: 26052007
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
