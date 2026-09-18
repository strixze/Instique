import mongoose from 'mongoose';

const schoolVehicleSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  type: {
    type: String,
    enum: ['van', 'bus', 'car', 'other'],
    default: 'van',
  },
  driverName: {
    type: String,
    trim: true,
  },
  driverPhone: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  notes: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

schoolVehicleSchema.index({ schoolId: 1, vehicleNumber: 1 }, { unique: true });
schoolVehicleSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model('SchoolVehicle', schoolVehicleSchema);
