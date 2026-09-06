import Setting from '../models/Setting.js';
import School from '../models/School.js';
import TimetableConfig from '../models/TimetableConfig.js';
import ApiError from '../utils/ApiError.js';
import { createAuditLog } from './audit.service.js';

/**
 * Fetch or auto-initialize settings for a school
 */
export const getSettings = async (schoolId) => {
  let settings = await Setting.findOne({ schoolId }).populate('academic.currentAcademicYear');

  if (!settings) {
    const school = await School.findById(schoolId);
    settings = new Setting({
      schoolId,
      general: {
        schoolName: school?.name || '',
        schoolCode: school?.code || '',
        phone: school?.contact?.phone || '',
        email: school?.contact?.email || '',
        website: school?.contact?.website || '',
        address: {
          street: school?.address?.street || '',
          city: school?.address?.city || '',
          state: school?.address?.state || '',
          zip: school?.address?.zip || '',
          country: school?.address?.country || 'India',
        },
      },
      branding: {
        logo: school?.branding?.logo || '',
        primaryColor: school?.branding?.primaryColor || '#059669',
        secondaryColor: school?.branding?.secondaryColor || '#0f172a',
      },
      academic: {
        currentAcademicYear: school?.academicSession?.currentAcademicYear || null,
      },
    });
    await settings.save();
  } else {
    // If general information is empty, sync from School entity
    const school = await School.findById(schoolId);
    let changed = false;
    if (school) {
      if (!settings.general?.schoolName && school.name) {
        settings.general = settings.general || {};
        settings.general.schoolName = school.name;
        changed = true;
      }
      if (!settings.general?.schoolCode && school.code) {
        settings.general = settings.general || {};
        settings.general.schoolCode = school.code;
        changed = true;
      }
      if (!settings.general?.phone && school.contact?.phone) {
        settings.general.phone = school.contact.phone;
        changed = true;
      }
      if (!settings.general?.email && school.contact?.email) {
        settings.general.email = school.contact.email;
        changed = true;
      }
      if (!settings.branding?.logo && school.branding?.logo) {
        settings.branding = settings.branding || {};
        settings.branding.logo = school.branding.logo;
        changed = true;
      }
      if (changed) {
        await settings.save();
      }
    }
  }

  return settings;
};

function isPlainObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date) && !(item instanceof RegExp);
}

