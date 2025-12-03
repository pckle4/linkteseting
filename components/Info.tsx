import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Cpu, Database, Network, Code, Layers, FileCode, 
  Zap, Activity, HardDrive, GitBranch, Terminal, Server, 
  Lock, Box, ArrowRight, MousePointerClick, FileJson, 
  ChevronRight, AlertTriangle, CheckCircle2, XCircle, 
  Workflow, Binary, RefreshCw, Layout, Smartphone, Globe,
  Shield, Key, Radio, Menu, X, Play, Pause, Timer,
  Wifi, Monitor, LockKeyhole, Split
} from 'lucide-react';
import { Button } from './Button';
import { cn } from '../utils';

// --- VISUALIZATION COMPONENTS ---

// 1. Interactive System Architecture Diagram
const ArchitectureDiagram = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setStep(s => (s + 1) % 4), 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 relative min-h-[350px] flex flex-col items-center justify-center group w-full overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03]" 
                style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
            />
            
            <div className="relative z-10 w-full overflow-x-auto pb-4 custom-scrollbar">
                {/* Fixed width container to ensure diagram integrity */}
                <div className="min-w-[500px] md:min-w-[600px] px-8 mx-auto pt-12">
                    {/* Nodes */}
                    <div className="flex justify-between items-end mb-12 relative">
                        {/* Peer A */}
                        <div className="flex flex-col items-center gap-4 z-20 w-24">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl bg-white dark:bg-slate-800", step === 0 ? "border-indigo-500 scale-110 shadow-indigo-500/20" : "border-slate-200 dark:border-slate-700")}>
                                <MonitorIcon className={step === 0 ? "text-indigo-500" : "text-slate-400"} />
                            </div>
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">Sender</div>
                        </div>

                        {/* Signaling Server (Top Center) */}
                        <div className="absolute left-1/2 -top-24 -translate-x-1/2 flex flex-col items-center gap-2 z-10 w-32">
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-500 bg-white dark:bg-slate-800", step === 1 ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-110" : "border-slate-200 dark:border-slate-700")}>
                                <Server size={20} className={step === 1 ? "text-amber-500" : "text-slate-400"} />
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">Broker</div>
                        </div>

                        {/* Peer B */}
                        <div className="flex flex-col items-center gap-4 z-20 w-24">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl bg-white dark:bg-slate-800", step === 2 ? "border-emerald-500 scale-110 shadow-emerald-500/20" : "border-slate-200 dark:border-slate-700")}>
                                <MonitorIcon className={step === 2 ? "text-emerald-500" : "text-slate-400"} />
                            </div>
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">Receiver</div>
                        </div>

                        {/* Signaling Lines */}
                        <svg className="absolute inset-0 w-full h-full -top-12 pointer-events-none overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                            <path 
                                d="M 50 30 Q 300 -80 300 -60" 
                                fill="none" 
                                stroke={step === 1 ? "#f59e0b" : "#cbd5e1"} 
                                strokeWidth="2" 
                                strokeDasharray="5,5"
                                className={cn("transition-colors duration-500", step === 1 && "animate-pulse")}
                            />
                            <path 
                                d="M 550 30 Q 300 -80 300 -60" 
                                fill="none" 
                                stroke={step === 1 ? "#f59e0b" : "#cbd5e1"} 
                                strokeWidth="2" 
                                strokeDasharray="5,5"
                                className={cn("transition-colors duration-500", step === 1 && "animate-pulse")}
                            />
                        </svg>
                    </div>

                    {/* Direct Connection Pipe */}
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden mt-8 shadow-inner mx-8">
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-opacity duration-500",
                            step === 3 ? "opacity-100 animate-shimmer" : "opacity-0"
                        )} />
                        {/* Data Packets */}
                        {step === 3 && (
                            <>
                                <div className="absolute top-1 left-0 w-2 h-2 rounded-full bg-white shadow animate-packet" />
                                <div className="absolute top-1 left-0 w-2 h-2 rounded-full bg-white shadow animate-packet" style={{ animationDelay: '0.5s' }} />
                                <div className="absolute top-1 left-0 w-2 h-2 rounded-full bg-white shadow animate-packet" style={{ animationDelay: '1s' }} />
                            </>
                        )}
                    </div>
                </div>
                
                <div className="text-center mt-6 w-full px-4 min-w-[300px]">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        {step === 0 && "Step 1: Init"}
                        {step === 1 && "Step 2: Signaling (SDP Exchange)"}
                        {step === 2 && "Step 3: ICE Candidate Check"}
                        {step === 3 && "Step 4: P2P Data Tunnel (Active)"}
                    </div>
                    <p className="text-sm text-slate-400">
                        {step === 0 && "Sender creates a specialized Offer."}
                        {step === 1 && "Metadata is swapped via WebSocket."}
                        {step === 2 && "Best network path is negotiated."}
                        {step === 3 && "Direct, encrypted binary stream."}
                    </p>
                </div>
            </div>
        </div>
    );
};

