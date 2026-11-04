import { useEffect, useState } from 'react';
import { request } from '../api.js';
import { TEAMS } from '../teams.js';
import ImageUpload from '../components/ImageUpload.jsx';

const thisMonth = () => new Date().toISOString().slice(0, 7);
const blank = () => ({ month: thisMonth(), type: 'lead', name: '', course: '', team: '', note: '', image: '' });

export default function AdminStars() {
  const [list, setList] = useState([]);
  const [f, setF] = useState(blank());
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const load = () => request('/api/admin/stars').then((d) => setList(d.stars)).catch(() => {});
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      if (editId) await request(`/api/admin/stars/${editId}`, { method: 'PUT', body: f });
      else await request('/api/admin/stars', { method: 'POST', body: f });
      setF(blank()); setEditId(null); setMsg('Saved ✔'); load();
    } catch (x) { setMsg(x.message); }
  };
  const edit = (s) => { setEditId(s.id); setF({ month: s.month, type: s.type, name: s.name, course: s.course, team: s.team, note: s.note, image: s.image }); scrollTo(0, 0); };
  const del = async (s) => { if (confirm(`Delete ${s.name}?`)) { await request(`/api/admin/stars/${s.id}`, { method: 'DELETE' }); load(); } };

  return (<>
    <form className="card form" onSubmit={save}>
      <h3>{editId ? 'Edit star' : 'Add Star of the Month'}</h3>
      <ImageUpload value={f.image} onChange={(v) => setF({ ...f, image: v })} />
      <div className="two">
        <input type="month" value={f.month} onChange={set('month')} required />
        <select value={f.type} onChange={set('type')}><option value="lead">Best Active Lead</option><option value="member">Best Active Member</option></select>
        <input placeholder="Name *" value={f.name} onChange={set('name')} required />
        <input placeholder="Course (e.g. MCA, 2nd year)" value={f.course} onChange={set('course')} />
        <select value={f.team} onChange={set('team')}><option value="">Team (optional)</option>{TEAMS.map((t) => <option key={t.slug} value={t.label}>{t.label}</option>)}</select>
        <input placeholder="One-line note (optional)" value={f.note} onChange={set('note')} />
      </div>
      <p className="muted">Ek month + type ke liye sabse naya entry website pe dikhega.</p>
      <div className="row">
        <button className="btn">{editId ? 'Update' : 'Add'}</button>
        {editId && <button type="button" className="btn ghost" onClick={() => { setEditId(null); setF(blank()); }}>Cancel</button>}
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
    <div className="list">
      {list.map((s) => (
        <div className="item" key={s.id}>
          <div className="mini">{s.image ? <img src={s.image} alt="" /> : <span>{s.name[0]}</span>}</div>
          <div className="grow"><b>{s.name}</b><br /><span className="muted">{s.month} · {s.type === 'lead' ? 'Lead' : 'Member'} · {s.course}</span></div>
          <div className="row"><button className="btn ghost" onClick={() => edit(s)}>Edit</button><button className="btn ghost danger" onClick={() => del(s)}>Delete</button></div>
        </div>
      ))}
      {!list.length && <p className="muted">Nothing added yet.</p>}
    </div>
  </>);
}
