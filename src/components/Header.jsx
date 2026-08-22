import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [profilePopoverStyle, setProfilePopoverStyle] = useState({});
  const profileButtonRef = useRef(null);

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

  useEffect(() => {
    setMobileNavOpen(false);
    setProfileOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const updateProfilePosition = () => {
      const anchor = profileButtonRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const gutter = 10;
      const width = Math.min(320, window.innerWidth - (gutter * 2));
      const left = Math.max(gutter, Math.min(anchor.right - width, window.innerWidth - width - gutter));
      const top = Math.max(gutter, anchor.bottom + 10);
      setProfilePopoverStyle({
        width: `${width}px`,
        left: `${left}px`,
        top: `${top}px`,
        maxHeight: `calc(var(--selasar-mobile-viewport-height, 100dvh) - ${top + gutter}px)`
      });
    };

    const closeOnEscape = (event) => event.key === 'Escape' && setProfileOpen(false);
    updateProfilePosition();
    window.addEventListener('resize', updateProfilePosition);
    window.addEventListener('scroll', updateProfilePosition, true);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', updateProfilePosition);
      window.removeEventListener('scroll', updateProfilePosition, true);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;

    const syncMobileViewport = () => {
      const viewportHeight = visualViewport?.height || window.innerHeight;
      const viewportTop = visualViewport?.offsetTop || 0;

      root.style.setProperty('--selasar-mobile-viewport-height', `${Math.round(viewportHeight)}px`);
      root.style.setProperty('--selasar-mobile-viewport-top', `${Math.round(viewportTop)}px`);
    };

    document.body.classList.toggle('mobile-workspace-open', mobileNavOpen);

    if (!mobileNavOpen) {
      root.style.removeProperty('--selasar-mobile-viewport-height');
      root.style.removeProperty('--selasar-mobile-viewport-top');
      return undefined;
    }

    syncMobileViewport();
    visualViewport?.addEventListener('resize', syncMobileViewport);
    visualViewport?.addEventListener('scroll', syncMobileViewport);
    window.addEventListener('resize', syncMobileViewport);
    window.addEventListener('orientationchange', syncMobileViewport);

    return () => {
      document.body.classList.remove('mobile-workspace-open');
      root.style.removeProperty('--selasar-mobile-viewport-height');
      root.style.removeProperty('--selasar-mobile-viewport-top');
      visualViewport?.removeEventListener('resize', syncMobileViewport);
      visualViewport?.removeEventListener('scroll', syncMobileViewport);
      window.removeEventListener('resize', syncMobileViewport);
      window.removeEventListener('orientationchange', syncMobileViewport);
    };
  }, [mobileNavOpen]);

  const handleTabClick = (tabId) => {
    sounds.playBeep();
    setActiveTab(tabId);
    setMobileNavOpen(false);
  };

  const isOwner = currentUserRole === 'owner';

  // Navigation tabs configuration
  const allTabs = [
    { id: 'pos', label: 'Kasir', icon: ShoppingCart, group: 'Transaksi', ownerOnly: false },
    { id: 'kds', label: 'Dapur', icon: ChefHat, group: 'Transaksi', ownerOnly: false },
    { id: 'tables', label: 'Meja', icon: LayoutGrid, group: 'Transaksi', ownerOnly: false },
    { id: 'shift', label: 'Shift', icon: Clock, group: 'Operasional', ownerOnly: false },
    { id: 'menu_manager', label: 'Produk', icon: Package, group: 'Operasional', ownerOnly: true },
    { id: 'inventory', label: 'Stok', icon: Package, group: 'Operasional', ownerOnly: true },
    { id: 'loyalty', label: 'Member', icon: Users, group: 'Pelanggan & data', ownerOnly: false },
    { id: 'reports', label: 'Laporan', icon: BarChart3, group: 'Keuangan', ownerOnly: true },
    { id: 'settings', label: 'Pengaturan', icon: Settings, group: 'Perangkat & sistem', ownerOnly: true }
  ];

  const visibleTabs = allTabs.filter(t => !t.ownerOnly || isOwner);
  const groupOrder = ['Transaksi', 'Operasional', 'Pelanggan & data', 'Keuangan', 'Perangkat & sistem'];
  const navigationGroups = groupOrder
    .map(label => ({ label, tabs: visibleTabs.filter(tab => tab.group === label) }))
    .filter(group => group.tabs.length);

  const primaryIds = isOwner ? ['pos', 'kds', 'tables', 'reports'] : ['pos', 'kds', 'tables', 'loyalty'];
  const primaryMobileTabs = primaryIds.map(id => visibleTabs.find(tab => tab.id === id)).filter(Boolean);
  const secondaryActiveTab = visibleTabs.find(tab => !primaryMobileTabs.some(primary => primary.id === tab.id) && tab.id === activeTab);
  const moreIsActive = mobileNavOpen || Boolean(secondaryActiveTab);
  const activeTabInfo = visibleTabs.find(tab => tab.id === activeTab)
    || (activeTab === 'receipt_settings' ? { group: 'Perangkat & sistem', label: 'Editor struk' } : visibleTabs[0]);

  return (
    <>
    <header className="selasar-header">
      <button type="button" className="mobile-selasar-brand" onClick={() => handleTabClick('pos')} aria-label="Buka kasir Selasar">
        <img src="/selasar-chunky-logo-v2.png?v=20260822-2" alt="Selasar" />
      </button>
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
        <div className="header-page-context">
          <span>{activeTabInfo?.group || 'Workspace'}</span>
          <strong>{activeTabInfo?.label || 'Kasir'}</strong>
        </div>
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
          className={`header-printer-pill ${btConnected ? 'connected' : 'disconnected'}`}
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
          <button ref={profileButtonRef} type="button" className="user-role-badge" onClick={() => setProfileOpen(open => !open)} title="Buka profil akun" aria-expanded={profileOpen}>
            {authenticatedUser?.avatarUrl && !profileImageFailed
              ? <img src={authenticatedUser.avatarUrl} alt="Profil pengguna" onError={() => setProfileImageFailed(true)} />
              : <User size={15} />}
            <span className="profile-name">{authenticatedUser?.name || (isOwner ? 'Owner' : 'Kasir')}</span>
            <small>{isOwner ? 'Owner' : 'Kasir'}</small>
          </button>
          {profileOpen && createPortal(
            <div className="user-profile-layer">
              <button type="button" className="user-profile-dismiss" onClick={() => setProfileOpen(false)} aria-label="Tutup profil akun" />
              <div className="user-profile-popover user-profile-popover-portal" style={profilePopoverStyle} role="dialog" aria-label="Profil akun">
              <div className="user-profile-heading">
                {authenticatedUser?.avatarUrl && !profileImageFailed
                  ? <img src={authenticatedUser.avatarUrl} alt="Profil pengguna" onError={() => setProfileImageFailed(true)} />
                  : <div className="user-profile-avatar"><User size={21} /></div>}
                <div><strong>{authenticatedUser?.name || 'Pengguna'}</strong><span>{authenticatedUser?.email || 'Email tidak tersedia'}</span></div>
              </div>
              <div className="user-profile-meta"><span>Role aktif</span><b>{isOwner ? 'Owner' : 'Pegawai / Kasir'}</b></div>
              <div className="user-profile-meta"><span>ID akun</span><b title={authenticatedUser?.id}>{authenticatedUser?.id ? `${authenticatedUser.id.slice(0, 8)}…` : '-'}</b></div>
              <div className="user-profile-meta"><span>ID toko</span><b title={activeOrganizationId}>{activeOrganizationId ? `${activeOrganizationId.slice(0, 8)}…` : '-'}</b></div>
              <button type="button" className="user-logout-btn" onClick={onLogout}><LogOut size={15} /> Keluar dari akun</button>
              </div>
            </div>
          , document.body)}
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

    <aside className="desktop-workspace-sidebar" aria-label="Navigasi workspace">
      <div className="sidebar-brand-lockup" aria-label="Selasar">
        <img src="/selasar-chunky-logo-v2.png?v=20260822-2" alt="Selasar" />
      </div>
      <div className="desktop-sidebar-scroll">
        {navigationGroups.map(group => <section className="desktop-nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return <button key={tab.id} type="button" className={isActive ? 'active' : ''} onClick={() => handleTabClick(tab.id)} aria-label={tab.label} aria-current={isActive ? 'page' : undefined}>
              <span><Icon size={18} /></span><b>{tab.label}</b>
            </button>;
          })}
        </section>)}
      </div>
      <div className="desktop-sidebar-footer"><button type="button" onClick={onOpenBluetoothModal} title="Printer Bluetooth"><Bluetooth size={18} /></button><button type="button" onClick={toggleTheme} title="Ganti tema"><Palette size={18} /></button></div>
    </aside>

    {mobileNavOpen && <div className="mobile-workspace-overlay" onMouseDown={event => event.target === event.currentTarget && setMobileNavOpen(false)}>
      <nav className="mobile-workspace-sheet" aria-label="Menu workspace">
        <div className="mobile-sheet-handle" />
        <div className="nav-sheet-heading">
          <img className="mobile-drawer-logo" src="/selasar-chunky-logo-v2.png?v=20260822-2" alt="Selasar" />
          <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="mobile-sheet-groups">
          {navigationGroups.map(group => <section className="nav-group" key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            <div className="nav-group-items">{group.tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return <button key={tab.id} type="button" className={`nav-btn ${isActive ? 'active' : ''}`} onClick={() => handleTabClick(tab.id)} aria-label={tab.label} aria-current={isActive ? 'page' : undefined}>
                <span className="nav-icon"><Icon size={17} /></span><span>{tab.label}</span>
              </button>;
            })}</div>
          </section>)}
          <section className="nav-group nav-utility-group">
            <p className="nav-group-label">Akun & perangkat</p>
            <div className="nav-group-items">
              <button type="button" className="mobile-only-nav-action" onClick={() => { onOpenBluetoothModal?.(); setMobileNavOpen(false); }}><span className="nav-icon"><Bluetooth size={16} /></span><span>Printer Bluetooth</span></button>
              <button type="button" className="mobile-only-nav-action mobile-logout-nav" onClick={onLogout}><span className="nav-icon"><LogOut size={16} /></span><span>Keluar akun</span></button>
            </div>
          </section>
        </div>
      </nav>
    </div>}

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
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <Icon size={19} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className={moreIsActive ? 'active' : ''}
        onClick={() => setMobileNavOpen(true)}
        aria-label={secondaryActiveTab ? `Menu lainnya, halaman aktif ${secondaryActiveTab.label}` : 'Menu lainnya'}
        aria-expanded={mobileNavOpen}
        aria-current={secondaryActiveTab ? 'page' : undefined}
      >
        <Menu size={20} />
        <span>{secondaryActiveTab?.label || 'Lainnya'}</span>
      </button>
    </nav>
    </>
  );
};
