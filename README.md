# Fotobericht

Offline-fähige Web-App (PWA) für Berichte mit Fotos und gesprochenem Text.

Autor: Marcel Hodel

- **Fotos aufnehmen** (Kamera) oder aus der Galerie wählen
- **Text diktieren** pro Foto/Position, alternativ tippen oder eine **Sprachnotiz** aufnehmen
- **Titel, Datum, Ort/Objekt, Verfasser** pro Bericht
- Berichte werden **automatisch gespeichert** und können **abgeschlossen** (schreibgeschützt) und wieder geöffnet werden
- **Export**: Word (.docx), PDF (über Drucken), HTML mit eingebetteten Fotos, ZIP-Paket (Transkript, Word, HTML, Fotos, Audio), Transkript (.txt), Text kopieren
- **Datensicherung** aller Berichte als JSON-Datei, inkl. Wiederherstellung
- Läuft **komplett offline**, die Daten bleiben nur auf dem Gerät (IndexedDB), keine Server, keine Konten

## Installation / Bereitstellung

Die App besteht nur aus statischen Dateien. Für Kamera, Mikrofon und Offline-Betrieb muss sie über **HTTPS** ausgeliefert werden, z.B. mit GitHub Pages:

1. Auf GitHub: *Settings → Pages → Build and deployment → Source: Deploy from a branch*
2. Branch wählen (z.B. `main`), Ordner `/ (root)`, speichern
3. Nach ca. 1 Minute ist die App unter `https://<benutzer>.github.io/<repo>/` erreichbar

Danach einmal mit Internet öffnen und installieren:

- **iPhone/iPad (Safari):** Teilen → «Zum Home-Bildschirm»
- **Android (Chrome):** Menü → «App installieren»
- **Windows/Mac (Chrome/Edge):** Installieren-Symbol in der Adressleiste

Ab dann startet die App auch ohne Internet.

Lokal testen: `python3 -m http.server 8000` und `http://localhost:8000` öffnen.

## Hinweis zum Diktieren ohne Internet

Die Spracherkennung im Browser (Web Speech API) läuft je nach Gerät lokal oder über einen Online-Dienst:

- **Chrome (neuere Versionen):** In den Einstellungen der App kann, falls angeboten, ein Offline-Sprachpaket geladen werden.
- **Immer offline möglich:** die **Mikrofon-Taste der Bildschirmtastatur** (iOS-/Android-Diktierfunktion, sofern auf dem Gerät für Offline aktiviert). Einfach ins Textfeld tippen und diktieren.
- **Sprachnotiz:** nimmt den Ton auf und speichert ihn mit der Position. Die Aufnahme wird im ZIP- und HTML-Export mitgeliefert.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html`, `styles.css` | Oberfläche |
| `js/app.js` | App-Logik (Berichte, Positionen, Abschliessen, Export-Dialog, Einstellungen) |
| `js/db.js` | Lokale Speicherung (IndexedDB) |
| `js/speech.js` | Diktieren und Sprachnotizen |
| `js/export.js` | Export als Text, HTML, Word und ZIP |
| `js/zip.js` | ZIP-Erstellung ohne externe Bibliothek |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline-Betrieb und Installation |
