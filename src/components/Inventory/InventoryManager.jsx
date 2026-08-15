import React, { useState } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ShoppingBag,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { sounds } from '../../utils/audio';

const getDefaultPackSize = (unit) => {
  if (unit === 'pcs') return 1;
  if (unit === 'cup') return 1;
  // Base stock is stored in the selected unit.
  // For volume: 1 L = 1000 ml.
  // For weight: 1 kg = 1000 g.
  if (unit === 'liter') return 1;
  return 1000;
};

const normalizePackSize = (value, unit) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return getDefaultPackSize(unit);
  }
  return numeric;
};

const formatUnitValue = (value, unit) => {
  const numeric = Number(value || 0);
  if (unit === 'liter' || unit === 'ml' || unit === 'g' || unit === 'pcs' || unit === 'cup') {
    return numeric.toLocaleString('id-ID', {
      maximumFractionDigits: 3
    });
  }
  return numeric.toLocaleString('id-ID');
};

const getDefaultPackUnitName = (unit) => {
  if (unit === 'ml') return 'Botol';
  if (unit === 'liter') return 'Jerigen';
  if (unit === 'g') return 'Pack';
  if (unit === 'pcs') return 'Pcs';
  if (unit === 'cup') return 'Cup';
  return 'Kemasan';
};

