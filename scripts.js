// ── GLOBAL GOOGLE AUTH & APP VARIABLES ──
var googleAccessToken = null;
var googleTokenExpiry = null;
var tokenClient = null;
var autoLockTimer = null;
var lastActivityTime = Date.now();
var currentRxZoom = 1.0;
var externalDrugs = [];

// ── STATE ──
let state = {
  loggedIn: false,
  loginMethod: 'local', // 'google' or 'local'
  securityPin: '',
  autoLockMinutes: 0,   // Lock disabled
  theme: 'light',       // 'light' or 'dark'
  user: { name: 'Dr. Someone', email: '', initials: 'DS' },
  profile: {
    name: 'Dr. Someone',
    qualifications: 'MBBS (DU)',
    designation: 'General Practitioner / Specialist',
    hospital: 'Medical College & Hospital',
    reg: 'Regi: A-000000',
    phone: '+880 1700-000000',
    address: 'Chamber: House 12, Road 5, Dhaka',
    hours: '4:00 PM - 9:00 PM (Closed on Friday)',
    footer: 'নিয়ম মাফিক ঔষধ খাবেন। ডাক্তারের পরামর্শ ব্যতীত ঔষধ পরিবর্তন নিষেধ।',
    chamberName: '',
    chamberPhone: '+880 1800-000000',
    chamberAddr1: 'Dhanmondi, Dhaka',
    chamberAddr2: 'Room 302, 3rd Floor',
    chamberHours: '5 PM - 9 PM',
    chamberNote: 'Serial by phone'
  },
  padSettings: {
    align: 'center',
    leftWidth: 165,
    color: '#1a3a5c',
    showHistory: true,
    showFindings: true,
    showInvestigation: true,
    showAdvice: true,
    showFollowup: true,
    showSignature: true, // Toggle Doctor's Signature block on prescription
    showGenericNames: false, // Default: Brand Name shown, Generic Name togglable
    useClinicalPrefix: true, // e.g. "Tab. Napa" instead of "Tablet Napa"
    margins: { top: 13, bottom: 14, left: 14, right: 14 },
    signature: null
  },
  patients: [],
  prescriptions: [],
  customDrugs: [],
  currentRx: null,
  editingPatientId: null
};

// ── CLINICAL MEDICINE TYPES / FORMS ──
const MEDICINE_FORMS = [
  { label: 'Tab. (Tablet)', value: 'Tab.', full: 'Tablet' },
  { label: 'Cap. (Capsule)', value: 'Cap.', full: 'Capsule' },
  { label: 'Syr. (Syrup)', value: 'Syr.', full: 'Syrup' },
  { label: 'Susp. (Suspension)', value: 'Susp.', full: 'Suspension' },
  { label: 'Inj. (Injection)', value: 'Inj.', full: 'Injection' },
  { label: 'Supp. (Suppository)', value: 'Supp.', full: 'Suppository' },
  { label: 'Gtt. (Eye/Ear Drops)', value: 'Gtt.', full: 'Drops' },
  { label: 'Oint. (Cream/Ointment)', value: 'Oint.', full: 'Cream/Ointment' },
  { label: 'Inh. (Inhaler/Nebulizer)', value: 'Inh.', full: 'Inhaler' },
  { label: 'Powder / Sachet', value: 'Sachet', full: 'Sachet' },
  { label: 'Sol. (Solution)', value: 'Sol.', full: 'Solution' },
  { label: 'Lotion', value: 'Lotion', full: 'Lotion' }
];

// Route of administration presets (auto-suggested from the medicine form).
const ROUTES = ['Oral', 'Sublingual', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Ophthalmic', 'Otic', 'Nasal', 'Rectal', 'Vaginal'];
const ROUTE_BY_FORM = { 'Gtt.': 'Ophthalmic', 'Oint.': 'Topical', 'Lotion': 'Topical', 'Inh.': 'Inhalation', 'Supp.': 'Rectal' };
// Common dosing-frequency and duration shorthand for one-tap entry.
const FREQ_PRESETS = ['1-0-0', '0-0-1', '1-0-1', '1-1-1', '1-1-0', '0-1-1', '2-0-2', 'SOS', 'Stat'];
const DURATION_PRESETS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '2 months', 'Continue'];

// Common clinical phrases for one-tap entry into the clinical notes.
const CLINICAL_PRESETS = {
  'rx-complaints': ['Fever', 'Cough', 'Headache', 'Sore throat', 'Runny nose', 'Body ache', 'Abdominal pain', 'Vomiting', 'Diarrhoea', 'Shortness of breath', 'Chest pain', 'Dizziness', 'Generalized weakness', 'Insomnia', 'Loss of appetite'],
  'rx-history': ['No HTN', 'No DM', 'Non-smoker', 'Non-alcoholic', 'Known asthmatic', 'Known IHD', 'Known CKD', 'Previous surgery', 'Family history of DM'],
  'rx-findings': ['BP: / mmHg', 'Temp: °F', 'Pulse: /min', 'Chest: Clear', 'Abdomen: Soft, non-tender', 'No pedal edema', 'Conscious, oriented', 'Anaemia: present'],
  'rx-investigation': ['CBC with ESR', 'RBS', 'Serum creatinine', 'Lipid profile', 'Chest X-Ray (P/A view)', 'ECG', 'USG whole abdomen', 'Urine R/E'],
  'rx-diagnosis': ['Acute URTI', 'Acute Gastroenteritis', 'Type 2 Diabetes Mellitus', 'Hypertension', 'Bronchial Asthma', 'Iron deficiency anaemia', 'URTI with Bronchitis', 'Peptic ulcer disease']
};

// ── BUILT-IN FALLBACK DRUG DATABASE ──
const DRUGS = [
  { name: 'Napa', generic: 'Paracetamol', dose: '500mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳1.50/tab' },
  { name: 'Napa Extra', generic: 'Paracetamol + Caffeine', dose: '500mg+65mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳2.00/tab' },
  { name: 'Napa Extend', generic: 'Paracetamol (Extended Release)', dose: '665mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳2.50/tab' },
  { name: 'Ace', generic: 'Paracetamol', dose: '500mg', form: 'Tab.', company: 'Square Pharma', price: '৳1.50/tab' },
  { name: 'Ace Plus', generic: 'Paracetamol + Caffeine', dose: '500mg+65mg', form: 'Tab.', company: 'Square Pharma', price: '৳2.00/tab' },
  { name: 'Renova', generic: 'Paracetamol', dose: '500mg', form: 'Tab.', company: 'Renata Ltd', price: '৳1.50/tab' },
  { name: 'Fast', generic: 'Paracetamol', dose: '500mg', form: 'Tab.', company: 'ACI Pharma', price: '৳1.50/tab' },
  { name: 'Seclo', generic: 'Omeprazole', dose: '20mg', form: 'Cap.', company: 'Square Pharma', price: '৳5.00/cap' },
  { name: 'Losectil', generic: 'Omeprazole', dose: '20mg', form: 'Cap.', company: 'Beximco Pharma', price: '৳5.00/cap' },
  { name: 'Sergel', generic: 'Esomeprazole', dose: '20mg', form: 'Cap.', company: 'Healthcare Pharma', price: '৳7.00/cap' },
  { name: 'Maxpro', generic: 'Esomeprazole', dose: '20mg', form: 'Cap.', company: 'Renata Ltd', price: '৳7.00/cap' },
  { name: 'Pantop', generic: 'Pantoprazole', dose: '20mg', form: 'Tab.', company: 'Square Pharma', price: '৳7.00/tab' },
  { name: 'Neopan', generic: 'Pantoprazole', dose: '40mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳7.00/tab' },
  { name: 'Rabeca', generic: 'Rabeprazole', dose: '20mg', form: 'Tab.', company: 'Square Pharma', price: '৳8.00/tab' },
  { name: 'Amoxil', generic: 'Amoxicillin', dose: '500mg', form: 'Cap.', company: 'Square Pharma', price: '৳8.00/cap' },
  { name: 'Moxacil', generic: 'Amoxicillin', dose: '500mg', form: 'Cap.', company: 'Beximco Pharma', price: '৳8.00/cap' },
  { name: 'Zithromax', generic: 'Azithromycin', dose: '500mg', form: 'Tab.', company: 'Pfizer / Square', price: '৳50.00/tab' },
  { name: 'Azithcin', generic: 'Azithromycin', dose: '500mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳48.00/tab' },
  { name: 'Zimax', generic: 'Azithromycin', dose: '500mg', form: 'Tab.', company: 'Renata Ltd', price: '৳50.00/tab' },
  { name: 'Ciprocin', generic: 'Ciprofloxacin', dose: '500mg', form: 'Tab.', company: 'Square Pharma', price: '৳14.00/tab' },
  { name: 'Neofloxin', generic: 'Ciprofloxacin', dose: '500mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳14.00/tab' },
  { name: 'Flagyl', generic: 'Metronidazole', dose: '400mg', form: 'Tab.', company: 'Sanofi / Square', price: '৳3.50/tab' },
  { name: 'Amodis', generic: 'Metronidazole', dose: '400mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳3.50/tab' },
  { name: 'Cef-3', generic: 'Cefixime', dose: '200mg', form: 'Cap.', company: 'Beximco Pharma', price: '৳35.00/cap' },
  { name: 'Cefix', generic: 'Cefixime', dose: '200mg', form: 'Cap.', company: 'Square Pharma', price: '৳35.00/cap' },
  { name: 'Zinnat', generic: 'Cefuroxime Axetil', dose: '500mg', form: 'Tab.', company: 'GSK', price: '৳85.00/tab' },
  { name: 'Kilmax', generic: 'Cefuroxime Axetil', dose: '500mg', form: 'Tab.', company: 'Square Pharma', price: '৳80.00/tab' },
  { name: 'Doxacin', generic: 'Doxycycline', dose: '100mg', form: 'Cap.', company: 'Square Pharma', price: '৳7.00/cap' },
  { name: 'Glucomin', generic: 'Metformin HCl', dose: '500mg', form: 'Tab.', company: 'Square Pharma', price: '৳3.50/tab' },
  { name: 'Comet', generic: 'Metformin HCl', dose: '500mg', form: 'Tab.', company: 'Square Pharma', price: '৳3.50/tab' },
  { name: 'Amaryl', generic: 'Glimepiride', dose: '2mg', form: 'Tab.', company: 'Sanofi-Aventis', price: '৳15.00/tab' },
  { name: 'Secrin', generic: 'Glimepiride', dose: '2mg', form: 'Tab.', company: 'Square Pharma', price: '৳12.00/tab' },
  { name: 'Amdocal', generic: 'Amlodipine', dose: '5mg', form: 'Tab.', company: 'Square Pharma', price: '৳5.00/tab' },
  { name: 'Amlong', generic: 'Amlodipine', dose: '5mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳5.00/tab' },
  { name: 'Bisoren', generic: 'Bisoprolol Fumarate', dose: '2.5mg', form: 'Tab.', company: 'Square Pharma', price: '৳8.00/tab' },
  { name: 'Losartan', generic: 'Losartan Potassium', dose: '50mg', form: 'Tab.', company: 'Square Pharma', price: '৳9.00/tab' },
  { name: 'Angilock', generic: 'Losartan Potassium', dose: '50mg', form: 'Tab.', company: 'Square Pharma', price: '৳9.00/tab' },
  { name: 'Atova', generic: 'Atorvastatin', dose: '10mg', form: 'Tab.', company: 'Square Pharma', price: '৳12.00/tab' },
  { name: 'Lipicon', generic: 'Atorvastatin', dose: '10mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳12.00/tab' },
  { name: 'Ecotrin', generic: 'Aspirin (Gastro-resistant)', dose: '75mg', form: 'Tab.', company: 'Square Pharma', price: '৳2.00/tab' },
  { name: 'Clopid', generic: 'Clopidogrel', dose: '75mg', form: 'Tab.', company: 'Square Pharma', price: '৳12.00/tab' },
  { name: 'Anlet', generic: 'Clopidogrel', dose: '75mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳12.00/tab' },
  { name: 'Calbo-D', generic: 'Calcium + Vitamin D3', dose: '500mg+200IU', form: 'Tab.', company: 'Square Pharma', price: '৳9.00/tab' },
  { name: 'Calcin-D', generic: 'Calcium + Vitamin D3', dose: '500mg+200IU', form: 'Tab.', company: 'Beximco Pharma', price: '৳9.00/tab' },
  { name: 'Fexo', generic: 'Fexofenadine HCl', dose: '120mg', form: 'Tab.', company: 'Square Pharma', price: '৳12.00/tab' },
  { name: 'Alatrol', generic: 'Cetirizine HCl', dose: '10mg', form: 'Tab.', company: 'Renata Ltd', price: '৳4.00/tab' },
  { name: 'Cetriz', generic: 'Cetirizine HCl', dose: '10mg', form: 'Tab.', company: 'Square Pharma', price: '৳4.00/tab' },
  { name: 'Monas', generic: 'Montelukast', dose: '10mg', form: 'Tab.', company: 'Acme Laboratories', price: '৳16.00/tab' },
  { name: 'Provair', generic: 'Montelukast', dose: '10mg', form: 'Tab.', company: 'Unimed Unihealth', price: '৳16.00/tab' },
  { name: 'Naprox', generic: 'Naproxen', dose: '500mg', form: 'Tab.', company: 'Square Pharma', price: '৳10.00/tab' },
  { name: 'Profen', generic: 'Ibuprofen', dose: '400mg', form: 'Tab.', company: 'Square Pharma', price: '৳4.00/tab' },
  { name: 'Clofenac', generic: 'Diclofenac Sodium', dose: '50mg', form: 'Tab.', company: 'Square Pharma', price: '৳4.00/tab' },
  { name: 'Motigut', generic: 'Domperidone', dose: '10mg', form: 'Tab.', company: 'Square Pharma', price: '৳3.50/tab' },
  { name: 'Ondem', generic: 'Ondansetron', dose: '4mg', form: 'Tab.', company: 'Beximco Pharma', price: '৳20.00/tab' },
  { name: 'Visset', generic: 'Ondansetron', dose: '4mg', form: 'Tab.', company: 'Square Pharma', price: '৳20.00/tab' },
  { name: 'Almex', generic: 'Albendazole', dose: '400mg', form: 'Tab.', company: 'Square Pharma', price: '৳15.00/tab' },
  { name: 'Salbulin Inhaler', generic: 'Salbutamol', dose: '100mcg/puff', form: 'Inh.', company: 'Square Pharma', price: '৳180.00/inhaler' },
  { name: 'Biphasic Insulin 30/70', generic: 'Insulin (Human)', dose: '100IU/ml', form: 'Inj.', company: 'Novo Nordisk', price: '৳450.00/vial' }
];

