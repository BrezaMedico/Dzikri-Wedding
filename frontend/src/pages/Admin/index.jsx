import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../../config/api";
import "./Admin.css";

export default function Admin() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State untuk menyimpan data dari database
  const [guests, setGuests] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    uniqueVisitors: 0,
    guestVisits: 0,
  });
  const adminUsername = localStorage.getItem("admin_username") || "Admin";

  // Helper untuk mengambil header token Authorization
  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Handler jika token habis masa berlakunya (1 minggu)
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_token_expiry");
    localStorage.removeItem("admin_username");
    alert("Sesi login Anda telah berakhir (1 minggu). Silakan login kembali.");
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  // Fungsi untuk mengambil data tamu, RSVP, dan Total Pengunjung dari database
  const fetchData = useCallback(async () => {
    try {
      const [guestsRes, rsvpsRes, visitorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/guests`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/rsvp`),
        axios.get(`${API_BASE_URL}/api/visitors/stats`),
      ]);
      setGuests(guestsRes.data);
      setRsvps(rsvpsRes.data);
      if (visitorsRes?.data) setVisitorStats(visitorsRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        console.error("Gagal mengambil data dari database", error);
      }
    }
  }, [handleSessionExpired]);

  // Panggil data saat halaman pertama kali dimuat
  useEffect(() => {
    let ignore = false;
    const loadInitialData = async () => {
      try {
        const [guestsRes, rsvpsRes, visitorsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/guests`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/api/rsvp`),
          axios.get(`${API_BASE_URL}/api/visitors/stats`),
        ]);
        if (!ignore) {
          setGuests(guestsRes.data);
          setRsvps(rsvpsRes.data);
          if (visitorsRes?.data) setVisitorStats(visitorsRes.data);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          handleSessionExpired();
        } else {
          console.error("Gagal mengambil data dari database", error);
        }
      }
    };
    loadInitialData();
    return () => {
      ignore = true;
    };
  }, [handleSessionExpired]);

  // Fungsi Generate Link (Sesuai kodingan kamu + Header Auth + Refresh Tabel)
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/guests`,
        { name },
        { headers: getAuthHeaders() }
      );
      
      const currentDomain = window.location.origin;
      const newLink = `${currentDomain}/${response.data.slug}`;
      
      setGeneratedLink(newLink);
      setName("");
      fetchData(); // Langsung update tabel di bawah
    } catch (error) {
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        alert("Gagal membuat link!");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Hapus Data Tamu & RSVP Terkait di Database (Dengan Header Auth)
  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data tamu ini beserta status konfirmasinya di database?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/guests/${id}`, {
          headers: getAuthHeaders(),
        });
        fetchData(); // Update tabel setelah dihapus
      } catch (error) {
        if (error.response?.status === 401) {
          handleSessionExpired();
        } else {
          alert("Gagal menghapus data di database!");
        }
      }
    }
  };

  // Fungsi Update Status Kehadiran Tamu langsung ke Backend / Database
  const handleUpdateAttendance = async (guest, newAttendance) => {
    let pax = 1;
    if (newAttendance === "Hadir") {
      const inputPax = window.prompt(
        `Konfirmasi kehadiran untuk "${guest.name}". Masukkan jumlah orang yang hadir:`,
        "1"
      );
      if (inputPax === null) return; // Dibatalkan oleh admin
      pax = Number(inputPax) > 0 ? Number(inputPax) : 1;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/api/guests/${guest.id}/attendance`,
        { attendance: newAttendance, guestCount: pax },
        { headers: getAuthHeaders() }
      );
      fetchData(); // Refresh data real-time dari database
    } catch (error) {
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        alert("Gagal memperbarui status kehadiran di database!");
        console.error(error);
      }
    }
  };

  // Fungsi Copy Link dari Tabel
  const handleCopyLink = (slug) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    alert(`Link berhasil disalin!\n${url}`);
  };

  // Fungsi Logout
  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari panel admin?")) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_token_expiry");
      localStorage.removeItem("admin_username");
      navigate("/admin/login", { replace: true });
    }
  };

  // Kalkulasi statistik & total tamu yang hadir
  const totalUndangan = guests.length;

  const totalTamuHadirFromGuests = guests.reduce((total, guest) => {
    const rsvp = rsvps.find(
      (r) => r.name.toLowerCase() === guest.name.toLowerCase()
    );
    if (rsvp && rsvp.attendance === "Hadir") {
      return total + (Number(rsvp.guestCount) || 1);
    }
    return total;
  }, 0);

  const totalUndanganHadir = guests.filter((guest) => {
    const rsvp = rsvps.find(
      (r) => r.name.toLowerCase() === guest.name.toLowerCase()
    );
    return rsvp && rsvp.attendance === "Hadir";
  }).length;

  const totalUndanganTidakHadir = guests.filter((guest) => {
    const rsvp = rsvps.find(
      (r) => r.name.toLowerCase() === guest.name.toLowerCase()
    );
    return (
      rsvp &&
      (rsvp.attendance === "Tidak Hadir" ||
        rsvp.attendance === "Tidak Bisa Hadir" ||
        rsvp.attendance === "Berhalangan")
    );
  }).length;

  const totalBelumKonfirmasi = Math.max(
    0,
    totalUndangan - (totalUndanganHadir + totalUndanganTidakHadir)
  );

  const totalRsvpHadirPax = rsvps
    .filter((r) => r.attendance === "Hadir")
    .reduce((sum, r) => sum + (Number(r.guestCount) || 1), 0);

  const totalSemuaTamuHadir = Math.max(totalTamuHadirFromGuests, totalRsvpHadirPax);

  return (
    <div className="admin-container">
      {/* Top Navbar Admin */}
      <div className="admin-header-bar">
        <div className="admin-user-info">
          <span className="admin-avatar">👤</span>
          <div>
            <div className="admin-user-name">Halo, {adminUsername}</div>
            <div className="admin-session-badge">
              <span className="dot-active"></span> Sesi aktif 1 minggu
            </div>
          </div>
        </div>

        <div className="admin-nav-actions">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-view-invitation"
            title="Buka halaman undangan publik"
          >
            Lihat Undangan Publik ↗
          </a>
          <button
            type="button"
            className="btn-logout"
            onClick={handleLogout}
            title="Keluar dari sesi Admin"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-title">Admin - Generate Undangan</h2>
        
        {/* FORM INPUT LAMA YANG DIPERTAHANKAN */}
        <form className="admin-form" onSubmit={handleGenerate}>
          <input 
            type="text" 
            placeholder="Masukkan Nama Tamu..." 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="admin-input"
            required
          />
          <button type="submit" className="admin-btn-add" disabled={loading}>
            {loading ? "Memproses..." : "+ Buat Link"}
          </button>
        </form>

        {/* KOTAK SUCCESS LINK */}
        {generatedLink && (
          <div className="success-box">
            <p>Link berhasil dibuat untuk tamu tersebut:</p>
            <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="success-link">
              {generatedLink}
            </a>
            <br /><br />
            <button className="btn-copy-main" onClick={() => navigator.clipboard.writeText(generatedLink)}>
              Copy Link
            </button>
          </div>
        )}

        {/* STATISTIK RINGKASAN TOTAL TAMU & PENGUNJUNG */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card highlight-visitor">
            <div className="stat-icon">🌐</div>
            <div className="stat-content">
              <span className="stat-label">Total Pengunjung</span>
              <span className="stat-value text-info">{visitorStats.totalVisitors} Kunjungan</span>
              <span className="stat-subtext">
                {visitorStats.uniqueVisitors} perangkat unik • Terhitung otomatis
              </span>
            </div>
          </div>

          <div className="admin-stat-card highlight">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-label">Total Tamu yang Hadir</span>
              <span className="stat-value text-success">{totalSemuaTamuHadir} Orang</span>
              <span className="stat-subtext">Akumulasi jumlah tamu konfirmasi hadir</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">✉️</div>
            <div className="stat-content">
              <span className="stat-label">Total Undangan</span>
              <span className="stat-value">{totalUndangan} Tamu</span>
              <span className="stat-subtext">Link undangan dibuat</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-label">Konfirmasi Hadir</span>
              <span className="stat-value text-primary">{totalUndanganHadir} Undangan</span>
              <span className="stat-subtext">Tamu yang menyatakan hadir</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <span className="stat-label">Belum Konfirmasi</span>
              <span className="stat-value text-warning">{totalBelumKonfirmasi} Undangan</span>
              <span className="stat-subtext">Menunggu respon RSVP</span>
            </div>
          </div>
        </div>

        {/* TABEL DAFTAR TAMU & KONFIRMASI RSVP */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama Tamu</th>
                <th>Kunjungan</th>
                <th>Konfirmasi Kehadiran</th>
                <th>Berapa Orang</th>
                <th>Aksi (Database Backend)</th>
              </tr>
            </thead>
            <tbody>
              {guests.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Belum ada data tamu.</td>
                </tr>
              ) : (
                guests.map((guest) => {
                  // Mencocokkan data tamu dengan data RSVP berdasarkan nama
                  const rsvpData = rsvps.find(
                    (r) => r.name.toLowerCase() === guest.name.toLowerCase()
                  );

                  return (
                    <tr key={guest.id}>
                      <td className="fw-bold">{guest.name}</td>

                      {/* Kolom Status Kunjungan Undangan */}
                      <td>
                        {guest.visit_count > 0 ? (
                          <span
                            className="visit-badge opened"
                            title={guest.last_visited_at ? `Terakhir dibuka: ${new Date(guest.last_visited_at).toLocaleString("id-ID")}` : ""}
                          >
                            Dibuka {guest.visit_count}x
                          </span>
                        ) : (
                          <span className="visit-badge unopened">
                            Belum Dibuka
                          </span>
                        )}
                      </td>
                      
                      {/* Kolom Konfirmasi Kehadiran */}
                      <td>
                        {rsvpData ? (
                          <span className={`status-badge ${rsvpData.attendance === "Hadir" ? "hadir" : "tidak-hadir"}`}>
                            {rsvpData.attendance}
                          </span>
                        ) : (
                          <span className="status-badge pending">Belum Mengisi</span>
                        )}
                      </td>

                      {/* Kolom Berapa Orang */}
                      <td>
                        {rsvpData 
                          ? (rsvpData.attendance === "Hadir" ? `${rsvpData.guestCount} Orang` : "-") 
                          : "-"}
                      </td>

                      {/* Kolom Aksi yang Berpengaruh ke Database Backend */}
                      <td className="action-buttons">
                        {rsvpData?.attendance === "Hadir" ? (
                          <button
                            type="button"
                            className="btn-act-absent"
                            title="Ubah status menjadi Tidak Hadir di backend"
                            onClick={() => handleUpdateAttendance(guest, "Tidak Hadir")}
                          >
                            Batal Hadir
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-act-attend"
                            title="Set hadir & masukkan pax di database backend"
                            onClick={() => handleUpdateAttendance(guest, "Hadir")}
                          >
                            + Set Hadir
                          </button>
                        )}

                        {rsvpData && (
                          <button
                            type="button"
                            className="btn-act-reset"
                            title="Reset status kehadiran tamu ini di database"
                            onClick={() => handleUpdateAttendance(guest, "Belum Mengisi")}
                          >
                            Reset
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-copy"
                          title="Salin link undangan tamu"
                          onClick={() => handleCopyLink(guest.slug)}
                        >
                          Salin Link
                        </button>

                        <button
                          type="button"
                          className="btn-delete"
                          title="Hapus data tamu dan status RSVP di database"
                          onClick={() => handleDelete(guest.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {guests.length > 0 && (
              <tfoot>
                <tr className="admin-table-total-row">
                  <td colSpan="3" className="total-label-cell">
                    TOTAL KESELURUHAN TAMU HADIR:
                  </td>
                  <td className="total-value-cell">
                    <span className="total-highlight-badge">
                      {totalSemuaTamuHadir} Orang
                    </span>
                  </td>
                  <td className="total-info-cell">
                    {totalUndanganHadir} dari {totalUndangan} undangan hadir
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
