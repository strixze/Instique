import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true },
  description: String,
  type: {
    type: String,
    enum: ['holiday', 'exam', 'event', 'ptm', 'sports_day', 'annual_day', 'deadline'],
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: Date,
  isFullDay: { type: Boolean, default: true },
  color: String,
  targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

calendarEventSchema.index({ schoolId: 1, startDate: 1 });

export default mongoose.model('CalendarEvent', calendarEventSchema);
