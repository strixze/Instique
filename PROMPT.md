# INSTIQUE — PRODUCTION-GRADE PARENT MEETING / PTM MODULE

Implement a complete, production-grade Parent Meeting / Parent-Teacher Meeting (PTM) feature in the existing Instique School ERP.

This must be a REAL working feature.

Do NOT create a frontend-only mockup.
Do NOT use static/mock parent, student, teacher, class, or meeting data.
Do NOT create duplicate models or systems that already exist.
Do NOT break existing functionality.

The feature must use:

- Existing authentication
- Existing RBAC
- Existing school/tenant architecture
- Existing Student model
- Existing Parent model
- Existing Teacher model
- Existing Class/Section model
- Existing Events module
- Existing Academic Calendar
- Existing Notifications
- Existing database architecture
- Existing API architecture
- Existing reusable UI components

The final implementation must persist all data in the real database and work after refresh/logout/login.

==================================================
1. FIRST — INSPECT THE EXISTING CODEBASE
==================================================

Before writing code, inspect the application and identify:

1. Existing Parent Meeting functionality, if any
2. Existing Event model/schema
3. Existing Student model
4. Existing Parent/Guardian relationships
5. Existing Teacher model
6. Existing Class/Section model
7. Existing authentication
8. Existing RBAC
9. Existing notification service
10. Existing calendar/event system
11. Existing audit logs
12. Existing API/service/controller architecture
13. Existing database/query architecture
14. Existing reusable UI components
15. Existing dashboard components

Reuse existing infrastructure.

If something already exists, extend it instead of creating a duplicate.

==================================================
2. CORE PTM WORKFLOW
==================================================

Implement:

Admin
  ↓
Create Parent Meeting
  ↓
Select date/time
  ↓
Select classes/sections
  ↓
Auto-determine students and parents
  ↓
Assign teachers
  ↓
Save Draft
  ↓
Publish
  ↓
Notify relevant parents
  ↓
Parent views meeting
  ↓
Parent responds/RSVPs
  ↓
Meeting takes place
  ↓
Teacher/Admin records parent attendance
  ↓
Teacher adds meeting notes
  ↓
Meeting completed

Do NOT implement complex appointment-slot booking in the first version.

==================================================
3. MEETING STATUS
==================================================

Use:

DRAFT
PUBLISHED
COMPLETED
CANCELLED

Workflow:

DRAFT
  ↓
PUBLISHED
  ↓
COMPLETED

Alternative:

PUBLISHED
  ↓
CANCELLED

Do not allow arbitrary invalid status transitions.

Status must be persisted in the database.

==================================================
4. MEETING TYPES
==================================================

Support:

- Parent Teacher Meeting
- Academic Review
- Progress Discussion
- Behaviour Discussion
- General Parent Meeting
- Other

If the application already has configurable categories, reuse them.

==================================================
5. ADMIN — PARENT MEETINGS PAGE
==================================================

Create a professional Parent Meetings management page.

Header:

Parent Meetings

Schedule and manage parent-teacher meetings.

Primary action:

+ Schedule Meeting

Summary information:

Upcoming Meetings
Today
Completed
Parents Invited

These values MUST be calculated from real database data.

Do not hardcode numbers.

Example only:

Upcoming Meetings    3
Today                 1
Completed            12
Parents Invited      84

==================================================
6. ADMIN MEETING LIST
==================================================

Use a professional enterprise-style table/list.

Columns:

Date
Meeting
Type
Classes
Teachers
Parents Invited
Status
Actions

Example:

24 Aug
Parent Teacher Meeting
Grade 5A, 5B
4 Teachers
68 Parents
Upcoming

Actions:

View
Edit
Publish
Cancel
Manage Attendance

Only show actions allowed by the current user's permissions and meeting state.

==================================================
7. SEARCH
==================================================

Add:

Search meetings...

Search by:

- Meeting title
- Meeting type
- Class/section
- Teacher
- Date where appropriate

Use the real database/query layer.

Do not filter static frontend arrays if server-side querying already exists.

==================================================
8. FILTERS
==================================================

Add:

Status
- All
- Draft
- Published
- Completed
- Cancelled

Meeting Type

Class / Section

