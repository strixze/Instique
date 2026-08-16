import CalendarEvent from '../models/CalendarEvent.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createEvent = async (schoolId, data, userId) => {
  const event = await CalendarEvent.create({
    ...data,
    schoolId,
    createdBy: userId,
  });
  return event;
};

export const getEvents = async (schoolId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    type,
    audience,
    dateRange,
    startDate,
    endDate,
  } = options;

  const query = { schoolId };

  // Status Filter
  if (status && status !== 'all') {
    if (status === 'upcoming') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      query.startDate = { $gte: now };
      query.status = { $ne: 'cancelled' };
    } else if (status === 'past') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      query.startDate = { $lt: now };
    } else {
      query.status = status;
    }
  }

  // Type Filter
  if (type && type !== 'all') {
    query.type = type;
  }

  // Audience Filter
  if (audience && audience !== 'all') {
    query.audience = audience;
  }

  // Date Range Filters
  const now = new Date();
  if (dateRange === 'today') {
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    query.startDate = { $gte: startToday, $lte: endToday };
  } else if (dateRange === 'this_week') {
    const startWeek = new Date(now);
    startWeek.setDate(now.getDate() - now.getDay());
    startWeek.setHours(0, 0, 0, 0);
    const endWeek = new Date(startWeek);
    endWeek.setDate(startWeek.getDate() + 6);
    endWeek.setHours(23, 59, 59, 999);
    query.startDate = { $gte: startWeek, $lte: endWeek };
  } else if (dateRange === 'this_month') {
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    query.startDate = { $gte: startMonth, $lte: endMonth };
  } else if (dateRange === 'next_30_days') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now);
    end.setDate(now.getDate() + 30);
    end.setHours(23, 59, 59, 999);
    query.startDate = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  return paginate(
    CalendarEvent,
    query,
    {
      page,
      limit,
      search,
      searchFields: ['title', 'location', 'organizer', 'type', 'description'],
      populate: [
        { path: 'targetClasses', select: 'name' },
        { path: 'createdBy', select: 'name email role' },
      ],
      sort: 'startDate',
    }
  );
};

export const getEventById = async (id, schoolId) => {
  const event = await CalendarEvent.findOne({ _id: id, schoolId })
    .populate('targetClasses', 'name')
    .populate('createdBy', 'name email role');
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
};

export const updateEvent = async (id, schoolId, data) => {
  const event = await CalendarEvent.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
};

export const publishEvent = async (id, schoolId) => {
  const event = await CalendarEvent.findOneAndUpdate(
    { _id: id, schoolId },
    { status: 'published' },
    { new: true }
  );
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
};

export const cancelEvent = async (id, schoolId) => {
  const event = await CalendarEvent.findOneAndUpdate(
    { _id: id, schoolId },
    { status: 'cancelled' },
    { new: true }
  );
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
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const events = await CalendarEvent.find({ schoolId, startDate: { $gte: start, $lte: end } }).sort('startDate');
  return events;
};

export const getEventStats = async (schoolId) => {
  const now = new Date();

  // Next 30 days
  const in30Days = new Date(now);
  in30Days.setDate(now.getDate() + 30);

  // Today range
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Current month range
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    upcomingCount,
    todayCount,
    thisMonthCount,
    pastCount,
    categoryAgg,
  ] = await Promise.all([
    CalendarEvent.countDocuments({
      schoolId,
      startDate: { $gte: startToday, $lte: in30Days },
      status: { $ne: 'cancelled' },
    }),
    CalendarEvent.countDocuments({
      schoolId,
      startDate: { $gte: startToday, $lte: endToday },
    }),
    CalendarEvent.countDocuments({
      schoolId,
      startDate: { $gte: startMonth, $lte: endMonth },
    }),
    CalendarEvent.countDocuments({
      schoolId,
      startDate: { $lt: startToday },
    }),
    CalendarEvent.aggregate([
      { $match: { schoolId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ]);

  const categoryCounts = {};
  categoryAgg.forEach((c) => {
    if (c._id) categoryCounts[c._id] = c.count;
  });

  return {
    upcomingCount,
    todayCount,
    thisMonthCount,
    pastCount,
    categoryCounts,
  };
};
