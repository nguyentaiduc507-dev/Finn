/**
 * QUANG HƯNG Learning Platform - TypeScript Definitions
 */

export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  studentCode?: string;
  className?: string;
  notes?: string;
}

export interface AttachedFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

export type AssignmentStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  content: string;
  publishAt: string;
  dueAt: string;
  streakRequired: boolean;
  createdBy: string;
  status: AssignmentStatus;
  targetType: 'all' | 'class' | 'specific';
  targetClass?: string;
  targetStudentIds?: string[];
  difficultyLevel?: 'basic' | 'standard' | 'advanced' | 'specialized';
  categoryTag?: string;
  attachments: AttachedFile[];
  version: number;
  allowResubmit: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed for current student
  studentSubmission?: Submission;
  recipientCount?: number;
  submissionCount?: number;
  gradedCount?: number;
}

export interface AssignmentVersion {
  id: string;
  assignmentId: string;
  version: number;
  title: string;
  content: string;
  attachments: AttachedFile[];
  changedAt: string;
}

export type SubmissionStatus = 'submitted' | 'graded' | 'resubmission_requested';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  className?: string;
  assignmentTitle?: string;
  subject?: string;
  dueAt?: string;
  version: number;
  textAnswer: string;
  attachments: AttachedFile[];
  submittedAt: string;
  isLate: boolean;
  status: SubmissionStatus;
  feedback?: Feedback;
}

export interface Feedback {
  id: string;
  submissionId: string;
  teacherId: string;
  teacherName?: string;
  score: number; // 0 - 10
  comment: string;
  returnedAt: string;
}

export interface AppNotification {
  id: string;
  recipientId: string; // or 'all_students' | 'teachers'
  title: string;
  message: string;
  type: 'new_assignment' | 'graded' | 'streak_alert' | 'system';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  missedDays: number;
  todayCompleted: boolean;
  todayPending: boolean;
  historyMap: Record<string, 'completed' | 'missed' | 'rest' | 'pending'>;
}

export interface CalendarDayDetail {
  date: string;
  status: 'completed' | 'missed' | 'rest' | 'pending';
  assignments: {
    id: string;
    title: string;
    subject: string;
    dueAt: string;
    streakRequired: boolean;
    submission?: Submission;
  }[];
}
