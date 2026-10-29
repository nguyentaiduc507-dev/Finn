import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Flame,
  Calendar,
  Clock,
  Sparkles,
  Trash2,
  AlertCircle,
  Tag,
  Check,
  Search,
  Layers,
} from 'lucide-react';
import type { Assignment, AttachedFile, UserProfile } from '../types/index';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (assignment: Assignment) => void;
  initialAssignment?: Assignment | null;
  studentsList?: UserProfile[];
}

const COMMON_SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'Tin học',
];

const DIFFICULTY_OPTIONS: Array<{
  value: 'basic' | 'standard' | 'advanced' | 'specialized';
  label: string;
  badge: string;
  desc: string;
}> = [
  {
    value: 'basic',
    label: 'Cơ bản',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    desc: 'Củng cố nền tảng, chống mất gốc',
  },
  {
    value: 'standard',
    label: 'Vận dụng',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    desc: 'Mức chuẩn theo chương trình bài học',
  },
  {
    value: 'advanced',
    label: 'Vận dụng cao',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    desc: 'Phân hóa điểm 9-10 & luyện thi HSG',
  },
  {
    value: 'specialized',
    label: 'Bổ trợ cá nhân hóa',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    desc: 'Giao kèm riêng theo nhu cầu từng em',
  },
];

const QUICK_TAGS = [
  'Hình học không gian',
  'Đại số & Giải tích',
  'Từ vựng & Ngữ pháp',
  'Luyện đề thi THPT',
  'Bồi dưỡng HSG',
  'Kèm riêng cá nhân',
];

