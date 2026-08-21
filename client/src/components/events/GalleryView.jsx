import { useState, useEffect } from 'react';
import {
  Image as ImageIcon, Plus, Search, Filter, Calendar, Folder,
  MoreVertical, Eye, Edit3, Trash2, ArrowRight, Layers
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { galleryApi } from '../../api/gallery.api';
import { eventApi } from '../../api/event.api';
import CreateAlbumModal from './CreateAlbumModal';
import UploadPhotosModal from './UploadPhotosModal';
import AlbumDetailsView from './AlbumDetailsView';

export default function GalleryView({ isSchoolAdmin = false, onSelectEvent }) {
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState([]);
  const [meta, setMeta] = useState(null);
  const [eventsList, setEventsList] = useState([]);

  // Active Selected Album (View Mode)
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('all');

  // Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editAlbum, setEditAlbum] = useState(null);
  const [uploadAlbum, setUploadAlbum] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);

  const fetchAlbums = () => {
    setLoading(true);
    const params = {
      limit: 50,
      search: search || undefined,
      event: selectedEvent !== 'all' ? selectedEvent : undefined,
    };

    galleryApi.getAlbums(params)
      .then((res) => {
        setAlbums(res.data || []);
        setMeta(res.meta || null);
      })
      .catch((e) => {
        toast.error(e?.message || 'Failed to load gallery albums');
        setAlbums([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    eventApi.getAll({ limit: 100 })
      .then((res) => setEventsList(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [selectedEvent]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAlbums();
  };

  const handleDeleteAlbum = (album) => {
    Swal.fire({
      title: 'Delete Album?',
      text: `Are you sure you want to delete "${album.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Album',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await galleryApi.deleteAlbum(album._id);
        toast.success('Album deleted');
        fetchAlbums();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete album');
      }
    });
  };

  // If an album is selected, render AlbumDetailsView
  if (selectedAlbumId) {
    return (
      <AlbumDetailsView
        albumId={selectedAlbumId}
        onBack={() => {
          setSelectedAlbumId(null);
          fetchAlbums();
        }}
        isSchoolAdmin={isSchoolAdmin}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Gallery Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-deep tracking-tight flex items-center gap-2">
            <ImageIcon className="text-forest" size={22} />
            Event Gallery
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            School event photos and memories
          </p>
        </div>

        {isSchoolAdmin && (
          <Button
            onClick={() => { setEditAlbum(null); setCreateModalOpen(true); }}
            className="self-start sm:self-auto flex items-center gap-2 text-xs py-2 bg-forest text-white shadow-xs"
          >
            <Plus size={16} /> Create Album
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <Card padding={false} className="p-4 bg-white border border-border rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search albums by title or description..."
              className="w-full text-xs bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-deep focus:outline-none focus:border-forest"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Event:</span>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium cursor-pointer"
            >
              <option value="all">All Events & Albums</option>
              {eventsList.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary" className="w-full sm:w-auto py-2 text-xs">
            Search
          </Button>
        </form>
      </Card>

      {/* Albums Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-border rounded-xl overflow-hidden p-3 space-y-3">
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-16 text-center">
          <Folder size={40} className="mx-auto text-muted mb-3 opacity-40" />
          <p className="text-sm font-bold text-deep">No Photo Albums Found</p>
          <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
            {search || selectedEvent !== 'all'
              ? 'No albums match your search filter.'
              : 'Create an album to start organizing your school event photos.'}
          </p>
          {isSchoolAdmin && (
            <Button
              onClick={() => { setEditAlbum(null); setCreateModalOpen(true); }}
              className="mt-4 text-xs bg-forest text-white"
            >
              <Plus size={14} className="mr-1" /> Create Album
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {albums.map((album) => (
            <div
              key={album._id}
              className="group bg-white border border-border rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Album Cover Thumbnail */}
              <div
                onClick={() => setSelectedAlbumId(album._id)}
                className="aspect-16/10 bg-surface relative overflow-hidden cursor-pointer flex items-center justify-center border-b border-border/60"
              >
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted">
                    <ImageIcon size={32} className="opacity-40 mb-1" />
                    <span className="text-[11px] font-medium">No Cover Photo</span>
                  </div>
                )}

                {/* Photo Count Badge Overlay */}
                <div className="absolute bottom-2 left-2 bg-black/65 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ImageIcon size={12} /> {album.photoCount || 0} photos
                </div>
              </div>

              {/* Album Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      onClick={() => setSelectedAlbumId(album._id)}
                      className="text-sm font-bold text-deep hover:text-forest transition-colors cursor-pointer truncate"
                    >
                      {album.title}
                    </h3>

                    {/* Three-Dot Menu */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === album._id ? null : album._id)}
                        className="p-1 rounded text-muted hover:text-deep hover:bg-surface"
                      >
                        <MoreVertical size={15} />
                      </button>

                      {actionMenuId === album._id && (
                        <div className="absolute right-0 top-6 w-36 bg-white border border-border rounded-xl shadow-lg z-20 py-1 text-xs">
                          <button
                            onClick={() => { setSelectedAlbumId(album._id); setActionMenuId(null); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-surface flex items-center gap-2 text-deep font-medium"
                          >
                            <Eye size={13} className="text-muted" /> View Album
                          </button>

                          {isSchoolAdmin && (
                            <>
                              <button
                                onClick={() => { setUploadAlbum(album); setActionMenuId(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-surface flex items-center gap-2 text-forest font-medium"
                              >
                                <Plus size={13} /> Add Photos
                              </button>
                              <button
                                onClick={() => { setEditAlbum(album); setCreateModalOpen(true); setActionMenuId(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-surface flex items-center gap-2 text-deep font-medium"
                              >
                                <Edit3 size={13} className="text-muted" /> Edit Album
                              </button>
                              <button
                                onClick={() => { handleDeleteAlbum(album); setActionMenuId(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-surface flex items-center gap-2 text-danger font-medium border-t border-border mt-1 pt-1"
                              >
                                <Trash2 size={13} /> Delete Album
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted mt-1">
                    <Calendar size={12} />
                    <span>{album.date ? new Date(album.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                  </div>

                  {album.event && (
                    <div className="mt-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-forest font-medium border border-emerald-200 inline-block truncate max-w-full">
                        {album.event?.title}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-secondary">
                    {album.createdBy?.name ? `By ${album.createdBy.name}` : ''}
                  </span>
                  <button
                    onClick={() => setSelectedAlbumId(album._id)}
                    className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
                  >
                    View Album <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Album Modal */}
      <CreateAlbumModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        albumToEdit={editAlbum}
        onSuccess={fetchAlbums}
      />

      {/* Upload Photos Modal */}
      {uploadAlbum && (
        <UploadPhotosModal
          isOpen={!!uploadAlbum}
          onClose={() => setUploadAlbum(null)}
          album={uploadAlbum}
          onSuccess={fetchAlbums}
        />
      )}
    </div>
  );
}
