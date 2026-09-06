import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import Setting from '../../models/Setting.js';
import School from '../../models/School.js';
import TimetableConfig from '../../models/TimetableConfig.js';
import AuditLog from '../../models/AuditLog.js';
import {
  getSettings,
  updateSettings,
  updateSection,
  getPublicSettings,
  isFeatureEnabled,
} from '../setting.service.js';
import { isNotificationAllowed } from '../notification.service.js';

const createMockQuery = (val) => {
  const query = {
    populate: () => query,
    select: () => query,
    then: (resolve, reject) => Promise.resolve(val).then(resolve, reject),
    catch: (reject) => Promise.resolve(val).catch(reject),
  };
  return query;
};

describe('Admin Settings Service Unit & Integration Tests', () => {
  const schoolId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  let originals = {};
  let auditLogsCreated = [];

  beforeEach(() => {
    auditLogsCreated = [];
    originals = {
      SettingFindOne: Setting.findOne,
      SchoolFindById: School.findById,
      SchoolFindByIdAndUpdate: School.findByIdAndUpdate,
      TimetableConfigUpdateMany: TimetableConfig.updateMany,
      AuditLogCreate: AuditLog.create,
    };

    School.findById = async () => null;
    School.findByIdAndUpdate = async () => null;
    TimetableConfig.updateMany = async () => ({ modifiedCount: 0 });
    AuditLog.create = async (d) => {
      auditLogsCreated.push(d);
      return d;
    };
  });

  afterEach(() => {
    Setting.findOne = originals.SettingFindOne;
    School.findById = originals.SchoolFindById;
    School.findByIdAndUpdate = originals.SchoolFindByIdAndUpdate;
    TimetableConfig.updateMany = originals.TimetableConfigUpdateMany;
    AuditLog.create = originals.AuditLogCreate;
  });

  it('initializes default settings with school information if settings do not exist', async () => {
    Setting.findOne = () => createMockQuery(null);

    School.findById = async () => ({
      _id: schoolId,
      name: 'Springfield Academy',
      code: 'SPA-01',
      contact: { phone: '1234567890', email: 'info@springfield.edu', website: 'https://springfield.edu' },
      address: { street: '742 Evergreen Terrace', city: 'Springfield', state: 'Oregon', zip: '97477', country: 'USA' },
      branding: { logo: 'https://example.com/logo.png', primaryColor: '#10b981', secondaryColor: '#1f2937' },
    });

    const origSave = Setting.prototype.save;
    Setting.prototype.save = async function () { return this; };

    const result = await getSettings(schoolId);

    expect(result).toBeDefined();
    expect(result.schoolId).toEqual(schoolId);
    expect(result.general.schoolName).toBe('Springfield Academy');
    expect(result.general.schoolCode).toBe('SPA-01');
    expect(result.branding.primaryColor).toBe('#10b981');

    Setting.prototype.save = origSave;
  });

  it('updates specific sections and synchronizes school branding/general information', async () => {
    const existingDoc = new Setting({
      schoolId,
      general: { schoolName: 'Old Name', timezone: 'Asia/Kolkata' },
      timings: { schoolStartTime: '08:00', periodsPerDay: 8 },
      branding: { primaryColor: '#059669' },
    });

    Setting.findOne = () => createMockQuery(existingDoc);

    let updatedSchool = null;
    School.findByIdAndUpdate = async (id, update) => {
      updatedSchool = update;
      return true;
    };

    let updatedTimetable = null;
    TimetableConfig.updateMany = async (filter, update) => {
      updatedTimetable = update;
      return true;
    };

    const origSave = Setting.prototype.save;
    Setting.prototype.save = async function () { return this; };

    const updatePayload = {
      general: { schoolName: 'New Horizon High', phone: '+91 9999999999' },
      timings: { schoolStartTime: '08:30', periodsPerDay: 7 },
      branding: { primaryColor: '#3b82f6' },
      attendance: { minAttendancePercentage: 80 },
    };

    const updated = await updateSettings(schoolId, updatePayload, userId, { ip: '127.0.0.1' });

    expect(updated.general.schoolName).toBe('New Horizon High');
    expect(updated.timings.schoolStartTime).toBe('08:30');
    expect(updated.timings.periodsPerDay).toBe(7);
    expect(updated.branding.primaryColor).toBe('#3b82f6');
    expect(updated.attendance.minAttendancePercentage).toBe(80);

    // Verify School sync
    expect(updatedSchool).toBeDefined();
    expect(updatedSchool.$set.name).toBe('New Horizon High');
    expect(updatedSchool.$set.branding.primaryColor).toBe('#3b82f6');

    // Verify TimetableConfig sync
    expect(updatedTimetable).toBeDefined();
    expect(updatedTimetable.$set.schoolStartTime).toBe('08:30');
    expect(updatedTimetable.$set.periodsPerDay).toBe(7);

    // Verify AuditLog creation
    expect(auditLogsCreated.length).toBe(1);
    expect(auditLogsCreated[0].action).toBe('UPDATE_SETTINGS');
    expect(auditLogsCreated[0].actor.toString()).toBe(userId.toString());

    Setting.prototype.save = origSave;
  });

  it('rejects invalid section in updateSection', async () => {
    await expect(
      updateSection(schoolId, 'malicious_section', { foo: 'bar' }, userId)
    ).rejects.toThrow('Invalid settings section: malicious_section');
  });

  it('provides sanitized public settings for non-admin stakeholders', async () => {
    const sampleDoc = new Setting({
      schoolId,
      general: { schoolName: 'Public Academy', currency: 'INR', currencySymbol: '₹' },
      branding: { logo: 'https://logo.png', primaryColor: '#059669' },
      features: {
        modules: new Map([
          ['homework', true],
          ['admissions', false],
        ]),
      },
      visibility: { parent: { attendance: true, marks: false } },
    });

    Setting.findOne = () => createMockQuery(sampleDoc);

    const publicSettings = await getPublicSettings(schoolId);

    expect(publicSettings.general.schoolName).toBe('Public Academy');
    expect(publicSettings.features.homework).toBe(true);
    expect(publicSettings.features.admissions).toBe(false);
    expect(publicSettings.visibility.parent.marks).toBe(false);
    expect(publicSettings.notifications).toBeUndefined();
  });

  it('checks module feature toggle correctly', async () => {
    Setting.findOne = () => createMockQuery({
      features: {
        modules: new Map([
          ['homework', true],
          ['syllabus', false],
        ]),
      },
    });

    const isHomeworkEnabled = await isFeatureEnabled(schoolId, 'homework');
    const isSyllabusEnabled = await isFeatureEnabled(schoolId, 'syllabus');
    const isTimetableEnabled = await isFeatureEnabled(schoolId, 'timetable'); // default true

    expect(isHomeworkEnabled).toBe(true);
    expect(isSyllabusEnabled).toBe(false);
    expect(isTimetableEnabled).toBe(true);
  });

  it('evaluates notification rule matrix correctly', async () => {
    Setting.findOne = () => createMockQuery({
      notifications: {
        rules: {
          studentAbsent: { parent: true, teacher: false, student: false },
          homeworkAssigned: { parent: false, teacher: false, student: true },
        },
      },
    });

    const absentForParent = await isNotificationAllowed(schoolId, 'studentAbsent', 'parent');
    const absentForTeacher = await isNotificationAllowed(schoolId, 'studentAbsent', 'teacher');
    const homeworkForParent = await isNotificationAllowed(schoolId, 'homeworkAssigned', 'parent');
    const homeworkForStudent = await isNotificationAllowed(schoolId, 'homeworkAssigned', 'student');

    expect(absentForParent).toBe(true);
    expect(absentForTeacher).toBe(false);
    expect(homeworkForParent).toBe(false);
    expect(homeworkForStudent).toBe(true);
  });
});
