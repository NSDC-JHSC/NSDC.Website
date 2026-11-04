// Talks to the /api functions (same website, same address - no separate backend).
export const img = (u) => u || '';

export async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch(path, { method, headers, body: payload, credentials: 'same-origin' }); }
  catch { throw new Error('Cannot reach the server. Check your internet connection.'); }
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) { const e = new Error(data.error || `Request failed (${res.status})`); e.status = res.status; throw e; }
  return data;
}

// Shrinks big photos in the browser (max 1000px, WebP) so uploads are small and the site stays fast.
async function shrink(file, max) {
  if (file.type === 'image/gif' && file.size < 1.1 * 1024 * 1024) return file;
  let bmp;
  try { bmp = await createImageBitmap(file); } catch { return file; }
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const toBlob = (q) => new Promise((r) => canvas.toBlob(r, 'image/webp', q));
  let blob = await toBlob(0.82);
  if (blob && blob.size > 1.1 * 1024 * 1024) blob = await toBlob(0.55);
  return blob && blob.type === 'image/webp' ? blob : file;
}

export async function uploadImage(file, max = 1000) {
  const blob = await shrink(file, max);
  const form = new FormData();
  form.append('image', blob, 'photo.webp');
  return (await request('/api/admin/images', { method: 'POST', form })).url;
}
