import React, { useState } from 'react';
import { Award, Edit3, Plus, Search, X } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { sounds } from '../../utils/audio';

const EMPTY_MEMBER = { name: '', phone: '', level: 'Bronze', points: '', totalSpent: '', joinedDate: new Date().toISOString().slice(0, 10) };
const LEVELS = ['Bronze', 'Silver', 'Gold VIP', 'Platinum'];

export const LoyaltyScreen = ({ members = [], onAddMember, onUpdateMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(EMPTY_MEMBER);

  // Tahan terhadap data member lama/null agar satu record rusak tidak membuat
  // seluruh halaman Loyalty blank.
  const filteredMembers = members.filter((member) => {
    const name = String(member?.name ?? '');
    const phone = String(member?.phone ?? '');
    const query = searchQuery.toLowerCase();

    return name.toLowerCase().includes(query) || phone.includes(searchQuery);
  });

  const openAdd = () => {
    sounds.playBeep();
    setForm({ ...EMPTY_MEMBER, joinedDate: new Date().toISOString().slice(0, 10) });
    setEditingMember({ id: null });
  };

  const openEdit = (member) => {
    sounds.playBeep();
    setForm({
      ...EMPTY_MEMBER,
      ...member,
      name: String(member?.name ?? ''),
      phone: String(member?.phone ?? ''),
      level: String(member?.level ?? 'Bronze'),
      points: Number(member?.points || 0),
      totalSpent: Number(member?.totalSpent || 0),
      joinedDate: member?.joinedDate || new Date().toISOString().slice(0, 10),
    });
    setEditingMember(member);
  };

  const saveMember = (event) => {
    event.preventDefault();

    const name = String(form.name ?? '').trim();
    const phone = String(form.phone ?? '').trim();

    if (!name || !phone) return alert('Nama dan nomor HP wajib diisi.');

    if (
      members.some(
        (member) =>
          String(member?.phone ?? '') === phone &&
          member?.id !== editingMember?.id
      )
    ) {
      return alert('Nomor HP ini sudah terdaftar sebagai member.');
    }

    const member = {
      ...form,
      id: editingMember.id || `mem-${Date.now()}`,
      name,
      phone,
      level: String(form.level || 'Bronze'),
      points: Math.max(0, Number(form.points) || 0),
      totalSpent: Math.max(0, Number(form.totalSpent) || 0),
      joinedDate: form.joinedDate || new Date().toISOString().slice(0, 10),
    };

    sounds.playSuccessChime();

    if (editingMember.id) onUpdateMember(member);
    else onAddMember(member);

    setEditingMember(null);
  };

  const Tier = ({ member }) => {
    const level = String(member?.level ?? 'Bronze');
    const premium = level.includes('VIP') || level === 'Platinum';

    return (
      <span className={`member-tier ${premium ? 'premium' : ''}`}>
        <Award size={13} />
        <span>{level}</span>
      </span>
    );
  };

  return (
    <div className="loyalty-page">
      <div className="loyalty-heading">
        <div>
          <h2><Award size={24} /> Selasar Loyalty</h2>
          <p>Kelola poin, tier, dan data pelanggan dalam satu tempat.</p>
        </div>

        <div className="loyalty-actions">
          <div className="pos-search-input">
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Cari member / No HP..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <button onClick={openAdd} className="checkout-btn">
            <Plus size={16} /> Member baru
          </button>
        </div>
      </div>

      <div className="member-table-panel">
        <div className="member-table-wrap">
          <table className="member-table">
            <thead>
              <tr>
                <th>NAMA PELANGGAN</th>
                <th>NO. TELEPON / WA</th>
                <th>TIER</th>
                <th>POIN</th>
                <th>AKUMULASI BELANJA</th>
                <th>TANGGAL GABUNG</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member?.id ?? `member-${Math.random()}`}>
                  <td>{String(member?.name ?? '-')}</td>
                  <td>{String(member?.phone ?? '-')}</td>
                  <td><Tier member={member} /></td>
                  <td className="member-points">
                    {Number(member?.points || 0)} Poin
                  </td>
                  <td className="member-spent">
                    {formatRupiah(Number(member?.totalSpent || 0))}
                  </td>
                  <td>{String(member?.joinedDate ?? '-')}</td>
                  <td className="member-action">
                    <button
                      className="icon-action"
                      title="Edit member"
                      onClick={() => openEdit(member)}
                    >
                      <Edit3 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {!filteredMembers.length && (
                <tr>
                  <td colSpan="7" className="member-empty">
                    Member tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="member-mobile-list">
        {filteredMembers.map((member) => (
          <article className="member-mobile-card" key={member?.id ?? `mobile-${Math.random()}`}>
            <div className="member-mobile-top">
              <div>
                <strong>{String(member?.name ?? '-')}</strong>
                <span>{String(member?.phone ?? '-')}</span>
              </div>
              <Tier member={member} />
            </div>

            <div className="member-mobile-stats">
              <div>
                <span>Poin</span>
                <b>{Number(member?.points || 0)}</b>
              </div>
              <div>
                <span>Total belanja</span>
                <b>{formatRupiah(Number(member?.totalSpent || 0))}</b>
              </div>
              <div>
                <span>Bergabung</span>
                <b>{String(member?.joinedDate ?? '-')}</b>
              </div>
            </div>

            <button
              type="button"
              className="member-edit-button"
              onClick={() => openEdit(member)}
            >
              <Edit3 size={15} /> Edit member
            </button>
          </article>
        ))}

        {!filteredMembers.length && (
          <div className="member-empty">Member tidak ditemukan.</div>
        )}
      </div>

      {editingMember && (
        <div
          className="modal-overlay"
          onClick={() => setEditingMember(null)}
        >
          <form
            className="modal-card"
            onSubmit={saveMember}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {editingMember.id ? 'Edit Data Member' : 'Registrasi Member'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingMember(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body member-form">
              <label>
                Nama lengkap
                <input
                  className="apple-input"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  autoFocus
                />
              </label>

              <label>
                Nomor HP / WhatsApp
                <input
                  className="apple-input"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </label>

              <label>
                Tier membership
                <select
                  className="apple-input"
                  value={form.level}
                  onChange={(event) =>
                    setForm({ ...form, level: event.target.value })
                  }
                >
                  {LEVELS.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </label>

              <label>
                Total poin
                <input
                  className="apple-input"
                  type="number"
                  min="0"
                  value={form.points}
                  onChange={(event) =>
                    setForm({ ...form, points: event.target.value })
                  }
                />
              </label>

              <label>
                Akumulasi belanja (Rp)
                <input
                  className="apple-input"
                  type="number"
                  min="0"
                  value={form.totalSpent}
                  onChange={(event) =>
                    setForm({ ...form, totalSpent: event.target.value })
                  }
                />
              </label>

              <label>
                Tanggal bergabung
                <input
                  className="apple-input"
                  type="date"
                  value={form.joinedDate}
                  onChange={(event) =>
                    setForm({ ...form, joinedDate: event.target.value })
                  }
                />
              </label>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="receipt-action"
                onClick={() => setEditingMember(null)}
              >
                Batal
              </button>
              <button className="btn-primary" type="submit">
                Simpan perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
