import Syllabus from '../models/Syllabus.js';
import SectionSyllabusTrack from '../models/SectionSyllabusTrack.js';
import Section from '../models/Section.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import AuditLog from '../models/AuditLog.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

/**
 * Helper to compute total topics count from syllabus chapters
 */
const countTotalTopics = (chapters = []) => {
  return chapters.reduce((sum, ch) => sum + (ch.topics ? ch.topics.length : 0), 0);
};

export const createSyllabus = async (schoolId, data, user) => {
  const existing = await Syllabus.findOne({
    schoolId,
    subject: data.subject,
    schoolClass: data.schoolClass,
    academicYear: data.academicYear,
    version: data.version || 1,
  });
  if (existing) {
    throw new ApiError(409, 'A syllabus already exists for this subject, class, and academic year version');
  }

  const totalTopicsCount = countTotalTopics(data.chapters || []);

  const syllabus = await Syllabus.create({
    ...data,
    schoolId,
    totalTopicsCount,
    createdBy: user?._id,
    updatedBy: user?._id,
  });

  if (user) {
    await AuditLog.create({
      schoolId,
      actor: user._id,
      action: 'syllabus_created',
      entity: 'Syllabus',
      entityId: syllabus._id,
      after: { title: syllabus.title, subject: syllabus.subject, schoolClass: syllabus.schoolClass },
    }).catch(() => {});
  }

  return syllabus;
};

export const getSyllabus = async (schoolId, options) => {
  const { subject, schoolClass, academicYear, status, search, ...rest } = options;
  const filter = {};
  if (subject) filter.subject = subject;
  if (schoolClass) filter.schoolClass = schoolClass;
  if (academicYear) filter.academicYear = academicYear;
  if (status) filter.status = status;

  return paginate(Syllabus, { schoolId }, {
    ...rest,
    searchFields: ['title', 'description'],
    filter,
    populate: [
      { path: 'subject', select: 'name code' },
      { path: 'schoolClass', select: 'name' },
      { path: 'academicYear', select: 'name' },
      { path: 'createdBy', select: 'name' },
    ],
  });
};

export const getSyllabusById = async (id, schoolId) => {
  const syllabus = await Syllabus.findOne({ _id: id, schoolId })
    .populate('subject', 'name code')
    .populate('schoolClass', 'name')
    .populate('academicYear', 'name')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

  if (!syllabus) throw new ApiError(404, 'Syllabus not found');

  // Also fetch assigned SectionSyllabusTrack records for this syllabus
  const tracks = await SectionSyllabusTrack.find({ schoolId, syllabus: id })
    .populate('section', 'name')
    .populate('assignedTeacher', 'firstName lastName contact');

  return {
    syllabus,
    tracks,
  };
};

export const updateSyllabus = async (id, schoolId, data, user) => {
  const syllabus = await Syllabus.findOne({ _id: id, schoolId });
  if (!syllabus) throw new ApiError(404, 'Syllabus not found');

  if (data.chapters) {
    syllabus.chapters = data.chapters;
    syllabus.totalTopicsCount = countTotalTopics(data.chapters);
  }
  if (data.title !== undefined) syllabus.title = data.title;
  if (data.description !== undefined) syllabus.description = data.description;
  syllabus.updatedBy = user?._id;

  await syllabus.save();

  // Sync total topics count to existing section tracks
  if (data.chapters) {
    await SectionSyllabusTrack.updateMany(
      { schoolId, syllabus: id },
      { totalTopicsCount: syllabus.totalTopicsCount }
    );
  }

  if (user) {
    await AuditLog.create({
      schoolId,
      actor: user._id,
      action: 'syllabus_updated',
      entity: 'Syllabus',
      entityId: syllabus._id,
    }).catch(() => {});
  }

  return syllabus;
};

