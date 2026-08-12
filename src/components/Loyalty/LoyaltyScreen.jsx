import React, { useState } from 'react';
import { Award, Edit3, Plus, Search, X } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { sounds } from '../../utils/audio';

const EMPTY_MEMBER = { name: '', phone: '', level: 'Bronze', points: 50, totalSpent: 0, joinedDate: new Date().toISOString().slice(0, 10) };
const LEVELS = ['Bronze', 'Silver', 'Gold VIP', 'Platinum'];

export const LoyaltyScreen = ({ members = [], onAddMember, onUpdateMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(EMPTY_MEMBER);
  const filteredMembers = members.filter(member => member.name.toLowerCase().includes(searchQuery.toLowerCase()) || member.phone.includes(searchQuery));

  const openAdd = () => { sounds.playBeep(); setForm({ ...EMPTY_MEMBER, joinedDate: new Date().toISOString().slice(0, 10) }); setEditingMember({ id: null }); };
  const openEdit = member => { sounds.playBeep(); setForm({ ...member, points: Number(member.points || 0), totalSpent: Number(member.totalSpent || 0) }); setEditingMember(member); };
  const saveMember = event => {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name || !phone) return alert('Nama dan nomor HP wajib diisi.');
    if (members.some(member => member.phone === phone && member.id !== editingMember.id)) return alert('Nomor HP ini sudah terdaftar sebagai member.');
    const member = { ...form, id: editingMember.id || `mem-${Date.now()}`, name, phone, points: Math.max(0, Number(form.points) || 0), totalSpent: Math.max(0, Number(form.totalSpent) || 0), joinedDate: form.joinedDate || new Date().toISOString().slice(0, 10) };
    sounds.playSuccessChime();
    if (editingMember.id) onUpdateMember(member); else onAddMember(member);
    setEditingMember(null);
  };

  const Tier = ({ member }) => {
    const premium = member.level.includes('VIP') || member.level === 'Platinum';
    return <span className={`member-tier ${premium ? 'premium' : ''}`}><Award size={13} /><span>{member.level}</span></span>;
  };

  return (
    <div className="loyalty-page">
      <div className="loyalty-heading">
        <div><h2><Award size={24} /> Selasar Loyalty</h2><p>Kelola poin, tier, dan data pelanggan dalam satu tempat.</p></div>
        <div className="loyalty-actions"><div className="pos-search-input"><Search size={16} color="var(--text-muted)" /><input type="text" placeholder="Cari member / No HP..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} /></div><button onClick={openAdd} className="checkout-btn"><Plus size={16} /> Member baru</button></div>
      </div>

      <div className="member-table-panel"><div className="member-table-wrap"><table className="member-table"><thead><tr><th>NAMA PELANGGAN</th><th>NO. TELEPON / WA</th><th>TIER</th><th>POIN</th><th>AKUMULASI BELANJA</th><th>TANGGAL GABUNG</th><th>AKSI</th></tr></thead><tbody>
        {filteredMembers.map(member => <tr key={member.id}><td>{member.name}</td><td>{member.phone}</td><td><Tier member={member} /></td><td className="member-points">{member.points} Poin</td><td className="member-spent">{formatRupiah(member.totalSpent)}</td><td>{member.joinedDate}</td><td className="member-action"><button className="icon-action" title="Edit member" onClick={() => openEdit(member)}><Edit3 size={16} /></button></td></tr>)}
        {!filteredMembers.length && <tr><td colSpan="7" className="member-empty">Member tidak ditemukan.</td></tr>}
      </tbody></table></div></div>

      <div className="member-mobile-list">{filteredMembers.map(member => <article className="member-mobile-card" key={member.id}><div className="member-mobile-top"><div><strong>{member.name}</strong><span>{member.phone}</span></div><Tier member={member} /></div><div className="member-mobile-stats"><div><span>Poin</span><b>{member.points}</b></div><div><span>Total belanja</span><b>{formatRupiah(member.totalSpent)}</b></div><div><span>Bergabung</span><b>{member.joinedDate}</b></div></div><button type="button" className="member-edit-button" onClick={() => openEdit(member)}><Edit3 size={15} /> Edit member</button></article>)}{!filteredMembers.length && <div className="member-empty">Member tidak ditemukan.</div>}</div>

      {editingMember && <div className="modal-overlay" onClick={() => setEditingMember(null)}><form className="modal-card" onSubmit={saveMember} onClick={event => event.stopPropagation()}><div className="modal-header"><h3>{editingMember.id ? 'Edit Data Member' : 'Registrasi Member'}</h3><button type="button" className="modal-close" onClick={() => setEditingMember(null)}><X size={18} /></button></div><div className="modal-body member-form"><label>Nama lengkap<input className="apple-input" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} autoFocus /></label><label>Nomor HP / WhatsApp<input className="apple-input" inputMode="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label><label>Tier membership<select className="apple-input" value={form.level} onChange={event => setForm({ ...form, level: event.target.value })}>{LEVELS.map(level => <option key={level}>{level}</option>)}</select></label><label>Total poin<input className="apple-input" type="number" min="0" value={form.points} onChange={event => setForm({ ...form, points: event.target.value })} /></label><label>Akumulasi belanja (Rp)<input className="apple-input" type="number" min="0" value={form.totalSpent} onChange={event => setForm({ ...form, totalSpent: event.target.value })} /></label><label>Tanggal bergabung<input className="apple-input" type="date" value={form.joinedDate} onChange={event => setForm({ ...form, joinedDate: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="receipt-action" onClick={() => setEditingMember(null)}>Batal</button><button className="btn-primary" type="submit">Simpan perubahan</button></div></form></div>}
    </div>
  );
};