// ── FAST DRUG DATABASE CACHING (0ms INSTANT LOAD) ──
async function loadExternalDrugDatabase() {
  // Step 1: Load from local memory cache for instant (0ms) startup
  const cached = localStorage.getItem('prescribepro_cached_drugs');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        externalDrugs = parsed;
        console.log(`⚡ Instant loaded ${externalDrugs.length} medicines from local memory cache`);
      }
    } catch(e) {
      console.warn('Failed to parse local drug cache:', e);
    }
  }

  // Step 2: Background fetch data/drugs.json to update cache
  try {
    const res = await fetch('data/drugs.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        externalDrugs = data;
        try {
          localStorage.setItem('prescribepro_cached_drugs', JSON.stringify(data));
          console.log(`Updated local cache with ${externalDrugs.length} medicines from data/drugs.json`);
        } catch (cacheErr) {
          // The 41k-entry database can exceed the localStorage quota. It is
          // fully loaded in memory regardless, so caching is optional.
          console.warn('Drug database too large to cache in localStorage; using in-memory copy:', cacheErr);
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch data/drugs.json, using cached or built-in drug catalog:', e);
  }
}

// ── REAL-TIME PRESCRIPTION DRAFT AUTO-SAVE & RECOVERY ──
function saveRxDraft() {
  const modalRx = document.getElementById('modal-rx');
  if (!modalRx || modalRx.classList.contains('hidden')) return;

  const rx = collectRxData();
  const hasContent = rx.complaints || rx.diagnosis || rx.history || rx.findings || rx.investigation || rx.advice || (rx.drugs && rx.drugs.length > 0 && rx.drugs[0].name);
  if (hasContent) {
    localStorage.setItem('prescribepro_rx_draft', JSON.stringify(rx));
  } else {
    clearRxDraft();
  }
}

function clearRxDraft() {
  localStorage.removeItem('prescribepro_rx_draft');
}

function restoreRxDraft(expectedPatientId) {
  const savedDraft = localStorage.getItem('prescribepro_rx_draft');
  if (!savedDraft) return false;

  try {
    const draft = JSON.parse(savedDraft);
    if (!draft) return false;

    // If a specific patient was requested, only auto-restore a draft written
    // for that same patient. Otherwise opening a patient's "New Rx" could
    // silently load another patient's notes. A blank request (global "New
    // Prescription") restores whatever draft exists, as before.
    if (expectedPatientId && (draft.patientId || '') !== expectedPatientId) {
      return false;
    }

    const sel = document.getElementById('rx-patient-select');
    if (sel && draft.patientId) sel.value = draft.patientId;

    setV('rx-date', draft.date || new Date().toISOString().split('T')[0]);
    setV('rx-visit', draft.visitType || 'New Visit');
    setV('rx-complaints', draft.complaints || '');
    setV('rx-diagnosis', draft.diagnosis || '');
    setV('rx-history', draft.history || '');
    setV('rx-findings', draft.findings || '');
    setV('rx-investigation', draft.investigation || '');
    setV('rx-advice', draft.advice || '');
    setV('rx-notes', draft.notes || '');
    setV('rx-followup-days', draft.followupDays || '');
    setV('rx-followup-unit', draft.followupUnit || 'days');

    if (draft.drugs && draft.drugs.length > 0) {
      document.getElementById('drug-rows').innerHTML = '';
      draft.drugs.forEach(drug => {
        applyDrugToRow(addDrugRow(), drug);
      });
    }
    toast('📝 Unsaved prescription draft restored');
    return true;
  } catch(e) {
    console.error('Error restoring draft:', e);
    return false;
  }
}

// ── THEME MANAGEMENT ──
function applyTheme(t, skipSave = false) {
  state.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  if (!skipSave && state.loggedIn) {
    saveState();
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  toast(newTheme === 'dark' ? '🌙 Dark Mode Enabled' : '☀️ Light Mode Enabled');
}

// ── PERSISTENCE & SESSION LOCK ──
function getStorageKey() {
  const email = (state.user && state.user.email) ? state.user.email : 'local_doctor';
  return 'prescribepro_state_' + email;
}

function saveState() {
  if (state.loggedIn) {
    localStorage.setItem('prescribepro_session_active', 'true');
    localStorage.setItem('prescribepro_session_method', state.loginMethod || 'local');
    if (state.user && state.user.email) {
      localStorage.setItem('prescribepro_last_email', state.user.email);
    }
  }
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(state));
  } catch (e) {
    // Most commonly a QuotaExceededError caused by the large cached drug
    // database sharing the same storage quota. Free that cache and retry so
    // patient/prescription data is never silently lost.
    console.warn('Could not persist state (retrying after clearing drug cache):', e);
    try {
      localStorage.removeItem('prescribepro_cached_drugs');
      localStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch (e2) {
      console.error('CRITICAL: Failed to save state to localStorage:', e2);
      if (typeof toast === 'function') toast('⚠️ Device storage full — data could not be saved');
    }
  }
}

function loadState() {
  const sessionActive = localStorage.getItem('prescribepro_session_active') === 'true';
  const lastEmail = localStorage.getItem('prescribepro_last_email') || 'local_doctor';
  const key = 'prescribepro_state_' + lastEmail;
  const s = localStorage.getItem(key) || localStorage.getItem('prescribepro_state') || localStorage.getItem('prescribepro_state_local_doctor');

  if (s) {
    try {
      const loaded = JSON.parse(s);
      Object.assign(state, loaded);
    } catch(e) {
      console.error('Failed to parse local state:', e);
    }
  }

  if (sessionActive) {
    state.loggedIn = true;
    state.loginMethod = localStorage.getItem('prescribepro_session_method') || state.loginMethod || 'local';
  }

  if (state.theme) applyTheme(state.theme, true);

  const cachedToken = localStorage.getItem('google_access_token');
  const cachedExpiry = localStorage.getItem('google_token_expiry');
  if (cachedToken && cachedExpiry && parseInt(cachedExpiry) > Date.now()) {
    googleAccessToken = cachedToken;
    googleTokenExpiry = parseInt(cachedExpiry);
  }
}

function resetActivityTimer() {}
function startAutoLockMonitor() {}
function lockDesk() {}
function unlockDesk() {}

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initUI();
  loadExternalDrugDatabase();
  startAutoLockMonitor();

  const sessionActive = localStorage.getItem('prescribepro_session_active') === 'true';

  if (state.loggedIn || sessionActive) {
    state.loggedIn = true;
    saveState();
    showApp();
    if (state.loginMethod === 'google') {
      syncWithGoogleCloud();
      setInterval(() => {
        if (state.loggedIn && state.loginMethod === 'google') {
          refreshGoogleTokenSilently();
        }
      }, 40 * 60 * 1000);
    } else {
      updateDriveStatus('offline');
    }
  } else {
    showSection('login');
  }
});

function initUI() {
  ['pad-align','pad-left-width','pad-color','show-history','show-findings','show-investigation','show-advice','show-followup','show-signature','show-generic']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updatePadPreview);
    });

  const rxModalEl = document.getElementById('modal-rx');
  if (rxModalEl) {
    rxModalEl.addEventListener('input', saveRxDraft);
    rxModalEl.addEventListener('change', saveRxDraft);
  }

  if (document.getElementById('drug-rows')) {
    addDrugRow();
  }

  document.querySelectorAll('#section-profile input').forEach(input => {
    input.addEventListener('change', () => saveProfile(true));
  });

  initClinicalQuickPicks();
}

