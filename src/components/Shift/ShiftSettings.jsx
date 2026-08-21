import React, { useState, useEffect } from 'react';
import { KeyRound, Lock, DollarSign, Sliders, Edit3, UserCheck, X } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { sounds } from '../../utils/audio';

export const ShiftSettings = ({ 
  activeShift, 
  onOpenShift, 
  onUpdateShift,
  onCloseShift, 
  products = [], 
  transactions = [],
  expenses = [],
  onToggleProductAvailability,
  embedded = false
}) => {
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Form states for Shift
  const [baristaName, setBaristaName] = useState('');
  const [shiftType, setShiftType] = useState('Shift Pagi');
  const [openingCash, setOpeningCash] = useState('');
  const [closingPhysicalCash, setClosingPhysicalCash] = useState('');

  useEffect(() => {
    if (activeShift) {
      setBaristaName(activeShift.baristaName || '');
      setShiftType(activeShift.shiftType || 'Shift Pagi');
      setOpeningCash(activeShift.openingCash ?? '');
    }
  }, [activeShift]);

  const parseMoney = (value) => {
    if (value === '') return null;
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  };

  const openNewShiftModal = () => {
    setBaristaName('');
    setShiftType('Shift Pagi');
    setOpeningCash('');
    setShowOpenModal(true);
  };

  const openCloseShiftModal = () => {
    setClosingPhysicalCash('');
    setShowCloseModal(true);
  };

  const shiftStartedAt = activeShift ? new Date(activeShift.startTime || activeShift.createdAt || 0).getTime() : 0;
  const shiftTransactions = activeShift ? transactions.filter((tx) => {
    const txTime = new Date(tx.date || tx.createdAt || tx.timestamp || 0).getTime();
    const isVoid = String(tx.status || tx.paymentStatus || '').toLowerCase() === 'void';
    return Number.isFinite(txTime) && txTime >= shiftStartedAt && !isVoid;
  }) : [];
  const cashSales = shiftTransactions
    .filter((tx) => String(tx.paymentMethod || '').toLowerCase() === 'cash')
    .reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
  const cashExpenses = activeShift ? expenses.filter((expense) => {
    const expenseTime = new Date(expense.createdAt || expense.date || 0).getTime();
    return Number.isFinite(expenseTime)
      && expenseTime >= shiftStartedAt
      && String(expense.paymentMethod || '').toLowerCase() === 'cash';
  }).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) : 0;
  const expectedCash = (Number(activeShift?.openingCash) || 0) + cashSales - cashExpenses;

  const handleOpenShiftSubmit = (e) => {
    if (e) e.preventDefault();
    if (!baristaName.trim()) return alert('Harap isi nama pegawai / barista duty!');
    const normalizedOpeningCash = parseMoney(openingCash);
    if (normalizedOpeningCash === null) return alert('Modal kas awal harus berupa angka 0 atau lebih.');

    sounds.playCashRegister();
    const formattedShiftName = `${shiftType} (${baristaName.trim()})`;
    onOpenShift({
      id: `shift-${Date.now()}`,
      name: formattedShiftName,
      shiftType: shiftType,
      baristaName: baristaName.trim(),
      startTime: new Date().toISOString(),
      openingCash: normalizedOpeningCash
    });
    setShowOpenModal(false);
  };

  const handleEditShiftSubmit = (e) => {
    if (e) e.preventDefault();
    if (!baristaName.trim()) return alert('Harap isi nama pegawai / barista duty!');
    const normalizedOpeningCash = parseMoney(openingCash);
    if (normalizedOpeningCash === null) return alert('Modal kas awal harus berupa angka 0 atau lebih.');

    sounds.playBeep();
    const formattedShiftName = `${shiftType} (${baristaName.trim()})`;
    const updated = {
      ...activeShift,
      name: formattedShiftName,
      shiftType: shiftType,
      baristaName: baristaName.trim(),
      openingCash: normalizedOpeningCash
    };

    if (onUpdateShift) {
      onUpdateShift(updated);
    } else {
      onOpenShift(updated);
    }
    setShowEditModal(false);
  };

  const handleCloseShiftConfirm = () => {
    const physicalCash = parseMoney(closingPhysicalCash);
    if (physicalCash === null) return alert('Masukkan jumlah uang fisik di laci, minimal 0.');
    sounds.playCashRegister();
    onCloseShift({
      closingTime: new Date().toISOString(),
      physicalCash,
      cashSales,
      cashExpenses,
      expectedCash,
      cashDifference: physicalCash - expectedCash,
      transactionCount: shiftTransactions.length
    });
    setShowCloseModal(false);
  };

  return (
    <div className={`shift-page ${embedded ? 'is-embedded' : ''}`} style={{ padding: embedded ? '0' : '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {!embedded && <div className="shift-heading">
        <h2 style={{ fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <KeyRound size={26} color="var(--apple-blue)" />
          <span>Manajemen Shift Kasir & Rekonsiliasi Kas</span>
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Kelola nama pegawai barista duty, uang kas awal (cash drawer), penutupan shift, serta stok kasir
        </p>
      </div>}

      {/* Active Shift Info Card */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: activeShift ? 'var(--apple-green)' : 'var(--apple-red)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              • {activeShift ? 'SHIFT KASIR AKTIF SAAT INI' : 'SHIFT KASIR DITUTUP'}
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{activeShift ? (activeShift.shiftType || activeShift.name) : 'Belum Ada Shift Dibuka'}</span>
              {activeShift && (
                <button 
                  onClick={() => setShowEditModal(true)}
                  style={{ background: 'rgba(2, 132, 199, 0.1)', border: 'none', color: 'var(--apple-blue)', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  title="Edit Nama Barista / Shift"
                >
                  <Edit3 size={14} /> Edit Pegawai/Shift
                </button>
              )}
            </h3>
            
            {activeShift ? (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: '600' }}>
                  <UserCheck size={16} color="var(--apple-blue)" />
                  <span>Barista / Pegawai Duty: <strong>{activeShift.baristaName || activeShift.name}</strong></span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Modal Uang Kas Awal Drawer: <strong style={{ color: 'var(--apple-green)' }}>{formatRupiah(activeShift.openingCash || 0)}</strong>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Silakan tentukan barista duty dan uang kas awal laci sebelum memulai transaksi.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {activeShift ? (
              <>
                <button
                  onClick={() => { sounds.playBeep(); setShowEditModal(true); }}
                  className="btn-primary"
                  style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Edit3 size={16} />
                  <span>Edit Pegawai</span>
                </button>
                <button
                  onClick={() => { sounds.playBeep(); openCloseShiftModal(); }}
                  className="btn-primary"
                  style={{ background: 'var(--apple-red)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Lock size={16} />
                  <span>Tutup Shift Kasir</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => { sounds.playBeep(); openNewShiftModal(); }}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <DollarSign size={16} />
                <span>Buka Shift Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Quick Availability Editor */}
      <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--apple-blue)" />
          <span>Pengaturan Ketersediaan Menu & Stok Kasir</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {products.map((prod) => (
            <div
              key={prod.id}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{prod.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--apple-blue)', fontWeight: '600' }}>{formatRupiah(prod.price)}</div>
              </div>

              <button
                onClick={() => { sounds.playBeep(); if (onToggleProductAvailability) onToggleProductAvailability(prod.id); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: prod.isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: prod.isAvailable ? 'var(--apple-green)' : 'var(--apple-red)',
                  fontWeight: '700',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {prod.isAvailable ? 'Tersedia' : 'Habis (Sold Out)'}
              </button>
            </div>
          ))}

          {products.length === 0 && (
            <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Tidak ada data produk terdaftar.
            </div>
          )}
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="modal-overlay" onClick={() => setShowOpenModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="var(--apple-blue)" />
                <span>Buka Shift Kasir Baru</span>
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleOpenShiftSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                    NAMA PEGAWAI / BARISTA DUTY
                  </label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="Misal: Rian Barista, Zakiy, Dewi"
                    value={baristaName}
                    onChange={(e) => setBaristaName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                    NAMA / TIPE SHIFT
                  </label>
                  <select
                    className="apple-input"
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                  >
                    <option value="Shift Pagi">Shift Pagi</option>
                    <option value="Shift Sore">Shift Sore</option>
                    <option value="Shift Malam">Shift Malam</option>
                    <option value="Full Day Shift">Full Day Shift</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                    MODAL KAS AWAL DRAWER (RP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="apple-input"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowOpenModal(false)} 
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }}>
                  Konfirmasi & Buka Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Active Shift Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="var(--apple-blue)" />
                <span>Edit Detail Shift & Pegawai Duty</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditShiftSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                    NAMA PEGAWAI / BARISTA DUTY
                  </label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="Misal: Rian Barista, Zakiy, Dewi"
                    value={baristaName}
                    onChange={(e) => setBaristaName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                    NAMA / TIPE SHIFT
                  </label>
                  <select
                    className="apple-input"
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                  >
                    <option value="Shift Pagi">Shift Pagi</option>
                    <option value="Shift Sore">Shift Sore</option>
                    <option value="Shift Malam">Shift Malam</option>
                    <option value="Full Day Shift">Full Day Shift</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                    MODAL KAS AWAL DRAWER (RP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="apple-input"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)} 
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }}>
                  Simpan Perubahan Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Rekonsiliasi Tutup Shift Kasir</h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                <div>Pegawai Duty: <strong>{activeShift ? (activeShift.baristaName || activeShift.name) : '-'}</strong></div>
                <div>Modal Kas Awal: <strong>{formatRupiah(activeShift?.openingCash ?? 0)}</strong></div>
                <div>Penjualan Tunai Shift Ini: <strong>{formatRupiah(cashSales)}</strong></div>
                <div>Pengeluaran Tunai Shift Ini: <strong>-{formatRupiah(cashExpenses)}</strong></div>
                <div>Target Kas di Laci: <strong>{formatRupiah(expectedCash)}</strong></div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{shiftTransactions.length} transaksi sejak shift dibuka.</div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  HITUNG UANG FISIK DI DRAWER (RP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="apple-input"
                  value={closingPhysicalCash}
                  onChange={(e) => setClosingPhysicalCash(e.target.value)}
                  placeholder="Hitung lalu masukkan uang fisik"
                />
              </div>
              {closingPhysicalCash !== '' && parseMoney(closingPhysicalCash) !== null && (
                <div style={{ padding: '12px', borderRadius: '10px', background: parseMoney(closingPhysicalCash) - expectedCash === 0 ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', fontSize: '13px' }}>
                  Selisih kas: <strong>{formatRupiah(parseMoney(closingPhysicalCash) - expectedCash)}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Nilai positif berarti kas lebih, nilai negatif berarti kas kurang.</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowCloseModal(false)} 
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}
              >
                Batal
              </button>
              <button className="btn-primary" onClick={handleCloseShiftConfirm} style={{ padding: '10px 16px', fontSize: '13px' }}>
                Konfirmasi Tutup Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
