import { db, uid } from './db.js';
import * as X from './export.js';
import * as S from './speech.js';

const APP_VERSION = '1.0.0';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const view = $('#view');
const topbar = $('#topbar');
const bottombar = $('#bottombar');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const fmtDateTime = ts => ts ? new Date(ts).toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' }) : '';

/* ------------------------------------------------------------------ Icons */

const I = {
  camera: '<path d="M14.5 4h-5L7.5 6.5H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  text: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  rec: '<circle cx="12" cy="12" r="6"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14M10 11v6M14 11v6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  print: '<path d="M6 9V2h12v7"/><rect x="2" y="9" width="20" height="9" rx="2"/><path d="M6 14h12v8H6z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  zip: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  txt: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M12 13v6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5M5 21h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  report: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="10" cy="14" r="2"/><path d="m20 20-4-4-6 6"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

/* ------------------------------------------------------------------ Settings */

const LANGS = [
  ['de-CH', 'Deutsch (Schweiz)'], ['de-DE', 'Deutsch (Deutschland)'], ['de-AT', 'Deutsch (Österreich)'],
  ['fr-CH', 'Français (Suisse)'], ['it-CH', 'Italiano (Svizzera)'], ['en-GB', 'English (UK)'], ['en-US', 'English (US)'],
];

const settings = (() => {
  const def = { author: '', lang: (navigator.language || '').toLowerCase() === 'de-de' ? 'de-DE' : 'de-CH' };
  try { return { ...def, ...JSON.parse(localStorage.getItem('fb-settings') || '{}') }; } catch { return def; }
})();
function saveSettings() {
  try { localStorage.setItem('fb-settings', JSON.stringify(settings)); } catch { /* private mode */ }
}

/* ------------------------------------------------------------------ UI helpers */

let toastTimer;
function toast(msg, ms = 3200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

const dlg = $('#dialog');
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

/**
 * Shows a modal sheet. Resolves with the chosen action's value (or null when dismissed).
 * onMount(dialogEl, closeWith) can wire custom content.
 */
function showDialog({ title, html = '', actions = [{ label: 'OK', value: true, primary: true }], onMount }) {
  return new Promise(resolve => {
    let override = null;
    dlg.innerHTML = `
      <form method="dialog" class="sheet-inner">
        <header class="sheet-head"><h2>${esc(title)}</h2>
          <button type="button" class="icon-btn" data-close aria-label="Schliessen">${icon('x')}</button></header>
        <div class="sheet-body">${html}</div>
        ${actions.length ? `<footer class="sheet-actions">${actions.map((a, i) =>
          `<button class="btn ${a.primary ? 'primary' : ''} ${a.danger ? 'danger' : ''}" value="${i}">${esc(a.label)}</button>`).join('')}</footer>` : ''}
      </form>`;
    const closeWith = v => { override = { v }; dlg.close(); };
    $('[data-close]', dlg).onclick = () => closeWith(null);
    const onClose = () => {
      dlg.removeEventListener('close', onClose);
      if (override) return resolve(override.v);
      const i = dlg.returnValue;
      resolve(i !== '' && actions[+i] ? actions[+i].value : null);
    };
    dlg.addEventListener('close', onClose);
    dlg.returnValue = '';
    if (onMount) onMount(dlg, closeWith);
    dlg.showModal();
  });
}

const confirmDialog = (title, text, okLabel = 'OK', danger = false) => showDialog({
  title, html: `<p>${text}</p>`,
  actions: [{ label: 'Abbrechen', value: false }, { label: okLabel, value: true, primary: !danger, danger }],
});

function autosize(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 2 + 'px';
}

/* ------------------------------------------------------------------ Blob URL cache */

const urlCache = new Map();
async function blobUrl(id) {
  if (!urlCache.has(id)) {
    const blob = await db.getBlob(id);
    if (!blob) return '';
    urlCache.set(id, URL.createObjectURL(blob));
  }
  return urlCache.get(id);
}
function revokeUrl(id) {
  if (urlCache.has(id)) { URL.revokeObjectURL(urlCache.get(id)); urlCache.delete(id); }
}
function revokeAll() {
  for (const u of urlCache.values()) URL.revokeObjectURL(u);
  urlCache.clear();
}

/* ------------------------------------------------------------------ State + saving */

let current = null;
let saveTimer = null;

function setSaveState(text) {
  const el = $('#saveState');
  if (el) el.textContent = text;
}

function scheduleSave() {
  setSaveState('Speichert …');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveNow(), 500);
}

async function saveNow(report = current) {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!report) return;
  report.updatedAt = Date.now();
  try {
    await db.putReport(report);
    if (report === current) setSaveState('Gespeichert');
  } catch (e) {
    setSaveState('Fehler beim Speichern!');
    toast('Speichern fehlgeschlagen: ' + (e.message || e));
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && saveTimer) saveNow();
});
window.addEventListener('pagehide', () => { if (saveTimer) saveNow(); });

