import mongoose from 'mongoose';

const termSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
}, { _id: false });

const gradeSchema = new mongoose.Schema({
  grade: { type: String, required: true },
  minPercent: { type: Number, required: true },
  maxPercent: { type: Number, required: true },
  points: { type: Number, default: 0 },
  status: { type: String, default: 'Pass' },
}, { _id: false });

const leaveTypeSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  isPaid: { type: Boolean, default: true },
  maxDaysPerYear: { type: Number, default: 12 },
}, { _id: false });

const recognitionCategorySchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  points: { type: Number, required: true },
}, { _id: false });

const documentTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isMandatory: { type: Boolean, default: false },
  appliesTo: { type: String, enum: ['student', 'teacher', 'all'], default: 'student' },
}, { _id: false });

const settingSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, unique: true },

  // 1. General School Information
  general: {
    schoolName: { type: String, default: '' },
    schoolCode: { type: String, default: '' },
    principalName: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
      zip: { type: String, default: '' },
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timeFormat: { type: String, default: '12h' },
  },

  // 2. School Timings & Schedule
  timings: {
    schoolStartTime: { type: String, default: '08:00' },
    schoolEndTime: { type: String, default: '14:30' },
    periodDurationMinutes: { type: Number, default: 45 },
    breakDurationMinutes: { type: Number, default: 15 },
    lunchDurationMinutes: { type: Number, default: 30 },
    periodsPerDay: { type: Number, default: 8 },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
  },

  // 3. Academics & Terms
  academic: {
    currentAcademicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
    terms: { type: [termSchema], default: [] },
    gradingScale: {
      type: [gradeSchema],
      default: () => [
        { grade: 'A+', minPercent: 90, maxPercent: 100, points: 4.0, status: 'Distinction' },
        { grade: 'A', minPercent: 80, maxPercent: 89, points: 3.7, status: 'First Class' },
        { grade: 'B+', minPercent: 70, maxPercent: 79, points: 3.3, status: 'Second Class' },
        { grade: 'B', minPercent: 60, maxPercent: 69, points: 3.0, status: 'Average' },
        { grade: 'C', minPercent: 50, maxPercent: 59, points: 2.0, status: 'Below Average' },
        { grade: 'D', minPercent: 40, maxPercent: 49, points: 1.0, status: 'Pass' },
        { grade: 'F', minPercent: 0, maxPercent: 39, points: 0, status: 'Fail' },
      ],
    },
    passingMarksPercent: { type: Number, default: 40 },
    maxSubjectsPerTeacher: { type: Number, default: 5 },
    maxPeriodsPerDay: { type: Number, default: 8 },
  },

  // 4. Attendance Rules & Thresholds
  attendance: {
    minAttendancePercentage: { type: Number, default: 75 },
    lateThresholdMinutes: { type: Number, default: 15 },
    allowedStatuses: {
      type: [String],
      default: ['present', 'absent', 'late', 'leave', 'holiday'],
    },
    allowTeacherEdit: { type: Boolean, default: true },
    editWindowHours: { type: Number, default: 48 },
  },

  // 5. Leave Policies
  leave: {
    studentLeave: {
      requireParentSubmission: { type: Boolean, default: true },
      approver: { type: String, enum: ['class_teacher', 'school_admin'], default: 'class_teacher' },
      maxConsecutiveDays: { type: Number, default: 15 },
      requireMedicalCertificateDays: { type: Number, default: 3 },
      allowParentCancellation: { type: Boolean, default: true },
    },
    teacherLeave: {
      approver: { type: String, enum: ['school_admin', 'principal'], default: 'school_admin' },
      requireSubstituteAssignment: { type: Boolean, default: true },
      maxConsecutiveDays: { type: Number, default: 30 },
      allowTeacherCancellation: { type: Boolean, default: true },
    },
    availableLeaveTypes: {
      type: [leaveTypeSchema],
      default: () => [
        { key: 'casual', label: 'Casual Leave', isPaid: true, maxDaysPerYear: 12 },
        { key: 'sick', label: 'Medical / Sick Leave', isPaid: true, maxDaysPerYear: 10 },
        { key: 'emergency', label: 'Emergency Leave', isPaid: true, maxDaysPerYear: 5 },
        { key: 'duty', label: 'On Duty', isPaid: true, maxDaysPerYear: 15 },
        { key: 'unpaid', label: 'Leave Without Pay', isPaid: false, maxDaysPerYear: 30 },
      ],
    },
  },

  // 6. Fee Rules
  fees: {
    feeFrequency: { type: String, enum: ['monthly', 'quarterly', 'annual'], default: 'monthly' },
    dueDayOfMonth: { type: Number, default: 10 },
    lateFeeEnabled: { type: Boolean, default: true },
    lateFeePerDay: { type: Number, default: 10 },
    lateFeeGraceDays: { type: Number, default: 5 },
    receiptPrefix: { type: String, default: 'REC' },
    receiptNotes: { type: String, default: 'Thank you for your prompt payment.' },
    paymentMethods: {
      type: [String],
      default: ['cash', 'online', 'cheque', 'bank_transfer', 'upi'],
    },
  },

  // 7. Notification Matrix
  notifications: {
    rules: {
      studentAbsent: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: false }, student: { type: Boolean, default: false } },
      leaveRequested: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: true }, student: { type: Boolean, default: false } },
      leaveApproved: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: true }, student: { type: Boolean, default: true } },
      leaveRejected: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: true }, student: { type: Boolean, default: true } },
      homeworkAssigned: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: false }, student: { type: Boolean, default: true } },
      feeDue: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: false }, student: { type: Boolean, default: false } },
      feeOverdue: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: false }, student: { type: Boolean, default: false } },
      examPublished: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: true }, student: { type: Boolean, default: true } },
      noticePublished: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: true }, student: { type: Boolean, default: true } },
      eventPublished: { parent: { type: Boolean, default: true }, teacher: { type: Boolean, default: true }, student: { type: Boolean, default: true } },
    },
  },

  // 8. Access & Visibility
  visibility: {
    parent: {
      attendance: { type: Boolean, default: true },
      homework: { type: Boolean, default: true },
      marks: { type: Boolean, default: true },
      timetable: { type: Boolean, default: true },
      fees: { type: Boolean, default: true },
      leaves: { type: Boolean, default: true },
      recognition: { type: Boolean, default: true },
      documents: { type: Boolean, default: true },
      teacherInfo: { type: Boolean, default: true },
    },
    teacherPolicy: {
      canEditSubmittedAttendance: { type: Boolean, default: true },
      canCreateHomework: { type: Boolean, default: true },
      canPublishMarks: { type: Boolean, default: false },
      canCreateNotices: { type: Boolean, default: true },
      canViewFeeInfo: { type: Boolean, default: false },
    },
  },

  // 9. Communication
  communication: {
    notices: {
      whoCanCreate: { type: String, enum: ['admin_only', 'admin_and_teacher'], default: 'admin_and_teacher' },
      requireApprovalForTeachers: { type: Boolean, default: false },
    },
    complaints: {
      allowedCategories: {
        type: [String],
        default: ['academic', 'facility', 'transport', 'behavior', 'fee', 'other'],
      },
      whoCanSubmit: { type: String, enum: ['parents_and_students', 'parents_only', 'all'], default: 'parents_and_students' },
      autoAssignToAdmin: { type: Boolean, default: true },
    },
    parentMeetings: {
      defaultDurationMinutes: { type: Number, default: 30 },
      advanceBookingDays: { type: Number, default: 7 },
      allowParentCancellation: { type: Boolean, default: true },
    },
  },

  // 10. Recognition & Points
  recognition: {
    enabled: { type: Boolean, default: true },
    categories: {
      type: [recognitionCategorySchema],
      default: () => [
        { key: 'academic', label: 'Academic Excellence', points: 20 },
        { key: 'sports', label: 'Sports Achievement', points: 15 },
        { key: 'leadership', label: 'Leadership', points: 15 },
        { key: 'good_conduct', label: 'Good Conduct', points: 10 },
        { key: 'creativity', label: 'Creativity & Arts', points: 10 },
      ],
    },
    whoCanAward: { type: String, enum: ['teachers', 'admins', 'both'], default: 'both' },
    visibleToParents: { type: Boolean, default: true },
    visibleToStudents: { type: Boolean, default: true },
  },

  // 11. Documents
  documents: {
    allowedFileTypes: { type: [String], default: ['pdf', 'jpg', 'jpeg', 'png'] },
    maxFileSizeMB: { type: Number, default: 5 },
    standardTypes: {
      type: [documentTypeSchema],
      default: () => [
        { name: 'Birth Certificate', isMandatory: true, appliesTo: 'student' },
        { name: 'Transfer Certificate', isMandatory: false, appliesTo: 'student' },
        { name: 'Previous Marksheet', isMandatory: false, appliesTo: 'student' },
        { name: 'Identity Proof (Aadhaar/ID)', isMandatory: true, appliesTo: 'all' },
        { name: 'Educational Degree', isMandatory: true, appliesTo: 'teacher' },
      ],
    },
  },

  // 12. Branding
  branding: {
    logo: { type: String, default: '' },
    primaryColor: { type: String, default: '#059669' },
    secondaryColor: { type: String, default: '#0f172a' },
    reportCardHeader: { type: String, default: '' },
    reportCardFooter: { type: String, default: 'This is a computer-generated grade report.' },
    feeReceiptHeader: { type: String, default: '' },
    feeReceiptFooter: { type: String, default: 'Keep this receipt safe for future reference.' },
  },

  // 13. Features & Modules Toggle
  features: {
    modules: {
      type: Map,
      of: Boolean,
      default: () => new Map([
        ['students', true],
        ['teachers', true],
        ['classes', true],
        ['syllabus', true],
        ['timetable', true],
        ['attendance', true],
        ['homework', true],
        ['exams', true],
        ['marksEntry', true],
        ['leaderboard', true],
        ['admissions', true],
        ['fees', true],
        ['leaves', true],
        ['notices', true],
        ['events', true],
        ['complaints', true],
        ['parentMeetings', true],
        ['reports', true],
        ['recognition', true],
      ]),
    },
  },

  // Legacy compatibility fields (mirrored)
  gradingScale: [{ grade: String, minPercent: Number, maxPercent: Number, points: Number }],
  feeSettings: { dueDayOfMonth: Number, lateFeeEnabled: Boolean, lateFeePerDay: Number, paymentMethods: [String] },
  notificationToggles: { attendance: Boolean, homework: Boolean, fee: Boolean, exam: Boolean, events: Boolean, general: Boolean },
  academicSettings: { maxSubjectsPerTeacher: Number, maxPeriodsPerDay: Number, workingDays: [Number], attendanceThreshold: Number },
  recognitionSettings: { pointValues: [{ category: String, points: Number }] },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Middleware to keep legacy fields in sync before saving