// Add a collapsible "Quick picks" chip row above each clinical text field.
function initClinicalQuickPicks() {
  Object.entries(CLINICAL_PRESETS).forEach(([fieldId, presets]) => {
    const ta = document.getElementById(fieldId);
    if (!ta || ta.dataset.quickPicks === 'done') return;
    ta.dataset.quickPicks = 'done';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'qp-toggle';
    toggle.textContent = '⚡ Quick picks';

    const row = document.createElement('div');
    row.className = 'chip-row clinical hidden';
    presets.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = p;
      b.addEventListener('click', () => appendToField(fieldId, p));
      row.appendChild(b);
    });

    toggle.addEventListener('click', () => row.classList.toggle('hidden'));
    ta.parentNode.insertBefore(toggle, ta);
    ta.parentNode.insertBefore(row, ta);
  });
}

// Append a phrase to a text field, avoiding exact duplicates.
function appendToField(fieldId, text) {
  const ta = document.getElementById(fieldId);
  if (!ta) return;
  const current = ta.value.trim();
  const existing = current ? current.split(/\n|,\s*/).map(s => s.trim().toLowerCase()) : [];
  if (!existing.includes(text.toLowerCase())) {
    ta.value = current ? current + '\n' + text : text;
  }
  ta.focus();
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

// ── AUTH TAB & LOGIN METHODS ──
function switchAuthTab(mode) {
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  
  if (mode === 'google') {
    document.getElementById('tab-btn-google')?.classList.add('active');
    document.getElementById('panel-auth-google')?.classList.add('active');
  } else {
    document.getElementById('tab-btn-local')?.classList.add('active');
    document.getElementById('panel-auth-local')?.classList.add('active');
  }
}

function startLocalLogin() {
  const docName = v('local-doc-name').trim();
  const bmdcReg = v('local-bmdc-reg').trim();

  if (!docName) {
    toast('⚠️ Please enter Doctor Name');
    return;
  }

  state.loggedIn = true;
  state.loginMethod = 'local';
  state.user = { name: docName, email: 'local@doctor', initials: getInitials(docName) };
  if (!state.profile.name || state.profile.name === 'Dr. Someone') {
    state.profile.name = docName;
  }
  if (bmdcReg) state.profile.reg = bmdcReg;

  saveState();
  showApp();
  toast('✅ Welcome, ' + docName);
}

function getInitials(name) {
  const parts = name.replace(/^Dr\.\s*/i, '').split(' ');
  return parts.map(p => p[0]).join('').substring(0, 2).toUpperCase() || 'DR';
}

function logout() {
  if (confirm('Log out from current session?')) {
    state.loggedIn = false;
    googleAccessToken = null;
    googleTokenExpiry = null;
    localStorage.setItem('prescribepro_session_active', 'false');
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    saveState();
    location.reload();
  }
}

// ── GOOGLE AUTH ──
const GOOGLE_CLIENT_ID = '744204331957-vnium3sdih08go5iuv0rlpctvgqhjara.apps.googleusercontent.com';
const GOOGLE_SCOPES = 'openid profile email https://www.googleapis.com/auth/drive.appdata';

function initGoogleAuth() {
  if (typeof google === 'undefined' || !google.accounts) return;
  if (tokenClient) return;
  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES,
      callback: onTokenReceived,
      error_callback: onTokenError,
    });
  } catch(e) {
    console.error('Failed to initialize Google GSI Client:', e);
  }
}

let isRefreshingToken = false;

function refreshGoogleTokenSilently() {
  if (typeof google === 'undefined' || !google.accounts) return Promise.resolve(false);
  initGoogleAuth();
  if (!tokenClient) return Promise.resolve(false);
  if (isRefreshingToken) return Promise.resolve(false);

  isRefreshingToken = true;

  return new Promise((resolve) => {
    const originalCallback = tokenClient.callback;
    const timeoutTimer = setTimeout(() => {
      tokenClient.callback = originalCallback;
      isRefreshingToken = false;
      resolve(false);
    }, 10000);

    tokenClient.callback = (tokenResponse) => {
      clearTimeout(timeoutTimer);
      tokenClient.callback = originalCallback;
      isRefreshingToken = false;

      if (tokenResponse && !tokenResponse.error && tokenResponse.access_token) {
        googleAccessToken = tokenResponse.access_token;
        googleTokenExpiry = Date.now() + ((tokenResponse.expires_in || 3600) * 1000);
        localStorage.setItem('google_access_token', googleAccessToken);
        localStorage.setItem('google_token_expiry', googleTokenExpiry.toString());
        updateDriveStatus('synced');
        console.log('⚡ Google Cloud token silently renewed!');
        resolve(true);
      } else {
        console.warn('Silent Google token refresh returned error:', tokenResponse?.error);
        resolve(false);
      }
    };

    try {
      tokenClient.requestAccessToken({ prompt: '' });
    } catch(e) {
      clearTimeout(timeoutTimer);
      tokenClient.callback = originalCallback;
      isRefreshingToken = false;
      resolve(false);
    }
  });
}

