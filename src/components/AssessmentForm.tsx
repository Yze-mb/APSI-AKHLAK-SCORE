import React, { useState } from "react";
import { CheckCircle2, ChevronLeft, Save, Star, Info } from "lucide-react";

interface AssessmentFormProps {
  task: {
    relation_id: string;
    assessed_id: string;
    assessedNama: string;
    assessedJabatan: string;
    assessedDepartemen: string;
    relation_type: "self" | "atasan" | "peer" | "bawahan";
    period_id: string;
    periodName: string;
    assessment: {
      assessment_id: string;
      scores: {
        amanah: number;
        kompeten: number;
        harmonis: number;
        loyal: number;
        adaptif: number;
        kolaboratif: number;
      };
      notes: string;
      status: "draft" | "submitted";
    };
  };
  currentEmployeeId: string;
  onGoBack: () => void;
  onSubmitSuccess: () => void;
}

const indicators = [
  {
    key: "amanah",
    name: "Amanah",
    desc: "Memegang teguh kepercayaan yang diberikan.",
    placeholder: "Contoh perilaku: Jujur, bertanggung jawab, berintegritas tinggi, menepati janji."
  },
  {
    key: "kompeten",
    name: "Kompeten",
    desc: "Terus belajar dan mengembangkan kapabilitas.",
    placeholder: "Contoh perilaku: Senantiasa meningkatkan keahlian diri, hasil kerja terbaik, membantu orang lain belajar."
  },
  {
    key: "harmonis",
    name: "Harmonis",
    desc: "Saling peduli dan menghargai perbedaan.",
    placeholder: "Contoh perilaku: Menghargai keberagaman suku/agama, suka menolong, membangun suasana kondusif."
  },
  {
    key: "loyal",
    name: "Loyal",
    desc: "Dedikasi tinggi dan mengutamakan kepentingan institusi serta bangsa.",
    placeholder: "Contoh perilaku: Menjaga rahasia jabatan/perusahaan, patuh instruksi pimpinan sepanjang selaras moral."
  },
  {
    key: "adaptif",
    name: "Adaptif",
    desc: "Terus berinovasi dan antusias dalam menghadapi perubahan.",
    placeholder: "Contoh perilaku: Cepat menyesuaikan diri pada sistem baru, terus melakukan perbaikan inovatif."
  },
  {
    key: "kolaboratif",
    name: "Kolaboratif",
    desc: "Membangun kerja sama yang sinergis.",
    placeholder: "Contoh perilaku: Memberi peluang kontribusi berbagai pihak, bersinergi demi hasil bersama."
  }
];

