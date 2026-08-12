import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Sparkles, Layers } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

export const MenuManager = ({ products, setProducts, inventory = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    categoryId: 'signature',
    price: 0,
    costPrice: 0,
    image: '',
    description: '',
    isAvailable: true,
    ingredients: []
  });

  const handleOpenEdit = (item = null) => {
    if (item) {
      setFormData({
        ...item,
        ingredients: item.ingredients ? item.ingredients.map(i => ({ ...i })) : []
      });
    } else {
      setFormData({
        id: `prod-${Date.now()}`,
        name: '',
        categoryId: 'espresso',
        price: 0,
        costPrice: 0,
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
        description: '',
        isAvailable: true,
        ingredients: []
      });
    }
    setIsEditing(true);
  };

  const handleAddIngredient = () => {
    const firstInv = inventory[0];
    const newIng = {
      id: firstInv ? firstInv.id : `ing-${Date.now()}`,
      name: firstInv ? firstInv.name : 'Pilih Bahan Baku',
      amount: 10,
      unit: firstInv ? firstInv.unit : 'ml'
    };
    setFormData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), newIng]
    }));
  };

  const handleUpdateIngredient = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.ingredients || [])];
      if (field === 'id') {
        const invItem = inventory.find(i => i.id === value);
        if (invItem) {
          updated[index] = {
            ...updated[index],
            id: invItem.id,
            name: invItem.name,
            unit: invItem.unit
          };
        }
      } else if (field === 'amount') {
        updated[index] = {
          ...updated[index],
          amount: parseFloat(value) || 0
        };
      }
      return { ...prev, ingredients: updated };
    });
  };

  const handleRemoveIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, i) => i !== index)
    }));
  };

  // Calculate estimated total ingredient cost for this recipe
  const calculateTotalIngredientCost = () => {
    if (!formData.ingredients || formData.ingredients.length === 0) return 0;
    return formData.ingredients.reduce((sum, ing) => {
      const invItem = inventory.find(i => i.id === ing.id || i.name === ing.name);
      const unitCost = invItem ? (invItem.costPerUnit || 0) : 0;
      return sum + (ing.amount * unitCost);
    }, 0);
  };

  const calculatedCost = calculateTotalIngredientCost();

  const handleApplyCalculatedHPP = () => {
    setFormData(prev => ({
      ...prev,
      costPrice: Math.round(calculatedCost)
    }));
  };

  const handleSave = () => {
    if (!formData.name || formData.price <= 0) return alert('Nama dan harga jual harus diisi!');

    setProducts(prev => {
      const exists = prev.find(p => p.id === formData.id);
      if (exists) {
        return prev.map(p => p.id === formData.id ? formData : p);
      }
      return [formData, ...prev];
    });
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus menu ini? (Akan hilang dari kasir)')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="menu-manager-page" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', overflowY: 'auto', height: '100%' }}>
      <div className="menu-manager-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Manajemen Menu &amp; Resep Bahan Baku</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Kelola daftar menu, harga jual, HPP, serta takaran resep yang memotong stok otomatis
          </p>
        </div>
        <button onClick={() => handleOpenEdit()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Tambah Menu Baru
        </button>
      </div>

      <div className="apple-table-container">
        <table className="apple-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nama Menu</th>
              <th>Kategori</th>
              <th>Resep Takaran</th>
              <th>Harga Jual</th>
              <th>HPP (Modal)</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map(item => (
              <tr key={item.id}>
                <td>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: '#F5F5F7' }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </td>
                <td style={{ fontWeight: '600' }}>{item.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{item.categoryId}</td>
                <td>
                  {item.ingredients && item.ingredients.length > 0 ? (
                    <span 
                      style={{
                        padding: '4px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: 'rgba(2, 132, 199, 0.1)',
                        color: 'var(--apple-blue)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={item.ingredients.map(i => `${i.name}: ${i.amount}${i.unit}`).join(', ')}
                    >
                      <Layers size={12} /> {item.ingredients.length} Bahan Sync
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Tanpa Resep</span>
                  )}
                </td>
                <td style={{ fontWeight: '700' }}>{formatRupiah(item.price)}</td>
                <td style={{ color: 'var(--text-muted)' }}>{formatRupiah(item.costPrice || 0)}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '11px', 
                    fontWeight: '600',
                    background: item.isAvailable ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                    color: item.isAvailable ? 'var(--apple-green)' : 'var(--apple-red)'
                  }}>
                    {item.isAvailable ? 'Tersedia' : 'Habis'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleOpenEdit(item)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--apple-blue)', marginRight: '12px' }}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--apple-red)' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Belum ada menu terdaftar. Tambahkan sekarang.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{formData.id.startsWith('prod-') && !products.find(p=>p.id === formData.id) ? 'Tambah Menu Baru' : 'Edit Menu & Resep Takaran'}</h3>
              <button onClick={() => setIsEditing(false)} className="modal-close"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="menu-editor-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Nama Menu</label>
                  <input 
                    type="text" 
                    className="apple-input" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Misal: Kopi Selasar Aren"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Kategori</label>
                  <select 
                    className="apple-input"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="signature">Signature Selasar</option>
                    <option value="espresso">Espresso Based</option>
                    <option value="manual">Manual Brew</option>
                    <option value="noncoffee">Non Coffee</option>
                    <option value="pastry">Pastry &amp; Snacks</option>
                    <option value="beans">Biji Kopi</option>
                  </select>
                </div>
              </div>

              <div className="menu-editor-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Harga Jual (Rp)</label>
                  <input 
                    type="number" 
                    className="apple-input" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>HPP / Modal (Rp)</label>
                  <input 
                    type="number" 
                    className="apple-input" 
                    value={formData.costPrice}
                    onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              {/* Recipe / Takaran Bahan Baku Section */}
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--apple-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} />
                      <span>Resep Takaran Bahan Baku (Sinkron Stok Otomatis)</span>
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Tentukan takaran bahan (susu, sirup, kopi, cup) yang berkurang otomatis saat dijual
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    style={{
                      background: 'rgba(2, 132, 199, 0.1)',
                      color: 'var(--apple-blue)',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} /> Tambah Takaran
                  </button>
                </div>

                {/* Recipe items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.ingredients && formData.ingredients.map((ing, idx) => {
                    const selectedInv = inventory.find(i => i.id === ing.id || i.name === ing.name);
                    const unit = selectedInv ? selectedInv.unit : (ing.unit || 'ml');

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <select
                          className="apple-input"
                          style={{ flex: 2, padding: '6px 10px', fontSize: '13px' }}
                          value={ing.id || ''}
                          onChange={(e) => handleUpdateIngredient(idx, 'id', e.target.value)}
                        >
                          <option value="">-- Pilih Bahan Baku --</option>
                          {inventory.map(invItem => (
                            <option key={invItem.id} value={invItem.id}>
                              {invItem.name} ({invItem.stock} {invItem.unit})
                            </option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                          <input
                            type="number"
                            className="apple-input"
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={ing.amount}
                            onChange={(e) => handleUpdateIngredient(idx, 'amount', e.target.value)}
                            placeholder="Takaran"
                          />
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', minWidth: '24px' }}>
                            {unit}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--apple-red)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}

                  {(!formData.ingredients || formData.ingredients.length === 0) && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      Belum ada takaran resep. Klik "+ Tambah Takaran" untuk menghubungkan dengan stok bahan baku.
                    </div>
                  )}
                </div>

                {/* HPP helper button */}
                {calculatedCost > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                      Total Biaya Resep (Calculated HPP): <strong style={{ color: 'var(--apple-green)' }}>{formatRupiah(calculatedCost)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyCalculatedHPP}
                      style={{ background: 'var(--apple-green)', color: '#FFF', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Gunakan HPP Ini
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>URL Gambar Produk</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    className="apple-input" 
                    style={{ flex: 1 }}
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    placeholder="https://..."
                  />
                  {formData.image && (
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: '#F5F5F7' }}>
                      <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Deskripsi (Opsional)</label>
                <textarea 
                  className="apple-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Keterangan singkat..."
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--apple-blue)' }}
                />
                <label htmlFor="isAvailable" style={{ fontSize: '14px', fontWeight: '500' }}>Menu Tersedia (Ready Stock)</label>
              </div>

            </div>
            <div className="modal-footer">
              <button onClick={() => setIsEditing(false)} style={{ padding: '10px 16px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Batal
              </button>
              <button onClick={handleSave} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> Simpan Menu &amp; Resep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
