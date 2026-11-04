import { img } from '../api.js';

export default function EventCard({ e, children }) {
  return (
    <article className="event">
      <div className="poster">
        {e.poster ? <img src={img(e.poster)} alt={e.title} loading="lazy" /> : <span>{(e.title || 'E')[0]}</span>}
        <span className={`tag ${String(e.tag).toLowerCase()}`}>{e.tag}</span>
      </div>
      <div className="body">
        <h3>{e.title}</h3>
        <p className="meta">{[e.date, e.timing, e.venue].filter(Boolean).join(' · ')}</p>
        {e.desc && <p className="desc">{e.desc}</p>}
        <div className="row">
          {e.link && <a className="btn ghost" href={e.link} target="_blank" rel="noreferrer">{e.tag === 'PAST' ? 'View post' : 'Details'} ↗</a>}
          {children}
        </div>
      </div>
    </article>
  );
}
