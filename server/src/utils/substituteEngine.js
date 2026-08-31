export class SubstituteEngine {
  static scoreCandidate(teacher, absentTeacher, targetSubject, targetDay, targetPeriod, allTeachers, allSubjects) {
    let score = 0;

    const teacherSubjects = teacher.subjects || [];
    const subjectMatch = teacherSubjects.some(
      (s) => (typeof s === 'string' ? s === targetSubject.toString() : s.toString() === targetSubject.toString())
    );
    if (subjectMatch) score += 50;

    const sameDept = teacher.department && absentTeacher.department && teacher.department === absentTeacher.department;
    if (sameDept) score += 20;

    const currentWorkload = allTeachers.find(
      (t) => t._id.toString() === teacher._id.toString()
    )?.subjects?.length || 0;
    const avgWorkload = allTeachers.reduce((s, t) => s + (t.subjects?.length || 0), 0) / Math.max(1, allTeachers.length);
    if (currentWorkload <= avgWorkload) score += 10;

    return score;
  }

  static findSubstitutes(absentTeacherId, targetSubject, targetDay, targetPeriod, allTeachers, allSubjects) {
    const absentTeacher = allTeachers.find((t) => t._id.toString() === absentTeacherId.toString());
    if (!absentTeacher) return [];

    const candidates = allTeachers
      .filter((t) => t._id.toString() !== absentTeacherId.toString() && t.status === 'active')
      .map((teacher) => ({
        teacher,
        score: SubstituteEngine.scoreCandidate(teacher, absentTeacher, targetSubject, targetDay, targetPeriod, allTeachers, allSubjects),
      }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score);

    return candidates;
  }
}
