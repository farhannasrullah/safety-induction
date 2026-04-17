// src/components/common/Header.jsx
import React from 'react';
import { LayoutDashboard, HardHat, ArrowLeft, LogOut } from 'lucide-react';

export default function Header({ viewMode, setViewMode, isAdminLoggedIn, handleAdminLogout }) {
  const isAdminFullView = viewMode === 'admin' && isAdminLoggedIn;
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
      <div className={`mx-auto p-4 flex items-center justify-between gap-3 transition-all ${
        isAdminFullView ? 'max-w-7xl' : viewMode === 'user' ? 'max-w-5xl' : 'max-w-md'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shadow-sm ${viewMode === 'admin' ? 'bg-slate-900 text-white' : 'bg-yellow-400 text-slate-900'}`}>
            {viewMode === 'admin'
              ? <LayoutDashboard className="w-7 h-7" />
              : <HardHat className="w-7 h-7" />}
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 tracking-wide uppercase leading-tight flex items-center gap-2">
              Safety Induction
              {viewMode === 'admin' && (
                <span className="text-[10px] md:text-xs bg-slate-900 text-yellow-400 px-2 py-0.5 rounded-md font-bold tracking-wider ml-1 hidden sm:inline-block">
                  {isAdminLoggedIn ? 'ADMIN' : 'LOGIN'}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {viewMode === 'admin'
                ? 'Database Administrator'
                : 'Proyek Sekolah Rakyat Kab. Kediri'}
            </p>
          </div>
        </div>

        {viewMode === 'admin' && (
          <div className="flex gap-2">
            {isAdminLoggedIn ? (
              <>
                <button
                  onClick={() => setViewMode('user')}
                  className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 hidden sm:block" /> Home
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-100 shadow-sm"
                >
                  <LogOut className="w-4 h-4 hidden sm:block" /> Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setViewMode('user')}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}