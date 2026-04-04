import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Quote } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

const quotes = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Hardships often prepare ordinary people for an extraordinary destiny.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
  "Dream bigger. Do bigger.",
  "You don't have to be great to start, but you have to start to be great.",
  "It always seems impossible until it's done.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Work hard in silence. Let success make the noise.",
  "Doubt kills more dreams than failure ever will.",
  "If it doesn't challenge you, it won't change you.",
  "Stay focused and never give up.",
  "Discipline is the bridge between goals and accomplishment.",
  "Consistency is the key to mastery.",
  "Your only limit is you.",
  "Fall seven times, stand up eight.",
  "A year from now, you'll wish you had started today.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Strive for progress, not perfection.",
  "What you get by achieving your goals is not as important as what you become.",
  "The expert in anything was once a beginner.",
  "You are never too old to set another goal or to dream a new dream.",
  "Difficult roads often lead to beautiful destinations.",
  "Champions keep playing until they get it right.",
  "Strength doesn't come from what you can do. It comes from overcoming what you thought you couldn't.",
  "Every accomplishment starts with the decision to try.",
  "Winners are not people who never fail, but people who never quit.",
  "Stay hungry, stay foolish.",
  "Education is the most powerful weapon which you can use to change the world.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Your time is limited, don't waste it living someone else's life.",
  "Be so good they can't ignore you.",
  "Hustle until you no longer need to introduce yourself.",
  "Action is the foundational key to all success.",
  "Knowledge is power. Information is liberating.",
  "Quality is not an act, it is a habit.",
  "Persistence can change failure into extraordinary achievement.",
  "Success is walking from failure to failure with no loss of enthusiasm.",
  "Study hard, for the well is deep, and our brains are shallow.",
  "There are no shortcuts to any place worth going.",
  "Genius is 1% inspiration and 99% perspiration.",
  "You miss 100% of the shots you don't take.",
  "I find that the harder I work, the more luck I seem to have.",
  "Success usually comes to those who are too busy to be looking for it.",
  "If you really look closely, most overnight successes took a long time.",
  "The way to get started is to quit talking and begin doing.",
  "Don't be afraid to give up the good to go for the great.",
  "I find television very educational. Every time someone turns it on, I go into the other room and read a book.",
  "There is no elevator to success. You have to take the stairs.",
  "People who are crazy enough to think they can change the world are the ones who do.",
  "Failure is the condiment that gives success its flavor.",
  "We may encounter many defeats but we must not be defeated.",
  "Knowing is not enough; we must apply. Wishing is not enough; we must do.",
  "Whether you think you can or you think you can't, you're right.",
  "Creativity is intelligence having fun.",
  "The mind is everything. What you think you become.",
  "An investment in knowledge pays the best interest.",
  "The only person you are destined to become is the person you decide to be.",
  "Go confidently in the direction of your dreams.",
  "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
  "Today a reader, tomorrow a leader.",
  "Don't let what you cannot do interfere with what you can do.",
  "Start where you are. Use what you have. Do what you can.",
  "There is no substitute for hard work.",
  "Motivation is what gets you started. Habit is what keeps you going.",
  "Learning never exhausts the mind.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Excellence is not a skill. It is an attitude.",
  "You can if you think you can.",
  "Luck is what happens when preparation meets opportunity.",
  "I have not failed. I've just found 10,000 ways that won't work.",
  "Everything you've ever wanted is on the other side of fear.",
  "Success is not how high you have climbed, but how you make a positive difference to the world.",
  "Don't count the days. Make the days count.",
  "The only impossible journey is the one you never begin.",
  "Be the change you wish to see in the world.",
  "Small daily improvements over time lead to stunning results.",
  "You are braver than you believe, stronger than you seem, and smarter than you think.",
  "The only thing standing between you and your goal is the story you keep telling yourself.",
  "If you can dream it, you can do it.",
  "Energy and persistence conquer all things.",
  "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
  "Every strike brings me closer to the next home run.",
  "In the middle of every difficulty lies opportunity.",
];

export const MotivationalCard: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(() => {
    const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
    return hourSeed % quotes.length;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
      setQuoteIndex(hourSeed % quotes.length);
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard delay={0.3}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">💪 Daily Motivation</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm md:text-base font-medium italic leading-relaxed"
            >
              <Quote className="w-4 h-4 inline mr-1 text-primary opacity-50" />
              {quotes[quoteIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
};