export const publishSyllabus = async (id, schoolId, user) => {
  const syllabus = await Syllabus.findOne({ _id: id, schoolId });
  if (!syllabus) throw new ApiError(404, 'Syllabus not found');

  syllabus.status = 'published';
  syllabus.updatedBy = user?._id;
  await syllabus.save();

  if (user) {
    await AuditLog.create({
      schoolId,
      actor: user._id,
      action: 'syllabus_published',
      entity: 'Syllabus',
      entityId: syllabus._id,
    }).catch(() => {});
  }

  return syllabus;
};

export const archiveSyllabus = async (id, schoolId, user) => {
  const syllabus = await Syllabus.findOne({ _id: id, schoolId });
  if (!syllabus) throw new ApiError(404, 'Syllabus not found');

  syllabus.status = 'archived';
  syllabus.updatedBy = user?._id;
  await syllabus.save();

  // Archive section tracks as well
  await SectionSyllabusTrack.updateMany(
    { schoolId, syllabus: id },
    { status: 'archived' }
  );

  if (user) {
    await AuditLog.create({
      schoolId,
      actor: user._id,
      action: 'syllabus_archived',
      entity: 'Syllabus',
      entityId: syllabus._id,
    }).catch(() => {});
  }

  return syllabus;
};

export const deleteSyllabus = async (id, schoolId) => {
  const syllabus = await Syllabus.findOneAndDelete({ _id: id, schoolId });
  if (!syllabus) throw new ApiError(404, 'Syllabus not found');
  await SectionSyllabusTrack.deleteMany({ schoolId, syllabus: id });
  return true;
};

/**
 * Assign published syllabus to multiple sections
 */
export const assignSyllabusToSections = async (syllabusId, schoolId, sectionIds, user) => {
  const syllabus = await Syllabus.findOne({ _id: syllabusId, schoolId });
  if (!syllabus) throw new ApiError(404, 'Syllabus not found');
  if (syllabus.status !== 'published') {
    throw new ApiError(400, 'Only published syllabi can be assigned to sections');
  }

  const assignedTracks = [];
  const totalTopics = syllabus.totalTopicsCount || countTotalTopics(syllabus.chapters);

  for (const sectionId of sectionIds) {
    const section = await Section.findOne({ _id: sectionId, schoolClass: syllabus.schoolClass });
    if (!section) continue;

    // Find assigned teacher if any
    const teacher = await Teacher.findOne({
      schoolId,
      'classes.schoolClass': syllabus.schoolClass,
    });

    let track = await SectionSyllabusTrack.findOne({ schoolId, syllabus: syllabusId, section: sectionId });

    if (!track) {
      // Build initial topic progress entries for all topics
      const topicProgress = [];
      (syllabus.chapters || []).forEach((ch) => {
        (ch.topics || []).forEach((top) => {
          topicProgress.push({
            chapterId: ch._id,
            topicId: top._id,
            status: 'not_started',
          });
        });
      });

      track = await SectionSyllabusTrack.create({
        schoolId,
        syllabus: syllabusId,
        academicYear: syllabus.academicYear,
        schoolClass: syllabus.schoolClass,
        section: sectionId,
        subject: syllabus.subject,
        assignedTeacher: teacher?._id || undefined,
        topicProgress,
        totalTopicsCount: totalTopics,
        completedTopicsCount: 0,
        overallCompletion: 0,
        status: 'not_started',
      });
    } else {
      // Update existing track total topics count
      track.totalTopicsCount = totalTopics;
      await track.save();
    }

    assignedTracks.push(track);
  }

  if (user) {
    await AuditLog.create({
      schoolId,
      actor: user._id,
      action: 'syllabus_assigned_sections',
      entity: 'Syllabus',
      entityId: syllabusId,
      before: { sectionIds },
    }).catch(() => {});
  }

  return assignedTracks;
};

/**
 * Get single section syllabus track with details
 */
