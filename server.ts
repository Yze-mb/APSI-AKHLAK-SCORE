import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

// Initialize Gemini SDK lazily to avoid startup crashes if key is missing
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.error("Failed to initialize Gemini:", e);
    }
  }
  return ai;
}

// -----------------------------------------------------
// DATABASE SEED DATA
// -----------------------------------------------------
const initialEmployees = [
  { employee_id: "EMP001", nama: "Budi Santoso", jabatan: "Direktur Utama", departemen: "Direksi", potential: "high" },
  { employee_id: "EMP002", nama: "Andi Wijaya", jabatan: "Manager IT", departemen: "Teknologi Informasi", potential: "high" },
  { employee_id: "EMP003", nama: "Siti Rahma", jabatan: "Senior Software Engineer", departemen: "Teknologi Informasi", potential: "high" },
  { employee_id: "EMP004", nama: "Rian Hidayat", jabatan: "Junior Software Engineer", departemen: "Teknologi Informasi", potential: "medium" },
  { employee_id: "EMP005", nama: "Dian Lestari", jabatan: "HR Specialist", departemen: "Sumber Daya Manusia", potential: "high" },
  { employee_id: "EMP006", nama: "Hendra Wijaya", jabatan: "Finance Lead", departemen: "Keuangan & Akuntansi", potential: "medium" },
  { employee_id: "EMP007", nama: "Ayu Astuti", jabatan: "Marketing Associate", departemen: "Pemasaran", potential: "medium" },
  { employee_id: "EMP008", nama: "Rahmat Hidayat", jabatan: "IT Support Specialist", departemen: "Teknologi Informasi", potential: "low" },
];

const initialUsers = [
  { user_id: "U001", username: "budi", password: "budi123", role: "manajemen", employee_id: "EMP001" },
  { user_id: "U002", username: "andi", password: "andi123", role: "karyawan", employee_id: "EMP002" },
  { user_id: "U003", username: "siti", password: "siti123", role: "karyawan", employee_id: "EMP003" },
  { user_id: "U004", username: "rian", password: "rian123", role: "karyawan", employee_id: "EMP004" },
  { user_id: "U005", username: "dian", password: "dian123", role: "hrd", employee_id: "EMP005" },
  { user_id: "U006", username: "hendra", password: "hendra123", role: "karyawan", employee_id: "EMP006" },
  { user_id: "U007", username: "ayu", password: "ayu123", role: "karyawan", employee_id: "EMP007" },
  { user_id: "U008", username: "rahmat", password: "rahmat123", role: "karyawan", employee_id: "EMP008" },
];

const initialPeriods = [
  { period_id: "P001", name: "Evaluasi Semester I - 2026", start_date: "2026-01-01", end_date: "2026-06-30", status: "active" },
  { period_id: "P002", name: "Evaluasi Tahunan - 2025", start_date: "2025-01-01", end_date: "2025-12-31", status: "closed" },
];

const initialRelations = [
  // Andi ("EMP002") relations (Manager IT)
  { relation_id: "R001", assessor_id: "EMP002", assessed_id: "EMP002", relation_type: "self" }, // andi evaluates himself
  { relation_id: "R002", assessor_id: "EMP003", assessed_id: "EMP002", relation_type: "bawahan" }, // siti evaluates manager andi
  { relation_id: "R003", assessor_id: "EMP004", assessed_id: "EMP002", relation_type: "bawahan" }, // rian evaluates manager andi
  { relation_id: "R004", assessor_id: "EMP001", assessed_id: "EMP002", relation_type: "atasan" }, // budi evaluates andi
  
  // Siti ("EMP003") relations (Senior SE)
  { relation_id: "R005", assessor_id: "EMP003", assessed_id: "EMP003", relation_type: "self" },
  { relation_id: "R006", assessor_id: "EMP002", assessed_id: "EMP003", relation_type: "atasan" }, // andi evaluates siti
  { relation_id: "R007", assessor_id: "EMP004", assessed_id: "EMP003", relation_type: "peer" }, // rian evaluates siti
  
  // Rian ("EMP004") relations (Junior SE)
  { relation_id: "R008", assessor_id: "EMP004", assessed_id: "EMP004", relation_type: "self" },
  { relation_id: "R009", assessor_id: "EMP002", assessed_id: "EMP004", relation_type: "atasan" }, // andi evaluates rian
  { relation_id: "R010", assessor_id: "EMP003", assessed_id: "EMP004", relation_type: "peer" }, // siti evaluates rian

  // Dian ("EMP005") relations (HR)
  { relation_id: "R011", assessor_id: "EMP005", assessed_id: "EMP005", relation_type: "self" },
  { relation_id: "R012", assessor_id: "EMP001", assessed_id: "EMP005", relation_type: "atasan" },

  // Hendra ("EMP006") relations (Finance)
  { relation_id: "R013", assessor_id: "EMP006", assessed_id: "EMP006", relation_type: "self" },
  { relation_id: "R014", assessor_id: "EMP001", assessed_id: "EMP006", relation_type: "atasan" },
];

