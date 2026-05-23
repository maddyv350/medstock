import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', ico: '▤', end: true },
  { to: '/products', label: 'Stock', ico: '💊' },
  { to: '/categories', label: 'Categories', ico: '🗂' },
  { to: '/shortages', label: 'Shortages', ico: '⚠' },
  { to: '/users', label: 'Users', ico: '👤', adminOnly: true },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="dot">✚</span> MedStock
        </div>
        <nav className="nav">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="ico">{n.ico}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="userbox">
          <div className="name">{user?.name}</div>
          <div className="role">{user?.role}</div>
          <button onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
