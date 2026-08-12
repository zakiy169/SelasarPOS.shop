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
import { supabase } from './lib/supabase';

// Font stack map applied as a CSS variable
const FONT_STACKS = {
  jakarta: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  system:  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  inter:   "'Inter', system-ui, -apple-system, sans-serif",
};

const getThemeStorageKey = (organizationId) => (organizationId ? `selasar_theme_${organizationId}` : 'selasar_theme');
const getWorkspaceStorageKey = (organizationId, key) => `selasar_org_${organizationId}_${key}`;
const LEGACY_WORKSPACE_KEYS = [
  'selasar_products',
  'selasar_inventory',
  'selasar_tables',
  'selasar_members',
  'selasar_transactions',
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
  onboardingCompleted: false,
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

  // Authentication User State
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [pinVerified, setPinVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeOrganizationId, setActiveOrganizationId] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('connecting');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const suppressCloudWriteRef = useRef(false);
  const authUserIdRef = useRef(null);
  const authSyncInFlightRef = useRef(null);
  const cloudSaveRef = useRef({ inFlight: false, pending: null, retryTimer: null });

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
    setInventory(nextData.inventory || []);
    setTables(nextData.restaurant_tables || []);
    setMembers(nextData.members || []);
    setTransactions(nextData.transactions || []);
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

      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .limit(1);

      if (membershipError) {
        console.error('Gagal memuat akses organisasi:', membershipError.message);
        authSyncInFlightRef.current = null;
        if (isMounted) setAuthLoading(false);
        return;
      }

      let membership = memberships?.[0];
      if (!membership) {
        const { data: organizationId, error: organizationError } = await supabase
          .rpc('create_organization', { org_name: 'Toko Baru' });
        if (organizationError) {
          console.error('Gagal membuat organisasi awal:', organizationError.message);
          authSyncInFlightRef.current = null;
          if (isMounted) setAuthLoading(false);
          return;
        }
        membership = { organization_id: organizationId, role: 'owner' };
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
      queueCloudSave({
        organization_id: activeOrganizationId,
        products,
        inventory,
        restaurant_tables: tables,
        members,
        transactions,
        addons,
        app_settings: appSettings,
        active_shift: activeShift,
        shift_history: shiftHistory,
        updated_at: new Date().toISOString(),
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [activeOrganizationId, cloudReady, products, inventory, tables, members, transactions, addons, appSettings, activeShift, shiftHistory, queueCloudSave]);

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
        applyCloudSnapshot(nextData);
        setSyncStatus('synced');
      })
      .subscribe((status) => {
        setSyncStatus(status === 'SUBSCRIBED' ? 'synced' : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'offline' : 'connecting');
      });

    // Refetch after returning online or to a backgrounded tab. This also keeps
    // data current when the Realtime publication has not been enabled yet.
    const refreshSnapshot = async () => {
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
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'addons')) setAddons(safeReadJson(key, []));
        if (key === getWorkspaceStorageKey(activeOrganizationId, 'settings')) setAppSettings(normalizeAppSettings(safeReadJson(key, DEFAULT_APP_SETTINGS)));
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

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleAddTransaction = (newTx) => {
    setTransactions(prev => [newTx, ...prev]);
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
    setTransactions(prev => prev.filter(t => t.id !== txId));
    setTables(prev => prev.map(table => table.currentOrderId === txId
      ? { ...table, status: 'available', currentOrderId: null }
      : table));
  };

  const handleDeductStock = (ingredientId, amountToDeduct) => {
    setInventory(prev => prev.map(item => {
      if (item.id === ingredientId) {
        return { ...item, stock: Math.max(0, item.stock - amountToDeduct) };
      }
      return item;
    }));
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
      setShiftHistory(prev => [{ ...activeShift, ...summary, closingTime: summary?.closingTime || new Date().toISOString() }, ...prev]);
    }
    setActiveShift(null);
  };

  const handleResetOrganizationData = () => {
    setProducts([]);
    setInventory([]);
    setTables([]);
    setMembers([]);
    setTransactions([]);
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
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  };

  if (authLoading) {
    return <div className="login-screen"><div className="login-card"><p>Memeriksa sesi aman...</p></div></div>;
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
        onLogout={() => {
          clearAuthenticatedSession();
          void supabase.auth.signOut();
        }}
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
          />
        )}

        {activeTab === 'inventory' && currentUserRole === 'owner' && (
          <InventoryManager
            inventory={inventory}
            setInventory={setInventory}
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
          <ShiftSettings activeShift={activeShift} onOpenShift={setActiveShift} onUpdateShift={setActiveShift} onCloseShift={handleCloseShift} products={products} onToggleProductAvailability={handleToggleProductAvailability} />
        )}

        {activeTab === 'loyalty' && (
          <LoyaltyScreen members={members} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} />
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
