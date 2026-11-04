// Sample data for designers / testing (only when DEMO=true in .dev.vars). Never enabled on the live site.
const A = (i) => `/mock/a${i}.svg`;
const P = (i) => `/mock/p${i}.svg`;
const m = (team, lead, name, role, i) => ({ team, lead, name, role, image: A(i) });

export const DEMO_MEMBERS = [
  m('coreTeam', 1, 'Sara Ali', 'Chapter Lead', 1), m('coreTeam', 1, 'Imran Qureshi', 'Co-Lead', 2),
  m('coreTeam', 0, 'Ayesha Khan', 'Secretary', 3), m('coreTeam', 0, 'Rahul Mehta', 'Treasurer', 4),
  m('techTeam', 1, 'Zoya Siddiqui', 'Tech Lead', 5), m('techTeam', 0, 'Danish Raza', 'Backend Developer', 6),
  m('techTeam', 0, 'Fatima Noor', 'Frontend Developer', 7), m('techTeam', 0, 'Aman Verma', 'Full-stack Developer', 8),
  m('dataScienceTeam', 1, 'Nida Hasan', 'Data Science Lead', 9), m('dataScienceTeam', 0, 'Kabir Singh', 'ML Engineer', 10),
  m('creativeTeam', 1, 'Yusuf Ansari', 'Creative Lead', 12), m('creativeTeam', 0, 'Meher Jabeen', 'Graphic Designer', 11),
  m('mediaTeam', 1, 'Imran Qureshi', 'Media Lead', 2), m('mediaTeam', 0, 'Ayesha Khan', 'Photographer', 3),
  m('contentTeam', 1, 'Zoya Siddiqui', 'Content Lead', 5), m('contentTeam', 0, 'Danish Raza', 'Documentation', 6),
  m('socialMediaTeam', 1, 'Aman Verma', 'Social Media Lead', 8), m('socialMediaTeam', 0, 'Nida Hasan', 'Community Manager', 9),
  m('managementTeam', 1, 'Kabir Singh', 'Management Lead', 10), m('managementTeam', 0, 'Meher Jabeen', 'Corporate Affairs', 11),
];

export const DEMO_EVENTS = [
  { title: 'Hack the Data 2026', tag: 'AUTO', date: '2027-01-20', timing: '10 AM – 6 PM', venue: 'Auditorium', poster: P(2), description: 'A one-day data hackathon. Teams of 3 solve real datasets.', link: 'https://www.linkedin.com/company/nsdc-jamia-hamdard/posts/', reg: 1 },
  { title: 'Data Science Bootcamp', tag: 'AUTO', date: '2026-12-25', timing: '2 PM – 5 PM', venue: 'Seminar Hall', poster: P(1), description: 'Hands-on introduction to pandas, charts and basic ML.', link: '', reg: 1 },
  { title: 'Python for Beginners', tag: 'AUTO', date: '2026-09-05', timing: '', venue: 'Lab 2', poster: P(3), description: 'Python basics for first-year students.', link: 'https://www.linkedin.com/company/nsdc-jamia-hamdard/posts/', reg: 0 },
  { title: 'Intro to Machine Learning', tag: 'AUTO', date: '2026-08-12', timing: '', venue: 'Lab 1', poster: P(4), description: 'Regression, classification and a mini project.', link: '', reg: 0 },
];

export const DEMO_STARS = [
  { month: '2026-10', type: 'lead', name: 'Sara Ali', course: 'MCA, 2nd year', team: 'Core Team', note: 'Organised three workshops this month.', image: A(1) },
  { month: '2026-10', type: 'member', name: 'Rahul Mehta', course: 'B.Tech CSE, 3rd year', team: 'Tech', note: 'Helped 20+ juniors with Python.', image: A(4) },
  { month: '2026-09', type: 'lead', name: 'Zoya Siddiqui', course: 'B.Sc Statistics', team: 'Content', note: '', image: A(5) },
  { month: '2026-09', type: 'member', name: 'Aman Verma', course: 'B.Tech IT', team: 'Social Media', note: '', image: '' },
];
