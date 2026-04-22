# GradeFlow, Privacy Policy

**Last updated: April 2026**

GradeFlow ("the extension") is a Chrome extension built for SmartSchool users. This policy explains what data the extension accesses, how it is used, and how it is stored.

---

## 1. Data we access

When you open the GradeFlow panel on a SmartSchool page where you are already logged in, the extension calls SmartSchool's own internal API (`/results/api/v1/evaluations`) to retrieve your grade data. This is the same data SmartSchool displays to you natively.

The extension also reads the CSS of the SmartSchool page to extract subject icon styles so it can display the same icons inside the panel.

No other data is accessed.

---

## 2. How data is stored

All data is stored **locally on your device only**:

| Data | Storage location | Purpose |
|------|-----------------|---------|
| Your grade data (scores, subjects, periods) | `chrome.storage.local` | Display grades in the panel; cleared when you fetch new grades |
| Lesson hours per subject | `localStorage` | Hour-weighted average calculation |
| Weighting formula | `localStorage` | Custom period formula |
| Theme, language, settings | `localStorage` | Restore your preferences |
| Subject icon overrides | `localStorage` | Remember per-subject icon choices |

`chrome.storage.local` is private to the extension and is not accessible to websites. `localStorage` is scoped to the SmartSchool domain.

---

## 3. Data sharing

GradeFlow does **not**:
- Send any data to any external server
- Use analytics or tracking of any kind
- Share data with third parties
- Collect personally identifiable information

All network requests made by the extension go exclusively to the SmartSchool domain you are already visiting (same-origin API calls that require your existing login session).

The optional **peer-to-peer chat feature** (see section 3a) connects directly to other users you explicitly invite and makes one request to a public STUN server to assist with the connection. No chat content, metadata, or user identifiers are ever sent to the extension authors or any third-party server.

---

## 3a. Peer-to-peer chat (optional, F7)

GradeFlow includes an optional chat overlay (toggled with **F7**) that lets you chat with other GradeFlow users. It is fully opt-in, off by default, and requires you to acknowledge a warning the first time you use it.

- Chat uses WebRTC: connections are established **directly between your browser and the other users' browsers**. There is no chat server operated by us or anyone else.
- To start a session, a host generates a room code and invite links (the code is embedded in each link). These are shared **out of band** by the user (copy/paste via Discord, WhatsApp, in person, etc.). We never see or transmit them.
- All chat traffic is end-to-end between peers and is cryptographically authenticated (HMAC-SHA256, keys derived from the room code via PBKDF2-SHA256, 200 000 iterations).
- Messages are kept **in memory only by GradeFlow** (max 60 messages per session) and are erased when the room closes, the browser tab is closed, or the extension restarts. GradeFlow never writes chat content to disk.
- However, "ephemeral" only applies to GradeFlow's own storage. Every peer you chat with receives a copy of your messages in their own browser and is free to copy, screenshot, screen-record, log, or otherwise save them. There is no way for any chat system to prevent the other side from keeping a record. Assume anything you send may be saved by the recipient.

Because WebRTC connections are direct, your local (LAN) IP address and public IP address are visible to every peer you connect with. Any peer can freely pick any nickname (including yours), no identity verification is performed. This is the same exposure any WebRTC-based application produces; you are shown a warning screen before your first chat session.

A single public STUN server (`stun.l.google.com:19302`, operated by Google) is contacted to discover your public IP address so peers can find each other through NAT. STUN requests contain no chat content or user identifier. No TURN relay is used, if a direct connection cannot be established, no chat is possible and no data flows.

---

## 4. Data retention

Grade data in `chrome.storage.local` is overwritten each time you refresh grades and is deleted when you uninstall the extension. `localStorage` entries (settings, hours, formula) remain until you clear your browser data for the SmartSchool domain or uninstall the extension.

---

## 5. Permissions

The extension requests the following permissions:

| Permission | Reason |
|-----------|--------|
| `storage` | Store grades and settings locally via `chrome.storage.local` |
| `tabs` | Communicate between the popup and the active SmartSchool tab to trigger a grade refresh |
| `offscreen` | Host the optional peer-to-peer chat WebRTC connection in a hidden background page so it survives page navigations inside SmartSchool |
| `host_permissions: *.smartschool.be` | Inject the GradeFlow panel and call SmartSchool's API on SmartSchool pages |

No other permissions are requested.

---

## 6. Children's privacy

GradeFlow does not knowingly collect data from children under 13. The extension processes only grade data that SmartSchool itself provides to authenticated users.

---

## 7. Changes to this policy

If this policy changes materially, the extension's version number will be updated and a note will be included in the release changelog.

---

## 8. Contact

If you have questions about this privacy policy, open an issue on the project's GitHub repository or contact the developer directly via the Chrome Web Store listing.
