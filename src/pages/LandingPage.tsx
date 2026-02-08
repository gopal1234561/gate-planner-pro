import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  CheckCircle, 
  BookOpen, 
  Calendar, 
  Target, 
  Clock,
  BarChart3,
  Bell,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { GradientButton } from '@/components/ui/GradientButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Custom Subjects', description: 'Add your own subjects & topics' },
  { icon: CheckCircle, title: 'Task Scheduler', description: 'Plan your daily study tasks' },
  { icon: Calendar, title: 'Smart Calendar', description: 'Visualize your schedule' },
  { icon: Clock, title: 'Focus Timer', description: 'Pomodoro technique built-in' },
  { icon: BarChart3, title: 'Study Analytics', description: 'Track your progress' },
  { icon: Target, title: 'Mock Tests', description: 'Record and analyze scores' },
  { icon: Bell, title: 'Reminders', description: 'Never miss a session' },
  { icon: Zap, title: 'Productivity Score', description: 'Measure your efficiency' },
];

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">MyScheduler</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <Link to="/login">
              <GradientButton variant="secondary" size="sm">Login</GradientButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/20 blur-[120px] animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-secondary/10 blur-[150px]" />
        </div>

        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Smart Study Planning for GATE 2027</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">MyScheduler</span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-muted-foreground mb-4">
              Master Your Time. <span className="text-foreground font-semibold">Crack GATE 2027.</span>
            </p>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              The ultimate productivity system designed specifically for GATE aspirants. 
              Create subjects, schedule tasks, track progress, and achieve your dreams.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/register">
                <GradientButton size="lg">
                  <span className="flex items-center gap-2">
                    Start Planning <ArrowRight className="w-5 h-5" />
                  </span>
                </GradientButton>
              </Link>
              <Link to="/login">
                <GradientButton variant="secondary" size="lg">
                  Login to Dashboard
                </GradientButton>
              </Link>
            </div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider">Time Until GATE 2027</p>
              <CountdownTimer />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to maximize your study efficiency and help you crack GATE
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <GlassCard key={feature.title} delay={index * 0.1}>
                <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <GlassCard className="text-center py-16" hover={false}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your <span className="gradient-text">GATE Journey</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of aspirants who are using MyScheduler to organize their preparation
              </p>
              <Link to="/register">
                <GradientButton size="lg">
                  <span className="flex items-center gap-2">
                    Get Started Free <ArrowRight className="w-5 h-5" />
                  </span>
                </GradientButton>
              </Link>
            </motion.div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            MyScheduler © 2026 – Built by <span className="font-semibold text-foreground">Vislavath Gopal</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
