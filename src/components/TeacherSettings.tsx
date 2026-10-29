import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Download,
  Upload,
  RotateCcw,
  History,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import type { AuditLog } from '../types/index';

export const TeacherSettings: React.FC = () => {
  const { showToast } = useNotifications();

  // Settings form
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [allowResubmit, setAllowResubmit] = useState(true);
  const [maxFileSize, setMaxFileSize] = useState(10);
  const [saving, setSaving] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Restore state
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      if (data.settings) {
        setAllowResubmit(data.settings.allowResubmissionDefault);
        setMaxFileSize(data.settings.maxFileSizeMb);
      }
    });

    api.getAuditLogs().then((logs) => {
      setAuditLogs(logs);
      setLoadingLogs(false);
    });
  }, []);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin && !newPassword) {
      showToast('Thông báo', 'Vui lòng nhập mã PIN mới hoặc mật khẩu mới cần thay đổi', 'info');
      return;
    }

    setSaving(true);
    try {
      await api.updateSettings({
        newPin: newPin || undefined,
        newPassword: newPassword || undefined,
        allowResubmissionDefault: allowResubmit,
        maxFileSizeMb: maxFileSize,
      });
      showToast('Cập nhật thành công', 'Thông tin bảo mật giáo viên đã được cập nhật an toàn', 'success');
      setNewPin('');
      setNewPassword('');
    } catch (err: any) {
      showToast('Lỗi', err.message || 'Không thể lưu cài đặt', 'warning');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/settings/backup';
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setRestoring(true);
        const res = await fetch('/api/settings/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('qh_token')}`,
          },
          body: JSON.stringify({ backupData: json }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast('Khôi phục thành công', 'Dữ liệu website đã được phục hồi đầy đủ', 'success');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err: any) {
        showToast('Lỗi khôi phục', err.message || 'Tệp không hợp lệ', 'warning');
      } finally {
        setRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn đặt lại dữ liệu mẫu ban đầu? Tất cả bài nộp mới sẽ được khôi phục về trạng thái demo.')) {
      return;
    }
    try {
      await api.resetDemoData();
      showToast('Đặt lại dữ liệu', 'Đã khôi phục dữ liệu ban đầu', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      showToast('Lỗi', err.message, 'warning');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1.5 inline-block">
          Quản Trị Hệ Thống
        </span>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Cài Đặt &amp; Nhật Ký Hệ Thống</h2>
        <p className="text-xs text-slate-400 mt-1">
          Cấu hình bảo mật mã PIN giáo viên, chính sách nộp bài, sao lưu cơ sở dữ liệu và truy vết kiểm toán
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Security & System Settings */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Shield className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Bảo Mật Giáo Viên / Admin</h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
              💡 <strong>Lưu ý bảo mật:</strong> Mã PIN khởi tạo ban đầu do Thầy cung cấp là <strong>26052007</strong>.
              Mã PIN được xác thực an toàn tại máy chủ (Server-side hash), không nhúng mã trong frontend hay HTML client. Thầy có thể đổi mã PIN hoặc mật khẩu mới dưới đây bất cứ lúc nào.
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Đổi Mã PIN Giáo Viên Mới:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="password"
                    maxLength={16}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Nhập mã PIN mới (ví dụ: 6-8 chữ số)..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Đổi Mật Khẩu Giáo Viên (Đăng nhập bằng tài khoản):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowResubmit}
                    onChange={(e) => setAllowResubmit(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  Mặc định cho phép học sinh nộp lại bài khi cần bổ sung
                </label>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Giới hạn dung lượng tải tệp tối đa (MB):
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={maxFileSize}
                    onChange={(e) => setMaxFileSize(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md text-xs transition-all disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Bảo Mật'}
                </button>
              </div>
            </form>
          </div>

          {/* Backup & Restore */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Download className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-white">Sao Lưu &amp; Khôi Phục Dữ Liệu</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Hệ thống lưu trữ toàn bộ danh sách học sinh, bài tập, bài nộp của học sinh và lịch sử chuỗi ngày vào tệp dữ liệu. Thầy có thể tải bản sao lưu về máy tính bất cứ lúc nào.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-sky-400" />
                Tải Xuất Bản Sao Lưu (.json)
              </button>

              <label className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-amber-400" />
                {restoring ? 'Đang phục hồi...' : 'Khôi Phục Từ File Backup'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                  disabled={restoring}
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">Khởi tạo lại hệ thống về trạng thái ban đầu:</span>
              <button
                type="button"
                onClick={handleResetData}
                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Đặt Lại Demo
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Nhật Ký Kiểm Toán (Audit Logs)</h3>
            </div>
            <span className="text-[11px] text-slate-500">{auditLogs.length} thao tác</span>
          </div>

          <p className="text-xs text-slate-400">
            Mọi thao tác quan trọng như giao bài, sửa đề, chấm điểm, sửa học sinh, cấp ngoại lệ chuỗi đều được máy chủ ghi nhận minh bạch:
          </p>

          <div className="space-y-2 max-h-[500px] overflow-y-auto divide-y divide-slate-800/80">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Chưa có thao tác nào được ghi nhận.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="pt-2.5 pb-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-amber-400 font-bold border border-slate-700">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1.5">{log.details}</p>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Thực hiện bởi: <strong className="text-slate-400">{log.actorName}</strong>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
