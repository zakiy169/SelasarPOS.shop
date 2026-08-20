import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Cloud, Coffee, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
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

  return (
    <div className="login-screen selasar-login">
      <div className="login-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="selasar-login-topbar">
        <SelasarLogo size="md" variant="light" />
        <span className="login-ready-status"><i /> Sistem operasional siap</span>
      </header>

      <main className="selasar-login-main">
        <section className="selasar-login-stage">
          <div className="selasar-login-copy">
            <span className="login-kicker"><Sparkles size={14} /> SELASAR WORKSPACE</span>
            <h1>Kerja kedai yang <em>lebih mengalir.</em></h1>
            <p>Satu ruang kerja untuk menerima pesanan, menjaga dapur tetap sinkron, dan menutup hari dengan angka yang jelas.</p>
            <div className="login-proof-points">
              <span><CheckCircle2 size={15} /> Kasir dan pesanan cepat</span>
              <span><Cloud size={15} /> Data tersinkron aman</span>
            </div>
            {error && <div className="login-error"><AlertCircle size={15} /> {error}</div>}
            <button type="button" className="selasar-google-button" onClick={handleGoogleLogin} disabled={isLoading}>
              <GoogleMark /><span>{isLoading ? 'Menghubungkan akun...' : 'Lanjut dengan Google'}</span><ArrowRight size={18} />
            </button>
            <p className="selasar-login-security"><ShieldCheck size={14} /> Berikutnya, pilih akses Owner atau Kasir dengan PIN.</p>
          </div>

          <div className="login-showcase" aria-label="Pratinjau Selasar POS">
            <span className="login-showcase-label label-one"><Coffee size={14} /> Kasir terhubung</span>
            <span className="login-showcase-label label-two"><TrendingUp size={14} /> +12,8% hari ini</span>
            <article className="login-order-card">
              <div className="login-card-top"><span className="login-card-mark"><Coffee size={18} /></span><div><small>KEDAI KOPI SELASAR</small><b>Pesanan berjalan</b></div><i /></div>
              <div className="login-card-heading"><div><span>MEJA 06 · DINE-IN</span><h2>Pesanan hari ini.</h2></div><strong>02</strong></div>
              <div className="login-order-list">
                <div><span className="login-order-icon">VL</span><p><b>Vanilla Latte</b><small>Es · Oat milk</small></p><strong>Rp18k</strong></div>
                <div><span className="login-order-icon warm">RM</span><p><b>Risol Mayo</b><small>Hangat · 1 porsi</small></p><strong>Rp6k</strong></div>
              </div>
              <div className="login-card-total"><span>Total sementara</span><b>Rp24.000</b></div>
              <div className="login-card-action"><span>Siap diproses</span><ArrowRight size={17} /></div>
            </article>
            <div className="login-sales-chip"><span>OMZET HARI INI</span><b>Rp 1.240.000</b><small><TrendingUp size={12} /> 20 transaksi</small></div>
          </div>
        </section>

        <section className="selasar-login-footer" aria-label="Keunggulan Selasar">
          <span><Coffee size={16} /> Kasir yang cepat</span>
          <span><Cloud size={16} /> Cloud per organisasi</span>
          <span><ShieldCheck size={16} /> Akses berbasis peran</span>
        </section>
      </main>
    </div>
  );
};
