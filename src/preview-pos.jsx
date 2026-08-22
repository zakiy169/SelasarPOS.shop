// Standalone visual preview of the redesigned application.
// Renders every major screen with seed data so the design system can be
// reviewed without live Supabase credentials. Business logic untouched.
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
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
import { SettingsScreen } from './components/Settings/SettingsScreen';
import {
  INITIAL_PRODUCTS,
  INITIAL_INVENTORY,
  INITIAL_TABLES,
  INITIAL_LOYALTY_MEMBERS,
  INITIAL_ADDONS,
  generateSeedTransactions,
} from './data/initialData';
import './styles/selasar-ui.css';
import './styles/pos-delivero.css';
import './styles/login-cinematic.css';

const activeShift = {
  id: 'shift-preview',
  name: 'Rian Barista',
  baristaName: 'Rian Barista',
  shiftType: 'Shift Pagi',
  startTime: new Date().toISOString(),
  openingCash: 200000,
};

const appSettings = {
  printerName: 'BlueTooth Printer 58mm',
  printerWidth: '58mm',
  qrisImage: null,
  taxPercent: 10,
  serviceChargePercent: 5,
  font: 'jakarta',
  onboardingCompleted: true,
  operationalExpenses: [],
  profile: { businessName: 'Kedai Kopi Selasar', ownerName: 'Owner', ownerPin: '8888', cashierPin: '1234' },
  receipt: { storeName: 'Kedai Kopi Selasar', address: 'Jl. Selasar No.1', phone: '0812-3456', footer: 'Terima kasih' },
};

function PreviewApp() {
  const params = new URLSearchParams(window.location.search);
  const initialView = params.get('view') || 'pos';

  const [view, setView] = useState(initialView);
  const [activeTab, setActiveTab] = useState(initialView === 'login' || initialView === 'pin' ? 'pos' : initialView);
  const [transactions] = useState(generateSeedTransactions());
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [members, setMembers] = useState(INITIAL_LOYALTY_MEMBERS);

  // ensure body class always on + inject sidebar rotating promo
  useEffect(() => {
    document.body.classList.add('pos-delivero-active');
    const TIPS = [
      { tag: 'Tips Kasir',  title: 'Gunakan meja saat dine-in.', sub: 'Otomatis tersimpan di riwayat.' },
      { tag: 'Info Loyalti', title: 'Ajak pelanggan jadi member.', sub: 'Poin bertambah tiap transaksi.' },
      { tag: 'Insight Toko', title: 'Cek laporan tiap sore.',      sub: 'Deteksi menu terlaris dan slow-moving.' },
      { tag: 'Kelola Stok',  title: 'Restock sebelum kritis.',    sub: 'Alarm otomatis di menu Stok.' },
    ];
    let idx = 0;
    const mount = () => {
      const sidebar = document.querySelector('.desktop-workspace-sidebar');
      if (!sidebar) return null;
      let card = sidebar.querySelector('.selasar-sidebar-promo');
      if (!card) {
        card = document.createElement('div');
        card.className = 'selasar-sidebar-promo';
        sidebar.appendChild(card);
      }
      const render = () => {
        const t = TIPS[idx % TIPS.length];
        card.innerHTML = `<span>${t.tag}</span><strong>${t.title}</strong><small>${t.sub}</small>`;
      };
      render();
      return setInterval(() => { idx += 1; render(); }, 4200);
    };
    const interval = mount();
    return () => { if (interval) clearInterval(interval); };
  }, []);

  if (view === 'login') {
    return <LoginScreen onGoogleLogin={async () => {}} />;
  }

  if (view === 'pin') {
    return (
      <LoginModal
        onLogin={() => {}}
        onSwitchAccount={() => {}}
        appSettings={appSettings}
        authenticatedUser={{ name: 'Samantha', email: 'samantha@selasar.id' }}
        onLogout={() => {}}
      />
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'pos':
        return (
          <PosScreen
            products={products}
            inventory={inventory}
            tables={tables}
            members={members}
            activeShift={activeShift}
            onAddTransaction={() => {}}
            onDeductStock={() => {}}
            onOpenShiftTab={() => setActiveTab('shift')}
            appSettings={appSettings}
            addons={INITIAL_ADDONS}
            onOpenBluetoothModal={() => {}}
            tableForNewOrder={null}
          />
        );
      case 'kds':
        return (
          <KitchenDisplay
            transactions={transactions}
            onUpdateOrderStatus={() => {}}
          />
        );
      case 'tables':
        return (
          <TableManagement
            tables={tables}
            transactions={transactions}
            onUpdateTables={setTables}
            onNavigateToPos={() => setActiveTab('pos')}
          />
        );
      case 'reports':
        return (
          <ReportsScreen
            transactions={transactions}
            products={products}
            inventory={inventory}
            expenses={[]}
            expenseAudit={[]}
            inventoryHistory={[]}
            shiftHistory={[]}
            addons={INITIAL_ADDONS}
            members={members}
            onAddExpense={() => {}}
            onEditExpense={() => {}}
            onDeleteExpense={() => {}}
            onOpenSettings={() => {}}
            appSettings={appSettings}
            currentUserRole="owner"
          />
        );
      case 'menu_manager':
        return (
          <MenuManager
            products={products}
            inventory={inventory}
            addons={INITIAL_ADDONS}
            onUpdateProducts={setProducts}
            onUpdateAddons={() => {}}
          />
        );
      case 'inventory':
        return (
          <InventoryManager
            inventory={inventory}
            inventoryHistory={[]}
            onUpdateInventory={setInventory}
            onLogInventoryMovement={() => {}}
          />
        );
      case 'loyalty':
        return (
          <LoyaltyScreen
            members={members}
            transactions={transactions}
            onUpdateMembers={setMembers}
          />
        );
      case 'shift':
        return (
          <ShiftSettings
            activeShift={activeShift}
            shiftHistory={[]}
            transactions={transactions}
            appSettings={appSettings}
            expenses={[]}
            onOpenShift={() => {}}
            onCloseShift={() => {}}
            onUpdateSettings={() => {}}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            appSettings={appSettings}
            onUpdateSettings={() => {}}
            addons={INITIAL_ADDONS}
            onUpdateAddons={() => {}}
            onLogout={() => {}}
            authenticatedUser={{ name: 'Owner', email: 'owner@selasar.id' }}
            currentUserRole="owner"
          />
        );
      default:
        return <div style={{ padding: 40 }}>Tab {activeTab} tidak tersedia di preview.</div>;
    }
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeShift={activeShift}
        theme="light"
        toggleTheme={() => {}}
        currentUserRole="owner"
        authenticatedUser={{ id: 'preview-user', name: 'Samantha', email: 'samantha@selasar.id' }}
        activeOrganizationId="preview-org"
        syncStatus="synced"
        onLogout={() => {}}
        onOpenBluetoothModal={() => {}}
      />
      <main className="main-content">{renderTab()}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PreviewApp />
  </React.StrictMode>
);
