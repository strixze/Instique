import RecognitionPoint from '../models/RecognitionPoint.js';
import Badge from '../models/Badge.js';
import Student from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const awardPoints = async (schoolId, data, teacherId) => {
  const point = await RecognitionPoint.create({ ...data, schoolId, awardedBy: teacherId });
  return point;
};

export const getRecognitionHistory = async (schoolId, studentId, options) => {
  return paginate(RecognitionPoint, { schoolId, student: studentId }, options);
};

export const getLeaderboard = async (schoolId, category) => {
  const match = { schoolId };
  if (category) match.category = category;

  const leaderboard = await RecognitionPoint.aggregate([
    { $match: match },
    { $group: { _id: '$student', totalPoints: { $sum: '$points' }, count: { $sum: 1 } } },
    { $sort: { totalPoints: -1 } },
    { $limit: 50 },
    {
      $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' },
    },
    { $unwind: '$student' },
    {
      $project: {
        'student.firstName': 1, 'student.lastName': 1, 'student.admissionNo': 1,
        totalPoints: 1, count: 1,
      },
    },
  ]);

  return leaderboard;
};

export const createBadge = async (schoolId, data) => {
  const badge = await Badge.create({ ...data, schoolId });
  return badge;
};

export const getBadges = async (schoolId) => {
  return Badge.find({ schoolId, isActive: true });
};

export const awardBadge = async (schoolId, badgeId, studentId) => {
  const badge = await Badge.findOne({ _id: badgeId, schoolId });
  if (!badge) throw new ApiError(404, 'Badge not found');

  const already = badge.awardedTo.find((a) => a.student.toString() === studentId);
  if (already) throw new ApiError(409, 'Student already has this badge');

  badge.awardedTo.push({ student: studentId, awardedAt: new Date() });
  await badge.save();
  return badge;
};
