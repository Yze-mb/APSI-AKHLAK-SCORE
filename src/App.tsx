import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  Calendar,
  Layers,
  Award,
  TrendingUp,
  TrendingDown,
  Compass,
  Link,
  ShieldAlert,
  Bell,
  LogOut,
  User,
  CheckCircle,
  Clock,
  Send,
  Printer,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Grid,
  Heart,
  ChevronRight,
  Info,
  Menu,
  X,
  ChevronLeft,
  Camera,
  Edit3,
  Save,
  UploadCloud,
  Lock
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

import EmployeeManager from "./components/EmployeeManager";
import RelationManager from "./components/RelationManager";
import PeriodManager from "./components/PeriodManager";
import AssessmentForm from "./components/AssessmentForm";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import TalentMapping from "./components/TalentMapping";
import IdpAdvisor from "./components/IdpAdvisor";
import ProfileTab from "./components/ProfileTab";

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unameInput, setUnameInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Forgot Password feature states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // UI Tabs & Views State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Monitoring page states
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [monitoringDeptFilter, setMonitoringDeptFilter] = useState("all");
  const [monitoringStatusFilter, setMonitoringStatusFilter] = useState("all");
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [fillingAll, setFillingAll] = useState(false);

  // Todo assessment tasks for karyawan
  const [todoTasks, setTodoTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifTray, setShowNotifTray] = useState(false);

  // Shared statistics stats (total employees, active periods)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activePeriodName: "Belum Ada Periode Aktif",
    completedCount: 0,
    pendingCount: 0,
    totalRelations: 0
  });

  // Printing simulation modal
  const [printableReport, setPrintableReport] = useState<any>(null);

  // Toast notifier
  const [toast, setToast] = useState<{ type: "success" | "info" | "reminder"; message: string } | null>(null);

  const showToast = (msg: string, type?: "success" | "info" | "reminder") => {
    let detectedType: "success" | "info" | "reminder" = type || "success";
    if (!type) {
      const lower = msg.toLowerCase();
      if (lower.includes("pengingat") || lower.includes("reminder") || lower.includes("mengirim")) {
        detectedType = "reminder";
      } else if (lower.includes("selamat") || lower.includes("masuk") || lower.includes("sesi") || lower.includes("keluar")) {
        detectedType = "info";
      }
    }
    setToast({ type: detectedType, message: msg });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    // Check local storage for persistent session
    const saved = localStorage.getItem("akhlak_session");
    if (saved) {
      const u = JSON.parse(saved);
      setCurrentUser(u);
      showToast(`Selamat datang kembali, ${u.employeeName}!`);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "karyawan") {
        fetchKaryawanTodo();
      }
      fetchNotifications();
      fetchGeneralStats();
    }
  }, [currentUser]);

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setForgotError("");
    setForgotMessage("");

    if (!forgotUsername.trim()) {
      setForgotError("Nama pengguna (username) wajib diisi untuk mendeteksi akun.");
      return;
    }
    if (!forgotNewPassword.trim() || forgotNewPassword.length < 5) {
      setForgotError("Kata sandi baru minimal harus 5 karakter.");
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: forgotUsername.trim(),
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Sandi Baru Berhasil Diperbarui! Silakan log masuk kembali.", "success");
        // Clear forgot fields
        setForgotUsername("");
        setForgotNewPassword("");
        setShowForgotModal(false);
        // Autofill username input so they can easily type the password
        setUnameInput(forgotUsername);
        setPassInput("");
      } else {
        setForgotError(data.message || "Gagal menyetel ulang kata sandi.");
      }
    } catch (err) {
      console.error(err);
      setForgotError("Gagal menghubungi server keamanan.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent, customCreds?: { u: string; p: string }) => {
    if (e) e.preventDefault();
    setLoginError("");

    const username = customCreds ? customCreds.u : unameInput;
    const password = customCreds ? customCreds.p : passInput;

    if (!username || !password) {
      setLoginError("Username dan Password wajib dilesakkan.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        localStorage.setItem("akhlak_session", JSON.stringify(data));
        setUnameInput("");
        setPassInput("");
        showToast(`Login berhasil! Masuk sebagai ${data.employeeName}`);
        
        // Match default starter tabs
        if (data.role === "manajemen") {
          setActiveTab("analytics");
        } else {
          setActiveTab("dashboard");
        }
      } else {
        const err = await res.json();
        setLoginError(err.message || "Gagal mengautentikasi.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Masalah koneksi jaringan.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("akhlak_session");
    setCurrentUser(null);
    setSelectedTask(null);
    setTodoTasks([]);
    setNotifications([]);
    setActiveTab("dashboard");
    showToast("Berhasil keluar dari sesi.");
  };

  const fetchGeneralStats = async () => {
    try {
      // Get corporate analytics
      const resAnal = await fetch("/api/reports/analytics");
      const resPeriods = await fetch("/api/periods");
      const resRel = await fetch("/api/relations");
      const resMon = await fetch("/api/assessments/monitoring");

      if (resAnal.ok && resPeriods.ok && resRel.ok && resMon.ok) {
        const anaData = await resAnal.json();
        const pdData = await resPeriods.json();
        const relData = await resRel.json();
        const monData = await resMon.json();

        setMonitoringData(monData);

        const activeP = pdData.find((p: any) => p.status === "active");
        
        const countSudah = monData.filter((m: any) => m.status === "Sudah").length;
        const countBelum = monData.filter((m: any) => m.status === "Belum" || m.status === "Draf").length;

        setStats({
          totalEmployees: anaData.count || 0,
          activePeriodName: activeP ? activeP.name : "Tidak ada periode aktif",
          completedCount: countSudah,
          pendingCount: countBelum,
          totalRelations: relData.length
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKaryawanTodo = async () => {
    if (!currentUser?.employee_id) return;
    try {
      const res = await fetch(`/api/assessments/to-do?assessor_id=${currentUser.employee_id}`);
      if (res.ok) {
        setTodoTasks(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser?.employee_id) return;
    try {
      const res = await fetch(`/api/notifications?employee_id=${currentUser.employee_id}`);
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkNotificationsRead = async () => {
    if (!currentUser?.employee_id) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: currentUser.employee_id })
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReminder = async (relationId?: string) => {
    setSendingReminder(relationId || "all");
    try {
      const res = await fetch("/api/notifications/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relation_id: relationId })
      });

      if (res.ok) {
        const ans = await res.json();
        showToast(ans.message || "Simulasi pengingat dikirim!");
        fetchGeneralStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReminder(null);
    }
  };

  const handleFillAllEmptyAssessments = async () => {
    setFillingAll(true);
    try {
      const res = await fetch("/api/assessments/fill-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const ans = await res.json();
        showToast(ans.message || "Berhasil mengisi semua bagian kosong!", "success");
        // Refetch both dashboard and active tab assessments status
        fetchGeneralStats();
        // Trigger reload on monitoring table if we are currently active
        const resMon = await fetch("/api/assessments/monitoring");
        if (resMon.ok) {
          setMonitoringData(await resMon.json());
        }
      } else {
        const errData = await res.json();
        showToast(errData.message || "Gagal mengisi data secara massal.", "info");
      }
    } catch (e) {
      console.error(e);
      showToast("Kesalahan sewaktu menghubungkan ke server.", "info");
    } finally {
      setFillingAll(false);
    }
  };

  // Launch printable profile state
  const handleOpenPrintModal = async (empId: string) => {
    try {
      const resObj = await fetch(`/api/reports/employee/${empId}`);
      if (resObj.ok) {
        setPrintableReport(await resObj.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="app-viewport" className="h-screen max-h-screen overflow-hidden flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* Toast popup panel with smooth slide-in-up animations */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-55 max-w-sm w-full bg-white border border-gray-250 rounded-xl shadow-xl p-3.5 flex items-start gap-3"
            id="global-toast-notification"
          >
            {toast.type === "reminder" ? (
              <>
                <div className="bg-amber-50 text-amber-650 p-2 rounded-lg shrink-0 flex items-center justify-center border border-amber-100">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-xs text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Memicu Pengingat!</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-550 animate-ping" />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed font-semibold">
                    {toast.message}
                  </p>
                </div>
              </>
            ) : toast.type === "info" ? (
              <>
                <div className="bg-indigo-50 text-indigo-650 p-2 rounded-lg shrink-0 flex items-center justify-center border border-indigo-100">
                  <Info className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-xs text-slate-900 tracking-tight">
                    Sistem Informasi
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed font-semibold">
                    {toast.message}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-emerald-50 text-emerald-650 p-2 rounded-lg shrink-0 flex items-center justify-center border border-emerald-100">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-xs text-slate-900 tracking-tight border-none">
                    Aksi Berhasil
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed font-semibold">
                    {toast.message}
                  </p>
                </div>
              </>
            )}

            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -----------------------------------------------------
          A. LOGIN PORTAL
          ----------------------------------------------------- */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col justify-center items-center p-4 bg-[#0B1E36] text-white self-center w-full min-h-[95vh]">
          <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Upper Emblem */}
            <div className="text-center space-y-4">

              <div className="space-y-1">
                <h1 className="text-3xl font-black font-display tracking-tight text-[#00E1D9]">
                  AKHLAKScore BUMN
                </h1>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sistem Informasi Penilaian Kinerja 360° Feedback & Talent Mapping Portal BUMN
                </p>
              </div>
            </div>

            {/* Login Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest font-display">Log Masuk Sistem</h2>
              
              <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-lg">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Pengguna (Username)</label>
                  <input
                    type="text"
                    required
                    value={unameInput}
                    onChange={(e) => setUnameInput(e.target.value)}
                    placeholder="Masukkan username anda..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-850 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kunci Sandi (Password)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotError("");
                        setForgotMessage("");
                        setForgotUsername(unameInput); // Prefill if user already typed it
                        setForgotNewPassword("");
                        setShowForgotModal(true);
                      }}
                      className="text-[10px] font-extrabold text-[#00E1D9] hover:underline cursor-pointer bg-transparent border-none outline-none focus:outline-none"
                    >
                      Lupa Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-850 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-slate-900 bg-[#00E1D9] hover:bg-[#00C4BD] rounded-lg transition-all transform hover:-translate-y-0.5 cursor-pointer text-center"
                >
                  Masuk Sekarang
                </button>
              </form>

              {/* Password Recovery Overlay Code - Super Simple & Direct */}
              <AnimatePresence>
                {showForgotModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="p-2 bg-[#00E1D9]/10 rounded-lg text-[#00E1D9]">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white font-display">Setel Ulang Kata Sandi</h3>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Portal Kinerja BUMN</p>
                        </div>
                      </div>

                      {forgotError && (
                        <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-lg">
                          {forgotError}
                        </div>
                      )}

                      {forgotMessage && (
                        <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs rounded-lg">
                          {forgotMessage}
                        </div>
                      )}

                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-display">Nama Pengguna (Username)</label>
                          <input
                            type="text"
                            required
                            value={forgotUsername}
                            onChange={(e) => setForgotUsername(e.target.value)}
                            placeholder="Contoh: dian, siti, budi..."
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-850 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-display">Kata Sandi Baru</label>
                          <input
                            type="password"
                            required
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            placeholder="Sandi baru minimal 5 karakter..."
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-850 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="flex gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowForgotModal(false)}
                            className="flex-1 py-2.5 text-xs font-bold text-slate-300 bg-slate-850 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-center"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={forgotSubmitting}
                            className="flex-[2] py-2.5 text-xs font-bold text-slate-900 bg-[#00E1D9] hover:bg-[#00C4BD] rounded-lg transition-all transform hover:-translate-y-0.5 cursor-pointer text-center disabled:opacity-50"
                          >
                            {forgotSubmitting ? "Memproses..." : "Perbarui Kata Sandi"}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>


            </div>
          </div>
        </div>
      ) : (
        /* -----------------------------------------------------
            B. CORE BACKOFFICE SYSTEM (MAIN APPLICATION)
            ----------------------------------------------------- */
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar drawer */}
          <aside className={`bg-slate-900 text-slate-300 shrink-0 transition-all duration-200 border-r border-slate-850 flex flex-col justify-between ${
            sidebarOpen ? "w-64" : "w-0 overflow-hidden border-0"
          }`}>
            <div>
              {/* Sidebar Header Title */}
              <div className="p-4 border-b border-slate-850 flex gap-2 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <span className="font-extrabold text-sm font-display tracking-wide text-white">AKHLAK BUMN</span>
                  <span className="text-[9px] bg-slate-800 text-slate-450 px-1.5 py-0.2 rounded font-mono">v1.2</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Sembunyikan Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar Profile Card representation */}
              <div className="p-4 bg-slate-950/40 border-b border-slate-850 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-850 flex items-center justify-center font-extrabold font-display text-blue-400 border border-slate-800 overflow-hidden shrink-0">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    currentUser.employeeName?.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white leading-tight truncate">{currentUser.employeeName}</div>
                  <div className="text-[9px] text-slate-400 capitalize truncate mt-0.5">{currentUser.employeeJabatan}</div>
                  <span className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.2 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md">
                    Role: {currentUser.role.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Sidebar Interactive Navigation Menu */}
              {(() => {
                const getBtnClass = (tab: string, isAIdp?: boolean) => {
                  const isActive = activeTab === tab;
                  if (isActive) {
                    return "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold rounded-lg text-left transition-colors cursor-pointer bg-[#0C2340] text-[#00E1D9] border-l-4 border-[#00E1D9] font-bold shadow-xs";
                  } else {
                    return `w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold rounded-lg text-left transition-colors cursor-pointer hover:bg-slate-800 ${isAIdp ? "text-amber-400 hover:text-white" : "text-slate-400 hover:text-white"}`;
                  }
                };
                return (
                  <nav className="p-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-505 uppercase px-2 tracking-widest block mb-2">Menu Utama</span>
                    
                    {currentUser.role === "hrd" && (
                      <>
                        <button
                          onClick={() => { setActiveTab("dashboard"); setSelectedTask(null); }}
                          className={getBtnClass("dashboard")}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          Dashboard HRD
                        </button>

                        <button
                          onClick={() => setActiveTab("employees")}
                          className={getBtnClass("employees")}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Data Karyawan (CRUD)
                        </button>

                        <button
                          onClick={() => setActiveTab("relations")}
                          className={getBtnClass("relations")}
                        >
                          <Link className="w-3.5 h-3.5" />
                          Relasi Penilai (360°)
                        </button>

                        <button
                          onClick={() => setActiveTab("periods")}
                          className={getBtnClass("periods")}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Periode Penilaian
                        </button>

                        <button
                          onClick={() => setActiveTab("monitoring")}
                          className={getBtnClass("monitoring")}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Monitoring Progres
                        </button>
                        
                        <button
                          onClick={() => setActiveTab("analytics")}
                          className={getBtnClass("analytics")}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          Dashboard Analitik
                        </button>

                        <button
                          onClick={() => setActiveTab("talent-mapping")}
                          className={getBtnClass("talent-mapping")}
                        >
                          <Grid className="w-3.5 h-3.5" />
                          Talent Mapping (9-Box)
                        </button>

                        <button
                          onClick={() => setActiveTab("idp-advisor")}
                          className={getBtnClass("idp-advisor", true)}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Rekomendasi IDP (AI)
                        </button>
                      </>
                    )}

                    {currentUser.role === "karyawan" && (
                      <>
                        <button
                          onClick={() => { setActiveTab("dashboard"); setSelectedTask(null); }}
                          className={getBtnClass("dashboard")}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Tugas Penilaian Saya
                        </button>

                        <button
                          onClick={() => setActiveTab("analytics")}
                          className={getBtnClass("analytics")}
                        >
                          <Award className="w-3.5 h-3.5" />
                          Melihat Hasil Penilaian
                        </button>

                        <button
                          onClick={() => setActiveTab("idp-advisor")}
                          className={getBtnClass("idp-advisor")}
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-300" />
                          IDP Pengembangan Saya
                        </button>
                      </>
                    )}

                    {currentUser.role === "manajemen" && (
                      <>
                        <button
                          onClick={() => setActiveTab("analytics")}
                          className={getBtnClass("analytics")}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          Dashboard Perusahaan
                        </button>

                        <button
                          onClick={() => setActiveTab("talent-mapping")}
                          className={getBtnClass("talent-mapping")}
                        >
                          <Grid className="w-3.5 h-3.5" />
                          Talent Mapping (9-Box)
                        </button>

                        <button
                          onClick={() => setActiveTab("idp-advisor")}
                          className={getBtnClass("idp-advisor", true)}
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-400" />
                          Analisis IDP AI Karyawan
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setActiveTab("profile")}
                      className={getBtnClass("profile")}
                    >
                      <User className="w-3.5 h-3.5" />
                      Profil Pengguna
                    </button>
                  </nav>
                );
              })()}
            </div>

            {/* Logout anchor drawer */}
            <div className="p-3 border-t border-slate-850">
              <button
                id="btn-logout"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-rose-450 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Sesi
              </button>
            </div>
          </aside>

          {/* Core Right Body Container */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Upper Universal Header */}
            <header className="h-14 bg-white border-b border-gray-200 shrink-0 px-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg text-slate-600 hover:text-slate-800 transition-all cursor-pointer flex items-center justify-center"
                  title={sidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
                >
                  <Menu className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-900 text-slate-100 px-2 py-0.5 rounded-full font-bold">
                    Periode Aktif:
                  </span>
                  <span className="text-xs font-bold text-gray-700 font-display">
                    {stats.activePeriodName}
                  </span>
                </div>
              </div>

              {/* End side actions: Notif icon and profile info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifTray(!showNotifTray);
                      if (!showNotifTray) handleMarkNotificationsRead();
                    }}
                    className="p-1.5 hover:bg-gray-150 rounded-lg text-gray-500 border border-gray-150/50 hover:text-gray-700 cursor-pointer"
                    title="Notifikasi"
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.some((n) => !n.is_read) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 block animate-ping"></span>
                    )}
                  </button>

                  {/* Notif drop box container */}
                  {showNotifTray && (
                    <div className="absolute right-0 top-9 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-72 p-3 space-y-2.5">
                      <div className="font-bold text-xs border-b border-gray-100 pb-1.5 flex justify-between">
                        <span>Pemberitahuan</span>
                        <button onClick={() => setShowNotifTray(false)} className="text-gray-400">✕</button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 text-[11px] italic">Tidak ada pemberitahuan baru.</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.notification_id} className="p-2 bg-blue-50/50 rounded-lg text-[11px] leading-relaxed border border-blue-100/30">
                              <span className="font-semibold text-blue-900 block">{n.title}</span>
                              <p className="text-gray-600 font-medium">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>


              </div>
            </header>

            {/* Central View Content Wrapper */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
              {/* 1. KARYAWAN CHECKLIST FLOW (TUGAS MENILAI SAYA) */}
              {currentUser.role === "karyawan" && activeTab === "dashboard" && !selectedTask && (
                <div className="space-y-6">
                  <div className="bg-[#0C2340] text-white rounded-2xl p-7 shadow-md border-l-4 border-[#00E1D9] border-t border-r border-b border-gray-800 space-y-3">
                    <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-extrabold uppercase tracking-widest text-[#00E1D9]">Beranda Karyawan BUMN</span>
                    <h2 className="text-3xl font-black font-display leading-tight">Halo, {currentUser.employeeName}!</h2>
                    <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                      Selamat datang di Portal Evaluasi Kinerja BUMN. Anda wajib melangsungkan penilaian umpan balik 360° secara adil dan transparan terhadap diri sendiri, pimpinan (atasan), rekan kerja, mau pun staf di bawah koordinasi Anda sesuai pilar AKHLAK.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <h3 className="font-bold text-lg text-gray-900 font-display flex items-center gap-2 uppercase tracking-wide">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Daftar Tugas Evaluasi 360° Anda (Harap Selesaikan Semua)
                    </h3>

                    {todoTasks.length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-sm text-gray-500 shadow-xs">
                        Luar biasa! Anda saat ini tidak memiliki kewajiban penilaian tersisa, atau semua berkas evaluasi Anda telah berhasil diverifikasi oleh HRD.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {todoTasks.map((tk) => {
                          const isFinished = tk.assessment.status === "submitted";
                          const isDraft = tk.assessment.status === "draft" && tk.assessment.scores.amanah > 0;
                          
                          return (
                            <div key={tk.relation_id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between gap-5 hover:border-blue-400 hover:shadow-md transition-all shadow-sm">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center gap-2">
                                  <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                                    tk.relation_type === "self"
                                      ? "bg-orange-50 text-orange-850 border-orange-200"
                                      : tk.relation_type === "atasan"
                                      ? "bg-blue-50 text-blue-850 border-blue-200"
                                      : tk.relation_type === "peer"
                                      ? "bg-teal-50 text-teal-850 border-teal-200"
                                      : "bg-purple-50 text-purple-850 border-purple-200"
                                  }`}>
                                    {tk.relation_type === "self" ? "Diri Sendiri" : tk.relation_type === "atasan" ? "Atasan" : tk.relation_type === "peer" ? "Rekan Kerja (Peer)" : "Bawahan"}
                                  </span>

                                  <span className={`inline-flex items-center gap-1 text-xs font-black ${
                                    isFinished ? "text-emerald-600" : isDraft ? "text-amber-500" : "text-rose-500"
                                  }`}>
                                    {isFinished ? "✔ Sudah Dikirim" : isDraft ? "● Draft Tersimpan" : "○ Belum Diisi"}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <h4 className="font-extrabold text-base text-gray-900 leading-tight">{tk.assessedNama}</h4>
                                  <p className="text-sm text-gray-650">{tk.assessedJabatan} <span className="text-gray-400">•</span> <span className="font-semibold text-blue-900">{tk.assessedDepartemen}</span></p>
                                </div>
                              </div>

                              <button
                                onClick={() => setSelectedTask(tk)}
                                className={`w-full py-2.8 text-xs sm:text-sm font-bold rounded-xl text-center cursor-pointer transition-all ${
                                  isFinished 
                                    ? "bg-gray-100 hover:bg-gray-250 text-gray-700 hover:text-black border border-gray-200" 
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs active:translate-y-0.5"
                                }`}
                              >
                                {isFinished ? "Ubah Ulang / Perbaiki Penilaian" : isDraft ? "Lanjutkan Mengisi Draft" : "Mulai Pengisian Evaluasi"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. ISIAN FORM EVALUASI JIKA TERPILIH */}
              {currentUser.role === "karyawan" && activeTab === "dashboard" && selectedTask && (
                <AssessmentForm
                  task={selectedTask}
                  currentEmployeeId={currentUser.employee_id}
                  onGoBack={() => { setSelectedTask(null); fetchKaryawanTodo(); }}
                  onSubmitSuccess={() => {
                    showToast("Form evaluasi berhasil disimpan/terkirim!");
                    setSelectedTask(null);
                    fetchKaryawanTodo();
                    fetchGeneralStats();
                  }}
                />
              )}

              {/* 3. CORE MANAGEMENT DASHBOARD HRD VIEW */}
              {currentUser.role === "hrd" && activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Dashboard Header */}
                  <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Sistem Penilaian Karyawan Berbasis 360° Feedback
                      </span>
                      <h2 className="text-2xl font-black font-display leading-tight">Beranda Administrasi HRD</h2>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                        Pantau progres pengisian nilai AKHLAK oleh seluruh asesor, konfigurasikan master departemen, serta petakan hasil evaluasi ke matriks 9-Box suksesi.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-xl text-center shrink-0 min-w-36">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Status Evaluasi</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 leading-none">TERBUKA / AKTIF</div>
                    </div>
                  </div>

                  {/* Top Stats Rows */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-gray-500 block">Penilaian Selesai</span>
                        <div className="text-2xl font-bold text-gray-800 mt-1 font-display">{stats.completedCount} Pengiriman</div>
                      </div>
                      <span className="text-lg font-bold font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
                        {stats.totalRelations > 0 ? Math.round((stats.completedCount / stats.totalRelations) * 100) : 0}%
                      </span>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-gray-500 block">Evaluasi Belum Dikirim</span>
                        <div className="text-2xl font-bold text-gray-800 mt-1 font-display">{stats.pendingCount} Asesor</div>
                      </div>
                      <span className="text-lg font-bold font-mono text-rose-600 bg-rose-50 px-2.5 py-1 rounded">
                        {stats.totalRelations > 0 ? Math.round((stats.pendingCount / stats.totalRelations) * 100) : 0}%
                      </span>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-gray-500 block">Total Jalur Relasi 360°</span>
                        <div className="text-2xl font-bold text-gray-800 mt-1 font-display">{stats.totalRelations} Mappings</div>
                      </div>
                    </div>
                  </div>

                  {/* Core Features grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Fast links router catalog with explanation */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 font-display pb-2 border-b border-gray-100">Peta Navigasi Kerja</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setActiveTab("employees")}
                          className="p-3 border border-gray-150 rounded-xl text-left hover:border-blue-500 hover:bg-gray-55/40 transition-all cursor-pointer"
                        >
                          <Users className="w-5 h-5 text-blue-600 mb-2" />
                          <div className="font-bold text-xs">A, Master Karyawan</div>
                          <p className="text-[9px] text-gray-400 mt-1">Impor data excel, sunting biodata talenta.</p>
                        </button>

                        <button
                          onClick={() => setActiveTab("relations")}
                          className="p-3 border border-gray-150 rounded-xl text-left hover:border-blue-500 hover:bg-gray-55/40 transition-all cursor-pointer"
                        >
                          <Link className="w-5 h-5 text-teal-600 mb-2" />
                          <div className="font-bold text-xs">B. Relasi Penilai</div>
                          <p className="text-[9px] text-gray-400 mt-1">Setor hubungan atasan, peer, bawahan.</p>
                        </button>

                        <button
                          onClick={() => setActiveTab("monitoring")}
                          className="p-3 border border-gray-150 rounded-xl text-left hover:border-blue-500 hover:bg-gray-55/40 transition-all cursor-pointer"
                        >
                          <Clock className="w-5 h-5 text-amber-600 mb-2" />
                          <div className="font-bold text-xs">C. Monitoring Progres</div>
                          <p className="text-[9px] text-gray-400 mt-1">Pantau & kirim pengingat pelaporan.</p>
                        </button>

                        <button
                          onClick={() => setActiveTab("talent-mapping")}
                          className="p-3 border border-gray-150 rounded-xl text-left hover:border-blue-500 hover:bg-gray-55/40 transition-all cursor-pointer"
                        >
                          <Grid className="w-5 h-5 text-purple-600 mb-2" />
                          <div className="font-bold text-xs">D. Talent Mapping 9-Box</div>
                          <p className="text-[9px] text-gray-400 mt-1">Sederhanakan pemetaan suksesi.</p>
                        </button>
                      </div>
                    </div>

                    {/* Quick Monitoring Panel */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col">
                      <div className="border-b border-gray-100 pb-2 mb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 font-display">Simulasi Pengisian & Pengingat</h3>
                        
                        <div className="flex gap-1.5 self-start sm:self-auto">
                          <button
                            onClick={handleFillAllEmptyAssessments}
                            disabled={fillingAll}
                            className="px-2 py-1 text-[9px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-md shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Mengisi semua relasi kosong dengan simulasi skor"
                          >
                            <Sparkles className={`w-2.5 h-2.5 ${fillingAll ? 'animate-spin' : ''}`} />
                            {fillingAll ? "Mengisi..." : "Isi Semua Kosong"}
                          </button>

                          <button
                            onClick={() => handleSendReminder()}
                            className="px-2.5 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            Kirim Pengingat Global
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-56 pr-1 divide-y divide-gray-100 text-xs">
                        {monitoringData.slice(0, 5).map((m: any, i: number) => {
                          const isFinished = m.status === "Sudah";
                          return (
                            <div key={i} className="py-2.5 flex justify-between items-center gap-2">
                              <div>
                                <div className="font-bold text-gray-800">{m.assessorNama}</div>
                                <div className="text-[9px] text-gray-450">Asesor untuk {m.assessedNama} ({m.relation_type})</div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  isFinished ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                }`}>
                                  {m.status}
                                </span>

                                {!isFinished && (
                                  <button
                                    onClick={() => handleSendReminder(m.relation_id)}
                                    className="p-1 hover:bg-gray-100 text-blue-500 rounded cursor-pointer"
                                    title="Kirim pengingat khusus"
                                  >
                                    <Send className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. EXPLICIT EMPLOYEES CRUD PAGE */}
              {activeTab === "employees" && (
                <EmployeeManager onRefreshStats={fetchGeneralStats} />
              )}

              {/* 5. RELATIONS INTERFACE */}
              {activeTab === "relations" && (
                <RelationManager />
              )}

              {/* 6. PERIOD INTERFACE */}
              {activeTab === "periods" && (
                <PeriodManager onPeriodChanged={fetchGeneralStats} />
              )}

              {/* 7. MONITORING INTERFACE LIST */}
              {activeTab === "monitoring" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-semibold font-display text-gray-800">Monitoring Pengisian Evaluasi Kinerja Karyawan</h2>
                      <p className="text-xs text-gray-500 mt-1">Melakukan pengenalan status kelengkapan serta memicu reminder massal ke asese-asesor.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSendReminder()}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Kirim Reminder ke Semua yang Belum Mengisi
                      </button>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-slate-500 font-medium">Berdasarkan Departemen:</span>
                      <select
                        value={monitoringDeptFilter}
                        onChange={(e) => setMonitoringDeptFilter(e.target.value)}
                        className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 w-full sm:w-44"
                      >
                        <option value="all">Semua Departemen</option>
                        <option value="Teknologi Informasi">Teknologi Informasi</option>
                        <option value="Sumber Daya Manusia">Sumber Daya Manusia</option>
                        <option value="Keuangan & Akuntansi">Keuangan & Akuntansi</option>
                        <option value="Pemasaran">Pemasaran</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
                      <select
                        value={monitoringStatusFilter}
                        onChange={(e) => setMonitoringStatusFilter(e.target.value)}
                        className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 w-full sm:w-44"
                      >
                        <option value="all">Semua Status</option>
                        <option value="Sudah">Sudah Mengirimkan</option>
                        <option value="Draf">Status Draf</option>
                        <option value="Belum">Belum Mengisi</option>
                      </select>
                    </div>
                  </div>

                  {/* Datagrid Table */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold font-display uppercase tracking-wider">
                            <th className="p-4">Nama Penilai (Asesor)</th>
                            <th className="p-4">Perspektif</th>
                            <th className="p-4">Karyawan Penerima Nilai (Asesi)</th>
                            <th className="p-4">Status Isian</th>
                            <th className="p-4 text-right">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {monitoringData
                            .filter((item) => {
                              const matchesDept = monitoringDeptFilter === "all" || item.assessorDepartemen === monitoringDeptFilter;
                              const matchesStatus = monitoringStatusFilter === "all" || item.status === monitoringStatusFilter;
                              return matchesDept && matchesStatus;
                            })
                            .map((m, idx) => {
                              const isFinished = m.status === "Sudah";
                              return (
                                <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                                  <td className="p-4">
                                    <div className="font-bold text-gray-800">{m.assessorNama}</div>
                                    <div className="text-[10px] text-gray-500">{m.assessorDepartemen}</div>
                                  </td>
                                  <td className="p-4">
                                    <span className="capitalize font-semibold text-blue-800">{m.relation_type}</span>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-bold text-gray-800">{m.assessedNama}</div>
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      isFinished ? "bg-emerald-50 text-emerald-700" : m.status === "Draf" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700 border border-rose-150"
                                    }`}>
                                      {isFinished ? "✔ Sudah Selesai" : m.status === "Draf" ? "● Masih Draf" : "○ Belum Mengisi"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    {!isFinished && (
                                      <button
                                        onClick={() => handleSendReminder(m.relation_id)}
                                        disabled={sendingReminder === m.relation_id}
                                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg inline-flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors"
                                      >
                                        <Send className="w-3 h-3" />
                                        Simulasi Send Reminder
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. ANALYTICS & DASHBOARD TAB */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  {/* Title and summary print button for HRD reviewers */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-semibold font-display text-gray-800">Dashboard Analitik & Grafik Radar 360°</h2>
                      <p className="text-xs text-slate-500 mt-1">Ulas data visualisasi, indeks Gap kesenjangan asesi, perbandingan departemen, serta ranking penilaian.</p>
                    </div>

                    <button
                      onClick={() => {
                        // Find dynamic employee to inspect with printable cert
                        const list = todoTasks.length > 0 ? todoTasks[0].assessed_id : "EMP003";
                        handleOpenPrintModal(list);
                      }}
                      className="px-3 py-1.8 text-xs font-bold text-slate-700 bg-white border border-gray-200 hover:bg-gray-55 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      Cetak Simulator PDF (Hasil Evaluasi)
                    </button>
                  </div>

                  <AnalyticsDashboard
                    currentEmployeeRole={currentUser.role}
                    currentEmployeeId={currentUser.employee_id}
                  />
                </div>
              )}

              {/* 9. TALENT MAPPING 9-BOX VIEW */}
              {activeTab === "talent-mapping" && (
                <TalentMapping />
              )}

              {/* 10. IDP ADVISOR Gemini AI VIEW */}
              {activeTab === "idp-advisor" && (
                <IdpAdvisor currentEmployeeId={currentUser.employee_id} />
              )}

              {/* 11. PROFILE PAGE VIEW */}
              {activeTab === "profile" && (
                <ProfileTab
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  showToast={showToast}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {/* -----------------------------------------------------
          C. PRINTABLE REPORT MODAL (SIMULATOR FOR REVIEWS)
          ----------------------------------------------------- */}
      {printableReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col my-8">
            <div className="p-4 border-b border-gray-150 bg-slate-50 flex justify-between items-center shrink-0">
              <span className="font-bold text-xs font-display text-slate-700 flex items-center gap-1">
                <Printer className="w-4 h-4 text-blue-600" />
                Draf Simulator Laporan Evaluasi 360° (AKHLAKScore Resmi BUMN)
              </span>
              <button
                onClick={() => setPrintableReport(null)}
                className="text-slate-400 hover:text-slate-600 text-[11px] font-bold"
              >
                Tutup ✕
              </button>
            </div>

            {/* Simulated Printed Certificate */}
            <div className="p-8 space-y-6 flex-1 overflow-y-auto bg-white max-h-[70vh] text-xs">
              
              {/* Certificate Border decoration */}
              <div className="border-4 double border-blue-900 p-6 space-y-6 rounded-lg text-center">
                
                {/* Header title */}
                <div className="text-center space-y-2">
                  <span className="text-xl font-bold font-display uppercase tracking-wider text-blue-900">
                    Sistem Penilaian Kinerja BUMN Indonesia
                  </span>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                    Laporan Hasil Asesmen 360° Feedback Kinerja AKHLAK
                  </p>
                  <div className="h-0.5 bg-blue-900 w-full mx-auto my-3" />
                </div>

                {/* Subject name */}
                <div className="space-y-1 py-4">
                  <span className="text-gray-400 text-[9px] block uppercase font-bold">Diberikan kepada Karyawan:</span>
                  <h4 className="text-lg font-black font-display text-slate-800 leading-none">
                    {printableReport.employee?.nama}
                  </h4>
                  <p className="text-gray-550 italic leading-snug">
                    {printableReport.employee?.jabatan} — Departemen {printableReport.employee?.departemen}
                  </p>
                </div>

                {/* Score indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                  {Object.entries(printableReport.finalAverages || {}).map(([key, num]: any) => (
                    <div key={key} className="p-3 bg-slate-50 border border-gray-100 rounded hover:border-blue-900 transition-colors">
                      <div className="font-extrabold text-[10px] uppercase text-gray-500 font-display leading-tight">{key}</div>
                      <div className="text-lg font-black text-blue-900 mt-1 font-mono leading-none">{num > 0 ? num : "0.0"}</div>
                      <span className="text-[8px] text-gray-450 block mt-1">Skala 1 - 5</span>
                    </div>
                  ))}
                </div>

                {/* Score total */}
                <div className="py-5 bg-blue-900 text-white rounded-lg px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-blue-200 uppercase font-black tracking-widest block">Matriks Hasil Integrasi</span>
                    <span className="text-sm font-black font-display text-white">Indeks Kelayakan AKHLAKScore (Composite)</span>
                  </div>

                  <div className="text-center bg-white/10 px-4 py-2 rounded-lg">
                    <span className="text-2xl font-black font-mono leading-none block">{printableReport.finalScore}</span>
                    <span className="text-[8px] text-blue-200 font-bold block leading-none mt-1">SKOR MAKSIMAL 5.0</span>
                  </div>
                </div>

                {/* Quality Comments signoff */}
                {printableReport.comments?.length > 0 && (
                  <div className="text-left space-y-2 pt-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Ringkasan Evaluasi Kualitatif Tim:</span>
                    <p className="text-slate-650 leading-relaxed italic block mb-2 pl-4 border-l-2 border-slate-300">
                      {printableReport.comments[0].substring(printableReport.comments[0].indexOf(":") + 1).replace(/^"|"$/g, "")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 text-right border-t border-gray-150 shrink-0 flex justify-end gap-2 flex-wrap">
              <button
                onClick={() => setPrintableReport(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              
              <button
                onClick={() => {
                  const report = printableReport;
                  const content = `================================================\n` +
                    `LAPORAN HASIL ASESMEN 360° FEEDBACK AKHLAK\n` +
                    `================================================\n` +
                    `Karyawan    : ${report?.employee?.nama}\n` +
                    `Jabatan     : ${report?.employee?.jabatan}\n` +
                    `Departemen  : ${report?.employee?.departemen}\n` +
                    `ID Karyawan : ${report?.employee?.employee_id}\n\n` +
                    `SKOR EVALUASI AKHLAK:\n` +
                    `- Amanah      : ${report?.finalAverages?.amanah || 0}\n` +
                    `- Kompeten    : ${report?.finalAverages?.kompeten || 0}\n` +
                    `- Harmonis    : ${report?.finalAverages?.harmonis || 0}\n` +
                    `- Loyal       : ${report?.finalAverages?.loyal || 0}\n` +
                    `- Adaptif     : ${report?.finalAverages?.adaptif || 0}\n` +
                    `- Kolaboratif : ${report?.finalAverages?.kolaboratif || 0}\n\n` +
                    `------------------------------------------------\n` +
                    `Skor Akhir (Composite Score): ${report?.finalScore} / 5.0\n` +
                    `------------------------------------------------\n\n` +
                    `CATATAN FEEDBACK TIM:\n` +
                    `${report?.comments?.length > 0 
                      ? report.comments.map((c: string) => "- " + c).join("\n") 
                      : "Tidak ada catatan kualitatif."}\n\n` +
                    `================================================\n` +
                    `Dibuat secara otomatis oleh Platform AKHLAKScore.\n` +
                    `Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}\n`;

                  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `Laporan_AKHLAK_${report?.employee?.nama.replace(/\s+/g, "_")}.txt`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
              >
                Unduh Laporan (.txt)
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Halaman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
