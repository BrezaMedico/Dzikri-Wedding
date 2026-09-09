const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./db/pool');
const adminRoutes = require('./routes/admin');
const guestsRoutes = require('./routes/guests');
const rsvpRoutes = require('./routes/rsvp');

// ==========================================
// SETUP APP
// ==========================================
const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// MOUNT ROUTES
// ==========================================
app.use('/api/admin', adminRoutes);
app.use('/api/guests', guestsRoutes);
app.use('/api/rsvp', rsvpRoutes);

// ==========================================
// INIT DATABASE & JALANKAN SERVER
// ==========================================
initDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend SQL jalan di http://localhost:${PORT}`);
});