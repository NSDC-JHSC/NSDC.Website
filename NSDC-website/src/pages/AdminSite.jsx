import { useState } from 'react';
import { request } from '../api.js';
import { useSite } from '../site.jsx';
import ImageUpload from '../components/ImageUpload.jsx';

export default function AdminSite() {
  const { settings, reload } = useSite();
  const [f, setF] = useState({ logo: settings.logo || '', linkedin: settings.linkedin || '', hero_sub: settings.hero_sub || '', about: settings.about || '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setMsg('');
    try { const d = await request('/api/admin/settings', { method: 'PUT', body: f }); reload(); setMsg('Saved ✔'); }
    catch (x) { setMsg(x.message); }
  };
  const cleanup = async () => {
    const d = await request('/api/admin/images/cleanup', { method: 'POST' });
    setMsg(`${d.removed} unused photo(s) removed`);
  };
  return (
    <form className="card form" onSubmit={save}>
      <h3>Logo & site text</h3>
      <ImageUpload value={f.logo} onChange={(v) => setF({ ...f, logo: v })} label="logo" max={600} />
      <input placeholder="LinkedIn page link" value={f.linkedin} onChange={set('linkedin')} />
      <input placeholder="Short line under the main heading" value={f.hero_sub} onChange={set('hero_sub')} />
      <textarea rows="10" placeholder="About text (blank line = new paragraph)" value={f.about} onChange={set('about')} />
      <div className="row">
        <button className="btn">Save</button>
        <button type="button" className="btn ghost" onClick={cleanup}>Delete unused photos</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
  );
}
