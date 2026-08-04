import mongoose from 'mongoose';

const periodTimingSchema = new mongoose.Schema({
  periodNo: { type: Number, required: true },
  startTime: { type: String, required: true }, // "08:00"
  endTime: { type: String, required: true },   // "08:40"
  type: { type: String, enum: ['teaching', 'lunch', 'break', 'assembly'], default: 'teaching' },
  label: { type: String, trim: true },         // "Lunch Break", "Morning Assembly"
}, { _id: false });

const fixedEventSchema = new mongoose.Schema({
  day: { type: Number, required: true, min: 0, max: 6 },
  periodNo: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
}, { _id: false });

const timetableConfigSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },

  // Working days (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },

  // Period structure
  periodsPerDay: { type: Number, default: 8, min: 1, max: 15 },
  periodTimings: [periodTimingSchema],

  // School hours
  schoolStartTime: { type: String, default: '08:00' },
  schoolEndTime: { type: String, default: '14:30' },

  // Lunch configuration
  lunchBreaks: [{
    afterPeriod: { type: Number, required: true },
    durationMinutes: { type: Number, default: 30 },
    _id: false,
  }],

  // Assembly
  assemblyConfig: {
    enabled: { type: Boolean, default: false },
    periodNo: { type: Number, default: 1 },
    days: { type: [Number], default: [1, 2, 3, 4, 5] },
    durationMinutes: { type: Number, default: 15 },
  },

  // Fixed events (e.g. sports hour, library period)
  fixedEvents: [fixedEventSchema],

  // Default constraints
  defaultTeacherMaxPerDay: { type: Number, default: 6 },
  defaultTeacherMaxPerWeek: { type: Number, default: 30 },
  allowEmptyPeriods: { type: Boolean, default: false },
}, { timestamps: true });

timetableConfigSchema.index({ schoolId: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('TimetableConfig', timetableConfigSchema);
