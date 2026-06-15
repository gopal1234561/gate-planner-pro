import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Star, StarOff, Trash2, Edit3, Search, FileQuestion, Save,
  ExternalLink, Upload, Image as ImageIcon, X,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { seedGateSubjects } from '@/lib/gateSubjects';

interface PYQ {
  id: string;
  title: string;
  year: number | null;
  question_text: string | null;
  explanation: string | null;
  image_url: string | null;
  source_link: string | null;
  is_favorite: boolean;
  subject_id: string | null;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const PYQS_PER_PAGE = 6;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);

const PYQsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PYQ | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PYQS_PER_PAGE);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formYear, setFormYear] = useState<string>('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSourceLink, setFormSourceLink] = useState('');
  const [formSubjectId, setFormSubjectId] = useState<string>('none');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => { setVisibleCount(PYQS_PER_PAGE); }, [filterSubject, filterYear, search, showFavoritesOnly]);

  const fetchData = async () => {
    if (!user) return;
    await seedGateSubjects(user.id);
    const [{ data: pyqsData }, { data: subjectsData }] = await Promise.all([
      supabase.from('pyqs' as any).select('*').eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('year', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('user_id', user.id).order('name'),
    ]);
    setPyqs((pyqsData as any[]) || []);
    setSubjects((subjectsData as Subject[]) || []);
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditing(null);
    setFormTitle('');
    setFormYear('');
    setFormQuestion('');
    setFormExplanation('');
    setFormImageUrl('');
    setFormSourceLink('');
    setFormSubjectId('none');
    setDialogOpen(true);
  };

  const openEditDialog = (p: PYQ) => {
    setEditing(p);
    setFormTitle(p.title);
    setFormYear(p.year ? String(p.year) : '');
    setFormQuestion(p.question_text || '');
    setFormExplanation(p.explanation || '');
    setFormImageUrl(p.image_url || '');
    setFormSourceLink(p.source_link || '');
    setFormSubjectId(p.subject_id || 'none');
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/pyqs/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('note-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('note-images').getPublicUrl(path);
      setFormImageUrl(data.publicUrl);
      toast({ title: 'Image uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !formTitle.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }
    const payload: any = {
      user_id: user.id,
      title: formTitle.trim(),
      year: formYear ? parseInt(formYear) : null,
      question_text: formQuestion.trim() || null,
      explanation: formExplanation.trim() || null,
      image_url: formImageUrl.trim() || null,
      source_link: formSourceLink.trim() || null,
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await (supabase.from('pyqs' as any).update(payload).eq('id', editing.id) as any);
      toast({ title: 'PYQ updated!' });
    } else {
      await (supabase.from('pyqs' as any).insert(payload) as any);
      toast({ title: 'PYQ added!' });
    }
    setDialogOpen(false);
    fetchData();
  };

  const toggleFavorite = async (p: PYQ) => {
    await (supabase.from('pyqs' as any).update({ is_favorite: !p.is_favorite }).eq('id', p.id) as any);
    fetchData();
  };

  const deletePyq = async (id: string) => {
    await (supabase.from('pyqs' as any).delete().eq('id', id) as any);
    toast({ title: 'PYQ deleted' });
    fetchData();
  };

  const getSubjectName = (sid: string | null) => !sid ? 'General' : subjects.find(s => s.id === sid)?.name || 'Unknown';
  const getSubjectColor = (sid: string | null) => !sid ? '#8B5CF6' : subjects.find(s => s.id === sid)?.color || '#8B5CF6';

  const filtered = pyqs.filter(p => {
    if (showFavoritesOnly && !p.is_favorite) return false;
    if (filterSubject !== 'all' && p.subject_id !== filterSubject) return false;
    if (filterYear !== 'all' && String(p.year) !== filterYear) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q)
        && !(p.question_text || '').toLowerCase().includes(q)
        && !(p.explanation || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Previous Year Questions</span>
            </h1>
            <p className="text-muted-foreground mt-1">Save PYQs with images, explanations & source links</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-hero-gradient text-white">
            <Plus className="w-4 h-4 mr-2" /> Add PYQ
          </Button>
        </motion.div>

        {/* Filters */}
        <GlassCard>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search PYQs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Subjects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {YEARS.map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button variant={showFavoritesOnly ? 'default' : 'outline'} onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} size="icon">
              <Star className="w-4 h-4" />
            </Button>
          </div>
        </GlassCard>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard>
            <div className="text-center py-12">
              <FileQuestion className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No PYQs yet</p>
              <p className="text-muted-foreground text-sm mt-1">Add your first previous year question!</p>
            </div>
          </GlassCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visible.map((p, idx) => {
                const isOpen = expanded === p.id;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <GlassCard className="h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{p.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" style={{ borderColor: getSubjectColor(p.subject_id), color: getSubjectColor(p.subject_id) }}>
                              {getSubjectName(p.subject_id)}
                            </Badge>
                            {p.year && <Badge variant="secondary">GATE {p.year}</Badge>}
                          </div>
                        </div>
                        <button onClick={() => toggleFavorite(p)} className="text-amber-500 hover:scale-110 transition-transform p-1 rounded-full hover:bg-amber-500/10">
                          {p.is_favorite ? <Star className="w-5 h-5 fill-amber-500" /> : <StarOff className="w-5 h-5 text-muted-foreground" />}
                        </button>
                      </div>

                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="w-full max-h-64 object-contain rounded-lg border border-border/50 bg-background/40 mb-3 cursor-zoom-in"
                          onClick={() => window.open(p.image_url!, '_blank')}
                        />
                      )}

                      {p.question_text && (
                        <div className={cn("text-sm whitespace-pre-wrap text-foreground/90 mb-3", !isOpen && "max-h-24 overflow-hidden")}>
                          {p.question_text}
                        </div>
                      )}

                      {isOpen && p.explanation && (
                        <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-xs font-semibold text-primary mb-1">Explanation</p>
                          <p className="text-sm whitespace-pre-wrap text-foreground/90">{p.explanation}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/60 flex-wrap">
                        {(p.explanation || (p.question_text && p.question_text.length > 120)) && (
                          <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : p.id)}>
                            {isOpen ? 'Hide' : 'Show'} Explanation
                          </Button>
                        )}
                        {p.source_link && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={p.source_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" /> Source
                            </a>
                          </Button>
                        )}
                        <div className="ml-auto flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive/80 hover:text-destructive" onClick={() => deletePyq(p.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={() => setVisibleCount(c => c + PYQS_PER_PAGE)}>
                  View More ({filtered.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit PYQ' : 'New PYQ'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title (e.g. Hash table collisions)" value={formTitle} onChange={e => setFormTitle(e.target.value)} />

              <div className="grid grid-cols-2 gap-3">
                <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {subjects.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={formYear} onValueChange={setFormYear}>
                  <SelectTrigger><SelectValue placeholder="GATE Year" /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea placeholder="Question text..." value={formQuestion} onChange={e => setFormQuestion(e.target.value)} rows={4} />

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Image</label>
                <div className="flex gap-2">
                  <Input placeholder="Image URL (optional)" value={formImageUrl} onChange={e => setFormImageUrl(e.target.value)} />
                  <Button asChild variant="outline" size="icon" disabled={uploading}>
                    <label className="cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(f);
                      }} />
                    </label>
                  </Button>
                  {formImageUrl && (
                    <Button variant="outline" size="icon" onClick={() => setFormImageUrl('')}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {formImageUrl && (
                  <img src={formImageUrl} alt="preview" className="w-full max-h-48 object-contain rounded-lg border border-border/50 bg-background/40" />
                )}
              </div>

              <Input placeholder="Source link (e.g. https://gate-overflow.in/...)" value={formSourceLink} onChange={e => setFormSourceLink(e.target.value)} />

              <Textarea placeholder="Explanation / solution..." value={formExplanation} onChange={e => setFormExplanation(e.target.value)} rows={5} />

              <Button onClick={handleSave} className="w-full bg-hero-gradient text-white">
                <Save className="w-4 h-4 mr-2" /> {editing ? 'Update' : 'Create'} PYQ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PYQsPage;
