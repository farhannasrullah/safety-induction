import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo
} from 'react';
import {
  ShieldCheck, User, Building, Phone, PlayCircle, PenTool,
  CheckCircle, ArrowRight, AlertTriangle, RefreshCcw, Lock, Unlock,
  Info, FileSignature, HardHat, Users, LayoutDashboard, Search,
  Calendar, ArrowUpDown, ArrowLeft, Image as ImageIcon, Key, LogOut,
  Briefcase, Hash, ClipboardList, ChevronDown, XCircle, FileImage,
  Edit, Trash2, X, Award, ChevronLeft, ChevronRight, Maximize2, Minimize2
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore, collection, addDoc, serverTimestamp,
  onSnapshot, doc, updateDoc, deleteDoc
} from 'firebase/firestore';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB1uQ54DGbQMiW-Ho8wPc1mNvld0cZUHyA",
  authDomain: "safety-inductpwr.firebaseapp.com",
  projectId: "safety-inductpwr",
  storageBucket: "safety-inductpwr.firebasestorage.app",
  messagingSenderId: "54533735940",
  appId: "1:54533735940:web:98794aa5f3be22a1c6d751",
  measurementId: "G-8FWZ263B1B",
};

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzHUPGotfcGW5AOukI9lJ6Mo1ceI6qXvLvwjgzGcaz8nb4rIO_WDsnKZ61sm5_lS2-Z/exec";

const APP_ID =
  typeof __app_id !== 'undefined' ? __app_id : 'safety-induction-app'; // eslint-disable-line no-undef

const MIN_WATCH_SECONDS = 10;
const ADMIN_SESSION_DURATION_MS = 3_600_000; // 1 hour
const NOTIFICATION_DURATION_MS = 5_000;

// Credentials stored as env-like constants — swap to env vars in a real build pipeline
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

const POSTER_URLS = [
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428418/INFO_KESELAMATAN_PROYEK_mohlt2.png",
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428417/KETINGGIAN_xgcnzm.png",
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428415/KELISTRIKAN_fajkil.png",
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428414/PLASTER_DINDING_h19heu.png",
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428412/PENGECORAN_yzyadu.png",
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428411/LIFTING_czzpvr.png",
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428410/SAFETY_ZONE_znk8vv.png",
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428408/PENGELASAN_cfbtjs.png",
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428404/SCAFHOLDING_s6d03s.png",
  "https://res.cloudinary.com/dqsz8sfrw/image/upload/v1776428405/SAFETY_INDUCTION_A3_yfgikq.png",
];

const QUIZ_DATA = [
  {
    id: 1,
    question: "Apa nama proyek tempat Anda bekerja saat ini?",
    options: [
      "Proyek Pembangunan Jalan Tol",
      "Proyek Pembangunan Sekolah Rakyat Jatim 3 Kabupaten Kediri",
      "Proyek Pembangunan Perumahan",
    ],
    correctIndex: 1,
  },
  {
    id: 2,
    question: "APD wajib yang harus digunakan di area proyek adalah...",
    options: [
      "Safety helmet, vest, dan sepatu safety",
      "Masker saja",
      "Helm dan sandal",
    ],
    correctIndex: 0,
  },
  {
    id: 3,
    question: "Saat bekerja di ketinggian, pekerja harus menggunakan...",
    options: ["Helm saja", "Sarung tangan", "Full Body Harness"],
    correctIndex: 2,
  },
  {
    id: 4,
    question: "Saat melakukan pekerjaan pengelasan, pekerja harus menggunakan...",
    options: ["Kacamata biasa", "Helm proyek", "Helm las dan sarung tangan las"],
    correctIndex: 2,
  },
  {
    id: 5,
    question: "APAR adalah alat yang digunakan untuk...",
    options: [
      "Memadamkan api ringan/kebakaran kecil",
      "Membersihkan alat kerja",
      "Mengukur suhu",
    ],
    correctIndex: 0,
  },
  {
    id: 6,
    isAnalysis: true,
    question:
      "Apakah video induction dan poster keselamatan membantu Anda memahami informasi dan potensi bahaya di area proyek?",
    options: ["Tidak membantu", "Cukup membantu", "Sangat membantu"],
  },
  {
    id: 7,
    isAnalysis: true,
    question:
      "Apakah penggunaan web aplikasi ini mempermudah proses safety induction?",
    options: ["Tidak efektif", "Cukup efektif", "Sangat efektif"],
  },
];

