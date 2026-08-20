import React, { useMemo, useState } from 'react';
import {
  BarChart3, CalendarDays, Download, FileText, Landmark, Package, Plus,
  Printer, ReceiptText, Search, ShoppingBag, Trash2, TrendingDown,
  TrendingUp, WalletCards, X,
} from 'lucide-react';
import { formatRupiah, formatDateIndonesian } from '../../utils/formatters';
import { ReceiptModal } from '../POS/ReceiptModal';
import { sounds } from '../../utils/audio';

const PERIODS = [
  { id: 'daily', label: 'Hari ini' },
  { id: 'weekly', label: 'Minggu' },
  { id: 'monthly', label: 'Bulan' },
  { id: 'yearly', label: 'Tahun' },
];
const CATEGORIES = ['Bahan baku', 'Operasional', 'Gaji', 'Transportasi', 'Sewa & utilitas', 'Perawatan', 'Pemasaran', 'Lainnya'];
const PAYMENT_NAMES = { cash: 'Tunai', qris: 'QRIS', card: 'Kartu/EDC', debit: 'Kartu debit', credit: 'Kartu kredit', ewallet: 'E-Wallet', transfer: 'Transfer', other: 'Lainnya' };

const isInPeriod = (value, period, reportDate) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (period === 'daily') return date.toDateString() === reportDate.toDateString();
  if (period === 'weekly') {
    const start = new Date(reportDate);
    start.setDate(start.getDate() - (start.getDay() || 7) + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return date >= start && date < end;
  }
  if (period === 'monthly') return date.getMonth() === reportDate.getMonth() && date.getFullYear() === reportDate.getFullYear();
  return date.getFullYear() === reportDate.getFullYear();
};

const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;

