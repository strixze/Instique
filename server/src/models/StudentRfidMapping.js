import mongoose from 'mongoose';

const studentRfidMappingSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  rfidTag: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

studentRfidMappingSchema.index({ schoolId: 1, rfidTag: 1 }, { unique: true });
studentRfidMappingSchema.index({ schoolId: 1, student: 1 });

export default mongoose.model('StudentRfidMapping', studentRfidMappingSchema);