Teacher

Date Range

Academic Year

Filters must actually affect the displayed data.

Provide:

Reset Filters

==================================================
9. CREATE / SCHEDULE MEETING
==================================================

Clicking:

+ Schedule Meeting

should open a professional form/modal/drawer/page according to the existing application architecture.

Fields:

Meeting Title *
Meeting Type *
Description

Date *
Start Time *
End Time *

Location

Instructions

Example:

Parent Teacher Meeting

24 August 2026
10:00 AM – 2:00 PM

Location:
School Auditorium

Instructions:
Parents should bring the student's previous report card.

==================================================
10. DATE/TIME VALIDATION
==================================================

Validate:

- Date is valid
- Start time is before end time
- End time cannot be before start time
- Required fields are present

Backend validation is mandatory.

Do not rely only on frontend validation.

==================================================
11. CLASS / SECTION SELECTION
==================================================

Admin selects the classes/sections participating in the PTM.

Example:

Classes:

☑ Grade 5A
☑ Grade 5B
☐ Grade 6A
☐ Grade 6B

Provide:

Search classes...

Select All

Clear All

Classes MUST come from the actual database.

Do not hardcode class names.

==================================================
12. AUTOMATIC STUDENT DETECTION
==================================================

This is important.

When admin selects:

Grade 5A
Grade 5B

the system should automatically determine:

Selected Classes
↓
Students in those classes
↓
Parent/Guardian relationships
↓
Relevant parents

Example:

Selected Classes:
Grade 5A
Grade 5B

Students:
72

Parents/Guardians:
68

Parents Invited:
68

Do NOT make the admin manually select every parent.

Use the existing Student → Parent relationship.

==================================================
13. MULTIPLE CHILDREN
==================================================

A parent may have multiple children in the selected classes.

Do NOT create duplicate parent invitations unnecessarily.

Example:

Parent:
Rahul Sharma

Children:
Aarav Sharma — Grade 5A
Ananya Sharma — Grade 8B

If both children are part of the meeting:

Parent should receive ONE meeting invitation.

But the meeting should retain both child relationships.

Conceptually:

Meeting
├── Parent Rahul
│   ├── Aarav — Grade 5A
│   └── Ananya — Grade 8B

Do not create two duplicate parent meeting records.

==================================================
14. TEACHER ASSIGNMENT
==================================================

Allow admin to assign participating teachers.

Teachers must come from the existing teacher/staff database.

Example:

Grade 5A
- Class Teacher
- Mathematics Teacher
- Science Teacher

Grade 5B
- Class Teacher
- English Teacher

If the class already has a class teacher:

Automatically suggest the class teacher.

Admin can modify assignments if authorized.

Do not allow assigning teachers from another school.

==================================================
15. TEACHER-CLASS RELATIONSHIP
==================================================

Where possible, automatically recommend teachers based on:

Class
+
Subject assignment
+
Class teacher assignment

Do not randomly assign teachers.

Use existing academic relationships.

==================================================
16. PARENT INVITATION RECORDS
==================================================

Do not simply calculate parents every time and lose the historical invitation state.

When a meeting is published, create appropriate meeting-participant/invitation records.

Conceptually:

ParentMeeting
      ↓
MeetingParticipant
      ↓
Parent
      ↓
Student/Child relationship

Store:

- meetingId
- parentId
- studentId
- invitedAt
- RSVP status
- attendance status

Follow the existing schema conventions.

==================================================
17. PARENT RSVP
==================================================

For MVP, support:

GOING
NOT_GOING
MAYBE

Default:

PENDING

Parent can respond from the Parent Dashboard.

Example:

Parent Teacher Meeting
24 Aug 2026
10:00 AM – 2:00 PM

Child:
Aarav Sharma — Grade 5A

Your response:

[ Going ] [ Maybe ] [ Not Going ]

Persist the response in the database.

After refresh, the response must remain.

==================================================
18. PARENT DASHBOARD
==================================================

Add an Upcoming Parent Meetings section.

Example:

Upcoming Parent Meeting

Parent Teacher Meeting
24 Aug 2026
10:00 AM – 2:00 PM

Aarav Sharma
Grade 5A

[View Details]

