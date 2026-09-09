const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

// ==========================================
// ENDPOINT RSVP (TAMU MENGISI KEHADIRAN)
// ==========================================

// Endpoint POST: Menyimpan RSVP & Komentar
router.post('/', async (req, res) => {
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

// Endpoint GET: Mengambil semua komentar
router.get('/', async (req, res) => {
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

module.exports = router;
