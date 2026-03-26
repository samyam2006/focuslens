# FocusLens 🧠

**AI-powered study monitor that uses your webcam to track focus in real-time.**

FocusLens uses TensorFlow.js BlazeFace to detect your face, estimate head pose, and measure engagement — all running 100% client-side with zero data sent to any server. Includes a Pomodoro timer, distraction alerts, session analytics, and a Chrome extension that blocks distracting websites during focus sessions.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.17-FF6F00?logo=tensorflow&logoColor=white)
![Chrome Extension](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

**🎯 Real-Time Face Detection** — TensorFlow.js BlazeFace detects face position, head pose (forward/turned/away), and engagement level at ~15 FPS directly in the browser.

**📊 Live Focus Dashboard** — Circular score gauge, focus/distracted timers, streak tracking, tab-switch counter, and a real-time focus timeline chart.

**⏱ Pomodoro Timer** — Built-in 25/5/15 work-break cycles with automatic phase transitions, round tracking, and audio cues.

**🚨 Distraction Alerts** — Audio chime + full-screen overlay with shake animation when you've been distracted for 5+ seconds. Detects both face absence and tab switches.

**📈 Session History** — Saves completed sessions to localStorage. Weekly bar chart, recent session list, and CSV export for deeper analysis.

**🛡 Focus Shield (Chrome Extension)** — Whitelist-mode site blocker. Blocks ALL websites except the ones you explicitly allow (e.g., Blackboard, Google Docs). Uses Chrome's declarativeNetRequest API.

**🔒 Privacy First** — All AI processing runs locally via WebGL. No camera data, focus scores, or session data ever leaves your machine.

---

## Demo

<!-- Add screenshots or a GIF here -->
<!-- ![FocusLens Demo](./screenshots/demo.gif) -->

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Recharts, Lucide React |
| AI/CV | TensorFlow.js, BlazeFace (face detection) |
| Audio | Web Audio API (distraction chimes) |
| Detection | Page Visibility API (tab switches) |
| Storage | localStorage (session persistence) |
| Extension | Chrome Manifest V3, declarativeNetRequest |

---

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Chrome (for the extension)

### Web App

```bash
git clone https://github.com/samyam2006/focuslens.git
cd focuslens
npm install
npm start
```

Opens at `http://localhost:3000`. Click **Start** and allow camera access. The AI model takes a few seconds to load on first launch.

### Chrome Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. Click the FocusLens icon in your toolbar
5. Add allowed sites → click **Start Focus Session**
6. Every site not on your allowlist will be blocked

---

## Project Structure

```
focuslens/
├── src/
│   ├── components/
│   │   ├── BlockedSites.js        # Allowlist manager + tab-switch stats
│   │   ├── CameraView.js          # Webcam feed with face bounding box
│   │   ├── DistractionOverlay.js   # Full-screen distraction alert
│   │   ├── FocusChart.js           # Recharts real-time area chart
│   │   ├── Header.js               # Title bar + session controls
│   │   ├── PomodoroTimer.js        # Work/break timer with rounds
│   │   ├── ScoreRing.js            # Circular SVG focus gauge
│   │   ├── SessionHistory.js       # Weekly chart + session list + CSV export
│   │   └── StatCard.js             # Reusable metric card
│   ├── hooks/
│   │   ├── useFaceDetection.js     # TensorFlow.js BlazeFace wrapper
│   │   ├── usePomodoro.js          # Pomodoro state machine
│   │   └── useTabVisibility.js     # Page Visibility API tracker
│   ├── utils/
│   │   ├── alertSound.js           # Web Audio API chimes
│   │   ├── helpers.js              # Time formatting, constants
│   │   └── sessionStore.js         # localStorage CRUD + CSV export
│   ├── App.js                      # Main orchestrator
│   ├── App.css                     # Global styles
│   └── index.js                    # Entry point
├── chrome-extension/
│   ├── manifest.json               # Manifest V3
│   ├── background.js               # Service worker (declarativeNetRequest)
│   ├── popup.html / popup.js       # Extension popup UI
│   └── blocked.html                # Redirect page for blocked sites
├── public/
│   └── index.html
├── package.json
└── README.md
```

---

## How the Detection Pipeline Works

1. **BlazeFace** runs at ~15 FPS, returning a face bounding box + 6 landmarks (eyes, nose, mouth, ears)
2. **Head pose** is estimated from the nose-to-ear distance ratio — asymmetry indicates the user is looking away
3. **Tab visibility** is tracked via `document.visibilitychange` — leaving the tab triggers an instant score penalty
4. **Composite score** = `face_probability × centered_score × pose_multiplier × tab_visibility`, with exponential smoothing (α = 0.3)
5. **Threshold** — score ≥ 45 = Focused, below = Distracted
6. **Alerts** fire after 5 consecutive seconds of distraction (configurable in `helpers.js`)

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Run development server on localhost:3000 |
| `npm run build` | Production build to `/build` |

---

## License

MIT — see [LICENSE](LICENSE) for details.
