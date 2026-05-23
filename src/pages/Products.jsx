import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import Modal from '../components/Modal.jsx';
import { Spinner, Empty, StockBadge, Badge, Toast, fmtMoney, fmtDate, expiryInfo } from '../components/ui.jsx';

const BLANK = {
  name: '', category_id: '', manufacturer: '', batch_number: '', description: '',
  unit: 'strip', quantity: 0, reorder_level: 10, price: 0, mrp: 0, expiry_date: '',
};

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(params.get('category') || '');
  const [status, setStatus] = useState(params.get('status') || '');
  const [modal, setModal] = useState(null); // { mode, data }
  const [toast, setToast] = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  const load = useCallback(() => {
    const q = {};
    if (search) q.search = search;
    if (category) q.category = category;
    if (status) q.status = status;
    api.get('/products', { params: q }).then((r) => setProducts(r.data));
  }, [search, category, status]);

  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)); }, []);
  useEffect(() => {
    const id = setTimeout(load, 250); // debounce search
    return () => clearTimeout(id);
  }, [load]);

  function openAdd() { setModal({ mode: 'add', data: { ...BLANK } }); }
  function openEdit(p) {
    setModal({ mode: 'edit', data: { ...p, category_id: p.category_id || '', expiry_date: p.expiry_date || '' } });
  }

  async function save(form) {
    if (modal.mode === 'add') {
      await api.post('/products', form);
      showToast('Product added');
    } else {
      await api.put(`/products/${form.id}`, form);
      showToast('Product updated');
    }
    setModal(null);
    load();
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await api.delete(`/products/${p.id}`);
    showToast('Product deleted');
    load();
  }

  async function adjust(p, delta) {
    await api.patch(`/products/${p.id}/stock`, { delta });
    load();
  }

  function setFilter(key, val, setter) {
    setter(val);
    const next = new URLSearchParams(params);
    val ? next.set(key, val) : next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Stock</h1>
          <p>{products ? `${products.length} products` : 'Manage your inventory'}</p>
        </div>
        <button className="btn primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="toolbar">
        <div className="search">
          <span className="si">🔍</span>
          <input className="input" placeholder="Search name, manufacturer, batch…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select" style={{ maxWidth: 200 }} value={category}
          onChange={(e) => setFilter('category', e.target.value, setCategory)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select" style={{ maxWidth: 180 }} value={status}
          onChange={(e) => setFilter('status', e.target.value, setStatus)}>
          <option value="">All status</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
          <option value="expiring">Expiring soon</option>
        </select>
      </div>

      <div className="card">
        {!products ? <Spinner /> : products.length === 0 ? (
          <Empty icon="💊" title="No products found" hint="Try adjusting filters or add a new product." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Stock</th><th>Quick adjust</th>
                  <th>Price / MRP</th><th>Expiry</th><th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const e = expiryInfo(p.expiry_date);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="t-name">{p.name}</div>
                        <div className="t-sub">{p.manufacturer || '—'}{p.batch_number ? ` · ${p.batch_number}` : ''}</div>
                      </td>
                      <td>{p.category_name ? <Badge tone="blue">{p.category_name}</Badge> : <span className="t-sub">—</span>}</td>
                      <td><StockBadge quantity={p.quantity} reorder={p.reorder_level} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button className="icon-btn" onClick={() => adjust(p, -1)}>−</button>
                          <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }}>{p.quantity}</span>
                          <button className="icon-btn" onClick={() => adjust(p, 1)}>+</button>
                        </div>
                      </td>
                      <td>{fmtMoney(p.price)} <span className="t-sub">/ {fmtMoney(p.mrp)}</span></td>
                      <td>{p.expiry_date ? <Badge tone={e.tone}>{e.text === 'Expired' || e.text.endsWith('left') ? e.text : fmtDate(p.expiry_date)}</Badge> : <span className="t-sub">—</span>}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-btn" onClick={() => openEdit(p)} title="Edit">✎</button>
                        <button className="icon-btn danger" onClick={() => remove(p)} title="Delete">🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <ProductForm
          mode={modal.mode}
          initial={modal.data}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
      <Toast message={toast} />
    </>
  );
}

function ProductForm({ mode, initial, categories, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <Modal
      title={mode === 'add' ? 'Add Product' : 'Edit Product'}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" form="prod-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      <form id="prod-form" onSubmit={submit}>
        <div className="field">
          <label>Name *</label>
          <input className="input" value={form.name} onChange={set('name')} required autoFocus />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Category</label>
            <select className="select" value={form.category_id} onChange={set('category_id')}>
              <option value="">Uncategorized</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Manufacturer</label>
            <input className="input" value={form.manufacturer || ''} onChange={set('manufacturer')} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Batch number</label>
            <input className="input" value={form.batch_number || ''} onChange={set('batch_number')} />
          </div>
          <div className="field">
            <label>Unit</label>
            <input className="input" value={form.unit || ''} onChange={set('unit')} placeholder="strip, bottle, box…" />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Quantity</label>
            <input className="input" type="number" min="0" value={form.quantity} onChange={set('quantity')} />
          </div>
          <div className="field">
            <label>Reorder level</label>
            <input className="input" type="number" min="0" value={form.reorder_level} onChange={set('reorder_level')} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Price (₹)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
          </div>
          <div className="field">
            <label>MRP (₹)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.mrp} onChange={set('mrp')} />
          </div>
        </div>
        <div className="field">
          <label>Expiry date</label>
          <input className="input" type="date" value={form.expiry_date || ''} onChange={set('expiry_date')} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="input" rows="2" value={form.description || ''} onChange={set('description')} />
        </div>
      </form>
    </Modal>
  );
}
