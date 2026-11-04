import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../api.js';
import { Logo, useSite } from '../site.jsx';
import EventCard from '../components/EventCard.jsx';

export default function Home() {
  const { settings } = useSite();
  const [events, setEvents] = useState([]);
  useEffect(() => { request('/api/events').then((d) => setEvents(d.events || [])).catch(() => {}); }, []);
  const upcoming = events.filter((e) => e.tag !== 'PAST');
  const past = events.filter((e) => e.tag === 'PAST').length;
  const linkedin = settings.linkedin || '';
  const about = (settings.about || '').split(/\n\s*\n/).filter(Boolean);

  return (
    <>
      <section className="hero">
        <div className="hero-logo"><Logo size={84} /></div>
        <p className="eyebrow">National Student Data Corps · Jamia Hamdard Chapter</p>
        <h1>Learn data. Build it.<br />Grow with <span className="gold">NSDC</span>.</h1>
        <p className="lead-text">{settings.hero_sub}</p>
        <div className="row">
          <Link className="btn" to="/events">See events</Link>
          <Link className="btn ghost" to="/team">Meet the team</Link>
          {linkedin && <a className="btn ghost" href={linkedin} target="_blank" rel="noreferrer">Follow on LinkedIn ↗</a>}
        </div>
        <div className="stats">
          <div><b>{upcoming.length}</b><span>live &amp; upcoming</span></div>
          <div><b>{past}</b><span>past events</span></div>
          <div><b>8</b><span>teams</span></div>
          <div><b>9,000+</b><span>members worldwide</span></div>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Upcoming events</h2><Link to="/events">All events →</Link></div>
        {upcoming.length ? (
          <div className="grid events">{upcoming.slice(0, 3).map((e) => <EventCard key={e.id} e={e} />)}</div>
        ) : <p className="muted">No upcoming events right now — check back soon.</p>}
      </section>

      <section className="section about">
        <div className="section-head"><h2>About NSDC Jamia Hamdard</h2></div>
        <div className="about-grid">{about.map((p, i) => <p key={i}>{p}</p>)}</div>
        {linkedin && (
          <div className="row">
            <a className="btn" href={linkedin} target="_blank" rel="noreferrer">Our LinkedIn page ↗</a>
            <a className="btn ghost" href={`${linkedin.replace(/\/$/, '')}/posts/?feedView=all`} target="_blank" rel="noreferrer">Latest posts ↗</a>
          </div>
        )}
      </section>
    </>
  );
}
