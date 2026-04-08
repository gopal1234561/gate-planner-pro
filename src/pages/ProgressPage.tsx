import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  BookOpen, 
  CheckCircle,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { GradientButton } from '@/components/ui/GradientButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface SubjectProgress {
  name: string;
  color: string;
  total: number;
  completed: number;
}

interface DailyStudyRecord {
  id: string;
  date: string;
  displayDate: string;
  hours: number;
  subjectName: string | null;
  subjectId: string | null;
  durationMinutes: number;
}

interface SubjectOption {
  id: string;
  name: string;
}

const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ day: string; hours: number }[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyStudyRecord[]>([]);
  const [showDailyLog, setShowDailyLog] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalTopics: 0,
    completedTopics: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logHours, setLogHours] = useState('');
  const [logSubject, setLogSubject] = useState<string>('none');
  const [logging, setLogging] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSubject, setEditSubject] = useState<string>('none');

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const handleLogStudyHours = async () => {
    if (!user || !logHours || parseFloat(logHours) <= 0) {
      toast.error('Please enter valid hours');
      return;
    }
    setLogging(true);
    const minutes = Math.round(parseFloat(logHours) * 60);
    const { error } = await supabase.from('study_sessions').insert({
      user_id: user.id,
      duration_minutes: minutes,
      session_date: logDate,
      subject_id: logSubject === 'none' ? null : logSubject,
    });
    if (error) {
      toast.error('Failed to log study hours');
    } else {
      toast.success('Study hours logged!');
      setLogHours('');
      setLogSubject('none');
      fetchProgressData();
    }
    setLogging(false);
  };

  const handleDeleteSession = async (id: string) => {
    const { error } = await supabase.from('study_sessions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Deleted');
      fetchProgressData();
    }
  };

  const handleStartEdit = (record: DailyStudyRecord) => {
    setEditingId(record.id);
    setEditHours(String(record.hours));
    setEditDate(record.date);
    setEditSubject(record.subjectId || 'none');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editHours || parseFloat(editHours) <= 0) {
      toast.error('Please enter valid hours');
      return;
    }
    const minutes = Math.round(parseFloat(editHours) * 60);
    const { error } = await supabase.from('study_sessions').update({
      duration_minutes: minutes,
      session_date: editDate,
      subject_id: editSubject === 'none' ? null : editSubject,
    }).eq('id', editingId);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Updated');
      setEditingId(null);
      fetchProgressData();
    }
  };

  const fetchProgressData = async () => {
    if (!user) return;

    // Fetch subjects
    const { data: subjectsData } = await supabase
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', user.id);

    setSubjects((subjectsData || []).map(s => ({ id: s.id, name: s.name })));

    const subjectMap: Record<string, string> = {};
    (subjectsData || []).forEach(s => { subjectMap[s.id] = s.name; });

    const subjectProgressData: SubjectProgress[] = [];
    let totalTopics = 0;
    let completedTopics = 0;

    for (const subject of subjectsData || []) {
      const { data: topics } = await supabase
        .from('topics')
        .select('is_completed')
        .eq('subject_id', subject.id);

      const total = topics?.length || 0;
      const completed = topics?.filter(t => t.is_completed).length || 0;
      totalTopics += total;
      completedTopics += completed;

      if (total > 0) {
        subjectProgressData.push({
          name: subject.name,
          color: subject.color || '#8B5CF6',
          total,
          completed,
        });
      }
    }
    setSubjectProgress(subjectProgressData);

    const { data: allTasks } = await supabase
      .from('tasks')
      .select('is_completed')
      .eq('user_id', user.id);

    const totalTasks = allTasks?.length || 0;
    const completedTasks = allTasks?.filter(t => t.is_completed).length || 0;

    // Weekly data
    const weekData: { day: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('session_date', dateStr);

      const totalMinutes = sessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0;
      weekData.push({
        day: format(date, 'EEE'),
        hours: Math.round(totalMinutes / 60 * 10) / 10,
      });
    }
    setWeeklyData(weekData);

    // Monthly data (all 12 months of current year)
    const currentYear = new Date().getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const { data: yearSessions } = await supabase
      .from('study_sessions')
      .select('duration_minutes, session_date')
      .eq('user_id', user.id)
      .gte('session_date', `${currentYear}-01-01`)
      .lte('session_date', `${currentYear}-12-31`);

    const monthTotals: number[] = new Array(12).fill(0);
    (yearSessions || []).forEach(s => {
      if (s.session_date) {
        const month = new Date(s.session_date).getMonth();
        monthTotals[month] += s.duration_minutes;
      }
    });
    setMonthlyData(monthNames.map((name, i) => ({
      day: name,
      hours: Math.round(monthTotals[i] / 60 * 10) / 10,
    })));

    // Fetch all sessions individually for edit/delete
    const { data: allSessions } = await supabase
      .from('study_sessions')
      .select('id, session_date, duration_minutes, subject_id')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false });

    const records: DailyStudyRecord[] = (allSessions || []).map(s => ({
      id: s.id,
      date: s.session_date || '',
      displayDate: s.session_date ? format(new Date(s.session_date), 'dd MMM yyyy, EEEE') : 'Unknown',
      hours: Math.round((s.duration_minutes / 60) * 10) / 10,
      subjectName: s.subject_id ? (subjectMap[s.subject_id] || 'Unknown') : null,
      subjectId: s.subject_id,
      durationMinutes: s.duration_minutes,
    }));

    setDailyRecords(records);

    const totalHours = weekData.reduce((acc, d) => acc + d.hours, 0);
    setTotalStats({ totalTopics, completedTopics, totalTasks, completedTasks, totalHours });
    setLoading(false);
  };

  const pieData = [
    { name: 'Completed', value: totalStats.completedTopics, color: 'hsl(142, 76%, 36%)' },
    { name: 'Remaining', value: totalStats.totalTopics - totalStats.completedTopics, color: 'hsl(var(--muted))' },
  ];

  const overallProgress = totalStats.totalTopics > 0 
    ? (totalStats.completedTopics / totalStats.totalTopics) * 100 : 0;
  const taskProgress = totalStats.totalTasks > 0 
    ? (totalStats.completedTasks / totalStats.totalTasks) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Progress</h1>
          <p className="text-muted-foreground">Track your study progress and analytics</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Topics</p>
                    <p className="text-2xl font-bold">{totalStats.completedTopics}/{totalStats.totalTopics}</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tasks Done</p>
                    <p className="text-2xl font-bold">{totalStats.completedTasks}/{totalStats.totalTasks}</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weekly Hours</p>
                    <p className="text-2xl font-bold">{totalStats.totalHours}h</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-2xl font-bold">{overallProgress.toFixed(0)}%</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Weekly Study Hours
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="hours" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(var(--secondary))" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold mb-4">Overall Completion</h3>
                <div className="h-64 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <p className="text-3xl font-bold gradient-text">{overallProgress.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Monthly Chart */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Monthly Study Hours ({new Date().getFullYear()})
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="hours" fill="url(#monthGradient)" radius={[2, 2, 0, 0]} />
                    <defs>
                      <linearGradient id="monthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142, 76%, 36%)" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Log Study Hours */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Log Study Hours
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <Input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="sm:w-44"
                />
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="Hours (e.g. 2.5)"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className="sm:w-44"
                />
                <Select value={logSubject} onValueChange={setLogSubject}>
                  <SelectTrigger className="sm:w-48">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subject</SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <GradientButton onClick={handleLogStudyHours} disabled={logging}>
                  {logging ? 'Logging...' : 'Log Hours'}
                </GradientButton>
              </div>
            </GlassCard>

            {/* Daily Study Hours Log */}
            <GlassCard>
              <button
                onClick={() => setShowDailyLog(!showDailyLog)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Hours Studied Per Day
                </h3>
                {showDailyLog ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              <AnimatePresence>
                {showDailyLog && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {dailyRecords.length > 0 ? (
                      <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                        {dailyRecords.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50 gap-2"
                          >
                            {editingId === record.id ? (
                              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                                <Input
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="sm:w-40 h-8 text-sm"
                                />
                                <Input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={editHours}
                                  onChange={(e) => setEditHours(e.target.value)}
                                  className="sm:w-24 h-8 text-sm"
                                />
                                <Select value={editSubject} onValueChange={setEditSubject}>
                                  <SelectTrigger className="sm:w-36 h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No subject</SelectItem>
                                    {subjects.map(s => (
                                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-1">
                                  <button onClick={handleSaveEdit} className="p-1 rounded-lg hover:bg-primary/20 text-green-500">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditingId(null)} className="p-1 rounded-lg hover:bg-destructive/20 text-muted-foreground">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 flex-1 min-w-0">
                                  <span className="text-sm text-foreground">{record.displayDate}</span>
                                  {record.subjectName && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary w-fit">
                                      {record.subjectName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-sm font-semibold text-primary">{record.hours}h</span>
                                  <button onClick={() => handleStartEdit(record)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteSession(record.id)} className="p-1 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6 mt-4">
                        No study sessions recorded yet
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Subject-wise Progress */}
            <GlassCard>
              <h3 className="font-semibold mb-6">Subject-wise Progress</h3>
              {subjectProgress.length > 0 ? (
                <div className="space-y-6">
                  {subjectProgress.map((subject, index) => {
                    const progress = (subject.completed / subject.total) * 100;
                    return (
                      <motion.div
                        key={subject.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                            <span className="font-medium">{subject.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {subject.completed}/{subject.total} topics ({progress.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Add subjects and topics to see your progress
                </p>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;
