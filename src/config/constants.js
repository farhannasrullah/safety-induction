// src/config/constants.js

export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB1uQ54DGbQMiW-Ho8wPc1mNvld0cZUHyA",
    authDomain: "safety-inductpwr.firebaseapp.com",
    projectId: "safety-inductpwr",
    storageBucket: "safety-inductpwr.firebasestorage.app",
    messagingSenderId: "54533735940",
    appId: "1:54533735940:web:98794aa5f3be22a1c6d751",
    measurementId: "G-8FWZ263B1B",
  };
  
  export const GAS_URL = "https://script.google.com/macros/s/AKfycbzHUPGotfcGW5AOukI9lJ6Mo1ceI6qXvLvwjgzGcaz8nb4rIO_WDsnKZ61sm5_lS2-Z/exec";
  
  // eslint-disable-next-line no-undef
  export const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'safety-induction-app';
  
  export const MIN_WATCH_SECONDS = 286;
  export const ADMIN_SESSION_DURATION_MS = 3_600_000; // 1 hour
  export const NOTIFICATION_DURATION_MS = 5_000;
  
  export const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };
  
  export const POSTER_URLS = [
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
  
  export const QUIZ_DATA = [
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
      question: "Apakah video induction dan poster keselamatan membantu Anda memahami informasi dan potensi bahaya di area proyek?",
      options: ["Tidak membantu", "Cukup membantu", "Sangat membantu"],
    },
    {
      id: 7,
      isAnalysis: true,
      question: "Apakah penggunaan web aplikasi ini mempermudah proses safety induction?",
      options: ["Tidak efektif", "Cukup efektif", "Sangat efektif"],
    },
  ];
  
  export const SCORED_QUESTIONS = QUIZ_DATA.filter((q) => !q.isAnalysis);
  
  export const EMPTY_FORM = {
    nama: '', noPribadi: '', instansi: '',
    posisi: '', kontakDarurat: '', hubunganKontak: '',
  };