const SCORED_QUESTIONS = QUIZ_DATA.filter((q) => !q.isAnalysis);
const EMPTY_FORM = {
  nama: '', noPribadi: '', instansi: '',
  posisi: '', kontakDarurat: '', hubunganKontak: '',
};

// ─────────────────────────────────────────────
// FIREBASE — singleton guard
// ─────────────────────────────────────────────
const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const getTodayDate = () => {
  const now    = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now - offset).toISOString().split('T')[0];
};

const formatDate = (timestamp) => {
  if (!timestamp) return "Baru saja";
  const date = timestamp.toDate ? timestamp.toDate() : new Date();
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const sanitizeText = (str = '') =>
  String(str).replace(/[<>]/g, '').trim().slice(0, 200);

/** Send data to Google Apps Script — fire-and-forget (no-cors) */
const gasPost = (payload) =>
  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => console.warn('[GAS] post failed:', err));

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────

/** Debounce a value by `delay` ms */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Persist a value in sessionStorage */
function useSessionState(key, defaultValue, parse = JSON.parse, stringify = JSON.stringify) {
  const [state, setState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(key, stringify(state));
    } catch { /* quota exceeded — silently ignore */ }
  }, [key, state, stringify]);
  return [state, setState];
}

// ─────────────────────────────────────────────
// SMALL MEMOISED SUB-COMPONENTS
// ─────────────────────────────────────────────

/** Global toast notification */
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

