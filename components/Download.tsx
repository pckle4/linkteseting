import React, { useState } from 'react';
import { ArrowLeft, Download, KeyRound, ShieldCheck, Smartphone, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../utils';

export const DownloadPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length > 0) {
      // Redirect to the hash which triggers the Receiver view in App.tsx
      window.location.hash = input.trim();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up px-4 pb-20">
      <Button onClick={onBack} variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-indigo-500 gap-2">
        <ArrowLeft size={20} /> Back to Home
      </Button>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-6 shadow-lg shadow-indigo-500/10">
            <Download size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          Receive <span className="text-indigo-600 dark:text-indigo-400">Files</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
           Enter the unique 6-character connection code provided by the sender to establish a secure P2P tunnel.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
         
         <form onSubmit={handleSubmit} className="relative z-10">
             <div className="mb-8">
                 <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Connection ID</label>
                 <div className={cn(
                     "relative group transition-all duration-300 transform",
                     isFocused ? "scale-[1.02]" : "scale-100"
                 )}>
                     <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                         <KeyRound className={cn("transition-colors duration-300", isFocused ? "text-indigo-500" : "text-slate-400")} size={24} />
                     </div>
                     <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="e.g. X7k9P2"
                        className="w-full pl-14 pr-4 py-6 bg-slate-50 dark:bg-slate-900 border-2 rounded-2xl text-2xl md:text-3xl font-mono font-bold tracking-widest text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none transition-all duration-300 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-950"
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                     />
                 </div>
                 {input.length > 0 && input.length < 6 && (
                     <div className="flex items-center gap-2 mt-3 text-amber-500 text-sm font-medium animate-fade-in pl-1">
                         <AlertCircle size={14} /> Code is typically 6 characters
                     </div>
                 )}
             </div>

             <Button 
                type="submit" 
                disabled={input.trim().length === 0} 
                className="w-full py-5 text-lg rounded-xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 group"
             >
                Connect to Peer <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </Button>
         </form>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <AlertCircle size={20} />
              </div>
              <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Case Sensitive</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Please enter the code exactly as it appears on the sender's screen. Capitalization matters (e.g., 'A' is different from 'a').
                  </p>
              </div>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck size={20} />
              </div>
              <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Secure Direct Link</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Entering the ID establishes a direct encrypted tunnel. No files are stored on any server.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};
