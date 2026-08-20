import React, { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, ShoppingBag, PlusCircle, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { sounds } from '../../utils/audio';

const UNIT_META = {
  ml:     { label: 'Mililiter (ml)', family: 'volume', factor: 1,    defaultPackSize: 1000, defaultPackUnitName: 'Botol' },
  liter:  { label: 'Liter (L)',      family: 'volume', factor: 1000, defaultPackSize: 1,    defaultPackUnitName: 'Kemasan' },
  g:      { label: 'Gram (g)',       family: 'weight', factor: 1,    defaultPackSize: 1000, defaultPackUnitName: 'Pack' },
  kg:     { label: 'Kilogram (kg)',  family: 'weight', factor: 1000, defaultPackSize: 1,    defaultPackUnitName: 'Kemasan' },
  pcs:    { label: 'Pieces (pcs)',   family: 'count',  factor: 1,    defaultPackSize: 1,    defaultPackUnitName: 'Pcs' },
  cup:    { label: 'Cup',            family: 'count',  factor: 1,    defaultPackSize: 1,    defaultPackUnitName: 'Cup' },
};

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const roundQty = (value) => Math.round((safeNumber(value) + Number.EPSILON) * 100000) / 100000;
const meta = (unit) => UNIT_META[unit] || UNIT_META.ml;

const convertQuantity = (value, fromUnit, toUnit) => {
  const from = meta(fromUnit);
  const to = meta(toUnit);
  const amount = safeNumber(value);
  if (from.family !== to.family) return amount;
  if (from.family === 'count') return amount;
  return (amount * from.factor) / to.factor;
};

const normalizeItem = (item = {}) => {
  const unit = UNIT_META[item.unit] ? item.unit : 'ml';
  const m = meta(unit);
  return {
    ...item,
    id: item.id || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(item.name || item.ingredientName || '').trim(),
    unit,
    stock: roundQty(item.stock ?? item.quantity ?? 0),
    minStock: roundQty(item.minStock ?? item.minimumStock ?? 0),
    packSize: roundQty(safeNumber(item.packSize, m.defaultPackSize) || m.defaultPackSize),
    packUnitName: String(item.packUnitName || m.defaultPackUnitName).trim() || m.defaultPackUnitName,
    costPerUnit: roundQty(item.costPerUnit ?? 0),
  };
};

const fmt = (value) => safeNumber(value).toLocaleString('id-ID', { maximumFractionDigits: 3 });

export const InventoryManager = ({ inventory = [], setInventory }) => {
  const items = useMemo(() => inventory.map(normalizeItem), [inventory]);
  const [isEditing, setIsEditing] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(1);
  const [form, setForm] = useState({
    id: '', name: '', stock: 0, unit: 'liter', minStock: 1,
    packSize: 1, packUnitName: 'Kemasan', costPerUnit: 0,
  });

  const openEdit = (item = null) => {
    if (item) {
      const x = normalizeItem(item);
      setForm({
        id: x.id, name: x.name, stock: x.stock, unit: x.unit,
        minStock: x.minStock, packSize: x.packSize,
        packUnitName: x.packUnitName, costPerUnit: x.costPerUnit,
      });
    } else {
      setForm({ id: `inv-${Date.now()}`, name: '', stock: 0, unit: 'liter', minStock: 1, packSize: 1, packUnitName: 'Kemasan', costPerUnit: 0 });
    }
    sounds.playBeep();
    setIsEditing(true);
  };

  const changeUnit = (nextUnit) => {
    setForm(prev => {
      const prevMeta = meta(prev.unit);
      const nextMeta = meta(nextUnit);
      const wasDefaultPack = Math.abs(safeNumber(prev.packSize) - prevMeta.defaultPackSize) < 1e-9;
      return {
        ...prev,
        unit: nextUnit,
        stock: roundQty(convertQuantity(prev.stock, prev.unit, nextUnit)),
        minStock: roundQty(convertQuantity(prev.minStock, prev.unit, nextUnit)),
        packSize: roundQty(wasDefaultPack ? nextMeta.defaultPackSize : convertQuantity(prev.packSize, prev.unit, nextUnit)),
        packUnitName: (!prev.packUnitName || prev.packUnitName === prevMeta.defaultPackUnitName) ? nextMeta.defaultPackUnitName : prev.packUnitName,
      };
    });
  };

  const openRestock = (item) => {
    setRestockItem(normalizeItem(item));
    setRestockQty(1);
    sounds.playBeep();
  };

  const confirmRestock = () => {
    if (!restockItem) return;
    const x = normalizeItem(restockItem);
    const packs = Math.max(0, Math.floor(safeNumber(restockQty, 0)));
    if (packs <= 0) return alert('Jumlah kemasan harus lebih dari 0.');
    if (x.packSize <= 0) return alert(`Ukuran 1 ${x.packUnitName} belum valid.`);

    const added = roundQty(packs * x.packSize);
    setInventory(prev => prev.map(item => {
      if (item.id !== x.id) return item;
      const current = normalizeItem(item);
      return { ...item, unit: current.unit, packSize: current.packSize, packUnitName: current.packUnitName, stock: roundQty(current.stock + added), minStock: current.minStock };
    }));
    sounds.playCashRegister();
    setRestockItem(null);
  };

  const save = () => {
    const name = String(form.name || '').trim();
    if (!name) return alert('Nama bahan baku harus diisi.');
    if (!UNIT_META[form.unit]) return alert('Satuan tidak valid.');
    if (safeNumber(form.packSize) <= 0) return alert(`Isi 1 ${form.packUnitName || meta(form.unit).defaultPackUnitName} harus lebih dari 0 ${form.unit}.`);

    const normalized = normalizeItem({
      ...form,
      name,
      stock: form.stock,
      minStock: form.minStock,
      packSize: form.packSize,
      packUnitName: form.packUnitName,
      costPerUnit: form.costPerUnit,
    });

    setInventory(prev => prev.some(x => x.id === normalized.id)
      ? prev.map(x => x.id === normalized.id ? { ...x, ...normalized } : x)
      : [normalized, ...prev]
    );
    sounds.playSuccessChime();
    setIsEditing(false);
  };

  const remove = (id) => {
    if (window.confirm('Yakin ingin menghapus bahan baku ini?')) setInventory(prev => prev.filter(x => x.id !== id));
  };

  return (
    <div className="inventory-page">
      <div className="inventory-heading">
        <div>
          <h2>Manajemen Bahan Baku &amp; Restock Kemasan</h2>
          <p>1 L = 1000 ml · 1 kg = 1000 g · restock selalu menambah sesuai isi 1 kemasan.</p>
        </div>
        <button className="btn-primary inventory-add-button" onClick={() => openEdit()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Tambah Bahan Baku
        </button>
      </div>

      <div className="apple-table-container inventory-table-container">
        <table className="apple-table inventory-table">
          <thead>
            <tr>
              <th>ID</th><th>Nama Bahan</th><th>Stok Saat Ini</th><th>Isi 1 Kemasan</th><th>Stok Fisik</th><th>Stok Minimum</th><th>HPP / Unit Dasar</th><th className="inventory-action-column">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const packs = item.packSize > 0 ? item.stock / item.packSize : 0;
              const low = item.stock <= item.minStock;
              return (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{String(item.id).slice(0, 8)}</td>
                  <td><div style={{ fontWeight: 700 }}>{item.name || 'Bahan tanpa nama'}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>1 {item.packUnitName} = {fmt(item.packSize)} {item.unit}</div></td>
                  <td><b style={{ color: low ? 'var(--apple-red)' : 'var(--apple-green)' }}>{fmt(item.stock)} {item.unit}</b></td>
                  <td>{fmt(item.packSize)} {item.unit} / {item.packUnitName}</td>
                  <td>{fmt(packs)} {item.packUnitName}</td>
                  <td>{fmt(item.minStock)} {item.unit}</td>
                  <td>{formatRupiah(item.costPerUnit)}</td>
                  <td className="inventory-action-column"><div className="inventory-actions">
                    <button type="button" className="inventory-restock-button" onClick={() => openRestock(item)} title={`Restock ${item.packUnitName}`}><PlusCircle size={14} /><span>Restock {item.packUnitName}</span></button>
                    <button type="button" className="inventory-icon-button edit" onClick={() => openEdit(item)} title="Edit"><Edit2 size={16} /></button>
                    <button type="button" className="inventory-icon-button delete" onClick={() => remove(item.id)} title="Hapus"><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              );
            })}
            {!items.length && <tr><td colSpan="8" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Belum ada bahan baku.</td></tr>}
          </tbody>
        </table>
      </div>

      {restockItem && <div className="modal-overlay" onClick={() => setRestockItem(null)}>
        <div className="modal-card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingBag size={18} /> Restock {restockItem.name}</h3><button className="modal-close" onClick={() => setRestockItem(null)} type="button"><X size={18} /></button></div>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>1 {restockItem.packUnitName} =</div>
              <strong style={{ fontSize: 18 }}>{fmt(restockItem.packSize)} {restockItem.unit}</strong>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Contoh: Susu UHT Diamond 1 L → 1 kemasan menambah 1 L.</div>
            </div>
            <div><label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>JUMLAH {restockItem.packUnitName.toUpperCase()} DIBELI</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><input className="apple-input" type="number" min="1" step="1" value={restockQty} onChange={e => setRestockQty(Math.max(1, Math.floor(safeNumber(e.target.value, 1))))} /><span style={{ fontWeight: 700 }}>{restockItem.packUnitName}</span></div>
            </div>
            {(() => { const add = roundQty(restockQty * restockItem.packSize); const next = roundQty(restockItem.stock + add); return <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tambah:</span><b>+{fmt(add)} {restockItem.unit}</b></div><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span>Stok baru:</span><b>{fmt(next)} {restockItem.unit}</b></div></div>; })()}
          </div>
          <div className="modal-footer"><button type="button" className="receipt-action" onClick={() => setRestockItem(null)}>Batal</button><button type="button" className="btn-primary" onClick={confirmRestock} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--apple-green)' }}><CheckCircle2 size={18} /> Konfirmasi Restock</button></div>
        </div>
      </div>}

      {isEditing && <div className="modal-overlay" onClick={() => setIsEditing(false)}>
        <div className="modal-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{items.some(x => x.id === form.id) ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}</h3><button className="modal-close" onClick={() => setIsEditing(false)} type="button"><X size={18} /></button></div>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label>Nama Bahan Baku<input className="apple-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Susu UHT Diamond" /></label>
            <div className="inventory-editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label>Stok Saat Ini<input className="apple-input" type="number" min="0" step="0.001" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: safeNumber(e.target.value) }))} /></label>
              <label>Satuan Dasar<select className="apple-input" value={form.unit} onChange={e => changeUnit(e.target.value)}>
                <option value="ml">Mililiter (ml)</option><option value="liter">Liter (L)</option><option value="g">Gram (g)</option><option value="kg">Kilogram (kg)</option><option value="pcs">Pieces (pcs)</option><option value="cup">Cup</option>
              </select></label>
            </div>
            <div className="inventory-editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label>Isi 1 Kemasan<input className="apple-input" type="number" min="0.001" step="0.001" value={form.packSize} onChange={e => setForm(p => ({ ...p, packSize: safeNumber(e.target.value) }))} /><small>Contoh susu UHT 1 L: satuan Liter, isi kemasan 1.</small></label>
              <label>Nama Kemasan<input className="apple-input" value={form.packUnitName} onChange={e => setForm(p => ({ ...p, packUnitName: e.target.value }))} placeholder="Kemasan / Botol / Karton / Jerigen" /></label>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(37,99,235,.07)', border: '1px solid rgba(37,99,235,.14)', fontSize: 12, lineHeight: 1.5 }}><b>Logika stok:</b> 1 L = 1000 ml dan 1 kg = 1000 g. Restock selalu mengalikan jumlah kemasan × isi 1 kemasan.</div>
            <div className="inventory-editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label>Stok Minimum<input className="apple-input" type="number" min="0" step="0.001" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: safeNumber(e.target.value) }))} /></label>
              <label>HPP / Unit Dasar<input className="apple-input" type="number" min="0" step="0.01" value={form.costPerUnit} onChange={e => setForm(p => ({ ...p, costPerUnit: safeNumber(e.target.value) }))} /></label>
            </div>
          </div>
          <div className="modal-footer"><button type="button" className="receipt-action" onClick={() => setIsEditing(false)}>Batal</button><button type="button" className="btn-primary" onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={18} /> Simpan</button></div>
        </div>
      </div>}
    </div>
  );
};
