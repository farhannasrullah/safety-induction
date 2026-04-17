// src/components/user/ProgressBar.jsx
import React from 'react';
import { User, PlayCircle, FileImage, ClipboardList, FileSignature, CheckCircle } from 'lucide-react';

export default function ProgressBar({ step }) {
  const steps = [
    { num: 1, icon: User,          label: "Identitas" },
    { num: 2, icon: PlayCircle,    label: "Materi"    },
    { num: 3, icon: FileImage,     label: "Poster"    },
    { num: 4, icon: ClipboardList, label: "Evaluasi"  },
    { num: 5, icon: FileSignature, label: "Pengesahan"},
  ];
  const progress = ((Math.min(step, 5) - 1) / 4) * 100;

  return (
    <div className="relative mb-8 mt-2 px-2 md:px-4 max-w-4xl mx-auto w-full">
      <div className="absolute top-4 left-6 right-6 md:left-10 md:right-10 h-1 bg-gray-200 rounded-full z-0" />
      <div
        className="absolute top-4 left-6 md:left-10 h-1 bg-yellow-400 rounded-full z-0 transition-all duration-700 ease-in-out"
        style={{ width: `${progress}%` }}
      />
      <div className="relative z-10 flex justify-between">
        {steps.map((s) => {
          const isActive  = step >= s.num;
          const isCurrent = step === s.num && step !== 6;
          const Icon      = s.icon;
          return (
            <div key={s.num} className="flex flex-col items-center">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-[3px] md:border-4 transition-all duration-500 transform ${
                isActive
                  ? 'bg-yellow-400 border-yellow-100 text-slate-900 scale-110 shadow-lg shadow-yellow-400/20'
                  : 'bg-white border-gray-200 text-gray-400 scale-100'
              }`}>
                {isActive && !isCurrent
                  ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                  : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
              <span className={`text-[9px] md:text-xs mt-2 font-bold transition-colors duration-300 hidden sm:block ${
                isActive ? 'text-slate-800' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}