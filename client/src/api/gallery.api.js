import api from './axios';

export const galleryApi = {
  getAlbums: (params) => api.get('/gallery/albums', { params }),
  getAlbumById: (id) => api.get(`/gallery/albums/${id}`),
  createAlbum: (data) => api.post('/gallery/albums', data),
  updateAlbum: (id, data) => api.put(`/gallery/albums/${id}`, data),
  deleteAlbum: (id) => api.delete(`/gallery/albums/${id}`),
  uploadPhotos: (albumId, formData, onUploadProgress) =>
    api.post(`/gallery/albums/${albumId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  deletePhoto: (photoId) => api.delete(`/gallery/photos/${photoId}`),
  setPhotoAsCover: (albumId, photoId) => api.put(`/gallery/albums/${albumId}/photos/${photoId}/cover`),
  getAlbumByEvent: (eventId) => api.get(`/gallery/event/${eventId}`),
};
