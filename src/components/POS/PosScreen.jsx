import React, { useEffect, useState } from 'react';
import { 
  CATEGORIES 
} from '../../data/initialData';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Lock,
  X,
  Bluetooth,
  Sparkles,
  Coffee,
  Zap,
  GlassWater,
  Utensils,
  Package,
  LayoutGrid
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { ProductModal } from './ProductModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { TransactionSuccessScreen } from './TransactionSuccessScreen';
import { sounds } from '../../utils/audio';
import { bluetoothPrinter } from '../../utils/bluetoothPrinter';
import { ProductImage } from '../ProductImage';

const STOCK_UNIT_META = {
  ml: { family: 'volume', factor: 1 }, liter: { family: 'volume', factor: 1000 },
  g: { family: 'weight', factor: 1 }, gr: { family: 'weight', factor: 1 }, kg: { family: 'weight', factor: 1000 },
  pcs: { family: 'count', factor: 1 }, cup: { family: 'count', factor: 1 }
};

const convertStockAmount = (amount, fromUnit, toUnit) => {
  const from = STOCK_UNIT_META[String(fromUnit || '').toLowerCase()];
  const to = STOCK_UNIT_META[String(toUnit || '').toLowerCase()];
  if (!from || !to || from.family !== to.family) return Number.NaN;
  return ((Number(amount) || 0) * from.factor) / to.factor;
};