If the parent has multiple children:

Show the relevant child relationships.

Do not show meetings belonging to unrelated students.

==================================================
19. PARENT MEETING DETAILS — PARENT

Show:

Meeting title
Type
Date
Time
Location
Instructions
Child/children
Assigned teacher(s)
RSVP status

Example:

Parent Teacher Meeting

24 August 2026
10:00 AM – 2:00 PM

Location:
School Auditorium

Children:

Aarav Sharma
Grade 5A

Teacher:
Mrs. Sharma

Response:
Going

==================================================
20. TEACHER DASHBOARD
==================================================

Teachers should see:

Upcoming Parent Meetings

Example:

Parent Teacher Meeting
24 Aug
10:00 AM – 2:00 PM

Classes:
Grade 5A
Grade 5B

[View Meeting]

Teacher must only see meetings they are assigned to or otherwise authorized to see.

==================================================
21. TEACHER MEETING VIEW
==================================================

Teacher opens a meeting:

Parent Teacher Meeting

24 Aug 2026
10:00 AM – 2:00 PM

Assigned Classes:

Grade 5A

Students:

Student
Parent
RSVP
Attendance
Notes

Aarav Sharma
Rahul Sharma
Going
Pending

Ananya Patil
Priya Patil
Not Going
-

The teacher should only see students relevant to their assigned class/meeting scope.

==================================================
22. PARENT ATTENDANCE
==================================================

IMPORTANT:

Do NOT confuse PTM attendance with student attendance.

This is:

Parent Meeting Attendance

Statuses:

PENDING
ATTENDED
ABSENT
NOT_SCHEDULED

Teacher/Admin can mark:

ATTENDED
ABSENT

Store:

meetingId
parentId
studentId
status
markedBy
markedAt

Use the actual authenticated user as markedBy.

==================================================
23. MULTIPLE CHILDREN ATTENDANCE
==================================================

If one parent has multiple children in the same PTM:

Do not incorrectly count the parent twice.

Example:

Rahul Sharma
├── Aarav — Grade 5A
└── Ananya — Grade 8B

Parent attendance should be represented correctly.

The UI can show:

Rahul Sharma
2 children

Attended

Do not double-count the parent in overall attendance statistics.

==================================================
24. MEETING NOTES
==================================================

Teachers should be able to add notes for individual students.

Example:

Student:
Aarav Sharma

Academic Performance:
Good progress in Mathematics.

Behaviour:
Participates actively.

Areas to Improve:
Reading comprehension.

Action Items:
Practice reading 20 minutes daily.

[Save Notes]

Persist notes in the database.

Do not store notes only in frontend state.

==================================================
25. NOTE VISIBILITY
==================================================

Support note visibility if practical:

INTERNAL
PARENT_VISIBLE

Internal:
Visible only to authorized school staff.

Parent Visible:
Visible to the relevant parent.

IMPORTANT:

Never expose internal notes to parents.

If this is too large for the current MVP architecture, implement staff-only notes first and leave parent-visible notes as a future extension.

==================================================
26. MEETING COMPLETION
==================================================

After the meeting date/time has passed, admin should be able to mark:

COMPLETED

Do not automatically mark it completed solely on frontend rendering.

Persist the status.

Admin can then view:

Parents Invited
Parents Attended
Parents Absent
RSVP breakdown
Teacher notes
Meeting summary

==================================================
27. MEETING SUMMARY
==================================================

For completed meetings:

Show:

Parents Invited
68

Going
52

Maybe
8

Not Going
8

Attended
48

Absent
20

Attendance Rate
70.6%

All values must be calculated from actual database records.

Do not hardcode.

==================================================
28. ADMIN MEETING DETAILS
==================================================

Create a professional details page/drawer:

Parent Teacher Meeting

PUBLISHED

24 August 2026
10:00 AM – 2:00 PM

School Auditorium

Classes
Grade 5A
Grade 5B

Teachers
4

Parents Invited
68

────────────────────────

Attendance

48 Attended
20 Absent

────────────────────────

Teachers

Mrs. Sharma
Mr. Patel
Ms. Joshi

────────────────────────

Actions

Edit
Cancel
Manage Attendance
Complete Meeting

