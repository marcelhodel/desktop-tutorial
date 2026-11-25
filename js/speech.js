// Dictation via the Web Speech API (with on-device mode where the browser offers it)
// and voice memos via MediaRecorder as an always-offline fallback.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export const speechSupported = !!SR;

/** Does this browser offer on-device (offline) recognition? */
export async function onDeviceStatus(lang) {
  if (!SR || typeof SR.available !== 'function') return 'unknown';
  try {
    return await SR.available({ langs: [lang], processLocally: true }); // 'available' | 'downloadable' | 'downloading' | 'unavailable'
  } catch {
    return 'unknown';
  }
}

export async function installOnDevice(lang) {
  if (!SR || typeof SR.install !== 'function') return false;
  try {
    return await SR.install({ langs: [lang], processLocally: true });
  } catch {
    return false;
  }
}

/**
 * Starts dictation. Calls onText(finalText) for each finished phrase,
 * onInterim(text) for the live preview and onEnd(errorCode|null) when it stops.
 */
export function startDictation({ lang, onText, onInterim, onEnd }) {
  if (!SR) { onEnd('not-supported'); return { stop() {} }; }

  let active = true;
  let lastError = null;
  let rec;
  let preferLocal = false;

  const create = () => {
    rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    if (preferLocal && 'processLocally' in rec) {
      try { rec.processLocally = true; } catch { /* ignore */ }
    }
    rec.onresult = ev => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) onText(r[0].transcript.trim());
        else interim += r[0].transcript;
      }
      onInterim(interim.trim());
    };
    rec.onerror = ev => {
      lastError = ev.error;
      if (['not-allowed', 'service-not-allowed', 'network', 'language-not-supported', 'audio-capture'].includes(ev.error)) {
        active = false;
      }
    };
    rec.onend = () => {
      onInterim('');
      // Browsers stop after a pause; restart while the user still wants to dictate.
      if (active) {
        try { rec.start(); return; } catch { /* fall through */ }
      }
      onEnd(lastError && lastError !== 'no-speech' && lastError !== 'aborted' ? lastError : null);
    };
    rec.start();
  };

  // Use on-device recognition automatically when it is already installed.
  onDeviceStatus(lang).then(s => {
    preferLocal = s === 'available';
    if (active) {
      try { create(); } catch (e) { active = false; onEnd('start-failed'); }
    }
  });

  return {
    stop() {
      active = false;
      try { rec && rec.stop(); } catch { /* ignore */ }
    },
  };
}

export function dictationErrorText(code) {
  switch (code) {
    case 'not-supported': return 'Dieser Browser unterstützt keine Spracherkennung. Tipp: Mikrofon-Taste der Tastatur verwenden oder eine Sprachnotiz aufnehmen.';
    case 'not-allowed':
    case 'service-not-allowed': return 'Kein Zugriff aufs Mikrofon. Bitte in den Browser-Einstellungen erlauben.';
    case 'network': return 'Spracherkennung braucht in diesem Browser Internet. Offline: Mikrofon-Taste der Tastatur nutzen oder Sprachnotiz aufnehmen.';
    case 'language-not-supported': return 'Diese Sprache wird nicht unterstützt. Bitte in den Einstellungen eine andere wählen.';
    case 'audio-capture': return 'Kein Mikrofon gefunden.';
    default: return 'Spracherkennung wurde beendet.';
  }
}

/* ---------------------------------------------------------------- Voice memo */

export const recorderSupported = !!(navigator.mediaDevices && window.MediaRecorder);

function pickMime() {
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  return types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
}

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickMime();
  const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const done = new Promise(resolve => {
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      resolve(new Blob(chunks, { type: (mr.mimeType || mimeType || 'audio/webm').split(';')[0] }));
    };
  });
  mr.start(1000);
  const started = Date.now();
  return {
    started,
    stop() { if (mr.state !== 'inactive') mr.stop(); return done; },
  };
}