/** Score badge used in admin table */
const ScoreBadge = memo(({ score }) => {
  const pct = parseInt(score, 10);
  const cls = pct >= 80
    ? 'bg-green-100 text-green-700'
    : pct >= 60
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ${cls}`}>
      <Award className="w-3.5 h-3.5" />
      {score || '0%'}
    </div>
  );
});

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  // ── App init ──────────────────────────────
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser]                 = useState(null);

  // ── View ──────────────────────────────────
  const [viewMode, setViewMode] = useSessionState(
    'si_viewMode', 'user',
    (v) => v, String
  );

  // ── User wizard state ─────────────────────
  const [step, setStep] = useSessionState(
    'si_step', 1,
    (v) => parseInt(v, 10), String
  );
  const [formData, setFormData] = useSessionState('si_formData', EMPTY_FORM);
  const [quizAnswers, setQuizAnswers] = useSessionState('si_quizAnswers', {});
  const [quizScore, setQuizScore]     = useSessionState(
    'si_quizScore', 0,
    (v) => parseInt(v, 10), String
  );

  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing,  setIsFinishing]  = useState(false);

  // ── Notification ──────────────────────────
  const notifTimerRef = useRef(null);
  const [notification, setNotification] = useState({ msg: '', type: '' });

  const showNotification = useCallback((msg, type = 'error') => {
    clearTimeout(notifTimerRef.current);
    setNotification({ msg, type });
    notifTimerRef.current = setTimeout(
      () => setNotification({ msg: '', type: '' }),
      NOTIFICATION_DURATION_MS
    );
  }, []);

  // Cleanup notif timer on unmount
  useEffect(() => () => clearTimeout(notifTimerRef.current), []);

  // ── Video ──────────────────────────────────
  const videoRef         = useRef(null);
  const lastTimeRef      = useRef(0);
  const maxTimeRef       = useRef(0);
  const [watchTime, setWatchTime]     = useState(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  // Reset video on mount
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
    const last    = lastTimeRef.current;

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

  // ── Poster ────────────────────────────────
  const [currentPoster, setCurrentPoster]         = useState(0);
  const [isPosterMaximized, setIsPosterMaximized] = useState(false);
  const [viewedPosters, setViewedPosters]         = useState([0]);

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

  // ── Signature ─────────────────────────────
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const canvasRef    = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature]   = useState(false);

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
  }, [agreedToTerms, showNotification]);

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
  }, []);

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, []);

  // Resize canvas when step 5 is active
  useEffect(() => {
    if (viewMode !== 'user' || step !== 5) return;
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
  }, [step, viewMode, isAppLoading]);

  // ── Admin ─────────────────────────────────
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useSessionState(
    'si_isAdminLoggedIn', false,
    (v) => v === 'true', String
  );
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isCRUDLoading, setIsCRUDLoading]   = useState(false);
  const [loginForm, setLoginForm]           = useState({ username: '', password: '' });
  const [loginError, setLoginError]         = useState('');
  const [adminData, setAdminData]           = useState([]);
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterDate, setFilterDate]         = useState(getTodayDate());
  const [sortOrder, setSortOrder]           = useState('desc');
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [deleteData, setDeleteData]         = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData]             = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 250);

  // ── Admin session timeout ──────────────────
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
  }, [isAdminLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Firebase auth ──────────────────────────
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Firestore realtime listener ────────────
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
  }, [viewMode, isAdminLoggedIn, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to top on step/view change ─────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, viewMode]);

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: sanitizeText(value) }));
  }, [setFormData]);

  const validateForm = useCallback(() => {
    const required = ['nama', 'noPribadi', 'instansi', 'posisi', 'kontakDarurat', 'hubunganKontak'];
    if (required.some((k) => !formData[k]?.trim())) {
      showNotification("Harap lengkapi semua kolom identitas, pekerjaan, dan kontak darurat Anda.", "error");
      return;
    }
    setNotification({ msg: '', type: '' });
    setStep(2);
  }, [formData, setStep, showNotification]);

  const handleQuizChange = useCallback((questionId, optionIndex) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setWrongAnswers((prev) => prev.filter((id) => id !== questionId));
  }, [setQuizAnswers]);

  const validateQuiz = useCallback(() => {
    const allAnswered = QUIZ_DATA.every((q) => quizAnswers[q.id] !== undefined);
    if (!allAnswered) {
      showNotification("Harap jawab semua pertanyaan (termasuk pertanyaan umpan balik).", "error");
      return;
    }

    let correct = 0;
    const errors = [];
    SCORED_QUESTIONS.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) correct++;
      else errors.push(q.id);
    });

    const score = Math.round((correct / SCORED_QUESTIONS.length) * 100);
    setQuizScore(score);
    setWrongAnswers(errors);
    showNotification(`Evaluasi selesai. Skor Anda: ${score}%`, "success");
    setStep(5);
  }, [quizAnswers, setQuizScore, setStep, showNotification]);

  const handleSubmit = useCallback(async () => {
    if (!hasSignature) {
      showNotification("Silakan berikan tanda tangan digital Anda.", "error");
      return;
    }
    setIsSubmitting(true);

    try {
      const signatureDataUrl = canvasRef.current.toDataURL("image/png");

      const getAnalysisText = (id) => {
        const q   = QUIZ_DATA.find((item) => item.id === id);
        const idx = quizAnswers[id];
        return q && idx !== undefined ? q.options[idx] : "";
      };

      const analisisVideo = getAnalysisText(6);
      const analisisWeb   = getAnalysisText(7);

      const inductionsRef = collection(
        db, 'artifacts', APP_ID, 'public', 'data', 'inductions'
      );
      const docRef = await addDoc(inductionsRef, {
        userId: user?.uid || 'anonymous',
        ...formData,
        score: `${quizScore}%`,
        signature: signatureDataUrl,
        timestamp: serverTimestamp(),
        status: 'Completed',
        analisisVideo,
        analisisWeb,
      });

      await gasPost({
        action: 'create',
        id: docRef.id,
        nama: formData.nama,
        noPribadi: `'${formData.noPribadi}`,
        instansi: formData.instansi,
        posisi: formData.posisi,
        kontakDarurat: `'${formData.kontakDarurat}`,
        hubunganKontak: formData.hubunganKontak,
        score: `${quizScore}%`,
        signature: signatureDataUrl,
        analisisVideo,
        analisisWeb,
      });

      setStep(6);
    } catch (err) {
      console.error('[Submit]', err);
      showNotification("Terjadi kesalahan. Pastikan koneksi internet stabil.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [hasSignature, quizAnswers, formData, quizScore, user, setStep, showNotification]);

  const handleFinish = useCallback(() => {
    setIsFinishing(true);
    setTimeout(() => {
      sessionStorage.clear();
      window.location.reload();
    }, 1_500);
  }, []);

  // ── Admin handlers ─────────────────────────
  const handleAdminLogin = useCallback((e) => {
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
  }, [loginForm, setIsAdminLoggedIn, showNotification]);

  const handleAdminLogout = useCallback(() => {
    setIsAdminLoggedIn(false);
    setViewMode('user');
    sessionStorage.removeItem('si_isAdminLoggedIn');
    sessionStorage.removeItem('admin_login_time');
    showNotification("Anda telah keluar dari mode Admin.", "success");
  }, [setIsAdminLoggedIn, setViewMode, showNotification]);

  const executeDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsCRUDLoading(true);
    try {
      await deleteDoc(
        doc(db, 'artifacts', APP_ID, 'public', 'data', 'inductions', deleteData.id)
      );
      await gasPost({ action: 'delete', id: deleteData.id });
      setDeleteData(null);
      showNotification("Data pengunjung berhasil dihapus.", "success");
    } catch (err) {
      console.error('[Delete]', err);
      showNotification("Gagal menghapus data dari sistem.", "error");
    } finally {
      setIsCRUDLoading(false);
    }
  }, [deleteData, showNotification]);

  const openEditModal = useCallback((item) => {
    setEditData({ ...item });
    setIsEditModalOpen(true);
  }, []);

  const executeEdit = useCallback(async (e) => {
    e.preventDefault();
    if (!editData) return;
    setIsCRUDLoading(true);
    try {
      const docRef = doc(
        db, 'artifacts', APP_ID, 'public', 'data', 'inductions', editData.id
      );
      const fields = {
        nama: sanitizeText(editData.nama),
        noPribadi: sanitizeText(editData.noPribadi),
        instansi: sanitizeText(editData.instansi),
        posisi: sanitizeText(editData.posisi),
        kontakDarurat: sanitizeText(editData.kontakDarurat),
        hubunganKontak: editData.hubunganKontak,
      };
      await updateDoc(docRef, fields);
      await gasPost({
        action: 'update',
        id: editData.id,
        ...fields,
        noPribadi: `'${fields.noPribadi}`,
        kontakDarurat: `'${fields.kontakDarurat}`,
      });
      setIsEditModalOpen(false);
      setEditData(null);
      showNotification("Data pengunjung berhasil diperbarui.", "success");
    } catch (err) {
      console.error('[Edit]', err);
      showNotification("Gagal memperbarui data.", "error");
    } finally {
      setIsCRUDLoading(false);
    }
  }, [editData, showNotification]);

  // ── Computed admin data ────────────────────
  const processedAdminData = useMemo(() => {
    let data = [...adminData];

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      data = data.filter(
        (item) =>
          item.nama?.toLowerCase().includes(lower) ||
          item.instansi?.toLowerCase().includes(lower)
      );
    }

    if (filterDate) {
      data = data.filter((item) => {
        if (!item.timestamp) return false;
        const d      = item.timestamp.toDate ? item.timestamp.toDate() : new Date();
        const offset = d.getTimezoneOffset() * 60_000;
        const local  = new Date(d - offset).toISOString().split('T')[0];
        return local === filterDate;
      });
    }

    data.sort((a, b) => {
      const ta = a.timestamp?.toMillis?.() ?? 0;
      const tb = b.timestamp?.toMillis?.() ?? 0;
      return sortOrder === 'desc' ? tb - ta : ta - tb;
    });

    return data;
  }, [adminData, debouncedSearch, filterDate, sortOrder]);

  // ── Progress bar ───────────────────────────
  const renderProgressBar = useMemo(() => {
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
  }, [step]);

  // ─────────────────────────────────────────
  // RENDER — Loading
  // ─────────────────────────────────────────
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

  // ─────────────────────────────────────────
  // RENDER — Main
  // ─────────────────────────────────────────
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

        {/* Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25]"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 via-white/90 to-slate-100/95 backdrop-blur-[2px]" />
        </div>

        {/* Header */}
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

        {/* Main */}
        <div className="relative z-10 flex flex-col min-h-screen w-full pt-20 md:pt-24">
          <main className={`mx-auto p-4 pb-8 relative flex-grow w-full transition-all ${
            isAdminFullView ? 'max-w-7xl' : viewMode === 'user' ? 'max-w-5xl' : 'max-w-md'
          }`}>

            {/* ── ADMIN: LOGIN ─────────────────────────── */}
            {viewMode === 'admin' && !isAdminLoggedIn && (
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
            )}

            {/* ── ADMIN: DASHBOARD ──────────────────────── */}
            {isAdminFullView && (
              <div className="animate-fade-in-up">
                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Cari Nama / Instansi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm"
                      aria-label="Cari data pengunjung"
                    />
                  </div>
                  <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="relative flex-1 md:w-48 min-w-[150px]">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm text-slate-700"
                        aria-label="Filter tanggal"
                      />
                    </div>
                    <button
                      onClick={() => setSortOrder((p) => p === 'desc' ? 'asc' : 'desc')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl hover:bg-slate-100 text-sm font-medium text-slate-700 whitespace-nowrap"
                    >
                      <ArrowUpDown className="w-4 h-4" /> {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                    </button>
                    {filterDate && (
                      <button
                        onClick={() => setFilterDate('')}
                        className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 text-sm font-medium"
                      >
                        Semua
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-8">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]" aria-label="Daftar data induksi">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-100 text-xs uppercase tracking-wider text-slate-500">
                          <th className="p-4 font-bold">Pengunjung / Pekerja</th>
                          <th className="p-4 font-bold">Instansi &amp; Posisi</th>
                          <th className="p-4 font-bold">Skor Evaluasi</th>
                          <th className="p-4 font-bold">Waktu Induksi</th>
                          <th className="p-4 font-bold text-center">Tanda Tangan</th>
                          <th className="p-4 font-bold text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {isAdminLoading ? (
                          <tr>
                            <td colSpan="6" className="p-16 text-center">
                              <RefreshCcw className="w-10 h-10 text-yellow-500 mx-auto mb-4 animate-spin opacity-80" />
                              <p className="font-medium text-slate-600">Sinkronisasi data sistem...</p>
                            </td>
                          </tr>
                        ) : processedAdminData.length > 0 ? (
                          processedAdminData.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-900">{item.nama}</div>
                                <div className="text-xs text-slate-500 mt-0.5">No WA : {item.noPribadi || '-'}</div>
                                <div className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                                  <CheckCircle className="w-3 h-3" /> {item.status}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-700">{item.instansi}</div>
                                <div className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate" title={item.posisi}>
                                  Posisi : {item.posisi || '-'}
                                </div>
                              </td>
                              <td className="p-4"><ScoreBadge score={item.score} /></td>
                              <td className="p-4 text-slate-600 whitespace-nowrap">{formatDate(item.timestamp)}</td>
                              <td className="p-4 text-center">
                                {item.signature ? (
                                  <button
                                    onClick={() => setSelectedSignature(item.signature)}
                                    className="inline-block relative group"
                                    aria-label={`Lihat tanda tangan ${item.nama}`}
                                  >
                                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ImageIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <img
                                      src={item.signature}
                                      alt={`Tanda tangan ${item.nama}`}
                                      loading="lazy"
                                      className="h-12 w-24 object-contain bg-white border border-gray-200 rounded-lg p-1"
                                    />
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Tidak ada</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                    aria-label={`Edit data ${item.nama}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteData(item)}
                                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    aria-label={`Hapus data ${item.nama}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="p-12 text-center text-slate-500">
                              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                              <p className="font-medium">Tidak ada data yang ditemukan.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── USER: WIZARD ───────────────────────────── */}
            {viewMode === 'user' && (
              <>
                {renderProgressBar}

                {/* STEP 1 — Registrasi */}
                {step === 1 && (
                  <div className="bg-white rounded-3xl shadow-xl animate-fade-in-up border border-gray-100 overflow-hidden flex flex-col md:flex-row max-w-5xl mx-auto">
                    <div className="w-fit md:w-5/12 bg-slate-900 text-white p-6 md:p-12 flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-400 rounded-full blur-[80px] opacity-20 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                      <ShieldCheck className="w-15 h-15 text-yellow-400 mb-6" />
                      <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">Registrasi<br />Induksi K3</h2>
                      <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                        Lengkapi profil identitas dan pekerjaan Anda untuk memulai proses edukasi dan sertifikasi keselamatan digital.
                      </p>
                    </div>

                    <div className="md:w-7/12 p-8 md:p-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        {[
                          { label: "Nama Lengkap", name: "nama", type: "text", icon: User, placeholder: "Nama Lengkap Sesuai KTP", col2: true },
                          { label: "No Pribadi (WA)", name: "noPribadi", type: "tel", icon: Hash, placeholder: "08xxxx" },
                          { label: "Asal Instansi", name: "instansi", type: "text", icon: Building, placeholder: "Nama Vendor/PT" },
                          { label: "Posisi / Jabatan", name: "posisi", type: "text", icon: Briefcase, placeholder: "Contoh: Mandor, Staff, dll", col2: true },
                        ].map(({ label, name, type, icon: Icon, placeholder, col2 }) => (
                          <div key={name} className={`group ${col2 ? 'md:col-span-2' : ''}`}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor={`f-${name}`}>{label}</label>
                            <div className="relative">
                              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                              <input
                                id={`f-${name}`}
                                type={type}
                                name={name}
                                value={formData[name]}
                                onChange={handleInputChange}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium"
                                placeholder={placeholder}
                                autoComplete="off"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-10 pt-8 border-t border-gray-100">
                        <div className="mb-6 flex items-center gap-2">
                          <Phone className="w-5 h-5 text-red-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kontak Darurat</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                          <div className="group md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="f-hubunganKontak">Hubungan Kontak</label>
                            <div className="relative">
                              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
                              <select
                                id="f-hubunganKontak"
                                name="hubunganKontak"
                                value={formData.hubunganKontak}
                                onChange={handleInputChange}
                                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium appearance-none cursor-pointer"
                              >
                                <option value="" disabled>Pilih Hubungan Kekerabatan</option>
                                {['Istri','Suami','Orang Tua','Anak','Saudara Kandung','Rekan Kerja','Lainnya'].map((v) => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                            </div>
                          </div>
                          <div className="group md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="f-kontakDarurat">No. Telepon Darurat</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                              <input
                                id="f-kontakDarurat"
                                type="tel"
                                name="kontakDarurat"
                                value={formData.kontakDarurat}
                                onChange={handleInputChange}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium"
                                placeholder="Nomor darurat aktif"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={validateForm}
                        className="w-full mt-10 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-xl hover:shadow-slate-900/20 group"
                      >
                        Simpan &amp; Lanjutkan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2 — Video */}
                {step === 2 && (
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
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                          </span>
                          <span className="text-[10px] font-bold text-white tracking-widest uppercase">Wajib Tonton</span>
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
                          : <><Lock className="w-5 h-5" /> Tunggu {Math.ceil(MIN_WATCH_SECONDS - watchTime)} detik</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 — Poster */}
                {step === 3 && (
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

                        {/* Dot indicators */}
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

                    {/* Maximized poster overlay */}
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
                )}

                {/* STEP 4 — Kuis */}
                {step === 4 && (
                  <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 animate-fade-in-up border border-gray-100 max-w-3xl mx-auto flex flex-col">
                    <div className="mb-8 flex flex-col items-center text-center">
                      <div className="bg-indigo-50 w-16 h-16 flex items-center justify-center rounded-2xl text-indigo-600 mb-4 border border-indigo-100">
                        <ClipboardList className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-extrabold text-slate-900">Kuis Evaluasi K3</h2>
                      <p className="text-sm text-slate-500 mt-2 max-w-lg">
                        Jawab seluruh pertanyaan berikut dengan benar untuk mengukur pemahaman Anda mengenai keselamatan kerja di area proyek.
                      </p>
                    </div>

                    <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar mb-8 rounded-2xl p-2 bg-white" role="form" aria-label="Form kuis evaluasi">
                      {QUIZ_DATA.map((item, qIndex) => {
                        const isWrong    = wrongAnswers.includes(item.id);
                        const groupName  = `question_${item.id}`;
                        return (
                          <fieldset
                            key={item.id}
                            className={`p-6 rounded-2xl border transition-all ${
                              isWrong
                                ? 'bg-red-50/50 border-red-300 ring-2 ring-red-100 shadow-sm'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <legend className="font-bold text-slate-800 text-[15px] mb-5 leading-relaxed flex items-start gap-3 w-full">
                              <span className={`flex-shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-full text-xs font-black shadow-sm ${
                                isWrong ? 'bg-red-500 text-white' : 'bg-yellow-400 text-slate-900'
                              }`}>{qIndex + 1}</span>
                              <div className="pt-0.5">{item.question}</div>
                            </legend>
                            <div className="space-y-3 md:pl-10">
                              {item.options.map((opt, optIndex) => {
                                const isSelected = quizAnswers[item.id] === optIndex;
                                const inputId    = `${groupName}_${optIndex}`;
                                return (
                                  <label
                                    key={optIndex}
                                    htmlFor={inputId}
                                    className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all border-2 ${
                                      isSelected
                                        ? isWrong
                                          ? 'bg-red-50 border-red-400'
                                          : 'bg-white border-yellow-400 shadow-md ring-2 ring-yellow-400/20'
                                        : 'bg-white border-gray-100 hover:border-yellow-200 hover:bg-yellow-50/30'
                                    }`}
                                  >
                                    <input
                                      id={inputId}
                                      type="radio"
                                      name={groupName}
                                      className={`mt-0.5 w-4 h-4 cursor-pointer ${isWrong ? 'accent-red-500' : 'accent-yellow-500'}`}
                                      checked={isSelected}
                                      onChange={() => handleQuizChange(item.id, optIndex)}
                                    />
                                    <span className={`text-sm leading-tight ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </fieldset>
                        );
                      })}
                    </div>

                    <div className="flex gap-4 border-t border-gray-100 pt-8 mt-auto">
                      <button onClick={() => setStep(3)} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors">
                        Kembali
                      </button>
                      <button
                        onClick={validateQuiz}
                        className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-slate-900/20 group"
                      >
                        Selesaikan Kuis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5 — Tanda Tangan */}
                {step === 5 && (
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
                )}

                {/* STEP 6 — Success */}
                {step === 6 && (
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
                )}
              </>
            )}
          </main>

          {/* Footer */}
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

        {/* ── MODAL: SIGNATURE PREVIEW ─────────────── */}
        {viewMode === 'admin' && selectedSignature && (
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
            style={{ backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Preview tanda tangan"
          >
            <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedSignature(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-fade-in-up overflow-hidden flex flex-col border border-slate-200">
              <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-slate-50/80">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-xl"><PenTool className="w-5 h-5 text-yellow-600" /></div>
                  Detail Tanda Tangan
                </h3>
                <button
                  onClick={() => setSelectedSignature(null)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                  aria-label="Tutup"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 sm:p-10 bg-[#fafafa] flex items-center justify-center min-h-[300px] relative">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <img
                  src={selectedSignature}
                  alt="Preview tanda tangan"
                  className="relative z-10 w-full max-h-[350px] object-contain drop-shadow-md border-b-2 border-slate-300 pb-4"
                />
              </div>
              <div className="p-5 sm:p-6 border-t border-gray-100 bg-white">
                <button
                  onClick={() => setSelectedSignature(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: EDIT ────────────────────────────── */}
        {viewMode === 'admin' && isEditModalOpen && editData && (
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
            style={{ backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Edit data pengunjung"
          >
            <div className="absolute inset-0 cursor-pointer" onClick={() => !isCRUDLoading && setIsEditModalOpen(false)} aria-hidden="true" />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-fade-in-up overflow-hidden flex flex-col border border-slate-200 max-h-[90vh]">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50/80">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl"><Edit className="w-5 h-5 text-blue-600" /></div>
                  Edit Data Pengunjung
                </h3>
                <button
                  onClick={() => !isCRUDLoading && setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                  aria-label="Tutup"
                  disabled={isCRUDLoading}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
                <form id="editForm" onSubmit={executeEdit} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { label: "Nama Lengkap", key: "nama",   type: "text", required: true },
                      { label: "No Pribadi",   key: "noPribadi", type: "tel" },
                      { label: "Asal Instansi", key: "instansi", type: "text", required: true },
                      { label: "Posisi / Jabatan", key: "posisi", type: "text" },
                      { label: "No Darurat",   key: "kontakDarurat", type: "tel", required: true },
                    ].map(({ label, key, type, required }) => (
                      <div key={key}>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2" htmlFor={`edit-${key}`}>{label}</label>
                        <input
                          id={`edit-${key}`}
                          type={type}
                          value={editData[key] || ''}
                          onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white text-sm font-medium"
                          required={required}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2" htmlFor="edit-hubungan">Hubungan Kontak</label>
                      <select
                        id="edit-hubungan"
                        value={editData.hubunganKontak || ''}
                        onChange={(e) => setEditData((p) => ({ ...p, hubunganKontak: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white text-sm font-medium"
                      >
                        {['Istri','Suami','Orang Tua','Anak','Saudara Kandung','Rekan Kerja','Lainnya'].map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-5 border-t border-gray-100 bg-slate-50 flex gap-3 justify-end">
                <button
                  type="button"
                  disabled={isCRUDLoading}
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 font-bold text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="editForm"
                  disabled={isCRUDLoading}
                  aria-busy={isCRUDLoading}
                  className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg flex items-center gap-2 disabled:opacity-70"
                >
                  {isCRUDLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isCRUDLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: DELETE CONFIRM ─────────────────── */}
        {viewMode === 'admin' && deleteData && (
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
            style={{ backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)' }}
            role="alertdialog"
            aria-modal="true"
            aria-label="Konfirmasi hapus data"
          >
            <div className="absolute inset-0 cursor-pointer" onClick={() => !isCRUDLoading && setDeleteData(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in-up overflow-hidden flex flex-col border border-slate-200 text-center p-8">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl mb-2">Hapus Data Ini?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Anda yakin ingin menghapus data induksi atas nama{' '}
                <strong className="text-slate-800">{deleteData.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  disabled={isCRUDLoading}
                  onClick={() => setDeleteData(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  disabled={isCRUDLoading}
                  onClick={executeDelete}
                  aria-busy={isCRUDLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isCRUDLoading && <RefreshCcw className="w-4 h-4 animate-spin" />}
                  {isCRUDLoading ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}