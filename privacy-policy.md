# GradeFlow - Privacy Policy

**Last updated: October 2026 (version 2.0.0)**

GradeFlow is a Chrome extension built for SmartSchool users. This policy explains what data the extension accesses, how it is used, and how it is stored.

---

## 1. Data we access

When you open the GradeFlow panel on a SmartSchool page where you are already logged in, the extension calls SmartSchool's own internal API (`/results/api/v1/evaluations`) to retrieve your grade data. For grades that only have a label or icon (no points), it also opens that evaluation's detail (`/results/api/v1/evaluations/{id}`) to read the goal ratings. This is the same data SmartSchool displays to you natively.

The planner tab reads your own planned assignments and to-dos from SmartSchool's planner API (`/planner/api/v1/planned-elements/user/...`). The attendance tab reads your absences and late arrivals from your own Studentcard page.

The extension also reads SmartSchool page styles to extract subject icon classes and visual theme/layout variables, including Smartschool++ variables when that extension is installed, so GradeFlow can show matching icons and follow the active page theme. When you use a custom theme, GradeFlow reads SmartSchool's stylesheets (and, if you allow it, fetches the ones hosted on SmartSchool's own `smart-school.net` CDN) to recolour the page locally in your browser.

The arcade games use the grades already loaded in the panel to theme their content (for example grade numbers on obstacles). This happens locally in your browser and the grades are not sent anywhere.

No Smartschool++ account data, settings content, or external profile data is collected. No other data is accessed.

---

## 2. How data is stored

All data is stored locally on your device only:

| Data | Storage location | Purpose |
|------|-----------------|---------|
| Grade data (scores, subjects, periods) | `chrome.storage.local` | Display grades in the panel |
| Theme preference | `chrome.storage.local` | Dark/light mode |
| Profile picture (data URL) | `chrome.storage.local` | Custom profile picture display |
| Personalisation settings (name, toggles, counter values) | `chrome.storage.sync` | Name changer, fake counters |
| Language preference | `chrome.storage.sync` | UI language |
| Lesson hours per subject | `localStorage` | Hour-weighted average calculation |
| Weighting formula | `localStorage` | Custom period formula |
| Settings (decimal, icons, best subject mode) | `localStorage` | Restore your preferences |
| Subject icon overrides | `localStorage` | Per-subject icon choices |
| Custom language strings | `localStorage` | User-defined translations |
| Planner items and attendance entries | `chrome.storage.local` | Planner and attendance tabs |
| Evaluation detail cache (goal ratings) | `chrome.storage.local` | Avoid refetching label/icon grades |
| Custom theme, saved themes | `chrome.storage.local` | Theme editor |
| Recoloured theme stylesheet cache | `localStorage` | Show your theme without a flash on page load |
| Keyboard shortcuts | `chrome.storage.local` | Remapped shortcuts |
| Game best scores and progress (story progress, stars, coins, shop items, missions, unlocked characters and skins, seen tutorials) | `localStorage` | Arcade high scores and saves |
| Grade Hook levels you build in the editor | `localStorage` | Editing and replaying your own levels |

`chrome.storage.local` and `chrome.storage.sync` are private to the extension and not accessible to websites. `localStorage` entries are scoped to the SmartSchool domain.

Smartschool++ compatibility is visual only. GradeFlow reads CSS variables from the current page at runtime and does not store Smartschool++ theme data.

---

## 3. Data sharing

GradeFlow does **not**:
- Send any data to any external server
- Use analytics or tracking of any kind
- Share data with third parties
- Collect personally identifiable information

