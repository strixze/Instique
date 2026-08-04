import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import School from '../models/School.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import AcademicYear from '../models/AcademicYear.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';
import Homework from '../models/Homework.js';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import FeeStructure from '../models/FeeStructure.js';
import FeeTransaction from '../models/FeeTransaction.js';
import Notice from '../models/Notice.js';
import Leave from '../models/Leave.js';
import CalendarEvent from '../models/CalendarEvent.js';
import RecognitionPoint from '../models/RecognitionPoint.js';
import Badge from '../models/Badge.js';
import Complaint from '../models/Complaint.js';
import Setting from '../models/Setting.js';
import Subscription from '../models/Subscription.js';
import Syllabus from '../models/Syllabus.js';
import { TimetableGenerator } from '../utils/timetableEngine.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instique';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing data
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db.dropCollection(col.name);
  }
  console.log('Cleared existing data');

  // Create School
  const school = await School.create({
    name: 'Springfield International School',
    code: 'SIS2024',
    address: { street: '123 Education Lane', city: 'Mumbai', state: 'Maharashtra', zip: '400001', country: 'India' },
    contact: { phone: '+91-22-12345678', email: 'contact@springfield.edu', website: 'https://springfield.edu' },
    branding: { primaryColor: '#1e40af', secondaryColor: '#1e3a5f' },
  });
  console.log('School created:', school.name);

  // Create Subscription
  await Subscription.create({
    schoolId: school._id,
    plan: 'professional',
    status: 'active',
    trialStart: new Date('2024-01-01'),
    trialEnd: new Date('2024-02-01'),
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2025-01-01'),
    usageLimits: { students: 500, teachers: 50, storage: 5120 },
  });

  // Create Settings
  await Setting.create({
    schoolId: school._id,
    gradingScale: [
      { grade: 'A+', minPercent: 90, maxPercent: 100, points: 4.0 },
      { grade: 'A', minPercent: 80, maxPercent: 89, points: 3.7 },
      { grade: 'B+', minPercent: 70, maxPercent: 79, points: 3.3 },
      { grade: 'B', minPercent: 60, maxPercent: 69, points: 3.0 },
      { grade: 'C', minPercent: 50, maxPercent: 59, points: 2.0 },
      { grade: 'D', minPercent: 40, maxPercent: 49, points: 1.0 },
      { grade: 'F', minPercent: 0, maxPercent: 39, points: 0 },
    ],
    feeSettings: { dueDayOfMonth: 10, lateFeeEnabled: true, lateFeePerDay: 10, paymentMethods: ['cash', 'online', 'cheque'] },
    notificationToggles: { attendance: true, homework: true, fee: true, exam: true, events: true, general: true },
    academicSettings: { maxSubjectsPerTeacher: 5, maxPeriodsPerDay: 8, workingDays: [1, 2, 3, 4, 5] },
  });

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = await User.create([
    { email: 'admin@instique.com', password: passwordHash, role: 'super_admin', name: 'Super Admin', isActive: true },
    { email: 'schooladmin@springfield.edu', password: passwordHash, role: 'school_admin', schoolId: school._id, name: 'Rajesh Sharma', phone: '+91-9876543210', isActive: true },
    { email: 'teacher1@springfield.edu', password: passwordHash, role: 'teacher', schoolId: school._id, name: 'Priya Patel', isActive: true },
    { email: 'teacher2@springfield.edu', password: passwordHash, role: 'teacher', schoolId: school._id, name: 'Amit Singh', isActive: true },
    { email: 'student1@springfield.edu', password: passwordHash, role: 'student', schoolId: school._id, name: 'Arjun Kumar', isActive: true },
    { email: 'student2@springfield.edu', password: passwordHash, role: 'student', schoolId: school._id, name: 'Sneha Verma', isActive: true },
    { email: 'parent1@springfield.edu', password: passwordHash, role: 'parent', schoolId: school._id, name: 'Vikram Kumar', isActive: true },
    { email: 'parent2@springfield.edu', password: passwordHash, role: 'parent', schoolId: school._id, name: 'Neha Verma', isActive: true },
  ]);
  console.log('Users created');

  // Create Academic Year
  const academicYear = await AcademicYear.create({
    schoolId: school._id,
    name: '2024-2025',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2025-03-31'),
    isCurrent: true,
    status: 'ongoing',
  });

  // Create Classes
  const classes = await SchoolClass.create([
    { schoolId: school._id, name: 'Class 1', academicYear: academicYear._id, order: 1 },
    { schoolId: school._id, name: 'Class 2', academicYear: academicYear._id, order: 2 },
    { schoolId: school._id, name: 'Class 3', academicYear: academicYear._id, order: 3 },
    { schoolId: school._id, name: 'Class 4', academicYear: academicYear._id, order: 4 },
    { schoolId: school._id, name: 'Class 5', academicYear: academicYear._id, order: 5 },
  ]);

  // Create Sections
  const sections = [];
  for (const cls of classes) {
    const secA = await Section.create({ schoolId: school._id, name: 'A', schoolClass: cls._id });
    const secB = await Section.create({ schoolId: school._id, name: 'B', schoolClass: cls._id });
    sections.push(secA, secB);
    cls.sections = [secA._id, secB._id];
    await cls.save();
  }

  // Create Subjects
  const subjectData = [
    { name: 'Mathematics', code: 'MATH', classes: classes.map((c) => c._id), weeklyPeriods: 6 },
    { name: 'English', code: 'ENG', classes: classes.map((c) => c._id), weeklyPeriods: 5 },
    { name: 'Hindi', code: 'HIN', classes: classes.map((c) => c._id), weeklyPeriods: 5 },
    { name: 'Science', code: 'SCI', classes: classes.map((c) => c._id), weeklyPeriods: 4 },
    { name: 'Social Studies', code: 'SST', classes: classes.map((c) => c._id), weeklyPeriods: 4 },
    { name: 'Computer Science', code: 'CS', classes: classes.map((c) => c._id), weeklyPeriods: 2 },
    { name: 'Physical Education', code: 'PE', classes: classes.map((c) => c._id), weeklyPeriods: 2 },
    { name: 'Art & Craft', code: 'ART', classes: classes.map((c) => c._id), weeklyPeriods: 2 },
  ];

  const subjects = await Subject.create(
    subjectData.map((s) => ({ ...s, schoolId: school._id }))
  );
  console.log('Academic structure created');

  // Create Teachers
  const teachers = await Teacher.create([
    { schoolId: school._id, firstName: 'Priya', lastName: 'Patel', employeeId: 'TCH001', department: 'Mathematics', subjects: [subjects[0]._id], assignedClasses: [classes[0]._id, classes[1]._id], isClassTeacher: true, classTeacherOf: classes[0]._id, status: 'active' },
    { schoolId: school._id, firstName: 'Amit', lastName: 'Singh', employeeId: 'TCH002', department: 'Science', subjects: [subjects[3]._id], assignedClasses: [classes[0]._id, classes[1]._id], isClassTeacher: true, classTeacherOf: classes[1]._id, status: 'active' },
    { schoolId: school._id, firstName: 'Sunita', lastName: 'Gupta', employeeId: 'TCH003', department: 'English', subjects: [subjects[1]._id], assignedClasses: [classes[0]._id, classes[1]._id], isClassTeacher: false, status: 'active' },
    { schoolId: school._id, firstName: 'Rahul', lastName: 'Joshi', employeeId: 'TCH004', department: 'Computer Science', subjects: [subjects[5]._id], assignedClasses: [classes[0]._id, classes[1]._id], isClassTeacher: false, status: 'active' },
  ]);

  // Update user profiles
  users[2].profileId = teachers[0]._id; users[2].profileModel = 'Teacher'; await users[2].save();
  users[3].profileId = teachers[1]._id; users[3].profileModel = 'Teacher'; await users[3].save();

  await SchoolClass.findByIdAndUpdate(classes[0]._id, { classTeacher: teachers[0]._id });
  await SchoolClass.findByIdAndUpdate(classes[1]._id, { classTeacher: teachers[1]._id });

  // Create Students
  const studentNames = [
    { first: 'Arjun', last: 'Kumar' }, { first: 'Sneha', last: 'Verma' },
    { first: 'Rohit', last: 'Sharma' }, { first: 'Ananya', last: 'Singh' },
    { first: 'Vivaan', last: 'Patel' }, { first: 'Ishita', last: 'Gupta' },
    { first: 'Aditya', last: 'Reddy' }, { first: 'Kavya', last: 'Nair' },
    { first: 'Reyansh', last: 'Joshi' }, { first: 'Aaradhya', last: 'Kapoor' },
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const student = await Student.create({
      schoolId: school._id,
      firstName: s.first,
      lastName: s.last,
      dateOfBirth: new Date(`201${i % 5 + 6}-${(i % 12) + 1}-15`),
      gender: i % 2 === 0 ? 'male' : 'female',
      admissionNo: `STU${(i + 1).toString().padStart(4, '0')}`,
      currentClass: classes[i < 5 ? 0 : 1]._id,
      currentSection: sections[i % 2 === 0 ? 0 : 1]._id,
      academicYear: academicYear._id,
      contact: { phone: `+91-98765${i.toString().padStart(5, '0')}` },
      status: 'active',
    });
    students.push(student);
  }

  // Link students to users
  users[4].profileId = students[0]._id; users[4].profileModel = 'Student'; await users[4].save();
  users[5].profileId = students[1]._id; users[5].profileModel = 'Student'; await users[5].save();

  // Create Parents and link
  const parents = await Parent.create([
    { schoolId: school._id, firstName: 'Vikram', lastName: 'Kumar', relation: 'father', contact: { phone: '+91-9876543211', email: 'vikram.kumar@email.com' }, students: [students[0]._id] },
    { schoolId: school._id, firstName: 'Neha', lastName: 'Verma', relation: 'mother', contact: { phone: '+91-9876543212', email: 'neha.verma@email.com' }, students: [students[1]._id] },
  ]);

  users[6].profileId = parents[0]._id; users[6].profileModel = 'Parent'; await users[6].save();
  users[7].profileId = parents[1]._id; users[7].profileModel = 'Parent'; await users[7].save();

  students[0].parents = [parents[0]._id]; await students[0].save();
  students[1].parents = [parents[1]._id]; await students[1].save();
  console.log('Students and Parents created');

  // Generate Timetable
  const timetable = await Timetable.create({
    schoolId: school._id,
    schoolClass: classes[0]._id,
    section: sections[0]._id,
    academicYear: academicYear._id,
    totalPeriodsPerDay: 8,
    lunchBreakAfter: 4,
    status: 'published',
    isAutoGenerated: true,
    periods: [
      { day: 1, periodNo: 1, subject: subjects[0]._id, teacher: teachers[0]._id },
      { day: 1, periodNo: 2, subject: subjects[1]._id, teacher: teachers[2]._id },
      { day: 1, periodNo: 3, subject: subjects[3]._id, teacher: teachers[1]._id },
      { day: 1, periodNo: 4, subject: subjects[2]._id },
      { day: 1, periodNo: 5, isLunch: true },
      { day: 1, periodNo: 6, subject: subjects[4]._id },
      { day: 1, periodNo: 7, subject: subjects[5]._id, teacher: teachers[3]._id },
      { day: 1, periodNo: 8, subject: subjects[6]._id },
      { day: 2, periodNo: 1, subject: subjects[1]._id, teacher: teachers[2]._id },
      { day: 2, periodNo: 2, subject: subjects[0]._id, teacher: teachers[0]._id },
      { day: 2, periodNo: 3, subject: subjects[4]._id },
      { day: 2, periodNo: 4, subject: subjects[3]._id, teacher: teachers[1]._id },
      { day: 2, periodNo: 5, isLunch: true },
      { day: 2, periodNo: 6, subject: subjects[2]._id },
      { day: 2, periodNo: 7, subject: subjects[7]._id },
      { day: 2, periodNo: 8, subject: subjects[5]._id, teacher: teachers[3]._id },
    ],
  });
  console.log('Timetable generated');

  // Create Attendance (last 2 weeks)
  const today = new Date();
  for (let d = 14; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    await Attendance.create({
      schoolId: school._id,
      date,
      schoolClass: classes[0]._id,
      section: sections[0]._id,
      students: students.slice(0, 5).map((s) => ({
        student: s._id,
        status: Math.random() > 0.15 ? 'present' : Math.random() > 0.5 ? 'absent' : 'late',
      })),
      markedBy: users[2]._id,
      source: 'manual',
      summary: { present: 4, absent: 1, late: 0, leave: 0, total: 5 },
    });
  }
  console.log('Attendance created');

  // Create Homework
  await Homework.create([
    { schoolId: school._id, title: 'Math Worksheet 1', description: 'Complete pages 10-15', subject: subjects[0]._id, schoolClass: classes[0]._id, teacher: teachers[0]._id, dueDate: new Date(today.getTime() + 2 * 86400000) },
    { schoolId: school._id, title: 'English Essay', description: 'Write about your summer vacation', subject: subjects[1]._id, schoolClass: classes[0]._id, teacher: teachers[2]._id, dueDate: new Date(today.getTime() + 4 * 86400000) },
    { schoolId: school._id, title: 'Science Project', description: 'Make a working model of solar system', subject: subjects[3]._id, schoolClass: classes[0]._id, teacher: teachers[1]._id, dueDate: new Date(today.getTime() + 7 * 86400000) },
  ]);
  console.log('Homework created');

  // Create Exam & Marks
  const exam = await Exam.create({
    schoolId: school._id,
    name: 'Mid-Term Examination 2024',
    academicYear: academicYear._id,
    schoolClass: classes[0]._id,
    subjects: subjects.slice(0, 5).map((s) => ({ subject: s._id, maxMarks: 100, passMarks: 40 })),
    startDate: new Date('2024-09-15'),
    endDate: new Date('2024-09-25'),
    type: 'midterm',
    status: 'published',
  });

  for (const student of students.slice(0, 5)) {
    for (const subject of subjects.slice(0, 5)) {
      const marks = Math.floor(Math.random() * 50) + 50;
      await Mark.create({
        schoolId: school._id,
        exam: exam._id,
        subject: subject._id,
        student: student._id,
        marksObtained: marks,
        maxMarks: 100,
        passMarks: 40,
        grade: marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B+' : marks >= 60 ? 'B' : marks >= 50 ? 'C' : 'F',
        percentage: marks,
        enteredBy: users[2]._id,
      });
    }
  }
  console.log('Exam and Marks created');

  // Create Fee Structure & Transactions
  const feeStructure = await FeeStructure.create({
    schoolId: school._id,
    name: 'Annual Fee 2024-25',
    academicYear: academicYear._id,
    schoolClass: [classes[0]._id],
    categories: [
      { name: 'Tuition Fee', type: 'tuition', amount: 24000, frequency: 'monthly' },
      { name: 'Transport Fee', type: 'transport', amount: 6000, frequency: 'monthly', isOptional: true },
      { name: 'Library Fee', type: 'library', amount: 2000, frequency: 'annual' },
    ],
    totalAmount: 32000,
    lateFeePerDay: 10,
  });

  for (const student of students.slice(0, 5)) {
    await FeeTransaction.create({
      schoolId: school._id,
      student: student._id,
      feeStructure: feeStructure._id,
      academicYear: academicYear._id,
      amount: 32000,
      paidAmount: Math.random() > 0.3 ? 32000 : 16000,
      balance: Math.random() > 0.3 ? 0 : 16000,
      status: Math.random() > 0.3 ? 'paid' : 'partial',
      paymentMethod: Math.random() > 0.5 ? 'online' : 'cash',
      paymentDate: new Date(),
    });
  }
  console.log('Fees created');

  // Create Notices
  await Notice.create([
    { schoolId: school._id, title: 'PTM Scheduled', content: 'Parent-Teacher meeting on 15th November.', category: 'event', scope: 'school', status: 'published', isPinned: true, createdBy: users[1]._id },
    { schoolId: school._id, title: 'Winter Break Notice', content: 'School will remain closed from 25th Dec to 5th Jan.', category: 'holiday', scope: 'school', status: 'published', createdBy: users[1]._id },
    { schoolId: school._id, title: 'Science Fair', content: 'Annual Science Fair on 20th December. All students must participate.', category: 'event', scope: 'school', status: 'published', createdBy: users[1]._id },
  ]);
  console.log('Notices created');

  // Create Calendar Events
  await CalendarEvent.create([
    { schoolId: school._id, title: 'Independence Day', type: 'holiday', startDate: new Date('2024-08-15'), isFullDay: true, createdBy: users[1]._id },
    { schoolId: school._id, title: 'Gandhi Jayanti', type: 'holiday', startDate: new Date('2024-10-02'), isFullDay: true, createdBy: users[1]._id },
    { schoolId: school._id, title: 'Mid-Term Exams', type: 'exam', startDate: new Date('2024-09-15'), endDate: new Date('2024-09-25'), isFullDay: false, createdBy: users[1]._id },
    { schoolId: school._id, title: 'Annual Sports Day', type: 'sports_day', startDate: new Date('2024-12-15'), isFullDay: true, createdBy: users[1]._id },
    { schoolId: school._id, title: 'Parent-Teacher Meeting', type: 'ptm', startDate: new Date('2024-11-15'), isFullDay: false, createdBy: users[1]._id },
  ]);
  console.log('Calendar events created');

  // Create Recognition
  for (const student of students.slice(0, 5)) {
    await RecognitionPoint.create({
      schoolId: school._id,
      student: student._id,
      awardedBy: teachers[0]._id,
      points: Math.floor(Math.random() * 5) + 1,
      category: ['academic', 'behavior', 'participation'][Math.floor(Math.random() * 3)],
      note: 'Good performance',
    });
  }

  await Badge.create([
    { schoolId: school._id, name: 'Star Student', description: 'Awarded for outstanding academic performance', category: 'star_student', isActive: true },
    { schoolId: school._id, name: 'Homework Hero', description: 'Awarded for completing all homework on time', category: 'homework_hero', isActive: true },
    { schoolId: school._id, name: 'Perfect Attendance', description: 'Awarded for perfect attendance record', category: 'perfect_attendance', isActive: true },
  ]);
  console.log('Recognition points and badges created');

  // Create Complaint
  await Complaint.create({
    schoolId: school._id,
    type: 'parent',
    isAnonymous: true,
    subject: 'Canteen food quality',
    description: 'The canteen food quality has been declining. Request immediate attention.',
    status: 'open',
  });
  console.log('Complaint created');

  // Create Leave
  await Leave.create({
    schoolId: school._id,
    requester: users[2]._id,
    requesterModel: 'Teacher',
    type: 'sick',
    startDate: new Date(today.getTime() + 10 * 86400000),
    endDate: new Date(today.getTime() + 12 * 86400000),
    reason: 'Medical leave',
    status: 'pending',
  });
  console.log('Leave request created');

  // Create Syllabus
  await Syllabus.create({
    schoolId: school._id,
    subject: subjects[0]._id,
    schoolClass: classes[0]._id,
    academicYear: academicYear._id,
    chapters: [
      { name: 'Numbers', order: 1, totalClasses: 10, completedClasses: 8, status: 'in_progress' },
      { name: 'Addition & Subtraction', order: 2, totalClasses: 12, completedClasses: 5, status: 'in_progress' },
      { name: 'Multiplication', order: 3, totalClasses: 10, completedClasses: 0, status: 'not_started' },
    ],
    totalCompletion: 35,
  });
  console.log('Syllabus created');

  console.log('\n--- Seed completed successfully! ---');
  console.log('\nDemo Credentials:');
  console.log('  Super Admin:   admin@instique.com / password123');
  console.log('  School Admin:  schooladmin@springfield.edu / password123');
  console.log('  Teacher:       teacher1@springfield.edu / password123');
  console.log('  Student:       student1@springfield.edu / password123');
  console.log('  Parent:        parent1@springfield.edu / password123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
