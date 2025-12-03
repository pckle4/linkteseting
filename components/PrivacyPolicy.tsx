import React from 'react';
import { Shield, Lock, EyeOff, Server, Database, ArrowLeft } from 'lucide-react';
import { Button } from './Button';

export const PrivacyPolicy: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-20 px-4">
      <Button onClick={onBack} variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-indigo-500 gap-2">
        <ArrowLeft size={20} /> Back to App
      </Button>

      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-100 dark:border-emerald-800">
            <Shield size={14} /> Zero-Knowledge Architecture
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
          Privacy <span className="text-emerald-500">Policy</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
           We built NW Share to be private by design. We physically cannot see your files because they never touch our servers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-6 text-slate-900 dark:text-white">
                  <EyeOff size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No Data Collection</h3>
              <p className="text-slate-500 dark:text-slate-400">
                  We do not collect, store, or process personal data. There are no user accounts, no tracking cookies, and no analytics that trace individual user behavior.
              </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-6 text-slate-900 dark:text-white">
                  <Database size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No File Storage</h3>
              <p className="text-slate-500 dark:text-slate-400">
                  Files are streamed directly from the sender to the receiver. We do not have a database of files. Once the browser tab is closed, the data is gone forever.
              </p>
          </div>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-12 text-slate-600 dark:text-slate-300">
        <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Server size={24} className="text-indigo-500" />
                The Role of the Signaling Server
            </h2>
            <p className="leading-relaxed">
                To establish a connection between two devices, we use a "signaling server" (broker). This server's only job is to introduce Peer A to Peer B. It passes small encrypted messages (SDP offers/answers) that contain networking information (IP addresses, ports). 
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-indigo-500">
                <li>The signaling server <strong>cannot decrypt</strong> the actual file data.</li>
                <li>The signaling server <strong>does not log</strong> connection metadata permanently.</li>
                <li>Connection logs are ephemeral and exist only in memory to facilitate the handshake.</li>
            </ul>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Lock size={24} className="text-emerald-500" />
                Encryption Standards
            </h2>
            <p className="leading-relaxed">
                NW Share utilizes WebRTC, which mandates encryption. All data transferred between peers is encrypted using <strong>DTLS (Datagram Transport Layer Security)</strong> and <strong>SRTP (Secure Real-time Transport Protocol)</strong>.
            </p>
            <p className="mt-4 leading-relaxed">
                This means that even if a malicious actor were to intercept the network traffic between you and your peer, they would only see random noise. They cannot reconstruct your files without the encryption keys, which are generated on your device and never sent to us.
            </p>
        </section>

        <section className="bg-slate-100 dark:bg-slate-900 p-8 rounded-3xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">A Note on IP Addresses</h2>
            <p className="text-sm">
                Because this is a Peer-to-Peer (P2P) service, a direct connection is made between your device and the recipient's device. This is necessary for the technology to work. As a result, the recipient's device technically needs to know your IP address to receive data packets, and vice versa. This is standard behavior for all P2P applications (like BitTorrent, Skype, or Zoom).
            </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm">
        Last updated: January 2025
      </div>
    </div>
  );
};