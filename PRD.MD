1. Product Vision

Instique is a unified digital operating system for schools that brings academic management, student management, teacher operations, attendance, timetable, examinations, fees, admissions, communication, and parent engagement into one platform.

The product should replace fragmented workflows such as:

Excel spreadsheets
WhatsApp groups
paper attendance
manual fee tracking
disconnected timetable tools
paper leave applications
separate exam/marks systems
manual parent communication

with one connected system.

Vision

Make running a school simpler, faster, and more accountable.

Instique should not feel like an ERP designed for accountants.

It should feel like a modern operating system for a school.

2. Problem Statement

Schools typically manage information across disconnected systems.

Current problems
Administration
Student information is fragmented.
Admissions are often handled manually.
Fees require manual follow-up.
Teacher leave affects timetables.
Timetable conflicts are difficult to identify.
School-wide analytics are difficult to obtain.
Teachers
Attendance takes unnecessary time.
Marks entry is inefficient.
Homework communication is fragmented.
Leave requests are manual.
Timetable changes are difficult to communicate.
Parents
They lack a single source of truth.
Attendance information is delayed.
Homework is scattered across communication channels.
Timetable access is inconvenient.
Fee status requires contacting the school.
School leadership
There is limited real-time visibility.
Important problems are discovered late.
Data is available but not actionable. 3. Product Goals
Primary goals
G1 — Centralize school operations

Create one platform for:

Students
Teachers
Classes
Timetable
Attendance
Homework
Exams
Marks
Fees
Admissions
Leaves
Notifications
Analytics
G2 — Reduce administrative work

Automate repetitive processes such as:

attendance calculations
fee status
leave workflows
timetable conflict detection
notifications
academic progress tracking
G3 — Improve parent visibility

Parents should be able to see relevant information without repeatedly contacting the school.

G4 — Improve teacher productivity

Common teacher tasks should require minimal interaction.

G5 — Give administrators actionable visibility

The admin dashboard should answer:

What is happening in my school today?

and:

What requires my attention?

4. Non-Goals

Instique should NOT attempt to become everything for everyone.

Initial product scope should NOT include:

generic HR software
full accounting ERP
payroll system
hospital/medical management
generic CRM
social network
generic LMS competing with dedicated LMS products
AI chatbot as a primary feature
unnecessary gamification

AI features can be introduced later where they solve a measurable problem.

5. User Roles

Instique has four primary user types.

5.1 School Admin

Responsible for:

school configuration
users
students
teachers
classes
academic structure
timetable
attendance oversight
examinations
fees
admissions
leave approvals
reports
notifications
analytics
5.2 Teacher

Responsible for:

assigned classes
attendance
homework
marks
timetable
syllabus progress
student information within authorization
leave requests
5.3 Parent

Responsible for monitoring:

child attendance
timetable
homework
exams
marks
fees
notices
leave requests
academic progress
5.4 Student

Depending on the enabled product configuration, students can access:

timetable
homework
attendance
examinations
marks
syllabus/progress
notices
leaderboard

Student permissions must remain restricted by school configuration and role.

6. Core Product Architecture

The product is organized into:

INSTIQUE
│
├── Authentication
│
├── Dashboard
│
├── Students
│
├── Teachers
│
├── Classes
│
├── Timetable
│
├── Attendance
│
├── Homework
│
├── Syllabus
│
├── Examinations
│
├── Marks
│
├── Leaderboard
│
├── Admissions
│
├── Fees
│
├── Leaves
│
├── Notifications
│
├── Reports / Analytics
│
└── Settings 7. Authentication & User Management
Objective

Provide secure authentication and role-based access.

Requirements

Users must be able to:

login
logout
refresh sessions
reset password
maintain authenticated sessions
access only authorized resources
Role-based access

Every API and protected UI route must respect:

School
↓
Role
↓
Permission
↓
Resource

Example:

A parent must not be able to access another student's information by changing a URL or API parameter.

8. School Administration

Admin should be able to configure school-level information.

