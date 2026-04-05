import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Calendar,
  FileText,
  TrendingUp,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Timer,
  RefreshCw,
  Brain,
  StickyNote,
  HelpCircle,
  FlaskConical,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/CountdownTimer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Brain, label: 'AI Planner', path: '/ai-planner' },
  { icon: BookOpen, label: 'Subjects', path: '/subjects' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: RefreshCw, label: 'Revisions', path: '/revisions' },
  { icon: FileText, label: 'Mock Tests', path: '/mock-tests' },
  { icon: StickyNote, label: 'Notes', path: '/notes' },
  { icon: FlaskConical, label: 'Formulas', path: '/formulas' },
  { icon: AlertCircle, label: 'Mistakes', path: '/mistakes' },
  { icon: ClipboardList, label: 'Manual Tracker', path: '/manual-tracker' },
  { icon: TrendingUp, label: 'Progress', path: '/progress' },
  { icon: Timer, label: 'Focus Timer', path: '/focus-timer' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavItem = ({ icon: Icon, label, path }: typeof navItems[0]) => {
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
          isActive
            ? "bg-hero-gradient text-white shadow-lg"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="w-5 h-5" />
        <AnimatePresence>
          {(sidebarOpen || mobileMenuOpen) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-xl fixed h-screen z-40"
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                    <Timer className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-xl gradient-text">MyScheduler</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          {sidebarOpen && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 text-center">GATE 2027 Countdown</p>
              <CountdownTimer />
            </div>
          )}
          
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {sidebarOpen && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
            <Timer className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold gradient-text">MyScheduler</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="lg:hidden fixed right-0 top-16 bottom-0 w-72 bg-card border-l border-border z-50 p-4 overflow-y-auto"
            >
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <NavItem key={item.path} {...item} />
                ))}
              </nav>
              <div className="mt-6 pt-6 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-h-screen pt-16 lg:pt-0 transition-all duration-300",
          sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[80px]"
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
