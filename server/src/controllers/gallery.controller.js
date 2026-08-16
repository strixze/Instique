import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as galleryService from '../services/gallery.service.js';

export const getAlbums = asyncHandler(async (req, res) => {
  const result = await galleryService.getAlbums(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Albums fetched', result.meta));
});

export const createAlbum = asyncHandler(async (req, res) => {
  const album = await galleryService.createAlbum(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, album, 'Album created successfully'));
});

export const getAlbumById = asyncHandler(async (req, res) => {
  const data = await galleryService.getAlbumById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, data, 'Album fetched successfully'));
});

export const updateAlbum = asyncHandler(async (req, res) => {
  const album = await galleryService.updateAlbum(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, album, 'Album updated successfully'));
});

export const deleteAlbum = asyncHandler(async (req, res) => {
  await galleryService.deleteAlbum(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Album deleted successfully'));
});

export const uploadPhotos = asyncHandler(async (req, res) => {
  const result = await galleryService.addPhotosToAlbum(
    req.params.id,
    req.schoolId,
    req.files,
    req.user._id,
    req.body
  );
  res.status(201).json(new ApiResponse(201, result, 'Photos uploaded successfully'));
});

export const deletePhoto = asyncHandler(async (req, res) => {
  const result = await galleryService.deletePhoto(req.params.photoId, req.schoolId);
  res.status(200).json(new ApiResponse(200, result, 'Photo deleted successfully'));
});

export const setPhotoAsCover = asyncHandler(async (req, res) => {
  const album = await galleryService.setPhotoAsCover(req.params.id, req.params.photoId, req.schoolId);
  res.status(200).json(new ApiResponse(200, album, 'Cover image updated successfully'));
});

export const getAlbumByEvent = asyncHandler(async (req, res) => {
  const album = await galleryService.getAlbumByEvent(req.params.eventId, req.schoolId);
  res.status(200).json(new ApiResponse(200, album, 'Event album fetched'));
});
