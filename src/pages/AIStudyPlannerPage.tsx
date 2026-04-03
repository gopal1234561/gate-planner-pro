import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Clock, BookOpen, AlertTriangle, Loader2, Lightbulb, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface StudySession {
  subject: string;
  topic: string;
  duration_hours: number;
  type: 'new' | 'revision' | 'practice';
  priority: 'high' | 'medium' | 'low';
}

interface DayPlan {
  day: string;
  sessions: StudySession[];
  totalHours: number;
}

interface DailySuggestion {
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
}

interface StudyPlan {
  weeklyPlan: DayPlan[];
  dailySuggestions: DailySuggestion[];
  tips: string[];
}

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const typeColors = {
  new: 'bg-blue-500/20 text-blue-400',
  revision: 'bg-purple-500/20 text-purple-400',
  practice: 'bg-orange-500/20 text-orange-400',
};

const branches = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IN', 'CH', 'BM', 'Other'];

const AIStudyPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [dailyHours, setDailyHours] = useState(6);
  const [selectedDay, setSelectedDay] = useState(0);
  const [userPrompt, setUserPrompt] = useState('');
  const [missedDays, setMissedDays] = useState<string[]>([]);
  const [branch, setBranch] = useState('CSE');
  const [targetScore, setTargetScore] = useState('');
  const [examDate, setExamDate] = useState('2027-02-01');
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    const [{ data: subData }, { data: topData }, { data: profile }] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', user.id),
      supabase.from('topics').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('daily_goal_hours').eq('user_id', user.id).single(),
    ]);
    setSubjects(subData || []);
    setTopics(topData || []);
    if (profile?.daily_goal_hours) setDailyHours(profile.daily_goal_hours);
  };

  const generatePlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const completedTopics = topics.filter(t => t.is_completed).map(t => t.name);
      const subjectNames = subjects.map(s => s.name);

      const { data, error } = await supabase.functions.invoke('ai-study-planner', {
        body: {
          subjects: subjectNames.length > 0 ? subjectNames : ['Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks'],
          completedTopics,
          dailyHours,
          targetYear: 2027,
          missedDays: missedDays.length > 0 ? missedDays : undefined,
          userPrompt: userPrompt.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPlan(data);
      toast({ title: 'Study Plan Generated!', description: 'Your AI-powered study plan is ready.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate plan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <span className="gradient-text">AI Study Planner</span>
          </h1>
          <p className="text-muted-foreground mt-1">Get a personalized study plan powered by AI</p>
        </motion.div>

        {/* Generate Plan Section */}
        <GlassCard>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Generate Your Plan
              </h3>
              <p className="text-sm text-muted-foreground">
                {subjects.length} subjects • {topics.filter(t => t.is_completed).length}/{topics.length} topics completed • {dailyHours}h/day
              </p>
            </div>
            <Button onClick={generatePlan} disabled={loading} className="bg-hero-gradient">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {loading ? 'Generating...' : 'Generate Study Plan'}
            </Button>
          </div>

          {/* Custom Prompt */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-foreground">Custom Instructions (optional)</label>
            <Textarea
              placeholder="E.g. Focus more on Algorithms, I'm weak in OS scheduling, give me more practice problems..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="bg-muted/50 border-border resize-none"
              rows={2}
            />
          </div>

          {/* Missed Days */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-foreground">Missed days to reschedule</label>
            <div className="flex flex-wrap gap-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <label key={day} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={missedDays.includes(day)}
                    onCheckedChange={(checked) => {
                      setMissedDays(prev =>
                        checked ? [...prev, day] : prev.filter(d => d !== day)
                      );
                    }}
                  />
                  {day.slice(0, 3)}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Select days you missed — AI will redistribute those topics across remaining days.</p>
          </div>
        </GlassCard>

        {plan && (
          <>
            {/* Daily Suggestions */}
            <GlassCard delay={0.1}>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Today's Suggestions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.dailySuggestions?.map((suggestion, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-muted/50 border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-sm">{suggestion.title}</span>
                      <Badge className={priorityColors[suggestion.priority]}>{suggestion.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{suggestion.reason}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {suggestion.estimatedMinutes} min
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Weekly Plan */}
            <GlassCard delay={0.2}>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Weekly Study Plan
              </h3>

              {/* Day Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {plan.weeklyPlan?.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedDay === i
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {day.day}
                  </button>
                ))}
              </div>

              {/* Day Sessions */}
              {plan.weeklyPlan?.[selectedDay] && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Total: {plan.weeklyPlan[selectedDay].totalHours}h planned
                    </span>
                    <Progress
                      value={(plan.weeklyPlan[selectedDay].totalHours / dailyHours) * 100}
                      className="w-32 h-2"
                    />
                  </div>
                  {plan.weeklyPlan[selectedDay].sessions.map((session, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{session.topic}</p>
                          <p className="text-xs text-muted-foreground">{session.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={typeColors[session.type]}>{session.type}</Badge>
                        <Badge className={priorityColors[session.priority]}>{session.priority}</Badge>
                        <span className="text-sm text-muted-foreground">{session.duration_hours}h</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Tips */}
            {plan.tips && plan.tips.length > 0 && (
              <GlassCard delay={0.3}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Study Tips
                </h3>
                <ul className="space-y-2">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </>
        )}

        {!plan && !loading && (
          <GlassCard>
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Plan Generated Yet</h3>
              <p className="text-muted-foreground mb-4">
                Click "Generate Study Plan" to get your personalized AI-powered study schedule.
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AIStudyPlannerPage;
