import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // State Form
  const [newCatName, setNewCatName] = useState('');
  const [formData, setFormData] = useState({
    category_id: '', name: '', sku: '', price: '', stock: ''
  });

  // State Datatable (Search & Sort)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resProd, resCat] = await Promise.all([
        api.get('/products'),
        api.get('/admin/categories')
      ]);
      setProducts(resProd.data.data);
      setCategories(resCat.data);
      if (resCat.data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: resCat.data[0].id }));
      }
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    }
  };

  // --- Handler CRUD ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/categories', { name: newCatName });
      setNewCatName(''); fetchData();
    } catch (error) { alert(error.response?.data?.message || 'Gagal'); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/products', formData);
      setFormData({ ...formData, name: '', sku: '', price: '', stock: '' });
      fetchData();
    } catch (error) { alert(error.response?.data?.message || 'Gagal'); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Hapus produk ini?')) return;
    try { await api.delete(`/admin/products/${id}`); fetchData(); } 
    catch (error) { alert('Gagal'); }
  };

  const handleAddStock = async (product) => {
    const qty = window.prompt(`Tambah stok untuk ${product.name}?`, "10");
    if (!qty || isNaN(qty)) return;
    try {
      await api.put(`/admin/products/${product.id}`, {
        ...product, stock: parseInt(product.stock) + parseInt(qty)
      });
      fetchData();
    } catch (error) { alert('Gagal'); }
  };

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) {}
    localStorage.clear(); navigate('/login');
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  // --- Logika Datatable (Search & Sort) ---
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // 1. Filter data berdasarkan pencarian
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchKeyword.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (p.category?.name || '').toLowerCase().includes(searchKeyword.toLowerCase())
  );

  // 2. Urutkan data yang sudah difilter
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Khusus untuk mengurutkan berdasarkan nama kategori
    if (sortConfig.key === 'category') {
      aValue = a.category?.name || '';
      bValue = b.category?.name || '';
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="flex items-center justify-between bg-slate-800 px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">Panel Admin</h1>
          <nav className="flex gap-4">
            <Link to="/kasir" className="text-slate-300 hover:text-white transition">Kembali ke Kasir</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">Admin: <strong>{user?.name}</strong></span>
          <button onClick={handleLogout} className="rounded bg-red-600 px-3 py-1.5 text-sm font-semibold hover:bg-red-700">Keluar</button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kolom Kiri: Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="font-bold text-slate-800 mb-4">Buat Kategori Baru</h2>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input 
                  type="text" required placeholder="Cth: Snack" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button type="submit" className="bg-slate-800 text-white px-4 rounded font-bold hover:bg-slate-700">+</button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="font-bold text-slate-800 mb-4">Tambah Item Baru</h2>
              <form onSubmit={handleAddProduct} className="space-y-4 text-sm">
                <div>
                  <label className="block text-slate-600 mb-1">Kategori</label>
                  <select 
                    value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full rounded border px-3 py-2 focus:border-blue-500 outline-none" required
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Nama Item</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Kode / SKU</label>
                  <input type="text" required value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 mb-1">Harga (Rp)</label>
                    <input type="number" required min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full rounded border px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Stok</label>
                    <input type="number" required min="0" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full rounded border px-3 py-2" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Simpan Item</button>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Datatable */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border flex flex-col">
            
            {/* Header Tabel & Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <h2 className="font-bold text-slate-800 text-lg">Manajemen Stok & Item</h2>
              <input 
                type="text" 
                placeholder="Cari nama, SKU, atau kategori..." 
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 select-none">
                  <tr>
                    <th onClick={() => requestSort('name')} className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition">
                      Nama Item <span className="text-xs text-slate-400">{getSortIcon('name')}</span>
                    </th>
                    <th onClick={() => requestSort('category')} className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition">
                      Kategori <span className="text-xs text-slate-400">{getSortIcon('category')}</span>
                    </th>
                    <th onClick={() => requestSort('price')} className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition">
                      Harga <span className="text-xs text-slate-400">{getSortIcon('price')}</span>
                    </th>
                    <th onClick={() => requestSort('stock')} className="px-4 py-3 text-center cursor-pointer hover:bg-slate-200 transition">
                      Stok <span className="text-xs text-slate-400">{getSortIcon('stock')}</span>
                    </th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-400">Data tidak ditemukan.</td>
                    </tr>
                  ) : (
                    sortedProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {p.name} <br/><span className="text-xs text-slate-400">{p.sku}</span>
                        </td>
                        <td className="px-4 py-3">{p.category?.name}</td>
                        <td className="px-4 py-3 font-semibold">{formatRupiah(p.price)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                          <button onClick={() => handleAddStock(p)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold hover:bg-blue-200">
                            + Stok
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold hover:bg-red-200">
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}