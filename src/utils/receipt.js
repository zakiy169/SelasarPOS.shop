import { formatDateIndonesian, formatRupiah } from './formatters';

export const DEFAULT_RECEIPT_SETTINGS = {
  storeName: 'KEDAI KOPI SELASAR',
  address: 'Jl. Selasar Kopi No. 8, Bandung',
  phone: 'Telp/WA: 0812-3456-7890',
  footer: 'Terima kasih atas kunjungan Anda',
  social: 'Instagram @kedaikopi.selasar',
  logoMode: 'selasar',
  customLogo: null,
  showCustomer: true,
  showCashier: true,
  showTable: true,
  showTax: true,
  showService: true,
};

export const getReceiptSettings = (appSettings = {}) => ({
  ...DEFAULT_RECEIPT_SETTINGS,
  ...(appSettings.receipt || {}),
});

export const getItemUnitPrice = (item) => {
  if (Number.isFinite(item?.itemUnitPrice)) return item.itemUnitPrice;
  if (Number.isFinite(item?.price)) return item.price;
  if (Number.isFinite(item?.totalPrice) && item?.qty) return item.totalPrice / item.qty;
  return 0;
};

export const getItemTotal = (item) => {
  if (Number.isFinite(item?.totalPrice)) return item.totalPrice;
  return getItemUnitPrice(item) * (Number(item?.qty) || 0);
};

export const getItemDetails = (item) => [
  item?.variant,
  item?.sugar,
  item?.milk,
  ...(item?.extras || []).map(extra => extra.name),
  item?.notes,
].filter(Boolean);

export const getReceiptLines = (transaction, appSettings = {}) => {
  const settings = getReceiptSettings(appSettings);
  const lines = [];

  lines.push({ type: 'center', text: settings.storeName, strong: true });
  if (settings.address) lines.push({ type: 'center', text: settings.address });
  if (settings.phone) lines.push({ type: 'center', text: settings.phone });
  lines.push({ type: 'divider' });
  lines.push({ type: 'row', left: `No: ${transaction.receiptNumber}`, right: transaction.customerType });
  lines.push({ type: 'text', text: formatDateIndonesian(transaction.date) });
  if (settings.showCustomer && transaction.customerName) lines.push({ type: 'text', text: `Pelanggan: ${transaction.customerName}` });
  if (settings.showCashier || settings.showTable) {
    lines.push({
      type: 'row',
      left: settings.showCashier && transaction.cashierName ? `Kasir: ${transaction.cashierName}` : '',
      right: settings.showTable && transaction.tableName ? transaction.tableName : '',
    });
  }
  lines.push({ type: 'divider' });

  (transaction.items || []).forEach(item => {
    lines.push({ type: 'row', left: `${item.qty}x ${item.name}`, right: formatRupiah(getItemTotal(item)), strong: true });
    const details = getItemDetails(item);
    if (details.length) lines.push({ type: 'subtext', text: details.join(' | ') });
    lines.push({ type: 'subtext', text: `${formatRupiah(getItemUnitPrice(item))} / item` });
  });

  lines.push({ type: 'divider' });
  lines.push({ type: 'row', left: 'Subtotal', right: formatRupiah(transaction.subtotal) });
  if (settings.showTax && transaction.tax > 0) lines.push({ type: 'row', left: 'Pajak PB1', right: formatRupiah(transaction.tax) });
  if (settings.showService && transaction.serviceCharge > 0) lines.push({ type: 'row', left: 'Service charge', right: formatRupiah(transaction.serviceCharge) });
  if (transaction.discount > 0) lines.push({ type: 'row', left: 'Diskon', right: `-${formatRupiah(transaction.discount)}`, danger: true });
  lines.push({ type: 'divider' });
  lines.push({ type: 'row', left: 'TOTAL', right: formatRupiah(transaction.total), strong: true, total: true });
  lines.push({ type: 'row', left: 'Pembayaran', right: String(transaction.paymentMethod || '').toUpperCase(), strongRight: true });
  if (transaction.paymentMethod === 'cash') {
    lines.push({ type: 'row', left: 'Diterima', right: formatRupiah(transaction.cashReceived ?? transaction.total) });
    lines.push({ type: 'row', left: 'Kembali', right: formatRupiah(transaction.cashChange || 0), strongRight: true });
  }

  lines.push({ type: 'divider' });
  if (settings.footer) lines.push({ type: 'center', text: settings.footer });
  if (settings.social) lines.push({ type: 'center', text: settings.social });

  return lines;
};

export const createReceiptText = (transaction, appSettings = {}) => {
  return getReceiptLines(transaction, appSettings)
    .map(line => {
      if (line.type === 'divider') return '-----------------------------';
      if (line.type === 'row') return [line.left, line.right].filter(Boolean).join(': ');
      return line.text;
    })
    .filter(Boolean)
    .join('\n');
};
