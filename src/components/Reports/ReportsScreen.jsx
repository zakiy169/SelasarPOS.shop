import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, ChevronDown, ChevronRight,
  Download, Landmark, Package, Plus, Printer,
  Search, ShoppingBag, Trash2, Users, WalletCards, X,
} from 'lucide-react';
import { formatDateIndonesian, formatRupiah } from '../../utils/formatters';
import { ReceiptModal } from '../POS/ReceiptModal';
import { sounds } from '../../utils/audio';

const PERIODS = [
  { id: 'daily', label: 'Hari ini' }, { id: 'weekly', label: 'Minggu ini' },
  { id: 'monthly', label: 'Bulan ini' }, { id: 'yearly', label: 'Tahun ini' },
];
const REPORTS = [
  { id: 'sales', label: 'Penjualan', icon: BarChart3, description: 'Omzet, transaksi, dan pembayaran' },
  { id: 'products', label: 'Produk terjual', icon: ShoppingBag, description: 'Produk laris, omzet, dan profit' },
  { id: 'cashflow', label: 'Arus kas', icon: WalletCards, description: 'Pemasukan serta pengeluaran usaha' },
  { id: 'shifts', label: 'Tutup kasir', icon: Landmark, description: 'Kas awal, akhir, dan selisih shift' },
  { id: 'stock', label: 'Riwayat stok', icon: Package, description: 'Restock, pemakaian, dan stok terkini' },
  { id: 'customers', label: 'Riwayat pelanggan', icon: Users, description: 'Kunjungan dan nilai belanja pelanggan' },
];
const EXPENSE_CATEGORIES = ['Bahan baku', 'Operasional', 'Gaji', 'Transportasi', 'Sewa & utilitas', 'Perawatan', 'Pemasaran', 'Lainnya'];
const PAYMENT_NAMES = { cash: 'Tunai', qris: 'QRIS', card: 'Kartu/EDC', debit: 'Kartu debit', credit: 'Kartu kredit', ewallet: 'E-Wallet', transfer: 'Transfer', other: 'Lainnya' };
const number = value => Number(value) || 0;
const itemQty = item => number(item?.qty ?? item?.quantity);
const itemRevenue = item => number(item?.totalPrice ?? item?.itemUnitPrice ?? item?.price ?? item?.basePrice) * itemQty(item);
const isVoid = transaction => String(transaction?.status || transaction?.paymentStatus || '').toLowerCase() === 'void';
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;

const inPeriod = (value, period, anchor) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (period === 'daily') return date.toDateString() === anchor.toDateString();
  if (period === 'weekly') {
    const start = new Date(anchor); start.setDate(start.getDate() - (start.getDay() || 7) + 1); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    return date >= start && date < end;
  }
  if (period === 'monthly') return date.getMonth() === anchor.getMonth() && date.getFullYear() === anchor.getFullYear();
  return date.getFullYear() === anchor.getFullYear();
};

