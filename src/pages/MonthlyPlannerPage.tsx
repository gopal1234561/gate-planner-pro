import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 2 + i);

const pad = (n: number) => String(n).padStart(2, '0');
const toISODate = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

const MonthlyPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [month, setMonth] = useState<number>(now.getMonth());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const days = useMemo(() => {
    const total = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: total }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const weekday = date.getDay();
      return {
        day,
        weekday,
        weekdayName: WEEKDAYS[weekday],
        iso: toISODate(year, month, day),
        isWeekend: weekday === 0 || weekday === 6,
      };
    });
  }, [year, month]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const start = toISODate(year, month, 1);
      const end = toISODate(year, month, days.length);
      const { data, error } = await (supabase as any)
        .from('planner_dates')
        .select('selected_date, is_selected')
        .eq('user_id', user.id)
        .gte('selected_date', start)
        .lte('selected_date', end);
      if (error) {
        toast.error('Failed to load planner');
      } else {
        const set = new Set<string>();
        (data || []).forEach((r: any) => {
          if (r.is_selected) set.add(r.selected_date);
        });
        setSelected(set);
      }
      setLoading(false);
    };
    load();
  }, [user, year, month, days.length]);

  const toggleDay = async (iso: string) => {
    if (!user) return;
    const willSelect = !selected.has(iso);
    setSelected(prev => {
      const next = new Set(prev);
      if (willSelect) next.add(iso);
      else next.delete(iso);
      return next;
    });
    setSaving(iso);
    const { error } = await (supabase as any)
      .from('planner_dates')
      .upsert(
        { user_id: user.id, selected_date: iso, is_selected: willSelect },
        { onConflict: 'user_id,selected_date' }
      );
    if (error) toast.error('Could not save');
    setSaving(null);
  };

  const bulkSet = async (selectAll: boolean) => {
    if (!user) return;
    const isoList = days.map(d => d.iso);
    setSelected(selectAll ? new Set(isoList) : new Set());
    const rows = isoList.map(iso => ({
      user_id: user.id,
      selected_date: iso,
      is_selected: selectAll,
    }));
    const { error } = await (supabase as any)
      .from('planner_dates')
      .upsert(rows, { onConflict: 'user_id,selected_date' });
    if (error) toast.error('Could not save');
    else toast.success(selectAll ? 'All days selected' : 'All cleared');
  };

  const totalSelected = selected.size;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">
              Monthly GATE Planner
            </h1>
            <p className="text-sm text-muted-foreground">
              Pick the study days you'll commit to this month.
            </p>
          </div>
        </motion.div>

        <GlassCard className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Year</label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Month</label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => bulkSet(true)} className="gap-1">
              <CheckCircle2 className="w-4 h-4" /> Select All
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkSet(false)} className="gap-1">
              <XCircle className="w-4 h-4" /> Clear All
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {days.map(d => {
                const isSel = selected.has(d.iso);
                return (
                  <label
                    key={d.iso}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      d.isWeekend
                        ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                        : 'bg-card border-border hover:bg-muted/60',
                      isSel && 'ring-2 ring-primary/60'
                    )}
                  >
                    <Checkbox
                      checked={isSel}
                      onCheckedChange={() => toggleDay(d.iso)}
                      disabled={saving === d.iso}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {d.day} {MONTHS[month]}
                      </div>
                      <div className={cn(
                        'text-xs',
                        d.isWeekend ? 'text-primary font-medium' : 'text-muted-foreground'
                      )}>
                        {d.weekdayName}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Summary</p>
              <p className="text-2xl font-bold gradient-text">
                Total days selected: {totalSelected}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {MONTHS[month]} {year} • {days.length} days
            </p>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default MonthlyPlannerPage;