Use the existing Instique design system.

==================================================
29. ATTENDANCE MANAGEMENT
==================================================

Provide a dedicated attendance interface.

Example:

Parent Meeting Attendance

Search parent/student...

[All] [Attended] [Absent] [Pending]

Parent             Student       Status

Rahul Sharma       Aarav         ✓ Attended
Priya Patil        Ananya        Pending
Amit More          Rohan         ✕ Absent

Provide:

Mark Attended
Mark Absent

Use bulk actions if useful.

Do not modify regular student attendance.

==================================================
30. EVENTS / CALENDAR INTEGRATION
==================================================

CRITICAL:

Do NOT create a completely separate calendar system.

A Parent Meeting should integrate with the existing Events/Academic Calendar architecture.

Conceptually:

Academic Calendar
├── Holidays
├── Exams
├── Events
└── Parent Meetings

When a Parent Meeting is created/published:

It should appear in the existing calendar.

Type:

PARENT_MEETING

Use the existing calendar/event model if possible.

Do not duplicate calendar functionality.

==================================================
31. EVENT RELATIONSHIP

If the existing Events system supports event types:

Create the PTM as a specialized event or associate the ParentMeeting with an Event.

Preferred architecture if compatible with the existing code:

Event
  ↓
Parent Meeting
  ↓
Meeting participants
  ↓
Attendance / Notes

Do NOT create two unrelated calendar entries for the same meeting.

There should be one source of truth for the meeting date/time.

==================================================
32. NOTIFICATIONS
==================================================

Use the existing notification system.

When the meeting is published:

Parent Meeting
↓
Determine relevant parents
↓
Existing Notification Service
↓
Notify parents

Notification example:

Parent Teacher Meeting

24 August
10:00 AM – 2:00 PM

Your child's school has scheduled a Parent Teacher Meeting.

Child:
Aarav Sharma
Grade 5A

Location:
School Auditorium

Do not create a separate notification architecture.

==================================================
33. NOTIFICATION EVENTS

Possible notification triggers:

Meeting Published
Meeting Updated
Meeting Cancelled

Do NOT send notifications for every small internal change.

If the meeting date/time changes after publication:

Notify affected parents.

If the meeting is cancelled:

Notify affected parents.

==================================================
34. ADMIN PAGE FILTERS

Support:

Search

Status:
All
Draft
Published
Completed
Cancelled

Class/Section

Teacher

Meeting Type

Date

Academic Year

Use real database queries.

==================================================
35. PAGINATION

If there are many meetings:

Use server-side pagination according to the existing architecture.

Example:

Showing 1–20 of 84 meetings

Do not load thousands of records unnecessarily.

==================================================
36. DATABASE MODEL

Inspect the current schema first.

If no ParentMeeting model exists, use a structure similar to:

ParentMeeting
├── id
├── schoolId
├── eventId (optional/depending on architecture)
├── title
├── type
├── description
├── startDate
├── endDate
├── startTime
├── endTime
├── location
├── instructions
├── status
├── createdById
├── publishedAt
├── completedAt
├── createdAt
└── updatedAt

ParentMeetingClass
├── id
├── meetingId
├── classId
└── sectionId

ParentMeetingTeacher
├── id
├── meetingId
├── teacherId
├── classId
└── sectionId

ParentMeetingParticipant
├── id
├── meetingId
├── parentId
├── studentId
├── rsvpStatus
├── attendanceStatus
├── invitedAt
├── respondedAt
├── attendedAt
└── updatedAt

ParentMeetingNote
├── id
├── meetingId
├── studentId
├── teacherId
├── note
├── visibility
├── createdAt
└── updatedAt

Use existing naming conventions.

Do not create duplicate relationships if they already exist.

==================================================
37. SCHOOL / TENANT ISOLATION

CRITICAL.

Every query must be scoped to the authenticated school.

Never trust schoolId from frontend input.

Backend must derive school/institution from authenticated user/session.

School A must NEVER be able to:

- View School B meetings
- Create meetings for School B
- Assign School B teachers
- See School B parents
- See School B students
- Modify School B attendance

Test tenant isolation for every endpoint.

==================================================
38. RBAC

Use existing RBAC.

