// Standalone visual preview of the redesigned POS screen.
// It mounts <PosScreen> with seed data, bypassing Supabase auth so the
// design changes can be reviewed without live credentials. Business logic
// itself is untouched — only display data is stubbed here.
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Header } from './components/Header';
import { PosScreen } from './components/POS/PosScreen';
import {
  INITIAL_PRODUCTS,
  INITIAL_INVENTORY,
  INITIAL_TABLES,
  INITIAL_LOYALTY_MEMBERS,
  INITIAL_ADDONS,
} from './data/initialData';
import './styles/selasar-ui.css';
import './styles/pos-delivero.css';

function PreviewApp() {
  const [activeTab, setActiveTab] = useState('pos');
  const [theme, setTheme] = useState('light');

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
    profile: { businessName: 'Kedai Kopi Selasar', ownerName: 'Owner' },
    receipt: {},
  };

  return (
    <>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeShift={activeShift}
        theme={theme}
        toggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        currentUserRole="owner"
        authenticatedUser={{ id: 'preview-user', name: 'Samantha', email: 'preview@selasar.id' }}
        activeOrganizationId="preview-org"
        syncStatus="synced"
        onLogout={() => {}}
        onOpenBluetoothModal={() => {}}
      />
      <main style={{ paddingTop: 8 }}>
        {activeTab === 'pos' && (
          <PosScreen
            products={INITIAL_PRODUCTS}
            inventory={INITIAL_INVENTORY}
            tables={INITIAL_TABLES}
            members={INITIAL_LOYALTY_MEMBERS}
            activeShift={activeShift}
            onAddTransaction={() => {}}
            onDeductStock={() => {}}
            onOpenShiftTab={() => setActiveTab('shift')}
            appSettings={appSettings}
            addons={INITIAL_ADDONS}
            onOpenBluetoothModal={() => {}}
            tableForNewOrder={null}
          />
        )}
      </main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PreviewApp />
  </React.StrictMode>
);
