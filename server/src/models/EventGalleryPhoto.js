import mongoose from 'mongoose';

const eventGalleryPhotoSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  },
  url: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  publicId: {
    type: String,
    required: [true, 'Cloudinary public_id is required'],
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 300,
    default: '',
  },
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
  format: {
    type: String,
  },
  bytes: {
    type: Number,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

eventGalleryPhotoSchema.index({ schoolId: 1, eventId: 1, createdAt: -1 });

const EventGalleryPhoto = mongoose.model('EventGalleryPhoto', eventGalleryPhotoSchema);

export default EventGalleryPhoto;
