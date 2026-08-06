import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Stock() {
  const { user, can } = useAuth();
  const [stock, setStock]       = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(user?.branchId || '');
  const [search, setSearch]     = useState('');
  const [tab, setTab]           = useState('stock'); // stock | movements | transfer
  const [movements, setMovements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjForm, setAdjForm]   = useState({ productId:'', branchId:'', type:'in', quantity:'', note:'' });
  const [transferForm, setTFrm] = useState({ productId:'', fromBranchId:'', toBranchId:'', quantity:'', note:'' });
  const [products, setProducts] = useState([]);
  const [error, setError]       = useState('');

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (search) params.append('search', search);
      const res = await api.get(`/stock?${params}`);
      setStock(res.data);
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  }, [branchId, search]);

  const fetchMovements = useCallback(async () => {
    const params = new URLSearchParams({ limit: 100 });
    if (branchId) params.append('branchId', branchId);
    const res = await api.get(`/stock/movements?${params}`);
    setMovements(res.data.movements);
  }, [branchId]);

  useEffect(() => {
    api.get('/branches').then(r => setBranches(r.data));
    api.get('/products?limit=500').then(r => setProducts(r.data.products));
  }, []);
  useEffect(() => { if (tab === 'stock') fetchStock(); else if (tab === 'movements') fetchMovements(); }, [tab, fetchStock, fetchMovements]);

  const handleAdjust = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/stock/adjust', { ...adjForm, branchId: adjForm.branchId || branchId });
      setShowAdjust(false);
      fetchStock();
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/stock/transfer', transferForm);
      setTFrm({ productId:'', fromBranchId:'', toBranchId:'', quantity:'', note:'' });
      fetchStock();
      alert('Transfer successful');
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  const TYPE_COLOR = { in:'green', out:'red', sale:'red', purchase:'green', transfer_in:'blue', transfer_out:'orange', adjustment:'purple' };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🏪 Stock Management</h1>
        {can('superadmin','admin','warehouse') && (
          <button className="btn btn-primary" onClick={() => setShowAdjust(true)}>+ Adjust Stock</button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['stock','movements','transfer'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'stock' ? '📦 Current Stock' : t === 'movements' ? '📋 Movement History' : '🔄 Transfer'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input className="search-input" placeholder="🔍 Search product…" value={search} onChange={e => setSearch(e.target.value)} />
        {can('superadmin') && (
          <select className="select" value={branchId} onChange={e => setBranchId(e.target.value)}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Current Stock */}
      {tab === 'stock' && (
        <div className="card">
          <table className="table">
            <thead><tr><th>Product</th><th>SKU</th><th>Branch</th><th>Qty</th><th>Threshold</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="empty">Loading…</td></tr>
              : stock.length === 0 ? <tr><td colSpan="6" className="empty">No stock found.</td></tr>
              : stock.map(s => {
                const isLow = parseFloat(s.quantity) <= parseFloat(s.lowStockThreshold);
                return (
                  <tr key={s.id} className={isLow ? 'row-warning' : ''}>
                    <td><strong>{s.product?.name}</strong></td>
                    <td>{s.product?.sku}</td>
                    <td>{s.branch?.name || user?.branch?.name}</td>
                    <td><strong>{s.quantity} {s.product?.unit}</strong></td>
                    <td>{s.lowStockThreshold} {s.product?.unit}</td>
                    <td>{isLow ? <span className="badge badge-danger">⚠️ Low</span> : <span className="badge badge-success">✅ OK</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Movements */}
      {tab === 'movements' && (
        <div className="card">
          <table className="table">
            <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Before</th><th>After</th><th>Note</th></tr></thead>
            <tbody>
              {movements.length === 0 ? <tr><td colSpan="7" className="empty">No movements.</td></tr>
              : movements.map(m => (
                <tr key={m.id}>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                  <td>{m.product?.name}</td>
                  <td><span className={`badge badge-${TYPE_COLOR[m.type] || 'gray'}`}>{m.type}</span></td>
                  <td>{m.quantity}</td>
                  <td>{m.balanceBefore}</td>
                  <td>{m.balanceAfter}</td>
                  <td>{m.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transfer */}
      {tab === 'transfer' && can('superadmin','admin','warehouse') && (
        <div className="card" style={{ maxWidth: 540 }}>
          <h3 style={{ marginBottom: 16 }}>🔄 Transfer Stock Between Branches</h3>
          <form onSubmit={handleTransfer} className="form-grid">
            <div className="field field-full">
              <label>Product *</label>
              <select required value={transferForm.productId} onChange={e => setTFrm(p=>({...p,productId:e.target.value}))}>
                <option value="">— Select product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>From Branch *</label>
              <select required value={transferForm.fromBranchId} onChange={e => setTFrm(p=>({...p,fromBranchId:e.target.value}))}>
                <option value="">— Select —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>To Branch *</label>
              <select required value={transferForm.toBranchId} onChange={e => setTFrm(p=>({...p,toBranchId:e.target.value}))}>
                <option value="">— Select —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Quantity *</label>
              <input required type="number" min="0.001" step="0.001" value={transferForm.quantity} onChange={e => setTFrm(p=>({...p,quantity:e.target.value}))} />
            </div>
            <div className="field">
              <label>Note</label>
              <input value={transferForm.note} onChange={e => setTFrm(p=>({...p,note:e.target.value}))} placeholder="Optional note" />
            </div>
            <div className="field field-full">
              <button type="submit" className="btn btn-primary">Transfer Stock</button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="modal-overlay" onClick={() => setShowAdjust(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adjust Stock</h3>
              <button className="modal-close" onClick={() => setShowAdjust(false)}>✕</button>
            </div>
            <form onSubmit={handleAdjust} className="modal-body form-grid">
              <div className="field field-full">
                <label>Product *</label>
                <select required value={adjForm.productId} onChange={e => setAdjForm(p=>({...p,productId:e.target.value}))}>
                  <option value="">— Select product —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Type *</label>
                <select required value={adjForm.type} onChange={e => setAdjForm(p=>({...p,type:e.target.value}))}>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="adjustment">Set Exact Quantity</option>
                </select>
              </div>
              <div className="field">
                <label>Quantity *</label>
                <input required type="number" min="0.001" step="0.001" value={adjForm.quantity} onChange={e => setAdjForm(p=>({...p,quantity:e.target.value}))} />
              </div>
              <div className="field field-full">
                <label>Note</label>
                <input value={adjForm.note} onChange={e => setAdjForm(p=>({...p,note:e.target.value}))} placeholder="Reason for adjustment" />
              </div>
              <div className="modal-footer field-full">
                <button type="button" className="btn btn-outline" onClick={() => setShowAdjust(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
