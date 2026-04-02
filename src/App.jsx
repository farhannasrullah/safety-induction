// // Import the functions you need from the SDKs you need
// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   ShieldCheck, User, Building, Phone, PlayCircle, PenTool, 
//   CheckCircle, ArrowRight, AlertTriangle, RefreshCcw, Lock, Unlock, Info, FileSignature, HardHat, Users
// } from 'lucide-react';
// import { initializeApp } from 'firebase/app';
// import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
// import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// import { getAnalytics } from "firebase/analytics";

// // TODO: Add SDKs for Firebase products that you want to use

// // https://firebase.google.com/docs/web/setup#available-libraries


// // Your web app's Firebase configuration

// // For Firebase JS SDK v7.20.0 and later, measurementId is optional





// // --- FIREBASE INITIALIZATION ---
// // --- FIREBASE INITIALIZATION ---
// const firebaseConfig = {
//   apiKey: "AIzaSyB1uQ54DGbQMiW-Ho8wPc1mNvld0cZUHyA",
//   authDomain: "safety-inductpwr.firebaseapp.com",
//   projectId: "safety-inductpwr",
//   storageBucket: "safety-inductpwr.firebasestorage.app",
//   messagingSenderId: "54533735940",
//   appId: "1:54533735940:web:98794aa5f3be22a1c6d751",
//   measurementId: "G-8FWZ263B1B"
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
// const appId = 'safety-induction-app';
// const analytics = getAnalytics(app);

// export default function App() {
//   const [user, setUser] = useState(null);
//   const [step, setStep] = useState(1);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");


  
//   // Data Pendaftaran
//   const [formData, setFormData] = useState({
//     nama: '',
//     instansi: '',
//     kontakDarurat: '',
//     hubunganKontak: '' // State baru untuk Hubungan
//   });

//   // Status Video & Form
//   const [isVideoFinished, setIsVideoFinished] = useState(false);
//   const [agreedToTerms, setAgreedToTerms] = useState(false);
//   const videoRef = useRef(null);

//   // Status Tanda Tangan
//   const canvasRef = useRef(null);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [hasSignature, setHasSignature] = useState(false);

//   // --- AUTHENTICATION ---
//   useEffect(() => {
//     const initAuth = async () => {
//       try {
//         if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
//           await signInWithCustomToken(auth, __initial_auth_token);
//         } else {
//           await signInAnonymously(auth);
//         }
//       } catch (err) {
//         console.error("Autentikasi gagal:", err);
//         showError("Gagal terhubung ke server keamanan.");
//       }
//     };
//     initAuth();

//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//     });

//     return () => unsubscribe();
//   }, []);

