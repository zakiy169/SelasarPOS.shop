import React, { useRef } from 'react';
import { ImagePlus, ReceiptText, RotateCcw, Upload, X } from 'lucide-react';
import { DEFAULT_RECEIPT_SETTINGS, getReceiptSettings } from '../../utils/receipt';
import { SelasarLogo } from '../SelasarLogo';

export const ReceiptSettings = ({ appSettings, setAppSettings }) => {
  const uploadRef = useRef(null);
  const receipt = getReceiptSettings(appSettings);
  const update = (key, value) => setAppSettings(prev => ({ ...prev, receipt: { ...getReceiptSettings(prev), [key]: value } }));
  const uploadLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update('customLogo', reader.result);
      update('logoMode', 'custom');
    };
    reader.readAsDataURL(file);
  };
  const fieldStyle = { width: '100%', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' };

  return (
    <div className="receipt-settings-page">
      <div className="receipt-settings-heading">
        <div><h2>Editor Struk</h2><p>Atur tampilan yang dipakai preview, cetak browser, WhatsApp, dan thermal Bluetooth.</p></div>
        <button className="receipt-reset" onClick={() => setAppSettings(prev => ({ ...prev, receipt: DEFAULT_RECEIPT_SETTINGS }))}><RotateCcw size={15} /> Pulihkan default</button>
      </div>
      <div className="receipt-editor-layout">
        <section className="receipt-editor-panel">
          <div className="receipt-section-title"><ReceiptText size={19} /> Identitas pada struk</div>
          <label>Nama usaha<input style={fieldStyle} value={receipt.storeName} onChange={e => update('storeName', e.target.value)} /></label>
          <label>Alamat<textarea style={fieldStyle} rows="2" value={receipt.address} onChange={e => update('address', e.target.value)} /></label>
          <label>Kontak<input style={fieldStyle} value={receipt.phone} onChange={e => update('phone', e.target.value)} /></label>
          <label>Pesan penutup<input style={fieldStyle} value={receipt.footer} onChange={e => update('footer', e.target.value)} /></label>
          <label>Media sosial<input style={fieldStyle} value={receipt.social} onChange={e => update('social', e.target.value)} /></label>

          <div className="receipt-section-title"><ImagePlus size={19} /> Logo</div>
          <div className="receipt-logo-options">
            <button className={receipt.logoMode === 'selasar' ? 'selected' : ''} onClick={() => update('logoMode', 'selasar')}><SelasarLogo size="sm" variant="light" /></button>
            <button className={receipt.logoMode === 'custom' ? 'selected' : ''} onClick={() => uploadRef.current?.click()}>
              {receipt.customLogo ? <img src={receipt.customLogo} alt="Logo kustom" /> : <><Upload size={20} /> Upload logo</>}
            </button>
          </div>
          <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadLogo} />
          {receipt.customLogo && <button className="receipt-remove-logo" onClick={() => { update('customLogo', null); update('logoMode', 'selasar'); }}><X size={14} /> Hapus logo kustom</button>}

          <div className="receipt-section-title">Informasi yang ditampilkan</div>
          <div className="receipt-toggles">
            {[['showCustomer', 'Nama pelanggan'], ['showCashier', 'Nama kasir'], ['showTable', 'Meja / jenis pesanan'], ['showTax', 'Pajak'], ['showService', 'Service charge']].map(([key, label]) => (
              <label key={key}><input type="checkbox" checked={receipt[key]} onChange={e => update(key, e.target.checked)} /> <span>{label}</span></label>
            ))}
          </div>
        </section>
        <aside className="receipt-editor-preview">
          <span>PRATINJAU STRUK</span>
          <div className="receipt-mini-paper">
            <div className="receipt-brand-preview">{receipt.logoMode === 'custom' && receipt.customLogo ? <img src={receipt.customLogo} alt="Logo" /> : <SelasarLogo size="sm" variant="light" />}</div>
            <strong>{receipt.storeName}</strong><p>{receipt.address}</p><p>{receipt.phone}</p><hr />
            <div className="preview-row"><span>1x Es Kopi Susu</span><span>Rp 24.000</span></div><div className="preview-row"><span>Subtotal</span><span>Rp 24.000</span></div><div className="preview-row preview-total"><span>TOTAL</span><span>Rp 24.000</span></div><hr />
            <p>{receipt.footer}</p><p>{receipt.social}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};