const initialAssessments = [
  // Semester I - 2026 submissions (completed evaluations to have graphs ready)
  // Evaluasi Siti Rahma ("EMP003")
  {
    assessment_id: "A001",
    assessor_id: "EMP003",
    assessed_id: "EMP003",
    period_id: "P001",
    relation_type: "self",
    scores: { amanah: 4, kompeten: 5, harmonis: 4, loyal: 4, adaptif: 5, kolaboratif: 4 },
    notes: "Sudah berusaha maksimal meningkatkan standar pengkodean tim.",
    status: "submitted",
    submitted_at: "2026-06-10"
  },
  {
    assessment_id: "A002",
    assessor_id: "EMP002",
    assessed_id: "EMP003",
    period_id: "P001",
    relation_type: "atasan",
    scores: { amanah: 5, kompeten: 5, harmonis: 3, loyal: 5, adaptif: 4, kolaboratif: 4 },
    notes: "Sangat ahli secara teknis, tapi perlu meningkatkan pendekatan harmonis dengan tim lain.",
    status: "submitted",
    submitted_at: "2026-06-12"
  },
  {
    assessment_id: "A003",
    assessor_id: "EMP004",
    assessed_id: "EMP003",
    period_id: "P001",
    relation_type: "peer",
    scores: { amanah: 4, kompeten: 4, harmonis: 4, loyal: 4, adaptif: 4, kolaboratif: 5 },
    notes: "Sangat suportif mengajari Junior Dev, kolaborasi yang asyik.",
    status: "submitted",
    submitted_at: "2026-06-14"
  },

  // Evaluasi Rian Hidayat ("EMP004") (Draf dan Sebagian Submitted)
  {
    assessment_id: "A004",
    assessor_id: "EMP004",
    assessed_id: "EMP004",
    period_id: "P001",
    relation_type: "self",
    scores: { amanah: 3, kompeten: 3, harmonis: 5, loyal: 4, adaptif: 3, kolaboratif: 4 },
    notes: "Masih banyak belajar teknologi baru.",
    status: "submitted",
    submitted_at: "2026-06-12"
  },
  {
    assessment_id: "A005",
    assessor_id: "EMP002",
    assessed_id: "EMP004",
    period_id: "P001",
    relation_type: "atasan",
    scores: { amanah: 4, kompeten: 3, harmonis: 4, loyal: 4, adaptif: 3, kolaboratif: 4 },
    notes: "Potensi bagus, namun adaptabilitas untuk dilepas mandiri perlu dikembangkan.",
    status: "submitted",
    submitted_at: "2026-06-15"
  },

  // Evaluasi Andi Wijaya ("EMP002") - Sebagian submitted, siti belum isi (agar ada modul mengisi evaluasi)
  {
    assessment_id: "A006",
    assessor_id: "EMP002",
    assessed_id: "EMP002",
    period_id: "P001",
    relation_type: "self",
    scores: { amanah: 5, kompeten: 4, harmonis: 4, loyal: 5, adaptif: 4, kolaboratif: 5 },
    notes: "Mengarahkan roadmap tim IT dengan baik.",
    status: "submitted",
    submitted_at: "2026-06-14"
  },
  {
    assessment_id: "A007",
    assessor_id: "EMP001",
    assessed_id: "EMP002",
    period_id: "P001",
    relation_type: "atasan",
    scores: { amanah: 4, kompeten: 4, harmonis: 5, loyal: 4, adaptif: 5, kolaboratif: 4 },
    notes: "Kepemimpinan yang kuat di tim IT.",
    status: "submitted",
    submitted_at: "2026-06-15"
  },
  {
    assessment_id: "A008",
    assessor_id: "EMP004",
    assessed_id: "EMP002",
    period_id: "P001",
    relation_type: "bawahan",
    scores: { amanah: 5, kompeten: 4, harmonis: 4, loyal: 4, adaptif: 4, kolaboratif: 5 },
    notes: "Manager yang sangat membimbing karir bawahan.",
    status: "submitted",
    submitted_at: "2026-06-15"
  }
  // Catatan: A009 (assessor: EMP003 / Siti, assessed: EMP002 / Andi, relation: bawahan) belum di-create atau draf, agar Siti bisa mengisi di webnya sendiri!
];

const initialNotifications = [
  {
    notification_id: "N001",
    employee_id: "EMP003",
    title: "Pengingat Penilaian",
    message: "Silakan selesaikan penilaian untuk atasan Anda (Andi Wijaya) sebelum tenggat waktu.",
    is_read: false,
    created_at: "2026-06-15T08:00:00Z"
  }
];

const initialIDPs = [
  {
    idp_id: "IDP001",
    employee_id: "EMP003",
    period_id: "P001",
    strengths: ["Keahlian Teknis (Kompeten)", "Kempetensi Adaptabilitas & Teknologi Baru (Adaptif)"],
    weaknesses: ["Hubungan Interpersonal (Harmonis)", "Kolaborasi Lintas Departemen"],
    recommendations: [
      "Mengikuti program sertifikasi Advanced System Design.",
      "Mengikuti training soft skills tentang komunikasi asertif dan diplomasi konflik.",
      "Menjadi mentor bagi developer junior di departemen IT untuk mengasah kepemimpinan."
    ],
    created_at: "2026-06-15"
  }
];

// Helper to write database to json
function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Read database or generate if not exists
function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    const data = {
      employees: initialEmployees,
      users: initialUsers,
      periods: initialPeriods,
      relations: initialRelations,
      assessments: initialAssessments,
      notifications: initialNotifications,
      idps: initialIDPs,
    };
    saveDB(data);
    return data;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading database, creating fresh seed...", error);
    const data = {
      employees: initialEmployees,
      users: initialUsers,
      periods: initialPeriods,
      relations: initialRelations,
      assessments: initialAssessments,
      notifications: initialNotifications,
      idps: initialIDPs,
    };
    saveDB(data);
    return data;
  }
}

// Init database on startup
getDB();

// -----------------------------------------------------
// API ROUTING
// -----------------------------------------------------

// Login API
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const user = db.users.find(
    (u: any) => u.username.toLowerCase() === username?.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Username atau Password salah!" });
  }

  const employee = db.employees.find((e: any) => e.employee_id === user.employee_id);
  res.json({
    user_id: user.user_id,
    username: user.username,
    role: user.role,
    employee_id: user.employee_id,
    employeeName: employee ? employee.nama : "Administrator",
    employeeJabatan: employee ? employee.jabatan : "HR Officer",
    employeeDepartemen: employee ? employee.departemen : "HRD",
    avatar: employee && employee.avatar ? employee.avatar : "",
  });
});

// Forgot Password - Simple Direct Reset
app.post("/api/auth/reset-password", (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ message: "Username dan Kata Sandi Baru wajib diisi." });
  }

  if (newPassword.length < 5) {
    return res.status(400).json({ message: "Sandi baru minimal harus terdiri dari 5 karakter." });
  }

  const db = getDB();
  const userIndex = db.users.findIndex((u: any) => u.username.toLowerCase() === username.trim().toLowerCase());

  if (userIndex === -1) {
    return res.status(404).json({ message: "Nama pengguna (username) tidak ditemukan." });
  }

  // Update password in the database
  db.users[userIndex].password = newPassword;
  saveDB(db);

  res.json({
    message: "Kata sandi Anda berhasil diperbarui! Silakan login kembali dengan sandi baru."
  });
});

