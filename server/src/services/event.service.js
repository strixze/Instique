import Event from '../models/Event.js';
import EventGalleryPhoto from '../models/EventGalleryPhoto.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { uploadFileOnCloudinary, deleteFileFromCloudinary, deleteMultipleFilesFromCloudinary } from './cloudinary.service.js';

export const createEvent = async (schoolId, data, userId) => {
  const event = await Event.create({
    ...data,
    schoolId,
    createdBy: userId,
  });
  return event;
};

export const getEvents = async (schoolId, options = {}) => {
  const {
    type,
    status,
    audience,
    timeframe,
    startDateFrom,
    startDateTo,
    search,
    ...paginateOptions
  } = options;

  const filter = { schoolId };

  if (type && type !== 'all') {
    filter.type = type;
  } else {
    filter.type = { $ne: 'ptm' };
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (audience && audience !== 'all') {
    filter.audience = { $in: [audience, 'all'] };
  }

  const now = new Date();
  if (timeframe === 'upcoming') {
    filter.startDate = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
  } else if (timeframe === 'past') {
    filter.startDate = { $lt: new Date(now.setHours(0, 0, 0, 0)) };
  } else if (timeframe === 'today') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    filter.startDate = { $gte: startOfDay, $lte: endOfDay };
  }

  if (startDateFrom || startDateTo) {
    filter.startDate = filter.startDate || {};
    if (startDateFrom) filter.startDate.$gte = new Date(startDateFrom);
    if (startDateTo) filter.startDate.$lte = new Date(startDateTo);
  }

  return paginate(Event, filter, {
    ...paginateOptions,
    search,
    searchFields: ['title', 'location', 'description'],
    sort: paginateOptions.sort || '-startDate',
    populate: [
      { path: 'targetClasses', select: 'name grade' },
      { path: 'createdBy', select: 'firstName lastName email role' },
    ],
  });
};

export const getEventById = async (id, schoolId) => {
  const event = await Event.findOne({ _id: id, schoolId })
    .populate('targetClasses', 'name grade')
    .populate('createdBy', 'firstName lastName email role');

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Also fetch up to 12 recent photos for preview
  const recentPhotos = await EventGalleryPhoto.find({ schoolId, eventId: id })
    .sort({ createdAt: -1 })
    .limit(12);

  return {
    ...event.toObject(),
    recentPhotos,
  };
};

export const updateEvent = async (id, schoolId, data) => {
  const event = await Event.findOneAndUpdate(
    { _id: id, schoolId },
    { $set: data },
    { new: true, runValidators: true }
  )
    .populate('targetClasses', 'name grade')
    .populate('createdBy', 'firstName lastName email role');

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }
  return event;
};

export const deleteEvent = async (id, schoolId) => {
  const event = await Event.findOne({ _id: id, schoolId });
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // 1. Fetch all gallery photos to delete from Cloudinary
  const photos = await EventGalleryPhoto.find({ schoolId, eventId: id });
  const publicIds = photos.map((p) => p.publicId).filter(Boolean);

  if (event.coverImage?.publicId) {
    publicIds.push(event.coverImage.publicId);
  }

  // 2. Batch delete assets from Cloudinary
  if (publicIds.length > 0) {
    await deleteMultipleFilesFromCloudinary(publicIds);
  }

  // 3. Delete photo records from DB
  await EventGalleryPhoto.deleteMany({ schoolId, eventId: id });

  // 4. Delete the event
  await Event.deleteOne({ _id: id, schoolId });

  return true;
};

export const getCalendar = async (schoolId, month, year) => {
  let start, end;
  if (month && year) {
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0, 23, 59, 59, 999);
  } else {
    const currentYear = new Date().getFullYear();
    start = new Date(currentYear, 0, 1);
    end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
  }

  const events = await Event.find({
    schoolId,
    startDate: { $gte: start, $lte: end },
  })
    .sort('startDate')
    .populate('targetClasses', 'name grade');

  return events;
};

// ==========================================
// EVENT GALLERY PHOTO SERVICES
// ==========================================

