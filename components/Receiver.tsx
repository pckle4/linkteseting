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
  const [activeTab, setActiveTab] = useState<'files' | 'text'>('files');
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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat container only, not the window
  useEffect(() => {
    if (chatContainerRef.current) {
        const { scrollHeight, clientHeight } = chatContainerRef.current;
        chatContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [textMessages]);

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
                payload.files!.forEach(f => {
                    if (!next[f.id]) {
                        next[f.id] = { status: 'pending', progress: 0, speed: 0, timeRemaining: 0 };
                    }
                });
                return next;
            });
            setConnectionStatus('connected');
        }
    };

    const finalizeCurrentFile = () => {
        const fileId = currentFileIdRef.current;
        if (!fileId) return;

        const blob = new Blob(chunksRef.current);
        const url = URL.createObjectURL(blob);
        const fileMeta = filesRef.current.find(f => f.id === fileId);
        
        if (fileMeta) {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileMeta.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        setDownloadStates(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], status: 'completed', progress: 100, speed: 0, timeRemaining: 0 }
        }));

        // Reset for next file
        currentFileIdRef.current = null;
        chunksRef.current = [];
        receivedBytesRef.current = 0;
        
        // Process next in queue
        isProcessingQueueRef.current = false;
        processQueue();
    };

    const handleIncomingData = (event: IncomingData) => {
        // Handle Binary Data (File Chunks)
        if (event.data instanceof ArrayBuffer) {
            if (!currentFileIdRef.current) return;
            
            chunksRef.current.push(event.data);
            receivedBytesRef.current += event.data.byteLength;
            
            const now = Date.now();
            if (now - lastTickTimeRef.current > 500) {
                 const bytesReceived = receivedBytesRef.current;
                 const speed = (bytesReceived - lastTickBytesRef.current) / ((now - lastTickTimeRef.current) / 1000);
                 const progress = Math.min(100, (bytesReceived / expectedSizeRef.current) * 100);
                 const remainingBytes = expectedSizeRef.current - bytesReceived;
                 const timeRemaining = speed > 0 ? (remainingBytes / speed) * 1000 : 0;
                 
                 setDownloadStates(prev => ({
                     ...prev,
                     [currentFileIdRef.current!]: { ...prev[currentFileIdRef.current!], status: 'downloading', progress, speed, timeRemaining }
                 }));

                 lastTickTimeRef.current = now;
                 lastTickBytesRef.current = bytesReceived;
            }
            return;
        }

        // Handle Protocol Messages
        const msg = event.data as ProtocolMessage;
        
        if (msg.type === 'MANIFEST') {
            handleManifest(msg.payload);
        } else if (msg.type === 'PASSWORD_CORRECT') {
            setLocked(false);
            setVerifying(false);
            setPasswordError(false);
        } else if (msg.type === 'PASSWORD_INCORRECT') {
            setVerifying(false);
            setPasswordError(true);
        } else if (msg.type === 'START_FILE') {
            const { id, size } = msg.payload;
            currentFileIdRef.current = id;
            expectedSizeRef.current = size;
            receivedBytesRef.current = 0;
            chunksRef.current = [];
            lastTickTimeRef.current = Date.now();
            lastTickBytesRef.current = 0;
            setDownloadStates(prev => ({
                ...prev,
                [id]: { ...prev[id], status: 'downloading', progress: 0, speed: 0, timeRemaining: 0 }
            }));
        } else if (msg.type === 'END_FILE') {
            finalizeCurrentFile();
        } else if (msg.type === 'TEXT') {
            setTextMessages(prev => [...prev, { id: Math.random().toString(36), text: msg.payload.text, sender: 'peer', timestamp: Date.now() }]);
        } else if (msg.type === 'PING') {
             peerService.sendTo(event.connectionId, { type: 'PONG', payload: msg.payload });
        } else if (msg.type === 'PONG') {
             const rtt = Date.now() - msg.payload.ts;
             setLatency(rtt);
        } else if (msg.type === 'NUDGE') {
             setIsNudged(true);
             setTimeout(() => setIsNudged(false), 500);
             if ('vibrate' in navigator) navigator.vibrate(200);
        }
    };

    const connectToHost = async () => {
        try {
            setConnectionStep(1); // Lookup
            await peerService.initialize();
            
            setConnectionStep(2); // Handshake
            // Fix: Append prefix to match Sender's ID format
            peerService.connect(`nwshare-${hostId}`);
            
            peerService.on('connection', (conn) => {
                hostConnectionIdRef.current = conn.connectionId;
                setConnectionStep(3); // Connected (Waiting for manifest)
                
                // Start Ping Loop
                pingInterval = setInterval(() => {
                    if (peerService.getLatency(conn.connectionId)) {
                        peerService.sendTo(conn.connectionId, { type: 'PING', payload: { ts: Date.now() } });
                    }
                }, 2000);
            });

            peerService.on('data', handleIncomingData);
            
            peerService.on('error', (err) => {
                console.error("Peer error:", err);
                setConnectionStatus('disconnected');
            });

            peerService.on('status', (status) => {
                if (status.status === 'disconnected') {
                     setConnectionStatus('disconnected');
                }
            });

        } catch (e) {
            console.error("Connection failed", e);
            setConnectionStatus('disconnected');
        }
    };

    connectToHost();

    return () => {
        mounted = false;
        clearInterval(pingInterval);
        peerService.destroy();
    };
  }, [hostId]);

  const verifyPassword = () => {
      if (!hostConnectionIdRef.current) return;
      setVerifying(true);
      peerService.sendTo(hostConnectionIdRef.current, { type: 'VERIFY_PASSWORD', payload: { password: passwordInput } });
  };

  const processQueue = () => {
      if (isProcessingQueueRef.current || downloadQueueRef.current.length === 0 || !hostConnectionIdRef.current) return;
      
      const nextFileId = downloadQueueRef.current[0];
      isProcessingQueueRef.current = true;
      downloadQueueRef.current.shift(); // Remove from queue
      
      peerService.sendTo(hostConnectionIdRef.current, { type: 'REQUEST_FILE', payload: { fileId: nextFileId } });
  };

  const downloadFile = (fileId: string) => {
      if (!hostConnectionIdRef.current) return;
      
      // If already downloading or queued, ignore
      if (downloadStates[fileId]?.status === 'downloading' || downloadQueueRef.current.includes(fileId)) return;

      downloadQueueRef.current.push(fileId);
      setDownloadStates(prev => ({
          ...prev,
          [fileId]: { ...prev[fileId], status: 'pending' } // Just to show UI feedback if needed
      }));
      processQueue();
  };
  
  const downloadAll = () => {
      files.forEach(f => {
          if (downloadStates[f.id]?.status !== 'completed' && downloadStates[f.id]?.status !== 'downloading') {
              downloadFile(f.id);
          }
      });
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

  if (connectionStatus === 'disconnected') {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
             <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 animate-bounce-small">
                 <AlertCircle size={48} className="text-red-500" />
             </div>
             <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Connection Lost</h2>
             <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">The secure tunnel has been terminated or the host has gone offline.</p>
             <Button onClick={() => window.location.reload()} className="shadow-xl shadow-red-500/20">
                 <RefreshCw size={18} className="mr-2" /> Reconnect
             </Button>
        </div>
      );
  }

  if (connectionStatus === 'connecting' || (connectionStatus === 'connected' && files.length === 0 && !locked)) {
      return (
          <div className="flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto animate-fade-in">
              <div className="relative mb-10">
                  <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center relative z-10">
                      <Loader2 size={40} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
                  </div>
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Establishing Secure Handshake</h2>
              
              <div className="w-full space-y-4">
                  {[
                      { step: 0, label: "Initializing cryptographic keys...", icon: KeyRound },
                      { step: 1, label: "Looking up peer identity...", icon: Database },
                      { step: 2, label: "Negotiating ICE candidates...", icon: Wifi },
                      { step: 3, label: "Verifying DTLS certificates...", icon: ShieldCheck }
                  ].map((s) => (
                      <div key={s.step} className={cn("flex items-center gap-4 p-3 rounded-xl transition-all duration-500", connectionStep > s.step ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : connectionStep === s.step ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg scale-105" : "opacity-40 grayscale")}>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", connectionStep > s.step ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-700")}>
                              {connectionStep > s.step ? <Check size={16} /> : <s.icon size={16} />}
                          </div>
                          <span className="font-bold text-sm">{s.label}</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  if (locked) {
      return (
          <div className="flex flex-col items-center justify-center p-8 animate-fade-in max-w-md mx-auto">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/10">
                  <Lock size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Session Locked</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">Enter the password provided by the host to access these files.</p>
              
              <div className="w-full relative mb-4">
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                    placeholder="Enter password..."
                    className={cn(
                        "w-full pl-5 pr-12 py-4 bg-white dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 transition-all font-bold text-center tracking-widest",
                        passwordError ? "border-red-300 focus:border-red-500 focus:ring-red-500/20 text-red-600" : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20"
                    )}
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {verifying && <Loader2 size={20} className="animate-spin text-indigo-500" />}
                  </div>
              </div>
              {passwordError && <p className="text-red-500 text-sm font-bold mb-4 animate-shake">Incorrect password</p>}
              <Button onClick={verifyPassword} disabled={!passwordInput || verifying} className="w-full py-4 text-lg">
                  Unlock Files <ArrowRight size={20} className="ml-2" />
              </Button>
          </div>
      );
  }

  return (
    <div className={cn("w-full max-w-3xl mx-auto animate-slide-up pb-20 px-4", isNudged && "animate-shake")}>
      
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                       <Smartphone size={24} />
                   </div>
                   <div>
                       <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Connected to Peer</h1>
                       <div className="flex items-center gap-2 mt-1">
                           <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full"><Wifi size={10} /> Secure</span>
                           {latency && <span className="text-xs text-slate-400 font-mono">{latency}ms ping</span>}
                       </div>
                   </div>
              </div>
              <div className="flex gap-2">
                   <Button onClick={sendNudge} variant="ghost" className="px-3 rounded-xl bg-slate-100 dark:bg-slate-700" title="Nudge Host">
                       <Bell size={18} />
                   </Button>
              </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl mb-6">
              <button 
                onClick={() => setActiveTab('files')}
                className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2", activeTab === 'files' ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                  <Server size={16} /> Files ({files.length})
              </button>
              <button 
                onClick={() => setActiveTab('text')}
                className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2", activeTab === 'text' ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                  <MessageSquare size={16} /> Text Stream
              </button>
          </div>

          {activeTab === 'files' ? (
              <div className="space-y-4">
                  <div className="flex justify-end mb-2">
                      <button onClick={downloadAll} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                          <DownloadCloud size={14} /> Download All
                      </button>
                  </div>
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                      {files.map(file => {
                          const state = downloadStates[file.id];
                          const theme = getFileTheme(file.name, file.type);
                          const isDownloading = state?.status === 'downloading';
                          const isCompleted = state?.status === 'completed';

                          return (
                              <div key={file.id} className={cn("relative overflow-hidden bg-slate-50 dark:bg-slate-900/40 rounded-2xl border transition-all duration-300 group", theme.border, theme.hover)}>
                                  {/* Progress Bar Background */}
                                  {isDownloading && (
                                      <div 
                                          className={cn("absolute inset-0 opacity-10 transition-all duration-300", theme.progress)} 
                                          style={{ width: `${state.progress}%` }} 
                                      />
                                  )}
                                  
                                  <div className="relative p-4 flex items-center gap-4">
                                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0", theme.bg, theme.border)}>
                                          <FileIcon fileName={file.name} fileType={file.type} className="w-6 h-6" />
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1">
                                              <div className="font-bold text-slate-700 dark:text-slate-200 truncate pr-4">{file.name}</div>
                                              {isDownloading && <span className="text-xs font-mono font-bold text-indigo-500">{state.progress.toFixed(0)}%</span>}
                                          </div>
                                          
                                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                              <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50">{formatFileSize(file.size)}</span>
                                              {isDownloading && (
                                                  <>
                                                      <span className="flex items-center gap-1"><Activity size={10} /> {formatSpeed(state.speed)}</span>
                                                      <span className="flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> {formatDuration(state.timeRemaining / 1000)} left</span>
                                                  </>
                                              )}
                                              {isCompleted && <span className="text-emerald-500 font-bold flex items-center gap-1"><Check size={12} /> Complete</span>}
                                          </div>
                                      </div>

                                      <div className="shrink-0">
                                          {isCompleted ? (
                                              <button onClick={() => downloadFile(file.id)} className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center hover:scale-110 transition-transform" title="Download Again">
                                                  <RefreshCw size={18} />
                                              </button>
                                          ) : isDownloading ? (
                                              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                                  <Loader2 size={20} className="text-indigo-600 animate-spin" />
                                              </div>
                                          ) : (
                                              <button 
                                                  onClick={() => downloadFile(file.id)}
                                                  className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center shadow-sm group-hover:scale-110"
                                              >
                                                  <Download size={20} />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          ) : (
              <div className="flex flex-col h-[60vh]">
                  <div ref={chatContainerRef} className="flex-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 overflow-y-auto custom-scrollbar space-y-3 mb-4">
                      {textMessages.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                              <MessageSquare size={32} className="mb-2" />
                              <p className="text-xs">No messages yet. Chat securely.</p>
                          </div>
                      )}
                      {textMessages.map(msg => (
                          <div key={msg.id} className={cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm", msg.sender === 'self' ? "ml-auto bg-indigo-600 text-white rounded-tr-sm" : "mr-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm")}>
                              {msg.text}
                          </div>
                      ))}
                  </div>
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendText()}
                        placeholder="Type a secure message..."
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 ring-indigo-500/10 shadow-sm"
                      />
                      <Button onClick={sendText} className="px-5 rounded-xl"><Send size={18} /></Button>
                  </div>
              </div>
          )}
      </div>
      
      <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
             Your connection is end-to-end encrypted. Files are transferred directly from the host.
          </p>
      </div>
    </div>
  );
};
