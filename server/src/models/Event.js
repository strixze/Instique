import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true,
    index: true,
  },
  title: { 
    type: String, 
    required: [true, 'Event title is required'], 
    trim: true,
    maxlength: 200,
  },
  description: { 
    type: String, 
    trim: true,
    default: '',
  },
  type: {
    type: String,
    enum: [
      'cultural',
      'sports',
      'academic',
      'annual_day',
      'sports_day',
      'holiday',
      'exam',
      'ptm',
      'workshop',
      'celebration',
      'competition',
      'deadline',
      'event',
      'other',
    ],
    default: 'event',
    required: true,
  },
  startDate: { 
    type: Date, 
    required: [true, 'Start date is required'],
  },
  endDate: { 
    type: Date,
  },
  isFullDay: { 
    type: Boolean, 
    default: true,
  },
  startTime: { 
    type: String, 
    trim: true,
  },
  endTime: { 
    type: String, 
    trim: true,
  },
  location: { 
    type: String, 
    trim: true, 
    default: '',
  },
  audience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'classes'],
    default: 'all',
  },
  targetClasses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SchoolClass',
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  coverImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  color: { 
    type: String, 
    default: '#10b981',
  },
  photoCount: {
    type: Number,
    default: 0,
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
}, { timestamps: true });

eventSchema.index({ schoolId: 1, startDate: 1 });
eventSchema.index({ schoolId: 1, status: 1 });
eventSchema.index({ schoolId: 1, type: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
