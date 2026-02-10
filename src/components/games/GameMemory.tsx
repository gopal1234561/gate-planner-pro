import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMOJIS = ['🎯', '🚀', '💡', '🎨', '🔥', '⭐', '🎵', '🌈'];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const shuffleCards = (): Card[] => {
  const pairs = [...EMOJIS, ...EMOJIS];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
};

export const GameMemory: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(shuffleCards);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleFlip = useCallback((id: number) => {
    if (locked || won) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    const newFlipped = [...flippedIds, id];
    setCards(newCards);
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = newFlipped;
      const cardA = newCards.find(c => c.id === a)!;
      const cardB = newCards.find(c => c.id === b)!;

      if (cardA.emoji === cardB.emoji) {
        const matched = newCards.map(c =>
          c.id === a || c.id === b ? { ...c, matched: true } : c
        );
        setCards(matched);
        setFlippedIds([]);
        setLocked(false);
        if (matched.every(c => c.matched)) setWon(true);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          setLocked(false);
        }, 800);
      }
    }
  }, [cards, flippedIds, locked, won]);

  const reset = () => {
    setCards(shuffleCards());
    setFlippedIds([]);
    setMoves(0);
    setWon(false);
    setLocked(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[280px]">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Moves</p>
          <p className="text-lg font-bold text-foreground">{moves}</p>
        </div>
        <button onClick={reset} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Restart">
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Pairs</p>
          <p className="text-lg font-bold text-foreground">
            {cards.filter(c => c.matched).length / 2}/{EMOJIS.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map(card => (
          <motion.button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-2xl flex items-center justify-center transition-colors duration-200',
              card.flipped || card.matched
                ? 'bg-primary/10 border border-primary/30'
                : 'bg-muted/60 hover:bg-muted border border-border/50 cursor-pointer'
            )}
            aria-label={card.flipped || card.matched ? card.emoji : 'Hidden card'}
          >
            <AnimatedCard show={card.flipped || card.matched} emoji={card.emoji} />
          </motion.button>
        ))}
      </div>

      {won && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-green-500 font-semibold"
        >
          🎉 You won in {moves} moves!
        </motion.p>
      )}
    </div>
  );
};

const AnimatedCard: React.FC<{ show: boolean; emoji: string }> = ({ show, emoji }) => (
  <motion.span
    initial={false}
    animate={{ rotateY: show ? 0 : 180, opacity: show ? 1 : 0 }}
    transition={{ duration: 0.3 }}
    className="select-none"
  >
    {show ? emoji : ''}
  </motion.span>
);
