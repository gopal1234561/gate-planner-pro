import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, Trash2, Edit2, Save, X, BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/notes/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<string>('none');
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: notesData }, { data: subData }] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('user_id', user.id),
    ]);
    setNotes(notesData || []);
    setSubjects(subData || []);
    setLoading(false);
  };

  const addNote = async () => {
    if (!user || !newTitle.trim()) return;
    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title: newTitle,
      content: newContent,
      subject_id: newSubjectId === 'none' ? null : newSubjectId,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Note Added!' });
      setNewTitle('');
      setNewContent('');
      setNewSubjectId('none');
      setShowAdd(false);
      fetchData();
    }
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('notes').update({ title: editTitle, content: editContent, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      setEditingId(null);
      fetchData();
    }
  };

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    fetchData();
  };

  const getSubjectName = (id: string | null) => subjects.find(s => s.id === id)?.name || null;
  const getSubjectColor = (id: string | null) => subjects.find(s => s.id === id)?.color || '#8B5CF6';

  const filtered = filterSubject === 'all' ? notes : notes.filter(n => n.subject_id === filterSubject);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <StickyNote className="w-8 h-8 text-primary" />
              <span className="gradient-text">Notes</span>
            </h1>
            <p className="text-muted-foreground mt-1">Quick notes linked to your subjects</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showAdd ? 'Cancel' : 'New Note'}
          </Button>
        </motion.div>

        {/* Add Note Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <GlassCard>
                <div className="space-y-3">
                  <Input placeholder="Note title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                  <RichTextEditor placeholder="Write your note..." value={newContent} onChange={setNewContent} />
                  <div className="flex gap-3 items-center">
                    <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                      <SelectTrigger className="w-[200px]"><SelectValue placeholder="Link to subject" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No subject</SelectItem>
                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={addNote}>
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFilterSubject('all')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterSubject === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
            All
          </button>
          {subjects.map(s => (
            <button key={s.id} onClick={() => setFilterSubject(s.id)} className={`px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap ${filterSubject === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
              {s.name}
            </button>
          ))}
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((note, i) => (
              <motion.div key={note.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="h-full">
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                      <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(note.id)}><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{note.title}</h3>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingId(note.id); setEditTitle(note.title); setEditContent(note.content); }} className="p-1 hover:bg-muted rounded">
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => deleteNote(note.id)} className="p-1 hover:bg-destructive/10 rounded">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                      {getSubjectName(note.subject_id) && (
                        <Badge variant="outline" className="mb-2 text-xs" style={{ borderColor: getSubjectColor(note.subject_id) }}>
                          <BookOpen className="w-3 h-3 mr-1" />
                          {getSubjectName(note.subject_id)}
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-3">{format(new Date(note.updated_at), 'MMM d, yyyy')}</p>
                    </>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && !loading && !showAdd && (
          <GlassCard>
            <div className="text-center py-12">
              <StickyNote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notes Yet</h3>
              <p className="text-muted-foreground">Click "New Note" to start capturing your study notes.</p>
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotesPage;
