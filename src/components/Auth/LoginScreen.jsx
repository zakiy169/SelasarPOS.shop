import React, { useState } from 'react';
import { AlertCircle, ArrowRight, BarChart3, CheckCircle2, ChefHat, Cloud, Coffee, LayoutGrid, ReceiptText, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { SelasarLogo } from '../SelasarLogo';
import { sounds } from '../../utils/audio';

const GoogleMark = () => <span className="google-mark" aria-hidden="true">G</span>;

export const LoginScreen = ({ onGoogleLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await onGoogleLogin();
      sounds.playSuccessChime();
    } catch (loginError) {
      sounds.playError();
      setError(loginError.message || 'Google Login gagal. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return <div className="login-screen concept-login">
    <div className="concept-auth-bg" aria-hidden="true"><i /><i /><i /><i /></div>
    <header className="concept-login-header">
      <SelasarLogo size="md" variant="light" />
      <span><i /> Sistem siap digunakan</span>
    </header>

    <main className="concept-login-main">
      <section className="concept-login-hero">
        <div className="concept-login-copy">
          <span className="concept-eyebrow"><Sparkles size={14} /> POS yang terasa ringan</span>
          <h1>Kelola kedai dalam satu ruang kerja yang <em>lebih tenang.</em></h1>
          <p>Kasir, meja, dapur, stok, member, shift, dan laporan disusun untuk kerja harian yang cepat tanpa tampilan yang ramai.</p>
          <div className="concept-benefits">
            <span><CheckCircle2 size={15} /> Semua fitur dalam satu akun</span>
            <span><CheckCircle2 size={15} /> Sinkron antar perangkat</span>
            <span><CheckCircle2 size={15} /> Akses Owner dan Kasir</span>
          </div>
          {error && <div className="login-error"><AlertCircle size={15} /> {error}</div>}
          <button type="button" className="concept-google-button" onClick={handleGoogleLogin} disabled={isLoading}>
            <GoogleMark /><span>{isLoading ? 'Menghubungkan akun...' : 'Mulai dengan Google'}</span><ArrowRight size={18} />
          </button>
          <p className="concept-login-security"><ShieldCheck size={14} /> Login dilanjutkan dengan verifikasi PIN Owner atau Kasir.</p>
        </div>

        <div className="concept-app-preview" aria-label="Pratinjau Selasar POS">
          <article className="preview-phone preview-phone-left">
            <div className="preview-top"><Coffee size={17} /><span>Kasir</span><i /></div>
            <strong>Selamat datang!</strong><small>Siap menerima pesanan hari ini.</small>
            <div className="preview-search">Cari menu...</div>
            <div className="preview-product-grid"><span>Latte<b>Rp 18k</b></span><span>V60<b>Rp 15k</b></span><span>Risol<b>Rp 6k</b></span><span>Tea<b>Rp 8k</b></span></div>
            <div className="preview-nav"><Coffee /><ChefHat /><LayoutGrid /><Users /></div>
          </article>
          <article className="preview-phone preview-phone-center">
            <div className="preview-top"><BarChart3 size={17} /><span>Laporan</span><i /></div>
            <strong>Ringkasan usaha</strong><small>Hari ini, 20 transaksi</small>
            <div className="preview-kpi"><small>Omzet</small><b>Rp 1.240.000</b><span>+12,8%</span></div>
            <div className="preview-chart"><i /><i /><i /><i /><i /><i /></div>
            <div className="preview-row"><span>Arus kas</span><b>Rp 940k</b></div><div className="preview-row"><span>Pengeluaran</span><b>Rp 300k</b></div>
          </article>
          <article className="preview-phone preview-phone-right">
            <div className="preview-top"><ReceiptText size={17} /><span>Pesanan</span><i /></div>
            <strong>Pesanan baru</strong><small>Meja 06 • Dine-in</small>
            <div className="preview-order"><span>2× Vanilla Latte</span><b>Rp 36k</b></div><div className="preview-order"><span>1× Risol Mayo</span><b>Rp 6k</b></div>
            <div className="preview-total"><span>Total</span><b>Rp 42.000</b></div>
            <button type="button" tabIndex="-1">Proses pembayaran</button>
          </article>
        </div>
      </section>

      <section className="concept-feature-strip" aria-label="Fitur utama">
        <article><Coffee size={18} /><div><strong>Kasir cepat</strong><span>Pesanan sampai struk</span></div></article>
        <article><ChefHat size={18} /><div><strong>Dapur sinkron</strong><span>Status pesanan langsung</span></div></article>
        <article><Cloud size={18} /><div><strong>Cloud aman</strong><span>Data per organisasi</span></div></article>
        <article><BarChart3 size={18} /><div><strong>Laporan lengkap</strong><span>Omzet, laba, dan arus kas</span></div></article>
      </section>
    </main>
  </div>;
};
