import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  ShieldAlert,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import type { CalendarDayDetail, StreakStats, UserProfile } from '../types/index';
import { FlameStreakBadge } from './FlameStreakBadge';

const VIETNAMESE_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const CalendarHistory: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const isTeacher = user?.role === 'teacher';

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12

  // For teacher view: select which student to inspect
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    user?.role === 'student' ? user.id : 'student-an'
  );

  const [calendarDetails, setCalendarDetails] = useState<CalendarDayDetail[]>([]);
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected day popup or detail
  const [selectedDay, setSelectedDay] = useState<CalendarDayDetail | null>(null);

  // Exception modal state for teacher
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('Nghỉ ốm có giấy phép của phụ huynh');

  useEffect(() => {
    if (isTeacher) {
      api.getStudents().then((res) => {
        setStudents(res);
        if (res.length > 0 && !res.find((s) => s.id === selectedStudentId)) {
          setSelectedStudentId(res[0].id);
        }
      });
    }
  }, [isTeacher]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const data = await api.getCalendar(currentYear, currentMonth, selectedStudentId);
      setCalendarDetails(data.details);
      setStreakStats(data.stats);

      // Default select today if available
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      const foundToday = data.details.find((d) => d.date === todayStr);
      if (foundToday) {
        setSelectedDay(foundToday);
      } else if (data.details.length > 0) {
        setSelectedDay(data.details[data.details.length - 1]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [currentYear, currentMonth, selectedStudentId]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGrantException = async () => {
    if (!selectedDay) return;
    try {
      const updated = await api.grantStreakException(
        selectedStudentId,
        selectedDay.date,
        exceptionReason
      );
      setStreakStats(updated);
      showToast('Cấp ngoại lệ thành công', `Đã cấp điểm chuỗi ngày ${selectedDay.date}`, 'success');
      setShowExceptionModal(false);
      loadCalendar();
    } catch (err: any) {
      showToast('Lỗi', err.message || 'Không thể cấp ngoại lệ', 'warning');
    }
  };

  // Build grid layout: first day of month (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = (firstDayOfMonth + 6) % 7;

  const currentStudentObj = isTeacher
    ? students.find((s) => s.id === selectedStudentId)
    : user;

  return (
    <div className="space-y-6">
      {/* Top Banner & Streak Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Múi giờ Asia/Ho_Chi_Minh (UTC+7)
              </span>
              {isTeacher && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300">
                  Góc nhìn Giáo viên
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Lịch Sử Học Tập &amp; Chuỗi Ngày (Streak) 🔥
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isTeacher
                ? `Đang xem tiến độ của học sinh ${currentStudentObj?.displayName || ''} (${currentStudentObj?.studentCode || ''})`
                : 'Mỗi ngày làm một bài tập để thắp sáng ngọn lửa tri thức và giữ vững chuỗi!'}
            </p>
          </div>

          {/* Student Selector for Teacher */}
          {isTeacher && students.length > 0 && (
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-700/80 flex items-center gap-3">
              <label className="text-xs font-bold text-slate-300 whitespace-nowrap">
                Xem học sinh:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} ({s.studentCode} - {s.className || '12A1'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Streak Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Chuỗi hiện tại</span>
              <div className="flex items-center justify-center gap-1 text-2xl font-extrabold text-orange-400 mt-1">
                <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
                {streakStats?.currentStreak || 0}
              </div>
              <span className="text-[10px] text-slate-500">ngày liên tiếp</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Kỷ lục dài nhất</span>
              <div className="text-2xl font-extrabold text-amber-300 mt-1">
                {streakStats?.longestStreak || 0}
              </div>
              <span className="text-[10px] text-slate-500">ngày cao nhất</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng ngày học</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {streakStats?.totalCompletedDays || 0}
              </div>
              <span className="text-[10px] text-slate-500">ngày nộp bài</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ngày bỏ bài</span>
              <div className="text-2xl font-extrabold text-rose-400 mt-1">
                {streakStats?.missedDays || 0}
              </div>
              <span className="text-[10px] text-slate-500">bỏ lỡ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Selected Day Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">
                Tháng {currentMonth} / {currentYear}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                aria-label="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                aria-label="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {VIETNAMESE_DAYS.map((d) => (
              <div key={d} className="text-xs font-bold text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank cells before start of month */}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-14 sm:h-16 rounded-xl bg-slate-950/30 opacity-20" />
            ))}

            {/* Days in Month */}
            {calendarDetails.map((day) => {
              const dayNum = parseInt(day.date.split('-')[2]);
              const isSelected = selectedDay?.date === day.date;
              const hasAssignments = day.assignments.length > 0;

              let statusStyle = 'border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-300';
              let badge = null;

              if (day.status === 'completed') {
                statusStyle =
                  'border-emerald-500/40 bg-emerald-950/30 text-emerald-200 hover:border-emerald-400';
                badge = <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />;
              } else if (day.status === 'missed') {
                statusStyle =
                  'border-rose-500/40 bg-rose-950/30 text-rose-200 hover:border-rose-400';
                badge = <XCircle className="w-3 h-3 text-rose-400" />;
              } else if (day.status === 'pending') {
                statusStyle =
                  'border-amber-500/50 bg-amber-950/40 text-amber-200 animate-pulse hover:border-amber-400';
                badge = <Clock className="w-3 h-3 text-amber-400" />;
              }

              if (isSelected) {
                statusStyle += ' ring-2 ring-amber-500 shadow-md';
              }

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  className={`relative h-14 sm:h-16 p-1.5 sm:p-2 rounded-2xl border flex flex-col justify-between transition-all text-left ${statusStyle}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">{dayNum}</span>
                    {badge}
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    {hasAssignments ? (
                      <span className="px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-300 font-semibold truncate">
                        {day.assignments.length} bài
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[9px]">Nghỉ</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend Guide */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span>Đã hoàn thành (Giữ chuỗi)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span>Bỏ bài (Đứt chuỗi)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span>Đang chờ nộp hôm nay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
              <span>Ngày nghỉ / Không có bài</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400">Chi tiết ngày học</span>
              <h4 className="text-base font-bold text-white">
                {selectedDay
                  ? new Date(selectedDay.date + 'T00:00:00+07:00').toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Chọn một ngày trên lịch'}
              </h4>
            </div>

            {selectedDay && (
              <div className="text-right">
                {selectedDay.status === 'completed' && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                  </span>
                )}
                {selectedDay.status === 'missed' && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Bỏ bài
                  </span>
                )}
                {selectedDay.status === 'rest' && (
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium">
                    Ngày nghỉ
                  </span>
                )}
                {selectedDay.status === 'pending' && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Chờ nộp
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Assignments list on this day */}
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[460px]">
            {!selectedDay || selectedDay.assignments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                <p>Ngày này không có bài tập bắt buộc nào.</p>
                <p className="text-xs text-slate-500 mt-1">Chuỗi học tập không bị ảnh hưởng vào ngày nghỉ.</p>
              </div>
            ) : (
              selectedDay.assignments.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        {item.subject}
                      </span>
                      <h5 className="text-sm font-bold text-white">{item.title}</h5>
                    </div>
                    {item.streakRequired && (
                      <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-500/20 shrink-0">
                        🔥 Streak
                      </span>
                    )}
                  </div>

                  {/* Submission status for this student */}
                  {item.submission ? (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">
                          Đã nộp:{' '}
                          <strong className="text-slate-200">
                            {new Date(item.submission.submittedAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </strong>
                        </span>
                        {item.submission.isLate ? (
                          <span className="text-amber-400 font-bold">Nộp muộn</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Đúng hạn</span>
                        )}
                      </div>

                      {/* Student's answer snippet */}
                      {item.submission.textAnswer && (
                        <p className="text-slate-300 text-xs italic bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                          &ldquo;{item.submission.textAnswer}&rdquo;
                        </p>
                      )}

                      {/* Student's attachments */}
                      {item.submission.attachments && item.submission.attachments.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                          <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                          <span>Đính kèm {item.submission.attachments.length} tệp bài làm</span>
                        </div>
                      )}

                      {/* Feedback if graded */}
                      {item.submission.feedback && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                          <div className="flex items-center justify-between font-bold">
                            <span>Điểm số Thầy chấm:</span>
                            <span className="text-emerald-300">
                              {item.submission.feedback.score} / 10
                            </span>
                          </div>
                          {item.submission.feedback.comment && (
                            <p className="text-slate-300 text-[11px] mt-1">
                              &ldquo;{item.submission.feedback.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
                      <span>Học sinh chưa nộp bài này</span>
                      <span className="font-bold">Chưa nộp</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Teacher Exception Action */}
          {isTeacher && selectedDay && (
            <div className="pt-4 border-t border-slate-800 mt-auto">
              <button
                type="button"
                onClick={() => setShowExceptionModal(true)}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Cấp Ngoại Lệ Chuỗi (Nghỉ ốm / Miễn bài có phép)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Teacher Streak Exception Modal */}
      {showExceptionModal && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              Cấp Ngoại Lệ Chuỗi Ngày {selectedDay.date}
            </h4>
            <p className="text-xs text-slate-300">
              Thao tác này cho phép duy trì chuỗi học tập cho học sinh{' '}
              <strong>{currentStudentObj?.displayName}</strong> trong trường hợp nghỉ ốm, có lý do chính
              đáng. Thao tác sẽ được ghi vào nhật ký hệ thống (Audit Log).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lý do cấp ngoại lệ:
              </label>
              <textarea
                rows={3}
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
                placeholder="Nhập lý do ngoại lệ..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExceptionModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleGrantException}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Xác Nhận Cấp Ngoại Lệ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
