# MedStore Admin Panel

React + Vite single-page admin for the medical store.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

Make sure the [backend](../backend/) is running on port 4000 first — Vite
proxies `/api` to `http://localhost:4000` in development (see `vite.config.js`).

Log in with `admin@medical.com / admin123` (or the staff account).

## Build for production

```bash
npm run build    # outputs to dist/
npm run preview  # serve the build locally
```

When hosting the built app separately from the API, set the API base URL:

```bash
VITE_API_URL=https://api.yourstore.com/api npm run build
```

## Structure
```
src/
  api/client.js          axios instance (JWT header + 401 handling)
  context/AuthContext.jsx login state, persisted in localStorage
  components/             Layout (sidebar), Modal, shared UI helpers
  pages/
    Login.jsx
    Dashboard.jsx         stats, low-stock, expiring, by-category
    Products.jsx          stock CRUD + search/filter + quick adjust
    Categories.jsx        category CRUD
    Shortages.jsx         shortage tracking + status workflow
    Users.jsx             user management (admin only)
```

Pages are guarded: unauthenticated users are redirected to `/login`, and the
**Users** page is admin-only.
