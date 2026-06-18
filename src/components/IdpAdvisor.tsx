import React, { useState, useEffect } from "react";
import { Sparkles, Award, Compass, HeartHandshake, AlertTriangle, RefreshCw, Send, CheckCircle, Download } from "lucide-react";
import { jsPDF } from "jspdf";

interface IdpAdvisorProps {
  currentEmployeeId: string;
}

export default function IdpAdvisor({ currentEmployeeId }: IdpAdvisorProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  const [idp, setIdp] = useState<any>(null);
  const [loadingIdp, setLoadingIdp] = useState(false);
  const [genStep, setGenStep] = useState("");
  const [errorVisible, setErrorVisible] = useState("");

  const handleDownloadIDP = () => {
    const currentEmpData = employees.find((e) => e.employee_id === selectedEmpId);
    if (!idp || !currentEmpData) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    let y = 20; // Vertical position tracker (mm)
    const margin = 15;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);

    // Page overflow handler
    const checkPageOverflow = (heightNeeded: number) => {
      if (y + heightNeeded > 275) {
        doc.addPage();
        y = 20;
        return true;
      }
      return false;
    };

    // Header Band
    doc.setFillColor(13, 148, 136); // Teal-600 decoration
    doc.rect(margin, y, contentWidth, 3, "F");
    y += 10;

    // Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 118, 110); // Teal-700
    doc.text("INDIVIDUAL DEVELOPMENT PLAN (IDP)", margin, y);
    y += 6;

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text("KATEGORISASI STANDAR BADAN USAHA MILIK NEGARA (BUMN)", margin, y);
    y += 8;

    // Employee Metadata Grid Box
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.rect(margin, y, contentWidth, 32, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // Slate-700

    // Employee detail keys
    doc.text("NAMA KARYAWAN  :", margin + 6, y + 7);
    doc.text("JABATAN        :", margin + 6, y + 14);
    doc.text("DEPARTEMEN     :", margin + 6, y + 21);
    doc.text("PERIODE        :", margin + 6, y + 28);

    doc.setFont("helvetica", "normal");
    doc.text(currentEmpData.nama || "-", margin + 44, y + 7);
    doc.text(currentEmpData.jabatan || "-", margin + 44, y + 14);
    doc.text(currentEmpData.departemen || "-", margin + 44, y + 21);
    doc.text("Semester I - 2026", margin + 44, y + 28);

    // Document Registry info
    doc.setFont("helvetica", "bold");
    doc.text("ID DOKUMEN:", margin + 112, y + 7);
    doc.text("TANGGAL   :", margin + 112, y + 14);
    doc.text("STATUS    :", margin + 112, y + 21);

    doc.setFont("helvetica", "normal");
    doc.text(idp.idp_id || "IDP-001", margin + 138, y + 7);
    doc.text(idp.created_at || new Date().toISOString().split("T")[0], margin + 138, y + 14);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 148, 136); // Teal-600
    doc.text("DISETUJUI SISTEM", margin + 138, y + 21);

    y += 40;

    // Function to render Section Title
    const printSectionHeader = (titleText: string, iconSymbol: string) => {
      checkPageOverflow(18);
      // Background bar
      doc.setFillColor(15, 118, 110); // Teal-700
      doc.rect(margin, y, contentWidth, 7, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`${iconSymbol}  ${titleText}`, margin + 4, y + 4.8);
      y += 12;
    };

    // 1. Key Strengths
    printSectionHeader("1. KEKUATAN UTAMA (KEY STRENGTHS)", "[+]");
    const docStrengths = idp.strengths || [];
    docStrengths.forEach((st: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      const splitText = doc.splitTextToSize(`✓  ${st}`, contentWidth - 8);
      checkPageOverflow(splitText.length * 4.5 + 2);
      
      doc.text(splitText, margin + 4, y);
      y += splitText.length * 4.5 + 2;
    });
    y += 4;

    // 2. Growth Opportunities
    printSectionHeader("2. AREA PENGEMBANGAN (GROWTH OPPORTUNITIES)", "[!]");
    const docWeaknesses = idp.weaknesses || [];
    docWeaknesses.forEach((wk: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(190, 24, 74); // Red/Rose text

      const splitText = doc.splitTextToSize(`•  ${wk}`, contentWidth - 8);
      checkPageOverflow(splitText.length * 4.5 + 2);

      doc.text(splitText, margin + 4, y);
      y += splitText.length * 4.5 + 2;
    });
    y += 4;

    // 3. Actionable Steps
    printSectionHeader("3. RENCANA AKSI PENGEMBANGAN (ACTIONABLE STEPS)", "[*]");
    const docRecommendations = idp.recommendations || [];
    docRecommendations.forEach((rc: string, idx: number) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59); // Slate-800

      const splitText = doc.splitTextToSize(`${idx + 1}.  ${rc}`, contentWidth - 8);
      checkPageOverflow(splitText.length * 4.5 + 3);

      doc.text(splitText, margin + 4, y);
      y += splitText.length * 4.5 + 3;
    });
    y += 10;

    // Footer Disclaimer with auto page split
    const disclaimerText = "Disclaimer: Rencana aksi ini bersumber langsung dari Penyelaras Kompetensi Talenta BUMN Terpadu berbasis kecerdasan AI. Segala tindakan pengembangan hendaknya didiskusikan lebih lanjut bersama Mentor atau Head of Department terkait.";
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth);
    checkPageOverflow(splitDisclaimer.length * 4 + 4);
    doc.text(splitDisclaimer, margin, y);

    doc.save(`IDP_Laporan_${currentEmpData.nama.replace(/\s+/g, "_")}.pdf`);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch("/api/reports/analytics");
      if (res.ok) {
        const payload = await res.json();
        setEmployees(payload.ratingDetails || []);
        
        // Default select current user employee, or the first one
        const userFound = (payload.ratingDetails || []).find((r: any) => r.employee_id === currentEmployeeId);
        if (userFound) {
          setSelectedEmpId(userFound.employee_id);
        } else if (payload.ratingDetails?.length > 0) {
          setSelectedEmpId(payload.ratingDetails[0].employee_id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (selectedEmpId) {
      fetchExistingIDP(selectedEmpId);
    }
  }, [selectedEmpId]);

  const fetchExistingIDP = async (empId: string) => {
    setLoadingIdp(true);
    setErrorVisible("");
    try {
      const res = await fetch(`/api/reports/employee/${empId}`);
      if (res.ok) {
        const detail = await res.json();
        if (detail.existingIDP) {
          setIdp(detail.existingIDP);
        } else {
          setIdp(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIdp(false);
    }
  };

  const handleGenerateAIRecommendation = async () => {
    if (!selectedEmpId) return;
    setLoadingIdp(true);
    setErrorVisible("");
    
    // Simulate generation steps for high engagement
    setGenStep("Menyusun profil talenta...");
    let detail;
    try {
      const resDetail = await fetch(`/api/reports/employee/${selectedEmpId}`);
      if (!resDetail.ok) throw new Error("Profil karyawan tidak ditemukan.");
      detail = await resDetail.json();
    } catch (e: any) {
      setErrorVisible(e.message);
      setLoadingIdp(false);
      return;
    }

    setTimeout(() => setGenStep("Menganalisis skor AKHLAK BUMN..."), 800);
    setTimeout(() => setGenStep("Gemini sedang merancang Individual Development Plan (IDP)..."), 1600);

    try {
      const resGen = await fetch("/api/reports/idp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selectedEmpId,
          period_id: "P001", // Default active period
          finalAverages: detail.finalAverages,
          finalScore: detail.finalScore,
          comments: detail.comments
        })
      });

      if (resGen.ok) {
        const idpPayload = await resGen.json();
        setIdp(idpPayload);
      } else {
        setErrorVisible("Model AI menolak memproses rekomendasi saat ini.");
      }
    } catch (err) {
      console.error(err);
      setErrorVisible("Gagal terhubung dengan server kecerdasan buatan.");
    } finally {
      setLoadingIdp(false);
      setGenStep("");
    }
  };

  const currentEmpData = employees.find((e) => e.employee_id === selectedEmpId);

  return (
    <div id="idp-advisor-container" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold font-display text-gray-800 flex items-center gap-2">
            Rekomendasi Rencana Pengembangan (AI IDP Advisor)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Gunakan kekuatan AI Gemini-3.5-flash untuk mengulas dan menyusun kurikulum training Individual Development Plan (IDP) terbaik berdasarkan umpan balik 360° karyawan.
          </p>
        </div>

        {/* Employee selector dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">Target Profil:</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3 py-1.8 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 max-w-xs font-semibold"
          >
            {employees.map((e) => (
              <option key={e.employee_id} value={e.employee_id}>
                {e.nama} ({e.departemen})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentEmpData && currentEmpData.finalScore === 0 ? (
        <div className="bg-sky-50 border border-sky-150 rounded-xl p-4 text-xs text-sky-800 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <span className="font-bold text-sky-900 flex items-center gap-1.5">
              Simulasi Rekomendasi Prototype Aktif
            </span>
            <p className="leading-relaxed text-sky-950">
              Karyawan terpilih ({currentEmpData.nama}) belum memiliki penilaian evaluasi 360°. Demi kelancaran demo sistem, teknologi rujukan AI akan menggunakan tolak ukur data simulasi BUMN AKHLAK agar Anda dapat menguji perumusan rencana pengembangan individual secara instan.
            </p>
          </div>
        </div>
      ) : null}

      {/* Main recommendation result card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        {loadingIdp ? (
          <div className="py-24 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <div className="font-bold text-gray-700 animate-pulse">{genStep || "Memuat Analisis..."}</div>
            <p className="text-[10px] text-gray-400 max-w-xs">Proses rujukan berskala BUMN AKHLAK ini biasanya memakan waktu kurang dari 3 detik.</p>
          </div>
        ) : idp ? (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-gray-100 pb-5">
              <div className="space-y-1">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Rekomendasi IDP Aktif • Disetujui Sistem
                </span>
                <h3 className="font-bold text-lg font-display text-gray-800 mt-2">
                  Individual Development Plan (IDP) — {currentEmpData?.nama}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">IDP REG: {idp.idp_id || "IDP_PRE_GENERATED"} • PERIODE: Semester I - 2026</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleDownloadIDP}
                  className="flex items-center gap-1.5 px-3 py-1.8 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 border border-teal-650 rounded-lg transition-colors cursor-pointer"
                  title="Unduh seluruh draf rencana aksi pengembangan ini sebagai dokumen PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Berkas IDP (PDF)
                </button>
              </div>
            </div>

            {/* Strengths & Weaknesses row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Strengths Segment */}
              <div className="border border-emerald-150 bg-emerald-50/25 p-4 rounded-xl space-y-3">
                <h4 className="font-extrabold text-xs text-emerald-800 uppercase tracking-wider font-display flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Kekuatan Utama (Key Strengths)
                </h4>
                <ul className="space-y-2 text-xs text-emerald-950">
                  {(idp.strengths || []).map((st: string, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start leading-relaxed font-semibold">
                      <span className="text-emerald-500 font-extrabold mt-0.5">✔</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses Segment */}
              <div className="border border-rose-150 bg-rose-50/25 p-4 rounded-xl space-y-3">
                <h4 className="font-extrabold text-xs text-rose-800 uppercase tracking-wider font-display flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  Area Pengembangan (Growth Opportunities)
                </h4>
                <ul className="space-y-2 text-xs text-rose-950">
                  {(idp.weaknesses || []).map((wk: string, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start leading-relaxed font-semibold">
                      <span className="text-rose-400 font-extrabold mt-0.5">●</span>
                      <span>{wk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Core Actions List */}
            <div className="border border-gray-150 rounded-xl p-5 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-blue-600" />
                Daftar Rencana Aksi Pengembangan (Actionable Steps)
              </h4>

              <div className="divide-y divide-gray-100">
                {(idp.recommendations || []).map((rc: string, idx: number) => {
                  return (
                    <div key={idx} className="py-3 flex gap-3.5 items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                          {rc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {errorVisible && (
              <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-700 leading-relaxed">
                {errorVisible}
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-4">
            <Compass className="w-12 h-12 text-gray-300 animate-pulse" />
            <div className="space-y-1">
              <span className="font-extrabold text-gray-700 text-sm font-display block">Individual Development Plan Belum Terbentuk</span>
              <p className="max-w-md mx-auto text-gray-400">
                Karyawan terpilih ({currentEmpData?.nama}) belum memiliki berkas rencana aksi pengembangan tersimpan untuk Semester I.
              </p>
            </div>

            <button
              id="btn-trigger-idp-ai"
              onClick={handleGenerateAIRecommendation}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Gunakan Gemini AI Untuk Generate IDP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