School profile
school name
logo
address
contact details
academic year
working days
timezone
other existing configuration
Academic configuration
academic year
grades/classes
sections
subjects
periods
working days
rooms
grading configuration
User management
admins
teachers
parents
students
Permission management

Admin should be able to control access to appropriate modules.

9. Admin Dashboard

The dashboard is the school's operational command center.

It should answer:

What is happening today?

What needs attention?

Key metrics

Examples:

total students
total teachers
today's attendance
fees collected
pending fees

Metrics must use real data.

Needs Attention

Potential items:

low student attendance
pending admissions
pending fees
teacher leave requests
timetable conflicts
other actionable issues
Attendance overview

Show useful attendance trends.

Avoid decorative analytics.

Today's schedule

Show:

time
subject
teacher
class
room
Design principle

The dashboard should prioritize actionable information over decoration.

10. Student Management
    Objective

Provide a complete student record.

Student listing

Support:

search
filters
class
section
status
pagination
sorting
bulk actions
import/export where supported
Student profile

Student details should include relevant:

Personal
name
DOB
gender
contact
address
identification information
Academic
class
section
subjects
academic year
Attendance
daily attendance
monthly attendance
percentage
trends
Performance
examinations
marks
grades
progress
Fees
fee structure
paid
pending
overdue
Documents

Relevant student documents.

11. Teacher Management
    Teacher listing

Support:

search
filtering
status
subject
assigned classes
actions
Teacher profile

Show:

personal information
subjects
assigned classes
timetable
attendance where applicable
leave history
academic responsibilities 12. Class & Section Management

Admin should manage:

classes
sections
class teachers
student assignment
subject assignment
rooms
capacity
Class details

Show:

class information
section
class teacher
students
timetable
attendance
academic information 13. Timetable Management

Timetable is a core operational module.

Requirements

Admin should be able to:

configure periods
assign subjects
assign teachers
assign rooms
assign classes
identify conflicts
modify schedules
Timetable structure
MON TUE WED THU FRI SAT

P1
P2
P3
P4
P5
P6
P7
P8

Days should be horizontal.

Periods should be vertical.

Conflict detection

System should detect relevant conflicts such as:

Teacher conflict
Room conflict
Class conflict
Section conflict
Period conflict
Teacher availability

When assigning/replacing teachers, the system should identify teachers who are actually free during the relevant period.

14. Timetable Export

Users should be able to download authorized timetable data.

Supported roles:

Admin
Teacher
Parent
Student where applicable
Requirements

Download must generate a real PDF.

It must NOT:

screenshot the page
capture the browser
generate image-only PDFs
PDF

Preferred:

A4 landscape
selectable text
searchable
structured timetable
professional colors
school branding
Parent

Export the selected child's authorized timetable.

Teacher

Export the teacher's authorized timetable.

Admin

Export the currently selected timetable.

15. Attendance Management
    Teacher

Teacher should be able to:

select class
select section
select date
mark attendance
update attendance where authorized
Admin

Admin should see:

school attendance
class attendance
student attendance
teacher attendance where applicable
trends
low-attendance students
Parent

Parent should see:

child's attendance
attendance percentage
attendance history 16. Homework Management

Teachers can:

create homework
assign class/section
assign subject
set due date
add instructions
attach files if supported
edit
delete

Parents/students can:

view homework
see due dates
see relevant subject/class 17. Syllabus Management

Instique should provide structured syllabus tracking.

Hierarchy
Academic Year
↓
Class
↓
Subject
↓
Unit / Chapter
↓
Topic
↓
Subtopic
Teacher

Teacher can:

view assigned syllabus
update progress
mark topics completed
add progress notes
update teaching status
Admin

Admin can:

create syllabus
edit syllabus
monitor progress
compare classes
identify delayed subjects
Parent

Parent can see:

syllabus
completed topics
current progress
upcoming topics where appropriate 18. Examination Management

Admin can configure:

examinations
schedules
classes
subjects
dates
time
rooms
Teacher

