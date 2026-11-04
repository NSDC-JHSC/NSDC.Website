import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { request } from '../api.js';
import { TEAMS } from '../teams.js';
import MemberCard from '../components/MemberCard.jsx';

export default function Team() {
  const { slug = 'coreTeam' } = useParams();
  const [doc, setDoc] = useState(null);
  useEffect(() => {
    setDoc(null);
    request(`/api/team/${slug}`).then(setDoc).catch(() => setDoc({ leads: [], members: [] }));
  }, [slug]);
  const label = TEAMS.find((t) => t.slug === slug)?.label || '';

  return (
    <section className="section">
      <div className="section-head"><h2>Our Team</h2></div>
      <div className="tabs">
        {TEAMS.map((t) => <Link key={t.slug} to={`/team/${t.slug}`} className={t.slug === slug ? 'active' : ''}>{t.label}</Link>)}
      </div>
      {!doc ? <p className="muted">Loading…</p> : (<>
        {doc.leads.length > 0 && (<><h3 className="sub">{label} — Leads</h3><div className="grid members">{doc.leads.map((m) => <MemberCard key={m.id} m={m} lead />)}</div></>)}
        {doc.members.length > 0 && (<><h3 className="sub">{label} — Members</h3><div className="grid members">{doc.members.map((m) => <MemberCard key={m.id} m={m} />)}</div></>)}
        {!doc.leads.length && !doc.members.length && <p className="muted">No one added to this team yet.</p>}
      </>)}
    </section>
  );
}