// Update Profile API
app.post("/api/profile/update", (req, res) => {
  const { user_id, employee_id, username, password, nama, jabatan, departemen, avatar } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: "Sesi pengguna tidak valid. Silakan login kembali." });
  }

  const db = getDB();
  const userIndex = db.users.findIndex((u: any) => u.user_id === user_id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "Pengguna tidak ditemukan." });
  }

  // If username is changing, verify unique username in DB (excluding self)
  if (username && username !== db.users[userIndex].username) {
    const isTaken = db.users.some((u: any) => u.user_id !== user_id && u.username.toLowerCase() === username.toLowerCase());
    if (isTaken) {
      return res.status(400).json({ message: "Username ini sudah digunakan pihak lain!" });
    }
    db.users[userIndex].username = username;
  }

  if (password) {
    db.users[userIndex].password = password;
  }

  let updatedEmp: any = null;
  if (employee_id) {
    const empIndex = db.employees.findIndex((e: any) => e.employee_id === employee_id);
    if (empIndex !== -1) {
      if (nama) db.employees[empIndex].nama = nama;
      if (jabatan) db.employees[empIndex].jabatan = jabatan;
      if (departemen) db.employees[empIndex].departemen = departemen;
      if (avatar !== undefined) db.employees[empIndex].avatar = avatar; // can accept base64 or custom preset url
      updatedEmp = db.employees[empIndex];
    }
  }

  saveDB(db);

  res.json({
    success: true,
    message: "Profil sukses diperbarui!",
    user: {
      user_id: db.users[userIndex].user_id,
      username: db.users[userIndex].username,
      role: db.users[userIndex].role,
      employee_id: db.users[userIndex].employee_id,
      employeeName: updatedEmp ? updatedEmp.nama : (db.users[userIndex].role === "manajemen" || db.users[userIndex].role === "hrd" ? "Administrator" : "User Platform"),
      employeeJabatan: updatedEmp ? updatedEmp.jabatan : "Staff",
      employeeDepartemen: updatedEmp ? updatedEmp.departemen : "Layanan Kerja",
      avatar: updatedEmp && updatedEmp.avatar ? updatedEmp.avatar : ""
    }
  });
});

// GET Current User Notifications
app.get("/api/notifications", (req, res) => {
  const currentEmployeeId = req.query.employee_id as string;
  if (!currentEmployeeId) return res.json([]);
  
  const db = getDB();
  const list = db.notifications.filter((n: any) => n.employee_id === currentEmployeeId);
  res.json(list);
});

// POST Mark Read Notifications
app.post("/api/notifications/read", (req, res) => {
  const { employee_id } = req.body;
  const db = getDB();
  db.notifications = db.notifications.map((n: any) => {
    if (n.employee_id === employee_id) n.is_read = true;
    return n;
  });
  saveDB(db);
  res.json({ success: true });
});

// GET Employees list
app.get("/api/employees", (req, res) => {
  const db = getDB();
  res.json(db.employees);
});

// POST Create Employee
app.post("/api/employees", (req, res) => {
  const { nama, jabatan, departemen, potential, username, password, role } = req.body;
  const db = getDB();
  
  const newEmpId = `EMP${String(db.employees.length + 1).padStart(3, "0")}`;
  const newEmp = {
    employee_id: newEmpId,
    nama,
    jabatan,
    departemen,
    potential: potential || "medium"
  };

  db.employees.push(newEmp);

  // Auto create user account
  const newUserId = `U${String(db.users.length + 1).padStart(3, "0")}`;
  db.users.push({
    user_id: newUserId,
    username: username || nama.toLowerCase().replace(/\s+/g, ""),
    password: password || "password123",
    role: role || "karyawan",
    employee_id: newEmpId
  });

  // Auto create self assessment relationship
  const nextRelId = `R${String(db.relations.length + 1).padStart(3, "0")}`;
  db.relations.push({
    relation_id: nextRelId,
    assessor_id: newEmpId,
    assessed_id: newEmpId,
    relation_type: "self"
  });

  saveDB(db);
  res.status(201).json(newEmp);
});

// PUT Update Employee
app.put("/api/employees/:id", (req, res) => {
  const employee_id = req.params.id;
  const { nama, jabatan, departemen, potential } = req.body;
  const db = getDB();
  
  const index = db.employees.findIndex((e: any) => e.employee_id === employee_id);
  if (index === -1) return res.status(404).json({ message: "Employee not found" });

  db.employees[index] = {
    ...db.employees[index],
    nama: nama || db.employees[index].nama,
    jabatan: jabatan || db.employees[index].jabatan,
    departemen: departemen || db.employees[index].departemen,
    potential: potential || db.employees[index].potential,
  };

  saveDB(db);
  res.json(db.employees[index]);
});

// DELETE Employee
app.delete("/api/employees/:id", (req, res) => {
  const employee_id = req.params.id;
  const db = getDB();

  db.employees = db.employees.filter((e: any) => e.employee_id !== employee_id);
  db.users = db.users.filter((u: any) => u.employee_id !== employee_id);
  db.relations = db.relations.filter((r: any) => r.assessor_id !== employee_id && r.assessed_id !== employee_id);
  db.assessments = db.assessments.filter((a: any) => a.assessor_id !== employee_id && a.assessed_id !== employee_id);

  saveDB(db);
  res.json({ message: "Employee deleted successfully" });
});

// POST Reset Database to Sample Data
app.post("/api/employees/import-sample", (req, res) => {
  const data = {
    employees: initialEmployees,
    users: initialUsers,
    periods: initialPeriods,
    relations: initialRelations,
    assessments: initialAssessments,
    notifications: initialNotifications,
    idps: initialIDPs,
  };
  saveDB(data);
  res.json({ success: true, message: "Sample data successfully loaded!" });
});

// GET Departments list (dynamically aggregated or hardcoded list)
app.get("/api/departments", (req, res) => {
  const db = getDB();
  const departments = Array.from(new Set(db.employees.map((e: any) => e.departemen)));
  res.json(departments);
});

// GET Relations list
app.get("/api/relations", (req, res) => {
  const db = getDB();
  const enriched = db.relations.map((r: any) => {
    const assessor = db.employees.find((e: any) => e.employee_id === r.assessor_id);
    const assessed = db.employees.find((e: any) => e.employee_id === r.assessed_id);
    return {
      ...r,
      assessorNama: assessor ? assessor.nama : `Unknown (${r.assessor_id})`,
      assessorDepartemen: assessor ? assessor.departemen : "",
      assessedNama: assessed ? assessed.nama : `Unknown (${r.assessed_id})`,
      assessedDepartemen: assessed ? assessed.departemen : "",
    };
  });
  res.json(enriched);
});

