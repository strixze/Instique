import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { galleryApi } from '../../api/gallery.api';

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function UploadPhotosModal({ isOpen, onClose, album, onSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !album) return null;

  const handleFilesAdded = (files) => {
    const valid = [];
    let errors = [];

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is an unsupported file type. Allowed: JPG, PNG, WEBP.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      valid.push(file);
    });

    if (errors.length > 0) {
      toast.error(errors[0]);
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one photo to upload');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });

    try {
      await galleryApi.uploadPhotos(album._id, formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percent);
      });

      toast.success(`${selectedFiles.length} photo(s) uploaded successfully!`);
      setSelectedFiles([]);
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      toast.error(e?.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Photos to "${album.title}"`} size="lg">
      <div className="space-y-4 text-xs">
        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-forest bg-forest/5' : 'border-border hover:border-forest/50 hover:bg-surface/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
          />
          <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto mb-2">
            <Upload size={22} />
          </div>
          <p className="text-xs font-bold text-deep">Click or Drag & Drop Photos Here</p>
          <p className="text-[11px] text-muted mt-1">
            Supports JPG, JPEG, PNG, WEBP (Max {MAX_FILE_SIZE_MB}MB per file)
          </p>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-deep text-xs">
              <span>Selected Photos ({selectedFiles.length})</span>
              <button onClick={() => setSelectedFiles([])} className="text-danger hover:underline font-normal text-[11px]">Clear All</button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-surface/50 rounded-lg text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <ImageIcon size={14} className="text-forest shrink-0" />
                    <span className="truncate font-medium text-deep">{file.name}</span>
                    <span className="text-[10px] text-muted shrink-0">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                  <button onClick={() => removeFile(idx)} className="text-muted hover:text-danger p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold text-forest">
              <span>Uploading photos...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border/50">
              <div
                className="bg-forest h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadSubmit}
            loading={uploading}
            disabled={selectedFiles.length === 0 || uploading}
            className="bg-forest text-white"
          >
            Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} Photos
          </Button>
        </div>
      </div>
    </Modal>
  );
}