export const ReportsScreen = ({
  transactions = [], expenses = [], products = [], inventory = [], inventoryHistory = [], members = [], expenseAudit = [],
  appSettings, activeShift, shiftHistory = [], onVoidTransaction = () => {}, currentUserRole, onAddExpense = () => {}, onUpdateExpense = () => {}, onDeleteExpense = () => {},
}) => {
  const [reportId, setReportId] = useState('sales');
  const [period, setPeriod] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [search, setSearch] = useState('');
  const [showReportPicker, setShowReportPicker] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Operasional', paymentMethod: 'cash', date: new Date().toLocaleDateString('en-CA'), note: '' });
  const anchor = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);
  const activeReport = REPORTS.find(item => item.id === reportId) || REPORTS[0];
  const ActiveReportIcon = activeReport.icon;
  const selectReport = (id) => {
    setReportId(id);
    setShowReportPicker(false);
  };

  const data = useMemo(() => {
    const validTransactions = transactions.filter(tx => !isVoid(tx));
    const tx = validTransactions.filter(tx => inPeriod(tx.date, period, anchor));
    const expenseRows = expenses.filter(item => inPeriod(item.date || item.createdAt, period, anchor));
    const movements = inventoryHistory.filter(item => inPeriod(item.date, period, anchor));
    const productById = new Map(products.map(item => [String(item.id), item]));
    const revenue = tx.reduce((sum, item) => sum + number(item.total), 0);
    const cogs = tx.reduce((total, transaction) => total + (transaction.items || []).reduce((sum, item) => {
      const hppSnapshot = item.hppSnapshot ?? item.costPrice;
      return sum + number(hppSnapshot) * itemQty(item);
    }, 0), 0);
    const expenseTotal = expenseRows.reduce((sum, item) => sum + number(item.amount), 0);
    const tax = tx.reduce((sum, item) => sum + number(item.tax), 0);
    const paymentMap = tx.reduce((map, item) => {
      const method = String(item.paymentMethod || 'other').toLowerCase();
      map[method] = (map[method] || 0) + number(item.total); return map;
    }, {});
    const productMap = tx.reduce((map, transaction) => {
      (transaction.items || []).forEach(item => {
        const key = String(item.productId || item.id || item.name);
        const product = productById.get(key);
        const current = map[key] || { id: key, name: item.name || product?.name || 'Produk', qty: 0, revenue: 0, cost: 0 };
        const qty = itemQty(item);
        current.qty += qty;
        current.revenue += itemRevenue(item);
        const hppSnapshot = item.hppSnapshot ?? item.costPrice;
        current.cost += number(hppSnapshot) * qty;
        current.missingHpp = current.missingHpp || hppSnapshot === undefined || hppSnapshot === null;
        map[key] = current;
      });
      return map;
    }, {});
    const productRows = Object.values(productMap).map(item => ({ ...item, profit: item.revenue - item.cost })).sort((a, b) => b.revenue - a.revenue);
    const customerMap = validTransactions.reduce((map, transaction) => {
      const name = String(transaction.customerName || '').trim();
      if (!name || /^pelanggan umum$/i.test(name)) return map;
      const key = String(transaction.memberId || name.toLowerCase());
      const current = map[key] || { key, name, visits: 0, spent: 0, lastDate: transaction.date, memberId: transaction.memberId };
      current.visits += 1; current.spent += number(transaction.total);
      if (new Date(transaction.date) > new Date(current.lastDate)) current.lastDate = transaction.date;
      map[key] = current; return map;
    }, {});
    const customers = Object.values(customerMap).map(item => ({ ...item, member: members.find(member => member.id === item.memberId) })).sort((a, b) => b.spent - a.spent);
    const salesByDate = tx.reduce((map, transaction) => {
      const key = new Date(transaction.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      map[key] = (map[key] || 0) + number(transaction.total); return map;
    }, {});
    return { tx, expenseRows, movements, revenue, cogs, expenseTotal, tax, paymentMap, productRows, customers, salesByDate, missingHppCount: productRows.filter(item => item.missingHpp).length, netCash: revenue - expenseTotal, netProfit: revenue - cogs - expenseTotal - tax };
  }, [transactions, expenses, products, inventoryHistory, members, period, anchor]);

  const maxSale = Math.max(...Object.values(data.salesByDate), 1);
  const filteredTransactions = data.tx.filter(item => `${item.receiptNumber} ${item.customerName}`.toLowerCase().includes(search.toLowerCase()));
  const selectedReport = REPORTS.find(item => item.id === reportId);

  const saveExpense = event => {
    event.preventDefault();
    const amount = number(expenseForm.amount);
    if (!expenseForm.title.trim() || amount <= 0) return;
    const payload = { ...expenseForm, title: expenseForm.title.trim(), amount, date: new Date(`${expenseForm.date}T12:00:00`).toISOString(), note: expenseForm.note.trim() };
    if (payload.id) onUpdateExpense(payload);
    else onAddExpense({ ...payload, id: `EXP-${Date.now()}`, createdAt: new Date().toISOString() });
    setExpenseForm({ title: '', amount: '', category: 'Operasional', paymentMethod: 'cash', date: new Date().toLocaleDateString('en-CA'), note: '', attachment: null });
    setShowExpenseForm(false); sounds.playSuccessChime();
  };

  const openExpenseForm = (expense = null) => {
    setExpenseForm(expense ? { ...expense, date: new Date(expense.date).toLocaleDateString('en-CA') } : { title: '', amount: '', category: 'Operasional', paymentMethod: 'cash', date: new Date().toLocaleDateString('en-CA'), note: '', attachment: null });
    setShowExpenseForm(true);
  };

  const attachExpenseReceipt = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return alert('Lampiran harus gambar maksimal 2 MB.');
    const reader = new FileReader();
    reader.onload = () => setExpenseForm(previous => ({ ...previous, attachment: reader.result, attachmentName: file.name }));
    reader.readAsDataURL(file);
  };

  const exportCsv = () => {
    const rows = [['Jenis', 'Nama / Nomor', 'Tanggal', 'Keterangan', 'Masuk', 'Keluar']];
    data.tx.forEach(item => rows.push(['Penjualan', item.receiptNumber, formatDateIndonesian(item.date), PAYMENT_NAMES[String(item.paymentMethod || '').toLowerCase()] || item.paymentMethod, item.total, '']));
    data.expenseRows.forEach(item => rows.push(['Pengeluaran', item.title, formatDateIndonesian(item.date), item.category, '', item.amount]));
    rows.push([], ['Ringkasan', 'Omzet', '', '', data.revenue, ''], ['Ringkasan', 'Pengeluaran', '', '', '', data.expenseTotal], ['Ringkasan', 'Arus kas bersih', '', '', data.netCash, '']);
    const url = URL.createObjectURL(new Blob([`\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `Laporan_${selectedReport.label.replaceAll(' ', '_')}_${selectedDate}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="report-hub">
    <header className="report-hub-header"><div><p className="report-eyebrow">Pusat kontrol usaha</p><h2>Laporan yang jelas, dari data kasir yang sama</h2><span>Setiap angka berasal dari transaksi, stok, shift, member, dan pengeluaran aplikasi ini.</span></div><button className="report-primary-action" onClick={() => openExpenseForm()}><Plus size={17} /> Tambah pengeluaran</button></header>
    <nav className="report-hub-nav" aria-label="Jenis laporan">{REPORTS.map(item => { const Icon = item.icon; return <button key={item.id} className={reportId === item.id ? 'active' : ''} onClick={() => selectReport(item.id)}><Icon size={18} /><span><b>{item.label}</b><small>{item.description}</small></span><ChevronRight size={15} /></button>; })}</nav>
    <div className="report-mobile-switcher-wrap">
      <button type="button" className="report-mobile-switcher" onClick={() => setShowReportPicker(true)} aria-haspopup="dialog" aria-expanded={showReportPicker}>
          <span className="report-mobile-switcher-icon"><ActiveReportIcon size={18} /></span>
        <span><small>LAPORAN AKTIF</small><b>{activeReport.label}</b></span>
        <ChevronDown size={18} />
      </button>
    </div>
    {showReportPicker && <div className="report-picker-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && setShowReportPicker(false)}>
      <section className="report-picker-sheet" role="dialog" aria-modal="true" aria-label="Pilih jenis laporan">
        <div className="report-picker-handle" />
        <header className="report-picker-heading"><div><small>JENIS LAPORAN</small><h2>Pilih tampilan</h2><p>Pindah laporan tanpa kembali ke bagian atas.</p></div><button type="button" onClick={() => setShowReportPicker(false)} aria-label="Tutup pilihan laporan">×</button></header>
        <div className="report-picker-options">{REPORTS.map(item => { const Icon = item.icon; return <button type="button" key={item.id} className={`report-picker-option ${reportId === item.id ? 'is-active' : ''}`} onClick={() => selectReport(item.id)}><span><Icon size={18} /></span><div><b>{item.label}</b><small>{item.description}</small></div><ChevronRight size={17} /></button>; })}</div>
      </section>
    </div>}
    <section className="report-filter-bar"><div className="report-period-tabs">{PERIODS.map(item => <button key={item.id} className={period === item.id ? 'active' : ''} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div><label><CalendarDays size={16} /><input type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} /></label><div><button onClick={exportCsv}><Download size={16} /> Export CSV</button><button onClick={() => window.print()}><Printer size={16} /> Cetak</button></div></section>
    {reportId === 'sales' && <SalesReport data={data} filteredTransactions={filteredTransactions} search={search} setSearch={setSearch} setReceipt={setReceipt} currentUserRole={currentUserRole} onVoidTransaction={onVoidTransaction} maxSale={maxSale} />}
    {reportId === 'products' && <ProductsReport rows={data.productRows} missingHppCount={data.missingHppCount} />}
    {reportId === 'cashflow' && <CashflowReport data={data} onOpenExpense={openExpenseForm} currentUserRole={currentUserRole} onDeleteExpense={onDeleteExpense} expenseAudit={expenseAudit} />}
    {reportId === 'shifts' && <ShiftReport activeShift={activeShift} shiftHistory={shiftHistory} />}
    {reportId === 'stock' && <StockReport inventory={inventory} movements={data.movements} />}
    {reportId === 'customers' && <CustomersReport rows={data.customers} />}
    {showExpenseForm && <ExpenseModal form={expenseForm} setForm={setExpenseForm} onClose={() => setShowExpenseForm(false)} onSave={saveExpense} onReceiptChange={attachExpenseReceipt} />}
    {receipt && <ReceiptModal transaction={receipt} appSettings={appSettings} onClose={() => setReceipt(null)} />}
  </div>;
};

const Metric = ({ label, value, note, tone = 'blue' }) => <article className={`report-metric ${tone}`}><span>{label}</span><strong>{formatRupiah(value)}</strong><small>{note}</small></article>;
const Empty = ({ title, text }) => <div className="report-hub-empty"><b>{title}</b><span>{text}</span></div>;

const SalesReport = ({ data, filteredTransactions, search, setSearch, setReceipt, currentUserRole, onVoidTransaction, maxSale }) => <>
  <section className="report-metric-grid"><Metric label="Omzet" value={data.revenue} note={`${data.tx.length} transaksi`} /><Metric label="Laba bersih" value={data.netProfit} note={`Setelah HPP, pajak, dan pengeluaran`} tone={data.netProfit < 0 ? 'red' : 'green'} /><Metric label="Rata-rata transaksi" value={data.tx.length ? data.revenue / data.tx.length : 0} note="Nilai per transaksi" /><Metric label="Item terjual" value={data.tx.reduce((sum, item) => sum + (item.items || []).reduce((qty, product) => qty + itemQty(product), 0), 0)} note="Pada periode yang dipilih" /></section>
  <section className="report-split"><article className="report-card"><CardTitle title="Tren penjualan" text="Omzet per hari pada periode pilihan" />{Object.keys(data.salesByDate).length ? <div className="sales-bars">{Object.entries(data.salesByDate).map(([label, value]) => <div key={label}><i style={{ height: `${Math.max(8, value / maxSale * 100)}%` }} /><span>{label}</span><b>{formatRupiah(value)}</b></div>)}</div> : <Empty title="Belum ada penjualan" text="Grafik akan muncul setelah transaksi tercatat." />}</article><article className="report-card"><CardTitle title="Metode pembayaran" text="Sumber penerimaan omzet" />{Object.keys(data.paymentMap).length ? <div className="report-breakdown">{Object.entries(data.paymentMap).sort((a, b) => b[1] - a[1]).map(([method, value]) => <div key={method}><span>{PAYMENT_NAMES[method] || method}</span><b>{formatRupiah(value)}</b><i style={{ width: `${data.revenue ? value / data.revenue * 100 : 0}%` }} /></div>)}</div> : <Empty title="Belum ada pembayaran" text="Transaksi akan muncul di sini." />}</article></section>
  <section className="report-card"><div className="report-table-header"><CardTitle title="Riwayat transaksi" text={`${data.tx.length} transaksi pada periode ini`} /><label className="report-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari struk atau pelanggan" /></label></div><TransactionTable rows={filteredTransactions} setReceipt={setReceipt} currentUserRole={currentUserRole} onVoidTransaction={onVoidTransaction} /></section>
</>;

const ProductsReport = ({ rows, missingHppCount }) => <><section className="report-metric-grid"><Metric label="Produk terjual" value={rows.reduce((sum, item) => sum + item.qty, 0)} note="Total unit produk" /><Metric label="Omzet produk" value={rows.reduce((sum, item) => sum + item.revenue, 0)} note="Belum dikurangi diskon transaksi" /><Metric label="Profit kotor" value={rows.reduce((sum, item) => sum + item.profit, 0)} note={missingHppCount ? `${missingHppCount} produk lama tanpa snapshot HPP` : 'Omzet dikurangi HPP snapshot'} tone="green" /></section><section className="report-card"><CardTitle title="Performa produk" text="HPP transaksi baru dikunci saat penjualan, sehingga perubahan harga modal tidak mengubah sejarah." />{rows.length ? <div className="report-data-table"><table><thead><tr><th>Produk</th><th>Terjual</th><th>Omzet</th><th>HPP</th><th>Profit kotor</th><th>Margin</th></tr></thead><tbody>{rows.map((item, index) => <tr key={item.id}><td><b>#{index + 1} {item.name}</b>{item.missingHpp && <small>HPP historis belum terekam</small>}</td><td>{item.qty} item</td><td>{formatRupiah(item.revenue)}</td><td>{formatRupiah(item.cost)}</td><td className={item.profit < 0 ? 'negative' : 'positive'}>{formatRupiah(item.profit)}</td><td>{item.revenue ? Math.round(item.profit / item.revenue * 100) : 0}%</td></tr>)}</tbody></table></div> : <Empty title="Belum ada produk terjual" text="Setelah transaksi masuk, produk terlaris dan profit per produk tampil di sini." />}</section></>;

const CashflowReport = ({ data, onOpenExpense, currentUserRole, onDeleteExpense, expenseAudit }) => <><section className="report-metric-grid"><Metric label="Pemasukan penjualan" value={data.revenue} note={`${data.tx.length} transaksi berbayar`} tone="green" /><Metric label="Pengeluaran" value={data.expenseTotal} note={`${data.expenseRows.length} catatan biaya`} tone="red" /><Metric label="Arus kas bersih" value={data.netCash} note="Pemasukan dikurangi pengeluaran" tone={data.netCash < 0 ? 'red' : 'blue'} /></section><section className="report-card"><div className="report-table-header"><CardTitle title="Buku arus kas" text="Setiap pemasukan dan pengeluaran pada periode ini." /><button className="report-secondary-action" onClick={() => onOpenExpense()}><Plus size={16} /> Catat biaya</button></div><CashflowTable transactions={data.tx} expenses={data.expenseRows} currentUserRole={currentUserRole} onEdit={onOpenExpense} onDeleteExpense={onDeleteExpense} /></section><section className="report-card"><CardTitle title="Jejak audit pengeluaran" text="Riwayat tambah, ubah, dan hapus untuk transparansi operasional." />{expenseAudit.length ? <div className="movement-list">{expenseAudit.slice(0, 20).map(item => <div key={item.id}><span className={item.action === 'deleted' ? 'out' : 'in'}>{item.action === 'deleted' ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span><div><b>{item.title}</b><small>{item.action === 'created' ? 'Ditambahkan' : item.action === 'updated' ? 'Diubah' : 'Dihapus'} · {formatDateIndonesian(item.date)}</small></div><strong>{formatRupiah(item.amount)}</strong></div>)}</div> : <Empty title="Belum ada audit" text="Setiap perubahan pengeluaran berikutnya akan tercatat di sini." />}</section></>;

const ShiftReport = ({ activeShift, shiftHistory }) => { const rows = activeShift ? [{ ...activeShift, active: true }, ...shiftHistory] : shiftHistory; return <section className="report-card"><CardTitle title="Laporan tutup kasir" text="Kas awal, penerimaan tunai, pengeluaran tunai, kas fisik, dan selisih." />{rows.length ? <div className="shift-report-list">{rows.map(shift => <article key={shift.id}><div><b>{shift.shiftType || shift.name || 'Shift kasir'}</b><span>{shift.baristaName || 'Kasir tidak dicatat'} · Dibuka {formatDateIndonesian(shift.startTime || shift.createdAt)}</span></div><div className="shift-report-values"><span>Kas awal <b>{formatRupiah(shift.openingCash)}</b></span><span>Penjualan tunai <b>{formatRupiah(shift.cashSales)}</b></span><span>Pengeluaran tunai <b>{formatRupiah(shift.cashExpenses)}</b></span><span>Kas seharusnya <b>{formatRupiah(shift.expectedCash)}</b></span><span>Kas fisik <b>{shift.physicalCash == null ? 'Belum dihitung' : formatRupiah(shift.physicalCash)}</b></span><span className={number(shift.cashDifference) < 0 ? 'negative' : 'positive'}>Selisih <b>{shift.cashDifference == null ? '—' : formatRupiah(shift.cashDifference)}</b></span></div><em className={shift.active ? 'active' : ''}>{shift.active ? 'Sedang aktif' : shift.autoClosed ? 'Ditutup otomatis' : 'Ditutup'}</em></article>)}</div> : <Empty title="Belum ada shift" text="Buka dan tutup shift untuk mendapatkan rekonsiliasi kas kasir." />}</section> };

const StockReport = ({ inventory, movements }) => <section className="report-split stock"><article className="report-card"><CardTitle title="Stok saat ini" text="Posisi bahan baku langsung dari inventori." />{inventory.length ? <div className="stock-list">{inventory.map(item => { const stock = number(item.stock); const min = number(item.minStock); return <div key={item.id}><span><b>{item.name}</b><small>{stock <= min ? 'Perlu restock' : 'Stok aman'}</small></span><strong className={stock <= min ? 'negative' : ''}>{stock.toLocaleString('id-ID')} {item.unit}</strong></div>; })}</div> : <Empty title="Inventori kosong" text="Tambahkan bahan baku dari menu stok." />}</article><article className="report-card"><CardTitle title="Riwayat pergerakan stok" text="Restock, penyesuaian, dan pemakaian transaksi." />{movements.length ? <div className="movement-list">{movements.map(item => <div key={item.id}><span className={String(item.type).includes('out') ? 'out' : 'in'}>{String(item.type).includes('out') ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span><div><b>{item.inventoryName || 'Bahan baku'}</b><small>{item.reason || 'Pergerakan stok'} · {formatDateIndonesian(item.date)}</small></div><strong>{String(item.type).includes('out') ? '-' : '+'}{number(item.quantity).toLocaleString('id-ID')} {item.unit}</strong></div>)}</div> : <Empty title="Belum ada riwayat stok" text="Restock dan pemakaian bahan pada transaksi baru akan tercatat di sini." />}</article></section>;

const CustomersReport = ({ rows }) => <section className="report-card"><CardTitle title="Riwayat pelanggan" text="Dirangkum dari transaksi yang mencatat nama pelanggan atau member." />{rows.length ? <div className="report-data-table"><table><thead><tr><th>Pelanggan</th><th>Level</th><th>Kunjungan</th><th>Total belanja</th><th>Terakhir berkunjung</th></tr></thead><tbody>{rows.map(item => <tr key={item.key}><td><b>{item.name}</b><small>{item.member?.phone || 'Bukan member terdaftar'}</small></td><td>{item.member?.level || 'Umum'}</td><td>{item.visits} transaksi</td><td className="positive">{formatRupiah(item.spent)}</td><td>{formatDateIndonesian(item.lastDate)}</td></tr>)}</tbody></table></div> : <Empty title="Belum ada riwayat pelanggan" text="Pilih member atau isi nama pelanggan saat transaksi untuk membangun riwayat ini." />}</section>;

const CardTitle = ({ title, text }) => <header className="report-card-title"><div><h3>{title}</h3><p>{text}</p></div></header>;
const TransactionTable = ({ rows, setReceipt, currentUserRole, onVoidTransaction }) => rows.length ? <div className="report-data-table"><table><thead><tr><th>Struk</th><th>Waktu</th><th>Pelanggan</th><th>Pembayaran</th><th>Total</th><th></th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td><b>{item.receiptNumber || '-'}</b></td><td>{formatDateIndonesian(item.date)}</td><td>{item.customerName || 'Pelanggan umum'}</td><td>{PAYMENT_NAMES[String(item.paymentMethod || '').toLowerCase()] || item.paymentMethod}</td><td className="positive">{formatRupiah(item.total)}</td><td><button className="report-text-button" onClick={() => setReceipt(item)}>Lihat</button>{currentUserRole === 'owner' && <button className="report-icon-danger" onClick={() => window.confirm(`Batalkan transaksi ${item.receiptNumber}?`) && onVoidTransaction(item.id)}><Trash2 size={15} /></button>}</td></tr>)}</tbody></table></div> : <Empty title="Tidak ada transaksi" text="Ubah periode atau kata pencarian untuk melihat data lain." />;
const CashflowTable = ({ transactions, expenses, currentUserRole, onEdit, onDeleteExpense }) => { const rows = [...transactions.map(item => ({ ...item, kind: 'in', amount: number(item.total), title: `Penjualan ${item.receiptNumber}` })), ...expenses.map(item => ({ ...item, kind: 'out', amount: number(item.amount) }))].sort((a, b) => new Date(b.date) - new Date(a.date)); return rows.length ? <div className="cashflow-list">{rows.map(item => <article key={`${item.kind}-${item.id}`}><span className={item.kind}>{item.kind === 'in' ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}</span><div><b>{item.title}</b><small>{item.kind === 'in' ? PAYMENT_NAMES[String(item.paymentMethod || '').toLowerCase()] || item.paymentMethod : item.category} · {formatDateIndonesian(item.date)}</small>{item.note && <small>{item.note}</small>}{item.attachment && <a className="report-text-button" href={item.attachment} target="_blank" rel="noreferrer">Lihat nota: {item.attachmentName || 'lampiran'}</a>}</div><strong className={item.kind === 'in' ? 'positive' : 'negative'}>{item.kind === 'in' ? '+' : '-'}{formatRupiah(item.amount)}</strong>{item.kind === 'out' && currentUserRole === 'owner' && <><button className="report-text-button" onClick={() => onEdit(item)}>Edit</button><button className="report-icon-danger" onClick={() => window.confirm(`Hapus pengeluaran “${item.title}”?`) && onDeleteExpense(item.id)}><Trash2 size={15} /></button></>}</article>)}</div> : <Empty title="Arus kas belum ada" text="Catat transaksi atau pengeluaran untuk melihat arus kas." /> };
const ExpenseModal = ({ form, setForm, onClose, onSave, onReceiptChange }) => <div className="modal-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}><form className="modal-card expense-modal" onSubmit={onSave}><div className="modal-header"><div><h3>{form.id ? 'Ubah pengeluaran' : 'Catat pengeluaran'}</h3><p>Pengeluaran langsung masuk ke arus kas dan laporan laba.</p></div><button type="button" className="expense-modal-close" onClick={onClose}><X size={20} /></button></div><div className="modal-body expense-form"><Field full label="Keterangan"><input autoFocus required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Contoh: Beli gas dan air galon" /></Field><Field label="Jumlah"><div className="expense-money-input"><b>Rp</b><input required type="number" min="1" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} /></div></Field><Field label="Tanggal"><input required type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></Field><Field label="Kategori"><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{EXPENSE_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Dibayar dengan"><select value={form.paymentMethod} onChange={event => setForm({ ...form, paymentMethod: event.target.value })}><option value="cash">Tunai</option><option value="transfer">Transfer</option><option value="qris">QRIS</option><option value="debit">Kartu debit</option></select></Field><Field full label="Nota / bukti bayar (opsional)"><input type="file" accept="image/*" onChange={onReceiptChange} />{form.attachmentName && <small>{form.attachmentName}</small>}</Field><Field full label="Catatan (opsional)"><textarea rows="3" value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} /></Field></div><div className="modal-footer"><button type="button" className="expense-cancel" onClick={onClose}>Batal</button><button className="expense-save" type="submit"><Plus size={17} /> {form.id ? 'Simpan perubahan' : 'Simpan pengeluaran'}</button></div></form></div>;
const Field = ({ label, full, children }) => <label className={`expense-field ${full ? 'full' : ''}`}><span>{label}</span>{children}</label>;