Teacher can access relevant examination responsibilities.

Student/Parent

View:

examination schedule
subjects
dates
times
results 19. Marks Entry

Teacher should be able to enter marks efficiently.

Requirements:

student list
subject
exam
marks
validation
save
submit
editing permissions

The UI should prioritize fast data entry.

Validation

Prevent invalid marks.

Example:

Marks < 0
Marks > maximum marks

must be rejected.

20. Results & Performance

System should aggregate existing examination data.

Potential information:

total marks
percentage
grade
subject performance
examination comparison
academic trends

Parent should see authorized child data.

Teacher should see authorized students.

Admin should see school-level information based on permissions.

21. Leaderboard

Leaderboard can provide academic ranking where enabled.

Show:

rank
student
class
score
percentage

Avoid excessive gamification.

The feature should support healthy academic visibility rather than turning the product into a game.

22. Admissions
    Objective

Digitize the student admission workflow.

Application

Potential states:

Draft
Submitted
Under Review
Approved
Rejected
Enrolled
Admin

Can:

review applications
inspect applicant information
review documents
approve
reject
convert approved applicant to student
Notifications

Relevant stakeholders should receive status notifications where configured.

23. Fee Management
    Objective

Provide clear visibility into school fees.

Admin

Manage:

fee structures
student fees
payments
pending amounts
overdue amounts
receipts
reports
Dashboard

Show:

Collected
Pending
Overdue
Parent

Parent can view authorized child's:

fee amount
paid amount
pending amount
payment history
receipts

Payment integration can use the configured payment provider.

24. Leave Management

Leave workflows should be role-specific.

Teacher

Teacher:

Apply Leave
↓
School Admin Review
↓
Approve / Reject
Admin

Admin sees:

teacher
leave dates
reason
duration
timetable impact
Replacement teacher

When approving leave, admin should be able to see teachers who are actually free during the affected periods.

Admin can assign an available replacement teacher.

Parent / Student

Where student leave is enabled:

Parent
↓
Leave Request
↓
Class Teacher
↓
Approve / Reject

The class teacher should receive a notification when a leave request is submitted.

25. Notifications

Instique should provide centralized notifications.

Examples:

Parent
attendance alerts
homework
exam schedule
fee reminders
leave status
school announcements
Teacher
leave requests
timetable changes
assignments
administrative notices
Admin
pending admissions
leave requests
timetable conflicts
fee issues
system notifications

Notifications should be relevant rather than noisy.

26. Global Search

Global search should behave like a command/search system.

Shortcut:

Cmd + K
Ctrl + K

Search potential entities:

students
teachers
classes
pages
other searchable entities
UX
Search
↓
Results
↓
↑ ↓ Navigate
↓
Enter
↓
Existing destination

Search should not require navigating to a dedicated search page.

27. Reports & Analytics

Analytics should be based on actual operational data.

Potential reports:

Students
enrollment
attendance
demographics where appropriate
Academics
examination performance
subject performance
class performance
syllabus progress
Finance
collections
pending
overdue
Staff
teacher workload
leave
attendance where applicable
Operations
timetable conflicts
admissions
attendance issues

Do not add charts simply because charts look impressive.

28. Parent Dashboard

Parent dashboard should prioritize the child's current situation.

Possible structure:

Child
↓
Today's Overview
↓
Attendance
↓
Today's Timetable
↓
Homework
↓
Upcoming Exams
↓
Fees
↓
Notifications

If a parent has multiple children:

Provide a clear child selector.

All displayed data must correspond to the selected child.

29. Teacher Dashboard

Teacher dashboard should prioritize today's work.

Possible structure:

Today's Classes
↓
Attendance
↓
Homework
↓
Pending Marks
↓
Syllabus Progress
↓
Leave
↓
Notifications

The teacher should not have to navigate through multiple screens for routine daily actions.

30. Student Dashboard

Where student access is enabled:

