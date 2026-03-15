import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronLeft, ChevronRight, Shuffle, CheckCircle2, XCircle, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface FormulaSheet {
  id: string;
  title: string;
  content: string;
  category: string;
  is_favorite: boolean;
  subject_id: string | null;
}

interface FlashcardQuizProps {
  sheets: FormulaSheet[];
  getSubjectName: (id: string | null) => string;
  onClose: () => void;
}

const FlashcardQuiz: React.FC<FlashcardQuizProps> = ({ sheets, getSubjectName, onClose }) => {
  const [deck, setDeck] = useState<FormulaSheet[]>(() => [...sheets]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  const current = deck[currentIndex];
  const total = deck.length;
  const answered = Object.keys(results).length;
  const correctCount = Object.values(results).filter(r => r === 'correct').length;
  const wrongCount = Object.values(results).filter(r => r === 'wrong').length;

  const shuffleDeck = useCallback(() => {
    const shuffled = [...sheets].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
    setResults({});
    setQuizFinished(false);
  }, [sheets]);

  const handleFlip = () => setFlipped(prev => !prev);

  const markResult = (result: 'correct' | 'wrong') => {
    if (!current) return;
    setResults(prev => ({ ...prev, [current.id]: result }));
    goNext();
  };

  const goNext = () => {
    setFlipped(false);
    if (currentIndex < total - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      setTimeout(() => setQuizFinished(true), 200);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setResults({});
    setQuizFinished(false);
  };

  if (total === 0) {
    return (
      <GlassCard className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-4">No formula cards to quiz on!</p>
        <Button variant="outline" onClick={onClose}>Go Back</Button>
      </GlassCard>
    );
  }

  if (quizFinished) {
    const percentage = Math.round((correctCount / total) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto">
        <GlassCard className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <Trophy className={cn("w-20 h-20 mx-auto", percentage >= 70 ? "text-yellow-500" : "text-muted-foreground")} />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            <p className="text-muted-foreground mt-1">You reviewed {total} formula cards</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{correctCount}</p>
              <p className="text-xs text-muted-foreground">Knew It</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-2xl font-bold text-destructive">{wrongCount}</p>
              <p className="text-xs text-muted-foreground">Review Again</p>
            </div>
          </div>
          <Progress value={percentage} className="h-3" />
          <p className="text-sm text-muted-foreground">{percentage}% accuracy</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-1" /> Exit
            </Button>
            <Button onClick={restart}>
              <RotateCcw className="w-4 h-4 mr-1" /> Retry
            </Button>
            <Button variant="secondary" onClick={shuffleDeck}>
              <Shuffle className="w-4 h-4 mr-1" /> Shuffle & Retry
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4 mr-1" /> Exit Quiz
          </Button>
          <Badge variant="outline" className="text-xs">
            {currentIndex + 1} / {total}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">{correctCount} ✓</Badge>
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">{wrongCount} ✗</Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={shuffleDeck} title="Shuffle">
            <Shuffle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Progress value={((currentIndex + 1) / total) * 100} className="h-2" />

      {/* Flashcard */}
      <div className="perspective-1000" style={{ perspective: '1000px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + (flipped ? '-back' : '-front')}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="cursor-pointer"
            onClick={handleFlip}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <GlassCard className={cn(
              "min-h-[300px] flex flex-col items-center justify-center p-8 relative overflow-hidden select-none",
              flipped
                ? "bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"
                : "bg-gradient-to-br from-secondary/5 via-primary/5 to-accent/5"
            )}>
              {/* Decorative corner */}
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="text-xs bg-secondary/20 backdrop-blur-sm">
                  {flipped ? 'ANSWER' : 'QUESTION'}
                </Badge>
              </div>
              <div className="absolute bottom-3 left-3">
                <Badge variant="outline" className="text-xs">
                  {getSubjectName(current.subject_id)} · {current.category}
                </Badge>
              </div>

              {!flipped ? (
                <div className="text-center space-y-4">
                  <motion.h2
                    className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent"
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                  >
                    {current.title}
                  </motion.h2>
                  <p className="text-sm text-muted-foreground">Tap to reveal the formula</p>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground text-center mb-3">{current.title}</h3>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-center"
                    dangerouslySetInnerHTML={{ __html: current.content }}
                  />
                </div>
              )}

              {!flipped && (
                <motion.div
                  className="absolute bottom-3 right-3"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <RotateCcw className="w-4 h-4 text-muted-foreground/50" />
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIndex === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => markResult('wrong')}
          >
            <XCircle className="w-4 h-4 mr-1" /> Need Review
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
            onClick={() => markResult('correct')}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" /> Knew It
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={goNext} disabled={currentIndex >= total - 1}>
          Skip <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardQuiz;
