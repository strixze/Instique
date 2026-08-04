import School from '../models/School.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const onboardSchool = async (schoolData, adminData) => {
  const school = await School.create(schoolData);

  const adminUser = await User.create({
    ...adminData,
    role: 'school_admin',
    schoolId: school._id,
  });

  await Subscription.create({
    schoolId: school._id,
    plan: 'free_trial',
    status: 'trial',
    trialStart: new Date(),
    trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimits: { students: 100, teachers: 20, storage: 1024 },
  });

  return { school, admin: adminUser };
};

export const getSubscriptions = async (options) => {
  return paginate(Subscription, {}, { ...options, populate: 'schoolId' });
};

export const updateSubscription = async (id, data) => {
  const sub = await Subscription.findByIdAndUpdate(id, data, { new: true });
  if (!sub) throw new ApiError(404, 'Subscription not found');
  return sub;
};

export const getPlatformStats = async () => {
  const totalSchools = await School.countDocuments();
  const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
  const trialSchools = await Subscription.countDocuments({ status: 'trial' });
  const totalRevenue = await Subscription.aggregate([
    { $unwind: '$billingHistory' },
    { $group: { _id: null, total: { $sum: '$billingHistory.amount' } } },
  ]);

  return {
    totalSchools,
    activeSubscriptions,
    trialSchools,
    totalRevenue: totalRevenue[0]?.total || 0,
  };
};

export const checkUsageLimit = async (schoolId) => {
  const sub = await Subscription.findOne({ schoolId });
  if (!sub) return { allowed: false, reason: 'No subscription' };

  if (sub.status === 'trial' || sub.status === 'active') {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Subscription expired' };
};