settingSchema.pre('save', function () {
  if (this.academic?.gradingScale) {
    this.gradingScale = this.academic.gradingScale.map((g) => ({
      grade: g.grade,
      minPercent: g.minPercent,
      maxPercent: g.maxPercent,
      points: g.points,
    }));
  }
  if (this.fees) {
    this.feeSettings = {
      dueDayOfMonth: this.fees.dueDayOfMonth,
      lateFeeEnabled: this.fees.lateFeeEnabled,
      lateFeePerDay: this.fees.lateFeePerDay,
      paymentMethods: this.fees.paymentMethods,
    };
  }
  if (this.timings || this.academic || this.attendance) {
    this.academicSettings = {
      maxSubjectsPerTeacher: this.academic?.maxSubjectsPerTeacher ?? 5,
      maxPeriodsPerDay: this.academic?.maxPeriodsPerDay ?? this.timings?.periodsPerDay ?? 8,
      workingDays: this.timings?.workingDays ?? [1, 2, 3, 4, 5, 6],
      attendanceThreshold: this.attendance?.minAttendancePercentage ?? 75,
    };
  }
  if (this.recognition?.categories) {
    this.recognitionSettings = {
      pointValues: this.recognition.categories.map((c) => ({
        category: c.key,
        points: c.points,
      })),
    };
  }
  if (this.notifications?.rules) {
    this.notificationToggles = {
      attendance: !!this.notifications.rules.studentAbsent?.parent,
      homework: !!this.notifications.rules.homeworkAssigned?.student,
      fee: !!this.notifications.rules.feeDue?.parent,
      exam: !!this.notifications.rules.examPublished?.student,
      events: !!this.notifications.rules.eventPublished?.student,
      general: !!this.notifications.rules.noticePublished?.student,
    };
  }
});

export default mongoose.model('Setting', settingSchema);
