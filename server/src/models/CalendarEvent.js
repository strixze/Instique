import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: [
      'holiday', 'exam', 'event', 'ptm', 'sports_day', 'annual_day', 'deadline',
      'academic', 'sports', 'cultural', 'competition', 'workshop', 'seminar',
      'celebration', 'school_trip', 'other'
    ],
    default: 'event',
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  startTime: { type: String, default: '09:00 AM' },
  endTime: { type: String, default: '01:00 PM' },
  isFullDay: { type: Boolean, default: false },
  location: { type: String, default: '' },
  organizer: { type: String, default: '' },
  audience: [{ type: String }],
  audienceScope: { type: String, enum: ['entire_school', 'specific_classes'], default: 'entire_school' },
  status: { type: String, enum: ['draft', 'published', 'scheduled', 'cancelled'], default: 'published' },
  color: String,
  targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

calendarEventSchema.index({ schoolId: 1, startDate: 1 });
calendarEventSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model('CalendarEvent', calendarEventSchema);
