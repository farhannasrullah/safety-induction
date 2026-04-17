// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { HardHat, LayoutDashboard } from 'lucide-react';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

import { auth, db } from './config/firebase';
import { APP_ID, ADMIN_SESSION_DURATION_MS, NOTIFICATION_DURATION_MS } from './config/constants';
import useSessionState from './hooks/useSessionState';

import Notification from './components/common/Notification';
import Header from './components/common/Header';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import UserWizard from './components/user/UserWizard';

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [viewMode, setViewMode] = useSessionState('si_viewMode', 'user', (v) => v, String);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useSessionState('si_isAdminLoggedIn', false, (v) => v === 'true', String);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminData, setAdminData] = useState([]);

  const [notification, setNotification] = useState({ msg: '', type: '' });

  const showNotification = useCallback((msg, type = 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: '', type: '' }), NOTIFICATION_DURATION_MS);
  }, []);

  const handleAdminLogout = useCallback(() => {
    setIsAdminLoggedIn(false);
    setViewMode('user');
    sessionStorage.removeItem('si_isAdminLoggedIn');
    sessionStorage.removeItem('admin_login_time');
    showNotification("Anda telah keluar dari mode Admin.", "success");
  }, [setIsAdminLoggedIn, setViewMode, showNotification]);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const loginTime = parseInt(sessionStorage.getItem('admin_login_time') || '0', 10);
    const elapsed   = Date.now() - loginTime;

    if (elapsed >= ADMIN_SESSION_DURATION_MS) {
      handleAdminLogout();
      showNotification("Sesi Admin telah berakhir. Silakan login kembali.", "error");
      return;
    }

    const id = setTimeout(() => {
      handleAdminLogout();
      showNotification("Sesi Admin telah berakhir (Timeout 1 Jam).", "error");
    }, ADMIN_SESSION_DURATION_MS - elapsed);

    return () => clearTimeout(id);
  }, [isAdminLoggedIn, handleAdminLogout, showNotification]);

  useEffect(() => {
    const signIn = async () => {
      try {
        // eslint-disable-next-line no-undef
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          // eslint-disable-next-line no-undef
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch {
        showNotification("Gagal terhubung ke server keamanan.", "error");
        setIsAppLoading(false);
      }
    };
    signIn();

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAppLoading(false);
    });
    return () => unsub();
  }, [showNotification]);

  useEffect(() => {
    if (viewMode !== 'admin' || !isAdminLoggedIn || !user) return;
    setIsAdminLoading(true);

    const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'inductions');
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        setAdminData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setIsAdminLoading(false);
      },
      (err) => {
        console.error('[Firestore] snapshot error:', err);
        setIsAdminLoading(false);
        showNotification("Gagal memuat data. Periksa koneksi Anda.", "error");
      }
    );
    return () => unsub();
  }, [viewMode, isAdminLoggedIn, user, showNotification]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewMode]);

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-400 rounded-full blur-[120px] opacity-20" />
        </div>
        <div className="flex flex-col items-center z-10 animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-60 animate-pulse" />
            <div className="bg-slate-900 p-5 rounded-3xl shadow-2xl relative animate-pulse border border-slate-700">
              <HardHat className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
          <h2 className="mt-8 text-xl font-extrabold text-slate-900 tracking-widest">MEMUAT SISTEM</h2>
          <p className="text-slate-500 text-xs font-medium mt-2">Digital Safety Induction</p>
          <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden relative">
            <div className="absolute top-0 bottom-0 bg-yellow-400 rounded-full" style={{ animation: 'loadingBar 1.5s infinite ease-in-out', width: '40%' }} />
          </div>
        </div>
        <style>{`
          @keyframes loadingBar { 0%{left:-40%}50%{left:30%}100%{left:100%} }
          @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards }
        `}</style>
      </div>
    );
  }

  const isAdminFullView = viewMode === 'admin' && isAdminLoggedIn;

  return (
    <>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-40px)} to{opacity:1;transform:translateY(0)} }
        .animate-slide-down { animation: slideDown 0.4s ease-out forwards }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards }
        .custom-scrollbar::-webkit-scrollbar { height:8px;width:8px }
        .custom-scrollbar::-webkit-scrollbar-track { background:#f1f5f9;border-radius:4px }
        .custom-scrollbar::-webkit-scrollbar-thumb { background:#cbd5e1;border-radius:4px }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background:#94a3b8 }
      `}</style>

      <div className="min-h-screen font-sans text-slate-800 selection:bg-yellow-400 selection:text-slate-900 bg-slate-50 flex flex-col relative">
        <Notification msg={notification.msg} type={notification.type} />

        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25]"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 via-white/90 to-slate-100/95 backdrop-blur-[2px]" />
        </div>

        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          isAdminLoggedIn={isAdminLoggedIn}
          handleAdminLogout={handleAdminLogout}
        />

        <div className="relative z-10 flex flex-col min-h-screen w-full pt-20 md:pt-24">
          <main className={`mx-auto p-4 pb-8 relative flex-grow w-full transition-all ${
            isAdminFullView ? 'max-w-7xl' : viewMode === 'user' ? 'max-w-5xl' : 'max-w-md'
          }`}>
            {viewMode === 'admin' && !isAdminLoggedIn && (
              <AdminLogin
                setIsAdminLoggedIn={setIsAdminLoggedIn}
                showNotification={showNotification}
              />
            )}

            {isAdminFullView && (
              <AdminDashboard
                adminData={adminData}
                isAdminLoading={isAdminLoading}
                showNotification={showNotification}
              />
            )}

            {viewMode === 'user' && (
              <UserWizard
                user={user}
                showNotification={showNotification}
              />
            )}
          </main>

          <footer className="text-center pb-8 pt-4 mt-auto text-xs font-medium text-slate-500 relative z-10">
            <p>&copy; 2026 Digital Safety Induction.</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span>Developed by Farhan Nasrullah</span>
              {viewMode === 'user' && (
                <>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setViewMode('admin')}
                    className="hover:text-slate-900 flex items-center gap-1 transition-colors"
                    aria-label="Buka Panel Admin"
                  >
                    <LayoutDashboard className="w-3 h-3" /> Admin
                  </button>
                </>
              )}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}