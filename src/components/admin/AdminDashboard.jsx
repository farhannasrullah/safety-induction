// src/components/admin/AdminDashboard.jsx
import React, { useState, useMemo } from 'react';
import { Search, Calendar, ArrowUpDown, RefreshCcw, CheckCircle, ImageIcon, Edit, Trash2, XCircle, PenTool, X, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { APP_ID } from '../../config/constants';
import { formatDate, sanitizeText, gasPost, getTodayDate } from '../../utils/helpers';
import useDebounce from '../../hooks/useDebounce';
import ScoreBadge from '../common/ScoreBadge';

export default function AdminDashboard({ adminData, isAdminLoading, showNotification }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(getTodayDate());
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isCRUDLoading, setIsCRUDLoading] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 250);

  const executeDelete = async () => {
    if (!deleteData) return;
    setIsCRUDLoading(true);
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'inductions', deleteData.id));
      await gasPost({ action: 'delete', id: deleteData.id });
      setDeleteData(null);
      showNotification("Data pengunjung berhasil dihapus.", "success");
    } catch (err) {
      console.error('[Delete]', err);
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
    if (!editData) return;
    setIsCRUDLoading(true);
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'inductions', editData.id);
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
  };

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
        const d = item.timestamp.toDate ? item.timestamp.toDate() : new Date();
        const offset = d.getTimezoneOffset() * 60_000;
        const local = new Date(d - offset).toISOString().split('T')[0];
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

  return (
    <div className="animate-fade-in-up">
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

      {/* Signature Preview Modal */}
      {selectedSignature && (
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

      {/* Edit Modal */}
      {isEditModalOpen && editData && (
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

      {/* Delete Confirm Modal */}
      {deleteData && (
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
  );
}