// 2. Handshake Sequence Diagram
const HandshakeSequence = () => {
    return (
        <div className="bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-800 text-white font-mono text-xs relative overflow-hidden group">
            <div className="overflow-x-auto custom-scrollbar pb-2">
                 <div className="min-w-[400px]">
                    <div className="flex justify-between mb-4 border-b border-slate-700 pb-2">
                        <span className="text-indigo-400 font-bold">HOST</span>
                        <span className="text-slate-500 font-bold">SIGNALING</span>
                        <span className="text-emerald-400 font-bold">PEER</span>
                    </div>
                    
                    <div className="space-y-4 relative">
                        {/* Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2" />
                        
                        <div className="flex justify-between items-center group">
                            <div className="w-1/3 text-right pr-4"><span className="bg-indigo-900/50 px-2 py-1 rounded text-indigo-300 border border-indigo-500/30">Connect</span></div>
                            <div className="w-1/3 text-center z-10"><div className="w-2 h-2 bg-slate-600 rounded-full mx-auto" /></div>
                            <div className="w-1/3 pl-4 opacity-50">...</div>
                        </div>

                        <div className="flex justify-between items-center group">
                            <div className="w-1/3 text-right pr-4 opacity-50">...</div>
                            <div className="w-1/3 text-center z-10"><div className="w-2 h-2 bg-slate-600 rounded-full mx-auto" /></div>
                            <div className="w-1/3 pl-4"><span className="bg-emerald-900/50 px-2 py-1 rounded text-emerald-300 border border-emerald-500/30">Connect</span></div>
                        </div>

                        <div className="flex justify-between items-center relative group">
                            <div className="absolute left-1/3 right-1/3 top-1/2 h-px bg-indigo-500/50" />
                            <div className="w-1/3 text-right pr-4"><span className="text-amber-400 font-bold">OFFER</span> &rarr;</div>
                            <div className="w-1/3 text-center z-10"><div className="w-3 h-3 bg-amber-500 rounded-full mx-auto animate-pulse" /></div>
                            <div className="w-1/3 pl-4 opacity-50">&rarr;</div>
                        </div>

                        <div className="flex justify-between items-center relative group">
                            <div className="absolute left-1/3 right-1/3 top-1/2 h-px bg-emerald-500/50" />
                            <div className="w-1/3 text-right pr-4 opacity-50">&larr;</div>
                            <div className="w-1/3 text-center z-10"><div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto animate-pulse" /></div>
                            <div className="w-1/3 pl-4">&larr; <span className="text-amber-400 font-bold">ANSWER</span></div>
                        </div>

                        <div className="flex justify-center py-4">
                            <span className="bg-slate-800 border border-slate-600 px-3 py-1 rounded-full text-xs font-bold text-slate-300">P2P ESTABLISHED</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// 3. Chunking Simulator
const ChunkingSimulator = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [chunks, setChunks] = useState<number[]>([]);
    const [buffer, setBuffer] = useState(0);
    const [transferred, setTransferred] = useState(0);
    const intervalRef = useRef<any>(null);

    const toggle = () => {
        if (isRunning) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
        } else {
            setIsRunning(true);
            intervalRef.current = setInterval(() => {
                setBuffer(b => {
                    // Backpressure Logic: If buffer > 80, don't add chunks, just drain
                    if (b > 80) return Math.max(0, b - 20);
                    setChunks(c => [...c.slice(-4), Math.random()]); 
                    setTransferred(t => t + 64);
                    return Math.min(100, b + 15);
                });
            }, 200);
        }
    };

    useEffect(() => {
        const drain = setInterval(() => { setBuffer(b => Math.max(0, b - 5)); }, 100);
        return () => { clearInterval(intervalRef.current); clearInterval(drain); };
    }, []);

    const getBufferColor = (val: number) => {
        if (val < 50) return "bg-emerald-500";
        if (val < 80) return "bg-amber-500";
        return "bg-red-500";
    };

    return (
        <div className="bg-slate-900 text-white rounded-3xl p-4 md:p-8 border border-slate-800 shadow-2xl group hover:border-slate-700 transition-colors w-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 shrink-0"><Cpu size={20} /></div>
                    <div className="min-w-0">
                        <h3 className="font-bold truncate">Chunking Engine</h3>
                        <div className="text-[10px] text-slate-400 font-mono truncate">MODE: {isRunning ? 'ACTIVE' : 'IDLE'}</div>
                    </div>
                </div>
                <button onClick={toggle} className="p-3 rounded-full bg-white text-slate-900 hover:bg-indigo-50 transition-colors transform active:scale-95 shrink-0">
                    {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Visualizer */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pb-4">
                        <div className="w-16 h-20 border-2 border-slate-700 rounded bg-slate-800 flex items-center justify-center relative shadow-inner shrink-0">
                            <FileCode className="text-slate-500" />
                            <div className="absolute -bottom-6 text-[10px] font-mono text-slate-500">SOURCE</div>
                        </div>
                        
                        {/* Stream Animation */}
                        <div className="flex-1 h-12 bg-slate-800/50 rounded-lg border border-slate-700/50 relative overflow-hidden flex items-center px-2 gap-2 shadow-inner min-w-[120px]">
                             {chunks.map((_, i) => (
                                 <div key={i} className="w-6 h-8 bg-indigo-500 rounded shadow-lg animate-slide-right shrink-0" />
                             ))}
                        </div>

                        <div className="w-16 h-20 border-2 border-slate-700 rounded bg-slate-800 flex flex-col justify-end relative overflow-hidden shadow-inner shrink-0">
                             <div 
                                className={cn("w-full transition-all duration-200 opacity-80", getBufferColor(buffer))}
                                style={{ height: `${buffer}%` }}
                             />
                             <div className="absolute inset-0 flex items-center justify-center font-bold text-xs mix-blend-difference z-10">{Math.round(buffer)}%</div>
                             <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-mono text-slate-500">BUFFER</div>
                        </div>
                    </div>
                </div>

                {/* Metrics */}
                <div className="bg-black/30 rounded-xl p-4 font-mono text-xs space-y-3 border border-white/5">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">STATUS:</span>
                        <span className={isRunning ? "text-emerald-400" : "text-amber-400"}>{isRunning ? "RUNNING" : "PAUSED"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">CHUNK_SIZE:</span>
                        <span className="text-indigo-400">64 KB</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">TRANSFERRED:</span>
                        <span className="text-white">{transferred} KB</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">BACKPRESSURE:</span>
                        <span className={buffer > 80 ? "text-red-500 font-bold animate-pulse" : "text-emerald-500"}>
                            {buffer > 80 ? "THROTTLING" : "NOMINAL"}
                        </span>
                    </div>
                </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
                <strong>How it works:</strong> The simulator yields execution when the simulated buffer exceeds 80%. In the real app, we check <code className="bg-slate-800 px-1 rounded text-indigo-300">conn.bufferedAmount</code> before reading the next slice.
            </p>
        </div>
    );
};

// --- API & DOCS COMPONENTS ---

const DocSection: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
    <section id={id} className="mb-16 scroll-mt-32">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight break-words">{title}</h2>
        </div>
        {children}
    </section>
);

const CodeBlock: React.FC<{ code: string; label?: string }> = ({ code, label }) => (
    <div className="my-6 rounded-xl overflow-hidden bg-[#0f172a] border border-slate-800 text-sm font-mono shadow-xl group hover:border-slate-700 transition-colors w-full max-w-[90vw] md:max-w-none">
        {label && (
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 text-xs text-slate-400 font-bold flex items-center gap-2">
                <FileCode size={12} /> {label}
            </div>
        )}
        <div className="p-4 overflow-x-auto text-slate-300 custom-scrollbar">
            <pre><code>{code}</code></pre>
        </div>
    </div>
);

const ApiRow: React.FC<{ name: string; type: string; desc: string }> = ({ name, type, desc }) => (
    <div className="flex flex-col md:grid md:grid-cols-[1fr,auto,2fr] gap-2 md:gap-4 p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
        <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 break-words md:break-normal">{name}</div>
        <div className="font-mono text-[10px] md:text-xs text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/10 px-2 py-0.5 rounded w-fit h-fit">{type}</div>
        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</div>
    </div>
);

const MonitorIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-6 h-6", className)}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
);

