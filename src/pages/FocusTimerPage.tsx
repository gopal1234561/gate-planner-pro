import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Coffee,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const TIMER_MODES = {
  focus: { label: 'Focus', minutes: 25, color: 'from-primary to-secondary' },
  shortBreak: { label: 'Short Break', minutes: 5, color: 'from-green-500 to-emerald-600' },
  longBreak: { label: 'Long Break', minutes: 15, color: 'from-orange-500 to-red-600' },
};

const FocusTimerPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQ8MAAA=');
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            // Use setTimeout to avoid state updates during render
            setTimeout(() => handleTimerComplete(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    if (mode === 'focus') {
      setSessionsCompleted(prev => prev + 1);
      
      // Record study session
      if (user) {
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          duration_minutes: TIMER_MODES.focus.minutes,
        });
      }

      toast({
        title: 'Focus session complete!',
        description: 'Time for a break. Great work!',
      });

      // Auto switch to break
      const newMode = sessionsCompleted > 0 && (sessionsCompleted + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(newMode);
      setTimeLeft(TIMER_MODES[newMode].minutes * 60);
    } else {
      toast({
        title: 'Break over!',
        description: 'Ready for another focus session?',
      });
      setMode('focus');
      setTimeLeft(TIMER_MODES.focus.minutes * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(TIMER_MODES[mode].minutes * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(TIMER_MODES[newMode].minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((TIMER_MODES[mode].minutes * 60 - timeLeft) / (TIMER_MODES[mode].minutes * 60)) * 100;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Focus Timer</h1>
          <p className="text-muted-foreground">Stay focused with the Pomodoro technique</p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-2">
          {(Object.keys(TIMER_MODES) as TimerMode[]).map((m) => (
            <Button
              key={m}
              variant={mode === m ? 'default' : 'outline'}
              onClick={() => switchMode(m)}
              className={cn(
                "transition-all",
                mode === m && `bg-gradient-to-r ${TIMER_MODES[m].color}`
              )}
            >
              {m === 'focus' && <Timer className="w-4 h-4 mr-2" />}
              {m === 'shortBreak' && <Coffee className="w-4 h-4 mr-2" />}
              {m === 'longBreak' && <Coffee className="w-4 h-4 mr-2" />}
              {TIMER_MODES[m].label}
            </Button>
          ))}
        </div>

        {/* Timer Display */}
        <GlassCard className="text-center py-12">
          <div className="relative inline-block">
            {/* Progress Ring */}
            <svg className="w-64 h-64 transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="120"
                stroke="url(#timerGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={753.98}
                initial={{ strokeDashoffset: 753.98 }}
                animate={{ strokeDashoffset: 753.98 - (753.98 * progress / 100) }}
                transition={{ duration: 0.5 }}
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="50%" stopColor="hsl(var(--secondary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Time Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span 
                key={timeLeft}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-6xl font-bold gradient-text"
              >
                {formatTime(timeLeft)}
              </motion.span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mt-8">
            <GradientButton 
              size="lg" 
              onClick={toggleTimer}
              className="min-w-[140px]"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 mr-2" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" /> Start
                </>
              )}
            </GradientButton>
            
            <Button 
              size="lg" 
              variant="outline" 
              onClick={resetTimer}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
          </div>
        </GlassCard>

        {/* Sessions Counter */}
        <GlassCard className="text-center">
          <h3 className="text-lg font-semibold mb-2">Sessions Completed Today</h3>
          <div className="flex justify-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full transition-colors",
                  i < sessionsCompleted % 4 
                    ? "bg-gradient-to-r from-primary to-secondary" 
                    : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-muted-foreground mt-2">
            {sessionsCompleted} total sessions • {sessionsCompleted * 25} minutes
          </p>
        </GlassCard>

        {/* Tips */}
        <GlassCard>
          <h3 className="font-semibold mb-4">🍅 Pomodoro Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Work for 25 minutes, then take a 5-minute break</li>
            <li>• After 4 sessions, take a longer 15-minute break</li>
            <li>• During focus time, eliminate all distractions</li>
            <li>• Use breaks to stretch, hydrate, or rest your eyes</li>
          </ul>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default FocusTimerPage;
