import { useState } from 'react';
import { uploadImage, img } from '../api.js';

export default function ImageUpload({ value, onChange, label = 'photo', max = 1000 }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr('');
    try { onChange(await uploadImage(f, max)); } catch (x) { setErr(x.message); }
    setBusy(false); e.target.value = '';
  };
  return (
    <div className="upload">
      <div className="thumb">{value ? <img src={img(value)} alt="" /> : <span>No {label}</span>}</div>
      <div>
        <label className="btn ghost">
          {busy ? 'Uploading…' : `${value ? 'Change' : 'Upload'} ${label}`}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={pick} disabled={busy} />
        </label>
        {value && <button type="button" className="btn ghost danger" onClick={() => onChange('')}>Remove</button>}
        {err && <p className="err">{err}</p>}
      </div>
    </div>
  );
}
