import React, { useEffect, useRef, useState } from 'react';
import { peerService } from '../services/peerService';
import { Button } from './Button';
import { formatFileSize, formatDuration, formatSpeed, cn, getFileTheme } from '../utils';
import { Download, Check, Loader2, ShieldCheck, DownloadCloud, Lock, KeyRound, ArrowRight, RefreshCw, AlertCircle, Wifi, Database, Server, Smartphone, MessageSquare, Send, Bell, Activity } from 'lucide-react';
import { FileMeta, IncomingData, ProtocolMessage, ManifestPayload, TextMessage } from '../types';
import { FileIcon } from './FileIcon';

interface ReceiverProps { hostId: string; }
interface DownloadState { status: 'pending' | 'downloading' | 'completed' | 'failed'; progress: number; speed: number; timeRemaining: number; }

export const Receiver: React.FC<ReceiverProps> = ({ hostId }) => {
  // Connection states: 0=Init, 1=Lookup, 2=Handshake, 3=Connected
  const [connectionStep, setConnectionStep] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});
  const [locked, setLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // New Features
  const [textMessages, setTextMessages] = useState<TextMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const [isNudged, setIsNudged] = useState(false);
  
  const filesRef = useRef<FileMeta[]>([]);
  const currentFileIdRef = useRef<string | null>(null);
  const chunksRef = useRef<ArrayBuffer[]>([]);
  const receivedBytesRef = useRef(0);
  const expectedSizeRef = useRef(0);
  const lastTickBytesRef = useRef(0);
  const lastTickTimeRef = useRef(0);
  const hostConnectionIdRef = useRef<string | null>(null);
  const downloadQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, [textMessages]);

  useEffect(() => {
    let mounted = true;
    let connectionTimeout: any;
    let pingInterval: any;

    const handleManifest = (payload: ManifestPayload) => {
        if (!mounted) return;
        if (payload.locked) { setLocked(true); setConnectionStatus('connected'); return; }
        if (payload.files) {
            setFiles(payload.files);
            filesRef.current = payload.files;
            setDownloadStates(prev => {
                const next = { ...prev };
                payload.files!.forEach(f => { if (!next[f.id]) next[f.id] = { status: 'pending', progress: 0, speed: 0, timeRemaining: 0 }; });
                return next;
            });
            setConnectionStatus('connected');
            setLocked(false);
        }
    };

    const finalizeCurrentFile = () => {
        const fileId = currentFileIdRef.current;
        if (!fileId) return;
        const fileMeta = filesRef.current.find(f => f.id === fileId);
        if (!fileMeta) { setDownloadStates(prev => ({ ...prev, [fileId]: { ...prev[fileId], status: 'failed' } })); return; }
        try {
            const blob = new Blob(chunksRef.current, { type: fileMeta.type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = fileMeta.name;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setDownloadStates(prev => ({ ...prev, [fileId]: { ...prev[fileId], status: 'completed', progress: 100 } }));
        } catch (e) { setDownloadStates(prev => ({ ...prev, [fileId]: { ...prev[fileId], status: 'failed' } })); }
        chunksRef.current = []; receivedBytesRef.current = 0; expectedSizeRef.current = 0; currentFileIdRef.current = null;
        if (downloadQueueRef.current.length > 0) {
            const nextId = downloadQueueRef.current.shift();
            if (nextId) setTimeout(() => sendRequest(nextId), 200);
        } else { isProcessingQueueRef.current = false; }
    };

    const handleIncomingData = async (data: any) => {
        if (data instanceof ArrayBuffer || data instanceof Uint8Array || data instanceof Blob) {
            const buffer = data instanceof Blob ? await data.arrayBuffer() : (data instanceof Uint8Array ? data.buffer : data);
            if (currentFileIdRef.current) {
                 chunksRef.current.push(buffer);
                 receivedBytesRef.current += buffer.byteLength;
                 if (expectedSizeRef.current > 0 && receivedBytesRef.current >= expectedSizeRef.current) finalizeCurrentFile();
            }
            return;
        }
        const msg = data as ProtocolMessage;
        if (msg.type === 'MANIFEST') handleManifest(msg.payload);
        else if (msg.type === 'PASSWORD_CORRECT') { setVerifying(false); setLocked(false); setPasswordError(false); }
        else if (msg.type === 'PASSWORD_INCORRECT') { setVerifying(false); setPasswordError(true); }
        else if (msg.type === 'START_FILE') {
            const fileId = msg.payload.id;
            currentFileIdRef.current = fileId; expectedSizeRef.current = msg.payload.size; chunksRef.current = []; receivedBytesRef.current = 0; lastTickTimeRef.current = Date.now();
            setDownloadStates(prev => ({ ...prev, [fileId]: { ...prev[fileId], status: 'downloading', progress: 0 } }));
            if (msg.payload.size === 0) finalizeCurrentFile();
        }
        else if (msg.type === 'END_FILE') { if (currentFileIdRef.current === msg.payload.fileId) finalizeCurrentFile(); }
        else if (msg.type === 'TEXT') {
             setTextMessages(prev => [...prev, { id: Math.random().toString(36), text: msg.payload.text, sender: 'peer', timestamp: Date.now() }]);
        }
        else if (msg.type === 'PONG') {
            const rtt = Date.now() - msg.payload.ts;
            setLatency(rtt);
        }
        else if (msg.type === 'PING') {
             peerService.sendTo(hostConnectionIdRef.current!, { type: 'PONG', payload: msg.payload });
        }
        else if (msg.type === 'NUDGE') {
             setIsNudged(true);
             setTimeout(() => setIsNudged(false), 500);
             if ('vibrate' in navigator) navigator.vibrate(200);
        }
    };

    const onStatus = (s: any) => {
        if (!mounted) return;
        if (s.status === 'ready') setConnectionStep(1); // Peer ID ready
        else if (s.status === 'connected') { 
            if (s.connectionId) hostConnectionIdRef.current = s.connectionId; 
            clearTimeout(connectionTimeout); 
            setConnectionStep(3);
            // Start Ping Loop
            pingInterval = setInterval(() => {
                if (hostConnectionIdRef.current) {
                    peerService.sendTo(hostConnectionIdRef.current, { type: 'PING', payload: { ts: Date.now() } });
                }
            }, 2000);
        }
        else if (s.status === 'disconnected') { if (!hostConnectionIdRef.current || s.connectionId === hostConnectionIdRef.current) setConnectionStatus('disconnected'); }
    };

    const onError = (err: any) => {
        if (mounted) { 
            if (err.type === 'peer-unavailable' || err.message?.includes('Could not connect to peer')) setConnectionStatus('disconnected'); 
        }
    };

    const onData = (event: IncomingData) => {
        if (mounted) handleIncomingData(event.data);
    };

    const init = async () => {
        try {
            const peerIdToConnect = hostId.startsWith('nwshare-') ? hostId : `nwshare-${hostId}`;
            await peerService.initialize();
            
            // Simulate visual steps
            setTimeout(() => { if(mounted) setConnectionStep(1); }, 300);
            
            peerService.on('status', onStatus);
            peerService.on('error', onError);
            peerService.on('data', onData);
            
            // Connect
            setTimeout(() => {
                if(mounted) {
                    setConnectionStep(2);
                    peerService.connect(peerIdToConnect);
                }
            }, 800);

            connectionTimeout = setTimeout(() => { if (mounted && connectionStatus === 'connecting') setConnectionStatus('disconnected'); }, 15000);
        } catch (e) { if (mounted) setConnectionStatus('disconnected'); }
    };
    init();

    const statsInterval = setInterval(() => {
        const fileId = currentFileIdRef.current;
        if (!fileId) return;
        const fileMeta = filesRef.current.find(f => f.id === fileId);
        if (!fileMeta) return;
        const now = Date.now(), totalReceived = receivedBytesRef.current, totalSize = fileMeta.size;
        const pct = totalSize > 0 ? Math.min(100, (totalReceived / totalSize) * 100) : 0;
        const timeDiff = (now - lastTickTimeRef.current) / 1000;
        let speed = 0, timeRemaining = 0;
        if (timeDiff > 0.5) {
             const bytesDiff = totalReceived - lastTickBytesRef.current;
             speed = bytesDiff / timeDiff;
             timeRemaining = speed > 0 ? (totalSize - totalReceived) / speed : 0;
             lastTickBytesRef.current = totalReceived; lastTickTimeRef.current = now;
        }
        setDownloadStates(prev => ({ ...prev, [fileId]: { ...prev[fileId], progress: pct, speed: speed || prev[fileId]?.speed || 0, timeRemaining: timeRemaining || prev[fileId]?.timeRemaining || 0 } }));
    }, 200);

    return () => { 
        mounted = false; 
        clearInterval(statsInterval); 
        clearInterval(pingInterval);
        clearTimeout(connectionTimeout); 
        peerService.off('status', onStatus);
        peerService.off('error', onError);
        peerService.off('data', onData);
        peerService.destroy(); 
    };
  }, [hostId]);

  const sendRequest = (fileId: string) => {
      if (!hostConnectionIdRef.current) return;
      peerService.sendTo(hostConnectionIdRef.current, { type: 'REQUEST_FILE', payload: { fileId } });
  };
  const startDownload = (fileId: string) => {
      if (currentFileIdRef.current) {
          if (!downloadQueueRef.current.includes(fileId)) {
              downloadQueueRef.current.push(fileId);
              setDownloadStates(prev => ({ ...prev, [fileId]: { ...prev[fileId], status: 'pending' } }));
          }
          return;
      }
      sendRequest(fileId);
  };
  const downloadAll = () => {
      const pending = files.filter(f => downloadStates[f.id]?.status !== 'completed').map(f => f.id);
      if (pending.length === 0) return;
      downloadQueueRef.current = [...pending];
      isProcessingQueueRef.current = true;
      setDownloadStates(prev => {
          const next = {...prev};
          pending.forEach(id => { if (next[id]) next[id] = { ...next[id], status: 'pending' }; });
          return next;
      });
      if (!currentFileIdRef.current) {
          const next = downloadQueueRef.current.shift();
          if (next) sendRequest(next);
      }
  };
  const verifyPassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!hostConnectionIdRef.current || !passwordInput.trim()) return;
      setVerifying(true);
      peerService.sendTo(hostConnectionIdRef.current, { type: 'VERIFY_PASSWORD', payload: { password: passwordInput.trim() } });
  };

  const sendText = () => {
      if (!textInput.trim() || !hostConnectionIdRef.current) return;
      peerService.sendTo(hostConnectionIdRef.current, { type: 'TEXT', payload: { text: textInput } });
      setTextMessages(prev => [...prev, { id: Math.random().toString(36), text: textInput, sender: 'self', timestamp: Date.now() }]);
      setTextInput('');
  };

  const sendNudge = () => {
      if (!hostConnectionIdRef.current) return;
      peerService.sendTo(hostConnectionIdRef.current, { type: 'NUDGE' });
  };

  // --- CONNECTING STATE ---
  if (connectionStatus === 'connecting') {
      return (
        <div className="w-full max-w-md mx-auto p-8 text-center animate-fade-in px-6">
            <div className="mb-10 relative h-32 flex items-center justify-center">
                 {/* Pulse Rings */}
                 <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-32 h-32 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full animate-[ping_3s_linear_infinite]" />
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-24 h-24 border-4 border-indigo-200 dark:border-indigo-800/50 rounded-full animate-[ping_3s_linear_infinite_1s]" />
                 </div>
                 
                 {/* Central Icon */}
                 <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-700 flex items-center justify-center relative z-10">
                     <Wifi className="text-indigo-600 animate-pulse" size={32} />
                 </div>
            </div>

            <div className="space-y-6 max-w-xs mx-auto">
                <div className="flex items-center gap-4">
                     <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500", connectionStep >= 1 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700")}>
                         {connectionStep >= 1 ? <Check size={14} /> : <span className="text-xs">1</span>}
                     </div>
                     <span className={cn("text-sm font-medium transition-colors", connectionStep >= 1 ? "text-slate-900 dark:text-white" : "text-slate-400")}>Locating Peer</span>
                </div>
                <div className="flex items-center gap-4">
                     <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500", connectionStep >= 2 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700")}>
                         {connectionStep >= 2 ? <Check size={14} /> : <span className="text-xs">2</span>}
                     </div>
                     <span className={cn("text-sm font-medium transition-colors", connectionStep >= 2 ? "text-slate-900 dark:text-white" : "text-slate-400")}>Establishing Handshake</span>
                </div>
                <div className="flex items-center gap-4">
                     <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500", connectionStep >= 3 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700")}>
                         {connectionStep >= 3 ? <Check size={14} /> : <span className="text-xs">3</span>}
                     </div>
                     <span className={cn("text-sm font-medium transition-colors", connectionStep >= 3 ? "text-slate-900 dark:text-white" : "text-slate-400")}>Securing Tunnel</span>
                </div>
            </div>
        </div>
      );
  }

  // --- ERROR STATE ---
  if (connectionStatus === 'disconnected') {
      return (
        <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl text-center border border-slate-100 dark:border-slate-700 px-6 animate-slide-up">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Connection Lost</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                The secure link may have expired, or the sender closed their browser tab.
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-left mb-6 flex gap-3">
                <Smartphone className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" size={20} />
                <div className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                    <strong>On Mobile?</strong> If the sender is on a phone, their screen must stay on. If they switched apps, the connection was likely paused.
                </div>
            </div>

            <Button onClick={() => window.location.reload()} variant="primary" className="w-full py-4 text-base">Retry Connection</Button>
        </div>
      );
  }

  // --- PASSWORD LOCKED STATE ---
  if (locked) {
      return (
        <div className="w-full max-w-md mx-auto animate-fade-in px-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 p-8 text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border border-indigo-100 dark:border-indigo-800 animate-ping opacity-20" />
                    <Lock size={32} className="text-indigo-500 relative z-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Password Protected</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
                    This transfer is end-to-end encrypted and password locked.
                </p>
                <form onSubmit={verifyPassword} className="space-y-4">
                    <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input 
                            type="password" 
                            value={passwordInput} 
                            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }} 
                            placeholder="Enter Password" 
                            className={cn(
                                "w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl pl-12 pr-4 py-4 outline-none transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-400", 
                                passwordError ? "border-red-500 focus:ring-4 ring-red-500/10" : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 ring-indigo-500/10"
                            )} 
                            autoFocus 
                        />
                    </div>
                    {passwordError && (
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-pulse justify-center">
                            <AlertCircle size={12} /> Incorrect password.
                        </div>
                    )}
                    <Button type="submit" disabled={verifying || !passwordInput} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                        {verifying ? <Loader2 size={20} className="animate-spin" /> : <>Unlock Files <ArrowRight size={20} /></>}
                    </Button>
                </form>
            </div>
        </div>
      );
  }

  // --- CONNECTED / FILES STATE ---
  return (
    <div className={cn("w-full max-w-2xl mx-auto animate-fade-in px-4 pb-24", isNudged && "animate-shake")}>
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-sm border border-emerald-200 dark:border-emerald-800">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" />
                Secure Tunnel Active
            </div>
            
            <div className="flex items-center gap-3">
                 {latency && (
                     <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 border border-slate-200 dark:border-slate-700">
                         <Activity size={12} className="text-indigo-500" />
                         {latency}ms
                     </div>
                 )}
                 <button onClick={sendNudge} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors" title="Nudge Host">
                     <Bell size={18} />
                 </button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20" />
            
            <div className="p-8 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Incoming Files</h2>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <Database size={14} /> {files.length} items • {formatFileSize(files.reduce((a,b)=>a+b.size,0))} total
                    </p>
                </div>
                {files.length > 1 && (
                    <Button onClick={downloadAll} className="hidden md:flex bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all text-sm gap-2 whitespace-nowrap">
                        <DownloadCloud size={18} /> Download All
                    </Button>
                )}
            </div>
            
            <div className="p-4 space-y-3 bg-white dark:bg-slate-800 min-h-[300px]">
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <Loader2 size={30} className="text-indigo-500 animate-spin mb-3" />
                        <p className="text-sm font-medium">Waiting for host to add files...</p>
                    </div>
                ) : (
                    files.map(file => {
                        const state = downloadStates[file.id] || { status: 'pending', progress: 0 };
                        const theme = getFileTheme(file.name, file.type);
                        const isDownloading = state.status === 'downloading';
                        const isCompleted = state.status === 'completed';
                        
                        return (
                            <div 
                                key={file.id} 
                                className={cn(
                                    "group relative overflow-hidden p-4 rounded-2xl border transition-all duration-300",
                                    theme.bg, theme.border, theme.hover,
                                    isDownloading ? "shadow-lg scale-[1.01] ring-1 ring-indigo-500/20 z-10" : "hover:shadow-md"
                                )}
                            >
                                {/* Progress Background */}
                                {isDownloading && (
                                    <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none transition-all duration-300" style={{ width: `${state.progress}%` }} />
                                )}
                                
                                <div className="relative flex items-center gap-4">
                                    {/* Icon Container */}
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border shrink-0 bg-white dark:bg-slate-800 transition-transform group-hover:scale-110 duration-500", theme.border, theme.accent)}>
                                        <FileIcon fileName={file.name} fileType={file.type} className="w-7 h-7" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 py-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate pr-2" title={file.name}>{file.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50">
                                                {formatFileSize(file.size)}
                                            </span>
                                            
                                            {isDownloading && (
                                                <>
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">{formatSpeed(state.speed)}</span>
                                                    <span className="text-[10px] text-slate-400">• {formatDuration(state.timeRemaining)} left</span>
                                                </>
                                            )}
                                            {isCompleted && (
                                                 <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                     <Check size={10} strokeWidth={4} /> Saved
                                                 </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 z-10">
                                        {state.status === 'pending' || state.status === 'failed' ? (
                                            <button 
                                                onClick={() => startDownload(file.id)} 
                                                className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all active:scale-90 hover:-translate-y-0.5", theme.progress)} 
                                                title="Download"
                                            >
                                                <Download size={20} strokeWidth={2.5} />
                                            </button>
                                        ) : state.status === 'downloading' ? (
                                            <div className="w-10 h-10 flex items-center justify-center">
                                                <Loader2 size={24} className="text-indigo-600 animate-spin" />
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => startDownload(file.id)} 
                                                className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all active:scale-95 group/check" 
                                                title="Download again"
                                            >
                                                <Check size={20} strokeWidth={3} className="group-hover/check:hidden" />
                                                <RefreshCw size={18} strokeWidth={2.5} className="hidden group-hover/check:block" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            {/* Sticky Mobile Download All */}
            {files.length > 1 && (
                <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl md:hidden border-t border-slate-100 dark:border-slate-700 sticky bottom-0 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                     <Button onClick={downloadAll} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all text-base gap-2">
                        <DownloadCloud size={20} /> Download All Files
                     </Button>
                </div>
            )}
        </div>

        {/* Text Messaging Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                 <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                     <MessageSquare size={20} />
                 </div>
                 <h3 className="font-bold text-slate-900 dark:text-white">Secure Text Stream</h3>
            </div>
            
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30">
                 <div className="h-48 overflow-y-auto custom-scrollbar space-y-3 mb-4 p-2">
                      {textMessages.length === 0 && (
                          <div className="text-center text-slate-400 text-xs py-10 opacity-60">
                              Use this space to send passwords or links securely.
                          </div>
                      )}
                      {textMessages.map(msg => (
                          <div key={msg.id} className={cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm", msg.sender === 'self' ? "ml-auto bg-indigo-600 text-white rounded-tr-sm" : "mr-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm")}>
                              {msg.text}
                          </div>
                      ))}
                      <div ref={chatBottomRef} />
                 </div>
                 <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendText()}
                        placeholder="Type a secure message..."
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 ring-indigo-500/10"
                      />
                      <Button onClick={sendText} className="px-4 rounded-xl"><Send size={16} /></Button>
                 </div>
            </div>
        </div>
    </div>
  );
};