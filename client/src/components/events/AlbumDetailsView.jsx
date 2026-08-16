import { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, Edit3, Trash2, Image as ImageIcon, Calendar,
  ExternalLink, Eye, CheckCircle2, Download
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { galleryApi } from '../../api/gallery.api';
import PhotoLightbox from './PhotoLightbox';
import UploadPhotosModal from './UploadPhotosModal';
import CreateAlbumModal from './CreateAlbumModal';

export default function AlbumDetailsView({ albumId, onBack, isSchoolAdmin = false }) {
  const [loading, setLoading] = useState(true);
  const [albumData, setAlbumData] = useState(null);
  const [photos, setPhotos] = useState([]);

  // Modals State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const fetchAlbumDetails = () => {
    setLoading(true);
    galleryApi.getAlbumById(albumId)
      .then((res) => {
        const data = res.data;
        setAlbumData(data.album);
        setPhotos(data.photos || []);
      })
      .catch((e) => {
        toast.error(e?.message || 'Failed to load album details');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (albumId) fetchAlbumDetails();
  }, [albumId]);

  const handleDeleteAlbum = () => {
    Swal.fire({
      title: 'Delete Album?',
      text: `Are you sure you want to delete "${albumData?.title}" and all its ${photos.length} photos? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Album',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await galleryApi.deleteAlbum(albumId);
        toast.success('Album deleted successfully');
        onBack();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete album');
      }
    });
  };

  const handleDeleteSinglePhoto = async (photo) => {
    Swal.fire({
      title: 'Delete Photo?',
      text: 'Remove this photo from the album?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Photo',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await galleryApi.deletePhoto(photo._id);
        toast.success('Photo deleted');
        if (lightboxIndex !== null && photos.length <= 1) {
          setLightboxIndex(null);
        }
        fetchAlbumDetails();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete photo');
      }
    });
  };

  const handleSetCoverPhoto = async (photo) => {
    try {
      await galleryApi.setPhotoAsCover(albumId, photo._id);
      toast.success('Album cover image updated');
      fetchAlbumDetails();
    } catch (e) {
      toast.error(e?.message || 'Failed to set cover image');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-bold text-deep">Album not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4 text-xs">
          ← Back to Gallery
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline cursor-pointer"
      >
        <ArrowLeft size={15} /> Back to Gallery
      </button>

      {/* Album Information Banner */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">{albumData.title}</h1>
              {albumData.event && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-forest-soft text-forest font-semibold flex items-center gap-1">
                  <Calendar size={12} /> Event: {albumData.event?.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted">
              <span>{albumData.date ? new Date(albumData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
              <span>•</span>
              <span className="font-bold text-deep">{photos.length} Photos</span>
            </div>

            {albumData.description && (
              <p className="text-xs text-secondary leading-relaxed pt-1">
                {albumData.description}
              </p>
            )}
          </div>

          {/* Album Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isSchoolAdmin && (
              <>
                <Button
                  onClick={() => setUploadModalOpen(true)}
                  className="bg-forest text-white text-xs py-2 flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={15} /> Add Photos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(true)}
                  className="text-xs py-2"
                >
                  <Edit3 size={14} />
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteAlbum}
                  className="text-xs py-2"
                >
                  <Trash2 size={14} />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Photos Grid Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-deep uppercase tracking-wider">
          Album Photos ({photos.length})
        </h2>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <ImageIcon size={36} className="mx-auto text-muted mb-2 opacity-40" />
          <p className="text-sm font-bold text-deep">No photos in this album yet</p>
          <p className="text-xs text-muted mt-1">Upload event photos to build this memory gallery.</p>
          {isSchoolAdmin && (
            <Button onClick={() => setUploadModalOpen(true)} className="mt-4 text-xs bg-forest text-white">
              <Plus size={14} className="mr-1" /> Add Photos
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo, index) => {
            const photoUrl = photo.secure_url || photo.fileUrl;
            const isCover = albumData.coverImage === photoUrl || albumData.coverImage === photo.fileUrl;
            return (
              <div
                key={photo._id}
                className="group relative aspect-4/3 bg-surface rounded-xl border border-border overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={photoUrl}
                  alt={photo.caption || photo.fileName || 'Event photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Cover Badge */}
                {isCover && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-forest text-white text-[10px] font-bold shadow-xs">
                    Cover
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-xs">
                    <Eye size={16} />
                  </div>
                  {isSchoolAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSinglePhoto(photo);
                      }}
                      className="w-8 h-8 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white flex items-center justify-center shadow-xs"
                      title="Delete Photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        photos={photos}
        currentIndex={lightboxIndex || 0}
        onIndexChange={(idx) => setLightboxIndex(idx)}
        onDeletePhoto={handleDeleteSinglePhoto}
        onSetCover={handleSetCoverPhoto}
        currentCoverUrl={albumData.coverImage}
        isSchoolAdmin={isSchoolAdmin}
      />

      {/* Upload Photos Modal */}
      <UploadPhotosModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        album={albumData}
        onSuccess={fetchAlbumDetails}
      />

      {/* Edit Album Modal */}
      <CreateAlbumModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        albumToEdit={albumData}
        onSuccess={fetchAlbumDetails}
      />
    </div>
  );
}
