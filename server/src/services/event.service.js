import CalendarEvent from '../models/CalendarEvent.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createEvent = async (schoolId, data, userId) => {
  const event = await CalendarEvent.create({ ...data, schoolId, createdBy: userId });
  return event;
};

export const getEvents = async (schoolId, options) => {
  return paginate(CalendarEvent, { schoolId }, { ...options, searchFields: ['title'] });
};

export const getEventById = async (id, schoolId) => {
  const event = await CalendarEvent.findOne({ _id: id, schoolId });
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
};

export const updateEvent = async (id, schoolId, data) => {
  const event = await CalendarEvent.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
};

export const deleteEvent = async (id, schoolId) => {
  const event = await CalendarEvent.findOneAndDelete({ _id: id, schoolId });
  if (!event) throw new ApiError(404, 'Event not found');
  return true;
};

export const getCalendar = async (schoolId, month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const events = await CalendarEvent.find({ schoolId, startDate: { $gte: start, $lte: end } }).sort('startDate');
  return events;
};
