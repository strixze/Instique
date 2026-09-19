import mongoose from 'mongoose';

const gateLogSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  entityType: {
    type: String,
    enum: ['STUDENT', 'VISITOR', 'VEHICLE', 'UNKNOWN_PERSON', 'UNKNOWN_STUDENT'],
    required: true,
  },
  eventType: {
    type: String,
    enum: ['ENTRY', 'EXIT'],
    required: true,
  },
  verificationMethod: {
    type: String,
    enum: ['RFID', 'MANUAL'],
    default: 'MANUAL',
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolVehicle',
  },
  // Fields for visitors, unknown students, or unknown persons
  name: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  purpose: {
    type: String,
    trim: true,
  },
  visitingPersonOrDept: {
    type: String,
    trim: true,
  },
  vehicleNumber: {
    type: String,
    trim: true,
  },
  approximateClass: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  photoUrl: {
    type: String,
    trim: true,
  },
  // Visitor status tracking on entry records to allow quick exit marking
  visitorStatus: {
    type: String,
    enum: ['INSIDE', 'EXITED'],
    default: undefined,
  },
  entryLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GateLog',
  },
  gate: {
    type: String,
    default: 'Main Gate',
    trim: true,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rfidIdentifier: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

gateLogSchema.index({ schoolId: 1, timestamp: -1 });
gateLogSchema.index({ schoolId: 1, entityType: 1, eventType: 1 });
gateLogSchema.index({ schoolId: 1, student: 1, timestamp: -1 });
gateLogSchema.index({ schoolId: 1, vehicle: 1, timestamp: -1 });
gateLogSchema.index({ schoolId: 1, entityType: 1, visitorStatus: 1 });

export default mongoose.model('GateLog', gateLogSchema);
