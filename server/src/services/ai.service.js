import { GoogleGenAI } from "@google/genai"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import ApiError from "../utils/ApiError.js"
import AcademicYear from "../models/AcademicYear.js"
import SchoolClass from "../models/SchoolClass.js"
import Subject from "../models/Subject.js"
import Teacher from "../models/Teacher.js"
import Timetable from "../models/Timetable.js"
import { getConfig } from "./timetableConfig.service.js"

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
})

function formatMessages(messages) {
  return messages
    .map(msg => `${msg.sender.username}: ${msg.message}`)
    .join("\n");
}

async function summarizeChat(messages) {
  const formattedChat = formatMessages(messages);

  const prompt = `
Analyze the following chat conversation and return a structured summary.

Chat:
${formattedChat}

Return output in this JSON format:
{
  "messages": number,
  "timespan": "string",
  "sentiment": "Positive | Neutral | Negative",
  "overview": "2-3 line summary",
  "keyPoints": ["point1", "point2", "point3", "point4"]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const data = JSON.parse(response.text);

  return data;
}

// Zod Schema for Gemini AI Timetable output
const AiTimetableResponseSchema = z.object({
  success: z.boolean(),
  errorReason: z.string().optional(),
  timetables: z.array(
    z.object({
      classId: z.string(),
      sectionId: z.string(),
      periods: z.array(
        z.object({
          day: z.number(),
          periodNo: z.number(),
          subjectId: z.string().nullable(),
          teacherId: z.string().nullable(),
          room: z.string().optional(),
          isLunch: z.boolean(),
          isBreak: z.boolean(),
          isAssembly: z.boolean(),
          isFixed: z.boolean(),
          label: z.string().optional(),
        })
      ),
    })
  ).optional(),
});

export const generateAITimetables = async (schoolId, academicYearId, singleClassId = null, singleSectionId = null) => {
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new ApiError(400, "Gemini API key is missing. Please add GOOGLE_GENAI_API_KEY to your .env file.");
  }

  // 1. Fetch config, classes, teachers, subjects, and existing published timetables
  const config = await getConfig(schoolId, academicYearId);
  const teachers = await Teacher.find({ schoolId, status: 'active' });
  const allSubjects = await Subject.find({ schoolId });

  let classes = [];
  if (singleClassId) {
    const singleClass = await SchoolClass.findOne({ schoolId, _id: singleClassId }).populate('sections');
    if (singleClass) classes = [singleClass];
  } else {
    classes = await SchoolClass.find({ schoolId, academicYear: academicYearId }).populate('sections');
  }

  // 2. Compile class-section structures
  const classSections = [];
  for (const classObj of classes) {
    const classSubjects = allSubjects.filter(sub => classObj.subjects.some(id => id.toString() === sub._id.toString()));
    for (const sec of classObj.sections) {
      if (singleSectionId && sec._id.toString() !== singleSectionId.toString()) continue;
      classSections.push({
        classId: classObj._id.toString(),
        className: classObj.name,
        sectionId: sec._id.toString(),
        sectionName: sec.name,
        subjects: classSubjects.map(sub => ({
          _id: sub._id.toString(),
          name: sub.name,
          code: sub.code,
          weeklyPeriods: sub.weeklyPeriods || 5,
          maxPeriodsPerDay: sub.maxPeriodsPerDay || 2
        }))
      });
    }
  }

  if (classSections.length === 0) {
    throw new ApiError(400, 'No class sections with assigned subjects found to generate timetable');
  }

  // Pre-validate teacher subject availability
  const teacherList = teachers.map(t => ({
    _id: t._id.toString(),
    name: `${t.firstName} ${t.lastName}`,
    subjects: (t.subjects || []).map(s => s.toString()),
    weeklyLimit: t.weeklyTeachingLimit || 30
  }));

  // Match subjects to teachers and verify availability
  const missingTeachers = [];
  for (const cs of classSections) {
    for (const sub of cs.subjects) {
      const qualified = teacherList.filter(t => t.subjects.includes(sub._id));
      if (qualified.length === 0) {
        missingTeachers.push(`Subject "${sub.name}" in Class "${cs.className}" Section "${cs.sectionName}" has no qualified teacher assigned.`);
      }
    }
  }

  if (missingTeachers.length > 0) {
    // Return early with a detailed message as requested
    return {
      success: false,
      errorReason: `Missing Teacher Requirements:\n${missingTeachers.join('\n')}`
    };
  }

  // 3. Gather existing published timetables to prevent conflicts
  const publishedTimetables = await Timetable.find({ schoolId, academicYear: academicYearId, status: 'published' });
  const lockedPeriods = [];
  for (const t of publishedTimetables) {
    for (const p of t.periods) {
      if (p.teacher) {
        lockedPeriods.push({
          day: p.day,
          periodNo: p.periodNo,
          teacherId: p.teacher.toString(),
          className: t.schoolClass.toString(),
          sectionName: t.section.toString()
        });
      }
    }
  }

  const schoolConfig = {
    workingDays: config.workingDays || [1, 2, 3, 4, 5],
    periodsPerDay: config.periodsPerDay || 8,
    lunchBreaks: config.lunchBreaks || [{ afterPeriod: 4, label: 'Lunch Break' }],
    periodTimings: config.periodTimings || []
  };

  const prompt = `
You are an expert School Timetable Solver AI. Your task is to generate a weekly timetable for all the class sections listed below, satisfying all the scheduling constraints.

### HARD CONSTRAINTS:
1. **Teacher No-Overlap**: A teacher can teach only ONE class section during a single period. Do not double-book any teacher under any circumstances.
2. **Locked Placements**: The following teacher placements are already locked and cannot be changed or overlapped with:
${JSON.stringify(lockedPeriods, null, 2)}
3. **Weekly Periods**: Each class section must schedule the exact number of weekly periods specified for each subject.
4. **Non-Teaching Periods**: Lunch breaks and other non-teaching slots must be correctly marked as non-teaching periods (subjectId: null, teacherId: null, isLunch: true/false, isBreak: true/false, label: "Lunch Break", etc.) based on the School Configuration.
5. **Teacher Qualifications**: Only assign a teacher to a subject if they teach that subject (check qualified teacher list).
6. **Max Periods Per Day**: A subject should not be scheduled more than its maxPeriodsPerDay in a single day.

### School Configuration:
${JSON.stringify(schoolConfig, null, 2)}

### Active Teachers:
${JSON.stringify(teacherList, null, 2)}

### Class Sections to Schedule:
${JSON.stringify(classSections, null, 2)}

Analyze the requirements and generate the timetables. If the teachers are less than the minimum requirements, or it is impossible to schedule without conflicts, set success to false and provide the errorReason. Otherwise, set success to true and return the generated periods for each class section.

Output MUST conform to the JSON Schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(AiTimetableResponseSchema)
      }
    });

    const aiResult = JSON.parse(response.text);
    return aiResult;
  } catch (err) {
    throw new ApiError(500, `Gemini AI Timetable generation failed: ${err.message}`);
  }
};

export { summarizeChat }