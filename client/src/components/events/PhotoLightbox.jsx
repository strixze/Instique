import { useEffect } from 'react';
import {
  X, ChevronLeft, ChevronRight, Download, Trash2, Image as ImageIcon,
  CheckCircle2, Calendar, User
} from 'lucide-react';
import Button from '../ui/Button';

export default function PhotoLightbox({
  isOpen,
  onClose,
  photos = [],
  currentIndex = 0,
  onIndexChange,
  onDeletePhoto,
  onSetCover,
  currentCoverUrl,
  isSchoolAdmin = false,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onIndexChange(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < photos.length - 1) onIndexChange(currentIndex + 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onIndexChange, onClose]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];
  const activeUrl = currentPhoto?.secure_url || currentPhoto?.fileUrl;
  const isCover = currentCoverUrl && (currentCoverUrl === activeUrl || currentCoverUrl === currentPhoto?.fileUrl);

  const handleDownload = () => {
    if (!activeUrl) return;
    const link = document.createElement('a');
    link.href = activeUrl;
    link.download = currentPhoto.fileName || 'photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col justify-between p-4 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
            {currentIndex + 1} / {photos.length}
          </span>
          {isCover && (
            <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={13} /> Cover Image
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isSchoolAdmin && !isCover && (
            <button
              onClick={() => onSetCover && onSetCover(currentPhoto)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 font-medium transition-colors"
              title="Set as Album Cover"
            >
              Set as Cover
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Download Image"
          >
            <Download size={16} />
          </button>

          {isSchoolAdmin && (
            <button
              onClick={() => onDeletePhoto && onDeletePhoto(currentPhoto)}
              className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
              title="Delete Photo"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ml-2"
            title="Close Lightbox"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Center Image */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={() => onIndexChange(currentIndex - 1)}
            className="absolute left-2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <img
          src={activeUrl}
          alt={currentPhoto.caption || currentPhoto.fileName || 'Event photo'}
          className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-all select-none"
        />

        {currentIndex < photos.length - 1 && (
          <button
            onClick={() => onIndexChange(currentIndex + 1)}
            className="absolute right-2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="text-center max-w-xl mx-auto space-y-1 z-10">
        {currentPhoto.caption && (
          <p className="text-sm font-semibold text-white/90">{currentPhoto.caption}</p>
        )}
        <div className="flex items-center justify-center gap-4 text-xs text-white/60">
          <span>{currentPhoto.fileName || 'Photo'}</span>
          {currentPhoto.createdAt && (
            <span>• {new Date(currentPhoto.createdAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
