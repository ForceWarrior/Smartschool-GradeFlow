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
