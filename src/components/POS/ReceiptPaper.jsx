import React from 'react';
import { formatReceiptDate, formatRupiah } from '../../utils/formatters';
import { getItemDetails, getItemQuantity, getItemTotal, getItemUnitPrice, getPaymentLabel, getReceiptSettings } from '../../utils/receipt';
import { SelasarLogo } from '../SelasarLogo';

export const ReceiptPaper = ({ transaction, appSettings = {}, preview = false }) => {
  const receipt = getReceiptSettings(appSettings);
  const showCashier = receipt.showCashier && transaction.cashierName;
  const showTable = receipt.showTable && transaction.tableName;
  const subtotal = Number(transaction.subtotal ?? (transaction.items || []).reduce((sum, item) => sum + getItemTotal(item), 0));
  const Logo = () => receipt.logoMode === 'custom' && receipt.customLogo
    ? <img className="receipt-custom-logo" src={receipt.customLogo} alt="Logo usaha" />
    : <SelasarLogo size="sm" variant="light" />;

  return <article className={`thermal-receipt ${preview ? 'receipt-live-preview' : ''}`} id={preview ? undefined : 'printable-receipt'} style={{ '--receipt-width': appSettings.printerWidth === '80mm' ? '80mm' : '58mm' }}>
    <header className="receipt-paper-header"><Logo /><strong>{receipt.storeName}</strong>{receipt.address && <p>{receipt.address}</p>}{receipt.phone && <p>{receipt.phone}</p>}</header>
    <div className="thermal-divider" />
    <div className="receipt-meta"><span>No. {transaction.receiptNumber || '-'}</span><span>{formatReceiptDate(transaction.date)}</span></div>
    {receipt.showCustomer && transaction.customerName && !/^pelanggan umum$/i.test(transaction.customerName) && <div className="receipt-meta"><span>Pelanggan: {transaction.customerName}</span></div>}
    {(showCashier || showTable) && <div className="receipt-meta"><span>{showCashier ? `Kasir: ${transaction.cashierName}` : ''}</span><span>{showTable ? (transaction.tableName || transaction.customerType) : ''}</span></div>}
    <div className="thermal-divider" />
    <div className="receipt-items">{(transaction.items || []).map((item, index) => { const quantity = getItemQuantity(item); const details = getItemDetails(item); return <div className="receipt-item" key={`${item.productId || item.name}-${index}`}><div><b>{quantity}x {item.name}</b><span>{formatRupiah(getItemTotal(item))}</span></div>{details.length > 0 && <small>{details.join(' | ')}</small>}{quantity > 1 && <small>{formatRupiah(getItemUnitPrice(item))} / item</small>}</div>; })}</div>
    <div className="thermal-divider" />
    <div className="receipt-calculations"><div><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>{receipt.showTax && Number(transaction.tax) > 0 && <div><span>Pajak PB1</span><span>{formatRupiah(transaction.tax)}</span></div>}{receipt.showService && Number(transaction.serviceCharge) > 0 && <div><span>Service charge</span><span>{formatRupiah(transaction.serviceCharge)}</span></div>}{Number(transaction.discount) > 0 && <div className="receipt-discount"><span>Diskon</span><span>-{formatRupiah(transaction.discount)}</span></div>}<div className="thermal-divider" /><div className="receipt-total"><b>TOTAL</b><b>{formatRupiah(transaction.total ?? subtotal)}</b></div><div><span>Pembayaran</span><b>{getPaymentLabel(transaction.paymentMethod)}</b></div>{String(transaction.paymentMethod || '').toLowerCase() === 'cash' && <><div><span>Diterima</span><span>{formatRupiah(transaction.cashReceived ?? transaction.total ?? subtotal)}</span></div>{Number(transaction.cashChange) > 0 && <div><span>Kembali</span><b>{formatRupiah(transaction.cashChange)}</b></div>}</>}</div>
    <div className="thermal-divider" />
    <footer className="receipt-paper-footer">{receipt.footer && <p>{receipt.footer}</p>}{receipt.social && <p>{receipt.social}</p>}</footer>
  </article>;
};
