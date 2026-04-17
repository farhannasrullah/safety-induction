// src/components/user/Step2Video.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayCircle, Unlock, Lock } from 'lucide-react';
import { MIN_WATCH_SECONDS } from '../../config/constants';

export default function Step2Video({ setStep, showNotification }) {
  const videoRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [watchTime, setWatchTime] = useState(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      lastTimeRef.current = 0;
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsVideoFinished(true);
    setWatchTime(MIN_WATCH_SECONDS);
  }, []);

  const handleVideoTimeUpdate = useCallback((e) => {
    const video = e.target;
    const current = video.currentTime;
    const last = lastTimeRef.current;

    if (current > last + 1.5) {
      video.currentTime = last;
      showNotification("Tidak boleh skip video!", "error");
      return;
    }

    const delta = current - last;
    if (delta > 0 && delta < 1) {
      setWatchTime((prev) => Math.min(prev + delta, MIN_WATCH_SECONDS));
    }
    lastTimeRef.current = current;
  }, [showNotification]);

  const handleVideoSeeking = useCallback((e) => {
    const video = e.target;
    if (video.currentTime > lastTimeRef.current + 0.5) {
      video.currentTime = lastTimeRef.current;
      showNotification("Tidak bisa mempercepat video!", "error");
    }
  }, [showNotification]);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in-up border border-gray-100 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="bg-blue-50 w-16 h-16 rounded-2xl text-blue-600 mx-auto flex items-center justify-center mb-4 shadow-sm border border-blue-100">
          <PlayCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Materi Edukasi K3</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
          Tonton video panduan keselamatan kerja ini tanpa dipercepat (skip) untuk mengaktifkan tombol ke tahap berikutnya.
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-inner ring-4 ring-slate-50 mb-8 w-full aspect-video">
        <video
          ref={videoRef}
          controls
          onEnded={handleVideoEnded}
          onTimeUpdate={handleVideoTimeUpdate}
          onSeeking={handleVideoSeeking}
          className="w-full h-full object-contain opacity-95 hover:opacity-100 transition-opacity"
          poster="https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=800&auto=format&fit=crop"
          preload="metadata"
          playsInline
        >
          <source src="https://res.cloudinary.com/dqsz8sfrw/video/upload/v1776147611/SAFETY_INDUCTION_5_2_rgocpr.mp4" type="video/mp4" />
          Browser tidak mendukung pemutar video.
        </video>
        {!isVideoFinished && (
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none border border-white/20">
            <span className="relative flex h-2.5 w-2.5">

            </span>
          </div>
        )}
      </div>

      <div className="flex gap-4 flex-col sm:flex-row">
        <button
          onClick={() => setStep(1)}
          className="sm:w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors"
        >
          Kembali
        </button>
        <button
          onClick={() => {
            if (watchTime >= MIN_WATCH_SECONDS) setStep(3);
            else showNotification(`Tonton minimal ${MIN_WATCH_SECONDS} detik dulu!`, "error");
          }}
          disabled={watchTime < MIN_WATCH_SECONDS}
          aria-disabled={watchTime < MIN_WATCH_SECONDS}
          className={`flex-1 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${
            watchTime >= MIN_WATCH_SECONDS
              ? "bg-yellow-400 hover:bg-yellow-500 text-slate-900 shadow-lg hover:-translate-y-1"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-200"
          }`}
        >
          {watchTime >= MIN_WATCH_SECONDS
            ? <><Unlock className="w-5 h-5" /> Lanjut ke Poster</>
            : <><Lock className="w-5 h-5" /> Lihat Video {Math.ceil(MIN_WATCH_SECONDS - watchTime)} detik</>}
        </button>
      </div>
    </div>
  );
}