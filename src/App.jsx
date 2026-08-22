import puter from '@heyputer/puter.js';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { PosScreen } from './components/POS/PosScreen';
import { KitchenDisplay } from './components/KDS/KitchenDisplay';
import { ReportsScreen } from './components/Reports/ReportsScreen';
import { MenuManager } from './components/MenuManager/MenuManager';
import { InventoryManager } from './components/Inventory/InventoryManager';
import { TableManagement } from './components/Tables/TableManagement';
import { LoyaltyScreen } from './components/Loyalty/LoyaltyScreen';
import { ShiftSettings } from './components/Shift/ShiftSettings';
import { LoginScreen } from './components/Auth/LoginScreen';
import { LoginModal } from './components/Auth/LoginModal';
import { OnboardingScreen } from './components/Auth/OnboardingScreen';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { ReceiptSettings } from './components/Settings/ReceiptSettings';
import { BluetoothModal } from './components/Settings/BluetoothModal';
import { InstallAppButton } from './components/InstallAppButton';
import { supabase } from './lib/supabase';
import { getJakartaDateKey, getShiftCashSummary, shouldAutoCloseShift } from './utils/shift';

// Font stack map applied as a CSS variable
const FONT_STACKS = {
  jakarta: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  system:  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  inter:   "'Inter', system-ui, -apple-system, sans-serif",
};

const INVENTORY_UNIT_META = {
  ml: { family: 'volume', factor: 1, defaultPackSize: 1000 },
  liter: { family: 'volume', factor: 1000, defaultPackSize: 1 },
  g: { family: 'weight', factor: 1, defaultPackSize: 1000 },
  gr: { family: 'weight', factor: 1, defaultPackSize: 1000 },
  kg: { family: 'weight', factor: 1000, defaultPackSize: 1 },
  pcs: { family: 'count', factor: 1, defaultPackSize: 1 },
  cup: { family: 'count', factor: 1, defaultPackSize: 1 },
};

const getInventoryUnitMeta = (unit) => INVENTORY_UNIT_META[String(unit || '').toLowerCase()] || INVENTORY_UNIT_META.ml;

const getInventoryPackSize = (item = {}) => {
  const explicit = Number(item?.packSize ?? item?.packageSize ?? item?.package_quantity);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return getInventoryUnitMeta(item?.unit || item?.satuan).defaultPackSize;
};

const convertInventoryQuantity = (value, fromUnit, toUnit) => {
  const from = getInventoryUnitMeta(fromUnit);
  const to = getInventoryUnitMeta(toUnit);
  const amount = Number(value) || 0;
  if (from.family !== to.family) return Number.NaN;
  return (amount * from.factor) / to.factor;
};

const getThemeStorageKey = (organizationId) => (organizationId ? `selasar_theme_${organizationId}` : 'selasar_theme');
const getWorkspaceStorageKey = (organizationId, key) => `selasar_org_${organizationId}_${key}`;
const LEGACY_WORKSPACE_KEYS = [
  'selasar_products',
  'selasar_inventory',
  'selasar_tables',
  'selasar_members',
  'selasar_transactions',
  'selasar_expenses',
  'selasar_inventory_history',
  'selasar_addons',
  'selasar_settings',
  'selasar_shift',
  'selasar_shift_history',
];

const DEFAULT_APP_SETTINGS = {
  printerName: 'BlueTooth Printer 58mm',
  printerWidth: '58mm',
  qrisImage: null,
  taxPercent: 11,
  serviceChargePercent: 5,
  font: 'jakarta',
  promoSlides: [
    { id: 'signature', tag: 'SIGNATURE', title: 'KOPI SELASAR', subtitle: 'Aren · Fresh Milk', description: 'Signature blend · racikan hari ini', image: '', badge: 'Rp 25K' },
    { id: 'bundle', tag: 'PROMO HARI INI', title: 'CROFFLE + LATTE', subtitle: '−20% Bundling', description: 'Berlaku 07:00 – 15:00 setiap hari', image: '', badge: '−20%' },
    { id: 'matcha', tag: 'BARU', title: 'MATCHA SELASAR', subtitle: 'Premium Ceremonial', description: 'Rasa umami · tanpa tambahan gula', image: '', badge: 'NEW' },
  ],
  onboardingCompleted: false,
  operationalExpenses: [],
  profile: {
    businessName: '',
    ownerName: '',
    ownerPin: '',
    cashierPin: '',
  },
  receipt: {
    storeName: '',
    address: '',
    phone: '',
    footer: 'Terima kasih atas kunjungan Anda',
    social: '',
    logoMode: 'selasar',
    customLogo: null,
    showCustomer: true,
    showCashier: true,
    showTable: true,
    showTax: true,
    showService: true,
  },
};

const createEmptyOrganizationSnapshot = (organizationId) => ({
  organization_id: organizationId,
  products: [],
  inventory: [],
  restaurant_tables: [],
  members: [],
  transactions: [],
  addons: [],
  app_settings: { ...DEFAULT_APP_SETTINGS },
  active_shift: null,
  shift_history: [],
  updated_at: new Date().toISOString(),
});

const normalizeAppSettings = (settings = {}) => ({
  ...DEFAULT_APP_SETTINGS,
  ...settings,
  profile: {
    ...DEFAULT_APP_SETTINGS.profile,
    ...(settings.profile || {}),
  },
  receipt: {
    ...DEFAULT_APP_SETTINGS.receipt,
    ...(settings.receipt || {}),
  },
});

const safeReadJson = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.warn(`Data lokal ${key} tidak valid, memakai data kosong.`, error);
    return fallback;
  }
};

const isUserEditingForm = () => {
  if (typeof document === 'undefined') return false;
  const activeElement = document.activeElement;
  return Boolean(activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName));
};

const isEmptyOrganizationSnapshot = (snapshot = {}) => {
  const lists = [
    snapshot.products,
    snapshot.inventory,
    snapshot.restaurant_tables,
    snapshot.members,
    snapshot.transactions,
    snapshot.addons,
    snapshot.shift_history,
  ];
  const hasContent = lists.some(list => Array.isArray(list) && list.length > 0) || Boolean(snapshot.active_shift);
  return !hasContent;
};

const isDefaultSetupProfile = (appSettings = {}) => {
  const profile = appSettings.profile || {};


  return (
    (profile.businessName || 'Kedai Kopi Selasar') === 'Kedai Kopi Selasar' &&
    (profile.ownerName || 'Owner') === 'Owner' &&
    (profile.ownerPin || '8888') === '8888' &&
    (profile.cashierPin || '1234') === '1234'
  );
};

const shouldRequireOnboarding = (snapshot = {}) => {
  const settings = snapshot.app_settings || {};
  if (settings.onboardingCompleted === false) return true;
  if ('onboardingCompleted' in settings) return false;
  return isEmptyOrganizationSnapshot(snapshot) && isDefaultSetupProfile(settings);
};

