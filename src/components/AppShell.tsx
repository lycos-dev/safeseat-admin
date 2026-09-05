import { Activity, Bell, CarFront, FileWarning, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, UserRoundCog, Users, X } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Brand } from './Brand';
import { runtimeConfig } from '../config/runtime';
import { useStore } from '../data/store';
import { useAuth } from '../auth/AuthProvider';

const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/fleet', label: 'Fleet & Seats', icon: CarFront },
  { to: '/accounts', label: 'Accounts', icon: Users },
  { to: '/incidents', label: 'Incident Logs', icon: FileWarning },
  { to: '/health', label: 'System Health', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings }
];

const titles: Record<string, [string, string]> = {
  '/': ['Overview Dashboard', 'Fleet monitoring and safety-event awareness'],
  '/fleet': ['Fleet & Seat Management', 'Vehicle, SafeSeat unit, seat, and occupant relationships'],
  '/accounts': ['Account Management', 'Administrative access, roles, and consent visibility'],
  '/incidents': ['Incident Logs', 'Traceable safety-event history and administrator resolution'],
  '/health': ['System Health Monitor', 'Privacy-minimized hardware connectivity and diagnostic status'],
  '/settings': ['Admin Settings', 'Dashboard preferences and data-source controls']
};

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { state, syncStatus } = useStore();
  const { identity, signOut } = useAuth();
  const unresolved = state.incidents.filter(i => i.status === 'ESCALATED').length;
  const [title, subtitle] = titles[location.pathname] ?? titles['/'];

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const sourceLabel = runtimeConfig.dataMode === 'demo'
    ? 'Demo mode'
    : syncStatus === 'live' ? 'Firebase live' : syncStatus === 'error' ? 'Sync issue' : 'Connecting';

  return (
    <div className={`app-shell ${state.settings.compactDensity ? 'app-shell--compact' : ''}`}>
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top">
          <Brand />
          <button className="sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <div className="sidebar__section-label">CONTROL CENTER</div>
        <nav className="sidebar__nav">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
                <Icon size={19} /><span>{item.label}</span>
                {item.to === '/incidents' && unresolved > 0 && <span className="nav-count">{unresolved}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar__privacy">
          <ShieldCheck size={19} />
          <div><strong>Privacy-minimized admin</strong><span>Derived states • event-based verification</span></div>
        </div>
        <button className="sidebar__signout" onClick={handleSignOut}><LogOut size={18} />Sign out</button>
      </aside>
      {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <div className="topbar__left">
            <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
            <div><h1>{title}</h1><p>{subtitle}</p></div>
          </div>
          <div className="topbar__right">
            <span className={`mode-pill ${runtimeConfig.dataMode === 'firebase' && syncStatus === 'error' ? 'mode-pill--error' : ''}`}><span className="pulse-dot" />{sourceLabel}</span>
            <button className="icon-button topbar__bell" aria-label="Notifications"><Bell size={20} />{unresolved > 0 && <span className="notification-dot" />}</button>
            <div className="admin-chip"><div className="admin-chip__avatar"><UserRoundCog size={17} /></div><div><strong>{identity?.name ?? 'SafeSeat Admin'}</strong><span>{identity?.role ?? 'Fleet Administrator'}</span></div></div>
          </div>
        </header>
        <div className="page"><Outlet /></div>
      </main>
    </div>
  );
}
