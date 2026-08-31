import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'attendance', 'homework', 'fee_reminder', 'leave_update', 'exam',
      'event', 'notice', 'complaint', 'recognition', 'meeting', 'admission', 'bulk',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ schoolId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
