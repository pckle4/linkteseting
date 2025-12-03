import React from 'react';
import { Scale, AlertTriangle, XCircle, FileWarning, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

export const TermsOfService: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-20 px-4">
      <Button onClick={onBack} variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-indigo-500 gap-2">
        <ArrowLeft size={20} /> Back to App
      </Button>

      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 border border-slate-200 dark:border-slate-700">
            <Scale size={14} /> Legal Agreement
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
          Terms of <span className="text-indigo-600 dark:text-indigo-400">Service</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
           By using NW Share, you agree to the following terms regarding the decentralized and peer-to-peer nature of the service.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 mb-12 flex items-start gap-4">
        <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0 mt-1" size={24} />
        <div>
            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-2">Service Provided "As Is"</h3>
            <p className="text-amber-700 dark:text-amber-500/80 leading-relaxed">
                NW Share is a free, experimental, client-side application. We provide no warranties regarding reliability, uptime, or data integrity. Use it at your own risk.
            </p>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-12 text-slate-600 dark:text-slate-300">
        <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <XCircle size={20} className="text-red-500" />
                1. Acceptable Use Policy
            </h3>
            <p className="mb-4">
                You agree NOT to use NW Share to transfer, distribute, or store:
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-red-500">
                <li>Child Sexual Abuse Material (CSAM) or any content involving the exploitation of minors.</li>
                <li>Content that is illegal in your jurisdiction or the jurisdiction of the recipient.</li>
                <li>Malware, viruses, ransomware, or any software designed to cause harm.</li>
                <li>Copyrighted material that you do not have the right to share.</li>
                <li>Content that promotes violence, terrorism, or hate speech.</li>
            </ul>
        </section>

        <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-indigo-500" />
                2. User Liability
            </h3>
            <p>
                As a decentralized Peer-to-Peer (P2P) service, NW Share acts solely as a technological conduit. We do not host, view, or control the files being transferred. <strong>You adhere to full legal liability for the content you share.</strong>
            </p>
            <p className="mt-4">
                You agree to indemnify and hold harmless the developers of NW Share from any claims, damages, or legal actions arising from your use of the service.
            </p>
        </section>

        <section>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileWarning size={20} className="text-orange-500" />
                3. No Data Persistence
            </h3>
            <p>
                NW Share does not offer cloud storage. Files are streamed directly between devices. If you close your browser tab, the transfer session ends immediately. We cannot recover lost files or broken transfers.
            </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm">
        Last updated: January 2025
      </div>
    </div>
  );
};