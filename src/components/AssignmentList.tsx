import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Flame,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Edit2,
  Trash2,
  Users,
  Eye,
  Award,
  Layers,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import type { Assignment, Submission, UserProfile } from '../types/index';
import { AssignmentFormModal } from './AssignmentFormModal';
import { StudentSubmissionModal } from './StudentSubmissionModal';
import { GradingModal } from './GradingModal';

interface AssignmentListProps {
  onSelectAssignment?: (assignment: Assignment) => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const isTeacher = user?.role === 'teacher';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Deletion Confirmation Modal
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Student doing homework in Fullscreen Exam Room
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);

  // Teacher grading
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

  // Teacher viewing assignment submissions modal
  const [viewingAssignmentId, setViewingAssignmentId] = useState<string | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Submission[]>([]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const list = await api.getAssignments();
      setAssignments(list);
    } catch (err: any) {
      showToast('Lỗi', err.message || 'Không thể tải danh sách bài tập', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
    if (isTeacher) {
      api.getStudents().then((res) => setStudents(res)).catch(() => {});
    }
  }, [user]);

  const handleDuplicate = async (id: string) => {
    try {
      const cloned = await api.duplicateAssignment(id);
      showToast('Nhân bản thành công', `Đã tạo bản sao: ${cloned.title}`, 'success');
      loadAssignments();
    } catch (err: any) {
      showToast('Lỗi', err.message, 'warning');
    }
  };

  const confirmDeleteAssignment = async () => {
    if (!deletingAssignment) return;
    setDeleting(true);
    try {
      await api.deleteAssignment(deletingAssignment.id);
      showToast('Đã xóa vĩnh viễn', `Bài tập "${deletingAssignment.title}" đã được xóa`, 'success');
      setDeletingAssignment(null);
      loadAssignments();
    } catch (err: any) {
      showToast('Lỗi khi xóa bài tập', err.message, 'warning');
    } finally {
      setDeleting(false);
    }
  };

  const openSubmissionsView = async (assign: Assignment) => {
    setViewingAssignmentId(assign.id);
    try {
      const res = await api.getAssignment(assign.id);
      setAssignmentSubmissions(res.submissions || []);
    } catch (err: any) {
      showToast('Lỗi', err.message, 'warning');
    }
  };

  const filtered = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.categoryTag && a.categoryTag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSubject = subjectFilter === 'ALL' || a.subject === subjectFilter;
    const matchDifficulty =
      difficultyFilter === 'ALL' || a.difficultyLevel === difficultyFilter;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'streak' && a.streakRequired) ||
      (statusFilter === 'submitted' && a.studentSubmission) ||
      (statusFilter === 'pending' && !a.studentSubmission);
    return matchSearch && matchSubject && matchDifficulty && matchStatus;
  });

  const uniqueSubjects = Array.from(new Set(assignments.map((a) => a.subject)));

  const renderDifficultyBadge = (level?: string) => {
    switch (level) {
      case 'basic':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Cơ bản
          </span>
        );
      case 'advanced':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Vận dụng cao
          </span>
        );
      case 'specialized':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Bổ trợ cá nhân
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            Vận dụng
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1.5 inline-block">
            {isTeacher ? 'Finn &bull; Quản Trị Giảng Dạy' : 'Finn &bull; Nhiệm Vụ Học Tập'}
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Danh Sách Bài Tập</h2>
          <p className="text-xs text-slate-400 mt-1">
            {isTeacher
              ? 'Tạo đề bài phân hóa năng lực, chỉnh sửa, xóa bài tập vĩnh viễn và theo dõi nộp bài'
              : 'Xem bài tập được giao, mở phòng thi toàn màn hình trực quan và nộp bài giữ chuỗi'}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl shadow-lg transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            Giao Bài Mới Phân Loại
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bài, môn, tag..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
          >
            <option value="ALL">Tất cả môn học</option>
            {uniqueSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="basic">Cơ bản</option>
            <option value="standard">Vận dụng</option>
            <option value="advanced">Vận dụng cao</option>
            <option value="specialized">Bổ trợ cá nhân</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="streak">Bắt buộc Streak 🔥</option>
            {!isTeacher && <option value="submitted">Đã nộp bài</option>}
            {!isTeacher && <option value="pending">Chưa làm</option>}
          </select>
        </div>
      </div>

      {/* Assignment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Đang tải danh sách bài tập...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Không tìm thấy bài tập phù hợp</p>
            <p className="text-xs text-slate-500 mt-1">
              Thử thay đổi bộ lọc tìm kiếm hoặc tạo bài tập mới
            </p>
          </div>
        ) : (
          filtered.map((assignment) => {
            const isLate = new Date() > new Date(assignment.dueAt);
            const sub = assignment.studentSubmission;
            const hasSub = !!sub;

            return (
              <div
                key={assignment.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider">
                        {assignment.subject}
                      </span>
                      {renderDifficultyBadge(assignment.difficultyLevel)}
                    </div>

                    {assignment.streakRequired ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[11px] font-extrabold">
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        Streak 🔥
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Tự chọn</span>
                    )}
                  </div>

                  {/* Category tag & Target info */}
                  <div className="flex flex-wrap items-center gap-1 mb-2">
                    {assignment.categoryTag && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        #{assignment.categoryTag}
                      </span>
                    )}
                    {assignment.targetType === 'specific' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        🎯 Cá nhân hóa ({assignment.targetStudentIds?.length || 0} HS)
                      </span>
                    )}
                    {assignment.targetType === 'class' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        Lớp {assignment.targetClass}
                      </span>
                    )}
                  </div>

                  {/* Title & Content */}
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {assignment.content || 'Đề bài và hướng dẫn chi tiết nằm trong tệp đính kèm.'}
                  </p>

                  {/* Attachments preview */}
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>{assignment.attachments.length} tài liệu / ảnh đính kèm</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                  {/* Deadline info */}
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

                  {/* Status / Teacher Stats */}
                  {isTeacher ? (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400">
                        Bài nộp:{' '}
                        <strong className="text-amber-400">
                          {assignment.submissionCount || 0}
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        Đã chấm:{' '}
                        <strong className="text-emerald-400">
                          {assignment.gradedCount || 0}
                        </strong>
                      </span>
                    </div>
                  ) : (
                    <div className="pt-1">
                      {hasSub ? (
                        sub?.status === 'graded' ? (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs">
                            <span className="flex items-center gap-1 font-bold text-emerald-300">
                              <CheckCircle2 className="w-4 h-4" /> Đã có điểm:
                            </span>
                            <span className="font-extrabold text-sm text-emerald-300">
                              {sub.feedback?.score}/10
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs">
                            <span className="flex items-center gap-1 font-semibold">
                              <Clock className="w-4 h-4" /> Đã nộp bài
                            </span>
                            <span className="text-[11px] opacity-80">Chờ Giáo viên chấm</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                          <span>Chưa nộp bài</span>
                          {isLate ? (
                            <span className="text-rose-400 font-bold">Đã quá hạn</span>
                          ) : (
                            <span className="text-amber-400 font-bold">Còn hạn nộp</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {isTeacher ? (
                      <>
                        <button
                          onClick={() => openSubmissionsView(assignment)}
                          className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem Bài Nộp ({assignment.submissionCount || 0})
                        </button>
                        <button
                          onClick={() => setEditingAssignment(assignment)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                          title="Sửa bài tập"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(assignment.id)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                          title="Nhân bản"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {/* Permanently delete assignment */}
                        <button
                          onClick={() => setDeletingAssignment(assignment)}
                          className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                          title="Xóa vĩnh viễn bài tập"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setSubmittingAssignment(assignment)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                          hasSub
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white'
                        }`}
                      >
                        <Flame className="w-4 h-4 fill-current" />
                        {hasSub ? 'Xem Lại / Mở Phòng Thi' : 'Vào Phòng Thi & Nộp Bài 🔥'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Assignment Confirmation Modal */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-100">
            <div className="p-3 w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mx-auto flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>

            <h3 className="text-lg font-bold text-white text-center">Xóa Vĩnh Viễn Bài Tập</h3>
            <p className="text-xs text-slate-400 text-center mt-2 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài tập{' '}
              <strong className="text-rose-300">&ldquo;{deletingAssignment.title}&rdquo;</strong>?
              Toàn bộ bài nộp và điểm số liên quan của học sinh sẽ bị xóa khỏi hệ thống và không thể khôi phục.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingAssignment(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteAssignment}
                disabled={deleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Đang xóa...' : 'Xác Nhận Xóa Vĩnh Viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(createModalOpen || editingAssignment) && (
        <AssignmentFormModal
          isOpen={createModalOpen || !!editingAssignment}
          onClose={() => {
            setCreateModalOpen(false);
            setEditingAssignment(null);
          }}
          onSaved={() => loadAssignments()}
          initialAssignment={editingAssignment}
          studentsList={students}
        />
      )}

      {/* Student Submission in Fullscreen Exam Mode */}
      {submittingAssignment && (
        <StudentSubmissionModal
          assignment={submittingAssignment}
          isOpen={!!submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSubmitted={() => loadAssignments()}
        />
      )}

      {/* Teacher Submissions Grading Modal */}
      {viewingAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-8">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Bài Nộp Của Học Sinh</h3>
                <p className="text-xs text-slate-400">Danh sách các em đã gửi bài giải</p>
              </div>
              <button
                onClick={() => setViewingAssignmentId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
              {assignmentSubmissions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Chưa có học sinh nào nộp bài tập này.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignmentSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            {sub.studentName}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({sub.studentCode} - Lớp {sub.className})
                          </span>
                          {sub.isLate && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300">
                              Nộp muộn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                        </p>
                        {sub.attachments && sub.attachments.length > 0 && (
                          <div className="flex items-center gap-2 pt-1 text-xs text-amber-400">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{sub.attachments.length} tệp bài làm đính kèm</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {sub.status === 'graded' ? (
                          <div className="text-right">
                            <span className="text-xs text-emerald-400 font-bold block">
                              Đã chấm: {sub.feedback?.score}/10
                            </span>
                            <button
                              onClick={() => setGradingSubmission(sub)}
                              className="text-[11px] text-amber-400 hover:underline"
                            >
                              Sửa điểm
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setGradingSubmission(sub)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md"
                          >
                            Chấm Điểm &amp; Nhận Xét
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Grading Modal */}
      {gradingSubmission && (
        <GradingModal
          submission={gradingSubmission}
          isOpen={!!gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          onGraded={() => {
            setGradingSubmission(null);
            if (viewingAssignmentId) {
              api.getAssignment(viewingAssignmentId).then((res) => {
                setAssignmentSubmissions(res.submissions || []);
              });
            }
            loadAssignments();
          }}
        />
      )}
    </div>
  );
};
