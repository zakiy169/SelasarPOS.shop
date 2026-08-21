import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, Banknote, CreditCard, Wallet, CheckCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';

export const PaymentModal = ({ grandTotal, cartItems, customerType, tableName, qrisImage, onClose, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('qris'); // 'qris' | 'cash' | 'card' | 'ewallet'
  const [cashReceived, setCashReceived] = useState('');
  const [selectedBank, setSelectedBank] = useState('BCA');
  const [selectedEwallet, setSelectedEwallet] = useState('GoPay');
  const discountAmount = 0;
  const [isProcessing, setIsProcessing] = useState(false);

  const finalPayable = Math.max(0, grandTotal - discountAmount);
  const numericCashReceived = cashReceived === '' ? Number.NaN : Number(cashReceived);
  const cashDifference = Number.isFinite(numericCashReceived) ? numericCashReceived - finalPayable : null;
  const cashChange = Math.max(0, cashDifference || 0);
  const quickCashOptions = [...new Set([
    finalPayable,
    Math.ceil(finalPayable / 10000) * 10000,
    Math.ceil(finalPayable / 50000) * 50000,
    Math.ceil(finalPayable / 100000) * 100000
  ])].filter((amount) => amount >= finalPayable);

  const handleQuickCash = (amount) => {
    sounds.playBeep();
    setCashReceived(amount);
  };

  const handleProcessPayment = () => {
    if (paymentMethod === 'cash' && (!Number.isFinite(numericCashReceived) || numericCashReceived < finalPayable)) {
      sounds.playError();
      alert('Nominal uang tunai kurang dari total tagihan!');
      return;
    }

    setIsProcessing(true);
    sounds.playCashRegister();

    // Trigger confetti victory effect
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0046AD', '#E52320', '#10B981', '#F59E0B']
    });

    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess({
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? numericCashReceived : finalPayable,
        cashChange: paymentMethod === 'cash' ? cashChange : 0,
        bankName: paymentMethod === 'card' ? selectedBank : null,
        ewalletName: paymentMethod === 'ewallet' ? selectedEwallet : null,
        discount: discountAmount,
        finalTotal: finalPayable
      });
    }, 600);
  };

  return createPortal((
    <div className="modal-overlay payment-overlay" onClick={onClose}>
      <div className="modal-card payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Pembayaran Transaksi</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {customerType} • {tableName || 'Takeaway'} • {cartItems.length} Item
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div className="modal-body">
          {/* Total Amount Header */}
          <div className="payment-total-panel" style={{
            background: 'linear-gradient(135deg, rgba(0, 71, 173, 0.12) 0%, rgba(229, 35, 32, 0.08) 100%)',
            border: '1px solid var(--selasar-blue)',
            borderRadius: '16px',
            padding: '16px 20px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              TOTAL PEMBAYARAN
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', margin: '4px 0' }}>
              {formatRupiah(finalPayable)}
            </h2>
          </div>

          {/* Payment Method Selector Grid */}
          <div className="payment-grid">
            {[
              { id: 'qris', name: 'QRIS Statis/Dinamis', icon: QrCode, desc: 'BCA, Mandiri, Gopay, OVO' },
              { id: 'cash', name: 'Uang Tunai (Cash)', icon: Banknote, desc: 'Hitung kembalian cepat' },
              { id: 'card', name: 'Kartu Debit/Kredit', icon: CreditCard, desc: 'Mesin EDC Bank' },
              { id: 'ewallet', name: 'E-Wallet Direct', icon: Wallet, desc: 'GoPay, ShopeePay, DANA' }
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <div
                  key={method.id}
                  className={`payment-method-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => { sounds.playBeep(); setPaymentMethod(method.id); }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--selasar-red)' : 'var(--bg-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? '#FFF' : 'var(--text-muted)'
                  }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800' }}>{method.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{method.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Payment Method View */}
          {paymentMethod === 'qris' && (
            <div className="payment-qris-panel" style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--apple-blue)' }}>QRIS KEDAI KOPI SELASAR</div>
              <div style={{
                position: 'relative',
                padding: '12px',
                border: '3px solid var(--selasar-red)',
                borderRadius: '12px',
                background: '#FFF'
              }}>
                <img 
                  src={qrisImage || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=KEDAI_KOPI_SELASAR_PAYMENT_${finalPayable}`} 
                  alt="QRIS Code" 
                  style={{ width: '160px', height: '160px', objectFit: 'contain' }}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Scan QRIS di atas menggunakan GoPay, OVO, Dana, ShopeePay, Mobile Banking BCA/Mandiri.
              </p>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  UANG DITERIMA (RP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Masukkan uang yang diterima"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--selasar-blue)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '18px',
                    fontWeight: '800',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Quick Cash Options */}
              <div className="cash-quick-grid">
                {quickCashOptions.map((amt) => (
                  <button key={amt} className="cash-quick-btn" onClick={() => handleQuickCash(amt)}>
                    {amt === finalPayable ? 'Uang Pas' : formatRupiah(amt)}
                  </button>
                ))}
              </div>

              {/* Change Calculation */}
              <div style={{
                background: cashDifference !== null && cashDifference >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${cashDifference !== null && cashDifference >= 0 ? '#10B981' : '#EF4444'}`,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '4px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{cashDifference === null ? 'Uang diterima belum diisi' : cashDifference >= 0 ? 'Uang Kembalian:' : 'Uang Masih Kurang:'}</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: cashDifference !== null && cashDifference >= 0 ? '#10B981' : '#EF4444' }}>
                  {cashDifference === null ? '-' : formatRupiah(Math.abs(cashDifference))}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>PILIH MESIN EDC BANK</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {['BCA', 'Mandiri', 'BRI', 'BNI'].map((bank) => (
                  <button
                    key={bank}
                    onClick={() => { sounds.playBeep(); setSelectedBank(bank); }}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${selectedBank === bank ? 'var(--selasar-blue)' : 'var(--border-color)'}`,
                      background: selectedBank === bank ? 'var(--selasar-blue)' : 'var(--bg-card)',
                      color: selectedBank === bank ? '#FFF' : 'var(--text-main)',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === 'ewallet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>E-WALLET PROVIDER</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {['GoPay', 'OVO', 'ShopeePay', 'DANA'].map((ewallet) => (
                  <button
                    key={ewallet}
                    onClick={() => { sounds.playBeep(); setSelectedEwallet(ewallet); }}
                    style={{
                      padding: '12px 6px',
                      borderRadius: '10px',
                      border: `1.5px solid ${selectedEwallet === ewallet ? 'var(--selasar-red)' : 'var(--border-color)'}`,
                      background: selectedEwallet === ewallet ? 'var(--selasar-red)' : 'var(--bg-card)',
                      color: selectedEwallet === ewallet ? '#FFF' : 'var(--text-main)',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {ewallet}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="checkout-btn" onClick={handleProcessPayment} disabled={isProcessing}>
            {isProcessing ? (
              <span>Memproses Pembayaran...</span>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Konfirmasi Lunas • {formatRupiah(finalPayable)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
};