const findEntry = id => current && current.entries.find(e => e.id === id);
const entryCard = id => $(`.entry[data-id="${CSS.escape(id)}"]`);

/* ------------------------------------------------------------------ Router */

window.addEventListener('hashchange', route);

async function route() {
  stopDictation();
  await stopRecording();
  if (current && saveTimer) await saveNow(current);

  const m = location.hash.match(/^#\/r\/(.+)$/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    if (!current || current.id !== id) {
      revokeAll();
      current = await db.getReport(id);
    }
    if (current) return renderEditor();
    location.replace('#/');
    return;
  }
  current = null;
  revokeAll();
  renderList();
}

/* ------------------------------------------------------------------ List view */

let installEvt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installEvt = e;
  if (!current) renderListTopbar();
});

function renderListTopbar() {
  topbar.innerHTML = `
    <div class="brand"><img src="icons/icon.svg" alt="" width="28" height="28"><span>Fotobericht</span></div>
    <div class="spacer"></div>
    ${installEvt ? `<button class="btn small" data-act="install">${icon('download')}Installieren</button>` : ''}
    <button class="icon-btn" data-act="settings" aria-label="Einstellungen">${icon('gear')}</button>`;
}

function reportCard(r) {
  const photos = r.entries.filter(e => e.photoId);
  const thumb = photos[0]?.photoId;
  const meta = [X.formatDate(r.date), r.location].filter(Boolean).map(esc).join(' · ');
  return `
    <li><a class="report-card" href="#/r/${encodeURIComponent(r.id)}" data-search="${esc(((r.title || '') + ' ' + (r.location || '')).toLowerCase())}">
      <div class="thumb">${thumb ? `<img data-thumb="${esc(thumb)}" alt="">` : icon('report')}</div>
      <div class="rc-body">
        <strong>${esc(r.title || 'Ohne Titel')}</strong>
        <span class="rc-meta">${meta || '&nbsp;'}</span>
        <span class="rc-meta">${photos.length} Foto${photos.length === 1 ? '' : 's'} · ${r.entries.length} Position${r.entries.length === 1 ? '' : 'en'}</span>
      </div>
      <span class="badge ${r.status === 'closed' ? 'done' : 'open'}">${r.status === 'closed' ? 'Abgeschlossen' : 'Offen'}</span>
    </a></li>`;
}

async function renderList() {
  document.title = 'Fotobericht';
  renderListTopbar();
  const reports = (await db.allReports()).sort((a, b) =>
    (b.date || '').localeCompare(a.date || '') || (b.updatedAt || 0) - (a.updatedAt || 0));
  const open = reports.filter(r => r.status !== 'closed');
  const closed = reports.filter(r => r.status === 'closed');

  view.innerHTML = `
    ${reports.length === 0 ? `
      <div class="empty">
        <img src="icons/icon.svg" alt="" width="72" height="72">
        <h2>Willkommen bei Fotobericht</h2>
        <p>Erfasse Berichte mit Fotos und gesprochenem Text – auch ohne Internet. Alles wird nur auf diesem Gerät gespeichert.</p>
        <ol class="steps">
          <li><strong>Neuer Bericht</strong> – Titel und Datum eingeben</li>
          <li><strong>Foto</strong> aufnehmen und Beschreibung <strong>diktieren</strong></li>
          <li><strong>Abschliessen</strong> und als Word, PDF oder ZIP exportieren</li>
        </ol>
      </div>` : ''}
    ${reports.length > 5 ? `<label class="search">${icon('search')}<input type="search" id="search" placeholder="Berichte durchsuchen" autocomplete="off"></label>` : ''}
    ${open.length ? `<h2 class="section-title">In Bearbeitung</h2><ul class="report-list">${open.map(reportCard).join('')}</ul>` : ''}
    ${closed.length ? `<h2 class="section-title">Abgeschlossen</h2><ul class="report-list">${closed.map(reportCard).join('')}</ul>` : ''}
  `;
  bottombar.innerHTML = `<button class="btn primary wide" data-act="new">${icon('plus')}Neuer Bericht</button>`;

  for (const img of $$('img[data-thumb]', view)) blobUrl(img.dataset.thumb).then(u => { if (u) img.src = u; });
  const search = $('#search');
  if (search) search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    for (const a of $$('.report-card', view)) a.parentElement.hidden = q && !a.dataset.search.includes(q);
  });
}

async function newReport() {
  const r = {
    id: uid(), title: '', date: today(), location: '', author: settings.author || '',
    status: 'open', createdAt: Date.now(), updatedAt: Date.now(), entries: [],
  };
  await db.putReport(r);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  focusTitleOnRender = true;
  location.hash = '#/r/' + encodeURIComponent(r.id);
}

