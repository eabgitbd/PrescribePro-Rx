# PrescribePro-Rx (Version 4.1 Pro) 🩺 🦷

> **A professional, offline-first digital prescription pad and clinical practice management software for registered medical and dental practitioners (MBBS & BDS) worldwide.**

[![Live Web App](https://img.shields.io/badge/Live_App-Launch_PrescribePro--Rx-1e3a8a?style=for-the-badge&logo=googlechrome&logoColor=white)](https://eabgitbd.github.io/PrescribePro-Rx/)
[![Version](https://img.shields.io/badge/Version-4.1_Pro-blue.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)
[![Practitioners](https://img.shields.io/badge/Practitioners-MBBS_&_BDS-purple.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)
[![Status](https://img.shields.io/badge/Status-Active_Production-success.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)
[![Platform](https://img.shields.io/badge/Platform-Web_|_Mobile_|_Tablet-lightgrey.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)
[![Data Privacy](https://img.shields.io/badge/Privacy-100%25_Local_First_|_Zero_Telemetry-success.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)
[![Standard](https://img.shields.io/badge/Standard-WHO_|_ISO_216_A4_|_BMDC_Compliant-orange.svg?style=flat-square)](https://github.com/eabgitbd/PrescribePro-Rx)

🌐 **Live Web Application**: [https://eabgitbd.github.io/PrescribePro-Rx/](https://eabgitbd.github.io/PrescribePro-Rx/)

---

## 🌟 What is PrescribePro-Rx Version 4.1?

**PrescribePro-Rx Version 4.1** is a modernized, clinical-grade digital prescription suite authored by **Dr. Someone** and designed specifically for registered **MBBS and BDS doctors** to write, manage, archive, and print clean, professional A4 prescriptions within seconds.

Built on an **offline-first, zero-friction architecture**, it runs directly in any modern browser without requiring backend servers, database setups, or recurring subscription fees. All patient records and prescriptions remain 100% private on the doctor's local machine, with optional real-time synchronization to private Google Drive storage.

---

## 🚀 Key Highlights in Version 4.1

* **🦷 Interactive Dental Quadrant (`/q`) with Palmer Notation**:
  * Native inline Palmer dental notation cross chips inside any clinical text field.
  * Instant trigger by typing `/q` (or tapping the mobile **🦷 Quadrant** button).
  * Palmer clinician orientation: Upper Right (top-left), Upper Left (top-right), Lower Right (bottom-left), Lower Left (bottom-right).
  * Validates permanent teeth (`1`–`8`) and deciduous teeth (`A`–`E`) with auto-capitalization.
  * **Staged Backspace Deletion**: Gradual character-by-character deletion in reverse order (`LL -> LR -> UL -> UR`) before removing the entire quadrant chip.
  * Crisp vector rendering in A4 preview, native print, and 300 DPI HD PNG exports without disrupting line heights.
* **📋 Dynamic Clinical & Treatment "Plan"**:
  * New check-activated **Plan** section located directly below **Diagnosis**.
  * When checked, expands a rich text input with built-in quick picks and dental quadrant support.
  * Automatically renders on the left panel of the prescription matching the exact style, font weight, and accent color of the other clinical headings (`COMPLAINTS`, `DIAGNOSIS`, `INVESTIGATION`, etc.).
  * Disappears completely from the prescription when unchecked.
* **🏛️ Balanced Dual Header Layout (Doctor & Chamber)**:
  * Two-column header layout featuring Doctor details on the left and Chamber / Clinic details on the right with independent size hierarchies and zero overlap.
  * Dynamic centering fallback when no chamber information is entered.
* **📄 Automatic Multi-Page Overflow Continuation**:
  * Automatically calculates space and splits extensive prescriptions across Page 1, Page 2, Page 3+ with continuous drug numbering, identical doctor letterhead, persistent patient demographics, and standard continuation headers (`Continuation of the 1st page of the prescription.`).
* **🇧🇩 Flexible BMDC Registration Format**:
  * Open input supporting both alphanumeric and numeric registration formats (e.g. `A-12345` or `12345`) with automatic prescription letterhead formatting (`BMDC Reg No: ...`). Mandatory for offline practice entry.
* **💊 Bilingual Clinical Suggestions**:
  * Frequency (`১+০+১` / `1+0+1`), Duration (`(৭ দিন)` / `(7 days)`), Timing, and bilingual administration routes (`Oral [মুখে]`, `IV [শিরায়]`, `Eye Drop [চোখে]`, `Ear Drop [কানে]`).
* **🚨 Real-Time Allergy & Safety Alerts**:
  * Active real-time patient demographics banner and critical allergy interaction warnings during drug entry.
* **⚡ Zero-Latency IndexedDB Database**:
  * 39,950+ normalized clinical medicines cached locally with instant search relevance.
* **📋 Custom Formulary Manager**:
  * Add, edit, and organize custom medicines with cloud backup.
* **💾 Smart-Merge Offline Backup & Restore**:
  * Blob-streamed JSON backups with interactive review modal, conflict-free timestamp merging (zero risk of local data loss), and legacy/cloud format support.
* **🖨️ Crisp Multi-Page Print & HD Image Export**:
  * High-DPI canvas capture and clean CSS `@page` printing.

---

## 🏥 Clinical & Dental Feature Highlights

### 1. Prescription Pad & Consultation Workflow
* **Clinical Sections**: Dedicated blocks for Chief Complaints, Medical History, Clinical Findings (O/E), Investigations Advised, Diagnosis, Treatment Plan, Advice, and Follow-up.
* **Quick-Pick Clinical Chips**: One-tap clinical presets for common general medical and dental procedures (e.g., Scaling & Polishing, Root Canal Treatment, Extraction, Restoration).
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
* **Smart-Merge JSON Backup Export/Import**: Fast, blob-streamed download of the complete practice database. When restoring, doctors can choose **Smart Merge** (deduplicates by ID and latest timestamp without deleting any records created on the current device) or **Clean Overwrite**. Fully compatible with V3 legacy exports and Google Drive cloud backups.

---

## 📖 Step-by-Step User Guide

### 1. Initial Setup
1. Open `index.html` in your web browser (Chrome, Firefox, Safari, Edge).
2. Choose **Quick Local / Offline** and enter your Doctor Name and BMDC Registration Number.
3. Click **Enter Prescription Workspace**.
4. Go to **Doctor Profile** (`👨‍⚕️`) from the sidebar or settings to configure your qualifications (`MBBS`, `BDS`, `FCPS`, etc.), hospital affiliation, chamber details, consultation hours, and hotline.

### 2. Customizing Your Pad Design
1. Navigate to **Pad Settings** (`📑`).
2. Select your preferred **Header Alignment** (Center, Left, or Right) and **Accent Color**.
3. Choose whether to display generic molecule names alongside brand names.
4. Toggle sections you need (History, Findings, Investigation, Advice, Follow-up, Doctor's Signature).
5. All adjustments reflect immediately in the live preview.

### 3. Writing a Prescription (Medical or Dental)
1. Click **+ New Prescription** on the Dashboard or tap the **➕ FAB** button on mobile.
2. Select an existing patient from the dropdown, or tap **+ Quick Add Patient** to register a new profile on the fly.
3. Fill in clinical findings or click **⚡ Quick picks** to insert common phrases.
4. **Dental Quadrants**: In any clinical field (Complaints, Findings, Diagnosis, Plan, Advice), type `/q` (or tap **🦷 Quadrant**) to insert a Palmer cross and type tooth numbers into the 4 corners.
5. **Treatment Plan**: Check the **Plan** checkbox to enter treatment plans or planned procedures.
6. In the **Medicines** section, type the medicine brand or generic name into the autocomplete box.
7. Select frequency, timing, and duration chips. Add additional medications using **+ Add Medication**.
8. Set follow-up days and consultation advice.
9. Click **Save & Preview Prescription**.

### 4. Printing & Exporting
* **Print**: Click **🖨️ Print Prescription** to send directly to any connected A4 printer.
* **HD Image**: Click **🖼️ Download HD Image** to generate a 300 DPI high-definition PNG image for digital sharing via WhatsApp or email.

---

## 🛠️ Technology Stack & Architecture

| Component | Architecture / Technology |
|---|---|
| **Frontend Runtime** | Pure Vanilla JavaScript (ES6+), HTML5, CSS3 Variables |
| **Design System** | Responsive Grid & Flexbox, Dark/Light mode theme system |
| **Formulary Database** | IndexedDB 0ms cached 39,950+ clinical medicine catalog (`data/drugs.json`) |
| **Export Engines** | High-DPI Canvas (`html2canvas`), Native Browser Print CSS (`@page size: A4`) |
| **Data Persistence** | Local Storage (`localStorage`), Portable JSON schema v4.1 |
| **Cloud Synchronization** | Google Identity Services (GSI OAuth 2.0) + Google Drive AppData REST API |
| **Typography** | Crimson Pro (Serif Letterhead) & DM Sans (Medical Body Font) |

---

## 🌐 International Healthcare & Medical Software Standards

PrescribePro-Rx Version 4.1 is architected with strict adherence to global digital health guidelines:

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

## 📄 License & Attribution

PrescribePro-Rx Version 4.1 is open-source medical software authored by **Dr. Someone** and released under the GNU General Public License v3.0 (GPL-3.0). Free for registered doctor brothers and sisters worldwide who have completed their MBBS or BDS degree. Commercial re-selling of this project is strictly prohibited. Medical and dental practitioners are warmly welcome to use it in private practice and clinical chambers.
