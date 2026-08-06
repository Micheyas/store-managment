import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import api from '../api';

export default function Reports() {
  const [tab, setTab]           = useState('sales');
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo]     = useState(new Date().toISOString().split('T')[0]);
  const [salesData, setSalesData]       = useState([]);
  const [topProducts, setTopProducts]   = useState([]);
  const [profitLoss, setProfitLoss]     = useState(null);
  const [loading, setLoading]           = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ dateFrom, dateTo });
      const [salesRes, topRes, plRes] = await Promise.all([
        api.get(`/reports/sales?${params}`),
        api.get(`/reports/top-products?${params}&limit=10`),
        api.get(`/reports/profit-loss?${params}`),
      ]);
      setSalesData(salesRes.data.map(d => ({
        period: new Date(d.period).toLocaleDateString(),
        revenue: parseFloat(d.revenue),
        discount: parseFloat(d.discount),
        count: parseInt(d.count),
      })));
      setTopProducts(topRes.data);
      setProfitLoss(plRes.data);
    } catch (e) {
      console.error('Reports error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page">
      <h1 className="page-title">📈 Reports</h1>

      {/* Date range */}
      <div className="filter-bar">
        <div className="field-inline"><label>From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
        <div className="field-inline"><label>To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={fetchAll}>Apply</button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['sales','top-products','profit-loss'].map(t => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t === 'sales' ? '📊 Sales' : t === 'top-products' ? '🏆 Top Products' : '💹 Profit & Loss'}
          </button>
        ))}
      </div>

      {loading ? <div className="loader">Loading…</div> : (
        <>
          {/* Sales chart */}
          {tab === 'sales' && (
            <div className="card">
              <h3 className="card-title">📊 Daily Sales Revenue</h3>
              {salesData.length === 0 ? <p className="empty">No sales data for this period.</p> : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ETB`} />
                      <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} name="Revenue (ETB)" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <table className="table mt-3">
                    <thead><tr><th>Date</th><th>Sales Count</th><th>Revenue</th><th>Discount</th></tr></thead>
                    <tbody>
                      {salesData.map((d, i) => (
                        <tr key={i}>
                          <td>{d.period}</td>
                          <td>{d.count}</td>
                          <td>{Number(d.revenue).toLocaleString()} ETB</td>
                          <td>{Number(d.discount).toLocaleString()} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* Top Products */}
          {tab === 'top-products' && (
            <div className="card">
              <h3 className="card-title">🏆 Top Selling Products</h3>
              {topProducts.length === 0 ? <p className="empty">No data.</p> : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts.map(p => ({ name: p.product?.name, revenue: parseFloat(p.totalRevenue), qty: parseFloat(p.totalQty) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#6366f1" name="Revenue (ETB)" />
                    </BarChart>
                  </ResponsiveContainer>
                  <table className="table mt-3">
                    <thead><tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>Sales Count</th></tr></thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr key={i}>
                          <td>{i+1}</td>
                          <td><strong>{p.product?.name}</strong></td>
                          <td>{p.totalQty} {p.product?.unit}</td>
                          <td>{Number(p.totalRevenue).toLocaleString()} ETB</td>
                          <td>{p.saleCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* Profit & Loss */}
          {tab === 'profit-loss' && profitLoss && (
            <div className="card">
              <h3 className="card-title">💹 Profit & Loss Summary</h3>
              <div className="stat-grid">
                <div className="stat-card stat-card--blue">
                  <div className="stat-body">
                    <div className="stat-value">{Number(profitLoss.revenue).toLocaleString()} ETB</div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                </div>
                <div className="stat-card stat-card--orange">
                  <div className="stat-body">
                    <div className="stat-value">{Number(profitLoss.cost).toLocaleString()} ETB</div>
                    <div className="stat-label">Total Cost</div>
                  </div>
                </div>
                <div className="stat-card stat-card--green">
                  <div className="stat-body">
                    <div className="stat-value">{Number(profitLoss.grossProfit).toLocaleString()} ETB</div>
                    <div className="stat-label">Gross Profit</div>
                  </div>
                </div>
                <div className="stat-card stat-card--purple">
                  <div className="stat-body">
                    <div className="stat-value">{profitLoss.margin}%</div>
                    <div className="stat-label">Margin</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
