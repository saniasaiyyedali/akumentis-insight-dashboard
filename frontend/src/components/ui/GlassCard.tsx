import { type ReactNode, type HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  gradient?: boolean;
}

export function GlassCard({ children, className = '', glow, gradient, ...props }: GlassCardProps) {
  return (
    <div
      className={`glass-card p-6 ${glow ? 'animate-glow' : ''} ${gradient ? 'gradient-border' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
