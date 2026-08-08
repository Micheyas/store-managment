import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

const NAV = [
  { to: '/',          icon: '📊', label: 'Dashboard',       roles: ['owner','manager','cashier','it'] },
  { to: '/pos',       icon: '🛒', label: 'POS / Sales',     roles: ['owner','manager','cashier'] },
  { to: '/products',  icon: '📦', label: 'Products',        roles: ['owner','manager','cashier','it'] },
  { to: '/stock',     icon: '🏪', label: 'Stock',           roles: ['owner','manager'] },
  { to: '/purchases', icon: '🚚', label: 'Purchase Orders', roles: ['owner','manager'] },
  { to: '/suppliers', icon: '🤝', label: 'Suppliers',       roles: ['owner','manager'] },
  { to: '/reports',        icon: '📈', label: 'Reports',         roles: ['owner','manager'] },
  { to: '/sales-history',  icon: '🧾', label: 'Sales History',    roles: ['owner','manager'] },
  { to: '/expenses',  icon: '💸', label: 'Expenses',        roles: ['owner','manager'] },
  { to: '/activity',  icon: '📋', label: 'Activity Log',    roles: ['owner','manager'] },
  { to: '/settings',  icon: '⚙️',  label: 'Settings',       roles: ['owner','manager'] },
  { to: '/it',        icon: '🖥️',  label: 'IT Management',  roles: ['it'] },
  { to: '/approvals', icon: '✅',  label: 'Approvals',      roles: ['owner'], badge: true },
];

const ROLE_LABEL = { owner: '👑 Owner', manager: '🔧 Manager', cashier: '🛒 Cashier', it: '🖥️ IT' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'owner') {
      const load = () => api.get('/approvals/count').then(r => setPendingCount(r.data.count)).catch(() => {});
      load();
      const t = setInterval(load, 30000);
      return () => clearInterval(t);
    }
  }, [user]);

  const visibleNav = NAV.filter(n => n.roles.includes(user?.role));
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">🏪</span>
          {sidebarOpen && <span className="sidebar-title">StoreMS</span>}
        </div>
        <nav className="sidebar-nav">
          {visibleNav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span>
              {sidebarOpen && <span className="nav-label">{n.label}</span>}
              {n.badge && pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{ROLE_LABEL[user?.role] || user?.role}{user?.branch ? ` · ${user.branch.name}` : ''}</div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">↪</button>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(s => !s)}>☰</button>
          <div className="topbar-right">
            {user?.role === 'owner' && pendingCount > 0 && (
              <NavLink to="/approvals" className="topbar-badge">
                ✅ {pendingCount} pending approval{pendingCount > 1 ? 's' : ''}
              </NavLink>
            )}
            <span className="topbar-user">👤 {user?.name} <small>({ROLE_LABEL[user?.role] || user?.role})</small></span>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
