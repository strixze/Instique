import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import GalleryAlbum from '../models/GalleryAlbum.js';
import GalleryPhoto from '../models/GalleryPhoto.js';
import CalendarEvent from '../models/CalendarEvent.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from './cloudinary.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAlbums = async (schoolId, options = {}) => {
  const { page = 1, limit = 12, search, event, sort = '-date' } = options;
  const query = { schoolId };

  if (event && event !== 'all') {
    query.event = event;
  }

  return paginate(
    GalleryAlbum,
    query,
    {
      page,
      limit,
      search,
      searchFields: ['title', 'description'],
      populate: [
        { path: 'event', select: 'title startDate type audience' },
        { path: 'createdBy', select: 'name email role' },
      ],
      sort,
    }
  );
};

export const createAlbum = async (schoolId, data, userId) => {
  let audience = data.audience || [];

  if (data.event) {
    const evDoc = await CalendarEvent.findOne({ _id: data.event, schoolId });
    if (evDoc && evDoc.audience && evDoc.audience.length > 0) {
      audience = evDoc.audience;
    }
  }

  const album = await GalleryAlbum.create({
    ...data,
    schoolId,
    audience,
    createdBy: userId,
  });

  return album;
};

export const getAlbumById = async (id, schoolId) => {
  const album = await GalleryAlbum.findOne({ _id: id, schoolId })
    .populate('event', 'title startDate type audience location')
    .populate('createdBy', 'name email role');

  if (!album) throw new ApiError(404, 'Gallery album not found');

  const photos = await GalleryPhoto.find({ schoolId, albumId: id }).sort('-createdAt');

  return { album, photos };
};

export const updateAlbum = async (id, schoolId, data) => {
  const album = await GalleryAlbum.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!album) throw new ApiError(404, 'Gallery album not found');
  return album;
};

export const deleteAlbum = async (id, schoolId) => {
  const album = await GalleryAlbum.findOne({ _id: id, schoolId });
  if (!album) throw new ApiError(404, 'Gallery album not found');

  const photos = await GalleryPhoto.find({ schoolId, albumId: id });

  for (const photo of photos) {
    // Delete from Cloudinary if public_id exists
    if (photo.public_id) {
      try {
        await deleteFileFromCloudinary(photo.public_id, 'image');
      } catch (e) {
        console.error('Failed to delete Cloudinary file:', photo.public_id, e);
      }
    }
    // Delete local file if present
    if (photo.fileUrl && photo.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../public', photo.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }
  }

  await GalleryPhoto.deleteMany({ schoolId, albumId: id });
  await GalleryAlbum.findOneAndDelete({ _id: id, schoolId });

  return true;
};

export const addPhotosToAlbum = async (albumId, schoolId, files, userId, captions = {}) => {
  const album = await GalleryAlbum.findOne({ _id: albumId, schoolId });
  if (!album) throw new ApiError(404, 'Gallery album not found');

  if (!files || files.length === 0) {
    throw new ApiError(400, 'No image files provided');
  }

  const createdPhotos = [];
  let firstFileUrl = null;

  for (const file of files) {
    let finalUrl = `/uploads/${file.filename}`;
    let secureUrl = '';
    let publicId = '';

    // Upload to Cloudinary if file path exists
    if (file.path && fs.existsSync(file.path)) {
      try {
        const cloudRes = await uploadFileOnCloudinary(file.path, 'image');
        if (cloudRes && cloudRes.success) {
          finalUrl = cloudRes.secure_url;
          secureUrl = cloudRes.secure_url;
          publicId = cloudRes.public_id;
        }
      } catch (err) {
        console.error('Cloudinary upload fallback to local:', err);
      }
    }

    if (!firstFileUrl) firstFileUrl = finalUrl;

    const photo = await GalleryPhoto.create({
      schoolId,
      albumId,
      fileUrl: finalUrl,
      secure_url: secureUrl || finalUrl,
      public_id: publicId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      caption: captions[file.originalname] || '',
      uploadedBy: userId,
    });
    createdPhotos.push(photo);
  }

  const totalCount = await GalleryPhoto.countDocuments({ schoolId, albumId });
  const updatePayload = { photoCount: totalCount };

  if (!album.coverImage && firstFileUrl) {
    updatePayload.coverImage = firstFileUrl;
  }

  const updatedAlbum = await GalleryAlbum.findByIdAndUpdate(albumId, updatePayload, { new: true });

  return { album: updatedAlbum, newPhotos: createdPhotos };
};

export const deletePhoto = async (photoId, schoolId) => {
  const photo = await GalleryPhoto.findOne({ _id: photoId, schoolId });
  if (!photo) throw new ApiError(404, 'Photo not found');

  const albumId = photo.albumId;

  // Delete from Cloudinary if public_id exists
  if (photo.public_id) {
    try {
      await deleteFileFromCloudinary(photo.public_id, 'image');
    } catch (e) {
      console.error('Failed to delete photo from Cloudinary:', photo.public_id, e);
    }
  }

  // Delete local file if present
  if (photo.fileUrl && photo.fileUrl.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '../../public', photo.fileUrl);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
  }

  await GalleryPhoto.findOneAndDelete({ _id: photoId, schoolId });

  const remainingPhotos = await GalleryPhoto.find({ schoolId, albumId }).sort('-createdAt');
  const count = remainingPhotos.length;

  const album = await GalleryAlbum.findOne({ _id: albumId, schoolId });
  let coverImage = album?.coverImage || '';

  if (album && (album.coverImage === photo.fileUrl || album.coverImage === photo.secure_url)) {
    coverImage = remainingPhotos.length > 0 ? (remainingPhotos[0].secure_url || remainingPhotos[0].fileUrl) : '';
  }

  await GalleryAlbum.findByIdAndUpdate(albumId, { photoCount: count, coverImage });

  return { photoId, remainingCount: count };
};

export const setPhotoAsCover = async (albumId, photoId, schoolId) => {
  const photo = await GalleryPhoto.findOne({ _id: photoId, albumId, schoolId });
  if (!photo) throw new ApiError(404, 'Photo not found in this album');

  const coverUrl = photo.secure_url || photo.fileUrl;

  const album = await GalleryAlbum.findOneAndUpdate(
    { _id: albumId, schoolId },
    { coverImage: coverUrl },
    { new: true }
  );

  if (!album) throw new ApiError(404, 'Gallery album not found');
  return album;
};

export const getAlbumByEvent = async (eventId, schoolId) => {
  const album = await GalleryAlbum.findOne({ schoolId, event: eventId })
    .populate('event', 'title startDate type')
    .populate('createdBy', 'name email role');
  return album;
};
