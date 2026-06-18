import React, { useState, useRef } from "react";
import { 
  User, 
  Camera, 
  Save, 
  UploadCloud, 
  Lock, 
  X, 
  Briefcase, 
  Layers, 
  Edit3, 
  Smile, 
  Key, 
  Shield 
} from "lucide-react";
import { motion } from "motion/react";

interface ProfileTabProps {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  showToast: (message: string, type?: any) => void;
}

const PRESET_AVATARS = [
  { name: "Andi (Tech)", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andi" },
  { name: "Siti (Business)", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti" },
  { name: "Rian (Junior)", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rian" },
  { name: "Dian (HR Expert)", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dian" },
  { name: "Budi (Executive)", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi" },
  { name: "Abstract Core", url: "https://api.dicebear.com/7.x/shapes/svg?seed=BUMN" },
];

export default function ProfileTab({ currentUser, setCurrentUser, showToast }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nama, setNama] = useState(currentUser.employeeName || "");
  const [jabatan, setJabatan] = useState(currentUser.employeeJabatan || "");
  const [departemen, setDepartemen] = useState(currentUser.employeeDepartemen || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(currentUser.avatar || "");
  
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File to Base64 Converter helper
  const handleFile = (file: File) => {
    // Check type
    if (!file.type.match("image.*")) {
      showToast("Hanya file gambar (.jpg, .png, .webp) yang didukung!", "info");
      return;
    }
    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran foto maksimal adalah 2MB!", "info");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setAvatar(base64);
      showToast("Foto profil berhasil dimuat! Ketuk Simpan untuk memperbarui.", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleResetForm = () => {
    setNama(currentUser.employeeName || "");
    setJabatan(currentUser.employeeJabatan || "");
    setDepartemen(currentUser.employeeDepartemen || "");
    setUsername(currentUser.username || "");
    setPassword("");
    setAvatar(currentUser.avatar || "");
    setIsEditing(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      showToast("Nama tidak boleh kosong!", "info");
      return;
    }
    if (!username.trim()) {
      showToast("Username login tidak boleh kosong!", "info");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          employee_id: currentUser.employee_id,
          username,
          password: password || undefined,
          nama,
          jabatan,
          departemen,
          avatar
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          localStorage.setItem("akhlak_session", JSON.stringify(data.user));
          showToast("Profil dan foto baru Anda berhasil diperbarui di server!", "success");
          setIsEditing(false);
          setPassword("");
        } else {
          showToast(data.message || "Gagal memperbarui profil.", "info");
        }
      } else {
        const err = await res.json();
        showToast(err.message || "Gagal memproses data perubahan.", "info");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi gangguan koneksi sistem dengan server.", "info");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Upper header section */}
      <div className="bg-[#0C2340] border-l-8 border-[#00E1D9] rounded-2xl overflow-hidden shadow-xs transition-shadow hover:shadow-sm">
        <div className="text-white p-6 md:p-8 relative overflow-hidden">
          {/* Subtle background decoration waves */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
            {/* Main view circular avatar */}
            <div className="relative group shrink-0">
              <div id="profile-avatar-container" className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 shadow-lg flex items-center justify-center font-display text-3xl font-black overflow-hidden relative">
                {avatar ? (
                  <img src={avatar} alt="Avatar Master" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  nama?.substring(0, 2).toUpperCase()
                )}
              </div>
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-blue-650 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white transition-all transform hover:scale-105 cursor-pointer"
                  title="Ganti Foto Utama"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold font-display leading-tight">{currentUser.employeeName}</h1>
                <span className="self-center sm:self-auto text-[9px] font-extrabold px-2 py-0.5 bg-white/15 border border-white/25 rounded-md tracking-wider uppercase">
                  {currentUser.role} Account
                </span>
              </div>
              <p className="text-xs text-blue-150 capitalize flex items-center justify-center sm:justify-start gap-1">
                <Briefcase className="w-3 h-3 text-blue-300" />
                {currentUser.employeeJabatan}
              </p>
              <p className="text-[11px] text-blue-200/85 flex items-center justify-center sm:justify-start gap-1">
                <Layers className="w-3 h-3 text-blue-300" />
                Divisi / Departemen : {currentUser.employeeDepartemen}
              </p>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profil & Foto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Bento-Grid Layout options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* EDIT / PREVIEW PHOTO COLUMN (Left side) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div>
              <h2 className="font-bold text-sm text-gray-800 font-display">Foto Profil & Avatar</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Atur identitas visual guna mempermudah pengenalan asesi & asesor.</p>
            </div>

            {/* Drag & Drop uploader field */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => isEditing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isEditing ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
              } ${
                dragActive ? "border-blue-500 bg-blue-50/40" : "border-gray-205 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileInputChange}
                disabled={!isEditing}
              />
              <UploadCloud className="w-8 h-8 text-slate-405 mx-auto mb-2.5" />
              <span className="text-[11px] font-bold text-gray-700 block">Seret & Lepas Foto</span>
              <span className="text-[10px] text-gray-400 block mt-1">atau klik untuk membuka browser berkas (.png, .jpg, maks 2MB)</span>
            </div>

            {avatar && isEditing && (
              <button
                type="button"
                onClick={() => {
                  setAvatar("");
                  showToast("Foto profil dinonaktifkan. Mengembalikan ke inisial huruf.", "info");
                }}
                className="w-full mt-2 py-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/50 rounded-lg transition-colors cursor-pointer text-center"
              >
                Hapus Foto / Gunakan Inisial
              </button>
            )}
          </div>
        </div>

        {/* CORE FORM DATA COLUMN (Right side) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleUpdateProfile} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h2 className="font-bold text-sm text-gray-800 font-display">Data & Akun Karyawan</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Informasi struktural pegawai BUMN dan detail otentikasi login.</p>
              </div>
              {isEditing && (
                <span className="text-[10px] bg-yellow-50 text-yellow-700 font-bold px-2.5 py-0.5 rounded-full border border-yellow-200 animate-pulse">
                  Mode Edit Aktif
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Field 1: Nama Karyawan */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-250 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="Masukkan nama resmi Anda..."
                  />
                </div>
              </div>

              {/* Field 2 & 3 Side by Side: Jabatan & Departemen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    Jabatan Struktural
                    <Shield className="w-2.5 h-2.5 text-gray-305" title="Hanya HRD yang mereferensikan posisi" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <select
                      disabled={!isEditing || currentUser.role === "karyawan"}
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-250 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl transition-all disabled:bg-gray-50/80 disabled:text-gray-500 disabled:cursor-not-allowed"
                      title={currentUser.role === "karyawan" ? "Karyawan tidak diperkenankan melompati jabatan struktural mandiri" : ""}
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
                  {currentUser.role === "karyawan" && isEditing && (
                    <span className="text-[9px] text-gray-400 mt-1 block">*) Jabatan dikunci untuk role Karyawan. Hubungi HRD untuk promosi.</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Unit Kerja / Departemen</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      disabled={!isEditing || currentUser.role === "karyawan"}
                      value={departemen}
                      onChange={(e) => setDepartemen(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-250 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl transition-all disabled:bg-gray-50/80 disabled:text-gray-500 disabled:cursor-not-allowed"
                      placeholder="Departemen penugasan..."
                    />
                  </div>
                </div>
              </div>

              {/* Login Credentials Sub-Section */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Kredensial Sesi Login Akun</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Username Login</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-gray-400 font-mono">
                        @
                      </div>
                      <input
                        type="text"
                        required
                        disabled={!isEditing}
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                        className="w-full pl-7 pr-3 py-2 text-xs border border-gray-250 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed font-mono font-semibold"
                        placeholder="username_baru"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Kata Sandi (Password) Baru</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Key className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="password"
                        disabled={!isEditing}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-gray-250 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl transition-all disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
                        placeholder={isEditing ? "Tulis password baru / kosongkan" : "••••••••"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            {isEditing && (
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 text-xs font-bold text-gray-650 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Menyimpan data..." : "Simpan Perubahan"}
                </button>
              </div>
            )}
          </form>
        </div>

      </div>

    </div>
  );
}
