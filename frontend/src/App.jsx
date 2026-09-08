import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Admin from "./Admin";
import Invitation from "./Invitation";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Login Admin */}
        <Route path="/admin/login" element={<Login />} />

        {/* Halaman Admin (Dilindungi Autentikasi & Token 1 Minggu) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Halaman Publik: Undangan Pernikahan (Tamu Umum & Tamu Khusus ber-Slug) */}
        <Route path="/" element={<Invitation />} />
        <Route path="/:slug" element={<Invitation />} />

        {/* Jika URL lain tidak ditemukan, arahkan ke Halaman Undangan */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;