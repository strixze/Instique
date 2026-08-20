import mongoose from 'mongoose';
import Event from '../../models/Event.js';
import EventGalleryPhoto from '../../models/EventGalleryPhoto.js';
import * as eventService from '../event.service.js';

console.log('--- Event Model Paths ---');
console.log('Event Schema Keys:', Object.keys(Event.schema.paths));
console.log('EventGalleryPhoto Schema Keys:', Object.keys(EventGalleryPhoto.schema.paths));

const requiredFields = ['schoolId', 'title', 'type', 'startDate', 'createdBy', 'photoCount', 'coverImage.url', 'coverImage.publicId'];
const hasAllEventFields = requiredFields.every((f) => Event.schema.paths[f] !== undefined);
console.log('Event has all required fields:', hasAllEventFields);

const photoRequiredFields = ['schoolId', 'eventId', 'url', 'publicId', 'uploadedBy'];
const hasAllPhotoFields = photoRequiredFields.every((f) => EventGalleryPhoto.schema.paths[f] !== undefined);
console.log('EventGalleryPhoto has all required fields:', hasAllPhotoFields);

if (!hasAllEventFields || !hasAllPhotoFields) {
  console.error('❌ VALIDATION FAILED');
  process.exit(1);
} else {
  console.log('✅ ALL EVENT & GALLERY SCHEMA VALIDATIONS PASSED');
  process.exit(0);
}
