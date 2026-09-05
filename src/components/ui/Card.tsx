import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-900/80 border border-gray-800 rounded-2xl backdrop-blur-sm
        ${glow ? 'shadow-lg shadow-violet-500/10 border-violet-800/40' : ''}
        ${onClick ? 'cursor-pointer hover:border-violet-700/60 transition-colors' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 border-b border-gray-800 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-t border-gray-800 ${className}`}>{children}</div>;
}
