import React from 'react';

const SIZE_CONFIG = {
  sm: { width: 124, height: 45 },
  md: { width: 150, height: 50 },
  lg: { width: 188, height: 62 },
  xl: { width: 228, height: 74 },
};

export const SelasarLogo = ({ size = 'md', variant = 'light', showTagline = false }) => {
  const cfg = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  return (
    <div
      className={`selasar-brand-logo selasar-brand-logo-${variant}`}
      title="Kedai Kopi Selasar"
      aria-label="Kedai Kopi Selasar"
    >
      <img
        src="/selasar-logo-header.png"
        alt="Kedai Kopi Selasar"
        width={cfg.width}
        height={cfg.height}
        draggable="false"
      />

      {showTagline && (
        <span className="selasar-brand-tagline">
          KEDAI KOPI
        </span>
      )}
    </div>
  );
};
