import { lazy, Suspense } from 'react';
import { Routes, Route, NavLink, Link, Navigate } from 'react-router-dom';
import { Logo, useSite } from './site.jsx';
import Home from './pages/Home.jsx';

const Team = lazy(() => import('./pages/Team.jsx'));
const Events = lazy(() => import('./pages/Events.jsx'));
const Stars = lazy(() => import('./pages/Stars.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));

export default function App() {
  const { settings } = useSite();
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand"><Logo />NSDC<small>JAMIA HAMDARD</small></Link>
        <nav>
          <NavLink to="/team">Team</NavLink>
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/stars">Stars of the Month</NavLink>
          {settings.linkedin && <a href={settings.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
        </nav>
      </header>
      <main>
        <Suspense fallback={<p className="muted" style={{ padding: 40 }}>Loading…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/team/:slug?" element={<Team />} />
            <Route path="/events" element={<Events />} />
            <Route path="/stars" element={<Stars />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="footer">
        © {new Date().getFullYear()} NSDC Jamia Hamdard Chapter
        {settings.linkedin && <> · <a href={settings.linkedin} target="_blank" rel="noreferrer">Follow us on LinkedIn</a></>}
        {' · '}<Link to="/admin">Admin</Link>
      </footer>
    </>
  );
}
