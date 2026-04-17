// src/utils/helpers.js
import { GAS_URL } from '../config/constants';

export const getTodayDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now - offset).toISOString().split('T')[0];
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "Baru saja";
  const date = timestamp.toDate ? timestamp.toDate() : new Date();
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
};

export const sanitizeText = (str = '') =>
  String(str).replace(/[<>]/g, '').trim().slice(0, 200);

export const gasPost = (payload) =>
  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => console.warn('[GAS] post failed:', err));