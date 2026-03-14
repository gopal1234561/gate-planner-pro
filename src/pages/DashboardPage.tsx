import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp,
  BookOpen,
  Calendar,
  Flame,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { StressBurstMode } from '@/components/StressBurstMode';
import { DailyReminders } from '@/components/DailyReminders';

interface DashboardStats {
  todayTasks: number;
  completedTasks: number;
  totalSubjects: number;
  studyHours: number;
  streak: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayTasks: 0,
    completedTasks: 0,
    totalSubjects: 0,
    studyHours: 0,
    streak: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    // Fetch today's tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_date', today);

    // Fetch all tasks for completion rate
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .limit(5)
      .order('created_at', { ascending: false });

    // Fetch subjects count
    const { count: subjectsCount } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch study sessions for today
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .eq('session_date', today);

    const totalMinutes = sessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0;
    const completedToday = tasks?.filter(t => t.is_completed).length || 0;

    setStats({
      todayTasks: tasks?.length || 0,
      completedTasks: completedToday,
      totalSubjects: subjectsCount || 0,
      studyHours: Math.round(totalMinutes / 60 * 10) / 10,
      streak: 7, // Calculate actual streak later
    });

    setRecentTasks(allTasks || []);
    setLoading(false);
  };

  const productivityPercentage = stats.todayTasks > 0 
    ? Math.round((stats.completedTasks / stats.todayTasks) * 100) 
    : 0;

  const statCards = [
    {
      icon: CheckCircle,
      label: "Today's Tasks",
      value: `${stats.completedTasks}/${stats.todayTasks}`,
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Clock,
      label: 'Study Hours',
      value: `${stats.studyHours}h`,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: BookOpen,
      label: 'Subjects',
      value: stats.totalSubjects.toString(),
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: TrendingUp,
      label: 'Productivity',
      value: `${productivityPercentage}%`,
      color: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="gradient-text">{user?.user_metadata?.full_name || 'Student'}!</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <GlassCard key={stat.label} delay={index * 0.1}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Study Streak & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard delay={0.4}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold">{stats.streak} days</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Keep up the great work! Consistency is key to cracking GATE.
            </p>
          </GlassCard>

          <GlassCard delay={0.5}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Today's Progress
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasks completed</span>
                <span className="font-medium">{stats.completedTasks} of {stats.todayTasks}</span>
              </div>
              <Progress value={productivityPercentage} className="h-3" />
            </div>
          </GlassCard>
        </div>

        {/* Recent Tasks */}
        <GlassCard delay={0.6}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Recent Tasks
          </h3>
          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${task.is_completed ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(task.created_at), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No tasks yet. Start by adding your first task!
            </p>
          )}
        </GlassCard>

        {/* Daily Reminders */}
        <DailyReminders />

        {/* Stress Burst Mode */}
        <StressBurstMode />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
