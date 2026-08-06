import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/stock/low-stock'),
    ]).then(([sRes, lRes]) => {
      setStats(sRes.data);
      setLowStock(lRes.data.slice(0, 8));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader">Loading dashboard…</div>;

  const cards = [
    { label: "Today's Revenue", value: `${Number(stats?.todayRevenue || 0).toLocaleString()} ETB`, icon: '💰', color: 'green' },
    { label: 'Total Sales',     value: stats?.totalSales || 0,        icon: '🛒', color: 'blue'  },
    { label: 'Low Stock Items', value: stats?.lowStockCount || 0,     icon: '⚠️', color: 'orange', link: '/stock' },
    { label: 'Pending Orders',  value: stats?.pendingOrders || 0,     icon: '🚚', color: 'purple', link: '/purchases' },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Welcome back, {user?.name} · {user?.branch?.name || 'All Branches'}</p>

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

      {/* Low stock table */}
      {lowStock.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h3>⚠️ Low Stock Alerts</h3>
            <Link to="/stock" className="btn btn-sm btn-outline">View All</Link>
          </div>
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Branch</th><th>Available</th><th>Threshold</th></tr>
            </thead>
            <tbody>
              {lowStock.map(s => (
                <tr key={s.id} className="row-warning">
                  <td>{s.product?.name}</td>
                  <td>{s.branch?.name}</td>
                  <td className="text-danger"><strong>{s.quantity} {s.product?.unit}</strong></td>
                  <td>{s.lowStockThreshold} {s.product?.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
