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
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { GradientButton } from '@/components/ui/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
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
  date: string;
  displayDate: string;
  hours: number;
}

const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyStudyRecord[]>([]);
  const [showDailyLog, setShowDailyLog] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalTopics: 0,
    completedTopics: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    if (!user) return;

    // Fetch subjects with topics
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', user.id);

    const subjectProgressData: SubjectProgress[] = [];
    let totalTopics = 0;
    let completedTopics = 0;

    for (const subject of subjects || []) {
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
          color: subject.color,
          total,
          completed,
        });
      }
    }

    setSubjectProgress(subjectProgressData);

    // Fetch tasks stats
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('is_completed')
      .eq('user_id', user.id);

    const totalTasks = allTasks?.length || 0;
    const completedTasks = allTasks?.filter(t => t.is_completed).length || 0;

    // Fetch weekly study hours
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

    // Fetch all study sessions grouped by date for daily log
    const { data: allSessions } = await supabase
      .from('study_sessions')
      .select('session_date, duration_minutes')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false });

    const dateMap: Record<string, number> = {};
    allSessions?.forEach(s => {
      const d = s.session_date || '';
      dateMap[d] = (dateMap[d] || 0) + s.duration_minutes;
    });

    const records: DailyStudyRecord[] = Object.entries(dateMap)
      .filter(([_, mins]) => mins > 0)
      .map(([date, mins]) => ({
        date,
        displayDate: format(new Date(date), 'dd MMM yyyy, EEEE'),
        hours: Math.round((mins / 60) * 10) / 10,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    setDailyRecords(records);

    const totalHours = weekData.reduce((acc, d) => acc + d.hours, 0);

    setTotalStats({
      totalTopics,
      completedTopics,
      totalTasks,
      completedTasks,
      totalHours,
    });

    setLoading(false);
  };

  const pieData = [
    { name: 'Completed', value: totalStats.completedTopics, color: 'hsl(142, 76%, 36%)' },
    { name: 'Remaining', value: totalStats.totalTopics - totalStats.completedTopics, color: 'hsl(var(--muted))' },
  ];

  const overallProgress = totalStats.totalTopics > 0 
    ? (totalStats.completedTopics / totalStats.totalTopics) * 100 
    : 0;

  const taskProgress = totalStats.totalTasks > 0 
    ? (totalStats.completedTasks / totalStats.totalTasks) * 100 
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
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
                    <p className="text-2xl font-bold">
                      {totalStats.completedTopics}/{totalStats.totalTopics}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {totalStats.completedTasks}/{totalStats.totalTasks}
                    </p>
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
              {/* Weekly Study Hours */}
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
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="hours" 
                        fill="url(#colorGradient)" 
                        radius={[4, 4, 0, 0]}
                      />
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

              {/* Overall Completion */}
              <GlassCard>
                <h3 className="font-semibold mb-4">Overall Completion</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
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
                      <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                        {dailyRecords.map((record) => (
                          <div
                            key={record.date}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50"
                          >
                            <span className="text-sm text-foreground">{record.displayDate}</span>
                            <span className="text-sm font-semibold text-primary">{record.hours}h</span>
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
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: subject.color }}
                            />
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
