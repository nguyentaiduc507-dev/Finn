/**
 * Server database storage for QUANG HƯNG platform.
 * Persists data to a structured JSON database in the /data directory with atomic writes.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  UserProfile,
  Assignment,
  AssignmentVersion,
  Submission,
  Feedback,
  AppNotification,
  AuditLog,
  AttachedFile,
} from '../src/types/index.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export interface TeacherSettings {
  pinHash: string; // Default PIN 26052007
  teacherPasswordHash: string;
  allowResubmissionDefault: boolean;
  maxFilesPerSubmission: number;
  maxFileSizeMb: number;
  notificationsEnabled: boolean;
}

export interface DatabaseSchema {
  settings: TeacherSettings;
  profiles: (UserProfile & { passwordHash?: string; pinHash?: string })[];
  assignments: Assignment[];
  assignmentVersions: AssignmentVersion[];
  submissions: Submission[];
  feedbacks: Feedback[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  streakExceptions: { studentId: string; date: string; reason: string; grantedBy: string; timestamp: string }[];
}

// Simple deterministic hash for demo/secure storage
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret.trim()).digest('hex');
}

// Default initial state
function createInitialDatabase(): DatabaseSchema {
  const initialPin = '26052007';
  const initialPinHash = hashSecret(initialPin);
  const defaultPasswordHash = hashSecret('123456');

  const teacherProfile: UserProfile & { passwordHash?: string; pinHash?: string } = {
    id: 'teacher-quang-hung',
    username: 'giaovien',
    displayName: 'Giáo viên',
    role: 'teacher',
    status: 'active',
    createdAt: new Date().toISOString(),
    pinHash: initialPinHash,
    passwordHash: defaultPasswordHash,
  };

  const student1: UserProfile & { passwordHash?: string } = {
    id: 'student-an',
    username: 'an.tran',
    studentCode: 'HS01',
    displayName: 'Trần Văn An',
    className: '12A1',
    notes: 'Học sinh chăm chỉ, mục tiêu 9+ môn Toán',
    role: 'student',
    status: 'active',
    createdAt: new Date().toISOString(),
    passwordHash: defaultPasswordHash,
  };

  const student2: UserProfile & { passwordHash?: string } = {
    id: 'student-linh',
    username: 'linh.le',
    studentCode: 'HS02',
    displayName: 'Lê Phương Linh',
    className: '12A1',
    notes: 'Tiến bộ nhanh, làm bài cẩn thận',
    role: 'student',
    status: 'active',
    createdAt: new Date().toISOString(),
    passwordHash: defaultPasswordHash,
  };

  const student3: UserProfile & { passwordHash?: string } = {
    id: 'student-nam',
    username: 'nam.nguyen',
    studentCode: 'HS03',
    displayName: 'Nguyễn Hoàng Nam',
    className: '12A2',
    notes: 'Cần nhắc nhở nộp bài đúng hạn',
    role: 'student',
    status: 'active',
    createdAt: new Date().toISOString(),
    passwordHash: defaultPasswordHash,
  };

  // Seed sample assignments for today and recent days
  const now = new Date();
  const todayVN = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);

  const sampleAssignment1: Assignment = {
    id: 'assign-today-math',
    title: 'Bài tập Hàm số & Khảo sát sự biến thiên (Ngày ' + todayVN + ')',
    subject: 'Toán học',
    content: 'Các em giải chi tiết 3 bài toán cực trị và điểm uốn trong file đính kèm. Chụp rõ từng bước tính đạo hàm, bảng biến thiên và kết luận. Nhớ ghi họ tên vào góc vở!',
    publishAt: `${todayVN}T07:00:00+07:00`,
    dueAt: `${todayVN}T23:59:59+07:00`,
    streakRequired: true,
    createdBy: 'teacher-quang-hung',
    status: 'published',
    targetType: 'all',
    attachments: [
      {
        id: 'file-seed-math-guide',
        fileName: 'Huong_dan_giai_ham_so_12.pdf',
        fileSize: 420500,
        mimeType: 'application/pdf',
        url: '/api/files/sample/Huong_dan_giai_ham_so_12.pdf',
        uploadedAt: new Date().toISOString(),
      },
    ],
    version: 1,
    allowResubmit: true,
    createdAt: `${todayVN}T07:00:00+07:00`,
    updatedAt: `${todayVN}T07:00:00+07:00`,
  };

  const sampleAssignment2: Assignment = {
    id: 'assign-eng-streak',
    title: 'Luyện 20 Cụm từ Collocations & Bài đọc Đọc hiểu',
    subject: 'Tiếng Anh',
    content: 'Đọc kỹ bài reading trích đề thi thử THPT Quốc Gia, ghi đáp án 5 câu hỏi và dịch 3 câu văn then chốt. Nộp bài trước 22h tối nay để duy trì chuỗi học tập nhé!',
    publishAt: `${todayVN}T08:00:00+07:00`,
    dueAt: `${todayVN}T22:00:00+07:00`,
    streakRequired: true,
    createdBy: 'teacher-quang-hung',
    status: 'published',
    targetType: 'all',
    attachments: [],
    version: 1,
    allowResubmit: true,
    createdAt: `${todayVN}T08:00:00+07:00`,
    updatedAt: `${todayVN}T08:00:00+07:00`,
  };

  // Seed sample submission from student An
  const sampleSubmission1: Submission = {
    id: 'sub-an-math',
    assignmentId: 'assign-today-math',
    studentId: 'student-an',
    version: 1,
    textAnswer: 'Dạ thưa Thầy, em đã làm xong 3 bài tập về nhà. Em chụp ảnh 2 trang vở bài giải gửi Thầy chấm ạ. Bài 3 câu b em có tìm thêm cách giải nhanh bằng đồ thị ạ.',
    attachments: [
      {
        id: 'file-sub-an-1',
        fileName: 'BaiLam_TranVanAn_Trang1.jpg',
        fileSize: 185400,
        mimeType: 'image/jpeg',
        url: '/api/files/sample/BaiLam_TranVanAn_Trang1.jpg',
        uploadedAt: `${todayVN}T10:15:00+07:00`,
      },
      {
        id: 'file-sub-an-2',
        fileName: 'BaiLam_TranVanAn_Trang2.jpg',
        fileSize: 204100,
        mimeType: 'image/jpeg',
        url: '/api/files/sample/BaiLam_TranVanAn_Trang2.jpg',
        uploadedAt: `${todayVN}T10:15:00+07:00`,
      },
    ],
    submittedAt: `${todayVN}T10:15:00+07:00`,
    isLate: false,
    status: 'graded',
  };

  const sampleFeedback1: Feedback = {
    id: 'fb-an-math',
    submissionId: 'sub-an-math',
    teacherId: 'teacher-quang-hung',
    teacherName: 'Thầy Quang Hưng',
    score: 9.5,
    comment: 'Trình bày rất sạch sẽ và chặt chẽ! Câu 3b cách dùng đồ thị rất thông minh, tiết kiệm được 3 phút làm bài. Tiếp tục phát huy chuỗi học tập nhé An!',
    returnedAt: `${todayVN}T11:00:00+07:00`,
  };

  const sampleNotification1: AppNotification = {
    id: 'notif-1',
    recipientId: 'student-an',
    title: 'Thầy Quang Hưng đã chấm bài tập Toán',
    message: 'Bài tập Hàm số & Khảo sát sự biến thiên: 9.5/10 - "Trình bày rất sạch sẽ và chặt chẽ!"',
    type: 'graded',
    link: '/history',
    read: false,
    createdAt: `${todayVN}T11:00:00+07:00`,
  };

  return {
    settings: {
      pinHash: initialPinHash,
      teacherPasswordHash: defaultPasswordHash,
      allowResubmissionDefault: true,
      maxFilesPerSubmission: 10,
      maxFileSizeMb: 10,
      notificationsEnabled: true,
    },
    profiles: [teacherProfile, student1, student2, student3],
    assignments: [sampleAssignment1, sampleAssignment2],
    assignmentVersions: [
      {
        id: 'ver-1',
        assignmentId: sampleAssignment1.id,
        version: 1,
        title: sampleAssignment1.title,
        content: sampleAssignment1.content,
        attachments: sampleAssignment1.attachments,
        changedAt: sampleAssignment1.createdAt,
      },
    ],
    submissions: [sampleSubmission1],
    feedbacks: [sampleFeedback1],
    notifications: [sampleNotification1],
    auditLogs: [
      {
        id: 'audit-init',
        actorId: 'system',
        actorName: 'Hệ thống Quang Hưng',
        action: 'KHỞI TẠO',
        entityType: 'system',
        entityId: 'system',
        details: 'Khởi tạo hệ thống giáo dục Quang Hưng với mã PIN giáo viên ban đầu.',
        timestamp: new Date().toISOString(),
      },
    ],
    streakExceptions: [],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db.json, falling back to initial data', err);
        this.data = createInitialDatabase();
        this.save();
      }
    } else {
      this.data = createInitialDatabase();
      this.save();
    }
  }

  public save(): void {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save db.json atomically:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public resetData(): void {
    this.data = createInitialDatabase();
    this.save();
  }

  public restoreBackup(imported: DatabaseSchema): void {
    this.data = imported;
    this.save();
  }

  public logAudit(actorId: string, actorName: string, action: string, entityType: string, entityId: string, details: string): void {
    const log: AuditLog = {
      id: 'audit-' + crypto.randomUUID(),
      actorId,
      actorName,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
  }
}

export const db = new Database();
export { UPLOADS_DIR };