//   // --- HANDLERS ---
//   const showError = (msg) => {
//     setErrorMsg(msg);
//     setTimeout(() => setErrorMsg(""), 5000); 
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const validateForm = () => {
//     if (!formData.nama || !formData.instansi || !formData.kontakDarurat || !formData.hubunganKontak) {
//       showError("Harap lengkapi semua data diri dan kontak darurat Anda.");
//       return false;
//     }
//     setErrorMsg("");
//     setStep(2);
//   };

//   const handleVideoEnded = () => {
//     setIsVideoFinished(true);
//   };

//   // --- SIGNATURE LOGIC ---
//   const startDrawing = (e) => {
//     e.preventDefault();
//     if (!agreedToTerms) {
//       showError("Mohon centang persetujuan terlebih dahulu.");
//       return;
//     }
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext('2d');
//     const rect = canvas.getBoundingClientRect();
//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
//     ctx.beginPath();
//     ctx.moveTo(clientX - rect.left, clientY - rect.top);
//     setIsDrawing(true);
//   };

//   const draw = (e) => {
//     e.preventDefault();
//     if (!isDrawing) return;
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const rect = canvas.getBoundingClientRect();
//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const clientY = e.touches ? e.touches[0].clientY : e.clientY;

//     ctx.lineTo(clientX - rect.left, clientY - rect.top);
//     ctx.strokeStyle = '#0f172a';
//     ctx.lineWidth = 3;
//     ctx.lineCap = 'round';
//     ctx.lineJoin = 'round';
//     ctx.stroke();
//     setHasSignature(true);
//   };

//   const stopDrawing = () => {
//     if (isDrawing) setIsDrawing(false);
//   };

//   const clearSignature = () => {
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext('2d');
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       setHasSignature(false);
//     }
//   };

//   useEffect(() => {
//     if (step === 3 && canvasRef.current) {
//       const canvas = canvasRef.current;
//       const parent = canvas.parentElement;
//       canvas.width = parent.clientWidth - 4; 
//       canvas.height = 200;
//     }
//   }, [step]);

//   // --- SUBMIT DATA ---
//   const handleSubmit = async () => {
//     if (!hasSignature) {
//       showError("Silakan berikan tanda tangan digital Anda.");
//       return;
//     }
//     setIsSubmitting(true);
//     try {
//       const canvas = canvasRef.current;
//       const signatureDataUrl = canvas.toDataURL("image/png");

//       const inductionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'inductions');
//       await addDoc(inductionsRef, {
        
//         userId: user.uid,
//         ...formData,
//         signature: signatureDataUrl,
//         timestamp: serverTimestamp(),
//         status: 'Completed'
//       });
//       await fetch("https://script.google.com/macros/s/AKfycbzHUPGotfcGW5AOukI9lJ6Mo1ceI6qXvLvwjgzGcaz8nb4rIO_WDsnKZ61sm5_lS2-Z/exec", {
//         method: "POST",
//         mode: "no-cors", // 🔥 WAJIB
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           nama: formData.nama,
//           instansi: formData.instansi,
//           kontakDarurat: formData.kontakDarurat,
//           hubunganKontak: formData.hubunganKontak,
//           signature: signatureDataUrl
//         }),
//       });
//       setStep(4);
//     } catch (err) {
//       console.error("ERROR FIRESTORE:", err); // 🔥 WAJIB
//       showError("Gagal mengirim data. Coba lagi.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // --- PROGRESS INDICATOR ---
//   const renderProgressBar = () => {
//     const steps = [
//       { num: 1, icon: User, label: "Identitas" },
//       { num: 2, icon: PlayCircle, label: "Edukasi" },
//       { num: 3, icon: FileSignature, label: "Pengesahan" }
//     ];
    
//     return (
//       <div className="relative mb-10 mt-4 px-4">
//         {/* Background Line */}
//         <div className="absolute top-5 left-10 right-10 h-1 bg-gray-200 rounded-full z-0"></div>
//         {/* Active Line (Animated) */}
//         <div 
//           className="absolute top-5 left-10 h-1 bg-yellow-400 rounded-full z-0 transition-all duration-700 ease-in-out"
//           style={{ width: `calc(${((Math.min(step, 3) - 1) / 2) * 100}% - ${step === 1 ? '0px' : '20px'})` }}
//         ></div>

//         <div className="relative z-10 flex justify-between">
//           {steps.map((s) => {
//             const isActive = step >= s.num;
//             const isCurrent = step === s.num;
//             const Icon = s.icon;
//             return (
//               <div key={s.num} className="flex flex-col items-center">
//                 <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 transform ${
//                   isActive ? 'bg-yellow-400 border-yellow-100 text-slate-900 scale-110 shadow-lg shadow-yellow-400/20' : 'bg-white border-gray-200 text-gray-400 scale-100'
//                 }`}>
//                   {isActive && !isCurrent ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
//                 </div>
//                 <span className={`text-xs mt-2 font-bold transition-colors duration-300 ${isActive ? 'text-slate-800' : 'text-gray-400'}`}>
//                   {s.label}
//                 </span>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <>
//       <style>{`
//         @keyframes fadeInUp {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
//         @keyframes slideDown {
//           from { opacity: 0; transform: translateY(-20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-slide-down { animation: slideDown 0.4s ease-out forwards; }
        
//         @keyframes pulseGlow {
//           0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
//           70% { box-shadow: 0 0 0 15px rgba(250, 204, 21, 0); }
//           100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
//         }
//         .btn-pulse-glow { animation: pulseGlow 2s infinite; }
//       `}</style>

//       {/* Light Theme Background with Illustration */}
//       <div className="min-h-screen font-sans text-slate-800 selection:bg-yellow-400 selection:text-slate-900 overflow-x-hidden relative">
        
//         {/* Background Image & Overlay */}
//         <div className="fixed inset-0 z-0 pointer-events-none">
//           <div 
//             className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25]"
//             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop')" }}
//           />
//           <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-white/80 to-slate-100/90 backdrop-blur-[2px]"></div>
//         </div>

//         {/* Content Wrapper */}
//         <div className="relative z-10">
//           {/* Header Light */}
//           <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
//             <div className="max-w-md mx-auto p-4 flex items-center justify-center gap-3">
//               <div className="bg-yellow-400 p-2 rounded-xl shadow-sm">
//                 <HardHat className="text-slate-900 w-7 h-7" />
//               </div>
//               <div>
//                 <h1 className="font-extrabold text-xl text-slate-900 tracking-wide uppercase leading-tight">Safety Induction</h1>
//                 <p className="text-xs text-slate-500 font-medium">Digital Verification System</p>
//               </div>
//             </div>
//           </header>

//           <main className="max-w-md mx-auto p-4 py-8 relative">
          
//           {/* Toast Error Notification */}
//           {errorMsg && (
//             <div className="absolute top-0 left-4 right-4 z-50 animate-slide-down">
//               <div className="bg-red-500/95 backdrop-blur-sm text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 border border-red-400">
//                 <AlertTriangle className="w-6 h-6 shrink-0 animate-pulse" />
//                 <p className="text-sm font-medium">{errorMsg}</p>
//               </div>
//             </div>
//           )}

//           {step !== 4 && renderProgressBar()}

//           {/* STEP 1: Form Pendaftaran */}
//           {step === 1 && (
//             <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 animate-fade-in-up border border-gray-100">
//               <div className="mb-6">
//                 <h2 className="text-2xl font-extrabold text-slate-900">Registrasi</h2>
//                 <p className="text-sm text-slate-500 mt-1">Lengkapi data identitas Anda untuk memulai.</p>
//               </div>

//               {/* Data Diri Section */}
//               <div className="space-y-5">
//                 <div className="group">
//                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">Nama Lengkap</label>
//                   <div className="relative">
//                     <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
//                     <input
//                       type="text"
//                       name="nama"
//                       value={formData.nama}
//                       onChange={handleInputChange}
//                       className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium"
//                       placeholder="Sesuai Kartu Identitas (KTP)"
//                     />
//                   </div>
//                 </div>
                
//                 <div className="group">
//                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">Asal Instansi / Perusahaan</label>
//                   <div className="relative">
//                     <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
//                     <input
//                       type="text"
//                       name="instansi"
//                       value={formData.instansi}
//                       onChange={handleInputChange}
//                       className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium"
//                       placeholder="Nama Vendor / Kontraktor"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Kontak Darurat Section */}
//               <div className="mt-8 pt-6 border-t border-gray-100">
//                 <div className="mb-5 flex items-center gap-2">
//                   <Phone className="w-5 h-5 text-red-500" />
//                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kontak Darurat</h3>
//                 </div>
                
//                 <div className="space-y-5">
//                   <div className="group">
//                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">No. Telepon Darurat</label>
//                     <div className="relative">
//                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
//                       <input
//                         type="tel"
//                         name="kontakDarurat"
//                         value={formData.kontakDarurat}
//                         onChange={handleInputChange}
//                         className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium"
//                         placeholder="Misal: 0812-3456-7890"
//                       />
//                     </div>
//                   </div>

//                   <div className="group">
//                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">Hubungan dengan Anda</label>
//                     <div className="relative">
//                       <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
//                       <input
//                         type="text"
//                         name="hubunganKontak"
//                         value={formData.hubunganKontak}
//                         onChange={handleInputChange}
//                         className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium"
//                         placeholder="Misal: Istri, Suami, Orang Tua, Kakak"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <button
//                 onClick={validateForm}
//                 className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-slate-900/20 group"
//               >
//                 Lanjutkan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//               </button>
//             </div>
//           )}

//           {/* STEP 2: Video Induksi */}
//           {step === 2 && (
//             <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 animate-fade-in-up border border-gray-100">
//               <div className="mb-6 flex items-start gap-4">
//                 <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 shrink-0">
//                   <PlayCircle className="w-8 h-8" />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-extrabold text-slate-900">Materi Edukasi K3</h2>
//                   <p className="text-sm text-slate-500 mt-1 leading-relaxed">
//                     Tonton video panduan keselamatan kerja ini hingga selesai untuk membuka tahap pengesahan.
//                   </p>
//                 </div>
//               </div>

//               <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-inner ring-4 ring-slate-50 mb-6 group">
//                 <video
//                   ref={videoRef}
//                   controls
//                   controlsList="nodownload nofullscreen noremoteplayback"
//                   disablePictureInPicture
//                   onEnded={handleVideoEnded}
//                   className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
//                   poster="https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=800&auto=format&fit=crop"
//                 >
//                   <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
//                   Browser tidak mendukung pemutar video.
//                 </video>
                
//                 {/* Overlay Informatif jika belum selesai */}
//                 {!isVideoFinished && (
//                   <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none border border-white/10">
//                     <span className="relative flex h-2 w-2">
//                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
//                       <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
//                     </span>
//                     <span className="text-xs font-semibold text-white tracking-wider">WAJIB DITONTON</span>
//                   </div>
//                 )}
//               </div>

//               <button
//                 onClick={() => {
//                   if (isVideoFinished) setStep(3);
//                   else showError("Anda harus menonton video sampai selesai.");
//                 }}
//                 disabled={!isVideoFinished}
//                 className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${
//                   isVideoFinished 
//                     ? 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-400/30 btn-pulse-glow transform hover:-translate-y-1' 
//                     : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-200'
//                 }`}
//               >
//                 {isVideoFinished ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
//                 {isVideoFinished ? 'Lanjut Tanda Tangan' : 'Video Terkunci'}
//               </button>
//             </div>
//           )}

//           {/* STEP 3: E-Signature */}
//           {step === 3 && (
//             <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 animate-fade-in-up border border-gray-100">
//               <div className="mb-6 flex items-start gap-4">
//                 <div className="bg-yellow-50 p-3 rounded-2xl text-yellow-600 shrink-0">
//                   <PenTool className="w-8 h-8" />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-extrabold text-slate-900">Pengesahan</h2>
//                   <p className="text-sm text-slate-500 mt-1">Konfirmasi komitmen keselamatan Anda.</p>
//                 </div>
//               </div>

//               {/* Informative Agreement Box */}
//               <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl text-sm text-slate-600 mb-5 shadow-sm">
//                 <div className="flex items-start gap-3">
//                   <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
//                   <div>
//                     <p className="font-medium text-slate-800 mb-2">Pernyataan Komitmen:</p>
//                     <p className="text-justify leading-relaxed">
//                       Saya <strong>{formData.nama}</strong> ({formData.instansi}) telah memahami materi K3, bersedia mematuhi peraturan di area kerja, dan bertanggung jawab atas kelalaian prosedur.
//                     </p>
//                   </div>
//                 </div>
                
//                 <label className="mt-4 flex items-center gap-3 cursor-pointer p-2 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
//                   <input 
//                     type="checkbox" 
//                     className="w-5 h-5 rounded border-gray-300 text-slate-900 focus:ring-slate-900 accent-slate-900"
//                     checked={agreedToTerms}
//                     onChange={(e) => setAgreedToTerms(e.target.checked)}
//                   />
//                   <span className="font-bold text-slate-800 text-sm select-none">Saya menyetujui pernyataan di atas.</span>
//                 </label>
//               </div>

//               <div className="mb-6">
//                 <div className="flex justify-between items-end mb-2">
//                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Area Tanda Tangan</label>
//                   {hasSignature && (
//                     <button 
//                       onClick={clearSignature}
//                       className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md transition-colors"
//                     >
//                       <RefreshCcw className="w-3 h-3" /> Ulangi
//                     </button>
//                   )}
//                 </div>
                
//                 <div className={`border-2 border-dashed rounded-2xl bg-white overflow-hidden relative transition-colors ${agreedToTerms ? 'border-yellow-400 ring-4 ring-yellow-50' : 'border-gray-200 opacity-70'}`}>
//                   <canvas
//                     ref={canvasRef}
//                     onMouseDown={startDrawing}
//                     onMouseMove={draw}
//                     onMouseUp={stopDrawing}
//                     onMouseOut={stopDrawing}
//                     onTouchStart={startDrawing}
//                     onTouchMove={draw}
//                     onTouchEnd={stopDrawing}
//                     style={{ touchAction: 'none' }}
//                     className={`bg-[#fafafa] w-full ${agreedToTerms ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
//                   />
//                   {!hasSignature && (
//                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
//                       <PenTool className="w-8 h-8 mb-2 opacity-30" />
//                       <span className="font-medium text-sm">
//                         {agreedToTerms ? "Goreskan tanda tangan di sini" : "Centang persetujuan terlebih dahulu"}
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setStep(2)}
//                   className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-colors"
//                 >
//                   Kembali
//                 </button>
//                 <button
//                   onClick={handleSubmit}
//                   disabled={isSubmitting || !hasSignature}
//                   className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//                 >
//                   {isSubmitting ? (
//                     <span className="flex items-center gap-2">
//                       <RefreshCcw className="w-5 h-5 animate-spin" /> Memproses...
//                     </span>
//                   ) : (
//                     <>Kirim Data <CheckCircle className="w-5 h-5 text-yellow-400" /></>
//                   )}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* STEP 4: Success */}
//           {step === 4 && (
//             <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 text-center animate-fade-in-up border border-gray-100 relative overflow-hidden">
//               {/* Background Decoration */}
//               <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-transparent"></div>
              
