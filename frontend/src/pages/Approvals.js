import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';

const STATUS_COLOR = { pending:'#f59e0b', approved:'#22c55e', rejected:'#ef4444' };

const TYPE_LABEL = {
  create_user:    '➕ Create User',
  update_user:    '✏️ Update User',
  reset_password: '🔑 Reset Password',
  delete_user:    '🗑️ Deactivate User',
};

function PayloadSummary({ type, payload }) {
  if (!payload) return null;
  switch (type) {
    case 'create_user':
      return <span>Create <strong>{payload.name}</strong> ({payload.email}) as <em>{payload.role}</em></span>;
    case 'update_user':
      return <span>Update user #{payload.userId}: {Object.entries(payload).filter(([k])=>k!=='userId').map(([k,v])=>`${k}=${v}`).join(', ')}</span>;
    case 'reset_password':
      return <span>Reset password for user #{payload.userId}</span>;
    case 'delete_user':
      return <span>Deactivate user #{payload.userId}</span>;
    default:
      return <span>{JSON.stringify(payload)}</span>;
  }
}

export default function Approvals() {
  const [actions, setActions]   = useState([]);
  const [filter, setFilter]     = useState('pending');
  const [loading, setLoading]   = useState(false);
  const [note, setNote]         = useState({});   // { [id]: noteText }
  const [processing, setProcessing] = useState(null);
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/approvals?status=${filter}`);
      setActions(r.data);
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setMsg(''); setError(''); setProcessing(id);
    try {
      const r = await api.post(`/approvals/${id}/approve`, { note: note[id] || '' });
      setMsg(`✅ Approved and executed: ${r.data.message}`);
      load();
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
    finally { setProcessing(null); }
  };

  const handleReject = async (id) => {
    setMsg(''); setError(''); setProcessing(id);
    try {
      await api.post(`/approvals/${id}/reject`, { note: note[id] || '' });
      setMsg('🚫 Action rejected.');
      load();
    } catch(e) { setError(e.response?.data?.error || 'Failed'); }
    finally { setProcessing(null); }
  };

  return (
    <div className="page">
      <h1 className="page-title">✅ IT Action Approvals</h1>

      {/* Filter tabs */}
      <div className="tabs">
        {['pending','approved','rejected','all'].map(s => (
          <button key={s} className={`tab-btn ${filter===s?'active':''}`} onClick={() => { setFilter(s); setMsg(''); setError(''); }}>
            {s === 'pending' ? '⏳ Pending' : s === 'approved' ? '✅ Approved' : s === 'rejected' ? '🚫 Rejected' : '📋 All'}
          </button>
        ))}
      </div>

      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loader">Loading…</div> : (
        actions.length === 0
          ? <div className="card"><p className="empty">No {filter === 'all' ? '' : filter} requests found.</p></div>
          : (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {actions.map(a => (
                <div key={a.id} className="card" style={{borderLeft:`4px solid ${STATUS_COLOR[a.status]}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15}}>{TYPE_LABEL[a.type] || a.type}</div>
                      <div style={{color:'#6b7280',fontSize:13,marginTop:2}}>
                        <PayloadSummary type={a.type} payload={a.payload} />
                      </div>
                      <div style={{fontSize:12,color:'#9ca3af',marginTop:4}}>
                        Submitted by <strong>{a.submitter?.name}</strong> ({a.submitter?.role}) · {new Date(a.createdAt).toLocaleString()}
                      </div>
                      {a.reviewNote && (
                        <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>
                          IT note: <em>{a.reviewNote}</em>
                        </div>
                      )}
                      {a.reviewer && (
                        <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>
                          Reviewed by <strong>{a.reviewer.name}</strong> · {new Date(a.reviewedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <span className="badge" style={{background:STATUS_COLOR[a.status],color:'#fff',alignSelf:'flex-start'}}>
                      {a.status}
                    </span>
                  </div>

                  {/* Actions only for pending */}
                  {a.status === 'pending' && (
                    <div style={{marginTop:12,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      <input
                        placeholder="Optional note…"
                        value={note[a.id]||''}
                        onChange={e=>setNote(p=>({...p,[a.id]:e.target.value}))}
                        style={{flex:1,minWidth:180,padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:6}}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => handleApprove(a.id)}
                        disabled={processing === a.id}
                      >
                        {processing === a.id ? 'Processing…' : '✅ Approve & Execute'}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleReject(a.id)}
                        disabled={processing === a.id}
                      >
                        🚫 Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
}
