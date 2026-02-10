import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Game2048 } from '@/components/games/Game2048';
import { GameSudoku } from '@/components/games/GameSudoku';
import { GameReaction } from '@/components/games/GameReaction';
import { GameMemory } from '@/components/games/GameMemory';

interface GameInfo {
  id: string;
  label: string;
  component: React.FC | null;
}

interface ModeCard {
  emoji: string;
  title: string;
  description: string;
  features: string[];
  games: GameInfo[];
  gradient: string;
  borderGradient: string;
}

const modes: ModeCard[] = [
  {
    emoji: '🧠',
    title: 'Focus Mode',
    description: 'Sharpen concentration with strategic games.',
    features: ['Sudoku', '2048', 'Chess'],
    games: [
      { id: 'sudoku', label: 'Sudoku', component: GameSudoku },
      { id: '2048', label: '2048', component: Game2048 },
      { id: 'chess', label: 'Chess', component: null },
    ],
    gradient: 'from-violet-500/10 to-indigo-500/10',
    borderGradient: 'from-violet-500/40 via-indigo-500/30 to-violet-500/10',
  },
  {
    emoji: '⚡',
    title: 'Energy Mode',
    description: 'Boost alertness with fast reaction challenges.',
    features: ['Reaction games', 'Tap games'],
    games: [
      { id: 'reaction', label: 'Reaction Time', component: GameReaction },
      { id: 'tap', label: 'Tap Game', component: null },
    ],
    gradient: 'from-amber-500/10 to-orange-500/10',
    borderGradient: 'from-amber-500/40 via-orange-500/30 to-amber-500/10',
  },
  {
    emoji: '😌',
    title: 'Calm Mode',
    description: 'Relax your mind with peaceful activities.',
    features: ['Zen Garden', 'Coloring'],
    games: [
      { id: 'zen', label: 'Zen Garden', component: null },
      { id: 'coloring', label: 'Coloring', component: null },
    ],
    gradient: 'from-emerald-500/10 to-teal-500/10',
    borderGradient: 'from-emerald-500/40 via-teal-500/30 to-emerald-500/10',
  },
  {
    emoji: '🧩',
    title: 'Brain Warmup',
    description: 'Activate your brain with light puzzles.',
    features: ['Memory games', 'Logic puzzles'],
    games: [
      { id: 'memory', label: 'Memory Cards', component: GameMemory },
      { id: 'logic', label: 'Logic Puzzles', component: null },
    ],
    gradient: 'from-pink-500/10 to-rose-500/10',
    borderGradient: 'from-pink-500/40 via-rose-500/30 to-pink-500/10',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export const StressBurstMode: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<ModeCard | null>(null);
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>, mode: ModeCard) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
    setTimeout(() => {
      setSelectedMode(mode);
      setActiveGame(null);
      setRipple(null);
    }, 300);
  };

  const handleClose = () => {
    setSelectedMode(null);
    setActiveGame(null);
  };

  return (
    <>
      <section className="w-full py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold">
            🔋 Stress Burst Mode — <span className="gradient-text">Choose Your Reset</span>
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Recharge your mind in seconds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.03, y: -4 }}
              className="group relative"
            >
              <div
                className={cn(
                  'absolute -inset-[1px] rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  mode.borderGradient
                )}
              />
              <div
                className={cn(
                  'relative rounded-2xl p-6 h-full flex flex-col',
                  'bg-card/60 dark:bg-card/40 backdrop-blur-xl border border-border/50',
                  'transition-shadow duration-300 group-hover:shadow-xl'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4',
                    'bg-gradient-to-br',
                    mode.gradient
                  )}
                >
                  {mode.emoji}
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-1">{mode.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{mode.description}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {mode.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={(e) => handleStart(e, mode)}
                  className={cn(
                    'relative overflow-hidden w-full py-2.5 rounded-xl text-sm font-medium',
                    'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground',
                    'transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  {ripple && (
                    <span
                      className="absolute rounded-full bg-white/30 animate-ping"
                      style={{ left: ripple.x - 10, top: ripple.y - 10, width: 20, height: 20 }}
                    />
                  )}
                  <span className="relative z-10">Start</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Game Modal */}
      <Dialog open={!!selectedMode} onOpenChange={handleClose}>
        <DialogContent className={cn(
          'bg-card/95 backdrop-blur-xl border-border/50',
          activeGame ? 'sm:max-w-lg' : 'sm:max-w-md'
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedMode?.emoji} {activeGame ? activeGame.label : selectedMode?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {activeGame ? 'Have fun! Take a break and recharge.' : selectedMode?.description}
            </DialogDescription>
          </DialogHeader>

          {activeGame ? (
            <div className="py-4 flex flex-col items-center">
              {activeGame.component ? (
                <activeGame.component />
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="text-4xl">🚀</div>
                  <p className="font-medium text-foreground">Coming Soon!</p>
                  <p className="text-sm text-muted-foreground">We're building this experience for you.</p>
                </div>
              )}
              <button
                onClick={() => setActiveGame(null)}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to games
              </button>
            </div>
          ) : (
            <div className="py-4 grid grid-cols-2 gap-3">
              {selectedMode?.games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setActiveGame(game)}
                  className={cn(
                    'p-4 rounded-xl border border-border/50 text-left transition-all duration-200',
                    'hover:bg-primary/10 hover:border-primary/30',
                    'flex flex-col items-center gap-2'
                  )}
                >
                  <span className="font-medium text-sm text-foreground">{game.label}</span>
                  {!game.component && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Soon</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
