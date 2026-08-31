import {
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getMeetings,
  getMeetingById,
  publishMeeting,
  cancelMeeting,
  completeMeeting,
  rsvpMeeting,
  markAttendance,
  addNote,
  previewMeeting,
} from '../meeting.service.js';
import ParentMeeting from '../../models/ParentMeeting.js';
import ParentMeetingClass from '../../models/ParentMeetingClass.js';
import ParentMeetingTeacher from '../../models/ParentMeetingTeacher.js';
import ParentMeetingParticipant from '../../models/ParentMeetingParticipant.js';
import ParentMeetingNote from '../../models/ParentMeetingNote.js';
import Student from '../../models/Student.js';
import Parent from '../../models/Parent.js';
import SchoolClass from '../../models/SchoolClass.js';
import Teacher from '../../models/Teacher.js';
import User from '../../models/User.js';
import Event from '../../models/Event.js';
import Notification from '../../models/Notification.js';

describe('Meeting Service Unit Tests', () => {
  const originals = {};
  const modelMap = {
    ParentMeeting, ParentMeetingClass, ParentMeetingTeacher,
    ParentMeetingParticipant, ParentMeetingNote, Student, Parent,
    SchoolClass, Teacher, User, Event, Notification,
  };
  const methods = [
    'create', 'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'deleteOne',
    'deleteMany', 'insertMany', 'countDocuments', 'updateMany', 'bulkWrite',
    'distinct', 'exists', 'aggregate', 'findByIdAndUpdate',
  ];

  beforeAll(() => {
    for (const [name, model] of Object.entries(modelMap)) {
      originals[name] = {};
      for (const m of methods) {
        if (typeof model[m] === 'function') originals[name][m] = model[m];
      }
    }
  });

  beforeEach(() => {
    Notification.create = async () => ({});
    ParentMeetingNote.create = async () => ({});
    ParentMeetingNote.findOne = async () => null;
    ParentMeetingNote.deleteOne = async () => ({});
    ParentMeetingParticipant.exists = async () => true;
    ParentMeetingParticipant.updateMany = async () => ({ matchedCount: 1, modifiedCount: 1 });
    Event.findOneAndUpdate = async () => ({});
    Event.findOne = async () => ({});
    Event.deleteOne = async () => ({});
    ParentMeeting.deleteOne = async () => ({});
    ParentMeeting.save = async function () { return this; };
    User.find = async () => [];
  });

  afterAll(() => {
    for (const [name, model] of Object.entries(modelMap)) {
      for (const [m, fn] of Object.entries(originals[name])) {
        model[m] = fn;
      }
    }
  });

  const queryChain = (result) => ({
    select: function () { return this; },
    populate: function () { return this; },
    distinct: async function () { return result; },
    then: function (resolve) { resolve(result); },
  });

  const meetingDoc = (overrides = {}) => ({
    _id: 'meet-1',
    schoolId: 'school-1',
    title: 'Parent Teacher Meeting',
    type: 'parent_teacher_meeting',
    date: new Date('2026-09-10'),
    startTime: '10:00',
    endTime: '12:00',
    status: 'DRAFT',
    createdBy: 'user-1',
    eventId: undefined,
    toObject: function () { return { ...this }; },
    save: async function () { return this; },
    ...overrides,
  });

  const user = (role = 'school_admin', profileId = null) => ({
    _id: 'user-1',
    role,
    profileId,
    get: () => undefined,
  });

  test('createMeeting should create a DRAFT meeting and sync classes + teachers', async () => {
    let createdData = null;
    ParentMeeting.create = async (data) => {
      createdData = data;
      return { _id: 'meet-1', ...data };
    };
    ParentMeetingClass.deleteMany = async () => ({});
    ParentMeetingClass.insertMany = async (docs) => docs;
    ParentMeetingTeacher.deleteMany = async () => ({});
    ParentMeetingTeacher.insertMany = async (docs) => docs;

    const meeting = await createMeeting('school-1', {
      title: 'Parent Teacher Meeting',
      type: 'parent_teacher_meeting',
      date: '2026-09-10',
      startTime: '10:00',
      endTime: '12:00',
      classes: [{ classId: 'class-1', sectionId: 'sec-1' }],
      teachers: [{ teacherId: 't-1', classId: 'class-1', sectionId: 'sec-1' }],
    }, 'user-1');

    expect(createdData.status).toBe('DRAFT');
    expect(createdData.schoolId).toBe('school-1');
    expect(meeting._id).toBe('meet-1');
  });

  test('updateMeeting should reject a meeting from another school (tenant isolation)', async () => {
    ParentMeeting.findOne = async () => null;
    await expect(
      updateMeeting('meet-1', 'school-2', { title: 'Hacked' }, 'user-1')
    ).rejects.toThrow('Meeting not found');
  });

  test('updateMeeting should sync new classes and teachers when provided', async () => {
    const doc = meetingDoc({ status: 'DRAFT' });
    ParentMeeting.findOne = async () => doc;
    ParentMeetingClass.deleteMany = async () => ({});
    ParentMeetingClass.insertMany = async (docs) => docs;
    ParentMeetingTeacher.deleteMany = async () => ({});
    ParentMeetingTeacher.insertMany = async (docs) => docs;

    const result = await updateMeeting('meet-1', 'school-1', {
      title: 'Renamed Meeting',
      classes: [{ classId: 'class-9', sectionId: 'sec-9' }],
      teachers: [{ teacherId: 't-9', classId: 'class-9', sectionId: 'sec-9' }],
    }, 'user-1');

    expect(result.title).toBe('Renamed Meeting');
  });

  test('deleteMeeting should reject deleting a published meeting', async () => {
    ParentMeeting.findOne = async () => meetingDoc({ status: 'PUBLISHED' });
    await expect(
      deleteMeeting('meet-1', 'school-1', 'user-1')
    ).rejects.toThrow('Only draft or cancelled meetings can be deleted');
  });

  test('publishMeeting should create participants (one per child), event, and transition to PUBLISHED', async () => {
    const doc = meetingDoc();
    ParentMeeting.findOne = async () => doc;
    ParentMeetingClass.find = () => queryChain([
      { schoolClass: 'class-1', section: 'sec-1' },
      { schoolClass: 'class-2', section: 'sec-2' },
    ]);
    Student.find = () => ({
      populate: function () {
        return {
          populate: function () { return this; },
          then: async (resolve) => {
            resolve([
              {
                _id: 'stu-1', firstName: 'Aarav', lastName: 'Sharma',
                parents: ['parent-1'], currentClass: { name: 'Grade 5A' }, currentSection: { name: 'A' },
              },
              {
                _id: 'stu-2', firstName: 'Ananya', lastName: 'Sharma',
                parents: ['parent-1'], currentClass: { name: 'Grade 8B' }, currentSection: { name: 'B' },
              },
              {
                _id: 'stu-3', firstName: 'Rohan', lastName: 'Patil',
                parents: ['parent-2'], currentClass: { name: 'Grade 5A' }, currentSection: { name: 'A' },
              },
            ]);
          },
        };
      },
    });
    Parent.find = async () => [{ _id: 'parent-1' }, { _id: 'parent-2' }];

    const inserted = [];
    ParentMeetingParticipant.deleteMany = async () => ({});
    ParentMeetingParticipant.insertMany = async (docs) => { inserted.push(...docs); return docs; };
    ParentMeetingParticipant.find = () => queryChain([]);
    ParentMeetingParticipant.aggregate = async () => [];
    Event.create = async (data) => ({ _id: 'event-1', ...data });
    User.find = async () => [{ _id: 'user-2', profileId: 'parent-1' }, { _id: 'user-3', profileId: 'parent-2' }];
    ParentMeetingTeacher.find = () => queryChain([]);
    ParentMeetingNote.find = () => queryChain([]);
    ParentMeeting.find = async () => null; // getMeetingById not exercised (fresh uses mock below)
    ParentMeetingClass.populate = undefined;

    const result = await publishMeeting('meet-1', 'school-1', user(), '127.0.0.1', 'jest');

    // 3 students -> 3 participant rows (one per parent-child pair)
    expect(inserted.length).toBe(3);
    expect(inserted.every((p) => p.invitedAt)).toBe(true);
    expect(inserted.every((p) => p.attendanceStatus === 'PENDING')).toBe(true);
    // parent-1 has two children -> 2 rows but still one parent (no duplicate parent records)
    expect(inserted.filter((p) => p.parent === 'parent-1').length).toBe(2);
    expect(result.status).toBe('PUBLISHED');
    expect(result.eventId).toBe('event-1');
  });

  test('cancelMeeting should reject cancelling a draft', async () => {
    ParentMeeting.findOne = async () => meetingDoc();
    await expect(
      cancelMeeting('meet-1', 'school-1', user(), 'No reason', 'ip', 'ua')
    ).rejects.toThrow('Only published meetings can be cancelled');
  });

  test('completeMeeting should block completion before the meeting date has passed', async () => {
    const past = new Date();
    past.setDate(past.getDate() + 10);
    ParentMeeting.findOne = async () => meetingDoc({ status: 'PUBLISHED', date: past });
    await expect(
      completeMeeting('meet-1', 'school-1', user(), 'ip', 'ua')
    ).rejects.toThrow('Meeting date has not passed yet');
  });

  test('completeMeeting should allow completion after the meeting date has passed', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const doc = meetingDoc({ status: 'PUBLISHED', date: past, eventId: 'event-1' });
    ParentMeeting.findOne = async () => doc;
    Event.findOneAndUpdate = async () => ({});
    ParentMeetingClass.find = () => queryChain([]);
    ParentMeetingTeacher.find = () => queryChain([]);
    ParentMeetingParticipant.find = () => queryChain([]);
    ParentMeetingParticipant.aggregate = async () => [];
    ParentMeetingNote.find = () => queryChain([]);
    Event.findOne = async () => ({});

    const result = await completeMeeting('meet-1', 'school-1', user(), 'ip', 'ua');
    expect(result.status).toBe('COMPLETED');
    expect(result.completedAt).toBeDefined();
  });

  test('rsvpMeeting should reject RSVP on a non-published meeting', async () => {
    ParentMeeting.findOne = async () => meetingDoc();
    await expect(
      rsvpMeeting('meet-1', 'school-1', 'parent-1', 'GOING')
    ).rejects.toThrow('RSVP is only available for published meetings');
  });

  test('rsvpMeeting should update all participant rows for the parent and persist response', async () => {
    ParentMeeting.findOne = async () => meetingDoc({ status: 'PUBLISHED' });
    ParentMeetingParticipant.updateMany = async () => ({ matchedCount: 2, modifiedCount: 2 });

    const result = await rsvpMeeting('meet-1', 'school-1', 'parent-1', 'MAYBE');
    expect(result.rsvpStatus).toBe('MAYBE');
    expect(result.respondedAt).toBeInstanceOf(Date);
  });

  test('rsvpMeeting should reject a parent who is not invited', async () => {
    ParentMeeting.findOne = async () => meetingDoc({ status: 'PUBLISHED' });
    ParentMeetingParticipant.updateMany = async () => ({ matchedCount: 0, modifiedCount: 0 });
    ParentMeetingParticipant.exists = async () => null;

    await expect(
      rsvpMeeting('meet-1', 'school-1', 'parent-99', 'GOING')
    ).rejects.toThrow('You are not invited to this meeting');
  });

  test('markAttendance should reject attendance updates by an unassigned teacher', async () => {
    ParentMeeting.findOne = async () => meetingDoc({ status: 'PUBLISHED' });
    ParentMeetingParticipant.findOne = async () => ({
      _id: 'part-1', meetingId: 'meet-1', parent: 'parent-1', student: 'stu-1',
      attendanceStatus: 'PENDING',
      save: async function () { return this; },
    });
    ParentMeetingTeacher.find = () => queryChain([]); // no assigned classes for this teacher

    await expect(
      markAttendance('meet-1', 'school-1', { participantId: 'part-1', status: 'ATTENDED' }, user('teacher', 't-1'))
    ).rejects.toThrow('You are not assigned to this meeting');
  });

  test('markAttendance should allow school admin to mark attendance', async () => {
    ParentMeeting.findOne = async () => meetingDoc({ status: 'PUBLISHED' });
    ParentMeetingParticipant.findOne = async () => ({
      _id: 'part-1', meetingId: 'meet-1', parent: 'parent-1', student: 'stu-1',
      attendanceStatus: 'PENDING',
      save: async function () { this.attendanceStatus = 'ATTENDED'; return this; },
    });

    const result = await markAttendance('meet-1', 'school-1', { participantId: 'part-1', status: 'ATTENDED' }, user());
    expect(result.status).toBe('ATTENDED');
  });

  test('getMeetingById should return 404 for meetings outside the school', async () => {
    ParentMeeting.findOne = async () => null;
    await expect(
      getMeetingById('meet-1', 'school-2', user())
    ).rejects.toThrow('Meeting not found');
  });

  test('getMeetingById should hide internal notes from parents', async () => {
    ParentMeeting.findOne = async () => meetingDoc({ status: 'PUBLISHED' });
    ParentMeetingClass.find = () => queryChain([]);
    ParentMeetingTeacher.find = () => queryChain([]);
    ParentMeetingParticipant.find = () => ({
      populate: function () {
        return {
          populate: function () { return this; },
          then: async (resolve) => {
            resolve([
              {
                _id: 'part-1', parent: { _id: 'parent-1', firstName: 'Rahul', lastName: 'Sharma', contact: {} },
                student: {
                  _id: 'stu-1', firstName: 'Aarav', lastName: 'Sharma',
                  currentClass: { _id: 'class-1', name: 'Grade 5A' },
                  currentSection: { _id: 'sec-1', name: 'A' },
                },
                rsvpStatus: 'GOING', attendanceStatus: 'PENDING',
                invitedAt: null, respondedAt: null, attendedAt: null,
              },
            ]);
          },
        };
      },
    });
    ParentMeetingNote.find = () => ({
      populate: function () {
        return {
          populate: function () {
            return {
              populate: function () {
                return {
                  then: async (resolve) => {
                    resolve([
                      { _id: 'note-1', student: { _id: 'stu-1' }, teacher: null, note: 'Internal flag', visibility: 'INTERNAL', createdBy: { name: 'Admin' }, createdAt: new Date(), updatedAt: new Date() },
                      { _id: 'note-2', student: { _id: 'stu-1' }, teacher: null, note: 'Good progress', visibility: 'PARENT_VISIBLE', createdBy: { name: 'Admin' }, createdAt: new Date(), updatedAt: new Date() },
                    ]);
                  },
                };
              },
            };
          },
        };
      },
    });
    Event.findOne = async () => null;

    const result = await getMeetingById('meet-1', 'school-1', user('parent', 'parent-1'));
    expect(result.notes.length).toBe(1);
    expect(result.notes[0].visibility).toBe('PARENT_VISIBLE');
    expect(result.notes.some((n) => n.note === 'Internal flag')).toBe(false);
    expect(result.permissions.canRsvp).toBe(true);
  });

  test('previewMeeting should auto-detect students and parents from selected classes', async () => {
    const students = [
      {
        _id: 'stu-1', firstName: 'Aarav', lastName: 'Sharma', parents: ['parent-1'],
        currentClass: { name: 'Grade 5A' }, currentSection: { name: 'A' },
      },
      {
        _id: 'stu-2', firstName: 'Ananya', lastName: 'Sharma', parents: ['parent-1'],
        currentClass: { name: 'Grade 8B' }, currentSection: { name: 'B' },
      },
    ];
    Student.find = () => ({
      populate: function () {
        return {
          populate: function () { return this; },
          then: async (resolve) => resolve(students),
        };
      },
    });
    Parent.find = async () => [
      { _id: 'parent-1', firstName: 'Rahul', lastName: 'Sharma', students: ['stu-1', 'stu-2'] },
    ];
    SchoolClass.find = () => ({
      populate: function () {
        return {
          populate: function () { return this; },
          populate: function () { return this; },
          then: async (resolve) => resolve([]),
        };
      },
    });
    Teacher.find = () => ({
      populate: function () { return this; },
      select: function () { return this; },
      then: async (resolve) => resolve([]),
    });

    const result = await previewMeeting('school-1', {
      classes: [{ classId: 'class-1', sectionId: 'sec-1' }],
    });

    expect(result.studentsCount).toBe(2);
    expect(result.parentsCount).toBe(1); // Rahul counted once despite 2 children
    expect(result.parentsWithChildren[0].children.length).toBe(2);
  });
});