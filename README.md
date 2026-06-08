# PrescribePro Rx

> A free, offline-capable digital prescription management web app for registered MBBS doctors — built as a single HTML file, no installation required.

![PrescribePro Rx](https://img.shields.io/badge/Status-Active-success?style=flat-square) ![License](https://img.shields.io/badge/License-Free%20for%20Doctors-blue?style=flat-square) ![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20%7C%20Tablet-lightgrey?style=flat-square)

---

## What is PrescribePro Rx?

PrescribePro Rx is a lightweight, single-file web application that lets doctors write, manage, and export professional prescriptions entirely in the browser — without installing any software. It works on desktop, tablet, and mobile, and stores all data locally on your device with optional Google Drive backup.

Designed with the needs of Bangladeshi doctors in mind, but free for any registered MBBS doctor anywhere in the world.

---

## Features

### Patient Management
- Add, edit, and search patient profiles
- Store name, age, gender, weight, blood group, contact number, and known allergies/conditions
- Instant search across your patient list

### Prescription Writing
- Clean, structured prescription form with chief complaints, history, clinical findings, investigations, and advice
- Add multiple medications with drug name, dose, route, frequency, duration, and doctor's comments
- Built-in drug name autocomplete from a curated drug database
- Follow-up scheduling and special notes fields
- Safe data entry — accidental taps outside the form will never close or lose your work

### Prescription Pad Design
- Fully customisable letterhead with doctor's name, qualifications, designation, hospital, registration number, phone, chamber address, and hours
- Header alignment options (left / centre / right)
- Adjustable left-column width and accent colour
- Toggle individual sections on/off (History, Findings, Investigation, Advice, Follow-up)
- Live preview as you design

### PDF & Export
- One-click PDF generation via jsPDF + html2canvas
- Save prescription as a high-quality image
- Print directly from the browser

### Google Drive Backup
- Sign in with Google to enable cloud backup
- All data backed up to your private Google Drive (App Data folder — invisible to other apps)
- Restore your full prescription history on any device after signing in
- Per-account data isolation — each doctor's data is stored separately

### Dashboard
- Summary statistics: total patients, total prescriptions, today's count, this month's count
- Recent prescriptions at a glance

### Privacy & Security
- All data stored locally in your browser's `localStorage`, keyed to your Google account email
- No server, no database, no third-party data collection
- Google Drive sync uses `drive.appdata` scope only — your data is never exposed to other apps or people

---

## How to Use

### Option 1 — Use directly (recommended)
Open `index.html` in any modern browser. No server needed.

### Option 2 — Host on GitHub Pages
1. Fork this repository
2. Go to **Settings → Pages**
3. Set source to the `main` branch, `/ (root)` folder
4. Your app will be live at `https://yourusername.github.io/your-repo-name`

### Option 3 — Host anywhere
Upload `index.html` to any static hosting service (Netlify, Vercel, Cloudflare Pages, cPanel, etc.).

---

## Getting Started

1. Open the app and click **Sign in with Google**
2. Go to **Profile** and fill in your doctor details (name, qualifications, BMDC registration, chamber address, etc.)
3. Go to **Pad Design** and customise your prescription letterhead
4. Add your first patient under **Patients → + New Patient**
5. Open the patient card and click **New Prescription**
6. Fill in the prescription form, click **Preview & Generate PDF**, then **Save & Close**

Your data is saved automatically to your browser. Click the Drive sync button in the top bar to back up to Google Drive.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI & Logic | Vanilla HTML, CSS, JavaScript (single file) |
| PDF Generation | [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) |
| Authentication | Google Identity Services (GSI) |
| Cloud Backup | Google Drive REST API (`drive.appdata` scope) |
| Local Storage | Browser `localStorage` |
| Fonts | Crimson Pro, DM Sans, DM Mono (Google Fonts) |

No frameworks. No build tools. No npm. Just one file.

---

## Compatibility

| Browser | Support |
|---|---|
| Chrome / Edge (desktop) | ✅ Full |
| Firefox (desktop) | ✅ Full |
| Safari (desktop) | ✅ Full |
| Chrome (Android) | ✅ Full |
| Safari (iOS) | ✅ Full |

Works offline after first load (except Google Drive sync, which requires internet).

---

## License & Usage Policy

This project is released **free of charge for all registered MBBS doctors worldwide** as a *Sadaqah Jariyah* (ongoing charitable contribution).

**Please do not sell this software or any part of it to any registered doctor.**

For bug reports or feature suggestions, email: **emranahmed.bd@gmail.com**

---

## About the Author

**Dr. Gazi Md Emran Ahmed, MBBS (DU)**
Bangladesh

Built with the help of various AI tools. If you find any errors or have suggestions, please open an issue on this repository or reach out by email.

> *"Please pray for me, my family, and for all Muslims across the world."*

---

## Screenshots

> *(Add your own screenshots here by dragging images into this section on GitHub)*

| Login | Dashboard | Write Prescription |
|---|---|---|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

---

## Contributing

This is a personal project shared freely with the medical community. Pull requests that fix bugs or improve compatibility are welcome. Please do not submit pull requests that add monetisation, paywalls, or tracking of any kind.

---

*Made with care for the medical community. May it be of benefit.*