// POST Create/Save Relation Map
app.post("/api/relations", (req, res) => {
  const { assessor_id, assessed_id, relation_type } = req.body;
  const db = getDB();

  // Check unique key
  const exists = db.relations.find(
    (r: any) => r.assessor_id === assessor_id && r.assessed_id === assessed_id
  );

  if (exists) {
    exists.relation_type = relation_type;
  } else {
    const nextId = `R${String(db.relations.length + 1).padStart(3, "0")}`;
    db.relations.push({
      relation_id: nextId,
      assessor_id,
      assessed_id,
      relation_type
    });
  }

  saveDB(db);
  res.status(201).json({ success: true });
});

// DELETE Relation
app.delete("/api/relations/:id", (req, res) => {
  const id = req.params.id;
  const db = getDB();
  db.relations = db.relations.filter((r: any) => r.relation_id !== id);
  saveDB(db);
  res.json({ success: true });
});

// GET Periods list
app.get("/api/periods", (req, res) => {
  const db = getDB();
  res.json(db.periods);
});

// POST Create Period
app.post("/api/periods", (req, res) => {
  const { name, start_date, end_date, status } = req.body;
  const db = getDB();
  const period_id = `P${String(db.periods.length + 1).padStart(3, "0")}`;
  
  if (status === "active") {
    // Open only one active period
    db.periods.forEach((p: any) => p.status = "closed");
  }

  const newPeriod = { period_id, name, start_date, end_date, status: status || "active" };
  db.periods.push(newPeriod);
  saveDB(db);
  res.status(201).json(newPeriod);
});

// PUT Update Period
app.put("/api/periods/:id", (req, res) => {
  const id = req.params.id;
  const { name, start_date, end_date, status } = req.body;
  const db = getDB();

  const index = db.periods.findIndex((p: any) => p.period_id === id);
  if (index === -1) return res.status(404).json({ message: "Period not found" });

  if (status === "active") {
    // Close other periods
    db.periods.forEach((p: any) => p.status = "closed");
  }

  db.periods[index] = {
    ...db.periods[index],
    name: name || db.periods[index].name,
    start_date: start_date || db.periods[index].start_date,
    end_date: end_date || db.periods[index].end_date,
    status: status || db.periods[index].status
  };

  saveDB(db);
  res.json(db.periods[index]);
});

// DELETE Period
app.delete("/api/periods/:id", (req, res) => {
  const id = req.params.id;
  const db = getDB();
  db.periods = db.periods.filter((p: any) => p.period_id !== id);
  // Also clean up assessments & IDPs with that period_id to prevent orphan records
  db.assessments = db.assessments.filter((a: any) => a.period_id !== id);
  db.idps = db.idps.filter((i: any) => i.period_id !== id);
  saveDB(db);
  res.json({ success: true });
});

// GET To-Do assessment lists for logged in user
app.get("/api/assessments/to-do", (req, res) => {
  const assessor_id = req.query.assessor_id as string;
  if (!assessor_id) return res.json([]);

  const db = getDB();
  // Find active period
  const activePeriod = db.periods.find((p: any) => p.status === "active");
  if (!activePeriod) return res.json([]);

  // Find relationships where the user is the assessor
  const userRelations = db.relations.filter((r: any) => r.assessor_id === assessor_id);

  // Compile assessment objects, merged with existing drafts
  const toDoList = userRelations.map((r: any) => {
    // Check if assessment already exists
    const existing = db.assessments.find(
      (a: any) => a.assessor_id === assessor_id &&
                  a.assessed_id === r.assessed_id &&
                  a.period_id === activePeriod.period_id
    );

    const targetEmployee = db.employees.find((e: any) => e.employee_id === r.assessed_id);

    return {
      relation_id: r.relation_id,
      assessed_id: r.assessed_id,
      assessedNama: targetEmployee ? targetEmployee.nama : "Unknown",
      assessedJabatan: targetEmployee ? targetEmployee.jabatan : "Unknown",
      assessedDepartemen: targetEmployee ? targetEmployee.departemen : "Unknown",
      relation_type: r.relation_type,
      period_id: activePeriod.period_id,
      periodName: activePeriod.name,
      assessment: existing || {
        assessment_id: `A_NEW_${Math.random().toString(36).substring(2, 9)}`,
        scores: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0 },
        notes: "",
        status: "draft"
      }
    };
  });

  res.json(toDoList);
});

// GET Completed assessments by this user
app.get("/api/assessments/completed", (req, res) => {
  const assessor_id = req.query.assessor_id as string;
  if (!assessor_id) return res.json([]);

  const db = getDB();
  const assessments = db.assessments.filter(
    (a: any) => a.assessor_id === assessor_id && a.status === "submitted"
  );

  const enriched = assessments.map((a: any) => {
    const assessed = db.employees.find((e: any) => e.employee_id === a.assessed_id);
    const period = db.periods.find((p: any) => p.period_id === a.period_id);
    return {
      ...a,
      assessedNama: assessed ? assessed.nama : "Unknown",
      assessedJabatan: assessed ? assessed.jabatan : "",
      periodName: period ? period.name : ""
    };
  });

  res.json(enriched);
});

// POST Submit or Save Draft Assessment
app.post("/api/assessments/submit", (req, res) => {
  const { assassin, assessed_id, period_id, relation_type, scores, notes, status, assessor_id } = req.body;
  const db = getDB();

  const parsedAssessorId = assessor_id || assassin; // backup key
  if (!parsedAssessorId || !assessed_id || !period_id) {
    return res.status(400).json({ message: "Data input assessment tidak lengkap." });
  }

  // Check context
  let existingIndex = db.assessments.findIndex(
    (a: any) => a.assessor_id === parsedAssessorId &&
                a.assessed_id === assessed_id &&
                a.period_id === period_id
  );

  const assessmentRecord = {
    assessment_id: existingIndex !== -1 ? db.assessments[existingIndex].assessment_id : `A${String(db.assessments.length + 1).padStart(3, "0")}`,
    assessor_id: parsedAssessorId,
    assessed_id,
    period_id,
    relation_type,
    scores,
    notes: notes || "",
    status: status || "submitted",
    submitted_at: status === "submitted" ? new Date().toISOString().split("T")[0] : undefined
  };

  if (existingIndex !== -1) {
    db.assessments[existingIndex] = {
      ...db.assessments[existingIndex],
      ...assessmentRecord,
    };
  } else {
    db.assessments.push(assessmentRecord);
  }

  saveDB(db);
  res.json({ success: true, assessment: assessmentRecord });
});