Today's Classes
↓
Homework
↓
Attendance
↓
Exams
↓
Marks
↓
Syllabus
↓
Notifications

Keep student UX simpler than admin UX.

31. Design System

Instique's UI should deliberately avoid generic AI-generated SaaS aesthetics.

Design principles

1. Minimal

Remove anything that doesn't improve usability.

2. Functional

Every component should have a reason to exist.

3. Information-first

Information hierarchy is more important than decoration.

4. Professional

Should feel appropriate for real schools.

5. Dense but readable

School management contains large amounts of information.

Avoid
excessive cards
excessive pills
excessive gradients
excessive shadows
glassmorphism
neon colors
decorative illustrations
oversized typography
unnecessary animations
card-within-card layouts
Prefer
typography
spacing
dividers
tables
clear forms
simple navigation
subtle surfaces
restrained color 32. Theme System

Instique supports:

Light

Existing approved white/light interface.

Dark

Premium matte-black interface.

Dark palette:

Background #07090B
Surface #101315
Elevated #15191C
Text #F5F7F8
Secondary #A7AFB5
Muted #707980
Accent #34D399
Theme toggle

Compact:

☀ [●] ☾

Requirements:

no page reload
persistent
keyboard accessible
system preference on first visit
manual selection overrides system preference 33. Accessibility

Instique should support:

keyboard navigation
visible focus
accessible labels
semantic HTML
sufficient contrast
screen-reader-friendly controls
accessible dialogs
accessible forms 34. Responsive Design
Desktop

Primary experience for administrators.

Tablet

Important for teachers.

Mobile

Important for parents and quick teacher actions.

Do not simply shrink desktop layouts.

Use responsive information hierarchy.

35. Security Requirements

Security is non-negotiable.

Authorization

Every protected resource must validate authorization server-side.

Tenant isolation

A school must never access another school's data.

Parent isolation

Parent can only access linked children.

Teacher isolation

Teacher can only access authorized classes/students.

Admin

Admin access must remain limited to the appropriate school.

Sensitive data

Avoid unnecessary exposure of:

student personal data
contact information
financial information
authentication information 36. Notifications & Realtime

Where realtime infrastructure exists, Instique should support timely updates.

Examples:

Teacher submits leave
↓
Admin notification

Parent submits leave
↓
Class teacher notification

Timetable changes
↓
Relevant users notified

Notifications must respect role and authorization.

37. Technical Architecture

Based on the current product stack:

Web

React.js
Vite
TypeScript

Mobile

Flutter

Backend

Node.js
Express.js
TypeScript

Database

PostgreSQL

ORM

Prisma

Authentication

JWT + Refresh Tokens

API

REST

Web state/data

TanStack Query

Mobile state

Riverpod

Storage

Cloudflare R2 / AWS S3

Notifications

Firebase Cloud Messaging

Payments

Razorpay

Deployment

Vercel + Render/Railway + Neon PostgreSQL

38. Non-Functional Requirements
    Performance

Common pages should load quickly under normal school-network conditions.

Priorities:

fast initial rendering
cached queries
pagination
lazy loading
optimized tables
debounced search
Reliability

Critical operations must not silently fail.

Examples:

attendance
marks
fees
timetable
leave approvals
Scalability

Architecture should support multiple schools.

Tenant isolation must be built into data access.

Availability

School operations should remain usable during normal peak periods such as:

morning attendance
examination periods
fee deadlines
admissions 39. Auditability

Important administrative actions should be auditable.

Potential audit events:

Student created
Student updated
Student deleted
Marks submitted
Attendance modified
Fee recorded
Leave approved
Leave rejected
Timetable changed
User permission changed

Audit records should capture appropriate:

actor
action
timestamp
resource
relevant metadata 40. Data Model — High-Level

Core entities include:

User
School
Role
Permission

Student
Parent
Teacher

SchoolClass
Section
Subject

AcademicYear

Timetable
TimetableConfig
Period
Room

Attendance

Homework

Syllabus
SyllabusSection
SyllabusTopic

