# ⚡ AutoFill Pro — Intelligent Job & Form Copilot

<div align="center">

[![Chrome Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4.svg?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![Pure JavaScript](https://img.shields.io/badge/Vanilla%20JS-ES6+-F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-10b981.svg?style=for-the-badge&logo=shield&logoColor=white)](#-privacy--security)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Fill complex job application forms, campus placement portals, and Google Forms in 1 single click.**

[Features](#-key-features) • [Installation](#-installation-guide) • [Configuration](#-configuration--env-setup) • [Supported Portals](#-supported-platforms--portals) • [Shortcuts](#-keyboard-shortcuts--controls) • [Architecture](#-project-architecture)

</div>

---

## 📌 Overview

**AutoFill Pro** is a high-performance **Manifest V3 Chrome Extension** engineered to eliminate repetitive data entry across job portals, applicant tracking systems (ATS), campus placement drives, and Google Forms.

Unlike naive autofill tools that only recognize standard browser attributes, AutoFill Pro features a **multi-engine semantic matcher** with Roman numeral conversion (`XII` / `Class 12` ➔ `12th`), Google Forms custom DOM support (`aria-labelledby` multi-ID resolution & floating label overlapping fixes), synthetic React/Vue state dispatchers, and a draggable Shadow DOM in-page widget.

---

## ✨ Key Features

### ⚡ 1-Click Form Autofill
- Instantly detects and populates dozens of fields across multi-step application forms.
- Distinguishes intelligently between **Personal Email** (`EMAIL`) and **College / Campus Email** (`COLLEGE_EMAIL`).
- Automatically handles **10th & 12th Board Marks / CGPA / Passing Years**, **Scholar / Roll Numbers**, **Graduation Years**, and **Branch Specializations**.

### 🧠 Advanced Semantic & Heuristic Matcher
- **Multi-ID `aria-labelledby` Resolution**: Traverses and joins spaced IDs (e.g. `aria-labelledby="i1 i4"`) used by Google Forms to read the full question context.
- **Roman Numeral & Synonym Normalizer**: Normalizes variations like `XII`, `Class 12th`, `HSC`, `Plus Two`, `X`, `Matriculation`, `Class 10th`, `SSC`.
- **Branch / Specialization Mapping**: Accurately matches variations like `Electrical`, `EE`, `EEE`, `Electrical Engineering` across dropdowns and custom radio groups.
- **Placeholder & Label Traversal**: Analyzes linked `<label>`, placeholder cues, `name`, `id`, `autocomplete`, and parent container headings.

### 🔘 Custom Google Forms & Radio Support
- Handles Google Forms' unique `div[role="radio"]` components seamlessly.
- Automatically injects `.CDELRd` and manages `.nd91id` classes so floating `"Your answer"` placeholders don't overlap with filled text.

### ⚛️ Reactive Framework State Compatibility
- Triggers native HTML prototype setters (`HTMLInputElement.prototype`, `HTMLSelectElement.prototype`, `HTMLTextAreaElement.prototype`).
- Dispatches synthetic `input`, `change`, `blur`, and `focus` events so single-page apps (React, Angular, Vue, Svelte) register the input in their internal state.

### 🎚️ Global ON/OFF Power Switch
- Toggle extension activity on or off right from the popup header.
- Instantly hides the floating action widget and suppresses all autofill shortcuts when paused.

### 🛡️ Privacy-First & 100% Local
- Zero external servers. Zero telemetry. Zero API tracking.
- Your personal data stays strictly in your local `.env` and browser `chrome.storage.sync`.

### 📋 Floating In-Page Widget & Quick-Copy Drawer
- Draggable, non-intrusive floating `⚡ Autofill` button on any page with form fields.
- Quick-copy drawer for fast 1-click clipboard copying of URLs, emails, phone numbers, and cover letters.

---

## 🚀 Installation Guide

### Prerequisites
- Google Chrome, Brave, Microsoft Edge, or any Chromium-based browser.
- Node.js (v16+) installed (for `.env` synchronization).

### Steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Shivanshh27/AutoFill-Pro.git
   cd AutoFill-Pro
   ```

2. **Configure Your Details**:
   ```bash
   cp env.sample .env
   ```
   Open `.env` in your text editor and fill in your details (name, college, roll number, academic scores, social handles, etc.).

3. **Sync `.env` to Extension Config**:
   ```bash
   npm run sync
   # or
   node sync-env.js
   ```

4. **Load into Google Chrome**:
   1. Open Chrome and go to `chrome://extensions`
   2. Turn **ON** **"Developer mode"** in the top-right corner.
   3. Click **"Load unpacked"** in the top-left corner.
   4. Select the `AutoFill-Pro` project folder.
   5. Pin **AutoFill Pro** to your Chrome toolbar.

---

## ⚙️ Configuration (`.env` Setup)

All your candidate details are managed securely via the [`.env`](file:///d:/Code/Projects/Chrome%20Autofill%20Extension/.env) file:

```properties
# Personal Information
FULL_NAME="Shivansh Nigam"
FIRST_NAME="Shivansh"
LAST_NAME="Nigam"
EMAIL="sxxxxxxxam@gmail.com"
COLLEGE_EMAIL="xxxxxx.com"
PHONE="7xxxxxxxx"
PHONE_COUNTRY_CODE="+91"
DOB="27/04/2004"
GENDER="Male"

# Online Profiles
GITHUB_URL="https://github.com/Shivanshh27"
LINKEDIN_URL="https://linkedin.com/in/shivanshh27"
TWITTER_URL="https://x.com/Shivanshh27"
PORTFOLIO_URL="https://github.com/Shivanshh27"

# Academic & College Placement
COLLEGE_NAME="Maulana Azad National Institute of Technology (MANIT) Bhopal"
DEGREE_LEVEL="B.Tech"
SPECIALIZATION="Electrical Engineering"
ROLL_NO="2311301214"
GRADUATION_YEAR="2027"
START_YEAR="2023"
TENTH_PERCENTAGE="84"
TENTH_PASS_YEAR="2020"
TWELFTH_PERCENTAGE="76"
TWELFTH_PASS_YEAR="2022"
ACTIVE_BACKLOGS="0"

# Address & Location
ADDRESS_LINE1="Maulana Azad National Institute of Technology Bhopal"
CITY="Bhopal"
STATE="Madhya Pradesh"
POSTAL_CODE="462003"
COUNTRY="India"
```

> [!TIP]
> Whenever you update your `.env` file, run `npm run sync` and reload the extension in `chrome://extensions` to update the active profile.

---

## ⌨️ Keyboard Shortcuts & Controls

| Action | Shortcut / Trigger | Description |
| :--- | :--- | :--- |
| **Instant Autofill** | `Alt + Shift + F` | Fills all recognized fields on the active page immediately. |
| **Floating Action Button** | Click `⚡ Autofill` | In-page draggable widget to trigger autofill or open quick copy. |
| **Context Menu** | `Right Click ➔ ⚡ Autofill this form` | Triggers autofill from anywhere on the page. |
| **Global ON/OFF** | Popup Switch | Temporarily pauses or enables autofill and in-page overlays. |
| **Options Dashboard** | Right-click extension icon ➔ **Options** | Open full profile editor, custom vault answers, and JSON backup. |

---

## 🌐 Supported Platforms & Portals

AutoFill Pro works across standard HTML forms and popular ATS platforms:

- ✅ **Google Forms** (Full support for multi-ID `aria-labelledby`, custom radio groups, and floating label overlap prevention)
- ✅ **Workday**
- ✅ **Greenhouse**
- ✅ **Lever**
- ✅ **Ashby**
- ✅ **BambooHR**
- ✅ **Taleo / Oracle Cloud**
- ✅ **Superset / Placement Portals**
- ✅ **Custom Company Career Pages & SPAs**

---

## 🧪 Testing Playground

Test the extension locally with the included ATS sandbox form:
1. Open [`test-page/test-form.html`](file:///d:/Code/Projects/Chrome%20Autofill%20Extension/test-page/test-form.html) in Chrome.
2. Press `Alt + Shift + F` or click the floating `⚡ Autofill` button.
3. Observe all personal, education, academic percentage, and EEO questions populate instantly!

---

## 📁 Project Architecture

```
AutoFill-Pro/
├── manifest.json              # Chrome Manifest V3 configuration
├── .env.example               # Sanitized template for environment variables
├── env.sample                 # Masked sample reference configuration
├── sync-env.js                # Build script syncing .env to config.js
├── config.js                  # Auto-generated runtime profile for extension
├── package.json               # NPM scripts (sync, check, icons)
├── .gitignore                 # Protects sensitive .env and secret files
│
├── background/
│   └── service-worker.js      # Background script, context menu & shortcut handlers
│
├── content/
│   ├── matcher.js             # Semantic field matcher, synonym maps & event dispatcher
│   ├── content.js             # Shadow DOM floating widget, in-page listeners & toast UI
│   └── floating-widget.css    # Isolated styles for in-page floating pill
│
├── popup/
│   ├── popup.html             # Glassmorphic extension popup UI with ON/OFF switch
│   ├── popup.css              # Dark theme styling for popup
│   └── popup.js               # Popup controller, stats counter & quick-copy chips
│
├── options/
│   ├── options.html           # Full profile management & answers vault dashboard
│   ├── options.css            # Polished dashboard styling
│   └── options.js             # Profile CRUD, custom key-values & JSON export/import
│
├── icons/                     # Extension icons (16x16, 48x48, 128x128 PNG & SVG)
└── test-page/
    ├── test-form.html         # Local ATS application testing sandbox
    └── test-form.css          # Sandbox styling
```

---

## 🔒 Privacy & Security

- **No Remote Telemetry**: AutoFill Pro does not make any external network requests or transmit candidate information to third-party servers.
- **Git Security**: `.env` and `.env.*.local` are strictly excluded in `.gitignore` to prevent leaking private information to public repositories.
- **Isolated DOM Injection**: In-page widgets are encapsulated inside a Shadow Root, preventing styles from leaking or interfering with the host website.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).