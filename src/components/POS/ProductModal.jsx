import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import { ProductImage } from '../ProductImage';

export const ProductModal = ({ product, onClose, onAddToCart, addons = [] }) => {
  const [variant, setVariant] = useState('Iced (Dingin)');
  const [sugar, setSugar] = useState('100% Normal');
  const [milk, setMilk] = useState('Regular Milk');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isCoffee = product.category === 'espresso' || product.category === 'signature' || product.category === 'manual';
  const isPastryOrBeans = product.category === 'pastry' || product.category === 'beans';

  // Dynamic add-ons from settings
  const milkAddons  = addons.filter(a => a.type === 'milk'  && a.isActive);
  const extraAddons = addons.filter(a => a.type === 'extra' && a.isActive);

  // Find the selected milk addon price
  const selectedMilkAddon = milkAddons.find(a => a.name === milk);
  const milkPrice = selectedMilkAddon ? Number(selectedMilkAddon.price) || 0 : 0;

  // Sum of extra add-ons
  const extrasTotalPrice = selectedExtras.reduce((sum, id) => {
    const a = extraAddons.find(x => x.id === id);
    return sum + (a ? Number(a.price) || 0 : 0);
  }, 0);

  const addonPrice = milkPrice + extrasTotalPrice;
  const itemUnitPrice = (Number(product.price) || 0) + addonPrice;
  const totalPrice = itemUnitPrice * quantity;

  const toggleExtra = (id) => {
    sounds.playBeep();
    setSelectedExtras(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    sounds.playBeep();
    onAddToCart({
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      costPrice: Number(product.costPrice) || 0,
      hppSnapshot: Number(product.costPrice) || 0,
      itemUnitPrice,
      totalPrice,
      qty: quantity,
      variant: !isPastryOrBeans ? variant : null,
      sugar: isCoffee || product.category === 'noncoffee' ? sugar : null,
      milk: isCoffee || product.category === 'noncoffee' ? milk : null,
      extraShot: selectedExtras.includes('addon-3'), // backwards compat
      extras: selectedExtras.map(id => {
        const a = extraAddons.find(x => x.id === id);
        return a ? { id: a.id, name: a.name, price: a.price } : null;
      }).filter(Boolean),
      notes: notes.trim(),
      ingredients: product.ingredients
    });
    onClose();
  };

  return (
    <div className="modal-overlay product-config-overlay" onClick={onClose}>
      <div className="modal-card product-config-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ProductImage src={product.image} alt={product.name} name={product.name} category={product.category} className="product-modal-thumb" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{product.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--selasar-red)', fontWeight: '700' }}>{formatRupiah(product.price)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{product.description}</p>

          {!isPastryOrBeans && (
            <>
              {/* Temperature */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Suhu Sajian
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {['Iced (Dingin)', 'Hot (Hangat)'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => { sounds.playBeep(); setVariant(opt); }}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: `1.5px solid ${variant === opt ? 'var(--apple-blue)' : 'var(--border-color)'}`,
                        background: variant === opt ? 'rgba(2,132,199,0.12)' : 'var(--bg-card)',
                        color: variant === opt ? 'var(--apple-blue)' : 'var(--text-muted)',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt === 'Iced (Dingin)' ? '🧊 ' : '☕ '}{opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Level Manis
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {['100% Normal', '50% Less', '25% Low', '0% No Sugar'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => { sounds.playBeep(); setSugar(opt); }}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        border: `1.5px solid ${sugar === opt ? 'var(--apple-green)' : 'var(--border-color)'}`,
                        background: sugar === opt ? 'rgba(16,185,129,0.12)' : 'var(--bg-card)',
                        color: sugar === opt ? 'var(--apple-green)' : 'var(--text-muted)',
                        fontWeight: '700',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Milk alternatives (dynamic) */}
              {isCoffee && milkAddons.length > 0 && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Pilihan Susu
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Regular milk always first */}
                    <button
                      onClick={() => { sounds.playBeep(); setMilk('Regular Milk'); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                        border: `1.5px solid ${milk === 'Regular Milk' ? 'var(--apple-blue)' : 'var(--border-color)'}`,
                        background: milk === 'Regular Milk' ? 'rgba(2,132,199,0.10)' : 'var(--bg-card)',
                        color: 'var(--text-main)',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>🥛 Regular Milk</span>
                      <span style={{ fontSize: '12px', color: 'var(--apple-green)', fontWeight: '700' }}>Gratis</span>
                    </button>
                    {milkAddons.map(a => (
                      <button
                        key={a.id}
                        onClick={() => { sounds.playBeep(); setMilk(a.name); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                          border: `1.5px solid ${milk === a.name ? 'var(--apple-blue)' : 'var(--border-color)'}`,
                          background: milk === a.name ? 'rgba(2,132,199,0.10)' : 'var(--bg-card)',
                          color: 'var(--text-main)',
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{a.emoji} {a.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--apple-blue)', fontWeight: '700' }}>+{formatRupiah(a.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra add-ons (dynamic) */}
              {isCoffee && extraAddons.length > 0 && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Tambahan / Extras
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {extraAddons.map(a => {
                      const isOn = selectedExtras.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          onClick={() => toggleExtra(a.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                            border: `1.5px solid ${isOn ? 'var(--apple-yellow)' : 'var(--border-color)'}`,
                            background: isOn ? 'rgba(245,158,11,0.10)' : 'var(--bg-card)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '6px',
                              border: `2px solid ${isOn ? 'var(--apple-yellow)' : 'var(--border-color)'}`,
                              background: isOn ? 'var(--apple-yellow)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              transition: 'all 0.15s',
                            }}>
                              {isOn && <Check size={12} color="#FFF" />}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '700' }}>{a.emoji} {a.name}</span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--apple-yellow)', fontWeight: '800' }}>
                            +{formatRupiah(a.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Barista Notes */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Catatan untuk Barista (Optional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Es sedikit, dipisah, ekstra manis..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                color: 'var(--text-main)', fontSize: '13px', outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />
          </div>

          {/* Quantity */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jumlah Pesanan</span>
            <div className="qty-control" style={{ padding: '4px 12px' }}>
              <button
                className="qty-btn"
                onClick={() => { if (quantity > 1) { sounds.playBeep(); setQuantity(quantity - 1); } }}
              >
                <Minus size={16} />
              </button>
              <span style={{ fontWeight: '800', fontSize: '16px', minWidth: '24px', textAlign: 'center' }}>{quantity}</span>
              <button
                className="qty-btn"
                onClick={() => { sounds.playBeep(); setQuantity(quantity + 1); }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <button className="checkout-btn" onClick={handleConfirm}>
            <span>Tambah ke Pesanan • {formatRupiah(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
