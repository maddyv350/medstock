import { useEffect, useState } from 'react';
import api from '../api/client.js';
import Modal from '../components/Modal.jsx';
import { Spinner, Empty, Badge, Toast } from '../components/ui.jsx';

export default function Categories() {
  const [cats, setCats] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  const load = () => api.get('/categories').then((r) => setCats(r.data));
  useEffect(() => { load(); }, []);

  async function save(form) {
    if (modal.mode === 'add') { await api.post('/categories', form); showToast('Category added'); }
    else { await api.put(`/categories/${form.id}`, form); showToast('Category updated'); }
    setModal(null); load();
  }

  async function remove(c) {
    if (!confirm(`Delete category "${c.name}"? Products keep existing but become uncategorized.`)) return;
    await api.delete(`/categories/${c.id}`); showToast('Category deleted'); load();
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Categories</h1><p>Organize products into groups</p></div>
        <button className="btn primary" onClick={() => setModal({ mode: 'add', data: { name: '', description: '' } })}>+ Add Category</button>
      </div>

      <div className="card">
        {!cats ? <Spinner /> : cats.length === 0 ? (
          <Empty icon="🗂" title="No categories yet" hint="Add your first category to organize stock." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Description</th><th>Products</th><th></th></tr></thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c.id}>
                    <td className="t-name">{c.name}</td>
                    <td className="t-sub">{c.description || '—'}</td>
                    <td><Badge tone="blue">{c.product_count}</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="icon-btn" onClick={() => setModal({ mode: 'edit', data: { ...c } })}>✎</button>
                      <button className="icon-btn danger" onClick={() => remove(c)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <CatForm mode={modal.mode} initial={modal.data} onClose={() => setModal(null)} onSave={save} />}
      <Toast message={toast} />
    </>
  );
}

function CatForm({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  async function submit(e) {
    e.preventDefault(); setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }
  return (
    <Modal
      title={mode === 'add' ? 'Add Category' : 'Edit Category'}
      onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" form="cat-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </>}
    >
      <form id="cat-form" onSubmit={submit}>
        <div className="field">
          <label>Name *</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="input" rows="3" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}
