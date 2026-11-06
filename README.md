# ROWRIC Tracker

A work-session time tracker web app. Track work time with a start/stop timer,
view stats, an activity calendar, a monthly-hours heatmap, daily notes, and
recent session history. Data is persisted through a Google Apps Script web app
backed by Google Sheets, with cross-device timer sync.

## Features

- Username/password auth (register & login) backed by Google Sheets
- Start/stop work timer with live elapsed display and UTC+7 clock
- Cross-device timer state sync (5s polling)
- Stats: today / this week / this month / total
- Activity calendar with month/year/total timeframes and tooltips
- Monthly hours heatmap with custom date range
- Daily notes per date
- Recent sessions history (table on desktop, cards on mobile)
- Fullscreen timer mode
- OLED-friendly dark theme, responsive down to small phones

## Folder structure

```
├── index.html            # Markup only (no inline CSS/JS)
├── css/
│   └── styles.css        # All styles (design tokens + components + responsive)
├── js/
│   ├── app.js            # Bootstrap: event wiring + startup sequence
│   ├── config.js         # Constants: default Apps Script URL, storage keys
│   ├── state.js          # Shared application state + DOM cache
│   ├── utils.js          # UTC+7 date helpers, time/duration formatting
│   ├── services/
│   │   ├── api.js        # fetch wrappers for the Apps Script endpoints
│   │   ├── auth.js       # Login/register/logout, session restore, greeting
│   │   ├── timer.js      # Timer start/stop, session save, remote sync polling
│   │   ├── data.js       # loadData(): fetch sessions, refresh all views
│   │   └── notes.js      # Daily notes save/load
│   └── ui/
│       ├── dom.js        # DOM cache, status messages, tooltip, loading overlay
│       ├── clock.js      # UTC+7 clock (requestAnimationFrame)
│       ├── timer.js      # Timer display/button/start-time view updates
│       ├── stats.js      # Today/week/month/total stats + realtime updates
│       ├── history.js    # Recent sessions table + mobile cards
│       ├── calendar.js   # Activity calendar, timeframe dropdowns, stats
│       ├── chart.js      # Monthly hours heatmap
│       └── fullscreen.js # Fullscreen timer overlay
├── server.js             # Zero-dependency static dev server
├── GoogleAppsScript.js   # Backend (deploy separately to Apps Script)
├── logo.png
└── package.json
```

## Technologies

- Vanilla HTML / CSS / JavaScript (ES modules — no build step, no dependencies)
- Google Apps Script + Google Sheets as the backend
- `localStorage` for session persistence and the script URL override

## Installation & development

Requires Node.js 18+.

```bash
npm run dev          # serves on http://localhost:3000
# or pick a port:
PORT=8080 npm run dev
node server.js 8080  # same thing
```

Any static file server also works (e.g. `python3 -m http.server`), but ES
modules require HTTP — opening `index.html` directly via `file://` will not
work.

## Configuration

The Google Apps Script URL is defined in `js/config.js` (`DEFAULT_SCRIPT_URL`).
It can be overridden per-browser via `localStorage` key `scriptUrl`:

```js
localStorage.setItem('scriptUrl', 'https://script.google.com/.../exec')
```

The backend itself lives in `GoogleAppsScript.js` — deploy it via the Apps
Script editor as a Web App with "Anyone" access, then paste the `/exec` URL
into the config (or localStorage).

## Data & behavior notes

- All session dates are normalized to **UTC+7** before display/aggregation.
- Timer state is mirrored to the sheet (`startTimer`/`stopTimer` actions) so a
  timer started on one device shows up on others within ~5 seconds.
- Sessions, notes, and user records are stored in the Google Sheet used by the
  Apps Script backend — see `GoogleAppsScript.js` for the schema.
