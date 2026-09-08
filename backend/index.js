const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_wedding_jwt_key_2026';

// Middleware proteksi khusus Admin
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesi telah berakhir atau token tidak valid. Silakan login kembali.' });
  }
};

// 1. Setup koneksi langsung ke Neon Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Wajib untuk Neon
  }
});

// Tangani error koneksi idle agar server tidak crash saat Neon sleep / timeout
pool.on('error', (err) => {
  console.error('⚠️ Neon DB idle client error (handled):', err.message);
});

// 2. Bikin tabel otomatis jika belum ada
const initDB = async () => {
  try {
    // Tabel Guests (Undangan)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabel 'guests' siap digunakan!");

    // Tabel RSVP (Komentar & Konfirmasi Kehadiran)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rsvp (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        attendance VARCHAR(50) NOT NULL,
        guest_count INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabel 'rsvp' siap digunakan!");

  } catch (err) {
    console.error("❌ Gagal membuat tabel:", err);
  }
};
initDB();

// ==========================================
// ENDPOINT ADMIN AUTH (LOGIN & TOKEN 1 MINGGU)
// ==========================================

// Endpoint Login Admin
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    // Mendukung login dengan username & password, atau jika hanya password diisi
    const isUsernameMatch = !username || username.trim() === adminUser;
    const isPasswordMatch = password && password.trim() === adminPass;

    if (isUsernameMatch && isPasswordMatch) {
      // Buat token JWT berlaku selama 7 hari (1 minggu)
      const token = jwt.sign(
        { role: 'admin', username: adminUser },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login berhasil!',
        token,
        username: adminUser,
        expiresIn: '7d'
      });
    }

    return res.status(401).json({ error: 'Username atau Password salah!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Verifikasi Token (Cek status aktif)
app.get('/api/admin/verify', verifyAdminToken, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

// ==========================================
// ENDPOINT GUESTS (ADMIN MEMBUAT UNDANGAN)
// ==========================================

// 3. Endpoint POST: Membuat Undangan Baru (Khusus Admin)
app.post('/api/guests', verifyAdminToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama harus diisi' });

    // Membuat slug unik (huruf kecil, spasi diganti strip) + angka random
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await pool.query(
      'INSERT INTO guests (name, slug) VALUES ($1, $2) RETURNING *',
      [name, uniqueSlug]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Endpoint GET: Mengambil nama berdasarkan link
app.get('/api/guests/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM guests WHERE slug = $1',
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tamu tidak ditemukan' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// ENDPOINT RSVP (TAMU MENGISI KEHADIRAN)
// ==========================================

// 5. Endpoint POST: Menyimpan RSVP & Komentar
app.post('/api/rsvp', async (req, res) => {
  try {
    const { name, attendance, guestCount, message } = req.body;
    
    // Validasi data kosong
    if (!name || !message) {
      return res.status(400).json({ error: 'Nama dan pesan wajib diisi' });
    }

    const result = await pool.query(
      'INSERT INTO rsvp (name, attendance, guest_count, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, attendance, guestCount, message]
    );

    // Kirim response kembali, pastikan guestCount diubah formatnya untuk React
    const newRsvp = result.rows[0];
    res.status(201).json({
      id: newRsvp.id,
      name: newRsvp.name,
      attendance: newRsvp.attendance,
      guestCount: newRsvp.guest_count,
      message: newRsvp.message,
      createdAt: newRsvp.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Endpoint GET: Mengambil semua komentar
app.get('/api/rsvp', async (req, res) => {
  try {
    // Ambil data dan urutkan dari yang terbaru (DESC)
    // Alias guest_count menjadi "guestCount" agar otomatis terbaca oleh Frontend React
    const result = await pool.query(
      'SELECT id, name, attendance, guest_count as "guestCount", message, created_at FROM rsvp ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4b. Endpoint GET: Mengambil SEMUA nama (Untuk Tabel Admin - Khusus Admin)
app.get('/api/guests', verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4c. Endpoint DELETE: Menghapus data tamu (Khusus Admin)
app.delete('/api/guests/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM guests WHERE id = $1', [id]);
    res.json({ message: 'Tamu berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// JALANKAN SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend SQL jalan di http://localhost:${PORT}`);
});