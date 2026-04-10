import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, User, Building, Phone, PlayCircle, PenTool, 
  CheckCircle, ArrowRight, AlertTriangle, RefreshCcw, Lock, Unlock, Info, FileSignature, HardHat, Users,
  LayoutDashboard, Search, Calendar, ArrowUpDown, ArrowLeft, Image as ImageIcon, Key, LogOut, Briefcase, Hash, ClipboardList, ChevronDown, XCircle, FileImage,
  Edit, Trash2, X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'safety-induction-app';

// Google Apps Script URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbzHUPGotfcGW5AOukI9lJ6Mo1ceI6qXvLvwjgzGcaz8nb4rIO_WDsnKZ61sm5_lS2-Z/exec";

// Helper: Dapatkan tanggal hari ini
const getTodayDate = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().split('T')[0];
};

// --- DATA KUIS ---
const QUIZ_DATA = [
  {
    id: 1,
    question: "Apa nama proyek tempat Anda bekerja saat ini?",
    options: [
      "Proyek Pembangunan Jalan Tol",
      "Proyek Pembangunan Sekolah Rakyat Jatim 3 Kabupaten Kediri",
      "Proyek Pembangunan Perumahan"
    ],
    correctIndex: 1
  },
  {
    id: 2,
    question: "APD wajib yang harus digunakan di area proyek adalah...",
    options: [
      "Safety helmet, vest, dan sepatu safety",
      "Masker saja",
      "Helm dan sandal"
    ],
    correctIndex: 0
  },
  {
    id: 3,
    question: "Saat bekerja di ketinggian, pekerja harus menggunakan...",
    options: [
      "Helm saja",
      "Sarung tangan",
      "Full Body Harness"
    ],
    correctIndex: 2
  },
  {
    id: 4,
    question: "Saat melakukan pekerjaan pengelasan, pekerja harus menggunakan...",
    options: [
      "Kacamata biasa",
      "Helm proyek",
      "Helm las dan sarung tangan las"
    ],
    correctIndex: 2
  },
  {
    id: 5,
    question: "APAR adalah alat yang digunakan untuk...",
    options: [
      "Memadamkan api ringan/kebakaran kecil",
      "Membersihkan alat kerja",
      "Mengukur suhu"
    ],
    correctIndex: 0
  }
];

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Mengambil viewMode dari sessionStorage agar tetap di admin jika direfresh
  const [viewMode, setViewMode] = useState(() => {
    return sessionStorage.getItem('si_viewMode') || 'user';
  }); 
  
  // ==========================================
  // STATE: USER MODE (DENGAN SESSION STORAGE)
  // ==========================================
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem('si_step');
    return saved ? parseInt(saved) : 1;
  });
  
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('si_formData');
    return saved ? JSON.parse(saved) : { nama: '', noPribadi: '', instansi: '', posisi: '', kontakDarurat: '', hubunganKontak: '' };
  });
  
  const [quizAnswers, setQuizAnswers] = useState(() => {
    const saved = sessionStorage.getItem('si_quizAnswers');
    return saved ? JSON.parse(saved) : {};
  });

  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false); 
  
  // Dynamic Notification State
  const [notification, setNotification] = useState({ msg: "", type: "" }); // type: 'error' | 'success'
  
  // Video States
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const videoRef = useRef(null);
  const maxTimeWatched = useRef(0);

  // Signature State
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Auto Scroll ke Atas Setiap Ganti Step
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, viewMode]);

  // Simpan state ke sessionStorage setiap kali berubah
  useEffect(() => { sessionStorage.setItem('si_step', step); }, [step]);
  useEffect(() => { sessionStorage.setItem('si_formData', JSON.stringify(formData)); }, [formData]);
  useEffect(() => { sessionStorage.setItem('si_quizAnswers', JSON.stringify(quizAnswers)); }, [quizAnswers]);
  useEffect(() => { sessionStorage.setItem('si_viewMode', viewMode); }, [viewMode]);

  // ==========================================
  // STATE: ADMIN MODE
  // ==========================================
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('si_isAdminLoggedIn') === 'true';
  });
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isCRUDLoading, setIsCRUDLoading] = useState(false); // New state for CRUD animations
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState("");
  const [adminData, setAdminData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(getTodayDate());
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Custom Modals Admin
  const [selectedSignature, setSelectedSignature] = useState(null); 
  const [deleteData, setDeleteData] = useState(null); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // --- ADMIN TIMEOUT LOGIC (1 JAM) ---
  useEffect(() => {
    if (isAdminLoggedIn) {
      const loginTime = sessionStorage.getItem('admin_login_time');
      const now = Date.now();
      const ONE_HOUR = 3600000; 

      if (loginTime && now - parseInt(loginTime) > ONE_HOUR) {
        handleAdminLogout();
        showNotification("Sesi Admin telah berakhir (Timeout 1 Jam). Silakan login kembali.", "error");
      } else {
        const remainingTime = ONE_HOUR - (now - (loginTime ? parseInt(loginTime) : now));
        const timeout = setTimeout(() => {
          handleAdminLogout();
          showNotification("Sesi Admin telah berakhir (Timeout 1 Jam). Silakan login kembali.", "error");
        }, remainingTime);

        return () => clearTimeout(timeout);
      }
    }
  }, [isAdminLoggedIn]);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        showNotification("Gagal terhubung ke server keamanan.", "error");
        setIsAppLoading(false);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAppLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  // --- FETCH DATA FOR ADMIN ---
  useEffect(() => {
    if (viewMode === 'admin' && isAdminLoggedIn && user) {
      setIsAdminLoading(true);
      try {
        const inductionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'inductions');
        const unsubscribe = onSnapshot(inductionsRef, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAdminData(data);
          setIsAdminLoading(false); 
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Akses Ditolak:", error);
        setIsAdminLoading(false);
      }
    }
  }, [viewMode, isAdminLoggedIn, user]);

  // --- HANDLERS ---
  const showNotification = (msg, type = 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: "", type: "" }), 5000); 
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.nama || !formData.noPribadi || !formData.instansi || !formData.posisi || !formData.kontakDarurat || !formData.hubunganKontak) {
      showNotification("Harap lengkapi semua kolom identitas, pekerjaan, dan kontak darurat Anda.", "error");
      return false;
    }
    setNotification({ msg: "", type: "" });
    setStep(2);
  };

  // --- VIDEO LOGIC ---
  const handleVideoEnded = () => setIsVideoFinished(true);

  const handleVideoTimeUpdate = (e) => {
    const video = e.target;
    if (!video.seeking) {
      maxTimeWatched.current = Math.max(maxTimeWatched.current, video.currentTime);
    }
  };

  const handleVideoSeeking = (e) => {
    const video = e.target;
    if (video.currentTime > maxTimeWatched.current + 1) {
      video.currentTime = maxTimeWatched.current;
      showNotification("Peringatan: Anda tidak dapat mempercepat/melewati video materi induksi.", "error");
    }
  };

  // --- QUIZ LOGIC ---
  const handleQuizChange = (questionId, optionIndex) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    if (wrongAnswers.includes(questionId)) {
      setWrongAnswers(prev => prev.filter(id => id !== questionId));
    }
  };

  const validateQuiz = () => {
    let allAnswered = true;
    let errors = [];

    QUIZ_DATA.forEach(q => {
      if (quizAnswers[q.id] === undefined) {
        allAnswered = false;
      } else if (quizAnswers[q.id] !== q.correctIndex) {
        errors.push(q.id);
      }
    });

    if (!allAnswered) {
      showNotification("Harap jawab semua pertanyaan evaluasi (5 soal) terlebih dahulu.", "error");
      return;
    }
    
    if (errors.length > 0) {
      setWrongAnswers(errors);
      showNotification(`Terdapat ${errors.length} jawaban yang keliru. Silakan periksa kotak merah dan perbaiki jawaban Anda.`, "error");
      return;
    }

    setWrongAnswers([]);
    setNotification({ msg: "", type: "" });
    setStep(5);
  };

  // --- SIGNATURE LOGIC ---
  const startDrawing = (e) => {
    e.preventDefault();
    if (!agreedToTerms) return showNotification("Mohon centang persetujuan terlebih dahulu.", "error");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => { if (isDrawing) setIsDrawing(false); };
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'user' && step === 5 && canvasRef.current) {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth - 4; 
      canvas.height = 200;
    }
  }, [step, viewMode, isAppLoading]);

  useEffect(() => {
    const handleResize = () => {
      if (viewMode === 'user' && step === 5 && canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth - 4;
        clearSignature(); 
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [step, viewMode]);

  // --- SUBMIT DATA ---
  const handleSubmit = async () => {
    if (!hasSignature) return showNotification("Silakan berikan tanda tangan digital Anda.", "error");
    setIsSubmitting(true);
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas.toDataURL("image/png");
      
      const inductionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'inductions');
      const docRef = await addDoc(inductionsRef, {
        userId: user?.uid || 'anonymous',
        ...formData,
        signature: signatureDataUrl,
        timestamp: serverTimestamp(),
        status: 'Completed'
      });
      
      // Fix: Add single quote to phone numbers for Spreadsheet detection
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: 'create',
          id: docRef.id,
          nama: formData.nama,
          noPribadi: "'" + formData.noPribadi, // Add quote for zero detection
          instansi: formData.instansi,
          posisi: formData.posisi,
          kontakDarurat: "'" + formData.kontakDarurat, // Add quote for zero detection
          hubunganKontak: formData.hubunganKontak,
          signature: signatureDataUrl
        }),
      });
      
      setStep(6);
    } catch (err) {
      console.error(err);
      showNotification("Terjadi kesalahan. Pastikan koneksi internet stabil.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setIsFinishing(true);
    setTimeout(() => {
      sessionStorage.clear(); 
      window.location.reload(); 
    }, 1500); 
  };

  // --- ADMIN LOGIC ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('si_isAdminLoggedIn', 'true');
      sessionStorage.setItem('admin_login_time', Date.now().toString());
      setLoginError(""); 
      setLoginForm({ username: '', password: '' });
      showNotification("Berhasil masuk ke Dashboard Admin.", "success");
    } else { 
      setLoginError("Username atau password salah!"); 
    }
  };
  
  const handleAdminLogout = () => { 
    setIsAdminLoggedIn(false); 
    setViewMode('user'); 
    sessionStorage.removeItem('si_isAdminLoggedIn');
    sessionStorage.removeItem('admin_login_time');
    sessionStorage.setItem('si_viewMode', 'user');
    showNotification("Anda telah keluar dari mode Admin.", "success");
  };

  // CRUD ADMIN
  const executeDelete = async () => {
    if (!deleteData) return;
    setIsCRUDLoading(true);
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inductions', deleteData.id));
      
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'delete', id: deleteData.id }),
      });

      setDeleteData(null);
      showNotification("Data pengunjung berhasil dihapus.", "success");
    } catch (e) {
      console.error(e);
      showNotification("Gagal menghapus data dari sistem.", "error");
    } finally {
      setIsCRUDLoading(false);
    }
  };

  const openEditModal = (item) => {
    setEditData({ ...item });
    setIsEditModalOpen(true);
  };

  const executeEdit = async (e) => {
    e.preventDefault();
    setIsCRUDLoading(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'inductions', editData.id);
      await updateDoc(docRef, {
        nama: editData.nama,
        noPribadi: editData.noPribadi,
        instansi: editData.instansi,
        posisi: editData.posisi,
        kontakDarurat: editData.kontakDarurat,
        hubunganKontak: editData.hubunganKontak
      });
      
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: 'update',
          id: editData.id,
          nama: editData.nama,
          noPribadi: "'" + editData.noPribadi, // Fix zero detection
          instansi: editData.instansi,
          posisi: editData.posisi,
          kontakDarurat: "'" + editData.kontakDarurat, // Fix zero detection
          hubunganKontak: editData.hubunganKontak
        }),
      });

      setIsEditModalOpen(false);
      setEditData(null);
      showNotification("Data pengunjung berhasil diperbarui.", "success");
    } catch (err) {
      console.error(err);
      showNotification("Gagal memperbarui data.", "error");
    } finally {
      setIsCRUDLoading(false);
    }
  };

  const getProcessedAdminData = () => {
    let processed = [...adminData];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processed = processed.filter(item => 
        (item.nama && item.nama.toLowerCase().includes(lowerSearch)) || (item.instansi && item.instansi.toLowerCase().includes(lowerSearch))
      );
    }
    if (filterDate) {
      processed = processed.filter(item => {
        if (!item.timestamp) return false;
        const dateObj = item.timestamp.toDate ? item.timestamp.toDate() : new Date();
        const offset = dateObj.getTimezoneOffset() * 60000;
        const localDateStr = new Date(dateObj.getTime() - offset).toISOString().split('T')[0];
        return localDateStr === filterDate;
      });
    }
    processed.sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return processed;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Baru saja";
    const date = timestamp.toDate ? timestamp.toDate() : new Date();
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  // --- PROGRESS BAR ---
  const renderProgressBar = () => {
    const steps = [
      { num: 1, icon: User, label: "Identitas" },
      { num: 2, icon: PlayCircle, label: "Materi" },
      { num: 3, icon: FileImage, label: "Poster" },
      { num: 4, icon: ClipboardList, label: "Evaluasi" },
      { num: 5, icon: FileSignature, label: "Pengesahan" }
    ];
    return (
      <div className="relative mb-8 mt-2 px-2 md:px-4 max-w-4xl mx-auto w-full">
        <div className="absolute top-4 left-6 right-6 md:left-10 md:right-10 h-1 bg-gray-200 rounded-full z-0"></div>
        <div 
          className="absolute top-4 left-6 md:left-10 h-1 bg-yellow-400 rounded-full z-0 transition-all duration-700 ease-in-out"
          style={{ width: `calc(${((Math.min(step, 5) - 1) / 4) * 100}% - 0px)` }}
        ></div>
        <div className="relative z-10 flex justify-between">
          {steps.map((s) => {
            const isActive = step >= s.num;
            const isCurrent = step === s.num && step !== 6; 
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-[3px] md:border-4 transition-all duration-500 transform ${
                  isActive ? 'bg-yellow-400 border-yellow-100 text-slate-900 scale-110 shadow-lg shadow-yellow-400/20' : 'bg-white border-gray-200 text-gray-400 scale-100'
                }`}>
                  {isActive && !isCurrent ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
                <span className={`text-[9px] md:text-xs mt-2 font-bold transition-colors duration-300 hidden sm:block ${isActive ? 'text-slate-800' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-400 rounded-full blur-[120px] opacity-20"></div>
        </div>
        <div className="flex flex-col items-center z-10 animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
            <div className="bg-slate-900 p-5 rounded-3xl shadow-2xl relative animate-pulse border border-slate-700">
              <HardHat className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
          <h2 className="mt-8 text-xl font-extrabold text-slate-900 tracking-widest flex items-center gap-2">MEMUAT SISTEM</h2>
          <p className="text-slate-500 text-xs font-medium mt-2">Digital Safety Induction</p>
          <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden relative">
            <div className="absolute top-0 bottom-0 bg-yellow-400 rounded-full" style={{ width: '40%', animation: 'loadingBar 1.5s infinite ease-in-out' }}></div>
          </div>
        </div>
        <style>{`
          @keyframes loadingBar { 0% { left: -40%; } 50% { left: 30%; } 100% { left: 100%; } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-down { animation: slideDown 0.4s ease-out forwards; }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(250, 204, 21, 0); } 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); } }
        .btn-pulse-glow { animation: pulseGlow 2s infinite; }
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="min-h-screen font-sans text-slate-800 selection:bg-yellow-400 selection:text-slate-900 bg-slate-50 flex flex-col relative">
        
        {/* Production-Level Notification (Success/Error) - FIXED Z-INDEX MAX */}
        {notification.msg && (
          <div className="fixed top-4 left-0 right-0 z-[999999] animate-slide-down flex justify-center pointer-events-none px-4">
            <div className={`backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border w-auto max-w-xl mx-auto ring-4 transition-all ${
              notification.type === 'success' 
                ? 'bg-green-500/95 border-green-400 ring-green-500/20' 
                : 'bg-red-500/95 border-red-400 ring-red-500/20'
            }`}>
              {notification.type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0 animate-pulse" />}
              <p className="text-sm font-bold tracking-wide">{notification.msg}</p>
            </div>
          </div>
        )}

        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25]"
               style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop')" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 via-white/90 to-slate-100/95 backdrop-blur-[2px]"></div>
        </div>

        <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
          <div className={`mx-auto p-4 flex items-center justify-between gap-3 transition-all ${viewMode === 'admin' && isAdminLoggedIn ? 'max-w-7xl' : (viewMode === 'user' ? 'max-w-5xl' : 'max-w-md')}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shadow-sm ${viewMode === 'admin' ? 'bg-slate-900 text-white' : 'bg-yellow-400 text-slate-900'}`}>
                {viewMode === 'admin' ? <LayoutDashboard className="w-7 h-7" /> : <HardHat className="w-7 h-7" />}
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
                  {viewMode === 'admin' ? 'Database Kepatuhan K3' : 'Digital Verification System'}
                </p>
              </div>
            </div>
            
            {viewMode === 'admin' && (
              <div className="flex gap-2">
                {isAdminLoggedIn && (
                  <>
                    <button onClick={() => setViewMode('user')} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
                      <ArrowLeft className="w-4 h-4 hidden sm:block" /> Home
                    </button>
                    <button onClick={handleAdminLogout} className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-100 shadow-sm">
                      <LogOut className="w-4 h-4 hidden sm:block" /> Logout
                    </button>
                  </>
                )}
                {!isAdminLoggedIn && (
                  <button onClick={() => setViewMode('user')} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Kembali
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="relative z-10 flex flex-col min-h-screen w-full pt-20 md:pt-24">
          <main className={`mx-auto p-4 pb-8 relative flex-grow w-full transition-all ${viewMode === 'admin' && isAdminLoggedIn ? 'max-w-7xl' : (viewMode === 'user' ? 'max-w-5xl' : 'max-w-md')}`}>

            {/* VIEW: ADMIN LOGIN */}
            {viewMode === 'admin' && !isAdminLoggedIn && (
              <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in-up border border-gray-100 max-w-md mx-auto mt-4">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-slate-700" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Akses Terbatas</h2>
                  <p className="text-sm text-slate-500 mt-1">Silakan masukkan kredensial administrator.</p>
                </div>
                {loginError && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {loginError}</div>}
                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Masukkan username" required />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Masukkan password" required />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg">
                    Masuk Dashboard <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}

            {/* VIEW: ADMIN DASHBOARD */}
            {viewMode === 'admin' && isAdminLoggedIn && (
               <div className="animate-fade-in-up">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Cari Nama / Instansi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm"/>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="relative flex-1 md:w-48 min-w-[150px]">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm text-slate-700"/>
                    </div>
                    <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl hover:bg-slate-100 text-sm font-medium text-slate-700 whitespace-nowrap">
                      <ArrowUpDown className="w-4 h-4" /> {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                    </button>
                    {filterDate && (
                      <button onClick={() => setFilterDate("")} className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 text-sm font-medium">Semua</button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-8">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-100 text-xs uppercase tracking-wider text-slate-500">
                          <th className="p-4 font-bold">Pengunjung / Pekerja</th>
                          <th className="p-4 font-bold">Instansi & Posisi</th>
                          <th className="p-4 font-bold">Kontak Darurat</th>
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
                        ) : getProcessedAdminData().length > 0 ? (
                          getProcessedAdminData().map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group/row">
                              <td className="p-4">
                                <div className="font-bold text-slate-900">{item.nama}</div>
                                <div className="text-xs text-slate-500 mt-0.5">No: {item.noPribadi || '-'}</div>
                                <div className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> {item.status}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-700">{item.instansi}</div>
                                <div className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate" title={item.posisi}>Posisi: {item.posisi || '-'}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-slate-800">{item.kontakDarurat}</div>
                                <div className="text-xs text-slate-500 mt-0.5">Hub: {item.hubunganKontak}</div>
                              </td>
                              <td className="p-4 text-slate-600 whitespace-nowrap">{formatDate(item.timestamp)}</td>
                              <td className="p-4 text-center">
                                {item.signature ? (
                                  <button onClick={() => setSelectedSignature(item.signature)} className="inline-block relative group">
                                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ImageIcon className="w-5 h-5 text-white" /></div>
                                    <img src={item.signature} alt={`Tanda tangan ${item.nama}`} className="h-12 w-24 object-contain bg-white border border-gray-200 rounded-lg p-1"/>
                                  </button>
                                ) : <span className="text-xs text-gray-400 italic">Tidak ada</span>}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-2 transition-opacity">
                                  <button onClick={() => openEditModal(item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit Data">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setDeleteData(item)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus Data">
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

            {/* VIEW: USER MODE (FORM WIZARD) */}
            {viewMode === 'user' && (
              <>
                {renderProgressBar()}

                {/* STEP 1: Form Pendaftaran */}
                {step === 1 && (
                  <div className="bg-white rounded-3xl shadow-xl animate-fade-in-up border border-gray-100 overflow-hidden flex flex-col md:flex-row max-w-5xl mx-auto">
                    <div className="md:w-5/12 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-400 rounded-full blur-[80px] opacity-20 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                      <ShieldCheck className="w-20 h-20 text-yellow-400 mb-6" />
                      <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">Registrasi<br/>Induksi K3</h2>
                      <p className="text-slate-400 text-sm md:text-base leading-relaxed">Lengkapi profil identitas dan pekerjaan Anda untuk memulai proses edukasi dan sertifikasi keselamatan digital.</p>
                    </div>

                    <div className="md:w-7/12 p-8 md:p-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <div className="group md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                            <input type="text" name="nama" value={formData.nama} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Sesuai KTP" />
                          </div>
                        </div>
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">No Pribadi (WA)</label>
                          <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                            <input type="tel" name="noPribadi" value={formData.noPribadi} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="0812-xxxx" />
                          </div>
                        </div>
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asal Instansi</label>
                          <div className="relative">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                            <input type="text" name="instansi" value={formData.instansi} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Nama Vendor/PT" />
                          </div>
                        </div>
                        <div className="group md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Posisi / Jabatan</label>
                          <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                            <input type="text" name="posisi" value={formData.posisi} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Contoh: Mandor, Staff, dll" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-10 pt-8 border-t border-gray-100">
                        <div className="mb-6 flex items-center gap-2">
                          <Phone className="w-5 h-5 text-red-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kontak Darurat</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                          <div className="group md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hubungan Kontak</label>
                            <div className="relative">
                              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 z-10 transition-colors" />
                              <select name="hubunganKontak" value={formData.hubunganKontak} onChange={handleInputChange} className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium appearance-none cursor-pointer">
                                <option value="" disabled>Pilih Hubungan Kekerabatan</option>
                                <option value="Istri">Istri</option>
                                <option value="Suami">Suami</option>
                                <option value="Orang Tua">Orang Tua</option>
                                <option value="Anak">Anak</option>
                                <option value="Saudara Kandung">Saudara Kandung</option>
                                <option value="Rekan Kerja">Rekan Kerja</option>
                                <option value="Lainnya">Lainnya</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                            </div>
                          </div>
                          <div className="group md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">No. Telepon Darurat</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                              <input type="tel" name="kontakDarurat" value={formData.kontakDarurat} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Nomor darurat aktif" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <button onClick={validateForm} className="w-full mt-10 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-xl hover:shadow-slate-900/20 group">
                        Simpan & Lanjutkan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Video Induksi */}
                {step === 2 && (
                  <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in-up border border-gray-100 max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                      <div className="bg-blue-50 w-16 h-16 rounded-2xl text-blue-600 mx-auto flex items-center justify-center mb-4 shadow-sm border border-blue-100"><PlayCircle className="w-8 h-8" /></div>
                      <h2 className="text-2xl font-extrabold text-slate-900">Materi Edukasi K3</h2>
                      <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">Tonton video panduan keselamatan kerja ini tanpa dipercepat (skip) untuk mengaktifkan tombol ke tahap berikutnya.</p>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-inner ring-4 ring-slate-50 mb-8 group w-full aspect-video">
                      <video ref={videoRef} controls onEnded={handleVideoEnded} onTimeUpdate={handleVideoTimeUpdate} onSeeking={handleVideoSeeking} className="w-full h-full object-contain opacity-95 group-hover:opacity-100 transition-opacity" poster="https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=800&auto=format&fit=crop">
                        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                        Browser tidak mendukung pemutar video.
                      </video>
                      {!isVideoFinished && (
                        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none border border-white/20">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                          <span className="text-[10px] font-bold text-white tracking-widest uppercase">Wajib Tonton</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4 flex-col sm:flex-row">
                      <button onClick={() => setStep(1)} className="sm:w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors">Kembali</button>
                      <button onClick={() => { if (isVideoFinished) setStep(3); else showNotification("Anda harus menonton video sampai durasi selesai.", "error"); }} disabled={!isVideoFinished} className={`flex-1 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${isVideoFinished ? 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-400/30 btn-pulse-glow transform hover:-translate-y-1' : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-200'}`}>
                        {isVideoFinished ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        {isVideoFinished ? 'Lanjut ke Poster' : 'Video Terkunci'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Poster */}
                {step === 3 && (
                  <div className="bg-white rounded-3xl shadow-xl animate-fade-in-up border border-gray-100 overflow-hidden flex flex-col md:flex-row max-w-6xl mx-auto min-h-[600px]">
                    <div className="md:w-5/12 bg-slate-900 border-r border-gray-100 relative overflow-hidden flex flex-col justify-center p-8 md:p-12">
                      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                      <h3 className="text-white font-extrabold text-3xl flex items-center gap-3 mb-4"><Info className="w-8 h-8 text-yellow-400"/> Poster<br/>Keselamatan</h3>
                      <p className="text-slate-400 text-base leading-relaxed">Perhatikan petunjuk visual K3 ini dengan saksama. Informasi pada poster ini akan menjadi referensi penting Anda dalam menjawab evaluasi di tahap selanjutnya.</p>
                    </div>
                    <div className="md:w-7/12 p-8 flex flex-col bg-slate-50 relative">
                      <div className="flex-grow w-full flex items-center justify-center mb-8 relative rounded-2xl bg-white border border-gray-200 shadow-inner p-2 md:p-4">
                        <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop" alt="Poster K3" className="w-full h-full max-h-[60vh] object-contain rounded-xl drop-shadow-sm" />
                      </div>
                      <div className="flex gap-4 w-full mt-auto">
                        <button onClick={() => setStep(2)} className="w-1/3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-2xl transition-colors shadow-sm">Kembali</button>
                        <button onClick={() => setStep(4)} className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-slate-900/20 group">Paham & Lanjut Kuis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/></button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Kuis */}
                {step === 4 && (
                  <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 animate-fade-in-up border border-gray-100 max-w-3xl mx-auto flex flex-col">
                    <div className="mb-8 flex flex-col items-center text-center">
                      <div className="bg-indigo-50 w-16 h-16 flex items-center justify-center rounded-2xl text-indigo-600 mb-4 border border-indigo-100"><ClipboardList className="w-8 h-8" /></div>
                      <h2 className="text-2xl font-extrabold text-slate-900">Kuis Evaluasi K3</h2>
                      <p className="text-sm text-slate-500 mt-2 max-w-lg">Jawab seluruh pertanyaan berikut dengan benar. Anda diwajibkan untuk mengulangi jika terdapat jawaban yang keliru.</p>
                    </div>
                    <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar mb-8 rounded-2xl p-2 bg-white">
                      {QUIZ_DATA.map((item, qIndex) => {
                        const isWrong = wrongAnswers.includes(item.id);
                        return (
                          <div key={item.id} className={`p-6 rounded-2xl border transition-all ${isWrong ? 'bg-red-50/50 border-red-300 ring-2 ring-red-100 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                            <h3 className="font-bold text-slate-800 text-[15px] mb-5 leading-relaxed flex items-start gap-3">
                              <span className={`flex-shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-full text-xs font-black shadow-sm ${isWrong ? 'bg-red-500 text-white' : 'bg-yellow-400 text-slate-900'}`}>{qIndex + 1}</span>
                              <div className="pt-0.5">
                                {item.question}
                                {isWrong && <span className="block text-red-600 text-xs mt-1.5 font-bold"><XCircle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />Jawaban keliru, coba lagi.</span>}
                              </div>
                            </h3>
                            <div className="space-y-3 md:pl-10">
                              {item.options.map((opt, optIndex) => {
                                const isSelected = quizAnswers[item.id] === optIndex;
                                return (
                                  <label key={optIndex} className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? (isWrong ? 'bg-red-50 border-red-400' : 'bg-white border-yellow-400 shadow-md ring-2 ring-yellow-400/20') : 'bg-white border-gray-100 hover:border-yellow-200 hover:bg-yellow-50/30'}`}>
                                    <input type="radio" name={`question_${item.id}`} className={`mt-0.5 w-4 h-4 bg-gray-100 border-gray-300 focus:ring-yellow-500 cursor-pointer ${isWrong ? 'accent-red-500' : 'accent-yellow-500'}`} checked={isSelected} onChange={() => handleQuizChange(item.id, optIndex)} />
                                    <span className={`text-sm leading-tight ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{opt}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex gap-4 border-t border-gray-100 pt-8 mt-auto">
                      <button onClick={() => setStep(3)} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors">Kembali</button>
                      <button onClick={validateQuiz} className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-slate-900/20 group">Cek & Pengesahan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>
                    </div>
                  </div>
                )}

                {/* STEP 5: Tanda Tangan */}
                {step === 5 && (
                  <div className="bg-white rounded-3xl shadow-xl animate-fade-in-up border border-gray-100 overflow-hidden flex flex-col md:flex-row max-w-5xl mx-auto">
                    <div className="md:w-1/2 p-8 md:p-12 bg-slate-50 border-r border-gray-100 flex flex-col h-full">
                      <div className="mb-6 flex items-start gap-4">
                        <div className="bg-yellow-100 w-14 h-14 flex items-center justify-center rounded-2xl text-yellow-600 shrink-0"><PenTool className="w-7 h-7" /></div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-slate-900">Pengesahan Akhir</h2>
                          <p className="text-sm text-slate-500 mt-1">Konfirmasi komitmen K3 Anda.</p>
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 p-6 rounded-2xl text-sm text-slate-600 shadow-sm flex-grow flex flex-col justify-center">
                        <p className="font-bold text-slate-800 mb-3 text-base">Pernyataan Komitmen:</p>
                        <ul className="list-decimal pl-5 space-y-2 font-medium text-slate-700 leading-snug">
                          <li>Mematuhi seluruh peraturan yang berlaku di area proyek.</li>
                          <li>Menggunakan APD dengan benar dan bekerja sesuai prosedur keselamatan.</li>
                          <li>Berpartisipasi aktif dalam kegiatan keselamatan.</li>
                          <li>Melaporkan potensi bahaya, kondisi tidak aman, dan kecelakaan kerja.</li>
                          <li>Menjaga kebersihan lingkungan kerja serta siap menghadapi kondisi darurat.</li>
                        </ul>
                      </div>
                    </div>
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-between">
                      <label className="mt-2 mb-8 flex items-center gap-3 cursor-pointer p-4 bg-white hover:bg-blue-50 rounded-xl transition-colors border-2 border-gray-200 hover:border-blue-300 shadow-sm group">
                        <input type="checkbox" className="w-6 h-6 rounded border-gray-300 text-slate-900 focus:ring-slate-900 accent-slate-900" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                        <span className="font-extrabold text-slate-800 text-sm select-none group-hover:text-blue-900">Saya menyetujui pernyataan komitmen.</span>
                      </label>
                      <div className="mb-8 flex-grow flex flex-col">
                        <div className="flex justify-between items-end mb-3">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tanda Tangan Digital</label>
                          {hasSignature && <button onClick={clearSignature} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"><RefreshCcw className="w-3 h-3" /> Bersihkan</button>}
                        </div>
                        <div className={`flex-grow border-2 border-dashed rounded-2xl bg-white overflow-hidden relative transition-colors min-h-[220px] ${agreedToTerms ? 'border-yellow-400 ring-4 ring-yellow-50' : 'border-gray-200 opacity-70'}`}>
                          <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ touchAction: 'none' }} className={`bg-[#fafafa] w-full h-full absolute inset-0 ${agreedToTerms ? 'cursor-crosshair' : 'cursor-not-allowed'}`} />
                          {!hasSignature && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                              <PenTool className="w-10 h-10 mb-3 opacity-30" />
                              <span className="font-medium text-sm px-4 text-center">{agreedToTerms ? "Goreskan tanda tangan di area ini" : "Centang persetujuan di atas terlebih dahulu"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setStep(4)} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors">Kembali</button>
                        <button onClick={handleSubmit} disabled={isSubmitting || !hasSignature} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isSubmitting ? <span className="flex items-center gap-2"><RefreshCcw className="w-5 h-5 animate-spin" /> Menyimpan...</span> : <>Kirim Data <CheckCircle className="w-5 h-5 text-yellow-400" /></>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: Success */}
                {step === 6 && (
                  <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in-up border border-gray-100 relative overflow-hidden max-w-lg mx-auto">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-transparent"></div>
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30 ring-8 ring-green-50">
                        <CheckCircle className="w-12 h-12 text-white animate-[scaleIn_0.5s_ease-out]" />
                      </div>
                      <h2 className="text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">Akses Diberikan!</h2>
                      <p className="text-slate-500 mb-8 leading-relaxed">Terima kasih, <strong className="text-slate-800">{formData.nama}</strong>.<br/>Data keselamatan Anda telah terekam.</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8 text-left flex items-center gap-4 shadow-inner">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100"><ShieldCheck className="w-8 h-8 text-green-500" /></div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Keamanan</p>
                          <p className="text-lg font-bold text-slate-900 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>Clear for Entry</p>
                        </div>
                      </div>
                      <button onClick={handleFinish} disabled={isFinishing} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-2xl w-full hover:bg-slate-800 transition-colors shadow-xl flex items-center justify-center gap-3 disabled:opacity-80">
                        {isFinishing ? ( <><RefreshCcw className="w-5 h-5 animate-spin"/> Memproses...</> ) : ( <>Selesai & Kembali <RefreshCcw className="w-4 h-4"/></> )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
          
          <footer className="text-center pb-8 pt-4 mt-auto text-xs font-medium text-slate-500 relative z-10">
            <p>&copy; 2026 Digital Safety Induction.</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span>Developed by Farhan Nasrullah</span>
              {viewMode === 'user' && (
                <>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => setViewMode('admin')} className="hover:text-slate-900 flex items-center gap-1 transition-colors" title="Buka Panel Admin">
                    <LayoutDashboard className="w-3 h-3" /> Admin
                  </button>
                </>
              )}
            </div>
          </footer>
        </div>

        {/* MODAL: PREVIEW SIGNATURE */}
        {viewMode === 'admin' && selectedSignature && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedSignature(null)}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-fade-in-up overflow-hidden flex flex-col border border-slate-200">
              <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-slate-50/80">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-xl"><PenTool className="w-5 h-5 text-yellow-600" /></div>
                  Detail Tanda Tangan
                </h3>
                <button onClick={() => setSelectedSignature(null)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><XCircle className="w-6 h-6" /></button>
              </div>
              <div className="p-8 sm:p-10 bg-[#fafafa] flex items-center justify-center min-h-[300px] relative">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <img src={selectedSignature} alt="Preview Tanda Tangan" className="relative z-10 w-full max-h-[350px] object-contain drop-shadow-md border-b-2 border-slate-300 pb-4" />
              </div>
              <div className="p-5 sm:p-6 border-t border-gray-100 bg-white">
                <button onClick={() => setSelectedSignature(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98]">Tutup Pratinjau</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT DATA */}
        {viewMode === 'admin' && isEditModalOpen && editData && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="absolute inset-0 cursor-pointer" onClick={() => !isCRUDLoading && setIsEditModalOpen(false)}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-fade-in-up overflow-hidden flex flex-col border border-slate-200 max-h-[90vh]">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50/80">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl"><Edit className="w-5 h-5 text-blue-600" /></div>
                  Edit Data Pengunjung
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
                <form id="editForm" onSubmit={executeEdit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Lengkap</label>
                      <input type="text" value={editData.nama} onChange={(e) => setEditData({...editData, nama: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white text-sm font-medium" required />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">No Pribadi</label>
                      <input type="tel" value={editData.noPribadi || ''} onChange={(e) => setEditData({...editData, noPribadi: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white text-sm font-medium" />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Asal Instansi</label>
                      <input type="text" value={editData.instansi} onChange={(e) => setEditData({...editData, instansi: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white text-sm font-medium" required />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Posisi / Jabatan</label>
                      <input type="text" value={editData.posisi || ''} onChange={(e) => setEditData({...editData, posisi: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white text-sm font-medium" />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hubungan Kontak</label>
                      <select value={editData.hubunganKontak} onChange={(e) => setEditData({...editData, hubunganKontak: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white text-sm font-medium">
                        <option value="Istri">Istri</option>
                        <option value="Suami">Suami</option>
                        <option value="Orang Tua">Orang Tua</option>
                        <option value="Anak">Anak</option>
                        <option value="Saudara Kandung">Saudara Kandung</option>
                        <option value="Rekan Kerja">Rekan Kerja</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">No Darurat</label>
                      <input type="tel" value={editData.kontakDarurat} onChange={(e) => setEditData({...editData, kontakDarurat: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white text-sm font-medium" required />
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-5 border-t border-gray-100 bg-slate-50 flex gap-3 justify-end">
                <button type="button" disabled={isCRUDLoading} onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">Batal</button>
                <button type="submit" form="editForm" disabled={isCRUDLoading} className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg flex items-center gap-2 disabled:opacity-70">
                  {isCRUDLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isCRUDLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: KONFIRMASI HAPUS */}
        {viewMode === 'admin' && deleteData && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="absolute inset-0 cursor-pointer" onClick={() => !isCRUDLoading && setDeleteData(null)}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in-up overflow-hidden flex flex-col border border-slate-200 text-center p-8">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl mb-2">Hapus Data Ini?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">Anda yakin ingin menghapus data induksi atas nama <strong className="text-slate-800">{deleteData.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-3 w-full">
                <button disabled={isCRUDLoading} onClick={() => setDeleteData(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-50">Batal</button>
                <button disabled={isCRUDLoading} onClick={executeDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                  {isCRUDLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : null}
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