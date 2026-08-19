import Complaint from '../models/Complaint.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

const generateReferenceNo = async (schoolId) => {
  const year = new Date().getFullYear();
  const count = await Complaint.countDocuments({ schoolId });
  const seq = (count + 1).toString().padStart(5, '0');
  return `CMP-${year}-${seq}`;
};

export const createComplaint = async (schoolId, data, user) => {
  const referenceNo = await generateReferenceNo(schoolId);
  const isAnon = !!data.isAnonymous;

  const complainantName = isAnon ? 'Anonymous' : (user.name || user.email || 'User');
  const complainantRole = user.role || 'student';

  const initialActivity = {
    action: 'Complaint Submitted',
    performedBy: user._id,
    performerName: complainantName,
    timestamp: new Date(),
    note: 'Initial complaint submission.',
  };

  const complaint = await Complaint.create({
    ...data,
    schoolId,
    referenceNo,
    complainant: isAnon ? undefined : user._id,
    complainantName,
    complainantRole,
    type: data.type || complainantRole,
    status: 'submitted',
    activities: [initialActivity],
  });

  return complaint;
};

export const getComplaints = async (schoolId, user, options = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    priority,
    category,
    source,
    assignedTo,
    dateRange,
  } = options;

  const query = { schoolId };

  // If user is Student or Parent (not Admin), restrict to their own complaints
  if (user.role === 'student' || user.role === 'parent') {
    query.complainant = user._id;
  }

  // Filter by Status
  if (status && status !== 'all') {
    if (status === 'open') {
      query.status = { $in: ['submitted', 'open', 'under_review', 'in_progress'] };
    } else {
      query.status = status;
    }
  }

  // Filter by Priority
  if (priority && priority !== 'all') {
    query.priority = priority;
  }

  // Filter by Category
  if (category && category !== 'all') {
    query.category = category;
  }

  // Filter by Source / Type
  if (source && source !== 'all') {
    query.type = source;
  }

  // Filter by Assigned Staff
  if (assignedTo && assignedTo !== 'all') {
    query.assignedTo = assignedTo;
  }

  // Filter by Date Range
  const now = new Date();
  if (dateRange === 'today') {
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    query.createdAt = { $gte: startToday };
  } else if (dateRange === 'this_week') {
    const startWeek = new Date(now);
    startWeek.setDate(now.getDate() - now.getDay());
    startWeek.setHours(0, 0, 0, 0);
    query.createdAt = { $gte: startWeek };
  } else if (dateRange === 'this_month') {
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    query.createdAt = { $gte: startMonth };
  }

  return paginate(
    Complaint,
    query,
    {
      page,
      limit,
      search,
      searchFields: ['referenceNo', 'subject', 'description', 'complainantName', 'studentName'],
      populate: [
        { path: 'complainant', select: 'name email role avatar' },
        { path: 'assignedTo', select: 'name email role' },
        { path: 'student', select: 'name admissionNo class section' },
        { path: 'relatedClass', select: 'name' },
        { path: 'relatedTeacher', select: 'name email' },
      ],
      sort: '-createdAt',
    }
  );
};

export const getComplaintById = async (id, schoolId) => {
  const complaint = await Complaint.findOne({ _id: id, schoolId })
    .populate('complainant', 'name email role avatar phone')
    .populate('assignedTo', 'name email role phone')
    .populate('student', 'name admissionNo rollNo class section')
    .populate('relatedClass', 'name')
    .populate('relatedTeacher', 'name email')
    .populate('activities.performedBy', 'name role');

  if (!complaint) throw new ApiError(404, 'Complaint not found');
  return complaint;
};

export const processComplaint = async (id, schoolId, data, userId, userName) => {
  const complaint = await Complaint.findOne({ _id: id, schoolId });
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const updateFields = {};
  const newActivities = [...(complaint.activities || [])];

  if (data.status && data.status !== complaint.status) {
    updateFields.status = data.status;
    if (data.status === 'resolved' || data.status === 'closed') {
      updateFields.resolvedBy = userId;
      updateFields.resolvedAt = new Date();
    }
    newActivities.push({
      action: `Status changed to ${data.status.replace('_', ' ').toUpperCase()}`,
      performedBy: userId,
      performerName: userName || 'Admin',
      timestamp: new Date(),
      note: data.note || data.resolution || `Status updated to ${data.status}`,
    });
  }

  if (data.priority && data.priority !== complaint.priority) {
    updateFields.priority = data.priority;
    newActivities.push({
      action: `Priority updated to ${data.priority.toUpperCase()}`,
      performedBy: userId,
      performerName: userName || 'Admin',
      timestamp: new Date(),
      note: `Priority changed from ${complaint.priority} to ${data.priority}`,
    });
  }

  if (data.assignedTo && data.assignedTo.toString() !== complaint.assignedTo?.toString()) {
    updateFields.assignedTo = data.assignedTo;
    const staffDoc = await User.findById(data.assignedTo).select('name');
    newActivities.push({
      action: `Assigned to ${staffDoc ? staffDoc.name : 'Staff Member'}`,
      performedBy: userId,
      performerName: userName || 'Admin',
      timestamp: new Date(),
      note: data.note || `Complaint reassigned.`,
    });
  }

  if (data.resolution !== undefined) {
    updateFields.resolution = data.resolution;
  }

  updateFields.activities = newActivities;

  const updated = await Complaint.findByIdAndUpdate(id, updateFields, { new: true })
    .populate('complainant', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('student', 'name admissionNo')
    .populate('relatedClass', 'name');

  return updated;
};

export const getComplaintStats = async (schoolId, user) => {
  const query = { schoolId };
  if (user.role === 'student' || user.role === 'parent') {
    query.complainant = user._id;
  }

  const [
    total,
    submittedCount,
    underReviewCount,
    inProgressCount,
    resolvedCount,
    closedCount,
    rejectedCount,
  ] = await Promise.all([
    Complaint.countDocuments(query),
    Complaint.countDocuments({ ...query, status: 'submitted' }),
    Complaint.countDocuments({ ...query, status: 'under_review' }),
    Complaint.countDocuments({ ...query, status: 'in_progress' }),
    Complaint.countDocuments({ ...query, status: 'resolved' }),
    Complaint.countDocuments({ ...query, status: 'closed' }),
    Complaint.countDocuments({ ...query, status: 'rejected' }),
  ]);

  return {
    total,
    submitted: submittedCount,
    underReview: underReviewCount,
    inProgress: inProgressCount,
    resolved: resolvedCount,
    closed: closedCount,
    rejected: rejectedCount,
  };
};
