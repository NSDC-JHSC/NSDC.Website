import { img } from '../api.js';

export default function MemberCard({ m, lead, children }) {
  const initials = (m.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`member ${lead ? 'lead' : ''}`}>
      <div className="photo">{m.image ? <img src={img(m.image)} alt={m.name} loading="lazy" /> : <span>{initials}</span>}</div>
      <h4>{m.name}</h4>
      <p>{m.role}</p>
      <div className="social">
        {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
        {m.github && <a href={m.github} target="_blank" rel="noreferrer">GitHub</a>}
      </div>
      {children}
    </div>
  );
}
