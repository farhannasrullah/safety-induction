// src/components/user/Step3Poster.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Info, Maximize2, ChevronLeft, ChevronRight, CheckCircle, Lock, Minimize2, X } from 'lucide-react';
import { POSTER_URLS } from '../../config/constants';

export default function Step3Poster({ setStep, showNotification }) {
  const [currentPoster, setCurrentPoster] = useState(0);
  const [isPosterMaximized, setIsPosterMaximized] = useState(false);
  const [viewedPosters, setViewedPosters] = useState([0]);

  const allPostersViewed = useMemo(
    () => viewedPosters.length === POSTER_URLS.length,
    [viewedPosters]
  );

  const markPosterViewed = useCallback((index) => {
    setViewedPosters((prev) =>
      prev.includes(index) ? prev : [...prev, index]
    );
  }, []);

  useEffect(() => { markPosterViewed(currentPoster); }, [currentPoster, markPosterViewed]);

  const goToPoster = useCallback((index) => setCurrentPoster(index), []);

  const nextPoster = useCallback(() => {
    setCurrentPoster((prev) => {
      const next = Math.min(prev + 1, POSTER_URLS.length - 1);
      markPosterViewed(next);
      return next;
    });
  }, [markPosterViewed]);

  const prevPoster = useCallback(() => {
    setCurrentPoster((prev) => {
      const next = Math.max(prev - 1, 0);
      markPosterViewed(next);
      return next;
    });
  }, [markPosterViewed]);

  return (
    <>
      <div className="bg-white rounded-3xl shadow-xl animate-fade-in-up border border-gray-100 overflow-hidden flex flex-col md:flex-row max-w-6xl mx-auto min-h-[600px]">
        <div className="md:w-5/12 bg-slate-900 border-r border-gray-100 relative overflow-hidden flex flex-col justify-center p-8 md:p-12">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <h3 className="text-white font-extrabold text-3xl flex items-center gap-3 mb-4">
            <Info className="w-8 h-8 text-yellow-400" />
            Poster<br />Keselamatan
          </h3>
          <p className="text-slate-400 text-base leading-relaxed">
            Perhatikan petunjuk visual K3 ini dengan saksama. Informasi pada poster ini akan menjadi referensi penting Anda dalam menjawab evaluasi di tahap selanjutnya.
          </p>
        </div>

        <div className="md:w-7/12 p-6 md:p-8 pb-24 md:pb-8 flex flex-col bg-slate-50 relative">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-sm font-bold text-slate-700">
              Poster {currentPoster + 1} dari {POSTER_URLS.length}
            </div>
            <button
              onClick={() => setIsPosterMaximized(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 font-bold shadow-sm transition-colors"
              aria-label="Maksimalkan poster"
            >
              <Maximize2 className="w-4 h-4" /> Maksimalkan
            </button>
          </div>

          <div className="flex-grow w-full flex items-center justify-center mb-5 relative rounded-2xl bg-white border border-gray-200 shadow-inner p-2 md:p-4 overflow-hidden">
            <img
              key={currentPoster}
              src={POSTER_URLS[currentPoster]}
              alt={`Poster keselamatan ${currentPoster + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-auto max-h-[60vh] md:max-h-[70vh] object-contain rounded-xl drop-shadow-sm select-none"
              onLoad={() => markPosterViewed(currentPoster)}
              draggable="false"
            />
            <button
              onClick={prevPoster}
              disabled={currentPoster === 0}
              className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg transition-all border ${
                currentPoster === 0
                  ? "bg-white/70 text-gray-300 border-gray-200 cursor-not-allowed"
                  : "bg-slate-900/90 text-white border-white/10 hover:bg-slate-800 hover:scale-105"
              }`}
              aria-label="Poster sebelumnya"
            ><ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            <button
              onClick={nextPoster}
              disabled={currentPoster === POSTER_URLS.length - 1}
              className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg transition-all border ${
                currentPoster === POSTER_URLS.length - 1
                  ? "bg-white/70 text-gray-300 border-gray-200 cursor-not-allowed"
                  : "bg-slate-900/90 text-white border-white/10 hover:bg-slate-800 hover:scale-105"
              }`}
              aria-label="Poster berikutnya"
            ><ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          </div>

          <div className="flex justify-center gap-2 mb-4 flex-wrap" role="tablist" aria-label="Navigasi poster">
            {POSTER_URLS.map((_, index) => (
              <button
                key={index}
                role="tab"
                aria-selected={index === currentPoster}
                onClick={() => goToPoster(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentPoster
                    ? "w-8 bg-blue-500"
                    : viewedPosters.includes(index)
                    ? "w-2.5 bg-emerald-400"
                    : "w-2.5 bg-gray-300"
                }`}
                aria-label={`Buka poster ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-medium text-slate-500">
              {allPostersViewed
                ? "Semua poster sudah dilihat. Tombol lanjut sudah aktif."
                : "Harus melihat semua poster dulu sebelum lanjut."}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {viewedPosters.length}/{POSTER_URLS.length}
            </span>
          </div>

          <div className="flex gap-4 w-full mt-auto">
            <button
              onClick={() => setStep(2)}
              className="w-1/3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-2xl transition-colors shadow-sm"
            >
              Kembali
            </button>
            <button
              onClick={() => {
                if (allPostersViewed) setStep(4);
                else showNotification("Harus melihat semua poster dulu sebelum lanjut.", "error");
              }}
              disabled={!allPostersViewed}
              aria-disabled={!allPostersViewed}
              className={`w-2/3 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all transform ${
                allPostersViewed
                  ? "bg-slate-900 hover:bg-slate-800 text-white hover:-translate-y-1 hover:shadow-slate-900/20"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-200"
              }`}
            >
              {allPostersViewed
                ? <><CheckCircle className="w-5 h-5" /> Paham &amp; Lanjut Kuis</>
                : <><Lock className="w-5 h-5" /> Lihat Semua Poster</>}
            </button>
          </div>
        </div>
      </div>

      {isPosterMaximized && (
        <div
          className="fixed top-20 md:top-24 left-0 right-0 bottom-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Poster diperbesar"
        >
          <div className="w-full max-w-7xl h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] bg-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
              <div className="text-white font-bold">
                Poster {currentPoster + 1} / {POSTER_URLS.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPosterMaximized(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-colors"
                >
                  <Minimize2 className="w-4 h-4" /> Kecilkan
                </button>
                <button
                  onClick={() => setIsPosterMaximized(false)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-colors"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
              <img
                key={`max-${currentPoster}`}
                src={POSTER_URLS[currentPoster]}
                alt={`Poster keselamatan ${currentPoster + 1}`}
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-full object-contain select-none"
                onLoad={() => markPosterViewed(currentPoster)}
                draggable="false"
              />
              <button
                onClick={prevPoster}
                disabled={currentPoster === 0}
                className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all border ${
                  currentPoster === 0
                    ? "bg-white/10 text-white/30 border-white/10 cursor-not-allowed"
                    : "bg-white/10 text-white border-white/15 hover:bg-white/20"
                }`}
                aria-label="Poster sebelumnya"
              ><ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" /></button>
              <button
                onClick={nextPoster}
                disabled={currentPoster === POSTER_URLS.length - 1}
                className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all border ${
                  currentPoster === POSTER_URLS.length - 1
                    ? "bg-white/10 text-white/30 border-white/10 cursor-not-allowed"
                    : "bg-white/10 text-white border-white/15 hover:bg-white/20"
                }`}
                aria-label="Poster berikutnya"
              ><ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" /></button>
            </div>

            <div className="p-4 border-t border-white/10 flex items-center justify-center gap-2 bg-slate-950 flex-wrap">
              {POSTER_URLS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPoster(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentPoster ? "w-8 bg-blue-500"
                    : viewedPosters.includes(index) ? "w-2.5 bg-emerald-400"
                    : "w-2.5 bg-white/30"
                  }`}
                  aria-label={`Buka poster ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}