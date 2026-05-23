import { useEffect, useState } from 'react';
import api from '../api/client.js';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, Empty, Badge, Toast, fmtDate } from '../components/ui.jsx';

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  const load = () => api.get('/users').then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  async function save(form) {
    if (modal.mode === 'add') { await api.post('/users', form); showToast('User added'); }
    else { await api.put(`/users/${form.id}`, form); showToast('User updated'); }
    setModal(null); load();
  }

  async function remove(u) {
    if (!confirm(`Delete user "${u.name}"?`)) return;
    try { await api.delete(`/users/${u.id}`); showToast('User deleted'); load(); }
    catch (e) { showToast(e.response?.data?.error || 'Failed'); }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Users</h1><p>Manage who can access the admin panel</p></div>
        <button className="btn primary" onClick={() => setModal({ mode: 'add', data: { name: '', email: '', password: '', role: 'staff', active: 1 } })}>+ Add User</button>
      </div>

      <div className="card">
        {!users ? <Spinner /> : users.length === 0 ? (
          <Empty icon="👤" title="No users" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="t-name">{u.name}{u.id === me.id && <span className="t-sub"> (you)</span>}</td>
                    <td>{u.email}</td>
                    <td><Badge tone={u.role === 'admin' ? 'blue' : 'gray'}>{u.role}</Badge></td>
                    <td><Badge tone={u.active ? 'green' : 'red'}>{u.active ? 'active' : 'disabled'}</Badge></td>
                    <td className="t-sub">{fmtDate(u.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="icon-btn" onClick={() => setModal({ mode: 'edit', data: { ...u, password: '' } })}>✎</button>
                      {u.id !== me.id && <button className="icon-btn danger" onClick={() => remove(u)}>🗑</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <UserForm mode={modal.mode} initial={modal.data} onClose={() => setModal(null)} onSave={save} />}
      <Toast message={toast} />
    </>
  );
}

function UserForm({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave(form); }
    catch (ex) { setErr(ex.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  }

  return (
    <Modal
      title={mode === 'add' ? 'Add User' : 'Edit User'}
      onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" form="user-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </>}
    >
      <form id="user-form" onSubmit={submit}>
        {err && <div className="error-msg">{err}</div>}
        <div className="field">
          <label>Name *</label>
          <input className="input" value={form.name} onChange={set('name')} required autoFocus />
        </div>
        <div className="field">
          <label>Email *</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div className="field">
          <label>{mode === 'add' ? 'Password *' : 'New password (leave blank to keep)'}</label>
          <input className="input" type="password" value={form.password} onChange={set('password')}
            required={mode === 'add'} placeholder={mode === 'edit' ? '••••••••' : ''} />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Role</label>
            <select className="select" value={form.role} onChange={set('role')}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select className="select" value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: Number(e.target.value) })}>
              <option value="1">Active</option>
              <option value="0">Disabled</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
