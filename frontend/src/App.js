import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';

import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Products       from './pages/Products';
import Stock          from './pages/Stock';
import POS            from './pages/POS';
import PurchaseOrders from './pages/PurchaseOrders';
import Suppliers      from './pages/Suppliers';
import Reports        from './pages/Reports';
import Settings       from './pages/Settings';
import ITManagement   from './pages/ITManagement';
import Approvals      from './pages/Approvals';
import Expenses       from './pages/Expenses';
import ActivityLog    from './pages/ActivityLog';
import SalesHistory   from './pages/SalesHistory';
import './styles/App.css';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        {/* All roles can see products (cashier read-only enforced by backend) */}
        <Route path="products"  element={<Products />} />
        {/* Cashier blocked from stock/purchases/suppliers/reports */}
        <Route path="stock"     element={<ProtectedRoute roles={['owner','manager']}><Stock /></ProtectedRoute>} />
        <Route path="pos"       element={<POS />} />
        <Route path="purchases" element={<ProtectedRoute roles={['owner','manager']}><PurchaseOrders /></ProtectedRoute>} />
        <Route path="suppliers" element={<ProtectedRoute roles={['owner','manager']}><Suppliers /></ProtectedRoute>} />
        <Route path="reports"       element={<ProtectedRoute roles={['owner','manager']}><Reports /></ProtectedRoute>} />
        <Route path="sales-history" element={<ProtectedRoute roles={['owner','manager']}><SalesHistory /></ProtectedRoute>} />
        <Route path="settings"  element={<ProtectedRoute roles={['owner','manager']}><Settings /></ProtectedRoute>} />
        {/* Owner only */}
        <Route path="expenses"  element={<ProtectedRoute roles={['owner','manager']}><Expenses /></ProtectedRoute>} />
        <Route path="activity"  element={<ProtectedRoute roles={['owner','manager']}><ActivityLog /></ProtectedRoute>} />
        <Route path="approvals" element={<ProtectedRoute roles={['owner']}><Approvals /></ProtectedRoute>} />
        {/* IT */}
        <Route path="it"        element={<ProtectedRoute roles={['it']}><ITManagement /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
