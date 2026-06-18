import React, { useState, useEffect } from "react";
import { User, Award, ArrowUpRight, ShieldAlert, Sparkles, RefreshCw, Heart } from "lucide-react";

interface EmployeeRatingDetail {
  employee_id: string;
  nama: string;
  departemen: string;
  jabatan: string;
  potential: "high" | "medium" | "low";
  finalScore: number;
  performance: "low" | "medium" | "high";
}

// Define the 9 boxes details based on (Potential [row], Performance [col])
// rows: High, Medium, Low. cols: Low, Medium, High
const matrixDef = [
  {
    row: "high",
    col: "low",
    title: "Enigma (High Potential, Low Performance)",
    description: "Karyawan berbakat tinggi namun kinerja belum maksimal. Perlu pendampingan teknis atau evaluasi kesesuaian posisi.",
    actionPlan: "Rotasi tugas, pelatihan kesenjangan teknis, coaching suportif.",
    bgColor: "bg-orange-50/50 border-orange-200 text-orange-850",
    iconColor: "text-orange-550"
  },
  {
    row: "high",
    col: "medium",
    title: "Growth Talent (High Potential, Medium Performance)",
    description: "Kandidat pilar masa depan organisasi. Potensi sangat memadai dan kinerja stabil ke arah atas.",
    actionPlan: "Tantangan proyek lintas fungsi, program pengembangan kepemimpinan (future leader).",
    bgColor: "bg-sky-50/45 border-sky-200 text-sky-850",
    iconColor: "text-sky-550"
  },
  {
    row: "high",
    col: "high",
    title: "Star (High Potential, High Performance)",
    description: "Aset terbaik perusahaan (Future Leader). Konsisten memberikan kontribusi krusial dan memiliki dorongan memimpin.",
    actionPlan: "Rencana suksesi (Promotion), kenaikan golongan akseleratif, representasi strategis korporat.",
    bgColor: "bg-emerald-50 border-emerald-300 text-emerald-850 select-accented",
    iconColor: "text-emerald-600"
  },
  {
    row: "medium",
    col: "low",
    title: "Inconsistent Performer (Medium Potential, Low Performance)",
    description: "Potensi cukupan namun produktivitasnya fluktuatif di bawah standar kompetensi kerja.",
    actionPlan: "Pelatihan pembinaan kemandirian kerja, pengawasan berkala target bulanan.",
    bgColor: "bg-amber-50/50 border-amber-200 text-amber-850",
    iconColor: "text-amber-550"
  },
  {
    row: "medium",
    col: "medium",
    title: "Key Contributor (Medium Potential, Medium Performance)",
    description: "Tulang punggung stabilitas perusahaan. Pelaksanaan rutin bermutu andal dan dapat diandalkan.",
    actionPlan: "Pemberian enrichment tantangan baru, apresiasi berkala, sertifikasi peningkatan keprofesian.",
    bgColor: "bg-neutral-50 border-neutral-250 text-neutral-850",
    iconColor: "text-neutral-550"
  },
  {
    row: "medium",
    col: "high",
    title: "High Achiever (Medium Potential, High Performance)",
    description: "Pekerja di atas standar tertinggi secara berkesinambungan, namun ruang kenaikan jenjang kepemimpinan eksekutif masih terbatas.",
    actionPlan: "Jadikan mentor internal, insentif performa tinggi, perluas tanggung jawab fungsional.",
    bgColor: "bg-teal-50/55 border-teal-200 text-teal-850",
    iconColor: "text-teal-600"
  },
  {
    row: "low",
    col: "low",
    title: "Underperformer (Low Potential, Low Performance)",
    description: "Karyawan dengan kapasitas dan unjuk kinerja di bawah ekspetasi dasar organisasi. Perlu tindakan korektif.",
    actionPlan: "Performance Improvement Plan (PIP) jangka pendek (3 bulan), mutasi peran lebih sederhana.",
    bgColor: "bg-rose-50 border-rose-250 text-rose-850",
    iconColor: "text-rose-550"
  },
  {
    row: "low",
    col: "medium",
    title: "Solid Staff (Low Potential, Medium Performance)",
    description: "Pekerja andal di area rutin namun sulit menyerap ekspansi tanggung jawab non-rutin.",
    actionPlan: "Fokus mempertahankan loyalitas di posisi yang mapan saat ini, pelatihan adaptabilitas taktis.",
    bgColor: "bg-purple-50/50 border-purple-200 text-purple-850",
    iconColor: "text-purple-550"
  },
  {
    row: "low",
    col: "high",
    title: "Workhorse (Low Potential, High Performance)",
    description: "Sangat ahli dan tuntas di posisinya, tapi enggan dipromosikan mengurusi birokrasi pimpinan.",
    actionPlan: "Jadikan Subject Matter Expert, tunjangan jabatan spesialis, apresiasi kontribusi operasionalnya.",
    bgColor: "bg-indigo-50/45 border-indigo-200 text-indigo-850",
    iconColor: "text-indigo-550"
  }
];

