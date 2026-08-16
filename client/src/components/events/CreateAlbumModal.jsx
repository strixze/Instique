import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import toast from 'react-hot-toast';
import { galleryApi } from '../../api/gallery.api';
import { eventApi } from '../../api/event.api';

export default function CreateAlbumModal({ isOpen, onClose, albumToEdit = null, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [eventsList, setEventsList] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      eventApi.getAll({ limit: 100 })
        .then((res) => setEventsList(res.data || []))
        .catch(() => {});

      if (albumToEdit) {
        setForm({
          title: albumToEdit.title || '',
          description: albumToEdit.description || '',
          event: albumToEdit.event?._id || albumToEdit.event || '',
          date: albumToEdit.date ? new Date(albumToEdit.date).toISOString().split('T')[0] : '',
        });
      } else {
        setForm({
          title: '',
          description: '',
          event: '',
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [isOpen, albumToEdit]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Album title is required');
      return;
    }
    setLoading(true);
    try {
      if (albumToEdit) {
        await galleryApi.updateAlbum(albumToEdit._id, form);
        toast.success('Album updated successfully');
      } else {
        await galleryApi.createAlbum(form);
        toast.success('Album created successfully');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      toast.error(e?.message || 'Failed to save album');
    } finally {
      setLoading(false);
    }
  };

  const eventOptions = [
    { value: '', label: 'General School Album (No Linked Event)' },
    ...eventsList.map((ev) => ({
      value: ev._id,
      label: `${ev.title} (${new Date(ev.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={albumToEdit ? 'Edit Gallery Album' : 'Create Gallery Album'}
      size="md"
    >
      <div className="space-y-4 text-xs">
        <Input
          label="Album Title *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Independence Day Celebration 2026"
        />

        <Select
          label="Associated Event (Optional)"
          value={form.event}
          onChange={(e) => setForm({ ...form, event: e.target.value })}
          options={eventOptions}
        />

        <Input
          label="Album Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <div>
          <label className="text-xs font-semibold text-deep block mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Write a short description for this event photo album..."
            className="w-full text-xs bg-surface border border-border rounded-lg p-2 text-deep focus:outline-none focus:border-forest"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} className="bg-forest text-white">
            {albumToEdit ? 'Update Album' : 'Create Album'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