// POST Auto-fill all empty or draft assessments with high-quality mock values
app.post("/api/assessments/fill-all", (req, res) => {
  const db = getDB();
  const activePeriod = db.periods.find((p: any) => p.status === "active");
  if (!activePeriod) {
    return res.status(400).json({ message: "Tidak ada periode penilaian aktif saat ini." });
  }

  let filledCount = 0;

  db.relations.forEach((r: any) => {
    // Look up if any assessment exists either as draft or submitted
    const existing = db.assessments.find(
      (a: any) => a.assessor_id === r.assessor_id &&
                  a.assessed_id === r.assessed_id &&
                  a.period_id === activePeriod.period_id
    );

    if (!existing || existing.status !== "submitted") {
      const weights = [3, 4, 4, 4, 5, 5];
      const randomScore = () => weights[Math.floor(Math.random() * weights.length)];

      const scores = {
        amanah: randomScore(),
        kompeten: randomScore(),
        harmonis: randomScore(),
        loyal: randomScore(),
        adaptif: randomScore(),
        kolaboratif: randomScore()
      };

      const selfFeedbacks = [
        "Berkomitmen terus meningkatkan standar kontribusi kerja dan kualitas output divisi.",
        "Akan berupaya meningkatkan kompetensi fungsional dengan aktif mempelajari inovasi teknologi baru.",
        "Bertekad memegang teguh nilai kepatuhan dan integritas BUMN dalam keseharian koordinasi rincian tugas.",
        "Siap menyambut fleksibilitas tata cara operasional modern yang lincah dan berorientasi akselerasi.",
        "Akan senantiasa memelihara komunikasi bersinergi serta keselarasan kerja sama lintas departemen."
      ];

      const atasanFeedbacks = [
        "Menunjukkan integritas personal mumpuni serta kedisiplinan kerja yang andal. Proaktif berkontribusi inovatif.",
        "Mempunyai inisiatif mumpuni dalam merespons hambatan tim. Kerja keras harian patut mendapat apresiasi tinggi.",
        "Bertanggung jawab penuh atas ketepatan sasaran target kerja. Sangat teliti dalam menyusun laporan unit fungsional.",
        "Sikap kerja luhur yang mengedepankan etika korporasi tinggi. Perlu meningkatkan inisiatif mandiri tanpa harus selalu menunggu instruksi.",
        "Memiliki keahlian fungsional yang andal. Konsistensi dedikasi ini silakan dipertahankan terus di masa mendatang."
      ];

      const peerFeedbacks = [
        "Rekan kerja yang sangat suportif dan andal diajak berkolaborasi memecahkan kendala teknis berat.",
        "Sangat ramah, selalu menjujung keharmonisan tim, serta bersikap inklusif dalam menyikapi dinamika divisi.",
        "Berintegritas tinggi serta konsisten mengawal kejujuran data yang dilaporkan demi keberhasilan bersama.",
        "Tanggap serta fleksibel mempelajari materi pelatihan baru. Keberadaanya memberi nuansa energi positif tim.",
        "Menampilkan dedikasi prima terhadap pencapaian target unit kerja. Kerja sama harian berjalan sangat selaras."
      ];

      const bawahanFeedbacks = [
        "Kepemimpinan yang suportif serta gemar menginspirasi bawahan agar mandiri melahirkan solusi berkualitas.",
        "Pribadi penuh perhatian yang senantiasa menyeimbangkan kesejahteraan emosional tim serta kepatuhan kerja.",
        "Sangat konsisten mempraktikkan amanah keteladanan yang bersih, jujur, serta transparan bagi seluruh bawahan.",
        "Terbuka dengan opsi perbaikan tata kelola modern serta tangkas mengantisipasi pergeseran arah prioritas korporat.",
        "Sangat adil memobilisasi pembagian tugas operasional secara proporsional sesuai dengan kekuatan setiap personel."
      ];

      let notesList = selfFeedbacks;
      if (r.relation_type === "atasan") notesList = atasanFeedbacks;
      if (r.relation_type === "peer") notesList = peerFeedbacks;
      if (r.relation_type === "bawahan") notesList = bawahanFeedbacks;

      const notes = notesList[Math.floor(Math.random() * notesList.length)];

      const record = {
        assessment_id: existing ? existing.assessment_id : `A${String(db.assessments.length + 1).padStart(3, "0")}`,
        assessor_id: r.assessor_id,
        assessed_id: r.assessed_id,
        period_id: activePeriod.period_id,
        relation_type: r.relation_type,
        scores,
        notes,
        status: "submitted",
        submitted_at: new Date().toISOString().split("T")[0]
      };

      if (existing) {
        const idx = db.assessments.findIndex((a: any) => a.assessment_id === existing.assessment_id);
        db.assessments[idx] = record;
      } else {
        db.assessments.push(record);
      }
      filledCount++;
    }
  });

  if (filledCount > 0) {
    saveDB(db);
  }

  res.json({
    success: true,
    filledCount,
    message: `Berhasil memproses secara massal ${filledCount} evaluasi berstatus kosong menjadi terisi.`
  });
});

// GET Assessment Monitoring Status
app.get("/api/assessments/monitoring", (req, res) => {
  const db = getDB();
  const activePeriod = db.periods.find((p: any) => p.status === "active");
  if (!activePeriod) return res.json([]);

  const monitoring = db.relations.map((r: any) => {
    const assessor = db.employees.find((e: any) => e.employee_id === r.assessor_id);
    const assessed = db.employees.find((e: any) => e.employee_id === r.assessed_id);
    
    const assessment = db.assessments.find(
      (a: any) => a.assessor_id === r.assessor_id &&
                  a.assessed_id === r.assessed_id &&
                  a.period_id === activePeriod.period_id
    );

    return {
      relation_id: r.relation_id,
      assessorNama: assessor ? assessor.nama : "Unknown",
      assessorDepartemen: assessor ? assessor.departemen : "",
      assessedNama: assessed ? assessed.nama : "Unknown",
      assessedDepartemen: assessed ? assessed.departemen : "",
      relation_type: r.relation_type,
      status: assessment ? (assessment.status === "submitted" ? "Sudah" : "Draf") : "Belum"
    };
  });

  res.json(monitoring);
});

