import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, ClipboardList } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface TrackerEntry {
  id: string;
  subject: string;
  topic: string;
  is_completed: boolean;
  hours_studied: number;
  pyqs_solved: number;
  revision_count: number;
  last_studied: string | null;
  notes: string | null;
}

const ManualTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    topic: '',
    is_completed: false,
    hours_studied: 0,
    pyqs_solved: 0,
    revision_count: 0,
    last_studied: '',
    notes: '',
  });

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('manual_tracker')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching entries', variant: 'destructive' });
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ subject: '', topic: '', is_completed: false, hours_studied: 0, pyqs_solved: 0, revision_count: 0, last_studied: '', notes: '' });
  };

  const handleAdd = async () => {
    if (!user || !form.subject.trim() || !form.topic.trim()) {
      toast({ title: 'Subject and Topic are required', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('manual_tracker').insert({
      user_id: user.id,
      subject: form.subject.trim(),
      topic: form.topic.trim(),
      is_completed: form.is_completed,
      hours_studied: form.hours_studied,
      pyqs_solved: form.pyqs_solved,
      revision_count: form.revision_count,
      last_studied: form.last_studied || null,
      notes: form.notes.trim() || null,
    });

    if (error) {
      toast({ title: 'Error adding entry', variant: 'destructive' });
    } else {
      toast({ title: 'Entry added!' });
      resetForm();
      setIsAdding(false);
      fetchEntries();
    }
  };

  const handleToggleCompleted = async (entry: TrackerEntry) => {
    await supabase
      .from('manual_tracker')
      .update({ is_completed: !entry.is_completed })
      .eq('id', entry.id);
    fetchEntries();
  };

  const handleUpdateRevisionCount = async (entry: TrackerEntry, delta: number) => {
    const newCount = Math.max(0, entry.revision_count + delta);
    await supabase
      .from('manual_tracker')
      .update({ revision_count: newCount })
      .eq('id', entry.id);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('manual_tracker').delete().eq('id', id);
    toast({ title: 'Entry deleted' });
    fetchEntries();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Manual Tracker</h1>
            <p className="text-muted-foreground">
              Track your study progress manually
              {entries.length > 0 && (
                <span className="ml-2 text-sm">
                  — <span className="font-medium text-orange-500">{entries.filter(e => !e.is_completed).length} pending</span>
                  {' · '}
                  <span className="font-medium text-green-500">{entries.filter(e => e.is_completed).length} completed</span>
                </span>
              )}
            </p>
          </div>
          <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <GradientButton><Plus className="w-5 h-5 mr-2" /> Add Entry</GradientButton>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Tracker Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input placeholder="e.g., Data Structures" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Topic *</Label>
                  <Input placeholder="e.g., Binary Trees" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.is_completed} onCheckedChange={(v) => setForm({ ...form, is_completed: !!v })} />
                  <Label>Completed</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hours Studied</Label>
                    <Input type="number" min={0} step={0.5} value={form.hours_studied} onChange={(e) => setForm({ ...form, hours_studied: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>PYQs Solved</Label>
                    <Input type="number" min={0} value={form.pyqs_solved} onChange={(e) => setForm({ ...form, pyqs_solved: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Revision Count</Label>
                  <Input type="number" min={0} value={form.revision_count} onChange={(e) => setForm({ ...form, revision_count: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Studied</Label>
                  <Input type="date" value={form.last_studied} onChange={(e) => setForm({ ...form, last_studied: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input placeholder="Any notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <GradientButton onClick={handleAdd} className="w-full">
                  <Save className="w-4 h-4 mr-2" /> Save Entry
                </GradientButton>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : entries.length === 0 ? (
          <GlassCard className="text-center py-12">
            <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-6">Start tracking your study progress manually</p>
            <GradientButton onClick={() => setIsAdding(true)}>
              <Plus className="w-5 h-5 mr-2" /> Add First Entry
            </GradientButton>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard hover={false}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={entry.is_completed}
                        onCheckedChange={() => handleToggleCompleted(entry)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-lg">{entry.subject}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className={entry.is_completed ? 'line-through text-muted-foreground' : ''}>{entry.topic}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          <span>📚 {entry.hours_studied}h</span>
                          <span>📝 {entry.pyqs_solved} PYQs</span>
                          <span>🔄 Rev: {entry.revision_count}</span>
                          {entry.last_studied && <span>📅 {entry.last_studied}</span>}
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-1 italic">"{entry.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 border border-border rounded-lg">
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateRevisionCount(entry, -1)}>−</Button>
                        <span className="text-sm font-medium w-6 text-center">{entry.revision_count}</span>
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateRevisionCount(entry, 1)}>+</Button>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManualTrackerPage;
