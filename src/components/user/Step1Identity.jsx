// src/components/user/Step1Identity.jsx
import React from 'react';
import { ShieldCheck, User, Building, Briefcase, Hash, Phone, Users, ChevronDown, ArrowRight } from 'lucide-react';

export default function Step1Identity({ formData, setFormData, setStep, showNotification }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let cleanedValue = value;

    // 1. Validasi khusus Nomor Telepon (Hanya Angka)
    if (name === 'noPribadi' || name === 'kontakDarurat') {
      cleanedValue = value.replace(/\D/g, ''); // Hapus semua karakter yang bukan angka
    } 
    // 2. Validasi khusus Nama (Hanya Huruf, Spasi, dan Tanda Baca Nama Dasar)
    else if (name === 'nama') {
      cleanedValue = value.replace(/[^a-zA-Z\s.,'-]/g, ''); 
    } 
    // 3. Validasi Instansi & Posisi (Izinkan huruf & angka, cegah simbol berbahaya HTML)
    // Note: Instansi dan Posisi butuh angka (misal: "PT Maju 45" atau "Staff IT 2")
    else {
      cleanedValue = value.replace(/[<>]/g, '');
    }

    // Batasi panjang maksimal teks (jangan di .trim() di sini agar spasi jalan)
    cleanedValue = cleanedValue.slice(0, 150);

    setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
  };

  const validateForm = () => {
    const required = ['nama', 'noPribadi', 'instansi', 'posisi', 'kontakDarurat', 'hubunganKontak'];
    
    // .trim() dilakukan di sini HANYA untuk pengecekan, jadi tidak mengganggu saat user mengetik
    if (required.some((k) => !formData[k]?.trim())) {
      showNotification("Harap lengkapi semua kolom identitas, pekerjaan, dan kontak darurat Anda.", "error");
      return;
    }
    setStep(2);
  };

  return (
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
  );
}