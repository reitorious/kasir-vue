import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Nota from '../components/Nota';

export default function Kasir() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [totalPay, setTotalPay] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchProducts();
  }, []);

  // PERUBAHAN: Kita menghapus useEffect auto-print di sini.

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) return alert('Stok barang tidak mencukupi!');
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.stock < 1) return alert('Stok barang habis!');
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const totalBelanja = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang belanja kosong!');
    if (Number(totalPay) < totalBelanja) return alert('Uang pembayaran kurang!');

    setIsLoading(true);
    try {
      const payload = {
        total_pay: Number(totalPay),
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
      };
      const response = await api.post('/transactions', payload);
      
      // Ini akan memunculkan Popup Preview (bukan langsung print)
      setLastTransaction(response.data.data);
    } catch (error) {
      alert('Gagal memproses transaksi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // FUNGSI BARU: Menutup Popup & Mereset Kasir
  const closeCheckoutModal = () => {
    setCart([]);
    setTotalPay('');
    fetchProducts(); 
    setLastTransaction(null);
  };

  // FUNGSI BARU: Print Manual lalu Tutup Popup
  const handlePrintStruk = () => {
    setTimeout(() => {
      window.print();
      closeCheckoutModal();
    }, 100);
  };

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) {}
    localStorage.clear();
    navigate('/login');
  };

  const uniqueCategories = ['Semua', ...new Set(products.map(item => item.category?.name).filter(Boolean))];

  const filteredProducts = products.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'Semua' || product.category?.name === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <div className={`relative flex h-screen flex-col bg-slate-100 ${lastTransaction ? 'print:hidden' : ''}`}>
        
        {/* --- POPUP PREVIEW KEMBALIAN --- */}
        {lastTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <span className="text-3xl text-green-600">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Transaksi Sukses!</h2>
                <p className="text-sm text-slate-500">No: {lastTransaction.invoice_number}</p>
              </div>

              <div className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-100">
                <div className="mb-2 flex justify-between text-sm text-slate-600">
                  <span>Total Belanja:</span>
                  <span className="font-semibold">{formatRupiah(lastTransaction.total_price)}</span>
                </div>
                <div className="mb-2 flex justify-between text-sm text-slate-600">
                  <span>Tunai:</span>
                  <span className="font-semibold">{formatRupiah(lastTransaction.total_pay)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-dashed border-slate-300 pt-2 text-xl font-bold text-green-600">
                  <span>Kembali:</span>
                  <span>{formatRupiah(lastTransaction.total_return)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handlePrintStruk}
                  className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 shadow-md"
                >
                  🖨️ Cetak Struk & Selesai
                </button>
                <button 
                  onClick={closeCheckoutModal}
                  className="w-full rounded-lg bg-slate-200 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
                >
                  Selesai Tanpa Cetak
                </button>
              </div>

            </div>
          </div>
        )}
        {/* --- AKHIR POPUP PREVIEW --- */}


        {/* Header Tetap Sama */}
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-slate-800">Sistem POS Kasir</h1>
            <nav className="flex gap-4 print:hidden">
              <Link to="/kasir" className="text-blue-600 font-bold border-b-2 border-blue-600 pb-1">Dashboard Kasir</Link>
              <Link to="/riwayat" className="text-slate-500 font-medium hover:text-blue-600 transition">Riwayat Penjualan</Link>
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

        <div className="flex flex-1 overflow-hidden">
          
          <main className="flex flex-1 flex-col overflow-hidden p-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {uniqueCategories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="w-full lg:w-72">
                <input 
                  type="text" placeholder="Cari nama menu atau SKU..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400">
                  Produk tidak ditemukan.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} onClick={() => addToCart(product)}
                      className="cursor-pointer rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md active:scale-95"
                    >
                      <div className="mb-2 text-xs font-semibold text-blue-600">{product.category.name}</div>
                      <h3 className="font-bold text-slate-800">{product.name}</h3>
                      <div className="mt-2 text-xs text-slate-400">SKU: {product.sku}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-900">{formatRupiah(product.price)}</span>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Stok: {product.stock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          <aside className="flex w-96 flex-col border-l bg-white p-6 shadow-xl relative z-10">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Keranjang Belanja</h2>
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-400">Belum ada barang</div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-sm text-slate-500">{formatRupiah(item.price)} x {item.quantity}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-slate-800">{formatRupiah(item.price * item.quantity)}</div>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="mb-4 flex items-center justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-blue-600">{formatRupiah(totalBelanja)}</span>
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">Uang Pelanggan</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">Rp</span>
                  <input 
                    type="number" 
                    value={totalPay}
                    onChange={(e) => setTotalPay(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={isLoading || cart.length === 0}
                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Memproses...' : 'BAYAR SEKARANG'}
              </button>
            </div>
          </aside>

        </div>
      </div>

      {/* Komponen Nota yang akan diprint */}
      {lastTransaction && (
        <div className="hidden print:block">
          <Nota data={lastTransaction} />
        </div>
      )}
    </>
  );
}