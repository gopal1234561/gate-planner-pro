import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GradientButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  disabled,
  type = 'button',
}) => {
  const baseStyles = "relative font-semibold rounded-xl transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-hero-gradient text-white shadow-lg hover:shadow-xl glow-primary",
    secondary: "bg-card border-2 border-primary/30 text-foreground hover:border-primary hover:bg-primary/10",
    outline: "bg-transparent border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: variant === 'primary' ? 1.05 : 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-hero-gradient animate-gradient opacity-80" />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
