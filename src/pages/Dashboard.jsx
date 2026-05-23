import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { Stat, Spinner, Badge, fmtMoney, expiryInfo } from '../components/ui.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setData(r.data));
  }, []);

  if (!data) return <Spinner />;
  const t = data.totals;
  const maxCat = Math.max(1, ...data.byCategory.map((c) => c.count));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your store inventory and alerts</p>
        </div>
      </div>

      <div className="grid stat-grid" style={{ marginBottom: 16 }}>
        <Stat label="Total Products" value={t.products} icon="💊" />
        <Stat label="Inventory Value" value={fmtMoney(t.inventoryValue)} icon="💰" />
        <Stat label="Low Stock" value={t.lowStock} icon="📉"
          sub={t.lowStock ? 'Needs reorder' : 'All good'} subColor={t.lowStock ? 'var(--warn)' : 'var(--success)'} />
        <Stat label="Out of Stock" value={t.outOfStock} icon="🚫"
          sub={t.outOfStock ? 'Unavailable' : 'None'} subColor={t.outOfStock ? 'var(--danger)' : 'var(--success)'} />
        <Stat label="Expiring Soon" value={t.expiringSoon} icon="⏰"
          sub="within 60 days" subColor={t.expiringSoon ? 'var(--warn)' : 'var(--muted)'} />
        <Stat label="Pending Shortages" value={t.pendingShortages} icon="⚠" />
        <Stat label="Categories" value={t.categories} icon="🗂" />
        <Stat label="Users" value={t.users} icon="👤" />
      </div>

      <div className="grid cols-2">
        <div className="card card-pad">
          <div className="section-title">Low / Out of Stock</div>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Items at or below reorder level</p>
          {data.lowStockItems.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Everything is well stocked. 🎉</p>
          ) : (
            data.lowStockItems.map((p) => (
              <div className="list-row" key={p.id}>
                <div>
                  <div className="t-name">{p.name}</div>
                  <div className="t-sub">{p.category_name || 'Uncategorized'}</div>
                </div>
                <Badge tone={p.quantity === 0 ? 'red' : 'amber'}>
                  {p.quantity} / {p.reorder_level} {p.unit}
                </Badge>
              </div>
            ))
          )}
          <Link to="/products?status=low" className="btn ghost sm" style={{ marginTop: 14 }}>View all stock →</Link>
        </div>

        <div className="card card-pad">
          <div className="section-title">Expiring Soon</div>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Within the next 60 days</p>
          {data.expiringItems.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No items expiring soon.</p>
          ) : (
            data.expiringItems.map((p) => {
              const e = expiryInfo(p.expiry_date);
              return (
                <div className="list-row" key={p.id}>
                  <div>
                    <div className="t-name">{p.name}</div>
                    <div className="t-sub">{p.category_name || 'Uncategorized'}</div>
                  </div>
                  <Badge tone={e.tone}>{e.text}</Badge>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="section-title">Products by Category</div>
        <div style={{ marginTop: 14 }}>
          {data.byCategory.map((c) => (
            <div key={c.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <span style={{ color: 'var(--muted)' }}>{c.count} products · {c.units} units</span>
              </div>
              <div className="bar"><span style={{ width: `${(c.count / maxCat) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