export const PosScreen = ({ 
  products, 
  inventory, 
  tables, 
  members, 
  activeShift,
  onAddTransaction, 
  onDeductStock,
  onOpenShiftTab,
  appSettings,
  addons = [],
  onOpenBluetoothModal,
  tableForNewOrder
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [customerType, setCustomerType] = useState('Dine-In');
  const [selectedTable, setSelectedTable] = useState('Meja 01');
  const [selectedMember, setSelectedMember] = useState(null);
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Mobile cart drawer open state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Modals state
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [successTransaction, setSuccessTransaction] = useState(null);

  const availableTables = tables.filter(table => table.status === 'available');

  useEffect(() => {
    if (tableForNewOrder && tables.some(table => table.name === tableForNewOrder && table.status === 'available')) {
      setCustomerType('Dine-In');
      setSelectedTable(tableForNewOrder);
    }
  }, [tableForNewOrder, tables]);

  useEffect(() => {
    if (customerType === 'Dine-In' && !tables.some(table => table.name === selectedTable && table.status === 'available')) {
      setSelectedTable(tables.find(table => table.status === 'available')?.name || '');
    }
  }, [customerType, selectedTable, tables]);

  // The mobile cart is a modal sheet. Hide the persistent app navigation while
  // it is open so the checkout footer cannot be covered by it.
  useEffect(() => {
    document.body.classList.toggle('mobile-cart-open', mobileCartOpen);
    return () => document.body.classList.remove('mobile-cart-open');
  }, [mobileCartOpen]);

  // Delivero-inspired POS theme is only enabled on this screen.
  useEffect(() => {
    // Global Delivero design is now activated at the App root; this hook
    // remains here as a defensive no-op in case the app is embedded elsewhere.
  }, []);

  const promoSlides = Array.isArray(appSettings?.promoSlides) && appSettings.promoSlides.length
    ? appSettings.promoSlides
    : [];

  // Rotating promo banner slide — owner-configurable, auto-cycle every 5s.
  const [bannerSlideIdx, setBannerSlideIdx] = useState(0);
  useEffect(() => {
    if (promoSlides.length < 2) return undefined;
    const t = setInterval(() => setBannerSlideIdx(i => (i + 1) % promoSlides.length), 5000);
    return () => clearInterval(t);
  }, [promoSlides.length]);

  useEffect(() => {
    if (bannerSlideIdx >= promoSlides.length) setBannerSlideIdx(0);
  }, [bannerSlideIdx, promoSlides.length]);

  // One consistent vector icon language for every product category.
  const CATEGORY_ICON = {
    all: LayoutGrid,
    signature: Sparkles,
    espresso: Zap,
    manual: Coffee,
    noncoffee: GlassWater,
    pastry: Utensils,
    beans: Package,
  };

  const greetingName = activeShift?.baristaName || activeShift?.name || 'Barista';

  useEffect(() => {
    const hasPosModal = Boolean(selectedProductForModal || showPaymentModal || completedTransaction || successTransaction);
    document.body.classList.toggle('pos-modal-open', hasPosModal);
    return () => document.body.classList.remove('pos-modal-open');
  }, [selectedProductForModal, showPaymentModal, completedTransaction, successTransaction]);

  // Filter products by category & search
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleOpenProductModal = (product) => {
    if (!product.isAvailable) return;
    sounds.playBeep();
    setMobileCartOpen(false);
    setSelectedProductForModal(product);
  };

  const handleAddToCart = (configuredItem) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => 
        item.productId === configuredItem.productId && 
        item.variant === configuredItem.variant && 
        item.sugar === configuredItem.sugar && 
        item.milk === configuredItem.milk &&
        item.extraShot === configuredItem.extraShot &&
        item.notes === configuredItem.notes
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: (Number(updated[existingIdx].qty) || 0) + (Number(configuredItem.qty) || 0),
          totalPrice: (Number(updated[existingIdx].totalPrice) || 0) + (Number(configuredItem.totalPrice) || 0)
        };
        return updated;
      }
      return [...prev, configuredItem];
    });
  };

  const handleUpdateQty = (index, delta) => {
    sounds.playBeep();
    setCartItems(prev => {
      const updated = [...prev];
      const newQty = updated[index].qty + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].qty = newQty;
      updated[index].totalPrice = updated[index].itemUnitPrice * newQty;
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    sounds.playBeep();
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations using dynamic appSettings
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const taxPercent = Math.min(100, Math.max(0, Number(appSettings?.taxPercent) || 0));
  const serviceChargePercent = Math.min(100, Math.max(0, Number(appSettings?.serviceChargePercent) || 0));
  
  const tax = Math.round(subtotal * (taxPercent / 100));
  const serviceCharge = customerType === 'Dine-In' ? Math.round(subtotal * (serviceChargePercent / 100)) : 0;
  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const grandTotal = Math.max(0, subtotal + tax + serviceCharge - discount);

  const getStockIssues = () => {
    const requiredByIngredient = new Map();
    cartItems.forEach((cartItem) => {
      (cartItem.ingredients || []).forEach((ingredient) => {
        const inventoryItem = inventory.find((item) => item.id === ingredient.id);
        if (!inventoryItem) {
          requiredByIngredient.set(ingredient.id, { name: ingredient.name || 'Bahan', issue: 'tidak ditemukan di stok' });
          return;
        }
        const converted = convertStockAmount(
          (Number(ingredient.amount) || 0) * (Number(cartItem.qty) || 0),
          ingredient.unit || inventoryItem.unit,
          inventoryItem.unit
        );
        if (!Number.isFinite(converted)) {
          requiredByIngredient.set(ingredient.id, { name: inventoryItem.name, issue: `satuan resep ${ingredient.unit || '-'} tidak cocok dengan stok ${inventoryItem.unit}` });
          return;
        }
        const previous = requiredByIngredient.get(ingredient.id) || { name: inventoryItem.name, required: 0, stock: Number(inventoryItem.stock) || 0, unit: inventoryItem.unit };
        requiredByIngredient.set(ingredient.id, { ...previous, required: (previous.required || 0) + converted });
      });
    });
    return [...requiredByIngredient.values()].filter((item) => item.issue || item.required > item.stock + 1e-9);
  };

  const handleStartPayment = () => {
    const issues = getStockIssues();
    if (issues.length) {
      const detail = issues.map((item) => item.issue
        ? `• ${item.name}: ${item.issue}`
        : `• ${item.name}: butuh ${item.required.toLocaleString('id-ID')} ${item.unit}, tersedia ${item.stock.toLocaleString('id-ID')} ${item.unit}`
      ).join('\n');
      sounds.playError();
      alert(`Stok bahan belum mencukupi:\n\n${detail}`);
      return;
    }
    sounds.playBeep();
    setMobileCartOpen(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentDetails) => {
    if (getStockIssues().length) {
      sounds.playError();
      alert('Stok berubah dan sekarang tidak mencukupi. Pembayaran dibatalkan agar stok tidak menjadi salah.');
      return;
    }
    const newTx = {
      id: `SLSR-TX-${Date.now()}`,
      receiptNumber: `SLSR-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      customerType,
      tableName: customerType === 'Dine-In' ? selectedTable : 'Takeaway Counter',
      customerName: selectedMember ? selectedMember.name : 'Pelanggan Umum',
      memberId: selectedMember?.id || null,
      customerKey: selectedMember?.id || null,
      items: cartItems,
      subtotal,
      tax,
      serviceCharge,
      discount: paymentDetails.discount || discount,
      total: paymentDetails.finalTotal,
      paymentMethod: paymentDetails.paymentMethod,
      bankName: paymentDetails.bankName,
      ewalletName: paymentDetails.ewalletName,
      cashReceived: paymentDetails.cashReceived,
      cashChange: paymentDetails.cashChange,
      paymentStatus: 'paid',
      orderStatus: 'pending',
      cashierName: activeShift ? activeShift.name : 'Barista Selasar',
      shiftId: activeShift?.id || null
    };

    // Deduct raw ingredient stocks automatically!
    cartItems.forEach(cartItem => {
      if (cartItem.ingredients) {
        cartItem.ingredients.forEach(ing => {
          onDeductStock(ing.id, ing.amount * cartItem.qty, ing.unit);
        });
      }
    });

    onAddTransaction(newTx);
    setShowPaymentModal(false);
    setCartItems([]);
    setAppliedVoucher(null);
    setSuccessTransaction(newTx);
    setMobileCartOpen(false);
  };

  return (
    <div className="pos-layout">
      {/* Full Screen Shift Lock Overlay */}
      {!activeShift && (
        <div className="shift-lock-overlay">
          <div style={{ background: 'var(--apple-red)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', marginBottom: '16px' }}>
            <Lock size={32} />
          </div>
          <h2>Shift Kasir Ditutup</h2>
          <p>Anda tidak dapat memproses pesanan baru. Silakan buka shift terlebih dahulu untuk mulai berjualan.</p>
          <button onClick={onOpenShiftTab} className="btn-primary" style={{ marginTop: '24px' }}>
            Buka Shift Sekarang
          </button>
        </div>
      )}

      {/* Left Column: Product Catalog */}
      <div className="pos-catalog-section" style={{ filter: !activeShift ? 'blur(10px)' : 'none', pointerEvents: !activeShift ? 'none' : 'auto' }}>

        <header className="pos-workspace-hero">
          <div>
            <span><Sparkles size={14} /> Workspace kasir</span>
            <h2 className="pos-greeting-title">Hai {greetingName}, siap layani pelanggan.</h2>
            <p>Katalog, ketersediaan produk, pelanggan, dan pembayaran dalam satu alur cepat.</p>
          </div>
          <aside><small>Shift aktif</small><strong>{activeShift?.shiftType || activeShift?.name || 'Belum dibuka'}</strong><span>{activeShift?.baristaName || activeShift?.name || 'Buka shift untuk mulai'}</span></aside>
        </header>

        {/* Delivero-style animated promo banner — rotates 3 slides */}
        {promoSlides.length > 0 && (() => {
          const s = promoSlides[bannerSlideIdx];
          return (
            <div className="pos-delv-banner" key={s.id || bannerSlideIdx} role="img" aria-label={`Promo: ${s.title} ${s.subtitle}`}>
              <span className="pos-delv-banner-tag">{s.tag}</span>
              <h3>{s.title}<em>{s.subtitle}</em></h3>
              <p>{s.description}</p>
              <div className="pos-delv-banner-badge">{s.badge}</div>
              <div className="pos-delv-banner-photo">
                {s.image ? <img src={s.image} alt={s.title} loading="lazy" /> : <div className="pos-delv-banner-placeholder" aria-hidden="true"><span>SELASAR</span><b>{s.title}</b></div>}
              </div>
              <div className="pos-delv-banner-dots">
                {promoSlides.map((slide, i) => (
                  <button
                    key={slide.id || i}
                    type="button"
                    className={i === bannerSlideIdx ? 'active' : ''}
                    onClick={() => setBannerSlideIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        <div className="pos-delv-section-title">
          <h4>Kategori</h4>
        </div>

        <div className="pos-filter-bar">
          <div className="category-pills">
            {CATEGORIES.map(cat => {
              const CategoryIcon = CATEGORY_ICON[cat.id] || LayoutGrid;
              return <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => { sounds.playBeep(); setSelectedCategory(cat.id); }}
              >
                <span className="category-icon" aria-hidden="true"><CategoryIcon size={20} strokeWidth={2.25} /></span>
                <span className="category-label">{cat.name}</span>
              </button>;
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="pos-search-input">
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Cari kopi, pastry, snack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => { sounds.playBeep(); if (onOpenBluetoothModal) onOpenBluetoothModal(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                border: `1px solid ${bluetoothPrinter.isConnected ? 'rgba(52, 199, 89, 0.4)' : 'var(--border-color)'}`,
                background: bluetoothPrinter.isConnected ? 'rgba(52, 199, 89, 0.1)' : 'var(--bg-card)',
                color: bluetoothPrinter.isConnected ? 'var(--apple-green)' : 'var(--text-main)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              title="Atur / Hubungkan Printer Bluetooth Thermal"
            >
              <Bluetooth size={16} />
              <span>{bluetoothPrinter.isConnected ? `Printer` : 'Printer BT'}</span>
            </button>
          </div>
        </div>

        <div className="pos-delv-section-title">
          <h4>Menu Populer</h4>
          <a>{filteredProducts.length} produk tersedia</a>
        </div>

        {/* Product Cards Grid */}
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="product-card"
              onClick={() => handleOpenProductModal(product)}
              style={{ opacity: product.isAvailable ? 1 : 0.5 }}
            >
              <div className="product-img-wrapper">
                <ProductImage src={product.image} alt={product.name} name={product.name} category={product.category} className="product-img" />
                <span className="product-badge-cat">{product.category}</span>
                {!product.isAvailable && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#EF4444',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px'
                  }}>
                    SOLD OUT
                  </div>
                )}
              </div>
              <div className="product-info">
                <h4 className="product-title">{product.name}</h4>
                <div className="product-price-row">
                  <span className="product-price">{formatRupiah(product.price)}</span>
                  <button className="product-add-btn" disabled={!product.isAvailable}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button for Mobile */}
      {cartItems.length > 0 && (
        <button className="mobile-cart-float-btn" onClick={() => setMobileCartOpen(true)}>
          <ShoppingCart size={18} />
          <span>Lihat Keranjang ({cartItems.length}) • {formatRupiah(grandTotal)}</span>
        </button>
      )}

      {mobileCartOpen && (
        <button
          type="button"
          className="mobile-cart-backdrop"
          onClick={() => setMobileCartOpen(false)}
          aria-label="Tutup keranjang"
        />
      )}

      {/* Right Column: Order Cart Sidebar */}
      <div className={`pos-cart-sidebar ${mobileCartOpen ? 'open-mobile' : ''}`}>
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingCart size={18} color="var(--selasar-blue)" />
            <span>Pesanan Aktif ({cartItems.length})</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {cartItems.length > 0 && (
              <button 
                onClick={() => setCartItems([])} 
                style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
              >
                Reset
              </button>
            )}
            {mobileCartOpen && (
              <button className="cart-close-mobile" onClick={() => setMobileCartOpen(false)} style={{ background: 'transparent', border: 'none' }}>
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Dine-In / Takeaway Toggle */}
        <div className="order-type-toggle">
          <button 
            className={`order-type-btn ${customerType === 'Dine-In' ? 'active' : ''}`}
            onClick={() => { sounds.playBeep(); setCustomerType('Dine-In'); }}
          >
            Dine-In (Makan di Tempat)
          </button>
          <button 
            className={`order-type-btn ${customerType === 'Takeaway' ? 'active' : ''}`}
            onClick={() => { sounds.playBeep(); setCustomerType('Takeaway'); }}
          >
            Takeaway (Bawa Pulang)
          </button>
        </div>

        {/* Option Selector: Table & Member */}
        <div style={{ padding: '0 20px', display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {customerType === 'Dine-In' && (
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {availableTables.map(t => (
                <option key={t.id} value={t.name}>{t.name} ({t.zone})</option>
              ))}
            </select>
          )}

          <select
            value={selectedMember ? selectedMember.id : ''}
            onChange={(e) => {
              const mem = members.find(m => m.id === e.target.value);
              setSelectedMember(mem || null);
            }}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <option value="">-- Pelanggan Umum --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>⭐ {m.name} ({m.level})</option>
            ))}
          </select>
        </div>

        {/* Cart Item List */}
        <div className="cart-items-container">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ fontSize: '13px', fontWeight: '600' }}>Belum ada pesanan</p>
              <span style={{ fontSize: '11px' }}>Klik produk di sebelah kiri untuk menambah</span>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={idx} className="cart-item-card">
                <div className="cart-item-main">
                  <div>
                    <h5 className="cart-item-title">{item.name}</h5>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {[item.variant, item.sugar, item.milk].filter(Boolean).join(' • ')}
                    </div>
                    {item.notes && <span className="cart-item-notes">{item.notes}</span>}
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="cart-item-qty-row">
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--selasar-red)' }}>
                    {formatRupiah(item.totalPrice)}
                  </span>

                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => handleUpdateQty(idx, -1)}>
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: '800', fontSize: '13px' }}>{item.qty}</span>
                    <button className="qty-btn" onClick={() => handleUpdateQty(idx, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Calculations & Checkout */}
        <div className="cart-footer">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Pajak Resto ({taxPercent}%)</span>
            <span>{formatRupiah(tax)}</span>
          </div>
          {customerType === 'Dine-In' && (
            <div className="summary-row">
              <span>Service Charge ({serviceChargePercent}%)</span>
              <span>{formatRupiah(serviceCharge)}</span>
            </div>
          )}

          <div className="summary-row total">
            <span>TOTAL BAYAR</span>
            <span>{formatRupiah(grandTotal)}</span>
          </div>

          <button 
            className="checkout-btn" 
            disabled={cartItems.length === 0 || !activeShift || (customerType === 'Dine-In' && !selectedTable)}
            onClick={handleStartPayment}
          >
            <span>{!activeShift ? 'Shift Ditutup' : `Bayar • ${formatRupiah(grandTotal)}`}</span>
          </button>
        </div>
      </div>

      {/* Product Customization Modal */}
      {selectedProductForModal && (
        <ProductModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={handleAddToCart}
          addons={addons}
        />
      )}

      {/* Multi-Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          grandTotal={grandTotal}
          cartItems={cartItems}
          customerType={customerType}
          tableName={selectedTable}
          customerName={selectedMember ? selectedMember.name : 'Pelanggan Umum'}
          qrisImage={appSettings?.qrisImage}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Thermal Receipt Success Modal */}
      {completedTransaction && (
        <ReceiptModal
          transaction={completedTransaction}
          appSettings={appSettings}
          onClose={() => setCompletedTransaction(null)}
          onOpenBluetoothModal={onOpenBluetoothModal}
        />
      )}

      {successTransaction && (
        <TransactionSuccessScreen
          transaction={successTransaction}
          onContinue={() => {
            setCompletedTransaction(successTransaction);
            setSuccessTransaction(null);
          }}
        />
      )}
    </div>
  );
};
