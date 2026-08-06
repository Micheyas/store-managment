import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const NAV = [
  { to: '/',          icon: '📊', label: 'Dashboard',        roles: ['superadmin','admin','warehouse','cashier'] },
  { to: '/pos',       icon: '🛒', label: 'POS / Sales',      roles: ['superadmin','admin','cashier'] },
  { to: '/products',  icon: '📦', label: 'Products',         roles: ['superadmin','admin','warehouse','cashier'] },
  { to: '/stock',     icon: '🏪', label: 'Stock',            roles: ['superadmin','admin','warehouse'] },
  { to: '/purchases', icon: '🚚', label: 'Purchase Orders',  roles: ['superadmin','admin','warehouse'] },
  { to: '/suppliers', icon: '🤝', label: 'Suppliers',        roles: ['superadmin','admin'] },
  { to: '/reports',   icon: '📈', label: 'Reports',          roles: ['superadmin','admin'] },
  { to: '/settings',  icon: '⚙️',  label: 'Settings',        roles: ['superadmin','admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const visibleNav = NAV.filter(n => n.roles.includes(user?.role));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
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
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role} {user?.branch ? `· ${user.branch.name}` : ''}</div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">↪</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrap">
        <header className="topbar">
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(s => !s)}>☰</button>
          <div className="topbar-right">
            <span className="topbar-user">👤 {user?.name}</span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
