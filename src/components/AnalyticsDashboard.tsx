import React, { useState, useEffect } from "react";
import { Search, Shield, Award, Users, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

interface EmployeeRatingDetail {
  employee_id: string;
  nama: string;
  departemen: string;
  jabatan: string;
  potential: "high" | "medium" | "low";
  overallScores: Record<string, number>;
  finalScore: number;
  performance: "low" | "medium" | "high";
}

interface AnalyticsDashboardProps {
  currentEmployeeRole: string;
  currentEmployeeId: string;
}

export default function AnalyticsDashboard({ currentEmployeeRole, currentEmployeeId }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    ratingDetails: EmployeeRatingDetail[];
    departmentAverages: { departemen: string; avg: number }[];
    count: number;
  } | null>(null);

  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [empReport, setEmpReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, [currentEmployeeId, currentEmployeeRole]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/analytics");
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        
        // Auto-select first employee who has ratings, or fall back
        if (currentEmployeeRole === "karyawan") {
          setSelectedEmpId(currentEmployeeId);
        } else if (payload?.ratingDetails?.length > 0) {
          const defaultEmp = payload.ratingDetails.find((r: any) => r.finalScore > 0) || payload.ratingDetails[0];
          setSelectedEmpId(defaultEmp.employee_id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmpId) {
      fetchEmployeeDetailReport(selectedEmpId);
    }
  }, [selectedEmpId]);

  const fetchEmployeeDetailReport = async (empId: string) => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/reports/employee/${empId}`);
      if (res.ok) {
        setEmpReport(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-6.5 h-6.5 animate-spin text-blue-500" />
        Sistem sedang mengompilasi statistik penilaian 360°...
      </div>
    );
  }

  const ratings = data?.ratingDetails || [];
  const deptAvgs = data?.departmentAverages || [];

  // Filter employees for listing
  const filteredRatings = ratings.filter((r) =>
    r.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.departemen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Distribution calculation
  const perfHighCount = ratings.filter((r) => r.performance === "high").length;
  const perfMediumCount = ratings.filter((r) => r.performance === "medium").length;
  const perfLowCount = ratings.filter((r) => r.performance === "low").length;
  
  const highPct = data?.count ? Math.round((perfHighCount / data.count) * 100) : 0;
  const mediumPct = data?.count ? Math.round((perfMediumCount / data.count) * 100) : 0;
  const lowPct = data?.count ? Math.round((perfLowCount / data.count) * 100) : 0;

  // Custom Radian/Radar drawing mock helper
  const renderInteractiveRadarWeb = () => {
    if (!empReport) return null;
    const catScores = empReport.responsesByCategory;
    if (!catScores) return null;

    const indicatorsKey = ["amanah", "kompeten", "harmonis", "loyal", "adaptif", "kolaboratif"];
    const labelTitle = ["Amanah", "Kompeten", "Harmonis", "Loyal", "Adaptif", "Kolaboratif"];
    
    // Width and height of radar box
    const size = 300;
    const center = size / 2;
    const maxRadius = 100;

    // Scale function
    const radarPoint = (index: number, score: number) => {
      const angle = (Math.PI * 2 / 6) * index - Math.PI / 2;
      const radius = (score / 5) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y };
    };

    // Calculate radar polygon points for each perspectives
    const getPolygonStr = (perspectiveKey: string) => {
      const points = indicatorsKey.map((key, index) => {
        const score = catScores[key]?.[perspectiveKey] || 0;
        const pt = radarPoint(index, score);
        return `${pt.x},${pt.y}`;
      });
      return points.join(" ");
    };

    // Render concentric hexagons
    const rings = [1, 2, 3, 4, 5];

    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Grid concentric rings */}
          {rings.map((ring) => {
            const points = Array.from({ length: 6 }).map((_, i) => {
              const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
              const radius = (ring / 5) * maxRadius;
              return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
            }).join(" ");
            return (
              <polygon
                key={ring}
                points={points}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            );
          })}

          {/* Web lines from center to outer vertex */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
            const x = center + maxRadius * Math.cos(angle);
            const y = center + maxRadius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth={1.2}
                strokeDasharray="2"
              />
            );
          })}

          {/* Radar Polygons for perspectives */}
          {/* SELF Perspective: Orange */}
          {empReport.responsesByCategory?.amanah?.self > 0 && (
            <polygon
              points={getPolygonStr("self")}
              fill="rgba(249, 115, 22, 0.15)"
              stroke="rgb(249, 115, 22)"
              strokeWidth={1.8}
            />
          )}

          {/* ATASAN Perspective: Blue */}
          {empReport.responsesByCategory?.amanah?.atasan > 0 && (
            <polygon
              points={getPolygonStr("atasan")}
              fill="rgba(10, 81, 161, 0.15)"
              stroke="rgb(10, 81, 161)"
              strokeWidth={1.8}
            />
          )}

          {/* PEER Perspective: Teal */}
          {empReport.responsesByCategory?.amanah?.peer > 0 && (
            <polygon
              points={getPolygonStr("peer")}
              fill="rgba(20, 184, 166, 0.15)"
              stroke="rgb(20, 184, 166)"
              strokeWidth={1.8}
            />
          )}

          {/* BAWAHAN Perspective: Purple */}
          {empReport.responsesByCategory?.amanah?.bawahan > 0 && (
            <polygon
              points={getPolygonStr("bawahan")}
              fill="rgba(168, 85, 247, 0.15)"
              stroke="rgb(168, 85, 247)"
              strokeWidth={1.8}
            />
          )}

          {/* Text Labels */}
          {labelTitle.map((lbl, i) => {
            const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
            const labelRadius = maxRadius + 22;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle) + 4;
            let textAnchor = "middle";
            if (Math.cos(angle) > 0.1) textAnchor = "start";
            if (Math.cos(angle) < -0.1) textAnchor = "end";

            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor={textAnchor}
                className="text-[10px] font-bold font-display fill-gray-600"
              >
                {lbl}
              </text>
            );
          })}
        </svg>

        {/* Legend row */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 max-w-sm">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-semibold">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-full block"></span>
            Self Assessment ({empReport.responsesByCategory?.amanah?.self || "-"})
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-semibold">
            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full block"></span>
            Atasan ({empReport.responsesByCategory?.amanah?.atasan || "-"})
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-semibold">
            <span className="w-2.5 h-2.5 bg-teal-500 rounded-full block"></span>
            Teman Sejawat ({empReport.responsesByCategory?.amanah?.peer || "-"})
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-semibold">
            <span className="w-2.5 h-2.5 bg-purple-50 rounded-full border border-purple-500 block"></span>
            Bawahan ({empReport.responsesByCategory?.amanah?.bawahan || "-"})
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="analytics-root-container" className="space-y-6">
      {/* Upper Dashboard Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total rating count */}
        <div className="bg-white border border-gray-150 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Karyawan Ternilai</div>
            <div className="text-2xl font-bold text-gray-800 font-display">{ratings.filter(r => r.finalScore > 0).length} / {ratings.length}</div>
          </div>
        </div>

        {/* High performance gauge */}
        <div className="bg-white border border-gray-150 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sangat Baik (★ &gt;= 4.1)</div>
            <div className="text-2xl font-bold text-gray-800 font-display">{perfHighCount} Karyawan</div>
          </div>
        </div>

        {/* Corporate score calculation */}
        <div className="bg-white border border-gray-150 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rata-rata AKHLAK Group</div>
            <div className="text-2xl font-bold text-gray-800 font-display">
              {ratings.filter(r => r.finalScore > 0).length > 0
                ? (ratings.reduce((acc, cr) => acc + cr.finalScore, 0) / ratings.filter(r => r.finalScore > 0).length).toFixed(2)
                : "4.00"}
              <span className="text-xs text-gray-400 font-normal"> / 5</span>
            </div>
          </div>
        </div>

        {/* Warning Indicator or general notes */}
        <div className="bg-white border border-gray-150 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status Penilaian</div>
            <div className="text-2xl font-bold text-gray-800 font-display text-emerald-700">Terbuka</div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Employee List */}
        {currentEmployeeRole !== "karyawan" && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 shadow-xs h-fit">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 font-display">Pilih Karyawan</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Pilih nama karyawan untuk melihat komparasi radar 360°.</p>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredRatings.map((r) => (
                <button
                  key={r.employee_id}
                  onClick={() => setSelectedEmpId(r.employee_id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                    selectedEmpId === r.employee_id
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white hover:bg-gray-50 border-gray-150 text-gray-700"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{r.nama}</div>
                    <div className={`text-[10px] ${selectedEmpId === r.employee_id ? "text-blue-200" : "text-gray-400"}`}>
                      {r.jabatan}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono ${selectedEmpId === r.employee_id ? "text-white" : "text-blue-700"}`}>
                      {r.finalScore > 0 ? r.finalScore : "--"}
                    </div>
                    <div className={`text-[9px] font-bold tracking-widest uppercase ${
                      r.performance === "high" ? "text-emerald-500" : r.performance === "medium" ? "text-amber-500" : "text-rose-500"
                    }`}>
                      {r.finalScore > 0 ? r.performance : "Belum dinilai"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right Side: Radar / Detailed Report Comparison */}
        <div className={`${currentEmployeeRole === "karyawan" ? "lg:col-span-3" : "lg:col-span-2"} space-y-6`}>
          {selectedEmpId ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-6">
              {/* Profile Card Header */}
              {empReport && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-lg font-display text-gray-800">{empReport.employee?.nama}</h3>
                    <p className="text-xs text-gray-500">
                      {empReport.employee?.jabatan} — <span className="font-bold">{empReport.employee?.departemen}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-center min-w-32">
                    <div className="text-[9px] text-blue-700 font-bold uppercase tracking-widest mb-0.5">Skor Akhir 360°</div>
                    <div className="text-2xl font-bold text-blue-800 font-mono leading-none">
                      {empReport.finalScore > 0 ? empReport.finalScore : "--"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Skala 1 - 5</div>
                  </div>
                </div>
              )}

              {/* Spider Radar Diagram and Bar charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Visual Radar Representation */}
                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/30 flex flex-col justify-center items-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Grafik Radar 360°</div>
                  {(!empReport || reportLoading) ? (
                    <div className="h-48 flex items-center justify-center text-xs text-gray-400">Loading Radar...</div>
                  ) : empReport.finalScore === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-xs text-gray-400 text-center p-4">
                      <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                      Karyawan terpilih belum mengantongi penilaian yang dikirimkan.
                    </div>
                  ) : (
                    renderInteractiveRadarWeb()
                  )}
                </div>

                {/* Gap Analysis Bar Comparison */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Analisis Kesenjangan (Gap Analysis)</div>
                  
                  {(!empReport || reportLoading) ? (
                    <div className="space-y-2 pt-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-8 bg-gray-100 animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : empReport.finalScore === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400">Tidak ada analisis untuk ditampilkan.</div>
                  ) : (
                    <div className="space-y-3.5">
                      {["amanah", "kompeten", "harmonis", "loyal", "adaptif", "kolaboratif"].map((key) => {
                        const selfS = empReport.responsesByCategory?.[key]?.self || 0;
                        
                        // Outside avg calculation
                        const catObj = empReport.responsesByCategory?.[key] || {};
                        let outerSum = 0;
                        let outerCount = 0;
                        ["atasan", "peer", "bawahan"].forEach((role) => {
                          if (catObj[role] > 0) {
                            outerSum += catObj[role];
                            outerCount++;
                          }
                        });
                        const outsideS = outerCount > 0 ? Number((outerSum / outerCount).toFixed(2)) : 0;
                        const gap = Number((outsideS - selfS).toFixed(2));

                        return (
                          <div key={key} className="space-y-1.5 p-2 bg-gray-50 hover:bg-gray-100/50 rounded-lg transition-colors border border-gray-100/40">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700 capitalize">{key}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                gap > 0 ? "bg-emerald-50 text-emerald-700" : gap === 0 ? "bg-gray-100 text-gray-600" : "bg-rose-50 text-rose-700"
                              }`}>
                                Gap: {gap > 0 ? `+${gap}` : gap}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {/* Blue track Outside */}
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] w-12 text-gray-400">Tim (360°):</span>
                                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-blue-600 h-full rounded-full"
                                    style={{ width: `${(outsideS / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 font-mono w-6 text-right">
                                  {outsideS > 0 ? outsideS : "-"}
                                </span>
                              </div>

                              {/* Orange track Self */}
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] w-12 text-gray-400">Diri (Self):</span>
                                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-orange-500 h-full rounded-full"
                                    style={{ width: `${(selfS / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 font-mono w-6 text-right">
                                  {selfS > 0 ? selfS : "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Feedbacks list */}
              {empReport?.comments?.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Catatan Umpan Balik Kualitatif Berkelompok</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                    {empReport.comments.map((comment: string, i: number) => {
                      const isAtasan = comment.startsWith("ATASAN");
                      const isPeer = comment.startsWith("PEER");
                      const isSelf = comment.startsWith("SELF");
                      
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border text-xs leading-relaxed ${
                            isAtasan 
                              ? "bg-blue-50/40 border-blue-100 text-blue-800" 
                              : isPeer 
                              ? "bg-teal-50/40 border-teal-100 text-teal-800" 
                              : isSelf
                              ? "bg-orange-50/40 border-orange-100 text-orange-800"
                              : "bg-purple-50/40 border-purple-100 text-purple-850"
                          }`}
                        >
                          <span className="font-bold block text-[9px] uppercase mb-1">
                            Reviewer Perspective: {isAtasan ? "Atasan" : isPeer ? "Rekan Kerja / Peer" : isSelf ? "Self Evaluation" : "Bawahan"}
                          </span>
                          {comment.substring(comment.indexOf(":") + 1).replace(/^"|"$/g, "")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-xs text-gray-400">
              Silakan pilih karyawan di sebelah kiri untuk me-load panel analisis komparatif.
            </div>
          )}

          {/* Department comparisons */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-600 mb-4 font-display">Perbandingan Kinerja Antar Departemen</h4>
            <div className="space-y-3">
              {deptAvgs.map((d) => (
                <div key={d.departemen} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-600">{d.departemen}</span>
                    <span className="font-bold text-blue-700 font-mono">{d.avg} / 5</span>
                  </div>
                  <div className="bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(d.avg / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