export const getTrackById = async (trackId, schoolId) => {
  const track = await SectionSyllabusTrack.findOne({ _id: trackId, schoolId })
    .populate({
      path: 'syllabus',
      populate: [
        { path: 'subject', select: 'name code' },
        { path: 'schoolClass', select: 'name' },
        { path: 'academicYear', select: 'name' },
      ],
    })
    .populate('schoolClass', 'name')
    .populate('section', 'name')
    .populate('subject', 'name code')
    .populate('assignedTeacher', 'firstName lastName contact');

  if (!track) throw new ApiError(404, 'Section syllabus track not found');

  // Build merged structure of chapters, topics, and completion status
  const syllabus = track.syllabus;
  const progressMap = new Map();
  (track.topicProgress || []).forEach((tp) => {
    progressMap.set(tp.topicId.toString(), tp);
  });

  const structuredChapters = (syllabus?.chapters || []).map((ch) => {
    let chTotalTopics = ch.topics ? ch.topics.length : 0;
    let chCompletedTopics = 0;
    let chInProgressTopics = 0;

    const topicsWithProgress = (ch.topics || []).map((top) => {
      const tp = progressMap.get(top._id.toString()) || {
        status: 'not_started',
        notes: '',
      };

      if (tp.status === 'completed') chCompletedTopics++;
      else if (tp.status === 'in_progress') chInProgressTopics++;

      return {
        _id: top._id,
        title: top.title,
        description: top.description,
        order: top.order,
        estimatedPeriods: top.estimatedPeriods,
        learningObjectives: top.learningObjectives,
        progress: {
          status: tp.status || 'not_started',
          startedAt: tp.startedAt,
          completedAt: tp.completedAt,
          notes: tp.notes || '',
          updatedAt: tp.updatedAt,
        },
      };
    });

    const chCompletionPct = chTotalTopics > 0 ? Math.round((chCompletedTopics / chTotalTopics) * 100) : 0;

    return {
      _id: ch._id,
      title: ch.title,
      description: ch.description,
      order: ch.order,
      estimatedPeriods: ch.estimatedPeriods,
      completionPercentage: chCompletionPct,
      totalTopics: chTotalTopics,
      completedTopics: chCompletedTopics,
      inProgressTopics: chInProgressTopics,
      topics: topicsWithProgress,
    };
  });

  return {
    track: {
      _id: track._id,
      status: track.status,
      overallCompletion: track.overallCompletion,
      completedTopicsCount: track.completedTopicsCount,
      totalTopicsCount: track.totalTopicsCount,
      startedAt: track.startedAt,
      completedAt: track.completedAt,
      schoolClass: track.schoolClass,
      section: track.section,
      subject: track.subject,
      assignedTeacher: track.assignedTeacher,
      updatedAt: track.updatedAt,
    },
    syllabus: {
      _id: syllabus?._id,
      title: syllabus?.title,
      description: syllabus?.description,
      version: syllabus?.version,
      academicYear: syllabus?.academicYear,
    },
    chapters: structuredChapters,
  };
};

/**
 * Update topic progress for a specific section track
 */
