const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Setup koneksi langsung ke Neon Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Wajib untuk Neon
  }
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
// ENDPOINT GUESTS (ADMIN MEMBUAT UNDANGAN)
// ==========================================

// 3. Endpoint POST: Membuat Undangan Baru
app.post('/api/guests', async (req, res) => {
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

// 4b. Endpoint GET: Mengambil SEMUA nama (Untuk Tabel Admin)
app.get('/api/guests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4c. Endpoint DELETE: Menghapus data tamu
app.delete('/api/guests/:id', async (req, res) => {
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