export const InventoryManager = ({ inventory = [], setInventory }) => {
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
      const unit = item.unit || 'ml';

      setFormData({
        ...item,
        id: item.id || '',
        name: item.name || '',
        stock: Number(item.stock || 0),
        unit,
        minStock: Number(item.minStock || 0),
        packSize: Number(item.packSize || getDefaultPackSize(unit)),
        packUnitName: item.packUnitName || getDefaultPackUnitName(unit),
        costPerUnit: Number(item.costPerUnit || 0)
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

  const handleUnitChange = (unit) => {
    setFormData((prev) => ({
      ...prev,
      unit,
      packSize:
        prev.packSize === 1000 || !prev.packSize
          ? getDefaultPackSize(unit)
          : prev.packSize,
      packUnitName:
        !prev.packUnitName ||
        ['Botol', 'Jerigen', 'Pack', 'Pcs', 'Cup', 'Kemasan'].includes(prev.packUnitName)
          ? getDefaultPackUnitName(unit)
          : prev.packUnitName
    }));
  };

  const handleNumericChange = (field, rawValue, fallback = 0) => {
    const cleaned = String(rawValue ?? '');

    // Let the user temporarily clear the field instead of forcing "0"
    // back into it while typing.
    if (cleaned === '') {
      setFormData((prev) => ({ ...prev, [field]: '' }));
      return;
    }

    const numeric = field === 'costPerUnit'
      ? parseFloat(cleaned)
      : parseFloat(cleaned);

    setFormData((prev) => ({
      ...prev,
      [field]: Number.isFinite(numeric) ? numeric : fallback
    }));
  };

  const selectZeroOnFocus = (event) => {
    const input = event.currentTarget;
    if (String(input.value) === '0') {
      requestAnimationFrame(() => {
        try { input.select(); } catch {}
      });
    }
  };

  const handleOpenRestock = (item) => {
    sounds.playBeep();
    setRestockItem(item);
    setRestockPacksQty(1);
  };

  const handleConfirmRestock = () => {
    if (!restockItem) return;

    const packSize =
      Number(restockItem.packSize) || getDefaultPackSize(restockItem.unit);

    const packages = Number(restockPacksQty);
    const addedAmount = packages * packSize;

    if (!Number.isFinite(packages) || packages <= 0 || addedAmount <= 0) {
      return alert('Jumlah pembelian harus lebih dari 0!');
    }

    sounds.playCashRegister();

    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === restockItem.id) {
          return {
            ...item,
            stock: Number(item.stock || 0) + addedAmount
          };
        }

        return item;
      })
    );

    setRestockItem(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      return alert('Nama bahan baku harus diisi!');
    }

    const normalized = {
      ...formData,
      name: formData.name.trim(),
      stock: Number.isFinite(Number(formData.stock)) ? Number(formData.stock) : 0,
      minStock: Number.isFinite(Number(formData.minStock)) ? Number(formData.minStock) : 0,
      packSize: normalizePackSize(formData.packSize, formData.unit),
      costPerUnit: Number(formData.costPerUnit) || 0,
      unit: formData.unit || 'ml',
      packUnitName: formData.packUnitName?.trim() || getDefaultPackUnitName(formData.unit)
    };

    setInventory((prev) => {
      const exists = prev.find((item) => item.id === normalized.id);

      if (exists) {
        return prev.map((item) =>
          item.id === normalized.id ? normalized : item
        );
      }

      return [normalized, ...prev];
    });

    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus bahan baku ini?')) {
      setInventory((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="inventory-page">
      <div className="inventory-heading">
        <div>
          <h2>Manajemen Bahan Baku &amp; Restock Kemasan</h2>
          <p>
            Kelola stok dalam ml, liter, gram, pieces, atau cup dan hitung
            kesetaraan unit kemasan.
          </p>
        </div>

        <button
          onClick={() => handleOpenEdit()}
          className="btn-primary inventory-add-button"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Tambah Bahan Baku
        </button>
      </div>

      <div className="apple-table-container inventory-table-container">
        <table className="apple-table inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Bahan Baku</th>
              <th>Stok (Total Volume / Berat)</th>
              <th>Stok Fisik Kemasan</th>
              <th>Stok Minimum</th>
              <th>HPP / Unit</th>
              <th className="inventory-action-column">Aksi &amp; Restock</th>
            </tr>
          </thead>

          <tbody>
            {inventory.map((item) => {
              const unit = item.unit || 'ml';
              const stock = Number(item.stock || 0);
              const packSize =
                Number(item.packSize) || getDefaultPackSize(unit);
              const packUnitName =
                item.packUnitName || getDefaultPackUnitName(unit);
              const packCount =
                packSize > 0 ? (stock / packSize).toFixed(1) : stock;
              const isLow = stock <= Number(item.minStock || 0);

              return (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {String(item.id || '').substring(0, 8)}
                  </td>

                  <td>
                    <div style={{ fontWeight: '700' }}>
                      {item.name || 'Bahan tanpa nama'}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)'
                      }}
                    >
                      1 {packUnitName} = {packSize} {unit}
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        color: isLow
                          ? 'var(--apple-red)'
                          : 'var(--apple-green)',
                        fontWeight: '800',
                        fontSize: '15px'
                      }}
                    >
                      {stock.toLocaleString('id-ID')} {unit}
                    </span>
                  </td>

                  <td>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(2, 132, 199, 0.08)',
                        color: 'var(--apple-blue)',
                        fontWeight: '700',
                        fontSize: '12px',
                        display: 'inline-block'
                      }}
                    >
                      📦 ~ {packCount} {packUnitName}
                    </div>
                  </td>

                  <td style={{ color: 'var(--text-muted)' }}>
                    {Number(item.minStock || 0).toLocaleString('id-ID')} {unit}
                  </td>

                  <td>{formatRupiah(Number(item.costPerUnit || 0))}</td>

                  <td className="inventory-action-column">
                    <div className="inventory-actions">
                      <button
                        onClick={() => handleOpenRestock(item)}
                        className="inventory-restock-button"
                        title={`Restock ${packUnitName}`}
                      >
                        <PlusCircle size={14} />
                        <span>Restock {packUnitName}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="inventory-icon-button edit"
                        title="Edit bahan baku"
                        aria-label="Edit bahan baku"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inventory-icon-button delete"
                        title="Hapus bahan baku"
                        aria-label="Hapus bahan baku"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {inventory.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: 'center',
                    padding: '30px',
                    color: 'var(--text-muted)'
                  }}
                >
                  Belum ada bahan baku terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {restockItem && (
        <div
          className="modal-overlay"
          onClick={() => setRestockItem(null)}
        >
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ShoppingBag size={18} color="var(--apple-green)" />
                <span>Restock Pembelian Bahan Baku</span>
              </h3>

              <button
                onClick={() => setRestockItem(null)}
                className="modal-close"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div
                style={{
                  background: 'var(--bg-main)',
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <h4 style={{ fontSize: '15px', fontWeight: '800' }}>
                  {restockItem.name}
                </h4>

                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '4px'
                  }}
                >
                  Ukuran per 1 {restockItem.packUnitName || 'Kemasan'}:{' '}
                  <strong>
                    {restockItem.packSize ||
                      getDefaultPackSize(restockItem.unit)}
                    {' '}
                    {restockItem.unit}
                  </strong>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '6px'
                  }}
                >
                  JUMLAH{' '}
                  {restockItem.packUnitName?.toUpperCase() ||
                    'UNIT KEMASAN'}{' '}
                  DIBELI / DITAMBAH:
                </label>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <input
                    type="number"
                    min="1"
                    className="apple-input"
                    style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      textAlign: 'center'
                    }}
                    value={restockPacksQty}
                    onFocus={selectZeroOnFocus}
                    onChange={(event) => {
                      const raw = event.target.value;
                      setRestockPacksQty(raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0));
                    }}
                  />

                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: 'var(--apple-blue)',
                      minWidth: '80px'
                    }}
                  >
                    {restockItem.packUnitName || 'Kemasan'}
                  </span>
                </div>
              </div>

              {(() => {
                const packSize =
                  Number(restockItem.packSize) ||
                  getDefaultPackSize(restockItem.unit);
                const packUnitName =
                  restockItem.packUnitName ||
                  getDefaultPackUnitName(restockItem.unit);
                const addedVolume =
                  Number(restockPacksQty || 0) * packSize;
                const newTotalVolume =
                  Number(restockItem.stock || 0) + addedVolume;
                const newPacksCount =
                  packSize > 0
                    ? (newTotalVolume / packSize).toFixed(1)
                    : newTotalVolume;

                return (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '14px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontSize: '13px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px'
                      }}
                    >
                      <span>
                        Pertambahan Stok ({Number(restockPacksQty || 0).toLocaleString('id-ID')} {packUnitName}):
                      </span>
                      <strong style={{ color: 'var(--apple-green)' }}>
                        + {addedVolume.toLocaleString('id-ID')} {restockItem.unit}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <span>Stok Sebelum Restock:</span>
                      <span>
                        {Number(restockItem.stock || 0).toLocaleString('id-ID')}{' '}
                        {restockItem.unit}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px dashed var(--border-color)',
                        fontWeight: '800',
                        color: 'var(--apple-blue)'
                      }}
                    >
                      <span>STOK BARU SETELAH RESTOCK:</span>
                      <span>
                        {newTotalVolume.toLocaleString('id-ID')}{' '}
                        {restockItem.unit} (~ {newPacksCount} {packUnitName})
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setRestockItem(null)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                type="button"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmRestock}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--apple-green)'
                }}
              >
                <CheckCircle2 size={18} /> Konfirmasi Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{ maxWidth: '520px' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {formData.id.startsWith('inv-') &&
                !inventory.find((item) => item.id === formData.id)
                  ? 'Tambah Bahan Baku Baru'
                  : 'Edit Bahan Baku'}
              </h3>

              <button
                onClick={() => setIsEditing(false)}
                className="modal-close"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    marginBottom: '6px'
                  }}
                >
                  Nama Bahan Baku
                </label>

                <input
                  type="text"
                  className="apple-input"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      name: event.target.value
                    })
                  }
                  placeholder="Misal: Fresh Milk Pasteurisasi / Susu Diamond"
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}
                className="inventory-editor-grid"
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px'
                    }}
                  >
                    Total Stok Saat Ini
                  </label>

                  <input
                    type="number"
                    className="apple-input"
                    value={formData.stock}
                    onFocus={selectZeroOnFocus}
                    onChange={(event) =>
                      handleNumericChange('stock', event.target.value, 0)
                    }
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px'
                    }}
                  >
                    Satuan Dasar (Unit)
                  </label>

                  <select
                    className="apple-input"
                    value={formData.unit}
                    onChange={(event) =>
                      handleUnitChange(event.target.value)
                    }
                  >
                    <option value="ml">Mililiter (ml)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="g">Gram (g)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="cup">Cup</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}
                className="inventory-editor-grid"
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px'
                    }}
                  >
                    Isi 1 Kemasan
                  </label>

                  <input
                    type="number"
                    className="apple-input"
                    value={formData.packSize}
                    onFocus={selectZeroOnFocus}
                    onChange={(event) =>
                      handleNumericChange('packSize', event.target.value, 1)
                    }
                    placeholder={
                      formData.unit === 'liter'
                        ? 'Misal: 1 untuk 1 L'
                        : 'Misal: 1000 untuk 1000 ml'
                    }
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px'
                    }}
                  >
                    Nama Unit Kemasan Fisik
                  </label>

                  <input
                    type="text"
                    className="apple-input"
                    value={formData.packUnitName}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        packUnitName: event.target.value
                      })
                    }
                    placeholder="Misal: Botol / Jerigen / Pack / Karton"
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}
                className="inventory-editor-grid"
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px'
                    }}
                  >
                    Peringatan Stok Minimum
                  </label>

                  <input
                    type="number"
                    className="apple-input"
                    value={formData.minStock}
                    onFocus={selectZeroOnFocus}
                    onChange={(event) =>
                      handleNumericChange('minStock', event.target.value, 0)
                    }
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px'
                    }}
                  >
                    Harga Modal (HPP) / Unit Dasar
                  </label>

                  <input
                    type="number"
                    className="apple-input"
                    value={formData.costPerUnit}
                    onFocus={selectZeroOnFocus}
                    onChange={(event) =>
                      handleNumericChange('costPerUnit', event.target.value, 0)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                type="button"
              >
                Batal
              </button>

              <button
                onClick={handleSave}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save size={18} /> Simpan Bahan Baku
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};