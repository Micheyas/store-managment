import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const STATUS_COLOR = { draft:'gray', sent:'blue', partially_received:'orange', received:'green', cancelled:'red' };
const BLANK_ORDER  = { supplierId:'', branchId:'', notes:'', expectedDate:'' };

export default function PurchaseOrders() {
  const { user, can } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches]   = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReceive, setShowReceive] = useState(null);
  const [form, setForm]           = useState(BLANK_ORDER);
  const [items, setItems]         = useState([{ productId:'', quantity:'', unitCost:'' }]);
  const [error, setError]         = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/purchases?limit=50');
    setOrders(res.data.orders);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    api.get('/suppliers').then(r => setSuppliers(r.data));
    api.get('/branches').then(r => setBranches(r.data));
    api.get('/products?limit=500').then(r => setProducts(r.data.products));
  }, [loadOrders]);

  const addItem  = () => setItems(i => [...i, { productId:'', quantity:'', unitCost:'' }]);
  const removeItem = (idx) => setItems(i => i.filter((_,j) => j !== idx));
  const updateItem = (idx, key, val) => setItems(i => i.map((item,j) => j === idx ? { ...item, [key]: val } : item));

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/purchases', {
        supplierId: form.supplierId, branchId: form.branchId || user.branchId,
        notes: form.notes, expectedDate: form.expectedDate,
        items: items.filter(i => i.productId).map(i => ({ productId:parseInt(i.productId), quantity:parseFloat(i.quantity), unitCost:parseFloat(i.unitCost) })),
      });
      setShowCreate(false);
      setForm(BLANK_ORDER);
      setItems([{ productId:'', quantity:'', unitCost:'' }]);
      loadOrders();
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  const handleUpdateStatus = async (id, status) => {
    await api.put(`/purchases/${id}/status`, { status });
    loadOrders();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🚚 Purchase Orders</h1>
        {can('superadmin','admin','warehouse') && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Order</button>
        )}
      </div>

      {loading ? <div className="loader">Loading…</div> : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Order #</th><th>Supplier</th><th>Branch</th><th>Total</th><th>Status</th><th>Expected</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.length === 0 ? <tr><td colSpan="7" className="empty">No purchase orders.</td></tr>
              : orders.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.orderNumber}</strong></td>
                  <td>{o.supplier?.name}</td>
                  <td>{o.branch?.name}</td>
                  <td>{Number(o.totalAmount).toLocaleString()} ETB</td>
                  <td><span className={`badge badge-${STATUS_COLOR[o.status]}`}>{o.status.replace('_',' ')}</span></td>
                  <td>{o.expectedDate || '—'}</td>
                  <td>
                    {o.status === 'draft' && <button className="btn btn-sm btn-outline" onClick={() => handleUpdateStatus(o.id,'sent')}>📤 Send</button>}
                    {['sent','partially_received'].includes(o.status) && (
                      <button className="btn btn-sm btn-primary ml-1" onClick={() => setShowReceive(o)}>📥 Receive</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Purchase Order</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-body">
              <div className="form-grid">
                <div className="field">
                  <label>Supplier *</label>
                  <select required value={form.supplierId} onChange={e => setForm(p=>({...p,supplierId:e.target.value}))}>
                    <option value="">— Select —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Branch</label>
                  <select value={form.branchId} onChange={e => setForm(p=>({...p,branchId:e.target.value}))}>
                    <option value="">— Default —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Expected Date</label>
                  <input type="date" value={form.expectedDate} onChange={e => setForm(p=>({...p,expectedDate:e.target.value}))} />
                </div>
                <div className="field field-full">
                  <label>Notes</label>
                  <input value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} />
                </div>
              </div>

              <h4 className="mt-3">Order Items</h4>
              <table className="table">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Cost (ETB)</th><th>Subtotal</th><th></th></tr></thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <select value={item.productId} onChange={e => updateItem(idx,'productId',e.target.value)} style={{width:'100%'}}>
                          <option value="">— Select product —</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td><input type="number" min="0.001" step="0.001" value={item.quantity} onChange={e => updateItem(idx,'quantity',e.target.value)} style={{width:80}} /></td>
                      <td><input type="number" min="0" step="0.01" value={item.unitCost} onChange={e => updateItem(idx,'unitCost',e.target.value)} style={{width:100}} /></td>
                      <td>{(parseFloat(item.quantity||0) * parseFloat(item.unitCost||0)).toFixed(2)}</td>
                      <td><button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(idx)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn btn-sm btn-outline mt-1" onClick={addItem}>+ Add Item</button>
              {error && <div className="alert alert-error mt-2">{error}</div>}
              <div className="modal-footer mt-3">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceive && (
        <ReceiveModal order={showReceive} onClose={() => { setShowReceive(null); loadOrders(); }} />
      )}
    </div>
  );
}

function ReceiveModal({ order, onClose }) {
  const [received, setReceived] = useState(
    order.items?.map(i => ({ purchaseItemId: i.id, receivedQty: '', product: i.product, ordered: i.quantity, unitCost: i.unitCost })) || []
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post(`/purchases/${order.id}/receive`, {
        receivedItems: received.filter(r => r.receivedQty > 0).map(r => ({ purchaseItemId: r.purchaseItemId, receivedQty: parseFloat(r.receivedQty) })),
      });
      onClose();
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📥 Receive Items — {order.orderNumber}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <table className="table">
            <thead><tr><th>Product</th><th>Ordered</th><th>Receiving Now</th></tr></thead>
            <tbody>
              {received.map((r, idx) => (
                <tr key={r.purchaseItemId}>
                  <td>{r.product?.name}</td>
                  <td>{r.ordered}</td>
                  <td><input type="number" min="0" step="0.001" max={r.ordered} value={r.receivedQty} onChange={e => setReceived(prev => prev.map((p,i) => i===idx ? {...p,receivedQty:e.target.value} : p))} style={{width:90}} placeholder="0" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {error && <div className="alert alert-error mt-2">{error}</div>}
          <div className="modal-footer mt-3">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm Receipt & Update Stock</button>
          </div>
        </form>
      </div>
    </div>
  );
}
