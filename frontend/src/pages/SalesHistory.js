import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';

const PAY_ICON  = { cash:'💵', card:'💳', mobile:'📱', credit:'📒', other:'💰' };
const STATUS_COLOR = { completed:'#22c55e', voided:'#ef4444', refunded:'#f59e0b' };

export default function SalesHistory() {
  const [sales, setSales]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // sale detail modal
  const [error, setError]     = useState('');

  // Filters
  const [dateFrom, setDateFrom] = useState(new Date(Date.now()-7*24*60*60*1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo]     = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch]     = useState('');
  const [payFilter, setPayFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, limit: 20, dateFrom, dateTo });
      if (search)    params.append('search', search);
      if (payFilter) params.append('paymentMethod', payFilter);
      const r = await api.get(`/sales?${params}`);
      setSales(r.data.sales);
      setTotal(r.data.total);
    } catch(e) { setError(e.response?.data?.error || 'Failed to load sales'); }
    finally { setLoading(false); }
  }, [page, dateFrom, dateTo, search, payFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const r = await api.get(`/sales/${id}`);
      setSelected(r.data);
    } catch(e) { alert('Could not load sale details'); }
  };

  const totalPages = Math.ceil(total / 20) || 1;

  // Summary totals for current filter
  const totalRevenue = sales.reduce((s, x) => s + parseFloat(x.totalAmount), 0);

  return (
    <div className="page">
      <h1 className="page-title">📋 Sales History</h1>

      {/* Filters */}
      <div className="filter-bar">
        <div className="field-inline"><label>From</label>
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}} />
        </div>
        <div className="field-inline"><label>To</label>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1);}} />
        </div>
        <input className="search-input" style={{maxWidth:200}} placeholder="🔍 Invoice #…" value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}} />
        <select className="select" value={payFilter} onChange={e=>{setPayFilter(e.target.value);setPage(1);}}>
          <option value="">All Methods</option>
          {['cash','card','mobile','credit','other'].map(m=><option key={m} value={m}>{PAY_ICON[m]} {m}</option>)}
        </select>
        <button className="btn btn-primary" onClick={()=>{setPage(1);load();}}>Apply</button>
      </div>

      {/* Summary */}
      <div className="stat-grid" style={{marginBottom:16}}>
        <div className="stat-card stat-card--blue">
          <div className="stat-icon">📋</div>
          <div className="stat-body"><div className="stat-value">{total}</div><div className="stat-label">Total Transactions</div></div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-icon">💰</div>
          <div className="stat-body"><div className="stat-value">{Number(totalRevenue).toLocaleString()} ETB</div><div className="stat-label">Revenue (this page)</div></div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loader">Loading…</div> : (
        <div className="card">
          <table className="table">
            <thead>
              <tr><th>Invoice</th><th>Date & Time</th><th>Cashier</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {sales.length === 0
                ? <tr><td colSpan="8" className="empty">No sales found for this period.</td></tr>
                : sales.map(s => (
                  <tr key={s.id}>
                    <td><code style={{fontSize:11}}>{s.invoiceNumber}</code></td>
                    <td style={{fontSize:12}}>{new Date(s.createdAt).toLocaleString()}</td>
                    <td>{s.cashier?.name || '—'}</td>
                    <td>{s.items?.length || '—'}</td>
                    <td><strong>{Number(s.totalAmount).toLocaleString()} ETB</strong></td>
                    <td>{PAY_ICON[s.paymentMethod]} {s.paymentMethod}</td>
                    <td>
                      <span className="badge" style={{background:STATUS_COLOR[s.status]||'#9ca3af',color:'#fff'}}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={()=>openDetail(s.id)}>
                        🔍 View
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {total > 20 && (
            <div className="pagination">
              <button className="btn btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button className="btn btn-sm" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Sale Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>🧾 Sale — {selected.invoiceNumber}</h3>
              <button className="modal-close" onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16,fontSize:13}}>
                <div><span style={{color:'#9ca3af'}}>Date:</span> {new Date(selected.createdAt).toLocaleString()}</div>
                <div><span style={{color:'#9ca3af'}}>Cashier:</span> {selected.cashier?.name}</div>
                <div><span style={{color:'#9ca3af'}}>Branch:</span> {selected.branch?.name}</div>
                <div><span style={{color:'#9ca3af'}}>Payment:</span> {PAY_ICON[selected.paymentMethod]} {selected.paymentMethod}</div>
                <div><span style={{color:'#9ca3af'}}>Status:</span>
                  <span className="badge ml-1" style={{background:STATUS_COLOR[selected.status]||'#9ca3af',color:'#fff'}}>{selected.status}</span>
                </div>
              </div>

              <table className="table">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {selected.items?.map(item => (
                    <tr key={item.id}>
                      <td>{item.product?.name}</td>
                      <td>{item.quantity} {item.product?.unit}</td>
                      <td>{Number(item.unitPrice).toLocaleString()} ETB</td>
                      <td><strong>{Number(item.subtotal).toLocaleString()} ETB</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan="3" style={{textAlign:'right',fontWeight:600}}>Subtotal</td><td>{Number(selected.subtotal).toLocaleString()} ETB</td></tr>
                  {parseFloat(selected.discount)>0 && <tr><td colSpan="3" style={{textAlign:'right'}}>Discount</td><td>-{Number(selected.discount).toLocaleString()} ETB</td></tr>}
                  {parseFloat(selected.tax)>0 && <tr><td colSpan="3" style={{textAlign:'right'}}>Tax</td><td>{Number(selected.tax).toLocaleString()} ETB</td></tr>}
                  <tr style={{fontWeight:700,fontSize:16}}><td colSpan="3" style={{textAlign:'right'}}>TOTAL</td><td>{Number(selected.totalAmount).toLocaleString()} ETB</td></tr>
                  <tr><td colSpan="3" style={{textAlign:'right',color:'#9ca3af'}}>Amount Paid</td><td>{Number(selected.amountPaid).toLocaleString()} ETB</td></tr>
                  {parseFloat(selected.change)>0 && <tr><td colSpan="3" style={{textAlign:'right',color:'#9ca3af'}}>Change</td><td>{Number(selected.change).toLocaleString()} ETB</td></tr>}
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
