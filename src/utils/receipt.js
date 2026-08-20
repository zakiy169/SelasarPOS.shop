import { formatReceiptDate, formatRupiah } from './formatters.js';

export const DEFAULT_RECEIPT_SETTINGS = {
  storeName: 'KEDAI KOPI SELASAR',
  address: '',
  phone: '',
  footer: 'Terima kasih atas kunjungan Anda',
  social: '',
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
  const unitPrice = Number(item?.itemUnitPrice);
  const price = Number(item?.price);
  const totalPrice = Number(item?.totalPrice);
  const quantity = getItemQuantity(item);
  if (Number.isFinite(unitPrice)) return unitPrice;
  if (Number.isFinite(price)) return price;
  if (Number.isFinite(totalPrice) && quantity > 0) return totalPrice / quantity;
  return 0;
};

export const getItemQuantity = (item) => Math.max(0, Number(item?.qty ?? item?.quantity) || 0);

export const getItemTotal = (item) => {
  const totalPrice = Number(item?.totalPrice);
  if (Number.isFinite(totalPrice)) return totalPrice;
  return getItemUnitPrice(item) * getItemQuantity(item);
};

export const getItemDetails = (item) => [
  item?.variant,
  item?.sugar && !/^100%\s*normal$/i.test(item.sugar) ? item.sugar : null,
  item?.milk && !/^regular\s*milk$/i.test(item.milk) ? item.milk : null,
  ...(item?.extras || []).map(extra => extra.name),
  item?.notes,
].filter(Boolean);

const PAYMENT_LABELS = { cash: 'Tunai', qris: 'QRIS', card: 'Kartu/EDC', ewallet: 'E-Wallet', transfer: 'Transfer' };
export const getPaymentLabel = (method) => PAYMENT_LABELS[String(method || '').toLowerCase()] || String(method || '-');

export const getReceiptLines = (transaction, appSettings = {}) => {
  const settings = getReceiptSettings(appSettings);
  const lines = [];
  const items = transaction.items || [];
  const subtotal = Number(transaction.subtotal ?? items.reduce((sum, item) => sum + getItemTotal(item), 0)) || 0;

  lines.push({ type: 'center', text: settings.storeName, strong: true });
  if (settings.address) lines.push({ type: 'center', text: settings.address });
  if (settings.phone) lines.push({ type: 'center', text: settings.phone });
  lines.push({ type: 'divider' });
  lines.push({ type: 'row', left: `No. ${transaction.receiptNumber || '-'}`, right: formatReceiptDate(transaction.date) });
  if (settings.showCustomer && transaction.customerName && !/^pelanggan umum$/i.test(transaction.customerName)) lines.push({ type: 'text', text: `Pelanggan: ${transaction.customerName}` });
  if (settings.showCashier || settings.showTable) {
    lines.push({
      type: 'row',
      left: settings.showCashier && transaction.cashierName ? `Kasir: ${transaction.cashierName}` : '',
      right: settings.showTable ? (transaction.tableName || transaction.customerType || '') : '',
    });
  }
  lines.push({ type: 'divider' });

  items.forEach(item => {
    const quantity = getItemQuantity(item);
    lines.push({ type: 'row', left: `${quantity}x ${item.name}`, right: formatRupiah(getItemTotal(item)), strong: true });
    const details = getItemDetails(item);
    if (details.length) lines.push({ type: 'subtext', text: details.join(' | ') });
    if (quantity > 1) lines.push({ type: 'subtext', text: `${formatRupiah(getItemUnitPrice(item))} / item` });
  });

  lines.push({ type: 'divider' });
  lines.push({ type: 'row', left: 'Subtotal', right: formatRupiah(subtotal) });
  if (settings.showTax && transaction.tax > 0) lines.push({ type: 'row', left: 'Pajak PB1', right: formatRupiah(transaction.tax) });
  if (settings.showService && transaction.serviceCharge > 0) lines.push({ type: 'row', left: 'Service charge', right: formatRupiah(transaction.serviceCharge) });
  if (transaction.discount > 0) lines.push({ type: 'row', left: 'Diskon', right: `-${formatRupiah(transaction.discount)}`, danger: true });
  lines.push({ type: 'divider' });
  lines.push({ type: 'row', left: 'TOTAL', right: formatRupiah(transaction.total ?? subtotal), strong: true, total: true });
  lines.push({ type: 'row', left: 'Pembayaran', right: getPaymentLabel(transaction.paymentMethod), strongRight: true });
  if (String(transaction.paymentMethod || '').toLowerCase() === 'cash') {
    lines.push({ type: 'row', left: 'Diterima', right: formatRupiah(transaction.cashReceived ?? transaction.total ?? subtotal) });
    if (Number(transaction.cashChange) > 0) lines.push({ type: 'row', left: 'Kembali', right: formatRupiah(transaction.cashChange), strongRight: true });
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
