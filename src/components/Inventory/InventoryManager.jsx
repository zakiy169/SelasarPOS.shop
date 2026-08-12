import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Save, X, ShoppingBag, PlusCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { sounds } from '../../utils/audio';

export const InventoryManager = ({ inventory, setInventory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockPacksQty, setRestockPacksQty] = useState(1);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    stock: 0,
    unit: 'ml',
    minStock: 1000,
    packSize: 1000,
    packUnitName: 'Botol',
    costPerUnit: 0
  });

  const handleOpenEdit = (item = null) => {
    if (item) {
      setFormData({
        ...item,
        packSize: item.packSize || (item.unit === 'pcs' ? 1 : 1000),
        packUnitName: item.packUnitName || (item.unit === 'ml' ? 'Botol' : item.unit === 'g' ? 'Pack' : 'Pcs')
      });
    } else {
      setFormData({
        id: `inv-${Date.now()}`,
        name: '',
        stock: 0,
        unit: 'ml',
        minStock: 1000,
        packSize: 1000,
        packUnitName: 'Botol',
        costPerUnit: 0
      });
    }
    setIsEditing(true);
  };

  const handleOpenRestock = (item) => {
    sounds.playBeep();
    setRestockItem(item);
    setRestockPacksQty(1);
  };

  const handleConfirmRestock = () => {
    if (!restockItem) return;
    const packSize = restockItem.packSize || (restockItem.unit === 'pcs' ? 1 : 1000);
    const addedAmount = Number(restockPacksQty) * packSize;

    if (addedAmount <= 0) return alert('Jumlah pembelian harus lebih dari 0!');

    sounds.playCashRegister();
    setInventory(prev => prev.map(item => {
      if (item.id === restockItem.id) {
        return {
          ...item,
          stock: item.stock + addedAmount
        };
      }
      return item;
    }));

    setRestockItem(null);
  };

  const handleSave = () => {
    if (!formData.name) return alert('Nama bahan baku harus diisi!');

    setInventory(prev => {
      const exists = prev.find(i => i.id === formData.id);
      if (exists) {
        return prev.map(i => i.id === formData.id ? formData : i);
      }
      return [formData, ...prev];
    });
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus bahan baku ini?')) {
      setInventory(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1050px', margin: '0 auto', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Manajemen Bahan Baku &amp; Restock Kemasan</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Hitung stok otomatis dalam volume/berat (`ml`/`g`) dan kesetaraan unit kemasan (`Botol`/`Pack`).
          </p>
        </div>
        <button onClick={() => handleOpenEdit()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Tambah Bahan Baku
        </button>
      </div>

      <div className="apple-table-container">
        <table className="apple-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Bahan Baku</th>
              <th>Stok (Total Volume / Berat)</th>
              <th>Stok Fisik Kemasan</th>
              <th>Stok Minimum</th>
              <th>HPP / Unit</th>
              <th style={{ textAlign: 'right' }}>Aksi &amp; Restock</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const packSize = item.packSize || (item.unit === 'pcs' ? 1 : 1000);
              const packUnitName = item.packUnitName || (item.unit === 'ml' ? 'Botol' : item.unit === 'g' ? 'Pack' : 'Pcs');
              const packCount = packSize > 0 ? (item.stock / packSize).toFixed(1) : item.stock;
              const isLow = item.stock <= item.minStock;

              return (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.id.substring(0, 8)}</td>
                  <td>
                    <div style={{ fontWeight: '700' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      1 {packUnitName} = {packSize} {item.unit}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      color: isLow ? 'var(--apple-red)' : 'var(--apple-green)',
                      fontWeight: '800',
                      fontSize: '15px'
                    }}>
                      {item.stock.toLocaleString('id-ID')} {item.unit}
                    </span>
                  </td>
                  <td>
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'rgba(2, 132, 199, 0.08)',
                      color: 'var(--apple-blue)',
                      fontWeight: '700',
                      fontSize: '12px',
                      display: 'inline-block'
                    }}>
                      📦 ~ {packCount} {packUnitName}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.minStock} {item.unit}</td>
                  <td>{formatRupiah(item.costPerUnit || 0)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenRestock(item)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--apple-green)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginRight: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Restock Pembelian Unit Kemasan Baru"
                    >
                      <PlusCircle size={14} /> Restock {packUnitName}
                    </button>
                    <button onClick={() => handleOpenEdit(item)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--apple-blue)', marginRight: '10px' }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--apple-red)' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {inventory.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Belum ada bahan baku terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Restock Packaging Modal */}
      {restockItem && (
        <div className="modal-overlay" onClick={() => setRestockItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="var(--apple-green)" />
                <span>Restock Pembelian Bahan Baku</span>
              </h3>
              <button onClick={() => setRestockItem(null)} className="modal-close"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800' }}>{restockItem.name}</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Ukuran per 1 {restockItem.packUnitName || 'Kemasan'}: <strong>{restockItem.packSize || 1000} {restockItem.unit}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  JUMLAH {restockItem.packUnitName?.toUpperCase() || 'UNIT KEMASAN'} DIBELI / DITAMBAH:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    min="1"
                    className="apple-input" 
                    style={{ fontSize: '18px', fontWeight: '800', textAlign: 'center' }}
                    value={restockPacksQty}
                    onChange={(e) => setRestockPacksQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--apple-blue)', minWidth: '80px' }}>
                    {restockItem.packUnitName || 'Kemasan'}
                  </span>
                </div>
              </div>

              {/* Automatic Conversion Calculation Box */}
              {(() => {
                const packSize = restockItem.packSize || 1000;
                const packUnitName = restockItem.packUnitName || 'Botol';
                const addedVolume = Number(restockPacksQty || 0) * packSize;
                const newTotalVolume = restockItem.stock + addedVolume;
                const newPacksCount = (newTotalVolume / packSize).toFixed(1);

                return (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Pertambahan Volume:</span>
                      <strong style={{ color: 'var(--apple-green)' }}>+ {addedVolume.toLocaleString('id-ID')} {restockItem.unit}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)' }}>
                      <span>Stok Sebelum Restock:</span>
                      <span>{restockItem.stock.toLocaleString('id-ID')} {restockItem.unit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', fontWeight: '800', color: 'var(--apple-blue)' }}>
                      <span>STOK BARU SETELAH RESTOCK:</span>
                      <span>{newTotalVolume.toLocaleString('id-ID')} {restockItem.unit} (~ {newPacksCount} {packUnitName})</span>
                    </div>
                  </div>
                );
              })()}

            </div>
            <div className="modal-footer">
              <button onClick={() => setRestockItem(null)} style={{ padding: '10px 16px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Batal
              </button>
              <button onClick={handleConfirmRestock} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--apple-green)' }}>
                <CheckCircle2 size={18} /> Konfirmasi Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{formData.id.startsWith('inv-') && !inventory.find(i=>i.id === formData.id) ? 'Tambah Bahan Baku Baru' : 'Edit Bahan Baku'}</h3>
              <button onClick={() => setIsEditing(false)} className="modal-close"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Nama Bahan Baku</label>
                <input 
                  type="text" 
                  className="apple-input" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Misal: Fresh Milk Pasteurisasi / Susu Diamond"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Stok Saat Ini</label>
                  <input 
                    type="number" 
                    className="apple-input" 
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Satuan Dasar (Unit)</label>
                  <select 
                    className="apple-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="ml">Mililiter (ml)</option>
                    <option value="g">Gram (g)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="cup">Cup</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Jumlah Volume Per Kemasan</label>
                  <input 
                    type="number" 
                    className="apple-input" 
                    value={formData.packSize}
                    onChange={(e) => setFormData({...formData, packSize: parseFloat(e.target.value) || 1})}
                    placeholder="Misal: 1000 untuk 1000ml"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Nama Unit Kemasan Fisik</label>
                  <input 
                    type="text" 
                    className="apple-input" 
                    value={formData.packUnitName}
                    onChange={(e) => setFormData({...formData, packUnitName: e.target.value})}
                    placeholder="Misal: Botol / Pack / Karton"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Peringatan Stok Minimum</label>
                  <input 
                    type="number" 
                    className="apple-input" 
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Harga Modal (HPP) / Unit Dasar</label>
                  <input 
                    type="number" 
                    className="apple-input" 
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({...formData, costPerUnit: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsEditing(false)} style={{ padding: '10px 16px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Batal
              </button>
              <button onClick={handleSave} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> Simpan Bahan Baku
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