/* ------------------------------------------------------------------ Editor view */

let focusTitleOnRender = false;

function renderEditor() {
  const r = current;
  const closed = r.status === 'closed';
  const dis = closed ? 'disabled' : '';
  document.title = (r.title || 'Bericht') + ' – Fotobericht';

  topbar.innerHTML = `
    <button class="icon-btn" data-act="home" aria-label="Zur Übersicht">${icon('back')}</button>
    <div class="topbar-title"><span>${closed ? 'Abgeschlossen' : 'Bericht'}</span><small id="saveState">${closed ? 'Schreibgeschützt' : 'Gespeichert'}</small></div>
    <button class="icon-btn" data-act="export" aria-label="Exportieren">${icon('share')}</button>`;

  view.innerHTML = `
    ${closed ? `
      <div class="banner">${icon('lock')}
        <div><strong>Abgeschlossen</strong><br><small>${esc(fmtDateTime(r.closedAt))}</small></div>
        <button class="btn small" data-act="reopen">Bearbeiten</button>
      </div>` : ''}
    <section class="card meta">
      <label class="field"><span>Titel</span>
        <input id="f-title" class="title-input" value="${esc(r.title)}" placeholder="z.B. Begehung Baustelle Nord" ${dis} autocomplete="off" enterkeyhint="next"></label>
      <div class="row2">
        <label class="field"><span>Datum</span><input type="date" id="f-date" value="${esc(r.date)}" ${dis}></label>
        <label class="field"><span>Ort / Objekt</span><input id="f-location" value="${esc(r.location)}" placeholder="optional" ${dis} autocomplete="off"></label>
      </div>
      <label class="field"><span>Verfasst von</span><input id="f-author" value="${esc(r.author)}" placeholder="optional" ${dis} autocomplete="name"></label>
    </section>
    <div id="entries" class="entries"></div>
    <div class="editor-foot">
      ${closed
        ? `<button class="btn primary wide" data-act="export">${icon('share')}Exportieren</button>`
        : `<button class="btn success wide" data-act="close">${icon('check')}Bericht abschliessen</button>`}
      <button class="btn ghost danger-text" data-act="delete-report">${icon('trash')}Bericht löschen</button>
    </div>`;

  bottombar.innerHTML = closed
    ? `<button class="btn wide" data-act="new">${icon('plus')}Neuer Bericht</button>`
    : `<button class="tool" data-act="gallery">${icon('image')}<span>Galerie</span></button>
       <button class="tool main" data-act="camera">${icon('camera')}<span>Foto</span></button>
       <button class="tool" data-act="add-text">${icon('text')}<span>Text</span></button>`;

  renderEntries();
  if (focusTitleOnRender) {
    focusTitleOnRender = false;
    $('#f-title').focus();
  }
}

function entryHTML(e, i, n, closed) {
  const text = e.text || '';
  return `
  <article class="entry card" data-id="${esc(e.id)}">
    <header class="entry-head">
      <span class="pos">Position ${i + 1}</span><span class="time">${X.formatTime(e.createdAt)}</span>
      <span class="spacer"></span>
      ${closed ? '' : `
        <button class="icon-btn sm" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Nach oben">${icon('up')}</button>
        <button class="icon-btn sm" data-act="down" ${i === n - 1 ? 'disabled' : ''} aria-label="Nach unten">${icon('down')}</button>
        <button class="icon-btn sm danger-text" data-act="delete-entry" aria-label="Position löschen">${icon('trash')}</button>`}
    </header>
    ${e.photoId
      ? `<button class="photo" data-act="zoom" aria-label="Foto vergrössern"><img data-photo="${esc(e.photoId)}" alt="Foto ${i + 1}" width="${e.photoW || 4}" height="${e.photoH || 3}"></button>`
      : closed ? '' : `<button class="add-photo" data-act="add-photo">${icon('camera')}Foto hinzufügen</button>`}
    ${closed
      ? `<p class="entry-readonly">${text.trim() ? esc(text) : '<span class="muted">Kein Text</span>'}</p>`
      : `<textarea class="entry-text" rows="2" placeholder="Beschreibung diktieren oder tippen …" enterkeyhint="enter">${esc(text)}</textarea>
         <div class="interim" hidden></div>
         <div class="entry-actions">
           <button class="btn mic" data-act="dictate">${icon('mic')}<span>Diktieren</span></button>
           <button class="btn rec" data-act="record">${icon('rec', 'fill')}<span>${e.audioId ? 'Neu aufnehmen' : 'Sprachnotiz'}</span></button>
         </div>`}
    ${e.audioId ? `
      <div class="audio-row"><audio controls preload="metadata" data-audio="${esc(e.audioId)}"></audio>
        ${closed ? '' : `<button class="icon-btn sm danger-text" data-act="delete-audio" aria-label="Sprachnotiz löschen">${icon('trash')}</button>`}
      </div>` : ''}
  </article>`;
}

