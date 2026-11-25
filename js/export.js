// Export: plain-text transcript, standalone HTML, Word (.docx), ZIP (text + photos + audio).
import { db } from './db.js';
import { makeZip } from './zip.js';

const pad = n => String(n).padStart(2, '0');

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

export function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fileBase(report) {
  const t = (report.title || 'Bericht').trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[^\x20-\x7e]/g, '')
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60) || 'Bericht';
  return `${report.date || ''}_${t}`.replace(/^_/, '');
}

const AUDIO_EXT = type => (type || '').includes('mp4') ? 'm4a' : (type || '').includes('ogg') ? 'ogg' : 'webm';

/** Load the blobs that belong to a report and give them stable export names. */
export async function collectAssets(report) {
  const assets = [];
  for (let i = 0; i < report.entries.length; i++) {
    const e = report.entries[i];
    const nr = pad(i + 1);
    const a = { entry: e, nr: i + 1, photo: null, audio: null };
    if (e.photoId) {
      const blob = await db.getBlob(e.photoId);
      if (blob) a.photo = { blob, name: `foto-${nr}.jpg`, w: e.photoW || 1600, h: e.photoH || 1200 };
    }
    if (e.audioId) {
      const blob = await db.getBlob(e.audioId);
      if (blob) a.audio = { blob, name: `sprachnotiz-${nr}.${AUDIO_EXT(blob.type)}` };
    }
    assets.push(a);
  }
  return assets;
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function metaLines(report) {
  const lines = [];
  lines.push(['Datum', formatDate(report.date)]);
  if (report.location) lines.push(['Ort / Objekt', report.location]);
  if (report.author) lines.push(['Verfasst von', report.author]);
  lines.push(['Status', report.status === 'closed' ? 'Abgeschlossen' : 'In Bearbeitung']);
  return lines;
}

/* ---------------------------------------------------------------- Text */

export function toText(report, assets) {
  const out = [];
  const title = report.title || 'Ohne Titel';
  out.push(title.toUpperCase());
  out.push('='.repeat(Math.min(title.length, 60)));
  for (const [k, v] of metaLines(report)) out.push(`${k}: ${v}`);
  out.push('');
  for (const a of assets) {
    const head = [`[${pad(a.nr)}]`];
    if (a.photo) head.push(`Foto: ${a.photo.name}`);
    if (a.audio) head.push(`Sprachnotiz: ${a.audio.name}`);
    head.push(`(${formatTime(a.entry.createdAt)})`);
    out.push(head.join('  '));
    out.push((a.entry.text || '').trim() || '–');
    out.push('');
  }
  out.push(`Exportiert am ${new Date().toLocaleString('de-CH')}`);
  return out.join('\n');
}

/* ---------------------------------------------------------------- HTML */

export const REPORT_CSS = `
.fb-report{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1b2430;max-width:820px;margin:0 auto;padding:24px;line-height:1.5}
.fb-report h1{font-size:26px;margin:0 0 6px}
.fb-report .fb-meta{display:grid;grid-template-columns:max-content 1fr;gap:2px 16px;font-size:14px;color:#4a5563;margin:0 0 20px;padding:0 0 14px;border-bottom:2px solid #0b5f86}
.fb-report .fb-meta dt{font-weight:600}
.fb-report .fb-meta dd{margin:0}
.fb-report .fb-entry{margin:0 0 22px;break-inside:avoid;page-break-inside:avoid}
.fb-report .fb-entry h2{font-size:13px;font-weight:600;color:#0b5f86;text-transform:uppercase;letter-spacing:.04em;margin:0 0 6px}
.fb-report .fb-entry img{display:block;max-width:100%;max-height:520px;height:auto;border-radius:4px;margin:0 0 8px}
.fb-report .fb-entry p{margin:0;white-space:pre-wrap}
.fb-report .fb-entry audio{display:block;margin:6px 0 0}
.fb-report .fb-foot{font-size:12px;color:#7a8594;border-top:1px solid #d5dbe2;padding-top:8px;margin-top:28px}
@media print{.fb-report{padding:0;max-width:none}.fb-report audio{display:none}}
`;

/**
 * @param {'embed'|'relative'|'url'} mode embed = base64 inside the file,
 *   relative = point to files in a ZIP, url = object URLs (in-app printing)
 */
export async function toHTMLBody(report, assets, mode) {
  const parts = [];
  parts.push(`<article class="fb-report"><h1>${esc(report.title || 'Ohne Titel')}</h1><dl class="fb-meta">`);
  for (const [k, v] of metaLines(report)) parts.push(`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`);
  parts.push('</dl>');
  for (const a of assets) {
    parts.push(`<section class="fb-entry"><h2>Position ${a.nr} · ${esc(formatTime(a.entry.createdAt))}</h2>`);
    if (a.photo) {
      let src;
      if (mode === 'embed') src = await blobToDataURL(a.photo.blob);
      else if (mode === 'relative') src = `fotos/${a.photo.name}`;
      else src = URL.createObjectURL(a.photo.blob);
      parts.push(`<img src="${src}" alt="Foto ${a.nr}" width="${a.photo.w}" height="${a.photo.h}">`);
    }
    const text = (a.entry.text || '').trim();
    if (text) parts.push(`<p>${esc(text)}</p>`);
    if (a.audio && mode !== 'url') {
      const src = mode === 'embed' ? await blobToDataURL(a.audio.blob) : `audio/${a.audio.name}`;
      parts.push(`<audio controls src="${src}"></audio>`);
    }
    parts.push('</section>');
  }
  parts.push(`<div class="fb-foot">Erstellt mit Fotobericht · exportiert am ${esc(new Date().toLocaleString('de-CH'))}</div></article>`);
  return parts.join('\n');
}

export async function toHTMLDocument(report, assets, mode) {
  const body = await toHTMLBody(report, assets, mode);
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(report.title || 'Bericht')}</title><style>body{margin:0;background:#fff}${REPORT_CSS}</style></head>
<body>${body}</body></html>`;
}

/* ---------------------------------------------------------------- DOCX */

const xmlEsc = s => String(s ?? '')
  // drop characters that are invalid in XML 1.0
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
  .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function para(text, { style, bold, color, size, keepNext } = {}) {
  const pPr = [];
  if (style) pPr.push(`<w:pStyle w:val="${style}"/>`);
  if (keepNext) pPr.push('<w:keepNext/>');
  const rPr = [];
  if (bold) rPr.push('<w:b/>');
  if (color) rPr.push(`<w:color w:val="${color}"/>`);
  if (size) rPr.push(`<w:sz w:val="${size}"/>`);
  const lines = String(text ?? '').split(/\r?\n/);
  const runs = lines.map((l, i) =>
    `<w:r>${rPr.length ? `<w:rPr>${rPr.join('')}</w:rPr>` : ''}${i ? '<w:br/>' : ''}<w:t xml:space="preserve">${xmlEsc(l)}</w:t></w:r>`
  ).join('');
  return `<w:p>${pPr.length ? `<w:pPr>${pPr.join('')}</w:pPr>` : ''}${runs}</w:p>`;
}

function imagePara(relId, n, w, h) {
  const EMU_PER_CM = 360000;
  const maxW = 16 * EMU_PER_CM, maxH = 12 * EMU_PER_CM;
  let cx = maxW, cy = Math.round(maxW * (h / w));
  if (cy > maxH) { cy = maxH; cx = Math.round(maxH * (w / h)); }
  return `<w:p><w:pPr><w:keepNext/><w:spacing w:after="80"/></w:pPr><w:r><w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${n}" name="Foto ${n}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${n}" name="foto-${n}.jpg"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

const DOCX_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="de-CH"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/><w:szCs w:val="40"/><w:color w:val="1B2430"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:caps/><w:color w:val="0B5F86"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Meta"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:color w:val="4A5563"/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Fuss"><w:name w:val="Fusszeile Bericht"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="360"/></w:pPr><w:rPr><w:color w:val="7A8594"/><w:sz w:val="16"/></w:rPr></w:style>
</w:styles>`;

export async function toDocx(report, assets) {
  const files = [];
  const rels = ['<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'];
  const body = [];

  body.push(para(report.title || 'Ohne Titel', { style: 'Title' }));
  for (const [k, v] of metaLines(report)) {
    body.push(`<w:p><w:pPr><w:pStyle w:val="Meta"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${xmlEsc(k)}: </w:t></w:r><w:r><w:t xml:space="preserve">${xmlEsc(v)}</w:t></w:r></w:p>`);
  }
  body.push('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="0B5F86"/></w:pBdr></w:pPr></w:p>');

  let imgN = 0;
  for (const a of assets) {
    body.push(para(`Position ${a.nr} · ${formatTime(a.entry.createdAt)}`, { style: 'Heading2' }));
    if (a.photo) {
      imgN++;
      const relId = `rIdImg${imgN}`;
      const target = `media/foto-${imgN}.jpeg`;
      rels.push(`<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${target}"/>`);
      files.push({ name: `word/${target}`, data: a.photo.blob });
      body.push(imagePara(relId, imgN, a.photo.w, a.photo.h));
    }
    const text = (a.entry.text || '').trim();
    if (text) body.push(para(text));
    if (a.audio) body.push(para(`[Sprachnotiz: ${a.audio.name}]`, { color: '7A8594', size: 18 }));
  }
  body.push(para(`Erstellt mit Fotobericht · exportiert am ${new Date().toLocaleString('de-CH')}`, { style: 'Fuss' }));

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;

  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${xmlEsc(report.title || 'Bericht')}</dc:title><dc:creator>${xmlEsc(report.author || 'Fotobericht')}</dc:creator>
<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;

  const all = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="jpeg" ContentType="image/jpeg"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>` },
    { name: 'docProps/core.xml', data: core },
    { name: 'word/document.xml', data: document },
    { name: 'word/styles.xml', data: DOCX_STYLES },
    { name: 'word/_rels/document.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>` },
    ...files,
  ];
  return makeZip(all, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

/* ---------------------------------------------------------------- ZIP */

export async function toZip(report, assets) {
  const files = [
    { name: 'bericht.txt', data: toText(report, assets) },
    { name: 'bericht.html', data: await toHTMLDocument(report, assets, 'relative') },
    { name: 'bericht.docx', data: await toDocx(report, assets) },
  ];
  for (const a of assets) {
    if (a.photo) files.push({ name: `fotos/${a.photo.name}`, data: a.photo.blob });
    if (a.audio) files.push({ name: `audio/${a.audio.name}`, data: a.audio.blob });
  }
  return makeZip(files);
}
