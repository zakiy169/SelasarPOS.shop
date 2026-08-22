export const FONT_STACKS = {
  jakarta: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  inter: "'Inter', system-ui, -apple-system, sans-serif",
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

export const getInventoryPackSize = (item = {}) => {
  const explicit = Number(item?.packSize ?? item?.packageSize ?? item?.package_quantity);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return getInventoryUnitMeta(item?.unit || item?.satuan).defaultPackSize;
};

export const convertInventoryQuantity = (value, fromUnit, toUnit) => {
  const from = getInventoryUnitMeta(fromUnit);
  const to = getInventoryUnitMeta(toUnit);
  const amount = Number(value) || 0;
  if (from.family !== to.family) return Number.NaN;
  return (amount * from.factor) / to.factor;
};

export const getThemeStorageKey = (organizationId) => (organizationId ? `selasar_theme_${organizationId}` : 'selasar_theme');
export const getWorkspaceStorageKey = (organizationId, key) => `selasar_org_${organizationId}_${key}`;
export const LEGACY_WORKSPACE_KEYS = [
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

export const DEFAULT_APP_SETTINGS = {
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

export const createEmptyOrganizationSnapshot = (organizationId) => ({
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

export const normalizeAppSettings = (settings = {}) => ({
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

export const safeReadJson = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.warn(`Data lokal ${key} tidak valid, memakai data kosong.`, error);
    return fallback;
  }
};

export const isUserEditingForm = () => {
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

export const shouldRequireOnboarding = (snapshot = {}) => {
  const settings = snapshot.app_settings || {};
  if (settings.onboardingCompleted === false) return true;
  if ('onboardingCompleted' in settings) return false;
  return isEmptyOrganizationSnapshot(snapshot) && isDefaultSetupProfile(settings);
};