export const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialAssignment,
  studentsList: initialStudents = [],
}) => {
  const { showToast } = useNotifications();

  // Vietnam today string for default deadline
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
  const defaultDue = initialAssignment?.dueAt
    ? initialAssignment.dueAt.substring(0, 16)
    : `${todayStr}T23:59`;

  const [title, setTitle] = useState(initialAssignment?.title || '');
  const [subject, setSubject] = useState(initialAssignment?.subject || 'Toán học');
  const [content, setContent] = useState(initialAssignment?.content || '');
  const [dueAt, setDueAt] = useState(defaultDue);
  const [streakRequired, setStreakRequired] = useState(initialAssignment?.streakRequired ?? true);

  // Differentiated assignment fields
  const [difficultyLevel, setDifficultyLevel] = useState<
    'basic' | 'standard' | 'advanced' | 'specialized'
  >(initialAssignment?.difficultyLevel || 'standard');
  const [categoryTag, setCategoryTag] = useState(initialAssignment?.categoryTag || '');

  // Target assignment
  const [targetType, setTargetType] = useState<'all' | 'class' | 'specific'>(
    initialAssignment?.targetType || 'all'
  );
  const [targetClass, setTargetClass] = useState(initialAssignment?.targetClass || '12A1');
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>(
    initialAssignment?.targetStudentIds || []
  );

  const [allowResubmit, setAllowResubmit] = useState(initialAssignment?.allowResubmit ?? true);
  const [status, setStatus] = useState<'published' | 'draft'>(
    initialAssignment?.status === 'draft' ? 'draft' : 'published'
  );

  const [attachments, setAttachments] = useState<AttachedFile[]>(
    initialAssignment?.attachments || []
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student directory for targeting
  const [students, setStudents] = useState<UserProfile[]>(initialStudents);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (students.length === 0) {
      api.getStudents()
        .then((res) => setStudents(res))
        .catch(() => {});
    }
  }, [students.length]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const fileArray = Array.from(files);
      const uploaded = await api.uploadFiles(fileArray);
      setAttachments((prev) => [...prev, ...uploaded]);
      showToast('Tải tệp thành công', `Đã đính kèm ${uploaded.length} tệp vào đề bài`, 'success');
    } catch (err: any) {
      setError(err.message || 'Không thể tải tệp lên');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleStudentSelection = (id: string) => {
    setTargetStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    setTargetStudentIds(students.map((s) => s.id));
  };

  const clearStudentSelection = () => {
    setTargetStudentIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề bài tập.');
      return;
    }

    if (targetType === 'specific' && targetStudentIds.length === 0) {
      setError('Vui lòng chọn ít nhất một học sinh cho bài tập cá nhân hóa.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: Partial<Assignment> = {
        title: title.trim(),
        subject: subject.trim(),
        content: content.trim(),
        dueAt: dueAt.includes('+') ? dueAt : `${dueAt}:00+07:00`,
        streakRequired,
        difficultyLevel,
        categoryTag: categoryTag.trim() || undefined,
        targetType,
        targetClass: targetType === 'class' ? targetClass : undefined,
        targetStudentIds: targetType === 'specific' ? targetStudentIds : undefined,
        allowResubmit,
        status,
        attachments,
      };

      let saved: Assignment;
      if (initialAssignment) {
        saved = await api.updateAssignment(initialAssignment.id, payload);
        showToast('Cập nhật bài tập', 'Đã lưu bài tập và tạo bản chụp lịch sử v' + saved.version, 'success');
      } else {
        saved = await api.createAssignment(payload);
        showToast('Tạo bài tập thành công', `Đã giao bài "${saved.title}" cho học sinh`, 'success');
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu bài tập');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.displayName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(studentSearch.toLowerCase())) ||
      (s.className && s.className.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialAssignment ? 'Chỉnh Sửa Bài Tập' : 'Giao Bài Tập & Phân Loại Học Sinh'}
              </h3>
              <p className="text-xs text-slate-400">
                Tạo đề bài, phân loại độ khó, cá nhân hóa cho từng học sinh và cấu hình giữ chuỗi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tiêu đề bài tập <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Luyện tập Thể tích khối lăng trụ &amp; Khoảng cách"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Môn học</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {COMMON_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Differentiated Classification: Difficulty Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Phân loại mức độ bài tập (Dành riêng theo năng lực)
              </span>
              <span className="text-[11px] text-slate-400">Chọn mức độ phù hợp</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = difficultyLevel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficultyLevel(opt.value)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${opt.badge}`}>
                        {opt.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Chủ đề bài học / Tag phân loại
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                placeholder="Ví dụ: Hình học không gian, Luyện đề thi, Kèm riêng..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCategoryTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
                    categoryTag === tag
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Content / Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Yêu cầu &amp; Hướng dẫn giải (Văn bản đề bài)
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung câu hỏi hoặc ghi chú học sinh làm bài ra giấy, chụp ảnh nộp lại..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
            />
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ảnh đề bài / Tệp tài liệu đính kèm (Ảnh chụp, PDF, Word)
            </label>
            <div className="border border-dashed border-slate-700 rounded-2xl p-4 bg-slate-950/40 text-center hover:border-slate-600 transition-colors">
              <input
                type="file"
                id="assignment-file-input"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="assignment-file-input"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                {uploading ? 'Đang tải tệp lên...' : 'Chọn ảnh đề bài hoặc tệp PDF/tài liệu'}
              </label>
              <p className="text-[11px] text-slate-500 mt-2">
                Học sinh sẽ được xem trực tiếp đề ảnh/PDF toàn màn hình mà không cần tải về máy
              </p>
            </div>

            {/* List attached files */}
            {attachments.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.mimeType.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="text-slate-200 truncate font-medium">{file.fileName}</span>
                      <span className="text-slate-500 text-[10px]">
                        ({Math.round(file.fileSize / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      className="text-slate-400 hover:text-red-400 p-1"
                      aria-label="Xóa tệp"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deadline & Streak toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Hạn nộp bài (Giờ Việt Nam)
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={streakRequired}
                  onChange={(e) => setStreakRequired(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded bg-slate-900 border-slate-700 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    Tính vào chuỗi học tập (Streak)
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Bắt buộc nộp trước 24h để duy trì chuỗi
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Recipients / Targeting */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Đối tượng học sinh nhận bài
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Tất cả học sinh</option>
                  <option value="class">Theo lớp học</option>
                  <option value="specific">Chỉ định từng học sinh (Cá nhân hóa)</option>
                </select>
              </div>

              {targetType === 'class' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Chọn Lớp</label>
                  <input
                    type="text"
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    placeholder="Ví dụ: 12A1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            {/* If targetType === 'specific': Detailed interactive checklist */}
            {targetType === 'specific' && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-400">
                    Đã chọn {targetStudentIds.length} / {students.length} học sinh
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllStudents}
                      className="text-amber-400 hover:underline text-[11px]"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={clearStudentSelection}
                      className="text-slate-400 hover:text-slate-200 text-[11px]"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Tìm theo tên học sinh, mã HS hoặc lớp..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {filteredStudents.map((st) => {
                    const isChecked = targetStudentIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleStudentSelection(st.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                              isChecked ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {st.displayName.charAt(0)}
                          </div>
                          <div className="truncate text-left">
                            <span className="text-xs font-semibold block truncate leading-tight">
                              {st.displayName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {st.studentCode} &bull; Lớp {st.className || '12A1'}
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 text-amber-600 rounded bg-slate-950 border-slate-700 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={allowResubmit}
                onChange={(e) => setAllowResubmit(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-amber-600 focus:ring-amber-500"
              />
              Cho phép học sinh nộp lại bài nếu cần sửa
            </label>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Trạng thái:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
              >
                <option value="published">Đăng ngay</option>
                <option value="draft">Lưu nháp</option>
              </select>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Đang lưu...' : initialAssignment ? 'Lưu Thay Đổi (Tạo Snapshot)' : 'Đăng Bài Tập Cho Học Sinh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
