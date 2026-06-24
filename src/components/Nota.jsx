export default function Nota({ data }) {
  if (!data) return null;

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { maximumSignificantDigits: 3 }).format(angka);

  return (
    <div className="w-[80mm] bg-white p-4 font-mono text-sm text-black">
      {/* Header Toko */}
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold">TOKO KITA BERSAMA</h2>
        <p className="text-xs">Jl. Teknologi No. 123, Kota Anda</p>
      </div>

      {/* Info Transaksi */}
      <div className="mb-3 border-b border-dashed border-black pb-3 text-xs">
        <div className="flex justify-between">
          <span>No:</span>
          <span>{data.invoice_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{data.user?.name || 'Kasir'}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu:</span>
          <span>{new Date(data.created_at).toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Rincian Barang */}
      <div className="mb-3 border-b border-dashed border-black pb-3">
        {data.details?.map((item) => (
          <div key={item.id} className="mb-2">
            <div className="font-semibold">{item.product?.name}</div>
            <div className="flex justify-between text-xs">
              <span>{item.quantity} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ringkasan Biaya */}
      <div className="mb-6 space-y-1">
        <div className="flex justify-between text-lg font-bold">
          <span>TOTAL</span>
          <span>Rp {formatRupiah(data.total_price)}</span>
        </div>
        <div className="flex justify-between">
          <span>TUNAI</span>
          <span>Rp {formatRupiah(data.total_pay)}</span>
        </div>
        <div className="flex justify-between">
          <span>KEMBALI</span>
          <span>Rp {formatRupiah(data.total_return)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs">
        <p>Terima Kasih atas kunjungan Anda!</p>
        <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
      </div>
    </div>
  );
}