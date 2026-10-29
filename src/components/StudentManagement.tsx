import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Flame,
  KeyRound,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import type { UserProfile, StreakStats } from '../types/index';
import { FlameStreakBadge } from './FlameStreakBadge';

export const StudentManagement: React.FC = () => {
  const { showToast } = useNotifications();

  const [students, setStudents] = useState<(UserProfile & { streak?: StreakStats })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState<UserProfile | null>(null);
  const [resetPassStudent, setResetPassStudent] = useState<UserProfile | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<UserProfile | null>(null);

  // Form fields
  const [studentCode, setStudentCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [className, setClassName] = useState('12A1');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('123456');
  const [newPassword, setNewPassword] = useState('123456');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const list = await api.getStudents();
      setStudents(list);
    } catch (err: any) {
      showToast('Lỗi', err.message || 'Không thể tải danh sách học sinh', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim() || !displayName.trim()) {
      showToast('Thiếu thông tin', 'Vui lòng nhập Mã học sinh và Họ tên', 'warning');
      return;
    }
    try {
      await api.createStudent({
        studentCode: studentCode.trim().toUpperCase(),
        displayName: displayName.trim(),
        className: className.trim(),
        notes: notes.trim(),
        password: password.trim(),
      });
      showToast('Thành công', `Đã thêm học sinh ${displayName}`, 'success');
      setShowAddModal(false);
      setStudentCode('');
      setDisplayName('');
      setNotes('');
      loadStudents();
    } catch (err: any) {
      showToast('Lỗi', err.message, 'warning');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    try {
      await api.updateStudent(editStudent.id, {
        displayName: editStudent.displayName,
        className: editStudent.className,
        notes: editStudent.notes,
        studentCode: editStudent.studentCode,
      });
      showToast('Thành công', 'Đã cập nhật thông tin học sinh', 'success');
      setEditStudent(null);
      loadStudents();
    } catch (err: any) {
      showToast('Lỗi', err.message, 'warning');
    }
  };

  const handleToggleStatus = async (student: UserProfile) => {
    const nextStatus = student.status === 'active' ? 'suspended' : 'active';
    try {
      await api.toggleStudentStatus(student.id, nextStatus);
      showToast('Cập nhật trạng thái', `Đã ${nextStatus === 'active' ? 'mở khóa' : 'tạm khóa'} ${student.displayName}`, 'info');
      loadStudents();
    } catch (err: any) {
      showToast('Lỗi', err.message, 'warning');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassStudent) return;
    try {
      const msg = await api.resetStudentPassword(resetPassStudent.id, newPassword);
      showToast('Đã đặt lại mật khẩu', msg, 'success');
      setResetPassStudent(null);
    } catch (err: any) {
      showToast('Lỗi', err.message, 'warning');
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteConfirmStudent) return;
    try {
      await api.deleteStudent(deleteConfirmStudent.id);
      showToast('Đã xóa', `Đã xóa học sinh ${deleteConfirmStudent.displayName} khỏi danh sách`, 'info');
      setDeleteConfirmStudent(null);
      loadStudents();
    } catch (err: any) {
      showToast('Lỗi', err.message, 'warning');
    }
  };

  // Filter students
  const filtered = students.filter((s) => {
    const matchSearch =
      s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchClass = classFilter === 'ALL' || s.className === classFilter;
    return matchSearch && matchClass;
  });

  const uniqueClasses = Array.from(new Set(students.map((s) => s.className || '12A1')));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Quản Trị Lớp Học
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Danh Sách Học Sinh</h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý tài khoản, mã đăng nhập, phân loại lớp và theo dõi chuỗi học tập cá nhân
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
        >
          <UserPlus className="w-4 h-4" />
          Thêm Học Sinh Mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học sinh, mã HS..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Lớp học:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-medium"
          >
            <option value="ALL">Tất cả lớp ({students.length})</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                Lớp {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Mã HS</th>
                <th className="py-3.5 px-4">Họ và Tên</th>
                <th className="py-3.5 px-4">Lớp</th>
                <th className="py-3.5 px-4 text-center">Chuỗi Hiện Tại</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4">Ghi Chú</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không tìm thấy học sinh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-amber-400 font-mono">
                      {student.studentCode || '---'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{student.displayName}</div>
                      <span className="text-[10px] text-slate-500">@{student.username}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-[11px]">
                        {student.className || '12A1'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <FlameStreakBadge streak={student.streak || null} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {student.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-semibold">
                          <Lock className="w-3 h-3" /> Tạm khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-400 text-[11px]">
                      {student.notes || '---'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditStudent(student)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setResetPassStudent(student)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                          title="Đổi mật khẩu"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student)}
                          className={`p-1.5 rounded-lg ${
                            student.status === 'active'
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                              : 'bg-emerald-950/40 text-emerald-400'
                          }`}
                          title={student.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {student.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmStudent(student)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Thêm Tài Khoản Học Sinh
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mã học sinh (Ví dụ: HS04) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="HS04"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Họ và tên học sinh <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Minh Đức"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Lớp</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="12A1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mật khẩu khởi tạo</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ghi chú giáo viên</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mục tiêu điểm số, định hướng khối thi..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md"
                >
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold text-white">Sửa Thông Tin Học Sinh</h4>
              <button
                onClick={() => setEditStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mã học sinh</label>
                <input
                  type="text"
                  value={editStudent.studentCode || ''}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, studentCode: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={editStudent.displayName}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, displayName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lớp</label>
                <input
                  type="text"
                  value={editStudent.className || ''}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, className: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={editStudent.notes || ''}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Đặt Lại Mật Khẩu
            </h4>
            <p className="text-xs text-slate-300">
              Đặt lại mật khẩu cho học sinh <strong>{resetPassStudent.displayName}</strong>:
            </p>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="123456"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetPassStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
              >
                Cập Nhật Mật Khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-3 shadow-2xl">
            <h4 className="text-base font-bold text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Xác Nhận Xóa Học Sinh
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa học sinh <strong>{deleteConfirmStudent.displayName}</strong> ({deleteConfirmStudent.studentCode}) không? Học sinh sẽ bị xóa hoàn toàn khỏi danh sách.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Xóa Học Sinh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