All network requests made by the extension go exclusively to the SmartSchool domain you are already visiting (same-origin API calls that require your existing login session). The exceptions are:
- fetching SmartSchool's own CDN icons and stylesheets, which are public assets hosted by SmartSchool;
- loading the IBM Plex fonts used by the GradeFlow panel and popup from Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`). Like any website that uses Google Fonts, this request reveals your IP address and browser to Google, but no grades or other data;
- the optional chat and network features below.

Grade Hook share codes contain only the level layout and are shared by you, out of band. The theme diagnostics shortcut (Ctrl+Alt+Shift+D) copies style information about the page element under your mouse to your clipboard so you can paste it in a bug report yourself; it is never sent automatically and contains no grades.

The optional **peer-to-peer chat feature** (see section 3a) connects directly to other users you explicitly invite and makes one request to a public STUN server to assist with the connection. The optional **network features** (see section 3b) also use public relays to find other GradeFlow users on the same network. No chat content, game data, metadata, or user identifiers are ever sent to the extension authors.

---

## 3a. Peer-to-peer chat (optional, F7)

GradeFlow includes an optional chat overlay (toggled with **F7**) that lets you chat with other GradeFlow users. It is fully opt-in, off by default, and requires you to acknowledge a warning everytime you use it.

**How it works**

- Chat uses WebRTC: connections are established **directly between your browser and the other users' browsers**. There is no chat server operated by us or anyone else.
- To start a session, a host generates a room code and invite links (the code is embedded in each link). These are shared **out of band** by the user (copy/paste via Discord, WhatsApp, in person, etc.). We never see or transmit them.
- All chat traffic is end-to-end between peers and is cryptographically authenticated (HMAC-SHA256, keys derived from the room code via PBKDF2-SHA256, 200 000 iterations).
- Messages are kept **in memory only by GradeFlow** (max 60 messages per session) and are erased when the room closes, the browser tab is closed, or the extension restarts. GradeFlow never writes chat content to disk.
- However, "ephemeral" only applies to GradeFlow's own storage. Every peer you chat with receives a copy of your messages in their own browser and is free to copy, screenshot, screen-record, log, or otherwise save them. There is no way for any chat system to prevent the other side from keeping a record. Assume anything you send may be saved by the recipient.

**Data that is necessarily exposed**

Because WebRTC connections are direct:
- Your local (LAN) IP address is visible to every peer you connect with.
- Your public IP address is visible to every peer you connect with.
- Any nickname you choose is visible to every peer, and any peer can freely pick any nickname (including yours). No identity verification is performed.

This is the same exposure any WebRTC-based application (voice/video call, browser game, etc.) produces. You are shown a warning screen before your first chat session.

**External services used for chat**

A single public STUN server (`stun.l.google.com:19302`, operated by Google) is contacted to discover your public IP address so peers can find each other through NAT. STUN requests do not contain any chat content or user identifier; they only return your public IP/port as seen from the internet. Google's privacy policy applies to this request the same way it applies to any web page that uses a Google STUN server.

No TURN relay is used. If a direct connection cannot be established between two users, no chat is possible between them and no data flows.

**What is stored locally for chat**

| Data | Storage location | Lifetime |
|------|-----------------|----------|
| Nickname (last used) | In-memory state of the offscreen document | Cleared when Chrome closes the extension |
| Room code, crypto keys, peer list, messages | In-memory state only | Cleared when the room is closed, the tab is closed long enough, or the extension is restarted |
| "IP warning acknowledged" flag | In-memory state | Cleared on extension restart (warning re-shown) |

No chat data is written to `chrome.storage` or to disk.

---

## 3b. Network chat and Grade.io network mode (optional)

Network chat (in the chat overlay) and the Network mode of Grade.io let you join everyone on the same network without sharing a code. Both are off until you start them yourself.

**How it works**

- GradeFlow asks a public STUN server (`stun.l.google.com:19302`) for your public IP address. If that fails, it asks `api.ipify.org`. Everyone behind the same school or home connection shares that public IP, which is how GradeFlow knows who is "on the same network".
- From that IP, GradeFlow derives a random-looking room name (a SHA-256 hash) and an encryption key (HKDF, AES-GCM 256). Your IP itself is never sent as part of a message.
- To find each other, browsers exchange short connection offers through public MQTT relays: `broker.emqx.io`, `broker.hivemq.com` and `test.mosquitto.org`. These offers are encrypted with the room key, so the relays only see encrypted bytes, the room name, and the IP address you connect from (as with any website).
- After that, chat messages and game data go **directly between the browsers** over WebRTC. They never pass through the relays or any server.
- Anyone who shares your public IP can join the same room. Treat it like a public room for your school network.

**Data that is necessarily exposed**

- The relays see your IP address and that you joined a room, like any server you connect to.
- Every peer in the room sees your nickname and, like in section 3a, your local and public IP address.

Nothing from these features is written to disk. Closing the chat room or the game leaves the room.

---

## 4. Data retention

Grade data in `chrome.storage.local` is overwritten each time you refresh grades and is deleted when you uninstall the extension. `chrome.storage.sync` data (personalisation settings) syncs across your Chrome profile and is removed on uninstall. `localStorage` entries (settings, hours, formula, custom translations) remain until you clear your browser data for the SmartSchool domain or uninstall the extension.

---

## 5. Permissions

The extension requests the following permissions:

| Permission | Reason |
|-----------|--------|
| `storage` | Store grades, settings, and personalisation data locally |
| `tabs` | Communicate between the popup and SmartSchool tabs to apply settings and trigger refreshes |
| `offscreen` | Host the chat and network WebRTC connections in a hidden background page so they survive page navigations inside SmartSchool |
| `alarms`, `notifications` | Show the study reminders you plan yourself |
| `scripting` | Load an arcade game only when you open it, so SmartSchool pages stay fast |
| `host_permissions: *.smartschool.be` | Inject the GradeFlow panel and call SmartSchool's API on SmartSchool pages |
| optional `*.smart-school.net` | Only asked when you press "Allow access" in the theme editor, to read SmartSchool's CDN stylesheets for full theming |

No other permissions are requested.

---

## 6. Children's privacy

GradeFlow does not knowingly collect data from children under 13. The extension processes only grade data that SmartSchool itself provides to authenticated users.

---

## 7. Changes to this policy

If this policy changes materially, the extension version number will be updated and a note will be included in the release changelog.

---

## 8. Contact

If you have questions about this privacy policy, open an issue on the [GitHub repository](https://github.com/ForceWarrior/Smartschool-GradeFlow)
