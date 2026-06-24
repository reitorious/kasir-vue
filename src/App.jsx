import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Kasir from './pages/Kasir';
import Riwayat from './pages/Riwayat';
import Admin from './pages/Admin';

// Komponen Penjaga Rute
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Jika tidak ada token, tendang ke halaman login
  if (!token || !user) return <Navigate to="/login" replace />;

  // Jika halaman butuh hak akses khusus dan role user tidak sesuai, tendang ke kasir
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/kasir" replace />;
  }

  // Jika lolos semua syarat, izinkan akses halamannya
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rute untuk Karyawan & Admin */}
        <Route path="/kasir" element={
          <ProtectedRoute allowedRoles={['karyawan', 'admin']}>
            <Kasir />
          </ProtectedRoute>
        } />
        
        <Route path="/riwayat" element={
          <ProtectedRoute allowedRoles={['karyawan', 'admin']}>
            <Riwayat />
          </ProtectedRoute>
        } />

        {/* Rute HANYA untuk Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;