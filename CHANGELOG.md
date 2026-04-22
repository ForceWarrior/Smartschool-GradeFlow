# Changelog

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