export default function AssessmentForm({ task, currentEmployeeId, onGoBack, onSubmitSuccess }: AssessmentFormProps) {
  const [scores, setScores] = useState({
    amanah: task.assessment.scores.amanah || 0,
    kompeten: task.assessment.scores.kompeten || 0,
    harmonis: task.assessment.scores.harmonis || 0,
    loyal: task.assessment.scores.loyal || 0,
    adaptif: task.assessment.scores.adaptif || 0,
    kolaboratif: task.assessment.scores.kolaboratif || 0
  });
  
  const [notes, setNotes] = useState(task.assessment.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorVisible, setErrorVisible] = useState("");

  const handleScoreChange = (key: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async (submitStatus: "draft" | "submitted") => {
    setErrorVisible("");

    if (submitStatus === "submitted") {
      // Validate all scores are filled
      const unrated = Object.entries(scores).filter(([k, v]) => (v as number) < 1);
      if (unrated.length > 0) {
        setErrorVisible("Harap isi skor nilai (skala 1-5) untuk seluruh indikator AKHLAK sebelum melakukan pengiriman final.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessor_id: currentEmployeeId,
          assessed_id: task.assessed_id,
          period_id: task.period_id,
          relation_type: task.relation_type,
          scores,
          notes,
          status: submitStatus
        })
      });

      if (res.ok) {
        onSubmitSuccess();
      } else {
        setErrorVisible("Server menolak menyimpan data evaluasi.");
      }
    } catch (e) {
      console.error(e);
      setErrorVisible("Terjadi kegagalan jaringan saat mengirim penilaian.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="assessment-form-container" className="space-y-6">
      {/* Header info */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGoBack}
          className="p-1 px-2.5 bg-white border border-gray-200 hover:bg-gray-100/80 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Kembali
        </button>

        <div className="text-[10px] text-gray-400 font-mono">
          FORM EVALUASI #360 » POLA: {task.relation_type.toUpperCase()}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-150 px-2.5 py-0.5 rounded-full font-semibold">
              {task.periodName}
            </span>
            <h2 className="text-xl font-bold font-display text-gray-800 mt-2">
              {task.relation_type === "self" ? "Penilaian Mandiri (Self Assessment)" : `Mengevaluasi Rekan Kerja`}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {task.relation_type === "self" 
                ? "Evaluasi tingkat keterpaduan dan kepatuhan diri terhadap pilar-pilar AKHLAK" 
                : `Memberi rating kualitatif & kuantitatif demi memacu pertumbuhan karir rekan kerja.`}
            </p>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-1 w-full sm:w-auto min-w-56">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Karyawan Penerima Nilau (Asesi)</div>
            <div className="font-bold text-gray-800 text-sm">{task.assessedNama}</div>
            <div className="text-gray-500">{task.assessedJabatan} - <span className="font-semibold">{task.assessedDepartemen}</span></div>
          </div>
        </div>
      </div>

      {errorVisible && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-150 rounded-xl text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-600 animate-bounce" />
          <span>{errorVisible}</span>
        </div>
      )}

      {/* Form indicators listing */}
      <div className="space-y-4">
        {indicators.map((ind) => {
          const currentScore = (scores as any)[ind.key];

          return (
            <div key={ind.key} className="bg-white border border-gray-200/80 rounded-xl p-5 hover:border-gray-300 transition-all shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                <div>
                  <h3 className="font-bold text-sm text-gray-800 font-display flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block"></span>
                    {ind.name}
                  </h3>
                  <p className="text-xs text-gray-500">{ind.desc}</p>
                </div>

                <div className="text-[10px] text-gray-400 max-w-sm sm:text-right italic">
                  {ind.placeholder}
                </div>
              </div>

              {/* Slider / Click Scale */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const titles = [
                    "Sangat Kurang",
                    "Kurang",
                    "Cukup",
                    "Baik",
                    "Sangat Baik"
                  ];
                  return (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => handleScoreChange(ind.key, lvl)}
                      className={`p-3 relative rounded-lg border text-left cursor-pointer transition-all ${
                        currentScore === lvl
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-gray-50/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold font-mono">{lvl}</span>
                        {currentScore >= lvl && (
                          <Star className={`w-3 h-3 fill-amber-300 stroke-amber-500 ${currentScore === lvl ? "text-amber-300" : ""}`} />
                        )}
                      </div>
                      <div className={`text-[10px] font-semibold block ${currentScore === lvl ? "text-blue-50" : "text-gray-500"}`}>
                        {titles[lvl - 1]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Written general feedback */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div>
          <h3 className="font-bold text-sm text-gray-800 font-display">Saran & Umpan Balik Kualitatif (Feedback)</h3>
          <p className="text-xs text-gray-500">Tuliskan narasi singkat berisi kekuatan utama, area perbaikan diri, atau inspirasi konstruktif untuk asesi ini.</p>
        </div>

        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Berikan saran membangun, misalnya: 'Komunikasi teknis sangat baik secara internal, disarankan mengambil inisiatif pelaporan agar lebih transparan dengan divisi eksternal.'"
          className="w-full p-4 border border-gray-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:border-blue-500 bg-gray-50/20"
        />
      </div>

      {/* Trigger Buttons Footer */}
      <div className="p-4 border border-blue-150 bg-blue-50/35 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-xs text-gray-600">Simpan sebagai draf apabila Anda belum yakin dengan nilai yang dipilih.</span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave("draft")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan sebagai Draf
          </button>
          
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave("submitted")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Kirim Evaluasi Final
          </button>
        </div>
      </div>
    </div>
  );
}