//               <div className="relative z-10">
//                 <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20 ring-8 ring-green-50">
//                   <CheckCircle className="w-12 h-12 text-white animate-[scaleIn_0.5s_ease-out]" />
//                 </div>
                
//                 <h2 className="text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">Akses Diberikan!</h2>
//                 <p className="text-slate-500 mb-8 leading-relaxed">
//                   Terima kasih, <strong className="text-slate-800">{formData.nama}</strong>.<br/>
//                   Data induksi K3 Anda telah terekam aman di sistem.
//                 </p>
                
//                 <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8 text-left flex items-center gap-4 shadow-inner">
//                   <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
//                     <ShieldCheck className="w-8 h-8 text-green-500" />
//                   </div>
//                   <div>
//                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Keamanan</p>
//                     <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
//                       <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
//                       Clear for Entry
//                     </p>
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => window.location.reload()}
//                   className="bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl w-full hover:bg-slate-800 transition-colors shadow-md"
//                 >
//                   Selesai & Kembali ke Awal
//                 </button>
//               </div>
//             </div>
//           )}

//         </main>
        
//         {/* Footer */}
//         <footer className="text-center pb-8 pt-4 text-xs font-medium text-slate-500">
//           <p>&copy; 2026 Digital Safety Induction.</p>
//           <p className="mt-1">Developed by Farhan Nasrullah</p>
//         </footer>
        