Exam
ExamSchedule
Marks

Admission

Fee
Payment
Receipt

Leave
LeaveRequest
LeaveApproval
ReplacementTeacher

Notification

RecognitionPoint
Leaderboard

Exact schema should remain aligned with the existing implementation.

41. Key User Workflows
    Student admission
    Applicant
    ↓
    Application
    ↓
    Admin Review
    ↓
    Approve
    ↓
    Student Created
    ↓
    Parent/Student Account
    Teacher leave
    Teacher
    ↓
    Leave Request
    ↓
    Admin Notification
    ↓
    Admin Reviews Timetable
    ↓
    Available Teachers
    ↓
    Replacement Assigned
    ↓
    Approve
    ↓
    Relevant Users Notified
    Student leave
    Parent
    ↓
    Select Child
    ↓
    Leave Request
    ↓
    Class Teacher Notification
    ↓
    Teacher Review
    ↓
    Approve / Reject
    ↓
    Parent Notification
    Attendance
    Teacher
    ↓
    Select Class
    ↓
    Select Section
    ↓
    Select Date
    ↓
    Mark Attendance
    ↓
    Save
    ↓
    Parent/Admin Visibility
    Marks
    Teacher
    ↓
    Select Exam
    ↓
    Select Class
    ↓
    Enter Marks
    ↓
    Validation
    ↓
    Save
    ↓
    Submit
    ↓
    Results Available
    Timetable
    Admin
    ↓
    Configure Periods
    ↓
    Assign Class
    ↓
    Assign Subject
    ↓
    Assign Teacher
    ↓
    Assign Room
    ↓
    Conflict Detection
    ↓
    Publish
    ↓
    Teacher / Parent / Student Visibility
42. Permissions Model

The system should support permission-based access in addition to role-based defaults.

Example:

students.view
students.create
students.update
students.delete

teachers.view
teachers.create
teachers.update

attendance.view
attendance.mark
attendance.update

timetable.view
timetable.create
timetable.update
timetable.delete

fees.view
fees.manage
fees.collect

leaves.view
leaves.request
leaves.approve

exams.view
exams.manage

marks.view
marks.enter
marks.approve

Actual permissions should align with the application's existing authorization model.

43. Success Metrics

Do not measure success through number of screens.

Measure operational outcomes.

Adoption
% of teachers actively using Instique
% of parents logging in
daily active users
weekly active users
Efficiency

Measure time required for:

attendance
marks entry
timetable management
leave approval
student search
Engagement
parent weekly usage
homework views
notification engagement
Financial
fee collection completion
reduction in overdue fees
Reliability
failed API requests
failed payments
failed exports
authentication failures 44. MVP Priority
P0 — Critical

These are required for the core product:

Authentication
School management
Role/permission system
Student management
Teacher management
Classes
Timetable
Attendance
Homework
Exams
Marks
Parent dashboard
Teacher dashboard
Admin dashboard
P1 — Important
Fees
Admissions
Leaves
Notifications
Syllabus tracking
Reports
PDF exports
Global search
P2 — Expansion
advanced analytics
mobile expansion
advanced communication
advanced reporting
automation
integrations
AI-assisted features where justified 45. Product Principles

These principles should govern every future feature.

Principle 1

Don't add a feature because competitors have it.

Principle 2

Every feature must reduce work or improve visibility.

Principle 3

Real data beats decorative analytics.

Principle 4

Role-specific UX beats one-size-fits-all UX.

Principle 5

Simple workflows beat feature-heavy workflows.

Principle 6

Authorization is part of the product, not an implementation detail.

Principle 7

The interface should get out of the user's way.

Principle 8

Don't turn school software into a generic SaaS dashboard.

46. Product North Star

Instique should eventually become the place where a school can answer almost every operational question from one system:

Who are our students?

Where are they?

What are they learning?

How are they performing?

Who is absent?

What classes are happening now?

Which teachers are available?

What needs approval?

Who owes fees?

What exams are coming?

How is the school performing?
