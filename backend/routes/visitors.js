const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

// ==========================================
// ENDPOINT TRACKING PENGUNJUNG OTOMATIS
// ==========================================

// Endpoint POST: Rekam kunjungan tamu/publik secara otomatis
router.post('/', async (req, res) => {
  try {
    const { slug } = req.body || {};
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ip = String(rawIp).split(',')[0].trim().slice(0, 100);
    const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 500);
    const visitSlug = slug && typeof slug === 'string' && slug.trim() ? slug.trim() : 'public';

    // 1. Simpan baris rekam jejak ke tabel visitors
    await pool.query(
      'INSERT INTO visitors (slug, ip, user_agent) VALUES ($1, $2, $3)',
      [visitSlug, ip, userAgent]
    );

    // 2. Jika kunjungan ini memiliki slug undangan tamu tertentu, update counter di tabel guests
    if (visitSlug !== 'public') {
      await pool.query(
        `UPDATE guests 
         SET visit_count = COALESCE(visit_count, 0) + 1, 
             last_visited_at = CURRENT_TIMESTAMP 
         WHERE slug = $1`,
        [visitSlug]
      );
    }

    res.status(201).json({ success: true, message: 'Kunjungan berhasil dicatat' });
  } catch (error) {
    console.error('⚠️ Gagal mencatat visitor:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint GET: Statistik Total Pengunjung untuk Panel Admin
router.get('/stats', async (req, res) => {
  try {
    const [totalRes, uniqueRes, guestVisitsRes] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM visitors'),
      pool.query('SELECT COUNT(DISTINCT ip) AS count FROM visitors'),
      pool.query("SELECT COUNT(*) AS count FROM visitors WHERE slug != 'public'"),
    ]);

    const totalVisitors = parseInt(totalRes.rows[0]?.count, 10) || 0;
    const uniqueVisitors = parseInt(uniqueRes.rows[0]?.count, 10) || 0;
    const guestVisits = parseInt(guestVisitsRes.rows[0]?.count, 10) || 0;

    res.json({
      totalVisitors,
      uniqueVisitors,
      guestVisits,
      publicVisits: Math.max(0, totalVisitors - guestVisits),
    });
  } catch (error) {
    console.error('⚠️ Gagal mengambil statistik pengunjung:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
