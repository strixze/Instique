import { publishClassTimetables, publishSchoolTimetables } from '../../timetable.service.js';
import Timetable from '../../../models/Timetable.js';

describe('Timetable Service Bulk Publish Unit Tests', () => {
  let originalUpdateMany;

  beforeAll(() => {
    originalUpdateMany = Timetable.updateMany;
  });

  afterAll(() => {
    Timetable.updateMany = originalUpdateMany;
  });

  test('publishClassTimetables should update class timetables with status', async () => {
    let calledArgs = null;
    Timetable.updateMany = async (filter, update) => {
      calledArgs = { filter, update };
      return { modifiedCount: 5 };
    };

    const schoolId = 'school-123';
    const classId = 'class-456';
    const academicYearId = 'year-789';
    const status = 'published';

    const result = await publishClassTimetables(schoolId, classId, academicYearId, status);

    expect(calledArgs).toEqual({
      filter: {
        schoolId,
        schoolClass: classId,
        academicYear: academicYearId,
      },
      update: { status },
    });
    expect(result).toEqual({ updatedCount: 5 });
  });

  test('publishSchoolTimetables should update school timetables with status', async () => {
    let calledArgs = null;
    Timetable.updateMany = async (filter, update) => {
      calledArgs = { filter, update };
      return { modifiedCount: 8 };
    };

    const schoolId = 'school-123';
    const academicYearId = 'year-789';
    const status = 'draft';

    const result = await publishSchoolTimetables(schoolId, academicYearId, status);

    expect(calledArgs).toEqual({
      filter: {
        schoolId,
        academicYear: academicYearId,
      },
      update: { status },
    });
    expect(result).toEqual({ updatedCount: 8 });
  });
});
