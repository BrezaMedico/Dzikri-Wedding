import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Admin from "./Admin";
import Invitation from "./Invitation";

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Admin / Input Nama */}
        <Route path="/" element={<Admin />} />
        <Route path="/admin" element={<Admin />} />

        {/* Halaman Undangan (Desain Amplop + Animasi) */}
        <Route path="/:slug" element={<Invitation />} />

        {/* Jika URL tidak ditemukan, kembalikan ke Admin */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;