School Admin:
- Create
- Edit
- Publish
- Cancel
- Assign teachers
- View all relevant meeting data
- Manage attendance
- Complete meetings
- View reports

Teacher:
- View assigned meetings
- View assigned students
- Manage parent meeting attendance for their scope
- Add notes

Parent:
- View relevant meetings
- RSVP
- View parent-visible information

Student:
- Do not expose management features.
- Only show meeting information if the existing product requirements explicitly require student visibility.

==================================================
39. PARENT-CHILD SECURITY

A parent must only see meetings involving their own child/children.

Do NOT trust a frontend childId.

Backend must verify:

authenticated parent
↓
parent-child relationship
↓
student belongs to parent
↓
meeting includes student's class/student

If the parent manually changes childId in an API request, the backend must reject unauthorized access.

==================================================
40. TEACHER SECURITY

A teacher should only see students/classes/meetings they are authorized to access.

Do not allow:

Teacher A
↓
modify attendance
↓
for students assigned only to Teacher B

unless Teacher A has the required administrative permission.

==================================================
41. API

Follow existing API conventions.

Potential endpoints:

GET /parent-meetings
GET /parent-meetings/:id
POST /parent-meetings
PATCH /parent-meetings/:id
DELETE /parent-meetings/:id

Publish:
PATCH /parent-meetings/:id/publish

Cancel:
PATCH /parent-meetings/:id/cancel

Complete:
PATCH /parent-meetings/:id/complete

RSVP:
POST /parent-meetings/:id/rsvp

Attendance:
PATCH /parent-meetings/:id/attendance

Notes:
POST /parent-meetings/:id/notes

Use the project's existing endpoint conventions.

Do not blindly create these endpoints if equivalent APIs already exist.

==================================================
42. VALIDATION

Backend validation is mandatory.

Validate:

- Title
- Type
- Date
- Start/end time
- Classes
- Teachers
- Parent relationships
- Student relationships
- Status transitions
- RSVP ownership
- Attendance permissions
- Note permissions

End time must be after start time.

Do not allow invalid class IDs or teacher IDs from another school.

==================================================
43. UI DESIGN

Use the existing Instique design language.

The Parent Meetings page should feel consistent with:

- Events
- Admissions
- Exams
- Attendance
- Fees

Use:

- Light/neutral background
- Instique green
- Thin borders
- Compact professional typography
- Restrained cards
- Professional tables
- Status badges
- Clear page hierarchy
- Subtle hover states

Avoid:

- Excessive rounded cards
- Glassmorphism
- Neon colors
- Giant icons
- Gamification
- Excessive animations
- Generic AI dashboard patterns

==================================================
44. ADMIN PAGE UI

Recommended:

Parent Meetings                          + Schedule Meeting

Schedule and manage parent-teacher meetings.

[Upcoming 3] [Today 1] [Completed 12] [Parents Invited 84]

[Search...] [Status] [Class] [Teacher] [Date]

────────────────────────────────────────────────────────────

Date       Meeting             Classes       Teachers    Status

24 Aug     Parent Teacher Meet Grade 5A      4           Upcoming
28 Aug     Academic Review     Grade 8       3           Upcoming
10 Aug     Progress Meeting    Grade 10      5           Completed

────────────────────────────────────────────────────────────

Keep it information-dense and professional.

Do not turn every value into a large card.

==================================================
45. PARENT UI

Parent Dashboard:

Upcoming Parent Meetings

24 Aug

Parent Teacher Meeting

Aarav Sharma
Grade 5A

10:00 AM – 2:00 PM

[View Details]

[Going] [Maybe] [Not Going]

Keep the parent interface simpler than the admin interface.

==================================================
46. TEACHER UI

Teacher Dashboard:

Upcoming Parent Meetings

24 Aug

Parent Teacher Meeting

Grade 5A

10:00 AM – 2:00 PM

[View Meeting]

Inside:

Students
Parent RSVP
Attendance
Notes

Keep teacher workflows fast.

==================================================
47. EMPTY STATES

Admin:

No parent meetings found.

[Schedule Meeting]

Parent:

No upcoming parent meetings.

Teacher:

No assigned parent meetings.

