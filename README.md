# PrescriptionPro-Rx (Version 3) 🩺

> **A professional, offline-first digital prescription pad and clinical practice management software for registered medical practitioners.**

[![Version](https://img.shields.io/badge/Version-3.0_Pro-blue.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)
[![Status](https://img.shields.io/badge/Status-Active_Production-success.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)
[![Platform](https://img.shields.io/badge/Platform-Web_|_Mobile_|_Tablet-lightgrey.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)
[![Data Privacy](https://img.shields.io/badge/Privacy-100%25_Local_First_|_Zero_Telemetry-success.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)
[![Standard](https://img.shields.io/badge/Standard-WHO_|_ISO_216_A4_|_WCAG_2.1-orange.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)

---

## 🌟 What is PrescriptionPro-Rx Version 3?

**PrescriptionPro-Rx Version 3** is a modernized, clinical-grade medical prescription pad designed specifically for doctors to write, manage, archive, and print clean, professional prescriptions within seconds.

Built on an **offline-first, zero-friction architecture**, it runs directly in any modern browser without requiring database setups, server hosting, or software installations. All patient information and clinical notes stay securely stored on the doctor's local device, with an optional encrypted background sync to the doctor's private Google Drive (`appDataFolder`).

---

## 🚀 What's New in Version 3?

* **⚡ Zero-Friction Quick Local Login**: Eliminated unnecessary offline lock PIN barriers. Doctors can enter their workspace immediately with just their name and BMDC registration.
* **🔍 Real-Time Multi-Attribute Live Search**:
  * **Patient Directory Search**: Instant filtering by Patient Name, Phone Number, Blood Group, or Medical Allergies.
  * **Prescription Archive Search**: Filter past prescriptions in real-time by Patient Name, Diagnosis, Chief Complaints, or Date (`YYYY-MM-DD`).
* **✒️ Configurable Doctor's Signature Block**: Added a toggle under **Pad Settings** allowing doctors to show or hide the formal signature line depending on clinic preference.
* **📄 Smart Two-Column Medicine Auto-Fit**: Intelligently switches medicine lists to a balanced two-column format when multiple drugs are prescribed, ensuring the prescription never overflows past the footer rule.
* **🖨️ Precision Single-Page A4 Printing Engine**: Strict millimeter sizing (`210mm × 296.8mm`) eliminates trailing blank pages during browser print.
* **🖼️ Off-Screen HD 300 DPI Image Export**: Renders crisp, print-ready PNG images off-screen at natural aspect ratio without font or layout distortion.
* **🔄 Synchronized Profile & Disclaimer Architecture**: Updating footer disclaimers in either Doctor Profile or Pad Settings immediately updates both fields and saves in real-time.
* **📱 Enhanced Mobile Navigation**: Responsive bottom navigation bar with a central Floating Action Button (FAB) for instant prescription writing on smartphones and tablets.

---

## 🏥 Clinical Feature Highlights

### 1. Prescription Pad & Consultation Workflow
* **Clinical Sections**: Dedicated blocks for Chief Complaints, Medical History, Clinical Findings (O/E), Investigations Advised, Diagnosis, Advice, and Follow-up.
* **Quick-Pick Clinical Chips**: One-tap clinical presets for common symptoms, lab tests, and clinical advice.
* **41,000+ Medicine Formulary**: Instant autocomplete searching by brand name, generic molecule, dosage form, strength, and manufacturer.
* **Intelligent Auto-Routing**: Automatically suggests routes of administration (Oral, Topical, IV, IM, Inhalation) based on the dosage form selected (Tablet, Syrup, Injection, Cream, Inhaler).
* **Flexible Dosing**: Presets for frequency (`1-0-1`, `1-1-1`, `1-0-0`), timing (`Before meal`, `After meal`, `Bedtime`, or custom instructions), and duration (`3 days`, `5 days`, `1 month`).

### 2. Patient Profile & Longitudinal History
* Store complete demographics: Name, Age, Gender, Weight, Blood Group, Phone, and Critical Drug Allergies.
* **Timeline History**: Chronological history of all past prescriptions issued to each patient with one-tap re-issue, viewing, editing, or printing.

### 3. Strict ISO 216 Standard A4 Layout
* Standard aspect ratio (`1 : 1.414`) formatted exactly to A4 physical dimensions.
* Dynamic letterhead customizable with doctor qualifications, hospital affiliations, chamber address, phone hotline, consultation hours, and BMDC registration number.
* Accent color picker to match hospital/clinic branding.

### 4. Data Security & Multi-Layer Backup
* **100% Local-First**: Zero patient data is sent to external third-party database servers.
* **Google Drive Private Cloud Sync**: Seamless background synchronization with Google Drive AppData folder (`drive.appdata`), isolated from other applications.
* **JSON Backup Export/Import**: One-click download of the complete patient database as a portable `.json` backup file for archival or device migration.

---

## 📖 Step-by-Step User Guide

### 1. Initial Setup
1. Open `index.html` in your web browser (Chrome, Firefox, Safari, Edge).
2. Choose **Quick Local / Offline** and enter your Doctor Name and BMDC Registration Number.
3. Click **Enter Prescription Workspace**.
4. Go to **Doctor Profile** (`👨‍⚕️`) from the sidebar or settings to configure your qualifications, hospital affiliation, chamber address, consultation hours, and hotline.

### 2. Customizing Your Pad Design
1. Navigate to **Pad Settings** (`📑`).
2. Select your preferred **Header Alignment** (Center, Left, or Right) and **Accent Color**.
3. Choose whether to display generic molecule names alongside brand names.
4. Toggle sections you need (History, Findings, Investigation, Advice, Follow-up, Doctor's Signature).
5. All adjustments reflect immediately in the live preview.

### 3. Writing a Prescription
1. Click **+ New Prescription** on the Dashboard or tap the **➕ FAB** button on mobile.
2. Select an existing patient from the dropdown, or tap **+ Quick Add Patient** to register a new profile on the fly.
3. Fill in clinical findings or click **⚡ Quick picks** to insert common phrases.
4. In the **Medicines** section, type the medicine brand or generic name into the autocomplete box.
5. Select frequency, timing, and duration chips. Add additional medications using **+ Add Medication**.
6. Set follow-up days and consultation advice.
7. Click **Save & Preview Prescription**.

### 4. Printing & Exporting
* **Print**: Click **🖨️ Print Prescription** to send directly to any connected A4 printer.
* **HD Image**: Click **🖼️ Download HD Image** to generate a 300 DPI high-definition PNG image for digital sharing via WhatsApp or email.

---

## 🛠️ Technology Stack & Architecture

| Component | Architecture / Technology |
|---|---|
| **Frontend Runtime** | Pure Vanilla JavaScript (ES6+), HTML5, CSS3 Variables |
| **Design System** | Responsive Grid & Flexbox, Dark/Light mode theme system |
| **Formulary Database** | Indexed/Memory-cached 41,000+ medicine catalog (`data/drugs.json`) |
| **Export Engines** | High-DPI Canvas (`html2canvas`), Native Browser Print CSS (`@page size: A4`) |
| **Data Persistence** | Local Storage (`localStorage`), Portable JSON schema v3.0 |
| **Cloud Synchronization** | Google Identity Services (GSI OAuth 2.0) + Google Drive AppData REST API |
| **Typography** | Crimson Pro (Serif Letterhead) & DM Sans (Medical Body Font) |

---

## 🌐 International Healthcare & Medical Software Standards

PrescriptionPro-Rx Version 3 is architected with strict adherence to global digital health guidelines:

### 1. Data Privacy & Sovereign Storage (HIPAA / GDPR / Data Protection Act)
* **Local-First Privacy**: Patient records (PHI/PII) reside exclusively in browser storage on the practitioner's physical device. No telemetry, third-party analytics trackers on medical records, or central database liabilities exist.
* **Isolated Cloud Storage**: Cloud backups use Google's restricted `drive.appdata` scope, ensuring files remain invisible to other applications and under the doctor's direct control.

### 2. WHO & Medical Regulatory Prescription Pad Compliance
* Prescriber identification details (name, credentials, registration, chamber contact).
* Patient identification (full name, age, gender, contact, allergy warnings).
* Universal Rx superscription symbol with dated visit chronological serials.
* Clear inscription: formulation, brand name, generic molecule name, strength, dosage frequency, route of administration, and instructions.
* Prescriber authentication signature block.
* Standard statutory medication disclaimer and follow-up directives.

### 3. Universal Web Accessibility (WCAG 2.1 / 2.2 AA)
* Standard contrast ratios across light and dark modes.
* Full keyboard navigation for medicine search (Arrow keys `↑`/`↓`, `Enter` to select, `Esc` to close).
* Touch target sizing exceeding 44px on mobile devices for clinical safety.
* High-visibility red alert badges for known patient allergies.

---

## 📄 License

PrescriptionPro-Rx is open source software released under the GNU General Public License v3.0 (GPL-3.0). Free for registered doctors, clinics, and medical practitioners worldwide.
