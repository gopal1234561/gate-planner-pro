import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  BookOpen, 
  Edit2, 
  Trash2, 
  Check,
  ChevronDown,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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

interface Topic {
  id: string;
  name: string;
  is_completed: boolean;
  revision_date: string | null;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  topics: Topic[];
}

const SubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#8B5CF6');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user]);

  const fetchSubjects = async () => {
    if (!user) return;

    const { data: subjectsData, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: 'Error fetching subjects', variant: 'destructive' });
      return;
    }

    const subjectsWithTopics = await Promise.all(
      (subjectsData || []).map(async (subject) => {
        const { data: topics } = await supabase
          .from('topics')
          .select('*')
          .eq('subject_id', subject.id)
          .order('created_at', { ascending: true });
        return { ...subject, topics: topics || [] };
      })
    );

    setSubjects(subjectsWithTopics);
    setLoading(false);
  };

  const handleAddSubject = async () => {
    if (!user || !newSubjectName.trim()) return;

    const { error } = await supabase.from('subjects').insert({
      user_id: user.id,
      name: newSubjectName.trim(),
      color: newSubjectColor,
    });

    if (error) {
      toast({ title: 'Error adding subject', variant: 'destructive' });
    } else {
      toast({ title: 'Subject added successfully' });
      setNewSubjectName('');
      setIsAddingSubject(false);
      fetchSubjects();
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting subject', variant: 'destructive' });
    } else {
      toast({ title: 'Subject deleted' });
      fetchSubjects();
    }
  };

  const handleAddTopic = async (subjectId: string) => {
    if (!user || !newTopicName.trim()) return;

    const { error } = await supabase.from('topics').insert({
      user_id: user.id,
      subject_id: subjectId,
      name: newTopicName.trim(),
    });

    if (error) {
      toast({ title: 'Error adding topic', variant: 'destructive' });
    } else {
      setNewTopicName('');
      fetchSubjects();
    }
  };

  const handleToggleTopic = async (topicId: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('topics')
      .update({ is_completed: !isCompleted })
      .eq('id', topicId);

    if (!error) fetchSubjects();
  };

  const handleDeleteTopic = async (topicId: string) => {
    const { error } = await supabase.from('topics').delete().eq('id', topicId);
    if (!error) fetchSubjects();
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;

    const { error } = await supabase
      .from('subjects')
      .update({ name: editingSubject.name, color: editingSubject.color })
      .eq('id', editingSubject.id);

    if (error) {
      toast({ title: 'Error updating subject', variant: 'destructive' });
    } else {
      toast({ title: 'Subject updated' });
      setEditingSubject(null);
      fetchSubjects();
    }
  };

  const colorOptions = [
    '#8B5CF6', '#3B82F6', '#F97316', '#10B981', '#EF4444', '#EC4899', '#F59E0B', '#06B6D4'
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Subjects</h1>
            <p className="text-muted-foreground">Manage your subjects and topics</p>
          </div>
          
          <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
            <DialogTrigger asChild>
              <GradientButton>
                <Plus className="w-5 h-5 mr-2" /> Add Subject
              </GradientButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Subject Name</Label>
                  <Input
                    placeholder="e.g., Data Structures"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewSubjectColor(color)}
                        className={`w-8 h-8 rounded-full transition-all ${newSubjectColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <GradientButton onClick={handleAddSubject} className="w-full">
                  Add Subject
                </GradientButton>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subjects List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : subjects.length === 0 ? (
          <GlassCard className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No subjects yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by adding your first subject to organize your studies
            </p>
            <GradientButton onClick={() => setIsAddingSubject(true)}>
              <Plus className="w-5 h-5 mr-2" /> Add Your First Subject
            </GradientButton>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject, index) => {
              const completedTopics = subject.topics.filter(t => t.is_completed).length;
              const progress = subject.topics.length > 0 
                ? (completedTopics / subject.topics.length) * 100 
                : 0;
              const isExpanded = expandedSubject === subject.id;

              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard hover={false} className="overflow-hidden">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-4 h-12 rounded-full" 
                          style={{ backgroundColor: subject.color }}
                        />
                        <div>
                          <h3 className="font-semibold text-lg">{subject.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {completedTopics}/{subject.topics.length} topics completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block w-32">
                          <Progress value={progress} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{Math.round(progress)}%</span>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubject(subject);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubject(subject.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 pt-6 border-t border-border">
                            {/* Add Topic */}
                            <div className="flex gap-2 mb-4">
                              <Input
                                placeholder="Add new topic..."
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTopic(subject.id)}
                              />
                              <Button onClick={() => handleAddTopic(subject.id)}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Topics List */}
                            <div className="space-y-2">
                              {subject.topics.map((topic) => (
                                <div
                                  key={topic.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => handleToggleTopic(topic.id, topic.is_completed)}
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        topic.is_completed 
                                          ? 'bg-green-500 border-green-500' 
                                          : 'border-muted-foreground'
                                      }`}
                                    >
                                      {topic.is_completed && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                    <span className={topic.is_completed ? 'line-through text-muted-foreground' : ''}>
                                      {topic.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {topic.revision_date && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {topic.revision_date}
                                      </span>
                                    )}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleDeleteTopic(topic.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {subject.topics.length === 0 && (
                                <p className="text-muted-foreground text-center py-4">
                                  No topics yet. Add your first topic above!
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Edit Subject Dialog */}
        <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
            </DialogHeader>
            {editingSubject && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Subject Name</Label>
                  <Input
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditingSubject({ ...editingSubject, color })}
                        className={`w-8 h-8 rounded-full transition-all ${editingSubject.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <GradientButton onClick={handleUpdateSubject} className="w-full">
                  Save Changes
                </GradientButton>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SubjectsPage;
