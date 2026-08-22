import React, { useEffect, useMemo, useState } from 'react';
import { Coffee, Image as ImageIcon, Package, Utensils } from 'lucide-react';

const getVisualMeta = (category = '') => {
  const value = String(category).toLowerCase();
  if (value.includes('espresso') || value.includes('signature') || value.includes('coffee') || value.includes('manual')) return { Icon: Coffee, tone: 'coffee', label: 'Coffee' };
  if (value.includes('pastry') || value.includes('snack') || value.includes('food')) return { Icon: Utensils, tone: 'food', label: 'Food' };
  if (value.includes('bean') || value.includes('retail')) return { Icon: Package, tone: 'retail', label: 'Retail' };
  if (value.includes('noncoffee') || value.includes('tea') || value.includes('drink')) return { Icon: Coffee, tone: 'fresh', label: 'Drink' };
  return { Icon: ImageIcon, tone: 'default', label: 'Menu' };
};

export const ProductImage = ({ src, alt, name, category, className = '', style }) => {
  const [failed, setFailed] = useState(false);
  const meta = useMemo(() => getVisualMeta(category), [category]);

  useEffect(() => setFailed(false), [src]);

  const hasImage = Boolean(String(src || '').trim()) && !failed;
  const displayName = String(name || alt || 'Menu').trim();
  const Icon = meta.Icon;

  return <div className={`product-visual product-visual-${meta.tone} ${className}`} style={style}>
    {hasImage
      ? <img className="product-visual-img" src={src} alt={alt || displayName} onError={() => setFailed(true)} loading="lazy" />
      : <div className="product-visual-placeholder" role="img" aria-label={`Placeholder ${displayName}`}>
          <span className="product-visual-icon"><Icon size={22} /></span>
          <span className="product-visual-brand">SELASAR</span>
          <strong>{displayName}</strong>
          <small>{meta.label}</small>
        </div>}
  </div>;
};
