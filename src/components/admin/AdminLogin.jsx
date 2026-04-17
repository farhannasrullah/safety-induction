// src/components/admin/AdminLogin.jsx
import React, { useState } from 'react';
import { Lock, AlertTriangle, User, Key, ArrowRight } from 'lucide-react';
import { ADMIN_CREDENTIALS } from '../../config/constants';

export default function AdminLogin({ setIsAdminLoggedIn, showNotification }) {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (
      loginForm.username === ADMIN_CREDENTIALS.username &&
      loginForm.password === ADMIN_CREDENTIALS.password
    ) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('si_isAdminLoggedIn', 'true');
      sessionStorage.setItem('admin_login_time', Date.now().toString());
      setLoginError('');
      setLoginForm({ username: '', password: '' });
      showNotification("Berhasil masuk ke Dashboard Admin.", "success");
    } else {
      setLoginError("Username atau password salah!");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in-up border border-gray-100 max-w-md mx-auto mt-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-slate-700" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Akses Terbatas</h2>
        <p className="text-sm text-slate-500 mt-1">Silakan masukkan kredensial administrator.</p>
      </div>
      {loginError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {loginError}
        </div>
      )}
      <form onSubmit={handleAdminLogin} className="space-y-5" noValidate>
        <div className="group">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2" htmlFor="admin-user">Username</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              id="admin-user"
              type="text"
              autoComplete="username"
              value={loginForm.username}
              onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium"
              placeholder="Masukkan username"
              required
            />
          </div>
        </div>
        <div className="group">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2" htmlFor="admin-pass">Password</label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              id="admin-pass"
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium"
              placeholder="Masukkan password"
              required
            />
          </div>
        </div>
        <button type="submit" className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors">
          Masuk Dashboard <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}