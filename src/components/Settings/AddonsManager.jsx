import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { sounds } from '../../utils/audio';

const EMPTY_ADDON = { name: '', type: 'milk', price: 0, isActive: true, emoji: '✨' };

export const AddonsManager = ({ addons, setAddons }) => {
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDON);

  const milkAddons  = addons.filter(a => a.type === 'milk');
  const extraAddons = addons.filter(a => a.type === 'extra');

  const startEdit = (addon) => {
    sounds.playBeep();
    setEditingId(addon.id);
    setForm({ ...addon });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm(EMPTY_ADDON);
  };

  const saveEdit = () => {
    if (!form.name.trim()) return;
    sounds.playBeep();
    setAddons(prev => prev.map(a => a.id === editingId ? { ...a, ...form } : a));
    cancelEdit();
  };

  const openAddForm = () => {
    sounds.playBeep();
    setShowAddForm(true);
    setEditingId(null);
    setForm(EMPTY_ADDON);
  };

  const saveNew = () => {
    if (!form.name.trim()) return;
    sounds.playSuccessChime();
    const newAddon = {
      ...form,
      id: `addon-${Date.now()}`,
      price: Number(form.price) || 0,
    };
    setAddons(prev => [...prev, newAddon]);
    cancelEdit();
  };

  const deleteAddon = (id) => {
    if (!window.confirm('Hapus add-on ini?')) return;
    sounds.playBeep();
    setAddons(prev => prev.filter(a => a.id !== id));
  };

  const toggleActive = (id) => {
    sounds.playBeep();
    setAddons(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const AddonRow = ({ addon }) => {
    const isEditing = editingId === addon.id;
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        background: isEditing ? 'var(--bg-main)' : 'transparent',
        border: isEditing ? '1px solid var(--apple-blue)' : '1px solid transparent',
        transition: 'all 0.2s',
        opacity: (!isEditing && !addon.isActive) ? 0.45 : 1,
      }}>
        {/* Emoji */}
        <span style={{ fontSize: '20px', width: '28px', textAlign: 'center', flexShrink: 0 }}>
          {isEditing ? (
            <input
              value={form.emoji}
              onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              style={{
                width: '36px', border: '1px solid var(--border-color)', borderRadius: '6px',
                background: 'var(--bg-card)', color: 'var(--text-main)', textAlign: 'center',
                fontSize: '18px', padding: '2px'
              }}
            />
          ) : addon.emoji}
        </span>

        {/* Name / Type */}
        {isEditing ? (
          <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nama add-on..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                color: 'var(--text-main)', fontSize: '13px', fontWeight: '600'
              }}
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{
                padding: '8px 10px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                color: 'var(--text-main)', fontSize: '12px', fontWeight: '600'
              }}
            >
              <option value="milk">Milk Alt.</option>
              <option value="extra">Extra</option>
            </select>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>{addon.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {addon.type === 'milk' ? '🥛 Pilihan Susu' : '✚ Tambahan'}
            </div>
          </div>
        )}

        {/* Price */}
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Rp</span>
            <input
              type="number"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              style={{
                width: '80px', padding: '8px 10px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', textAlign: 'right'
              }}
            />
          </div>
        ) : (
          <div style={{
            fontSize: '13px', fontWeight: '800',
            color: addon.price === 0 ? 'var(--apple-green)' : 'var(--apple-blue)',
            minWidth: '80px', textAlign: 'right'
          }}>
            {addon.price === 0 ? 'Gratis' : `+${formatRupiah(addon.price)}`}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          {isEditing ? (
            <>
              <button
                onClick={saveEdit}
                style={{
                  background: 'var(--apple-green)', color: '#FFF', border: 'none',
                  borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Check size={14} /> Simpan
              </button>
              <button
                onClick={cancelEdit}
                style={{
                  background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => toggleActive(addon.id)}
                title={addon.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: addon.isActive ? 'var(--apple-green)' : 'var(--text-muted)' }}
              >
                {addon.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
              <button
                onClick={() => startEdit(addon)}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px',
                  padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)'
                }}
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => deleteAddon(addon.id)}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                  padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--apple-red)'
                }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const AddForm = () => (
    <div style={{
      padding: '16px', borderRadius: '12px', border: '1.5px dashed var(--apple-blue)',
      background: 'rgba(2,132,199,0.04)', display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--apple-blue)' }}>✨ Tambah Add-on Baru</div>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 80px', gap: '8px', alignItems: 'center' }}>
        <input
          value={form.emoji}
          onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
          placeholder="🍶"
          style={{
            padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)',
            background: 'var(--bg-card)', color: 'var(--text-main)', textAlign: 'center', fontSize: '18px'
          }}
        />
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Nama add-on (contoh: Coconut Milk)"
          style={{
            padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
            background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600'
          }}
        />
        <select
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          style={{
            padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)',
            background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '12px', fontWeight: '600'
          }}
        >
          <option value="milk">🥛 Milk Alt.</option>
          <option value="extra">✚ Tambahan</option>
        </select>
        <input
          type="number"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          placeholder="Harga"
          style={{
            padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)',
            background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', textAlign: 'right'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={cancelEdit} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px',
          padding: '8px 16px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600'
        }}>Batal</button>
        <button onClick={saveNew} style={{
          background: 'var(--apple-blue)', color: '#FFF', border: 'none', borderRadius: '8px',
          padding: '8px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Plus size={15} /> Tambah Add-on
        </button>
      </div>
    </div>
  );

  const Section = ({ title, icon, items }) => (
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px',
        textTransform: 'uppercase', padding: '0 4px 8px', borderBottom: '1px solid var(--border-color)',
        marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px'
      }}>
        <span>{icon}</span> {title}
        <span style={{
          marginLeft: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)',
          borderRadius: '20px', padding: '1px 8px', fontSize: '10px', color: 'var(--text-muted)'
        }}>
          {items.filter(i => i.isActive).length} aktif
        </span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Belum ada add-on. Klik "+ Tambah" untuk menambahkan.
        </div>
      ) : (
        items.map(addon => <AddonRow key={addon.id} addon={addon} />)
      )}
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🧋</span> Manajemen Add-on &amp; Extras
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Atur pilihan susu alternatif, extra shot, topping &amp; harganya. Tampil otomatis di modal pemesanan kasir.
          </p>
        </div>
        <button
          onClick={openAddForm}
          style={{
            background: 'var(--apple-blue)', color: '#FFF', border: 'none', borderRadius: '10px',
            padding: '9px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Plus size={16} /> Tambah Add-on
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && <div style={{ marginBottom: '16px' }}><AddForm /></div>}

      {/* Milk Options Section */}
      <Section title="Pilihan Susu Alternatif" icon="🥛" items={milkAddons} />

      <div style={{ marginTop: '16px' }}>
        <Section title="Tambahan / Extras" icon="✚" items={extraAddons} />
      </div>

      <div style={{
        marginTop: '16px', padding: '12px 16px', borderRadius: '10px',
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
        fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5'
      }}>
        💡 <strong>Tips:</strong> Add-on yang dinonaktifkan tidak akan muncul di halaman kasir. Perubahan langsung berlaku tanpa perlu restart.
      </div>
    </div>
  );
};
