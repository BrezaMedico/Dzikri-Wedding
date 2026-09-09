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

// Endpoint DELETE: Menghapus data tamu (Khusus Admin)
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM guests WHERE id = $1', [id]);
    res.json({ message: 'Tamu berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
