import React, { useState } from 'react';
import { LayoutGrid, Users, Edit3, Plus, Trash2, X } from 'lucide-react';
import { sounds } from '../../utils/audio';

const EMPTY_TABLE = { name: '', zone: 'Indoor', capacity: 2, status: 'available' };
const STATUS = { available: ['Kosong', '#10B981'], occupied: ['Terisi', '#EF4444'], reserved: ['Reservasi', '#F59E0B'], cleaning: ['Pembersihan', '#3B82F6'] };

export const TableManagement = ({ tables, onSaveTable, onDeleteTable, onSelectTableForOrder }) => {
  const [editingTable, setEditingTable] = useState(null);
  const [form, setForm] = useState(EMPTY_TABLE);
  const editTable = (table) => { sounds.playBeep(); setEditingTable(table || { id: null }); setForm(table ? { ...table } : EMPTY_TABLE); };
  const saveTable = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    sounds.playSuccessChime();
    onSaveTable({ ...form, id: editingTable.id || `table-${Date.now()}`, name: form.name.trim(), capacity: Number(form.capacity) || 1, currentOrderId: form.currentOrderId || null });
    setEditingTable(null);
  };
  const deleteTable = (table) => {
    if (table.status === 'occupied') return alert('Meja yang sedang terisi tidak dapat dihapus. Selesaikan pesanan terlebih dahulu.');
    if (window.confirm(`Hapus ${table.name}?`)) { sounds.playBeep(); onDeleteTable(table.id); }
  };

  return <div className="table-management-page">
    <header className="tables-header"><div><h2><LayoutGrid size={24} /> Meja & Area</h2><p>Sesuaikan meja, nomor, area, kapasitas, dan status untuk coffee shop Anda.</p></div><button className="btn-primary" onClick={() => editTable(null)}><Plus size={17} /> Tambah meja</button></header>
    <div className="table-summary">{Object.entries(STATUS).map(([key, [label, color]]) => <span key={key}><i style={{ background: color }} />{label}: {tables.filter(table => table.status === key).length}</span>)}</div>
    <section className="tables-grid">{tables.map(table => { const [label, color] = STATUS[table.status] || STATUS.available; const canOrder = table.status === 'available'; return <article className="table-card" key={table.id} style={{ '--table-status': color }}><div className="table-card-top"><div><small>{table.zone || 'Tanpa area'}</small><h3>{table.name}</h3></div><span className="table-status">{label}</span></div><div className="table-capacity"><Users size={15} /> Kapasitas {table.capacity} orang</div><footer><button className="icon-action" title="Edit meja" onClick={() => editTable(table)}><Edit3 size={16} /></button><button className="icon-action danger" title="Hapus meja" onClick={() => deleteTable(table)}><Trash2 size={16} /></button><button className="table-order" disabled={!canOrder} title={canOrder ? 'Buat pesanan untuk meja ini' : 'Hanya meja kosong yang dapat menerima pesanan baru'} onClick={() => onSelectTableForOrder(table)}>{canOrder ? 'Buat pesanan' : label}</button></footer></article>; })}</section>
    {tables.length === 0 && <div className="empty-state">Belum ada meja. Tambahkan area dan meja pertama Anda.</div>}
    {editingTable && <div className="modal-overlay" onClick={() => setEditingTable(null)}><form className="modal-card table-form" onSubmit={saveTable} onClick={event => event.stopPropagation()}><div className="modal-header"><h3>{editingTable.id ? 'Edit meja' : 'Tambah meja'}</h3><button type="button" className="modal-close" onClick={() => setEditingTable(null)}><X size={19} /></button></div><div className="modal-body table-form-grid"><label>Nama atau nomor meja<input className="apple-input" value={form.name} placeholder="Contoh: Meja 01" onChange={event => setForm({ ...form, name: event.target.value })} autoFocus /></label><label>Area / zona<input className="apple-input" value={form.zone || ''} placeholder="Contoh: Teras" onChange={event => setForm({ ...form, zone: event.target.value })} /></label><label>Kapasitas<input className="apple-input" type="number" min="1" value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} /></label><label>Status<select className="apple-input" value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}>{Object.entries(STATUS).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}</select></label></div><div className="modal-footer"><button type="button" className="receipt-action" onClick={() => setEditingTable(null)}>Batal</button><button className="btn-primary" type="submit">Simpan meja</button></div></form></div>}
  </div>;
};
