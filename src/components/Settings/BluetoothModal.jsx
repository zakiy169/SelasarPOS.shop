import React, { useState } from 'react';
import { Printer, Bluetooth, X, CheckCircle, RefreshCw, Play, Wifi } from 'lucide-react';
import { bluetoothPrinter } from '../../utils/bluetoothPrinter';
import { sounds } from '../../utils/audio';

export const BluetoothModal = ({ onClose, onConnected }) => {
  const [loading, setLoading] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [deviceName, setDeviceName] = useState(bluetoothPrinter.deviceName || '');
  const [scanError, setScanError] = useState('');
  const [scanPhase, setScanPhase] = useState('idle'); // idle | scanning | found | connected

  const handleScan = async () => {
    setLoading(true);
    setScanPhase('scanning');
    setDiscoveredDevices([]);
    setScanError('');
    sounds.playBeep();

    // Always try native Web Bluetooth first (works on HTTPS or localhost)
    if (bluetoothPrinter.isSupported()) {
      try {
        const res = await bluetoothPrinter.scanAndConnect();
        if (res.success) {
          sounds.playSuccessChime();
          setDeviceName(res.deviceName);
          setScanPhase('connected');
          if (onConnected) onConnected(res.deviceName);
          setLoading(false);
          setTimeout(() => onClose(), 1200);
          return;
        }
      } catch (err) {
        console.info('[BT] Native scan ended:', err.name);
      }
    }

    setScanPhase('idle');
    setLoading(false);
    setScanError('Tidak ada printer BLE yang terhubung. Jika printer muncul sebagai COM/SPP di Bluetooth Windows, gunakan tombol Bluetooth klasik di bawah.');
  };

  const handleSerialScan = async () => {
    setLoading(true);
    setScanError('');
    try {
      const res = await bluetoothPrinter.scanAndConnectSerial();
      sounds.playSuccessChime();
      setDeviceName(res.deviceName);
      setScanPhase('connected');
      if (onConnected) onConnected(res.deviceName);
    } catch (err) {
      sounds.playError();
      setScanError(err.message || 'Koneksi Bluetooth klasik gagal.');
      setScanPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      sounds.playBeep();
      await bluetoothPrinter.printTestReceipt();
      alert('✅ Perintah tes cetak berhasil dikirim ke printer!');
    } catch (err) {
      sounds.playError();
      alert('Gagal tes cetak: ' + err.message);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothPrinter.disconnect();
    setDeviceName('');
    setDiscoveredDevices([]);
    setScanPhase('idle');
    sounds.playBeep();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', background: 'var(--bg-modal)', border: '1px solid var(--border-color)', borderRadius: '20px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bluetooth size={22} color="var(--apple-blue)" />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Koneksi Bluetooth Thermal Printer</h3>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>

          {/* ── CONNECTED STATE ── */}
          {(bluetoothPrinter.isConnected || scanPhase === 'connected') ? (
            <div style={{ textAlign: 'center', padding: '16px 10px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(52, 199, 89, 0.12)', color: 'var(--apple-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', border: '2px solid var(--apple-green)' }}>
                <CheckCircle size={36} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--apple-green)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>✓ Status: Terhubung</span>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginTop: '6px' }}>{deviceName || bluetoothPrinter.deviceName}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Siap menerima perintah cetak struk kasir ESC/POS.</p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                <button onClick={handleTestPrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 18px', borderRadius: '12px' }}>
                  <Play size={16} /> Tes Cetak Struk
                </button>
                <button onClick={handleDisconnect} style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--apple-red)', background: 'transparent', color: 'var(--apple-red)', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                  Putuskan Koneksi
                </button>
              </div>
            </div>

          ) : (
            <div>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <Printer size={44} color="var(--apple-blue)" style={{ marginBottom: '8px', opacity: 0.8 }} />
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Cari & Sambungkan Thermal Printer</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.5' }}>
                  Nyalakan Bluetooth HP / PC & Printer Thermal Kasir Anda, lalu klik tombol di bawah.
                </p>
              </div>

              {/* Scan Button */}
              <button
                onClick={handleScan}
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}
              >
                {loading ? <RefreshCw className="spin" size={18} /> : <Bluetooth size={18} />}
                <span>{loading ? 'Memindai Perangkat Bluetooth...' : 'Pindai Perangkat Bluetooth'}</span>
              </button>

              <button
                onClick={handleSerialScan}
                disabled={loading}
                style={{ width: '100%', marginTop: '8px', padding: '11px', borderRadius: '12px', border: '1px solid var(--apple-blue)', background: 'transparent', color: 'var(--apple-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <Wifi size={17} />
                <span>Pilih Bluetooth Klasik / COM (SPP)</span>
              </button>

              {scanError && (
                <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', color: 'var(--apple-red)', fontSize: '12px', lineHeight: '1.45' }}>
                  {scanError}
                </div>
              )}

              {/* Info banner shown after scan */}
              {scanPhase === 'found' && !loading && discoveredDevices.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(10, 132, 255, 0.08)',
                  border: '1px solid rgba(10, 132, 255, 0.2)',
                  fontSize: '12px',
                  color: 'var(--apple-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Wifi size={14} />
                  <span>Printer terdeteksi di sekitar. Pilih printer Anda dan klik <strong>Sambungkan</strong>.</span>
                </div>
              )}

              {/* In-App Device Selection List */}
              {discoveredDevices.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', letterSpacing: '0.5px' }}>
                    <span>PERANGKAT TERDETEKSI ({discoveredDevices.length})</span>
                    <span style={{ fontSize: '10px', color: 'var(--apple-green)', background: 'rgba(52, 199, 89, 0.12)', padding: '2px 8px', borderRadius: '8px' }}>● SIAP SAMBUNG</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    {discoveredDevices.map((dev, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectDevice(dev)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.18s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--apple-blue)';
                          e.currentTarget.style.background = 'var(--bg-card-hover)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.background = 'var(--bg-card)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(10, 132, 255, 0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Printer size={20} color="var(--apple-blue)" />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{dev.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {dev.type} • Sinyal: {dev.rssi} • {dev.address}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleSelectDevice(dev); }}
                          style={{ background: 'var(--apple-blue)', color: '#FFF', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Sambungkan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
