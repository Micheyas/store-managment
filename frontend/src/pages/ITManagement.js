import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';

const BLANK = { name:'', email:'', password:'', role:'cashier', branchId:'' };

export default function ITManagement() {
  const [tab, setTab]           = useState('users');
  const [users, setUsers]       = useState([]);
  const [branches, setBranches] = useState([]);
  const [myActions, setMyActions] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Forms
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(BLANK);
  const [showEdit, setShowEdit]     = useState(null); // user object
  const [editForm, setEditForm]     = useState({});
  const [showReset, setShowReset]   = useState(null); // user object
  const [newPw, setNewPw]           = useState('');
  const [note, setNote]             = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/users');
      setUsers(r.data);
    } catch(e) { setError(e.response?.data?.error || 'Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  const loadMyActions = useCallback(async () => {
    const r = await api.get('/approvals/mine');
    setMyActions(r.data);
  }, []);

  useEffect(() => {
    api.get('/branches').then(r => setBranches(r.data));
    loadUsers();
    loadMyActions();
  }, [loadUsers, loadMyActions]);

  const submit = async (type, payload) => {
    setError(''); setSuccess('');
    try {
      await api.post('/approvals', { type, payload, note });
      setSuccess(`Request submitted for Superadmin approval.`);
      setNote('');
      setShowCreate(false); setShowEdit(null); setShowReset(null);
      loadMyActions();
    } catch(e) { setError(e.response?.data?.error || 'Failed to submit'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await submit('create_user', { ...createForm });
    setCreateForm(BLANK);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await submit('update_user', { userId: showEdit.id, ...editForm });
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPw) return setError('Enter a new password');
    await submit('reset_password', { userId: showReset.id, newPassword: newPw });
    setNewPw('');
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Submit deactivation request for ${u.name}?`)) return;
    await submit('delete_user', { userId: u.id });
  };

  const STATUS_COLOR = { pending:'orange', approved:'green', rejected:'red' };

  const TYPE_LABEL = {
    create_user: '➕ Create User',
    update_user: '✏️ Update User',
    reset_password: '🔑 Reset Password',
    delete_user: '🗑️ Deactivate User',
  };

  return (
    <div className="page">
      <h1 className="page-title">🖥️ IT Management</h1>

      <div className="tabs">
        {['users','requests'].map(t => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t === 'users' ? '👥 User Accounts' : `📋 My Requests (${myActions.filter(a=>a.status==='pending').length} pending)`}
          </button>
        ))}
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <>
          <div className="page-header" style={{marginBottom:16}}>
            <button className="btn btn-primary" onClick={() => { setShowCreate(true); setError(''); setSuccess(''); }}>
              + Request New User
            </button>
          </div>

          {/* Create User Form */}
          {showCreate && (
            <form onSubmit={handleCreate} className="card form-grid mb-3">
              <h3 className="field-full">➕ Request: Create New User</h3>
              <div className="field"><label>Name *</label>
                <input required value={createForm.name} onChange={e=>setCreateForm(p=>({...p,name:e.target.value}))} />
              </div>
              <div className="field"><label>Email *</label>
                <input type="email" required value={createForm.email} onChange={e=>setCreateForm(p=>({...p,email:e.target.value}))} />
              </div>
              <div className="field"><label>Password *</label>
                <input type="password" required value={createForm.password} onChange={e=>setCreateForm(p=>({...p,password:e.target.value}))} />
              </div>
              <div className="field"><label>Role</label>
                <select value={createForm.role} onChange={e=>setCreateForm(p=>({...p,role:e.target.value}))}>
                  {['admin','warehouse','cashier','it'].map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="field"><label>Branch</label>
                <select value={createForm.branchId} onChange={e=>setCreateForm(p=>({...p,branchId:e.target.value}))}>
                  <option value="">— None —</option>
                  {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="field field-full"><label>Note to Superadmin (optional)</label>
                <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Reason for this request…" />
              </div>
              <div className="field-full" style={{display:'flex',gap:8}}>
                <button type="submit" className="btn btn-primary">Submit for Approval</button>
                <button type="button" className="btn btn-outline" onClick={()=>setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          )}

          {/* Edit User Modal */}
          {showEdit && (
            <form onSubmit={handleEdit} className="card form-grid mb-3">
              <h3 className="field-full">✏️ Request: Edit User — {showEdit.name}</h3>
              <div className="field"><label>New Name</label>
                <input value={editForm.name||''} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} placeholder={showEdit.name} />
              </div>
              <div className="field"><label>New Email</label>
                <input type="email" value={editForm.email||''} onChange={e=>setEditForm(p=>({...p,email:e.target.value}))} placeholder={showEdit.email} />
              </div>
              <div className="field"><label>New Role</label>
                <select value={editForm.role||showEdit.role} onChange={e=>setEditForm(p=>({...p,role:e.target.value}))}>
                  {['admin','warehouse','cashier','it'].map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="field"><label>Branch</label>
                <select value={editForm.branchId!==undefined?editForm.branchId:showEdit.branchId||''} onChange={e=>setEditForm(p=>({...p,branchId:e.target.value}))}>
                  <option value="">— None —</option>
                  {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="field field-full"><label>Note to Superadmin (optional)</label>
                <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Reason for this change…" />
              </div>
              <div className="field-full" style={{display:'flex',gap:8}}>
                <button type="submit" className="btn btn-primary">Submit for Approval</button>
                <button type="button" className="btn btn-outline" onClick={()=>setShowEdit(null)}>Cancel</button>
              </div>
            </form>
          )}

          {/* Reset Password Modal */}
          {showReset && (
            <form onSubmit={handleReset} className="card form-grid mb-3">
              <h3 className="field-full">🔑 Request: Reset Password — {showReset.name}</h3>
              <div className="field field-full"><label>New Password *</label>
                <input type="password" required minLength={6} value={newPw} onChange={e=>setNewPw(e.target.value)} />
              </div>
              <div className="field field-full"><label>Note to Superadmin (optional)</label>
                <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Reason for password reset…" />
              </div>
              <div className="field-full" style={{display:'flex',gap:8}}>
                <button type="submit" className="btn btn-primary">Submit for Approval</button>
                <button type="button" className="btn btn-outline" onClick={()=>setShowReset(null)}>Cancel</button>
              </div>
            </form>
          )}

          {/* Users Table */}
          {loading ? <div className="loader">Loading…</div> : (
            <div className="card">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td><span className="badge badge-blue">{u.role}</span></td>
                      <td>{u.branch?.name||'—'}</td>
                      <td><span className={`badge badge-${u.isActive?'success':'danger'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                      <td style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        <button className="btn btn-sm btn-outline" onClick={()=>{ setShowEdit(u); setEditForm({}); setShowCreate(false); setShowReset(null); setError(''); setSuccess(''); }}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={()=>{ setShowReset(u); setNewPw(''); setShowCreate(false); setShowEdit(null); setError(''); setSuccess(''); }}>
                          🔑 Reset PW
                        </button>
                        {u.isActive && (
                          <button className="btn btn-sm btn-danger" onClick={()=>handleDelete(u)}>
                            🗑️ Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── My Requests Tab ── */}
      {tab === 'requests' && (
        <div className="card">
          {myActions.length === 0 ? <p className="empty">No requests submitted yet.</p> : (
            <table className="table">
              <thead><tr><th>Type</th><th>Submitted</th><th>Status</th><th>Reviewed By</th><th>Note</th></tr></thead>
              <tbody>
                {myActions.map(a => (
                  <tr key={a.id}>
                    <td>{TYPE_LABEL[a.type] || a.type}</td>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                    <td>
                      <span className="badge" style={{background: STATUS_COLOR[a.status], color:'#fff'}}>
                        {a.status}
                      </span>
                    </td>
                    <td>{a.reviewer?.name || '—'}</td>
                    <td>{a.reviewNote || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
