import React, { useState, useEffect, useRef } from 'react';
import { peerService } from '../services/peerService';
import { generateShortId, formatFileSize, cn, formatTimeRemaining, formatSpeed } from '../utils';
import { Button } from './Button';
import { FileIcon } from './FileIcon';
import { Check, Copy, Trash2, Cloud, ArrowUpRight, Globe, Timer, Download, ChevronDown, ChevronUp, Share2, Settings, HardDrive, Lock, AlertTriangle, BarChart3, Activity, Plus, X, Zap, Infinity as InfinityIcon, ShieldCheck, Loader2, QrCode, MessageSquare, Send, Bell, Smartphone, FileText } from 'lucide-react';
import { DataConnection } from 'peerjs';
import { IncomingData, ProtocolMessage, TextMessage } from '../types';
import QRCode from 'qrcode';

const SILENT_AUDIO_URL = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
const CHUNK_SIZE = 64 * 1024;

interface SenderProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}
interface HostedFile { id: string; file: File; uploadTime: number; }
interface FileStats { downloads: number; lastDownloadedAt: number | null; }
interface ActiveTransfer { connectionId: string; peerId: string; fileId: string; progress: number; status: 'starting' | 'transferring' | 'completed' | 'failed'; }

type TabMode = 'files' | 'text';

