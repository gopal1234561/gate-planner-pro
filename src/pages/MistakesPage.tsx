import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Plus, Trash2, Edit2, Save, X, BookOpen, CheckCircle2, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Mistake {
  id: string;
  subject_id: string | null;
  topic: string | null;
  mistake_text: string;
  correction: string | null;
  category: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const categories = [
  { value: 'conceptual', label: 'Conceptual', color: 'bg-red-500/20 text-red-400 border-red-500/30', group: 'academic' },
  { value: 'calculation', label: 'Calculation', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', group: 'academic' },
  { value: 'silly', label: 'Silly Mistake', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', group: 'academic' },
  { value: 'time_management', label: 'Time Management', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', group: 'personal' },
  { value: 'discipline', label: 'Discipline', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', group: 'personal' },
  { value: 'habit', label: 'Bad Habit', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', group: 'personal' },
  { value: 'personal_other', label: 'Personal Other', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', group: 'personal' },
  { value: 'other', label: 'Other', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', group: 'academic' },
];

const getCategoryStyle = (cat: string) => categories.find(c => c.value === cat)?.color || categories[3].color;

const MistakesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showResolved, setShowResolved] = useState(false);

  // Form state
  const [formSubjectId, setFormSubjectId] = useState<string>('none');
  const [formTopic, setFormTopic] = useState('');
  const [formMistake, setFormMistake] = useState('');
  const [formCorrection, setFormCorrection] = useState('');
  const [formCategory, setFormCategory] = useState('conceptual');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: mData }, { data: sData }] = await Promise.all([
      supabase.from('mistakes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('user_id', user.id),
    ]);
    setMistakes(mData || []);
    setSubjects(sData || []);
    setLoading(false);
  };

  const resetForm = () => {
    setFormSubjectId('none');
    setFormTopic('');
    setFormMistake('');
    setFormCorrection('');
    setFormCategory('conceptual');
  };

  const addMistake = async () => {
    if (!user || !formMistake.trim()) return;
    const { error } = await supabase.from('mistakes').insert({
      user_id: user.id,
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      topic: formTopic.trim() || null,
      mistake_text: formMistake,
      correction: formCorrection.trim() || null,
      category: formCategory,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Mistake logged!' });
      resetForm();
      setShowAdd(false);
      fetchData();
    }
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('mistakes').update({
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      topic: formTopic.trim() || null,
      mistake_text: formMistake,
      correction: formCorrection.trim() || null,
      category: formCategory,
    }).eq('id', id);
    if (!error) {
      setEditingId(null);
      resetForm();
      fetchData();
    }
  };

  const toggleResolved = async (id: string, current: boolean) => {
    await supabase.from('mistakes').update({ is_resolved: !current }).eq('id', id);
    fetchData();
  };

  const deleteMistake = async (id: string) => {
    await supabase.from('mistakes').delete().eq('id', id);
    fetchData();
  };

  const startEdit = (m: Mistake) => {
    setEditingId(m.id);
    setFormSubjectId(m.subject_id || 'none');
    setFormTopic(m.topic || '');
    setFormMistake(m.mistake_text);
    setFormCorrection(m.correction || '');
    setFormCategory(m.category);
  };

  const getSubjectName = (id: string | null) => subjects.find(s => s.id === id)?.name || null;
  const getSubjectColor = (id: string | null) => subjects.find(s => s.id === id)?.color || '#8B5CF6';

  const filtered = mistakes.filter(m => {
    if (!showResolved && m.is_resolved) return false;
    if (filterSubject !== 'all' && m.subject_id !== filterSubject) return false;
    if (filterCategory !== 'all' && m.category !== filterCategory) return false;
    return true;
  });

  const stats = {
    total: mistakes.length,
    resolved: mistakes.filter(m => m.is_resolved).length,
    conceptual: mistakes.filter(m => m.category === 'conceptual' && !m.is_resolved).length,
    silly: mistakes.filter(m => m.category === 'silly' && !m.is_resolved).length,
    personal: mistakes.filter(m => categories.find(c => c.value === m.category)?.group === 'personal' && !m.is_resolved).length,
  };

  const MistakeForm = ({ onSave, saveLabel }: { onSave: () => void; saveLabel: string }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select value={formSubjectId} onValueChange={setFormSubjectId}>
          <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No subject</SelectItem>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Topic (optional)" value={formTopic} onChange={e => setFormTopic(e.target.value)} />
      </div>
      <Textarea placeholder="What was the mistake? *" value={formMistake} onChange={e => setFormMistake(e.target.value)} rows={2} />
      <Textarea placeholder="Correct approach / solution" value={formCorrection} onChange={e => setFormCorrection(e.target.value)} rows={2} />
      <div className="flex gap-3 items-center">
        <Select value={formCategory} onValueChange={setFormCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">📚 Academic</p>
            {categories.filter(c => c.group === 'academic').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">🧠 Personal</p>
            {categories.filter(c => c.group === 'personal').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={onSave}><Save className="w-4 h-4 mr-1" /> {saveLabel}</Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-primary" />
              <span className="gradient-text">Mistakes Journal</span>
            </h1>
            <p className="text-muted-foreground mt-1">Track mistakes to never repeat them</p>
          </div>
          <Button onClick={() => { setShowAdd(!showAdd); if (!showAdd) { resetForm(); setEditingId(null); } }}>
            {showAdd ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showAdd ? 'Cancel' : 'Log Mistake'}
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: AlertCircle },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle2 },
            { label: 'Conceptual', value: stats.conceptual, icon: BookOpen },
            { label: 'Silly', value: stats.silly, icon: AlertCircle },
            { label: 'Personal', value: stats.personal, icon: AlertCircle },
          ].map((s, i) => (
            <GlassCard key={i} className="text-center py-4">
              <s.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <GlassCard>
                <h3 className="font-semibold mb-3">Log a New Mistake</h3>
                <MistakeForm onSave={addMistake} saveLabel="Save" />
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">📚 Academic</p>
              {categories.filter(c => c.group === 'academic').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">🧠 Personal</p>
              {categories.filter(c => c.group === 'personal').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`px-3 py-1 rounded-lg text-xs transition-all ${showResolved ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'}`}
          >
            {showResolved ? 'Hide' : 'Show'} Resolved
          </button>
        </div>

        {/* Mistakes List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassCard className={m.is_resolved ? 'opacity-60' : ''}>
                  {editingId === m.id ? (
                    <div>
                      <MistakeForm onSave={() => saveEdit(m.id)} saveLabel="Update" />
                      <Button size="sm" variant="ghost" className="mt-2" onClick={() => { setEditingId(null); resetForm(); }}>
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleResolved(m.id, m.is_resolved)} className="mt-1 shrink-0">
                        <CheckCircle2 className={`w-5 h-5 transition-colors ${m.is_resolved ? 'text-green-500' : 'text-muted-foreground/40 hover:text-green-500/60'}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge className={getCategoryStyle(m.category)}>{m.category}</Badge>
                          {getSubjectName(m.subject_id) && (
                            <Badge variant="outline" className="text-xs" style={{ borderColor: getSubjectColor(m.subject_id) }}>
                              {getSubjectName(m.subject_id)}
                            </Badge>
                          )}
                          {m.topic && <span className="text-xs text-muted-foreground">• {m.topic}</span>}
                        </div>
                        <p className={`text-sm ${m.is_resolved ? 'line-through' : ''}`}>{m.mistake_text}</p>
                        {m.correction && (
                          <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-xs font-medium text-green-400 mb-1">✅ Correction:</p>
                            <p className="text-xs text-muted-foreground">{m.correction}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(m)} className="p-1 hover:bg-muted rounded">
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => deleteMistake(m.id)} className="p-1 hover:bg-destructive/10 rounded">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && !loading && !showAdd && (
          <GlassCard>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Mistakes Logged</h3>
              <p className="text-muted-foreground">Click "Log Mistake" to start tracking your errors and learn from them.</p>
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MistakesPage;