//         </div> {/* End Content Wrapper */}
//       </div>
//     </>
//   );
// }

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, User, Building, Phone, PlayCircle, PenTool, 
  CheckCircle, ArrowRight, AlertTriangle, RefreshCcw, Lock, Unlock, Info, FileSignature, HardHat, Users,
  LayoutDashboard, Search, Calendar, ArrowUpDown, ArrowLeft, Image as ImageIcon, Key, LogOut
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
    apiKey: "AIzaSyB1uQ54DGbQMiW-Ho8wPc1mNvld0cZUHyA",
    authDomain: "safety-inductpwr.firebaseapp.com",
    projectId: "safety-inductpwr",
    storageBucket: "safety-inductpwr.firebasestorage.app",
    messagingSenderId: "54533735940",
    appId: "1:54533735940:web:98794aa5f3be22a1c6d751",
    measurementId: "G-8FWZ263B1B"
  };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'safety-induction-app';

// Helper: Dapatkan tanggal hari ini format YYYY-MM-DD (Local Time)
const getTodayDate = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().split('T')[0];
};

export default function App() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('user'); // 'user' | 'admin'
  
  // ==========================================
  // STATE: USER MODE (INDUKSI)
  // ==========================================
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    nama: '', instansi: '', kontakDarurat: '', hubunganKontak: ''
  });
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // ==========================================
  // STATE: ADMIN MODE
  // ==========================================
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState("");

  const [adminData, setAdminData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(getTodayDate()); // Default hari ini
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' (Terbaru) | 'asc' (Terlama)
  const [selectedSignature, setSelectedSignature] = useState(null); 

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
        console.error("Autentikasi gagal:", err);
        showError("Gagal terhubung ke server keamanan.");
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);
  // --- CEK LOGIN ADMIN DI LOCALSTORAGE ---
  
