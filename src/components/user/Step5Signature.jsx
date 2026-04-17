// src/components/user/Step5Signature.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PenTool, RefreshCcw, CheckCircle } from 'lucide-react';

export default function Step5Signature({
  quizScore, canvasRef, hasSignature, setHasSignature,
  handleSubmit, isSubmitting, setStep, showNotification
}) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      canvas.width  = canvas.parentElement.clientWidth - 4;
      canvas.height = 200;
      setHasSignature(false);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [canvasRef, setHasSignature]);

  const getCanvasPos = (e, rect) => {
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      showNotification("Mohon centang persetujuan terlebih dahulu.", "error");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const { x, y } = getCanvasPos(e, rect);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  }, [agreedToTerms, showNotification, canvasRef]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const rect   = canvas.getBoundingClientRect();
    const { x, y } = getCanvasPos(e, rect);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    setHasSignature(true);
  }, [canvasRef, setHasSignature]);

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, [canvasRef, setHasSignature]);

  return (
    <div className="bg-white rounded-3xl shadow-xl animate-fade-in-up border border-gray-100 overflow-hidden flex flex-col md:flex-row max-w-5xl mx-auto">
      <div className="md:w-1/2 p-8 md:p-12 bg-slate-50 border-r border-gray-100 flex flex-col h-full">
        <div className="mb-6 flex items-start gap-4">
          <div className="bg-yellow-100 w-14 h-14 flex items-center justify-center rounded-2xl text-yellow-600 shrink-0">
            <PenTool className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Pengesahan Akhir</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Skor Evaluasi:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${quizScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {quizScore}%
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl text-sm text-slate-600 shadow-sm flex-grow flex flex-col justify-center">
          <p className="font-bold text-slate-800 mb-3 text-base">Pernyataan Komitmen:</p>
          <ol className="list-decimal pl-5 space-y-2 font-medium text-slate-700 leading-snug">
            <li>Mematuhi seluruh peraturan yang berlaku di area proyek.</li>
            <li>Menggunakan APD dengan benar dan bekerja sesuai prosedur keselamatan.</li>
            <li>Berpartisipasi aktif dalam kegiatan keselamatan.</li>
            <li>Melaporkan potensi bahaya, kondisi tidak aman, dan kecelakaan kerja.</li>
            <li>Menjaga kebersihan lingkungan kerja serta siap menghadapi kondisi darurat.</li>
          </ol>
        </div>
      </div>

      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-between">
        <label className="mt-2 mb-8 flex items-center gap-3 cursor-pointer p-4 bg-white hover:bg-blue-50 rounded-xl transition-colors border-2 border-gray-200 hover:border-blue-300 shadow-sm group">
          <input
            type="checkbox"
            className="w-6 h-6 rounded border-gray-300 accent-slate-900"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            aria-label="Setuju dengan pernyataan komitmen"
          />
          <span className="font-extrabold text-slate-800 text-sm select-none group-hover:text-blue-900">
            Saya menyetujui pernyataan komitmen.
          </span>
        </label>

        <div className="mb-8 flex-grow flex flex-col">
          <div className="flex justify-between items-end mb-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tanda Tangan Digital
            </label>
            {hasSignature && (
              <button
                onClick={clearSignature}
                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCcw className="w-3 h-3" /> Bersihkan
              </button>
            )}
          </div>
          <div className={`flex-grow border-2 border-dashed rounded-2xl bg-white overflow-hidden relative transition-colors min-h-[220px] ${
            agreedToTerms ? 'border-yellow-400 ring-4 ring-yellow-50' : 'border-gray-200 opacity-70'
          }`}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ touchAction: 'none' }}
              className={`bg-[#fafafa] w-full h-full absolute inset-0 ${agreedToTerms ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
              aria-label="Area tanda tangan digital"
              role="img"
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                <PenTool className="w-10 h-10 mb-3 opacity-30" />
                <span className="font-medium text-sm px-4 text-center">
                  {agreedToTerms
                    ? "Goreskan tanda tangan di area ini"
                    : "Centang persetujuan di atas terlebih dahulu"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setStep(4)} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors">
            Kembali
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasSignature}
            aria-busy={isSubmitting}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? <><RefreshCcw className="w-5 h-5 animate-spin" /> Menyimpan...</>
              : <>Kirim Data <CheckCircle className="w-5 h-5 text-yellow-400" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}