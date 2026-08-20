import React, { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

// Presentation-only scene. The transaction has already been recorded before
// this component appears; continuing simply hands control to the receipt view.
export const TransactionSuccessScreen = ({ transaction, onContinue }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 520);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className={`transaction-success-scene ${ready ? 'is-ready' : ''}`} role="dialog" aria-modal="true" aria-label="Pembayaran berhasil">
      <div className="success-orb success-orb-one" aria-hidden="true" />
      <div className="success-orb success-orb-two" aria-hidden="true" />
      <div className="success-topline"><span>SElASAR</span><i>Transaksi selesai</i></div>
      <div className="success-content">
        <div className="success-check"><Check size={46} strokeWidth={3} /></div>
        <p className="success-kicker">PEMBAYARAN DITERIMA</p>
        <h1>Pesanan<br />berhasil.</h1>
        <p className="success-copy">{transaction?.paymentMethod === 'cash' ? 'Uang tunai telah dicatat dan kembalian telah dihitung.' : 'Pembayaran tercatat. Pesanan diteruskan ke dapur.'}</p>
        <strong className="success-total">{formatRupiah(transaction?.total || 0)}</strong>
        <div className="success-meta"><span>{transaction?.receiptNumber}</span><span>{transaction?.tableName || 'Takeaway'}</span></div>
      </div>
      <button type="button" className="success-continue" onClick={onContinue}>
        <span>Lihat ringkasan pesanan</span><ArrowRight size={19} />
      </button>
    </section>
  );
};
