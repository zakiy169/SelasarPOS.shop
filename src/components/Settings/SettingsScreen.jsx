import React, { useState, useEffect, useRef } from 'react';
import {
  Printer, QrCode, Percent, UploadCloud, Bluetooth,
  CheckCircle2, Palette, Type, Info, Mail, AtSign, UserRound, KeyRound, Trash2, Plus, Trash
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { bluetoothPrinter } from '../../utils/bluetoothPrinter';
import { AddonsManager } from './AddonsManager';
import { ShiftSettings } from '../Shift/ShiftSettings';

const THEMES = [
  { id: 'light',    label: 'Light',     desc: 'Putih bersih',         swatch: ['#F8FAFC', '#FFFFFF', '#0284C7'] },
  { id: 'dark',     label: 'Dark',      desc: 'Graphite macOS',       swatch: ['#1C1C1E', '#2C2C2E', '#0A84FF'] },
  { id: 'espresso', label: 'Espresso',  desc: 'Cokelat kopi hangat',  swatch: ['#1A1210', '#261E1B', '#C8975A'] },
  { id: 'warm',     label: 'Warm',      desc: 'Krem siang hari',      swatch: ['#FDFAF4', '#FFF8EF', '#B45309'] },
];

const FONTS = [
  { id: 'jakarta',  label: 'Plus Jakarta Sans', desc: 'Default - modern round' },
  { id: 'system',   label: 'SF Pro / System',   desc: 'macOS system font, crisp' },
  { id: 'inter',    label: 'Inter',              desc: 'Clean & neutral, perfect readability' },
];

export const SettingsScreen = ({ appSettings, setAppSettings, addons, setAddons, theme, setTheme, onOpenBluetoothModal, onOpenReceiptSettings, activeShift, onOpenShift, onUpdateShift, onCloseShift, products, onToggleProductAvailability, onResetOrganizationData, authenticatedUser, activeOrganizationId }) => {
  const fileInputRef = useRef(null);
  const [btDeviceName, setBtDeviceName] = useState(bluetoothPrinter.deviceName || '');
  const [btConnected, setBtConnected] = useState(bluetoothPrinter.isConnected);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('tampilan');
  const bannerImageInputRef = useRef(null);

  useEffect(() => {
    const syncBt = () => {
      setBtConnected(bluetoothPrinter.isConnected);
      setBtDeviceName(bluetoothPrinter.deviceName);
    };
    window.addEventListener('selasar_bt_status_change', syncBt);
    return () => window.removeEventListener('selasar_bt_status_change', syncBt);
  }, []);

  const handleChange = (key, value) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleChange('qrisImage', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = () => {
    sounds.playSuccessChime();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const currentFont = appSettings.font || 'jakarta';
  const profile = { businessName: 'Kedai Kopi Selasar', ownerName: 'Owner', ownerPin: '8888', cashierPin: '1234', ...(appSettings.profile || {}) };
  const updateProfile = (key, value) => setAppSettings(prev => ({ ...prev, profile: { ...profile, ...(prev.profile || {}), [key]: value } }));
  const resetOrganizationData = () => {
    if (!window.confirm('Reset semua data toko ini? Produk, stok, meja, member, transaksi, add-on, dan shift akan dikosongkan di Supabase.')) return;
    onResetOrganizationData?.();
    sounds.playSuccessChime();
  };
  const promoSlides = Array.isArray(appSettings.promoSlides) ? appSettings.promoSlides : [];
  const updatePromoSlide = (index, key, value) => handleChange('promoSlides', promoSlides.map((slide, i) => i === index ? { ...slide, [key]: value } : slide));
  const addPromoSlide = () => handleChange('promoSlides', [...promoSlides, { id: `promo-${Date.now()}`, tag: 'PROMO', title: 'MENU BARU', subtitle: 'Tulis penawaran', description: 'Keterangan promo', image: '', badge: 'BARU' }]);
  const removePromoSlide = (index) => handleChange('promoSlides', promoSlides.filter((_, i) => i !== index));
  const handleBannerImageUpload = (event) => {
    const file = event.target.files?.[0]; const index = Number(event.target.dataset.index); event.target.value = '';
    if (!file || !Number.isInteger(index)) return;
    if (!file.type.startsWith('image/')) return alert('Pilih file gambar.');
    if (file.size > 2 * 1024 * 1024) return alert('Ukuran gambar maksimal 2 MB.');
    const reader = new FileReader(); reader.onload = () => updatePromoSlide(index, 'image', String(reader.result || '')); reader.readAsDataURL(file);
  };

  return (
    <div className="settings-page">
      {/* Page Header */}
      <header className="settings-hero">
        <div>
          <p className="settings-kicker">SISTEM KEDAI</p>
          <h2>Pengaturan aplikasi</h2>
          <p>Tampilan, printer, QRIS, add-on, biaya, dan akses usaha dalam satu ruang kerja.</p>
        </div>
        <button
          onClick={saveSettings}
          className={`settings-save-button ${saved ? 'is-saved' : ''}`}
        >
          {saved ? <><CheckCircle2 size={18} /> Tersimpan!</> : 'Simpan Pengaturan'}
        </button>
      </header>

      <nav className="settings-section-nav" aria-label="Kategori pengaturan">
        {[['tampilan', 'Tampilan & akun'], ['operasional', 'Operasional'], ['pembayaran', 'Pembayaran & perangkat'], ['sistem', 'Sistem']].map(([id, label]) => <button key={id} type="button" className={activeSection === id ? 'active' : ''} onClick={() => setActiveSection(id)}>{label}</button>)}
        <button type="button" onClick={onOpenReceiptSettings}>Editor struk</button>
      </nav>
      <div className="settings-stack">
        {activeSection === 'tampilan' && <>

        {/* ── Appearance: Theme ── */}
        <section className="settings-surface">
          <h3 className="settings-surface-title">
            <Palette size={20} color="var(--apple-blue)" /> Tema Tampilan
          </h3>
          <div className="settings-theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => { sounds.playBeep(); setTheme(t.id); }}
                style={{
                  padding: '14px 10px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                  border: `2px solid ${theme === t.id ? 'var(--apple-blue)' : 'var(--border-color)'}`,
                  background: theme === t.id ? 'rgba(2,132,199,0.06)' : 'var(--bg-main)',
                  transition: 'all 0.2s', position: 'relative'
                }}
              >
                {/* Color swatches */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                  {t.swatch.map((c, i) => (
                    <div key={i} style={{ width: '22px', height: '22px', borderRadius: '6px', background: c, border: '1px solid rgba(0,0,0,0.08)' }} />
                  ))}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{t.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.desc}</div>
                {theme === t.id && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'var(--apple-blue)', borderRadius: '50%', width: '18px', height: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <CheckCircle2 size={12} color="#FFF" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-surface promo-editor">
          <div className="promo-editor-heading">
            <div><span className="promo-editor-icon"><Palette size={19} /></span><div><h3>Banner promo kasir</h3><p>Kelola konten banner yang berputar otomatis di halaman kasir.</p></div></div>
            <button type="button" className="promo-editor-add" onClick={addPromoSlide}><Plus size={16} /> Tambah slide</button>
          </div>
          <input ref={bannerImageInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleBannerImageUpload} style={{ display: 'none' }} />
          <div className="promo-editor-list">
            {promoSlides.map((slide, index) => <article className="promo-editor-card" key={slide.id || index}>
              <div className="promo-editor-card-head"><div><span>{String(index + 1).padStart(2, '0')}</span><div><b>Slide {index + 1}</b><small>{slide.title || 'Banner tanpa judul'}</small></div></div><button type="button" onClick={() => removePromoSlide(index)} disabled={promoSlides.length === 1} title="Hapus slide"><Trash2 size={15} /><span>Hapus</span></button></div>
              <div className="promo-editor-upload">
                <div className="promo-editor-preview">{slide.image ? <img src={slide.image} alt={`Preview ${slide.title || `slide ${index + 1}`}`} /> : <div><span>SELASAR</span><b>{slide.title || 'PROMO'}</b><small>Preview placeholder</small></div>}<i>{slide.badge || 'PROMO'}</i></div>
                <button type="button" onClick={() => { bannerImageInputRef.current.dataset.index = index; bannerImageInputRef.current.click(); }}><UploadCloud size={15} /> {slide.image ? 'Ganti foto' : 'Unggah foto'}</button>
                {slide.image && <button className="promo-editor-remove-image" type="button" onClick={() => updatePromoSlide(index, 'image', '')}>Hapus foto</button>}
                <small>JPG, PNG, atau WebP · maks. 2 MB</small>
              </div>
              <div className="promo-editor-grid">
                <label><span>Label kecil</span><input className="apple-input" value={slide.tag || ''} onChange={e => updatePromoSlide(index, 'tag', e.target.value)} placeholder="Contoh: PROMO HARI INI" /></label>
                <label><span>Badge harga</span><input className="apple-input" value={slide.badge || ''} onChange={e => updatePromoSlide(index, 'badge', e.target.value)} placeholder="Contoh: −20%" /></label>
                <label className="promo-editor-full"><span>Judul utama</span><input className="apple-input" value={slide.title || ''} onChange={e => updatePromoSlide(index, 'title', e.target.value)} placeholder="Contoh: KOPI SELASAR" /></label>
                <label><span>Subjudul</span><input className="apple-input" value={slide.subtitle || ''} onChange={e => updatePromoSlide(index, 'subtitle', e.target.value)} placeholder="Contoh: Aren · Fresh Milk" /></label>
                <label><span>Deskripsi singkat</span><input className="apple-input" value={slide.description || ''} onChange={e => updatePromoSlide(index, 'description', e.target.value)} placeholder="Contoh: Racikan spesial hari ini" /></label>
              </div>
            </article>)}
          </div>
        </section>

        <div className="settings-account-card">
          <div className="settings-card-heading"><UserRound size={20} /> Profil Usaha &amp; Akses</div>
          <div className="settings-google-account">
            {authenticatedUser?.avatarUrl ? <img src={authenticatedUser.avatarUrl} alt="Profil Google" /> : <UserRound size={20} />}
            <div><strong>{authenticatedUser?.name || 'Pengguna Google'}</strong><span>{authenticatedUser?.email || 'Email tidak tersedia'}</span><small>ID toko: {activeOrganizationId ? `${activeOrganizationId.slice(0, 8)}…` : '-'}</small></div>
            <em title={activeOrganizationId}>Google terhubung</em>
          </div>
          <div className="settings-account-grid">
            <label>Nama usaha<input className="apple-input" value={profile.businessName} onChange={event => updateProfile('businessName', event.target.value)} /></label>
            <label>Nama pemilik / admin<input className="apple-input" value={profile.ownerName} onChange={event => updateProfile('ownerName', event.target.value)} /></label>
            <label><KeyRound size={14} /> PIN Owner<input className="apple-input" type="password" inputMode="numeric" maxLength="12" value={profile.ownerPin} onChange={event => updateProfile('ownerPin', event.target.value)} /></label>
            <label><KeyRound size={14} /> PIN Kasir<input className="apple-input" type="password" inputMode="numeric" maxLength="12" value={profile.cashierPin} onChange={event => updateProfile('cashierPin', event.target.value)} /></label>
          </div>
          <p>PIN baru langsung dipakai saat login berikutnya. Gunakan minimal 4 angka agar akses lebih aman.</p>
        </div>

        {/* ── Appearance: Font ── */}
        <section className="settings-surface">
          <h3 className="settings-surface-title">
            <Type size={20} color="var(--apple-blue)" /> Pilihan Font / Tipografi
          </h3>
          <div className="settings-font-grid">
            {FONTS.map(f => (
              <button
                key={f.id}
                onClick={() => { sounds.playBeep(); handleChange('font', f.id); }}
                style={{
                  padding: '12px 18px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                  border: `2px solid ${currentFont === f.id ? 'var(--apple-blue)' : 'var(--border-color)'}`,
                  background: currentFont === f.id ? 'rgba(2,132,199,0.06)' : 'var(--bg-main)',
                  transition: 'all 0.2s', flex: 1, minWidth: '180px'
                }}
              >
                <div style={{
                  fontSize: '15px', fontWeight: '700',
                  fontFamily: f.id === 'system' ? '-apple-system, BlinkMacSystemFont, sans-serif'
                    : f.id === 'inter' ? "'Inter', sans-serif"
                    : "'Plus Jakarta Sans', sans-serif"
                }}>
                  {f.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{f.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Add-ons Manager ── */}
        </>}
        {activeSection === 'operasional' && <>
        <AddonsManager addons={addons} setAddons={setAddons} />

        <div className="settings-subsection">
          <ShiftSettings
            activeShift={activeShift}
            onOpenShift={onOpenShift}
            onUpdateShift={onUpdateShift}
            onCloseShift={onCloseShift}
            products={products}
            onToggleProductAvailability={onToggleProductAvailability}
            embedded
          />
        </div>

        {/* ── Printer ── */}
        </>}
        {activeSection === 'pembayaran' && <>
        <section className="settings-surface">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '700' }}>
              <Printer size={20} color="var(--apple-blue)" /> Koneksi Thermal Printer Kasir
            </h3>
            <button
              onClick={() => { sounds.playBeep(); if (onOpenBluetoothModal) onOpenBluetoothModal(); }}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Bluetooth size={16} /> Hubungkan Printer Bluetooth
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Status Koneksi Printer</label>
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: btConnected ? 'var(--apple-green)' : 'var(--apple-red)' }} />
                <span>{btConnected ? `Terhubung (${btDeviceName})` : 'Belum Terhubung'}</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Lebar Kertas Struk</label>
              <select className="apple-input" value={appSettings.printerWidth} onChange={e => handleChange('printerWidth', e.target.value)}>
                <option value="58mm">58mm (Printer Kasir Standard Portable)</option>
                <option value="80mm">80mm (Printer Kasir Besar)</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── QRIS ── */}
        <section className="settings-surface">
          <h3 className="settings-surface-title">
            <QrCode size={20} color="var(--apple-blue)" /> Barcode QRIS &amp; E-Wallet Toko
          </h3>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
                Unggah barcode QRIS statis toko. Gambar ini otomatis muncul saat kasir memproses pembayaran QRIS.
              </p>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600' }}
              >
                <UploadCloud size={18} /> Unggah Gambar QRIS Statis
              </button>
            </div>
            {appSettings.qrisImage && (
              <div style={{ width: '130px', height: '130px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', padding: '6px' }}>
                <img src={appSettings.qrisImage} alt="QRIS" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            )}
          </div>
        </section>

        {/* ── Tax & Service Charge ── */}
        <section className="settings-surface">
          <h3 className="settings-surface-title">
            <Percent size={20} color="var(--apple-blue)" /> Biaya Operasional (Tax &amp; Service Charge)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Pajak Restoran / PB1 (%)</label>
              <input type="number" min="0" max="100" step="0.1" className="apple-input" value={appSettings.taxPercent ?? 0} onChange={e => handleChange('taxPercent', e.target.value)} onBlur={e => handleChange('taxPercent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Service Charge (%)</label>
              <input type="number" min="0" max="100" step="0.1" className="apple-input" value={appSettings.serviceChargePercent ?? 0} onChange={e => handleChange('serviceChargePercent', e.target.value)} onBlur={e => handleChange('serviceChargePercent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
            </div>
          </div>
        </section>

        </>}
        {activeSection === 'sistem' && <>
        <div className="app-info-card">
          <div className="app-info-icon"><Info size={20} /></div>
          <div>
            <h3>Info Aplikasi</h3>
            <p>Selasar POS dibuat dan dikembangkan oleh Fida Umz.</p>
            <div className="app-info-links">
              <a href="mailto:fidaumz@gmail.com"><Mail size={15} /> fidaumz@gmail.com</a>
              <a href="https://instagram.com/fdsmdz" target="_blank" rel="noreferrer"><AtSign size={15} /> @fdsmdz</a>
            </div>
          </div>
        </div>

        <div className="settings-danger-card">
          <div>
            <h3>Reset Data Toko</h3>
            <p>Mengosongkan data organisasi aktif di perangkat ini dan Supabase. Pengaturan toko tetap dipertahankan.</p>
          </div>
          <button type="button" onClick={resetOrganizationData}><Trash2 size={15} /> Reset Semua Data</button>
        </div>
        </>}
      </div>

    </div>
  );
};
