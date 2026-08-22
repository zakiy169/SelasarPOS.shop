import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Cloud,
  Coffee,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
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

  return (
    <div className="login-screen login-cinematic">
      <div className="login-cinematic-grain" aria-hidden="true" />
      <div className="login-cinematic-frame">
        <header className="login-cinematic-nav">
          <a className="login-cinematic-brand" href="#login-top" aria-label="Selasar POS">
            <img src="/selasar-chunky-logo-v2.png?v=20260822-2" alt="Selasar" />
          </a>
          <nav aria-label="Navigasi halaman masuk">
            <a href="#login-capabilities">Fitur</a>
            <a href="#login-security">Keamanan</a>
            <span><i /> Sistem siap</span>
          </nav>
          <button type="button" className="login-nav-action" onClick={handleGoogleLogin} disabled={isLoading}>
            Masuk <ArrowRight size={15} />
          </button>
        </header>

        <main id="login-top">
          <section className="login-cinematic-hero" aria-labelledby="login-title">
            <div className="login-hero-grid" aria-hidden="true" />
            <div className="login-float-object login-float-cup"><Coffee /></div>
            <div className="login-float-object login-float-receipt"><ReceiptText /></div>
            <div className="login-float-object login-float-bag"><ShoppingBag /></div>
            <div className="login-float-object login-float-order"><span>45</span><small>ORDER</small></div>
            <img className="login-skater-illustration" src="/selasar-skateboard-courier.png" alt="Kurir Selasar naik skateboard membawa pesanan" />

            <div className="login-mini-bar" aria-hidden="true">
              <span><Coffee size={14} /> Selasar Workspace</span>
              <i>Kasir</i><i>Dapur</i><i>Stok</i><b>Mulai shift</b>
            </div>

            <div className="login-cinematic-copy">
              <span className="login-trust-pill"><Sparkles size={14} /> Dibangun untuk ritme kedai Indonesia</span>
              <h1 id="login-title">Operasional kedai,<br /><em>dibuat mengalir.</em></h1>
              <p>Selasar menyatukan kasir, antrean dapur, stok, pelanggan, dan laporan dalam satu ruang kerja yang cepat dipahami seluruh tim.</p>

              <div className="login-cinematic-actions">
                <button type="button" className="login-google-primary" onClick={handleGoogleLogin} disabled={isLoading}>
                  <GoogleMark />
                  <span>{isLoading ? 'Menghubungkan akun...' : 'Masuk dengan Google'}</span>
                  <ArrowRight size={17} />
                </button>
                <a href="#login-capabilities">Lihat cara kerja</a>
              </div>

              <div className="login-hero-proof">
                <span><CheckCircle2 size={14} /> Setup singkat</span>
                <span><Cloud size={14} /> Sinkron otomatis</span>
                <span><ShieldCheck size={14} /> PIN berbasis peran</span>
              </div>
              {error && <div className="login-error login-cinematic-error"><AlertCircle size={15} /> {error}</div>}
            </div>
          </section>

          <section className="login-capabilities" id="login-capabilities" aria-labelledby="capabilities-title">
            <header>
              <div><span>SELASAR POS</span><h2 id="capabilities-title">Satu alur dari pesanan sampai laporan.</h2></div>
              <p>Dirancang agar owner mendapat kendali penuh dan kru tetap bisa bekerja cepat tanpa harus memahami sistem yang rumit.</p>
            </header>
            <div className="login-capability-grid">
              <article><span><Coffee /></span><small>01 · TRANSAKSI</small><h3>Kasir yang terasa ringan.</h3><p>Katalog visual, kategori cepat, keranjang terstruktur, dan pembayaran yang mudah dipahami saat kedai sedang ramai.</p></article>
              <article><span><ChefHat /></span><small>02 · OPERASIONAL</small><h3>Dapur tetap sinkron.</h3><p>Pesanan langsung terbaca tim dapur, status dapat diperbarui, dan setiap meja tetap berada dalam alur yang sama.</p></article>
              <article><span><BarChart3 /></span><small>03 · KENDALI</small><h3>Angka yang siap dibaca.</h3><p>Stok, shift, member, dan performa penjualan tersusun menjadi laporan yang jelas untuk keputusan harian.</p></article>
            </div>
          </section>

          <section className="login-security-note" id="login-security">
            <ShieldCheck />
            <div><span>AKSES AMAN & TERPISAH</span><h2>Satu akun organisasi, kontrol sesuai peran.</h2><p>Masuk dengan Google untuk menghubungkan organisasi. Setelah itu, akses Owner dan Kasir tetap dipisahkan menggunakan PIN operasional.</p></div>
            <button type="button" onClick={handleGoogleLogin} disabled={isLoading}>Mulai sekarang <ArrowRight size={16} /></button>
          </section>
        </main>

        <footer className="login-cinematic-footer">
          <span>© 2026 Selasar POS</span><span>Kasir · Dapur · Stok · Laporan</span><span>Dirancang untuk kerja yang lebih tenang.</span>
        </footer>
      </div>
    </div>
  );
};
