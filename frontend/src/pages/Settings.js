import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Settings() {
  const { can } = useAuth();
  const [tab, setTab]               = useState('branches');
  const [branches, setBranches]     = useState([]);
  const [users, setUsers]           = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bForm, setBForm]           = useState({ name:'', location:'', phone:'', email:'' });
  const [uForm, setUForm] = useState({ name:'', email:'', password:'', role:'cashier', branchId:'' });
  const [catForm, setCatForm]       = useState({ name:'', color:'#6366f1' });
  const [pwForm, setPwForm]         = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [error, setError]           = useState('');
  const [pwMsg, setPwMsg]           = useState('');

  const fetchAll = () => {
    api.get('/branches').then(r => setBranches(r.data));
    api.get('/users').then(r => setUsers(r.data));
    api.get('/currency').then(r => setCurrencies(r.data));
    api.get('/categories').then(r => setCategories(r.data));
  };
  useEffect(() => { fetchAll(); }, []);

  const handleAddBranch = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/branches', bForm); setBForm({name:'',location:'',phone:'',email:''}); fetchAll(); }
    catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  const handleToggleBranch = async (b) => {
    try { await api.put(`/branches/${b.id}`, { isActive: !b.isActive }); fetchAll(); }
    catch(e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/users', uForm); setUForm({name:'',email:'',password:'',role:'cashier',branchId:''}); fetchAll(); }
    catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  const handleToggleUser = async (u) => {
    try { await api.put(`/users/${u.id}`, { isActive: !u.isActive }); fetchAll(); }
    catch(e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleAddCat = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/categories', catForm); setCatForm({name:'',color:'#6366f1'}); fetchAll(); }
    catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  const handleUpdateRate = async (id, rate) => {
    try { await api.put(`/currency/${id}`, { rate: parseFloat(rate) }); fetchAll(); }
    catch(e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setPwMsg(''); setError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg('Password changed successfully.');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="page">
      <h1 className="page-title">⚙️ Settings</h1>
      <div className="tabs">
        {['branches','users','currencies','categories','password'].map(t => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => { setTab(t); setError(''); setPwMsg(''); }}>
            {t === 'branches'  ? '🏪 Branches'
            : t === 'users'    ? '👥 Users'
            : t === 'currencies' ? '💱 Currencies'
            : t === 'categories' ? '🏷️ Categories'
            : '🔑 Password'}
          </button>
        ))}
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      {/* Branches */}
      {tab === 'branches' && (
        <div className="settings-section">
          {can('owner') && (
            <form onSubmit={handleAddBranch} className="card form-grid mb-3">
              <h3 className="field-full">Add Branch</h3>
              {[['Name *','name','text',true],['Location','location','text',false],['Phone','phone','tel',false],['Email','email','email',false]].map(([l,k,t,r]) => (
                <div key={k} className="field"><label>{l}</label><input type={t} required={r} value={bForm[k]} onChange={e => setBForm(p=>({...p,[k]:e.target.value}))} /></div>
              ))}
              <button type="submit" className="btn btn-primary field-full">Add Branch</button>
            </form>
          )}
          <div className="card">
            <table className="table">
              <thead><tr><th>Name</th><th>Location</th><th>Phone</th><th>Status</th>{can('superadmin') && <th>Action</th>}</tr></thead>
              <tbody>{branches.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.location||'—'}</td>
                  <td>{b.phone||'—'}</td>
                  <td><span className={`badge badge-${b.isActive?'success':'danger'}`}>{b.isActive?'Active':'Inactive'}</span></td>
                  {can('owner') && (
                    <td>
                      <button className={`btn btn-sm ${b.isActive ? 'btn-danger' : 'btn-outline'}`} onClick={() => handleToggleBranch(b)}>
                        {b.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="settings-section">
          <form onSubmit={handleAddUser} className="card form-grid mb-3">
            <h3 className="field-full">Add User</h3>
            {[['Name *','name','text',true],['Email *','email','email',true],['Password *','password','password',true]].map(([l,k,t,r]) => (
              <div key={k} className="field"><label>{l}</label><input type={t} required={r} value={uForm[k]} onChange={e => setUForm(p=>({...p,[k]:e.target.value}))} /></div>
            ))}
            <div className="field"><label>Role</label>
              <select value={uForm.role} onChange={e => setUForm(p=>({...p,role:e.target.value}))}>
                {['owner','manager','cashier','it'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="field"><label>Branch</label>
              <select value={uForm.branchId} onChange={e => setUForm(p=>({...p,branchId:e.target.value}))}>
                <option value="">— Default —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary field-full">Add User</button>
          </form>
          <div className="card">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-blue">{u.role}</span></td>
                  <td>{u.branch?.name||'—'}</td>
                  <td><span className={`badge badge-${u.isActive?'success':'danger'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                  <td>
                    <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-outline'}`} onClick={() => handleToggleUser(u)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Currencies */}
      {tab === 'currencies' && (
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div>
              <h3 style={{margin:0}}>💱 Exchange Rates (vs ETB)</h3>
              <p style={{fontSize:12,color:'#9ca3af',marginTop:4}}>
                🔄 Rates auto-refresh every 6 hours from live market data
              </p>
            </div>
          </div>
          <table className="table mt-2">
            <thead><tr><th>Code</th><th>Name</th><th>Symbol</th><th>Rate (per 1 ETB)</th><th>Base</th><th>Manual Override</th></tr></thead>
            <tbody>{currencies.map(c => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.name}</td>
                <td>{c.symbol}</td>
                <td>{Number(c.rate).toFixed(6)}</td>
                <td>{c.isBase ? '✅' : ''}</td>
                <td>{c.isBase ? '—' : <RateInput id={c.id} defaultRate={c.rate} onSave={handleUpdateRate} />}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="settings-section">
          <form onSubmit={handleAddCat} className="card form-grid mb-3">
            <h3 className="field-full">Add Category</h3>
            <div className="field"><label>Name *</label><input required value={catForm.name} onChange={e => setCatForm(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label>Color</label><input type="color" value={catForm.color} onChange={e => setCatForm(p=>({...p,color:e.target.value}))} /></div>
            <button type="submit" className="btn btn-primary field-full">Add Category</button>
          </form>
          <div className="card">
            <table className="table">
              <thead><tr><th>Name</th><th>Color</th></tr></thead>
              <tbody>{categories.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td><span style={{background:c.color,padding:'2px 12px',borderRadius:20,color:'#fff'}}>{c.color}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Change Password */}
      {tab === 'password' && (
        <div className="settings-section">
          <form onSubmit={handleChangePassword} className="card form-grid mb-3" style={{ maxWidth: 480 }}>
            <h3 className="field-full">🔑 Change Password</h3>
            <div className="field field-full">
              <label>Current Password *</label>
              <input type="password" required value={pwForm.currentPassword} onChange={e => setPwForm(p=>({...p,currentPassword:e.target.value}))} />
            </div>
            <div className="field field-full">
              <label>New Password *</label>
              <input type="password" required minLength={6} value={pwForm.newPassword} onChange={e => setPwForm(p=>({...p,newPassword:e.target.value}))} />
            </div>
            <div className="field field-full">
              <label>Confirm New Password *</label>
              <input type="password" required minLength={6} value={pwForm.confirmPassword} onChange={e => setPwForm(p=>({...p,confirmPassword:e.target.value}))} />
            </div>
            {pwMsg && <div className="alert alert-success field-full">{pwMsg}</div>}
            <button type="submit" className="btn btn-primary field-full">Update Password</button>
          </form>
        </div>
      )}
    </div>
  );
}

function RateInput({ id, defaultRate, onSave }) {
  const [val, setVal] = useState(defaultRate);
  return (
    <div style={{display:'flex',gap:4}}>
      <input type="number" step="0.000001" value={val} onChange={e => setVal(e.target.value)} style={{width:100}} />
      <button className="btn btn-sm btn-primary" onClick={() => onSave(id, val)}>Save</button>
    </div>
  );
}