function deepMerge(target, source) {
  const output = { ...target };
  if (isPlainObject(target) && isPlainObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isPlainObject(source[key])) {
        if (!(key in target) || !isPlainObject(target[key])) {
          output[key] = deepMerge({}, source[key]);
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

/**
 * Update school settings with deep merging and bidirectional synchronization
 */
export const updateSettings = async (schoolId, data, userId, meta = {}) => {
  let settings = await Setting.findOne({ schoolId });
  if (!settings) {
    settings = await getSettings(schoolId);
  }

  const before = settings.toObject();

  // Top-level sections to update
  const sections = [
    'general',
    'timings',
    'academic',
    'attendance',
    'leave',
    'fees',
    'notifications',
    'visibility',
    'communication',
    'recognition',
    'documents',
    'branding',
  ];

  for (const sec of sections) {
    if (data[sec] !== undefined) {
      if (Array.isArray(data[sec])) {
        settings[sec] = data[sec];
      } else if (typeof data[sec] === 'object' && data[sec] !== null) {
        const currentVal = settings[sec]?.toObject ? settings[sec].toObject() : (settings[sec] || {});
        settings[sec] = deepMerge(currentVal, data[sec]);
      } else {
        settings[sec] = data[sec];
      }
      settings.markModified(sec);
    }
  }

  // Handle features map update
  if (data.features?.modules) {
    if (!settings.features) settings.features = { modules: new Map() };
    const modulesObj = data.features.modules instanceof Map
      ? Object.fromEntries(data.features.modules)
      : data.features.modules;

    for (const [key, val] of Object.entries(modulesObj)) {
      settings.features.modules.set(key, Boolean(val));
    }
    settings.markModified('features');
  }

  await settings.save();

  // Synchronize relevant data back to the School document
  const schoolUpdate = {};
  if (data.general) {
    if (data.general.schoolName) schoolUpdate.name = data.general.schoolName;
    if (data.general.phone || data.general.email || data.general.website) {
      schoolUpdate.contact = {
        phone: data.general.phone,
        email: data.general.email,
        website: data.general.website,
      };
    }
    if (data.general.address) {
      schoolUpdate.address = data.general.address;
    }
  }

  if (data.branding) {
    schoolUpdate.branding = {
      logo: data.branding.logo,
      primaryColor: data.branding.primaryColor,
      secondaryColor: data.branding.secondaryColor,
    };
  }

  if (data.academic?.currentAcademicYear) {
    schoolUpdate['academicSession.currentAcademicYear'] = data.academic.currentAcademicYear;
  }

  if (Object.keys(schoolUpdate).length > 0) {
    await School.findByIdAndUpdate(schoolId, { $set: schoolUpdate });
  }

  // Synchronize school timings to active TimetableConfig if timings were updated
  if (data.timings) {
    const timetableUpdate = {};
    if (data.timings.schoolStartTime) timetableUpdate.schoolStartTime = data.timings.schoolStartTime;
    if (data.timings.schoolEndTime) timetableUpdate.schoolEndTime = data.timings.schoolEndTime;
    if (data.timings.periodsPerDay) timetableUpdate.periodsPerDay = data.timings.periodsPerDay;
    if (data.timings.workingDays) timetableUpdate.workingDays = data.timings.workingDays;

    if (Object.keys(timetableUpdate).length > 0) {
      await TimetableConfig.updateMany({ schoolId }, { $set: timetableUpdate });
    }
  }

  // Create audit log entry
  if (userId) {
    try {
      await createAuditLog({
        schoolId,
        actor: userId,
        action: 'UPDATE_SETTINGS',
        entity: 'Setting',
        entityId: settings._id,
        before,
        after: settings.toObject(),
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
    } catch {
      // Ignore non-critical audit log failure
    }
  }

  return settings;
};

/**
 * Update a specific setting section (PATCH /settings/:section)
 */
export const updateSection = async (schoolId, section, sectionData, userId, meta = {}) => {
  const allowedSections = [
    'general',
    'timings',
    'academic',
    'attendance',
    'leave',
    'fees',
    'notifications',
    'visibility',
    'communication',
    'recognition',
    'documents',
    'branding',
    'features',
  ];

  if (!allowedSections.includes(section)) {
    throw new ApiError(400, `Invalid settings section: ${section}`);
  }

  return updateSettings(schoolId, { [section]: sectionData }, userId, meta);
};

/**
 * Get sanitized public settings for non-admin roles (parents, students, teachers)
 */
export const getPublicSettings = async (schoolId) => {
  const settings = await getSettings(schoolId);

  const modulesObj = settings.features?.modules instanceof Map
    ? Object.fromEntries(settings.features.modules)
    : settings.features?.modules || {};

  return {
    general: {
      schoolName: settings.general?.schoolName,
      principalName: settings.general?.principalName,
      phone: settings.general?.phone,
      email: settings.general?.email,
      website: settings.general?.website,
      address: settings.general?.address,
      currency: settings.general?.currency || 'INR',
      currencySymbol: settings.general?.currencySymbol || '₹',
      dateFormat: settings.general?.dateFormat || 'DD/MM/YYYY',
      timeFormat: settings.general?.timeFormat || '12h',
    },
    branding: {
      logo: settings.branding?.logo,
      primaryColor: settings.branding?.primaryColor || '#059669',
      secondaryColor: settings.branding?.secondaryColor || '#0f172a',
      feeReceiptFooter: settings.branding?.feeReceiptFooter,
      reportCardFooter: settings.branding?.reportCardFooter,
    },
    features: modulesObj,
    visibility: {
      parent: {
        attendance: settings.visibility?.parent?.attendance !== false,
        homework: settings.visibility?.parent?.homework !== false,
        marks: settings.visibility?.parent?.marks !== false,
        timetable: settings.visibility?.parent?.timetable !== false,
        fees: settings.visibility?.parent?.fees !== false,
        leaves: settings.visibility?.parent?.leaves !== false,
        recognition: settings.visibility?.parent?.recognition !== false,
        documents: settings.visibility?.parent?.documents !== false,
        teacherInfo: settings.visibility?.parent?.teacherInfo !== false,
      },
      teacherPolicy: {
        canEditSubmittedAttendance: settings.visibility?.teacherPolicy?.canEditSubmittedAttendance !== false,
        canCreateHomework: settings.visibility?.teacherPolicy?.canCreateHomework !== false,
        canPublishMarks: !!settings.visibility?.teacherPolicy?.canPublishMarks,
        canCreateNotices: settings.visibility?.teacherPolicy?.canCreateNotices !== false,
        canViewFeeInfo: !!settings.visibility?.teacherPolicy?.canViewFeeInfo,
      },
    },
    attendanceRules: {
      minAttendancePercentage: settings.attendance?.minAttendancePercentage || 75,
      allowedStatuses: settings.attendance?.allowedStatuses || ['present', 'absent', 'late', 'leave', 'holiday'],
    },
    leavePolicies: {
      availableLeaveTypes: settings.leave?.availableLeaveTypes || [],
      studentLeave: {
        maxConsecutiveDays: settings.leave?.studentLeave?.maxConsecutiveDays || 15,
        requireMedicalCertificateDays: settings.leave?.studentLeave?.requireMedicalCertificateDays || 3,
        allowParentCancellation: settings.leave?.studentLeave?.allowParentCancellation ?? true,
      },
    },
    timings: {
      schoolStartTime: settings.timings?.schoolStartTime || '08:00',
      schoolEndTime: settings.timings?.schoolEndTime || '14:30',
      workingDays: settings.timings?.workingDays || [1, 2, 3, 4, 5, 6],
    },
  };
};

/**
 * Check if a specific module/feature is enabled for a school
 */
export const isFeatureEnabled = async (schoolId, moduleKey) => {
  const settings = await Setting.findOne({ schoolId }).select('features');
  if (!settings || !settings.features?.modules) return true; // default open

  const modules = settings.features.modules instanceof Map
    ? Object.fromEntries(settings.features.modules)
    : settings.features.modules;

  return modules[moduleKey] !== false;
};
