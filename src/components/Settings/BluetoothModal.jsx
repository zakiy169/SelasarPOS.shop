import React, { useState } from 'react';
import { Bluetooth, CheckCircle, Play, Printer, RefreshCw, X } from 'lucide-react';
import { bluetoothPrinter } from '../../utils/bluetoothPrinter';
import { sounds } from '../../utils/audio';

export const BluetoothModal = ({ onClose, onConnected }) => {
  const [loading, setLoading] = useState(false);
  const [deviceName, setDeviceName] = useState(bluetoothPrinter.deviceName || '');
  const [scanError, setScanError] = useState('');
  const [scanPhase, setScanPhase] = useState('idle');

  const handleScan = async () => {
    setLoading(true);
    setScanPhase('scanning');
    setScanError('');
    sounds.playBeep();

    if (bluetoothPrinter.isSupported()) {
      try {
        const result = await bluetoothPrinter.scanAndConnect();
        if (result.success) {
          sounds.playSuccessChime();
          setDeviceName(result.deviceName);
          setScanPhase('connected');
          onConnected?.(result.deviceName);
          setLoading(false);
          setTimeout(() => onClose(), 1200);
          return;
        }
      } catch (scanFailure) {
        console.info('[BT] Native scan ended:', scanFailure.name);
      }
    }

    setScanPhase('idle');
    setLoading(false);
    setScanError('Tidak ada printer Bluetooth yang terhubung. Nyalakan printer dan Bluetooth perangkat, lalu coba pindai kembali.');
  };

  const testPrint = async () => {
    try {
      sounds.playBeep();
      await bluetoothPrinter.printTestReceipt();
      alert('✅ Perintah tes cetak berhasil dikirim ke printer!');
    } catch (printError) {
      sounds.playError();
      alert(`Gagal tes cetak: ${printError.message}`);
    }
  };

  const disconnect = async () => {
    await bluetoothPrinter.disconnect();
    setDeviceName('');
    setScanError('');
    setScanPhase('idle');
    sounds.playBeep();
  };

  const connected = bluetoothPrinter.isConnected || scanPhase === 'connected';

  return <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
    <div className="modal-card" onClick={event => event.stopPropagation()} style={{ maxWidth: '500px', background: 'var(--bg-modal)', border: '1px solid var(--border-color)', borderRadius: '20px' }}>
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Bluetooth size={22} color="var(--apple-blue)" /><h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Koneksi Bluetooth Thermal Printer</h3></div>
        <button type="button" onClick={onClose} className="modal-close" aria-label="Tutup"><X size={18} /></button>
      </div>

      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
        {connected ? <div style={{ textAlign: 'center', padding: '16px 10px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(52, 199, 89, 0.12)', color: 'var(--apple-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '2px solid var(--apple-green)' }}><CheckCircle size={36} /></div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--apple-green)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>✓ Status: Terhubung</span>
          <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginTop: '6px' }}>{deviceName || bluetoothPrinter.deviceName}</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Siap menerima perintah cetak struk kasir ESC/POS.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button type="button" onClick={testPrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 18px', borderRadius: '12px' }}><Play size={16} /> Tes Cetak Struk</button>
            <button type="button" onClick={disconnect} style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--apple-red)', background: 'transparent', color: 'var(--apple-red)', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Putuskan Koneksi</button>
          </div>
        </div> : <div>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Printer size={44} color="var(--apple-blue)" style={{ marginBottom: '8px', opacity: 0.8 }} />
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Cari & Sambungkan Thermal Printer</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.5' }}>Nyalakan Bluetooth HP / PC & Printer Thermal Kasir Anda, lalu klik tombol di bawah.</p>
          </div>
          <button type="button" onClick={handleScan} disabled={loading} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}>
            {loading ? <RefreshCw className="spin" size={18} /> : <Bluetooth size={18} />}
            <span>{loading ? 'Memindai Perangkat Bluetooth...' : 'Pindai Perangkat Bluetooth'}</span>
          </button>
          {scanError && <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', color: 'var(--apple-red)', fontSize: '12px', lineHeight: '1.45' }}>{scanError}</div>}
        </div>}
      </div>
    </div>
  </div>;
};
