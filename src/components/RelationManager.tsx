import React, { useState, useEffect } from "react";
import { Employee, EmployeeRelation } from "../types";
import { Plus, Trash2, Search, Link2, AlertTriangle } from "lucide-react";

interface EnrichedRelation extends EmployeeRelation {
  assessorNama: string;
  assessorDepartemen: string;
  assessedNama: string;
  assessedDepartemen: string;
}

export default function RelationManager() {
  const [relations, setRelations] = useState<EnrichedRelation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // From state
  const [formAssessor, setFormAssessor] = useState("");
  const [formAssessed, setFormAssessed] = useState("");
  const [formType, setFormType] = useState<"atasan" | "peer" | "bawahan">("peer");
  const [errorVisible, setErrorVisible] = useState("");
  const [successVisible, setSuccessVisible] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRel, resEmp] = await Promise.all([
        fetch("/api/relations"),
        fetch("/api/employees")
      ]);
      if (resRel.ok && resEmp.ok) {
        setRelations(await resRel.json());
        setEmployees(await resEmp.json());
      }
    } catch (err) {
      console.error(err);
      setErrorVisible("Gagal memuat data relasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorVisible("");
    setSuccessVisible("");

    if (!formAssessor || !formAssessed) {
      setErrorVisible("Pilih Penilai (Asesor) dan Yang Dinilai (Asesi) terlebih dahulu.");
      return;
    }

    if (formAssessor === formAssessed) {
      setErrorVisible("Karyawan tidak bisa membuat relasi penilai luar untuk dirinya sendiri (Sistem otomatis menambahkan relasi 'Self Assessment' untuk semua karyawan).");
      return;
    }

    try {
      const res = await fetch("/api/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessor_id: formAssessor,
          assessed_id: formAssessed,
          relation_type: formType
        })
      });

      if (res.ok) {
        setSuccessVisible("Relasi penilaian berhasil disimpan!");
        setFormAssessor("");
        setFormAssessed("");
        fetchData();
        setTimeout(() => setSuccessVisible(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorVisible("Gagal menyimpan relasi penilai.");
    }
  };

  const handleDeleteRelation = async (id: string) => {
    if (!confirm("Apakah kawan yakin ingin menghapus relasi penilai ini?")) return;

    try {
      const res = await fetch(`/api/relations/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRelations = relations.filter((rel) => {
    const term = searchTerm.toLowerCase();
    return (
      rel.assessorNama?.toLowerCase().includes(term) ||
      rel.assessedNama?.toLowerCase().includes(term) ||
      rel.relation_type?.toLowerCase().includes(term) ||
      rel.assessorDepartemen?.toLowerCase().includes(term)
    );
  });

  return (
    <div id="relation-manager-container" className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold font-display text-gray-800">Manajemen Relasi Penilai 360°</h2>
        <p className="text-xs text-gray-500 mt-1">Konfigurasikan hubungan pihak penilai (Atasan, Teman Sejawaban/Peer, Bawahan) untuk memetakan alur evaluasi.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 h-fit shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-xs font-display uppercase tracking-wider text-gray-700">Hubungkan Penilai</h3>
          </div>

          <form onSubmit={handleCreateRelation} className="space-y-4">
            {errorVisible && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-150 rounded-lg text-xs leading-relaxed flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorVisible}</span>
              </div>
            )}

            {successVisible && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-lg text-xs">
                {successVisible}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                A. Nama Penilai (Asesor) *
              </label>
              <select
                value={formAssessor}
                onChange={(e) => setFormAssessor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Karyawan Penilai --</option>
                {employees.map((e) => (
                  <option key={e.employee_id} value={e.employee_id}>
                    {e.nama} ({e.jabatan} - {e.departemen})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Siapa yang akan melayangkan skor evaluasi.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                B. Hubungan Relasi *
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-blue-800"
              >
                <option value="atasan">Atasan (Asesor adalah Atasan Asesi)</option>
                <option value="peer">Rekan Kerja / Peer (Setara)</option>
                <option value="bawahan">Bawahan (Asesor adalah Bawahan Asesi)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                C. Nama Yang Dinilai (Asesi) *
              </label>
              <select
                value={formAssessed}
                onChange={(e) => setFormAssessed(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Target Evaluasi --</option>
                {employees.map((e) => (
                  <option key={e.employee_id} value={e.employee_id}>
                    {e.nama} ({e.jabatan} - {e.departemen})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Karyawan target yang didefinisikan kinerjanya.</p>
            </div>

            <button
              id="btn-submit-relation"
              type="submit"
              className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Simpan Hubungan Relasi
            </button>
          </form>
        </div>

        {/* Right Table Map */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden lg:col-span-2 shadow-xs flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <span className="font-semibold text-xs font-display text-gray-700">Skema Pemetaan Penilaian 360° Global</span>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari peta evaluasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-100 flex-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading data relasi...</div>
            ) : filteredRelations.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Belum ada relasi penilai kustom yang dipetakan.
              </div>
            ) : (
              <div className="min-w-full divide-y divide-gray-100">
                {filteredRelations.map((rel) => (
                  <div key={rel.relation_id} className="p-4 hover:bg-gray-50/40 flex items-center justify-between gap-4 transition-colors">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center flex-1">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Penilai (Asesor)</div>
                        <div className="font-semibold text-gray-800 text-xs">{rel.assessorNama}</div>
                        <div className="text-[10px] text-gray-500">{rel.assessorDepartemen}</div>
                      </div>

                      <div className="flex justify-start sm:justify-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            rel.relation_type === "atasan"
                              ? "bg-blue-50 text-blue-700 border border-blue-150"
                              : rel.relation_type === "peer"
                              ? "bg-teal-50 text-teal-700 border border-teal-150"
                              : "bg-purple-50 text-purple-700 border border-purple-150"
                          }`}
                        >
                          {rel.relation_type === "atasan"
                            ? "↑ Atasan"
                            : rel.relation_type === "peer"
                            ? "↔ Rekan Kerja"
                            : "↓ Bawahan"}
                        </span>
                      </div>

                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Target (Asesi)</div>
                        <div className="font-semibold text-gray-800 text-xs">{rel.assessedNama}</div>
                        <div className="text-[10px] text-gray-500">{rel.assessedDepartemen}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRelation(rel.relation_id)}
                      className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Pemetaan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
