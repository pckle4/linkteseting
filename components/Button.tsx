import React from 'react';
import { cn } from '../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const variants = {
    primary: "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
  };

  return (
    <button
      className={cn(
        "flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};