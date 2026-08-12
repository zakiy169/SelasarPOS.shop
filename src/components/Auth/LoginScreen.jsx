import React, { useState } from 'react';
import { AlertCircle, ArrowUpRight, BarChart3, Cloud, Coffee, Gauge, LockKeyhole, ShieldCheck, Sparkles, Users } from 'lucide-react';
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
    <div className="login-screen login-welcome macos-login">
      <div className="macos-wallpaper" aria-hidden="true"><div className="macos-wallpaper-orb orb-blue" /><div className="macos-wallpaper-orb orb-sky" /><div className="macos-wallpaper-orb orb-lilac" /><div className="macos-wallpaper-grain" /></div>

      <header className="macos-menubar">
        <div className="macos-menu-left"><span className="apple-mark">●</span><strong>Selasar</strong><span>File</span><span>Edit</span><span>View</span><span>Window</span><span>Help</span></div>
        <div className="macos-menu-right"><span className="menu-signal">●●●</span><span>Wi-Fi</span><span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>
      </header>

      <main className="macos-login-stage">
        <section className="macos-login-window" aria-label="Jendela login Selasar POS">
          <div className="macos-titlebar">
            <div className="traffic-lights"><i /><i /><i /></div>
            <span>Selasar POS</span>
            <div className="titlebar-spacer" />
          </div>
          <div className="macos-window-content">
            <aside className="macos-login-sidebar">
              <div className="macos-sidebar-brand"><SelasarLogo size="md" variant="light" /></div>
              <div className="macos-sidebar-copy">
                <p className="macos-overline">KEDAI KOPI SELASAR</p>
                <h1>Ruang kerja yang terasa ringan.</h1>
                <p>Semua yang dibutuhkan kedai untuk melayani, mengatur, dan tumbuh.</p>
              </div>
              <div className="macos-sidebar-status"><span /> Sistem siap digunakan</div>
            </aside>

            <div className="macos-login-panel">
              <div className="macos-login-panel-inner">
                <div className="macos-login-icon"><LockKeyhole size={23} /></div>
                <p className="macos-overline">SELASAR WORKSPACE</p>
                <h2>Masuk untuk memulai</h2>
                <p className="macos-login-description">Gunakan akun Google Anda untuk mengakses workspace toko.</p>
                {error && <div className="login-error"><AlertCircle size={14} /> {error}</div>}
                <button type="button" className="macos-google-button" onClick={handleGoogleLogin} disabled={isLoading}>
                  <GoogleMark /><span>{isLoading ? 'Menghubungkan akun...' : 'Lanjutkan dengan Google'}</span><ArrowUpRight size={16} />
                </button>
                <div className="macos-login-rule"><span /> atau <span /></div>
                <div className="macos-login-note"><ShieldCheck size={14} /><span>Setelah login, PIN Owner atau Pegawai diperlukan untuk membuka aplikasi.</span></div>
              </div>
              <p className="macos-panel-footer">Dengan masuk, data toko akan tersinkron aman di cloud.</p>
            </div>
          </div>
        </section>

        <div className="macos-login-highlights">
          <span><Coffee size={14} /> Kasir lebih cepat</span><span><Cloud size={14} /> Cloud lintas perangkat</span><span><BarChart3 size={14} /> Laporan lebih jelas</span>
        </div>

        <section className="macos-login-story" aria-label="Tentang Selasar POS">
          <div className="macos-story-header">
            <p className="macos-overline">TENTANG APLIKASI</p>
            <h2>Selasar POS dibuat untuk kerja harian yang rapi, cepat, dan tetap terasa premium.</h2>
            <p>
              Ini bukan sekadar layar kasir. Selasar dirancang sebagai workspace operasional untuk kedai kopi dan usaha F&B,
              dengan alur login yang aman, data cloud per organisasi, dan tampilan yang tetap tenang saat dipakai setiap hari.
            </p>
          </div>

          <div className="macos-story-grid">
            <article className="macos-story-card">
              <div className="macos-story-icon"><Coffee size={18} /></div>
              <h3>Kasir yang ringkas</h3>
              <p>Pesanan, meja, member, add-on, dan pembayaran disusun supaya barista atau kasir bisa bergerak cepat tanpa UI yang ramai.</p>
            </article>
            <article className="macos-story-card">
              <div className="macos-story-icon"><Cloud size={18} /></div>
              <h3>Cloud per toko</h3>
              <p>Setiap akun Google mendapat organisasi sendiri, jadi data toko tidak bercampur antar pengguna dan bisa dibuka dari perangkat lain.</p>
            </article>
            <article className="macos-story-card">
              <div className="macos-story-icon"><ShieldCheck size={18} /></div>
              <h3>Akses bertingkat</h3>
              <p>Login Google tetap dilanjutkan PIN Owner atau Kasir, supaya akses ke aplikasi dan pengaturan tidak terbuka sembarangan.</p>
            </article>
            <article className="macos-story-card">
              <div className="macos-story-icon"><BarChart3 size={18} /></div>
              <h3>Laporan yang jelas</h3>
              <p>Laporan harian, mingguan, bulanan, dan tahunan dibuat supaya pemilik bisa baca performa toko dengan cepat.</p>
            </article>
          </div>

          <div className="macos-story-columns">
            <div className="macos-story-panel">
              <p className="macos-story-label">KENAPA DIBUAT</p>
              <h3>Supaya operasional terasa tenang, bukan ribet.</h3>
              <p>
                Banyak aplikasi POS terasa seperti form lama yang dipindah ke browser. Selasar dibangun dengan pendekatan
                yang lebih modern: halaman login yang bersih, onboarding akun baru, data cloud, dan pembatasan akses yang jelas.
              </p>
              <p>
                Saat toko bertambah ramai, UI tetap harus terbaca. Karena itu setiap layar dibuat dengan hierarki visual yang
                tegas, ruang kosong yang cukup, dan animasi yang tidak berlebihan.
              </p>
            </div>

            <div className="macos-story-panel">
              <p className="macos-story-label">ALUR PEMAKAIAN</p>
              <div className="macos-story-timeline">
                <div><span>1</span><p>Masuk dengan akun Google yang sudah diizinkan.</p></div>
                <div><span>2</span><p>Jika akun baru, isi nama toko dan buat PIN terlebih dahulu.</p></div>
                <div><span>3</span><p>Buka shift lalu mulai transaksi, stok, dan laporan.</p></div>
                <div><span>4</span><p>Data tetap sinkron ke cloud untuk perangkat lain.</p></div>
              </div>
            </div>
          </div>

          <div className="macos-story-footer">
            <div><Sparkles size={15} /><span>Clean interface</span></div>
            <div><Gauge size={15} /><span>Responsif saat dipakai harian</span></div>
            <div><Users size={15} /><span>Siap multi user / multi device</span></div>
          </div>
        </section>
      </main>

      <nav className="macos-dock" aria-label="Fitur Selasar POS">
        <div><span className="dock-icon dock-coffee"><Coffee size={17} /></span><small>Kasir</small></div>
        <div><span className="dock-icon dock-cloud"><Cloud size={17} /></span><small>Cloud</small></div>
        <div><span className="dock-icon dock-chart"><BarChart3 size={17} /></span><small>Laporan</small></div>
        <div><span className="dock-icon dock-lock"><ShieldCheck size={17} /></span><small>Aman</small></div>
      </nav>
    </div>
  );
};
