import React from 'react';

const SIZE_CONFIG = {
  sm: { icon: 28, text: 18, tag: 9, gap: 8 },
  md: { icon: 34, text: 22, tag: 10, gap: 10 },
  lg: { icon: 42, text: 28, tag: 12, gap: 12 },
  xl: { icon: 54, text: 36, tag: 14, gap: 14 },
};

export const SelasarLogo = ({ size = 'md', variant = 'light', showTagline = false }) => {
  const cfg = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const isDark = variant === 'dark' || variant === 'espresso';
  const isWarm = variant === 'warm';

  const palette = {
    bg: isDark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.86)',
    border: isDark ? 'rgba(255,255,255,.12)' : 'rgba(148,184,225,.28)',
    mark: isDark ? '#D8C1A0' : isWarm ? '#B45309' : '#0B63D6',
    steam: isDark ? '#E3D2BF' : isWarm ? '#D97706' : '#237BE6',
    text: isDark ? '#F4F4F7' : isWarm ? '#362313' : '#14233C',
    muted: isDark ? '#B7B7BF' : isWarm ? '#7E6047' : '#6B7B93',
  };

  return (
    <div
      className="selasar-logo-wrapper"
      style={{ display: 'inline-flex', alignItems: 'center', gap: `${cfg.gap}px`, userSelect: 'none' }}
    >
      <div className="selasar-logo-mark" style={{ width: cfg.icon + 12, height: cfg.icon + 12 }}>
        <svg viewBox="0 0 64 64" width={cfg.icon} height={cfg.icon} aria-hidden="true">
          <defs>
            <linearGradient id="selasarLogoFill" x1="14" y1="12" x2="52" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={palette.bg} />
              <stop offset="100%" stopColor={isDark ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.96)'} />
            </linearGradient>
          </defs>

          <rect x="9" y="9" width="46" height="46" rx="16" fill="url(#selasarLogoFill)" stroke={palette.border} />
          <circle cx="32" cy="31" r="10.5" fill="none" stroke={palette.mark} strokeWidth="2.25" opacity=".9" />
          <path
            d="M39.5 28.5C43.6 28.5 46 31 46 34.4C46 37.4 43.7 39.7 40.6 40"
            fill="none"
            stroke={palette.mark}
            strokeWidth="2.15"
            strokeLinecap="round"
          />
          <path
            d="M25.5 17.5C24.1 15.3 24.5 13.2 26.1 11.5"
            fill="none"
            stroke={palette.steam}
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{ animation: 'logoSteam 4.8s ease-in-out infinite' }}
          />
          <path
            d="M31.8 16.4C30.7 14.2 31.2 12.3 32.8 10.8"
            fill="none"
            stroke={palette.steam}
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{ animation: 'logoSteam 5.2s ease-in-out infinite .5s' }}
          />
          <path
            d="M38.2 17.4C37.1 15.3 37.5 13.5 39 12"
            fill="none"
            stroke={palette.steam}
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{ animation: 'logoSteam 5.5s ease-in-out infinite .9s' }}
          />
          <path
            d="M22 42h20"
            stroke={palette.mark}
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".4"
          />
          <path
            d="M20.5 44.5h23"
            stroke="rgba(15, 23, 42, 0.08)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              fontSize: `${cfg.text}px`,
              fontWeight: 820,
              color: palette.text,
              letterSpacing: '-0.04em',
              fontFamily: 'var(--font-main)',
            }}
          >
            Selasar
          </span>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: palette.mark,
              boxShadow: `0 0 0 5px ${isDark ? 'rgba(255,255,255,.05)' : 'rgba(11,99,214,.08)'}`,
            }}
          />
        </div>
        {showTagline && (
          <span
            style={{
              marginTop: '3px',
              fontSize: `${cfg.tag}px`,
              fontWeight: 700,
              color: palette.muted,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Kedai Kopi
          </span>
        )}
      </div>

      <style>{`
        .selasar-logo-wrapper {
          transition: transform .24s ease, opacity .24s ease;
        }
        .selasar-logo-wrapper:hover {
          transform: translateY(-1px);
        }
        .selasar-logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          position: relative;
          animation: logoFloat 6s ease-in-out infinite;
        }
        .selasar-logo-mark::after {
          content: "";
          position: absolute;
          inset: 14%;
          border-radius: 14px;
          background: radial-gradient(circle at 35% 25%, rgba(255,255,255,.55), transparent 55%);
          pointer-events: none;
        }
        @keyframes logoSteam {
          0%, 100% { opacity: .22; transform: translateY(0); }
          50% { opacity: .72; transform: translateY(-1px); }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
};