export default function TalentMapping() {
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<EmployeeRatingDetail[]>([]);
  const [selectedCellInfo, setSelectedCellInfo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && ratings.length >= 0 && !selectedCellInfo) {
      // Pre-select Star category by default so information is shown side-by-side instantly
      const defaultDef = matrixDef.find((m) => m.row === "high" && m.col === "high")!;
      const starMembers = ratings.filter((r) => r.potential === "high" && r.performance === "high");
      setSelectedCellInfo({
        ...defaultDef,
        members: starMembers
      });
    }
  }, [ratings, loading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/analytics");
      if (res.ok) {
        const payload = await res.json();
        setRatings(payload.ratingDetails || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-6.5 h-6.5 animate-spin text-blue-500" />
        Menyusun pemetaan matriks 9-Box talent secara real-time...
      </div>
    );
  }

  // Helper to categorize employees inside matrix cell
  const getEmployeesInCell = (potential: "high" | "medium" | "low", performance: "low" | "medium" | "high") => {
    return ratings.filter((r) => r.potential === potential && r.performance === performance);
  };

  const handleCellClick = (cellDef: any, members: EmployeeRatingDetail[]) => {
    setSelectedCellInfo({
      ...cellDef,
      members
    });
  };

  return (
    <div id="talent-mapping-root" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold font-display text-gray-800">Pemetaan Talenta (9-Box Matrix)</h2>
        <p className="text-xs text-gray-500 mt-1">
          Peralatan asisten klasifikasi suksesi kepemimpinan BUMN. Membagi talenta berdasarkan perpaduan{" "}
          <span className="font-bold">Potensi Individu (High/Medium/Low)</span> dengan{" "}
          <span className="font-bold">Kinerja Nyata 360° AKHLAK (Sangat Baik/Cukup/Kurang)</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 9 Box Matriks Grid (Left Side) */}
        <div className="lg:col-span-2 space-y-2">
          {/* Matrix Header Row labels (Performance) */}
          <div className="grid grid-cols-12 gap-1.5 pb-1">
            <div className="col-span-1"></div>
            <div className="col-span-11 grid grid-cols-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <div>Kinerja Kurang (&lt; 3.0)</div>
              <div>Kinerja Cukup (3.0 - 4.1)</div>
              <div>Kinerja Sangat Baik (&gt;= 4.1)</div>
            </div>
          </div>

          {/* Matrix Potential Rows (High to Low) */}
          {["high", "medium", "low"].map((potRow) => {
            const potLabel = potRow === "high" ? "Potensi Tinggi" : potRow === "medium" ? "Potensi Sedang" : "Potensi Rendah";
            return (
              <div key={potRow} className="grid grid-cols-12 gap-1.5 items-stretch min-h-32">
                {/* Y-axis label */}
                <div className="col-span-1 flex flex-col items-center justify-center text-center text-[10px] font-extrabold uppercase text-gray-400 font-display min-w-10 leading-snug">
                  {potLabel.split(" ").map((word) => (
                    <span key={word} className="block">{word}</span>
                  ))}
                </div>

                {/* The 3 dynamic columns */}
                <div className="col-span-11 grid grid-cols-3 gap-1.5">
                  {["low", "medium", "high"].map((perfCol) => {
                    const cellDef = matrixDef.find((m) => m.row === potRow && m.col === perfCol)!;
                    const members = getEmployeesInCell(potRow as any, perfCol as any);
                    const isStar = potRow === "high" && perfCol === "high";

                    return (
                      <button
                        type="button"
                        key={perfCol}
                        onClick={() => handleCellClick(cellDef, members)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-xs cursor-pointer ${cellDef.bgColor} ${
                          selectedCellInfo?.title === cellDef.title ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        <div className="space-y-1 w-full">
                          <div className="flex justify-between items-start gap-1 w-full">
                            <span className="text-[10px] font-extrabold font-display leading-tight tracking-tight">
                              {cellDef.title.split(" (")[0]}
                            </span>
                            {isStar && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          </div>
                          <p className="text-[9px] text-gray-500 font-normal leading-relaxed line-clamp-2">
                            {cellDef.description}
                          </p>
                        </div>

                        {/* Members counter */}
                        <div className="flex items-center gap-1 mt-2">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] font-bold font-mono">
                            {members.length} Karyawan
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="text-[9px] text-gray-400 text-center italic mt-2">
            * Klik salah satu boks matriks di atas untuk melihat rincian anggota karyawan dan aksi rekomendasi HRD.
          </div>
        </div>

        {/* Detailed Cell Panel (Right Side) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs h-fit space-y-4">
          {selectedCellInfo ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3 space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-blue-700">Kategori Terpilih</span>
                <h3 className="font-bold text-sm text-gray-800 font-display flex items-center gap-1.5 leading-snug">
                  {selectedCellInfo.title}
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-[10px] uppercase text-gray-400 tracking-wider">Metrik Deskripsi</h4>
                  <p className="text-gray-650 leading-relaxed mt-0.5">{selectedCellInfo.description}</p>
                </div>

                <div className="p-3 bg-blue-50/30 border border-blue-100 rounded-lg">
                  <h4 className="font-bold text-[10px] uppercase text-blue-700 tracking-wider flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Rencana Intervensi HRD
                  </h4>
                  <p className="text-blue-900 leading-relaxed font-medium mt-1">{selectedCellInfo.actionPlan}</p>
                </div>

                {/* Team members list */}
                <div className="pt-2">
                  <h4 className="font-bold text-[10px] uppercase text-gray-400 tracking-wider mb-2">
                    Daftar Anggota Karyawan ({selectedCellInfo.members.length})
                  </h4>

                  {selectedCellInfo.members.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 italic bg-gray-50 rounded-lg text-[11px]">
                      Belum ada karyawan di sel matriks ini.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedCellInfo.members.map((emp: EmployeeRatingDetail) => (
                        <div key={emp.employee_id} className="p-2 border border-gray-100 rounded-lg flex justify-between items-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <div>
                            <div className="font-bold text-[11px] text-gray-800">{emp.nama}</div>
                            <div className="text-[9px] text-gray-500">{emp.jabatan} - {emp.departemen}</div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                              {emp.finalScore}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">
              <ShieldAlert className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              Pilih boks matriks bertalenta di sebelah kiri untuk me-load rincian strategi serta daftar anggota karyawan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
