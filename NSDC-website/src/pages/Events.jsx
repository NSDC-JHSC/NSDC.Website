import { useEffect, useState } from 'react';
import { request } from '../api.js';
import { useSite } from '../site.jsx';
import EventCard from '../components/EventCard.jsx';
import RegisterModal from '../components/RegisterModal.jsx';

const FILTERS = ['ALL', 'UPCOMING', 'ONGOING', 'PAST'];

export default function Events() {
  const { settings } = useSite();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [reg, setReg] = useState(null);
  useEffect(() => { request('/api/events').then((d) => setEvents(d.events || [])).catch(() => {}); }, []);
  const list = events.filter((e) => filter === 'ALL' || e.tag === filter);
  const posts = settings.linkedin ? `${settings.linkedin.replace(/\/$/, '')}/posts/?feedView=all` : '';

  return (
    <section className="section">
      <div className="section-head"><h2>Events</h2>{posts && <a href={posts} target="_blank" rel="noreferrer">See event posts on LinkedIn ↗</a>}</div>
      <div className="tabs">
        {FILTERS.map((f) => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f[0] + f.slice(1).toLowerCase()}</button>)}
      </div>
      <div className="grid events">
        {list.map((e) => (
          <EventCard key={e.id} e={e}>
            {e.regOpen && e.tag !== 'PAST' && <button className="btn" onClick={() => setReg(e)}>Register</button>}
          </EventCard>
        ))}
      </div>
      {!list.length && <p className="muted">No events here yet.</p>}
      {reg && <RegisterModal event={reg} onClose={() => setReg(null)} />}
    </section>
  );
}