function renderEntries() {
  const r = current;
  const closed = r.status === 'closed';
  const box = $('#entries');
  if (!r.entries.length) {
    box.innerHTML = closed
      ? '<div class="empty-entries"><p>Dieser Bericht enthält keine Positionen.</p></div>'
      : `<div class="empty-entries">
          <p><strong>Noch keine Positionen.</strong></p>
          <p>Tippe unten auf <strong>Foto</strong>, um ein Bild aufzunehmen, und diktiere danach die Beschreibung.
          Mit <strong>Text</strong> legst du eine Position ohne Foto an.</p>
        </div>`;
  } else {
    box.innerHTML = r.entries.map((e, i) => entryHTML(e, i, r.entries.length, closed)).join('');
  }
  for (const img of $$('img[data-photo]', box)) blobUrl(img.dataset.photo).then(u => { if (u) img.src = u; });
  for (const au of $$('audio[data-audio]', box)) blobUrl(au.dataset.audio).then(u => { if (u) au.src = u; });
  requestAnimationFrame(() => $$('textarea', box).forEach(autosize));
  updateMediaButtons();
}

/* ------------------------------------------------------------------ Events */

document.addEventListener('click', async ev => {
  const btn = ev.target.closest('[data-act]');
  if (!btn || btn.disabled) return;
  const act = btn.dataset.act;
  const entryId = btn.closest('.entry')?.dataset.id;

  switch (act) {
    case 'new': return newReport();
    case 'home': location.hash = '#/'; return;
    case 'settings': return openSettings();
    case 'install': return doInstall();
    case 'camera': photoTarget = null; return $('#cameraInput').click();
    case 'gallery': photoTarget = null; return $('#galleryInput').click();
    case 'add-photo': photoTarget = entryId; return $('#cameraInput').click();
    case 'add-text': return addTextEntry();
    case 'up': return moveEntry(entryId, -1);
    case 'down': return moveEntry(entryId, 1);
    case 'delete-entry': return deleteEntry(entryId);
    case 'delete-audio': return deleteAudio(entryId);
    case 'dictate': return toggleDictation(entryId);
    case 'record': return toggleRecording(entryId);
    case 'zoom': return openLightbox(btn.querySelector('img')?.src);
    case 'close': return closeReport();
    case 'reopen': return reopenReport();
    case 'delete-report': return deleteReport();
    case 'export': return openExport();
  }
});

view.addEventListener('input', ev => {
  const t = ev.target;
  if (!current) return;
  if (t.classList.contains('entry-text')) {
    const e = findEntry(t.closest('.entry').dataset.id);
    if (e) { e.text = t.value; autosize(t); scheduleSave(); }
    return;
  }
  const map = { 'f-title': 'title', 'f-date': 'date', 'f-location': 'location', 'f-author': 'author' };
  if (map[t.id]) {
    current[map[t.id]] = t.value;
    if (t.id === 'f-author') { settings.author = t.value; saveSettings(); }
    if (t.id === 'f-title') document.title = (t.value || 'Bericht') + ' – Fotobericht';
    scheduleSave();
  }
});

view.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.id === 'f-title') { ev.preventDefault(); $('#f-location')?.focus(); }
});

/* ------------------------------------------------------------------ Photos */

let photoTarget = null;

for (const id of ['cameraInput', 'galleryInput']) {
  const input = $('#' + id);
  input.addEventListener('change', async () => {
    const files = [...input.files];
    input.value = '';
    if (files.length) await handlePhotos(files);
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht gelesen werden'));
    img.src = url;
  });
}

