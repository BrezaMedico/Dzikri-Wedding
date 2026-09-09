# Dzikri-Wedding — Undangan Pernikahan Digital M. Dzikri Fauzan & Resa Erviana

Proyek undangan pernikahan digital berbasis web dengan fitur:
- Undangan personal per tamu via URL unik (slug)
- RSVP & buku tamu online
- Panel Admin untuk manajemen tamu
- Auth JWT dengan sesi 1 minggu
- Musik otomatis & animasi amplop interaktif

---

## 🗂️ Struktur Proyek

```
wedding-invitation/
├── frontend/               ← React + Vite (UI undangan)
│   └── src/
│       ├── pages/
│       │   ├── Invitation/ ← Halaman undangan publik
│       │   ├── Admin/      ← Dashboard admin
│       │   └── Login/      ← Login admin
│       ├── components/
│       │   └── ProtectedRoute.jsx
│       ├── lib/
│       │   └── formatGuestName.js
│       ├── App.jsx         ← Routing utama
│       └── main.jsx
│
└── backend/                ← Express.js + PostgreSQL (Neon)
    ├── db/
    │   └── pool.js         ← Koneksi database & init tabel
    ├── middleware/
    │   └── auth.js         ← JWT verification middleware
    ├── routes/
    │   ├── admin.js        ← POST /api/admin/login, GET /api/admin/verify
    │   ├── guests.js       ← GET/POST/DELETE /api/guests
    │   └── rsvp.js         ← GET/POST /api/rsvp
    ├── index.js            ← Entry point (setup & listen)
    ├── .env                ← Variabel environment (jangan di-commit!)
    └── .env.example        ← Template variabel environment
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js v18+
- Akun [Neon](https://neon.tech) (Database PostgreSQL gratis)

### 1. Clone & Install

```bash
# Install dependencies frontend
cd frontend
npm install

# Install dependencies backend
cd ../backend
npm install
```

### 2. Setup Environment Backend

```bash
cd backend
cp .env.example .env
# Edit .env dan isi nilai yang sesuai (DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET)
```

### 3. Jalankan Server

**Terminal 1 — Backend:**
```bash
cd backend
node index.js
# Server berjalan di http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# UI berjalan di http://localhost:5173
```

---

## 🔑 Endpoint API

| Method | URL | Auth | Deskripsi |
|--------|-----|------|-----------|
| POST | `/api/admin/login` | ❌ | Login admin, dapat token JWT |
| GET | `/api/admin/verify` | ✅ | Verifikasi token aktif |
| GET | `/api/guests/:slug` | ❌ | Ambil nama tamu dari slug |
| GET | `/api/guests` | ✅ | Ambil semua tamu (admin) |
| POST | `/api/guests` | ✅ | Buat undangan baru |
| DELETE | `/api/guests/:id` | ✅ | Hapus tamu |
| GET | `/api/rsvp` | ❌ | Ambil semua RSVP |
| POST | `/api/rsvp` | ❌ | Submit RSVP & ucapan |

> ✅ = Butuh header `Authorization: Bearer <token>`

---

## 📱 Halaman

| URL | Deskripsi |
|-----|-----------|
| `/` | Halaman undangan publik (tamu umum) |
| `/:slug` | Halaman undangan personal (nama tamu otomatis diisi) |
| `/admin/login` | Halaman login admin |
| `/admin` | Dashboard admin (protected) |
