import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Admin from "./pages/Admin";
import Invitation from "./pages/Invitation";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Login Admin */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />

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