function startGoogleLogin() {
  if (typeof google === 'undefined' || !google.accounts) {
    toast('❌ Google sign-in script not loaded. You can use Quick Local Mode offline!');
    switchAuthTab('local');
    return;
  }
  initGoogleAuth();
  if (!tokenClient) {
    toast('❌ Initializing Google auth, please retry in a second.');
    return;
  }
  setLoginLoading(true, 'Opening Google sign-in…');
  try {
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (e) {
    setLoginLoading(false);
    toast('❌ Google Sign-In Error: ' + e.message);
  }
}

function onTokenReceived(tokenResponse) {
  if (tokenResponse.error) {
    setLoginLoading(false);
    toast('❌ Google Auth cancelled or failed: ' + tokenResponse.error);
    return;
  }
  googleAccessToken = tokenResponse.access_token;
  googleTokenExpiry = Date.now() + ((tokenResponse.expires_in || 3600) * 1000);
  localStorage.setItem('google_access_token', googleAccessToken);
  localStorage.setItem('google_token_expiry', googleTokenExpiry.toString());

  fetchUserInfoAndLogin();
}

function onTokenError(err) {
  setLoginLoading(false);
  toast('❌ Auth Error: ' + (err.message || 'Unknown error'));
}

async function fetchUserInfoAndLogin() {
  setLoginLoading(true, 'Fetching doctor account info…');
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${googleAccessToken}` }
    });
    if (res.ok) {
      const userInfo = await res.json();
      state.user = {
        name: userInfo.name || 'Doctor',
        email: userInfo.email || 'doctor@gmail.com',
        initials: getInitials(userInfo.name || 'Doctor')
      };
      if (!state.profile.name || state.profile.name === 'Dr. Someone') {
        state.profile.name = 'Dr. ' + (userInfo.name || '');
      }
    }
  } catch (e) {
    console.warn('Could not fetch Google user profile info:', e);
  }

  state.loggedIn = true;
  state.loginMethod = 'google';
  localStorage.setItem('prescribepro_session_active', 'true');
  saveState();

  setLoginLoading(false);
  showApp();
  toast('✅ Signed in with Google');
  setTimeout(() => { syncWithGoogleCloud(true); }, 500);
}

function setLoginLoading(show, text) {
  const btn = document.getElementById('btn-google-signin');
  const loading = document.getElementById('login-loading');
  const txt = document.getElementById('login-loading-text');
  if (btn) btn.style.display = show ? 'none' : 'flex';
  if (loading) loading.style.display = show ? 'flex' : 'none';
  if (txt && text) txt.textContent = text;
}

// ── NAVIGATION & VIEWS ──
function showApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('topnav').classList.remove('hidden');
  document.getElementById('main-layout').classList.remove('hidden');
  document.getElementById('mobile-bottom-nav')?.classList.remove('hidden');

  const avatar = document.getElementById('user-avatar');
  if (avatar) avatar.textContent = state.user.initials || 'DR';

  showSection('dashboard');
}

function showSection(sec) {
  document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`section-${sec}`);
  const sbtn = document.getElementById(`sb-${sec}`);
  const mbtn = document.getElementById(`mnob-${sec}`);

  if (target) target.classList.remove('hidden');
  if (sbtn) sbtn.classList.add('active');
  if (mbtn) mbtn.classList.add('active');

  if (sec === 'dashboard') renderDashboard();
  if (sec === 'patients') renderPatients();
  if (sec === 'prescriptions') renderAllRx();
  if (sec === 'profile') populateProfileForm();
  if (sec === 'paddesign') initPadDesignSection();
}

function scrollToRxSec(secId) {
  const el = document.getElementById(secId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── DRUG ROWS & PRESCRIPTION WRITING ──
let drugRowId = 0;

function addDrugRow() {
  const id = ++drugRowId;
  const card = document.createElement('div');
  card.className = 'drug-card';
  card.id = `dr-${id}`;

  const formOptions = MEDICINE_FORMS.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
  const routeOptions = ROUTES.map(r => `<option value="${r}">${r}</option>`).join('');
  const freqChips = FREQ_PRESETS.map(p => `<button type="button" class="chip" onclick="applyPreset('dfreq-${id}','${p}',${id})">${p}</button>`).join('');
  const durChips = DURATION_PRESETS.map(p => `<button type="button" class="chip" onclick="applyPreset('ddur-${id}','${p}',${id})">${p}</button>`).join('');

  card.innerHTML = `
    <div class="drug-card-tools">
      <button type="button" class="tool-btn" onclick="moveDrugRow(${id},-1)" title="Move up" aria-label="Move medication up">▲</button>
      <button type="button" class="tool-btn" onclick="moveDrugRow(${id},1)" title="Move down" aria-label="Move medication down">▼</button>
      <button type="button" class="tool-btn danger" onclick="removeDrugRow(${id})" title="Remove medication" aria-label="Remove medication">✕</button>
    </div>

    <div class="drug-grid-main">
      <div>
        <div class="drug-field-label">Type / Form</div>
        <select id="dform-${id}" onchange="onDrugFormChange(${id})">
          ${formOptions}
        </select>
      </div>

      <div class="drug-name-wrap">
        <div class="drug-field-label">Brand / Generic Name</div>
        <input type="text" id="dname-${id}" placeholder="Search brand or generic…" oninput="drugSearch(this, ${id})" onkeydown="handleDrugKeydown(event, ${id})" autocomplete="off" style="font-weight:700; color:var(--rx-blue)">
        <div class="drug-autocomplete hidden" id="dac-${id}"></div>
      </div>

      <div>
        <div class="drug-field-label">Generic Name (Molecule)</div>
        <input type="text" id="dgeneric-${id}" placeholder="e.g. Paracetamol" style="font-style:italic">
      </div>

      <div>
        <div class="drug-field-label">Strength / Dose</div>
        <input type="text" id="ddose-${id}" placeholder="e.g. 500mg">
      </div>
    </div>

    <div class="drug-grid-secondary">
      <div class="drug-field">
        <div class="drug-field-label">Frequency (সেবন)</div>
        <input type="text" id="dfreq-${id}" placeholder="e.g. 1-0-1" autocomplete="off">
        <div class="chip-row mini">${freqChips}</div>
      </div>

      <div class="drug-field">
        <div class="drug-field-label">Duration</div>
        <input type="text" id="ddur-${id}" placeholder="e.g. 5 days" autocomplete="off">
        <div class="chip-row mini">${durChips}</div>
      </div>

      <div class="drug-field">
        <div class="drug-field-label">Timing (খাওয়ার সময়)</div>
        <select id="dtiming-sel-${id}" onchange="toggleCustomTiming(${id})">
          <option value="" selected>— Not set —</option>
          <option value="After meal">After meal (খাবার পরে)</option>
          <option value="Before meal">Before meal (খাবার আগে)</option>
          <option value="With meal">With meal (খাবারের সাথে)</option>
          <option value="Empty stomach">Empty stomach (খালি পেটে)</option>
          <option value="At bedtime">At bedtime (রাতে ঘুমানোর আগে)</option>
          <option value="Custom">✏️ Custom instruction…</option>
        </select>
        <input type="text" id="dtiming-custom-${id}" class="hidden" placeholder="Type custom timing instruction…" style="margin-top:4px">
      </div>

      <div class="drug-field">
        <div class="drug-field-label">Route</div>
        <select id="droute-${id}">
          <option value="">Auto / by form</option>
          ${routeOptions}
        </select>
      </div>

      <div class="drug-field wide">
        <div class="drug-field-label">Special Advice / Notes</div>
        <input type="text" id="dnotes-${id}" placeholder="e.g. Take with plenty of water">
      </div>
    </div>

    <div class="drug-card-foot">
      <span class="sig-label">Prints as:</span>
      <span class="sig-preview" id="sig-${id}">—</span>
    </div>
  `;

  document.getElementById('drug-rows').appendChild(card);

  // Live "prints as" preview updates for every field on the card.
  ['dname', 'dgeneric', 'ddose', 'dfreq', 'ddur', 'dnotes', 'dtiming-sel', 'dtiming-custom', 'droute']
    .forEach(pre => {
      const el = document.getElementById(`${pre}-${id}`);
      if (!el) return;
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => updateSigPreview(id));
    });

  updateSigPreview(id);
  return id;
}

// Fill a field from a one-tap preset chip and refresh its preview.
function applyPreset(fieldId, val, id) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.value = val;
  updateSigPreview(id);
  saveRxDraft();
}

function onDrugFormChange(id) {
  autoRoute(id);
  updateSigPreview(id);
}

// Suggest a route of administration from the chosen dosage form, unless the
// doctor has already picked one explicitly.
function autoRoute(id) {
  const routeSel = document.getElementById(`droute-${id}`);
  if (!routeSel || routeSel.value) return;
  routeSel.value = ROUTE_BY_FORM[v(`dform-${id}`)] || '';
}

// Reorder a medication card within the prescription.
function moveDrugRow(id, dir) {
  const card = document.getElementById(`dr-${id}`);
  if (!card) return;
  if (dir < 0 && card.previousElementSibling) {
    card.parentNode.insertBefore(card, card.previousElementSibling);
  } else if (dir > 0 && card.nextElementSibling) {
    card.parentNode.insertBefore(card.nextElementSibling, card);
  }
  saveRxDraft();
}

// Resolve the timing value the way it will be printed.
function effectiveTiming(id) {
  const sel = document.getElementById(`dtiming-sel-${id}`);
  if (!sel) return '';
  if (sel.value === 'Custom') return v(`dtiming-custom-${id}`).trim();
  if (sel.value === 'None') return '';
  return sel.value;
}

// Show how the row will read on the printed prescription.
function updateSigPreview(id) {
  const el = document.getElementById(`sig-${id}`);
  if (!el) return;
  let form = (v(`dform-${id}`) || 'Tab.').trim();
  if (!form.endsWith('.')) form += '.';
  const name = v(`dname-${id}`).trim();
  const dose = v(`ddose-${id}`).trim();
  const parts = [v(`dfreq-${id}`).trim(), effectiveTiming(id), v(`ddur-${id}`).trim(), v(`droute-${id}`).trim()].filter(Boolean);
  if (!name && parts.length === 0) { el.textContent = '—'; return; }
  el.textContent = `${form} ${name}${dose ? ' ' + dose : ''}${parts.length ? '   —   ' + parts.join(' · ') : ''}`;
}

// Populate an existing drug row from a saved/draft drug object.
function applyDrugToRow(id, drug) {
  setV(`dname-${id}`, drug.name || '');
  setV(`dgeneric-${id}`, drug.generic || '');
  setV(`dform-${id}`, drug.form || 'Tab.');
  setV(`ddose-${id}`, drug.dose || '');
  setV(`dfreq-${id}`, drug.freq || '');
  setV(`ddur-${id}`, drug.duration || '');
  setV(`dnotes-${id}`, drug.drugNotes || '');
  setV(`droute-${id}`, drug.route || '');

  const tSel = document.getElementById(`dtiming-sel-${id}`);
  const customInp = document.getElementById(`dtiming-custom-${id}`);
  const stdOptions = ['After meal', 'Before meal', 'With meal', 'Empty stomach', 'At bedtime'];
  if (tSel) {
    if (!drug.timing || drug.timing === 'None') {
      tSel.value = '';
      if (customInp) customInp.classList.add('hidden');
    } else if (stdOptions.includes(drug.timing)) {
      tSel.value = drug.timing;
      if (customInp) customInp.classList.add('hidden');
    } else {
      tSel.value = 'Custom';
      if (customInp) { customInp.classList.remove('hidden'); customInp.value = drug.timing; }
    }
  }
  updateSigPreview(id);
}

function toggleCustomTiming(id) {
  const sel = document.getElementById(`dtiming-sel-${id}`);
  const customInp = document.getElementById(`dtiming-custom-${id}`);
  if (sel && customInp) {
    if (sel.value === 'Custom') {
      customInp.classList.remove('hidden');
      customInp.focus();
    } else {
      customInp.classList.add('hidden');
    }
  }
}

function removeDrugRow(id) {
  const el = document.getElementById(`dr-${id}`);
  if (el) el.remove();
  saveRxDraft();
}

function getActiveDrugs() {
  const baseList = externalDrugs.length > 0 ? externalDrugs : DRUGS;
  if (state.customDrugs && state.customDrugs.length > 0) {
    return [...state.customDrugs, ...baseList.filter(d => !state.customDrugs.some(c => (c.name || '').toLowerCase() === (d.name || '').toLowerCase()))];
  }
  return baseList;
}

// Per-row autocomplete state (matches + highlighted index) for keyboard nav.
const drugAcState = {};

function drugSearch(input, id) {
  const q = input.value.toLowerCase().trim();
  const ac = document.getElementById(`dac-${id}`);
  if (!ac) return;
  if (!q) { ac.classList.add('hidden'); drugAcState[id] = null; return; }

  // Early-exit scan across the (potentially 40k+) catalogue for speed.
  const list = getActiveDrugs();
  const matches = [];
  for (let i = 0; i < list.length && matches.length < 30; i++) {
    const d = list[i];
    if ((d.name || '').toLowerCase().includes(q) ||
        (d.generic || '').toLowerCase().includes(q) ||
        (d.company || '').toLowerCase().includes(q)) {
      matches.push(d);
    }
  }

  if (matches.length === 0) { ac.classList.add('hidden'); drugAcState[id] = null; return; }

  drugAcState[id] = { matches, index: 0 };
  renderDrugAcList(id);
  ac.classList.remove('hidden');
}

function renderDrugAcList(id) {
  const ac = document.getElementById(`dac-${id}`);
  const st = drugAcState[id];
  if (!ac || !st) return;

  ac.innerHTML = st.matches.map((d, i) => `
    <div class="drug-ac-item ${i === st.index ? 'active' : ''}" data-idx="${i}" onclick="selectDrugIndex(${id}, ${i})">
      <div class="drug-ac-icon">💊</div>
      <div class="drug-ac-body">
        <div class="ac-brand">${escapeHtml(d.name)} <span class="ac-dose-badge">${escapeHtml(d.dose || '')}</span> <span class="ac-form-badge">${escapeHtml(d.form || '')}</span></div>
        <div class="ac-generic">${d.generic ? 'Generic: ' + escapeHtml(d.generic) : ''}</div>
        <div class="ac-meta">${escapeHtml(d.company || 'Standard')} ${d.price ? '· ' + escapeHtml(d.price) : ''}</div>
      </div>
    </div>
  `).join('');

  const active = ac.querySelector('.drug-ac-item.active');
  if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
}

function selectDrugIndex(id, i) {
  const st = drugAcState[id];
  if (!st || !st.matches[i]) return;
  const d = st.matches[i];
  selectDrug(id, d.name || '', d.generic || '', d.form || 'Tab.', d.dose || '');
}

// Keyboard control for the autocomplete (↑ ↓ Enter Esc).
function handleDrugKeydown(e, id) {
  const ac = document.getElementById(`dac-${id}`);
  const st = drugAcState[id];
  if (!ac || ac.classList.contains('hidden') || !st || !st.matches.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    st.index = Math.min(st.index + 1, st.matches.length - 1);
    renderDrugAcList(id);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    st.index = Math.max(st.index - 1, 0);
    renderDrugAcList(id);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    selectDrugIndex(id, st.index);
  } else if (e.key === 'Escape') {
    ac.classList.add('hidden');
  }
}

function escapeQuote(str) {
  // Safe both as a single-quoted JS string and as the body of a
  // double-quoted HTML attribute (as used in the autocomplete onclick).
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Safe text for HTML text nodes (coerces non-strings).
function esc(str) {
  return escapeHtml(str == null ? '' : String(str));
}

function selectDrug(id, name, generic, form, dose) {
  setV(`dname-${id}`, name);
  setV(`dgeneric-${id}`, generic);
  setV(`dform-${id}`, form || 'Tab.');
  if (dose) setV(`ddose-${id}`, dose);

  const ac = document.getElementById(`dac-${id}`);
  if (ac) ac.classList.add('hidden');
  drugAcState[id] = null;
  autoRoute(id);
  updateSigPreview(id);
  saveRxDraft();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.drug-name-wrap')) {
    document.querySelectorAll('.drug-autocomplete').forEach(el => el.classList.add('hidden'));
  }
});

// ── COLLECT & SAVE RX ──
function collectRxData() {
  const drugs = [];
  document.querySelectorAll('#drug-rows .drug-card').forEach(card => {
    const id = card.id.replace('dr-', '');
    const name = v(`dname-${id}`).trim();
    if (!name) return;

    const timingVal = effectiveTiming(id);

    drugs.push({
      name,
      generic: v(`dgeneric-${id}`).trim(),
      form: v(`dform-${id}`) || 'Tab.',
      dose: v(`ddose-${id}`).trim(),
      freq: v(`dfreq-${id}`).trim(),
      timing: timingVal,
      duration: v(`ddur-${id}`).trim(),
      route: v(`droute-${id}`).trim(),
      drugNotes: v(`dnotes-${id}`).trim()
    });
  });

  const pid = v('rx-patient-select');
  const patient = state.patients.find(p => p.id === pid);
  const now = Date.now();

  return {
    id: state.currentRx ? state.currentRx.id : uid(),
    createdAt: state.currentRx ? (state.currentRx.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: now,
    date: v('rx-date') || new Date().toISOString().split('T')[0],
    visitType: v('rx-visit') || 'New Visit',
    patientId: pid,
    patientName: patient ? patient.name : 'Unassigned Patient',
    complaints: v('rx-complaints'),
    diagnosis: v('rx-diagnosis'),
    history: v('rx-history'),
    findings: v('rx-findings'),
    investigation: v('rx-investigation'),
    advice: v('rx-advice'),
    notes: v('rx-notes'),
    followupDays: v('rx-followup-days'),
    followupUnit: v('rx-followup-unit') || 'days',
    drugs
  };
}

function saveRx() {
  const rx = collectRxData();
  if (!rx.patientId) { toast('⚠️ Please select a patient'); return; }
  if (rx.drugs.length === 0) { toast('⚠️ Add at least one medication'); return; }

  const idx = state.prescriptions.findIndex(r => r.id === rx.id);
  if (idx >= 0) state.prescriptions[idx] = rx;
  else state.prescriptions.unshift(rx);

  saveState();
  clearRxDraft();
  closeModal('modal-rx');
  renderDashboard();
  renderAllRx();
  scheduleCloudSync(true);
  toast('✅ Prescription saved');

  viewRx(rx.id);
}

// ── EDIT EXISTING PRESCRIPTION ──
function editCurrentRx() {
  if (!state.currentRx) return;
  closeModal('modal-rx-preview');
  const rx = state.currentRx;

  openModal('modal-rx');
  populateRxPatientSelect(rx.patientId);

  setV('rx-date', rx.date || new Date().toISOString().split('T')[0]);
  setV('rx-visit', rx.visitType || 'New Visit');
  setV('rx-complaints', rx.complaints || '');
  setV('rx-diagnosis', rx.diagnosis || '');
  setV('rx-history', rx.history || '');
  setV('rx-findings', rx.findings || '');
  setV('rx-investigation', rx.investigation || '');
  setV('rx-advice', rx.advice || '');
  setV('rx-notes', rx.notes || '');
  setV('rx-followup-days', rx.followupDays || '');
  setV('rx-followup-unit', rx.followupUnit || 'days');

  document.getElementById('drug-rows').innerHTML = '';
  (rx.drugs || []).forEach(drug => {
    applyDrugToRow(addDrugRow(), drug);
  });
  if (!(rx.drugs && rx.drugs.length)) addDrugRow();
}

// ── DOWNLOAD CRISP HD A4 IMAGE OF PRESCRIPTION ──
function downloadRxImage() {
  if (!state.currentRx) return;
  const source = document.getElementById('rx-a4');
  if (!source) return;

  if (typeof html2canvas === 'undefined') {
    toast('❌ html2canvas library not loaded');
    return;
  }

  toast('📷 Generating Crisp HD A4 Image...');

  // Capture an off-screen, UNSCALED copy of the pad.
  // Capturing the on-screen pad directly produces shifted/overlapping text
  // because the preview wraps it in #rx-a4-scaler which carries a CSS
  // transform (zoom / fit-screen); html2canvas mis-renders transformed
  // ancestors, so we render a clean clone at the natural A4 size instead.
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#ffffff;pointer-events:none;z-index:-1;';

  const clone = source.cloneNode(true);
  clone.removeAttribute('id'); // drop #rx-a4 rules (they use !important + absolute); we size it inline below
  clone.style.cssText = 'position:relative;width:794px;min-width:794px;max-width:794px;' +
    'height:1123px;min-height:1123px;background:#ffffff;color:#1a202c;' +
    'font-family:"Crimson Pro",serif;box-shadow:none;overflow:hidden;box-sizing:border-box;margin:0;';

  holder.appendChild(clone);
  document.body.appendChild(holder);

  const cleanup = () => { try { holder.remove(); } catch (e) { /* noop */ } };
  const fileName = `Prescription_A4_${(state.currentRx.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_')}_${state.currentRx.date || 'rx'}.png`;

  // Wait for webfonts so the export uses the real typefaces.
  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

  fontsReady.then(() => {
    fitRxPad(clone); // fit the medicines against the clone's own metrics
    return html2canvas(clone, {
      scale: 3, // High DPI ~300 DPI A4 capture
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      height: 1123
    });
  }).then(canvas => {
    cleanup();
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast('✅ HD A4 PNG Image Downloaded');
  }).catch(err => {
    cleanup();
    console.error('Image render error:', err);
    toast('❌ Error rendering HD image');
  });
}

// ── A4 PREVIEW ZOOM SCALER FOR SMARTPHONES & DESKTOPS ──
function zoomRxPreview(delta) {
  const scaler = document.getElementById('rx-a4-scaler');
  const viewport = document.getElementById('rx-a4-viewport');
  const wrap = document.getElementById('rx-preview-wrap');
  if (!scaler || !viewport) return;

  const wrapW = wrap && wrap.clientWidth > 50 ? wrap.clientWidth : (window.innerWidth - 24);
  const modalBody = wrap ? wrap.closest('.modal-body') : null;
  const availH = modalBody && modalBody.clientHeight > 100 
    ? (modalBody.clientHeight - 60) 
    : Math.max(340, window.innerHeight - 220);

  const containerW = Math.max(260, wrapW - 24);

  if (delta === 0) {
    const scaleW = containerW / 794;
    const scaleH = availH / 1123;
    currentRxZoom = Math.min(scaleW, scaleH);
    currentRxZoom = Math.min(Math.max(0.25, currentRxZoom), 1.5);
  } else {
    currentRxZoom = Math.min(Math.max(0.2, currentRxZoom + delta), 2.5);
  }

  scaler.style.transform = `scale(${currentRxZoom})`;
  scaler.style.transformOrigin = 'top center';

  const scaledH = Math.round(1123 * currentRxZoom);
  const scaledW = Math.round(794 * currentRxZoom);

  viewport.style.height = `${scaledH + 10}px`;
  viewport.style.minWidth = currentRxZoom > (containerW / 794) ? `${scaledW}px` : '100%';
}

window.addEventListener('resize', () => {
  const modalPreview = document.getElementById('modal-rx-preview');
  if (modalPreview && !modalPreview.classList.contains('hidden')) {
    zoomRxPreview(0.0);
  }
});

// ── RENDER PRESCRIPTION (STRICT A4 FORMAT) ──
function renderRxHTML(rx) {
  const p = state.profile;
  const ps = state.padSettings;
  const patient = state.patients.find(x => x.id === rx.patientId) || {};
  const col = ps.color || '#1a3a5c';

  const headerAlign = ps.align || 'center';
  const leftW = ps.leftWidth || 165;
  const showGeneric = ps.showGenericNames;

  // Per-patient serial number for this prescription (1-based, chronological).
  let serial = '';
  if (rx.patientId) {
    const forPatient = state.prescriptions
      .filter(r => r.patientId === rx.patientId)
      .sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
    const idx = forPatient.findIndex(r => r.id === rx.id);
    if (idx >= 0) serial = String(idx + 1);
  }

  // Letterhead: chamber / contact strip.
  const chamberLeft = [p.chamberName, p.address].map(esc).filter(Boolean).join('  ·  ');
  const chamberRight = [p.phone, p.hours].map(esc).filter(Boolean).join('  ·  ');
  const chamberHTML = (chamberLeft || chamberRight) ? `
    <div class="rx-chamber-strip">
      <span class="rx-chamber-left">${chamberLeft}</span>
      <span class="rx-chamber-right">${chamberRight}</span>
    </div>` : '';

  const headerHTML = `
    <div class="rx-header" style="text-align:${headerAlign}">
      <div class="rx-doc-name" style="color:${col}">${esc(p.name) || 'Doctor Name'}</div>
      ${p.qualifications ? `<div class="rx-doc-quals">${esc(p.qualifications)}</div>` : ''}
      ${p.designation ? `<div class="rx-doc-quals">${esc(p.designation)}</div>` : ''}
      ${p.hospital ? `<div class="rx-doc-quals">${esc(p.hospital)}</div>` : ''}
      ${p.reg ? `<div class="rx-doc-reg" style="color:${col}">${esc(p.reg)}</div>` : ''}
    </div>
  `;

  const pName = patient.name || rx.patientName || '—';
  const pAge = patient.age || '';
  const pSex = patient.gender || '';
  const pWeight = patient.weight || '';
  const pBlood = patient.bloodGroup || '';
  const patientRowHTML = `
    <div class="rx-patient-row">
      <div class="rx-pfield rx-pfield-name"><strong>Name:</strong> ${esc(pName)}</div>
      <div class="rx-pfield rx-pfield-sm"><strong>Age:</strong> ${esc(pAge) || '—'}</div>
      <div class="rx-pfield rx-pfield-sm"><strong>Sex:</strong> ${esc(pSex) || '—'}</div>
      ${pWeight ? `<div class="rx-pfield rx-pfield-sm"><strong>Wt:</strong> ${esc(pWeight)}</div>` : ''}
      ${pBlood ? `<div class="rx-pfield rx-pfield-sm"><strong>Blood:</strong> ${esc(pBlood)}</div>` : ''}
      <div class="rx-pfield rx-pfield-sm"><strong>Date:</strong> ${esc(rx.date) || '—'}</div>
      ${serial ? `<div class="rx-pfield rx-pfield-sm"><strong>Rx No:</strong> ${serial}</div>` : ''}
    </div>
    ${patient.allergies ? `<div class="rx-allergy">⚠ Allergy / Condition: ${esc(patient.allergies)}</div>` : ''}
  `;

  const leftSections = `
    ${rx.complaints ? `<div><div class="rx-section-label" style="color:${col}">COMPLAINTS</div><div class="rx-section-content">${esc(rx.complaints)}</div></div>` : ''}
    ${(rx.history && ps.showHistory) ? `<div><div class="rx-section-label" style="color:${col}">HISTORY</div><div class="rx-section-content">${esc(rx.history)}</div></div>` : ''}
    ${(rx.findings && ps.showFindings) ? `<div><div class="rx-section-label" style="color:${col}">FINDINGS</div><div class="rx-section-content">${esc(rx.findings)}</div></div>` : ''}
    ${(rx.investigation && ps.showInvestigation) ? `<div><div class="rx-section-label" style="color:${col}">INVESTIGATION</div><div class="rx-section-content">${esc(rx.investigation)}</div></div>` : ''}
    ${rx.diagnosis ? `<div><div class="rx-section-label" style="color:${col}">DIAGNOSIS</div><div class="rx-section-content" style="font-weight:700; color:#1a202c;">${esc(rx.diagnosis)}</div></div>` : ''}
  `;

  const drugsHTML = (rx.drugs || []).map((d, i) => {
    let rawForm = (d.form || 'Tab.').trim();
    if (!rawForm.endsWith('.')) rawForm += '.';
    const sig = [d.freq, d.timing, d.duration, d.route].map(esc).filter(Boolean).join('  ·  ');
    return `
      <div class="rx-drug-item">
        <div class="rx-drug-name"><span class="rx-drug-num">${i + 1}.</span>${rawForm} ${esc(d.name)}${d.dose ? ' — ' + esc(d.dose) : ''}</div>
        ${(showGeneric && d.generic) ? `<div class="rx-drug-generic">(${esc(d.generic)})</div>` : ''}
        ${sig ? `<div class="rx-drug-sig">${sig}</div>` : ''}
        ${d.drugNotes ? `<div class="rx-drug-note">📝 ${esc(d.drugNotes)}</div>` : ''}
      </div>
    `;
  }).join('');

  const followupHTML = (rx.followupDays && ps.showFollowup) ? `<div class="rx-followup" style="color:${col}"><strong>Follow-up:</strong> After ${esc(rx.followupDays)} ${esc(rx.followupUnit || 'days')}</div>` : '';
  const adviceHTML = (rx.advice && ps.showAdvice) ? `<div class="rx-advice-section"><div class="rx-section-label" style="color:${col}">ADVICE / নির্দেশনা</div><div class="rx-advice-content">${esc(rx.advice)}</div></div>` : '';

  const footerText = (p.footer || ps.footer || 'নিয়ম মাফিক ঔষধ খাবেন। ডাক্তারের পরামর্শ ব্যতীত ঔষধ পরিবর্তন নিষেধ।').trim();
  const footerContact = [p.address, p.phone, p.hours].map(esc).filter(Boolean).join('  ·  ');
  const footerHTML = (footerText || footerContact) ? `
    <div class="rx-footer-container" style="border-top-color:${col};">
      ${footerText ? `<div class="rx-footer-note">${esc(footerText)}</div>` : ''}
      ${footerContact ? `<div class="rx-footer-sub">${footerContact}</div>` : ''}
    </div>` : '';

  const rxSymbolSVG = `
    <svg class="rx-symbol-svg" viewBox="14 15 34 38" width="28" height="32" fill="${col}" aria-label="Rx" role="img">
      <path d="M14.15,39V15.2H26.39a17.73,17.73,0,0,1,5.2.59A5.57,5.57,0,0,1,34.49,18a6.59,6.59,0,0,1,1.1,3.87,6.66,6.66,0,0,1-.84,3.41,6.29,6.29,0,0,1-4.6,3.17l4.74,7.87L39,29h8L39.59,40.47l8.09,12.26H39.41l-4.66-7.64-4.7,7.64h-8.2L30,40.34c-1-1.63-5.18-9.82-6.07-10.45a3.09,3.09,0,0,0-1.81-.54h-.64V39Zm7.37-14.11h3.1a11.79,11.79,0,0,0,1.95-.32,2,2,0,0,0,1.19-.75,2.42,2.42,0,0,0-.27-3.15A4.36,4.36,0,0,0,24.75,20H21.52v4.84Z"/>
    </svg>
  `;

  const hasLeft = leftSections.replace(/\s/g, '').length > 0;

  return `
    <div class="rx-page">
      ${chamberHTML}
      ${headerHTML}
      <hr class="rx-divider" style="border-top-color:${col}">
      ${patientRowHTML}
      <div class="rx-body">
        ${hasLeft ? `<div class="rx-left" style="width:${leftW}px">${leftSections}</div>` : ''}
        <div class="rx-right">
          <div class="rx-rx-title" style="color:${col}">${rxSymbolSVG}</div>
          ${drugsHTML ? `<div class="rx-drug-list">${drugsHTML}</div>` : ''}
          ${adviceHTML}
          ${followupHTML}
          ${(ps.showSignature !== false) ? `
          <div class="rx-signature">
            <div class="rx-sign-line"></div>
            <div class="rx-sign-label">${esc(p.name) || 'Doctor'}</div>
            <div class="rx-sign-sub">Signature</div>
          </div>` : ''}
        </div>
      </div>
      ${footerHTML}
    </div>
  `;
}

function viewRx(id) {
  const rx = state.prescriptions.find(r => r.id === id);
  if (!rx) {
    toast('⚠️ Prescription details not found');
    return;
  }
  state.currentRx = rx;
  renderRxPreview(rx);
  openModal('modal-rx-preview');
  zoomRxPreview(0.0);
  setTimeout(() => zoomRxPreview(0.0), 50);
  setTimeout(() => zoomRxPreview(0.0), 200);
}

function renderRxPreview(rx) {
  const container = document.getElementById('rx-a4');
  if (!container) return;
  container.innerHTML = renderRxHTML(rx);
  fitRxPad(container);
  // Metrics change once layout settles and webfonts arrive, so re-fit.
  requestAnimationFrame(() => fitRxPad(container));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitRxPad(container));
}

// ── PAD AUTO-FIT (two-column medicines) ──
// The pad is a fixed A4 page whose footer rule is pinned near the bottom. A long
// medication list would spill past that rule, so we switch it to a balanced
// two-column layout (dotted vertical divider) and, if it still overflows, step
// the type size down to the largest size that fits. Runs for the preview, print
// and image export.
const RX_DRUG_MIN_FONT = 9;   // px — never shrink below this
const RX_DRUG_MAX_FONT = 14.5; // px — the normal list size
const RX_DRUG_FONT_STEP = 0.5; // px

function measureRxPad(pad) {
  const right = pad.querySelector('.rx-right');
  const footer = pad.querySelector('.rx-footer-container');
  if (!right || !footer) return null;
  const availTop = right.offsetTop;
  const availH = (footer.offsetTop - availTop) - 10; // keep clear of the footer rule
  if (availH <= 0) return null; // pad not laid out yet (its modal is hidden)
  let flowBottom = null;
  for (const el of right.children) {
    if (el.classList.contains('rx-signature')) continue;
    const b = el.offsetTop + el.offsetHeight;
    if (flowBottom === null || b > flowBottom) flowBottom = b;
  }
  if (flowBottom === null) return null;
  const sig = right.querySelector('.rx-signature');
  const required = (flowBottom - availTop) + (sig ? sig.offsetHeight : 0);
  return { ok: required <= availH, required, availH };
}

function fitRxPad(pad) {
  const list = pad && pad.querySelector('.rx-drug-list');
  if (!list) return;
  // Reset to the default layout so this is idempotent.
  list.className = 'rx-drug-list';
  list.style.fontSize = '';
  // measureRxPad returns null while the pad isn't laid out (e.g. its modal is
  // still hidden). There is nothing to fit against yet, so keep the defaults.
  let m = measureRxPad(pad);
  if (!m) return;
  if (m.ok) return;                         // one column, normal size
  list.className = 'rx-drug-list is-2col';  // two columns, dotted divider
  m = measureRxPad(pad);
  if (!m) return;
  if (m.ok) return;
  for (let fs = RX_DRUG_MAX_FONT - RX_DRUG_FONT_STEP; fs >= RX_DRUG_MIN_FONT; fs -= RX_DRUG_FONT_STEP) {
    list.style.fontSize = fs + 'px';
    m = measureRxPad(pad);
    if (!m) return;
    if (m.ok) return;
  }
  // Genuinely over-long even at the minimum size: keep the tightest layout.
}

function printPrescription() {
  if (!state.currentRx) return;
  const rxHTML = renderRxHTML(state.currentRx);
  const w = window.open('', '_blank');
  if (!w) {
    toast('❌ Please allow pop-ups to print the prescription');
    return;
  }

  // Resolve the stylesheet relative to this page rather than the blank window.
  const baseHref = location.href.replace(/[^/]*$/, '');

  w.document.write(`
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <base href="${baseHref}">
    <title>Prescription Print</title>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    <style>
      /* Fit the prescription on exactly one A4 page.
         The on-screen pad is 794x1123px, but A4 at 96dpi is 1122.52px tall, so
         1123px overflowed the page by ~0.5px and Chrome pushed a blank second
         page. body{min-height:100vh} also makes the body a full page tall on
         its own. Size the printed page explicitly in mm instead. */
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff; }
      html, body { min-height: 0 !important; height: auto !important; }
      #rx-a4 {
        position: relative !important;
        box-shadow: none !important;
        width: 210mm !important; min-width: 0 !important; max-width: none !important;
        height: 296.8mm !important; min-height: 0 !important; max-height: 296.8mm !important;
        overflow: hidden !important;
        page-break-after: avoid; break-after: avoid;
      }
    </style>
    </head><body><div id="rx-a4">${rxHTML}</div></body></html>
  `);
  w.document.close();

  // Print once the window (and its stylesheet/fonts) has loaded, with a
  // fallback in case the load event already fired before we could listen.
  // Fit the two-column medicines before the print layout is captured.
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    try {
      fitRxPad(w.document.getElementById('rx-a4'));
      w.focus(); w.print();
    } catch (e) { console.error('Print error:', e); }
  };
  const printWhenReady = () => {
    const df = w.document && w.document.fonts;
    if (df && df.ready) df.ready.then(doPrint, doPrint);
    else doPrint();
  };
  w.addEventListener('load', printWhenReady);
  setTimeout(printWhenReady, 1500);
}

// ── PATIENT MANAGEMENT ──
let currentPatientSearchQuery = '';

function filterPatients(query) {
  currentPatientSearchQuery = (query || '').toLowerCase().trim();
  renderPatients();
}

function renderPatients() {
  const grid = document.getElementById('patient-grid');
  if (!grid) return;

  let list = state.patients || [];
  if (currentPatientSearchQuery) {
    list = list.filter(p => 
      (p.name || '').toLowerCase().includes(currentPatientSearchQuery) ||
      (p.phone || '').toLowerCase().includes(currentPatientSearchQuery) ||
      (p.bloodGroup || '').toLowerCase().includes(currentPatientSearchQuery) ||
      (p.allergies || '').toLowerCase().includes(currentPatientSearchQuery)
    );
  }

  if (list.length === 0) {
    const msg = currentPatientSearchQuery ? 'No matching patients found' : 'No patients added yet';
    const sub = currentPatientSearchQuery ? 'Try searching by a different name, phone, or blood group.' : 'Click "+ New Patient" to create your first patient profile.';
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="ico">👥</div><h3>${msg}</h3><p>${sub}</p></div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="patient-card" onclick="openPatientHistory('${p.id}')">
      <div class="patient-card-top">
        <div class="patient-avatar ${p.gender === 'Female' ? 'female' : ''}">${esc((p.name || '?')[0])}</div>
        <div class="patient-actions" onclick="event.stopPropagation()">
          <button class="btn btn-secondary btn-sm" onclick="openRxModalForPatient('${p.id}')" title="New Prescription">➕ New Rx</button>
          <button class="btn btn-secondary btn-sm" onclick="editPatient('${p.id}')" title="Edit Profile">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deletePatient('${p.id}')" title="Delete Profile">🗑️ Delete</button>
        </div>
      </div>
      <div class="patient-name">${esc(p.name)}</div>
      <div class="patient-meta">
        <span class="patient-badge ${p.gender === 'Female' ? 'badge-f' : 'badge-m'}">${esc(p.gender) || '—'}</span>
        <span>Age: ${esc(p.age) || '—'}</span>
        ${p.weight ? `<span>⚖ ${esc(p.weight)}</span>` : ''}
        ${p.bloodGroup ? `<span>🩸 ${esc(p.bloodGroup)}</span>` : ''}
      </div>
      ${p.phone ? `<div style="font-size:12px; color:var(--text-3); margin-top:4px">📞 ${esc(p.phone)}</div>` : ''}
    </div>
  `).join('');
}

function openPatientHistory(pid) {
  const p = state.patients.find(x => x.id === pid);
  if (!p) return;

  document.getElementById('phist-patient-name').textContent = p.name;
  document.getElementById('phist-patient-meta').textContent = `${p.gender || ''} · Age: ${p.age || '—'} ${p.phone ? '· 📞 ' + p.phone : ''}`;

  const addBtn = document.getElementById('phist-add-rx-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      closeModal('modal-patient-history');
      openRxModalForPatient(p.id);
    };
  }

  const patientRxList = state.prescriptions
    .filter(r => r.patientId === pid)
    .sort((a,b) => new Date(b.createdAt||b.date) - new Date(a.createdAt||a.date));

  const timelineContainer = document.getElementById('phist-rx-timeline');
  if (!timelineContainer) return;

  if (patientRxList.length === 0) {
    timelineContainer.innerHTML = '<div class="empty-state"><div class="ico">📋</div><h3>No prescriptions written yet</h3><p>Click "+ New Prescription" above to write the first prescription for this patient.</p></div>';
  } else {
    timelineContainer.innerHTML = patientRxList.map(rx => {
      const badge = dateBadge(rx.date);
      return `
        <div class="rx-history-item" onclick="viewRx('${rx.id}')">
          <div class="rx-date-badge">
            <div class="day">${badge.day}</div>
            <div class="mon">${badge.mon}</div>
          </div>
          <div style="flex:1">
            <div style="font-weight:700; font-size:15px; color:var(--rx-blue)">${rx.date} — ${rx.visitType||'Visit'}</div>
            <div style="font-size:13px; color:var(--text); margin-top:2px">${rx.diagnosis ? '<strong>Diagnosis:</strong> ' + rx.diagnosis : ''}</div>
            <div class="text-muted">${rx.complaints ? 'Complaints: ' + rx.complaints.substring(0,60) + '...' : ''}</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center" onclick="event.stopPropagation()">
            <button class="btn btn-secondary btn-sm" onclick="viewRx('${rx.id}')" title="View Prescription">👁️ View</button>
            <button class="btn btn-secondary btn-sm" onclick="editRxFromList('${rx.id}')" title="Edit Prescription">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRx('${rx.id}')" title="Delete Prescription">🗑️ Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  openModal('modal-patient-history');
}

function editPatient(pid) {
  const p = state.patients.find(x => x.id === pid);
  if (!p) return;
  state.editingPatientId = pid;
  setV('pname', p.name || '');
  setV('page', p.age || '');
  setV('pgender', p.gender || 'Male');
  setV('pblood', p.bloodGroup || '');
  setV('pweight', p.weight || '');
  setV('pphone', p.phone || '');
  setV('pallergies', p.allergies || '');
  openModal('modal-patient');
}

function deletePatient(pid) {
  const p = state.patients.find(x => x.id === pid);
  if (!p) return;

  const rxCount = state.prescriptions.filter(r => r.patientId === pid).length;
  const warningMsg = `⚠️ Are you sure you want to delete the profile for "${p.name}"?\n\nWarning: All ${rxCount} prescription(s) associated with this patient will also be permanently deleted!`;

  if (confirm(warningMsg)) {
    state.patients = state.patients.filter(x => x.id !== pid);
    state.prescriptions = state.prescriptions.filter(r => r.patientId !== pid);
    saveState();
    renderPatients();
    renderDashboard();
    renderAllRx();
    closeModal('modal-patient-history');
    scheduleCloudSync(true);
    toast('🗑️ Patient profile deleted');
  }
}

let isOpeningPatientFromRx = false;
let rxReturnPatientId = '';
let lastValidRxPatientId = '';

function populateRxPatientSelect(selectedId = '') {
  const sel = document.getElementById('rx-patient-select');
  if (!sel) return;

  if (selectedId && selectedId !== '__NEW_PATIENT__') {
    lastValidRxPatientId = selectedId;
  }

  let optionsHTML = '';
  if (!selectedId) {
    optionsHTML += '<option value="" selected>-- Select Patient --</option>';
  }

  if (state.patients.length === 0) {
    optionsHTML += '<option value="">-- No Patients Registered --</option>';
  } else {
    optionsHTML += state.patients.map(p => 
      `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name} (${p.age || 'Age N/A'}) ${p.phone ? '· ' + p.phone : ''}</option>`
    ).join('');
  }

  optionsHTML += `<option value="__NEW_PATIENT__">➕ Add New Patient Profile...</option>`;
  sel.innerHTML = optionsHTML;
}

function checkRxPatientSelect(selectEl) {
  if (selectEl.value === '__NEW_PATIENT__') {
    openPatientModalFromRx();
  } else {
    lastValidRxPatientId = selectEl.value;
  }
}

function openPatientModalFromRx() {
  isOpeningPatientFromRx = true;
  // Restore the previous valid patient if user cancels the "add new patient" flow
  rxReturnPatientId = lastValidRxPatientId || '';
  closeModal('modal-rx');
  openPatientModal();
}

function openPatientModal() {
  state.editingPatientId = null;
  ['pname','page','pgender','pblood','pweight','pphone','pallergies'].forEach(id => setV(id, ''));
  openModal('modal-patient');
}

function savePatient() {
  const name = v('pname').trim();
  if (!name) { toast('⚠️ Patient name is required'); return; }

  const now = Date.now();
  const existingPatient = state.editingPatientId ? state.patients.find(p => p.id === state.editingPatientId) : null;
  const patientData = {
    id: state.editingPatientId || uid(),
    name,
    age: v('page'),
    gender: v('pgender'),
    bloodGroup: v('pblood'),
    weight: v('pweight'),
    phone: v('pphone'),
    allergies: v('pallergies'),
    createdAt: existingPatient ? (existingPatient.createdAt || now) : now,
    updatedAt: now
  };

  if (state.editingPatientId) {
    const idx = state.patients.findIndex(p => p.id === state.editingPatientId);
    if (idx >= 0) state.patients[idx] = patientData;
  } else {
    state.patients.unshift(patientData);
  }

  saveState();
  const wasAddingFromRx = isOpeningPatientFromRx;
  isOpeningPatientFromRx = false; // stop closeModal() from reopening with the stale selection
  closeModal('modal-patient');
  renderPatients();
  renderDashboard();
  scheduleCloudSync(true);
  toast('✅ Patient saved');

  if (wasAddingFromRx) {
    openModal('modal-rx');
    populateRxPatientSelect(patientData.id);
    saveRxDraft();
  }
}

function openRxModalForPatient(pid) {
  state.currentRx = null;
  openModal('modal-rx');
  populateRxPatientSelect(pid);

  const restored = restoreRxDraft(pid);
  if (!restored) {
    clearRxForm();
  }
}

function clearRxForm() {
  ['rx-complaints','rx-diagnosis','rx-history','rx-findings','rx-investigation','rx-advice','rx-notes'].forEach(id => setV(id, ''));
  setV('rx-date', new Date().toISOString().split('T')[0]);
  setV('rx-visit', 'New Visit');
  document.getElementById('drug-rows').innerHTML = '';
  addDrugRow();
}

// ── DASHBOARD & STATS ──
function renderDashboard() {
  document.getElementById('stat-patients').textContent = state.patients.length;
  document.getElementById('stat-rx').textContent = state.prescriptions.length;
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('stat-today').textContent = state.prescriptions.filter(r => r.date === today).length;
  const thisMonth = today.substring(0, 7);
  document.getElementById('stat-month').textContent = state.prescriptions.filter(r => r.date && r.date.startsWith(thisMonth)).length;

  const recent = [...state.prescriptions].sort((a,b) => new Date(b.createdAt||b.date) - new Date(a.createdAt||a.date)).slice(0, 5);
  const container = document.getElementById('recent-rx-list');
  if (!container) return;

  if (!recent.length) {
    container.innerHTML = '<p class="text-muted">No prescriptions yet. Click "+ New Prescription" to write one.</p>';
    return;
  }

  container.innerHTML = recent.map(rx => {
    const badge = dateBadge(rx.date);
    return `
      <div class="rx-history-item" onclick="viewRx('${rx.id}')">
        <div class="rx-date-badge">
          <div class="day">${badge.day}</div>
          <div class="mon">${badge.mon}</div>
        </div>
        <div style="flex:1">
          <div style="font-weight:600; font-size:14.5px">${rx.patientName} — ${rx.visitType||'Visit'}</div>
          <div class="text-muted">${rx.complaints ? rx.complaints.substring(0,50) + '...' : ''}</div>
        </div>
        <div style="display:flex; gap:6px; align-items:center" onclick="event.stopPropagation()">
          <button class="btn btn-secondary btn-sm" onclick="viewRx('${rx.id}')" title="View Prescription">👁️ View</button>
          <button class="btn btn-secondary btn-sm" onclick="editRxFromList('${rx.id}')" title="Edit Prescription">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteRx('${rx.id}')" title="Delete Prescription">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

let currentRxSearchQuery = '';

function filterPrescriptions(query) {
  currentRxSearchQuery = (query || '').toLowerCase().trim();
  renderAllRx();
}

function renderAllRx() {
  const list = document.getElementById('all-rx-list');
  if (!list) return;

  let prescriptions = [...state.prescriptions].sort((a,b) => new Date(b.createdAt||b.date) - new Date(a.createdAt||a.date));

  if (currentRxSearchQuery) {
    prescriptions = prescriptions.filter(r => 
      (r.patientName || '').toLowerCase().includes(currentRxSearchQuery) ||
      (r.diagnosis || '').toLowerCase().includes(currentRxSearchQuery) ||
      (r.complaints || '').toLowerCase().includes(currentRxSearchQuery) ||
      (r.date || '').toLowerCase().includes(currentRxSearchQuery)
    );
  }

  if (!prescriptions.length) {
    const title = currentRxSearchQuery ? 'No matching prescriptions found' : 'No prescriptions saved';
    list.innerHTML = `<div class="empty-state"><div class="ico">📋</div><h3>${title}</h3></div>`;
    return;
  }

  list.innerHTML = prescriptions.map(rx => `
    <div class="rx-history-item" onclick="viewRx('${rx.id}')">
      <div style="flex:1">
        <div style="font-weight:700; font-size:15px">${esc(rx.patientName)}</div>
        <div class="text-muted">${esc(rx.date)} · ${esc(rx.visitType||'')}</div>
        ${rx.diagnosis ? `<div style="font-size:13px; color:var(--text); margin-top:2px"><strong>Diagnosis:</strong> ${esc(rx.diagnosis)}</div>` : ''}
      </div>
      <div style="display:flex; gap:6px; align-items:center" onclick="event.stopPropagation()">
        <button class="btn btn-secondary btn-sm" onclick="viewRx('${rx.id}')" title="View Prescription">👁️ View</button>
        <button class="btn btn-secondary btn-sm" onclick="editRxFromList('${rx.id}')" title="Edit Prescription">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRx('${rx.id}')" title="Delete Prescription">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function editRxFromList(id) {
  const rx = state.prescriptions.find(r => r.id === id);
  if (!rx) return;
  state.currentRx = rx;
  closeModal('modal-patient-history');
  editCurrentRx();
}

function deleteRx(id) {
  const rx = state.prescriptions.find(r => r.id === id);
  if (!rx) return;
  if (confirm('Delete this prescription permanently?')) {
    state.prescriptions = state.prescriptions.filter(r => r.id !== id);
    if (state.currentRx && state.currentRx.id === id) state.currentRx = null;
    saveState();
    renderAllRx();
    renderDashboard();
    // Keep the patient timeline in sync if it is currently open.
    const historyModal = document.getElementById('modal-patient-history');
    if (historyModal && !historyModal.classList.contains('hidden')) {
      openPatientHistory(rx.patientId);
    }
    scheduleCloudSync(true);
    toast('🗑️ Prescription deleted');
  }
}

// ── PROFILE & PAD DESIGN ──
function populateProfileForm() {
  const p = state.profile;
  setV('prof-name', p.name || '');
  setV('prof-chamber', p.chamberName || '');
  setV('prof-quals', p.qualifications || '');
  setV('prof-desig', p.designation || '');
  setV('prof-hosp', p.hospital || '');
  setV('prof-reg', p.reg || '');
  setV('prof-phone', p.phone || '');
  setV('prof-hours', p.hours || '');
  setV('prof-address', p.address || '');
  setV('prof-footer', p.footer || 'নিয়ম মাফিক ঔষধ খাবেন। ডাক্তারের পরামর্শ ব্যতীত ঔষধ পরিবর্তন নিষেধ।');
}

function saveProfile(silent = false) {
  state.profile.name = v('prof-name');
  state.profile.chamberName = v('prof-chamber');
  state.profile.qualifications = v('prof-quals');
  state.profile.designation = v('prof-desig');
  state.profile.hospital = v('prof-hosp');
  state.profile.reg = v('prof-reg');
  state.profile.phone = v('prof-phone');
  state.profile.hours = v('prof-hours');
  state.profile.address = v('prof-address');
  state.profile.footer = v('prof-footer');
  state.padSettings.footer = v('prof-footer');
  setV('pad-footer', v('prof-footer'));
  state.profile.updatedAt = Date.now();

  saveState();
  scheduleCloudSync(true);
  if (!silent) toast('✅ Profile saved');
}

function initPadDesignSection() {
  const ps = state.padSettings;
  setV('pad-align', ps.align || 'center');
  setV('pad-left-width', ps.leftWidth || 165);
  setV('pad-color', ps.color || '#1a3a5c');
  setV('pad-footer', state.profile.footer || ps.footer || 'নিয়ম মাফিক ঔষধ খাবেন। ডাক্তারের পরামর্শ ব্যতীত ঔষধ পরিবর্তন নিষেধ।');
  const showGenEl = document.getElementById('show-generic');
  if (showGenEl) showGenEl.checked = !!ps.showGenericNames;
  ['showHistory', 'showFindings', 'showInvestigation', 'showAdvice', 'showFollowup', 'showSignature'].forEach(key => {
    const el = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
    if (el) el.checked = ps[key] !== false;
  });

  updatePadPreview();
}

function updatePadPreview() {
  state.padSettings.align = v('pad-align');
  state.padSettings.leftWidth = parseInt(v('pad-left-width')) || 165;
  state.padSettings.color = v('pad-color');
  state.padSettings.footer = v('pad-footer');
  state.profile.footer = v('pad-footer');
  setV('prof-footer', v('pad-footer'));
  const showGenEl = document.getElementById('show-generic');
  if (showGenEl) state.padSettings.showGenericNames = showGenEl.checked;
  ['showHistory', 'showFindings', 'showInvestigation', 'showAdvice', 'showFollowup', 'showSignature'].forEach(key => {
    const el = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
    if (el) state.padSettings[key] = el.checked;
  });
  state.padSettings.updatedAt = Date.now();

  saveState();
  scheduleCloudSync(false);
}

// ── OFFLINE LOCAL BACKUP EXPORT & IMPORT ──
function exportBackupData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `prescribepro_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  toast('📥 Local backup file downloaded');
}

function importBackupData(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported && (imported.patients || imported.prescriptions)) {
        Object.assign(state, imported);
        saveState();
        scheduleCloudSync(true);
        renderDashboard();
        renderPatients();
        renderAllRx();
        populateProfileForm();
        if (state.theme) applyTheme(state.theme, true);
        toast('✅ Backup data restored successfully');
      } else {
        toast('❌ Invalid backup JSON file structure');
      }
    } catch(err) {
      toast('❌ Error reading JSON backup file');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

// ── HYBRID LOCAL-FIRST & GOOGLE CLOUD REAL-TIME SYNC ENGINE ──
let isSyncingCloud = false;
let cloudSyncDebounceTimer = null;

function updateDriveStatus(status, labelText) {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  if (status === 'synced' || status === true) {
    statusEl.innerHTML = `<div class="drive-dot" style="background:var(--success)"></div><span style="color:var(--success)">${labelText || 'Cloud Synced'}</span>`;
  } else if (status === 'syncing') {
    statusEl.innerHTML = `<div class="drive-dot" style="background:var(--accent)"></div><span style="color:var(--accent)">${labelText || 'Syncing…'}</span>`;
  } else if (status === 'error') {
    statusEl.innerHTML = `<div class="drive-dot" style="background:var(--danger)"></div><span style="color:var(--danger)">${labelText || 'Sync Error'}</span>`;
  } else {
    statusEl.innerHTML = `<div class="drive-dot" style="background:var(--warn)"></div><span style="color:var(--text-3)">${labelText || 'Cloud Offline'}</span>`;
  }
}

function scheduleCloudSync(immediate = false) {
  if (!googleAccessToken) return;

  if (immediate) {
    if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
    syncWithGoogleCloud();
    return;
  }

  if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
  cloudSyncDebounceTimer = setTimeout(() => {
    syncWithGoogleCloud();
  }, 1500);
}

function mergeState(local, cloud) {
  if (!cloud) return local;

  const merged = { ...local };

  // Merge Doctor Profile
  if (cloud.profile) {
    if (!merged.profile || (cloud.profile.updatedAt || 0) > (merged.profile.updatedAt || 0)) {
      merged.profile = { ...cloud.profile };
    }
  }

  // Merge Pad Settings
  if (cloud.padSettings) {
    if (!merged.padSettings || (cloud.padSettings.updatedAt || 0) > (merged.padSettings.updatedAt || 0)) {
      merged.padSettings = { ...cloud.padSettings };
    }
  }

  // Merge Patient Profiles (by ID)
  const patientMap = new Map();
  (merged.patients || []).forEach(p => patientMap.set(p.id, p));
  (cloud.patients || []).forEach(p => {
    const existing = patientMap.get(p.id);
    if (!existing || (p.updatedAt || 0) > (existing.updatedAt || 0)) {
      patientMap.set(p.id, p);
    }
  });
  merged.patients = Array.from(patientMap.values());

  // Merge Prescriptions (by ID)
  const rxMap = new Map();
  (merged.prescriptions || []).forEach(r => rxMap.set(r.id, r));
  (cloud.prescriptions || []).forEach(r => {
    const existing = rxMap.get(r.id);
    if (!existing || (r.updatedAt || 0) > (existing.updatedAt || 0)) {
      rxMap.set(r.id, r);
    }
  });
  merged.prescriptions = Array.from(rxMap.values());

  return merged;
}

async function syncWithGoogleCloud(showToast = false) {
  if (state.loginMethod !== 'google' && !googleAccessToken) {
    updateDriveStatus('offline');
    if (showToast) toast('⚠️ Sign in with Google to enable Cloud Sync');
    return;
  }

  // Auto-refresh Google access token silently if expired or expiring within 5 minutes
  if (!googleAccessToken || (googleTokenExpiry && Date.now() > googleTokenExpiry - 300000)) {
    updateDriveStatus('syncing', 'Refreshing Token…');
    const refreshed = await refreshGoogleTokenSilently();
    if (!refreshed && !googleAccessToken) {
      updateDriveStatus('offline', 'Drive Offline');
      if (showToast) toast('⚠️ Cloud sync offline. Click ☁️ to re-authorize.');
      return;
    }
  }

  if (isSyncingCloud) return;
  isSyncingCloud = true;
  updateDriveStatus('syncing');

  try {
    // 1. Search Google Drive AppData folder for prescribepro_cloud_db.json
    const searchUrl = "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='prescribepro_cloud_db.json'&fields=files(id,name,modifiedTime)";
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${googleAccessToken}` }
    });

    if (!searchRes.ok) {
      throw new Error(`Drive search failed: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

    let cloudData = null;

    if (existingFile) {
      // Download current Cloud data
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`;
      const dlRes = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      if (dlRes.ok) {
        try { cloudData = await dlRes.json(); } catch(e) { console.warn('Cloud parse error:', e); }
      }
    }

    // 2. Perform Smart State Merge
    if (cloudData) {
      const merged = mergeState(state, cloudData);
      Object.assign(state, merged);
      saveState();
    }

    // 3. Prepare payload for Cloud Upload
    state.lastSyncedTimestamp = Date.now();
    const payload = {
      version: '3.0',
      updatedAt: Date.now(),
      user: state.user,
      profile: state.profile,
      padSettings: state.padSettings,
      patients: state.patients,
      prescriptions: state.prescriptions
    };

    const payloadStr = JSON.stringify(payload, null, 2);

    if (existingFile) {
      // Patch existing file
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
      const upRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: payloadStr
      });
      if (!upRes.ok) throw new Error(`Cloud update failed: ${upRes.statusText}`);
    } else {
      // Create new file in appDataFolder
      const metadata = {
        name: 'prescribepro_cloud_db.json',
        parents: ['appDataFolder']
      };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([payloadStr], { type: 'application/json' }));

      const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${googleAccessToken}` },
        body: form
      });
      if (!createRes.ok) throw new Error(`Cloud create failed: ${createRes.statusText}`);
    }

    // 4. Refresh UI displays
    renderDashboard();
    renderPatients();
    renderAllRx();
    populateProfileForm();

    updateDriveStatus('synced');
    if (showToast) toast('☁️ Google Cloud sync complete!');
  } catch (err) {
    console.error('Cloud Sync error:', err);
    updateDriveStatus('error');
    if (showToast) toast('❌ Cloud Sync failed: ' + err.message);
  } finally {
    isSyncingCloud = false;
  }
}

// ── HELPERS ──
function v(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setV(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 6); }
function dateBadge(dateStr) {
  if (!dateStr) return { day: '—', mon: '' };
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00');
  if (isNaN(d.getTime())) return { day: '—', mon: '' };
  return { day: d.getDate(), mon: d.toLocaleString('en', { month: 'short' }) };
}
function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
  if (id === 'modal-patient' && isOpeningPatientFromRx) {
    isOpeningPatientFromRx = false;
    openModal('modal-rx');
    populateRxPatientSelect(rxReturnPatientId);
  }
}

function toast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}