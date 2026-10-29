import React, { useState } from 'react';
import { Shield, GraduationCap, Lock, KeyRound, User, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginAsTeacher, loginAsStudent } = useAuth();
  const [roleTab, setRoleTab] = useState<'teacher' | 'student'>('teacher');

  // Teacher fields
  const [teacherPin, setTeacherPin] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('giaovien');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [usePasswordInstead, setUsePasswordInstead] = useState(false);

  // Student fields
  const [studentIdentifier, setStudentIdentifier] = useState('HS01');
  const [studentPassword, setStudentPassword] = useState('123456');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (usePasswordInstead) {
        await loginAsTeacher(undefined, teacherUsername, teacherPassword);
      } else {
        await loginAsTeacher(teacherPin);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Mã PIN hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAsStudent(studentIdentifier, studentPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Thông tin đăng nhập học sinh không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (type: 'hs01' | 'hs02' | 'hs03') => {
    setError(null);
    setLoading(true);
    try {
      if (type === 'hs01') {
        await loginAsStudent('HS01', '123456');
      } else if (type === 'hs02') {
        await loginAsStudent('HS02', '123456');
      } else if (type === 'hs03') {
        await loginAsStudent('HS03', '123456');
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Đóng"
          >
            ✕
          </button>
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 mb-3">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">Đăng Nhập Finn</h2>
          <p className="text-xs text-slate-400 mt-1">Cổng học tập trực tuyến &amp; duy trì chuỗi học tập hàng ngày</p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 border-b border-slate-800 gap-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setRoleTab('teacher');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
              roleTab === 'teacher'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Giáo Viên / Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleTab('student');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
              roleTab === 'student'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Học Sinh
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Teacher Login Form */}
        {roleTab === 'teacher' ? (
          <form onSubmit={handleTeacherSubmit} className="p-6 space-y-4">
            {!usePasswordInstead ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mã PIN Quản Trị Giáo Viên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    maxLength={16}
                    value={teacherPin}
                    onChange={(e) => setTeacherPin(e.target.value)}
                    placeholder="Nhập mã PIN giáo viên..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1">
                  <span>💡 Mã PIN khởi tạo: <strong>26052007</strong> (Bảo mật máy chủ)</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên đăng nhập</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={teacherUsername}
                      onChange={(e) => setTeacherUsername(e.target.value)}
                      placeholder="thayquanghung"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setUsePasswordInstead(!usePasswordInstead)}
                className="text-xs text-slate-400 hover:text-amber-400 underline underline-offset-2"
              >
                {usePasswordInstead ? 'Đăng nhập bằng mã PIN' : 'Đăng nhập bằng tên & mật khẩu'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Đang xác thực...' : 'Đăng Nhập Giáo Viên'}
            </button>
          </form>
        ) : (
          /* Student Login Form */
          <form onSubmit={handleStudentSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mã học sinh hoặc tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  placeholder="Ví dụ: HS01 hoặc an.tran"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tài khoản do Thầy Quang Hưng cấp (ví dụ: HS01, HS02, HS03).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Mật khẩu (mặc định 123456)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập Học Sinh'}
            </button>
          </form>
        )}

        {/* Quick Testing Bar for Students */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
            Đăng nhập nhanh học sinh (Mật khẩu: 123456):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('hs01')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors text-center truncate"
            >
              🔥 HS01: An
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('hs02')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-medium transition-colors text-center truncate"
            >
              ⭐ HS02: Linh
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('hs03')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors text-center truncate"
            >
              📝 HS03: Nam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
