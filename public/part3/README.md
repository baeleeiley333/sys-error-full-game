# Relationship Recognition Game

A browser-based face-scanning interactive game with a Windows XP retro UI. Uses MediaPipe Face Landmarker for real-time dual-face detection, surveillance-style filters, and randomized relationship reveals.

## Features

- **XP desktop boot flow** — double-click desktop icon to launch
- **Internet Explorer shell** — title screen with reference artwork
- **Intro video** — Windows Media Player window with Rover hint popup
- **Live camera background** — full-screen webcam feed
- **Dual subject tracking** — Subject A / Subject B with scan windows
- **12 style filters** — glitch, terminal, thermal, night vision, and more
- **Game flow** — scan → SCANNED stamp → countdown → loading → full-screen relationship reveal → ending dialog
- **Solo mode easter egg** — repeating “Relationship Not Found” dialogs when only one face is detected

## Run locally

Camera access and ES modules require a local HTTP server. Do **not** open `index.html` directly as a file.

```bash
cd face-scan-game
npx serve . -l 8080
```

Then open [http://localhost:8080](http://localhost:8080)

Alternative:

```bash
python -m http.server 8080
```

## How to play

1. Double-click the desktop icon on the XP screen
2. Press any key on the title screen
3. Watch the intro (or press any key to skip)
4. Allow camera permission
5. Get **two people** in frame for the full experience
6. Hold still through scan, countdown, and loading
7. Read your randomized relationship result

## Tech stack

- [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) via `@mediapipe/tasks-vision`
- HTML5 Canvas + WebRTC `getUserMedia`
- Pure frontend — no backend required

## Project structure

```
face-scan-game/
├── index.html
├── styles.css
├── app.js
├── assets/
│   ├── intro.mp4
│   ├── gamestart.png
│   ├── desktop-icon.png
│   └── syserror-hint.png
└── README.md
```

## License

MIT — feel free to fork, remix, and build on it.
