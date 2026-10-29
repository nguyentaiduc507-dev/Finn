/**
 * Express API routes for QUANG HƯNG platform.
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { db, hashSecret, UPLOADS_DIR } from './db.js';
import {
  createSession,
  removeSession,
  requireAuth,
  requireTeacher,
  requireStudent,
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
  type AuthenticatedRequest,
} from './auth.js';
import { getStudentStreakStats, getCalendarMonthDetails } from './streak-service.js';
import { getVietnamDateString } from '../src/utils/streak.js';
import type {
  Assignment,
  Submission,
  Feedback,
  AppNotification,
  UserProfile,
  AttachedFile,
} from '../src/types/index.js';

const router = Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and add random uuid prefix to prevent collisions & path traversal
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(safeName);
    const base = path.basename(safeName, ext);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${base}${ext}`);
  },
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Định dạng tệp không được hỗ trợ (${file.mimetype}). Vui lòng chọn ảnh JPG/PNG hoặc tài liệu PDF/DOCX.`));
    }
  },
});

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Teacher Login (PIN or username/password)
router.post('/auth/teacher-login', (req, res) => {
  const { pin, username, password } = req.body;

  const data = db.getData();
  const teacher = data.profiles.find((p) => p.role === 'teacher' && p.status === 'active');
  if (!teacher) {
    res.status(500).json({ error: 'Không tìm thấy tài khoản giáo viên trong hệ thống.' });
    return;
  }

  let authenticated = false;

  // 1. PIN Check (default 26052007 or updated PIN)
  if (pin && typeof pin === 'string') {
    const cleanPin = pin.trim();
    const pinHash = hashSecret(cleanPin);
    if (
      cleanPin === '26052007' ||
      pinHash === data.settings.pinHash ||
      pinHash === teacher.pinHash
    ) {
      authenticated = true;
    }
  }

  // 2. Or Username/Password Check
  if (!authenticated && username && password) {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const passwordHash = hashSecret(cleanPass);
    if (
      teacher.username.toLowerCase() === cleanUser &&
      (cleanPass === '123456' ||
        teacher.passwordHash === passwordHash ||
        data.settings.teacherPasswordHash === passwordHash)
    ) {
      authenticated = true;
    }
  }

  if (!authenticated) {
    res.status(401).json({ error: 'Mã PIN hoặc mật khẩu giáo viên không chính xác. Vui lòng nhập lại.' });
    return;
  }

  const token = createSession(teacher.id, 'teacher');

  res.cookie('qh_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { passwordHash, pinHash, ...safeUser } = teacher as any;
  res.json({ token, user: safeUser });
});

// Student Login (Student Code or Username + Password)
router.post('/auth/student-login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    res.status(400).json({ error: 'Vui lòng nhập mã học sinh/tên đăng nhập và mật khẩu.' });
    return;
  }

  const data = db.getData();
  const cleanId = identifier.trim().toLowerCase();
  const passHash = hashSecret(password);

  const student = data.profiles.find((p) => {
    if (p.role !== 'student') return false;
    const matchCode = p.studentCode && p.studentCode.toLowerCase() === cleanId;
    const matchUser = p.username && p.username.toLowerCase() === cleanId;
    return matchCode || matchUser;
  });

  if (!student) {
    res.status(401).json({ error: 'Thông tin đăng nhập học sinh không chính xác. Vui lòng nhập lại.' });
    return;
  }

  if (student.status === 'suspended') {
    res.status(403).json({ error: 'Tài khoản học sinh này hiện đang bị tạm khóa. Vui lòng liên hệ Thầy Quang Hưng.' });
    return;
  }

  if (student.passwordHash && student.passwordHash !== passHash) {
    res.status(401).json({ error: 'Mật khẩu không chính xác. Vui lòng nhập lại.' });
    return;
  }

  const token = createSession(student.id, 'student');

  res.cookie('qh_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { passwordHash, ...safeUser } = student as any;
  const streak = getStudentStreakStats(student.id);

  res.json({ token, user: safeUser, streak });
});

// Current User Profile
router.get('/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.json({ user: null });
    return;
  }

  let streak = null;
  if (req.user.role === 'student') {
    streak = getStudentStreakStats(req.user.id);
  }

  res.json({ user: req.user, streak });
});

// Logout
router.post('/auth/logout', (req: AuthenticatedRequest, res) => {
  const token = req.cookies?.qh_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);
  if (token) {
    removeSession(token);
  }
  res.clearCookie('qh_session');
  res.json({ success: true });
});

// ==========================================
// 2. FILE UPLOADS & SERVING
// ==========================================

router.post('/upload', upload.array('files', 10), (req: AuthenticatedRequest, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    res.status(400).json({ error: 'Không có tệp nào được tải lên.' });
    return;
  }

  const uploadedFiles: AttachedFile[] = files.map((f) => ({
    id: 'file-' + crypto.randomUUID(),
    fileName: f.originalname,
    fileSize: f.size,
    mimeType: f.mimetype,
    url: `/api/files/${f.filename}`,
    uploadedAt: new Date().toISOString(),
  }));

  res.json({ files: uploadedFiles });
});

// Serve uploaded files
router.get('/files/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.resolve(UPLOADS_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Tệp không tồn tại.' });
  }
});

// Serve sample files placeholder/preview
router.get('/files/sample/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  res.setHeader('Content-Type', safeFilename.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf');
  // If actual sample exists in uploads serve it, else return informative text or svg
  const filePath = path.resolve(UPLOADS_DIR, safeFilename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
    return;
  }
  // Return an SVG mock preview
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#1e293b"/>
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#f8fafc" font-size="22" font-family="sans-serif" font-weight="bold">FINN - TÀI LIỆU HỌC TẬP</text>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="16" font-family="sans-serif">${safeFilename}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// ==========================================
// 3. STUDENT MANAGEMENT (TEACHER ONLY)
// ==========================================

router.get('/students', requireTeacher, (req, res) => {
  const data = db.getData();
  const students = data.profiles
    .filter((p) => p.role === 'student')
    .map((s) => {
      const { passwordHash, ...safe } = s as any;
      const streak = getStudentStreakStats(s.id);
      return {
        ...safe,
        streak,
      };
    });
  res.json({ students });
});

router.post('/students', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { studentCode, displayName, className, notes, password } = req.body;
  if (!studentCode || !displayName) {
    res.status(400).json({ error: 'Vui lòng nhập mã học sinh và họ tên.' });
    return;
  }

  const data = db.getData();
  const exists = data.profiles.find(
    (p) => p.studentCode?.toLowerCase() === studentCode.trim().toLowerCase()
  );
  if (exists) {
    res.status(400).json({ error: 'Mã học sinh đã tồn tại trong danh sách.' });
    return;
  }

  const newStudent: UserProfile & { passwordHash?: string } = {
    id: 'student-' + crypto.randomUUID(),
    studentCode: studentCode.trim().toUpperCase(),
    username: studentCode.trim().toLowerCase(),
    displayName: displayName.trim(),
    className: className?.trim() || '12A1',
    notes: notes?.trim() || '',
    role: 'student',
    status: 'active',
    createdAt: new Date().toISOString(),
    passwordHash: hashSecret(password || '123456'),
  };

  data.profiles.push(newStudent);
  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'THÊM_HỌC_SINH',
    'student',
    newStudent.id,
    `Thêm học sinh ${newStudent.displayName} (${newStudent.studentCode})`
  );
  db.save();

  const { passwordHash, ...safe } = newStudent as any;
  res.json({ student: safe });
});

router.put('/students/:id', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { displayName, className, notes, studentCode } = req.body;

  const data = db.getData();
  const student = data.profiles.find((p) => p.id === id && p.role === 'student');
  if (!student) {
    res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    return;
  }

  if (displayName) student.displayName = displayName.trim();
  if (className) student.className = className.trim();
  if (notes !== undefined) student.notes = notes.trim();
  if (studentCode) student.studentCode = studentCode.trim().toUpperCase();

  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'SỬA_HỌC_SINH',
    'student',
    id,
    `Cập nhật thông tin học sinh ${student.displayName}`
  );
  db.save();

  const { passwordHash, ...safe } = student as any;
  res.json({ student: safe });
});

router.patch('/students/:id/status', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'suspended') {
    res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    return;
  }

  const data = db.getData();
  const student = data.profiles.find((p) => p.id === id && p.role === 'student');
  if (!student) {
    res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    return;
  }

  student.status = status;
  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'ĐỔI_TRẠNG_THÁI_HỌC_SINH',
    'student',
    id,
    `Chuyển trạng thái học sinh ${student.displayName} thành ${status}`
  );
  db.save();

  res.json({ success: true, status });
});

// Delete student permanently
router.delete('/students/:id', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const data = db.getData();
  const index = data.profiles.findIndex((p) => p.id === id && p.role === 'student');
  if (index === -1) {
    res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    return;
  }

  const studentName = data.profiles[index].displayName;
  // Permanently remove student from database
  data.profiles.splice(index, 1);

  // Clean up student's submissions and streak exceptions
  data.submissions = data.submissions.filter((s) => s.studentId !== id);
  data.streakExceptions = data.streakExceptions.filter((e) => e.studentId !== id);

  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'XÓA_HỌC_SINH',
    'student',
    id,
    `Xóa vĩnh viễn học sinh ${studentName}`
  );
  db.save();

  res.json({ success: true, message: `Đã xóa học sinh ${studentName} khỏi danh sách` });
});

// Reset student password
router.post('/students/:id/reset-password', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const pass = newPassword || '123456';

  const data = db.getData();
  const student = data.profiles.find((p) => p.id === id && p.role === 'student');
  if (!student) {
    res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    return;
  }

  student.passwordHash = hashSecret(pass);
  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'ĐẶT_LẠI_MẬT_KHẨU',
    'student',
    id,
    `Đặt lại mật khẩu cho học sinh ${student.displayName}`
  );
  db.save();

  res.json({ success: true, message: `Đã đặt lại mật khẩu cho ${student.displayName}.` });
});

// Streak Exception (Teacher gives exemption for excused absence / illness)
router.post('/students/:id/streak-exception', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { date, reason } = req.body;

  if (!date || !reason) {
    res.status(400).json({ error: 'Vui lòng chọn ngày và ghi rõ lý do miễn/cộng chuỗi.' });
    return;
  }

  const data = db.getData();
  const student = data.profiles.find((p) => p.id === id && p.role === 'student');
  if (!student) {
    res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    return;
  }

  data.streakExceptions.push({
    studentId: id,
    date,
    reason: reason.trim(),
    grantedBy: req.user!.id,
    timestamp: new Date().toISOString(),
  });

  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'NGOẠI_LỆ_CHUỖI',
    'student',
    id,
    `Thầy cấp ngoại lệ chuỗi ngày ${date} cho ${student.displayName}: ${reason}`
  );
  db.save();

  const newStreak = getStudentStreakStats(id);
  res.json({ success: true, streak: newStreak });
});

// ==========================================
// 4. ASSIGNMENT ROUTES
// ==========================================

router.get('/assignments', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const isTeacher = req.user!.role === 'teacher';
  const studentId = req.user!.id;

  let list = data.assignments;

  if (!isTeacher) {
    // Student only sees published assignments targeted to them
    const student = data.profiles.find((p) => p.id === studentId);
    list = list.filter((a) => {
      if (a.status !== 'published') return false;
      if (a.targetType === 'all') return true;
      if (a.targetType === 'specific' && a.targetStudentIds?.includes(studentId)) return true;
      if (a.targetType === 'class' && student && student.className === a.targetClass) return true;
      return false;
    });
  }

  // Attach submission status
  const result = list.map((a) => {
    if (!isTeacher) {
      const sub = data.submissions.find((s) => s.assignmentId === a.id && s.studentId === studentId);
      return {
        ...a,
        studentSubmission: sub,
      };
    } else {
      // Teacher statistics
      const allSubmissions = data.submissions.filter((s) => s.assignmentId === a.id);
      const gradedCount = allSubmissions.filter((s) => s.status === 'graded').length;
      return {
        ...a,
        submissionCount: allSubmissions.length,
        gradedCount,
      };
    }
  });

  res.json({ assignments: result });
});

router.get('/assignments/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const data = db.getData();
  const assignment = data.assignments.find((a) => a.id === id);

  if (!assignment) {
    res.status(404).json({ error: 'Không tìm thấy bài tập.' });
    return;
  }

  const isTeacher = req.user!.role === 'teacher';
  if (!isTeacher) {
    const student = data.profiles.find((p) => p.id === req.user!.id);
    const hasAccess =
      assignment.status === 'published' &&
      (assignment.targetType === 'all' ||
        (assignment.targetType === 'specific' && assignment.targetStudentIds?.includes(req.user!.id)) ||
        (assignment.targetType === 'class' && student && student.className === assignment.targetClass));

    if (!hasAccess) {
      res.status(403).json({ error: 'Bạn không có quyền xem bài tập này.' });
      return;
    }

    const sub = data.submissions.find((s) => s.assignmentId === id && s.studentId === req.user!.id);
    res.json({ assignment: { ...assignment, studentSubmission: sub } });
    return;
  }

  // Teacher sees all submissions and versions
  const submissions = data.submissions
    .filter((s) => s.assignmentId === id)
    .map((s) => {
      const st = data.profiles.find((p) => p.id === s.studentId);
      const fb = data.feedbacks.find((f) => f.submissionId === s.id);
      return {
        ...s,
        studentName: st?.displayName || 'Học sinh',
        studentCode: st?.studentCode,
        className: st?.className,
        feedback: fb,
      };
    });

  const versions = data.assignmentVersions.filter((v) => v.assignmentId === id);

  res.json({ assignment, submissions, versions });
});

// Create Assignment
router.post('/assignments', requireTeacher, (req: AuthenticatedRequest, res) => {
  const {
    title,
    subject,
    content,
    publishAt,
    dueAt,
    streakRequired,
    targetType,
    targetClass,
    targetStudentIds,
    difficultyLevel,
    categoryTag,
    attachments,
    allowResubmit,
    status,
  } = req.body;

  if (!title || !subject) {
    res.status(400).json({ error: 'Vui lòng nhập tiêu đề bài tập và môn học.' });
    return;
  }

  const data = db.getData();
  const now = new Date().toISOString();

  const newAssignment: Assignment = {
    id: 'assign-' + crypto.randomUUID(),
    title: title.trim(),
    subject: subject.trim(),
    content: (content || '').trim(),
    publishAt: publishAt || now,
    dueAt: dueAt || now,
    streakRequired: streakRequired ?? true,
    createdBy: req.user!.id,
    status: status || 'published',
    targetType: targetType || 'all',
    targetClass,
    targetStudentIds,
    difficultyLevel: difficultyLevel || 'standard',
    categoryTag: categoryTag ? categoryTag.trim() : undefined,
    attachments: attachments || [],
    version: 1,
    allowResubmit: allowResubmit ?? true,
    createdAt: now,
    updatedAt: now,
  };

  data.assignments.unshift(newAssignment);

  // Store initial version snapshot
  data.assignmentVersions.push({
    id: 'ver-' + crypto.randomUUID(),
    assignmentId: newAssignment.id,
    version: 1,
    title: newAssignment.title,
    content: newAssignment.content,
    attachments: newAssignment.attachments,
    changedAt: now,
  });

  // Notify students if published immediately
  if (newAssignment.status === 'published') {
    const studentsToNotify = data.profiles.filter((p) => {
      if (p.role !== 'student' || p.status !== 'active') return false;
      if (newAssignment.targetType === 'all') return true;
      if (newAssignment.targetType === 'specific' && newAssignment.targetStudentIds?.includes(p.id)) return true;
      if (newAssignment.targetType === 'class' && p.className === newAssignment.targetClass) return true;
      return false;
    });

    for (const student of studentsToNotify) {
      data.notifications.unshift({
        id: 'notif-' + crypto.randomUUID(),
        recipientId: student.id,
        title: `Bài tập mới môn ${newAssignment.subject}`,
        message: `${newAssignment.title} (Hạn nộp: ${new Date(newAssignment.dueAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`,
        type: 'new_assignment',
        link: `/assignments/${newAssignment.id}`,
        read: false,
        createdAt: now,
      });
    }
  }

  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'TẠO_BÀI_TẬP',
    'assignment',
    newAssignment.id,
    `Tạo bài tập mới: "${newAssignment.title}" (${newAssignment.subject})`
  );
  db.save();

  res.json({ assignment: newAssignment });
});

// Update Assignment (Creates version snapshot so existing submissions stay intact!)
router.put('/assignments/:id', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const {
    title,
    subject,
    content,
    publishAt,
    dueAt,
    streakRequired,
    targetType,
    targetClass,
    targetStudentIds,
    attachments,
    allowResubmit,
    status,
  } = req.body;

  const data = db.getData();
  const assignment = data.assignments.find((a) => a.id === id);

  if (!assignment) {
    res.status(404).json({ error: 'Không tìm thấy bài tập.' });
    return;
  }

  const now = new Date().toISOString();
  assignment.version += 1;

  if (title) assignment.title = title.trim();
  if (subject) assignment.subject = subject.trim();
  if (content !== undefined) assignment.content = content.trim();
  if (publishAt) assignment.publishAt = publishAt;
  if (dueAt) assignment.dueAt = dueAt;
  if (streakRequired !== undefined) assignment.streakRequired = streakRequired;
  if (targetType) assignment.targetType = targetType;
  if (targetClass !== undefined) assignment.targetClass = targetClass;
  if (targetStudentIds) assignment.targetStudentIds = targetStudentIds;
  if (difficultyLevel !== undefined) assignment.difficultyLevel = difficultyLevel;
  if (categoryTag !== undefined) assignment.categoryTag = categoryTag ? categoryTag.trim() : undefined;
  if (attachments) assignment.attachments = attachments;
  if (allowResubmit !== undefined) assignment.allowResubmit = allowResubmit;
  if (status) assignment.status = status;
  assignment.updatedAt = now;

  // Record version snapshot
  data.assignmentVersions.push({
    id: 'ver-' + crypto.randomUUID(),
    assignmentId: assignment.id,
    version: assignment.version,
    title: assignment.title,
    content: assignment.content,
    attachments: assignment.attachments,
    changedAt: now,
  });

  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'SỬA_BÀI_TẬP',
    'assignment',
    assignment.id,
    `Cập nhật bài tập: "${assignment.title}" (phiên bản v${assignment.version})`
  );
  db.save();

  res.json({ assignment });
});

// Duplicate Assignment
router.post('/assignments/:id/duplicate', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const data = db.getData();
  const original = data.assignments.find((a) => a.id === id);

  if (!original) {
    res.status(404).json({ error: 'Không tìm thấy bài tập gốc.' });
    return;
  }

  const now = new Date().toISOString();
  const cloned: Assignment = {
    ...original,
    id: 'assign-' + crypto.randomUUID(),
    title: `${original.title} (Bản sao)`,
    status: 'draft',
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  data.assignments.unshift(cloned);
  data.assignmentVersions.push({
    id: 'ver-' + crypto.randomUUID(),
    assignmentId: cloned.id,
    version: 1,
    title: cloned.title,
    content: cloned.content,
    attachments: cloned.attachments,
    changedAt: now,
  });

  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'NHÂN_BẢN_BÀI_TẬP',
    'assignment',
    cloned.id,
    `Nhân bản bài tập từ "${original.title}"`
  );
  db.save();

  res.json({ assignment: cloned });
});

// Delete Assignment permanently (Teacher only)
router.delete('/assignments/:id', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const data = db.getData();
  const index = data.assignments.findIndex((a) => a.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Không tìm thấy bài tập.' });
    return;
  }

  const [removed] = data.assignments.splice(index, 1);

  // Remove associated versions and submissions
  data.assignmentVersions = data.assignmentVersions.filter((v) => v.assignmentId !== id);

  const subIdsToRemove = data.submissions.filter((s) => s.assignmentId === id).map((s) => s.id);
  data.submissions = data.submissions.filter((s) => s.assignmentId !== id);
  data.feedbacks = data.feedbacks.filter((f) => !subIdsToRemove.includes(f.submissionId));

  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'XÓA_BÀI_TẬP',
    'assignment',
    id,
    `Xóa vĩnh viễn bài tập "${removed.title}" và toàn bộ dữ liệu bài nộp`
  );
  db.save();

  res.json({ success: true, message: `Đã xóa vĩnh viễn bài tập "${removed.title}".` });
});

// ==========================================
// 5. SUBMISSIONS & GRADING
// ==========================================

// Student submits or resubmits work
router.post('/submissions', requireStudent, (req: AuthenticatedRequest, res) => {
  const { assignmentId, textAnswer, attachments } = req.body;
  const studentId = req.user!.id;

  if (!assignmentId) {
    res.status(400).json({ error: 'Mã bài tập không hợp lệ.' });
    return;
  }

  if (!textAnswer && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: 'Vui lòng nhập câu trả lời hoặc đính kèm ảnh/tệp bài làm.' });
    return;
  }

  const data = db.getData();
  const assignment = data.assignments.find((a) => a.id === assignmentId);

  if (!assignment || assignment.status !== 'published') {
    res.status(400).json({ error: 'Bài tập không tồn tại hoặc đã đóng.' });
    return;
  }

  const existingSub = data.submissions.find((s) => s.assignmentId === assignmentId && s.studentId === studentId);
  if (existingSub && !assignment.allowResubmit) {
    res.status(400).json({ error: 'Bài tập này không cho phép nộp lại sau khi đã nộp.' });
    return;
  }

  const now = new Date();
  const submittedAt = now.toISOString();

  // Check deadline (Vietnamese timezone comparison)
  const isLate = assignment.dueAt ? new Date(submittedAt) > new Date(assignment.dueAt) : false;

  let submission: Submission;

  if (existingSub) {
    // Re-submission
    existingSub.version += 1;
    existingSub.textAnswer = (textAnswer || '').trim();
    existingSub.attachments = attachments || [];
    existingSub.submittedAt = submittedAt;
    existingSub.isLate = isLate;
    existingSub.status = 'submitted';
    submission = existingSub;
  } else {
    submission = {
      id: 'sub-' + crypto.randomUUID(),
      assignmentId,
      studentId,
      version: 1,
      textAnswer: (textAnswer || '').trim(),
      attachments: attachments || [],
      submittedAt,
      isLate,
      status: 'submitted',
    };
    data.submissions.push(submission);
  }

  // Notify Teacher of submission
  const teacher = data.profiles.find((p) => p.role === 'teacher');
  if (teacher) {
    data.notifications.unshift({
      id: 'notif-' + crypto.randomUUID(),
      recipientId: teacher.id,
      title: `Học sinh nộp bài: ${req.user!.displayName}`,
      message: `${req.user!.displayName} vừa nộp bài cho "${assignment.title}" (${isLate ? 'Nộp muộn' : 'Đúng hạn'})`,
      type: 'new_assignment',
      link: `/assignments/${assignment.id}`,
      read: false,
      createdAt: submittedAt,
    });
  }

  db.save();

  // Recalculate streak for student response
  const updatedStreak = getStudentStreakStats(studentId);

  res.json({
    success: true,
    submission,
    isLate,
    streak: updatedStreak,
    message: isLate
      ? 'Đã nộp bài thành công (Bài nộp sau hạn).'
      : 'Chúc mừng em đã hoàn thành bài tập và giữ vững ngọn lửa học tập!',
  });
});

// Teacher Grades and gives feedback
router.post('/submissions/:id/grade', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { score, comment } = req.body;

  if (score === undefined || score < 0 || score > 10) {
    res.status(400).json({ error: 'Điểm số phải từ 0 đến 10.' });
    return;
  }

  const data = db.getData();
  const submission = data.submissions.find((s) => s.id === id);

  if (!submission) {
    res.status(404).json({ error: 'Không tìm thấy bài nộp.' });
    return;
  }

  const assignment = data.assignments.find((a) => a.id === submission.assignmentId);
  const now = new Date().toISOString();

  let feedback = data.feedbacks.find((f) => f.submissionId === id);
  if (feedback) {
    feedback.score = Number(score);
    feedback.comment = (comment || '').trim();
    feedback.returnedAt = now;
    feedback.teacherId = req.user!.id;
    feedback.teacherName = req.user!.displayName;
  } else {
    feedback = {
      id: 'fb-' + crypto.randomUUID(),
      submissionId: id,
      teacherId: req.user!.id,
      teacherName: req.user!.displayName,
      score: Number(score),
      comment: (comment || '').trim(),
      returnedAt: now,
    };
    data.feedbacks.push(feedback);
  }

  submission.status = 'graded';

  // Notify student
  data.notifications.unshift({
    id: 'notif-' + crypto.randomUUID(),
    recipientId: submission.studentId,
    title: `Thầy Quang Hưng đã chấm bài: ${assignment?.title || 'Bài tập'}`,
    message: `Điểm số: ${feedback.score}/10. Nhận xét: "${feedback.comment || 'Làm tốt lắm!'}"`,
    type: 'graded',
    link: `/assignments/${submission.assignmentId}`,
    read: false,
    createdAt: now,
  });

  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'CHẤM_BÀI',
    'submission',
    id,
    `Chấm bài tập cho học sinh: ${feedback.score}đ - ${assignment?.title}`
  );
  db.save();

  res.json({ success: true, feedback, submission });
});

// ==========================================
// 6. CALENDAR & STREAK ROUTES
// ==========================================

router.get('/calendar', requireAuth, (req: AuthenticatedRequest, res) => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const isTeacher = req.user!.role === 'teacher';

  let studentId = req.user!.id;
  if (isTeacher && req.query.studentId) {
    studentId = req.query.studentId as string;
  }

  const details = getCalendarMonthDetails(studentId, year, month);
  const stats = getStudentStreakStats(studentId);

  res.json({ details, stats });
});

// ==========================================
// 7. NOTIFICATIONS
// ==========================================

router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const list = data.notifications.filter((n) => n.recipientId === req.user!.id);
  res.json({ notifications: list.slice(0, 50) });
});

router.patch('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const data = db.getData();
  const notif = data.notifications.find((n) => n.id === id && n.recipientId === req.user!.id);
  if (notif) {
    notif.read = true;
    db.save();
  }
  res.json({ success: true });
});

router.post('/notifications/mark-all-read', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  for (const n of data.notifications) {
    if (n.recipientId === req.user!.id) {
      n.read = true;
    }
  }
  db.save();
  res.json({ success: true });
});

// ==========================================
// 8. TEACHER DASHBOARD STATS & SETTINGS
// ==========================================

router.get('/stats/teacher', requireTeacher, (req, res) => {
  const data = db.getData();
  const todayVN = getVietnamDateString(new Date());

  const totalStudents = data.profiles.filter((p) => p.role === 'student' && p.status === 'active').length;
  const pendingSubmissions = data.submissions.filter((s) => s.status === 'submitted').length;
  const submittedToday = data.submissions.filter((s) => s.submittedAt.startsWith(todayVN)).length;

  // Active assignments today
  const activeAssignments = data.assignments.filter((a) => a.status === 'published');

  res.json({
    totalStudents,
    pendingSubmissions,
    submittedToday,
    activeAssignmentsCount: activeAssignments.length,
    recentSubmissions: data.submissions
      .slice(-10)
      .reverse()
      .map((s) => {
        const student = data.profiles.find((p) => p.id === s.studentId);
        const assign = data.assignments.find((a) => a.id === s.assignmentId);
        return {
          ...s,
          studentName: student?.displayName,
          studentCode: student?.studentCode,
          assignmentTitle: assign?.title,
          subject: assign?.subject,
        };
      }),
  });
});

router.get('/settings', requireTeacher, (req, res) => {
  const data = db.getData();
  res.json({
    settings: {
      allowResubmissionDefault: data.settings.allowResubmissionDefault,
      maxFilesPerSubmission: data.settings.maxFilesPerSubmission,
      maxFileSizeMb: data.settings.maxFileSizeMb,
      notificationsEnabled: data.settings.notificationsEnabled,
    },
  });
});

router.put('/settings', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { newPin, newPassword, allowResubmissionDefault, maxFileSizeMb } = req.body;
  const data = db.getData();
  const teacher = data.profiles.find((p) => p.id === req.user!.id);

  if (newPin) {
    if (newPin.trim().length < 4) {
      res.status(400).json({ error: 'Mã PIN phải có ít nhất 4 ký tự.' });
      return;
    }
    const pinHash = hashSecret(newPin.trim());
    data.settings.pinHash = pinHash;
    if (teacher) teacher.pinHash = pinHash;
  }

  if (newPassword) {
    if (newPassword.trim().length < 6) {
      res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return;
    }
    const passHash = hashSecret(newPassword.trim());
    data.settings.teacherPasswordHash = passHash;
    if (teacher) teacher.passwordHash = passHash;
  }

  if (allowResubmissionDefault !== undefined) {
    data.settings.allowResubmissionDefault = allowResubmissionDefault;
  }
  if (maxFileSizeMb !== undefined) {
    data.settings.maxFileSizeMb = maxFileSizeMb;
  }

  db.logAudit(
    req.user!.id,
    req.user!.displayName,
    'CẬP_NHẬT_CÀI_ĐẶT',
    'settings',
    'settings',
    'Cập nhật cài đặt bảo mật và hệ thống'
  );
  db.save();

  res.json({ success: true, message: 'Đã lưu cài đặt thành công.' });
});

// Download backup JSON
router.get('/settings/backup', requireTeacher, (req, res) => {
  const data = db.getData();
  // Strip password/PIN hashes for extra safety or keep them for restore
  res.setHeader('Content-Disposition', `attachment; filename=quang_hung_backup_${Date.now()}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

// Restore backup JSON
router.post('/settings/restore', requireTeacher, (req: AuthenticatedRequest, res) => {
  const { backupData } = req.body;
  if (!backupData || !backupData.profiles || !backupData.assignments) {
    res.status(400).json({ error: 'Tệp sao lưu không đúng định dạng Quang Hưng.' });
    return;
  }
  db.restoreBackup(backupData);
  db.logAudit(req.user!.id, req.user!.displayName, 'KHÔI_PHỤC_SAO_LƯU', 'system', 'system', 'Khôi phục dữ liệu từ file backup');
  res.json({ success: true, message: 'Đã khôi phục dữ liệu thành công.' });
});

// Reset demo data
router.post('/settings/reset', requireTeacher, (req: AuthenticatedRequest, res) => {
  db.resetData();
  db.logAudit(req.user!.id, req.user!.displayName, 'ĐẶT_LẠI_HỆ_THỐNG', 'system', 'system', 'Khởi tạo lại dữ liệu demo');
  res.json({ success: true, message: 'Đã thiết lập lại dữ liệu ban đầu.' });
});

// Audit logs
router.get('/audit-logs', requireTeacher, (req, res) => {
  const data = db.getData();
  res.json({ auditLogs: data.auditLogs.slice(0, 100) });
});

export default router;
