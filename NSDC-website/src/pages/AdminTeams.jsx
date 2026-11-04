import { useEffect, useState } from 'react';
import { request } from '../api.js';
import { TEAMS } from '../teams.js';
import ImageUpload from '../components/ImageUpload.jsx';
import MemberCard from '../components/MemberCard.jsx';

const blank = { name: '', role: '', image: '', linkedin: '', github: '', isLead: false };

export default function AdminTeams({ demo }) {
  const [slug, setSlug] = useState('coreTeam');
  const [doc, setDoc] = useState({ leads: [], members: [] });
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const load = () => request(`/api/team/${slug}`).then(setDoc).catch(() => {});
  useEffect(() => { setEditId(null); setF(blank); load(); }, [slug]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      if (editId) await request(`/api/admin/members/${editId}`, { method: 'PUT', body: f });
      else await request(`/api/admin/team/${slug}`, { method: 'POST', body: f });
      setF(blank); setEditId(null); setMsg('Saved ✔'); load();
    } catch (x) { setMsg(x.message); }
  };
  const del = async (m) => { if (confirm(`Delete ${m.name}?`)) { await request(`/api/admin/members/${m.id}`, { method: 'DELETE' }); load(); } };
  const move = async (m, dir) => { await request(`/api/admin/members/${m.id}/move`, { method: 'POST', body: { dir } }); load(); };
  const edit = (m) => { setEditId(m.id); setF({ name: m.name, role: m.role, image: m.image, linkedin: m.linkedin || '', github: m.github || '', isLead: !!m.isLead || doc.leads.some((x) => x.id === m.id) }); scrollTo(0, 0); };
  const seed = async () => { await request('/api/admin/seed-demo', { method: 'POST' }); load(); setMsg('Demo data loaded'); };

  const Row = ({ m, lead }) => (
    <MemberCard m={m} lead={lead}>
      <div className="row tools">
        <button className="btn ghost" onClick={() => move(m, 'up')}>↑</button>
        <button className="btn ghost" onClick={() => move(m, 'down')}>↓</button>
        <button className="btn ghost" onClick={() => edit(m)}>Edit</button>
        <button className="btn ghost danger" onClick={() => del(m)}>Delete</button>
      </div>
    </MemberCard>
  );

  return (<>
    <div className="tabs">{TEAMS.map((t) => <button key={t.slug} className={t.slug === slug ? 'active' : ''} onClick={() => setSlug(t.slug)}>{t.label}</button>)}</div>
    <form className="card form" onSubmit={save}>
      <h3>{editId ? 'Edit member' : `Add to ${TEAMS.find((t) => t.slug === slug).label}`}</h3>
      <ImageUpload value={f.image} onChange={(v) => setF({ ...f, image: v })} />
      <div className="two">
        <input placeholder="Name *" value={f.name} onChange={set('name')} required />
        <input placeholder="Role (e.g. Tech Lead)" value={f.role} onChange={set('role')} />
        <input placeholder="LinkedIn link" value={f.linkedin} onChange={set('linkedin')} />
        <input placeholder="GitHub link (optional)" value={f.github} onChange={set('github')} />
      </div>
      <label className="check"><input type="checkbox" checked={f.isLead} onChange={(e) => setF({ ...f, isLead: e.target.checked })} /> This person is a Lead</label>
      <div className="row">
        <button className="btn">{editId ? 'Update' : 'Add member'}</button>
        {editId && <button type="button" className="btn ghost" onClick={() => { setEditId(null); setF(blank); }}>Cancel</button>}
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
    {doc.leads.length > 0 && <><h3 className="sub">Leads</h3><div className="grid members">{doc.leads.map((m) => <Row key={m.id} m={m} lead />)}</div></>}
    {doc.members.length > 0 && <><h3 className="sub">Members</h3><div className="grid members">{doc.members.map((m) => <Row key={m.id} m={m} />)}</div></>}
    {!doc.leads.length && !doc.members.length && <p className="muted">Nobody here yet.</p>}
    {demo && <div className="row" style={{ marginTop: 24 }}><button className="btn ghost" onClick={seed}>Load demo data (local only)</button></div>}
  </>);
}
