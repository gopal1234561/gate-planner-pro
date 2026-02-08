import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  task_date: string;
  is_completed: boolean;
  priority: string;
  subjects?: { color: string };
}

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, currentMonth]);

  const fetchTasks = async () => {
    if (!user) return;

    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('tasks')
      .select('*, subjects(color)')
      .eq('user_id', user.id)
      .gte('task_date', start)
      .lte('task_date', end);

    setTasks(data || []);
    setLoading(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => isSameDay(new Date(task.task_date), date));
  };

  const selectedDayTasks = selectedDate ? getTasksForDay(selectedDate) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">View your schedule at a glance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <GlassCard className="lg:col-span-2">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square p-2 rounded-xl transition-all relative",
                      isCurrentMonth ? "hover:bg-muted" : "text-muted-foreground/50",
                      isToday && "ring-2 ring-primary",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary"
                    )}
                  >
                    <span className="text-sm font-medium">{format(day, 'd')}</span>
                    
                    {/* Task Indicators */}
                    {dayTasks.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayTasks.slice(0, 3).map((task, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              task.is_completed ? "bg-success" : "bg-accent"
                            )}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-xs">+{dayTasks.length - 3}</span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </GlassCard>

          {/* Selected Day Tasks */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">
                {selectedDate 
                  ? format(selectedDate, 'MMMM d, yyyy')
                  : 'Select a day'
                }
              </h3>
            </div>

            {selectedDate ? (
              selectedDayTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "p-3 rounded-lg border-l-4 bg-muted/50",
                        task.is_completed ? "border-success" : "border-accent"
                      )}
                    >
                      <p className={cn(
                        "font-medium",
                        task.is_completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      <span className="text-xs text-muted-foreground capitalize">
                        {task.priority} priority
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No tasks scheduled for this day
                </p>
              )
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Click on a day to view tasks
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
