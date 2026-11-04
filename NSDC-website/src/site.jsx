import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { request, img } from './api.js';

const Ctx = createContext({ settings: {}, reload: () => {} });
export const useSite = () => useContext(Ctx);

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState({});
  const reload = useCallback(() => request('/api/settings').then((d) => setSettings(d.settings || {})).catch(() => {}), []);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    if (!settings.logo) return;
    let l = document.querySelector("link[rel='icon']");
    if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); }
    l.href = img(settings.logo);
  }, [settings.logo]);
  return <Ctx.Provider value={{ settings, reload }}>{children}</Ctx.Provider>;
}

export function Logo({ size = 36 }) {
  const { settings } = useSite();
  return settings.logo ? <img className="logo" src={img(settings.logo)} alt="NSDC logo" style={{ height: size }} /> : <span className="dot" />;
}
