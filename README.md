# FocusLens

A study productivity tool that uses your webcam and TensorFlow.js to track focus in real-time. Everything runs client-side — no data leaves your browser.

Built with React, TensorFlow.js (BlazeFace), and a companion Chrome Extension (Manifest V3) for blocking distracting websites during study sessions.

---

## What It Does

- **Face detection** — BlazeFace detects your face at ~15 FPS, tracks head pose (forward, turned, away), and scores engagement based on presence and position.
- **Focus dashboard** — Live score gauge, focus/distracted timers, streak counter, tab-switch tracking, and a real-time timeline chart.
- **Pomodoro timer** — 25/5/15 work-break cycles with automatic transitions and audio cues.
- **Distraction alerts** — Audio chime and full-screen overlay when you've been unfocused for 5+ seconds. Fires on both face absence and tab switches.
- **Session history** — Saves sessions to localStorage with a weekly bar chart, session list, and CSV export.
- **Site blocker (Chrome Extension)** — Whitelist mode that blocks every website except the ones you allow (e.g., Blackboard, Google Docs).

---

## Quick Start

```bash
git clone https://github.com/samyam2006/focuslens.git
cd focuslens
npm install
npm start
```

Opens at `localhost:3000`. Click Start and allow camera access.

For the Chrome Extension: go to `chrome://extensions`, enable Developer Mode, click Load Unpacked, and select the `chrome-extension/` folder.

---

## Project Structure

```
src/
  components/    UI components (camera view, charts, pomodoro, stats, alerts)
  hooks/         useFaceDetection, usePomodoro, useTabVisibility
  utils/         audio alerts, session storage, helpers
  App.js         main orchestrator
  App.css        global styles

chrome-extension/
  manifest.json  Manifest V3 config
  background.js  declarativeNetRequest rules
  popup.html/js  extension popup
  blocked.html   redirect page for blocked sites
```

---

## How the Detection Works

BlazeFace returns a bounding box and 6 facial landmarks per frame. Head pose is estimated from the nose-to-ear distance ratio — if asymmetric, you're looking away. Tab switches are caught via the Page Visibility API and penalize your score instantly. The final focus score combines face probability, how centered you are, head pose, and tab visibility, smoothed with an exponential moving average. Anything above 45 counts as focused.

---

## Built With

React 18, TensorFlow.js, BlazeFace, Recharts, Lucide React, Web Audio API, Chrome Manifest V3 (declarativeNetRequest), localStorage

---

## License

MIT
