import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  ChevronLeft, Plus, Edit3, Trash2, Send, Archive, Check,
  BookOpen, Layers, Users, Clock, ArrowUpRight, AlertCircle,
  GripVertical, FileText, CheckCircle2
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { syllabusApi } from '../../api/syllabus.api';
import { academicApi } from '../../api/academic.api';
import { useUserStore } from '../../store/userStore';

export default function SyllabusDetail() {
  const { syllabusId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.user);

  const [chapters, setChapters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Chapter Modal
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapterIdx, setEditingChapterIdx] = useState(null);
  const [chapterForm, setChapterForm] = useState({ title: '', description: '', estimatedPeriods: 5 });

  // Topic Modal
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopicTarget, setEditingTopicTarget] = useState({ chapterIdx: null, topicIdx: null });
  const [topicForm, setTopicForm] = useState({ title: '', description: '', estimatedPeriods: 1, learningObjectives: '' });

  // Assign Sections Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  // Fetch Syllabus Details
  const { data: detailData, isLoading, isError, error } = useQuery({
    queryKey: ['syllabus-detail', syllabusId],
    queryFn: async () => {
      const res = await syllabusApi.getById(syllabusId);
      return res.data;
    },
    enabled: !!syllabusId,
  });

  const syllabus = detailData?.syllabus;
  const tracks = detailData?.tracks || [];

  // Sync chapters state when syllabus data loads
  useEffect(() => {
    if (syllabus?.chapters) {
      setChapters(syllabus.chapters);
    }
  }, [syllabus]);

  // Load sections when assign modal opens
  useEffect(() => {
    if (assignModalOpen && syllabus?.schoolClass?._id) {
      academicApi.getSections({ schoolClass: syllabus.schoolClass._id, limit: 100 })
        .then((res) => {
          setSections(res.data);
          // Preselect currently assigned sections
          const existingSectionIds = tracks.map((t) => t.section?._id || t.section);
          setSelectedSectionIds(existingSectionIds);
        })
        .catch(() => {});
    }
  }, [assignModalOpen, syllabus, tracks]);

  /* ──────────────────────── Chapter Handlers ──────────────────────── */
  const handleOpenAddChapter = () => {
    setEditingChapterIdx(null);
    setChapterForm({ title: '', description: '', estimatedPeriods: 5 });
    setChapterModalOpen(true);
  };

  const handleOpenEditChapter = (idx, e) => {
    e.stopPropagation();
    setEditingChapterIdx(idx);
    const ch = chapters[idx];
    setChapterForm({ title: ch.title, description: ch.description || '', estimatedPeriods: ch.estimatedPeriods || 5 });
    setChapterModalOpen(true);
  };

  const handleSaveChapter = () => {
    if (!chapterForm.title) {
      toast.error('Chapter title is required');
      return;
    }
    const updated = [...chapters];
    if (editingChapterIdx !== null) {
      updated[editingChapterIdx] = {
        ...updated[editingChapterIdx],
        title: chapterForm.title,
        description: chapterForm.description,
        estimatedPeriods: Number(chapterForm.estimatedPeriods || 1),
      };
    } else {
      updated.push({
        title: chapterForm.title,
        description: chapterForm.description,
        estimatedPeriods: Number(chapterForm.estimatedPeriods || 1),
        order: updated.length,
        topics: [],
      });
    }
    setChapters(updated);
    setChapterModalOpen(false);
  };

  const handleDeleteChapter = (idx, e) => {
    e.stopPropagation();
    const updated = chapters.filter((_, i) => i !== idx);
    setChapters(updated);
  };

  /* ──────────────────────── Topic Handlers ──────────────────────── */
  const handleOpenAddTopic = (chapterIdx) => {
    setEditingTopicTarget({ chapterIdx, topicIdx: null });
    setTopicForm({ title: '', description: '', estimatedPeriods: 1, learningObjectives: '' });
    setTopicModalOpen(true);
  };

  const handleOpenEditTopic = (chapterIdx, topicIdx, e) => {
    e.stopPropagation();
    setEditingTopicTarget({ chapterIdx, topicIdx });
    const top = chapters[chapterIdx].topics[topicIdx];
    setTopicForm({
      title: top.title,
      description: top.description || '',
      estimatedPeriods: top.estimatedPeriods || 1,
      learningObjectives: top.learningObjectives || '',
    });
    setTopicModalOpen(true);
  };

  const handleSaveTopic = () => {
    if (!topicForm.title) {
      toast.error('Topic title is required');
      return;
    }
    const { chapterIdx, topicIdx } = editingTopicTarget;
    if (chapterIdx === null) return;

    const updatedChapters = [...chapters];
    const targetTopics = [...(updatedChapters[chapterIdx].topics || [])];

    if (topicIdx !== null) {
      targetTopics[topicIdx] = {
        ...targetTopics[topicIdx],
        title: topicForm.title,
        description: topicForm.description,
        estimatedPeriods: Number(topicForm.estimatedPeriods || 1),
        learningObjectives: topicForm.learningObjectives,
      };
    } else {
      targetTopics.push({
        title: topicForm.title,
        description: topicForm.description,
        estimatedPeriods: Number(topicForm.estimatedPeriods || 1),
        learningObjectives: topicForm.learningObjectives,
        order: targetTopics.length,
      });
    }

    updatedChapters[chapterIdx].topics = targetTopics;
    setChapters(updatedChapters);
    setTopicModalOpen(false);
  };

  const handleDeleteTopic = (chapterIdx, topicIdx, e) => {
    e.stopPropagation();
    const updatedChapters = [...chapters];
    updatedChapters[chapterIdx].topics = updatedChapters[chapterIdx].topics.filter((_, i) => i !== topicIdx);
    setChapters(updatedChapters);
  };

  /* ──────────────────────── Save & Publish ──────────────────────── */
  const handleSaveSyllabus = async () => {
    setSaving(true);
    try {
      await syllabusApi.update(syllabusId, { chapters });
      toast.success('Syllabus chapters & topics saved');
      queryClient.invalidateQueries(['syllabus-detail', syllabusId]);
    } catch (err) {
      toast.error(err?.message || 'Failed to save syllabus');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await syllabusApi.publish(syllabusId);
      toast.success('Syllabus published successfully');
      queryClient.invalidateQueries(['syllabus-detail', syllabusId]);
    } catch (err) {
      toast.error(err?.message || 'Failed to publish syllabus');
    } finally {
      setPublishing(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (selectedSectionIds.length === 0) {
      toast.error('Please select at least one section');
      return;
    }
    setAssigning(true);
    try {
      await syllabusApi.assignSections(syllabusId, selectedSectionIds);
      toast.success('Syllabus assigned to selected sections');
      setAssignModalOpen(false);
      queryClient.invalidateQueries(['syllabus-detail', syllabusId]);
    } catch (err) {
      toast.error(err?.message || 'Failed to assign sections');
    } finally {
      setAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-1">
        <div className="h-6 w-32 bg-surface dark:bg-dark-hover rounded" />
        <div className="h-24 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl" />
        <div className="h-96 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl" />
      </div>
    );
  }

  if (isError || !syllabus) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl my-6">
        <AlertCircle size={32} className="text-rose-500 mb-2" />
        <h2 className="text-base font-bold text-deep dark:text-dark-text">Syllabus Not Found</h2>
        <Button onClick={() => navigate('/syllabus')} className="mt-4 gap-1" size="sm">
          <ChevronLeft size={14} /> Back to Syllabi
        </Button>
      </div>
    );
  }

  const renderStatusBadge = (status) => {
    const s = String(status || 'draft').toLowerCase();
    if (s === 'published') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">● Published</span>;
    }
    if (s === 'archived') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">● Archived</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">● Draft</span>;
  };

  return (
    <div className="space-y-4 w-full pb-10">
      {/* Back link */}
      <button
        onClick={() => navigate('/syllabus')}
        className="inline-flex items-center gap-1 text-xs font-medium text-secondary dark:text-dark-text-secondary hover:text-deep transition-colors cursor-pointer"
      >
        <ChevronLeft size={16} /> Back to Syllabi
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight">
                {syllabus.title || `${syllabus.subject?.name} - ${syllabus.schoolClass?.name}`}
              </h1>
              {renderStatusBadge(syllabus.status)}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary dark:text-dark-text-secondary mt-1">
              <span>Subject: <strong className="text-deep dark:text-dark-text">{syllabus.subject?.name} ({syllabus.subject?.code})</strong></span>
              <span>•</span>
              <span>Class: <strong className="text-deep dark:text-dark-text">{syllabus.schoolClass?.name}</strong></span>
              <span>•</span>
              <span>Academic Year: <strong className="text-deep dark:text-dark-text">{syllabus.academicYear?.name}</strong></span>
              <span>•</span>
              <span>Version: <strong className="text-deep dark:text-dark-text">v{syllabus.version || 1}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {syllabus.status === 'draft' && (
              <Button size="sm" onClick={handlePublish} loading={publishing} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <Send size={14} /> Publish Syllabus
              </Button>
            )}

            {syllabus.status === 'published' && (
              <Button size="sm" onClick={() => setAssignModalOpen(true)} className="gap-1.5">
                <Users size={14} /> Assign to Sections
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={handleSaveSyllabus} loading={saving} className="gap-1.5">
              <Check size={14} /> Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Chapters & Topics Builder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div>
                <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">
                  Curriculum Structure ({chapters.length} Chapters)
                </h2>
                <p className="text-[11px] text-muted">Add chapters and topics to construct the curriculum.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleOpenAddChapter} className="gap-1 text-xs">
                <Plus size={13} /> Add Chapter
              </Button>
            </div>

            {chapters.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted">
                No chapters added yet. Click <strong>Add Chapter</strong> above to build the syllabus.
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {chapters.map((ch, chIdx) => (
                  <div
                    key={ch._id || chIdx}
                    className="p-3.5 bg-surface/40 dark:bg-dark-elevated border border-border/70 dark:border-dark-border rounded-xl space-y-3"
                  >
                    {/* Chapter Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-xs text-forest dark:text-emerald-400 font-mono mt-0.5">Ch {chIdx + 1}.</span>
                        <div>
                          <h3 className="font-bold text-xs text-deep dark:text-dark-text">{ch.title}</h3>
                          {ch.description && <p className="text-[11px] text-muted">{ch.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {ch.estimatedPeriods || 1} Periods
                        </span>
                        <button
                          onClick={(e) => handleOpenEditChapter(chIdx, e)}
                          className="p-1 text-muted hover:text-deep hover:bg-slate-100 rounded"
                          title="Edit Chapter"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteChapter(chIdx, e)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="Delete Chapter"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Topics Sub-list */}
                    <div className="pl-6 space-y-2 border-t border-border/40 pt-2.5">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-muted">
                        <span>Topics ({ch.topics?.length || 0})</span>
                        <button
                          onClick={() => handleOpenAddTopic(chIdx)}
                          className="text-forest dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} /> Add Topic
                        </button>
                      </div>

                      {ch.topics && ch.topics.length > 0 ? (
                        <div className="space-y-1.5">
                          {ch.topics.map((top, topIdx) => (
                            <div
                              key={top._id || topIdx}
                              className="p-2.5 bg-white dark:bg-dark-card border border-border/60 dark:border-dark-border rounded-lg flex items-start justify-between gap-2 text-xs"
                            >
                              <div>
                                <p className="font-semibold text-deep dark:text-dark-text">
                                  {chIdx + 1}.{topIdx + 1} {top.title}
                                </p>
                                {top.description && <p className="text-[11px] text-muted">{top.description}</p>}
                                {top.learningObjectives && (
                                  <p className="text-[10px] text-secondary mt-0.5 font-mono">Obj: {top.learningObjectives}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-muted">{top.estimatedPeriods || 1}p</span>
                                <button
                                  onClick={(e) => handleOpenEditTopic(chIdx, topIdx, e)}
                                  className="p-1 text-muted hover:text-deep hover:bg-slate-100 rounded"
                                  title="Edit Topic"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteTopic(chIdx, topIdx, e)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                  title="Delete Topic"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted italic">No topics added to this chapter yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Assigned Section Tracks */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-border/60">
              <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-forest dark:text-emerald-400" /> Assigned Section Tracks ({tracks.length})
              </h2>
              {syllabus.status === 'published' && (
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="text-xs text-forest dark:text-emerald-400 font-bold hover:underline"
                >
                  + Assign
                </button>
              )}
            </div>

            {tracks.length > 0 ? (
              <div className="space-y-2.5">
                {tracks.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => navigate(`/syllabus/tracks/${t._id}`)}
                    className="p-3 bg-surface/50 dark:bg-dark-elevated border border-border/60 dark:border-dark-border rounded-xl hover:border-forest/40 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-xs font-bold text-deep dark:text-dark-text">
                      <span>Section {t.section?.name || 'N/A'}</span>
                      <span className="text-forest font-mono">{t.overallCompletion || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest rounded-full"
                        style={{ width: `${Math.min(100, t.overallCompletion || 0)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted">
                      <span>Teacher: {t.assignedTeacher ? `${t.assignedTeacher.firstName} ${t.assignedTeacher.lastName}` : 'Unassigned'}</span>
                      <span className="text-forest font-semibold flex items-center gap-0.5">
                        Track <ArrowUpRight size={10} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted">
                {syllabus.status === 'published'
                  ? 'This syllabus has not been assigned to any sections yet. Click "Assign to Sections" to begin tracking progress.'
                  : 'Publish this syllabus first to assign it to class sections.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Modal */}
      <Modal isOpen={chapterModalOpen} onClose={() => setChapterModalOpen(false)} title={editingChapterIdx !== null ? 'Edit Chapter' : 'Add Chapter'} size="md">
        <div className="space-y-4">
          <Input label="Chapter Title *" value={chapterForm.title} onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })} placeholder="e.g. Chapter 1: Real Numbers" />
          <Input label="Description" value={chapterForm.description} onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })} placeholder="Chapter summary" />
          <Input label="Estimated Periods" type="number" value={chapterForm.estimatedPeriods} onChange={(e) => setChapterForm({ ...chapterForm, estimatedPeriods: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setChapterModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveChapter}>Save Chapter</Button>
        </div>
      </Modal>

      {/* Topic Modal */}
      <Modal isOpen={topicModalOpen} onClose={() => setTopicModalOpen(false)} title={editingTopicTarget.topicIdx !== null ? 'Edit Topic' : 'Add Topic'} size="md">
        <div className="space-y-4">
          <Input label="Topic Title *" value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} placeholder="e.g. Topic 1.1: Rational & Irrational Numbers" />
          <Input label="Description" value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} placeholder="Topic scope" />
          <Input label="Estimated Periods" type="number" value={topicForm.estimatedPeriods} onChange={(e) => setTopicForm({ ...topicForm, estimatedPeriods: e.target.value })} />
          <Input label="Learning Objectives" value={topicForm.learningObjectives} onChange={(e) => setTopicForm({ ...topicForm, learningObjectives: e.target.value })} placeholder="Key concepts students will master" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setTopicModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTopic}>Save Topic</Button>
        </div>
      </Modal>

      {/* Assign Sections Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Assign Syllabus to ${syllabus?.schoolClass?.name || 'Class'} Sections`} size="md">
        <div className="space-y-4">
          <p className="text-xs text-secondary">
            Select the sections that will be assigned this syllabus definition. Each section receives its own independent progress tracking record.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {sections.length > 0 ? (
              sections.map((sec) => {
                const isSelected = selectedSectionIds.includes(sec._id);
                return (
                  <label
                    key={sec._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-xs font-semibold ${
                      isSelected ? 'bg-forest/5 border-forest ring-1 ring-forest/20 text-deep' : 'bg-white border-border text-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedSectionIds(selectedSectionIds.filter((id) => id !== sec._id));
                        } else {
                          setSelectedSectionIds([...selectedSectionIds, sec._id]);
                        }
                      }}
                      className="rounded text-forest focus:ring-forest"
                    />
                    <span>Section {sec.name}</span>
                  </label>
                );
              })
            ) : (
              <p className="text-xs text-muted italic">No sections found for this class.</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAssign} loading={assigning}>Assign Selected Sections</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
