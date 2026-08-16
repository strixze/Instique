import mongoose from 'mongoose';

const galleryPhotoSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'GalleryAlbum', required: true },
  fileUrl: { type: String, required: true },
  secure_url: { type: String, default: '' },
  public_id: { type: String, default: '' },
  fileName: { type: String },
  mimeType: { type: String },
  fileSize: { type: Number },
  caption: { type: String, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

galleryPhotoSchema.index({ schoolId: 1, albumId: 1, createdAt: -1 });

export default mongoose.model('GalleryPhoto', galleryPhotoSchema);
