const express = require('express');
const { pool } = require('../db/pool');
const { verifyAdminToken } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// ENDPOINT GUESTS (ADMIN MEMBUAT UNDANGAN)
// ==========================================

// Endpoint POST: Membuat Undangan Baru (Khusus Admin)
router.post('/', verifyAdminToken, async (req, res) => {
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

// Endpoint GET: Mengambil nama berdasarkan link (Publik)
router.get('/:slug', async (req, res) => {
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

// Endpoint GET: Mengambil SEMUA tamu (Untuk Tabel Admin - Khusus Admin)
router.get('/', verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint DELETE: Menghapus data tamu & rsvp terkait (Khusus Admin)
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const guestRes = await pool.query('SELECT * FROM guests WHERE id = $1', [id]);
    if (guestRes.rows.length > 0) {
      const guestName = guestRes.rows[0].name;
      // Bersihkan RSVP terkait tamu ini
      await pool.query('DELETE FROM rsvp WHERE LOWER(name) = LOWER($1)', [guestName]);
    }
    await pool.query('DELETE FROM guests WHERE id = $1', [id]);
    res.json({ message: 'Tamu dan konfirmasi terkait berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint PUT: Mengubah Status Kehadiran Tamu langsung dari Admin (Khusus Admin)
router.put('/:id/attendance', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance, guestCount } = req.body; // 'Hadir' | 'Tidak Hadir' | 'Belum Mengisi'

    const guestRes = await pool.query('SELECT * FROM guests WHERE id = $1', [id]);
    if (guestRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tamu tidak ditemukan' });
    }
    const guest = guestRes.rows[0];
    const count = Number(guestCount) > 0 ? Number(guestCount) : 1;

    if (attendance === 'Belum Mengisi') {
      // Hapus data dari tabel rsvp untuk me-reset
      await pool.query('DELETE FROM rsvp WHERE LOWER(name) = LOWER($1)', [guest.name]);
    } else {
      // Cek apakah sudah ada data rsvp sebelumnya
      const rsvpCheck = await pool.query('SELECT * FROM rsvp WHERE LOWER(name) = LOWER($1)', [guest.name]);
      if (rsvpCheck.rows.length > 0) {
        await pool.query(
          'UPDATE rsvp SET attendance = $1, guest_count = $2 WHERE LOWER(name) = LOWER($3)',
          [attendance, count, guest.name]
        );
      } else {
        await pool.query(
          'INSERT INTO rsvp (name, attendance, guest_count, message) VALUES ($1, $2, $3, $4)',
          [guest.name, attendance, count, 'Dikonfirmasi oleh Admin']
        );
      }
    }

    res.json({
      success: true,
      message: `Status kehadiran untuk ${guest.name} berhasil diperbarui menjadi ${attendance}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint PATCH: Toggle Check-in Tamu di Lokasi Acara (Khusus Admin)
router.patch('/:id/checkin', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE guests SET checked_in = NOT COALESCE(checked_in, false) WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tamu tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Status check-in berhasil diubah',
      guest: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
