import React, { useState, useEffect } from "react";
import { AssessmentPeriod } from "../types";
import { Calendar, Plus, CalendarRange, CheckCircle2, XCircle, Trash2 } from "lucide-react";

interface PeriodManagerProps {
  onPeriodChanged?: () => void;
}

export default function PeriodManager({ onPeriodChanged }: PeriodManagerProps) {
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState("");

  // Form state
  const [showAdd, setShowAdd] = useState(false);
  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "closed">("active");

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/periods");
      if (res.ok) {
        setPeriods(await res.json());
      }
    } catch (e) {
      console.error(e);
      setErrorVisible("Gagal memuat daftar periode.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formStart || !formEnd) return;

    try {
      const res = await fetch("/api/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          start_date: formStart,
          end_date: formEnd,
          status: formStatus
        })
      });

      if (res.ok) {
        setShowAdd(false);
        setFormName("");
        setFormStart("");
        setFormEnd("");
        fetchPeriods();
        if (onPeriodChanged) onPeriodChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (p: AssessmentPeriod) => {
    const nextStatus = p.status === "active" ? "closed" : "active";
    if (nextStatus === "active") {
      const ok = confirm("Mengaktifkan periode ini akan menonaktifkan periode lainnya secara otomatis. Lanjutkan?");
      if (!ok) return;
    }

    try {
      const res = await fetch(`/api/periods/${p.period_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus
        })
      });

      if (res.ok) {
        fetchPeriods();
        if (onPeriodChanged) onPeriodChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus periode penilaian ini beserta nilai-nilai evaluasinya?")) return;
    try {
      const res = await fetch(`/api/periods/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPeriods();
        if (onPeriodChanged) onPeriodChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="period-manager-container" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold font-display text-gray-800">Manajemen Periode Penilaian</h2>
          <p className="text-xs text-gray-500 mt-1">Konfigurasi rentang tanggal evaluasi aktif. Sistem hanya memperbolehkan satu periode berstatus aktif dalam satu waktu.</p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Periode Baru
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-1.5 mb-4 text-gray-700">
            <CalendarRange className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-xs uppercase tracking-wider font-display">Buat Periode Evaluasi Kerja</h3>
          </div>

          <form onSubmit={handleCreatePeriod} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Periode *</label>
              <input
                type="text"
                required
                value={formName}
                placeholder="Semester II - 2026"
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-1.8 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tanggal Mulai *</label>
              <input
                type="date"
                required
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tanggal Akhir *</label>
              <input
                type="date"
                required
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-1.8 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer text-center"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.8 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Periods Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Memuat periode...</div>
          ) : periods.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">Belum ada periode evaluasi.</div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold font-display">
                  <th className="p-4">ID Periode</th>
                  <th className="p-4">Nama Periode</th>
                  <th className="p-4">Mulai</th>
                  <th className="p-4">Hingga</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periods.map((p) => (
                  <tr key={p.period_id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="p-4 font-mono text-gray-500">{p.period_id}</td>
                    <td className="p-4 font-semibold text-gray-800">{p.name}</td>
                    <td className="p-4 text-gray-600 font-mono">{p.start_date}</td>
                    <td className="p-4 text-gray-600 font-mono">{p.end_date}</td>
                    <td className="p-4">
                      {p.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-150 rounded-full text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif (Eksplorasi Terbuka)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-medium">
                          <XCircle className="w-3 h-3" />
                          Ditutup
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`px-2.5 py-1.2 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                            p.status === "active"
                              ? "bg-rose-50 text-rose-600 hover:bg-rose-105"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-105"
                          }`}
                          title={p.status === "active" ? "Tutup Periode" : "Jadikan periode ini Aktif"}
                        >
                          {p.status === "active" ? "Tutup Periode" : "Jadikan Aktif"}
                        </button>
                        
                        <button
                          onClick={() => handleDeletePeriod(p.period_id)}
                          className="p-1 px-2 bg-gray-55 text-rose-600 hover:bg-rose-50 hover:text-rose-750 border border-gray-100 rounded-md transition-colors cursor-pointer"
                          title="Hapus Periode & Seluruh Ulasan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
