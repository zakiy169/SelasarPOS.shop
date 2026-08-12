import React, { useState } from 'react';
import { X, Printer, Bluetooth, Share2, CheckCircle2 } from 'lucide-react';
import { formatDateIndonesian, formatRupiah } from '../../utils/formatters';
import { createReceiptText, getItemDetails, getItemTotal, getItemUnitPrice, getReceiptSettings } from '../../utils/receipt';
import { SelasarLogo } from '../SelasarLogo';
import { sounds } from '../../utils/audio';
import { bluetoothPrinter } from '../../utils/bluetoothPrinter';
import { BluetoothModal } from '../Settings/BluetoothModal';

export const ReceiptModal = ({ transaction, appSettings = {}, onClose }) => {
  const [showBtModal, setShowBtModal] = useState(false);
  const [printingStatus, setPrintingStatus] = useState('');
  if (!transaction) return null;
  const receipt = getReceiptSettings(appSettings);

  const printBluetooth = async () => {
    sounds.playBeep();
    if (!bluetoothPrinter.isConnected) return setShowBtModal(true);
    try {
      setPrintingStatus('Mencetak ke printer Bluetooth...');
      await bluetoothPrinter.printTransaction(transaction, appSettings);
      sounds.playSuccessChime();
      setPrintingStatus('Struk berhasil dicetak.');
    } catch (error) {
      sounds.playError();
      setPrintingStatus(`Gagal cetak: ${error.message}`);
    }
  };

  const shareWhatsApp = () => {
    sounds.playBeep();
    window.open(`https://wa.me/?text=${encodeURIComponent(createReceiptText(transaction, appSettings))}`, '_blank');
  };
  const Logo = () => receipt.logoMode === 'custom' && receipt.customLogo
    ? <img className="receipt-custom-logo" src={receipt.customLogo} alt="Logo usaha" />
    : <SelasarLogo size="sm" variant="light" />;
  const showCashierLine = receipt.showCashier && transaction.cashierName;
  const showTableLine = receipt.showTable && transaction.tableName;

  return <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card receipt-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="receipt-success-title"><CheckCircle2 size={20} /><h3>Transaksi Berhasil</h3></div>
          <button className="modal-close" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <div className="modal-body receipt-modal-body">
          {printingStatus && <div className={`receipt-print-status ${printingStatus.startsWith('Gagal') ? 'error' : ''}`}>{printingStatus}</div>}
          <article className="thermal-receipt" id="printable-receipt" style={{ '--receipt-width': appSettings.printerWidth === '80mm' ? '80mm' : '58mm' }}>
            <header className="receipt-paper-header"><Logo /><strong>{receipt.storeName}</strong>{receipt.address && <p>{receipt.address}</p>}{receipt.phone && <p>{receipt.phone}</p>}</header>
            <div className="thermal-divider" />
            <div className="receipt-meta"><span>No: {transaction.receiptNumber}</span><span>{transaction.customerType}</span></div>
            <div className="receipt-meta"><span>{formatDateIndonesian(transaction.date)}</span></div>
            {receipt.showCustomer && transaction.customerName && <div className="receipt-meta"><span>Pelanggan: {transaction.customerName}</span></div>}
            {(showCashierLine || showTableLine) && <div className="receipt-meta"><span>{showCashierLine ? `Kasir: ${transaction.cashierName}` : ''}</span><span>{showTableLine ? transaction.tableName : ''}</span></div>}
            <div className="thermal-divider" />
            <div className="receipt-items">{transaction.items.map((item, index) => <div className="receipt-item" key={`${item.productId || item.name}-${index}`}><div><b>{item.qty}x {item.name}</b><span>{formatRupiah(getItemTotal(item))}</span></div>{getItemDetails(item).length > 0 && <small>{getItemDetails(item).join(' | ')}</small>}<small>{formatRupiah(getItemUnitPrice(item))} / item</small></div>)}</div>
            <div className="thermal-divider" />
            <div className="receipt-calculations"><div><span>Subtotal</span><span>{formatRupiah(transaction.subtotal)}</span></div>{receipt.showTax && transaction.tax > 0 && <div><span>Pajak PB1</span><span>{formatRupiah(transaction.tax)}</span></div>}{receipt.showService && transaction.serviceCharge > 0 && <div><span>Service charge</span><span>{formatRupiah(transaction.serviceCharge)}</span></div>}{transaction.discount > 0 && <div className="receipt-discount"><span>Diskon</span><span>-{formatRupiah(transaction.discount)}</span></div>}<div className="thermal-divider" /><div className="receipt-total"><b>TOTAL</b><b>{formatRupiah(transaction.total)}</b></div><div><span>Pembayaran</span><b>{String(transaction.paymentMethod || '').toUpperCase()}</b></div>{transaction.paymentMethod === 'cash' && <><div><span>Diterima</span><span>{formatRupiah(transaction.cashReceived ?? transaction.total)}</span></div><div><span>Kembali</span><b>{formatRupiah(transaction.cashChange || 0)}</b></div></>}</div>
            <div className="thermal-divider" />
            <footer className="receipt-paper-footer">{receipt.footer && <p>{receipt.footer}</p>}{receipt.social && <p>{receipt.social}</p>}</footer>
          </article>
        </div>
        <div className="modal-footer receipt-actions"><button onClick={shareWhatsApp} className="receipt-action whatsapp"><Share2 size={15} /> WhatsApp</button><button onClick={printBluetooth} className="receipt-action primary"><Bluetooth size={15} /> {bluetoothPrinter.isConnected ? 'Cetak Bluetooth' : 'Sambungkan printer'}</button><button onClick={() => { sounds.playBeep(); window.print(); }} className="receipt-action"><Printer size={15} /> Cetak browser</button></div>
      </div>
    </div>
    {showBtModal && <BluetoothModal onClose={() => setShowBtModal(false)} onConnected={() => { setShowBtModal(false); setTimeout(printBluetooth, 300); }} />}
  </>;
};