export function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [theme, setTheme] = useState(() => localStorage.getItem('selasar_theme') || 'light');
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [tableForNewOrder, setTableForNewOrder] = useState(null);

  // Asisten Kasir AI (Puter.js)
  const [pertanyaanAsisten, setPertanyaanAsisten] = useState('');
  const [, setJawabanAsisten] = useState('');
  const [asistenLoading, setAsistenLoading] = useState(false);
  const [asistenMinimized, setAsistenMinimized] = useState(() => localStorage.getItem('selasar_ai_minimized') === 'true');
  const [riwayatAsisten, setRiwayatAsisten] = useState([]);
  const asistenChatEndRef = useRef(null);
  const asistenInputRef = useRef(null);

  useEffect(() => {
    // Scroll hanya di area riwayat chat. Jangan gunakan scrollIntoView()
    // karena pada Safari/iPhone ia bisa ikut menggeser halaman utama ke atas.
    if (asistenMinimized) return;
    const history = asistenChatEndRef.current?.parentElement;
    if (!history) return;

    requestAnimationFrame(() => {
      history.scrollTop = history.scrollHeight;
    });
  }, [riwayatAsisten, asistenLoading, asistenMinimized]);

  // Self-contained AI widget styling so App.jsx can be replaced by itself.
  useEffect(() => {
    const styleId = 'selasar-ai-widget-style';
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* AI theme variables are defined here so the widget does not depend
           on unrelated page variables that may differ between themes. */
        :root {
          --selasar-ai-bg: #ffffff;
          --selasar-ai-bg-muted: #f5f7fb;
          --selasar-ai-text: #1f2937;
          --selasar-ai-muted: #6b7280;
          --selasar-ai-line: rgba(148,163,184,.24);
          --selasar-ai-accent: #0071e3;
          --selasar-ai-accent-2: #0057b8;
        }

        html[data-theme="dark"] {
          --selasar-ai-bg: #111827;
          --selasar-ai-bg-muted: #1f2937;
          --selasar-ai-text: #f9fafb;
          --selasar-ai-muted: #9ca3af;
          --selasar-ai-line: rgba(255,255,255,.12);
          --selasar-ai-accent: #2f8cff;
          --selasar-ai-accent-2: #1565c0;
        }

        html[data-theme="espresso"] {
          --selasar-ai-bg: #2a211b;
          --selasar-ai-bg-muted: #3a2d24;
          --selasar-ai-text: #fff7ed;
          --selasar-ai-muted: #c9b8a8;
          --selasar-ai-line: rgba(255,247,237,.14);
          --selasar-ai-accent: #b97842;
          --selasar-ai-accent-2: #7a4b2b;
        }

        html[data-theme="warm"] {
          --selasar-ai-bg: #fffaf2;
          --selasar-ai-bg-muted: #fff0dc;
          --selasar-ai-text: #3b2a1f;
          --selasar-ai-muted: #8b6f5d;
          --selasar-ai-line: rgba(139,111,93,.22);
          --selasar-ai-accent: #b96832;
          --selasar-ai-accent-2: #8f4d25;
        }

        .ai-assistant-widget {
          position: fixed;
          right: 14px;
          bottom: calc(82px + env(safe-area-inset-bottom));
          width: min(410px, calc(100vw - 28px));
          height: min(620px, calc(100dvh - 112px));
          max-height: min(620px, calc(100dvh - 112px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 230;
          border: 1px solid var(--selasar-ai-line);
          border-radius: 20px;
          background: var(--selasar-ai-bg);
          color: var(--selasar-ai-text);
          box-shadow: 0 18px 50px rgba(15,23,42,.16);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .ai-assistant-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--selasar-ai-line);
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--selasar-ai-accent) 18%, var(--selasar-ai-bg)),
              var(--selasar-ai-bg)
            );
        }

        .ai-assistant-brand {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ai-assistant-mark {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: var(--selasar-ai-accent);
          color: #fff;
          box-shadow: 0 8px 18px color-mix(in srgb, var(--selasar-ai-accent) 26%, transparent);
          font-size: 18px;
        }

        .ai-assistant-heading {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ai-assistant-heading strong {
          font-size: 13px;
          font-weight: 800;
          color: var(--selasar-ai-text);
        }

        .ai-assistant-heading span {
          font-size: 10px;
          color: var(--selasar-ai-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ai-assistant-minimize,
        .ai-assistant-minimized {
          border: 1px solid var(--selasar-ai-line);
          background: var(--selasar-ai-bg);
          color: var(--selasar-ai-text);
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(15,23,42,.10);
        }

        .ai-assistant-minimize {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-size: 17px;
          line-height: 1;
        }

        .ai-assistant-history {
          flex: 1 1 auto;
          min-height: 0;
          height: auto;
          overflow-y: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--selasar-ai-bg);
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }

        .ai-assistant-empty {
          margin: auto 0;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 7px;
          padding: 20px;
          color: var(--selasar-ai-muted);
        }

        .ai-assistant-empty-mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: color-mix(in srgb, var(--selasar-ai-accent) 10%, var(--selasar-ai-bg));
          color: var(--selasar-ai-accent);
          font-size: 20px;
          margin-bottom: 4px;
        }

        .ai-assistant-empty strong {
          color: var(--selasar-ai-text);
          font-size: 13px;
        }

        .ai-assistant-empty span {
          max-width: 280px;
          font-size: 11px;
          line-height: 1.55;
        }

        .ai-message-row {
          display: flex;
          align-items: flex-end;
          gap: 7px;
          width: 100%;
        }

        .ai-message-row.user {
          justify-content: flex-end;
        }

        .ai-message-row.assistant {
          justify-content: flex-start;
        }

        .ai-message-avatar {
          width: 26px;
          height: 26px;
          flex: 0 0 26px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: color-mix(in srgb, var(--selasar-ai-accent) 11%, var(--selasar-ai-bg));
          color: var(--selasar-ai-accent);
          font-size: 13px;
        }

        .ai-message-bubble {
          max-width: 84%;
          padding: 9px 11px;
          border-radius: 14px;
          font-size: 12px;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .ai-message-bubble.user {
          background: var(--selasar-ai-accent);
          color: #fff;
          border-bottom-right-radius: 5px;
        }

        .ai-message-bubble.assistant {
          background: color-mix(in srgb, var(--selasar-ai-bg-muted) 92%, transparent);
          color: var(--selasar-ai-text);
          border: 1px solid var(--selasar-ai-line);
          border-bottom-left-radius: 5px;
        }

        .ai-message-loading {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ai-message-loading span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--selasar-ai-accent);
          animation: selasarAiDot 1.1s infinite ease-in-out;
        }

        .ai-message-loading span:nth-child(2) { animation-delay: .12s; }
        .ai-message-loading span:nth-child(3) { animation-delay: .24s; }

        .ai-message-loading em {
          margin-left: 4px;
          font-style: normal;
          color: var(--selasar-ai-muted);
        }

        .ai-assistant-composer {
          flex: 0 0 auto;
          padding: 10px 12px calc(12px + env(safe-area-inset-bottom));
          border-top: 1px solid var(--selasar-ai-line);
          background: var(--selasar-ai-bg);
        }

        .ai-assistant-input-wrap {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 6px;
          border: 1px solid var(--selasar-ai-line);
          border-radius: 15px;
          background: var(--ui-surface-muted, #f8fafc);
        }

        .ai-assistant-input-wrap textarea {
          min-width: 0;
          flex: 1;
          min-height: 42px;
          max-height: 100px;
          resize: none;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--selasar-ai-text);
          padding: 7px 8px;
          font: inherit;
          font-size: 12px;
          line-height: 1.45;
        }

        .ai-assistant-input-wrap textarea::placeholder {
          color: var(--text-muted, #9ca3af);
        }

        .ai-assistant-send {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border: 0;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: var(--selasar-ai-accent);
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 7px 16px color-mix(in srgb, var(--selasar-ai-accent) 24%, transparent);
        }

        .ai-assistant-send:disabled {
          opacity: .45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .ai-assistant-hint {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 7px;
          padding: 0 3px;
          font-size: 9px;
          color: var(--selasar-ai-muted);
        }

        .ai-assistant-minimized {
          position: fixed;
          right: 14px;
          bottom: calc(82px + env(safe-area-inset-bottom));
          width: 52px;
          height: 52px;
          z-index: 350;
          padding: 0;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--selasar-ai-bg);
        }

        .ai-assistant-minimized-icon {
          color: var(--selasar-ai-accent);
          font-size: 22px;
          line-height: 1;
        }

        .ai-assistant-minimized-dot {
          position: absolute;
          right: 6px;
          top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid var(--selasar-ai-bg);
        }

        @keyframes selasarAiDot {
          0%, 100% { transform: translateY(0); opacity: .45; }
          50% { transform: translateY(-3px); opacity: 1; }
        }

        @media (max-width: 768px) {
          .ai-assistant-widget {
            right: 10px !important;
            left: 10px !important;
            bottom: calc(78px + env(safe-area-inset-bottom)) !important;
            width: auto !important;
            height: min(58dvh, 520px) !important;
            max-height: min(58dvh, 520px) !important;
            min-height: 360px !important;
            border-radius: 18px;
          }

          .ai-assistant-header {
            flex: 0 0 58px;
            padding: 9px 11px;
          }

          .ai-assistant-heading span {
            max-width: 170px;
          }

          .ai-assistant-history {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            overflow-y: auto !important;
            overscroll-behavior: contain;
          }

          .ai-assistant-composer {
            flex: 0 0 auto;
            padding-bottom: calc(9px + env(safe-area-inset-bottom));
          }

          .ai-assistant-hint span:last-child {
            display: none;
          }

          .ai-assistant-minimized {
            right: 12px;
            bottom: calc(78px + env(safe-area-inset-bottom));
            z-index: 230;
          }
        }

        @media (max-width: 480px) {
          .ai-assistant-widget {
            right: 8px !important;
            left: 8px !important;
            bottom: calc(70px + env(safe-area-inset-bottom)) !important;
            height: min(54dvh, 455px) !important;
            max-height: min(54dvh, 455px) !important;
            min-height: 330px !important;
            border-radius: 16px;
          }

          .ai-assistant-history {
            padding: 10px;
          }

          .ai-message-bubble {
            max-width: 88%;
          }
        }

        /* Modern conversation surface: ChatGPT-like clarity, Selasar energy. */
        .ai-assistant-widget {
          width: min(438px, calc(100vw - 28px)) !important;
          height: min(650px, calc(100dvh - 104px)) !important;
          max-height: min(650px, calc(100dvh - 104px)) !important;
          border: 1px solid rgba(215, 198, 255, .22) !important;
          border-radius: 24px !important;
          background: #15122a !important;
          box-shadow: 0 26px 80px rgba(5, 3, 18, .52), 0 0 0 1px rgba(255,255,255,.025) inset !important;
        }

        .ai-assistant-header {
          padding: 14px 16px !important;
          border-bottom-color: rgba(255,255,255,.08) !important;
          background: linear-gradient(112deg, rgba(119, 79, 255, .28), rgba(28, 24, 57, .92) 54%, rgba(255, 205, 41, .09)) !important;
        }

        .ai-assistant-mark {
          position: relative;
          width: 38px !important;
          height: 38px !important;
          border-radius: 13px !important;
          background: linear-gradient(145deg, #ffdc48, #ffb21c) !important;
          color: #241442 !important;
          box-shadow: 0 8px 22px rgba(255, 194, 36, .2) !important;
          font-family: Georgia, serif;
          font-size: 20px !important;
          font-weight: 900;
          font-style: italic;
        }

        .ai-assistant-heading strong {
          color: #fff !important;
          font-size: 14px !important;
          letter-spacing: -.2px;
        }

        .ai-assistant-heading span { color: #bbb3d2 !important; font-size: 10px !important; }

        .ai-assistant-minimize {
          width: 32px !important;
          height: 32px !important;
          border: 1px solid rgba(255,255,255,.11) !important;
          border-radius: 11px !important;
          background: rgba(255,255,255,.07) !important;
          color: #fff !important;
          box-shadow: none !important;
        }

        .ai-assistant-history {
          gap: 14px !important;
          padding: 18px 16px 14px !important;
          background: radial-gradient(circle at 83% 4%, rgba(101,67,213,.12), transparent 26%), #15122a !important;
        }

        .ai-assistant-empty {
          min-height: 0 !important;
          margin: auto 0 !important;
          align-items: flex-start !important;
          text-align: left !important;
          padding: 8px 5px 12px !important;
          gap: 8px !important;
        }

        .ai-assistant-empty-mark {
          width: 46px !important;
          height: 46px !important;
          border: 1px solid rgba(255,220,72,.24) !important;
          border-radius: 15px !important;
          background: rgba(255,207,51,.1) !important;
          color: #ffdc48 !important;
        }

        .ai-assistant-empty strong { color: #fff !important; font-size: 19px !important; letter-spacing: -.45px; }
        .ai-assistant-empty span { max-width: 340px !important; color: #b8b0cb !important; font-size: 12px !important; line-height: 1.6 !important; }

        .ai-assistant-suggestions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
          margin-top: 10px;
        }

        .ai-assistant-suggestion {
          min-height: 62px;
          padding: 10px 11px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 14px;
          background: rgba(255,255,255,.045);
          color: #eae5fa;
          text-align: left;
          font: inherit;
          font-size: 11px;
          line-height: 1.35;
          cursor: pointer;
          transition: transform .16s ease, border-color .16s ease, background .16s ease;
        }

        .ai-assistant-suggestion:hover {
          transform: translateY(-1px);
          border-color: rgba(255,220,72,.52);
          background: rgba(255,220,72,.09);
        }

        .ai-assistant-suggestion b { display: block; margin-bottom: 3px; color: #ffdc48; font-size: 10px; letter-spacing: .02em; }

        .ai-message-row { gap: 8px !important; }
        .ai-message-avatar {
          width: 27px !important;
          height: 27px !important;
          border-radius: 10px !important;
          background: rgba(255,211,56,.12) !important;
          color: #ffdb45 !important;
          font-size: 12px !important;
        }
        .ai-message-bubble { max-width: 86% !important; padding: 10px 12px !important; border-radius: 16px !important; font-size: 12px !important; }
        .ai-message-bubble.user { background: linear-gradient(135deg, #7556ef, #9a56d7) !important; border-bottom-right-radius: 5px !important; box-shadow: 0 7px 18px rgba(93,65,210,.23); }
        .ai-message-bubble.assistant { border: 1px solid rgba(255,255,255,.09) !important; background: rgba(255,255,255,.065) !important; color: #f7f5ff !important; border-bottom-left-radius: 5px !important; }

        .ai-assistant-composer { padding: 12px 14px calc(13px + env(safe-area-inset-bottom)) !important; border-top-color: rgba(255,255,255,.08) !important; background: #17142d !important; }
        .ai-assistant-input-wrap { gap: 7px !important; padding: 6px 6px 6px 12px !important; border: 1px solid rgba(255,255,255,.12) !important; border-radius: 17px !important; background: rgba(255,255,255,.065) !important; transition: border-color .18s ease, box-shadow .18s ease; }
        .ai-assistant-input-wrap:focus-within { border-color: rgba(255,219,70,.67) !important; box-shadow: 0 0 0 3px rgba(255,212,56,.08); }
        .ai-assistant-input-wrap textarea { min-height: 40px !important; color: #fff !important; font-size: 12px !important; }
        .ai-assistant-input-wrap textarea::placeholder { color: #9991ae !important; }
        .ai-assistant-send { width: 40px !important; height: 40px !important; border-radius: 13px !important; background: linear-gradient(145deg, #ffdc48, #ffb91f) !important; color: #281544 !important; box-shadow: none !important; font-size: 17px !important; }
        .ai-assistant-hint { margin-top: 8px !important; color: #918aa7 !important; font-size: 9px !important; }

        .ai-assistant-minimized { width: 55px !important; height: 55px !important; border: 1px solid rgba(255,220,72,.42) !important; background: linear-gradient(145deg, #262048, #17142d) !important; box-shadow: 0 14px 30px rgba(11,7,29,.4) !important; }
        .ai-assistant-minimized-icon { color: #ffdc48 !important; }
        .ai-assistant-minimized-dot { background: #68e6a7 !important; border-color: #24203f !important; }

        @media (max-width: 480px) {
          .ai-assistant-header { padding: 11px 12px !important; }
          .ai-assistant-history { padding: 13px 12px 10px !important; }
          .ai-assistant-empty strong { font-size: 17px !important; }
          .ai-assistant-suggestions { gap: 7px; }
          .ai-assistant-suggestion { min-height: 57px; padding: 8px 9px; font-size: 10px; }
          .ai-assistant-composer { padding: 9px 10px calc(10px + env(safe-area-inset-bottom)) !important; }
        }

        @keyframes selasarAiPopupIn {
          from { opacity: 0; transform: translateY(18px) scale(.965); filter: blur(3px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes selasarAiButtonIn {
          from { opacity: 0; transform: scale(.72) rotate(-8deg); }
          to { opacity: 1; transform: scale(1) rotate(0); }
        }

        .ai-assistant-widget {
          transform-origin: right bottom;
          animation: selasarAiPopupIn .34s cubic-bezier(.2,.9,.25,1) both !important;
        }

        .ai-assistant-minimized {
          transform-origin: right bottom;
          animation: selasarAiButtonIn .26s cubic-bezier(.2,.9,.25,1) both !important;
          transition: transform .18s cubic-bezier(.2,.9,.25,1), box-shadow .18s ease, border-color .18s ease !important;
        }

        .ai-assistant-minimized:hover { transform: translateY(-3px) scale(1.04); }
        .ai-assistant-minimized:active { transform: scale(.92); }
        .ai-assistant-send { transition: transform .16s cubic-bezier(.2,.9,.25,1), filter .16s ease !important; }
        .ai-assistant-send:not(:disabled):hover { transform: translateY(-2px) scale(1.04); filter: brightness(1.04); }
        .ai-assistant-send:not(:disabled):active { transform: scale(.91); }

        @media (prefers-reduced-motion: reduce) {
          .ai-assistant-widget, .ai-assistant-minimized { animation: none !important; }
          .ai-assistant-minimized, .ai-assistant-send { transition: none !important; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      style?.remove();
    };
  }, []);

  // Global numeric input UX: select a zero value on focus so typing replaces it.
  useEffect(() => {
    const handleNumericInputFocus = (event) => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement)) return;
      if (input.type !== 'number') return;
      if (input.disabled || input.readOnly) return;

      const rawValue = String(input.value ?? '').trim();
      const isZeroValue = /^0+(?:\.0+)?$/.test(rawValue);
      if (!isZeroValue) return;

      requestAnimationFrame(() => {
        try {
          input.select();
        } catch {
          // Ignore browsers that do not allow programmatic selection.
        }
      });
    };

    document.addEventListener('focusin', handleNumericInputFocus, true);
    return () => {
      document.removeEventListener('focusin', handleNumericInputFocus, true);
    };
  }, []);

  // Authentication User State
  const [currentUserRole, setCurrentUserRole] = useState(null);
  // Plan/subscription nanti dibaca dari organization; untuk sekarang semua akun default Free.
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [pinVerified, setPinVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeOrganizationId, setActiveOrganizationId] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('connecting');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authError, setAuthError] = useState('');
  const suppressCloudWriteRef = useRef(false);
  const localCloudWriteAtRef = useRef(0);
  const authUserIdRef = useRef(null);
  const authSyncInFlightRef = useRef(null);
  const initialSessionRetryRef = useRef(false);
  const cloudSaveRef = useRef({ inFlight: false, pending: null, retryTimer: null });
  // Patokan ini tidak berubah ketika aplikasi tetap menyala melewati tengah malam.
  const appSessionDateRef = useRef(getJakartaDateKey());

  // Core App State
  const [products, setProducts] = useState(() => {
    return [];
  });

  const [inventory, setInventory] = useState(() => {
    return [];
  });

  const [tables, setTables] = useState(() => {
    return [];
  });

  const [members, setMembers] = useState(() => {
    return [];
  });

  const [transactions, setTransactions] = useState(() => {
    return [];
  });

  const [expenses, setExpenses] = useState(() => {
    return [];
  });

  const [expenseAudit, setExpenseAudit] = useState(() => {
    return [];
  });

  const [inventoryHistory, setInventoryHistory] = useState(() => {
    return [];
  });

  const [activeShift, setActiveShift] = useState(() => {
    return null;
  });

  const [shiftHistory, setShiftHistory] = useState(() => {
    return [];
  });

  // Add-ons (dynamic extras / milk options)
  const [addons, setAddons] = useState(() => {
    return [];
  });

  // Developer / Owner Settings State
  const [appSettings, setAppSettings] = useState(() => {
    return DEFAULT_APP_SETTINGS;
  });

  const applyCloudSnapshot = useCallback((nextData) => {
    suppressCloudWriteRef.current = true;
    setProducts(nextData.products || []);
    const nextInventory = nextData.inventory || [];
    setInventory(nextInventory);
    setTables(nextData.restaurant_tables || []);
    setMembers(nextData.members || []);
    setTransactions(nextData.transactions || []);
    setExpenses(nextData.expenses || nextData.app_settings?.operationalExpenses || []);
    setExpenseAudit(nextData.app_settings?.expenseAudit || []);
    const savedInventoryHistory = nextData.inventory_history || nextData.app_settings?.inventoryHistory || [];
    setInventoryHistory(savedInventoryHistory.length ? savedInventoryHistory : nextInventory.filter(item => Number(item.stock) > 0).map(item => ({
      id: `STK-OPENING-${item.id}`,
      date: new Date().toISOString(),
      inventoryId: item.id,
      inventoryName: item.name,
      type: 'opening',
      reason: 'Saldo stok awal dicatat saat pembaruan laporan',
      quantity: Number(item.stock) || 0,
      unit: item.unit || item.satuan || 'pcs',
      stockBefore: 0,
      stockAfter: Number(item.stock) || 0,
    })));
    setAddons(nextData.addons || []);
    setAppSettings(normalizeAppSettings(nextData.app_settings));
    setActiveShift(nextData.active_shift || null);
    setShiftHistory(nextData.shift_history || []);
  }, []);

  // Serialize writes so an older request cannot overwrite a newer cashier action.
  const queueCloudSave = useCallback((snapshot) => {
    const saveState = cloudSaveRef.current;
    saveState.pending = snapshot;
    const flush = async () => {
      if (saveState.inFlight || !saveState.pending) return;
      const nextSnapshot = saveState.pending;
      saveState.pending = null;
      saveState.inFlight = true;
      localCloudWriteAtRef.current = Date.now();
      setSyncStatus('syncing');
      const { error } = await supabase.from('organization_data').upsert(nextSnapshot, { onConflict: 'organization_id' });
      saveState.inFlight = false;
      if (error) {
        console.error('Gagal menyimpan data cloud:', error.message);
        if (!saveState.pending) saveState.pending = nextSnapshot;
        setSyncStatus('offline');
        clearTimeout(saveState.retryTimer);
        saveState.retryTimer = setTimeout(flush, 3000);
        return;
      }
      setSyncStatus('synced');
      if (saveState.pending) void flush();
    };
    clearTimeout(saveState.retryTimer);
    saveState.retryTimer = setTimeout(flush, 350);
  }, []);

  const clearAuthenticatedSession = useCallback(() => {
    const saveState = cloudSaveRef.current;
    clearTimeout(saveState.retryTimer);
    saveState.inFlight = false;
    saveState.pending = null;
    saveState.retryTimer = null;
    authUserIdRef.current = null;
    authSyncInFlightRef.current = null;
    setCurrentUserRole(null);
    setAuthenticatedUser(null);
    setPinVerified(false);
    setActiveOrganizationId(null);
    setCloudReady(false);
    setAuthError('');
    setAuthLoading(false);
  }, []);

  // ── Persist & Realtime Sync to LocalStorage ────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const syncAuthSession = async (session, event) => {
      const user = session?.user;
      if (!user) {
        if (event === 'SIGNED_OUT') {
          if (isMounted) clearAuthenticatedSession();
          return;
        }
        if (event === 'INITIAL_SESSION' && !initialSessionRetryRef.current) {
          initialSessionRetryRef.current = true;
          setTimeout(async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              console.error('Gagal membaca ulang sesi login:', error.message);
              if (isMounted) {
                setAuthError(`Session login tidak terbaca: ${error.message}`);
                setAuthLoading(false);
              }
              return;
            }
            if (data.session) {
              void syncAuthSession(data.session, 'SESSION_RETRY');
              return;
            }
            if (isMounted && !authSyncInFlightRef.current && !authUserIdRef.current) {
              setAuthLoading(false);
            }
          }, 900);
          return;
        }
        // Ignore a stale empty event while the same account is still being
        // restored by Supabase. This prevents an unexpected jump to login.
        if (authSyncInFlightRef.current || authUserIdRef.current) return;
        if (isMounted) clearAuthenticatedSession();
        return;
      }

      // Token refresh happens when the tab regains focus. It must not reset
      // the already loaded workspace or ask the user to authenticate again.
      if (authUserIdRef.current === user.id || authSyncInFlightRef.current === user.id) return;
      authSyncInFlightRef.current = user.id;
      if (isMounted) {
        setAuthError('');
        setAuthLoading(true);
      }
      if (authUserIdRef.current && authUserIdRef.current !== user.id && isMounted) {
        const saveState = cloudSaveRef.current;
        clearTimeout(saveState.retryTimer);
        saveState.inFlight = false;
        saveState.pending = null;
        saveState.retryTimer = null;
        setPinVerified(false);
        setCloudReady(false);
        setActiveOrganizationId(null);
        setSyncStatus('connecting');
      }

      // Akun baru otomatis mendapatkan workspace pribadi.
      // Existing accounts tetap memakai organization/membership yang sudah ada.
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .limit(1);

      if (membershipError) {
        console.error('Gagal memuat akses organisasi:', membershipError.message);
        authSyncInFlightRef.current = null;
        if (isMounted) {
          setAuthError(`Gagal memuat akses organisasi: ${membershipError.message}`);
          setAuthLoading(false);
        }
        return;
      }

      let membership = memberships?.[0];

      if (!membership) {
        // Database function ini idempotent: bila workspace sudah ada,
        // ia mengembalikan workspace tersebut; jika belum ada, ia membuat
        // organization + membership owner + snapshot awal + profile linkage.
        const { data: organizationId, error: organizationError } = await supabase
          .rpc('ensure_user_workspace');

        if (organizationError || !organizationId) {
          console.error(
            'Gagal menyiapkan workspace pengguna:',
            organizationError?.message || 'organization_id kosong'
          );
          authSyncInFlightRef.current = null;
          if (isMounted) {
            setAuthError(
              `Gagal menyiapkan workspace akun: ${
                organizationError?.message || 'workspace tidak dapat dibuat'
              }`
            );
            setAuthLoading(false);
          }
          return;
        }

        membership = {
          organization_id: organizationId,
          role: 'owner'
        };
      }

      if (isMounted) {
        authUserIdRef.current = user.id;
        authSyncInFlightRef.current = null;
        setActiveOrganizationId(membership.organization_id);
        setCurrentUserRole(membership.role);
        setAuthenticatedUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Pengguna',
          avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        });
        setCloudReady(false);
        setNeedsOnboarding(false);
        setAuthLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      void syncAuthSession(session, event);
    });

    supabase.auth.getSession()
      .then(({ data }) => {
        if (isMounted) void syncAuthSession(data.session, 'INITIAL_SESSION');
      })
      .catch((error) => {
        console.error('Gagal membaca sesi login:', error.message);
        if (isMounted) {
          setAuthError(`Gagal membaca sesi login: ${error.message}`);
          setAuthLoading(false);
        }
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuthenticatedSession]);

  // Load one isolated snapshot for the active organization.
  useEffect(() => {
    if (!activeOrganizationId) return undefined;
    let isMounted = true;

    const loadOrganizationData = async () => {
      const { data, error } = await supabase
        .from('organization_data')
        .select('*')
        .eq('organization_id', activeOrganizationId)
        .maybeSingle();

      if (error) {
        console.error('Gagal memuat data organisasi:', error.message);
        return;
      }

      if (data) {
        const onboardingRequired = shouldRequireOnboarding(data);
        if (isMounted) {
          applyCloudSnapshot(data);
          localStorage.setItem('selasar_last_cloud_org', activeOrganizationId);
          setNeedsOnboarding(onboardingRequired);
          if (onboardingRequired) {
            setTheme('light');
          }
          setCloudReady(true);
          setSyncStatus('synced');
        }
        return;
      }

      const initialSnapshot = createEmptyOrganizationSnapshot(activeOrganizationId);
      const { error: insertError } = await supabase
        .from('organization_data')
        .insert(initialSnapshot);
      if (insertError) {
        console.error('Gagal membuat snapshot organisasi:', insertError.message);
        return;
      }
      if (isMounted) {
        setProducts(initialSnapshot.products);
        setInventory(initialSnapshot.inventory);
        setTables(initialSnapshot.restaurant_tables);
        setMembers(initialSnapshot.members);
        setTransactions(initialSnapshot.transactions);
        setExpenses(initialSnapshot.app_settings.operationalExpenses || []);
        setAddons(initialSnapshot.addons);
        setAppSettings(initialSnapshot.app_settings);
        setActiveShift(initialSnapshot.active_shift);
        setShiftHistory(initialSnapshot.shift_history);
        localStorage.setItem('selasar_last_cloud_org', activeOrganizationId);
        setNeedsOnboarding(true);
        setTheme('light');
        setCloudReady(true);
        setSyncStatus('synced');
      }
    };

    void loadOrganizationData();
    return () => { isMounted = false; };
  }, [activeOrganizationId, applyCloudSnapshot]);

  // Keep the organization snapshot current after the initial cloud load.
  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return undefined;
    if (suppressCloudWriteRef.current) {
      suppressCloudWriteRef.current = false;
      return undefined;
    }
      const timeout = setTimeout(() => {
        console.log('CLOUD SAVE:', {
          products: products.length,
          transactions: transactions.length,
          time: new Date().toISOString(),
        });

        
      queueCloudSave({
        organization_id: activeOrganizationId,
        products,
        inventory,
        restaurant_tables: tables,
        members,
        transactions,
        addons,
        app_settings: { ...appSettings, operationalExpenses: expenses, inventoryHistory, expenseAudit },
        active_shift: activeShift,
        shift_history: shiftHistory,
        updated_at: new Date().toISOString(),
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [activeOrganizationId, cloudReady, products, inventory, tables, members, transactions, inventoryHistory, expenses, expenseAudit, addons, appSettings, activeShift, shiftHistory, queueCloudSave]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    LEGACY_WORKSPACE_KEYS.forEach((key) => localStorage.removeItem(key));
  }, [activeOrganizationId, cloudReady]);

  // Realtime updates from another cashier/owner device.
  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return undefined;
    const channel = supabase
      .channel(`organization-data-${activeOrganizationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'organization_data',
        filter: `organization_id=eq.${activeOrganizationId}`,
      }, ({ new: nextData }) => {
        const recentlySavedByThisDevice = Date.now() - localCloudWriteAtRef.current < 1500;
        if (recentlySavedByThisDevice) {
          setSyncStatus('synced');
          return;
        }
        if (isUserEditingForm() || cloudSaveRef.current.inFlight || cloudSaveRef.current.pending) return;
        applyCloudSnapshot(nextData);
        setSyncStatus('synced');
      })
      .subscribe((status) => {
        setSyncStatus(status === 'SUBSCRIBED' ? 'synced' : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'offline' : 'connecting');
      });

    // Refetch after returning online or to a backgrounded tab. This also keeps
    // data current when the Realtime publication has not been enabled yet.
    const refreshSnapshot = async () => {
      // Jangan timpa draft lokal ketika pengguna masih mengetik. Snapshot
      // terbaru akan diambil lagi setelah field kehilangan fokus.
      if (isUserEditingForm()) return;
      if (cloudSaveRef.current.inFlight || cloudSaveRef.current.pending) return;
      const { data, error } = await supabase
        .from('organization_data')
        .select('*')
        .eq('organization_id', activeOrganizationId)
        .maybeSingle();
      if (error) {
        setSyncStatus('offline');
        return;
      }
      if (data) {
        applyCloudSnapshot(data);
        setSyncStatus('synced');
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshSnapshot();
    };
    window.addEventListener('focus', refreshSnapshot);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const refreshInterval = setInterval(() => void refreshSnapshot(), 10000);

    return () => {
      window.removeEventListener('focus', refreshSnapshot);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, [activeOrganizationId, cloudReady, applyCloudSnapshot]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'products'), JSON.stringify(products));
  }, [products, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'inventory'), JSON.stringify(inventory));
  }, [inventory, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'tables'), JSON.stringify(tables));
  }, [tables, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'members'), JSON.stringify(members));
  }, [members, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'transactions'), JSON.stringify(transactions));
  }, [transactions, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'inventory_history'), JSON.stringify(inventoryHistory));
  }, [inventoryHistory, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'expenses'), JSON.stringify(expenses));
  }, [expenses, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'addons'), JSON.stringify(addons));
  }, [addons, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'settings'), JSON.stringify(appSettings));
  }, [appSettings, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    const key = getWorkspaceStorageKey(activeOrganizationId, 'shift');
    if (activeShift) {
      localStorage.setItem(key, JSON.stringify(activeShift));
    } else {
      localStorage.removeItem(key);
    }
  }, [activeShift, activeOrganizationId, cloudReady]);

  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return;
    localStorage.setItem(getWorkspaceStorageKey(activeOrganizationId, 'shift_history'), JSON.stringify(shiftHistory));
  }, [shiftHistory, activeOrganizationId, cloudReady]);

  // Realtime storage synchronization across tabs and sessions
  useEffect(() => {
    if (!activeOrganizationId) return undefined;
    const handleStorageChange = (e) => {
      try {
        const key = e.key;
        if (!key || !key.startsWith(`selasar_org_${activeOrganizationId}_`)) return;
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'products')) setProducts(safeReadJson(key, []));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'inventory')) setInventory(safeReadJson(key, []));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'tables')) setTables(safeReadJson(key, []));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'members')) setMembers(safeReadJson(key, []));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'transactions')) setTransactions(safeReadJson(key, []));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'inventory_history')) setInventoryHistory(safeReadJson(key, []));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'expenses')) setExpenses(safeReadJson(key, []));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'addons')) setAddons(safeReadJson(key, []));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'settings') && !isUserEditingForm()) setAppSettings(normalizeAppSettings(safeReadJson(key, DEFAULT_APP_SETTINGS)));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'shift')) setActiveShift(safeReadJson(key, null));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'shift_history')) setShiftHistory(safeReadJson(key, []));
      } catch (err) {
        console.warn('Realtime storage sync notice:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeOrganizationId]);

  // Append-only records are merged individually, so a cashier on another
  // device cannot overwrite a newly created sale, expense, or stock movement.
  useEffect(() => {
    if (!activeOrganizationId || !cloudReady) return undefined;
    const channel = supabase.channel(`organization-ledger:${activeOrganizationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'organization_ledger', filter: `organization_id=eq.${activeOrganizationId}`
      }, ({ new: entry }) => {
        if (!entry || entry.created_by === authUserIdRef.current) return;
        const payload = entry.payload || {};
        if (entry.event_type === 'transaction.created') setTransactions(prev => prev.some(item => item.id === payload.id) ? prev : [payload, ...prev]);
        if (entry.event_type === 'transaction.voided') setTransactions(prev => prev.map(item => item.id === payload.transactionId ? { ...item, status: 'void', paymentStatus: 'void', orderStatus: 'cancelled', voidedAt: payload.voidedAt } : item));
        if (entry.event_type === 'expense.created') setExpenses(prev => prev.some(item => item.id === payload.id) ? prev : [payload, ...prev]);
        if (entry.event_type === 'expense.updated') setExpenses(prev => prev.map(item => item.id === payload.id ? { ...item, ...payload } : item));
        if (entry.event_type === 'expense.deleted') setExpenses(prev => prev.filter(item => item.id !== entry.entity_id));
        if (entry.event_type === 'inventory.movement') {
          setInventoryHistory(prev => prev.some(item => item.id === payload.id) ? prev : [payload, ...prev].slice(0, 1000));
          setInventory(prev => prev.map(item => item.id === payload.inventoryId ? { ...item, stock: payload.stockAfter } : item));
        }
        if (entry.event_type === 'shift.closed') setShiftHistory(prev => prev.some(item => item.id === payload.id) ? prev : [payload, ...prev]);
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [activeOrganizationId, cloudReady]);

  // Delivero-inspired design system is applied globally so every screen
  // (login, PIN gate, onboarding, POS and every other tab) shares the same
  // brand feel. Business logic and Supabase flow are not touched by this.
  useEffect(() => {
    document.body.classList.add('pos-delivero-active');
    // Inject a small rotating tips card at the bottom of the sidebar so the
    // decorative panel becomes useful for the owner. Content rotates every 4s.
    const TIPS = [
      { tag: 'Tips Kasir',  title: 'Gunakan meja saat dine-in.', sub: 'Otomatis tersimpan di riwayat.' },
      { tag: 'Info Loyalti', title: 'Ajak pelanggan jadi member.', sub: 'Poin bertambah tiap transaksi.' },
      { tag: 'Insight Toko', title: 'Cek laporan tiap sore.',      sub: 'Deteksi menu terlaris dan slow-moving.' },
      { tag: 'Kelola Stok',  title: 'Restock sebelum kritis.',    sub: 'Alarm otomatis di menu Stok.' },
    ];
    let promoIdx = 0;
    const mountPromo = () => {
      const sidebar = document.querySelector('.desktop-workspace-sidebar');
      if (!sidebar) return null;
      let card = sidebar.querySelector('.selasar-sidebar-promo');
      if (!card) {
        card = document.createElement('div');
        card.className = 'selasar-sidebar-promo';
        sidebar.appendChild(card);
      }
      const render = () => {
        const t = TIPS[promoIdx % TIPS.length];
        card.innerHTML = `<span>${t.tag}</span><strong>${t.title}</strong><small>${t.sub}</small>`;
      };
      render();
      return setInterval(() => { promoIdx += 1; render(); }, 4200);
    };
    let interval = mountPromo();
    // Re-mount if the sidebar is re-created (e.g. after a login state change).
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.desktop-workspace-sidebar .selasar-sidebar-promo')) {
        if (interval) clearInterval(interval);
        interval = mountPromo();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.body.classList.remove('pos-delivero-active');
      if (interval) clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // ── Apply theme + font to DOM ────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const themeKey = getThemeStorageKey(activeOrganizationId);
    localStorage.setItem(themeKey, theme);
    if (!activeOrganizationId) {
      localStorage.setItem('selasar_theme', theme);
    }
  }, [theme, activeOrganizationId]);

  useEffect(() => {
    if (!activeOrganizationId) return;
    const storedTheme = localStorage.getItem(getThemeStorageKey(activeOrganizationId));
    const legacyTheme = localStorage.getItem('selasar_theme');
    setTheme(storedTheme || legacyTheme || 'light');
  }, [activeOrganizationId]);

  useEffect(() => {
    const font = appSettings.font || 'jakarta';
    const fontStack = FONT_STACKS[font] || FONT_STACKS.jakarta;
    document.documentElement.style.setProperty('--font-main', fontStack);
    document.body.style.setProperty('font-family', fontStack, 'important');
  }, [appSettings.font]);

  // Global numeric input UX: nilai awal 0 otomatis terseleksi saat fokus.
  // Jadi ketik 1 langsung menjadi 1, bukan 01.
  useEffect(() => {
    const handleNumericInputFocus = (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (input.type !== 'number' || input.disabled || input.readOnly) return;
      const rawValue = String(input.value ?? '').trim();
      if (!/^0+(?:\.0+)?$/.test(rawValue)) return;
      requestAnimationFrame(() => {
        try { input.select(); } catch {}
      });
    };
    document.addEventListener('focusin', handleNumericInputFocus, true);
    return () => document.removeEventListener('focusin', handleNumericInputFocus, true);
  }, []);

  // ── Mobile UI safeguards ────────────────────────────────────────────────
  useEffect(() => {
    const styleId = 'selasar-mobile-ui-fix';
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        :root { --selasar-mobile-bottom-safe: 82px; }

        .ai-assistant-widget,
        .ai-assistant-minimized {
          transition:
            transform .18s ease,
            opacity .18s ease,
            box-shadow .18s ease;
        }

        @media (max-width: 768px) {
          body { overflow-x: hidden; }

          [role="dialog"], [aria-modal="true"], [data-modal="true"],
          .modal, .modal-overlay, .dialog {
            max-height: calc(100dvh - 100px) !important;
          }

          [role="dialog"] > *, [aria-modal="true"] > * {
            max-height: calc(100dvh - 112px) !important;
          }

          .ai-assistant-widget {
            right: 10px !important;
            left: 10px !important;
            width: auto !important;
            bottom: calc(78px + env(safe-area-inset-bottom)) !important;
            height: min(58dvh, 520px) !important;
            max-height: min(58dvh, 520px) !important;
            min-height: 360px !important;
          }

          .ai-assistant-history {
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
          }

          .ai-assistant-composer {
            padding-bottom: calc(10px + env(safe-area-inset-bottom)) !important;
          }

          .ai-assistant-send {
            min-width: 44px !important;
            min-height: 44px !important;
          }

          .ai-assistant-minimized {
            right: 12px !important;
            bottom: calc(84px + env(safe-area-inset-bottom)) !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // InventoryManager lama memakai select satuan yang belum memiliki Liter.
    // Tambahkan opsi secara aman hanya saat inventory sedang tampil.
    const addLiterOption = () => {
      if (activeTab !== 'inventory') return;

      document.querySelectorAll('main select').forEach((select) => {
        const options = [...select.options];
        const text = options
          .map((o) => `${o.value} ${o.textContent}`)
          .join(' ')
          .toLowerCase();

        const looksLikeUnit =
          /(^|\s)(ml|mililiter|milliliter|gram|kg|kilogram|pcs|piece|pieces|satuan)(\s|$)/i.test(text);

        if (
          !looksLikeUnit ||
          [...select.options].some(
            (o) => String(o.value).toLowerCase() === 'liter'
          )
        ) {
          return;
        }

        const option = document.createElement('option');
        option.value = 'liter';
        option.textContent = 'Liter (L)';
        option.dataset.selasarLiter = 'true';
        select.appendChild(option);
      });
    };

    // Naikkan panel/modal mobile dari area bottom-nav tanpa mengganggu
    // bottom navigation itu sendiri.
    const liftMobileBottomSheets = () => {
      if (window.innerWidth > 768) return;

      document.querySelectorAll('body *').forEach((el) => {
        if (el.closest('[aria-label="Asisten Kasir AI"]')) return;
        if (el.closest('.ai-assistant-minimized')) return;

        const cs = window.getComputedStyle(el);
        if (cs.position !== 'fixed') return;

        const rect = el.getBoundingClientRect();
        const bottomGap = window.innerHeight - rect.bottom;

        if (rect.width > 260 && rect.height > 120 && bottomGap < 18) {
          el.style.setProperty(
            'bottom',
            'calc(84px + env(safe-area-inset-bottom))',
            'important'
          );
          el.style.setProperty(
            'max-height',
            'calc(100dvh - 108px)',
            'important'
          );
          el.style.setProperty('overflow-y', 'auto', 'important');
        }
      });
    };

    // Pada mobile, ketika kasir berpindah tab atau membuka UI lain,
    // chat otomatis mengecil agar tidak menabrak menu/cart/modal.
    const minimizeOnMobileInteraction = (event) => {
      if (window.innerWidth > 768) return;
      if (asistenMinimized) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      if (
        target.closest('[aria-label="Asisten Kasir AI"]') ||
        target.closest('.ai-assistant-minimized')
      ) {
        return;
      }

      const shouldMinimize =
        target.closest('header') ||
        target.closest('nav') ||
        target.closest('[role="dialog"]') ||
        target.closest('.modal') ||
        target.closest('.modal-overlay') ||
        target.closest('[data-modal="true"]') ||
        target.closest('button');

      if (shouldMinimize) {
        setAsistenMinimized(true);
      }
    };

    addLiterOption();
    liftMobileBottomSheets();

    const observer = new MutationObserver(() => {
      addLiterOption();
      liftMobileBottomSheets();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('resize', liftMobileBottomSheets);
    document.addEventListener('click', minimizeOnMobileInteraction, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', liftMobileBottomSheets);
      document.removeEventListener('click', minimizeOnMobileInteraction, true);
      style?.remove();
    };
  }, [activeTab, asistenMinimized]);

  // Keep legacy header instances on the same chunky Selasar brand asset used
  // by the desktop sidebar. Older builds used to force the rectangular logo.
  useEffect(() => {
    const logoSrc = '/selasar-chunky-logo-v2.png?v=20260822-2';
    const patchLogo = () => {
      document.querySelectorAll('.mobile-selasar-brand img, .sidebar-brand-lockup img, .header-printer-status img').forEach((img) => {
        if (img.getAttribute('src') !== logoSrc) {
          img.setAttribute('src', logoSrc);
        }
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.objectPosition = 'center';
        img.style.display = 'block';
      });
    };

    patchLogo();
    const observer = new MutationObserver(patchLogo);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Berpindah halaman di mobile => chat otomatis minimize.
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setAsistenMinimized(true);
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('selasar_ai_minimized', String(asistenMinimized));
  }, [asistenMinimized]);

  // ── Handlers ────────────────────────────────────────────────────────────

  // AI OPERATOR: tool yang dieksekusi langsung oleh aplikasi POS.
  // AI tidak sekadar menjawab; ia memanggil fungsi-fungsi di bawah untuk
  // mengubah state POS yang kemudian ikut tersinkron ke Supabase/localStorage.
  const aiResult = (ok, message, extra = {}) =>
    JSON.stringify({ ok, message, ...extra });

  const aiGetShiftStatus = () =>
    JSON.stringify({ active: Boolean(activeShift), shift: activeShift || null });

  const aiOpenShift = ({ name = 'Shift AI', openingCash = 0 } = {}) => {
    if (activeShift) {
      return aiResult(false, `Shift masih aktif: ${activeShift.name || activeShift.id || 'shift aktif'}.`);
    }
    const shift = {
      id: `shift-${Date.now()}`,
      name: String(name || 'Shift AI'),
      startTime: new Date().toISOString(),
      openingCash: Number(openingCash) || 0,
    };
    setActiveShift(shift);
    setActiveTab('shift');
    return aiResult(true, `Shift "${shift.name}" berhasil dinyalakan.`, { shift });
  };

  const aiCloseShift = ({ closingCash, note = '' } = {}) => {
    if (!activeShift) return aiResult(false, 'Tidak ada shift aktif.');
    const closedName = activeShift.name || activeShift.id || 'shift';
    handleCloseShift({
      ...(closingCash !== undefined ? { closingCash: Number(closingCash) || 0 } : {}),
      note: String(note || ''),
      closingTime: new Date().toISOString(),
    });
    setActiveTab('shift');
    return aiResult(true, `Shift "${closedName}" berhasil dimatikan.`);
  };

  const aiUpdateShift = ({ name, openingCash, startTime } = {}) => {
    if (!activeShift) return aiResult(false, 'Tidak ada shift aktif.');
    const updated = {
      ...activeShift,
      ...(name !== undefined ? { name: String(name) } : {}),
      ...(openingCash !== undefined ? { openingCash: Number(openingCash) || 0 } : {}),
      ...(startTime !== undefined ? { startTime: String(startTime) } : {}),
    };
    setActiveShift(updated);
    return aiResult(true, 'Shift aktif berhasil diperbarui.', { shift: updated });
  };

  // ── AI read tools ───────────────────────────────────────────────────────
  // Semua fungsi di bawah membaca STATE POS yang sedang aktif. Jadi AI tidak
  // mengarang data dan tidak bergantung pada jawaban model sebelumnya.
  const aiToolGetInventory = ({ search = '' } = {}) => {
    const q = String(search || '').trim().toLowerCase();
    const rows = inventory
      .filter(item => {
        if (!q) return true;
        const haystack = [item?.name, item?.ingredientName, item?.category, item?.unit, item?.satuan]
          .filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .map(item => ({
        id: item?.id,
        name: item?.name || item?.ingredientName || '-',
        stock: Number(item?.stock ?? item?.quantity ?? 0) || 0,
        unit: item?.unit || item?.satuan || '',
        packSize: getInventoryPackSize(item),
        packUnitName: item?.packUnitName || item?.packageUnitName || 'Kemasan',
        minStock: Number(item?.minStock ?? item?.minimumStock ?? item?.reorderPoint ?? 0) || 0,
        category: item?.category || '',
      }));

    const lowStock = rows.filter(x => x.minStock > 0 && x.stock <= x.minStock);
    return aiResult(true, `Ditemukan ${rows.length} bahan.`, {
      inventory: rows,
      lowStock,
      totalItems: rows.length,
    });
  };

  const aiToolGetSalesSummary = ({ period = 'today' } = {}) => {
    const now = new Date();
    const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const getTxDate = tx => new Date(tx?.createdAt || tx?.date || tx?.timestamp || tx?.time || 0);
    const relevant = transactions.filter(tx => {
      const d = getTxDate(tx);
      return !Number.isNaN(d.getTime()) && d >= start && d <= now;
    });

    const total = relevant.reduce((sum, tx) => sum + (Number(tx?.total ?? tx?.grandTotal ?? tx?.amount ?? 0) || 0), 0);
    const paid = relevant.filter(tx => String(tx?.status || '').toLowerCase() !== 'void');
    const paidTotal = paid.reduce((sum, tx) => sum + (Number(tx?.total ?? tx?.grandTotal ?? tx?.amount ?? 0) || 0), 0);

    return aiResult(true, `Ringkasan penjualan ${period}.`, {
      period,
      transactionCount: relevant.length,
      validTransactionCount: paid.length,
      omzet: paidTotal,
      totalIncludingVoided: total,
      averageTransaction: paid.length ? Math.round(paidTotal / paid.length) : 0,
    });
  };

  const aiToolGetTopProducts = ({ period = 'today', limit = 5 } = {}) => {
    const now = new Date();
    const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const relevant = transactions.filter(tx => {
      const d = new Date(tx?.createdAt || tx?.date || tx?.timestamp || tx?.time || 0);
      return !Number.isNaN(d.getTime()) && d >= start && d <= now && String(tx?.status || '').toLowerCase() !== 'void';
    });

    const counts = new Map();
    for (const tx of relevant) {
      const items = Array.isArray(tx?.items) ? tx.items : [];
      for (const item of items) {
        const id = String(item?.productId ?? item?.id ?? item?.product_id ?? item?.name ?? 'unknown');
        const name = item?.name || item?.productName || 'Produk';
        const qty = Number(item?.quantity ?? item?.qty ?? 1) || 0;
        const prev = counts.get(id) || { id, name, quantity: 0 };
        prev.quantity += qty;
        counts.set(id, prev);
      }
    }

    const top = [...counts.values()].sort((a, b) => b.quantity - a.quantity).slice(0, Math.max(1, Number(limit) || 5));
    return aiResult(true, `Produk terlaris ${period}.`, { period, products: top });
  };

  const aiToolSearchProducts = ({ search = '' } = {}) => {
    const q = String(search || '').trim().toLowerCase();
    const found = products
      .filter(p => !q || [p?.name, p?.title, p?.category].filter(Boolean).join(' ').toLowerCase().includes(q))
      .map(p => ({
        id: p?.id,
        name: p?.name || p?.title || '-',
        price: Number(p?.price ?? p?.sellingPrice ?? 0) || 0,
        category: p?.category || '',
        isAvailable: p?.isAvailable !== false,
      }));
    return aiResult(true, `Ditemukan ${found.length} produk.`, { products: found });
  };

  const aiUpdateInventory = ({ itemId, itemName, addStock, packages, setStock, patch = {} } = {}) => {
    let item = itemId
      ? inventory.find(x => String(x?.id) === String(itemId))
      : null;

    if (!item && itemName) {
      const q = String(itemName).trim().toLowerCase();
      item = inventory.find(x => String(x?.name || x?.ingredientName || '').toLowerCase() === q)
        || inventory.find(x => String(x?.name || x?.ingredientName || '').toLowerCase().includes(q));
    }

    if (!item) return aiResult(false, `Bahan "${itemName || itemId || ''}" tidak ditemukan.`);

    const currentStock = Number(item.stock ?? item.quantity ?? 0) || 0;
    const unit = item?.unit || item?.satuan || 'ml';
    const packSize = getInventoryPackSize(item);
    const packUnitName = item?.packUnitName || item?.packageUnitName || 'Kemasan';
    const nextPatch = { ...patch };
    let added = 0;

    if (packages !== undefined) {
      const count = Number(packages);
      if (!Number.isFinite(count) || count <= 0) {
        return aiResult(false, 'Jumlah kemasan harus lebih dari 0.');
      }
      added = count * packSize;
      nextPatch.stock = currentStock + added;
    } else if (addStock !== undefined) {
      added = Number(addStock) || 0;
      nextPatch.stock = currentStock + added;
    } else if (setStock !== undefined) {
      const nextStock = Number(setStock);
      if (!Number.isFinite(nextStock) || nextStock < 0) {
        return aiResult(false, 'Nilai stok tidak valid.');
      }
      nextPatch.stock = nextStock;
    }

    setInventory(prev => prev.map(x => String(x.id) === String(item.id) ? { ...x, ...nextPatch, id: x.id } : x));

    return aiResult(true, `Bahan "${item.name || item.ingredientName || item.id}" berhasil diperbarui.`, {
      itemId: item.id,
      name: item.name || item.ingredientName || item.id,
      previousStock: currentStock,
      addedStock: added,
      newStock: nextPatch.stock ?? currentStock,
      unit,
      packages: packages !== undefined ? Number(packages) : undefined,
      packSize,
      packUnitName,
      patch: nextPatch,
    });
  };

  const aiAddInventory = ({ item = {} } = {}) => {
    const newItem = {
      id: item.id || `inventory-${Date.now()}`,
      name: item.name || item.ingredientName || 'Bahan Baru',
      stock: Number(item.stock ?? item.quantity ?? 0) || 0,
      unit: item.unit || item.satuan || 'ml',
      packSize: getInventoryPackSize(item),
      packUnitName: item.packUnitName || item.packageUnitName || 'Kemasan',
      minStock: Number(item.minStock ?? item.minimumStock ?? item.reorderPoint ?? 0) || 0,
      ...item,
    };
    setInventory(prev => [newItem, ...prev]);
    return aiResult(true, `Bahan "${newItem.name}" berhasil ditambahkan.`, { item: newItem });
  };

  const aiDeleteInventory = ({ itemId } = {}) => {
    const item = inventory.find(x => String(x?.id) === String(itemId));
    if (!item) return aiResult(false, `Bahan dengan ID ${itemId} tidak ditemukan.`);
    setInventory(prev => prev.filter(x => String(x.id) !== String(itemId)));
    return aiResult(true, `Bahan "${item.name || itemId}" berhasil dihapus.`);
  };

  const aiUpdateProduct = ({ productId, patch = {} } = {}) => {
    const product = products.find(x => String(x?.id) === String(productId));
    if (!product) return aiResult(false, `Produk ${productId} tidak ditemukan.`);
    setProducts(prev => prev.map(x => String(x.id) === String(productId) ? { ...x, ...patch, id: x.id } : x));
    return aiResult(true, `Produk "${product.name || product.title || productId}" berhasil diperbarui.`);
  };

  const aiAddProduct = ({ product = {} } = {}) => {
    const newProduct = {
      id: product.id || `product-${Date.now()}`,
      name: product.name || product.title || 'Produk Baru',
      price: Number(product.price ?? product.sellingPrice ?? 0) || 0,
      isAvailable: product.isAvailable !== false,
      ...product,
    };
    setProducts(prev => [newProduct, ...prev]);
    return aiResult(true, `Produk "${newProduct.name || newProduct.title}" berhasil ditambahkan.`, { product: newProduct });
  };

  const aiDeleteProduct = ({ productId } = {}) => {
    const product = products.find(x => String(x?.id) === String(productId));
    if (!product) return aiResult(false, `Produk ${productId} tidak ditemukan.`);
    setProducts(prev => prev.filter(x => String(x.id) !== String(productId)));
    return aiResult(true, `Produk "${product.name || productId}" berhasil dihapus.`);
  };

  const aiSetProductAvailability = ({ productId, isAvailable } = {}) => {
    const product = products.find(x => String(x?.id) === String(productId));
    if (!product) return aiResult(false, `Produk ${productId} tidak ditemukan.`);
    handleToggleProductAvailability(productId);
    if (Boolean(product.isAvailable) !== Boolean(isAvailable)) {
      // handler toggle sudah tepat bila target berbeda; bila sama, toggle sekali lagi.
    } else {
      handleToggleProductAvailability(productId);
    }
    return aiResult(true, `Ketersediaan "${product.name || productId}" diubah menjadi ${isAvailable ? 'tersedia' : 'tidak tersedia'}.`);
  };

  const aiUpdateMember = ({ memberId, patch = {} } = {}) => {
    const member = members.find(x => String(x?.id) === String(memberId));
    if (!member) return aiResult(false, `Member ${memberId} tidak ditemukan.`);
    handleUpdateMember({ ...member, ...patch, id: member.id });
    return aiResult(true, `Member "${member.name || memberId}" berhasil diperbarui.`);
  };

  const aiAddMember = ({ member = {} } = {}) => {
    const newMember = { id: member.id || `member-${Date.now()}`, ...member };
    handleAddMember(newMember);
    return aiResult(true, `Member "${newMember.name || newMember.id}" berhasil ditambahkan.`);
  };

  const aiDeleteMember = ({ memberId } = {}) => {
    const member = members.find(x => String(x?.id) === String(memberId));
    if (!member) return aiResult(false, `Member ${memberId} tidak ditemukan.`);
    setMembers(prev => prev.filter(x => String(x.id) !== String(memberId)));
    return aiResult(true, `Member "${member.name || memberId}" berhasil dihapus.`);
  };

  const aiSaveTable = ({ table = {} } = {}) => {
    const next = {
      id: table.id || `table-${Date.now()}`,
      name: table.name || `Meja ${tables.length + 1}`,
      status: table.status || 'available',
      ...table,
    };
    handleSaveTable(next);
    return aiResult(true, `Meja "${next.name}" berhasil disimpan.`, { table: next });
  };

  const aiDeleteTable = ({ tableId } = {}) => {
    const table = tables.find(x => String(x?.id) === String(tableId));
    if (!table) return aiResult(false, `Meja ${tableId} tidak ditemukan.`);
    handleDeleteTable(tableId);
    return aiResult(true, `Meja "${table.name || tableId}" berhasil dihapus.`);
  };

  const aiVoidTransaction = ({ transactionId } = {}) => {
    const tx = transactions.find(x => String(x?.id) === String(transactionId));
    if (!tx) return aiResult(false, `Transaksi ${transactionId} tidak ditemukan.`);
    handleVoidTransaction(transactionId);
    return aiResult(true, `Transaksi ${transactionId} berhasil di-void.`);
  };

  const aiUpdateTransaction = ({ transactionId, patch = {} } = {}) => {
    const tx = transactions.find(x => String(x?.id) === String(transactionId));
    if (!tx) return aiResult(false, `Transaksi ${transactionId} tidak ditemukan.`);
    handleUpdateTransaction({ ...tx, ...patch, id: tx.id });
    return aiResult(true, `Transaksi ${transactionId} berhasil diperbarui.`);
  };

  const aiUpdateOrderStatus = ({ orderId, status } = {}) => {
    if (!transactions.some(x => String(x?.id) === String(orderId))) {
      return aiResult(false, `Order ${orderId} tidak ditemukan.`);
    }
    handleUpdateOrderStatus(orderId, status);
    return aiResult(true, `Status order ${orderId} diubah menjadi ${status}.`);
  };

  const aiNavigate = ({ tab } = {}) => {
    const aliases = { kasir:'pos',pos:'pos',dapur:'kds',kds:'kds',laporan:'reports',menu:'menu',
      inventory:'inventory',stok:'inventory',meja:'tables',member:'loyalty',loyalty:'loyalty',
      shift:'shift',pengaturan:'settings',settings:'settings',struk:'receipt',receipt:'receipt' };
    const next = aliases[String(tab || '').toLowerCase()] || tab;
    const allowed = ['pos','kds','reports','menu','inventory','tables','loyalty','shift','settings','receipt'];
    if (!allowed.includes(next)) return aiResult(false, `Halaman "${tab}" tidak tersedia.`);
    setActiveTab(next);
    return aiResult(true, `Membuka halaman ${next}.`);
  };

  const aiSetTheme = ({ theme: nextTheme } = {}) => {
    if (!['light','dark','espresso','warm'].includes(nextTheme)) return aiResult(false, 'Tema tidak tersedia.');
    setTheme(nextTheme);
    return aiResult(true, `Tema diubah ke ${nextTheme}.`);
  };

  const aiUpdateSettings = ({ patch = {} } = {}) => {
    setAppSettings(prev => ({ ...prev, ...patch }));
    return aiResult(true, 'Pengaturan aplikasi berhasil diperbarui.');
  };

  const asistenKasirTools = [
    { type:'function', function:{ name:'get_shift_status', description:'Cek status dan detail shift aktif.', parameters:{type:'object',properties:{},required:[]} } },
    { type:'function', function:{ name:'open_shift', description:'Nyalakan/buka shift baru. Jalankan saat user meminta buka/nyalakan shift.', parameters:{type:'object',properties:{name:{type:'string'},openingCash:{type:'number'}},required:[]} } },
    { type:'function', function:{ name:'close_shift', description:'Matikan/tutup shift aktif. Jalankan saat user meminta tutup/matikan shift.', parameters:{type:'object',properties:{closingCash:{type:'number'},note:{type:'string'}},required:[]} } },
    { type:'function', function:{ name:'update_shift', description:'Ubah data shift aktif.', parameters:{type:'object',properties:{name:{type:'string'},openingCash:{type:'number'},startTime:{type:'string'}},required:[]} } },
    { type:'function', function:{ name:'get_inventory', description:'Baca stok bahan beserta satuan stok dan isi 1 kemasan (packSize). Wajib dipakai sebelum restock berdasarkan jumlah kemasan.', parameters:{type:'object',properties:{search:{type:'string'}},required:[]} } },
    { type:'function', function:{ name:'update_inventory', description:'Ubah stok bahan. Untuk RESTOCK berdasarkan pembelian kemasan, WAJIB gunakan packages (jumlah kemasan), bukan addStock. Sistem otomatis menghitung packages × packSize bahan. Gunakan itemName bila nama bahan sudah diketahui; jika belum, panggil get_inventory dulu.', parameters:{type:'object',properties:{itemId:{type:'string'},itemName:{type:'string'},packages:{type:'number',description:'Jumlah kemasan yang dibeli. Contoh 3 berarti 3 kemasan, lalu sistem mengalikan dengan isi 1 kemasan.'},addStock:{type:'number',description:'Penambahan langsung dalam satuan stok dasar. Hanya gunakan jika user memang menyebut jumlah satuan dasar.'},setStock:{type:'number',description:'Set stok absolut dalam satuan stok dasar.'},patch:{type:'object'}},required:[]} } },
    { type:'function', function:{ name:'add_inventory', description:'Tambah bahan baru.', parameters:{type:'object',properties:{item:{type:'object'}},required:['item']} } },
    { type:'function', function:{ name:'delete_inventory', description:'Hapus bahan.', parameters:{type:'object',properties:{itemId:{type:'string'}},required:['itemId']} } },
    { type:'function', function:{ name:'get_sales_summary', description:'Ringkasan penjualan hari ini/7 hari/30 hari.', parameters:{type:'object',properties:{period:{type:'string',enum:['today','7d','30d']}},required:['period']} } },
    { type:'function', function:{ name:'get_top_products', description:'Produk terlaris.', parameters:{type:'object',properties:{period:{type:'string',enum:['today','7d','30d']},limit:{type:'number'}},required:['period']} } },
    { type:'function', function:{ name:'search_products', description:'Cari menu berdasarkan nama.', parameters:{type:'object',properties:{search:{type:'string'}},required:['search']} } },
    { type:'function', function:{ name:'add_product', description:'Tambah menu baru.', parameters:{type:'object',properties:{product:{type:'object'}},required:['product']} } },
    { type:'function', function:{ name:'update_product', description:'Ubah menu/harga/kategori/dll.', parameters:{type:'object',properties:{productId:{type:'string'},patch:{type:'object'}},required:['productId','patch']} } },
    { type:'function', function:{ name:'delete_product', description:'Hapus menu.', parameters:{type:'object',properties:{productId:{type:'string'}},required:['productId']} } },
    { type:'function', function:{ name:'set_product_availability', description:'Aktif/nonaktifkan menu.', parameters:{type:'object',properties:{productId:{type:'string'},isAvailable:{type:'boolean'}},required:['productId','isAvailable']} } },
    { type:'function', function:{ name:'add_member', description:'Tambah member.', parameters:{type:'object',properties:{member:{type:'object'}},required:['member']} } },
    { type:'function', function:{ name:'update_member', description:'Ubah member.', parameters:{type:'object',properties:{memberId:{type:'string'},patch:{type:'object'}},required:['memberId','patch']} } },
    { type:'function', function:{ name:'delete_member', description:'Hapus member.', parameters:{type:'object',properties:{memberId:{type:'string'}},required:['memberId']} } },
    { type:'function', function:{ name:'save_table', description:'Buat atau ubah meja.', parameters:{type:'object',properties:{table:{type:'object'}},required:['table']} } },
    { type:'function', function:{ name:'delete_table', description:'Hapus meja.', parameters:{type:'object',properties:{tableId:{type:'string'}},required:['tableId']} } },
    { type:'function', function:{ name:'update_transaction', description:'Ubah transaksi.', parameters:{type:'object',properties:{transactionId:{type:'string'},patch:{type:'object'}},required:['transactionId','patch']} } },
    { type:'function', function:{ name:'void_transaction', description:'Void/batalkan transaksi.', parameters:{type:'object',properties:{transactionId:{type:'string'}},required:['transactionId']} } },
    { type:'function', function:{ name:'update_order_status', description:'Ubah status pesanan KDS/POS.', parameters:{type:'object',properties:{orderId:{type:'string'},status:{type:'string'}},required:['orderId','status']} } },
    { type:'function', function:{ name:'navigate', description:'Buka halaman POS tertentu.', parameters:{type:'object',properties:{tab:{type:'string'}},required:['tab']} } },
    { type:'function', function:{ name:'set_theme', description:'Ubah tema aplikasi.', parameters:{type:'object',properties:{theme:{type:'string',enum:['light','dark','espresso','warm']}},required:['theme']} } },
    { type:'function', function:{ name:'update_settings', description:'Ubah pengaturan aplikasi.', parameters:{type:'object',properties:{patch:{type:'object'}},required:['patch']} } },
  ];

  const executeAsistenTool = (name, args) => {
    switch (name) {
      case 'get_shift_status': return aiGetShiftStatus();
      case 'open_shift': return aiOpenShift(args);
      case 'close_shift': return aiCloseShift(args);
      case 'update_shift': return aiUpdateShift(args);
      case 'get_inventory': return aiToolGetInventory(args);
      case 'update_inventory': return aiUpdateInventory(args);
      case 'add_inventory': return aiAddInventory(args);
      case 'delete_inventory': return aiDeleteInventory(args);
      case 'get_sales_summary': return aiToolGetSalesSummary(args);
      case 'get_top_products': return aiToolGetTopProducts(args);
      case 'search_products': return aiToolSearchProducts(args);
      case 'add_product': return aiAddProduct(args);
      case 'update_product': return aiUpdateProduct(args);
      case 'delete_product': return aiDeleteProduct(args);
      case 'set_product_availability': return aiSetProductAvailability(args);
      case 'add_member': return aiAddMember(args);
      case 'update_member': return aiUpdateMember(args);
      case 'delete_member': return aiDeleteMember(args);
      case 'save_table': return aiSaveTable(args);
      case 'delete_table': return aiDeleteTable(args);
      case 'update_transaction': return aiUpdateTransaction(args);
      case 'void_transaction': return aiVoidTransaction(args);
      case 'update_order_status': return aiUpdateOrderStatus(args);
      case 'navigate': return aiNavigate(args);
      case 'set_theme': return aiSetTheme(args);
      case 'update_settings': return aiUpdateSettings(args);
      default: return aiResult(false, `Tool "${name}" tidak tersedia.`);
    }
  };

  // Kirim pertanyaan ke Asisten Kasir AI. AI sekarang dapat membaca dan
  // menjalankan aksi nyata pada POS melalui function calling Puter.
  const tanyaAsistenKasir = async (event) => {
    event?.preventDefault();
    const pertanyaan = pertanyaanAsisten.trim();
    if (!pertanyaan || asistenLoading) return;

    setAsistenLoading(true);
    setJawabanAsisten('');
    setRiwayatAsisten(prev => [...prev, { role: 'user', content: pertanyaan, id: `user-${Date.now()}-${prev.length}` }]);
    setPertanyaanAsisten('');

    try {
      const systemPrompt = `
Kamu adalah Asisten Kasir AI sekaligus operator Kedai Kopi Selasar.
Kamu terhubung langsung ke POS dan memiliki tools untuk membaca serta menjalankan aksi nyata.

ATURAN:
- Jika user meminta DATA/INFORMASI dari POS, WAJIB panggil tool baca yang sesuai sebelum menjawab. Jangan mengatakan tool tidak ada jika tool tercantum di daftar tools.
- Untuk pertanyaan stok, bahan baku, inventory, persediaan, atau 'lihat bahan', WAJIB panggil get_inventory tanpa search jika user meminta daftar umum, atau isi search jika menyebut nama bahan.
- Untuk pertanyaan omzet/penjualan, WAJIB panggil get_sales_summary. Untuk produk terlaris, WAJIB panggil get_top_products. Untuk mencari menu, WAJIB panggil search_products.
- Jika user meminta melakukan sesuatu di aplikasi, JALANKAN tool yang sesuai. Jangan hanya memberi tutorial.
- Untuk membuka/menyalakan atau menutup/mematikan shift, langsung gunakan open_shift/close_shift.
- Untuk stok, menu, member, meja, transaksi, status order, navigasi, tema, dan pengaturan gunakan tool yang tersedia.
- LOGIKA RESTOCK BAHAN BAKU: angka seperti 'tambah susu 1/2/3' berarti JUMLAH KEMASAN, bukan 1/2/3 ml atau gram. WAJIB baca get_inventory terlebih dahulu agar mengetahui packSize bahan tersebut. Setelah itu gunakan update_inventory dengan packages. Jangan mengarang packSize dan jangan menggunakan angka 999 sebagai koreksi.
- Contoh: jika Susu Diamond memiliki unit 'ml' dan packSize 1000, maka 'tambah susu Diamond 1' = +1000 ml; 3 = +3000 ml. Jika bahan memiliki unit 'liter' dan packSize 1, maka 1 kemasan = +1 liter.
- packSize bersifat per-bahan. Jangan menganggap semua bahan cair 1000 ml atau semua bahan berat 1000 g jika data bahan memiliki packSize eksplisit.
- Setelah tool berhasil, jelaskan perubahan yang benar-benar terjadi.
- Jangan pernah mengklaim berhasil jika tool mengembalikan ok:false.
- Jangan mengarang ID/data. Jika perlu ID, gunakan tool pencarian/data yang tersedia terlebih dahulu.
- Untuk penghapusan atau void, hanya lakukan jika user memang meminta tindakan tersebut secara eksplisit.
- Gunakan bahasa Indonesia yang natural, singkat, dan praktis.
`;

      const historyForModel = [...riwayatAsisten, { role: 'user', content: pertanyaan }]
        .map(item => ({ role: item.role, content: item.content }));
      let messages = [
        { role:'system', content:systemPrompt },
        ...historyForModel,
      ];

      let response = await puter.ai.chat(messages, {
        tools: asistenKasirTools,
        temperature: 0.15,
        max_tokens: 900,
      });

      for (let round = 0; round < 6; round += 1) {
        const toolCalls = response?.message?.tool_calls || [];
        if (!toolCalls.length) break;

        messages = [...messages, response.message];

        for (const toolCall of toolCalls) {
          let args = {};
          try {
            args = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};
          } catch {
            args = {};
          }

          let result;
          try {
            result = executeAsistenTool(toolCall?.function?.name, args);
          } catch (toolError) {
            console.error('AI tool error:', toolError);
            result = aiResult(false, toolError?.message || 'Tool gagal dijalankan.');
          }

          messages.push({
            role:'tool',
            tool_call_id:toolCall.id,
            content:typeof result === 'string' ? result : JSON.stringify(result),
          });
        }

        response = await puter.ai.chat(messages, {
          tools: asistenKasirTools,
          temperature: 0.15,
          max_tokens: 900,
        });
      }

      const content = response?.message?.content;
      const jawaban = typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content.map(x => typeof x === 'string' ? x : x?.text || '').filter(Boolean).join('\n')
          : typeof response?.text === 'string'
            ? response.text
            : typeof response === 'string' ? response : '';

      const finalJawaban = jawaban || 'Perintah selesai dijalankan.';
      setJawabanAsisten(finalJawaban);
      setRiwayatAsisten(prev => [...prev, { role: 'assistant', content: finalJawaban, id: `assistant-${Date.now()}-${prev.length}` }]);
    } catch (error) {
      console.error('Gagal menjalankan Asisten Kasir AI:', error);
      const errorText = `Asisten AI gagal menjalankan perintah: ${error?.message || 'Silakan coba lagi.'}`;
      setJawabanAsisten(errorText);
      setRiwayatAsisten(prev => [...prev, { role: 'assistant', content: errorText, id: `assistant-error-${Date.now()}-${prev.length}` }]);
    } finally {
      setAsistenLoading(false);
    }
  };

  const appendLedgerEvent = (eventType, entityId, payload) => {
    if (!activeOrganizationId || !authUserIdRef.current) return;
    void supabase.from('organization_ledger').insert({
      organization_id: activeOrganizationId,
      event_type: eventType,
      entity_id: String(entityId),
      payload,
      created_by: authUserIdRef.current,
    }).then(({ error }) => {
      // The migration may not have been run yet; normal POS data still uses
      // the existing organization snapshot until the ledger is enabled.
      if (error && error.code !== '42P01' && error.code !== 'PGRST205') console.warn('Ledger sync:', error.message);
    });
  };

  const recordExpenseAudit = (action, expense, previous = null) => {
    setExpenseAudit(prev => [{
      id: `EXP-AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      expenseId: expense?.id || previous?.id,
      title: expense?.title || previous?.title || 'Pengeluaran',
      amount: Number(expense?.amount ?? previous?.amount) || 0,
      date: new Date().toISOString(),
      previous: previous ? { title: previous.title, amount: previous.amount, category: previous.category, note: previous.note } : null,
    }, ...prev].slice(0, 1000));
  };

  const handleAddExpense = (expense) => {
    const next = { ...expense, id: expense.id || `EXP-${Date.now()}`, createdAt: expense.createdAt || new Date().toISOString() };
    setExpenses(prev => [next, ...prev]);
    recordExpenseAudit('created', next);
    appendLedgerEvent('expense.created', next.id, next);
  };

  const handleUpdateExpense = (updatedExpense) => {
    const previous = expenses.find(item => item.id === updatedExpense.id);
    setExpenses(prev => prev.map(item => item.id === updatedExpense.id ? { ...item, ...updatedExpense, updatedAt: new Date().toISOString() } : item));
    recordExpenseAudit('updated', updatedExpense, previous);
    appendLedgerEvent('expense.updated', updatedExpense.id, updatedExpense);
  };

  const handleDeleteExpense = (expenseId) => {
    const previous = expenses.find(item => item.id === expenseId);
    if (!previous) return;
    setExpenses(prev => prev.filter(item => item.id !== expenseId));
    recordExpenseAudit('deleted', previous);
    appendLedgerEvent('expense.deleted', expenseId, previous);
  };

  const handleAddTransaction = (newTx) => {
    setTransactions(prev => [newTx, ...prev]);
    appendLedgerEvent('transaction.created', newTx.id, newTx);
    if (newTx.customerType === 'Dine-In' && newTx.tableName) {
      setTables(prev => prev.map(t => t.name === newTx.tableName ? { ...t, status: 'occupied', currentOrderId: newTx.id } : t));
    }
    if (newTx.memberId) {
      setMembers(prev => prev.map(member => {
        if (member.id !== newTx.memberId) return member;
        const totalSpent = Number(member.totalSpent || 0) + Number(newTx.total || 0);
        const points = Number(member.points || 0) + Math.floor(Number(newTx.total || 0) / 10000);
        const level = totalSpent >= 5000000 ? 'Platinum' : totalSpent >= 3000000 ? 'Gold VIP' : totalSpent >= 1000000 ? 'Silver' : 'Bronze';
        return { ...member, totalSpent, points, level };
      }));
    }
  };

  const handleUpdateTransaction = (updatedTx) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const handleVoidTransaction = (txId) => {
    const transaction = transactions.find(t => t.id === txId);
    if (!transaction || String(transaction.status || transaction.paymentStatus || '').toLowerCase() === 'void') return;

    setTransactions(prev => prev.map(t => t.id === txId ? {
      ...t,
      status: 'void',
      paymentStatus: 'void',
      orderStatus: 'cancelled',
      voidedAt: new Date().toISOString()
    } : t));
    appendLedgerEvent('transaction.voided', txId, { transactionId: txId, receiptNumber: transaction.receiptNumber, voidedAt: new Date().toISOString() });

    (transaction.items || []).forEach(cartItem => {
      (cartItem.ingredients || []).forEach(ingredient => {
        const target = inventory.find(item => item.id === ingredient.id);
        const inventoryUnit = target?.unit || target?.satuan || ingredient.unit || 'ml';
        const restored = convertInventoryQuantity(
          (Number(ingredient.amount) || 0) * (Number(cartItem.qty ?? cartItem.quantity) || 0),
          ingredient.unit || inventoryUnit,
          inventoryUnit
        );
        setInventory(prev => prev.map(item => {
          if (item.id !== ingredient.id) return item;
          return Number.isFinite(restored) ? { ...item, stock: (Number(item.stock) || 0) + restored } : item;
        }));
        if (target && Number.isFinite(restored) && restored > 0) {
          const stockMovement = {
            id: `STK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            date: new Date().toISOString(),
            inventoryId: ingredient.id,
            inventoryName: target.name,
            type: 'in',
            reason: `Pengembalian dari void ${transaction.receiptNumber || 'transaksi'}`,
            quantity: restored,
            unit: inventoryUnit,
            stockBefore: Number(target.stock) || 0,
            stockAfter: (Number(target.stock) || 0) + restored,
          };
          setInventoryHistory(prev => [stockMovement, ...prev].slice(0, 1000));
          appendLedgerEvent('inventory.movement', stockMovement.id, stockMovement);
        }
      });
    });

    if (transaction.memberId) {
      setMembers(prev => prev.map(member => {
        if (member.id !== transaction.memberId) return member;
        const totalSpent = Math.max(0, (Number(member.totalSpent) || 0) - (Number(transaction.total) || 0));
        const points = Math.max(0, (Number(member.points) || 0) - Math.floor((Number(transaction.total) || 0) / 10000));
        const level = totalSpent >= 5000000 ? 'Platinum' : totalSpent >= 3000000 ? 'Gold VIP' : totalSpent >= 1000000 ? 'Silver' : 'Bronze';
        return { ...member, totalSpent, points, level };
      }));
    }
    setTables(prev => prev.map(table => table.currentOrderId === txId
      ? { ...table, status: 'available', currentOrderId: null }
      : table));
  };

  const handleDeductStock = (ingredientId, amountToDeduct, sourceUnit) => {
    const target = inventory.find(item => item.id === ingredientId);
    if (!target) return;
    const inventoryUnit = target.unit || target.satuan || sourceUnit || 'ml';
    const convertedAmount = sourceUnit
      ? convertInventoryQuantity(amountToDeduct, sourceUnit, inventoryUnit)
      : Number(amountToDeduct);
    if (!Number.isFinite(convertedAmount) || convertedAmount < 0) {
      console.warn(`Takaran ${sourceUnit || '-'} tidak kompatibel dengan satuan stok ${inventoryUnit}.`);
      return;
    }
    setInventory(prev => prev.map(item => {
      if (item.id === ingredientId) {
        return { ...item, stock: Math.max(0, (Number(item.stock) || 0) - convertedAmount) };
      }
      return item;
    }));
    const stockMovement = {
      id: `STK-${Date.now()}-${ingredientId}`,
      date: new Date().toISOString(),
      inventoryId: ingredientId,
      inventoryName: target.name,
      type: 'out',
      reason: 'Pemakaian untuk transaksi',
      quantity: convertedAmount,
      unit: inventoryUnit,
      stockBefore: Number(target.stock) || 0,
      stockAfter: Math.max(0, (Number(target.stock) || 0) - convertedAmount),
    };
    setInventoryHistory(prev => [stockMovement, ...prev].slice(0, 1000));
    appendLedgerEvent('inventory.movement', stockMovement.id, stockMovement);
  };

  const handleRecordInventoryMovement = (movement) => {
    if (!movement?.inventoryId) return;
    const nextMovement = {
      id: movement.id || `STK-${Date.now()}-${movement.inventoryId}`,
      date: movement.date || new Date().toISOString(),
      ...movement,
    };
    setInventoryHistory(prev => [nextMovement, ...prev].slice(0, 1000));
    appendLedgerEvent('inventory.movement', nextMovement.id, nextMovement);
  };

  const handleUpdateOrderStatus = (orderId, nextStatus) => {
    setTransactions(prev => prev.map(t => t.id === orderId ? { ...t, orderStatus: nextStatus } : t));
    if (nextStatus === 'completed') {
      setTables(prev => prev.map(t => t.currentOrderId === orderId ? { ...t, status: 'available', currentOrderId: null } : t));
    }
  };

  const handleToggleProductAvailability = (productId) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p));
  };

  const handleAddMember = (member) => setMembers(prev => [...prev, member]);
  const handleUpdateMember = (updatedMember) => setMembers(prev => prev.map(member => member.id === updatedMember.id ? updatedMember : member));
  const handleDeleteMember = (memberId) => setMembers(prev => prev.filter(member => member.id !== memberId));

  const handleStartTableOrder = (table) => {
    setTableForNewOrder(table.name);
    setActiveTab('pos');
  };

  const handleSaveTable = (table) => {
    setTables(prev => prev.some(item => item.id === table.id)
      ? prev.map(item => item.id === table.id ? { ...table, currentOrderId: table.status === 'occupied' ? table.currentOrderId || null : null } : item)
      : [{ ...table, currentOrderId: table.status === 'occupied' ? table.currentOrderId || null : null }, ...prev]);
  };

  const handleDeleteTable = (tableId) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
  };

  const handleCloseShift = (summary) => {
    if (activeShift) {
      const closedShift = { ...activeShift, ...summary, closingTime: summary?.closingTime || new Date().toISOString() };
      setShiftHistory(prev => [closedShift, ...prev]);
      appendLedgerEvent('shift.closed', closedShift.id, closedShift);
    }
    setActiveShift(null);
  };

  // Hanya rapikan shift yang berasal dari hari sebelum aplikasi dibuka.
  // Tidak memakai timer, sehingga shift tidak tiba-tiba ditutup saat aplikasi
  // sedang dipakai dan jam melewati pukul 00.00.
  useEffect(() => {
    if (!cloudReady || !activeOrganizationId || !activeShift) return;
    if (!shouldAutoCloseShift(activeShift, appSessionDateRef.current)) return;
    const { validTransactions, cashSales, cashExpenses, expectedCash } = getShiftCashSummary(activeShift, transactions, expenses);
    const closedShift = {
      ...activeShift,
      closingTime: new Date().toISOString(),
      autoClosed: true,
      closeReason: 'Otomatis ditutup saat aplikasi dibuka pada hari berikutnya',
      reconciliationStatus: 'belum_dihitung',
      physicalCash: null,
      cashDifference: null,
      cashSales,
      cashExpenses,
      expectedCash,
      transactionCount: validTransactions.length
    };

    setShiftHistory(previous => previous.some(shift => shift.id === activeShift.id)
      ? previous
      : [closedShift, ...previous]);
    setActiveShift(current => current?.id === activeShift.id ? null : current);
  }, [activeOrganizationId, activeShift, cloudReady, expenses, transactions]);

  const handleResetOrganizationData = () => {
    setProducts([]);
    setInventory([]);
    setTables([]);
    setMembers([]);
    setTransactions([]);
    setExpenses([]);
    setExpenseAudit([]);
    setInventoryHistory([]);
    setAddons([]);
    setActiveShift(null);
    setShiftHistory([]);
  };

  const handleOnboardingComplete = ({ profile, receipt }) => {
    const normalizedBusinessName = profile.businessName.trim() || 'Kedai Kopi Selasar';
    const normalizedOwnerName = profile.ownerName.trim() || 'Owner';
    const normalizedOwnerPin = profile.ownerPin.trim();
    const normalizedCashierPin = profile.cashierPin.trim();

    setAppSettings(prev => ({
      ...prev,
      onboardingCompleted: true,
      profile: {
        ...(prev.profile || {}),
        businessName: normalizedBusinessName,
        ownerName: normalizedOwnerName,
        ownerPin: normalizedOwnerPin,
        cashierPin: normalizedCashierPin,
      },
      receipt: {
        ...(prev.receipt || {}),
        storeName: receipt.storeName,
      },
    }));

    setActiveShift({
      id: `shift-${Date.now()}`,
      name: `Shift Awal (${normalizedOwnerName})`,
      startTime: new Date().toISOString(),
      openingCash: 0,
    });

    setTheme('light');
    setNeedsOnboarding(false);
    setCurrentUserRole('owner');
    setPinVerified(false);
  };

  const toggleTheme = () => {
    const order = ['light', 'dark', 'espresso', 'warm'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }
      }
    });
    if (error) throw error;
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch (logoutError) {
      console.error('Gagal menutup sesi Google:', logoutError.message);
    } finally {
      clearAuthenticatedSession();
    }
  };

  if (authLoading) {
    return <div className="login-screen"><div className="login-card"><p>Memeriksa sesi aman...</p></div></div>;
  }

  if (authError) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h2 style={{ fontSize: '18px', textAlign: 'center' }}>Login berhasil, workspace belum terbuka</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, textAlign: 'center' }}>{authError}</p>
          <button
            type="button"
            className="login-btn"
            onClick={() => {
              setAuthError('');
              setAuthLoading(true);
              supabase.auth.getSession()
                .then(({ data }) => {
                  if (data.session) {
                    window.location.reload();
                  } else {
                    setAuthLoading(false);
                  }
                })
                .catch((error) => {
                  setAuthError(error.message);
                  setAuthLoading(false);
                });
            }}
          >
            Coba buka ulang sesi
          </button>
          <button
            type="button"
            className="role-btn"
            onClick={() => {
              setAuthError('');
              void handleLogout();
            }}
          >
            Keluar dan login ulang
          </button>
        </div>
      </div>
    );
  }

  if (!currentUserRole) {
    return <LoginScreen onGoogleLogin={handleGoogleLogin} />;
  }

  if (!cloudReady) {
    return <div className="login-screen"><div className="login-card"><p>Memuat data toko dengan aman...</p></div></div>;
  }

  if (needsOnboarding) {
    return (
      <OnboardingScreen
        authenticatedUser={authenticatedUser}
        appSettings={appSettings}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (!pinVerified) {
    return (
      <LoginModal
        currentUserRole={currentUserRole}
        authenticatedUser={authenticatedUser}
        activeOrganizationId={activeOrganizationId}
        appSettings={appSettings}
        onLoginSuccess={(verifiedRole) => {
          setCurrentUserRole(verifiedRole);
          setPinVerified(true);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <InstallAppButton />
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeShift={activeShift}
        theme={theme}
        toggleTheme={toggleTheme}
        currentUserRole={currentUserRole}
        authenticatedUser={authenticatedUser}
        activeOrganizationId={activeOrganizationId}
        syncStatus={syncStatus}
        onLogout={() => { void handleLogout(); }}
        onOpenBluetoothModal={() => setShowBluetoothModal(true)}
      />

      <main className="main-content" key={activeTab}>
        {activeTab === 'pos' && (
          <PosScreen
            products={products}
            inventory={inventory}
            tables={tables}
            members={members}
            activeShift={activeShift}
            appSettings={appSettings}
            addons={addons}
            onAddTransaction={handleAddTransaction}
            onDeductStock={handleDeductStock}
            onOpenShiftTab={() => setActiveTab('shift')}
            onOpenBluetoothModal={() => setShowBluetoothModal(true)}
            tableForNewOrder={tableForNewOrder}
          />
        )}

        {activeTab === 'kds' && (
          <KitchenDisplay
            transactions={transactions}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'reports' && currentUserRole === 'owner' && (
          <ReportsScreen
            transactions={transactions}
            expenses={expenses}
            setExpenses={setExpenses}
            expenseAudit={expenseAudit}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            products={products}
            inventory={inventory}
            inventoryHistory={inventoryHistory}
            members={members}
            appSettings={appSettings}
            activeShift={activeShift}
            shiftHistory={shiftHistory}
            onVoidTransaction={handleVoidTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            currentUserRole={currentUserRole}
          />
        )}

        {activeTab === 'menu_manager' && currentUserRole === 'owner' && (
          <MenuManager
           products={products}
           inventory={inventory}
           setProducts={setProducts}
           transactions={transactions}
           setTransactions={setTransactions}
/>
        )}

        {activeTab === 'inventory' && currentUserRole === 'owner' && (
          <InventoryManager
            inventory={inventory}
            setInventory={setInventory}
            onRecordInventoryMovement={handleRecordInventoryMovement}
            onAddExpense={handleAddExpense}
            unitOptions={['gr', 'kg', 'ml', 'liter', 'pcs']}
          />
        )}

        {activeTab === 'settings' && currentUserRole === 'owner' && (
          <SettingsScreen
            appSettings={appSettings}
            setAppSettings={setAppSettings}
            addons={addons}
            setAddons={setAddons}
            theme={theme}
            setTheme={setTheme}
            onOpenBluetoothModal={() => setShowBluetoothModal(true)}
            onOpenReceiptSettings={() => setActiveTab('receipt_settings')}
            activeShift={activeShift}
            onOpenShift={(shift) => setActiveShift(shift)}
            onUpdateShift={(updatedShift) => setActiveShift(updatedShift)}
            onCloseShift={handleCloseShift}
            onResetOrganizationData={handleResetOrganizationData}
            authenticatedUser={authenticatedUser}
            activeOrganizationId={activeOrganizationId}
            products={products}
            onToggleProductAvailability={handleToggleProductAvailability}
          />
        )}

        {activeTab === 'shift' && (
          <ShiftSettings activeShift={activeShift} onOpenShift={setActiveShift} onUpdateShift={setActiveShift} onCloseShift={handleCloseShift} products={products} transactions={transactions} expenses={expenses} onToggleProductAvailability={handleToggleProductAvailability} />
        )}

        {activeTab === 'loyalty' && (
          <LoyaltyScreen members={members} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} />
        )}

        {activeTab === 'receipt_settings' && currentUserRole === 'owner' && (
          <ReceiptSettings appSettings={appSettings} setAppSettings={setAppSettings} />
        )}

        {activeTab === 'tables' && (
          <TableManagement
            tables={tables}
            onSaveTable={handleSaveTable}
            onDeleteTable={handleDeleteTable}
            onSelectTableForOrder={handleStartTableOrder}
          />
        )}

      </main>

      {/* ── Asisten Kasir AI — theme-aware, mobile-safe ───────────────────── */}
      {asistenMinimized ? (
        <button
          type="button"
          className="ai-assistant-minimized"
          aria-label="Buka Asisten Kasir AI"
          aria-expanded="false"
          onClick={(event) => {
            event.stopPropagation();
            setAsistenMinimized(false);
          }}
        >
          <span className="ai-assistant-minimized-icon">✦</span>
          <span className="ai-assistant-minimized-dot" />
        </button>
      ) : (
        <section
          className="ai-assistant-widget"
          aria-label="Asisten Kasir AI"
          role="dialog"
        >
          <header className="ai-assistant-header">
            <div className="ai-assistant-brand">
              <div className="ai-assistant-mark">S</div>
              <div className="ai-assistant-heading">
                <strong>Asisten Kasir AI</strong>
                <span>Operator POS · terhubung ke data toko</span>
              </div>
            </div>

            <button
              type="button"
              className="ai-assistant-minimize"
              aria-label="Minimalkan Asisten Kasir AI"
              aria-expanded="true"
              onClick={(event) => {
                event.stopPropagation();
                setAsistenMinimized(true);
              }}
            >
              <span aria-hidden="true">−</span>
            </button>
          </header>

          <div className="ai-assistant-history" role="log" aria-live="polite">
            {riwayatAsisten.length === 0 && (
              <div className="ai-assistant-empty">
                <div className="ai-assistant-empty-mark">✦</div>
                <strong>Ada yang bisa kubantu, bos?</strong>
                <span>
                  Tanya apa saja soal operasional kedai, atau beri aku perintah
                  langsung untuk dikerjakan di POS.
                </span>
                <div className="ai-assistant-suggestions" aria-label="Contoh perintah">
                  {[
                    ['↗ Penjualan', 'Ringkas penjualan hari ini'],
                    ['◌ Stok', 'Cek stok bahan yang menipis'],
                    ['☀ Shift', 'Lihat status shift saat ini'],
                    ['✦ Cepat', 'Tampilkan menu terlaris'],
                  ].map(([label, prompt]) => (
                    <button
                      key={label}
                      type="button"
                      className="ai-assistant-suggestion"
                      onClick={() => {
                        setPertanyaanAsisten(prompt);
                        requestAnimationFrame(() => asistenInputRef.current?.focus());
                      }}
                    >
                      <b>{label}</b>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {riwayatAsisten.map((message) => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={message.id}
                  className={`ai-message-row ${isUser ? 'user' : 'assistant'}`}
                >
                  {!isUser && (
                    <div className="ai-message-avatar" aria-hidden="true">
                      ✦
                    </div>
                  )}

                  <div
                    className={`ai-message-bubble ${
                      isUser ? 'user' : 'assistant'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}

            {asistenLoading && (
              <div className="ai-message-row assistant">
                <div className="ai-message-avatar" aria-hidden="true">
                  ✦
                </div>

                <div className="ai-message-bubble assistant ai-message-loading">
                  <span />
                  <span />
                  <span />
                  <em>Memproses…</em>
                </div>
              </div>
            )}

            <div ref={asistenChatEndRef} />
          </div>

          <div className="ai-assistant-composer">
            <form onSubmit={tanyaAsistenKasir}>
              <div className="ai-assistant-input-wrap">
                <textarea
                  ref={asistenInputRef}
                  value={pertanyaanAsisten}
                  onChange={(event) =>
                    setPertanyaanAsisten(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void tanyaAsistenKasir(event);
                    }
                  }}
                  placeholder="Tulis perintah atau pertanyaan…"
                  rows={2}
                  disabled={asistenLoading}
                  aria-label="Pesan untuk Asisten Kasir AI"
                />

                <button
                  type="submit"
                  className="ai-assistant-send"
                  disabled={asistenLoading || !pertanyaanAsisten.trim()}
                  aria-label="Kirim pesan"
                  title="Kirim pesan"
                >
                  {asistenLoading ? '…' : '➤'}
                </button>
              </div>

              <div className="ai-assistant-hint">
                <span>Enter kirim · Shift+Enter baris baru</span>
                <span>AI dapat membaca &amp; menjalankan aksi POS</span>
              </div>
            </form>
          </div>
        </section>
      )}

      {showBluetoothModal && (
        <BluetoothModal
          onClose={() => setShowBluetoothModal(false)}
          onConnected={(name) => {
            setAppSettings(prev => ({ ...prev, printerName: name }));
          }}
        />
      )}
    </div>
  );
}

export default App;
