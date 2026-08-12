import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Award, 
  Printer, 
  Download, 
  Search,
  Trash2,
  WalletCards,
  Clock3,
  Banknote
  ,CalendarDays
} from 'lucide-react';
import { formatRupiah, formatDateIndonesian } from '../../utils/formatters';
import { ReceiptModal } from '../POS/ReceiptModal';
import { sounds } from '../../utils/audio';

export const ReportsScreen = ({ transactions, appSettings, activeShift, shiftHistory = [], onVoidTransaction, currentUserRole }) => {
  const [period, setPeriod] = useState('daily');
  const todayInput = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(todayInput);
  const [searchQuery, setSearchQuery] = useState('');
  const [reprintTx, setReprintTx] = useState(null);

  const isOwner = currentUserRole === 'owner';

  const now = new Date();
  const reportDate = selectedDate ? new Date(`${selectedDate}T12:00:00`) : now;
  const filteredTx = transactions.filter(t => {
    const txDate = new Date(t.date);
    if (period === 'daily') {
      return txDate.toDateString() === reportDate.toDateString();
    }
    if (period === 'weekly') {
      const weekStart = new Date(reportDate);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - day);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return txDate >= weekStart && txDate < weekEnd;
    }
    if (period === 'monthly') {
      return txDate.getMonth() === reportDate.getMonth() && txDate.getFullYear() === reportDate.getFullYear();
    }
    if (period === 'yearly') {
      return txDate.getFullYear() === reportDate.getFullYear();
    }
    return false;
  });

  const totalOmset = filteredTx.reduce((sum, t) => sum + t.total, 0);
  const totalTxCount = filteredTx.length;
  const avgBasketSize = totalTxCount > 0 ? Math.round(totalOmset / totalTxCount) : 0;
  const estimatedProfit = Math.round(totalOmset * 0.58);

  const productSalesMap = {};
  filteredTx.forEach(t => {
    t.items.forEach(item => {
      productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.qty;
    });
  });

  const topProductsSorted = Object.entries(productSalesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topProductWinner = topProductsSorted[0] ? topProductsSorted[0][0] : 'Belum Ada';
  const paymentBreakdown = filteredTx.reduce((result, transaction) => {
    const method = transaction.paymentMethod || 'other';
    result[method] = (result[method] || 0) + Number(transaction.total || 0);
    return result;
  }, {});
  const cashSales = paymentBreakdown.cash || 0;
  const totalTax = filteredTx.reduce((sum, transaction) => sum + Number(transaction.tax || 0), 0);
  const totalService = filteredTx.reduce((sum, transaction) => sum + Number(transaction.serviceCharge || 0), 0);
  const reportShifts = activeShift ? [{ ...activeShift, active: true }, ...shiftHistory] : shiftHistory;

  const handleExportCSV = () => {
    sounds.playBeep();
    let csv = "No Struk,Tanggal,Pelanggan,Metode Pembayaran,Total\n";
    filteredTx.forEach(t => {
      csv += `"${t.receiptNumber}","${formatDateIndonesian(t.date)}","${t.customerName}","${t.paymentMethod}","${t.total}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_KedaiKopiSelasar_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVoidClick = (txId, receiptNo) => {
    if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus permanen transaksi ${receiptNo}? Data omset akan berkurang otomatis.`)) {
      sounds.playError();
      onVoidTransaction(txId);
    }
  };

  return (
    <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={26} color="var(--apple-blue)" />
            <span>Laporan Keuangan & Rekap Penjualan</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Data analisis omset, transaksi, & log nota belanja (Akses Owner)
          </p>
        </div>

          <div className="nav-tabs" style={{ position: 'relative', transform: 'none', left: 'auto' }}>
            {[
            { id: 'daily', label: 'Hari' },
            { id: 'weekly', label: 'Minggu' },
            { id: 'monthly', label: 'Bulan' },
            { id: 'yearly', label: 'Tahun' }
            ].map(tab => (
            <button
              key={tab.id}
              className={`nav-btn ${period === tab.id ? 'active' : ''}`}
              onClick={() => { sounds.playBeep(); setPeriod(tab.id); }}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="report-date-filter">
          <CalendarDays size={17} color="var(--apple-blue)" />
          <label>Tanggal laporan
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <span className="report-date-hint">Pilih tanggal acuan untuk Hari, Minggu, Bulan, atau Tahun</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCSV} className="nav-btn" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <Download size={16} color="var(--apple-green)" />
            <span>Export CSV</span>
          </button>
          <button onClick={() => window.print()} className="nav-btn" style={{ background: 'var(--apple-blue)', color: '#FFF' }}>
            <Printer size={16} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Apple Style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>TOTAL OMSET PENJUALAN</span>
            <DollarSign size={20} color="var(--apple-blue)" />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{formatRupiah(totalOmset)}</h3>
          <span style={{ fontSize: '12px', color: 'var(--apple-green)', fontWeight: '600' }}>{filteredTx.length} Transaksi Selesai</span>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>RATA-RATA BASKET SIZE</span>
            <ShoppingBag size={20} color="var(--apple-blue)" />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{formatRupiah(avgBasketSize)}</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per Transaksi Customer</span>
        </div>

        {isOwner && (
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>ESTIMASI PROFIT BERSIH</span>
              <TrendingUp size={20} color="var(--apple-green)" />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--apple-green)' }}>{formatRupiah(estimatedProfit)}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Margin Bersih ~58% Kopi Selasar</span>
          </div>
        )}

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>PRODUK TERLARIS</span>
            <Award size={20} color="var(--apple-yellow)" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {topProductWinner}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Favorite Pelanggan</span>
        </div>
      </div>

      <div className="report-operation-grid">
        <section className="report-operation-card">
          <div className="report-operation-title"><WalletCards size={19} /> Arus Kas &amp; Pembayaran</div>
          <div className="cash-flow-main"><div><span>Kas masuk</span><strong>{formatRupiah(totalOmset)}</strong></div><Banknote size={30} /></div>
          <div className="cash-flow-list">{Object.entries(paymentBreakdown).length ? Object.entries(paymentBreakdown).map(([method, amount]) => <div key={method}><span>{method.toUpperCase()}</span><b>{formatRupiah(amount)}</b></div>) : <span>Belum ada transaksi pada periode ini.</span>}</div>
          <div className="cash-flow-footer"><span>Kas fisik dari penjualan</span><b>{formatRupiah(cashSales)}</b></div>
          <div className="cash-flow-footer"><span>Pajak dan service tercatat</span><b>{formatRupiah(totalTax + totalService)}</b></div>
        </section>
        <section className="report-operation-card">
          <div className="report-operation-title"><Clock3 size={19} /> Rekap Shift</div>
          <div className="shift-report-list">{reportShifts.length ? reportShifts.slice(0, 5).map(shift => <div className="shift-report-row" key={shift.id}><div><b>{shift.shiftType || shift.name}</b><span>{shift.baristaName || 'Petugas belum diisi'}</span></div><div><strong className={shift.active ? 'shift-active' : ''}>{shift.active ? 'Aktif' : 'Ditutup'}</strong><span>{formatRupiah(shift.openingCash || 0)} modal awal</span></div></div>) : <span>Belum ada riwayat shift.</span>}</div>
        </section>
      </div>

      {/* Transaction History Log Table (Apple Table) */}
      <div className="apple-table-container" style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700' }}>Riwayat Transaksi & Nota ({filteredTx.length})</h4>
          <div className="pos-search-input" style={{ width: '260px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Cari no. struk / nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
          <table className="apple-table">
            <thead>
              <tr>
                <th>NO. STRUK</th>
                <th>WAKTU</th>
                <th>PELANGGAN</th>
                <th>METODE</th>
                <th>TOTAL</th>
                <th style={{ textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx
                .filter(t => t.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) || t.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: '600', color: 'var(--apple-blue)' }}>{t.receiptNumber}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{formatDateIndonesian(t.date)}</td>
                    <td style={{ fontWeight: '600' }}>{t.customerName} <br/><span style={{fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal'}}>{t.tableName || 'Takeaway'}</span></td>
                    <td style={{ textTransform: 'uppercase', fontWeight: '600', fontSize: '12px' }}>
                      <span style={{ background: 'rgba(60,60,67,0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700' }}>{formatRupiah(t.total)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { sounds.playBeep(); setReprintTx(t); }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Lihat Struk
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => handleVoidClick(t.id, t.receiptNumber)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--apple-red)',
                              background: 'transparent',
                              color: 'var(--apple-red)',
                              cursor: 'pointer'
                            }}
                            title="Batalkan / Hapus Transaksi Ini"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tidak ada transaksi ditemukan pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reprintTx && (
        <ReceiptModal
          transaction={reprintTx}
          appSettings={appSettings}
          onClose={() => setReprintTx(null)}
        />
      )}
    </div>
  );
};
