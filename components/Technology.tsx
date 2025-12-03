import React, { useState, useEffect } from 'react';
import { 
  Shield, Zap, Globe, Cpu, Network, Radio, 
  Terminal, Box, ArrowRight, CheckCircle2, 
  Activity, Layers, ChevronDown, Split, 
  FileDigit, Monitor, FileCode, HardDrive, 
  Wifi, Binary, AlertTriangle, Server, Lock, FileJson,
  Code, Copy, Check
} from 'lucide-react';
import { Button } from './Button';
import { cn } from '../utils';

// --- Types & Interfaces ---

interface CodeBlockProps {
  title: string;
  code: string;
  highlights?: number[];
}

// --- Visual Utility Components ---

const SectionDivider: React.FC<{ label: string; icon: React.ElementType }> = ({ label, icon: Icon }) => (
  <div className="flex items-center gap-4 py-8 md:py-12 opacity-50 select-none">
      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent flex-1" />
      <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 whitespace-nowrap">
          <Icon size={14} /> {label}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent flex-1" />
  </div>
);

const Highlight: React.FC<{ children: React.ReactNode; color?: string; tooltip?: string }> = ({ children, color = "decoration-indigo-400", tooltip }) => (
  <span className="relative group cursor-help inline-block">
    <span className={cn("underline decoration-2 underline-offset-2 decoration-wavy font-bold text-slate-800 dark:text-slate-200 transition-all hover:decoration-4", color)}>
      {children}
    </span>
    {tooltip && (
      <span className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-50 font-medium shadow-xl">
        {tooltip}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></span>
      </span>
    )}
  </span>
);

const CodeBlock: React.FC<CodeBlockProps> = ({ title, code, highlights = [] }) => {
  const [copied, setCopied] = useState(false);
  
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0f172a] rounded-xl overflow-hidden shadow-2xl border border-slate-800 my-6 font-mono text-xs md:text-sm group relative mx-auto w-full max-w-[95vw] md:max-w-none transform transition-transform hover:scale-[1.01] duration-500">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e293b]/50 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
          </div>
          <span className="text-xs text-slate-400 font-medium truncate ml-2">{title}</span>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={copyCode}
                className="text-slate-500 hover:text-white transition-colors"
                title="Copy code"
            >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar bg-[#0f172a]">
        <pre className="leading-relaxed">
          <code>
            {code.split('\n').map((line, i) => (
              <div key={i} className={cn("table-row transition-colors duration-300", highlights.includes(i + 1) ? "bg-indigo-500/10 w-full block -mx-4 px-4 border-l-2 border-indigo-500" : "")}>
                <span className="table-cell select-none text-slate-600 text-right pr-4 w-8 md:w-10 border-r border-slate-800/50 mr-4 text-[10px] md:text-xs">{i + 1}</span>
                <span className={cn("table-cell pl-4 whitespace-pre", highlights.includes(i + 1) ? "text-indigo-100 font-bold" : "text-slate-300")}>{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};

// --- Interactive Demos ---

const ChunkingVisualizer = () => {
  const [activeChunk, setActiveChunk] = useState<number | null>(null);
  const [bufferLevel, setBufferLevel] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveChunk(prev => {
        if (bufferLevel > 80) { setIsPaused(true); return prev; } // Backpressure triggered
        setIsPaused(false);
        const next = (prev === null || prev > 4) ? 0 : prev + 1;
        setBufferLevel(lvl => Math.min(100, lvl + (Math.random() * 25)));
        return next;
      });
      setBufferLevel(lvl => Math.max(0, lvl - 10));
    }, 600);
    return () => clearInterval(interval);
  }, [bufferLevel]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
      <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 relative z-10 gap-4">
         <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Split size={20} />
            </div>
            <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Memory Stream Visualizer</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Live Simulation</p>
            </div>
         </div>
         <div className="flex items-center gap-2 text-xs font-mono self-end md:self-auto bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
             <span className={cn("w-2 h-2 rounded-full transition-colors duration-300", isPaused ? "bg-red-500 animate-pulse" : "bg-emerald-500")}></span>
             <span className={cn("transition-colors duration-300", isPaused ? "text-red-500" : "text-emerald-500")}>{isPaused ? "BACKPRESSURE" : "STREAMING"}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 items-center">
        {/* Source */}
        <div className="flex flex-col items-center gap-2 group/source">
            <div className="w-20 h-28 md:w-24 md:h-32 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center relative shadow-sm group-hover/source:scale-105 transition-transform duration-300">
               <FileDigit className="text-slate-400 mb-2" size={32} />
               <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Large File</div>
               <div className="text-[10px] text-slate-400">10.0 GB</div>
               <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/50 blur-[2px] animate-[slideUp_2s_ease-in-out_infinite]" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Disk Source</div>
        </div>

        {/* Processing Pipe */}
        <div className="flex-1 w-full md:w-auto h-12 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 relative overflow-hidden flex items-center px-2 shadow-inner">
            {[0, 1, 2, 3, 4].map((i) => (
                <div 
                    key={i}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-bold text-white transition-all duration-500 absolute shadow-sm",
                        activeChunk === i ? "opacity-100 translate-x-[200px] scale-100 bg-indigo-500" : "opacity-0 translate-x-0 scale-50 bg-slate-300"
                    )}
                    style={{ left: `${i * 15}%` }}
                >
                    64KB
                </div>
            ))}
        </div>

        {/* Network Buffer */}
        <div className="flex flex-col items-center gap-2 group/buffer">
            <div className="w-20 h-28 md:w-24 md:h-32 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-end p-2 relative shadow-sm overflow-hidden group-hover/buffer:scale-105 transition-transform duration-300">
                <div 
                    className={cn("w-full transition-all duration-300 rounded", bufferLevel > 80 ? "bg-red-500/80" : "bg-emerald-500/80")}
                    style={{ height: `${bufferLevel}%` }}
                ></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '100% 20%' }}></div>
                <div className="absolute top-2 left-0 right-0 text-center text-[10px] font-bold text-slate-500 mix-blend-difference">BUFFER</div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Network Socket</div>
        </div>
      </div>
    </div>
  );
};

