import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';

const ACTION_COLOR = {
  login:'#22c55e', logout:'#9ca3af',
  create_product:'#6366f1', update_product:'#f59e0b', delete_product:'#ef4444',
  create_sale:'#3b82f6', void_sale:'#ef4444',
  adjust_stock:'#f97316', transfer_stock:'#8b5cf6',
  create_user:'#6366f1', update_user:'#f59e0b', delete_user:'#ef4444',
};

export default function ActivityLog() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (search) params.append('action', search);
      const r = await api.get(`/activity?${params}`);
      setLogs(r.data.logs);
      setTotal(r.data.total);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <h1 className="page-title">📋 Activity Log</h1>

      <div className="filter-bar">
        <input className="search-input" placeholder="🔍 Filter by action…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} />
        <button className="btn btn-outline" onClick={load}>Refresh</button>
      </div>

      {loading ? <div className="loader">Loading…</div> : (
        <div className="card">
          <table className="table">
            <thead>
              <tr><th>Time</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th><th>Detail</th><th>IP</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan="7" className="empty">No activity recorded yet.</td></tr>
              : logs.map(l => (
                <tr key={l.id}>
                  <td style={{whiteSpace:'nowrap',fontSize:12}}>{new Date(l.createdAt).toLocaleString()}</td>
                  <td><strong>{l.user?.name||'—'}</strong></td>
                  <td><span className="badge badge-blue">{l.user?.role||'—'}</span></td>
                  <td><span className="badge" style={{background:ACTION_COLOR[l.action]||'#6b7280',color:'#fff',fontSize:11}}>{l.action}</span></td>
                  <td>{l.entity||'—'}{l.entityId ? ` #${l.entityId}` : ''}</td>
                  <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.detail||'—'}</td>
                  <td style={{fontSize:11,color:'#9ca3af'}}>{l.ip||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button className="btn btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <span>Page {page} of {Math.ceil(total/50)||1}</span>
            <button className="btn btn-sm" disabled={page*50>=total} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
