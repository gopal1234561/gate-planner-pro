import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, CheckCircle, Circle, Plus, BookOpen, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface PYQ {
  id: string;
  subject: string;
  topic: string;
  year: number;
  question_text: string;
  answer: string | null;
  is_user_added: boolean;
}

const PYQExplorerPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<PYQ[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [showAnswer, setShowAnswer] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newQ, setNewQ] = useState({ subject: '', topic: '', year: 2023, question_text: '', answer: '' });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: qs }, { data: solved }] = await Promise.all([
      supabase.from('pyq_questions').select('*').order('year', { ascending: false }),
      supabase.from('pyq_solved').select('question_id').eq('user_id', user.id),
    ]);
    setQuestions(qs || []);
    setSolvedIds(new Set((solved || []).map((s: any) => s.question_id)));
    setLoading(false);
  };

  const toggleSolved = async (questionId: string) => {
    if (!user) return;
    if (solvedIds.has(questionId)) {
      await supabase.from('pyq_solved').delete().eq('user_id', user.id).eq('question_id', questionId);
      setSolvedIds(prev => { const next = new Set(prev); next.delete(questionId); return next; });
    } else {
      await supabase.from('pyq_solved').insert({ user_id: user.id, question_id: questionId });
      setSolvedIds(prev => new Set(prev).add(questionId));
    }
  };

  const addQuestion = async () => {
    if (!user || !newQ.subject || !newQ.question_text) return;
    const { error } = await supabase.from('pyq_questions').insert({
      ...newQ,
      is_user_added: true,
      user_id: user.id,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Question Added!' });
      setAddDialogOpen(false);
      setNewQ({ subject: '', topic: '', year: 2023, question_text: '', answer: '' });
      fetchData();
    }
  };

  const subjects = [...new Set(questions.map(q => q.subject))];
  const years = [...new Set(questions.map(q => q.year))].sort((a, b) => b - a);
  const topics = [...new Set(
    questions
      .filter(q => subjectFilter === 'all' || q.subject === subjectFilter)
      .map(q => q.topic)
  )].sort();

  const filtered = questions.filter(q => {
    if (subjectFilter !== 'all' && q.subject !== subjectFilter) return false;
    if (topicFilter !== 'all' && q.topic !== topicFilter) return false;
    if (yearFilter !== 'all' && q.year !== Number(yearFilter)) return false;
    if (search && !q.question_text.toLowerCase().includes(search.toLowerCase()) && !q.topic.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const solvedCount = filtered.filter(q => solvedIds.has(q.id)).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <span className="gradient-text">PYQ Explorer</span>
          </h1>
          <p className="text-muted-foreground mt-1">Browse & solve previous year GATE questions</p>
        </motion.div>

        {/* Filters */}
        <GlassCard>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add a PYQ</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Subject" value={newQ.subject} onChange={e => setNewQ({ ...newQ, subject: e.target.value })} />
                  <Input placeholder="Topic" value={newQ.topic} onChange={e => setNewQ({ ...newQ, topic: e.target.value })} />
                  <Input type="number" placeholder="Year" value={newQ.year} onChange={e => setNewQ({ ...newQ, year: Number(e.target.value) })} />
                  <Textarea placeholder="Question" value={newQ.question_text} onChange={e => setNewQ({ ...newQ, question_text: e.target.value })} />
                  <Textarea placeholder="Answer (optional)" value={newQ.answer} onChange={e => setNewQ({ ...newQ, answer: e.target.value })} />
                  <Button onClick={addQuestion} className="w-full">Add Question</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </GlassCard>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{filtered.length} questions</span>
          <span>•</span>
          <span className="text-green-400">{solvedCount} solved</span>
          <span>•</span>
          <span>{filtered.length - solvedCount} remaining</span>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
              >
                <GlassCard className="!p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleSolved(q.id)} className="mt-1 shrink-0">
                      {solvedIds.has(q.id) ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline">{q.subject}</Badge>
                        <Badge variant="secondary">{q.topic}</Badge>
                        <Badge className="bg-primary/20 text-primary">{q.year}</Badge>
                      </div>
                      <p className={`text-sm ${solvedIds.has(q.id) ? 'text-muted-foreground line-through' : ''}`}>
                        {q.question_text}
                      </p>
                      {q.answer && (
                        <div className="mt-2">
                          <button
                            onClick={() => setShowAnswer(showAnswer === q.id ? null : q.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            {showAnswer === q.id ? 'Hide Answer' : 'Show Answer'}
                          </button>
                          <AnimatePresence>
                            {showAnswer === q.id && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-sm text-green-400 mt-1 p-2 rounded bg-green-500/10"
                              >
                                {q.answer}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && !loading && (
            <GlassCard>
              <p className="text-center text-muted-foreground py-8">No questions found matching your filters.</p>
            </GlassCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PYQExplorerPage;
