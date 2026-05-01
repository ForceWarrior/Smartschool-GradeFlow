# Changelog

## [1.2.1] - 2026-05-01

### Fixed
- Small patch fix for attendance loading: GradeFlow now prioritizes SmartSchool's Studentcard route and removes temporary attendance diagnostics from the panel.

## [1.2.0] - 2026-05-01

### Added
- New dashboard tabs for overview, trends, planner, class comparison, attendance, decision help, and export.
- Study/work planner with local reminders, plus SmartSchool planner and attendance loading when SmartSchool exposes the data.
- Class comparison through SSCOMP codes with profile pictures, privacy names, duplicate updates, and a faster comparison table.
- What-if scores, editable coefficients, excluded grades, subject risk thresholds, trend graphs, CSV export, and print-friendly PDF export.
- Native SmartSchool homepage summary with average, weakest subject, subject count, risk subjects, and a shortcut to GradeFlow.
- New arcade games and upgrades: GradeBreakout, GradePong, GradeFlappy, GradeRunner, GradeTower, improved pause behavior, delete controls, animated previews, and a scrollable game menu.
- Smartschool++ compatibility across the page theme, homepage summary, GradeFlow panel, popup, chat, games, and update modal. When Smartschool++ is active, its theme, glass mode, and layout are treated as the visual source of truth.
- Release update modal for version 1.2.0 with translated release notes.

### Changed
- Improved laptop support, including Shift+F8 as an arcade shortcut and better layouts on narrower screens.
- Popup theme handling now follows the active Smartschool++ theme on the current SmartSchool tab and disables GradeFlow's local theme toggle while Smartschool++ controls the page.
- GradeFlow dark/light mode has better anti-flash behavior and no longer fights Smartschool++ themes.
- The homepage summary now stays in Smartschool++'s main news area instead of being moved into a side widget.
- Chat, game overlays, and the update modal now inherit Smartschool++ colors and glass styling when available.

### Fixed
- Reduced lag and layout shifts across the panel, game menu, homepage summary, and overlays.
- Improved toast feedback, score display clarity, and spacing throughout the extension.
- Fixed several Smartschool++ timing issues where GradeFlow overlays could render before Smartschool++ theme variables were ready.

## [1.1.0] - 2026-04-22

### Added
- **Peer-to-peer chat (F7).** Opt-in overlay chat that connects users directly over WebRTC, no server involved. Host generates one invite link per friend (room code embedded), shares it out of band, joiner pastes it, sends back an answer blob. Rooms cap at 8 people (host + 7).
- Invite slots double as seats: once a person connects, their slot turns into a kick button.
- Mandatory warning screen on first use: explains IP exposure, lack of moderation, and that any peer can impersonate any nickname and send arbitrary content.
- Chat survives SmartSchool page navigations (runs in a Chrome offscreen document).
- Full translation support for chat UI in Dutch, English, and French.
- Chat feature listed in the "About GradeFlow" help panel.

### Changed
- Reorganised extension source: all arcade game scripts are now under `JS/games/`, matching the existing `JS/chat/` layout.

## [1.0.2] - 2026-04-20

### Fixed
- Grade Shooter (BubbleBlaster) now actually works, mouse/trackpad aiming and shooting were silently broken.
- Arrow keys no longer cause a URL flicker on the GradeFlow panel page or inside any minigame or the game menu.
- Fixed some input lag in minigames caused by unhandled key events leaking to the page.

### Changed
- Info dialog now shows Shift+F8 as an alternative shortcut for laptop users.

## [1.0.1] - 2026-04-17

### Fixed
- Clicking the sidebar background or the collapse button (« Inklappen) no longer closes the GradeFlow panel.
- The GradeFlow sidebar tab now always shows **GradeFlow** as its label instead of **Resultaten**.
- Switching to other nav items (Tabel, Rapporten, etc.) while GradeFlow is open correctly closes the panel.
- The GradeFlow tab no longer appears visually selected/active when it isn't.
- The GradeFlow label no longer stays visible when the sidebar is collapsed.

## [1.0.0] - 2026-04-17

- Initial release.