export const updateTopicProgress = async (trackId, topicId, schoolId, status, notes, user) => {
  const track = await SectionSyllabusTrack.findOne({ _id: trackId, schoolId });
  if (!track) throw new ApiError(404, 'Section syllabus track not found');

  const syllabus = await Syllabus.findById(track.syllabus);
  if (!syllabus) throw new ApiError(404, 'Associated syllabus definition not found');

  // Locate chapterId from syllabus definition for this topicId
  let foundChapterId = null;
  for (const ch of (syllabus.chapters || [])) {
    if (ch.topics && ch.topics.some((t) => t._id.toString() === topicId.toString())) {
      foundChapterId = ch._id;
      break;
    }
  }
  if (!foundChapterId) throw new ApiError(400, 'Topic not found in syllabus definition');

  // Find or create topic progress subdoc
  let tpIndex = (track.topicProgress || []).findIndex((tp) => tp.topicId.toString() === topicId.toString());
  const now = new Date();

  if (tpIndex >= 0) {
    track.topicProgress[tpIndex].status = status;
    if (notes !== undefined) track.topicProgress[tpIndex].notes = notes;
    track.topicProgress[tpIndex].updatedBy = user._id;
    track.topicProgress[tpIndex].updatedAt = now;

    if (status === 'completed' && !track.topicProgress[tpIndex].completedAt) {
      track.topicProgress[tpIndex].completedAt = now;
      track.topicProgress[tpIndex].startedAt = track.topicProgress[tpIndex].startedAt || now;
    } else if (status === 'in_progress' && !track.topicProgress[tpIndex].startedAt) {
      track.topicProgress[tpIndex].startedAt = now;
    }
  } else {
    track.topicProgress.push({
      chapterId: foundChapterId,
      topicId,
      status,
      startedAt: status === 'in_progress' || status === 'completed' ? now : undefined,
      completedAt: status === 'completed' ? now : undefined,
      notes: notes || '',
      updatedBy: user._id,
      updatedAt: now,
    });
  }

  // Recalculate track stats automatically
  const totalTopics = syllabus.totalTopicsCount || countTotalTopics(syllabus.chapters);
  const completedCount = track.topicProgress.filter((tp) => tp.status === 'completed').length;
  const inProgressCount = track.topicProgress.filter((tp) => tp.status === 'in_progress').length;

  track.totalTopicsCount = totalTopics;
  track.completedTopicsCount = completedCount;
  track.overallCompletion = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  if (track.overallCompletion === 100) {
    track.status = 'completed';
    track.completedAt = now;
  } else if (completedCount > 0 || inProgressCount > 0) {
    track.status = 'in_progress';
    track.startedAt = track.startedAt || now;
  }

  await track.save();

  await AuditLog.create({
    schoolId,
    actor: user._id,
    action: 'topic_progress_updated',
    entity: 'SectionSyllabusTrack',
    entityId: track._id,
    after: { topicId, status, overallCompletion: track.overallCompletion },
  }).catch(() => {});

  return getTrackById(trackId, schoolId);
};

/**
 * Get school-wide syllabus analytics for School Admin
 */
export const getSyllabusAnalytics = async (schoolId) => {
  const [syllabiCount, publishedCount, tracks] = await Promise.all([
    Syllabus.countDocuments({ schoolId }),
    Syllabus.countDocuments({ schoolId, status: 'published' }),
    SectionSyllabusTrack.find({ schoolId })
      .populate('schoolClass', 'name')
      .populate('subject', 'name code')
      .populate('section', 'name')
      .populate('assignedTeacher', 'firstName lastName'),
  ]);

  const activeTracksCount = tracks.filter((t) => t.status !== 'archived').length;
  const overallAvgCompletion = activeTracksCount > 0
    ? Math.round(tracks.reduce((sum, t) => sum + (t.overallCompletion || 0), 0) / activeTracksCount)
    : 0;

  // Aggregate progress by Subject
  const subjectMap = {};
  tracks.forEach((t) => {
    const sName = t.subject?.name || 'General';
    if (!subjectMap[sName]) subjectMap[sName] = { name: sName, totalCompletion: 0, count: 0 };
    subjectMap[sName].totalCompletion += (t.overallCompletion || 0);
    subjectMap[sName].count += 1;
  });
  const subjectProgress = Object.values(subjectMap).map((s) => ({
    subject: s.name,
    percentage: Math.round(s.totalCompletion / s.count),
  }));

  // Aggregate progress by Class
  const classMap = {};
  tracks.forEach((t) => {
    const cName = t.schoolClass?.name || 'Unassigned';
    if (!classMap[cName]) classMap[cName] = { name: cName, totalCompletion: 0, count: 0 };
    classMap[cName].totalCompletion += (t.overallCompletion || 0);
    classMap[cName].count += 1;
  });
  const classProgress = Object.values(classMap).map((c) => ({
    className: c.name,
    percentage: Math.round(c.totalCompletion / c.count),
  }));

  // Find lowest progress tracks (Needs Attention)
  const needsAttention = tracks
    .filter((t) => t.status !== 'archived')
    .sort((a, b) => (a.overallCompletion || 0) - (b.overallCompletion || 0))
    .slice(0, 5)
    .map((t) => ({
      trackId: t._id,
      className: t.schoolClass?.name,
      sectionName: t.section?.name,
      subjectName: t.subject?.name,
      teacherName: t.assignedTeacher ? `${t.assignedTeacher.firstName} ${t.assignedTeacher.lastName}` : 'Unassigned',
      percentage: t.overallCompletion || 0,
    }));

  return {
    kpis: {
      totalSyllabi: syllabiCount,
      publishedSyllabi: publishedCount,
      activeTracks: activeTracksCount,
      averageProgress: overallAvgCompletion,
    },
    subjectProgress,
    classProgress,
    needsAttention,
  };
};

