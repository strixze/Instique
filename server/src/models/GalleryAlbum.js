import mongoose from 'mongoose';

const galleryAlbumSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent', default: null },
  date: { type: Date, default: Date.now },
  coverImage: { type: String, default: '' },
  photoCount: { type: Number, default: 0 },
  audience: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

galleryAlbumSchema.index({ schoolId: 1, date: -1 });
galleryAlbumSchema.index({ schoolId: 1, event: 1 });

export default mongoose.model('GalleryAlbum', galleryAlbumSchema);
