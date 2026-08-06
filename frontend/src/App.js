import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';

import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import Products      from './pages/Products';
import Stock         from './pages/Stock';
import POS           from './pages/POS';
import PurchaseOrders from './pages/PurchaseOrders';
import Suppliers     from './pages/Suppliers';
import Reports       from './pages/Reports';
import Settings      from './pages/Settings';
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
        <Route path="products"  element={<ProtectedRoute roles={['superadmin','admin','warehouse','cashier']}><Products /></ProtectedRoute>} />
        <Route path="stock"     element={<ProtectedRoute roles={['superadmin','admin','warehouse']}><Stock /></ProtectedRoute>} />
        <Route path="pos"       element={<POS />} />
        <Route path="purchases" element={<ProtectedRoute roles={['superadmin','admin','warehouse']}><PurchaseOrders /></ProtectedRoute>} />
        <Route path="suppliers" element={<ProtectedRoute roles={['superadmin','admin']}><Suppliers /></ProtectedRoute>} />
        <Route path="reports"   element={<ProtectedRoute roles={['superadmin','admin']}><Reports /></ProtectedRoute>} />
        <Route path="settings"  element={<ProtectedRoute roles={['superadmin','admin']}><Settings /></ProtectedRoute>} />
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
