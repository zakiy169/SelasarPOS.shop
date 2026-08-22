import React, { useEffect, useRef, useState } from 'react';
import { Coffee, Delete, LockKeyhole, ShieldCheck } from 'lucide-react';
import { sounds } from '../../utils/audio';

export const LoginModal = ({ onLoginSuccess, currentUserRole, appSettings }) => {
  const [selectedRole, setSelectedRole] = useState(currentUserRole === 'owner' ? 'owner' : 'kasir');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const pinRef = useRef(null);
  const isOwner = selectedRole === 'owner';
  const roleName = isOwner ? 'Owner' : 'Pegawai / Kasir';
  const configuredPin = isOwner
    ? appSettings?.profile?.ownerPin
    : appSettings?.profile?.cashierPin;
  const validPin = String(configuredPin || (isOwner ? '8888' : '1234'));

  useEffect(() => { pinRef.current?.focus(); }, []);

  const addDigit = (digit) => {
    sounds.playBeep();
    setPinInput(prev => (prev.length < 4 ? `${prev}${digit}` : prev));
    setErrorMsg('');
  };

  const clearPin = () => {
    sounds.playBeep();
    setPinInput('');
    setErrorMsg('');
  };

  const submitPin = () => {
    if (pinInput === validPin) {
      sounds.playSuccessChime();
      onLoginSuccess(selectedRole);
      return;
    }
    sounds.playError();
    setErrorMsg('PIN belum sesuai. Coba lagi.');
    setPinInput('');
  };

  const handleKeyDown = (event) => {
    if (/^[0-9]$/.test(event.key)) addDigit(event.key);
    if (event.key === 'Backspace') setPinInput(prev => prev.slice(0, -1));
    if (event.key === 'Enter') submitPin();
  };

  return (
    <div className="pin-gate login-screen pin-campaign-gate">
      <section className="pin-campaign-shell" aria-label="Verifikasi PIN Selasar">
        <aside className="pin-campaign-poster" aria-hidden="true">
          <div className="pin-poster-top">
            <img src="/selasar-chunky-logo-v2.png?v=20260822-2" alt="" />
            <span>SHIFT&nbsp;&nbsp; · &nbsp;&nbsp;AKSES</span>
          </div>
          <span className="pin-poster-kicker"><i /> WORKSPACE KEDAI</span>
          <h1>SHIFT SIAP.<br /><em>LAYANI LEBIH CEPAT.</em></h1>
          <p>Kasir, dapur, stok, dan laporan bergerak dalam satu alur kerja.</p>
          <img className="pin-skater" src="/selasar-skateboard-courier.png" alt="" />
          <div className="pin-poster-pack">
            <Coffee />
            <strong>SELASAR</strong>
            <small>POS WORKSPACE</small>
          </div>
          <div className="pin-poster-badge"><b>QUICK</b><span>ACCESS</span></div>
        </aside>

        <div className="pin-card pin-campaign-card">
          <div className="pin-campaign-heading">
            <div className="pin-icon"><LockKeyhole size={21} /></div>
            <div><span>VERIFIKASI AKSES</span><strong>Selasar POS</strong></div>
            <ShieldCheck size={21} />
          </div>
          <div className="pin-card-body">
          <div className="pin-role-switcher" role="tablist" aria-label="Pilih akses">
            <button type="button" className={selectedRole === 'owner' ? 'active' : ''} onClick={() => { setSelectedRole('owner'); setPinInput(''); setErrorMsg(''); }}>
              <strong>Owner</strong><span>Akses penuh</span>
            </button>
            <button type="button" className={selectedRole === 'kasir' ? 'active' : ''} onClick={() => { setSelectedRole('kasir'); setPinInput(''); setErrorMsg(''); }}>
              <strong>Pegawai / Kasir</strong><span>Operasional harian</span>
            </button>
          </div>
          <div className="login-copy">
            <h2>Verifikasi {roleName}</h2>
            <p>Masukkan empat digit PIN untuk membuka workspace toko.</p>
          </div>

          <input ref={pinRef} className="pin-hidden-input" value={pinInput} onChange={() => {}} onKeyDown={handleKeyDown} inputMode="numeric" aria-label="PIN 4 digit" />
          <div className={`pin-dots ${errorMsg ? 'has-error' : ''}`} aria-live="polite">
            {[0, 1, 2, 3].map(index => <span key={index} className={pinInput.length > index ? 'filled' : ''} />)}
          </div>
          {errorMsg && <p className="pin-error">{errorMsg}</p>}

          <div className="pin-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
              <button type="button" key={number} onClick={() => addDigit(String(number))}>{number}</button>
            ))}
            <button type="button" className="pin-key-secondary" onClick={clearPin}><Delete size={16} /></button>
            <button type="button" onClick={() => addDigit('0')}>0</button>
            <button type="button" className="pin-key-confirm" onClick={submitPin}><ShieldCheck size={17} /></button>
          </div>
          <p className="pin-note"><ShieldCheck size={13} /> Akun Google terhubung · PIN diperlukan pada setiap sesi baru</p>
          </div>
        </div>
      </section>
    </div>
  );
};
