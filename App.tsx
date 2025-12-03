import React, { useState, useEffect, memo } from 'react';
import { Sender } from './components/Sender';
import { Receiver } from './components/Receiver';
import { Technology } from './components/Technology';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { Info } from './components/Info';
import { ToastContainer } from './components/Toast';
import { Sun, Moon, Clock, Cpu, Github, MessageCircle } from 'lucide-react';
import { cn } from './utils';

const FooterClock = memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex items-center gap-2 text-indigo-400">
      <Clock size={12} />
      <span className="tabular-nums">
          {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          <span className="mx-1">•</span>
          {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
});

type ViewState = 'home' | 'technology' | 'privacy' | 'terms' | 'info';

const App: React.FC = () => {
  const [hostId, setHostId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('home');
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'info'}>>([]);
  
  const [darkMode, setDarkMode] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('nw_theme') === 'dark' || 
               (!localStorage.getItem('nw_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
      return false;
    } catch { return false; }
  });

  useEffect(() => {
    const handleNavigation = () => {
        const hash = window.location.hash.substring(1);
        if (hash === 'technology') { setView('technology'); setHostId(null); window.scrollTo(0, 0); }
        else if (hash === 'privacy') { setView('privacy'); setHostId(null); window.scrollTo(0, 0); }
        else if (hash === 'terms') { setView('terms'); setHostId(null); window.scrollTo(0, 0); }
        else if (hash === 'info') { setView('info'); setHostId(null); window.scrollTo(0, 0); }
        else {
            setView('home');
            (!hash || hash === 'home') ? setHostId(null) : setHostId(hash);
            window.scrollTo(0, 0);
        }
    };
    handleNavigation();
    window.addEventListener('hashchange', handleNavigation);
    return () => window.removeEventListener('hashchange', handleNavigation);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nw_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nw_theme', 'light');
    }
  }, [darkMode]);

  const navigateHome = () => window.location.hash = '';

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const headerBtnClass = "p-2.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group transform-gpu active:scale-95 flex items-center justify-center";

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-white transition-colors duration-300 overflow-x-hidden font-sans selection:bg-indigo-500/30 flex flex-col">
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <div className="absolute inset-0 pointer-events-none" 
           style={{
             backgroundImage: `radial-gradient(${darkMode ? '#334155' : '#cbd5e1'} 1px, transparent 1px)`,
             backgroundSize: '24px 24px',
             opacity: 0.3
           }} 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50 dark:to-[#0B0F19] pointer-events-none" />

      <header className="fixed top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50 max-w-7xl mx-auto w-full backdrop-blur-md bg-slate-50/70 dark:bg-[#0B0F19]/70 md:bg-transparent md:backdrop-blur-none transition-all duration-300">
        <div className="flex items-center gap-3 cursor-pointer group transform-gpu" onClick={navigateHome}>
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300 rounded-full" />
            <div className="relative w-11 h-11 bg-gradient-to-br from-slate-800 to-black dark:from-indigo-600 dark:to-violet-700 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/10 transition-all duration-300 group-hover:rotate-6 group-hover:scale-105 border border-white/10 overflow-hidden transform-gpu">
              <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white relative z-10" preserveAspectRatio="xMidYMid meet">
                <path d="M20 20 L20 80 L35 80 L35 45 L65 80 L80 80 L80 20 L65 20 L65 55 L35 20 Z" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">NW Share</span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase mt-1 group-hover:text-indigo-500/70 transition-colors duration-300">Direct P2P</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <a href="https://github.com/nowhile" target="_blank" rel="noopener noreferrer" className={headerBtnClass} title="Star on GitHub">
                <Github size={18} />
            </a>
             <a href="mailto:feedback@nowhile.com" className={headerBtnClass} title="Send Feedback">
                <MessageCircle size={18} />
            </a>
            <button
            onClick={() => setDarkMode(!darkMode)}
            className={headerBtnClass}
            >
            {darkMode ? <Sun size={18} className="text-amber-400 group-hover:rotate-90 transition-transform duration-500 ease-out" /> : <Moon size={18} className="text-slate-600 group-hover:-rotate-12 transition-transform duration-500 ease-out" />}
            </button>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col items-center pt-24 md:pt-36 p-4 z-10 w-full max-w-7xl mx-auto min-h-[600px]">
         {view === 'technology' && <Technology onBack={navigateHome} />}
         {view === 'privacy' && <PrivacyPolicy onBack={navigateHome} />}
         {view === 'terms' && <TermsOfService onBack={navigateHome} />}
         {view === 'info' && <Info onBack={navigateHome} />}
         {view === 'home' && (hostId ? <Receiver hostId={hostId} /> : <Sender onToast={addToast} />)}
      </main>
      
      <footer className="py-8 text-center z-10 mt-auto px-4 w-full">
         <div className="flex flex-col items-center gap-6">
             <div className="max-w-fit mx-auto bg-slate-900 text-slate-400 text-xs font-medium px-6 py-3 rounded-full flex flex-col md:flex-row items-center gap-3 md:gap-6 shadow-xl shadow-slate-900/10 border border-slate-800 backdrop-blur-md transform-gpu hover:scale-[1.01] transition-transform duration-300">
                 <div className="flex items-center gap-2">
                    <span>© 2025 Nowhile</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    <span>All rights reserved.</span>
                 </div>
                 <div className="hidden md:block w-px h-3 bg-slate-700"></div>
                 <FooterClock />
             </div>
             
             <div className="flex items-center gap-4 text-[10px] font-medium tracking-widest uppercase flex-wrap justify-center">
                 <a href="#technology" className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-300 group">
                     <Cpu size={12} className="group-hover:rotate-90 transition-transform duration-300" /> Technology Explained
                 </a>
                 <span className="text-slate-300 dark:text-slate-700">•</span>
                 <a href="#privacy" className="text-slate-500 hover:text-indigo-500 transition-colors">Privacy Policy</a>
                 <span className="text-slate-300 dark:text-slate-700">•</span>
                 <a href="#terms" className="text-slate-500 hover:text-indigo-500 transition-colors">Terms of Service</a>
             </div>

             <a href="https://nowhile.com" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold tracking-widest uppercase text-slate-400/60 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300 cursor-pointer">
                 Made with ❤️ by nowhile.com
             </a>
         </div>
      </footer>
    </div>
  );
};

export default App;