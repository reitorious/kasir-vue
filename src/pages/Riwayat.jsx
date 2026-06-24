import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Nota from '../components/Nota';

export default function Riwayat() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [printData, setPrintData] = useState(null); 
  
  // State untuk Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState('invoice_number'); // Default cari berdasarkan No. Invoice

  // State untuk Sorting (Default: Waktu Transaksi Terbaru)
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Gagal mengambil data riwayat:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) { console.log(e); }
    localStorage.clear();
    navigate('/login');
  };

  const handleReprint = (trx) => {
    setPrintData(trx);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
  };

  // --- Logika Sorting ---
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // --- Logika Filter Pencarian ---
  const filteredTransactions = transactions.filter((trx) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();

    switch (searchBy) {
      case 'invoice_number':
        return trx.invoice_number.toLowerCase().includes(query);
      case 'created_at':
        // Mencari dari tanggal yang sudah diformat (cth: "24 jun")
        return formatDate(trx.created_at).toLowerCase().includes(query);
      case 'user_name':
        return (trx.user?.name || '').toLowerCase().includes(query);
      case 'total_price':
        // Bisa mencari angka asli atau format rupiah
        return trx.total_price.toString().includes(query) || formatRupiah(trx.total_price).toLowerCase().includes(query);
      default:
        return true;
    }
  });

  // --- Terapkan Sorting pada Data yang Terfilter ---
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Khusus untuk nama kasir (karena datanya ada di relasi user.name)
    if (sortConfig.key === 'user_name') {
      aValue = a.user?.name || '';
      bValue = b.user?.name || '';
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <>
      <div className={`flex min-h-screen flex-col bg-slate-100 ${printData ? 'print:hidden' : ''}`}>
        
        {/* Header */}
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-slate-800">Sistem POS Kasir</h1>
            <nav className="flex gap-4">
              <Link to="/kasir" className="text-slate-500 font-medium hover:text-blue-600 transition">Dashboard Kasir</Link>
              <Link to="/riwayat" className="text-blue-600 font-bold border-b-2 border-blue-600 pb-1">Riwayat Penjualan</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="ml-4 rounded bg-slate-800 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-700 transition">
                  ⚙️ Panel Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Halo, <strong className="text-slate-800">{user?.name}</strong></span>
            <button onClick={handleLogout} className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-200">
              Keluar
            </button>
          </div>
        </header>

        {/* Konten Riwayat */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow-sm border flex flex-col">
            
            {/* Header Riwayat & Filter Pencarian */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-4">
              <h2 className="text-xl font-bold text-slate-800">Riwayat Penjualan</h2>
              
              {/* Form Filter Dinamis */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <select 
                  value={searchBy}
                  onChange={(e) => {
                    setSearchBy(e.target.value);
                    setSearchQuery(''); // Reset pencarian saat kategori diubah
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="invoice_number">No. Invoice</option>
                  <option value="created_at">Waktu Transaksi</option>
                  <option value="user_name">Kasir</option>
                  <option value="total_price">Total Belanja</option>
                </select>
                
                <input 
                  type="text" 
                  placeholder={`Cari berdasarkan ${document.querySelector('option[value="' + searchBy + '"]')?.innerText || '...'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center text-slate-500 py-10">Memuat data transaksi...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-slate-500 py-10">Belum ada transaksi penjualan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 select-none">
                    <tr>
                      <th onClick={() => requestSort('invoice_number')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-200 transition">
                        No. Invoice <span className="text-xs text-slate-400">{getSortIcon('invoice_number')}</span>
                      </th>
                      <th onClick={() => requestSort('created_at')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-200 transition">
                        Waktu Transaksi <span className="text-xs text-slate-400">{getSortIcon('created_at')}</span>
                      </th>
                      <th onClick={() => requestSort('user_name')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-200 transition">
                        Kasir <span className="text-xs text-slate-400">{getSortIcon('user_name')}</span>
                      </th>
                      <th onClick={() => requestSort('total_price')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-200 transition">
                        Total Belanja <span className="text-xs text-slate-400">{getSortIcon('total_price')}</span>
                      </th>
                      <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-400">Pencarian tidak ditemukan.</td>
                      </tr>
                    ) : (
                      sortedTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-4 font-medium text-blue-600">{trx.invoice_number}</td>
                          <td className="px-4 py-4">{formatDate(trx.created_at)}</td>
                          <td className="px-4 py-4">{trx.user?.name}</td>
                          <td className="px-4 py-4 font-bold text-slate-800">{formatRupiah(trx.total_price)}</td>
                          <td className="px-4 py-4 text-center">
                            <button 
                              onClick={() => handleReprint(trx)}
                              className="rounded bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
                            >
                              Print Ulang
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Komponen Nota yang dipanggil hanya saat fitur print aktif */}
      {printData && (
        <div className="hidden print:block">
          <Nota data={printData} />
        </div>
      )}
    </>
  );
}