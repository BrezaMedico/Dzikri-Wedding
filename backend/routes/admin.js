const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, verifyAdminToken } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// ENDPOINT ADMIN AUTH (LOGIN & TOKEN 1 MINGGU)
// ==========================================

// Endpoint Login Admin
router.post('/login', (req, res) => {
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
router.get('/verify', verifyAdminToken, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

module.exports = router;