// POST Send simulation reminder
app.post("/api/notifications/remind", (req, res) => {
  const { relation_id } = req.body;
  const db = getDB();
  const activePeriod = db.periods.find((p: any) => p.status === "active");

  if (!activePeriod) return res.status(400).json({ message: "Tidak ada periode aktif." });

  const relationsToSend = relation_id
    ? db.relations.filter((r: any) => r.relation_id === relation_id)
    : db.relations;

  let count = 0;
  relationsToSend.forEach((r: any) => {
    // Check if submitted
    const submitted = db.assessments.find(
      (a: any) => a.assessor_id === r.assessor_id &&
                  a.assessed_id === r.assessed_id &&
                  a.period_id === activePeriod.period_id &&
                  a.status === "submitted"
    );

    if (!submitted) {
      const targetEmp = db.employees.find((e: any) => e.employee_id === r.assessed_id);
      db.notifications.push({
        notification_id: `N${String(db.notifications.length + 1).padStart(3, "0")}`,
        employee_id: r.assessor_id,
        title: "Segera Isi Evaluasi!",
        message: `Batas waktu pengisian evaluasi 360° untuk rekan Anda (${targetEmp ? targetEmp.nama : "Karyawan"}) hampir selesai.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
      count++;
    }
  });

  saveDB(db);
  res.json({ success: true, count, message: `Mengirim ${count} sistem pengingat evaluasi.` });
});

// GET Reports list structure & 9-Box Matrix positions
app.get("/api/reports/analytics", (req, res) => {
  const db = getDB();
  const activePeriod = db.periods.find((p: any) => p.status === "active");
  const period_id = (req.query.period_id as string) || (activePeriod ? activePeriod.period_id : "");

  if (!period_id) return res.json({ averages: {}, count: 0, matrix: [] });

  const relevantAssessments = db.assessments.filter(
    (a: any) => a.period_id === period_id && a.status === "submitted"
  );

  // Compute stats per employee
  const employeeResultsObj: Record<string, any> = {};

  db.employees.forEach((emp: any) => {
    employeeResultsObj[emp.employee_id] = {
      employee_id: emp.employee_id,
      nama: emp.nama,
      departemen: emp.departemen,
      jabatan: emp.jabatan,
      potential: emp.potential,
      categories: {
        self: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0, count: 0 },
        atasan: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0, count: 0 },
        peer: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0, count: 0 },
        bawahan: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0, count: 0 }
      },
      overall_sum: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0 },
      overall_counts: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0 }
    };
  });

  relevantAssessments.forEach((a: any) => {
    const record = employeeResultsObj[a.assessed_id];
    if (!record) return;

    const relation = a.relation_type; // 'self', 'atasan', 'peer', 'bawahan'
    
    // Add to specific categories
    if (record.categories[relation]) {
      record.categories[relation].amanah += a.scores.amanah;
      record.categories[relation].kompeten += a.scores.kompeten;
      record.categories[relation].harmonis += a.scores.harmonis;
      record.categories[relation].loyal += a.scores.loyal;
      record.categories[relation].adaptif += a.scores.adaptif;
      record.categories[relation].kolaboratif += a.scores.kolaboratif;
      record.categories[relation].count += 1;
    }

    // Add to overall (excluding Self Assessment to have standard 360 target average, or including all as requested)
    // AKHLAKScore usually calculates average across reviews. Including Self/Opposing.
    const keys = ["amanah", "kompeten", "harmonis", "loyal", "adaptif", "kolaboratif"];
    keys.forEach((key) => {
      record.overall_sum[key] += a.scores[key];
      record.overall_counts[key] += 1;
    });
  });

  // Calculate final actual structures
  const ratingDetails = Object.values(employeeResultsObj).map((record: any) => {
    const scores: any = {};
    const keys = ["amanah", "kompeten", "harmonis", "loyal", "adaptif", "kolaboratif"];
    
    let sumTotal = 0;
    keys.forEach((key) => {
      const avg = record.overall_counts[key] > 0 ? Number((record.overall_sum[key] / record.overall_counts[key]).toFixed(2)) : 0;
      scores[key] = avg;
      sumTotal += avg;
    });

    const finalRating = Number((sumTotal / 6).toFixed(2));

    // Resolve matrix index
    // Performance: low < 3.0, medium 3.0 - 4.1, high >= 4.1
    let performanceRating: "low" | "medium" | "high" = "medium";
    if (finalRating < 3.0) performanceRating = "low";
    else if (finalRating >= 4.1) performanceRating = "high";

    return {
      employee_id: record.employee_id,
      nama: record.nama,
      departemen: record.departemen,
      jabatan: record.jabatan,
      potential: record.potential,
      overallScores: scores,
      finalScore: finalRating,
      performance: performanceRating
    };
  });

  // Calculate department averages
  const depMap: Record<string, { total: number; count: number }> = {};
  ratingDetails.forEach((rd) => {
    if (!depMap[rd.departemen]) depMap[rd.departemen] = { total: 0, count: 0 };
    depMap[rd.departemen].total += rd.finalScore;
    depMap[rd.departemen].count += 1;
  });

  const departmentAverages = Object.keys(depMap).map((k) => ({
    departemen: k,
    avg: Number((depMap[k].total / depMap[k].count).toFixed(2))
  }));

  res.json({
    ratingDetails,
    departmentAverages,
    count: ratingDetails.length
  });
});

// GET Specific Employee Detailed Report Card
app.get("/api/reports/employee/:id", (req, res) => {
  const employee_id = req.params.id;
  const db = getDB();
  const activePeriod = db.periods.find((p: any) => p.status === "active");
  const period_id = (req.query.period_id as string) || (activePeriod ? activePeriod.period_id : "");

  const employee = db.employees.find((e: any) => e.employee_id === employee_id);
  if (!employee) return res.status(404).json({ message: "Karyawan tidak ditemukan." });

  const relevantAssessments = db.assessments.filter(
    (a: any) => a.assessed_id === employee_id && a.period_id === period_id && a.status === "submitted"
  );

  const keyCoreValues = ["amanah", "kompeten", "harmonis", "loyal", "adaptif", "kolaboratif"];
  
  // Calculate averages categorized by respondent role
  const relationsGroup: Record<string, { sum: Record<string, number>; count: number }> = {
    self: { sum: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0 }, count: 0 },
    atasan: { sum: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0 }, count: 0 },
    peer: { sum: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0 }, count: 0 },
    bawahan: { sum: { amanah: 0, kompeten: 0, harmonis: 0, loyal: 0, adaptif: 0, kolaboratif: 0 }, count: 0 },
  };

  const generalComments: string[] = [];

  relevantAssessments.forEach((a: any) => {
    const rel = a.relation_type;
    if (relationsGroup[rel]) {
      keyCoreValues.forEach((key) => {
        relationsGroup[rel].sum[key] += a.scores[key];
      });
      relationsGroup[rel].count += 1;
    }
    if (a.notes?.trim()) {
      generalComments.push(`${rel.toUpperCase()}: "${a.notes.trim()}"`);
    }
  });

  const responsesByCategory: any = {};
  keyCoreValues.forEach((key) => {
    responsesByCategory[key] = {
      self: relationsGroup.self.count > 0 ? Number((relationsGroup.self.sum[key] / relationsGroup.self.count).toFixed(2)) : 0,
      atasan: relationsGroup.atasan.count > 0 ? Number((relationsGroup.atasan.sum[key] / relationsGroup.atasan.count).toFixed(2)) : 0,
      peer: relationsGroup.peer.count > 0 ? Number((relationsGroup.peer.sum[key] / relationsGroup.peer.count).toFixed(2)) : 0,
      bawahan: relationsGroup.bawahan.count > 0 ? Number((relationsGroup.bawahan.sum[key] / relationsGroup.bawahan.count).toFixed(2)) : 0,
    };
  });

  // Calculate final overall scores (excluding self if typical 360-degree standard, or including all. Let's include non-self as the typical composite rating standard)
  const finalAverages: any = {};
  let overallScoresCount = 0;
  let runningOverallSum = 0;

  keyCoreValues.forEach((key) => {
    let sum = 0;
    let count = 0;
    ["atasan", "peer", "bawahan"].forEach((rel) => {
      if (relationsGroup[rel].count > 0) {
        sum += relationsGroup[rel].sum[key];
        count += relationsGroup[rel].count;
      }
    });

    // Fallback to include Self if no outer assessments exist yet
    if (count === 0 && relationsGroup.self.count > 0) {
      sum = relationsGroup.self.sum[key];
      count = relationsGroup.self.count;
    }

    const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0;
    finalAverages[key] = avg;
    runningOverallSum += avg;
    if (avg > 0) overallScoresCount++;
  });

  const finalScore = overallScoresCount > 0 ? Number((runningOverallSum / 6).toFixed(2)) : 0;

  // Retrieve or automatically generate high-quality mock IDP recommendation if not exists
  let existingIDP = db.idps.find(
    (i: any) => i.employee_id === employee_id && i.period_id === period_id
  );

  if (!existingIDP) {
    const mockResult = generateMockIDPResponse(employee, finalAverages);
    saveIDPToDB(db, employee_id, period_id, mockResult);
    existingIDP = db.idps.find(
      (i: any) => i.employee_id === employee_id && i.period_id === period_id
    );
  }

  res.json({
    employee,
    responsesByCategory,
    finalAverages,
    finalScore,
    comments: generalComments,
    existingIDP
  });
});

// POST Invoke Gemini API to compile professional recommendations for IDP based on current outcomes
app.post("/api/reports/idp/generate", async (req, res) => {
  const { employee_id, period_id, finalAverages, finalScore, comments } = req.body;
  const db = getDB();

  const employee = db.employees.find((e: any) => e.employee_id === employee_id);
  if (!employee) return res.status(404).json({ message: "Karyawan tidak ditemukan." });

  const scoreBriefString = Object.entries(finalAverages || {})
    .map(([val, num]) => `${val.toUpperCase()}: ${num}`)
    .join(", ");

  const notesConcatenated = (comments || []).join(" | ");

  const prompt = `Anda adalah pakar HR dan Pengembangan Organisasi BUMN. Buatlah rancangan Individual Development Plan (IDP) profesional berbasis nilai AKHLAK BUMN Indonesia untuk karyawan berikut:
Nama: ${employee.nama}
Jabatan: ${employee.jabatan}
Departemen: ${employee.departemen}
Nilai Rata-rata AKHLAK Saat ini: ${finalScore || "3.5"}
Rincian Nilai Core Values (Rentang 1-5): ${scoreBriefString || "Amanah: 4, Kompeten: 3, Harmonis: 4, Loyal: 4, Adaptif: 3, Kolaboratif: 4"}
Umpan Balik Kualitatif Tim: "${notesConcatenated || "Kerja sama tim sudah baik, perlu meningkatkan inisiatif pembelajaran mardiri teknologi baru."}"

Harap keluarkan hasil dalam format JSON murni dengan skema berikut:
{
  "strengths": ["daftar 2 kekuatan utama karyawan berdasarkan nilai tertinggi"],
  "weaknesses": ["daftar 2 area pengembangan utama karyawan berdasarkan nilai terendah"],
  "recommendations": ["minimal 3 langkah aksi pengembangan konkret, realistis, berorientasi BUMN AKHLAK (misalnya mentoring, pelatihan tertentu, atau keterlibatan proyek)"]
}
Pastikan hanya mengembalikan JSON valid tanpa ada teks markdown lain atau tanda pembungkus \`\`\`json.`;

  try {
    const client = getGeminiClient();
    if (!client) {
      // Return beautiful local AI simulation if GEMINI_API_KEY is not defined yet
      console.warn("Gemini client is not initialized. Using simulated local engine.");
      const mockResult = generateMockIDPResponse(employee, finalAverages);
      // Save simulated IDP to DB
      saveIDPToDB(db, employee_id, period_id, mockResult);
      return res.json(mockResult);
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const outputText = response.text || "";
    const parsed = JSON.parse(outputText.trim());
    
    // Save to Database so it persists
    saveIDPToDB(db, employee_id, period_id, parsed);

    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini IDP generation failed:", error);
    // Fallback to beautiful simulation
    const mockResult = generateMockIDPResponse(employee, finalAverages);
    saveIDPToDB(db, employee_id, period_id, mockResult);
    res.json({
      ...mockResult,
      isSimulated: true,
      errorLog: error.message
    });
  }
});

function saveIDPToDB(db: any, empId: string, periodId: string, idpData: any) {
  const index = db.idps.findIndex((i: any) => i.employee_id === empId && i.period_id === periodId);
  const record = {
    idp_id: index !== -1 ? db.idps[index].idp_id : `IDP${String(db.idps.length + 1).padStart(3, "0")}`,
    employee_id: empId,
    period_id: periodId,
    strengths: idpData.strengths,
    weaknesses: idpData.weaknesses,
    recommendations: idpData.recommendations,
    created_at: new Date().toISOString().split("T")[0]
  };

  if (index !== -1) {
    db.idps[index] = record;
  } else {
    db.idps.push(record);
  }
  saveDB(db);
}
function generateMockIDPResponse(emp: any, avgs: any) {
  // If avgs has all zeros or empty, replace with standard default benchmark scores for prototyping the IDP
  const hasScores = avgs && Object.values(avgs).some(v => (v as number) > 0);
  const coreAverages = hasScores ? avgs : {
    amanah: 4.2,
    kompeten: 3.8,
    harmonis: 4.0,
    loyal: 4.1,
    adaptif: 3.5,
    kolaboratif: 4.3
  };

  // Deterministic fallback generator based on names/scores
  const sorted = Object.entries(coreAverages)
    .sort((a: any, b: any) => b[1] - a[1]);

  const strongestKey = sorted[0]?.[0] || "amanah";
  const weakestKey = sorted[sorted.length - 1]?.[0] || "adaptif";

  const strengthsMapping: Record<string, string[]> = {
    amanah: [
      "Integritas tinggi serta konsisten memegang teguh komitmen kerja & kejujuran harian.",
      "Bertanggung jawab penuh atas tugas yang didelegasikan dan transparan dalam penegakan kepatuhan tata tertib kerja."
    ],
    kompeten: [
      "Kecakapan fungsional tinggi serta kualitas teknis hasil kerja profesional yang andal.",
      "Semangat belajar konstan dalam meningkatkan kapabilitas fungsional diri guna menjawab tantangan bisnis."
    ],
    harmonis: [
      "Kemampuan interpersonal yang hangat, menciptakan sinergi nyaman di dalam unit kerja.",
      "Saling peduli, ramah, dan sangat menghargai dinamika perbedaan latar belakang rekan sejawat."
    ],
    loyal: [
      "Sikap dedikasi yang solid, memprioritaskan keberhasilan jangka panjang unit bisnis perusahaan.",
      "Memegang komitmen menjaga rahasia jabatan, citra korporasi, serta reputasi pimpinan di panggung publik."
    ],
    adaptif: [
      "Cepat dan tanggap menyesuaikan diri terhadap perubahan metode teknis atau struktural baru.",
      "Aktif berinovasi secara mandiri serta gemar mengeksplorasi piranti kerja modern yang mutakhir."
    ],
    kolaboratif: [
      "Sangat mahir merangkul seluruh pihak eksternal maupun internal untuk menyelesaikan tugas bersama.",
      "Mampu mengoptimalkan keterbatasan sumber daya tim menjadi inovasi produktif terintegrasi."
    ],
  };

  const weaknessesMapping: Record<string, string[]> = {
    amanah: [
      "Perlu menyusun matriks manajemen risiko personal agar penyelesaian tugas rumit tepat sesuai tenggat waktu.",
      "Butuh didorong lebih peka mengomunikasikan keterlambatan pengerjaan proyek kepada tim sejak fajar proyek."
    ],
    kompeten: [
      "Dibutuhkan peningkatan keahlian spesifik yang selaras berkelanjutan dengan transformasi teknologi digital masa kini.",
      "Perlu memperluas wawasan konseptual makro di luar bidang keahlian praktis operasional harian."
    ],
    harmonis: [
      "Perlu melatih teknik komunikasi asertif untuk menghindari keharmonisan semu atau sungkan memberi ulasan jujur.",
      "Meningkatkan pengelolaan emosi agar tetap tenang di bawah tekanan sasaran kerja dinasis divisi."
    ],
    loyal: [
      "Dibutuhkan pemahaman mendalam tentang kontribusi rincian unit kerjanya terhadap tujuan besar BUMN.",
      "Perlu menyelaraskan dedikasi kerja harian demi menghasilkan output produktif, bukan sekadar kehadiran formal."
    ],
    adaptif: [
      "Cenderung membutuhkan fase pengenalan lebih ekstra ketika beralih dari prosedur kerja manual ke digital.",
      "Tolong lestarikan konsistensi adaptasi meskipun tantangan rotasi tugas berjalan sangat cepat."
    ],
    kolaboratif: [
      "Harus dibiasakan aktif berkontribusi nyata pada forum diskusi atau project team lintas departemen.",
      "Mereduksi kecenderungan menyelesaikan masalah rumit sendirian agar potensi kepemimpinan kolaboratif terpacu."
    ],
  };

  const strengthsList = strengthsMapping[strongestKey] || [
    "Konsisten menunjukkan nilai-nilai luhur dan loyalitas kerja prima.",
    "Mengedepankan hasil kerja berkualitas tinggi secara beretika."
  ];

  const weaknessesList = weaknessesMapping[weakestKey] || [
    "Perlu bimbingan taktis dalam menerapkan transformasi teknologi harian.",
    "Memerlukan latihan manajemen waktu untuk mengimbangi beban kerja multiproyek."
  ];

  // Compose dynamic recommendation actions
  const recommendationsPool = [
    `Meningkatkan pengembangan core value ${strongestKey.toUpperCase()} dengan mengambil peran sebagai mentor tim atau koordinator proyek internal di departemen ${emp?.departemen || "korporat"}.`,
    `Mengikuti program pelatihan tersertifikasi nasional bidang ${weakestKey.toUpperCase()} guna menutup gap kompetensi saat ini.`,
    `Melakukan diskusi satu-lawan-satu (one-on-one) berkala bersama pimpinan unit bisnis untuk menyelaraskan Target Kinerja Individu dengan visi AKHLAK Score.`,
    `Turut mengambil bagian aktif dalam minimal 2 gugus tugas (task force) lintas divisi guna memperluas network kerja fungsional.`,
    `Meningkatkan keterampilan kepemimpinan melalui program pembekalan kepemimpinan muda BUMN.`
  ];

  // Return realistic data structures
  return {
    strengths: strengthsList,
    weaknesses: weaknessesList,
    recommendations: recommendationsPool
  };
}

// -----------------------------------------------------
// VITE AND PLATFORM RUNTIME SETUPS
// -----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AKHLAKScore HR Performance System running on http://localhost:${PORT}`);
  });
}

startServer();
