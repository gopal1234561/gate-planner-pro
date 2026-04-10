import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  CheckSquare, 
  Trash2, 
  Check,
  Clock,
  Flag,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  topic: string | null;
  start_time: string | null;
  end_time: string | null;
  priority: string;
  notes: string | null;
  is_completed: boolean;
  task_date: string;
  subject_id: string | null;
  subjects?: { name: string; color: string };
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const TASKS_PER_PAGE = 8;

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [visibleCount, setVisibleCount] = useState(TASKS_PER_PAGE);
  const [loading, setLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject_id: '',
    topic: '',
    start_time: '',
    end_time: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
    task_date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchSubjects();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*, subjects(name, color)')
      .eq('user_id', user.id)
      .order('task_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      toast({ title: 'Error fetching tasks', variant: 'destructive' });
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const fetchSubjects = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', user.id);

    setSubjects(data || []);
  };

  const handleAddTask = async () => {
    if (!user || !newTask.title.trim()) return;

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTask.title.trim(),
      subject_id: newTask.subject_id || null,
      topic: newTask.topic || null,
      start_time: newTask.start_time ? new Date(`${newTask.task_date}T${newTask.start_time}`).toISOString() : null,
      end_time: newTask.end_time ? new Date(`${newTask.task_date}T${newTask.end_time}`).toISOString() : null,
      priority: newTask.priority,
      notes: newTask.notes || null,
      task_date: newTask.task_date,
    });

    if (error) {
      toast({ title: 'Error adding task', variant: 'destructive' });
    } else {
      toast({ title: 'Task added successfully' });
      setNewTask({
        title: '',
        subject_id: '',
        topic: '',
        start_time: '',
        end_time: '',
        priority: 'medium',
        notes: '',
        task_date: format(new Date(), 'yyyy-MM-dd'),
      });
      setIsAddingTask(false);
      fetchTasks();
    }
  };

  const handleToggleTask = async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !isCompleted })
      .eq('id', id);

    if (!error) fetchTasks();
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting task', variant: 'destructive' });
    } else {
      toast({ title: 'Task deleted' });
      fetchTasks();
    }
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-success/20 text-success',
    medium: 'bg-warning/20 text-warning',
    high: 'bg-destructive/20 text-destructive',
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.task_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Manage your daily study tasks</p>
          </div>
          
          <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
            <DialogTrigger asChild>
              <GradientButton>
                <Plus className="w-5 h-5 mr-2" /> Add Task
              </GradientButton>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g., Study Binary Trees"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={newTask.subject_id}
                    onValueChange={(value) => setNewTask({ ...newTask, subject_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: subject.color }}
                            />
                            {subject.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    placeholder="e.g., AVL Trees"
                    value={newTask.topic}
                    onChange={(e) => setNewTask({ ...newTask, topic: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newTask.task_date}
                    onChange={(e) => setNewTask({ ...newTask, task_date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newTask.start_time}
                      onChange={(e) => setNewTask({ ...newTask, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newTask.end_time}
                      onChange={(e) => setNewTask({ ...newTask, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  />
                </div>

                <GradientButton onClick={handleAddTask} className="w-full">
                  Add Task
                </GradientButton>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : tasks.length === 0 ? (
          <GlassCard className="text-center py-12">
            <CheckSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first task to start organizing your study schedule
            </p>
            <GradientButton onClick={() => setIsAddingTask(true)}>
              <Plus className="w-5 h-5 mr-2" /> Add Your First Task
            </GradientButton>
          </GlassCard>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTasks).map(([date, dateTasks], groupIndex) => (
              <div key={date}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {format(new Date(date), 'EEEE, MMMM do, yyyy')}
                </h2>
                <div className="space-y-3">
                  {dateTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                    >
                      <GlassCard hover={false} className="p-4">
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => handleToggleTask(task.id, task.is_completed)}
                            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors mt-1 ${
                              task.is_completed 
                                ? 'bg-success border-success' 
                                : 'border-muted-foreground hover:border-primary'
                            }`}
                          >
                            {task.is_completed && <Check className="w-4 h-4 text-white" />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </h3>
                                {task.subjects && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <div 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: task.subjects.color }}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                      {task.subjects.name}
                                      {task.topic && ` • ${task.topic}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                                  <Flag className="w-3 h-3 inline mr-1" />
                                  {task.priority}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            
                            {(task.start_time || task.notes) && (
                              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                                {task.start_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {format(new Date(task.start_time), 'h:mm a')}
                                    {task.end_time && ` - ${format(new Date(task.end_time), 'h:mm a')}`}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {task.notes && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
