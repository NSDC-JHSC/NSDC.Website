import { useEffect, useState } from 'react';
import { request } from '../api.js';
import Avatar from '../components/Avatar.jsx';

const monthName = (m) => {
  const [y, mo] = (m || '').split('-');
  return y && mo ? new Date(Number(y), Number(mo) - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' }) : m;
};

function StarCard({ s, title }) {
  return (
    <div className="star">
      <span className="eyebrow">{title}</span>
      <Avatar src={s?.image} name={s?.name} size={150} />
      {s ? (<>
        <h3>{s.name}</h3>
        <p className="course">{s.course}</p>
        {s.team && <span className="chip">{s.team}</span>}
        {s.note && <p className="note">“{s.note}”</p>}
      </>) : <p className="muted">To be announced</p>}
    </div>
  );
}

export default function Stars() {
  const [stars, setStars] = useState([]);
  const [month, setMonth] = useState('');
  useEffect(() => {
    request('/api/stars').then((d) => { setStars(d.stars || []); setMonth(d.stars?.[0]?.month || ''); }).catch(() => {});
  }, []);
  const months = [...new Set(stars.map((s) => s.month))];
  const lead = stars.find((s) => s.month === month && s.type === 'lead');
  const member = stars.find((s) => s.month === month && s.type === 'member');
  return (
    <section className="section">
      <div className="section-head"><h2>Stars of the Month</h2></div>
      {months.length > 1 && <div className="tabs">{months.map((m) => <button key={m} className={m === month ? 'active' : ''} onClick={() => setMonth(m)}>{monthName(m)}</button>)}</div>}
      {month ? (<>
        <p className="muted">{monthName(month)} — recognising the most active people in our chapter.</p>
        <div className="stars"><StarCard s={lead} title="⭐ Best Active Lead" /><StarCard s={member} title="⭐ Best Active Member" /></div>
      </>) : <p className="muted">Stars of the month will be announced soon.</p>}
    </section>
  );
}
