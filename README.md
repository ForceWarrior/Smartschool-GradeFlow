# GradeFlow

A browser extension that adds a full grade dashboard directly inside SmartSchool with weighted averages, period filters, planner tools, class comparison, personalisation options, peer-to-peer chat, and 11 hidden arcade games.

> **Note:** This extension only works on SmartSchool (`*.smartschool.be`). You need to be logged in for it to access your grades.

## Features

### Grade panel
- Opens as a side panel inside SmartSchool's results page
- All your grades across every period, sorted by subject
- Color coded cells (green/yellow/red) so you can spot weak and strong results at a glance
- Hover any grade to see score, contribution, and weighted details
- Exclude individual grades or adjust coefficients for what-if planning
- Bottom bar with overall percentage, total points, subject count, best subject, and a progress bar
- Disclaimer: results may differ from your official report

### Dashboard tools
- Overview, trends, planner, class comparison, attendance, decision help, and export tabs
- Trend view shows whether each subject is improving, stable, or slipping
- Study/work planner lets you add your own tasks and get one reminder at the start time
- SmartSchool planner and attendance loaders show upcoming work, absences, and late arrivals when SmartSchool exposes that data
- Decision help highlights safe, watchlist, and critical subjects with approximate next-score targets
- Export grades to CSV or a print-friendly PDF report

### Weighting
- **Points** - plain scored/max percentage
- **Hour-weighted** - set lesson hours per subject to weight your average
- **Formula** - define custom period groups with weights (e.g. 40% Semester 1 + 60% Semester 2), drag to reorder

### Periods
- Auto detects all SmartSchool periods (semesters, trimesters, exams, etc.)
- Switch between individual periods or view everything combined
- Duplicates across periods handled automatically

### Appearance
- Dark and light theme with anti-flash loading
- Smartschool++ support: when Smartschool++ is active, its theme, glass mode, layout, popup styling, chat, games, and update modal take over cleanly
- Dutch, English, and French
- Custom language editor with JSON import/export
- Configurable decimal separator and decimal places

### SmartSchool homepage
- Native GradeFlow homepage summary with average, weakest subject, subject count, and risk subjects
- Summary stays in the main Smartschool++ news area when Smartschool++ rewrites the homepage layout
- Quick shortcut back to the GradeFlow panel

### Subject icons
- Pulled from SmartSchool's own icon set
- Click any icon to swap it for an emoji
- 50+ built-in keyword rules, fully editable

### Personalisation
- Change your display name on SmartSchool
- Replace your profile picture (drag and drop or file picker)
- Fake message, notification, and news counters (0-9999)

### Arcade (press F8)
11 hidden grade-themed games that use your actual grades when available:

| Game | What it is |
|------|-----------|
| GradeStack | Tetris with grade-themed pieces |
| GradeSnake | Snake with levels, good grades grow you, bad ones shrink you |
| Grade 2048 | Merge weak grades until you hit 20/20 |
| GradeSweeper | Minesweeper where failing grades are mines (3 difficulties) |
| GradeMemory | Flip and match grade card pairs (easy/medium/hard) |
| GradeShooter | Bubble shooter with grade-colored bubbles, clear and endless mode |
| GradeBreakout | Smash grade bricks with a paddle and ball |
| GradePong | Play pong against an AI with grade-powered effects |
| GradeFlappy | Fly through pipe gaps and dodge bad grades |
| GradeRunner | Endless runner with jumps, slides, pickups, and grade obstacles |
| GradeTower | Micro tower defense with difficulty levels and grade-unlocked towers |

All games track your personal best and have animated previews in the menu.

### Peer-to-peer chat (press F7)
Optional opt-in overlay for chatting with friends who also use GradeFlow.

- Direct browser-to-browser over WebRTC, **no server**, no account
- Host generates an invite link per friend (room code is baked in), share each link manually (Discord, etc.); every friend who joins fills an invite slot which the host can kick
- Rooms cap at 8 people (host + 7). Each invite slot tracks one person and lets the host kick them
- Survives page navigations on SmartSchool (runs in an offscreen document in the background)
- Messages are kept in memory only (max 60, wiped when the room closes or the tab is closed). GradeFlow itself never writes chat to disk, but anything another peer sends you ends up in their browser's memory too, and they can copy, screenshot, or save it just like any other message on the internet.
- Mandatory warning on first use: your LAN/public IP is visible to every peer, there is no moderation, and any peer can pick any nickname and send anything. Only chat with people you actually know.
- Fully translated (Dutch, English, French)

### Keyboard shortcuts
| Key | Action |
|-----|--------|
| F6 | Open GradeFlow |
| F7 | Open/close chat overlay |
| F8 / Shift+F8 | Open/close arcade |
| Esc | Close settings, arcade, or current game |
| P | Pause game |
| R | Restart game |
| Arrows / WASD | Game controls |
| Z | Rotate (GradeStack) |

## Privacy

GradeFlow reads grades from SmartSchool's own API and stores everything locally in your browser. No analytics, no tracking. Smartschool++ compatibility is visual only: GradeFlow reads page CSS variables at runtime so its UI can follow the active theme, but it does not store Smartschool++ theme data. See the [privacy policy](https://github.com/ForceWarrior/Smartschool-GradeFlow/blob/main/privacy-policy.md) for details.

## Install

Available on the [Chrome Web Store](https://chromewebstore.google.com).

## Development

Useful checks from the repository root:

```sh
npm run check
```

This validates release versions, checks JavaScript syntax, runs ESLint, and runs the Node test suite.

The release version lives in the root `package.json`. After changing it, run:

```sh
npm run sync:version
```

That updates `src/manifest.json` and the update modal release id/version. `npm run validate:versions` fails if those spots drift apart.

## License

Source available. You can use, modify, and share the code, but you can't publish it on any browser extension store. See [LICENSE](LICENSE) for details.
