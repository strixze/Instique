import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, BookOpen, Calendar, DollarSign,
  Bell, Settings, FileText, ClipboardList, Trophy, MessageSquare,
  ClipboardCheck, Award, BarChart3, Shield, BookMarked,
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { settingApi } from '../api/setting.api';

export const navSections = {
  school_admin: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'Academics',
      items: [
        { to: '/students', icon: Users, label: 'Students', feature: 'students' },
        { to: '/teachers', icon: GraduationCap, label: 'Teachers', feature: 'teachers' },
        { to: '/academic', icon: BookOpen, label: 'Classes', feature: 'classes' },
        { to: '/syllabus', icon: FileText, label: 'Syllabus', feature: 'syllabus' },
        { to: '/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance', feature: 'attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework', feature: 'homework' },
      ],
    },
    {
      title: 'Examinations',
      items: [
        { to: '/exams', icon: Trophy, label: 'Exams', feature: 'exams' },
        { to: '/marks-entry', icon: ClipboardCheck, label: 'Marks Entry', feature: 'marksEntry' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard', feature: 'leaderboard' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/admissions', icon: FileText, label: 'Admissions', feature: 'admissions' },
        { to: '/fees', icon: DollarSign, label: 'Fees', feature: 'fees' },
        { to: '/leaves', icon: Calendar, label: 'Leaves', feature: 'leaves' },
        { to: '/notices', icon: Bell, label: 'Notices', feature: 'notices' },
      ],
    },
    {
      title: 'Communication',
      items: [
        { to: '/events', icon: Calendar, label: 'Events', feature: 'events' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints', feature: 'complaints' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings', feature: 'parentMeetings' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { to: '/reports', icon: BarChart3, label: 'Reports & Analytics', feature: 'reports' },
      ],
    },
    {
      title: 'System',
      items: [
        { to: '/roles', icon: Shield, label: 'Roles & Permissions' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ],
  super_admin: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/schools', icon: BookOpen, label: 'Schools' },
        { to: '/subscriptions', icon: DollarSign, label: 'Subscriptions' },
        { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ],
  teacher: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'Academics',
      items: [
        { to: '/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance', feature: 'attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework', feature: 'homework' },
        { to: '/exams', icon: Trophy, label: 'Exams', feature: 'exams' },
        { to: '/marks-entry', icon: ClipboardCheck, label: 'Marks Entry', feature: 'marksEntry' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard', feature: 'leaderboard' },
        { to: '/syllabus', icon: FileText, label: 'Syllabus', feature: 'syllabus' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/events', icon: Calendar, label: 'Events', feature: 'events' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings', feature: 'parentMeetings' },
        { to: '/leaves', icon: Calendar, label: 'Leaves', feature: 'leaves' },
        { to: '/notices', icon: Bell, label: 'Notices', feature: 'notices' },
      ],
    },
  ],
  student: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'Academics',
      items: [
        { to: '/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance', feature: 'attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework', feature: 'homework' },
        { to: '/exams', icon: Trophy, label: 'Results', feature: 'exams' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard', feature: 'leaderboard' },
      ],
    },
    {
      title: 'Services',
      items: [
        { to: '/events', icon: Calendar, label: 'Events', feature: 'events' },
        { to: '/fees', icon: DollarSign, label: 'Fees', feature: 'fees' },
        { to: '/notices', icon: Bell, label: 'Notices', feature: 'notices' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints', feature: 'complaints' },
      ],
    },
  ],
  parent: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'Academics',
      items: [
        { to: '/attendance', icon: ClipboardList, label: 'Attendance', feature: 'attendance', parentVisKey: 'attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework', feature: 'homework', parentVisKey: 'homework' },
        { to: '/syllabus', icon: BookOpen, label: 'Syllabus', feature: 'syllabus' },
        { to: '/exams', icon: Trophy, label: 'Results', feature: 'exams', parentVisKey: 'marks' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard', feature: 'leaderboard', parentVisKey: 'marks' },
        { to: '/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable', parentVisKey: 'timetable' },
      ],
    },
    {
      title: 'Services',
      items: [
        { to: '/events', icon: Calendar, label: 'Events', feature: 'events' },
        { to: '/leaves', icon: Calendar, label: 'Leave Requests', feature: 'leaves', parentVisKey: 'leaves' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings', feature: 'parentMeetings' },
        { to: '/fees', icon: DollarSign, label: 'Fees', feature: 'fees', parentVisKey: 'fees' },
        { to: '/notices', icon: Bell, label: 'Notices', feature: 'notices' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints', feature: 'complaints' },
      ],
    },
  ],
};

export function useNavSections() {
  const user = useUserStore((s) => s.user);
  const [publicSettings, setPublicSettings] = useState(null);

  useEffect(() => {
    let active = true;
    if (user?.role && user.role !== 'super_admin') {
      settingApi.getPublic()
        .then((res) => {
          if (active) {
            const data = res.data?.data || res.data;
            setPublicSettings(data || {});
          }
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [user?.role]);

  const rawSections = navSections[user?.role] || [];
  const sections = useMemo(() => {
    if (!publicSettings) return rawSections;
    const features = publicSettings.features || {};
    const parentVisibility = publicSettings.visibility?.parent || {};
    const teacherPolicy = publicSettings.visibility?.teacherPolicy || {};

    return rawSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) => {
          if (item.feature && features[item.feature] === false) return false;
          if (user?.role === 'parent' && item.parentVisKey) {
            if (parentVisibility[item.parentVisKey] === false) return false;
          }
          if (user?.role === 'teacher' && item.to === '/fees') {
            if (teacherPolicy.canViewFeeInfo !== true) return false;
          }
          return true;
        }),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [rawSections, publicSettings, user?.role]);

  return { sections, rawSections, publicSettings, user };
}
