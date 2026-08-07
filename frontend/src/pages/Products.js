import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const BLANK = { name:'', sku:'', barcode:'', description:'', unit:'pcs', costPrice:'', sellingPrice:'', taxRate:'', categoryId:'', supplierId:'' };
const LIMIT  = 20;

export default function Products() {
  const { can } = useAuth();
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState(''); // raw input — debounced into search
  const [catFilter, setCatFilter]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(BLANK);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const debounceRef = useRef(null);

  // Debounce search input — only fire fetch 400ms after user stops typing
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.append('search', search);
      if (catFilter) params.append('categoryId', catFilter);
      const res = await api.get(`/products?${params}`);
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, catFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    api.get('/suppliers').then(r => setSuppliers(r.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null); setForm(BLANK); setImageFile(null);
    setImagePreview(null); setError(''); setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku||'', barcode: p.barcode||'',
      description: p.description||'', unit: p.unit||'pcs',
      costPrice: p.costPrice, sellingPrice: p.sellingPrice,
      taxRate: p.taxRate||'', categoryId: p.categoryId||'', supplierId: p.supplierId||'',
    });
    setImagePreview(p.image || null);
    setImageFile(null); setError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (imageFile) fd.append('image', imageFile);
      if (editing) {
        await api.put(`/products/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false);
      fetchProducts();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed');
    }
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;
  const canEdit    = can('owner', 'manager');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Products</h1>
          <p className="page-sub">{total} products total</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔍 Search by name, SKU, barcode…"
          value={searchInput}
          onChange={handleSearchChange}
        />
        <select
          className="select"
          value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Table — keep showing existing data while loading (no full-page spinner) */}
      <div className="card" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        {loading && products.length === 0 && <div className="loader">Loading…</div>}
        {(!loading || products.length > 0) && (
          <table className="table">
            <thead>
              <tr>
                <th>Image</th><th>Name</th><th>SKU</th><th>Category</th>
                <th>Cost</th><th>Price</th><th>Stock</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={canEdit ? 8 : 7} className="empty">No products found.</td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  <td>
                    <img
                      src={p.image || '/placeholder.png'}
                      alt={p.name}
                      className="product-thumb"
                      onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                    />
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.barcode && <><br /><small style={{color:'#9ca3af'}}>{p.barcode}</small></>}
                  </td>
                  <td><code style={{fontSize:11}}>{p.sku}</code></td>
                  <td>{p.category?.name || '—'}</td>
                  <td>{Number(p.costPrice).toLocaleString()} ETB</td>
                  <td><strong>{Number(p.sellingPrice).toLocaleString()} ETB</strong></td>
                  <td>
                    {p.stockEntries?.length > 0
                      ? p.stockEntries.reduce((s, e) => s + parseFloat(e.quantity), 0).toLocaleString()
                      : '—'} {p.unit}
                  </td>
                  {canEdit && (
                    <td style={{whiteSpace:'nowrap'}}>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}>✏️ Edit</button>
                      <button className="btn btn-sm btn-danger ml-1" onClick={() => handleDelete(p.id)}>🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="pagination">
            <button className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? `Edit — ${editing.name}` : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              {error && <div className="alert alert-error mb-2">{error}</div>}
              <div className="form-grid">
                <div className="field field-full">
                  <label>Product Image</label>
                  {imagePreview && <img src={imagePreview} alt="preview" className="img-preview" />}
                  <input type="file" accept="image/*" onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                  }} />
                </div>
                <div className="field"><label>Name *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Product name" />
                </div>
                <div className="field"><label>SKU</label>
                  <input value={form.sku} onChange={e => setForm(p => ({...p, sku: e.target.value}))} placeholder="Auto-generated if empty" />
                </div>
                <div className="field"><label>Barcode</label>
                  <input value={form.barcode} onChange={e => setForm(p => ({...p, barcode: e.target.value}))} placeholder="Scan or enter barcode" />
                </div>
                <div className="field"><label>Unit</label>
                  <select value={form.unit} onChange={e => setForm(p => ({...p, unit: e.target.value}))}>
                    {['pcs','kg','g','L','mL','m','cm','box','pack','dozen','carton'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="field"><label>Cost Price (ETB) *</label>
                  <input required type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setForm(p => ({...p, costPrice: e.target.value}))} />
                </div>
                <div className="field"><label>Selling Price (ETB) *</label>
                  <input required type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e => setForm(p => ({...p, sellingPrice: e.target.value}))} />
                </div>
                <div className="field"><label>Tax Rate (%)</label>
                  <input type="number" min="0" step="0.01" value={form.taxRate} onChange={e => setForm(p => ({...p, taxRate: e.target.value}))} />
                </div>
                <div className="field"><label>Category</label>
                  <select value={form.categoryId} onChange={e => setForm(p => ({...p, categoryId: e.target.value}))}>
                    <option value="">— None —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field"><label>Supplier</label>
                  <select value={form.supplierId} onChange={e => setForm(p => ({...p, supplierId: e.target.value}))}>
                    <option value="">— None —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="field field-full"><label>Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows="2" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