Do not show empty cards with fake statistics.

==================================================
48. LOADING STATES

Use skeleton loaders for:

- Meeting statistics
- Meeting list
- Meeting details
- Participants
- Attendance

Do not show blank screens.

==================================================
49. ERROR STATES

Example:

Unable to load parent meetings.

Something went wrong while loading the meetings.

[Try Again]

Never expose:

SQL errors
MongoDB errors
Stack traces
Internal API details

==================================================
50. RESPONSIVE DESIGN

Desktop:
Professional table.

Tablet:
Compact table.

Mobile:
Meeting cards.

Example:

Parent Teacher Meeting

24 Aug 2026
10:00 AM – 2:00 PM

Grade 5A
4 Teachers

Upcoming

[View]

Do not force the desktop table onto mobile.

==================================================
51. AUDIT LOGGING

If the existing audit system exists, record:

Meeting Created
Meeting Updated
Meeting Published
Meeting Cancelled
Teacher Assigned
Parent RSVP
Attendance Updated
Note Added
Meeting Completed

Use the existing audit system.

Do not create a separate audit architecture.

==================================================
52. DO NOT OVERBUILD MVP

Do NOT implement:

- Complex time-slot booking
- Video meetings
- Google Meet/Zoom integration
- Payments
- AI meeting summaries
- AI teacher assignment
- Parent-teacher chat
- Voice notes
- Complex recurring PTMs
- External calendar synchronization
- Advanced analytics

MVP is:

CREATE
→ SELECT CLASSES
→ AUTO-FETCH STUDENTS/PARENTS
→ ASSIGN TEACHERS
→ PUBLISH
→ NOTIFY
→ PARENT VIEW
→ RSVP
→ MEETING ATTENDANCE
→ TEACHER NOTES
→ COMPLETE

==================================================
53. TEST COMPLETE FLOW

ADMIN:

1. Login as School Admin.
2. Open Parent Meetings.
3. Create a meeting.
4. Select classes.
5. Verify students are automatically detected.
6. Verify parents are automatically detected.
7. Verify duplicate parents are handled correctly.
8. Assign teachers.
9. Save Draft.
10. Refresh.
11. Verify draft persists.
12. Publish meeting.
13. Verify status changes.
14. Verify relevant parents receive notifications.
15. Open meeting details.
16. Verify participant counts.
17. Manage attendance.
18. Complete meeting.
19. Verify summary.

TEACHER:

1. Login as Teacher.
2. Verify only assigned meetings appear.
3. Open meeting.
4. Verify relevant students appear.
5. Mark parent attendance.
6. Add student-specific notes.
7. Refresh.
8. Verify notes and attendance persist.

PARENT:

1. Login as Parent.
2. Verify relevant meeting appears.
3. Verify correct child/children.
4. Open details.
5. RSVP.
6. Refresh.
7. Verify RSVP persists.
8. Verify parent can only access their own children.
9. Verify internal notes are not visible.

SECURITY:

1. Test RBAC.
2. Test school isolation.
3. Test parent-child relationship.
4. Test teacher scope.
5. Test unauthorized attendance update.
6. Test unauthorized note access.
7. Test invalid class/teacher IDs.
8. Test invalid status transitions.

==================================================
54. FINAL QUALITY BAR

The finished Parent Meeting feature should feel like a natural part of Instique.

It should be:

Professional
Simple
Fast
Secure
Real-data driven
Permission-controlled
Integrated with Events
Integrated with Calendar
Integrated with Notifications
Integrated with Students/Parents/Teachers/Classes

The core experience must be:

ADMIN:
Schedule and manage easily.

TEACHER:
See assigned parents and record meeting outcomes quickly.

PARENT:
Clearly understand when the meeting is, which child it concerns, and respond easily.

Most importantly:

REAL UI
+
REAL API
+
REAL DATABASE
+
REAL AUTHENTICATION
+
REAL RBAC
+
REAL STUDENT/PARENT RELATIONSHIPS
+
REAL TEACHER/CLASS RELATIONSHIPS
+
REAL NOTIFICATIONS
+
REAL CALENDAR INTEGRATION
+
REAL PERSISTENCE

Do not implement a frontend-only PTM mockup.