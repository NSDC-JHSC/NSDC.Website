import { useState } from 'react';
import { request } from '../api.js';

export default function RegisterModal({ event, onClose }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', course: '', website: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { const d = await request(`/api/events/${event.id}/register`, { method: 'POST', body: f }); setMsg({ ok: true, text: d.message || 'Registered!' }); }
    catch (x) { setMsg({ ok: false, text: x.message }); }
    setBusy(false);
  };
  return (
    <div className="modal" onClick={onClose}>
      <form className="card form" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>Register: {event.title}</h3>
        {msg?.ok ? (<>
          <p className="ok">{msg.text}</p>
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </>) : (<>
          <input placeholder="Full name" required value={f.name} onChange={set('name')} />
          <input placeholder="Email" type="email" required value={f.email} onChange={set('email')} />
          <input placeholder="Phone (optional)" value={f.phone} onChange={set('phone')} />
          <input placeholder="Course & year (e.g. B.Sc Data Science, 2nd)" value={f.course} onChange={set('course')} />
          <input className="hp" tabIndex="-1" autoComplete="off" aria-hidden="true" placeholder="Website" value={f.website} onChange={set('website')} />
          {msg && <p className="err">{msg.text}</p>}
          <div className="row"><button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Register'}</button><button type="button" className="btn ghost" onClick={onClose}>Cancel</button></div>
        </>)}
      </form>
    </div>
  );
}
