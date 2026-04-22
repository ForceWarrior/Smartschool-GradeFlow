# GradeFlow - Privacy Policy

**Last updated: April 2026**

GradeFlow is a Chrome extension built for SmartSchool users. This policy explains what data the extension accesses, how it is used, and how it is stored.

---

## 1. Data we access

When you open the GradeFlow panel on a SmartSchool page where you are already logged in, the extension calls SmartSchool's own internal API (`/results/api/v1/evaluations`) to retrieve your grade data. This is the same data SmartSchool displays to you natively.

The extension also reads SmartSchool page styles to extract subject icon classes so it can show the same icons inside the panel.

No other data is accessed.

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

`chrome.storage.local` and `chrome.storage.sync` are private to the extension and not accessible to websites. `localStorage` entries are scoped to the SmartSchool domain.

---

## 3. Data sharing

GradeFlow does **not**:
- Send any data to any external server
- Use analytics or tracking of any kind
- Share data with third parties
- Collect personally identifiable information

All network requests made by the extension go exclusively to the SmartSchool domain you are already visiting (same-origin API calls that require your existing login session). The only exception is fetching SmartSchool's own CDN icons, which are public assets hosted by SmartSchool.

The optional **peer-to-peer chat feature** (see section 3a) connects directly to other users you explicitly invite and makes one request to a public STUN server to assist with the connection. No chat content, metadata, or user identifiers are ever sent to the extension authors or any third-party server.

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

## 4. Data retention

Grade data in `chrome.storage.local` is overwritten each time you refresh grades and is deleted when you uninstall the extension. `chrome.storage.sync` data (personalisation settings) syncs across your Chrome profile and is removed on uninstall. `localStorage` entries (settings, hours, formula, custom translations) remain until you clear your browser data for the SmartSchool domain or uninstall the extension.

---

## 5. Permissions

The extension requests the following permissions:

| Permission | Reason |
|-----------|--------|
| `storage` | Store grades, settings, and personalisation data locally |
| `tabs` | Communicate between the popup and SmartSchool tabs to apply settings and trigger refreshes |
| `offscreen` | Host the peer-to-peer chat WebRTC connection in a hidden background page so it survives page navigations inside SmartSchool |
| `host_permissions: *.smartschool.be` | Inject the GradeFlow panel and call SmartSchool's API on SmartSchool pages |

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
