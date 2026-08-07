import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const CATEGORIES = ['rent','salary','utilities','supplies','maintenance','marketing','other'];
const BLANK = { title:'', amount:'', category:'other', paymentMethod:'cash', note:'', expenseDate: new Date().toISOString().split('T')[0], branchId:'' };

export default function Expenses() {
  const { can } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [branches, setBranches] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(BLANK);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState('list');

  // Filters
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo]     = useState(new Date().toISOString().split('T')[0]);
  const [catFilter, setCatFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (catFilter) params.append('category', catFilter);
      const [expRes, sumRes] = await Promise.all([
        api.get(`/expenses?${params}`),
        can('owner') ? api.get(`/expenses/summary?${params}`) : Promise.resolve({ data: null }),
      ]);
      setExpenses(expRes.data.expenses);
      setTotal(expRes.data.total);
      setSummary(sumRes.data);
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, catFilter, can]);

  useEffect(() => {
    api.get('/branches').then(r => setBranches(r.data));
    load();
  }, [load]);

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowModal(true); setError(''); };
  const openEdit   = (e) => { setEditing(e); setForm({ title:e.title, amount:e.amount, category:e.category, paymentMethod:e.paymentMethod, note:e.note||'', expenseDate:e.expenseDate, branchId:e.branchId||'' }); setShowModal(true); setError(''); };

  const handleSave = async (ev) => {
    ev.preventDefault(); setError('');
    try {
      if (editing) await api.put(`/expenses/${editing.id}`, form);
      else         await api.post('/expenses', form);
      setShowModal(false);
      load();
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    load();
  };

  const CAT_COLOR = { rent:'#6366f1', salary:'#f59e0b', utilities:'#3b82f6', supplies:'#22c55e', maintenance:'#f97316', marketing:'#ec4899', other:'#9ca3af' };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">💸 Expenses</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Expense</button>
      </div>

      {/* Date filters */}
      <div className="filter-bar">
        <div className="field-inline"><label>From</label><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /></div>
        <div className="field-inline"><label>To</label><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} /></div>
        <select className="select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary" onClick={load}>Apply</button>
      </div>

      {/* Summary cards (owner only) */}
      {can('owner') && summary && (
        <div className="stat-grid mb-3">
          <div className="stat-card stat-card--orange">
            <div className="stat-icon">💸</div>
            <div className="stat-body">
              <div className="stat-value">{Number(summary.total).toLocaleString()} ETB</div>
              <div className="stat-label">Total Expenses</div>
            </div>
          </div>
          {Object.entries(summary.byCategory).map(([cat, amt]) => (
            <div key={cat} className="stat-card" style={{borderLeft:`4px solid ${CAT_COLOR[cat]||'#9ca3af'}`}}>
              <div className="stat-body">
                <div className="stat-value">{Number(amt).toLocaleString()} ETB</div>
                <div className="stat-label" style={{textTransform:'capitalize'}}>{cat}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loader">Loading…</div> : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Payment</th><th>Branch</th><th>Note</th><th>Actions</th></tr></thead>
            <tbody>
              {expenses.length === 0 ? <tr><td colSpan="8" className="empty">No expenses found.</td></tr>
              : expenses.map(e => (
                <tr key={e.id}>
                  <td>{e.expenseDate}</td>
                  <td><strong>{e.title}</strong></td>
                  <td><span className="badge" style={{background:CAT_COLOR[e.category]||'#9ca3af',color:'#fff'}}>{e.category}</span></td>
                  <td><strong>{Number(e.amount).toLocaleString()} ETB</strong></td>
                  <td>{e.paymentMethod}</td>
                  <td>{e.branch?.name||'—'}</td>
                  <td>{e.note||'—'}</td>
                  <td style={{display:'flex',gap:4}}>
                    <button className="btn btn-sm btn-outline" onClick={()=>openEdit(e)}>✏️</button>
                    {can('owner') && <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(e.id)}>🗑️</button>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{fontWeight:'bold',background:'#f9fafb'}}>
                <td colSpan="3">Total ({total} records)</td>
                <td>{Number(expenses.reduce((s,e)=>s+parseFloat(e.amount),0)).toLocaleString()} ETB</td>
                <td colSpan="4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Expense' : '+ Add Expense'}</h3>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              {error && <div className="alert alert-error mb-2">{error}</div>}
              <div className="form-grid">
                <div className="field field-full"><label>Title *</label><input required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} /></div>
                <div className="field"><label>Amount (ETB) *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} /></div>
                <div className="field"><label>Date *</label><input required type="date" value={form.expenseDate} onChange={e=>setForm(p=>({...p,expenseDate:e.target.value}))} /></div>
                <div className="field"><label>Category</label>
                  <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label>Payment Method</label>
                  <select value={form.paymentMethod} onChange={e=>setForm(p=>({...p,paymentMethod:e.target.value}))}>
                    {['cash','card','mobile','bank'].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="field"><label>Branch</label>
                  <select value={form.branchId} onChange={e=>setForm(p=>({...p,branchId:e.target.value}))}>
                    <option value="">— All —</option>
                    {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="field field-full"><label>Note</label><textarea rows="2" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
