import React from 'react';
import { FileText, Image, Music, Video, Box, Code, File, Layout, Database, Terminal } from 'lucide-react';
import { cn } from '../utils';

interface FileIconProps {
  fileName: string;
  fileType: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ fileName, fileType, className }) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  let colorClass = "text-indigo-500 dark:text-indigo-400";
  let bgClass = "bg-indigo-50 dark:bg-indigo-900/20";
  let Icon = File;

  // Image
  if (fileType.startsWith('image/')) {
    colorClass = "text-blue-500 dark:text-blue-400";
    bgClass = "bg-blue-50 dark:bg-blue-900/20";
    Icon = Image;
  } 
  // Video
  else if (fileType.startsWith('video/')) {
    colorClass = "text-pink-500 dark:text-pink-400";
    bgClass = "bg-pink-50 dark:bg-pink-900/20";
    Icon = Video;
  } 
  // Audio
  else if (fileType.startsWith('audio/')) {
    colorClass = "text-amber-500 dark:text-amber-400";
    bgClass = "bg-amber-50 dark:bg-amber-900/20";
    Icon = Music;
  } 
  // Specific Extensions
  else {
    switch(ext) {
      case 'pdf':
        colorClass = "text-red-500 dark:text-red-400";
        bgClass = "bg-red-50 dark:bg-red-900/20";
        Icon = FileText;
        break;
      case 'doc': case 'docx': case 'txt': case 'rtf':
        colorClass = "text-cyan-600 dark:text-cyan-400";
        bgClass = "bg-cyan-50 dark:bg-cyan-900/20";
        Icon = FileText;
        break;
      case 'xls': case 'xlsx': case 'csv':
        colorClass = "text-emerald-600 dark:text-emerald-400";
        bgClass = "bg-emerald-50 dark:bg-emerald-900/20";
        Icon = Layout;
        break;
      case 'zip': case 'rar': case '7z': case 'tar': case 'gz':
        colorClass = "text-orange-500 dark:text-orange-400";
        bgClass = "bg-orange-50 dark:bg-orange-900/20";
        Icon = Box;
        break;
      case 'js': case 'ts': case 'jsx': case 'tsx': case 'html': case 'css': case 'json':
        colorClass = "text-yellow-500 dark:text-yellow-400";
        bgClass = "bg-yellow-50 dark:bg-yellow-900/20";
        Icon = Code;
        break;
      case 'py': case 'java': case 'c': case 'cpp': case 'go': case 'rs':
        colorClass = "text-slate-600 dark:text-slate-300";
        bgClass = "bg-slate-100 dark:bg-slate-800";
        Icon = Terminal;
        break;
      case 'sql': case 'db':
        colorClass = "text-violet-500 dark:text-violet-400";
        bgClass = "bg-violet-50 dark:bg-violet-900/20";
        Icon = Database;
        break;
      default:
        Icon = File;
    }
  }

  return (
    <div className={cn(colorClass, className)}>
      <Icon className="w-full h-full" />
    </div>
  );
};