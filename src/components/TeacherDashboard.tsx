import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Bell,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import type { Submission, Assignment, UserProfile } from '../types/index';
import { GradingModal } from './GradingModal';
import { AssignmentFormModal } from './AssignmentFormModal';

interface TeacherDashboardProps {
  onNavigate: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsData, studentsData] = await Promise.all([
        api.getTeacherStats(),
        api.getStudents(),
      ]);
      setStats(statsData);
      setStudents(studentsData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Bàn Làm Việc Của Giáo Viên
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Chào Giáo viên! 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              Mỗi ngày một thử thách, duy trì thói quen học tập bền bỉ cho học sinh thông qua ngọn lửa chuỗi ngày (Streak). Hôm nay có{' '}
              <strong className="text-amber-400">{stats?.submittedToday || 0} bài nộp</strong> mới từ các em.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCreateAssignmentOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl shadow-xl transition-all text-xs flex items-center gap-2 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Giao Bài Mới Ngay
            </button>
            <button
              onClick={() => onNavigate('students')}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl border border-slate-700 transition-all text-xs flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-sky-400" />
              Quản Lý Học Sinh
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng Học Sinh
            </span>
            <span className="text-2xl font-extrabold text-white">
              {stats?.totalStudents || students.length}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Bài Cần Chấm
            </span>
            <span className="text-2xl font-extrabold text-amber-400">
              {stats?.pendingSubmissions || 0}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Nộp Hôm Nay
            </span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {stats?.submittedToday || 0}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Flame className="w-6 h-6 fill-orange-500 text-orange-500" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Bài Đang Mở
            </span>
            <span className="text-2xl font-extrabold text-orange-400">
              {stats?.activeAssignmentsCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Submissions Waiting to be Graded */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Bài Nộp Chờ Thầy Chấm Điểm</h3>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!stats?.recentSubmissions || stats.recentSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/40" />
              <p>Hiện không có bài nộp nào đang chờ chấm.</p>
              <p className="text-slate-500 mt-0.5">Tất cả bài tập đã được chấm điểm kịp thời!</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
              {stats.recentSubmissions.map((sub: any) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 flex items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{sub.studentName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {sub.studentCode}
                      </span>
                      {sub.isLate ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          Nộp muộn
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          Đúng hạn
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-1 truncate">
                      {sub.assignmentTitle} ({sub.subject})
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Thời gian: {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')} - {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sub.status === 'graded' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-xs">
                        {sub.feedback?.score || 10}/10đ
                      </span>
                    ) : (
                      <button
                        onClick={() => setGradingSubmission(sub)}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-md transition-all text-xs"
                      >
                        Chấm Điểm
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pedagogical Guidance & Quick Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Triết Lý Giáo Dục Quang Hưng</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                🎯 <strong>Tập trung vào sự tiến bộ:</strong> Giữ chuỗi (streak) là công cụ tạo phản xạ học tập tự giác mỗi ngày, không tạo áp lực xấu hổ hay xếp hạng toxic.
              </p>
              <p>
                🔥 <strong>Bảo toàn chuỗi ngày nghỉ:</strong> Những ngày không có bài bắt buộc được hệ thống tính là ngày nghỉ và không làm mất chuỗi của học sinh.
              </p>
              <p>
                🛡️ <strong>Bảo mật &amp; Lịch sử:</strong> Mã PIN giáo viên và dữ liệu bài nộp được máy chủ ghi nhận an toàn, không thể bị chỉnh sửa từ phía máy khách.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => onNavigate('calendar')}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Kiểm Tra Lịch Sử &amp; Ngoại Lệ Chuỗi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Creation Modal */}
      {createAssignmentOpen && (
        <AssignmentFormModal
          isOpen={createAssignmentOpen}
          onClose={() => setCreateAssignmentOpen(false)}
          onSaved={() => {
            loadDashboard();
            onNavigate('assignments');
          }}
          studentsList={students}
        />
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <GradingModal
          submission={gradingSubmission}
          isOpen={!!gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          onGraded={() => loadDashboard()}
        />
      )}
    </div>
  );
};
