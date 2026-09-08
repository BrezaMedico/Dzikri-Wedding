import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("admin_token");
  const expiry = localStorage.getItem("admin_token_expiry");

  // Jika tidak ada token
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Jika token telah melewati masa berlaku 7 hari (1 minggu)
  if (expiry && Date.now() > Number(expiry)) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_token_expiry");
    localStorage.removeItem("admin_username");
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
