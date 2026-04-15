# GradeFlow

A browser extension that adds a grade overview panel directly inside SmartSchool with weighted averages, period filters, personalisation options, and 6 hidden arcade games.

> **Note:** This extension only works on SmartSchool (`*.smartschool.be`). You need to be logged in for it to access your grades.

## Features

### Grade panel
- Opens as a side panel inside SmartSchool's results page
- All your grades across every period, sorted by subject
- Color coded cells (green/yellow/red) so you can spot weak and strong results at a glance
- Hover any grade to see score, contribution, and weighted details
- Bottom bar with overall percentage, total points, subject count, best subject, and a progress bar
- Disclaimer: results may differ from your official report

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
- Dutch, English, and French
- Custom language editor with JSON import/export
- Configurable decimal separator and decimal places

### Subject icons
- Pulled from SmartSchool's own icon set
- Click any icon to swap it for an emoji
- 50+ built-in keyword rules, fully editable

### Personalisation
- Change your display name on SmartSchool
- Replace your profile picture (drag and drop or file picker)
- Fake message, notification, and news counters (0-9999)

### Arcade (press F8)
6 hidden grade-themed games that use your actual grades when available:

| Game | What it is |
|------|-----------|
| GradeStack | Tetris with grade-themed pieces |
| GradeSnake | Snake with levels, good grades grow you, bad ones shrink you |
| Grade 2048 | Merge weak grades until you hit 20/20 |
| GradeSweeper | Minesweeper where failing grades are mines (3 difficulties) |
| GradeMemory | Flip and match grade card pairs (easy/medium/hard) |
| GradeShooter | Bubble shooter with grade-colored bubbles, clear and endless mode |

All games track your personal best and have animated previews in the menu.

### Keyboard shortcuts
| Key | Action |
|-----|--------|
| F8 | Open/close arcade |
| Esc | Close settings, arcade, or current game |
| P | Pause game |
| R | Restart game |
| Arrows / WASD | Game controls |
| Z | Rotate (GradeStack) |

## Privacy

GradeFlow reads grades from SmartSchool's own API and stores everything locally in your browser. No data is sent to any external server. No analytics, no tracking. See the [privacy policy](https://github.com/ForceWarrior/Smartschool-GradeFlow/blob/main/privacy-policy.md) for details.

## Install

Available on the [Chrome Web Store](https://chromewebstore.google.com).

## License

Source available. You can use, modify, and share the code, but you can't publish it on any browser extension store. See [LICENSE](LICENSE) for details.