export const uploadEventPhotos = async (schoolId, eventId, files = [], userId) => {
  const event = await Event.findOne({ _id: eventId, schoolId });
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (!files || files.length === 0) {
    throw new ApiError(400, 'No photos provided for upload');
  }

  const uploadedRecords = [];
  const errors = [];

  for (const file of files) {
    try {
      const uploadResult = await uploadFileOnCloudinary(file.path, {
        folder: `instique/schools/${schoolId}/events/${eventId}`,
        resource_type: 'image',
        eventId,
      });

      if (!uploadResult || !uploadResult.secure_url) {
        errors.push({ file: file.originalname, error: uploadResult?.message || 'Upload failed' });
        continue;
      }

      const photoDoc = await EventGalleryPhoto.create({
        schoolId,
        eventId,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        uploadedBy: userId,
      });

      uploadedRecords.push(photoDoc);
    } catch (err) {
      console.error(`Error processing file ${file.originalname}:`, err);
      errors.push({ file: file.originalname, error: err.message });
    }
  }

  if (uploadedRecords.length === 0 && errors.length > 0) {
    throw new ApiError(500, `Failed to upload photos: ${errors.map(e => e.error).join(', ')}`);
  }

  if (uploadedRecords.length > 0) {
    const totalCount = await EventGalleryPhoto.countDocuments({ schoolId, eventId });
    const updatePayload = { photoCount: totalCount };

    // If event has no cover image yet, set the first uploaded photo as cover image
    if (!event.coverImage?.url && uploadedRecords[0]) {
      updatePayload.coverImage = {
        url: uploadedRecords[0].url,
        publicId: uploadedRecords[0].publicId,
      };
    }

    await Event.updateOne({ _id: eventId, schoolId }, { $set: updatePayload });
  }

  return {
    photos: uploadedRecords,
    uploadedCount: uploadedRecords.length,
    errors,
  };
};

export const getEventPhotos = async (schoolId, eventId, options = {}) => {
  const event = await Event.findOne({ _id: eventId, schoolId });
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  return paginate(EventGalleryPhoto, { schoolId, eventId }, {
    ...options,
    sort: options.sort || '-createdAt',
    populate: [{ path: 'uploadedBy', select: 'firstName lastName email' }],
  });
};

export const deleteEventPhoto = async (schoolId, eventId, photoId) => {
  const photo = await EventGalleryPhoto.findOne({ _id: photoId, schoolId, eventId });
  if (!photo) {
    throw new ApiError(404, 'Gallery photo not found');
  }

  // 1. Delete from Cloudinary
  if (photo.publicId) {
    await deleteFileFromCloudinary(photo.publicId);
  }

  // 2. Delete from DB
  await EventGalleryPhoto.deleteOne({ _id: photoId, schoolId, eventId });

  // 3. Update photo count on Event
  const remainingCount = await EventGalleryPhoto.countDocuments({ schoolId, eventId });
  const event = await Event.findOne({ _id: eventId, schoolId });

  let updatePayload = { photoCount: remainingCount };
  if (event && event.coverImage?.publicId === photo.publicId) {
    const nextPhoto = await EventGalleryPhoto.findOne({ schoolId, eventId }).sort('-createdAt');
    updatePayload.coverImage = nextPhoto
      ? { url: nextPhoto.url, publicId: nextPhoto.publicId }
      : { url: '', publicId: '' };
  }

  await Event.updateOne({ _id: eventId, schoolId }, { $set: updatePayload });

  return true;
};

export const updatePhotoCaption = async (schoolId, eventId, photoId, caption) => {
  const photo = await EventGalleryPhoto.findOneAndUpdate(
    { _id: photoId, schoolId, eventId },
    { $set: { caption } },
    { new: true }
  ).populate('uploadedBy', 'firstName lastName email');

  if (!photo) {
    throw new ApiError(404, 'Gallery photo not found');
  }

  return photo;
};

export const setEventCoverPhoto = async (schoolId, eventId, photoId) => {
  const photo = await EventGalleryPhoto.findOne({ _id: photoId, schoolId, eventId });
  if (!photo) {
    throw new ApiError(404, 'Gallery photo not found');
  }

  const event = await Event.findOneAndUpdate(
    { _id: eventId, schoolId },
    { $set: { coverImage: { url: photo.url, publicId: photo.publicId } } },
    { new: true }
  );

  return event;
};
