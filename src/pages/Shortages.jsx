import { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';
import Modal from '../components/Modal.jsx';
import { Spinner, Empty, Badge, Toast, fmtDate } from '../components/ui.jsx';

const PRIORITY_TONE = { high: 'red', normal: 'amber', low: 'gray' };
const STATUS_TONE = { pending: 'amber', ordered: 'blue', resolved: 'green' };

export default function Shortages() {
  const [items, setItems] = useState(null);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  const load = useCallback(() => {
    const q = statusFilter ? { status: statusFilter } : {};
    api.get('/shortages', { params: q }).then((r) => setItems(r.data));
  }, [statusFilter]);

  useEffect(() => { api.get('/products').then((r) => setProducts(r.data)); }, []);
  useEffect(() => { load(); }, [load]);

  async function save(form) {
    if (modal.mode === 'add') { await api.post('/shortages', form); showToast('Shortage logged'); }
    else { await api.put(`/shortages/${form.id}`, form); showToast('Shortage updated'); }
    setModal(null); load();
  }

  async function setStatus(s, status) {
    await api.put(`/shortages/${s.id}`, { status });
    showToast(`Marked ${status}`); load();
  }

  async function remove(s) {
    if (!confirm(`Delete shortage for "${s.product_name}"?`)) return;
    await api.delete(`/shortages/${s.id}`); showToast('Deleted'); load();
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Shortages</h1><p>Track items that need restocking or are unavailable</p></div>
        <button className="btn primary" onClick={() => setModal({ mode: 'add', data: { product_id: '', product_name: '', quantity: 1, priority: 'normal', status: 'pending', note: '' } })}>+ Log Shortage</button>
      </div>

      <div className="toolbar">
        {['', 'pending', 'ordered', 'resolved'].map((s) => (
          <button key={s} className={`btn ${statusFilter === s ? 'primary' : 'ghost'} sm`} onClick={() => setStatusFilter(s)}>
            {s === '' ? 'All' : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        {!items ? <Spinner /> : items.length === 0 ? (
          <Empty icon="⚠" title="No shortages" hint="Nothing to restock right now." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Need</th><th>Priority</th><th>Status</th><th>Logged</th><th>Note</th><th></th></tr></thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="t-name">{s.product_name}</div>
                      {s.current_stock != null && <div className="t-sub">in stock: {s.current_stock}</div>}
                    </td>
                    <td>{s.quantity}</td>
                    <td><Badge tone={PRIORITY_TONE[s.priority]}>{s.priority}</Badge></td>
                    <td><Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge></td>
                    <td className="t-sub">{fmtDate(s.created_at)}</td>
                    <td className="t-sub" style={{ whiteSpace: 'normal', maxWidth: 220 }}>{s.note || '—'}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {s.status !== 'ordered' && s.status !== 'resolved' && (
                        <button className="icon-btn" title="Mark ordered" onClick={() => setStatus(s, 'ordered')}>📦</button>
                      )}
                      {s.status !== 'resolved' && (
                        <button className="icon-btn" title="Mark resolved" onClick={() => setStatus(s, 'resolved')}>✓</button>
                      )}
                      <button className="icon-btn" title="Edit" onClick={() => setModal({ mode: 'edit', data: { ...s, product_id: s.product_id || '' } })}>✎</button>
                      <button className="icon-btn danger" title="Delete" onClick={() => remove(s)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <ShortageForm mode={modal.mode} initial={modal.data} products={products} onClose={() => setModal(null)} onSave={save} />}
      <Toast message={toast} />
    </>
  );
}

function ShortageForm({ mode, initial, products, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // When picking a catalogue product, autofill the name.
  function pickProduct(e) {
    const id = e.target.value;
    const prod = products.find((p) => String(p.id) === id);
    setForm({ ...form, product_id: id, product_name: prod ? prod.name : form.product_name });
  }

  async function submit(e) {
    e.preventDefault(); setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <Modal
      title={mode === 'add' ? 'Log Shortage' : 'Edit Shortage'}
      onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" form="short-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </>}
    >
      <form id="short-form" onSubmit={submit}>
        <div className="field">
          <label>Link to product (optional)</label>
          <select className="select" value={form.product_id} onChange={pickProduct}>
            <option value="">— Free-text item —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Item name *</label>
          <input className="input" value={form.product_name} onChange={set('product_name')} required
            placeholder="e.g. Amoxicillin 250mg" />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Quantity needed</label>
            <input className="input" type="number" min="1" value={form.quantity} onChange={set('quantity')} />
          </div>
          <div className="field">
            <label>Priority</label>
            <select className="select" value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Status</label>
          <select className="select" value={form.status} onChange={set('status')}>
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="field">
          <label>Note</label>
          <textarea className="input" rows="2" value={form.note || ''} onChange={set('note')} />
        </div>
      </form>
    </Modal>
  );
}
