/**
 * Client API service for QUANG HƯNG platform.
 */

import type {
  UserProfile,
  Assignment,
  Submission,
  Feedback,
  AppNotification,
  StreakStats,
  CalendarDayDetail,
  AuditLog,
  AttachedFile,
} from '../types/index';

class ApiService {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('qh_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Auth
  async teacherLogin(pin?: string, username?: string, password?: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch('/api/auth/teacher-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng nhập giáo viên thất bại');
    localStorage.setItem('qh_token', data.token);
    return data;
  }

  async studentLogin(identifier: string, password?: string): Promise<{ token: string; user: UserProfile; streak: StreakStats }> {
    const res = await fetch('/api/auth/student-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password: password || '123456' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng nhập học sinh thất bại');
    localStorage.setItem('qh_token', data.token);
    return data;
  }

  async getMe(): Promise<{ user: UserProfile | null; streak?: StreakStats | null }> {
    const res = await fetch('/api/auth/me', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return { user: null };
    return res.json();
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } finally {
      localStorage.removeItem('qh_token');
    }
  }

  // File Upload
  async uploadFiles(files: File[]): Promise<AttachedFile[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const token = localStorage.getItem('qh_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Tải tệp lên thất bại');
    return data.files;
  }

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    const res = await fetch('/api/assignments', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách bài tập');
    return data.assignments;
  }

  async getAssignment(id: string): Promise<{
    assignment: Assignment;
    submissions?: Submission[];
    versions?: any[];
  }> {
    const res = await fetch(`/api/assignments/${id}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải bài tập');
    return data;
  }

  async createAssignment(payload: Partial<Assignment>): Promise<Assignment> {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tạo bài tập');
    return data.assignment;
  }

  async updateAssignment(id: string, payload: Partial<Assignment>): Promise<Assignment> {
    const res = await fetch(`/api/assignments/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể cập nhật bài tập');
    return data.assignment;
  }

  async duplicateAssignment(id: string): Promise<Assignment> {
    const res = await fetch(`/api/assignments/${id}/duplicate`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể nhân bản bài tập');
    return data.assignment;
  }

  async deleteAssignment(id: string): Promise<void> {
    const res = await fetch(`/api/assignments/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể xóa bài tập');
  }

  async archiveAssignment(id: string): Promise<void> {
    return this.deleteAssignment(id);
  }

  // Submissions
  async submitAssignment(assignmentId: string, textAnswer: string, attachments: AttachedFile[]): Promise<{
    submission: Submission;
    isLate: boolean;
    streak: StreakStats;
    message: string;
  }> {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ assignmentId, textAnswer, attachments }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể nộp bài');
    return data;
  }

  async gradeSubmission(submissionId: string, score: number, comment: string): Promise<{
    feedback: Feedback;
    submission: Submission;
  }> {
    const res = await fetch(`/api/submissions/${submissionId}/grade`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ score, comment }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Chấm điểm thất bại');
    return data;
  }

  // Students (Teacher only)
  async getStudents(): Promise<(UserProfile & { streak?: StreakStats })[]> {
    const res = await fetch('/api/students', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách học sinh');
    return data.students;
  }

  async createStudent(payload: {
    studentCode: string;
    displayName: string;
    className: string;
    notes?: string;
    password?: string;
  }): Promise<UserProfile> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể thêm học sinh');
    return data.student;
  }

  async updateStudent(id: string, payload: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể sửa thông tin học sinh');
    return data.student;
  }

  async toggleStudentStatus(id: string, status: 'active' | 'suspended'): Promise<void> {
    const res = await fetch(`/api/students/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể đổi trạng thái');
  }

  async deleteStudent(id: string): Promise<void> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể xóa học sinh');
  }

  async resetStudentPassword(id: string, newPassword?: string): Promise<string> {
    const res = await fetch(`/api/students/${id}/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể đặt lại mật khẩu');
    return data.message;
  }

  async grantStreakException(studentId: string, date: string, reason: string): Promise<StreakStats> {
    const res = await fetch(`/api/students/${studentId}/streak-exception`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ date, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể cấp ngoại lệ chuỗi');
    return data.streak;
  }

  // Calendar
  async getCalendar(year: number, month: number, studentId?: string): Promise<{
    details: CalendarDayDetail[];
    stats: StreakStats;
  }> {
    let url = `/api/calendar?year=${year}&month=${month}`;
    if (studentId) url += `&studentId=${encodeURIComponent(studentId)}`;

    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải lịch học tập');
    return data;
  }

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch('/api/notifications', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) return [];
    return data.notifications;
  }

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
  }

  async markAllNotificationsRead(): Promise<void> {
    await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  // Teacher Stats & Settings
  async getTeacherStats(): Promise<any> {
    const res = await fetch('/api/stats/teacher', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải thống kê');
    return data;
  }

  async getSettings(): Promise<any> {
    const res = await fetch('/api/settings', {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  async updateSettings(payload: any): Promise<void> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể lưu cài đặt');
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) return [];
    return data.auditLogs;
  }

  async resetDemoData(): Promise<void> {
    const res = await fetch('/api/settings/reset', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể đặt lại dữ liệu');
  }
}

export const api = new ApiService();