/** Scales the photo down (max 2000 px) and stores it as JPEG to save space. */
async function processPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const max = 2000;
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * s);
    const h = Math.round(img.naturalHeight * s);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85));
    if (!blob) throw new Error('Bild konnte nicht umgewandelt werden');
    return { blob, w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function handlePhotos(files) {
  if (!current || current.status === 'closed') return;
  const report = current;
  let lastId = null;
  if (files.length > 1) toast(`${files.length} Fotos werden verarbeitet …`);
  for (const f of files) {
    try {
      const { blob, w, h } = await processPhoto(f);
      const photoId = uid();
      await db.putBlob(photoId, blob);
      const target = photoTarget && report.entries.find(e => e.id === photoTarget);
      if (target) {
        target.photoId = photoId; target.photoW = w; target.photoH = h;
        lastId = target.id;
        photoTarget = null;
      } else {
        const e = { id: uid(), photoId, photoW: w, photoH: h, text: '', createdAt: Date.now() };
        report.entries.push(e);
        lastId = e.id;
      }
    } catch (err) {
      toast('Foto konnte nicht gespeichert werden: ' + err.message);
    }
  }
  photoTarget = null;
  await saveNow(report);
  if (current === report) {
    renderEntries();
    if (lastId) entryCard(lastId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ------------------------------------------------------------------ Entries */

async function addTextEntry() {
  const e = { id: uid(), text: '', createdAt: Date.now() };
  current.entries.push(e);
  // Render and focus synchronously (iOS only opens the keyboard inside the tap), then save.
  renderEntries();
  const card = entryCard(e.id);
  card?.querySelector('textarea')?.focus({ preventScroll: true });
  card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await saveNow();
}

async function moveEntry(id, dir) {
  const list = current.entries;
  const i = list.findIndex(e => e.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await saveNow();
  renderEntries();
  entryCard(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function deleteEntry(id) {
  const e = findEntry(id);
  if (!e) return;
  const ok = await confirmDialog('Position löschen?', 'Foto, Text und Sprachnotiz dieser Position werden endgültig gelöscht.', 'Löschen', true);
  if (!ok) return;
  if (dictation?.entryId === id) stopDictation();
  if (recording?.entryId === id) await stopRecording();
  for (const b of [e.photoId, e.audioId]) if (b) { revokeUrl(b); await db.deleteBlob(b); }
  current.entries = current.entries.filter(x => x.id !== id);
  await saveNow();
  renderEntries();
}

async function deleteAudio(id) {
  const e = findEntry(id);
  if (!e?.audioId) return;
  if (!await confirmDialog('Sprachnotiz löschen?', 'Die Aufnahme wird endgültig gelöscht.', 'Löschen', true)) return;
  revokeUrl(e.audioId);
  await db.deleteBlob(e.audioId);
  delete e.audioId;
  await saveNow();
  renderEntries();
}

/* ------------------------------------------------------------------ Dictation + recording */

let dictation = null; // { entryId, token, ctrl }
let recording = null; // { entryId, report, ctrl, timer }

function appendText(entryId, phrase) {
  const e = findEntry(entryId);
  if (!e || !phrase) return;
  const prev = e.text || '';
  const startSentence = !prev.trim() || /[.!?:]\s*$/.test(prev);
  if (startSentence) phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
  const sep = !prev ? '' : /\s$/.test(prev) ? '' : ' ';
  e.text = prev + sep + phrase;
  const ta = entryCard(entryId)?.querySelector('textarea');
  if (ta) { ta.value = e.text; autosize(ta); }
  scheduleSave();
}

async function toggleDictation(entryId) {
  if (dictation) {
    const same = dictation.entryId === entryId;
    stopDictation();
    if (same) return;
  }
  await stopRecording();
  if (!S.speechSupported) {
    showDialog({ title: 'Diktieren nicht verfügbar', html: `<p>${S.dictationErrorText('not-supported')}</p>` });
    return;
  }
  const token = {};
  dictation = { entryId, token, ctrl: null };
  updateMediaButtons();
  const ctrl = S.startDictation({
    lang: settings.lang,
    onText: t => appendText(entryId, t),
    onInterim: t => {
      const el = entryCard(entryId)?.querySelector('.interim');
      if (el) { el.hidden = !t; el.textContent = t; }
    },
    onEnd: err => {
      if (dictation && dictation.token === token) { dictation = null; updateMediaButtons(); }
      if (err) showDialog({ title: 'Diktieren', html: `<p>${esc(S.dictationErrorText(err))}</p>` });
    },
  });
  if (dictation && dictation.token === token) dictation.ctrl = ctrl;
}

function stopDictation() {
  if (!dictation) return;
  const d = dictation;
  dictation = null;
  d.ctrl?.stop();
  updateMediaButtons();
}

async function toggleRecording(entryId) {
  if (recording) {
    const same = recording.entryId === entryId;
    await stopRecording();
    if (same) return;
  }
  stopDictation();
  if (!S.recorderSupported) return toast('Audioaufnahme wird von diesem Browser nicht unterstützt.');
  const e = findEntry(entryId);
  if (e?.audioId && !await confirmDialog('Neu aufnehmen?', 'Die bestehende Sprachnotiz wird ersetzt.', 'Aufnehmen')) return;
  try {
    const ctrl = await S.startRecording();
    recording = { entryId, report: current, ctrl, timer: setInterval(updateMediaButtons, 500) };
    updateMediaButtons();
  } catch {
    toast('Kein Zugriff auf das Mikrofon.');
  }
}

async function stopRecording() {
  if (!recording) return;
  const rc = recording;
  recording = null;
  clearInterval(rc.timer);
  updateMediaButtons();
  const blob = await rc.ctrl.stop();
  if (!blob.size) return;
  const e = rc.report.entries.find(x => x.id === rc.entryId);
  if (!e) return;
  const id = uid();
  await db.putBlob(id, blob);
  if (e.audioId) { revokeUrl(e.audioId); await db.deleteBlob(e.audioId); }
  e.audioId = id;
  await saveNow(rc.report);
  if (current === rc.report) renderEntries();
}

function updateMediaButtons() {
  for (const card of $$('.entry', view)) {
    const id = card.dataset.id;
    const mic = $('[data-act="dictate"]', card);
    const rec = $('[data-act="record"]', card);
    if (mic) {
      const on = dictation?.entryId === id;
      mic.classList.toggle('active', on);
      mic.querySelector('span').textContent = on ? 'Stopp' : 'Diktieren';
      mic.querySelector('svg').innerHTML = on ? I.stop : I.mic;
    }
    if (rec) {
      const on = recording?.entryId === id;
      rec.classList.toggle('active', on);
      const e = findEntry(id);
      if (on) {
        const s = Math.floor((Date.now() - recording.ctrl.started) / 1000);
        rec.querySelector('span').textContent = `Stopp ${Math.floor(s / 60)}:${pad(s % 60)}`;
      } else {
        rec.querySelector('span').textContent = e?.audioId ? 'Neu aufnehmen' : 'Sprachnotiz';
      }
      rec.querySelector('svg').innerHTML = on ? I.stop : I.rec;
    }
  }
}

/* ------------------------------------------------------------------ Close / reopen / delete */

async function closeReport() {
  stopDictation();
  await stopRecording();
  if (!current.title.trim()) {
    toast('Bitte zuerst einen Titel eingeben.');
    $('#f-title').focus();
    return;
  }
  const n = current.entries.length;
  const ok = await confirmDialog('Bericht abschliessen?',
    `«${esc(current.title)}» mit ${n} Position${n === 1 ? '' : 'en'} wird abgeschlossen und schreibgeschützt. Du kannst ihn später wieder öffnen.`,
    'Abschliessen');
  if (!ok) return;
  current.status = 'closed';
  current.closedAt = Date.now();
  await saveNow();
  renderEditor();
  window.scrollTo({ top: 0 });
  const next = await showDialog({
    title: 'Bericht abgeschlossen',
    html: '<p>Der Bericht ist gespeichert. Was möchtest du als Nächstes tun?</p>',
    actions: [
      { label: 'Zur Übersicht', value: 'home' },
      { label: 'Exportieren', value: 'export' },
      { label: 'Neuer Bericht', value: 'new', primary: true },
    ],
  });
  if (next === 'export') openExport();
  else if (next === 'new') newReport();
  else if (next === 'home') location.hash = '#/';
}

async function reopenReport() {
  current.status = 'open';
  delete current.closedAt;
  await saveNow();
  renderEditor();
  toast('Bericht kann wieder bearbeitet werden.');
}

async function deleteReport() {
  const ok = await confirmDialog('Bericht löschen?',
    `«${esc(current.title || 'Ohne Titel')}» mit allen Fotos und Texten wird endgültig von diesem Gerät gelöscht.`, 'Endgültig löschen', true);
  if (!ok) return;
  stopDictation();
  await stopRecording();
  for (const e of current.entries) for (const b of [e.photoId, e.audioId]) if (b) await db.deleteBlob(b);
  await db.deleteReport(current.id);
  clearTimeout(saveTimer);
  saveTimer = null;
  current = null;
  location.hash = '#/';
  toast('Bericht gelöscht.');
}

/* ------------------------------------------------------------------ Lightbox */

const lightbox = $('#lightbox');
function openLightbox(src) {
  if (!src) return;
  $('img', lightbox).src = src;
  lightbox.hidden = false;
}
lightbox.addEventListener('click', () => { lightbox.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.hidden = true; });

/* ------------------------------------------------------------------ Export */

function canShareFile(file) {
  try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [file] })); } catch { return false; }
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  toast('Gespeichert: ' + name);
}

async function deliver(blob, name, mode) {
  const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
  if (mode !== 'share' || !canShareFile(file)) return download(blob, name);
  try {
    await navigator.share({ files: [file], title: name });
  } catch (e) {
    if (e.name === 'AbortError') return;
    // The user gesture may have expired while the file was generated: ask once more.
    const again = await showDialog({
      title: 'Export bereit', html: `<p>${esc(name)}</p>`,
      actions: [{ label: 'Speichern', value: 'save' }, { label: 'Teilen', value: 'share', primary: true }],
    });
    if (again === 'share') navigator.share({ files: [file], title: name }).catch(() => download(blob, name));
    else if (again === 'save') download(blob, name);
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

async function printReport(report, assets) {
  const area = $('#printArea');
  area.innerHTML = `<style>${X.REPORT_CSS}</style>` + await X.toHTMLBody(report, assets, 'url');
  await Promise.all($$('img', area).map(img => img.decode().catch(() => {})));
  const cleanup = () => {
    for (const img of $$('img', area)) URL.revokeObjectURL(img.src);
    area.innerHTML = '';
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

async function openExport() {
  if (!current) return;
  stopDictation();
  await stopRecording();
  await saveNow();
  const report = current;
  const mobile = matchMedia('(pointer: coarse)').matches;
  const shareAvailable = canShareFile(new File(['x'], 'x.txt', { type: 'text/plain' }));
  let mode = shareAvailable && mobile ? 'share' : 'save';

  const item = (kind, ic, title, sub) =>
    `<button type="button" class="export-item" data-exp="${kind}">${icon(ic)}<span><strong>${title}</strong><small>${sub}</small></span></button>`;

  showDialog({
    title: 'Exportieren',
    actions: [],
    html: `
      <p class="muted export-sub">${esc(report.title || 'Ohne Titel')} · ${esc(X.formatDate(report.date))} · ${report.entries.length} Positionen</p>
      ${shareAvailable ? `
        <div class="seg" role="radiogroup" aria-label="Ziel">
          <button type="button" data-mode="share" role="radio">Teilen</button>
          <button type="button" data-mode="save" role="radio">Auf Gerät speichern</button>
        </div>` : ''}
      <div class="export-list">
        ${item('docx', 'doc', 'Word-Dokument (.docx)', 'Fotos und Texte – direkt weiterbearbeitbar')}
        ${item('pdf', 'print', 'PDF / Drucken', 'Im Druckdialog «Als PDF sichern» wählen')}
        ${item('html', 'globe', 'Webseite (.html)', 'Eine Datei mit allen Fotos, öffnet in jedem Browser')}
        ${item('zip', 'zip', 'ZIP-Paket', 'Transkript, Word, HTML, Fotos und Sprachnotizen einzeln')}
        ${item('txt', 'txt', 'Transkript (.txt)', 'Nur Text, mit Verweisen auf die Fotodateien')}
        ${item('copy', 'copy', 'Text kopieren', 'In die Zwischenablage, z.B. für E-Mail')}
      </div>`,
    onMount(el, closeWith) {
      const setMode = m => {
        mode = m;
        for (const b of $$('[data-mode]', el)) b.setAttribute('aria-checked', String(b.dataset.mode === m));
      };
      setMode(mode);
      for (const b of $$('[data-mode]', el)) b.onclick = () => setMode(b.dataset.mode);
      for (const b of $$('[data-exp]', el)) b.onclick = () => { closeWith(null); doExport(report, b.dataset.exp, mode); };
    },
  });
}

async function doExport(report, kind, mode) {
  try {
    if (kind !== 'copy' && kind !== 'txt') toast('Export wird erstellt …', 1500);
    const assets = await X.collectAssets(report);
    const base = X.fileBase(report);
    switch (kind) {
      case 'docx': return deliver(await X.toDocx(report, assets), base + '.docx', mode);
      case 'html': return deliver(new Blob([await X.toHTMLDocument(report, assets, 'embed')], { type: 'text/html' }), base + '.html', mode);
      case 'zip': return deliver(await X.toZip(report, assets), base + '.zip', mode);
      case 'txt': return deliver(new Blob([X.toText(report, assets)], { type: 'text/plain' }), base + '.txt', mode);
      case 'copy': await copyText(X.toText(report, assets)); return toast('Text in die Zwischenablage kopiert.');
      case 'pdf': return printReport(report, assets);
    }
  } catch (e) {
    console.error(e);
    toast('Export fehlgeschlagen: ' + (e.message || e), 6000);
  }
}

/* ------------------------------------------------------------------ Settings, backup, install */

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
function base64ToBlob(b64, type) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type });
}

async function exportBackup() {
  toast('Sicherung wird erstellt …');
  const reports = await db.allReports();
  const blobs = {};
  for (const r of reports) for (const e of r.entries) for (const id of [e.photoId, e.audioId]) {
    if (!id) continue;
    const b = await db.getBlob(id);
    if (b) blobs[id] = { type: b.type, data: await blobToBase64(b) };
  }
  const json = JSON.stringify({ app: 'fotobericht', version: 1, exportedAt: new Date().toISOString(), reports, blobs });
  download(new Blob([json], { type: 'application/json' }), `fotobericht-sicherung-${today()}.json`);
}

$('#importInput').addEventListener('change', async ev => {
  const file = ev.target.files[0];
  ev.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'fotobericht' || !Array.isArray(data.reports)) throw new Error('Keine gültige Fotobericht-Sicherung');
    for (const [id, b] of Object.entries(data.blobs || {})) await db.putBlob(id, base64ToBlob(b.data, b.type));
    for (const r of data.reports) await db.putReport(r);
    toast(`${data.reports.length} Bericht${data.reports.length === 1 ? '' : 'e'} wiederhergestellt.`);
    if (!current) renderList();
  } catch (e) {
    toast('Import fehlgeschlagen: ' + e.message, 6000);
  }
});

async function doInstall() {
  if (!installEvt) return;
  installEvt.prompt();
  await installEvt.userChoice.catch(() => {});
  installEvt = null;
  if (!current) renderListTopbar();
}

const fmtBytes = b => b > 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.round(b / 1e3) + ' kB';

async function openSettings() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  showDialog({
    title: 'Einstellungen',
    actions: [{ label: 'Fertig', value: true, primary: true }],
    html: `
      <label class="field"><span>Name (Vorgabe für «Verfasst von»)</span>
        <input id="s-author" value="${esc(settings.author)}" autocomplete="name" placeholder="Vor- und Nachname"></label>
      <label class="field"><span>Sprache fürs Diktieren</span>
        <select id="s-lang">${LANGS.map(([v, l]) => `<option value="${v}" ${v === settings.lang ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="setting-block" id="s-ondevice"><small class="muted">Offline-Diktat wird geprüft …</small></div>

      <h3>Datensicherung</h3>
      <p class="muted small">Berichte werden nur auf diesem Gerät gespeichert. Sichere sie regelmässig, z.B. vor dem Löschen von Browserdaten.</p>
      <div class="btn-row">
        <button type="button" class="btn" id="s-backup">${icon('download')}Sicherung speichern</button>
        <button type="button" class="btn" id="s-restore">${icon('upload')}Wiederherstellen</button>
      </div>
      <p class="muted small" id="s-storage"></p>

      <h3>App</h3>
      ${standalone ? '<p class="muted small">Die App ist installiert und funktioniert offline.</p>'
        : installEvt ? `<button type="button" class="btn" id="s-install">${icon('download')}App installieren</button>`
        : ios ? '<p class="muted small">Installieren: in Safari auf <strong>Teilen</strong> tippen und <strong>«Zum Home-Bildschirm»</strong> wählen.</p>'
        : '<p class="muted small">Installieren: im Browser-Menü «App installieren» bzw. «Zum Startbildschirm hinzufügen» wählen.</p>'}
      <p class="muted small">Version ${APP_VERSION}</p>`,
    onMount(el) {
      $('#s-author', el).oninput = e => { settings.author = e.target.value; saveSettings(); };
      $('#s-lang', el).onchange = e => { settings.lang = e.target.value; saveSettings(); refreshOnDevice(el); };
      $('#s-backup', el).onclick = exportBackup;
      $('#s-restore', el).onclick = () => $('#importInput').click();
      const inst = $('#s-install', el);
      if (inst) inst.onclick = doInstall;
      refreshOnDevice(el);
      if (navigator.storage?.estimate) {
        Promise.all([navigator.storage.estimate(), navigator.storage.persisted?.() ?? Promise.resolve(false)])
          .then(([est, persisted]) => {
            $('#s-storage', el).textContent = `Belegt: ${fmtBytes(est.usage || 0)}` +
              (est.quota ? ` von ca. ${fmtBytes(est.quota)}` : '') +
              (persisted ? ' · dauerhaft gespeichert' : '');
          });
      }
    },
  });
}

async function refreshOnDevice(el) {
  const box = $('#s-ondevice', el);
  if (!box) return;
  if (!S.speechSupported) {
    box.innerHTML = '<small class="muted">Dieser Browser hat keine eingebaute Spracherkennung. Nutze die Mikrofon-Taste der Bildschirmtastatur oder Sprachnotizen.</small>';
    return;
  }
  const st = await S.onDeviceStatus(settings.lang);
  const texts = {
    available: '✓ Offline-Diktat ist für diese Sprache installiert.',
    downloading: 'Sprachpaket wird heruntergeladen …',
    unavailable: 'Offline-Diktat ist für diese Sprache nicht verfügbar. Ohne Internet: Mikrofon-Taste der Tastatur oder Sprachnotiz verwenden.',
    unknown: 'Hinweis: Je nach Browser braucht das Diktieren Internet. Offline funktioniert immer die Mikrofon-Taste der Bildschirmtastatur sowie die Sprachnotiz.',
  };
  if (st === 'downloadable') {
    box.innerHTML = `<small class="muted">Für Offline-Diktat kann ein Sprachpaket geladen werden (einmalig, mit Internet).</small>
      <button type="button" class="btn small" id="s-dl">${icon('download')}Sprachpaket laden</button>`;
    $('#s-dl', box).onclick = async () => {
      box.innerHTML = '<small class="muted">Sprachpaket wird geladen …</small>';
      const ok = await S.installOnDevice(settings.lang);
      toast(ok ? 'Sprachpaket installiert.' : 'Sprachpaket konnte nicht geladen werden.');
      refreshOnDevice(el);
    };
  } else {
    box.innerHTML = `<small class="muted">${texts[st] || texts.unknown}</small>`;
  }
}

/* ------------------------------------------------------------------ Boot */

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

route();
