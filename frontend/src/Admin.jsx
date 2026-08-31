import { useState, useEffect } from "react";
import axios from "axios";
import "./Admin.css";

export default function Admin() {
  const [name, setName] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State untuk menyimpan data dari database
  const [guests, setGuests] = useState([]);
  const [rsvps, setRsvps] = useState([]);

  // Fungsi untuk mengambil data tamu dan RSVP
  const fetchData = async () => {
    try {
      const [guestsRes, rsvpsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/guests"),
        axios.get("http://localhost:5000/api/rsvp"),
      ]);
      setGuests(guestsRes.data);
      setRsvps(rsvpsRes.data);
    } catch (error) {
      console.error("Gagal mengambil data dari database", error);
    }
  };

  // Panggil data saat halaman pertama kali dimuat
  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi Generate Link (Sesuai kodingan kamu + Refresh Tabel)
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/guests", { name });
      
      const currentDomain = window.location.origin;
      const newLink = `${currentDomain}/${response.data.slug}`;
      
      setGeneratedLink(newLink);
      setName("");
      fetchData(); // Langsung update tabel di bawah
    } catch (error) {
      alert("Gagal membuat link!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Hapus Data
  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data tamu ini?")) {
      try {
        await axios.delete(`http://localhost:5000/api/guests/${id}`);
        fetchData(); // Update tabel setelah dihapus
      } catch (error) {
        alert("Gagal menghapus data");
      }
    }
  };

  // Fungsi Copy Link dari Tabel
  const handleCopyLink = (slug) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    alert(`Link berhasil disalin!\n${url}`);
  };

  return (
    <div className="admin-container">
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

        {/* KOTAK SUCCESS LINK (Dari Kodingan Kamu) */}
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