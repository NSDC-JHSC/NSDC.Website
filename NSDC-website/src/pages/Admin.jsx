import { useEffect, useState } from 'react';
import { request } from '../api.js';
import AdminTeams from './AdminTeams.jsx';
import AdminEvents from './AdminEvents.jsx';
import AdminStars from './AdminStars.jsx';
import AdminSite from './AdminSite.jsx';

const TABS = [['teams', '👥 Team members'], ['events', '📅 Events'], ['stars', '⭐ Stars of the Month'], ['site', '⚙️ Logo & Site']];

export default function Admin() {
  const [state, setState] = useState('loading'); // loading | out | in
  const [demo, setDemo] = useState(false);
  const [tab, setTab] = useState('teams');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    request('/api/admin/me').then((d) => { setDemo(!!d.demo); setState('in'); }).catch(() => setState('out'));
  }, []);

  const login = async (e) => {
    e.preventDefault(); setErr('');
    try { await request('/api/admin/login', { method: 'POST', body: { password: pw } }); location.reload(); }
    catch (x) { setErr(x.message); }
  };
  const logout = async () => { await request('/api/admin/logout', { method: 'POST' }); location.reload(); };

  if (state === 'loading') return <p className="muted" style={{ padding: 40 }}>Loading…</p>;
  if (state === 'out') return (
    <form className="card narrow form" onSubmit={login}>
      <h2>Admin login</h2>
      <input type="password" placeholder="Admin password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      {err && <p className="err">{err}</p>}
      <button className="btn">Login</button>
    </form>
  );
  return (
    <section className="section">
      <div className="section-head"><h2>Admin panel</h2><button className="btn ghost" onClick={logout}>Logout</button></div>
      <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'teams' && <AdminTeams demo={demo} />}
      {tab === 'events' && <AdminEvents />}
      {tab === 'stars' && <AdminStars />}
      {tab === 'site' && <AdminSite />}
    </section>
  );
}
