import { img } from '../api.js';

export default function Avatar({ src, name = '', size = 48 }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {src ? <img src={img(src)} alt={name} loading="lazy" /> : initials}
    </span>
  );
}