const ProtocolVisualizer = () => {
    const [step, setStep] = useState(1);
    
    return (
        <div className="bg-slate-900 rounded-2xl p-4 md:p-8 text-white relative overflow-hidden border border-slate-800 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
                {[
                    { id: 1, label: "Signaling", sub: "SDP Exchange", icon: Globe, color: "indigo" },
                    { id: 2, label: "ICE Routes", sub: "STUN Discovery", icon: Wifi, color: "pink" },
                    { id: 3, label: "Secure P2P", sub: "DTLS Tunnel", icon: Lock, color: "emerald" }
                ].map((s) => (
                    <button 
                        key={s.id}
                        onClick={() => setStep(s.id)}
                        className={cn(
                            "p-4 rounded-xl border text-left transition-all duration-300 transform active:scale-95",
                            step === s.id 
                                ? `bg-${s.color}-600 border-${s.color}-500 shadow-lg shadow-${s.color}-900/50 scale-105` 
                                : "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                        )}
                    >
                        <div className="font-bold mb-1 flex items-center gap-2 text-sm md:text-base"><s.icon size={16} /> {s.id}. {s.label}</div>
                        <div className="text-xs text-slate-300 opacity-80">{s.sub}</div>
                    </button>
                ))}
            </div>

            <div className="bg-black/30 rounded-xl p-4 md:p-6 min-h-[160px] flex items-center justify-center relative border border-white/5 transition-all duration-500 overflow-hidden">
                {step === 1 && (
                    <div className="flex items-center justify-between w-full max-w-lg gap-2 md:gap-8 animate-fade-in overflow-x-auto">
                        <div className="text-center shrink-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2"><Monitor size={18} /></div>
                            <div className="text-[10px] md:text-xs font-bold">Peer A</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center min-w-[120px]">
                             <div className="text-[8px] md:text-[10px] text-indigo-400 mb-1 font-mono truncate animate-pulse">Offer (SDP)</div>
                             <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent relative">
                                 <div className="absolute -top-1 left-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                             </div>
                             <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-900/50 rounded-lg flex items-center justify-center mt-2 border border-indigo-500/30 shrink-0 transform hover:scale-110 transition-transform">
                                 <Server size={18} className="text-indigo-400" />
                             </div>
                             <div className="text-[8px] text-slate-500 mt-1">Signaling Server</div>
                             <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent relative mt-2">
                                 <div className="absolute -top-1 left-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-ping delay-75" />
                             </div>
                             <div className="text-[8px] md:text-[10px] text-indigo-400 mt-1 font-mono truncate animate-pulse">Answer (SDP)</div>
                        </div>
                        <div className="text-center shrink-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2"><Monitor size={18} /></div>
                            <div className="text-[10px] md:text-xs font-bold">Peer B</div>
                        </div>
                    </div>
                )}
                
                {step === 2 && (
                    <div className="flex flex-col md:flex-row items-center justify-around w-full animate-fade-in gap-6 md:gap-0">
                        <div className="text-center relative">
                            <div className="absolute -inset-4 bg-pink-500/20 blur-xl rounded-full animate-pulse" />
                            <div className="w-12 h-12 bg-pink-900 rounded-full flex items-center justify-center relative border border-pink-500 mx-auto"><Wifi size={20} /></div>
                            <div className="text-xs mt-2 text-pink-300">Candidate A</div>
                        </div>
                        <div className="flex md:flex-col gap-2 rotate-90 md:rotate-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-600" />
                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-slate-600" />
                            </div>
                        </div>
                        <div className="text-center relative">
                            <div className="absolute -inset-4 bg-pink-500/20 blur-xl rounded-full animate-pulse delay-75" />
                            <div className="w-12 h-12 bg-pink-900 rounded-full flex items-center justify-center relative border border-pink-500 mx-auto"><Wifi size={20} /></div>
                            <div className="text-xs mt-2 text-pink-300">Candidate B</div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                     <div className="flex items-center gap-4 md:gap-8 animate-fade-in w-full justify-center">
                         <div className="flex-1 h-2 bg-slate-800 rounded-full relative overflow-hidden max-w-[80px] md:max-w-xs shadow-inner">
                             <div className="absolute inset-0 bg-emerald-500 animate-[drawLine_2s_ease-in-out_infinite]" />
                         </div>
                         <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-900/50 rounded-full border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] shrink-0 animate-pulse">
                             <Lock size={20} className="text-emerald-400" />
                         </div>
                         <div className="flex-1 h-2 bg-slate-800 rounded-full relative overflow-hidden max-w-[80px] md:max-w-xs shadow-inner">
                             <div className="absolute inset-0 bg-emerald-500 animate-[drawLine_2s_ease-in-out_infinite] delay-100" />
                         </div>
                     </div>
                )}
            </div>
        </div>
    );
};

// --- Expandable Component ---

const AccordionItem: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; icon: React.ElementType, defaultOpen?: boolean }> = ({ title, subtitle, children, icon: Icon, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn(
        "group bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-300 overflow-hidden",
        isOpen ? "border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/20" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600 hover:shadow-lg"
    )}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 md:p-6 text-left focus:outline-none">
        <div className="flex items-center gap-4 md:gap-5">
            <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm border shrink-0", isOpen ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-slate-800")}>
                <Icon size={20} />
            </div>
            <div>
                <h3 className={cn("font-bold text-base md:text-lg transition-colors", isOpen ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400")}>{title}</h3>
                {subtitle && <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 md:line-clamp-none">{subtitle}</p>}
            </div>
        </div>
        <div className={cn("p-2 rounded-full transition-all duration-300 shrink-0 ml-2", isOpen ? "bg-indigo-100 dark:bg-indigo-900/30 rotate-180" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700")}>
            <ChevronDown size={18} className={cn(isOpen ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
        </div>
      </button>
      
      <div className={cn("transition-all duration-500 ease-in-out px-4 md:px-20 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/50", isOpen ? "max-h-[2000px] py-6 md:py-8 opacity-100" : "max-h-0 py-0 opacity-0")}>
         {children}
      </div>
    </div>
  );
};

// --- Main Page Component ---

export const Technology: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-20 px-4 md:px-8 relative selection:bg-indigo-500/30 overflow-hidden md:overflow-visible">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute top-0 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-indigo-500/10 rounded-full blur-[64px] md:blur-[128px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-32 h-32 md:w-64 md:h-64 bg-purple-500/10 rounded-full blur-[48px] md:blur-[96px] animate-float-delayed" />
      </div>

      {/* 1. Hero Section */}
      <div className="relative z-10 text-center mb-16 md:mb-24 pt-4 md:pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 md:mb-8 border border-slate-700 shadow-2xl hover:scale-105 transition-transform cursor-default select-none">
            <Terminal size={12} className="text-emerald-400 dark:text-indigo-600" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-indigo-600 dark:to-violet-600">Engineering Overview</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 md:mb-8 tracking-tight leading-[1.1] animate-slide-up">
          Architecture of the <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 decoration-clone">Ephemeral Web</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base md:text-xl max-w-3xl mx-auto leading-relaxed px-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
           NW Share allows for unlimited file sizes by bypassing the cloud entirely. We utilize ephemeral <Highlight tooltip="A real-time communication standard for the web">WebRTC Data Channels</Highlight> and intelligent binary streaming to connect browsers directly.
        </p>

        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-8 md:mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
             {['Zero Persistence', 'End-to-End Encrypted', 'SCTP Transport', 'Serverless'].map((tag) => (
                 <div key={tag} className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:scale-105 transition-transform duration-200 cursor-default">
                     <CheckCircle2 size={12} className="text-emerald-500" /> {tag}
                 </div>
             ))}
        </div>
      </div>

      {/* 2. The Core Challenge Section */}
      <div className="relative z-10 mb-16 md:mb-24">
          <SectionDivider label="The Challenge" icon={AlertTriangle} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
             <div className="order-2 lg:order-1 space-y-4 md:space-y-6">
                 <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Why Browsers Crash on Large Files</h2>
                 <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base md:text-lg">
                     Traditionally, web applications try to read a file into memory (RAM) before uploading it. This works for images, but if you try to read a 10GB video file into JavaScript's heap memory, the browser tab will crash instantly due to the <Highlight tooltip="Usually around 2GB-4GB per tab">V8 Engine Memory Limit</Highlight>.
                 </p>
                 <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 md:p-6 rounded-r-xl">
                     <h3 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2 text-sm md:text-base"><Monitor size={18} /> The "Out of Memory" Problem</h3>
                     <p className="text-xs md:text-sm text-red-600/80 dark:text-red-400/80">
                         Trying to <code className="bg-white dark:bg-black/20 px-1 rounded">file.arrayBuffer()</code> a massive file will force the OS to swap memory, freeze the UI, and eventually kill the process.
                     </p>
                 </div>
             </div>
             <div className="order-1 lg:order-2 bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 group cursor-default">
                 <div className="font-mono text-xs md:text-sm text-slate-300 overflow-x-auto custom-scrollbar pb-2">
                     <div className="min-w-[300px]">
                        <div className="flex gap-2 mb-4 opacity-50"><span className="text-blue-400">const</span> file = <span className="text-yellow-400">new</span> File(["..."], "huge.mp4");</div>
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-red-500/50"></div>
                            <span className="text-slate-500">// ❌ BAD: Loads 10GB into RAM</span><br/>
                            <span className="text-purple-400">await</span> file.arrayBuffer(); 
                        </div>
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-[10px] md:text-xs group-hover:bg-red-500/20 transition-colors">
                            Uncaught RangeError: Array buffer allocation failed<br/>
                            at File.arrayBuffer (native)
                        </div>
                     </div>
                 </div>
             </div>
          </div>
      </div>

      {/* 3. The Solution Section */}
      <div className="relative z-10 mb-20 md:mb-32">
          <SectionDivider label="Our Solution" icon={Cpu} />
          
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 md:mb-6">Smart Binary Chunking</h2>
              <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
                  We treat the file as a stream, not a block. Using the File API's <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-500">.slice()</code> method, we read only tiny 64KB chunks at a time.
              </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
              <div className="lg:col-span-7">
                  <ChunkingVisualizer />
              </div>
              <div className="lg:col-span-5 flex flex-col justify-center">
                  <div className="space-y-6">
                      {[
                        { id: 1, title: "Slice Pointer", desc: "We create a view into the file on disk without loading it." },
                        { id: 2, title: "Backpressure Check", desc: "We check bufferedAmount. If full, we yield the CPU." },
                        { id: 3, title: "Visualizer Sync", desc: "The demo on the left simulates this live." }
                      ].map((item) => (
                          <div key={item.id} className="flex items-start gap-4 group">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold shrink-0 text-sm md:text-base group-hover:scale-110 transition-transform">{item.id}</div>
                              <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">{item.title}</h4>
                                  <p className="text-xs md:text-sm text-slate-500 mt-1">{item.desc}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          <CodeBlock 
            title="services/peerService.ts (Core Transfer Loop)"
            highlights={[3, 4, 9, 10]}
            code={`// The Main Loop that prevents crashes
while (offset < totalSize) {
  // 1. BACKPRESSURE: Check if network card is overwhelmed
  if (conn.dataChannel.bufferedAmount > 16 * 1024 * 1024) {
      // Pause loop until buffer drains to < 1MB
      await this.waitForBufferDrain(); 
  }

  // 2. MEMORY SAFE: Only read 64KB into RAM
  const chunk = file.slice(offset, offset + CHUNK_SIZE);
  const buffer = await chunk.arrayBuffer();

  // 3. SEND: Push to WebRTC Data Channel
  conn.send(buffer);
  
  offset += buffer.byteLength;
  updateProgress(offset);
}`}
          />
      </div>

      {/* 4. Deep Dive Accordions */}
      <div className="relative z-10 mb-20 md:mb-24 max-w-4xl mx-auto">
          <SectionDivider label="Technical Deep Dive" icon={Layers} />
          
          <div className="space-y-4">
            <AccordionItem 
                title="The Signaling Protocol" 
                subtitle="How peers find each other without a database"
                icon={Radio}
                defaultOpen={true}
            >
                <div className="space-y-6">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                        Before a peer-to-peer connection can be established, browsers need to exchange "handshake" data via a middleman (Signaling Server).
                    </p>
                    <ProtocolVisualizer />
                </div>
            </AccordionItem>

            <AccordionItem 
                title="NAT Traversal (STUN/TURN)" 
                subtitle="Connecting across firewalls and routers"
                icon={Globe}
            >
                <div className="space-y-6 text-slate-600 dark:text-slate-300 text-sm md:text-base">
                    <p>
                        Most devices don't have a public IP address. They sit behind a home router that performs NAT. We use STUN servers to discover public IPs.
                    </p>
                </div>
            </AccordionItem>

            <AccordionItem 
                title="Security & Encryption" 
                subtitle="AES-128, DTLS, and Zero-Knowledge"
                icon={Shield}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm md:text-base">
                        <p>Security in WebRTC is mandatory. Before data is sent, a DTLS handshake occurs.</p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500 text-xs md:text-sm">
                            <li><strong>Key Exchange:</strong> Ephemeral keys on device.</li>
                            <li><strong>Encryption:</strong> AES-128 GCM.</li>
                            <li><strong>Auth:</strong> Certificate fingerprints.</li>
                        </ul>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
                         <Lock size={48} className="text-emerald-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                         <div className="text-xl md:text-2xl font-bold text-white mb-1">End-to-End Encrypted</div>
                         <p className="text-slate-400 text-xs md:text-sm">Only you see the data.</p>
                    </div>
                </div>
            </AccordionItem>
          </div>
      </div>

      {/* 5. Tech Stack Grid */}
      <div className="relative z-10 mb-16">
        <SectionDivider label="Built With" icon={Code} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {[
                { name: "WebRTC", icon: Network, desc: "Real-time P2P Standard", color: "text-blue-500" },
                { name: "React 19", icon: Code, desc: "Component Library", color: "text-cyan-500" },
                { name: "PeerJS", icon: Radio, desc: "Signaling Abstraction", color: "text-indigo-500" },
                { name: "SCTP", icon: Binary, desc: "Transport Protocol", color: "text-orange-500" },
                { name: "Tailwind", icon: Layers, desc: "Utility-First CSS", color: "text-teal-500" },
                { name: "Lucide", icon: Box, desc: "Vector Iconography", color: "text-pink-500" },
                { name: "WakeLock", icon: Monitor, desc: "Screen Keep-Alive", color: "text-yellow-500" },
                { name: "File API", icon: HardDrive, desc: "Binary Blob Access", color: "text-emerald-500" },
            ].map((tech) => (
                <div key={tech.name} className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-2 md:mb-3">
                        <div className={cn("p-2 md:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800", tech.color)}>
                            <tech.icon size={16} className="md:w-5 md:h-5" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-base">{tech.name}</span>
                    </div>
                    <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">{tech.desc}</div>
                </div>
            ))}
        </div>
      </div>

      <div className="mt-12 md:mt-20 flex justify-center relative z-10">
          <Button onClick={onBack} className="px-8 md:px-12 py-4 md:py-5 text-sm md:text-base shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl w-full md:w-auto transition-transform hover:scale-105">
             <ArrowRight className="rotate-180 mr-2" /> Return to Application
          </Button>
      </div>
    </div>
  );
};
