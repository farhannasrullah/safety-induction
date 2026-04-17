// src/components/common/Notification.jsx
import React, { memo } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const Notification = memo(({ msg, type }) => {
  if (!msg) return null;
  const isSuccess = type === 'success';
  return (
    <div className="fixed top-4 left-0 right-0 z-[999999] animate-slide-down flex justify-center pointer-events-none px-4">
      <div className={`backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border w-auto max-w-xl mx-auto ring-4 transition-all ${
        isSuccess
          ? 'bg-green-500/95 border-green-400 ring-green-500/20'
          : 'bg-red-500/95 border-red-400 ring-red-500/20'
      }`}>
        {isSuccess
          ? <CheckCircle className="w-6 h-6 shrink-0" />
          : <AlertTriangle className="w-6 h-6 shrink-0 animate-pulse" />}
        <p className="text-sm font-bold tracking-wide">{msg}</p>
      </div>
    </div>
  );
});

export default Notification;