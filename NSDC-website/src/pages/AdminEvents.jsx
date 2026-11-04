import { useEffect, useState } from 'react';
import { request } from '../api.js';
import ImageUpload from '../components/ImageUpload.jsx';

const blank = { title: '', tag: 'AUTO', date: '', timing: '', venue: '', desc: '', poster: '', link: '', regOpen: false };

export default function AdminEvents() {
  const [list, setList] = useState([]);
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [regs, setRegs] = useState(null);
  const load = () => request('/api/admin/events').then((d) => setList(d.events)).catch(() => {});
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      if (editId) await request(`/api/admin/events/${editId}`, { method: 'PUT', body: f });
      else await request('/api/admin/events', { method: 'POST', body: f });
      setF(blank); setEditId(null); setMsg('Saved ✔'); load();
    } catch (x) { setMsg(x.message); }
  };
  const edit = (e) => { setEditId(e.id); setF({ title: e.title, tag: e.rawTag, date: e.date, timing: e.timing, venue: e.venue, desc: e.desc, poster: e.poster, link: e.link, regOpen: !!e.regOpen }); scrollTo(0, 0); };
  const del = async (e) => { if (confirm(`Delete "${e.title}" and its registrations?`)) { await request(`/api/admin/events/${e.id}`, { method: 'DELETE' }); load(); } };
  const showRegs = async (e) => setRegs({ event: e, rows: (await request(`/api/admin/events/${e.id}/registrations`)).registrations });
  const delReg = async (r) => { await request(`/api/admin/registrations/${r.id}`, { method: 'DELETE' }); setRegs({ ...regs, rows: regs.rows.filter((x) => x.id !== r.id) }); load(); };

  return (<>
    <form className="card form" onSubmit={save}>
      <h3>{editId ? 'Edit event' : 'Add event'}</h3>
      <ImageUpload value={f.poster} onChange={(v) => setF({ ...f, poster: v })} label="poster" max={1400} />
      <div className="two">
        <input placeholder="Title *" value={f.title} onChange={set('title')} required />
        <input type="date" value={f.date} onChange={set('date')} />
        <input placeholder="Timing (e.g. 10 AM – 1 PM)" value={f.timing} onChange={set('timing')} />
        <input placeholder="Venue" value={f.venue} onChange={set('venue')} />
        <input placeholder="Link (LinkedIn post / details)" value={f.link} onChange={set('link')} />
        <select value={f.tag} onChange={set('tag')}>
          <option value="AUTO">Status: Automatic (by date)</option><option value="UPCOMING">Upcoming</option>
          <option value="ONGOING">Ongoing</option><option value="PAST">Past</option>
        </select>
      </div>
      <textarea rows="3" placeholder="Description" value={f.desc} onChange={set('desc')} />
      <label className="check"><input type="checkbox" checked={f.regOpen} onChange={(e) => setF({ ...f, regOpen: e.target.checked })} /> Registration form open</label>
      <div className="row">
        <button className="btn">{editId ? 'Update' : 'Add event'}</button>
        {editId && <button type="button" className="btn ghost" onClick={() => { setEditId(null); setF(blank); }}>Cancel</button>}
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>

    <div className="list">
      {list.map((e) => (
        <div className="item" key={e.id}>
          <div className="mini">{e.poster ? <img src={e.poster} alt="" /> : <span>{e.title[0]}</span>}</div>
          <div className="grow"><b>{e.title}</b><br /><span className="muted">{e.date} · {e.tag} · {e.regCount} registered</span></div>
          <div className="row">
            {e.regOpen || e.regCount > 0 ? <button className="btn ghost" onClick={() => showRegs(e)}>Registrations</button> : null}
            <button className="btn ghost" onClick={() => edit(e)}>Edit</button>
            <button className="btn ghost danger" onClick={() => del(e)}>Delete</button>
          </div>
        </div>
      ))}
      {!list.length && <p className="muted">No events yet.</p>}
    </div>

    {regs && (
      <div className="modal" onClick={() => setRegs(null)}>
        <div className="card" onClick={(e) => e.stopPropagation()}>
          <h3>{regs.event.title} — registrations ({regs.rows.length})</h3>
          <div className="row"><a className="btn" href={`/api/admin/events/${regs.event.id}/registrations.csv`}>Download CSV (Excel)</a><button className="btn ghost" onClick={() => setRegs(null)}>Close</button></div>
          <div className="list">
            {regs.rows.map((r) => (
              <div className="item" key={r.id}>
                <div className="grow"><b>{r.name}</b><br /><span className="muted">{[r.email, r.phone, r.course].filter(Boolean).join(' · ')}</span></div>
                <button className="btn ghost danger" onClick={() => delReg(r)}>✕</button>
              </div>
            ))}
            {!regs.rows.length && <p className="muted">No registrations yet.</p>}
          </div>
        </div>
      </div>
    )}
  </>);
}
