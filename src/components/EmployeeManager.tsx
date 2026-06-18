import React, { useState, useEffect } from "react";
import { Employee } from "../types";
import { Plus, Edit, Trash2, Search, Building2, UserPlus, RefreshCw, Layers } from "lucide-react";

interface EmployeeManagerProps {
  onRefreshStats?: () => void;
}

export default function EmployeeManager({ onRefreshStats }: EmployeeManagerProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [errorVisible, setErrorVisible] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [importing, setImporting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formJabatan, setFormJabatan] = useState("");
  const [formDepartemen, setFormDepartemen] = useState("");
  const [formPotential, setFormPotential] = useState<"high" | "medium" | "low">("medium");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) {
      console.error(e);
      setErrorVisible("Gagal mengambil data karyawan");
    } finally {
      setLoading(false);
    }
  };

  const handleImportSample = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/employees/import-sample", { method: "POST" });
      if (res.ok) {
        await fetchEmployees();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error(err);
      setErrorVisible("Gagal memuat ulang data default.");
    } finally {
      setImporting(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formJabatan || !formDepartemen) return;

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formName,
          jabatan: formJabatan,
          departemen: formDepartemen,
          potential: formPotential,
          username: formUsername || formName.toLowerCase().replace(/\s+/g, ""),
          password: formPassword || "password123",
          role: "karyawan",
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchEmployees();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error(err);
      setErrorVisible("Gagal menyimpan data karyawan baru.");
    }
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmployeeId(emp.employee_id);
    setFormName(emp.nama);
    setFormJabatan(emp.jabatan);
    setFormDepartemen(emp.departemen);
    setFormPotential(emp.potential);
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployeeId) return;

    try {
      const res = await fetch(`/api/employees/${editingEmployeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formName,
          jabatan: formJabatan,
          departemen: formDepartemen,
          potential: formPotential,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        resetForm();
        fetchEmployees();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data karyawan ini serta seluruh relasi penilaiannya?")) return;

    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEmployees();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormJabatan("");
    setFormDepartemen("");
    setFormPotential("medium");
    setFormUsername("");
    setFormPassword("");
    setEditingEmployeeId(null);
  };

  const departments = Array.from(new Set(employees.map((e) => e.departemen)));

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "all" || emp.departemen === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div id="employee-manager-container" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold font-display text-gray-800">Manajemen Data Karyawan</h2>
          <p className="text-xs text-gray-500 mt-1">Kelola biodata, jabatan, departemen, serta kredensial login karyawan.</p>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            id="btn-import-sample"
            onClick={handleImportSample}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${importing ? "animate-spin" : ""}`} />
            Muat Contoh Data (Reset)
          </button>
          
          <button
            id="btn-add-employee"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Karyawan Baru
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Karyawan</div>
            <div className="text-2xl font-bold text-gray-800 font-display">{employees.length}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Departemen Berbeda</div>
            <div className="text-2xl font-bold text-gray-800 font-display">{departments.length}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Hasil Pencarian</div>
            <div className="text-2xl font-bold text-gray-800 font-display">{filteredEmployees.length}</div>
          </div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              id="input-employee-search"
              type="text"
              placeholder="Cari nama, ID, atau jabatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.8 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500 whitespace-nowrap">Departemen:</span>
            <select
              id="select-dept-filter"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full sm:w-48 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              Memuat data karyawan...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-20 text-center text-xs text-gray-400">
              Tidak ditemukan karyawan yang sesuai kriteria pencarian.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                  <th className="p-4">ID Karyawan</th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Jabatan</th>
                  <th className="p-4">Departemen</th>
                  <th className="p-4 text-center">Potensi (9-Box)</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 font-mono font-medium text-gray-600">{emp.employee_id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{emp.nama}</div>
                    </td>
                    <td className="p-4 text-gray-600">{emp.jabatan}</td>
                    <td className="p-4 text-gray-600">
                      <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-medium rounded-full">
                        {emp.departemen}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${
                          emp.potential === "high"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                            : emp.potential === "medium"
                            ? "bg-amber-50 text-amber-700 border border-amber-150"
                            : "bg-rose-50 text-rose-700 border border-rose-150"
                        }`}
                      >
                        {emp.potential === "high" ? "Tinggi" : emp.potential === "medium" ? "Sedang" : "Rendah"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(emp)}
                          className="p-1 px-2 hover:bg-gray-100 text-blue-600 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                          title="Edit Biodata"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.employee_id)}
                          className="p-1 px-2 hover:bg-gray-100 text-rose-600 hover:text-rose-700 rounded-md transition-colors cursor-pointer"
                          title="Hapus Karyawan"
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

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-155">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-sm font-display text-gray-800">Tambah Data Karyawan & Akun Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateEmployee} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Budi Gunawan"
                    className="w-full px-3 py-1.8 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Jabatan Pekerjaan *</label>
                  <select
                    required
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    className="w-full px-3 py-1.8 bg-white text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Pilih Jabatan</option>
                    {[
                      "Direktur Utama",
                      "Direktur Operasional",
                      "Kepala Divisi Teknologi",
                      "Kepala Unit Bisnis",
                      "Senior Manager IT",
                      "Senior HR Specialist",
                      "Senior Finance Analyst",
                      "Senior Software Engineer",
                      "Junior Software Engineer",
                      "HR Generalist",
                      "Finance & Accounting Staff",
                      "Marketing Associate",
                      "IT Support Specialist",
                      "Staf Operasional BUMN",
                      "Business Development Officer"
                    ].map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Departemen *</label>
                  <select
                    required
                    value={formDepartemen}
                    onChange={(e) => setFormDepartemen(e.target.value)}
                    className="w-full px-3 py-1.8 bg-white text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Pilih Departemen</option>
                    <option value="Teknologi Informasi">Teknologi Informasi</option>
                    <option value="Sumber Daya Manusia">Sumber Daya Manusia</option>
                    <option value="Keuangan & Akuntansi">Keuangan & Akuntansi</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Pemasaran">Pemasaran</option>
                    <option value="Direksi">Direksi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Peringkat Potensi (9-Box) *</label>
                  <select
                    value={formPotential}
                    onChange={(e) => setFormPotential(e.target.value as any)}
                    className="w-full px-3 py-1.8 bg-white text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="high">Tinggi (High Potential)</option>
                    <option value="medium">Sedang (Medium Potential)</option>
                    <option value="low">Rendah (Low Potential)</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50/50 p-3.5 rounded-lg border border-blue-100/50 space-y-3">
                <span className="text-[10px] font-semibold text-blue-700 block uppercase">Pendaftaran Akun Pengguna</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Username Login (Opsional)</label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="Default: namakecil"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Password Login (Opsional)</label>
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Default: password123"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-155">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-sm font-display text-gray-800">Sunting Biodata Karyawan {editingEmployeeId}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateEmployee} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.8 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Jabatan *</label>
                   <select
                     required
                     value={formJabatan}
                     onChange={(e) => setFormJabatan(e.target.value)}
                     className="w-full px-3 py-1.8 bg-white text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                   >
                     {[
                       "Direktur Utama",
                       "Direktur Operasional",
                       "Kepala Divisi Teknologi",
                       "Kepala Unit Bisnis",
                       "Senior Manager IT",
                       "Senior HR Specialist",
                       "Senior Finance Analyst",
                       "Senior Software Engineer",
                       "Junior Software Engineer",
                       "HR Generalist",
                       "Finance & Accounting Staff",
                       "Marketing Associate",
                       "IT Support Specialist",
                       "Staf Operasional BUMN",
                       "Business Development Officer"
                     ].map((j) => (
                       <option key={j} value={j}>{j}</option>
                     ))}
                   </select>
                 </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Departemen *</label>
                  <select
                    required
                    value={formDepartemen}
                    onChange={(e) => setFormDepartemen(e.target.value)}
                    className="w-full px-3 py-1.8 bg-white text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="Teknologi Informasi">Teknologi Informasi</option>
                    <option value="Sumber Daya Manusia">Sumber Daya Manusia</option>
                    <option value="Keuangan & Akuntansi">Keuangan & Akuntansi</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Pemasaran">Pemasaran</option>
                    <option value="Direksi">Direksi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Peringkat Potensi (9-Box)</label>
                <select
                  value={formPotential}
                  onChange={(e) => setFormPotential(e.target.value as any)}
                  className="w-full px-3 py-1.8 bg-white text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="high">Tinggi (High Potential)</option>
                  <option value="medium">Sedang (Medium Potential)</option>
                  <option value="low">Rendah (Low Potential)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Perbarui Biodata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
