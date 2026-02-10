import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple Sudoku generator for easy puzzles
const generatePuzzle = (): { puzzle: number[][]; solution: number[][] } => {
  // Start with a known valid solution base and shuffle
  const base: number[][] = [
    [5,3,4,6,7,8,9,1,2],
    [6,7,2,1,9,5,3,4,8],
    [1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],
    [4,2,6,8,5,3,7,9,1],
    [7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],
    [2,8,7,4,1,9,6,3,5],
    [3,4,5,2,8,6,1,7,9],
  ];

  const solution = base.map(r => [...r]);
  const puzzle = solution.map(r => [...r]);

  // Remove ~40 cells for an easy puzzle
  let removed = 0;
  const target = 38 + Math.floor(Math.random() * 5);
  while (removed < target) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removed++;
    }
  }

  return { puzzle, solution };
};

export const GameSudoku: React.FC = () => {
  const [{ puzzle, solution }, setGame] = useState(generatePuzzle);
  const [board, setBoard] = useState<number[][]>(() => puzzle.map(r => [...r]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);

  const fixed = useMemo(() => {
    const s = new Set<string>();
    puzzle.forEach((row, r) => row.forEach((v, c) => { if (v !== 0) s.add(`${r}-${c}`); }));
    return s;
  }, [puzzle]);

  const handleCellClick = (r: number, c: number) => {
    if (fixed.has(`${r}-${c}`) || won) return;
    setSelected([r, c]);
  };

  const handleNumberInput = (num: number) => {
    if (!selected || won) return;
    const [r, c] = selected;
    if (fixed.has(`${r}-${c}`)) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    // Check errors
    const newErrors = new Set<string>();
    if (num !== 0 && num !== solution[r][c]) {
      newErrors.add(`${r}-${c}`);
    }
    setErrors(newErrors);

    // Check win
    const isComplete = newBoard.every((row, ri) =>
      row.every((val, ci) => val === solution[ri][ci])
    );
    if (isComplete) setWon(true);
  };

  const reset = () => {
    const g = generatePuzzle();
    setGame(g);
    setBoard(g.puzzle.map(r => [...r]));
    setSelected(null);
    setErrors(new Set());
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[306px]">
        <h3 className="font-semibold text-foreground">Sudoku</h3>
        <button onClick={reset} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="New Game">
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Board */}
      <div className="grid grid-cols-9 border-2 border-foreground/30 rounded-lg overflow-hidden">
        {board.map((row, r) =>
          row.map((val, c) => {
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isFixed = fixed.has(`${r}-${c}`);
            const isError = errors.has(`${r}-${c}`);
            const highlight = selected && (selected[0] === r || selected[1] === c);

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={cn(
                  'w-[34px] h-[34px] text-sm font-medium flex items-center justify-center transition-colors',
                  'border-[0.5px] border-border/40',
                  c % 3 === 2 && c < 8 && 'border-r-2 border-r-foreground/20',
                  r % 3 === 2 && r < 8 && 'border-b-2 border-b-foreground/20',
                  isSelected ? 'bg-primary/20' : highlight ? 'bg-muted/60' : 'bg-card/50',
                  isFixed ? 'text-foreground font-bold' : 'text-primary',
                  isError && 'text-destructive bg-destructive/10',
                  !isFixed && !won && 'cursor-pointer hover:bg-primary/10'
                )}
                aria-label={`Row ${r + 1} Column ${c + 1}`}
              >
                {val > 0 ? val : ''}
              </button>
            );
          })
        )}
      </div>

      {/* Number pad */}
      <div className="flex gap-1.5 flex-wrap justify-center max-w-[306px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            onClick={() => handleNumberInput(n)}
            className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => handleNumberInput(0)}
          className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-destructive/20 text-muted-foreground text-xs transition-colors"
        >
          ✕
        </button>
      </div>

      {won && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-green-500 font-semibold"
        >
          <Check className="w-5 h-5" />
          Puzzle Solved!
        </motion.div>
      )}
    </div>
  );
};