const InfographicCard: React.FC<{ icon: any; title: string; desc: string; color: string }> = ({ icon: Icon, title, desc, color }) => (
    <div className={cn("p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", color)}>
        <Icon className="mb-3" size={24} />
        <h4 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h4>
        <p className="text-sm opacity-90">{desc}</p>
    </div>
);

// --- MAIN PAGE ---

export const Info: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll Spy
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if(entry.isIntersecting) setActiveTab(entry.target.id); });
    }, { rootMargin: '-20% 0px -50% 0px' });
    document.querySelectorAll('section[id]').forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
  };

  const navItems = [
      { id: 'overview', label: 'Executive Summary', icon: Layout },
      { id: 'architecture', label: 'System Architecture', icon: Network },
      { id: 'chunking', label: 'Chunking Engine', icon: Split },
      { id: 'protocol', label: 'Signaling Protocol', icon: Radio },
      { id: 'components', label: 'Component API', icon: Code },
      { id: 'security', label: 'Security Model', icon: Shield },
      { id: 'troubleshooting', label: 'Failure Analysis', icon: AlertTriangle },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto animate-fade-in flex flex-col lg:flex-row min-h-screen items-start bg-slate-50 dark:bg-[#0B0F19]">
      
      {/* --- SIDEBAR NAVIGATION (Desktop) --- */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-28 self-start mb-8">
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm ml-6 flex flex-col">
             <div className="p-6">
                 <div className="flex items-center gap-2 font-black text-xl text-slate-900 dark:text-white tracking-tight mb-8">
                    <Terminal className="text-indigo-500" /> NW<span className="text-slate-400">Docs</span>
                 </div>

                 <nav className="space-y-1">
                     {navItems.map(item => (
                         <button
                            key={item.id}
                            onClick={() => scrollTo(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left group",
                                activeTab === item.id 
                                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/10" 
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                         >
                             <item.icon size={16} className={cn("transition-colors", activeTab === item.id ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                             {item.label}
                             {activeTab === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                         </button>
                     ))}
                 </nav>
             </div>

             <div className="p-6 mt-auto border-t border-slate-100 dark:border-slate-800">
                 <Button onClick={onBack} variant="ghost" className="w-full justify-start pl-2 gap-3 text-slate-500 hover:text-indigo-600">
                     <ArrowLeft size={18} /> Return to App
                 </Button>
             </div>
         </div>
      </aside>

      {/* --- MOBILE DRAWER --- */}
      <div className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setMobileMenuOpen(false)} />
      
      <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 lg:hidden flex flex-col",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <span className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><Terminal className="text-indigo-500" size={20} /> Docs</span>
             <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={20} /></button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
             {navItems.map(item => (
                 <button key={item.id} onClick={() => scrollTo(item.id)} className="w-full flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-left text-slate-700 dark:text-slate-300">
                     <item.icon size={18} className="text-slate-400" /> {item.label}
                 </button>
             ))}
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
             <Button onClick={onBack} variant="ghost" className="w-full justify-center gap-2 text-slate-600 dark:text-slate-400">
                 <ArrowLeft size={18} /> Back to App
             </Button>
          </div>
      </div>

      {/* --- MOBILE FAB --- */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button onClick={() => setMobileMenuOpen(true)} className="w-14 h-14 bg-indigo-600 rounded-full text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center active:scale-95 transition-transform hover:scale-105">
              <Menu size={24} />
          </button>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-12 overflow-x-hidden min-w-0">
          
          {/* 1. OVERVIEW */}
          <DocSection id="overview" title="Executive Summary">
              <div className="prose dark:prose-invert max-w-4xl text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p className="text-lg md:text-xl font-light text-slate-900 dark:text-white mb-6">
                      NW Share is a <span className="font-semibold text-indigo-500">serverless, transient file transfer system</span> designed to bypass cloud storage limitations. It utilizes the WebRTC Data Channel standard to establish ephemeral, encrypted peer-to-peer tunnels directly between client browsers.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                      <InfographicCard 
                        icon={Zap} title="Zero-Persistence" 
                        desc="Data streams directly from RAM to RAM. No database, no S3 buckets, no logs."
                        color="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      />
                      <InfographicCard 
                        icon={Binary} title="Unlimited Size" 
                        desc="By implementing a custom chunking algorithm, we bypass the browser's 2GB Blob limit."
                        color="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      />
                      <InfographicCard 
                        icon={Shield} title="Trustless" 
                        desc="End-to-End Encrypted via DTLS 1.2. The signaling server sees only opaque handshake packets."
                        color="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400"
                      />
                  </div>
              </div>
          </DocSection>

          {/* 2. ARCHITECTURE */}
          <DocSection id="architecture" title="System Architecture">
              <p className="mb-8 text-slate-600 dark:text-slate-400 max-w-3xl">
                  The system relies on a "Triangle Topology". The Broker (Signaling Server) is only used for the initial 300ms to exchange network candidates. Once the tunnel is established, the Broker is disconnected to ensure privacy.
              </p>
              <ArchitectureDiagram />
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors">
                      <div className="font-bold text-sm mb-1 text-slate-900 dark:text-white flex items-center gap-2"><Globe size={16} /> STUN Resolution</div>
                      <p className="text-xs text-slate-500">Google and Twilio STUN servers are used to resolve the public IP address of peers behind NAT.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors">
                      <div className="font-bold text-sm mb-1 text-slate-900 dark:text-white flex items-center gap-2"><Network size={16} /> ICE Restart</div>
                      <p className="text-xs text-slate-500">If the connection drops, the system automatically attempts an ICE restart using cached candidates.</p>
                  </div>
              </div>
          </DocSection>

          {/* 3. CHUNKING ENGINE */}
          <DocSection id="chunking" title="The Chunking Engine">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Memory Management Strategy</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                          Sending a 10GB file in one go crashes the browser tab. We solve this by treating files as readable streams. We implement a "Stop-and-Wait" protocol locally using the WebRTC <code className="text-indigo-500 font-mono">bufferedAmount</code> property.
                      </p>
                      <ul className="space-y-4 mb-8">
                          <li className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">01</div>
                              <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-sm">File Slicing</div>
                                  <div className="text-xs text-slate-500">Files are logically divided into 64KB chunks.</div>
                              </div>
                          </li>
                          <li className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">02</div>
                              <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-sm">Pressure Check</div>
                                  <div className="text-xs text-slate-500">Before reading disk, we check if the network buffer is full.</div>
                              </div>
                          </li>
                          <li className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">03</div>
                              <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-sm">Garbage Collection</div>
                                  <div className="text-xs text-slate-500">ArrayBuffers are detached immediately after sending to free RAM.</div>
                              </div>
                          </li>
                      </ul>
                      <CodeBlock 
                        label="peerService.ts (Optimized Loop)" 
                        code={`while (offset < totalSize) {
  // 1. Critical Backpressure Check
  if (conn.bufferedAmount > 16 * 1024 * 1024) {
    await waitForDrain(); // Yields execution
  }

  // 2. Read only 64KB into Memory
  const chunk = file.slice(offset, offset + 64000);
  const buffer = await chunk.arrayBuffer();
  
  // 3. Send & Forget
  conn.send(buffer);
  offset += buffer.byteLength;
}`} 
                      />
                  </div>
                  <div className="w-full overflow-hidden">
                       <ChunkingSimulator />
                  </div>
              </div>
          </DocSection>

          {/* 4. SIGNALING PROTOCOL */}
          <DocSection id="protocol" title="Signaling Protocol">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                 <div>
                     <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                         The handshake process involves exchanging "Offers" and "Answers" that contain Session Description Protocol (SDP) data. This allows two browsers to agree on codecs, encryption keys, and network addresses before a direct line exists.
                     </p>
                     <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 w-full overflow-hidden">
                         <h4 className="font-bold text-sm mb-4">Payload Structure</h4>
                         <CodeBlock 
                             label="JSON Message Format" 
                             code={`{
  "type": "OFFER",
  "payload": {
    "sdp": "v=0\\r\\no=... (Encrypted)",
    "type": "offer"
  },
  "src": "peer-A-uuid",
  "dst": "peer-B-uuid"
}`} 
                         />
                     </div>
                 </div>
                 <HandshakeSequence />
             </div>
          </DocSection>

          {/* 5. API REFERENCE */}
          <DocSection id="components" title="Component API Reference">
              <div className="space-y-12">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><Layout size={18} /> Sender.tsx</h3>
                          <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 px-2 py-1 rounded">Host Logic</span>
                      </div>
                      <div>
                          <div className="hidden md:grid md:grid-cols-[1fr,auto,2fr] gap-4 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                              <div>Internal Method</div>
                              <div>Type</div>
                              <div>Description</div>
                          </div>
                          <ApiRow name="startSession()" type="Async Promise" desc="Initializes PeerJS, requests wake lock, generates Short ID." />
                          <ApiRow name="transferFile()" type="Async Generator" desc="Main loop. Reads file blobs and pipes to DataConnection." />
                          <ApiRow name="enableKeepAlive()" type="Void" desc="Triggers hidden Audio element to prevent iOS Safari throttling." />
                          <ApiRow name="handleManifest()" type="Event Handler" desc="Sends JSON metadata (filename, size, type) to new peers." />
                      </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><Layout size={18} /> Receiver.tsx</h3>
                          <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 py-1 rounded">Client Logic</span>
                      </div>
                      <div>
                           <div className="hidden md:grid md:grid-cols-[1fr,auto,2fr] gap-4 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                              <div>Internal Method</div>
                              <div>Type</div>
                              <div>Description</div>
                          </div>
                          <ApiRow name="handleIncomingData()" type="Listener" desc="Demultiplexes JSON signaling messages vs ArrayBuffer binary chunks." />
                          <ApiRow name="finalizeCurrentFile()" type="Void" desc="Merges chunk array into single Blob, triggers download, clears RAM." />
                          <ApiRow name="verifyPassword()" type="Async" desc="Sends cryptographic hash to Host for session unlock." />
                      </div>
                  </div>
              </div>
          </DocSection>

          {/* 6. SECURITY MODEL */}
          <DocSection id="security" title="Security & Encryption">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                   <div className="bg-slate-800 text-white p-6 rounded-2xl border border-slate-700 hover:-translate-y-1 transition-transform duration-300">
                       <LockKeyhole className="text-emerald-400 mb-4" size={28} />
                       <h4 className="font-bold text-lg mb-2">DTLS 1.2</h4>
                       <p className="text-sm text-slate-400">All data in transit is encrypted using AES-128 via the Datagram Transport Layer Security protocol.</p>
                   </div>
                   <div className="bg-slate-800 text-white p-6 rounded-2xl border border-slate-700 hover:-translate-y-1 transition-transform duration-300">
                       <Key className="text-amber-400 mb-4" size={28} />
                       <h4 className="font-bold text-lg mb-2">Ephemeral Keys</h4>
                       <p className="text-sm text-slate-400">Encryption keys are generated on-device at session start and destroyed on tab close.</p>
                   </div>
                   <div className="bg-slate-800 text-white p-6 rounded-2xl border border-slate-700 hover:-translate-y-1 transition-transform duration-300">
                       <Shield className="text-indigo-400 mb-4" size={28} />
                       <h4 className="font-bold text-lg mb-2">SCTP Secure</h4>
                       <p className="text-sm text-slate-400">WebRTC Data Channels use SCTP over DTLS, ensuring ordered, reliable, secure delivery.</p>
                   </div>
              </div>
          </DocSection>

          {/* 7. FAILURE ANALYSIS */}
          <DocSection id="troubleshooting" title="Failure Analysis">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-6">Common Error Decision Tree</h4>
                  
                  <div className="space-y-8 relative">
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800" />
                      
                      {[
                        { id: "01", title: '"Connection Failed" Immediate', desc: "Symptom: Spinner stops after 1s.", check: "Firewall blocking UDP ports 1024-65535?", color: "red" },
                        { id: "02", title: 'Stalled at 99%', desc: "Symptom: Download bar freezes near end.", check: "Sender tab backgrounded on iOS?", color: "amber" },
                        { id: "03", title: '"ID Not Found"', desc: "Symptom: Receiver sees error immediately.", check: "Signaling Server WebSocket active?", color: "indigo" }
                      ].map((err) => (
                          <div key={err.id} className="relative pl-12 group">
                              <div className={cn(
                                  "absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border bg-white dark:bg-slate-900 z-10",
                                  `border-${err.color}-200 dark:border-${err.color}-900 text-${err.color}-600`
                              )}>{err.id}</div>
                              <h5 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-500 transition-colors">{err.title}</h5>
                              <p className="text-xs text-slate-500 mt-1">{err.desc}</p>
                              <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50">
                                  Check: {err.check}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </DocSection>

      </main>
    </div>
  );
};
