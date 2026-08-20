import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, ReceiptText, RotateCcw, Upload, X } from 'lucide-react';
import { DEFAULT_RECEIPT_SETTINGS, getReceiptSettings } from '../../utils/receipt';
import { ReceiptPaper } from '../POS/ReceiptPaper';
import { SelasarLogo } from '../SelasarLogo';

const RECEIPT_SAMPLE_TRANSACTION = {
  receiptNumber: 'SLSR-0001', date: new Date().toISOString(), customerType: 'Takeaway',
  customerName: 'Pelanggan Umum', cashierName: 'Kasir',
  items: [{ productId: 'sample', name: 'Es Kopi Susu', qty: 1, price: 24000 }],
  subtotal: 24000, tax: 0, serviceCharge: 0, discount: 0, total: 24000,
  paymentMethod: 'cash', cashReceived: 25000, cashChange: 1000,
};

export const ReceiptSettings = ({ appSettings, setAppSettings }) => {
  const uploadRef = useRef(null);
  const saveTimerRef = useRef(null);
  const dirtyRef = useRef(false);
  const draftRef = useRef(getReceiptSettings(appSettings));
  const [receipt, setReceipt] = useState(draftRef.current);

  const commit = (nextReceipt) => {
    clearTimeout(saveTimerRef.current);
    setAppSettings(previous => ({ ...previous, receipt: { ...getReceiptSettings(previous), ...nextReceipt } }));
    dirtyRef.current = false;
  };

  const update = (key, value, immediate = false) => {
    const next = { ...draftRef.current, [key]: value };
    draftRef.current = next;
    dirtyRef.current = true;
    setReceipt(next);
    clearTimeout(saveTimerRef.current);
    if (immediate) commit(next);
    else saveTimerRef.current = setTimeout(() => commit(next), 700);
  };

  useEffect(() => {
    if (dirtyRef.current) return;
    const incoming = getReceiptSettings(appSettings);
    if (JSON.stringify(incoming) !== JSON.stringify(draftRef.current)) {
      draftRef.current = incoming;
      setReceipt(incoming);
    }
  }, [appSettings]);

  useEffect(() => () => {
    clearTimeout(saveTimerRef.current);
    if (dirtyRef.current) {
      setAppSettings(previous => ({ ...previous, receipt: { ...getReceiptSettings(previous), ...draftRef.current } }));
      dirtyRef.current = false;
    }
  }, [setAppSettings]);

  const uploadLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...draftRef.current, customLogo: reader.result, logoMode: 'custom' };
      draftRef.current = next;
      setReceipt(next);
      commit(next);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const reset = () => {
    draftRef.current = { ...DEFAULT_RECEIPT_SETTINGS };
    setReceipt(draftRef.current);
    commit(draftRef.current);
  };
  const previewSettings = { ...appSettings, receipt };
  const fieldStyle = { width: '100%', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' };

  return <div className="receipt-settings-page" data-receipt-editor="true">
    <div className="receipt-settings-heading">
      <div><h2>Editor Struk</h2><p>Atur isi struk dan lihat bentuk cetaknya.</p></div>
      <button type="button" className="receipt-reset" onClick={reset}><RotateCcw size={15} /> Pulihkan default</button>
    </div>
    <div className="receipt-editor-layout">
      <section className="receipt-editor-panel">
        <div className="receipt-section-title"><ReceiptText size={19} /> Identitas pada struk</div>
        <label>Nama usaha<input style={fieldStyle} value={receipt.storeName} onChange={event => update('storeName', event.target.value)} /></label>
        <label>Alamat<textarea style={fieldStyle} rows="3" value={receipt.address} onChange={event => update('address', event.target.value)} /></label>
        <label>Kontak<input style={fieldStyle} value={receipt.phone} onChange={event => update('phone', event.target.value)} /></label>
        <label>Pesan penutup<input style={fieldStyle} value={receipt.footer} onChange={event => update('footer', event.target.value)} /></label>
        <label>Media sosial<input style={fieldStyle} value={receipt.social} onChange={event => update('social', event.target.value)} /></label>

        <div className="receipt-section-title"><ImagePlus size={19} /> Logo</div>
        <div className="receipt-logo-options">
          <button type="button" className={receipt.logoMode === 'selasar' ? 'selected' : ''} onClick={() => update('logoMode', 'selasar', true)}><SelasarLogo size="sm" variant="light" /></button>
          <button type="button" className={receipt.logoMode === 'custom' ? 'selected' : ''} onClick={() => uploadRef.current?.click()}>{receipt.customLogo ? <img src={receipt.customLogo} alt="Logo kustom" /> : <><Upload size={20} /> Upload logo</>}</button>
        </div>
        <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadLogo} />
        {receipt.customLogo && <button type="button" className="receipt-remove-logo" onClick={() => { const next = { ...draftRef.current, customLogo: null, logoMode: 'selasar' }; draftRef.current = next; setReceipt(next); commit(next); }}><X size={14} /> Hapus logo kustom</button>}

        <div className="receipt-section-title">Informasi yang ditampilkan</div>
        <div className="receipt-toggles">{[['showCustomer', 'Nama pelanggan'], ['showCashier', 'Nama kasir'], ['showTable', 'Meja / jenis pesanan'], ['showTax', 'Pajak'], ['showService', 'Service charge']].map(([key, label]) => <label key={key}><input type="checkbox" checked={receipt[key]} onChange={event => update(key, event.target.checked, true)} /> <span>{label}</span></label>)}</div>
      </section>
      <aside className="receipt-editor-preview">
        <div className="receipt-preview-heading"><span>PRATINJAU HASIL CETAK</span><small>{appSettings.printerWidth === '80mm' ? 'Kertas 80 mm' : 'Kertas 58 mm'}</small></div>
        <ReceiptPaper transaction={RECEIPT_SAMPLE_TRANSACTION} appSettings={previewSettings} preview />
      </aside>
    </div>
  </div>;
};
