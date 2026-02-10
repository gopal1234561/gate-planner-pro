import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ModeCard {
  emoji: string;
  title: string;
  description: string;
  features: string[];
  gradient: string;
  borderGradient: string;
}

const modes: ModeCard[] = [
  {
    emoji: '🧠',
    title: 'Focus Mode',
    description: 'Sharpen concentration with strategic games.',
    features: ['Sudoku', '2048', 'Chess'],
    gradient: 'from-violet-500/10 to-indigo-500/10',
    borderGradient: 'from-violet-500/40 via-indigo-500/30 to-violet-500/10',
  },
  {
    emoji: '⚡',
    title: 'Energy Mode',
    description: 'Boost alertness with fast reaction challenges.',
    features: ['Reaction games', 'Tap games'],
    gradient: 'from-amber-500/10 to-orange-500/10',
    borderGradient: 'from-amber-500/40 via-orange-500/30 to-amber-500/10',
  },
  {
    emoji: '😌',
    title: 'Calm Mode',
    description: 'Relax your mind with peaceful activities.',
    features: ['Zen Garden', 'Coloring'],
    gradient: 'from-emerald-500/10 to-teal-500/10',
    borderGradient: 'from-emerald-500/40 via-teal-500/30 to-emerald-500/10',
  },
  {
    emoji: '🧩',
    title: 'Brain Warmup',
    description: 'Activate your brain with light puzzles.',
    features: ['Memory games', 'Logic puzzles'],
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
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>, mode: ModeCard) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
    setTimeout(() => {
      setSelectedMode(mode);
      setRipple(null);
    }, 300);
  };

  return (
    <>
      <section className="w-full py-12">
        {/* Header */}
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

        {/* Cards Grid */}
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
              {/* Gradient border */}
              <div
                className={cn(
                  'absolute -inset-[1px] rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  mode.borderGradient
                )}
              />

              {/* Card */}
              <div
                className={cn(
                  'relative rounded-2xl p-6 h-full flex flex-col',
                  'bg-card/60 dark:bg-card/40 backdrop-blur-xl border border-border/50',
                  'transition-shadow duration-300 group-hover:shadow-xl'
                )}
              >
                {/* Emoji Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4',
                    'bg-gradient-to-br',
                    mode.gradient
                  )}
                >
                  {mode.emoji}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg text-foreground mb-1">{mode.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {mode.description}
                </p>

                {/* Features */}
                <ul className="space-y-1.5 mb-6 flex-1">
                  {mode.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Start Button */}
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
                      style={{
                        left: ripple.x - 10,
                        top: ripple.y - 10,
                        width: 20,
                        height: 20,
                      }}
                    />
                  )}
                  <span className="relative z-10">Start</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Coming Soon Modal */}
      <Dialog open={!!selectedMode} onOpenChange={() => setSelectedMode(null)}>
        <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedMode?.emoji} {selectedMode?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedMode?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center space-y-3">
            <div className="text-4xl">🚀</div>
            <p className="font-medium text-foreground">Coming Soon!</p>
            <p className="text-sm text-muted-foreground">
              We're building this experience for you. Stay tuned!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
