// Small shared presentational helpers used across pages.

export function Stat({ label, value, icon, sub, subColor }) {
  return (
    <div className="stat">
      {icon && <div className="icon">{icon}</div>}
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub" style={{ color: subColor || 'var(--muted)' }}>{sub}</div>}
    </div>
  );
}

export function Badge({ tone = 'gray', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Spinner({ label = 'Loading…' }) {
  return <div className="spinner">{label}</div>;
}

export function Empty({ icon = '📭', title, hint }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      {hint && <div style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

// Availability / stock-status badge for a product row.
export function StockBadge({ quantity, reorder }) {
  if (quantity === 0) return <Badge tone="red">Out of stock</Badge>;
  if (quantity <= reorder) return <Badge tone="amber">Low ({quantity})</Badge>;
  return <Badge tone="green">In stock ({quantity})</Badge>;
}

export function fmtMoney(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Days until expiry, with a tone for badge coloring.
export function expiryInfo(date) {
  if (!date) return { text: '—', tone: 'gray' };
  const days = Math.ceil((new Date(date) - new Date()) / 86400000);
  if (days < 0) return { text: 'Expired', tone: 'red' };
  if (days <= 60) return { text: `${days}d left`, tone: 'amber' };
  return { text: fmtDate(date), tone: 'gray' };
}
