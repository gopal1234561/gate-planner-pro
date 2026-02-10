import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Grid = number[][];

const SIZE = 4;

const createEmptyGrid = (): Grid =>
  Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const addRandomTile = (grid: Grid): Grid => {
  const empty: [number, number][] = [];
  grid.forEach((row, r) => row.forEach((val, c) => { if (val === 0) empty.push([r, c]); }));
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
};

const slideRow = (row: number[]): { newRow: number[]; score: number } => {
  const filtered = row.filter(v => v !== 0);
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      score += filtered[i] * 2;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i++;
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { newRow: merged, score };
};

const rotateGrid = (grid: Grid): Grid => {
  const n = grid.length;
  return grid[0].map((_, c) => grid.map(row => row[c]).reverse());
};

const moveLeft = (grid: Grid): { grid: Grid; score: number; moved: boolean } => {
  let totalScore = 0;
  let moved = false;
  const newGrid = grid.map(row => {
    const { newRow, score } = slideRow(row);
    totalScore += score;
    if (row.some((v, i) => v !== newRow[i])) moved = true;
    return newRow;
  });
  return { grid: newGrid, score: totalScore, moved };
};

const move = (grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): { grid: Grid; score: number; moved: boolean } => {
  let g = grid;
  const rotations: Record<string, number> = { left: 0, up: 1, right: 2, down: 3 };
  const rots = rotations[direction];
  for (let i = 0; i < rots; i++) g = rotateGrid(g);
  const result = moveLeft(g);
  let ng = result.grid;
  for (let i = 0; i < (4 - rots) % 4; i++) ng = rotateGrid(ng);
  return { grid: ng, score: result.score, moved: result.moved };
};

const isGameOver = (grid: Grid): boolean => {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return false;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return false;
    }
  return true;
};

const tileColors: Record<number, string> = {
  2: 'bg-orange-100 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100',
  4: 'bg-orange-200 dark:bg-orange-800/50 text-orange-900 dark:text-orange-100',
  8: 'bg-orange-400 text-white',
  16: 'bg-orange-500 text-white',
  32: 'bg-red-400 text-white',
  64: 'bg-red-500 text-white',
  128: 'bg-amber-400 text-white',
  256: 'bg-amber-500 text-white',
  512: 'bg-yellow-400 text-white',
  1024: 'bg-yellow-500 text-white',
  2048: 'bg-yellow-600 text-white font-black',
};

const initGrid = (): Grid => addRandomTile(addRandomTile(createEmptyGrid()));

export const Game2048: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;
    const result = move(grid, direction);
    if (!result.moved) return;
    const newGrid = addRandomTile(result.grid);
    const newScore = score + result.score;
    setGrid(newGrid);
    setScore(newScore);
    if (newScore > best) setBest(newScore);
    if (isGameOver(newGrid)) setGameOver(true);
  }, [grid, score, best, gameOver]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      };
      if (map[e.key]) { e.preventDefault(); handleMove(map[e.key]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleMove]);

  // Touch support
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? 'right' : 'left');
    } else {
      handleMove(dy > 0 ? 'down' : 'up');
    }
    setTouchStart(null);
  };

  const reset = () => { setGrid(initGrid()); setScore(0); setGameOver(false); };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[280px]">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="text-xl font-bold text-foreground">{score}</p>
        </div>
        <button onClick={reset} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Restart">
          <RotateCcw className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="text-xl font-bold text-foreground">{best}</p>
        </div>
      </div>

      <div
        className="relative grid grid-cols-4 gap-2 bg-muted/60 dark:bg-muted/30 p-2 rounded-xl select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {grid.flat().map((val, i) => (
          <motion.div
            key={`${i}-${val}`}
            initial={{ scale: val ? 0.5 : 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg font-bold text-sm sm:text-base',
              val === 0 ? 'bg-muted/40 dark:bg-muted/20' : (tileColors[val] || 'bg-primary text-primary-foreground')
            )}
          >
            {val > 0 && val}
          </motion.div>
        ))}

        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3"
          >
            <p className="text-lg font-bold text-foreground">Game Over!</p>
            <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Try Again
            </button>
          </motion.div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Use arrow keys or swipe to play</p>
    </div>
  );
};
