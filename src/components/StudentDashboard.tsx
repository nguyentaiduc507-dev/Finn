import React, { useState, useEffect } from 'react';
import {
  Flame,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  ArrowRight,
  Send,
  Award,
  Zap,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import type { Assignment, Submission } from '../types/index';
import { FlameStreakBadge } from './FlameStreakBadge';
import { StudentSubmissionModal } from './StudentSubmissionModal';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user, streak } = useAuth();
  const { showToast } = useNotifications();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const list = await api.getAssignments();
      setAssignments(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [user]);

  // Vietnam today format
  const todayVN = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

  // Assignments due today or active
  const todayAssignments = assignments.filter((a) => {
    const dueDay = a.dueAt ? a.dueAt.substring(0, 10) : '';
    return dueDay === todayVN || !a.studentSubmission;
  });

  const streakPending = streak?.todayPending;
  const streakCompleted = streak?.todayCompleted;

  return (
    <div className="space-y-6">
      {/* Hero Streak Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-orange-950/60 border border-orange-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Chuỗi Học Tập Cá Nhân
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Xin chào, {user?.displayName || 'Học sinh'}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              {streakCompleted ? (
                <span className="text-emerald-300 font-semibold">
                  🎉 Tuyệt vời! Bạn đã hoàn thành nhiệm vụ và giữ vững ngọn lửa học tập ngày hôm nay!
                </span>
              ) : streakPending ? (
                <span className="text-amber-300 font-semibold">
                  🔥 Hôm nay còn bài tập chưa hoàn thành! Hãy nộp bài trước 23:59 tối nay để giữ chuỗi{' '}
                  <strong className="text-white underline">{streak?.currentStreak || 0} ngày</strong> nhé!
                </span>
              ) : (
                <span>
                  Mỗi ngày một chút kiên trì, tích lũy kiến thức qua từng bài tập trên Finn.
                </span>
              )}
            </p>
          </div>

          {/* Big Flame Streak Display */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-orange-500/30 p-4 rounded-3xl shadow-xl self-start md:self-auto">
            <div className="relative flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/40">
              <Flame className="w-10 h-10 text-orange-500 fill-orange-500 animate-pulse drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                {streak?.currentStreak || 0}
                <span className="text-xs text-orange-400 font-bold uppercase">Ngày</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Kỷ lục: <strong className="text-amber-300">{streak?.longestStreak || 0} ngày</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action reminder banner */}
        {streakPending && (
          <div className="mt-6 p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Đừng để mất chuỗi! Bài tập môn Toán hôm nay đã sẵn sàng chờ em giải.</span>
            </div>
            <button
              onClick={() => {
                const firstPending = assignments.find((a) => !a.studentSubmission);
                if (firstPending) setSubmittingAssignment(firstPending);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 transition-colors"
            >
              Làm bài ngay
            </button>
          </div>
        )}
      </div>

      {/* Today's Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Nhiệm Vụ Cần Làm</h3>
          </div>
          <button
            onClick={() => onNavigate('assignments')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            Tất cả bài tập <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Priority Assignment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayAssignments.length === 0 ? (
            <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-base font-bold text-white">Hôm nay không còn bài tập tồn đọng!</p>
              <p className="text-xs text-slate-500 mt-1">
                Em đã hoàn thành tốt các bài tập được giao. Hãy nghỉ ngơi hoặc xem lại bài cũ.
              </p>
            </div>
          ) : (
            todayAssignments.map((assignment) => {
              const hasSub = !!assignment.studentSubmission;
              const sub = assignment.studentSubmission;
              const isLate = new Date() > new Date(assignment.dueAt);

              return (
                <div
                  key={assignment.id}
                  className={`rounded-3xl border p-5 shadow-lg flex flex-col justify-between transition-all ${
                    hasSub
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/40 ring-1 ring-amber-500/20'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 font-bold text-xs uppercase tracking-wide border border-amber-500/20">
                          {assignment.subject}
                        </span>
                        {assignment.difficultyLevel === 'basic' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Cơ bản
                          </span>
                        )}
                        {assignment.difficultyLevel === 'advanced' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Vận dụng cao
                          </span>
                        )}
                        {assignment.difficultyLevel === 'specialized' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Bổ trợ riêng
                          </span>
                        )}
                        {(!assignment.difficultyLevel || assignment.difficultyLevel === 'standard') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Vận dụng
                          </span>
                        )}
                      </div>
                      {assignment.streakRequired && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                          <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                          Giữ Chuỗi
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white line-clamp-2">
                      {assignment.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                      {assignment.content || 'Xem đề bài chi tiết và tài liệu trực tiếp trong phòng thi.'}
                    </p>

                    {/* Teacher's attached files indicator */}
                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>Đính kèm {assignment.attachments.length} tài liệu / ảnh đề bài</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Hạn nộp:
                      </span>
                      <span
                        className={`font-semibold ${
                          isLate && !hasSub ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {new Date(assignment.dueAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Feedback if already graded */}
                    {sub?.status === 'graded' && sub.feedback && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span>Điểm Giáo viên chấm:</span>
                          <span className="text-emerald-300 text-sm">
                            {sub.feedback.score} / 10 Điểm
                          </span>
                        </div>
                        {sub.feedback.comment && (
                          <p className="text-[11px] text-slate-300 mt-1 italic">
                            &ldquo;{sub.feedback.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Big Action Button */}
                    <button
                      onClick={() => setSubmittingAssignment(assignment)}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-xl flex items-center justify-center gap-2 ${
                        hasSub
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white animate-pulse'
                      }`}
                    >
                      {hasSub ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Mở Phòng Thi / Nộp Bổ Sung
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4 fill-white" />
                          Vào Phòng Thi Toàn Màn Hình &amp; Nộp Bài 🔥
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Calendar History Quick Link Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Xem Lịch Sử Học Tập Theo Lịch Tháng</h4>
            <p className="text-xs text-slate-400">
              Bấm vào từng ngày để xem lại đề bài, ảnh chụp vở đã nộp và lời nhận xét của Thầy Quang Hưng.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('calendar')}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
        >
          Mở Lịch Streak <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Submission Modal */}
      {submittingAssignment && (
        <StudentSubmissionModal
          assignment={submittingAssignment}
          isOpen={!!submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSubmitted={() => loadStudentData()}
        />
      )}
    </div>
  );
};
