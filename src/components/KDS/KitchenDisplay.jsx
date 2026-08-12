import React, { useEffect, useMemo, useState } from 'react';
import { ChefHat, Clock, CheckCircle, Flame } from 'lucide-react';
import { sounds } from '../../utils/audio';

export const KitchenDisplay = ({ transactions = [], onUpdateOrderStatus }) => {
  const [now, setNow] = useState(() => Date.now());

  // Keep age badges accurate even when no new transaction arrives.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = useMemo(() => transactions
    .filter(order => ['pending', 'preparing', 'ready'].includes(order.orderStatus))
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0)), [transactions]);

  const handleStatusChange = (orderId, nextStatus) => {
    sounds.playSuccessChime();
    onUpdateOrderStatus(orderId, nextStatus);
  };

  const getTimerBadge = (dateIso) => {
    const createdAt = new Date(dateIso).getTime();
    const elapsedMinutes = Number.isFinite(createdAt) ? Math.max(0, Math.floor((now - createdAt) / 60000)) : 0;
    let color = '#10B981'; // Green
    if (elapsedMinutes >= 5 && elapsedMinutes < 10) color = '#F59E0B'; // Yellow
    if (elapsedMinutes >= 10) color = '#EF4444'; // Red

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: '800',
        color,
        background: `${color}18`,
        padding: '3px 8px',
        borderRadius: '12px',
        border: `1px solid ${color}40`
      }}>
        <Clock size={12} />
        <span>{elapsedMinutes} mnt lalu</span>
      </div>
    );
  };

  return (
    <div className="kds-page">
      <div className="kds-heading">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ChefHat size={24} color="var(--selasar-blue)" />
            <span>Kitchen Display System (KDS Barista)</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Antrean pesanan aktif untuk penyiapan kopi &amp; pastry Kedai Kopi Selasar
          </p>
        </div>

        <div className="kds-summary">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></span>
            <span>Menunggu ({transactions.filter(t => t.orderStatus === 'pending').length})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></span>
            <span>Siap ({transactions.filter(t => t.orderStatus === 'ready').length})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--selasar-blue)' }}></span>
            <span>Diproses ({transactions.filter(t => t.orderStatus === 'preparing').length})</span>
          </div>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', margin: 'auto', padding: '60px', color: 'var(--text-muted)' }}>
          <CheckCircle size={54} color="#10B981" style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Semua Pesanan Selesai!</h3>
          <p style={{ fontSize: '13px' }}>Tidak ada antrean pesanan aktif di dapur barista saat ini.</p>
        </div>
      ) : (
        <div className="kds-grid">
          {activeOrders.map((order) => (
            <div key={order.id} className={`kds-card status-${order.orderStatus}`}>
              {/* KDS Card Header */}
              <div style={{
                padding: '14px 16px',
                background: order.orderStatus === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 70, 173, 0.15)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--selasar-red)' }}>
                    #{order.receiptNumber}
                  </span>
                  <h4 style={{ fontSize: '15px', fontWeight: '800' }}>
                    {order.tableName || 'Takeaway'} • {order.customerName}
                  </h4>
                </div>
                {getTimerBadge(order.date)}
              </div>

              {/* Items List */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(order.items || []).map((item, idx) => (
                  <div key={idx} style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '14px' }}>
                      <span>{item.qty}x {item.name}</span>
                    </div>

                    {(item.variant || item.sugar || item.milk) && (
                      <div style={{ fontSize: '11px', color: 'var(--selasar-blue)', fontWeight: '700', marginTop: '2px' }}>
                        {[item.variant, item.sugar, item.milk].filter(Boolean).join(' | ')}
                      </div>
                    )}

                    {item.notes && (
                      <div style={{
                        marginTop: '4px',
                        fontSize: '11px',
                        color: 'var(--selasar-amber)',
                        background: 'rgba(217, 119, 6, 0.15)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: '700'
                      }}>
                        Catatan: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                {order.orderStatus === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'preparing')}
                    className="checkout-btn"
                    style={{ background: 'var(--selasar-blue)', fontSize: '13px', padding: '10px' }}
                  >
                    <Flame size={16} />
                    <span>Mulai Diproses Barista</span>
                  </button>
                )}

                {order.orderStatus === 'preparing' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'ready')}
                    className="checkout-btn"
                    style={{ background: '#10B981', fontSize: '13px', padding: '10px' }}
                  >
                    <CheckCircle size={16} />
                    <span>Tandai Siap Saji</span>
                  </button>
                )}

                {order.orderStatus === 'ready' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'completed')}
                    className="checkout-btn"
                    style={{ background: 'var(--selasar-red)', fontSize: '13px', padding: '10px' }}
                  >
                    <CheckCircle size={16} />
                    <span>Pesanan Diambil (Selesai)</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
