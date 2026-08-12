import React, { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, LockKeyhole, Store, UserRound } from 'lucide-react';
import { SelasarLogo } from '../SelasarLogo';
import { sounds } from '../../utils/audio';

const digitsOnly = (value) => value.replace(/\D/g, '');

export const OnboardingScreen = ({ authenticatedUser, appSettings, onComplete }) => {
  const profile = appSettings?.profile || {};
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [ownerName, setOwnerName] = useState(profile.ownerName || authenticatedUser?.name || '');
  const [ownerPin, setOwnerPin] = useState(profile.ownerPin || '');
  const [cashierPin, setCashierPin] = useState(profile.cashierPin || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const checklist = useMemo(() => [
    'Tentukan nama usaha',
    'Buat PIN Owner',
    'Buat PIN Kasir',
    'Database mulai kosong',
    'Buka shift awal',
  ], []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedBusinessName = businessName.trim();
    const trimmedOwnerName = ownerName.trim();
    const normalizedOwnerPin = digitsOnly(ownerPin);
    const normalizedCashierPin = digitsOnly(cashierPin);

    if (!trimmedBusinessName) {
      setError('Nama usaha wajib diisi.');
      return;
    }
    if (!trimmedOwnerName) {
      setError('Nama owner / admin wajib diisi.');
      return;
    }
    if (normalizedOwnerPin.length < 4) {
      setError('PIN Owner minimal 4 digit.');
      return;
    }
    if (normalizedCashierPin.length < 4) {
      setError('PIN Kasir minimal 4 digit.');
      return;
    }

    setSaving(true);
    setError('');
    sounds.playSuccessChime();
    onComplete({
      profile: {
        businessName: trimmedBusinessName,
        ownerName: trimmedOwnerName,
        ownerPin: normalizedOwnerPin,
        cashierPin: normalizedCashierPin,
      },
      receipt: {
        storeName: trimmedBusinessName.toUpperCase(),
      },
    });
  };

  return (
    <div className="login-screen login-welcome onboarding-screen">
      <div className="macos-wallpaper" aria-hidden="true">
        <div className="macos-wallpaper-orb orb-blue" />
        <div className="macos-wallpaper-orb orb-sky" />
        <div className="macos-wallpaper-orb orb-lilac" />
        <div className="macos-wallpaper-grain" />
      </div>

      <main className="onboarding-stage">
        <section className="onboarding-card" aria-label="Setup akun baru">
          <div className="onboarding-sidebar">
            <div className="onboarding-brand">
              <SelasarLogo size="md" variant="light" />
            </div>

            <div className="onboarding-copy">
              <p className="macos-overline">AKUN BARU</p>
              <h1>Siapkan toko sebelum masuk ke POS.</h1>
              <p>Akun baru perlu identitas toko dan PIN akses dulu. Data menu, stok, member, meja, dan transaksi dibuat kosong dari awal.</p>
            </div>

            <div className="onboarding-user">
              {authenticatedUser?.avatarUrl ? <img src={authenticatedUser.avatarUrl} alt="Profil Google" /> : <div className="onboarding-avatar-fallback"><UserRound size={18} /></div>}
              <div>
                <strong>{authenticatedUser?.name || 'Pengguna Google'}</strong>
                <span>{authenticatedUser?.email || 'Email tidak tersedia'}</span>
              </div>
            </div>
          </div>

          <form className="onboarding-panel" onSubmit={handleSubmit}>
            <div className="onboarding-panel-inner">
              <div className="onboarding-header">
                <div className="onboarding-icon"><LockKeyhole size={22} /></div>
                <p className="macos-overline">LANGKAH PERTAMA</p>
                <h2>Identitas dan PIN toko</h2>
                <p>Ini hanya diisi sekali untuk akun baru. Setelah selesai, workspace toko dibuat terpisah dari akun lain.</p>
              </div>

              <div className="onboarding-fields">
                <label>
                  <span><Store size={14} /> Nama usaha</span>
                  <input
                    className="apple-input"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="Contoh: Kedai Kopi Selasar"
                    autoComplete="organization"
                  />
                </label>
                <label>
                  <span><UserRound size={14} /> Nama owner / admin</span>
                  <input
                    className="apple-input"
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    placeholder="Contoh: Daffa"
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span><BadgeCheck size={14} /> PIN Owner</span>
                  <input
                    className="apple-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={12}
                    value={ownerPin}
                    onChange={(event) => setOwnerPin(digitsOnly(event.target.value))}
                    placeholder="Minimal 4 digit"
                    autoComplete="new-password"
                  />
                </label>
                <label>
                  <span><BadgeCheck size={14} /> PIN Kasir</span>
                  <input
                    className="apple-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={12}
                    value={cashierPin}
                    onChange={(event) => setCashierPin(digitsOnly(event.target.value))}
                    placeholder="Minimal 4 digit"
                    autoComplete="new-password"
                  />
                </label>
              </div>

              {error && <div className="login-error">{error}</div>}

              <div className="onboarding-checklist">
                {checklist.map((item) => <span key={item}>{item}</span>)}
              </div>

              <button type="submit" className="onboarding-submit" disabled={saving}>
                {saving ? 'Menyimpan setup...' : 'Simpan dan lanjut ke PIN'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};
