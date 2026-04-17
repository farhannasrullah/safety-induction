// src/components/user/Step6Success.jsx
import React, { useState } from 'react';
import { CheckCircle, ShieldCheck, RefreshCcw } from 'lucide-react';

export default function Step6Success({ formData, quizScore }) {
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = () => {
    setIsFinishing(true);
    setTimeout(() => {
      sessionStorage.clear();
      window.location.reload();
    }, 1_500);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in-up border border-gray-100 relative overflow-hidden max-w-lg mx-auto">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-transparent" />
      <div className="relative z-10">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30 ring-8 ring-green-50">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">Akses Diberikan!</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Terima kasih, <strong className="text-slate-800">{formData.nama}</strong>.<br />
          Data keselamatan Anda dengan skor <span className="font-bold text-slate-900">{quizScore}%</span> telah terekam.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8 text-left flex items-center gap-4 shadow-inner">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <ShieldCheck className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Keamanan</p>
            <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              Clear for Entry
            </p>
          </div>
        </div>
        <button
          onClick={handleFinish}
          disabled={isFinishing}
          aria-busy={isFinishing}
          className="bg-slate-900 text-white font-bold py-4 px-8 rounded-2xl w-full hover:bg-slate-800 transition-colors shadow-xl flex items-center justify-center gap-3 disabled:opacity-80"
        >
          {isFinishing
            ? <><RefreshCcw className="w-5 h-5 animate-spin" /> Memproses...</>
            : <>Selesai &amp; Kembali <RefreshCcw className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}