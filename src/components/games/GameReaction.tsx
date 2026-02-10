import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type GameState = 'idle' | 'waiting' | 'ready' | 'result' | 'too-early';

export const GameReaction: React.FC = () => {
  const [state, setState] = useState<GameState>('idle');
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [times, setTimes] = useState<number[]>([]);
  const startRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const startGame = useCallback(() => {
    setState('waiting');
    const delay = 1500 + Math.random() * 3500;
    timeoutRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setState('ready');
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (state === 'idle' || state === 'result' || state === 'too-early') {
      startGame();
      return;
    }
    if (state === 'waiting') {
      clearTimeout(timeoutRef.current);
      setState('too-early');
      return;
    }
    if (state === 'ready') {
      const time = Date.now() - startRef.current;
      setReactionTime(time);
      setTimes(prev => [...prev, time]);
      if (!bestTime || time < bestTime) setBestTime(time);
      setState('result');
    }
  }, [state, startGame, bestTime]);

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  const reset = () => {
    clearTimeout(timeoutRef.current);
    setState('idle');
    setTimes([]);
    setBestTime(null);
    setReactionTime(0);
  };

  const stateConfig = {
    idle: { bg: 'bg-primary/10', text: '⚡ Click to Start', sub: 'Test your reaction speed' },
    waiting: { bg: 'bg-destructive/10', text: '🔴 Wait for green...', sub: "Don't click yet!" },
    ready: { bg: 'bg-green-500/20', text: '🟢 CLICK NOW!', sub: 'As fast as you can!' },
    result: {
      bg: 'bg-primary/10',
      text: `⚡ ${reactionTime}ms`,
      sub: reactionTime < 200 ? 'Lightning fast!' : reactionTime < 300 ? 'Great reflexes!' : 'Keep practicing!',
    },
    'too-early': { bg: 'bg-destructive/10', text: '❌ Too Early!', sub: 'Click to try again' },
  };

  const config = stateConfig[state];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[300px]">
        <div className="flex gap-4">
          {bestTime && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Best</p>
              <p className="text-sm font-bold text-green-500">{bestTime}ms</p>
            </div>
          )}
          {avg > 0 && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg</p>
              <p className="text-sm font-bold text-foreground">{avg}ms</p>
            </div>
          )}
        </div>
        <button onClick={reset} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Reset">
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'w-full max-w-[300px] h-48 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors duration-300 cursor-pointer select-none',
          config.bg,
          'border border-border/50'
        )}
      >
        <span className="text-2xl font-bold text-foreground">{config.text}</span>
        <span className="text-sm text-muted-foreground">{config.sub}</span>
      </motion.button>

      {times.length > 0 && (
        <div className="flex gap-1.5 flex-wrap justify-center max-w-[300px]">
          {times.slice(-5).map((t, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-xs bg-muted/60 text-muted-foreground">
              {t}ms
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
