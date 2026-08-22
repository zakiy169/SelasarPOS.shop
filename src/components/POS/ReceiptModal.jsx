import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Bluetooth, Share2 } from 'lucide-react';
import { createReceiptText } from '../../utils/receipt';
import { ReceiptPaper } from './ReceiptPaper';
import { sounds } from '../../utils/audio';
import { bluetoothPrinter } from '../../utils/bluetoothPrinter';
import { BluetoothModal } from '../Settings/BluetoothModal';

export const ReceiptModal = ({ transaction, appSettings = {}, onClose }) => {
  const [showBtModal, setShowBtModal] = useState(false);
  const [printingStatus, setPrintingStatus] = useState('');
  if (!transaction) return null;

  const printBluetooth = async () => {
    sounds.playBeep();
    if (!bluetoothPrinter.isConnected) return setShowBtModal(true);
    try {
      setPrintingStatus('Mencetak ke printer Bluetooth...');
      const receiptElement = document.getElementById('printable-receipt');
      await bluetoothPrinter.printReceiptPreview(receiptElement, appSettings);
      sounds.playSuccessChime();
      setPrintingStatus('');
    } catch (error) {
      sounds.playError();
      setPrintingStatus(`Gagal cetak: ${error.message}`);
    }
  };

  const shareWhatsApp = () => {
    sounds.playBeep();
    window.open(`https://wa.me/?text=${encodeURIComponent(createReceiptText(transaction, appSettings))}`, '_blank');
  };
  const printBrowser = () => {
    sounds.playBeep();
    const root = document.documentElement;
    const previousWidth = root.style.getPropertyValue('--active-receipt-width');
    root.style.setProperty('--active-receipt-width', appSettings.printerWidth === '80mm' ? '80mm' : '58mm');
    const restore = () => {
      if (previousWidth) root.style.setProperty('--active-receipt-width', previousWidth);
      else root.style.removeProperty('--active-receipt-width');
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
    setTimeout(restore, 1500);
  };

  return createPortal(<>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card receipt-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="receipt-success-title"><h3>Struk {transaction.receiptNumber}</h3></div>
          <button className="modal-close" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <div className="modal-body receipt-modal-body">
          {printingStatus.startsWith('Gagal') && <div className="receipt-print-status error">{printingStatus}</div>}
          <ReceiptPaper transaction={transaction} appSettings={appSettings} />
        </div>
        <div className="modal-footer receipt-actions"><button onClick={shareWhatsApp} className="receipt-action whatsapp"><Share2 size={15} /> Kirim</button><button onClick={printBluetooth} className="receipt-action primary"><Bluetooth size={15} /> {printingStatus ? 'Mencetak…' : bluetoothPrinter.isConnected ? 'Cetak' : 'Hubungkan'}</button><button onClick={printBrowser} className="receipt-action"><Printer size={15} /> PDF/Browser</button></div>
      </div>
    </div>
    {showBtModal && <BluetoothModal onClose={() => setShowBtModal(false)} onConnected={() => { setShowBtModal(false); setTimeout(printBluetooth, 300); }} />}
  </>, document.body);
};