useEffect(() => {
  const savedAuth = localStorage.getItem('adminAuth');

  if (savedAuth) {
    const parsed = JSON.parse(savedAuth);

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (parsed.isLoggedIn && (now - parsed.loginTime < oneHour)) {
      setIsAdminLoggedIn(true);
      setViewMode('admin'); // langsung masuk dashboard
    } else {
      localStorage.removeItem('adminAuth');
    }
  }
}, []);

  // --- FETCH DATA FOR ADMIN ---
  useEffect(() => {
    if (viewMode === 'admin' && isAdminLoggedIn && user) {
      const inductionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'inductions');
      const unsubscribe = onSnapshot(inductionsRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAdminData(data);
      }, (error) => {
        console.error("Gagal mengambil data admin:", error);
      });
      return () => unsubscribe();
    }
  }, [viewMode, isAdminLoggedIn, user]);

  // --- HANDLERS (USER) ---
  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000); 
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.nama || !formData.instansi || !formData.kontakDarurat || !formData.hubunganKontak) {
      showError("Harap lengkapi semua data diri dan kontak darurat Anda.");
      return false;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleVideoEnded = () => setIsVideoFinished(true);

  // --- SIGNATURE LOGIC ---
  const startDrawing = (e) => {
    e.preventDefault();
    if (!agreedToTerms) return showError("Mohon centang persetujuan terlebih dahulu.");
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
    if (viewMode === 'user' && step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth - 4; 
      canvas.height = 200;
    }
  }, [step, viewMode]);

  // --- SUBMIT DATA ---
  const handleSubmit = async () => {
    if (!hasSignature) return showError("Silakan berikan tanda tangan digital Anda.");
    setIsSubmitting(true);
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas.toDataURL("image/png");
      const inductionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'inductions');
      await addDoc(inductionsRef, {
        userId: user.uid,
        ...formData,
        signature: signatureDataUrl,
        timestamp: serverTimestamp(),
        status: 'Completed'
      });
      await fetch("https://script.google.com/macros/s/AKfycbzHUPGotfcGW5AOukI9lJ6Mo1ceI6qXvLvwjgzGcaz8nb4rIO_WDsnKZ61sm5_lS2-Z/exec", {
                method: "POST",
                mode: "no-cors", // 🔥 WAJIB
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  nama: formData.nama,
                  instansi: formData.instansi,
                  kontakDarurat: formData.kontakDarurat,
                  hubunganKontak: formData.hubunganKontak,
                  signature: signatureDataUrl
                }),
              });
      setStep(4);
    } catch (err) {
      showError("Gagal mengirim data. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ADMIN AUTH HANDLER ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
  
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      const loginData = {
        isLoggedIn: true,
        loginTime: Date.now() // simpan waktu login
      };
  
      localStorage.setItem('adminAuth', JSON.stringify(loginData));
  
      setIsAdminLoggedIn(true);
      setLoginError("");
      setLoginForm({ username: '', password: '' });
    } else {
      setLoginError("Username atau password salah!");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminAuth'); // hapus storage
    setIsAdminLoggedIn(false);
    setViewMode('user');
  };

  // --- ADMIN DATA PROCESSING (Filter & Sort In-Memory) ---
  const getProcessedAdminData = () => {
    let processed = [...adminData];

    // 1. Filter by Search (Name or Instansi)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processed = processed.filter(item => 
        (item.nama && item.nama.toLowerCase().includes(lowerSearch)) ||
        (item.instansi && item.instansi.toLowerCase().includes(lowerSearch))
      );
    }

    // 2. Filter by Date (Default Hari Ini)
    if (filterDate) {
      processed = processed.filter(item => {
        if (!item.timestamp) return false;
        // Handle pending writes (timestamp is null temporarily)
        const dateObj = item.timestamp.toDate ? item.timestamp.toDate() : new Date();
        // Perbaikan: Konversi waktu ke Local TimeZone sebelum diubah ke string YYYY-MM-DD
        const offset = dateObj.getTimezoneOffset() * 60000;
        const localDateStr = new Date(dateObj.getTime() - offset).toISOString().split('T')[0];
        return localDateStr === filterDate;
      });
    }

    // 3. Sort by Timestamp
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
    return new Intl.DateTimeFormat('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(date);
  };

  // ==========================================
  // RENDERERS
  // ==========================================
  
  // --- PROGRESS BAR (USER) ---
  const renderProgressBar = () => {
    const steps = [
      { num: 1, icon: User, label: "Identitas" },
      { num: 2, icon: PlayCircle, label: "Edukasi" },
      { num: 3, icon: FileSignature, label: "Pengesahan" }
    ];
    return (
      <div className="relative mb-10 mt-4 px-4">
        <div className="absolute top-5 left-10 right-10 h-1 bg-gray-200 rounded-full z-0"></div>
        <div 
          className="absolute top-5 left-10 h-1 bg-yellow-400 rounded-full z-0 transition-all duration-700 ease-in-out"
          style={{ width: `calc(${((Math.min(step, 3) - 1) / 2) * 100}% - ${step === 1 ? '0px' : '20px'})` }}
        ></div>
        <div className="relative z-10 flex justify-between">
          {steps.map((s) => {
            const isActive = step >= s.num;
            const isCurrent = step === s.num;
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 transform ${
                  isActive ? 'bg-yellow-400 border-yellow-100 text-slate-900 scale-110 shadow-lg shadow-yellow-400/20' : 'bg-white border-gray-200 text-gray-400 scale-100'
                }`}>
                  {isActive && !isCurrent ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-2 font-bold transition-colors duration-300 ${isActive ? 'text-slate-800' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-down { animation: slideDown 0.4s ease-out forwards; }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(250, 204, 21, 0); } 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); } }
        .btn-pulse-glow { animation: pulseGlow 2s infinite; }
        /* Scrollbar styling untuk tabel admin */
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="min-h-screen font-sans text-slate-800 selection:bg-yellow-400 selection:text-slate-900 overflow-x-hidden relative bg-slate-50">
        
        {/* Background Overlay */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25]"
               style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop')" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 via-white/90 to-slate-100/95 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          
          {/* Header */}
          <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className={`mx-auto p-4 flex items-center justify-between gap-3 transition-all ${viewMode === 'admin' && isAdminLoggedIn ? 'max-w-7xl' : 'max-w-md'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl shadow-sm ${viewMode === 'admin' ? 'bg-slate-900 text-white' : 'bg-yellow-400 text-slate-900'}`}>
                  {viewMode === 'admin' ? <LayoutDashboard className="w-7 h-7" /> : <HardHat className="w-7 h-7" />}
                </div>
                <div>
                  <h1 className="font-extrabold text-xl text-slate-900 tracking-wide uppercase leading-tight">
                    {viewMode === 'admin' ? (isAdminLoggedIn ? 'Admin Dashboard' : 'Admin Login') : 'Safety Induction'}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewMode === 'admin' ? 'Database Kepatuhan K3' : 'Digital Verification System'}
                  </p>
                </div>
              </div>
              
              {viewMode === 'admin' && (
                <div className="flex gap-2">
                  {isAdminLoggedIn && (
                    <button 
                      onClick={handleAdminLogout}
                      className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-100"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  )}
                  {!isAdminLoggedIn && (
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

          <main className={`mx-auto p-4 py-8 relative flex-grow w-full transition-all ${viewMode === 'admin' && isAdminLoggedIn ? 'max-w-7xl' : 'max-w-md'}`}>
            
            {/* Toast Error Notification */}
            {errorMsg && viewMode === 'user' && (
              <div className="absolute top-0 left-4 right-4 z-50 animate-slide-down">
                <div className="bg-red-500/95 backdrop-blur-sm text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 border border-red-400">
                  <AlertTriangle className="w-6 h-6 shrink-0 animate-pulse" />
                  <p className="text-sm font-medium">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW: ADMIN LOGIN */}
            {/* ========================================================= */}
            {viewMode === 'admin' && !isAdminLoggedIn && (
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 animate-fade-in-up border border-gray-100 mt-4">
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

                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                      <input 
                        type="text" 
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" 
                        placeholder="Masukkan username" 
                        required
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">Password</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                      <input 
                        type="password" 
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" 
                        placeholder="Masukkan password" 
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-slate-900/20">
                    Masuk Dashboard <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-xs text-slate-400">Hint: admin / admin123</p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW: ADMIN DASHBOARD */}
            {/* ========================================================= */}
            {viewMode === 'admin' && isAdminLoggedIn && (
              <div className="animate-fade-in-up">
                
                {/* Control Panel (Filter & Sort) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Cari Nama / Instansi..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm"
                    />
                  </div>
                  
                  <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none text-sm text-slate-700"
                        title="Filter berdasarkan tanggal"
                      />
                    </div>
                    
                    <button 
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                    </button>
                    
                    {/* Tombol Clear Date */}
                    {filterDate && (
                      <button 
                        onClick={() => setFilterDate("")}
                        className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                        title="Tampilkan Semua Tanggal"
                      >
                        Semua
                      </button>
                    )}
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-100 text-xs uppercase tracking-wider text-slate-500">
                          <th className="p-4 font-bold">Pengunjung / Pekerja</th>
                          <th className="p-4 font-bold">Instansi</th>
                          <th className="p-4 font-bold">Kontak Darurat</th>
                          <th className="p-4 font-bold">Waktu Induksi</th>
                          <th className="p-4 font-bold text-center">Tanda Tangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {getProcessedAdminData().length > 0 ? (
                          getProcessedAdminData().map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-900">{item.nama}</div>
                                <div className="text-xs text-green-600 font-medium flex items-center gap-1 mt-0.5">
                                  <CheckCircle className="w-3 h-3" /> {item.status}
                                </div>
                              </td>
                              <td className="p-4 text-slate-700">{item.instansi}</td>
                              <td className="p-4">
                                <div className="font-medium text-slate-800">{item.kontakDarurat}</div>
                                <div className="text-xs text-slate-500">Hub: {item.hubunganKontak}</div>
                              </td>
                              <td className="p-4 text-slate-600 whitespace-nowrap">
                                {formatDate(item.timestamp)}
                              </td>
                              <td className="p-4 text-center">
                                {item.signature ? (
                                  <button 
                                    onClick={() => setSelectedSignature(item.signature)}
                                    className="inline-block relative group"
                                  >
                                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ImageIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <img 
                                      src={item.signature} 
                                      alt={`Tanda tangan ${item.nama}`} 
                                      className="h-12 w-24 object-contain bg-white border border-gray-200 rounded-lg p-1"
                                    />
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Tidak ada</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="p-12 text-center text-slate-500">
                              <div className="flex flex-col items-center justify-center">
                                <Search className="w-10 h-10 text-gray-300 mb-3" />
                                <p className="font-medium">Tidak ada data yang ditemukan.</p>
                                <p className="text-xs mt-1">Coba ubah filter tanggal atau kata kunci pencarian.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signature Modal Preview */}
                {selectedSignature && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedSignature(null)}>
                    <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-lg w-full animate-fade-in-up" onClick={e => e.stopPropagation()}>
                      <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center text-lg">
                        Pratinjau Tanda Tangan
                        <button onClick={() => setSelectedSignature(null)} className="text-slate-400 hover:text-red-500 transition-colors p-1">&times;</button>
                      </h3>
                      <div className="bg-[#fafafa] border-2 border-dashed border-gray-200 rounded-2xl p-4 flex justify-center min-h-[200px] items-center">
                        <img src={selectedSignature} alt="Tanda Tangan Besar" className="max-w-full h-auto" />
                      </div>
                      <button onClick={() => setSelectedSignature(null)} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 transition-colors text-white py-3.5 rounded-2xl font-bold shadow-lg">Tutup</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW: USER MODE (FORM) */}
            {/* ========================================================= */}
            {viewMode === 'user' && (
              <>
                {step !== 4 && renderProgressBar()}

                {/* STEP 1: Form Pendaftaran */}
                {step === 1 && (
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 animate-fade-in-up border border-gray-100">
                    <div className="mb-6">
                      <h2 className="text-2xl font-extrabold text-slate-900">Registrasi</h2>
                      <p className="text-sm text-slate-500 mt-1">Lengkapi data identitas Anda untuk memulai.</p>
                    </div>

                    <div className="space-y-5">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                          <input type="text" name="nama" value={formData.nama} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Sesuai Kartu Identitas (KTP)" />
                        </div>
                      </div>
                      
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">Asal Instansi / Perusahaan</label>
                        <div className="relative">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                          <input type="text" name="instansi" value={formData.instansi} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Nama Vendor / Kontraktor" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="mb-5 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-red-500" />
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kontak Darurat</h3>
                      </div>
                      <div className="space-y-5">
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">No. Telepon Darurat</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                            <input type="tel" name="kontakDarurat" value={formData.kontakDarurat} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Misal: 0812-3456-7890" />
                          </div>
                        </div>

                        <div className="group">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-yellow-600 transition-colors">Hubungan dengan Anda</label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                            <input type="text" name="hubunganKontak" value={formData.hubunganKontak} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all text-slate-800 font-medium" placeholder="Misal: Istri, Suami, Orang Tua, Kakak" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button onClick={validateForm} className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-slate-900/20 group">
                      Lanjutkan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}

                {/* STEP 2: Video Induksi */}
                {step === 2 && (
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 animate-fade-in-up border border-gray-100">
                    <div className="mb-6 flex items-start gap-4">
                      <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 shrink-0"><PlayCircle className="w-8 h-8" /></div>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900">Materi Edukasi K3</h2>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Tonton video panduan keselamatan kerja ini hingga selesai untuk membuka tahap pengesahan.</p>
                      </div>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-inner ring-4 ring-slate-50 mb-6 group">
                      <video ref={videoRef} controls controlsList="nodownload nofullscreen noremoteplayback" disablePictureInPicture onEnded={handleVideoEnded} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" poster="https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=800&auto=format&fit=crop">
                        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                        Browser tidak mendukung pemutar video.
                      </video>
                      {!isVideoFinished && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none border border-white/10">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          <span className="text-xs font-semibold text-white tracking-wider">WAJIB DITONTON</span>
                        </div>
                      )}
                    </div>

                    <button onClick={() => { if (isVideoFinished) setStep(3); else showError("Anda harus menonton video sampai selesai."); }} disabled={!isVideoFinished} className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${isVideoFinished ? 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-400/30 btn-pulse-glow transform hover:-translate-y-1' : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-200'}`}>
                      {isVideoFinished ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      {isVideoFinished ? 'Lanjut Tanda Tangan' : 'Video Terkunci'}
                    </button>
                  </div>
                )}

                {/* STEP 3: E-Signature */}
                {step === 3 && (
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 animate-fade-in-up border border-gray-100">
                    <div className="mb-6 flex items-start gap-4">
                      <div className="bg-yellow-50 p-3 rounded-2xl text-yellow-600 shrink-0"><PenTool className="w-8 h-8" /></div>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900">Pengesahan</h2>
                        <p className="text-sm text-slate-500 mt-1">Konfirmasi komitmen keselamatan Anda.</p>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl text-sm text-slate-600 mb-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-800 mb-2">Pernyataan Komitmen:</p>
                          <p className="text-justify leading-relaxed">Saya <strong>{formData.nama}</strong> ({formData.instansi}) telah memahami materi K3, bersedia mematuhi peraturan di area kerja, dan bertanggung jawab atas kelalaian prosedur.</p>
                        </div>
                      </div>
                      <label className="mt-4 flex items-center gap-3 cursor-pointer p-2 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                        <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-slate-900 focus:ring-slate-900 accent-slate-900" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                        <span className="font-bold text-slate-800 text-sm select-none">Saya menyetujui pernyataan di atas.</span>
                      </label>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Area Tanda Tangan</label>
                        {hasSignature && <button onClick={clearSignature} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md transition-colors"><RefreshCcw className="w-3 h-3" /> Ulangi</button>}
                      </div>
                      <div className={`border-2 border-dashed rounded-2xl bg-white overflow-hidden relative transition-colors ${agreedToTerms ? 'border-yellow-400 ring-4 ring-yellow-50' : 'border-gray-200 opacity-70'}`}>
                        <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ touchAction: 'none' }} className={`bg-[#fafafa] w-full ${agreedToTerms ? 'cursor-crosshair' : 'cursor-not-allowed'}`} />
                        {!hasSignature && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                            <PenTool className="w-8 h-8 mb-2 opacity-30" />
                            <span className="font-medium text-sm">{agreedToTerms ? "Goreskan tanda tangan di sini" : "Centang persetujuan terlebih dahulu"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-colors">Kembali</button>
                      <button onClick={handleSubmit} disabled={isSubmitting || !hasSignature} className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                        {isSubmitting ? <span className="flex items-center gap-2"><RefreshCcw className="w-5 h-5 animate-spin" /> Memproses...</span> : <>Kirim Data <CheckCircle className="w-5 h-5 text-yellow-400" /></>}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Success */}
                {step === 4 && (
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 text-center animate-fade-in-up border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-transparent"></div>
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20 ring-8 ring-green-50">
                        <CheckCircle className="w-12 h-12 text-white animate-[scaleIn_0.5s_ease-out]" />
                      </div>
                      <h2 className="text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">Akses Diberikan!</h2>
                      <p className="text-slate-500 mb-8 leading-relaxed">Terima kasih, <strong className="text-slate-800">{formData.nama}</strong>.<br/>Data induksi K3 Anda telah terekam aman di sistem.</p>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8 text-left flex items-center gap-4 shadow-inner">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100"><ShieldCheck className="w-8 h-8 text-green-500" /></div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Keamanan</p>
                          <p className="text-lg font-bold text-slate-900 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>Clear for Entry</p>
                        </div>
                      </div>

                      <button onClick={() => window.location.reload()} className="bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl w-full hover:bg-slate-800 transition-colors shadow-md">
                        Selesai & Kembali ke Awal
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </main>
          
          {/* Footer with Hidden Admin Toggle */}
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
                    title="Buka Panel Admin"
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