export const Sender: React.FC<SenderProps> = ({ onToast }) => {
  const [hostedFiles, setHostedFiles] = useState<HostedFile[]>([]);
  const [shareLink, setShareLink] = useState('');
  const [activeTransfers, setActiveTransfers] = useState<ActiveTransfer[]>([]);
  const [fileStats, setFileStats] = useState<Record<string, FileStats>>({});
  const [expired, setExpired] = useState(false);
  const [expiredReason, setExpiredReason] = useState<'time' | 'limit'>('time');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // New Features State
  const [activeTab, setActiveTab] = useState<TabMode>('files');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [textMessages, setTextMessages] = useState<TextMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const [isNudged, setIsNudged] = useState(false);
  
  // Custom Configuration State
  const [expiryMinutes, setExpiryMinutes] = useState<number>(60);
  const [downloadLimit, setDownloadLimit] = useState<number | ''>(''); // Empty string = Unlimited
  const [isUnlimitedDownloads, setIsUnlimitedDownloads] = useState(true);

  const [password, setPassword] = useState('');
  const [totalBytesSent, setTotalBytesSent] = useState(0);
  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const wakeLockRef = useRef<any>(null);
  const filesRef = useRef<HostedFile[]>([]); 
  const activeTransfersRef = useRef<ActiveTransfer[]>([]);
  const totalDownloadsRef = useRef<number>(0);
  const passwordRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { filesRef.current = hostedFiles; }, [hostedFiles]);
  useEffect(() => { activeTransfersRef.current = activeTransfers; }, [activeTransfers]);
  useEffect(() => { passwordRef.current = password; }, [password]);
  
  // Removed auto-scroll useEffect to prevent screen jumping

  useEffect(() => {
      setFileStats(prev => {
          const next = { ...prev };
          hostedFiles.forEach(f => { if (!next[f.id]) next[f.id] = { downloads: 0, lastDownloadedAt: null }; });
          return next;
      });
  }, [hostedFiles]);

  useEffect(() => {
    if (!expirationTime) return;
    const timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, expirationTime - now);
        setTimeRemaining(remaining);
        if (remaining <= 0) { handleStopSharing('time'); return; }
        const isTransferring = activeTransfersRef.current.some(t => t.status === 'transferring');
        if (!isTransferring) setCurrentSpeed(0);
    }, 500); 
    return () => clearInterval(timer);
  }, [expirationTime]);

  const enableKeepAlive = async () => {
    // iOS Background Fix: Play audio immediately on user interaction
    if (audioRef.current) {
        audioRef.current.volume = 0.01;
        audioRef.current.play().catch((e) => console.log("Audio play failed", e));
    }
    if ('wakeLock' in navigator) { 
        try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (e) {} 
    }
  };

  const updateTransferState = (connId: string, fileId: string, updates: Partial<ActiveTransfer>) => {
      setActiveTransfers(prev => {
          const idx = prev.findIndex(t => t.connectionId === connId && t.fileId === fileId);
          if (idx === -1) return [...prev, { connectionId: connId, peerId: '', fileId, progress: 0, status: 'starting', ...updates } as ActiveTransfer];
          const newArr = [...prev];
          newArr[idx] = { ...newArr[idx], ...updates };
          return newArr;
      });
  };

  const transferFile = async (connId: string, peerId: string, fileId: string) => {
      if (activeTransfersRef.current.some(t => t.connectionId === connId && t.fileId === fileId && t.status !== 'completed')) return;
      const hostFile = filesRef.current.find(f => f.id === fileId);
      if (!hostFile) return;

      setActiveTransfers(prev => [...prev, { connectionId: connId, peerId, fileId, progress: 0, status: 'transferring' }]);
      try {
          const file = hostFile.file;
          peerService.sendTo(connId, { type: 'START_FILE', payload: { id: fileId, name: file.name, size: file.size, type: file.type } });
          
          const totalSize = file.size;
          let offset = 0;
          let lastTick = Date.now();
          let bytesSinceLastTick = 0;

          // Optimized Loop for iOS & Performance
          while (offset < totalSize) {
              await peerService.waitForBuffer(connId);

              const chunk = file.slice(offset, offset + CHUNK_SIZE);
              const buffer = await chunk.arrayBuffer();
              peerService.sendTo(connId, buffer);
              
              offset += buffer.byteLength;
              bytesSinceLastTick += buffer.byteLength;
              
              const now = Date.now();
              if (now - lastTick > 500) {
                   const pct = Math.round((offset / totalSize) * 100);
                   setCurrentSpeed(bytesSinceLastTick / ((now - lastTick) / 1000));
                   updateTransferState(connId, fileId, { progress: pct });
                   lastTick = now; 
                   bytesSinceLastTick = 0;
                   // Brief yield to event loop to keep UI responsive
                   await new Promise(r => setTimeout(r, 0));
              } else if (offset >= totalSize) {
                   updateTransferState(connId, fileId, { progress: 100 });
              }
          }
          
          setCurrentSpeed(0);
          await peerService.waitForBuffer(connId);
          peerService.sendTo(connId, { type: 'END_FILE', payload: { fileId } });
          updateTransferState(connId, fileId, { status: 'completed', progress: 100 });
          
          setTotalBytesSent(prev => prev + totalSize);
          setFileStats(prev => ({ ...prev, [fileId]: { downloads: (prev[fileId]?.downloads || 0) + 1, lastDownloadedAt: Date.now() } }));
          
          const newDownloadCount = (totalDownloadsRef.current as number) + 1;
          totalDownloadsRef.current = newDownloadCount;

          const limit = isUnlimitedDownloads ? Infinity : Number(downloadLimit);
          if (limit !== Infinity && newDownloadCount >= limit) {
              setTimeout(() => handleStopSharing('limit'), 1000);
          }
          setTimeout(() => setActiveTransfers(prev => prev.filter(t => !(t.connectionId === connId && t.fileId === fileId))), 3000);
      } catch (e) {
          updateTransferState(connId, fileId, { status: 'failed' });
          setCurrentSpeed(0);
      }
  };

  useEffect(() => {
    const handleConnection = (conn: DataConnection) => {
        const isLocked = !!passwordRef.current;
        peerService.sendTo(conn.connectionId, {
            type: 'MANIFEST',
            payload: { locked: isLocked, files: isLocked ? undefined : filesRef.current.map(f => ({ id: f.id, name: f.file.name, size: f.file.size, type: f.file.type })) }
        });
    };
    const handleData = (event: IncomingData) => {
        const msg = event.data as ProtocolMessage;
        if (msg.type === 'VERIFY_PASSWORD') {
             if (msg.payload?.password === passwordRef.current) {
                  peerService.sendTo(event.connectionId, { type: 'PASSWORD_CORRECT' });
                  peerService.sendTo(event.connectionId, { type: 'MANIFEST', payload: { locked: false, files: filesRef.current.map(f => ({ id: f.id, name: f.file.name, size: f.file.size, type: f.file.type })) } });
             } else { peerService.sendTo(event.connectionId, { type: 'PASSWORD_INCORRECT' }); }
        } else if (msg.type === 'REQUEST_FILE') { 
            if (msg.payload?.fileId) transferFile(event.connectionId, event.peerId, msg.payload.fileId); 
        } else if (msg.type === 'TEXT') {
            setTextMessages(prev => [...prev, { id: Math.random().toString(36), text: msg.payload.text, sender: 'peer', timestamp: Date.now() }]);
            if (activeTab !== 'text') onToast("New text message received", 'info');
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
    peerService.on('connection', handleConnection);
    peerService.on('data', handleData);
    return () => { peerService.off('connection', handleConnection); peerService.off('data', handleData); };
  }, [activeTab]); // Re-bind if configs change significantly, though Refs handle most

  const startSession = async () => {
    setIsStarting(true);
    enableKeepAlive(); // Start audio immediately
    
    // Artificial delay removed for performance
    const id = generateShortId();
    try {
      await peerService.initialize(`nwshare-${id}`);
      const link = `${window.location.protocol}//${window.location.host}/#${id}`;
      setShareLink(link);
      
      // Generate QR Code
      QRCode.toDataURL(link, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, (err, url) => {
          if (!err) setQrCodeUrl(url);
      });

      const now = Date.now(), duration = expiryMinutes * 60 * 1000;
      setExpirationTime(now + duration);
      setTimeRemaining(duration);
    } catch (e) { 
        onToast("Failed to start host", "error"); 
        setIsStarting(false);
    }
  };

  const sendText = () => {
      if (!textInput.trim()) return;
      peerService.broadcast({ type: 'TEXT', payload: { text: textInput } });
      setTextMessages(prev => [...prev, { id: Math.random().toString(36), text: textInput, sender: 'self', timestamp: Date.now() }]);
      setTextInput('');
  };

  const sendNudge = () => {
      peerService.broadcast({ type: 'NUDGE' });
      onToast("Nudged connected peers!", "success");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setHostedFiles(prev => [...prev, ...Array.from(e.target.files!).map((f: File) => ({ id: Math.random().toString(36).substring(2, 9), file: f, uploadTime: Date.now() }))]);
    }
  };

  const removeFile = (id: string) => {
      setHostedFiles(prev => prev.filter(f => f.id !== id));
  };

  const copyLink = () => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleStopSharing = (reason?: 'time' | 'limit' | 'user') => {
      peerService.destroy();
      if (audioRef.current) { audioRef.current.pause(); }

      if (reason && reason !== 'user') { setExpired(true); setExpiredReason(reason); } 
      else {
          setHostedFiles([]); setShareLink(''); setActiveTransfers([]); setExpirationTime(null);
          setExpired(false); setTotalBytesSent(0); setTimeRemaining(0); setFileStats({}); setPassword('');
          totalDownloadsRef.current = 0;
          setIsStarting(false);
          setQrCodeUrl(null);
          setTextMessages([]);
          if (window.location.hash) window.history.pushState(null, '', window.location.pathname);
      }
  };

  const getTotalDownloads = () => Object.values(fileStats).reduce((acc, curr) => acc + (curr as FileStats).downloads, 0);
  const isNearExpiry = timeRemaining < 5 * 60 * 1000;
  
  const limit = isUnlimitedDownloads ? Infinity : Number(downloadLimit);
  const isNearLimit = limit !== Infinity && getTotalDownloads() >= (limit) * 0.9;
  
  const isCritical = isNearExpiry || isNearLimit;
  const activeCardBorder = isCritical ? 'border-amber-400 dark:border-amber-600 ring-4 ring-amber-500/10' : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800';

  if (expired) {
      return (
          <div className="w-full max-w-lg mx-auto animate-fade-in text-center p-10 bg-white dark:bg-slate-800 rounded-3xl border border-red-100 dark:border-red-900/50 shadow-2xl">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  {expiredReason === 'time' ? <Timer size={40} className="text-red-500" /> : <AlertTriangle size={40} className="text-red-500" />}
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{expiredReason === 'time' ? 'Link Expired' : 'Download Limit Reached'}</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">{expiredReason === 'time' ? 'The session time limit has been reached.' : 'The maximum number of allowed downloads has been reached.'}</p>
              <Button onClick={() => handleStopSharing('user')} className="w-full py-4 text-lg">Start New Session</Button>
          </div>
      );
  }

  // --- DROPZONE VIEW ---
  if (hostedFiles.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto animate-fade-in text-center px-4">
        <h1 className="text-4xl md:text-6xl font-black mb-4 text-slate-900 dark:text-white tracking-tight leading-tight">
          Share files <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-text-shimmer">instantly.</span>
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-indigo-500 opacity-60 pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none"><path className="animate-draw-line" pathLength="1" strokeDasharray="1" strokeDashoffset="1" d="M0 5 Q 50 12 100 5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg max-w-2xl mx-auto">Direct P2P file transfer directly in your browser. No cloud limits. No signup.</p>

        <div className="w-full max-w-xl mx-auto relative z-20">
             <label className="block group cursor-pointer transform-gpu transition-all duration-300 ease-out active:scale-95 mb-6">
                 <input type="file" multiple onChange={handleFileSelect} className="hidden" />
                 <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 md:p-14 border-2 border-dashed border-indigo-100 dark:border-indigo-900/30 group-hover:border-indigo-500 dark:group-hover:border-indigo-500 transition-all duration-300 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-none group-hover:shadow-xl group-hover:-translate-y-1 transform-gpu">
                      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 ease-out"><Cloud size={40} strokeWidth={1.5} /></div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upload a file</h3>
                      <p className="text-slate-400 dark:text-slate-500 mb-6">Drag and drop here, or click to browse.</p>
                      <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Unlimited Size • Direct P2P</div>
                 </div>
             </label>
        </div>
      </div>
    );
  }

  // --- STAGING / REVIEW VIEW ---
  if (!shareLink) {
    return (
        <div className="w-full max-w-2xl mx-auto animate-slide-up px-4">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 text-center">Ready to Share</h2>
            
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">{hostedFiles.length}</div>
                         <span className="font-bold text-slate-700 dark:text-slate-200">Files Selected</span>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{formatFileSize(hostedFiles.reduce((acc, f) => acc + f.file.size, 0))} Total</div>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {hostedFiles.map((file, idx) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl group transition-all hover:bg-slate-100 dark:hover:bg-slate-900/60">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                                <FileIcon fileName={file.file.name} fileType={file.file.type} className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{file.file.name}</div>
                                <div className="text-xs text-slate-400">{formatFileSize(file.file.size)}</div>
                            </div>
                            <button 
                                onClick={() => removeFile(file.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Remove file"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                    >
                        <Plus size={16} /> Add more files
                    </button>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
                </div>
            </div>

            {/* Config Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 overflow-hidden mb-8 shadow-lg">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)} 
                    className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                           <Settings size={20} />
                       </div>
                       <div className="text-left">
                           <h3 className="font-bold text-slate-900 dark:text-white">Session Security</h3>
                           <p className="text-xs text-slate-500">Configure expiration, limits, and password</p>
                       </div>
                   </div>
                   {showAdvanced ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>
                
                <div className={cn("transition-all duration-300 ease-in-out border-t border-slate-100 dark:border-slate-700", showAdvanced ? "max-h-[800px] opacity-100 p-6 pt-2 bg-slate-50/50 dark:bg-slate-900/20" : "max-h-0 opacity-0 p-0 overflow-hidden")}>
                    <div className="space-y-8 mt-4">
                        
                        {/* Expiry Control */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Timer size={14} /> Link Expiration</div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="flex-1 relative">
                                    <input 
                                        type="range" 
                                        min="5" 
                                        max="10080" // 7 days in minutes
                                        step="5"
                                        value={expiryMinutes}
                                        onChange={(e) => setExpiryMinutes(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                                <div className="w-28 relative">
                                    <input 
                                        type="number" 
                                        value={expiryMinutes} 
                                        onChange={(e) => setExpiryMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center focus:border-indigo-500 outline-none" 
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">min</span>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 mt-2 text-right">
                                {formatTimeRemaining(expiryMinutes * 60 * 1000)} duration
                            </div>
                        </div>

                        {/* Download Limit Control */}
                        <div>
                             <div className="flex items-center justify-between mb-3">
                                 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Download size={14} /> Download Limit</div>
                                 <label className="flex items-center gap-2 cursor-pointer">
                                     <span className="text-xs font-bold text-slate-500">Unlimited</span>
                                     <input 
                                        type="checkbox" 
                                        checked={isUnlimitedDownloads} 
                                        onChange={(e) => setIsUnlimitedDownloads(e.target.checked)} 
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                     />
                                 </label>
                             </div>
                             
                             <div className={cn("transition-opacity duration-200", isUnlimitedDownloads ? "opacity-40 pointer-events-none" : "opacity-100")}>
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1 relative">
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="100" 
                                            step="1"
                                            value={downloadLimit || 1}
                                            onChange={(e) => { setDownloadLimit(parseInt(e.target.value)); setIsUnlimitedDownloads(false); }}
                                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            disabled={isUnlimitedDownloads}
                                        />
                                    </div>
                                    <div className="w-28 relative">
                                        {isUnlimitedDownloads ? (
                                            <div className="w-full py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center text-slate-400 flex items-center justify-center">
                                                <InfinityIcon size={16} />
                                            </div>
                                        ) : (
                                            <input 
                                                type="number" 
                                                value={downloadLimit} 
                                                onChange={(e) => setDownloadLimit(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center focus:border-indigo-500 outline-none" 
                                            />
                                        )}
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Password Control */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400"><Lock size={14} /> Password Protection</div>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Optional password protection" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 ring-indigo-500/10 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             <div className="flex gap-4">
                 <button onClick={() => setHostedFiles([])} className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                 <Button onClick={startSession} disabled={isStarting} className="flex-1 py-4 text-base shadow-2xl shadow-indigo-500/30">
                     {isStarting ? (
                         <div className="flex items-center gap-2 animate-pulse">
                            <Loader2 size={20} className="animate-spin" /> 
                            <span>Allocating Secure ID...</span>
                         </div>
                     ) : (
                         <span className="flex items-center gap-2"><Zap size={18} className="fill-current" /> Create Secure Link</span>
                     )}
                 </Button>
             </div>
        </div>
    );
  }

  // --- ACTIVE SESSION VIEW ---
  return (
    <div className={cn("w-full max-w-3xl mx-auto animate-slide-up pb-20 px-4", isNudged && "animate-shake")}>
      {/* iOS Background Audio Hack */}
      <audio 
        ref={audioRef} 
        src={SILENT_AUDIO_URL} 
        loop 
        muted={false} 
        playsInline 
        className="opacity-1 pointer-events-none absolute w-1 h-1 -z-10" 
      />

      {/* QR Code Modal */}
      {showQrModal && qrCodeUrl && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowQrModal(false)}>
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-100 animate-slide-up" onClick={e => e.stopPropagation()}>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">Scan to Connect</h3>
                  <p className="text-slate-500 text-center mb-6">Point your phone's camera at this code to open the secure link.</p>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-inner mb-6 flex justify-center">
                      <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                  </div>
                  <Button onClick={() => setShowQrModal(false)} className="w-full">Close</Button>
              </div>
          </div>
      )}
      
      <div className={cn("bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border p-6 mb-6 relative overflow-hidden transition-all duration-300 transform-gpu", activeCardBorder)}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 relative z-10 border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400"><Share2 size={16} /> Active Session</div>
              <div className="flex flex-wrap items-center gap-2">
                   {password && (<div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"><Lock size={14} /> Locked</div>)}
                  <div className={cn("flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors", isNearExpiry ? "text-red-600 bg-red-100 dark:bg-red-900/30 animate-pulse" : "text-orange-500 bg-orange-50 dark:bg-orange-900/20")}>
                      <Timer size={14} /> Expires: {formatTimeRemaining(timeRemaining)}
                  </div>
                  {(!isUnlimitedDownloads || (typeof downloadLimit === 'number' && downloadLimit < Infinity)) && (
                       <div className={cn("flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors", isNearLimit ? "text-red-600 bg-red-100 dark:bg-red-900/30 animate-pulse" : "text-blue-500 bg-blue-50 dark:bg-blue-900/20")}>
                          <Download size={14} /> Limit: {getTotalDownloads()} / {downloadLimit}
                      </div>
                  )}
              </div>
          </div>
          
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl mb-6">
              <button 
                onClick={() => setActiveTab('files')}
                className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2", activeTab === 'files' ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                  <HardDrive size={16} /> Files ({hostedFiles.length})
              </button>
              <button 
                onClick={() => setActiveTab('text')}
                className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2", activeTab === 'text' ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                  <MessageSquare size={16} /> Text Stream
              </button>
          </div>

          {activeTab === 'files' ? (
              <div className="mb-6 space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2 animate-fade-in">
                  {hostedFiles.map((fileEntry, idx) => (
                       <div key={fileEntry.id} className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-2 transform-gpu transition-all duration-200 hover:border-indigo-200 dark:hover:border-slate-600">
                           <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 shrink-0"><FileIcon fileName={fileEntry.file.name} fileType={fileEntry.file.type} className="w-5 h-5" /></div>
                               <div className="flex-1 min-w-0">
                                   <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{fileEntry.file.name}</div>
                                   <div className="text-[10px] text-slate-400 font-mono">{formatFileSize(fileEntry.file.size)}</div>
                               </div>
                           </div>
                       </div>
                  ))}
              </div>
          ) : (
              <div className="flex flex-col h-60 mb-6 animate-fade-in">
                  <div ref={chatContainerRef} className="flex-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 overflow-y-auto custom-scrollbar space-y-3">
                      {textMessages.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                              <MessageSquare size={32} className="mb-2" />
                              <p className="text-xs">No messages yet. Send text securely.</p>
                          </div>
                      )}
                      {textMessages.map(msg => (
                          <div key={msg.id} className={cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm", msg.sender === 'self' ? "ml-auto bg-indigo-600 text-white rounded-tr-sm" : "mr-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm")}>
                              {msg.text}
                          </div>
                      ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                      <input 
                        type="text" 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendText()}
                        placeholder="Type a secure message..."
                        className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 ring-indigo-500/10"
                      />
                      <Button onClick={sendText} className="px-4 rounded-xl"><Send size={16} /></Button>
                  </div>
              </div>
          )}

          <div className="relative">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Globe size={12} /> Shareable Link</div>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 group focus-within:ring-2 ring-indigo-500/20 transition-all duration-300 relative z-10 transform-gpu">
                  <div className="flex-1 min-w-0 flex items-center px-3 py-2">
                      <div className="w-full bg-transparent border-none outline-none text-sm font-mono text-slate-600 dark:text-slate-300 break-all cursor-text selection:bg-indigo-100 dark:selection:bg-indigo-900" onClick={() => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{shareLink}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                      <button onClick={() => setShowQrModal(true)} className="flex justify-center items-center px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Show QR Code">
                          <QrCode size={18} />
                      </button>
                      <button onClick={copyLink} className="flex justify-center items-center px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity gap-2 min-h-[44px]">
                          {copied ? <Check size={16} /> : <Copy size={16} />}<span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center shadow-sm flex flex-col items-center justify-center transform-gpu transition-all hover:scale-[1.02] hover:shadow-md">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Status</div>
              <div className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 truncate w-full">
                  {activeTransfers.length > 0 ? (<span className="text-indigo-500 flex items-center justify-center gap-1"><ArrowUpRight size={14} /> Sending</span>) : (latency ? 'Connected' : 'Waiting')}
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center shadow-sm flex flex-col items-center justify-center transform-gpu transition-all hover:scale-[1.02] hover:shadow-md">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Ping (RTT)</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {latency ? <span className={cn("text-emerald-500", latency > 100 && "text-amber-500", latency > 300 && "text-red-500")}>{latency}ms</span> : '-'}
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center shadow-sm flex flex-col items-center justify-center transform-gpu transition-all hover:scale-[1.02] hover:shadow-md">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Speed</div>
              <div className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1">{formatSpeed(currentSpeed)}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center shadow-sm flex flex-col items-center justify-center transform-gpu transition-all hover:scale-[1.02] hover:shadow-md">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Sent</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1">{getTotalDownloads()}{!isUnlimitedDownloads && <span className="text-xs text-slate-400 font-normal">/ {downloadLimit}</span>}</div>
          </div>
      </div>
      
      {/* Detailed Statistics Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden mb-8 transition-all duration-300 shadow-sm">
        <button 
            onClick={() => setShowStats(!showStats)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <BarChart3 size={20} />
                </div>
                <div className="text-left">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Transfer Analytics</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Track downloads per file in real-time</div>
                </div>
            </div>
            {showStats ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </button>
        
        {showStats && (
            <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20 animate-slide-up">
                <div className="space-y-3 mt-4">
                    {hostedFiles.map(file => {
                        const stats = fileStats[file.id] || { downloads: 0, lastDownloadedAt: null };
                        return (
                            <div key={file.id} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-slate-600 transition-colors">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shrink-0">
                                    <FileIcon fileName={file.file.name} fileType={file.file.type} className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.file.name}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                        <Activity size={12} className="text-emerald-500" />
                                        {stats.lastDownloadedAt ? 
                                            `Last downloaded: ${new Date(stats.lastDownloadedAt).toLocaleTimeString()}` : 
                                            "No downloads yet"
                                        }
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-900/30">
                                        <Download size={12} /> {stats.downloads}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between px-2 gap-4 mt-8">
          <div className="flex gap-4">
               <button onClick={sendNudge} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95" title="Shake peer's screen">
                   <Bell size={16} /> Nudge
               </button>
               <div className="text-sm text-slate-400 flex items-center gap-2 px-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                   <span className="font-medium">Secure Channel</span>
               </div>
          </div>
          <button onClick={() => handleStopSharing('user')} className="flex items-center gap-2 text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 transform-gpu w-full md:w-auto justify-center">
              <Trash2 size={18} /> Stop Sharing
          </button>
      </div>
    </div>
  );
};
