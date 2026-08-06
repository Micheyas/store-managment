import React, { useEffect, useState } from 'react';
import api from '../api';

const BLANK = { name:'', phone:'', email:'', address:'', notes:'' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(BLANK);
  const [error, setError]         = useState('');

  const fetch = () => api.get('/suppliers').then(r => setSuppliers(r.data));
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit   = (s) => { setEditing(s); setForm({ name:s.name, phone:s.phone||'', email:s.email||'', address:s.address||'', notes:s.notes||'' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) await api.put(`/suppliers/${editing.id}`, form);
      else await api.post('/suppliers', form);
      setShowModal(false); fetch();
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate supplier?')) return;
    await api.delete(`/suppliers/${id}`); fetch();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🤝 Suppliers</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Supplier</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Actions</th></tr></thead>
          <tbody>
            {suppliers.length === 0 ? <tr><td colSpan="5" className="empty">No suppliers yet.</td></tr>
            : suppliers.map(s => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.phone || '—'}</td>
                <td>{s.email || '—'}</td>
                <td>{s.address || '—'}</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => openEdit(s)}>✏️</button>
                  <button className="btn btn-sm btn-danger ml-1" onClick={() => handleDelete(s.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="modal-body form-grid">
              {[['Name *','name','text',true],['Phone','phone','tel',false],['Email','email','email',false]].map(([l,k,t,r]) => (
                <div key={k} className="field"><label>{l}</label>
                  <input type={t} required={r} value={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} />
                </div>
              ))}
              <div className="field field-full"><label>Address</label><input value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} /></div>
              <div className="field field-full"><label>Notes</label><textarea value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} rows="2" /></div>
              {error && <div className="alert alert-error field-full">{error}</div>}
              <div className="modal-footer field-full">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
