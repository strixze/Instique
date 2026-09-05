import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ChevronLeft, CheckCircle2, Clock3, Circle, AlertCircle,
  FileText, MessageSquare, BookOpen, GraduationCap, Users,
  BarChart3, Check, ChevronDown, ChevronUp, Edit3
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { syllabusApi } from '../../api/syllabus.api';
import { useUserStore } from '../../store/userStore';

export default function SectionSyllabusTrackView() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.user);

  const [expandedChapterIds, setExpandedChapterIds] = useState([]);
  const [updatingTopicId, setUpdatingTopicId] = useState(null);

  // Teaching Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [targetTopic, setTargetTopic] = useState({ topicId: null, status: 'completed', notes: '' });

  // Fetch Section Track details using TanStack Query
  const { data: trackData, isLoading, isError, error } = useQuery({
    queryKey: ['section-syllabus-track', trackId],
    queryFn: async () => {
      const res = await syllabusApi.getTrackById(trackId);
      return res.data;
    },
    enabled: !!trackId,
  });

  const track = trackData?.track;
  const syllabus = trackData?.syllabus;
  const chapters = trackData?.chapters || [];

  // Toggle chapter collapse
  const toggleChapterExpand = (chId) => {
    if (expandedChapterIds.includes(chId)) {
      setExpandedChapterIds(expandedChapterIds.filter((id) => id !== chId));
    } else {
      setExpandedChapterIds([...expandedChapterIds, chId]);
    }
  };

  const handleUpdateTopic = async (topicId, newStatus, currentNotes = '') => {
    setUpdatingTopicId(topicId);
    try {
      await syllabusApi.updateTopicProgress(trackId, topicId, {
        status: newStatus,
        notes: currentNotes,
      });
      toast.success('Topic status updated');
      queryClient.invalidateQueries(['section-syllabus-track', trackId]);
      queryClient.invalidateQueries(['syllabus-analytics']);
      queryClient.invalidateQueries(['syllabi']);
    } catch (err) {
      toast.error(err?.message || 'Failed to update topic status');
    } finally {
      setUpdatingTopicId(null);
    }
  };

  const handleOpenNoteModal = (topicId, currentStatus, currentNotes) => {
    setTargetTopic({ topicId, status: currentStatus, notes: currentNotes || '' });
    setNoteModalOpen(true);
  };

  const handleSaveNoteModal = async () => {
    if (!targetTopic.topicId) return;
    await handleUpdateTopic(targetTopic.topicId, targetTopic.status, targetTopic.notes);
    setNoteModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-1">
        <div className="h-6 w-32 bg-surface dark:bg-dark-hover rounded" />
        <div className="h-28 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl" />
        <div className="h-80 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl" />
      </div>
    );
  }

  if (isError || !track) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl my-6">
        <AlertCircle size={32} className="text-rose-500 mb-2" />
        <h2 className="text-base font-bold text-deep dark:text-dark-text">Section Syllabus Track Not Found</h2>
        <Button onClick={() => navigate(-1)} className="mt-4 gap-1" size="sm">
          <ChevronLeft size={14} /> Go Back
        </Button>
      </div>
    );
  }

  // Count overall topic states
  let totalTopics = 0;
  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let skippedCount = 0;

  chapters.forEach((ch) => {
    (ch.topics || []).forEach((top) => {
      totalTopics++;
      const st = top.progress?.status;
      if (st === 'completed') completedCount++;
      else if (st === 'in_progress') inProgressCount++;
      else if (st === 'skipped') skippedCount++;
      else notStartedCount++;
    });
  });

  return (
    <div className="space-y-4 w-full pb-10">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-xs font-medium text-secondary dark:text-dark-text-secondary hover:text-deep transition-colors cursor-pointer"
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight">
                {track.subject?.name} — Class {track.schoolClass?.name} ({track.section?.name})
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                {track.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-secondary dark:text-dark-text-secondary mt-0.5">
              Assigned Teacher: <strong>{track.assignedTeacher ? `${track.assignedTeacher.firstName} ${track.assignedTeacher.lastName}` : 'Unassigned'}</strong> • Version v{syllabus?.version || 1}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide block">Overall Completion</span>
            <span className="text-2xl font-bold text-forest dark:text-emerald-400 font-mono">{track.overallCompletion}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-dark-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-forest dark:bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, track.overallCompletion)}%` }}
          />
        </div>
      </div>

      {/* Metric Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-600" /> Completed
          </span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{completedCount} <span className="text-xs font-normal text-muted">/ {totalTopics}</span></p>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
            <Clock3 size={13} className="text-amber-500" /> In Progress
          </span>
          <p className="text-xl font-bold text-amber-600 mt-1">{inProgressCount}</p>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
            <Circle size={13} className="text-slate-400" /> Not Started
          </span>
          <p className="text-xl font-bold text-slate-600 mt-1">{notStartedCount}</p>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
            <AlertCircle size={13} className="text-rose-500" /> Skipped
          </span>
          <p className="text-xl font-bold text-rose-600 mt-1">{skippedCount}</p>
        </div>
      </div>

      {/* Chapters & Topics Progress Accordion */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
        <div className="pb-2 border-b border-border/60">
          <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">
            Teaching Curriculum Progress ({chapters.length} Chapters)
          </h2>
          <p className="text-[11px] text-muted">Update topic status as topics are taught in class. Progress percentages recalculate automatically.</p>
        </div>

        <div className="space-y-3 pt-1">
          {chapters.map((ch, chIdx) => {
            const isExpanded = !expandedChapterIds.includes(ch._id);
            return (
              <div
                key={ch._id || chIdx}
                className="bg-surface/40 dark:bg-dark-elevated border border-border/70 dark:border-dark-border rounded-xl overflow-hidden"
              >
                {/* Chapter Accordion Bar */}
                <div
                  onClick={() => toggleChapterExpand(ch._id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface/80 dark:hover:bg-dark-hover transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-xs text-forest dark:text-emerald-400 font-mono">Ch {chIdx + 1}.</span>
                    <div>
                      <h3 className="font-bold text-xs text-deep dark:text-dark-text">{ch.title}</h3>
                      <p className="text-[11px] text-muted">
                        {ch.completedTopics} of {ch.totalTopics} topics completed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-bold text-deep dark:text-dark-text font-mono">{ch.completionPercentage}%</span>
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-forest rounded-full" style={{ width: `${ch.completionPercentage}%` }} />
                      </div>
                    </div>

                    <button className="text-muted p-1">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Topic Items inside Chapter */}
                {isExpanded && (
                  <div className="p-3.5 pt-0 space-y-2 border-t border-border/40">
                    {(ch.topics || []).map((top, topIdx) => {
                      const st = top.progress?.status || 'not_started';
                      const isUpdating = updatingTopicId === top._id;

                      return (
                        <div
                          key={top._id}
                          className="p-3 bg-white dark:bg-dark-card border border-border/60 dark:border-dark-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-deep dark:text-dark-text">
                                {chIdx + 1}.{topIdx + 1} {top.title}
                              </span>
                              <span className="text-[10px] text-muted font-mono">({top.estimatedPeriods || 1}p)</span>
                            </div>
                            {top.description && <p className="text-[11px] text-muted">{top.description}</p>}
                            {top.progress?.notes && (
                              <p className="text-[11px] text-forest dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                <MessageSquare size={11} /> Note: {top.progress.notes}
                              </p>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateTopic(top._id, 'completed', top.progress?.notes)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                st === 'completed'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              ✓ Completed
                            </button>

                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateTopic(top._id, 'in_progress', top.progress?.notes)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                st === 'in_progress'
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                            >
                              ◐ In Progress
                            </button>

                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateTopic(top._id, 'not_started', top.progress?.notes)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                st === 'not_started'
                                  ? 'bg-slate-700 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              ○ Reset
                            </button>

                            <button
                              onClick={() => handleOpenNoteModal(top._id, st, top.progress?.notes)}
                              className="p-1 text-muted hover:text-deep hover:bg-slate-100 rounded"
                              title="Add Teaching Note"
                            >
                              <MessageSquare size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Teaching Note Modal */}
      <Modal isOpen={noteModalOpen} onClose={() => setNoteModalOpen(false)} title="Teaching Note & Topic Update" size="md">
        <div className="space-y-4">
          <Input
            label="Teaching Note / Observations"
            value={targetTopic.notes}
            onChange={(e) => setTargetTopic({ ...targetTopic, notes: e.target.value })}
            placeholder="e.g. Covered subtopic 1.2; students struggled with fractions exercise"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setNoteModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNoteModal}>Save Note & Update</Button>
        </div>
      </Modal>
    </div>
  );
}
