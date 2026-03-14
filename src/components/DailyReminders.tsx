import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, parseISO } from 'date-fns';

interface OverdueTopic {
  id: string;
  name: string;
  subjectName: string;
  subjectColor: string;
  lastRevised: string;
  daysMissed: number;
}

interface TodayReminder {
  id: string;
  name: string;
  subjectName: string;
  subjectColor: string;
  dueType: string;
}

export const DailyReminders: React.FC = () => {
  const { user } = useAuth();
  const [overdueTopics, setOverdueTopics] = useState<OverdueTopic[]>([]);
  const [todayReminders, setTodayReminders] = useState<TodayReminder[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchReminders();
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    const [{ data: topics }, { data: subjects }] = await Promise.all([
      supabase.from('topics').select('*').eq('user_id', user.id).eq('is_completed', true),
      supabase.from('subjects').select('*').eq('user_id', user.id),
    ]);

    if (!topics || !subjects) { setLoading(false); return; }

    const subjectMap = new Map(subjects.map(s => [s.id, { name: s.name, color: s.color || '#8B5CF6' }]));
    const today = new Date();
    const intervals = [1, 3, 7, 14, 30, 60];

    const overdue: OverdueTopic[] = [];
    const reminders: TodayReminder[] = [];

    for (const topic of topics) {
      if (!topic.last_revised_at) continue;
      const lastRevised = parseISO(topic.last_revised_at);
      const daysSince = differenceInDays(today, lastRevised);
      const sub = subjectMap.get(topic.subject_id) || { name: 'Unknown', color: '#8B5CF6' };

      // Find the next expected revision interval
      const nextInterval = intervals.find(i => i > (topic.revision_count > 0 ? intervals[Math.min(topic.revision_count - 1, intervals.length - 1)] : 0)) || intervals[0];
      const expectedInterval = intervals[Math.min(topic.revision_count, intervals.length - 1)];

      if (daysSince >= expectedInterval) {
        if (daysSince === expectedInterval) {
          reminders.push({ id: topic.id, name: topic.name, subjectName: sub.name, subjectColor: sub.color, dueType: `Due today (${expectedInterval}-day interval)` });
        } else {
          overdue.push({ id: topic.id, name: topic.name, subjectName: sub.name, subjectColor: sub.color, lastRevised: format(lastRevised, 'MMM d'), daysMissed: daysSince - expectedInterval });
        }
      }
    }

    // Also check for topics due for revision today based on revision_date
    const { data: dueTodayTopics } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', user.id)
      .lte('revision_date', format(today, 'yyyy-MM-dd'));

    if (dueTodayTopics) {
      for (const topic of dueTodayTopics) {
        if (reminders.some(r => r.id === topic.id) || overdue.some(o => o.id === topic.id)) continue;
        const sub = subjectMap.get(topic.subject_id) || { name: 'Unknown', color: '#8B5CF6' };
        const isOverdue = topic.revision_date && differenceInDays(today, parseISO(topic.revision_date)) > 0;
        if (isOverdue) {
          overdue.push({ id: topic.id, name: topic.name, subjectName: sub.name, subjectColor: sub.color, lastRevised: topic.revision_date ? format(parseISO(topic.revision_date), 'MMM d') : 'N/A', daysMissed: differenceInDays(today, parseISO(topic.revision_date!)) });
        } else {
          reminders.push({ id: topic.id, name: topic.name, subjectName: sub.name, subjectColor: sub.color, dueType: 'Scheduled for today' });
        }
      }
    }

    setOverdueTopics(overdue.slice(0, 10));
    setTodayReminders(reminders.slice(0, 10));
    setLoading(false);
  };

  const total = overdueTopics.length + todayReminders.length;
  if (loading || total === 0) return null;

  return (
    <GlassCard delay={0.2}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Daily Reminders</h3>
            <p className="text-xs text-muted-foreground">{total} topic{total !== 1 ? 's' : ''} need your attention</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdueTopics.length > 0 && (
            <Badge variant="destructive" className="text-xs">{overdueTopics.length} overdue</Badge>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 space-y-3">
              {overdueTopics.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-3 h-3" /> Missed / Overdue
                  </p>
                  {overdueTopics.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.subjectColor }} />
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-xs text-muted-foreground">({t.subjectName})</span>
                      </div>
                      <span className="text-xs text-destructive">{t.daysMissed}d overdue</span>
                    </div>
                  ))}
                </div>
              )}

              {todayReminders.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-2">
                    <BookOpen className="w-3 h-3" /> Due Today
                  </p>
                  {todayReminders.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/10 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.subjectColor }} />
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-xs text-muted-foreground">({t.subjectName})</span>
                      </div>
                      <span className="text-xs text-primary">{t.dueType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};
