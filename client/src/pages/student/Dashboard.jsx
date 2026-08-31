import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, BookOpen, DollarSign, Trophy,
  Calendar, Bell, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { dashboardApi } from '../../api/dashboard.api';
import { useUserStore } from '../../store/userStore';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatINR(amount) {
  if (!amount || amount === 0) return '₹0';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

const STATUS_COLORS = {
  present: 'bg-success',
  absent: 'bg-danger',
  late: 'bg-warning',
  leave: 'bg-info',
  holiday: 'bg-surface border border-border',
  unknown: 'bg-surface border border-border',
};

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-deep dark:text-dark-text">Student Dashboard</h1>
          <p className="text-muted dark:text-dark-text-muted text-sm mt-1">Your academic overview & daily schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-forest dark:bg-emerald-500"><ClipboardList size={24} className="text-white dark:text-gray-900"/></div><div><p className="text-2xl font-bold text-deep dark:text-dark-text">-</p><p className="text-sm text-muted dark:text-dark-text-muted">Attendance</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-forest dark:bg-emerald-500"><BookOpen size={24} className="text-white dark:text-gray-900"/></div><div><p className="text-2xl font-bold text-deep dark:text-dark-text">-</p><p className="text-sm text-muted dark:text-dark-text-muted">Homework</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-warning"><DollarSign size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep dark:text-dark-text">-</p><p className="text-sm text-muted dark:text-dark-text-muted">Fee Status</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-info"><Trophy size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep dark:text-dark-text">-</p><p className="text-sm text-muted dark:text-dark-text-muted">Recognition</p></div></div></Card>
      </div>
    </div>
  );
}
