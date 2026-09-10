const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // Setup koneksi ke Neon / PostgreSQL Server
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Wajib untuk Neon
    }
  });

  // Tangani error koneksi idle agar server tidak crash saat Neon sleep / timeout
  pool.on('error', (err) => {
    console.error('⚠️ Neon DB idle client error (handled):', err.message);
  });
} else {
  // Fallback ke Embedded PostgreSQL (PGlite) jika DATABASE_URL belum diisi
  const path = require('path');
  const { PGlite } = require('@electric-sql/pglite');
  const dbPath = path.join(__dirname, 'data');
  const pgliteInstance = new PGlite(dbPath);

  pool = {
    query: (text, params) => pgliteInstance.query(text, params),
    on: () => {}
  };
  console.log('⚡ DATABASE_URL tidak ditemukan. Menggunakan Embedded PostgreSQL (PGlite) di:', dbPath);
}

// Bikin tabel otomatis jika belum ada
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

module.exports = { pool, initDB };
