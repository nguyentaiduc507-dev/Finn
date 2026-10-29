import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { Submission, Feedback } from '../types/index';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

interface GradingModalProps {
  submission: Submission;
  isOpen: boolean;
  onClose: () => void;
  onGraded: (feedback: Feedback, updatedSubmission: Submission) => void;
}

const QUICK_SCORES = [10, 9.5, 9.0, 8.5, 8.0, 7.5];

const QUICK_COMMENTS = [
  'Trình bày rất sạch sẽ, logic giải bài chặt chẽ và chính xác!',
  'Bài làm rất tốt! Cần lưu ý cẩn thận thêm ở bước kết luận.',
  'Đáng khen vì đã tự giác nộp bài đúng hạn! Tiếp tục giữ vững chuỗi nhé!',
  'Cách giải sáng tạo và thông minh, Thầy rất biểu dương tinh thần học tập của em.',
];

export const GradingModal: React.FC<GradingModalProps> = ({
  submission,
  isOpen,
  onClose,
  onGraded,
}) => {
  const { showToast } = useNotifications();

  const [score, setScore] = useState<number | string>(
    submission.feedback ? submission.feedback.score : 10
  );
  const [comment, setComment] = useState(
    submission.feedback ? submission.feedback.comment : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      setError('Điểm số phải từ 0 đến 10.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.gradeSubmission(submission.id, numScore, comment.trim());
      showToast('Đã lưu điểm & nhận xét', `Đã chấm bài cho ${submission.studentName || 'học sinh'} (${numScore} điểm)`, 'success');
      onGraded(res.feedback, res.submission);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể chấm bài');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Chấm Bài &amp; Nhận Xét Học Sinh</h3>
              <p className="text-xs text-slate-400">
                {submission.studentName} ({submission.studentCode} - {submission.className || '12A1'})
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

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Submission Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                Thời gian nộp:{' '}
                <strong className="text-slate-200">
                  {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                </strong>
              </span>
            </div>

            {submission.isLate ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold">
                Nộp muộn
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đúng hạn
              </span>
            )}
          </div>

          {/* Student's Text Answer */}
          {submission.textAnswer && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Câu trả lời / Lời giải của học sinh:
              </label>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {submission.textAnswer}
              </div>
            </div>
          )}

          {/* Student's Attached Photos / Files */}
          {submission.attachments && submission.attachments.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Ảnh chụp vở bài làm &amp; Tệp đính kèm ({submission.attachments.length} tệp):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {submission.attachments.map((file) => {
                  const isImg = file.mimeType.startsWith('image/');
                  return (
                    <div
                      key={file.id}
                      className="group relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col"
                    >
                      {isImg ? (
                        <div
                          className="h-28 bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center relative"
                          onClick={() => setZoomImage(file.url)}
                        >
                          <img
                            src={file.url}
                            alt={file.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                            Xem ảnh lớn
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 bg-slate-900 flex flex-col items-center justify-center p-2 text-center">
                          <FileText className="w-8 h-8 text-amber-400 mb-1" />
                          <span className="text-[10px] text-slate-400 line-clamp-1">{file.fileName}</span>
                        </div>
                      )}
                      <div className="p-2 flex items-center justify-between bg-slate-900/90 text-[11px]">
                        <span className="text-slate-300 truncate max-w-[120px] font-medium">
                          {file.fileName}
                        </span>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:text-amber-300 p-0.5"
                          title="Tải tệp"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grading Form */}
          <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Score */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Điểm số (Thang điểm 10):
                </label>
                <div className="flex items-center gap-1">
                  {QUICK_SCORES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setScore(q)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                        Number(score) === q
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.25"
                min="0"
                max="10"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Feedback Comment */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lời phê &amp; Nhận xét động viên:
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhận xét ưu điểm, điểm cần cải thiện, lời khen ngợi học sinh..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {/* Quick comments suggestion */}
              <div className="mt-2 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block">Gợi ý nhận xét nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_COMMENTS.map((qc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setComment(qc)}
                      className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
                    >
                      {qc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs disabled:opacity-50"
              >
                {submitting ? 'Đang lưu điểm...' : 'Lưu Điểm & Gửi Nhận Xét'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomImage}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
