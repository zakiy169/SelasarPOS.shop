import React, { useState, useEffect } from 'react';
import { SelasarLogo } from './SelasarLogo';
import { 
  ShoppingCart, 
  ChefHat, 
  BarChart3, 
  Package, 
  LayoutGrid, 
  Users, 
  Clock, 
  Settings,
  LogOut,
  User,
  Palette,
  Bluetooth,
  Printer,
  Menu,
  X,
  Cloud
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';

export const Header = ({ 
  activeTab, 
  setActiveTab, 
  activeShift, 
  theme, 
  toggleTheme,
  currentUserRole,
  authenticatedUser,
  activeOrganizationId,
  syncStatus,
  onLogout,
  onOpenBluetoothModal
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [btConnected, setBtConnected] = useState(bluetoothPrinter.isConnected);
  const [btName, setBtName] = useState(bluetoothPrinter.deviceName);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncBtStatus = () => {
      setBtConnected(bluetoothPrinter.isConnected);
      setBtName(bluetoothPrinter.deviceName);
    };
    window.addEventListener('selasar_bt_status_change', syncBtStatus);
    return () => window.removeEventListener('selasar_bt_status_change', syncBtStatus);
  }, []);

  const handleTabClick = (tabId) => {
    sounds.playBeep();
    setActiveTab(tabId);
    setMobileNavOpen(false);
  };

  const isOwner = currentUserRole === 'owner';

  // Navigation tabs configuration
  const allTabs = [
    { id: 'pos', label: 'Kasir', icon: ShoppingCart, ownerOnly: false },
    { id: 'kds', label: 'Dapur', icon: ChefHat, ownerOnly: false },
    { id: 'tables', label: 'Meja', icon: LayoutGrid, ownerOnly: false },
    { id: 'loyalty', label: 'Member', icon: Users, ownerOnly: false },
    { id: 'shift', label: 'Shift', icon: Clock, ownerOnly: false },
    { id: 'reports', label: 'Laporan', icon: BarChart3, ownerOnly: true },
    { id: 'menu_manager', label: 'Menu', icon: Package, ownerOnly: true },
    { id: 'inventory', label: 'Stok', icon: Package, ownerOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, ownerOnly: true },
    { id: 'receipt_settings', label: 'Struk', icon: Printer, ownerOnly: true }
  ];

  const visibleTabs = allTabs.filter(t => !t.ownerOnly || isOwner);

  const primaryMobileTabs = visibleTabs.filter(tab => ['pos', 'kds', 'tables', 'loyalty'].includes(tab.id));

  return (
    <>
    <header className="selasar-header">
      <div className="header-left">
        {/* Simplified Clean Logo Header */}
        <div
          className="header-printer-status"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => handleTabClick('pos')}
          title="Kedai Kopi Selasar POS"
        >
          <SelasarLogo size="sm" variant={theme} />
        </div>

        {/* Clean Center Navigation */}
        <nav className={`nav-tabs ${mobileNavOpen ? 'is-open' : ''}`} aria-label="Navigasi utama">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                title={tab.label}
                aria-label={tab.label}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button type="button" className="mobile-only-nav-action" onClick={() => { toggleTheme(); setMobileNavOpen(false); }}>
            <Palette size={15} /><span>Ganti tema</span>
          </button>
          <button type="button" className="mobile-only-nav-action" onClick={() => { onOpenBluetoothModal?.(); setMobileNavOpen(false); }}>
            <Bluetooth size={15} /><span>Printer Bluetooth</span>
          </button>
          <button type="button" className="mobile-only-nav-action mobile-logout-nav" onClick={onLogout}>
            <LogOut size={15} /><span>Keluar dari akun</span>
          </button>
        </nav>
      </div>

      <div className="header-right">
        <div className={`cloud-sync-status ${syncStatus || 'connecting'}`} title={syncStatus === 'offline' ? 'Perubahan tersimpan di perangkat dan akan dicoba lagi saat koneksi kembali.' : 'Data toko tersinkron ke cloud.'}>
          <Cloud size={14} />
          <span>{syncStatus === 'offline' ? 'Menunggu koneksi' : syncStatus === 'syncing' ? 'Menyimpan...' : syncStatus === 'connecting' ? 'Menghubungkan...' : 'Tersinkron'}</span>
        </div>
        <button
          type="button"
          className="header-menu-toggle"
          onClick={() => setMobileNavOpen(open => !open)}
          aria-label={mobileNavOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {/* Bluetooth Thermal Printer Status Pill */}
        <div 
          onClick={onOpenBluetoothModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            background: btConnected ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
            color: btConnected ? 'var(--apple-green)' : 'var(--apple-red)',
            border: `1px solid ${btConnected ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
          title="Klik untuk Hubungkan / Atur Printer Bluetooth Thermal"
        >
          <Bluetooth size={14} />
          <span className="utility-text">{btConnected ? `BT: ${btName || 'Connected'}` : 'Hubungkan BT Printer'}</span>
        </div>

        {/* Realtime Clock Badge */}
        <div className="live-clock-badge">
          <Clock size={14} color="var(--text-muted)" />
          <span>
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Shift Status Indicator */}
        <div 
          className={`shift-status-pill ${activeShift ? 'open' : 'closed'}`}
          onClick={() => handleTabClick('shift')}
          style={{ cursor: 'pointer' }}
          title={activeShift ? `Klik untuk manajemen shift (Barista: ${activeShift.baristaName || activeShift.name})` : 'Klik untuk buka shift'}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: activeShift ? 'var(--apple-green)' : 'var(--apple-red)',
            display: 'inline-block'
          }}></span>
          <span className="shift-label">{activeShift ? (activeShift.shiftType || 'Shift Aktif') : 'Shift Ditutup'}</span>
        </div>

        {/* Logged in User Badge */}
        <div className="user-profile-wrap">
          <button type="button" className="user-role-badge" onClick={() => setProfileOpen(open => !open)} title="Buka profil akun">
            {authenticatedUser?.avatarUrl
              ? <img src={authenticatedUser.avatarUrl} alt="Profil pengguna" />
              : <User size={15} />}
            <span className="profile-name">{authenticatedUser?.name || (isOwner ? 'Owner' : 'Kasir')}</span>
            <small>{isOwner ? 'Owner' : 'Kasir'}</small>
          </button>
          {profileOpen && (
            <div className="user-profile-popover">
              <div className="user-profile-heading">
                {authenticatedUser?.avatarUrl
                  ? <img src={authenticatedUser.avatarUrl} alt="Profil pengguna" />
                  : <div className="user-profile-avatar"><User size={21} /></div>}
                <div><strong>{authenticatedUser?.name || 'Pengguna'}</strong><span>{authenticatedUser?.email || 'Email tidak tersedia'}</span></div>
              </div>
              <div className="user-profile-meta"><span>Role aktif</span><b>{isOwner ? 'Owner' : 'Pegawai / Kasir'}</b></div>
              <div className="user-profile-meta"><span>ID akun</span><b title={authenticatedUser?.id}>{authenticatedUser?.id ? `${authenticatedUser.id.slice(0, 8)}…` : '-'}</b></div>
              <div className="user-profile-meta"><span>ID toko</span><b title={activeOrganizationId}>{activeOrganizationId ? `${activeOrganizationId.slice(0, 8)}…` : '-'}</b></div>
              <button type="button" className="user-logout-btn" onClick={onLogout}><LogOut size={15} /> Keluar dari akun</button>
            </div>
          )}
        </div>

        {/* Theme Cycle Button */}
        <button
          onClick={toggleTheme}
          className="nav-btn header-theme-toggle"
          style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', gap: '5px', whiteSpace: 'nowrap' }}
          title="Ganti Tema (Light → Dark → Espresso → Warm)"
        >
          <Palette size={15} />
          <span style={{ fontSize: '11px' }}>
            {theme === 'light' ? '☀️' : theme === 'dark' ? '🌑' : theme === 'espresso' ? '☕' : '🌿'}
          </span>
        </button>
      </div>
    </header>

    {/* Kept separate from the desktop header so the main actions stay reachable
        with one thumb, while every existing menu remains in the More sheet. */}
    <nav className="mobile-bottom-nav" aria-label="Navigasi cepat">
      {primaryMobileTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => handleTabClick(tab.id)}
            aria-label={tab.label}
          >
            <Icon size={19} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className={mobileNavOpen ? 'active' : ''}
        onClick={() => setMobileNavOpen(open => !open)}
        aria-label="Menu lainnya"
        aria-expanded={mobileNavOpen}
      >
        <Menu size={20} />
        <span>Lainnya</span>
      </button>
    </nav>
    </>
  );
};