/**
 * Get section syllabus tracks for logged in Teacher
 */
export const getTeacherSyllabusTracks = async (schoolId, teacherId, user) => {
  let teacherObj = null;
  if (teacherId) {
    teacherObj = await Teacher.findOne({ _id: teacherId, schoolId });
  }
  if (!teacherObj && user) {
    teacherObj = await Teacher.findOne({ schoolId, $or: [{ email: user.email }, { user: user._id }] });
  }

  const query = { schoolId, status: { $ne: 'archived' } };
  if (teacherObj) {
    query.assignedTeacher = teacherObj._id;
  }

  const tracks = await SectionSyllabusTrack.find(query)
    .populate('syllabus', 'title version')
    .populate('schoolClass', 'name')
    .populate('section', 'name')
    .populate('subject', 'name code');

  return tracks.map((t) => ({
    id: t._id,
    syllabusId: t.syllabus?._id,
    syllabusTitle: t.syllabus?.title || `${t.subject?.name} - ${t.schoolClass?.name}`,
    className: t.schoolClass?.name,
    sectionName: t.section?.name,
    subjectName: t.subject?.name,
    overallCompletion: t.overallCompletion || 0,
    completedTopicsCount: t.completedTopicsCount || 0,
    totalTopicsCount: t.totalTopicsCount || 0,
    status: t.status,
    updatedAt: t.updatedAt,
  }));
};

/**
 * Get read-only syllabus tracks for parent's linked child
 */
export const getParentChildSyllabusTracks = async (schoolId, studentId, user) => {
  const student = await Student.findOne({ _id: studentId, schoolId })
    .populate('currentClass', 'name')
    .populate('currentSection', 'name');

  if (!student) throw new ApiError(404, 'Student not found');

  const tracks = await SectionSyllabusTrack.find({
    schoolId,
    schoolClass: student.currentClass?._id || student.currentClass,
    section: student.currentSection?._id || student.currentSection,
    status: { $ne: 'archived' },
  })
    .populate('syllabus', 'title description chapters')
    .populate('subject', 'name code')
    .populate('assignedTeacher', 'firstName lastName');

  return tracks.map((t) => {
    const syllabus = t.syllabus;
    const progressMap = new Map();
    (t.topicProgress || []).forEach((tp) => {
      progressMap.set(tp.topicId.toString(), tp);
    });

    const chapters = (syllabus?.chapters || []).map((ch) => {
      const topics = (ch.topics || []).map((top) => {
        const tp = progressMap.get(top._id.toString());
        return {
          id: top._id,
          title: top.title,
          status: tp?.status || 'not_started',
        };
      });

      const completedCount = topics.filter((top) => top.status === 'completed').length;
      const totalCount = topics.length;
      const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        id: ch._id,
        title: ch.title,
        completionPercentage: pct,
        topics,
      };
    });

    return {
      trackId: t._id,
      subjectName: t.subject?.name,
      teacherName: t.assignedTeacher ? `${t.assignedTeacher.firstName} ${t.assignedTeacher.lastName}` : 'Class Teacher',
      overallCompletion: t.overallCompletion || 0,
      chapters,
    };
  });
};
