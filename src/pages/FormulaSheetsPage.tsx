import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Star, StarOff, Trash2, Edit3, Search, BookOpen, X, Save, 
  Calculator, FunctionSquare, Sigma, GitBranch, Network, Cpu, 
  Binary, MoreHorizontal, Hash, Lightbulb, Zap
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/notes/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FormulaSheet {
  id: string;
  title: string;
  content: string;
  category: string;
  is_favorite: boolean;
  subject_id: string | null;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const FormulaSheetsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sheets, setSheets] = useState<FormulaSheet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<FormulaSheet | null>(null);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formSubjectId, setFormSubjectId] = useState<string>('none');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: sheetsData }, { data: subjectsData }] = await Promise.all([
      supabase.from('formula_sheets').select('*').eq('user_id', user.id).order('is_favorite', { ascending: false }).order('updated_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('user_id', user.id),
    ]);
    setSheets((sheetsData as any[]) || []);
    setSubjects((subjectsData as Subject[]) || []);
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingSheet(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('general');
    setFormSubjectId('none');
    setDialogOpen(true);
  };

  const openEditDialog = (sheet: FormulaSheet) => {
    setEditingSheet(sheet);
    setFormTitle(sheet.title);
    setFormContent(sheet.content);
    setFormCategory(sheet.category);
    setFormSubjectId(sheet.subject_id || 'none');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formTitle.trim() || !formContent.trim()) {
      toast({ title: 'Please fill in title and content', variant: 'destructive' });
      return;
    }

    const payload = {
      user_id: user.id,
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      subject_id: formSubjectId === 'none' ? null : formSubjectId,
      updated_at: new Date().toISOString(),
    };

    if (editingSheet) {
      await supabase.from('formula_sheets').update(payload).eq('id', editingSheet.id);
      toast({ title: 'Formula card updated!' });
    } else {
      await supabase.from('formula_sheets').insert(payload);
      toast({ title: 'Formula card created!' });
    }

    setDialogOpen(false);
    fetchData();
  };

  const toggleFavorite = async (sheet: FormulaSheet) => {
    await supabase.from('formula_sheets').update({ is_favorite: !sheet.is_favorite }).eq('id', sheet.id);
    fetchData();
  };

  const deleteSheet = async (id: string) => {
    await supabase.from('formula_sheets').delete().eq('id', id);
    toast({ title: 'Formula card deleted' });
    fetchData();
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return 'General';
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown';
  };

  const getSubjectColor = (subjectId: string | null) => {
    if (!subjectId) return '#8B5CF6';
    return subjects.find(s => s.id === subjectId)?.color || '#8B5CF6';
  };

  const filtered = sheets.filter(s => {
    if (showFavoritesOnly && !s.is_favorite) return false;
    if (filterSubject !== 'all' && s.subject_id !== filterSubject) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = ['general', 'algebra', 'calculus', 'probability', 'data-structures', 'networks', 'os', 'digital-logic', 'other'];

  const categoryIcons: Record<string, React.ReactNode> = {
    general: <Lightbulb className="w-3 h-3" />,
    algebra: <Hash className="w-3 h-3" />,
    calculus: <FunctionSquare className="w-3 h-3" />,
    probability: <Sigma className="w-3 h-3" />,
    'data-structures': <GitBranch className="w-3 h-3" />,
    networks: <Network className="w-3 h-3" />,
    os: <Cpu className="w-3 h-3" />,
    'digital-logic': <Binary className="w-3 h-3" />,
    other: <MoreHorizontal className="w-3 h-3" />,
  };

  const categoryGradients: Record<string, string> = {
    general: 'from-violet-500/20 via-fuchsia-500/20 to-pink-500/20',
    algebra: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
    calculus: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
    probability: 'from-emerald-500/20 via-green-500/20 to-lime-500/20',
    'data-structures': 'from-indigo-500/20 via-purple-500/20 to-violet-500/20',
    networks: 'from-sky-500/20 via-blue-500/20 to-indigo-500/20',
    os: 'from-rose-500/20 via-pink-500/20 to-fuchsia-500/20',
    'digital-logic': 'from-slate-500/20 via-zinc-500/20 to-neutral-500/20',
    other: 'from-stone-500/20 via-orange-500/20 to-amber-500/20',
  };

  const getCategoryIcon = (category: string) => categoryIcons[category] || <Calculator className="w-3 h-3" />;
  const getCategoryGradient = (category: string) => categoryGradients[category] || categoryGradients.general;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Formula Sheets</span>
            </h1>
            <p className="text-muted-foreground mt-1">Quick-access formula cards for last-minute revision</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-hero-gradient text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Formula Card
          </Button>
        </motion.div>

        {/* Filters */}
        <GlassCard>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search formulas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant={showFavoritesOnly ? 'default' : 'outline'} onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} size="icon">
              <Star className="w-4 h-4" />
            </Button>
          </div>
        </GlassCard>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard>
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No formula cards yet</p>
              <p className="text-muted-foreground text-sm mt-1">Create your first formula card for quick revision!</p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((sheet, idx) => (
              <motion.div key={sheet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <GlassCard className={cn("h-full flex flex-col relative overflow-hidden", getCategoryGradient(sheet.category))}>
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-background/30 to-transparent pointer-events-none" />
                  
                  <div className="relative flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{sheet.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className="border-primary/30 text-primary font-medium"
                          style={{ borderColor: getSubjectColor(sheet.subject_id), color: getSubjectColor(sheet.subject_id) }}
                        >
                          {getSubjectName(sheet.subject_id)}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-secondary/60 backdrop-blur-sm"
                        >
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(sheet.category)}
                            {sheet.category.charAt(0).toUpperCase() + sheet.category.slice(1).replace('-', ' ')}
                          </span>
                        </Badge>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleFavorite(sheet)} 
                      className="text-amber-500 hover:scale-110 transition-transform ml-2 p-1 rounded-full hover:bg-amber-500/10"
                    >
                      {sheet.is_favorite ? <Star className="w-5 h-5 fill-amber-500" /> : <StarOff className="w-5 h-5 text-muted-foreground" />}
                    </button>
                  </div>

                  <div
                    className={cn(
                      "flex-1 text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-background/60 backdrop-blur-sm rounded-lg p-3 cursor-pointer transition-all border border-border/50 hover:border-primary/30 prose prose-sm dark:prose-invert max-w-none",
                      expandedSheet === sheet.id ? '' : 'max-h-32 overflow-hidden'
                    )}
                    onClick={() => setExpandedSheet(expandedSheet === sheet.id ? null : sheet.id)}
                    dangerouslySetInnerHTML={{ __html: sheet.content }}
                  />
                  {expandedSheet !== sheet.id && sheet.content.length > 200 && (
                    <p className="text-xs text-primary mt-1 cursor-pointer hover:underline" onClick={() => setExpandedSheet(sheet.id)}>
                      Click to expand...
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60 relative">
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors">
                      <Edit3 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => deleteSheet(sheet.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSheet ? 'Edit Formula Card' : 'New Formula Card'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title (e.g. Sorting Complexities)" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
              <RichTextEditor
                placeholder="Write your formulas here..."
                value={formContent}
                onChange={setFormContent}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full bg-hero-gradient text-white">
                <Save className="w-4 h-4 mr-2" /> {editingSheet ? 'Update' : 'Create'} Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FormulaSheetsPage;