export const ReportsScreen = ({
  transactions = [], expenses = [], setExpenses = () => {}, appSettings,
  activeShift, shiftHistory = [], onVoidTransaction = () => {}, currentUserRole,
}) => {
  const [period, setPeriod] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [search, setSearch] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Operasional', paymentMethod: 'cash', date: new Date().toLocaleDateString('en-CA'), note: '' });

  const reportDate = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);
  const reportTransactions = useMemo(() => transactions.filter(item => {
    const status = String(item.status || item.paymentStatus || '').toLowerCase();
    return status !== 'void' && isInPeriod(item.date, period, reportDate);
  }), [transactions, period, reportDate]);
  const reportExpenses = useMemo(() => expenses.filter(item => isInPeriod(item.date, period, reportDate)), [expenses, period, reportDate]);
  const revenue = reportTransactions.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const expenseTotal = reportExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxCollected = reportTransactions.reduce((sum, tx) => sum + (Number(tx.tax) || 0), 0);
  const cogs = reportTransactions.reduce((sum, tx) => sum + (tx.items || []).reduce((cost, item) => cost + Number(item.costPrice ?? item.cost ?? 0) * Number(item.qty ?? item.quantity ?? 0), 0), 0);
  const netCash = revenue - expenseTotal;
  const netProfit = revenue - taxCollected - cogs - expenseTotal;
  const totalItems = reportTransactions.reduce((sum, tx) => sum + (tx.items || []).reduce((qty, item) => qty + Number(item.qty ?? item.quantity ?? 0), 0), 0);
  const averageOrder = reportTransactions.length ? Math.round(revenue / reportTransactions.length) : 0;

  const paymentMap = reportTransactions.reduce((result, tx) => {
    const method = String(tx.paymentMethod || 'other').toLowerCase();
    result[method] = (result[method] || 0) + Number(tx.total || 0);
    return result;
  }, {});
  const productMap = reportTransactions.reduce((result, tx) => {
    (tx.items || []).forEach(item => {
      const current = result[item.name] || { qty: 0, revenue: 0 };
      const qty = Number(item.qty ?? item.quantity ?? 0);
      current.qty += qty;
      current.revenue += Number(item.totalPrice ?? ((item.itemUnitPrice ?? item.price ?? item.basePrice ?? 0) * qty));
      result[item.name] = current;
    });
    return result;
  }, {});
  const topProducts = Object.entries(productMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
  const maxQty = Math.max(...topProducts.map(([, item]) => item.qty), 1);
  const dailyMap = reportTransactions.reduce((result, tx) => {
    const label = new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    result[label] = (result[label] || 0) + Number(tx.total || 0);
    return result;
  }, {});
  const trend = Object.entries(dailyMap).slice(-7);
  const maxTrend = Math.max(...trend.map(([, amount]) => amount), 1);
  const shifts = activeShift ? [{ ...activeShift, active: true }, ...shiftHistory] : shiftHistory;
  const visibleTransactions = reportTransactions.filter(tx => {
    const query = search.toLowerCase();
    return String(tx.receiptNumber || '').toLowerCase().includes(query) || String(tx.customerName || '').toLowerCase().includes(query);
  });

  const saveExpense = event => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || amount <= 0) return;
    setExpenses(previous => [{
      id: `EXP-${Date.now()}`, title: form.title.trim(), amount,
      category: form.category, paymentMethod: form.paymentMethod,
      date: new Date(`${form.date}T12:00:00`).toISOString(), createdAt: new Date().toISOString(), note: form.note.trim(),
    }, ...previous]);
    setForm(previous => ({ ...previous, title: '', amount: '', note: '' }));
    setShowExpenseForm(false);
    sounds.playBeep();
  };

  const exportCsv = () => {
    const rows = [
      ['Jenis', 'Nomor/Judul', 'Tanggal', 'Kategori/Metode', 'Keterangan', 'Masuk', 'Keluar'],
      ...reportTransactions.map(tx => ['Penjualan', tx.receiptNumber, formatDateIndonesian(tx.date), PAYMENT_NAMES[String(tx.paymentMethod || '').toLowerCase()] || tx.paymentMethod, tx.customerName, tx.total, '']),
      ...reportExpenses.map(item => ['Pengeluaran', item.title, formatDateIndonesian(item.date), item.category, item.note, '', item.amount]),
      [], ['Ringkasan', 'Omzet', '', '', '', revenue, ''], ['Ringkasan', 'Pengeluaran', '', '', '', '', expenseTotal], ['Ringkasan', 'Arus kas bersih', '', '', '', netCash, ''],
    ];
    const content = rows.map(row => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Selasar_${period}_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return <div className="reports-page">
    <header className="reports-heading">
      <div className="reports-title"><span className="reports-title-icon"><BarChart3 size={22} /></span><div><h2>Laporan usaha</h2><p>Penjualan, laba, arus kas, dan operasional dalam satu tampilan.</p></div></div>
      <button className="report-primary-action" onClick={() => setShowExpenseForm(true)}><Plus size={18} /> Catat pengeluaran</button>
    </header>

    <section className="report-toolbar">
      <div className="report-period-tabs">{PERIODS.map(item => <button key={item.id} className={period === item.id ? 'active' : ''} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div>
      <label className="report-date-control"><CalendarDays size={17} /><span>Tanggal acuan</span><input type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} /></label>
      <div className="report-export-actions"><button onClick={exportCsv}><Download size={17} /><span>Unduh Excel</span></button><button onClick={() => window.print()}><Printer size={17} /><span>Cetak</span></button></div>
    </section>

    <section className="report-kpi-grid">
      <article className="report-kpi-card revenue"><span><TrendingUp size={18} /> Omzet</span><strong>{formatRupiah(revenue)}</strong><small>{reportTransactions.length} transaksi • {totalItems} item</small></article>
      <article className="report-kpi-card expense"><span><TrendingDown size={18} /> Pengeluaran</span><strong>{formatRupiah(expenseTotal)}</strong><small>{reportExpenses.length} catatan biaya</small></article>
      <article className={`report-kpi-card ${netCash < 0 ? 'negative' : 'profit'}`}><span><WalletCards size={18} /> Arus kas bersih</span><strong>{formatRupiah(netCash)}</strong><small>Pemasukan dikurangi pengeluaran</small></article>
      <article className={`report-kpi-card ${netProfit < 0 ? 'negative' : 'profit'}`}><span><Landmark size={18} /> Laba bersih</span><strong>{formatRupiah(netProfit)}</strong><small>{cogs > 0 ? `Setelah HPP ${formatRupiah(cogs)} & pajak ${formatRupiah(taxCollected)}` : 'HPP produk belum tercatat'}</small></article>
    </section>

    {cogs === 0 && revenue > 0 && <div className="report-notice"><Package size={18} /><div><b>Lengkapi harga modal produk agar laba lebih akurat.</b><span>Saat ini laba dihitung dari omzet dikurangi pengeluaran karena HPP belum tersedia.</span></div></div>}

    <section className="report-main-grid">
      <article className="report-panel report-trend-panel"><div className="report-panel-heading"><div><h3>Tren pendapatan</h3><p>Pergerakan omzet pada periode pilihan</p></div><span>Rata-rata {formatRupiah(averageOrder)} / transaksi</span></div>
        {trend.length ? <div className="report-bar-chart">{trend.map(([label, amount]) => <div className="report-chart-item" key={label}><span>{formatRupiah(amount)}</span><div><i style={{ height: `${Math.max(8, amount / maxTrend * 100)}%` }} /></div><b>{label}</b></div>)}</div> : <Empty icon={<BarChart3 size={28} />} title="Belum ada penjualan" text="Grafik akan muncul setelah ada transaksi pada periode ini." />}
      </article>
      <article className="report-panel"><PanelTitle title="Metode pembayaran" subtitle="Komposisi penerimaan" /><div className="payment-breakdown-list">
        {Object.keys(paymentMap).length ? Object.entries(paymentMap).sort((a, b) => b[1] - a[1]).map(([method, amount]) => { const percentage = revenue ? Math.round(amount / revenue * 100) : 0; return <div key={method}><div><span>{PAYMENT_NAMES[method] || method}</span><b>{formatRupiah(amount)}</b></div><div className="report-progress"><i style={{ width: `${percentage}%` }} /></div><small>{percentage}% dari omzet</small></div>; }) : <Empty compact icon={<WalletCards size={25} />} text="Belum ada pembayaran." />}
      </div></article>
    </section>

    <section className="report-main-grid">
      <article className="report-panel"><PanelTitle title="Produk terlaris" subtitle="Berdasarkan jumlah item terjual" /><div className="top-product-list">
        {topProducts.length ? topProducts.map(([name, item], index) => <div key={name}><span className="product-rank">{index + 1}</span><div className="product-report-info"><div><b>{name}</b><strong>{item.qty} item</strong></div><div className="report-progress"><i style={{ width: `${item.qty / maxQty * 100}%` }} /></div><small>{formatRupiah(item.revenue)} omzet</small></div></div>) : <Empty compact icon={<ShoppingBag size={25} />} text="Belum ada produk terjual." />}
      </div></article>
      <article className="report-panel"><PanelTitle title="Rekap kasir" subtitle="Status shift terbaru" /><div className="report-shift-list">
        {shifts.length ? shifts.slice(0, 5).map(shift => <div key={shift.id}><div><b>{shift.shiftType || shift.name || 'Shift kasir'}</b><span>{shift.baristaName || 'Petugas belum diisi'}{!shift.active && shift.cashDifference !== null && shift.cashDifference !== undefined && Number.isFinite(Number(shift.cashDifference)) ? ` • Selisih ${formatRupiah(shift.cashDifference)}` : shift.autoClosed ? ' • Rekonsiliasi belum dihitung' : ''}</span></div><div><strong className={shift.active ? 'active' : ''}>{shift.active ? 'Aktif' : shift.autoClosed ? 'Ditutup otomatis' : 'Ditutup'}</strong><span>Modal {formatRupiah(shift.openingCash ?? 0)}</span></div></div>) : <Empty compact icon={<ReceiptText size={25} />} text="Belum ada riwayat shift." />}
      </div></article>
    </section>

    <section className="report-panel report-expense-section"><div className="report-panel-heading"><div><h3>Arus keluar operasional</h3><p>Semua biaya pada periode yang dipilih</p></div><button className="report-secondary-action" onClick={() => setShowExpenseForm(true)}><Plus size={17} /> Tambah</button></div>
      {reportExpenses.length ? <div className="expense-list">{reportExpenses.map(item => <article key={item.id}><div className="expense-icon"><TrendingDown size={18} /></div><div className="expense-info"><b>{item.title}</b><span>{item.category} • {formatDateIndonesian(item.date)}</span>{item.note && <small>{item.note}</small>}</div><strong>-{formatRupiah(item.amount)}</strong>{currentUserRole === 'owner' && <button aria-label={`Hapus ${item.title}`} onClick={() => window.confirm(`Hapus pengeluaran “${item.title}”?`) && setExpenses(previous => previous.filter(expense => expense.id !== item.id))}><Trash2 size={16} /></button>}</article>)}</div> : <Empty icon={<TrendingDown size={28} />} title="Belum ada pengeluaran" text="Catat belanja bahan, listrik, transportasi, gaji, atau biaya operasional lain." action={<button onClick={() => setShowExpenseForm(true)}>Catat pengeluaran pertama</button>} />}
    </section>

    <section className="report-panel report-transactions-section"><div className="report-panel-heading transaction-heading"><div><h3>Riwayat transaksi</h3><p>{reportTransactions.length} transaksi pada periode ini</p></div><label className="report-search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari struk atau pelanggan" /></label></div>
      <div className="report-desktop-table"><table><thead><tr><th>No. struk</th><th>Waktu</th><th>Pelanggan</th><th>Metode</th><th>Total</th><th>Aksi</th></tr></thead><tbody>{visibleTransactions.map(tx => <tr key={tx.id}><td>{tx.receiptNumber}</td><td>{formatDateIndonesian(tx.date)}</td><td><b>{tx.customerName || 'Pelanggan umum'}</b><small>{tx.tableName || 'Takeaway'}</small></td><td><span className="payment-badge">{PAYMENT_NAMES[String(tx.paymentMethod || '').toLowerCase()] || tx.paymentMethod}</span></td><td><b>{formatRupiah(tx.total)}</b></td><td><div className="report-row-actions"><button onClick={() => setReceipt(tx)}>Lihat</button>{currentUserRole === 'owner' && <button className="danger" onClick={() => window.confirm(`Batalkan transaksi ${tx.receiptNumber}?`) && onVoidTransaction(tx.id)}><Trash2 size={15} /></button>}</div></td></tr>)}</tbody></table></div>
      <div className="report-mobile-transactions">{visibleTransactions.map(tx => <article key={tx.id} onClick={() => setReceipt(tx)}><div><b>{tx.customerName || 'Pelanggan umum'}</b><span>{tx.receiptNumber} • {formatDateIndonesian(tx.date)}</span></div><div><strong>{formatRupiah(tx.total)}</strong><span>{PAYMENT_NAMES[String(tx.paymentMethod || '').toLowerCase()] || tx.paymentMethod}</span></div></article>)}</div>
      {!visibleTransactions.length && <Empty compact icon={<FileText size={25} />} text="Tidak ada transaksi yang cocok." />}
    </section>

    {showExpenseForm && <div className="modal-overlay" onMouseDown={event => event.target === event.currentTarget && setShowExpenseForm(false)}><form className="modal-card expense-modal" onSubmit={saveExpense}><div className="modal-header"><div><h3>Catat pengeluaran</h3><p>Masukkan biaya operasional agar laporan kas selalu akurat.</p></div><button type="button" className="expense-modal-close" onClick={() => setShowExpenseForm(false)}><X size={20} /></button></div><div className="modal-body expense-form">
      <Field full label="Dipakai untuk apa?"><input autoFocus required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Contoh: Beli gas dan air galon" /></Field>
      <Field label="Jumlah"><div className="expense-money-input"><b>Rp</b><input required type="number" min="1" inputMode="numeric" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} placeholder="0" /></div></Field>
      <Field label="Tanggal"><input required type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></Field>
      <Field label="Kategori"><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></Field>
      <Field label="Pembayaran"><select value={form.paymentMethod} onChange={event => setForm({ ...form, paymentMethod: event.target.value })}><option value="cash">Tunai</option><option value="transfer">Transfer</option><option value="qris">QRIS</option><option value="debit">Kartu debit</option></select></Field>
      <Field full label="Catatan (opsional)"><textarea rows="3" value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} placeholder="Toko/supplier, nomor nota, atau detail lainnya" /></Field>
    </div><div className="modal-footer"><button type="button" className="expense-cancel" onClick={() => setShowExpenseForm(false)}>Batal</button><button type="submit" className="expense-save"><Plus size={17} /> Simpan pengeluaran</button></div></form></div>}
    {receipt && <ReceiptModal transaction={receipt} appSettings={appSettings} onClose={() => setReceipt(null)} />}
  </div>;
};

const PanelTitle = ({ title, subtitle }) => <div className="report-panel-heading"><div><h3>{title}</h3><p>{subtitle}</p></div></div>;
const Empty = ({ icon, title, text, action, compact }) => <div className={`report-empty ${compact ? 'compact' : ''}`}>{icon}{title && <b>{title}</b>}{text && <span>{text}</span>}{action}</div>;
const Field = ({ label, full, children }) => <label className={`expense-field ${full ? 'full' : ''}`}><span>{label}</span>{children}</label>;
