import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Flame,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Trash2,
  Send,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  Sparkles,
  BookOpen,
  Layers,
  Tag,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import type { Assignment, AttachedFile, Submission } from '../types/index';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface StudentSubmissionModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (submission: Submission) => void;
}

export const StudentSubmissionModal: React.FC<StudentSubmissionModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { updateStreak } = useAuth();
  const { showToast } = useNotifications();

  const existingSub = assignment.studentSubmission;

  const [textAnswer, setTextAnswer] = useState(existingSub?.textAnswer || '');
  const [attachments, setAttachments] = useState<AttachedFile[]>(existingSub?.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active attached document tab for viewing
  const teacherAttachments = assignment.attachments || [];
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  // Mobile active tab ('prompt' or 'workspace')
  const [activeMobileTab, setActiveMobileTab] = useState<'prompt' | 'workspace'>('prompt');

  // Previewing student's uploaded solution photo
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    setImageZoom(1);
    setImageRotation(0);
  }, [selectedFileIndex]);

  if (!isOpen) return null;

  const activeTeacherFile = teacherAttachments[selectedFileIndex];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const fileArray = Array.from(files);
      const uploaded = await api.uploadFiles(fileArray);
      setAttachments((prev) => [...prev, ...uploaded]);
      showToast('Đã tải ảnh/tệp lên', `Đã đính kèm ${uploaded.length} ảnh/tệp bài giải`, 'success');
      // If student is on mobile, switch to workspace so they see their uploaded photo
      setActiveMobileTab('workspace');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải tệp');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSafeClose = () => {
    const hasUnsavedWork = textAnswer.trim() !== (existingSub?.textAnswer || '') ||
      attachments.length !== (existingSub?.attachments?.length || 0);

    if (hasUnsavedWork) {
      if (!window.confirm('Bạn có nội dung bài làm chưa nộp. Bạn có chắc chắn muốn thoát khỏi phòng thi?')) {
        return;
      }
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textAnswer.trim() && attachments.length === 0) {
      setError('Vui lòng nhập câu trả lời hoặc tải ảnh chụp bài giải/tệp làm bài của em.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.submitAssignment(assignment.id, textAnswer.trim(), attachments);
      updateStreak(res.streak);

      // Trigger celebration confetti
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#eab308', '#22c55e', '#3b82f6'],
      });

      showToast(
        res.isLate ? 'Đã nộp bài (Nộp muộn)' : 'Đã nộp bài thành công! 🔥',
        res.message,
        res.isLate ? 'warning' : 'success'
      );

      onSubmitted(res.submission);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  const isLateNow = new Date() > new Date(assignment.dueAt);

  const getDifficultyBadge = () => {
    switch (assignment.difficultyLevel) {
      case 'basic':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Cơ bản
          </span>
        );
      case 'advanced':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Vận dụng cao
          </span>
        );
      case 'specialized':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Bổ trợ cá nhân hóa
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Vận dụng
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-slate-100 animate-fade-in overflow-hidden select-text">
      {/* 1. TOP BAR: EXAM & FOCUS HEADER */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3 truncate">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-md shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            </div>
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {assignment.subject}
              </span>
              {getDifficultyBadge()}
              {assignment.categoryTag && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  #{assignment.categoryTag}
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate leading-tight">
              {assignment.title}
            </h1>
          </div>
        </div>

        {/* Center: Exam status and deadline */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-950/80 px-4 py-1.5 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Hạn nộp:</span>
            <strong className={isLateNow ? 'text-rose-400' : 'text-emerald-400'}>
              {new Date(assignment.dueAt).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
              })}
            </strong>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-orange-400 font-bold">
            <Flame className="w-4 h-4 fill-orange-500" />
            <span>Giữ chuỗi 24h</span>
          </div>
        </div>

        {/* Right: Exit full-screen exam mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSafeClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
            title="Thoát chế độ làm bài"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Thoát phòng thi</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="flex sm:hidden bg-slate-900 border-b border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveMobileTab('prompt')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeMobileTab === 'prompt'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📖 1. Đề Bài &amp; Tài Liệu
        </button>
        <button
          onClick={() => setActiveMobileTab('workspace')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeMobileTab === 'workspace'
              ? 'border-amber-500 text-amber-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ✏️ 2. Không Gian Nộp Bài
        </button>
      </div>

      {/* 2. MAIN BODY: TWO-PANE EXAM ENVIRONMENT */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative">
        {/* LEFT PANE: BUILT-IN DOCUMENT & PROBLEM VIEWER (55% width) */}
        <section
          className={`w-full sm:w-[55%] flex flex-col border-r border-slate-800 bg-slate-950 overflow-hidden ${
            activeMobileTab === 'prompt' ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {/* Header of Left Pane */}
          <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Đề Bài &amp; Tài Liệu Học Tập Trực Quan
              </span>
            </div>

            {/* Document Switcher tabs */}
            {teacherAttachments.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-[260px] no-scrollbar">
                {teacherAttachments.map((file, idx) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all truncate max-w-[120px] ${
                      selectedFileIndex === idx
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                    title={file.fileName}
                  >
                    {idx + 1}. {file.fileName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Left Pane Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Written Question Content */}
            {assignment.content ? (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nội dung câu hỏi / Hướng dẫn của Thầy:
                </span>
                <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {assignment.content}
                </div>
              </div>
            ) : null}

            {/* Interactive Document / Image Viewer */}
            {teacherAttachments.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    {activeTeacherFile?.mimeType.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-sky-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-amber-400" />
                    )}
                    {activeTeacherFile?.fileName}
                  </span>

                  {/* Image Controls: Zoom In / Zoom Out / Rotate */}
                  {activeTeacherFile?.mimeType.startsWith('image/') && (
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-slate-400">
                      <button
                        onClick={() => setImageZoom((z) => Math.max(0.6, z - 0.2))}
                        className="p-1 hover:text-white rounded"
                        title="Thu nhỏ"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] px-1 font-mono">{Math.round(imageZoom * 100)}%</span>
                      <button
                        onClick={() => setImageZoom((z) => Math.min(3, z + 0.2))}
                        className="p-1 hover:text-white rounded"
                        title="Phóng to"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setImageRotation((r) => (r + 90) % 360)}
                        className="p-1 hover:text-white rounded"
                        title="Xoay ảnh"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <a
                    href={activeTeacherFile?.url}
                    download={activeTeacherFile?.fileName}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải về
                  </a>
                </div>

                {/* The Embedded Viewer Display */}
                <div className="relative rounded-2xl bg-slate-900/60 border border-slate-800 p-2 overflow-auto min-h-[420px] max-h-[650px] flex items-center justify-center">
                  {activeTeacherFile?.mimeType.startsWith('image/') ? (
                    <div className="overflow-auto max-h-[600px] w-full flex items-center justify-center p-2">
                      <img
                        src={activeTeacherFile.url}
                        alt={activeTeacherFile.fileName}
                        style={{
                          transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                          transition: 'transform 0.15s ease-out',
                        }}
                        className="max-w-full max-h-[580px] object-contain rounded-xl shadow-xl select-none"
                      />
                    </div>
                  ) : activeTeacherFile?.mimeType === 'application/pdf' ? (
                    <iframe
                      src={activeTeacherFile.url}
                      title={activeTeacherFile.fileName}
                      className="w-full h-[580px] rounded-xl border border-slate-800 bg-white"
                    />
                  ) : (
                    /* Other Document preview card */
                    <div className="text-center p-8 space-y-3">
                      <FileText className="w-16 h-16 text-amber-400 mx-auto opacity-70" />
                      <p className="text-sm font-semibold text-slate-200">
                        {activeTeacherFile?.fileName}
                      </p>
                      <p className="text-xs text-slate-400">
                        Tệp tài liệu đính kèm ({Math.round((activeTeacherFile?.fileSize || 0) / 1024)} KB)
                      </p>
                      <a
                        href={activeTeacherFile?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        Mở / Tải Về Xem Chi Tiết
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : !assignment.content ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Không có tài liệu đính kèm cho bài tập này.
              </div>
            ) : null}
          </div>
        </section>

        {/* RIGHT PANE: STUDENT SUBMISSION WORKSPACE (45% width) */}
        <section
          className={`w-full sm:w-[45%] flex flex-col bg-slate-900/50 overflow-hidden ${
            activeMobileTab === 'workspace' ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {/* Header of Workspace */}
          <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Không Gian Làm Bài Của Học Sinh
              </span>
            </div>
            {existingSub && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                Đã nộp trước đó
              </span>
            )}
          </div>

          {/* Teacher Feedback Alert if already graded */}
          {existingSub?.feedback && (
            <div className="mx-5 mt-4 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs space-y-1.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Đã được Giáo viên chấm điểm
                </span>
                <span className="text-base font-extrabold px-3 py-0.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  {existingSub.feedback.score} / 10 Điểm
                </span>
              </div>
              <p className="text-slate-200 text-xs italic bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/20">
                &ldquo;{existingSub.feedback.comment}&rdquo;
              </p>
            </div>
          )}

          {/* Form Scroll Area */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Text answer input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>1. Câu trả lời / Bài giải văn bản:</span>
                  <span className="text-[11px] font-normal text-slate-400 font-mono">
                    {textAnswer.trim().split(/\s+/).filter(Boolean).length} từ
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Nhập lời giải chi tiết, kết quả các câu hoặc tóm tắt cách làm của em vào đây..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-slate-600 leading-relaxed font-sans"
                />
              </div>

              {/* Upload Handwritten Notebook Solution Photos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    2. Chụp ảnh vở làm bài / Tải ảnh bài giải:
                  </label>
                  <span className="text-[11px] text-amber-400">
                    {attachments.length} ảnh/tệp đã tải
                  </span>
                </div>

                {/* Upload dropzone */}
                <div className="border border-dashed border-slate-700 hover:border-orange-500/60 bg-slate-950/60 rounded-2xl p-4 text-center transition-colors">
                  <input
                    type="file"
                    id="student-exam-files"
                    multiple
                    accept="image/*,application/pdf,.docx,.doc"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="student-exam-files"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Đang tải ảnh...' : 'Chụp ảnh vở hoặc chọn ảnh từ máy'}
                  </label>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Có thể chụp nhiều trang vở bài làm (Trang 1, Trang 2...). Hệ thống tự lưu chất lượng cao.
                  </p>
                </div>

                {/* Uploaded Photos Gallery */}
                {attachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {attachments.map((file, idx) => (
                      <div
                        key={file.id}
                        className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
                      >
                        {file.mimeType.startsWith('image/') ? (
                          <div
                            onClick={() => setPreviewPhoto(file.url)}
                            className="aspect-video w-full bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center relative"
                          >
                            <img
                              src={file.url}
                              alt={file.fileName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video w-full bg-slate-900 flex flex-col items-center justify-center p-2 text-center">
                            <FileText className="w-6 h-6 text-amber-400 mb-1" />
                            <span className="text-[10px] text-slate-300 truncate max-w-[90%]">
                              {file.fileName}
                            </span>
                          </div>
                        )}

                        <div className="p-2 flex items-center justify-between text-[11px] bg-slate-950">
                          <span className="font-semibold text-slate-300 truncate">
                            Trang {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(file.id)}
                            className="text-slate-400 hover:text-red-400 p-1"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Submission Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-xs text-slate-300 hidden sm:inline">
                  Nộp bài trước hạn để duy trì chuỗi học tập hàng ngày!
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSafeClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Để sau
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white font-extrabold rounded-xl shadow-xl transition-all text-xs disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting
                    ? 'Đang gửi bài...'
                    : existingSub
                    ? 'Nộp Lại Bài & Lưu Chuỗi 🔥'
                    : 'Nộp Bài Thi & Giữ Chuỗi 🔥'}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* Full-Screen Lightbox for Uploaded Photo Preview */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-400 text-sm font-bold flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Đóng ảnh
            </button>
            <img
              src={previewPhoto}
              alt="Ảnh phóng to"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};
