import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight, CheckCircle2, Clock3, Circle, User, GraduationCap, AlertCircle } from 'lucide-react';
import { parentApi } from '../../api/parent.api';
import { syllabusApi } from '../../api/syllabus.api';
import Button from '../../components/ui/Button';

export default function ParentSyllabusView() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [loadingChildren, setLoadingChildren] = useState(true);

  // Fetch parent's children
  useEffect(() => {
    parentApi.getChildren()
      .then((res) => {
        const list = res.data || [];
        setChildren(list);
        if (list.length > 0) setSelectedChildId(list[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoadingChildren(false));
  }, []);

  // Fetch child's section syllabus tracks
  const { data: tracks, isLoading: loadingTracks } = useQuery({
    queryKey: ['parent-syllabus-tracks', selectedChildId],
    queryFn: async () => {
      const res = await syllabusApi.getParentChildSyllabus(selectedChildId);
      return res.data || [];
    },
    enabled: !!selectedChildId,
  });

  const selectedChild = children.find((c) => c._id === selectedChildId);

  return (
    <div className="space-y-4 w-full pb-10">
      {/* Top Header */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight flex items-center gap-2">
              <BookOpen size={20} className="text-forest dark:text-emerald-400" />
              Child Syllabus & Curriculum Progress
            </h1>
            <p className="text-xs text-secondary dark:text-dark-text-secondary mt-1">
              Track actual class teaching progress across all subjects for your child.
            </p>
          </div>

          {/* Child Selector if multiple */}
          {children.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-muted">Select Child:</span>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-dark-elevated border border-border rounded-lg text-xs font-bold text-deep"
              >
                {children.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName} ({c.currentClass?.name || 'Class'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Selected Child Info Badge */}
      {selectedChild && (
        <div className="p-3 bg-forest-soft dark:bg-dark-accent-soft border border-forest/20 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-forest dark:text-emerald-400" />
            <span className="font-bold text-deep dark:text-dark-text">
              {selectedChild.firstName} {selectedChild.lastName}
            </span>
            <span className="text-muted">• Class {selectedChild.currentClass?.name} ({selectedChild.currentSection?.name})</span>
          </div>
          <span className="text-[11px] font-mono text-forest dark:text-emerald-400">ADM: {selectedChild.admissionNo}</span>
        </div>
      )}

      {/* Syllabus Subject Progress Cards */}
      {loadingChildren || loadingTracks ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-dark-card border border-border rounded-xl" />
          ))}
        </div>
      ) : tracks && tracks.length > 0 ? (
        <div className="space-y-4">
          {tracks.map((t) => (
            <div key={t.trackId} className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-deep dark:text-dark-text">{t.subjectName}</h2>
                  <p className="text-xs text-muted">Subject Teacher: <strong>{t.teacherName}</strong></p>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold text-forest dark:text-emerald-400 font-mono">{t.overallCompletion}%</span>
                  <span className="text-[10px] text-muted block">Completion</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-dark-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-forest dark:bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, t.overallCompletion)}%` }}
                />
              </div>

              {/* Chapter Breakdown */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                {(t.chapters || []).map((ch) => (
                  <div key={ch.id} className="p-3 bg-surface/50 dark:bg-dark-elevated rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-deep dark:text-dark-text">
                      <span>{ch.title}</span>
                      <span className="text-forest font-mono">{ch.completionPercentage}%</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(ch.topics || []).map((top) => {
                        const isDone = top.status === 'completed';
                        const isInProgress = top.status === 'in_progress';
                        return (
                          <span
                            key={top.id}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium inline-flex items-center gap-1 ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {isDone ? '✓' : isInProgress ? '◐' : '○'} {top.title}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-8 text-center text-xs text-muted">
          No syllabus progress records have been assigned to your child's section yet.
        </div>
      )}
    </div>
  );
}
