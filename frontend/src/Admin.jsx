import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Admin.css";

export default function Admin() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State untuk menyimpan data dari database
  const [guests, setGuests] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const adminUsername = localStorage.getItem("admin_username") || "Admin";

  // Helper untuk mengambil header token Authorization
  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Handler jika token habis masa berlakunya (1 minggu)
  const handleSessionExpired = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_token_expiry");
    localStorage.removeItem("admin_username");
    alert("Sesi login Anda telah berakhir (1 minggu). Silakan login kembali.");
    navigate("/admin/login", { replace: true });
  };

  // Fungsi untuk mengambil data tamu dan RSVP
  const fetchData = async () => {
    try {
      const [guestsRes, rsvpsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/guests", { headers: getAuthHeaders() }),
        axios.get("http://localhost:5000/api/rsvp"), // RSVP tetap publik
      ]);
      setGuests(guestsRes.data);
      setRsvps(rsvpsRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        console.error("Gagal mengambil data dari database", error);
      }
    }
  };

  // Panggil data saat halaman pertama kali dimuat
  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi Generate Link (Sesuai kodingan kamu + Header Auth + Refresh Tabel)
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/guests",
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

  // Fungsi Hapus Data (Dengan Header Auth)
  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data tamu ini?")) {
      try {
        await axios.delete(`http://localhost:5000/api/guests/${id}`, {
          headers: getAuthHeaders(),
        });
        fetchData(); // Update tabel setelah dihapus
      } catch (error) {
        if (error.response?.status === 401) {
          handleSessionExpired();
        } else {
          alert("Gagal menghapus data");
        }
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

        {/* TABEL DAFTAR TAMU & KONFIRMASI RSVP */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama Tamu</th>
                <th>Konfirmasi Kehadiran</th>
                <th>Berapa Orang</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {guests.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>Belum ada data tamu.</td>
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

                      {/* Kolom Berapa Orang (Jika tidak hadir jadi "-" atau 0) */}
                      <td>
                        {rsvpData 
                          ? (rsvpData.attendance === "Hadir" ? `${rsvpData.guestCount} Orang` : "-") 
                          : "-"}
                      </td>

                      {/* Kolom Aksi Salin & Hapus */}
                      <td className="action-buttons">
                        <button className="btn-copy" onClick={() => handleCopyLink(guest.slug)}>
                          Salin Link
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(guest.id)}>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}