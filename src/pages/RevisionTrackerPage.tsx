import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  CheckCircle,
  Clock,
  BookOpen,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isToday, isBefore, startOfDay } from 'date-fns';

// Spaced repetition intervals in days
const REVISION_INTERVALS = [1, 3, 7, 14, 30, 60];

interface TopicWithSubject {
  id: string;
  name: string;
  is_completed: boolean;
  revision_date: string | null;
  revision_count: number;
  last_revised_at: string | null;
  subject_id: string;
  subjects: { name: string; color: string };
}

const getNextRevisionDate = (revisionCount: number, fromDate: Date = new Date()): Date => {
  const intervalIndex = Math.min(revisionCount, REVISION_INTERVALS.length - 1);
  return addDays(fromDate, REVISION_INTERVALS[intervalIndex]);
};

const getRevisionStatus = (revisionDate: string | null) => {
  if (!revisionDate) return 'unscheduled';
  const date = new Date(revisionDate);
  const today = startOfDay(new Date());
  if (isToday(date)) return 'due-today';
  if (isBefore(date, today)) return 'overdue';
  return 'upcoming';
};

const RevisionTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<TopicWithSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'due-today' | 'overdue' | 'upcoming'>('all');

  const fetchTopics = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('topics')
      .select('id, name, is_completed, revision_date, revision_count, last_revised_at, subject_id, subjects(name, color)')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .order('revision_date', { ascending: true, nullsFirst: false });

    if (error) {
      toast({ title: 'Error fetching topics', variant: 'destructive' });
    } else {
      setTopics((data as unknown as TopicWithSubject[]) || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (user) fetchTopics();
  }, [user, fetchTopics]);

  const scheduleRevision = async (topicId: string) => {
    const nextDate = getNextRevisionDate(0);
    const { error } = await supabase
      .from('topics')
      .update({
        revision_date: format(nextDate, 'yyyy-MM-dd'),
        revision_count: 0,
      })
      .eq('id', topicId);

    if (error) {
      toast({ title: 'Error scheduling revision', variant: 'destructive' });
    } else {
      toast({ title: 'Revision scheduled!' });
      fetchTopics();
    }
  };

  const markRevised = async (topic: TopicWithSubject) => {
    const newCount = (topic.revision_count || 0) + 1;
    const nextDate = getNextRevisionDate(newCount);

    const { error } = await supabase
      .from('topics')
      .update({
        revision_count: newCount,
        revision_date: format(nextDate, 'yyyy-MM-dd'),
        last_revised_at: new Date().toISOString(),
      })
      .eq('id', topic.id);

    if (error) {
      toast({ title: 'Error updating revision', variant: 'destructive' });
    } else {
      toast({
        title: 'Revision complete!',
        description: `Next revision on ${format(nextDate, 'MMM do, yyyy')}`,
      });
      fetchTopics();
    }
  };

  const filteredTopics = topics.filter((topic) => {
    if (filter === 'all') return true;
    return getRevisionStatus(topic.revision_date) === filter;
  });

  const dueTodayCount = topics.filter((t) => getRevisionStatus(t.revision_date) === 'due-today').length;
  const overdueCount = topics.filter((t) => getRevisionStatus(t.revision_date) === 'overdue').length;
  const upcomingCount = topics.filter((t) => getRevisionStatus(t.revision_date) === 'upcoming').length;
  const unscheduledCount = topics.filter((t) => getRevisionStatus(t.revision_date) === 'unscheduled').length;

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'due-today': { label: 'Due Today', color: 'bg-warning/20 text-warning', icon: <Clock className="w-3 h-3" /> },
    overdue: { label: 'Overdue', color: 'bg-destructive/20 text-destructive', icon: <AlertCircle className="w-3 h-3" /> },
    upcoming: { label: 'Upcoming', color: 'bg-primary/20 text-primary', icon: <CalendarCheck className="w-3 h-3" /> },
    unscheduled: { label: 'Not Scheduled', color: 'bg-muted text-muted-foreground', icon: <RefreshCw className="w-3 h-3" /> },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revision Tracker</h1>
          <p className="text-muted-foreground">
            Spaced repetition schedule: revise at Day 1, 3, 7, 14, 30, 60
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Due Today', count: dueTodayCount, filterKey: 'due-today' as const, icon: <Clock className="w-5 h-5 text-warning" /> },
            { label: 'Overdue', count: overdueCount, filterKey: 'overdue' as const, icon: <AlertCircle className="w-5 h-5 text-destructive" /> },
            { label: 'Upcoming', count: upcomingCount, filterKey: 'upcoming' as const, icon: <CalendarCheck className="w-5 h-5 text-primary" /> },
            { label: 'Unscheduled', count: unscheduledCount, filterKey: 'all' as const, icon: <RefreshCw className="w-5 h-5 text-muted-foreground" /> },
          ].map((stat) => (
            <GlassCard
              key={stat.label}
              className={`p-4 cursor-pointer transition-all ${filter === stat.filterKey ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilter(stat.filterKey)}
            >
              <div className="flex items-center gap-3">
                {stat.icon}
                <div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Topics List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredTopics.length === 0 ? (
          <GlassCard className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {topics.length === 0
                ? 'No completed topics yet'
                : 'No topics match this filter'}
            </h3>
            <p className="text-muted-foreground">
              {topics.length === 0
                ? 'Complete topics in your subjects to start tracking revisions'
                : 'Try a different filter'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredTopics.map((topic, index) => {
              const status = getRevisionStatus(topic.revision_date);
              const config = statusConfig[status];

              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <GlassCard hover={false} className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{topic.name}</h3>
                          <Badge variant="outline" className={config.color}>
                            {config.icon}
                            <span className="ml-1">{config.label}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: topic.subjects?.color || '#8B5CF6' }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {topic.subjects?.name}
                          </span>
                          {topic.revision_date && (
                            <span className="text-sm text-muted-foreground">
                              • {format(new Date(topic.revision_date + 'T00:00:00'), 'MMM do')}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            • Revised {topic.revision_count || 0}x
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {status === 'unscheduled' ? (
                          <GradientButton size="sm" onClick={() => scheduleRevision(topic.id)}>
                            <RefreshCw className="w-4 h-4 mr-1" /> Schedule
                          </GradientButton>
                        ) : (status === 'due-today' || status === 'overdue') ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-success text-success hover:bg-success/10"
                            onClick={() => markRevised(topic)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Mark Revised
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RevisionTrackerPage;
