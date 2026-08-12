import React, { useState } from 'react';
import { Package, AlertTriangle, Plus, RotateCcw, Search } from 'lucide-react';
import { sounds } from '../../utils/audio';

export const InventoryScreen = ({ inventory, onUpdateStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForRestock, setSelectedItemForRestock] = useState(null);
  const [restockAmount, setRestockAmount] = useState(1000);

  const lowStockItems = inventory.filter(item => item.stock <= item.minStock);

  const handleRestockConfirm = () => {
    if (!selectedItemForRestock) return;
    sounds.playCashRegister();
    onUpdateStock(selectedItemForRestock.id, selectedItemForRestock.stock + Number(restockAmount));
    setSelectedItemForRestock(null);
  };

  return (
    <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={26} color="var(--selasar-blue)" />
            <span>Manajemen Stok &amp; Bahan Baku</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Pantau stok biji kopi, susu, sirup, dan kemasan secara otomatis terdeduksi dari penjualan POS
          </p>
        </div>

        <div className="pos-search-input" style={{ width: '260px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Cari bahan baku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Alert Warning Low Stock */}
      {lowStockItems.length > 0 && (
        <div style={{
          background: 'rgba(229, 35, 32, 0.12)',
          border: '1px solid var(--selasar-red)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <AlertTriangle size={24} color="var(--selasar-red)" />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--selasar-red)' }}>
              Peringatan Stok Menipis ({lowStockItems.length} Bahan)
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '2px' }}>
              Bahan berikut hampir habis: {lowStockItems.map(i => `${i.name} (${i.stock} ${i.unit})`).join(', ')}. Harap segera restock!
            </p>
          </div>
        </div>
      )}

      {/* Inventory Items Table */}
      <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>KATEGORI</th>
                <th style={{ padding: '12px 16px' }}>NAMA BAHAN BAKU</th>
                <th style={{ padding: '12px 16px' }}>STOK SAAT INI</th>
                <th style={{ padding: '12px 16px' }}>BATAS MINIMUM</th>
                <th style={{ padding: '12px 16px' }}>STATUS</th>
                <th style={{ padding: '12px 16px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {inventory
                .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => {
                  const isLow = item.stock <= item.minStock;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--selasar-blue)' }}>{item.category}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '800' }}>{item.name}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '900', fontSize: '14px' }}>
                        {item.stock.toLocaleString('id-ID')} {item.unit}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {item.minStock.toLocaleString('id-ID')} {item.unit}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: isLow ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isLow ? '#EF4444' : '#10B981',
                          border: `1px solid ${isLow ? '#EF4444' : '#10B981'}`
                        }}>
                          {isLow ? 'Stok Menipis' : 'Stok Aman'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => { sounds.playBeep(); setSelectedItemForRestock(item); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--selasar-blue)',
                            color: '#FFF',
                            fontWeight: '700',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={14} />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {selectedItemForRestock && (
        <div className="modal-overlay" onClick={() => setSelectedItemForRestock(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Restock {selectedItemForRestock.name}</h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Stok saat ini: <strong>{selectedItemForRestock.stock} {selectedItemForRestock.unit}</strong>
              </p>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  TAMBAH JUMLAH STOK BARU ({selectedItemForRestock.unit.toUpperCase()})
                </label>
                <input
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--apple-blue)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '16px',
                    fontWeight: '800',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setSelectedItemForRestock(null)} 
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                Batal
              </button>
              <button className="checkout-btn" onClick={handleRestockConfirm} style={{ padding: '10px 16px', fontSize: '13px' }}>
                Simpan Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
