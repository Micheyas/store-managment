import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

const PAY_ICON = { cash: '💵', card: '💳', mobile: '📱', credit: '📒', other: '💰' };

export default function Dashboard() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]       = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/stock/low-stock'),
    ]).then(([sRes, lRes]) => {
      setStats(sRes.data);
      setLowStock(lRes.data.slice(0, 6));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader">Loading dashboard…</div>;

  const isOwnerOrManager = can('owner', 'manager');

  const cards = [
    { label: "Today's Revenue",     value: `${Number(stats?.todayRevenue || 0).toLocaleString()} ETB`, icon: '💰', color: 'green' },
    { label: "Today's Sales",       value: stats?.todayCount || 0,      icon: '🛒', color: 'blue'   },
    { label: 'Total Products',      value: stats?.totalProducts || 0,   icon: '📦', color: 'purple', link: '/products' },
    { label: 'Low Stock Items',     value: stats?.lowStockCount || 0,   icon: '⚠️', color: 'orange', link: '/stock' },
    ...(isOwnerOrManager ? [
      { label: 'Pending Orders',    value: stats?.pendingOrders || 0,   icon: '🚚', color: 'purple', link: '/purchases' },
      { label: 'All-Time Sales',    value: stats?.totalSales || 0,      icon: '📈', color: 'blue',   link: '/sales-history' },
    ] : []),
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-sub">Welcome back, <strong>{user?.name}</strong> · {user?.branch?.name || 'All Branches'}</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-primary" onClick={() => navigate('/pos')}>🛒 Go to POS</button>
          {isOwnerOrManager && (
            <button className="btn btn-outline" onClick={() => navigate('/products')}>+ Add Product</button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {cards.map((c, i) => (
          <div key={i} className={`stat-card stat-card--${c.color}`}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-body">
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
            {c.link && <Link to={c.link} className="stat-link">View →</Link>}
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns: isOwnerOrManager ? '1fr 1fr' : '1fr', gap:16}}>

        {/* Today's payment breakdown */}
        {stats?.todayByMethod?.length > 0 && (
          <div className="card">
            <div className="card-header"><h3>💳 Today's Payment Methods</h3></div>
            <table className="table">
              <thead><tr><th>Method</th><th>Transactions</th><th>Amount</th></tr></thead>
              <tbody>
                {stats.todayByMethod.map(m => (
                  <tr key={m.paymentMethod}>
                    <td>{PAY_ICON[m.paymentMethod] || '💰'} <strong>{m.paymentMethod}</strong></td>
                    <td>{m.count}</td>
                    <td><strong>{Number(m.total).toLocaleString()} ETB</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent sales */}
        {isOwnerOrManager && stats?.recentSales?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>🕐 Recent Sales</h3>
              <Link to="/sales-history" className="btn btn-sm btn-outline">View All</Link>
            </div>
            <table className="table">
              <thead><tr><th>Invoice</th><th>Cashier</th><th>Amount</th><th>Time</th></tr></thead>
              <tbody>
                {stats.recentSales.map(s => (
                  <tr key={s.id}>
                    <td><code style={{fontSize:11}}>{s.invoiceNumber}</code></td>
                    <td>{s.cashier?.name || '—'}</td>
                    <td><strong>{Number(s.totalAmount).toLocaleString()} ETB</strong></td>
                    <td style={{fontSize:11,color:'#9ca3af'}}>{new Date(s.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="card mt-3">
          <div className="card-header">
            <h3>⚠️ Low Stock Alerts</h3>
            {isOwnerOrManager && <Link to="/stock" className="btn btn-sm btn-outline">Manage Stock</Link>}
          </div>
          <table className="table">
            <thead><tr><th>Product</th><th>Branch</th><th>Available</th><th>Threshold</th><th>Status</th></tr></thead>
            <tbody>
              {lowStock.map(s => (
                <tr key={s.id} className="row-warning">
                  <td><strong>{s.product?.name}</strong></td>
                  <td>{s.branch?.name}</td>
                  <td className="text-danger"><strong style={{color:'#ef4444'}}>{s.quantity} {s.product?.unit}</strong></td>
                  <td>{s.lowStockThreshold} {s.product?.unit}</td>
                  <td>
                    {parseFloat(s.quantity) === 0
                      ? <span className="badge badge-danger">Out of Stock</span>
                      : <span className="badge badge-orange">Low Stock</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
