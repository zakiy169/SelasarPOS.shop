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
  Bluetooth
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { ProductModal } from './ProductModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { sounds } from '../../utils/audio';
import { bluetoothPrinter } from '../../utils/bluetoothPrinter';

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

  useEffect(() => {
    const hasPosModal = Boolean(selectedProductForModal || showPaymentModal || completedTransaction);
    document.body.classList.toggle('pos-modal-open', hasPosModal);
    return () => document.body.classList.remove('pos-modal-open');
  }, [selectedProductForModal, showPaymentModal, completedTransaction]);

  // Filter products by category & search
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleOpenProductModal = (product) => {
    if (!product.isAvailable) return;
    sounds.playBeep();
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
        updated[existingIdx].qty += configuredItem.qty;
        updated[existingIdx].totalPrice += configuredItem.totalPrice;
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
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxPercent = appSettings?.taxPercent || 0;
  const serviceChargePercent = appSettings?.serviceChargePercent || 0;
  
  const tax = Math.round(subtotal * (taxPercent / 100));
  const serviceCharge = customerType === 'Dine-In' ? Math.round(subtotal * (serviceChargePercent / 100)) : 0;
  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const grandTotal = Math.max(0, subtotal + tax + serviceCharge - discount);

  const handlePaymentSuccess = (paymentDetails) => {
    const newTx = {
      id: `SLSR-TX-${Date.now()}`,
      receiptNumber: `SLSR-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      customerType,
      tableName: customerType === 'Dine-In' ? selectedTable : 'Takeaway Counter',
      customerName: selectedMember ? selectedMember.name : 'Pelanggan Umum',
      memberId: selectedMember?.id || null,
      items: cartItems,
      subtotal,
      tax,
      serviceCharge,
      discount: paymentDetails.discount || discount,
      total: paymentDetails.finalTotal,
      paymentMethod: paymentDetails.paymentMethod,
      cashReceived: paymentDetails.cashReceived,
      cashChange: paymentDetails.cashChange,
      paymentStatus: 'paid',
      orderStatus: 'pending',
      cashierName: activeShift ? activeShift.name : 'Barista Selasar'
    };

    // Deduct raw ingredient stocks automatically!
    cartItems.forEach(cartItem => {
      if (cartItem.ingredients) {
        cartItem.ingredients.forEach(ing => {
          onDeductStock(ing.id, ing.amount * cartItem.qty);
        });
      }
    });

    onAddTransaction(newTx);
    setShowPaymentModal(false);
    setCartItems([]);
    setAppliedVoucher(null);
    setCompletedTransaction(newTx);
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

        <div className="pos-filter-bar">
          <div className="category-pills">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => { sounds.playBeep(); setSelectedCategory(cat.id); }}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="pos-search-input">
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Cari kopi, pastry..."
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
                <img src={product.image} alt={product.name} className="product-img" />
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
            onClick={() => { sounds.playBeep(); setShowPaymentModal(true); }}
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
    </div>
  );
};
