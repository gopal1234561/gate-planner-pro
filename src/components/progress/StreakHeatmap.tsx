import React, { useMemo, useState } from 'react';
import { format, startOfWeek, addDays, subDays, differenceInCalendarDays } from 'date-fns';
import { Flame } from 'lucide-react';

interface StreakHeatmapProps {
  /** Map of yyyy-MM-dd -> minutes studied */
  data: Record<string, number>;
  /** Number of weeks to display (default 26 ~ 6 months) */
  weeks?: number;
}

const LEVEL_CLASSES = [
  'bg-muted/40',
  'bg-emerald-500/25',
  'bg-emerald-500/50',
  'bg-emerald-500/75',
  'bg-emerald-500',
];

const minutesToLevel = (m: number): number => {
  if (!m) return 0;
  if (m < 30) return 1;
  if (m < 60) return 2;
  if (m < 120) return 3;
  return 4;
};

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({ data, weeks = 26 }) => {
  const [hover, setHover] = useState<{ date: string; minutes: number } | null>(null);

  const { grid, monthLabels, stats } = useMemo(() => {
    const today = new Date();
    // Align end-of-grid to the current week (Sunday end)
    const gridEnd = addDays(startOfWeek(today, { weekStartsOn: 0 }), 6);
    const gridStart = subDays(gridEnd, weeks * 7 - 1);

    const cols: { date: Date; key: string; minutes: number }[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: { date: Date; key: string; minutes: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(gridStart, w * 7 + d);
        const key = format(date, 'yyyy-MM-dd');
        col.push({ date, key, minutes: data[key] || 0 });
      }
      cols.push(col);
    }

    // Month labels above columns
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    cols.forEach((col, i) => {
      const m = col[0].date.getMonth();
      if (m !== lastMonth) {
        labels.push({ col: i, label: format(col[0].date, 'MMM') });
        lastMonth = m;
      }
    });

    // Stats: current streak, longest streak, active days in window, total hours
    let activeDays = 0;
    let totalMinutes = 0;
    cols.forEach(col => col.forEach(c => {
      if (c.date <= today && c.minutes > 0) {
        activeDays++;
        totalMinutes += c.minutes;
      }
    }));

    // Current streak: count back from today
    let currentStreak = 0;
    let cursor = new Date(today);
    while (true) {
      const k = format(cursor, 'yyyy-MM-dd');
      if ((data[k] || 0) > 0) {
        currentStreak++;
        cursor = subDays(cursor, 1);
        if (differenceInCalendarDays(today, cursor) > 365) break;
      } else {
        break;
      }
    }

    // Longest streak within window
    let longest = 0;
    let run = 0;
    const flat = cols.flat().filter(c => c.date <= today);
    flat.forEach(c => {
      if (c.minutes > 0) { run++; longest = Math.max(longest, run); }
      else run = 0;
    });

    return {
      grid: cols,
      monthLabels: labels,
      stats: { activeDays, totalHours: Math.round(totalMinutes / 60 * 10) / 10, currentStreak, longest },
    };
  }, [data, weeks]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Current Streak</p>
          <p className="text-xl font-bold gradient-text flex items-center justify-center gap-1">
            {stats.currentStreak}<Flame className="w-4 h-4 text-orange-500" />
          </p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Longest Streak</p>
          <p className="text-xl font-bold gradient-text">{stats.longest}</p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Active Days</p>
          <p className="text-xl font-bold gradient-text">{stats.activeDays}</p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Hours</p>
          <p className="text-xl font-bold gradient-text">{stats.totalHours}h</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex gap-[3px] ml-7 mb-1 h-3 relative">
            {grid.map((_, i) => {
              const label = monthLabels.find(l => l.col === i);
              return (
                <div key={i} className="w-3 text-[10px] text-muted-foreground relative">
                  {label && <span className="absolute left-0 whitespace-nowrap">{label.label}</span>}
                </div>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[3px] mr-1 w-6">
              {dayLabels.map((l, i) => (
                <div key={i} className="h-3 text-[10px] text-muted-foreground leading-3">{l}</div>
              ))}
            </div>

            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map(cell => {
                  const future = cell.date > new Date();
                  const level = future ? 0 : minutesToLevel(cell.minutes);
                  return (
                    <div
                      key={cell.key}
                      onMouseEnter={() => !future && setHover({ date: cell.key, minutes: cell.minutes })}
                      onMouseLeave={() => setHover(null)}
                      className={`w-3 h-3 rounded-[3px] transition-transform hover:scale-125 cursor-pointer ${future ? 'bg-transparent' : LEVEL_CLASSES[level]}`}
                      title={future ? '' : `${format(cell.date, 'dd MMM yyyy')} · ${Math.round(cell.minutes / 60 * 10) / 10}h`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end text-[10px] text-muted-foreground">
            <span>Less</span>
            {LEVEL_CLASSES.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-[3px] ${c}`} />
            ))}
            <span>More</span>
          </div>

          {hover && (
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(hover.date), 'EEEE, dd MMM yyyy')} ·{' '}
              <span className="text-foreground font-medium">
                {hover.minutes > 0 ? `${Math.round(hover.minutes / 60 * 10) / 10}h studied` : 'No study logged'}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
