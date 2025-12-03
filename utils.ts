import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateShortId(): string {
  // Generate a random 6-character alphanumeric string
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`;
}

export function getFileTheme(fileName: string, fileType: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Images
  if (fileType.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg'].includes(ext)) {
    return {
      bg: "bg-purple-50 dark:bg-purple-900/10",
      border: "border-purple-100 dark:border-purple-900/30",
      accent: "text-purple-600 dark:text-purple-400",
      hover: "hover:border-purple-300 dark:hover:border-purple-700",
      progress: "bg-purple-500"
    };
  }
  // Video
  if (fileType.startsWith('video/') || ['mp4','webm','mov','avi','mkv'].includes(ext)) {
    return {
      bg: "bg-rose-50 dark:bg-rose-900/10",
      border: "border-rose-100 dark:border-rose-900/30",
      accent: "text-rose-600 dark:text-rose-400",
      hover: "hover:border-rose-300 dark:hover:border-rose-700",
      progress: "bg-rose-500"
    };
  }
  // Audio
  if (fileType.startsWith('audio/') || ['mp3','wav','ogg','m4a'].includes(ext)) {
    return {
      bg: "bg-amber-50 dark:bg-amber-900/10",
      border: "border-amber-100 dark:border-amber-900/30",
      accent: "text-amber-600 dark:text-amber-400",
      hover: "hover:border-amber-300 dark:hover:border-amber-700",
      progress: "bg-amber-500"
    };
  }
  // Code / Text
  if (['js','ts','jsx','tsx','html','css','json','py','java','c','cpp','rs','go'].includes(ext)) {
    return {
      bg: "bg-slate-100 dark:bg-slate-800",
      border: "border-slate-200 dark:border-slate-700",
      accent: "text-slate-600 dark:text-slate-300",
      hover: "hover:border-indigo-400 dark:hover:border-indigo-500",
      progress: "bg-slate-600"
    };
  }
  // Documents (PDF, Word, etc)
  if (['pdf','doc','docx','txt','rtf','odt'].includes(ext)) {
    return {
      bg: "bg-blue-50 dark:bg-blue-900/10",
      border: "border-blue-100 dark:border-blue-900/30",
      accent: "text-blue-600 dark:text-blue-400",
      hover: "hover:border-blue-300 dark:hover:border-blue-700",
      progress: "bg-blue-500"
    };
  }
  // Archives
  if (['zip','rar','7z','tar','gz'].includes(ext)) {
    return {
      bg: "bg-orange-50 dark:bg-orange-900/10",
      border: "border-orange-100 dark:border-orange-900/30",
      accent: "text-orange-600 dark:text-orange-400",
      hover: "hover:border-orange-300 dark:hover:border-orange-700",
      progress: "bg-orange-500"
    };
  }

  // Default
  return {
    bg: "bg-white dark:bg-slate-800",
    border: "border-slate-100 dark:border-slate-700",
    accent: "text-indigo-600 dark:text-indigo-400",
    hover: "hover:border-indigo-300 dark:hover:border-indigo-600",
    progress: "bg-indigo-600"
  };
}