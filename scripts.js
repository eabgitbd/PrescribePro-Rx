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
    reg: '',
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
  { label: 'IV Infu. (IV Infusion)', value: 'IV Infu.', full: 'IV Infusion' },
  { label: 'Gtt. (Eye/Ear Drops)', value: 'Gtt.', full: 'Drops' },
  { label: 'Oint. (Ointment)', value: 'Oint.', full: 'Ointment' },
  { label: 'Cream', value: 'Cream', full: 'Cream' },
  { label: 'Gel', value: 'Gel', full: 'Gel' },
  { label: 'Supp. (Suppository)', value: 'Supp.', full: 'Suppository' },
  { label: 'Inh. (Inhaler/Rotacap)', value: 'Inh.', full: 'Inhaler' },
  { label: 'Spray (Nasal/Oral Spray)', value: 'Spray', full: 'Spray' },
  { label: 'Sachet (Powder / Sachet)', value: 'Sachet', full: 'Sachet' },
  { label: 'Sol. (Solution)', value: 'Sol.', full: 'Solution' },
  { label: 'Lotion', value: 'Lotion', full: 'Lotion' },
  { label: 'Mouth W. (Mouthwash/Gargle)', value: 'Mouth W.', full: 'Mouthwash' }
];

// Route of administration presets (auto-suggested from the medicine form, bilingual English [বাংলা]).
const ROUTES = [
  'Oral [মুখে]',
  'IM/IV [মাংসপেশীতে বা শিরায়]',
  'IV [শিরায়]',
  'IM [মাংসপেশীতে]',
  'SC [ত্বকের নিচে]',
  'Topical [ত্বকে ব্যবহার্য]',
  'Inhalation [নিঃশ্বাসের সাথে]',
  'Ophthalmic/Otic [চোখে/কানে]',
  'Eye Drop [চোখে]',
  'Ear Drop [কানে]',
  'Nasal [নাকে]',
  'Rectal [মলদ্বারে]',
  'Sublingual [জিহ্বার নিচে]',
  'Oral Rinse [কুলকুচা/গার্গল]',
  'Vaginal [যোনিপথে]'
];

const ROUTE_BY_FORM = {
  'Tab.': 'Oral [মুখে]',
  'Cap.': 'Oral [মুখে]',
  'Syr.': 'Oral [মুখে]',
  'Susp.': 'Oral [মুখে]',
  'Sachet': 'Oral [মুখে]',
  'Sol.': 'Oral [মুখে]',
  'Gtt.': 'Ophthalmic/Otic [চোখে/কানে]',
  'Oint.': 'Topical [ত্বকে ব্যবহার্য]',
  'Cream': 'Topical [ত্বকে ব্যবহার্য]',
  'Gel': 'Topical [ত্বকে ব্যবহার্য]',
  'Lotion': 'Topical [ত্বকে ব্যবহার্য]',
  'Inh.': 'Inhalation [নিঃশ্বাসের সাথে]',
  'Spray': 'Nasal [নাকে]',
  'Supp.': 'Rectal [মলদ্বারে]',
  'Inj.': 'IM/IV [মাংসপেশীতে বা শিরায়]',
  'IV Infu.': 'IV [শিরায়]',
  'Mouth W.': 'Oral Rinse [কুলকুচা/গার্গল]'
};

function formatRoute(route) {
  if (!route) return '';
  const r = String(route).trim();
  const map = {
    'Oral': 'Oral [মুখে]',
    'IM/IV': 'IM/IV [মাংসপেশীতে বা শিরায়]',
    'IV': 'IV [শিরায়]',
    'IM': 'IM [মাংসপেশীতে]',
    'SC': 'SC [ত্বকের নিচে]',
    'Topical': 'Topical [ত্বকে ব্যবহার্য]',
    'Inhalation': 'Inhalation [নিঃশ্বাসের সাথে]',
    'Ophthalmic/Otic': 'Ophthalmic/Otic [চোখে/কানে]',
    'Ophthalmic': 'Ophthalmic [চোখে]',
    'Otic': 'Otic [কানে]',
    'Nasal': 'Nasal [নাকে]',
    'Rectal': 'Rectal [মলদ্বারে]',
    'Sublingual': 'Sublingual [জিহ্বার নিচে]',
    'Oral Rinse': 'Oral Rinse [কুলকুচা/গার্গল]',
    'Vaginal': 'Vaginal [যোনিপথে]'
  };
  return map[r] || r;
}

function formatClinicalBulletLines(text) {
  if (!text) return '';
  const lines = String(text)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return '';

  return lines.map(line => {
    if (/^[-–—•*]\s*/.test(line)) {
      return `- ${line.replace(/^[-–—•*]\s*/, '')}`;
    }
    return `- ${line}`;
  }).join('\n');
}
// Dosing-frequency and duration presets (Bengali First, then English)
const FREQ_PRESETS_BN = ['১+০+১', '১+১+১', '১+০+০', '০+০+১', '২+০+২', '১+১+০', '০+১+১', 'প্রয়োজনে (SOS)'];
const FREQ_PRESETS_EN = ['1+0+1', '1+1+1', '1+0+0', '0+0+1', '2+0+2', 'SOS'];

const DURATION_PRESETS_BN = ['৩ দিন', '৫ দিন', '৭ দিন', '১০ দিন', '১৪ দিন', '১ মাস', 'চলবে'];
const DURATION_PRESETS_EN = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', 'Continue'];

function formatFrequency(freq) {
  if (!freq) return '';
  let str = String(freq).trim();
  return str.replace(/([0-9১-৯০]+)\s*[-]\s*([0-9১-৯০]+)/g, '$1+$2')
            .replace(/([0-9১-৯০]+)\s*[-]\s*([0-9১-৯০]+)/g, '$1+$2');
}

function formatDuration(dur) {
  if (!dur) return '';
  let str = String(dur).trim();
  if (!str) return '';
  if (str.startsWith('(') && str.endsWith(')')) return str;
  return `(${str})`;
}

// Common clinical phrases for one-tap entry into the clinical notes.
const CLINICAL_PRESETS = {
  'rx-complaints': ['Fever', 'Cough', 'Headache', 'Sore throat', 'Runny nose', 'Body ache', 'Abdominal pain', 'Vomiting', 'Diarrhoea', 'Shortness of breath', 'Chest pain', 'Dizziness', 'Generalized weakness', 'Insomnia', 'Loss of appetite'],
  'rx-history': ['No HTN', 'No DM', 'Non-smoker', 'Non-alcoholic', 'Known asthmatic', 'Known IHD', 'Known CKD', 'Previous surgery', 'Family history of DM'],
  'rx-findings': ['BP: / mmHg', 'Temp: °F', 'Pulse: /min', 'Chest: Clear', 'Abdomen: Soft, non-tender', 'No pedal edema', 'Conscious, oriented', 'Anaemia: present'],
  'rx-investigation': ['CBC with ESR', 'RBS', 'Serum creatinine', 'Lipid profile', 'Chest X-Ray (P/A view)', 'ECG', 'USG whole abdomen', 'Urine R/E'],
  'rx-diagnosis': ['Acute URTI', 'Acute Gastroenteritis', 'Type 2 Diabetes Mellitus', 'Hypertension', 'Bronchial Asthma', 'Iron deficiency anaemia', 'URTI with Bronchitis', 'Peptic ulcer disease'],
  'rx-plan': ['Scaling & Polishing', 'Root Canal Treatment (RCT)', 'Restoration / Filling', 'Tooth Extraction', 'Crown & Bridge Work', 'Operculectomy', 'Re-evaluation after 7 days', 'Refer to specialist']
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

// ── FAST INDEXEDDB DRUG CACHING (0ms INSTANT LOAD WITHOUT LOCALSTORAGE QUOTA LIMITS) ──
function openDrugDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error('IndexedDB unsupported'));
    const req = indexedDB.open('PrescribeProDrugsDB', 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('catalog')) {
        db.createObjectStore('catalog');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedDrugsIDB() {
  try {
    const db = await openDrugDB();
    return new Promise(resolve => {
      const tx = db.transaction('catalog', 'readonly');
      const req = tx.objectStore('catalog').get('drugs_list');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function setCachedDrugsIDB(data) {
  try {
    const db = await openDrugDB();
    return new Promise(resolve => {
      const tx = db.transaction('catalog', 'readwrite');
      const req = tx.objectStore('catalog').put(data, 'drugs_list');
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

async function loadExternalDrugDatabase() {
  // Step 1: Clean legacy localStorage quota hog if any remains
  try { localStorage.removeItem('prescribepro_cached_drugs'); } catch (_) {}

  // Step 2: Instant 0ms load from IndexedDB
  try {
    const cached = await getCachedDrugsIDB();
    if (Array.isArray(cached) && cached.length > 0) {
      externalDrugs = cached;
      console.log(`⚡ Instant loaded ${externalDrugs.length} medicines from IndexedDB cache`);
    }
  } catch (e) {
    console.warn('IDB load error:', e);
  }

  // Step 3: Background fetch data/drugs.json to populate/refresh IndexedDB
  try {
    const res = await fetch('data/drugs.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        externalDrugs = data;
        await setCachedDrugsIDB(data);
        console.log(`Updated IndexedDB cache with ${externalDrugs.length} clinical medicines`);
      }
    }
  } catch (e) {
    console.warn('Could not fetch data/drugs.json, using cached or fallback formulary:', e);
  }
}

// ── REAL-TIME PRESCRIPTION DRAFT AUTO-SAVE & RECOVERY ──
function saveRxDraft() {
  const modalRx = document.getElementById('modal-rx');
  if (!modalRx || modalRx.classList.contains('hidden')) return;

  const rx = collectRxData();
  const hasContent = rx.complaints || rx.diagnosis || rx.plan || rx.history || rx.findings || rx.investigation || rx.advice || (rx.drugs && rx.drugs.length > 0 && rx.drugs[0].name);
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
    setV('rx-plan', draft.plan || '');
    const planCheck = document.getElementById('rx-plan-check');
    if (planCheck) {
      planCheck.checked = Boolean(draft.plan && draft.plan.trim());
      togglePlanField();
    }
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
      if (!Array.isArray(state.customDrugs)) state.customDrugs = [];
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
  if (window.RxQuad && typeof RxQuad.init === 'function') RxQuad.init(); // [QUAD]
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

function togglePlanField() {
  const check = document.getElementById('rx-plan-check');
  const container = document.getElementById('rx-plan-container');
  if (!check || !container) return;
  if (check.checked) {
    container.classList.remove('hidden');
    const editor = container.querySelector('.rx-quad-editor');
    if (editor) {
      setTimeout(() => editor.focus(), 50);
    } else {
      const ta = document.getElementById('rx-plan');
      if (ta) setTimeout(() => ta.focus(), 50);
    }
  } else {
    container.classList.add('hidden');
  }
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

// ── BMDC REGISTRATION HELPERS ──
function cleanBmdcValue(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  str = str.replace(/^(BMDC\s*(?:Reg(?:\s*No)?\.?)?:?|Reg(?:\s*No)?\.?:?)\s*/i, '').trim();
  return str;
}

function extractBmdcNumber(raw) {
  return cleanBmdcValue(raw);
}

function formatBmdcReg(raw) {
  const cleaned = cleanBmdcValue(raw);
  if (!cleaned) return '';
  return `BMDC Reg No: ${cleaned}`;
}

function startLocalLogin() {
  const docName = v('local-doc-name').trim();
  const rawBmdc = v('local-bmdc-reg').trim();

  if (!docName) {
    toast('⚠️ Please enter Doctor Name');
    document.getElementById('local-doc-name')?.focus();
    return;
  }

  const bmdcVal = cleanBmdcValue(rawBmdc);
  if (!bmdcVal) {
    toast('⚠️ BMDC Registration Number is required to enter workspace');
    document.getElementById('local-bmdc-reg')?.focus();
    return;
  }

  state.loggedIn = true;
  state.loginMethod = 'local';
  state.user = { name: docName, email: 'local@doctor', initials: getInitials(docName) };
  if (!state.profile.name || state.profile.name === 'Dr. Someone') {
    state.profile.name = docName;
  }
  state.profile.reg = formatBmdcReg(bmdcVal);

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

  if (window.RxQuad && typeof RxQuad.init === 'function') RxQuad.init(); // [QUAD]

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

function addDrugRow(autoFocus = false) {
  const id = ++drugRowId;
  const card = document.createElement('div');
  card.className = 'drug-card';
  card.id = `dr-${id}`;

  const formOptions = MEDICINE_FORMS.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
  const routeOptions = ROUTES.map(r => `<option value="${r}">${r}</option>`).join('');
  const freqChipsBn = FREQ_PRESETS_BN.map(p => `<button type="button" class="chip" onclick="applyPreset('dfreq-${id}','${p}',${id})">${p}</button>`).join('');
  const freqChipsEn = FREQ_PRESETS_EN.map(p => `<button type="button" class="chip" onclick="applyPreset('dfreq-${id}','${p}',${id})">${p}</button>`).join('');
  const durChipsBn = DURATION_PRESETS_BN.map(p => `<button type="button" class="chip" onclick="applyPreset('ddur-${id}','${p}',${id})">${p}</button>`).join('');
  const durChipsEn = DURATION_PRESETS_EN.map(p => `<button type="button" class="chip" onclick="applyPreset('ddur-${id}','${p}',${id})">${p}</button>`).join('');

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
        <div class="drug-field-label">Frequency (সেবন মাত্রা)</div>
        <input type="text" id="dfreq-${id}" placeholder="e.g. ১+০+১ / 1+0+1" autocomplete="off">
        <div class="chip-group">
          <div class="chip-row mini">${freqChipsBn}</div>
          <div class="chip-row mini">${freqChipsEn}</div>
        </div>
      </div>

      <div class="drug-field">
        <div class="drug-field-label">Duration (স্থায়িত্বকাল)</div>
        <input type="text" id="ddur-${id}" placeholder="e.g. ৭ দিন / 7 days" autocomplete="off">
        <div class="chip-group">
          <div class="chip-row mini">${durChipsBn}</div>
          <div class="chip-row mini">${durChipsEn}</div>
        </div>
      </div>

      <div class="drug-field">
        <div class="drug-field-label">Timing (খাওয়ার সময়)</div>
        <select id="dtiming-sel-${id}" onchange="toggleCustomTiming(${id})">
          <option value="" selected>— Not set —</option>
          <optgroup label="🇧🇩 বাংলা নির্দেশনা (Bengali First)">
            <option value="খাবার পরে">খাবার পরে (After meal)</option>
            <option value="খাবার আগে">খাবার আগে (Before meal)</option>
            <option value="খাবারের সাথে">খাবারের সাথে (With meal)</option>
            <option value="খালি পেটে">খালি পেটে (Empty stomach)</option>
            <option value="রাতে ঘুমানোর আগে">রাতে ঘুমানোর আগে (At bedtime)</option>
            <option value="ভরা পেটে">ভরা পেটে</option>
            <option value="জ্বর আসলে">জ্বর আসলে (SOS)</option>
            <option value="ব্যথা হলে">ব্যথা হলে (SOS)</option>
          </optgroup>
          <optgroup label="🇬🇧 English Instructions">
            <option value="After meal">After meal</option>
            <option value="Before meal">Before meal</option>
            <option value="With meal">With meal</option>
            <option value="Empty stomach">Empty stomach</option>
            <option value="At bedtime">At bedtime</option>
            <option value="As needed (SOS)">As needed (SOS)</option>
          </optgroup>
          <optgroup label="Custom">
            <option value="Custom">✏️ Custom instruction…</option>
          </optgroup>
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

  if (autoFocus) {
    setTimeout(() => {
      const inp = document.getElementById(`dname-${id}`);
      if (inp) {
        inp.focus();
        inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  }

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
  const freq = formatFrequency(v(`dfreq-${id}`).trim());
  const timing = effectiveTiming(id);
  const dur = formatDuration(v(`ddur-${id}`).trim());
  const route = formatRoute(v(`droute-${id}`).trim());
  const parts = [freq, timing, dur, route].filter(Boolean);
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
  setV(`droute-${id}`, formatRoute(drug.route || ''));

  const tSel = document.getElementById(`dtiming-sel-${id}`);
  const customInp = document.getElementById(`dtiming-custom-${id}`);
  const stdOptions = [
    'খাবার পরে', 'খাবার আগে', 'খাবারের সাথে', 'খালি পেটে', 'রাতে ঘুমানোর আগে', 'ভরা পেটে', 'জ্বর আসলে', 'ব্যথা হলে',
    'After meal', 'Before meal', 'With meal', 'Empty stomach', 'At bedtime', 'As needed (SOS)'
  ];
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
  const custom = (state.customDrugs || []).map(c => ({ ...c, isCustom: true }));
  if (custom.length > 0) {
    const customNames = new Set(custom.map(c => (c.name || '').toLowerCase()));
    return [...custom, ...baseList.filter(d => !customNames.has((d.name || '').toLowerCase()))];
  }
  return baseList;
}

// Highlights matching query text in search results
function highlightMatch(text, query) {
  if (!text) return '';
  if (!query) return escapeHtml(text);
  const escapedText = escapeHtml(text);
  const escapedQ = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    const rx = new RegExp(`(${escapedQ})`, 'gi');
    return escapedText.replace(rx, '<mark class="ac-hl">$1</mark>');
  } catch (_) {
    return escapedText;
  }
}

// Per-row autocomplete state (matches + highlighted index) for keyboard nav.
const drugAcState = {};

function drugSearch(input, id) {
  const q = input.value.toLowerCase().trim();
  const ac = document.getElementById(`dac-${id}`);
  if (!ac) return;
  if (!q) { ac.classList.add('hidden'); drugAcState[id] = null; return; }

  const list = getActiveDrugs();
  const scored = [];

  for (let i = 0; i < list.length; i++) {
    const d = list[i];
    const nl = (d.name || '').toLowerCase();
    const gl = (d.generic || '').toLowerCase();
    const cl = (d.company || '').toLowerCase();

    let score = 0;
    if (d.isCustom) score += 60; // Custom doctor formulary priority

    // Brand scoring
    if (nl === q) {
      score += 120;
    } else if (nl.startsWith(q)) {
      score += 90;
    } else if (nl.includes(' ' + q) || nl.includes('-' + q)) {
      score += 70;
    } else if (nl.includes(q)) {
      score += 40;
    }

    // Generic molecule scoring
    if (gl === q) {
      score += 85;
    } else if (gl.startsWith(q)) {
      score += 65;
    } else if (gl.includes(' ' + q) || gl.includes('+ ' + q)) {
      score += 50;
    } else if (gl.includes(q)) {
      score += 30;
    }

    // Company scoring
    if (cl.startsWith(q)) {
      score += 15;
    } else if (cl.includes(q)) {
      score += 8;
    }

    if (score > 0) {
      scored.push({ drug: d, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const matches = scored.slice(0, 30).map(s => s.drug);

  drugAcState[id] = { matches, index: 0, query: q };
  renderDrugAcList(id);
  ac.classList.remove('hidden');
}

function renderDrugAcList(id) {
  const ac = document.getElementById(`dac-${id}`);
  const st = drugAcState[id];
  if (!ac || !st) return;

  const matchesHtml = st.matches.map((d, i) => `
    <div class="drug-ac-item ${i === st.index ? 'active' : ''}" data-idx="${i}" onclick="selectDrugIndex(${id}, ${i})">
      <div class="drug-ac-icon">💊</div>
      <div class="drug-ac-body">
        <div class="ac-brand">
          <span>${highlightMatch(d.name, st.query)}</span>
          ${d.dose ? `<span class="ac-dose-badge">${escapeHtml(d.dose)}</span>` : ''}
          <span class="ac-form-badge">${escapeHtml(d.form || 'Tab.')}</span>
          ${d.isCustom ? `<span class="ac-custom-badge">Custom</span>` : ''}
        </div>
        <div class="ac-generic">${d.generic ? 'Generic: ' + highlightMatch(d.generic, st.query) : ''}</div>
        <div class="ac-meta">${escapeHtml(d.company || 'Standard')}${d.price ? ' · ' + escapeHtml(d.price) : ''}</div>
      </div>
    </div>
  `).join('');

  const isAddActive = (st.index === st.matches.length);
  const addActionHtml = `
    <div class="drug-ac-add-item ${isAddActive ? 'active' : ''}" data-idx="${st.matches.length}" onclick="openAddDrugModal('${escapeQuote(st.query)}', ${id})">
      <div class="ac-add-icon">➕</div>
      <div>Add <strong>"${escapeHtml(st.query)}"</strong> as new medicine…</div>
    </div>
  `;

  ac.innerHTML = matchesHtml + addActionHtml;

  const active = ac.querySelector('.drug-ac-item.active, .drug-ac-add-item.active');
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
  if (!ac || ac.classList.contains('hidden') || !st) return;
  const maxIdx = st.matches.length; // includes add-button at the end

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    st.index = Math.min(st.index + 1, maxIdx);
    renderDrugAcList(id);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    st.index = Math.max(st.index - 1, 0);
    renderDrugAcList(id);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (st.index === st.matches.length) {
      openAddDrugModal(st.query, id);
    } else {
      selectDrugIndex(id, st.index);
    }
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

function checkDrugAllergyAlert(name, generic) {
  const pid = v('rx-patient-select');
  const patient = state.patients.find(p => p.id === pid);
  if (!patient || !patient.allergies) return;

  const allergyList = patient.allergies.toLowerCase().split(/[,;/+]+/).map(s => s.trim()).filter(Boolean);
  const n = (name || '').toLowerCase();
  const g = (generic || '').toLowerCase();

  for (const allergen of allergyList) {
    if (allergen.length >= 3 && (n.includes(allergen) || g.includes(allergen))) {
      toast(`🚨 ALLERGY ALERT: Patient has documented allergy to "${patient.allergies}"!`, 4500);
      return;
    }
  }
}

function checkDuplicateDrug(currentRowId, name, generic) {
  const currentGeneric = (generic || '').toLowerCase().trim();
  const currentName = (name || '').toLowerCase().trim();
  if (!currentName && !currentGeneric) return;

  document.querySelectorAll('#drug-rows .drug-card').forEach(card => {
    const cid = card.id.replace('dr-', '');
    if (cid === String(currentRowId)) return;
    const otherName = v(`dname-${cid}`).trim().toLowerCase();
    const otherGeneric = v(`dgeneric-${cid}`).trim().toLowerCase();

    if (otherName && otherName === currentName) {
      toast(`⚠️ Caution: Duplicate brand "${name}" is already in this prescription`);
    } else if (currentGeneric && otherGeneric && otherGeneric === currentGeneric) {
      toast(`⚠️ Caution: Duplicate molecule "${generic}" already added as ${v(`dname-${cid}`)}`);
    }
  });
}

function selectDrug(id, name, generic, form, dose) {
  setV(`dname-${id}`, name);
  setV(`dgeneric-${id}`, generic);
  setV(`dform-${id}`, form || 'Tab.');
  setV(`ddose-${id}`, dose || '');

  const ac = document.getElementById(`dac-${id}`);
  if (ac) ac.classList.add('hidden');
  drugAcState[id] = null;
  autoRoute(id);
  updateSigPreview(id);
  saveRxDraft();

  // Clinical safety checks
  checkDrugAllergyAlert(name, generic);
  checkDuplicateDrug(id, name, generic);

  // Auto-focus frequency for high-efficiency clinical prescription writing
  setTimeout(() => {
    const freqInp = document.getElementById(`dfreq-${id}`);
    if (freqInp) freqInp.focus();
  }, 40);
}

// ── CUSTOM DRUGS MANAGEMENT SYSTEM ──
let editingCustomDrugId = null;
let activeTargetDrugRowId = null;

function populateCustomDrugForms() {
  const sel = document.getElementById('cd-form');
  if (!sel) return;
  sel.innerHTML = MEDICINE_FORMS.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
}

function onCustomDrugFormChange() {
  const formVal = v('cd-form');
  const routeSel = document.getElementById('cd-route');
  if (routeSel && (!routeSel.value || routeSel.value === 'Auto by form')) {
    routeSel.value = ROUTE_BY_FORM[formVal] || '';
  }
}

function openAddDrugModal(prefillName = '', targetRowId = null) {
  editingCustomDrugId = null;
  activeTargetDrugRowId = targetRowId;
  populateCustomDrugForms();

  setV('cd-name', prefillName || '');
  setV('cd-generic', '');
  setV('cd-dose', '');
  setV('cd-form', 'Tab.');
  setV('cd-company', '');
  setV('cd-route', 'Oral');
  setV('cd-notes', '');

  const titleEl = document.getElementById('cd-modal-title');
  if (titleEl) titleEl.textContent = '💊 Add Custom Medicine';

  openModal('modal-custom-drug');
  setTimeout(() => {
    const focusTarget = prefillName ? (document.getElementById('cd-dose') || document.getElementById('cd-generic')) : document.getElementById('cd-name');
    if (focusTarget) focusTarget.focus();
  }, 100);
}

function saveCustomDrug() {
  const name = v('cd-name').trim();
  if (!name) {
    toast('⚠️ Please enter Medicine Brand / Trade Name');
    return;
  }

  const generic = v('cd-generic').trim();
  const dose = v('cd-dose').trim();
  const form = v('cd-form') || 'Tab.';
  const company = v('cd-company').trim() || 'Custom / Clinic';
  const route = v('cd-route').trim() || ROUTE_BY_FORM[form] || '';
  const notes = v('cd-notes').trim();

  if (!Array.isArray(state.customDrugs)) state.customDrugs = [];

  let savedDrug = null;

  if (editingCustomDrugId) {
    const idx = state.customDrugs.findIndex(d => d.id === editingCustomDrugId);
    if (idx >= 0) {
      state.customDrugs[idx] = {
        ...state.customDrugs[idx],
        name,
        generic,
        dose,
        form,
        company,
        route,
        notes,
        isCustom: true,
        updatedAt: Date.now()
      };
      savedDrug = state.customDrugs[idx];
    }
  } else {
    // Avoid exact duplicate
    const existingIdx = state.customDrugs.findIndex(d => 
      (d.name || '').toLowerCase() === name.toLowerCase() &&
      (d.dose || '').toLowerCase() === dose.toLowerCase() &&
      (d.form || '').toLowerCase() === form.toLowerCase()
    );

    savedDrug = {
      id: 'cd_' + uid(),
      name,
      generic,
      dose,
      form,
      company,
      route,
      notes,
      isCustom: true,
      updatedAt: Date.now(),
      createdAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      state.customDrugs[existingIdx] = savedDrug;
    } else {
      state.customDrugs.unshift(savedDrug);
    }
  }

  saveState();
  scheduleCloudSync(true);
  closeModal('modal-custom-drug');

  // If created directly from an active prescription row, populate it!
  if (activeTargetDrugRowId) {
    selectDrug(activeTargetDrugRowId, savedDrug.name, savedDrug.generic, savedDrug.form, savedDrug.dose);
    if (savedDrug.route) setV(`droute-${activeTargetDrugRowId}`, savedDrug.route);
    if (savedDrug.notes) setV(`dnotes-${activeTargetDrugRowId}`, savedDrug.notes);
    updateSigPreview(activeTargetDrugRowId);
    saveRxDraft();
    activeTargetDrugRowId = null;
  }

  // Refresh formulary manager if open
  const mgr = document.getElementById('modal-custom-drugs-manager');
  if (mgr && !mgr.classList.contains('hidden')) {
    renderCustomDrugsManager(v('cdm-search-inp'));
  }

  toast(`✅ "${name}" saved to your formulary`);
}

function openCustomDrugsManager() {
  populateCustomDrugForms();
  openModal('modal-custom-drugs-manager');
  setV('cdm-search-inp', '');
  renderCustomDrugsManager();
}

function renderCustomDrugsManager(query = '') {
  const listEl = document.getElementById('cdm-list');
  const countEl = document.getElementById('cdm-count');
  if (!listEl) return;

  if (!Array.isArray(state.customDrugs)) state.customDrugs = [];
  const q = (query || '').toLowerCase().trim();

  const filtered = state.customDrugs.filter(d => {
    if (!q) return true;
    return (d.name || '').toLowerCase().includes(q) ||
           (d.generic || '').toLowerCase().includes(q) ||
           (d.company || '').toLowerCase().includes(q) ||
           (d.dose || '').toLowerCase().includes(q);
  });

  if (countEl) {
    countEl.textContent = `${state.customDrugs.length} medicine${state.customDrugs.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:32px 16px; color:var(--text-3)">
        <div style="font-size:32px; margin-bottom:8px">💊</div>
        <div style="font-weight:600; color:var(--text-2); margin-bottom:4px">
          ${q ? 'No matching custom medicines found' : 'No custom medicines added yet'}
        </div>
        <div style="font-size:12px; margin-bottom:16px">
          ${q ? 'Try searching another keyword or click + New Medicine' : 'Add your private, foreign, or specialty drugs here for 1-click autocomplete.'}
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openAddDrugModal('${escapeQuote(q)}')">+ Add New Medicine</button>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(d => `
    <div class="cdm-item">
      <div class="cdm-item-main">
        <div class="cdm-item-title">
          <span>${escapeHtml(d.name)}</span>
          ${d.dose ? `<span class="ac-dose-badge">${escapeHtml(d.dose)}</span>` : ''}
          <span class="ac-form-badge">${escapeHtml(d.form || 'Tab.')}</span>
        </div>
        <div class="cdm-item-sub">
          ${d.generic ? '<em>' + escapeHtml(d.generic) + '</em> · ' : ''}
          <span>${escapeHtml(d.company || 'Custom')}</span>
          ${d.route ? ` · <span style="color:var(--accent)">${escapeHtml(d.route)}</span>` : ''}
        </div>
        ${d.notes ? `<div style="font-size:11px; color:var(--text-3); margin-top:2px">📝 ${escapeHtml(d.notes)}</div>` : ''}
      </div>
      <div class="cdm-item-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="editCustomDrug('${d.id}')" title="Edit medicine">✏️</button>
        <button type="button" class="btn btn-secondary btn-sm" style="color:var(--danger)" onclick="deleteCustomDrug('${d.id}')" title="Delete medicine">🗑️</button>
      </div>
    </div>
  `).join('');
}

function editCustomDrug(id) {
  const d = (state.customDrugs || []).find(x => x.id === id);
  if (!d) return;

  editingCustomDrugId = id;
  activeTargetDrugRowId = null;
  populateCustomDrugForms();

  setV('cd-name', d.name || '');
  setV('cd-generic', d.generic || '');
  setV('cd-dose', d.dose || '');
  setV('cd-form', d.form || 'Tab.');
  setV('cd-company', d.company || '');
  setV('cd-route', d.route || '');
  setV('cd-notes', d.notes || '');

  const titleEl = document.getElementById('cd-modal-title');
  if (titleEl) titleEl.textContent = '✏️ Edit Custom Medicine';

  openModal('modal-custom-drug');
}

function deleteCustomDrug(id) {
  const d = (state.customDrugs || []).find(x => x.id === id);
  if (!d) return;

  if (confirm(`Remove "${d.name}" from your custom formulary?`)) {
    state.customDrugs = state.customDrugs.filter(x => x.id !== id);
    saveState();
    scheduleCloudSync(true);
    renderCustomDrugsManager(v('cdm-search-inp'));
    toast(`🗑️ "${d.name}" removed from formulary`);
  }
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
    plan: (document.getElementById('rx-plan-check')?.checked ? v('rx-plan') : ''),
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
  setV('rx-plan', rx.plan || '');
  const planCheck = document.getElementById('rx-plan-check');
  if (planCheck) {
    planCheck.checked = Boolean(rx.plan && rx.plan.trim());
    togglePlanField();
  }
  setV('rx-followup-days', rx.followupDays || '');
  setV('rx-followup-unit', rx.followupUnit || 'days');

  document.getElementById('drug-rows').innerHTML = '';
  (rx.drugs || []).forEach(drug => {
    applyDrugToRow(addDrugRow(), drug);
  });
  if (!(rx.drugs && rx.drugs.length)) addDrugRow();
}

// ── DOWNLOAD CRISP HD A4 IMAGE OF PRESCRIPTION ──
async function downloadRxImage() {
  if (!state.currentRx) return;
  const source = document.getElementById('rx-a4');
  if (!source) return;

  if (typeof html2canvas === 'undefined') {
    toast('❌ html2canvas library not loaded');
    return;
  }

  const pageEls = source.querySelectorAll('.rx-page');
  if (!pageEls.length) return;

  const totalPages = pageEls.length;
  toast(`📷 Generating Crisp HD A4 Image${totalPages > 1 ? `s (${totalPages} Pages)` : ''}...`);

  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#ffffff;pointer-events:none;z-index:-1;';
  document.body.appendChild(holder);

  const cleanup = () => { try { holder.remove(); } catch (e) { /* noop */ } };
  const baseFileName = `Prescription_A4_${(state.currentRx.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_')}_${state.currentRx.date || 'rx'}`;

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    for (let idx = 0; idx < pageEls.length; idx++) {
      const pageEl = pageEls[idx];
      const clone = pageEl.cloneNode(true);
      clone.removeAttribute('id');
      const indicator = clone.querySelector('.rx-page-indicator');
      if (indicator) indicator.remove();

      clone.style.cssText = 'position:relative;width:794px;min-width:794px;max-width:794px;' +
        'height:1123px;min-height:1123px;max-height:1123px;background:#ffffff;color:#1a202c;' +
        'font-family:"Crimson Pro",serif;box-shadow:none;overflow:hidden;box-sizing:border-box;margin:0;padding:26px 30px;';

      holder.innerHTML = '';
      holder.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 3, // High DPI ~300 DPI A4 capture
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        height: 1123
      });

      const fileName = totalPages > 1 ? `${baseFileName}_Page_${idx + 1}.png` : `${baseFileName}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (idx < pageEls.length - 1) {
        await new Promise(r => setTimeout(r, 350));
      }
    }
    cleanup();
    toast(`✅ HD A4 PNG Image${totalPages > 1 ? `s (${totalPages} Pages)` : ''} Downloaded`);
  } catch (err) {
    cleanup();
    console.error('Image render error:', err);
    toast('❌ Error rendering HD image');
  }
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

  const unscaledH = scaler.scrollHeight || scaler.offsetHeight || 1123;
  const scaledH = Math.round(unscaledH * currentRxZoom);
  const scaledW = Math.round(794 * currentRxZoom);

  viewport.style.height = `${Math.min(availH, scaledH + 20)}px`;
  viewport.style.minWidth = currentRxZoom > (containerW / 794) ? `${scaledW}px` : '100%';
}

window.addEventListener('resize', () => {
  const modalPreview = document.getElementById('modal-rx-preview');
  if (modalPreview && !modalPreview.classList.contains('hidden')) {
    zoomRxPreview(0.0);
  }
});

// Helper: Ordinal numbers (1st, 2nd, 3rd, 4th, etc.)
function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── RENDER PRESCRIPTION (STRICT A4 FORMAT WITH CONTINUATION PAGES) ──
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

  // Letterhead: Doctor details on Left, Chamber details on Right opposite each other.
  // If no chamber details, Doctor details are placed in center.
  const hasChamber = Boolean((p.chamberName && p.chamberName.trim()) || (p.address && p.address.trim()));

  const headerHTML = hasChamber ? `
    <div class="rx-header-two-col">
      <div class="rx-header-doc-col">
        <div class="rx-doc-name" style="color:${col}">${esc(p.name) || 'Doctor Name'}</div>
        ${p.qualifications ? `<div class="rx-doc-quals">${esc(p.qualifications)}</div>` : ''}
        ${p.designation ? `<div class="rx-doc-quals">${esc(p.designation)}</div>` : ''}
        ${p.hospital ? `<div class="rx-doc-quals">${esc(p.hospital)}</div>` : ''}
        ${p.reg ? `<div class="rx-doc-reg" style="color:${col}; font-weight:700">${esc(formatBmdcReg(p.reg))}</div>` : ''}
        ${p.phone ? `<div class="rx-doc-phone">Mob: ${esc(p.phone)}</div>` : ''}
      </div>
      <div class="rx-header-chamber-col">
        <div class="rx-chamber-name" style="color:${col}">${esc(p.chamberName) || 'Chamber / Clinic'}</div>
        ${p.address ? `<div class="rx-chamber-detail">${esc(p.address)}</div>` : ''}
        ${p.hours ? `<div class="rx-chamber-detail"><span style="font-weight:700">Visiting:</span> ${esc(p.hours)}</div>` : ''}
        ${p.chamberPhone ? `<div class="rx-chamber-phone"><span style="font-weight:700">Serial/Appt:</span> ${esc(p.chamberPhone)}</div>` : ''}
        ${p.chamberNote ? `<div class="rx-chamber-note">${esc(p.chamberNote)}</div>` : ''}
      </div>
    </div>
  ` : `
    <div class="rx-header-single-col" style="text-align:${headerAlign}">
      <div class="rx-doc-name" style="color:${col}">${esc(p.name) || 'Doctor Name'}</div>
      ${p.qualifications ? `<div class="rx-doc-quals">${esc(p.qualifications)}</div>` : ''}
      ${p.designation ? `<div class="rx-doc-quals">${esc(p.designation)}</div>` : ''}
      ${p.hospital ? `<div class="rx-doc-quals">${esc(p.hospital)}</div>` : ''}
      ${p.reg ? `<div class="rx-doc-reg" style="color:${col}; font-weight:700">${esc(formatBmdcReg(p.reg))}</div>` : ''}
      ${p.phone ? `<div class="rx-doc-phone">Mob: ${esc(p.phone)}</div>` : ''}
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

  const footerText = (p.footer || ps.footer || 'নিয়ম মাফিক ঔষধ খাবেন। ডাক্তারের পরামর্শ ব্যতীত ঔষধ পরিবর্তন নিষেধ।').trim();
  const footerContact = (!hasChamber && (p.address || p.phone || p.hours)) ? [p.address, p.phone, p.hours].map(esc).filter(Boolean).join('  ·  ') : '';
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

  // [QUAD] Safe rich rendering helper: converts {{q:...}} tokens into dental quadrant chips
  const renderField = text => (window.RxQuad ? RxQuad.renderRich(formatClinicalBulletLines(text)) : esc(formatClinicalBulletLines(text))); // [QUAD]

  // Build left-sided sections
  const leftUnits = [];
  if (rx.complaints) {
    leftUnits.push({
      key: 'complaints',
      label: 'COMPLAINTS',
      html: `<div><div class="rx-section-label" style="color:${col}">COMPLAINTS</div><div class="rx-section-content">${renderField(rx.complaints)}</div></div>` // [QUAD]
    });
  }
  if (rx.history && ps.showHistory !== false) {
    leftUnits.push({
      key: 'history',
      label: 'HISTORY',
      html: `<div><div class="rx-section-label" style="color:${col}">HISTORY</div><div class="rx-section-content">${renderField(rx.history)}</div></div>` // [QUAD]
    });
  }
  if (rx.findings && ps.showFindings !== false) {
    leftUnits.push({
      key: 'findings',
      label: 'FINDINGS',
      html: `<div><div class="rx-section-label" style="color:${col}">FINDINGS</div><div class="rx-section-content">${renderField(rx.findings)}</div></div>` // [QUAD]
    });
  }
  if (rx.investigation && ps.showInvestigation !== false) {
    leftUnits.push({
      key: 'investigation',
      label: 'INVESTIGATION',
      html: `<div><div class="rx-section-label" style="color:${col}">INVESTIGATION</div><div class="rx-section-content">${renderField(rx.investigation)}</div></div>` // [QUAD]
    });
  }
  if (rx.diagnosis) {
    leftUnits.push({
      key: 'diagnosis',
      label: 'DIAGNOSIS',
      html: `<div><div class="rx-section-label" style="color:${col}">DIAGNOSIS</div><div class="rx-section-content" style="font-weight:700; color:#1a202c;">${renderField(rx.diagnosis)}</div></div>` // [QUAD]
    });
  }
  if (rx.plan) {
    leftUnits.push({
      key: 'plan',
      label: 'TREATMENT PLAN',
      html: `<div><div class="rx-section-label" style="color:${col}">TREATMENT PLAN</div><div class="rx-section-content">${renderField(rx.plan)}</div></div>` // [QUAD]
    });
  }

  const hasLeft = leftUnits.length > 0;

  // Build drug units (continuous numbering 1..N across all pages)
  const drugUnits = (rx.drugs || []).map((d, i) => {
    let rawForm = (d.form || 'Tab.').trim();
    if (!rawForm.endsWith('.')) rawForm += '.';
    const freq = formatFrequency(d.freq);
    const dur = formatDuration(d.duration);
    const route = formatRoute(d.route);
    const sig = [freq, d.timing, dur, route].map(esc).filter(Boolean).join('  ·  ');
    const drugNoteRich = d.drugNotes ? (window.RxQuad ? RxQuad.renderRich(d.drugNotes) : esc(d.drugNotes)) : ''; // [QUAD]
    const html = `
      <div class="rx-drug-item">
        <div class="rx-drug-name"><span class="rx-drug-num">${i + 1}.</span>${rawForm} ${esc(d.name)}${d.dose ? ' — ' + esc(d.dose) : ''}</div>
        ${(showGeneric && d.generic) ? `<div class="rx-drug-generic">(${esc(d.generic)})</div>` : ''}
        ${sig ? `<div class="rx-drug-sig">${sig}</div>` : ''}
        ${d.drugNotes ? `<div class="rx-drug-note">📝 ${drugNoteRich}</div>` : ''}
      </div>
    `;
    return { index: i + 1, html, data: d };
  });

  const followupHTML = (rx.followupDays && ps.showFollowup !== false) ? `<div class="rx-followup" style="color:${col}"><strong>Follow-up:</strong> After ${esc(rx.followupDays)} ${esc(rx.followupUnit || 'days')}</div>` : '';
  const adviceHTML = (rx.advice && ps.showAdvice !== false) ? `<div class="rx-advice-section"><div class="rx-section-label" style="color:${col}">ADVICE / নির্দেশনা</div><div class="rx-advice-content">${(window.RxQuad ? RxQuad.renderRich(rx.advice) : esc(rx.advice))}</div></div>` : ''; // [QUAD]
  const signatureHTML = (ps.showSignature !== false) ? `
    <div class="rx-signature">
      <div class="rx-sign-line"></div>
      <div class="rx-sign-label">${esc(p.name) || 'Doctor'}</div>
      <div class="rx-sign-sub">Signature</div>
    </div>` : '';

  // Height measurement and pagination
  let availH = 780;
  let topH = 175;
  let footerH = 45;
  let rxTitleH = 44;
  let contTitleH = 36;
  let adviceH = adviceHTML ? 60 : 0;
  let followupH = followupHTML ? 28 : 0;
  let sigH = signatureHTML ? 75 : 0;

  // Exact browser measurement if document is available
  if (typeof document !== 'undefined' && document.body) {
    try {
      const measurer = document.createElement('div');
      measurer.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;visibility:hidden;pointer-events:none;font-family:"Crimson Pro",serif;box-sizing:border-box;padding:26px 30px;background:#fff;';
      measurer.innerHTML = `
        <div id="m-top">
          ${headerHTML}
          <hr class="rx-divider" style="border-top-color:${col}">
          ${patientRowHTML}
        </div>
        <div id="m-footer" class="rx-footer-container">
          ${footerHTML}
        </div>
        <div class="rx-body">
          ${hasLeft ? `<div id="m-left-col" class="rx-left" style="width:${leftW}px">
            ${leftUnits.map((u, idx) => `<div class="m-left-item" data-idx="${idx}">${u.html}</div>`).join('')}
          </div>` : ''}
          <div id="m-right-col" class="rx-right">
            <div id="m-rx-title" class="rx-rx-title">${rxSymbolSVG}</div>
            <div id="m-cont-title" class="rx-continuation-banner"><u><strong>Continuation of the 1st page of the prescription.</strong></u></div>
            <div class="rx-drug-list">
              ${drugUnits.map((u, idx) => `<div class="m-drug-item" data-idx="${idx}">${u.html}</div>`).join('')}
            </div>
            <div id="m-advice">${adviceHTML}</div>
            <div id="m-followup">${followupHTML}</div>
            <div id="m-sig">${signatureHTML}</div>
          </div>
        </div>
      `;
      document.body.appendChild(measurer);

      topH = measurer.querySelector('#m-top')?.offsetHeight || topH;
      footerH = measurer.querySelector('#m-footer')?.offsetHeight || footerH;
      rxTitleH = measurer.querySelector('#m-rx-title')?.offsetHeight || rxTitleH;
      contTitleH = measurer.querySelector('#m-cont-title')?.offsetHeight || contTitleH;
      if (adviceHTML) adviceH = measurer.querySelector('#m-advice')?.offsetHeight || adviceH;
      if (followupHTML) followupH = measurer.querySelector('#m-followup')?.offsetHeight || followupH;
      if (signatureHTML) sigH = measurer.querySelector('#m-sig')?.offsetHeight || sigH;

      if (hasLeft) {
        const lNodes = measurer.querySelectorAll('.m-left-item');
        lNodes.forEach(el => {
          const idx = parseInt(el.getAttribute('data-idx'));
          if (leftUnits[idx]) leftUnits[idx].height = el.offsetHeight + 20;
        });
      }

      const dNodes = measurer.querySelectorAll('.m-drug-item');
      dNodes.forEach(el => {
        const idx = parseInt(el.getAttribute('data-idx'));
        if (drugUnits[idx]) drugUnits[idx].height = el.offsetHeight + 14;
      });

      measurer.remove();
    } catch (e) {
      console.warn('Measurement error, using defaults:', e);
    }
  }

  const PAGE_H = 1123;
  const PAGE_PAD_TOP = 26;
  const FOOTER_BOTTOM_GAP = 22;
  const SAFETY_MARGIN = 20;
  availH = Math.max(400, PAGE_H - PAGE_PAD_TOP - topH - FOOTER_BOTTOM_GAP - footerH - SAFETY_MARGIN);

  leftUnits.forEach(u => { if (!u.height) u.height = 100; });
  drugUnits.forEach(u => { if (!u.height) u.height = 68; });

  // 1. Partition left-sided units across pages
  const leftPages = [];
  if (hasLeft) {
    let curLeft = [];
    let curH = 0;
    for (const u of leftUnits) {
      if (curH + u.height > availH && curLeft.length > 0) {
        leftPages.push(curLeft);
        curLeft = [u];
        curH = u.height;
      } else {
        curLeft.push(u);
        curH += u.height;
      }
    }
    if (curLeft.length > 0) leftPages.push(curLeft);
  }

  // 2. Partition right-sided items (drugs, advice, followup, signature) across pages
  const rightPages = [];
  const remDrugs = [...drugUnits];
  const conclusionH = adviceH + followupH + sigH;
  let pageIdx = 0;

  while (remDrugs.length > 0 || (pageIdx === 0 && rightPages.length === 0)) {
    const headerH = pageIdx === 0 ? (rxTitleH + 12) : (contTitleH + 14);
    let curH = headerH;
    const pageDrugs = [];

    while (remDrugs.length > 0) {
      const nextDrug = remDrugs[0];
      const isLastRemaining = remDrugs.length === 1;
      const neededH = isLastRemaining ? (nextDrug.height + conclusionH) : nextDrug.height;

      if (curH + neededH <= availH || pageDrugs.length === 0) {
        pageDrugs.push(remDrugs.shift());
        curH += nextDrug.height;
      } else {
        break;
      }
    }

    rightPages.push({
      drugs: pageDrugs,
      hasConclusion: remDrugs.length === 0 && (curH + conclusionH <= availH)
    });

    if (remDrugs.length === 0) {
      if (conclusionH > 0 && !rightPages[rightPages.length - 1].hasConclusion) {
        rightPages.push({ drugs: [], hasConclusion: true });
      }
      break;
    }
    pageIdx++;
  }

  const totalPages = Math.max(1, leftPages.length, rightPages.length);

  // Generate HTML for all pages
  const pagesHTML = [];
  for (let pNum = 1; pNum <= totalPages; pNum++) {
    const isFirstPage = pNum === 1;
    const isLastPage = pNum === totalPages;

    const pLeftUnits = (leftPages[pNum - 1] || []);
    const pLeftHTML = pLeftUnits.map(u => u.html).join('');

    const rPage = rightPages[pNum - 1] || { drugs: [], hasConclusion: isLastPage };
    const pDrugsHTML = (rPage.drugs || []).map(u => u.html).join('');

    // Page 1 has standard Rx symbol; Page 2 onwards has bold underlined continuation sentence
    let pBannerHTML = '';
    if (isFirstPage) {
      pBannerHTML = `<div class="rx-rx-title" style="color:${col}">${rxSymbolSVG}</div>`;
    } else {
      pBannerHTML = `
        <div class="rx-continuation-banner" style="color:${col}">
          <u><strong>Continuation of the ${getOrdinal(pNum - 1)} page of the prescription.</strong></u>
        </div>
      `;
    }

    const pageBadgeHTML = totalPages > 1 ? `<div class="rx-page-indicator">Page ${pNum} of ${totalPages}</div>` : '';

    const pageHTML = `
      <div class="rx-page" data-page="${pNum}" data-total-pages="${totalPages}">
        ${pageBadgeHTML}
        ${headerHTML}
        <hr class="rx-divider" style="border-top-color:${col}">
        ${patientRowHTML}
        <div class="rx-body">
          ${hasLeft ? `<div class="rx-left" style="width:${leftW}px; border-right: 1.5px solid ${col};">${pLeftHTML || '&nbsp;'}</div>` : ''}
          <div class="rx-right">
            ${pBannerHTML}
            ${pDrugsHTML ? `<div class="rx-drug-list">${pDrugsHTML}</div>` : ''}
            ${isLastPage ? adviceHTML : ''}
            ${isLastPage ? followupHTML : ''}
            ${isLastPage ? signatureHTML : ''}
          </div>
        </div>
        ${footerHTML}
      </div>
    `;

    pagesHTML.push(pageHTML);
  }

  return pagesHTML.join('\n');
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
  requestAnimationFrame(() => {
    fitRxPad(container);
    zoomRxPreview(0.0);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      fitRxPad(container);
      zoomRxPreview(0.0);
    });
  }
}

// ── PAD AUTO-FIT ──
function fitRxPad(pad) {
  if (!pad) return;
  const pages = pad.classList.contains('rx-page') ? [pad] : pad.querySelectorAll('.rx-page');
  pages.forEach(page => {
    const list = page.querySelector('.rx-drug-list');
    if (!list) return;
    list.style.fontSize = '';
  });
}

function printPrescription() {
  if (!state.currentRx) return;
  const rxHTML = renderRxHTML(state.currentRx);
  const w = window.open('', '_blank');
  if (!w) {
    toast('❌ Please allow pop-ups to print the prescription');
    return;
  }

  const baseHref = location.href.replace(/[^/]*$/, '');

  w.document.write(`
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <base href="${baseHref}">
    <title>Prescription Print</title>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    <style>
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; min-height: 0 !important; height: auto !important; }
      #rx-a4 {
        position: relative !important;
        box-shadow: none !important;
        width: 210mm !important; min-width: 0 !important; max-width: none !important;
        margin: 0 !important; padding: 0 !important;
        display: block !important;
        gap: 0 !important;
        background: transparent !important;
      }
      .rx-page {
        position: relative !important;
        box-shadow: none !important;
        width: 210mm !important; min-width: 210mm !important; max-width: 210mm !important;
        height: 296.8mm !important; min-height: 296.8mm !important; max-height: 296.8mm !important;
        padding: 26px 30px !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .rx-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .rx-page-indicator { display: none !important; }
    </style>
    </head><body><div id="rx-a4">${rxHTML}</div></body></html>
  `);
  w.document.close();

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    try {
      w.focus();
      w.print();
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
            <div style="font-size:13px; color:var(--text); margin-top:2px">${rx.diagnosis ? '<strong>Diagnosis:</strong> ' + esc(window.RxQuad ? RxQuad.plain(rx.diagnosis) : rx.diagnosis) : ''}</div>
            <div class="text-muted">${rx.complaints ? 'Complaints: ' + esc(window.RxQuad ? RxQuad.plain(rx.complaints) : rx.complaints).substring(0,60) + '...' : ''}</div>
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

function updateRxPatientInfoStrip(patientId) {
  const strip = document.getElementById('rx-patient-info-strip');
  if (!strip) return;
  const p = state.patients.find(x => x.id === patientId);
  if (!p) {
    strip.classList.add('hidden');
    strip.innerHTML = '';
    return;
  }

  const chips = [
    p.age ? `<strong>Age:</strong> ${esc(p.age)}` : '',
    p.gender ? `<strong>Sex:</strong> ${esc(p.gender)}` : '',
    p.weight ? `<strong>Weight:</strong> ${esc(p.weight)}` : '',
    p.bloodGroup ? `<strong>Blood:</strong> ${esc(p.bloodGroup)}` : '',
    p.phone ? `<strong>Phone:</strong> ${esc(p.phone)}` : ''
  ].filter(Boolean);

  const allergiesHTML = p.allergies ? `
    <div style="background:#fff5f5; border:1.5px solid #feb2b2; border-radius:8px; padding:7px 12px; margin-top:8px; display:flex; align-items:center; gap:8px; color:#c53030; font-weight:700; font-size:13px;">
      <span style="font-size:16px;">⚠️</span>
      <span>ALLERGY ALERT: ${esc(p.allergies)}</span>
    </div>
  ` : '';

  strip.innerHTML = `
    <div style="background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:10px 14px;">
      <div style="display:flex; flex-wrap:wrap; gap:8px 16px; font-size:12.5px; color:var(--text);">
        ${chips.map(c => `<div>${c}</div>`).join('')}
      </div>
      ${allergiesHTML}
    </div>
  `;
  strip.classList.remove('hidden');
}

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
  updateRxPatientInfoStrip(selectedId);
}

function checkRxPatientSelect(selectEl) {
  if (selectEl.value === '__NEW_PATIENT__') {
    openPatientModalFromRx();
  } else {
    lastValidRxPatientId = selectEl.value;
    updateRxPatientInfoStrip(selectEl.value);
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
    // Synchronize prescriptions if patient was renamed
    (state.prescriptions || []).forEach(r => {
      if (r.patientId === patientData.id) r.patientName = name;
    });
  } else {
    state.patients.unshift(patientData);
  }

  saveState();
  const wasAddingFromRx = isOpeningPatientFromRx;
  isOpeningPatientFromRx = false; // stop closeModal() from reopening with the stale selection
  closeModal('modal-patient');
  renderPatients();
  renderDashboard();
  renderAllRx();
  scheduleCloudSync(true);
  toast('✅ Patient saved');

  if (wasAddingFromRx) {
    openModal('modal-rx');
    populateRxPatientSelect(patientData.id);
    saveRxDraft();
  }
}

function openRxModalForPatient(pid) {
  const bmdcNum = cleanBmdcValue(state.profile.reg);
  if (!bmdcNum) {
    toast('⚠️ Please configure your BMDC Registration Number first');
    showSection('profile');
    setTimeout(() => document.getElementById('prof-reg')?.focus(), 200);
    return;
  }
  state.currentRx = null;
  openModal('modal-rx');
  populateRxPatientSelect(pid);

  const restored = restoreRxDraft(pid);
  if (!restored) {
    clearRxForm();
  }
}

function clearRxForm() {
  ['rx-complaints','rx-diagnosis','rx-plan','rx-history','rx-findings','rx-investigation','rx-advice','rx-notes'].forEach(id => setV(id, ''));
  const planCheck = document.getElementById('rx-plan-check');
  if (planCheck) {
    planCheck.checked = false;
    togglePlanField();
  }
  setV('rx-date', new Date().toISOString().split('T')[0]);
  setV('rx-visit', 'New Visit');
  setV('rx-followup-days', '');
  setV('rx-followup-unit', 'days');
  state.currentRx = null;
  document.getElementById('drug-rows').innerHTML = '';
  addDrugRow();
  updateRxPatientInfoStrip(v('rx-patient-select'));
}

function clearRxFieldsExceptPatient() {
  clearRxForm();
  clearRxDraft();
  toast('🧹 Prescription fields cleared (patient kept)');
  const comp = document.getElementById('rx-complaints');
  if (comp) {
    const editor = comp.parentNode?.querySelector('.rx-quad-editor');
    if (editor) editor.focus();
    else comp.focus();
  }
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
          <div class="text-muted">${rx.complaints ? esc(window.RxQuad ? RxQuad.plain(rx.complaints) : rx.complaints).substring(0,50) + '...' : ''}</div>
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
      ((window.RxQuad ? RxQuad.plain(r.diagnosis) : r.diagnosis) || '').toLowerCase().includes(currentRxSearchQuery) ||
      ((window.RxQuad ? RxQuad.plain(r.plan) : r.plan) || '').toLowerCase().includes(currentRxSearchQuery) ||
      ((window.RxQuad ? RxQuad.plain(r.complaints) : r.complaints) || '').toLowerCase().includes(currentRxSearchQuery) ||
      (r.date || '').toLowerCase().includes(currentRxSearchQuery) ||
      (r.drugs || []).some(d => 
        (d.name || '').toLowerCase().includes(currentRxSearchQuery) ||
        (d.generic || '').toLowerCase().includes(currentRxSearchQuery)
      )
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
        ${rx.diagnosis ? `<div style="font-size:13px; color:var(--text); margin-top:2px"><strong>Diagnosis:</strong> ${esc(window.RxQuad ? RxQuad.plain(rx.diagnosis) : rx.diagnosis)}</div>` : ''}
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
  const p = state.profile || {};
  setV('prof-name', p.name || '');
  setV('prof-quals', p.qualifications || '');
  setV('prof-desig', p.designation || '');
  setV('prof-hosp', p.hospital || '');
  setV('prof-reg', extractBmdcNumber(p.reg));
  setV('prof-phone', p.phone || '');

  setV('prof-chamber', p.chamberName || '');
  setV('prof-address', p.address || '');
  setV('prof-hours', p.hours || '');
  setV('prof-chamber-phone', p.chamberPhone || '');
  setV('prof-chamber-note', p.chamberNote || '');

  setV('prof-footer', p.footer || 'নিয়ম মাফিক ঔষধ খাবেন। ডাক্তারের পরামর্শ ব্যতীত ঔষধ পরিবর্তন নিষেধ।');
}

function saveProfile(silent = false) {
  const rawReg = v('prof-reg').trim();
  const bmdcNum = cleanBmdcValue(rawReg);
  if (!bmdcNum) {
    if (!silent) toast('⚠️ BMDC Registration Number is required');
    document.getElementById('prof-reg')?.focus();
    return;
  }

  state.profile.name = v('prof-name');
  state.profile.qualifications = v('prof-quals');
  state.profile.designation = v('prof-desig');
  state.profile.hospital = v('prof-hosp');
  state.profile.reg = formatBmdcReg(bmdcNum);
  state.profile.phone = v('prof-phone');

  state.profile.chamberName = v('prof-chamber');
  state.profile.address = v('prof-address');
  state.profile.hours = v('prof-hours');
  state.profile.chamberPhone = v('prof-chamber-phone');
  state.profile.chamberNote = v('prof-chamber-note');

  state.profile.footer = v('prof-footer');
  state.padSettings.footer = v('prof-footer');
  setV('pad-footer', v('prof-footer'));
  state.profile.updatedAt = Date.now();

  saveState();
  scheduleCloudSync(true);
  renderDashboard();
  renderAllRx();
  if (state.currentRx && !document.getElementById('modal-rx-preview')?.classList.contains('hidden')) {
    renderRxPreview(state.currentRx);
  }
  if (!silent) toast('✅ Doctor profile and chamber details saved');
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
let pendingRestoreData = null;

function exportBackupData() {
  const now = new Date();
  const backupPayload = {
    app: 'PrescribePro-Rx',
    version: '4.1 Pro',
    exportedAt: now.toISOString(),
    summary: {
      patientsCount: (state.patients || []).length,
      prescriptionsCount: (state.prescriptions || []).length,
      customDrugsCount: (state.customDrugs || []).length
    },
    user: state.user || {},
    profile: state.profile || {},
    padSettings: state.padSettings || {},
    patients: state.patients || [],
    prescriptions: state.prescriptions || [],
    customDrugs: state.customDrugs || [],
    theme: state.theme || 'light'
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const dateStr = now.toISOString().split('T')[0];
  const fileName = `prescribepro_backup_${dateStr}.json`;

  try {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = dataStr;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
  toast(`📥 Backup downloaded (${backupPayload.summary.patientsCount} patients, ${backupPayload.summary.prescriptionsCount} prescriptions)`);
}

function importBackupData(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || (
        !Array.isArray(parsed.patients) &&
        !Array.isArray(parsed.prescriptions) &&
        !Array.isArray(parsed.customDrugs) &&
        !parsed.profile
      )) {
        toast('❌ Invalid backup JSON file structure');
        return;
      }

      const imported = {
        app: parsed.app || 'PrescribePro-Rx',
        version: parsed.version || 'Legacy V3 / Cloud DB',
        exportedAt: parsed.exportedAt || null,
        profile: parsed.profile || null,
        padSettings: parsed.padSettings || null,
        patients: Array.isArray(parsed.patients) ? parsed.patients : [],
        prescriptions: Array.isArray(parsed.prescriptions) ? parsed.prescriptions : [],
        customDrugs: Array.isArray(parsed.customDrugs) ? parsed.customDrugs : [],
        theme: parsed.theme || null
      };

      pendingRestoreData = imported;
      showRestoreConfirmModal(file.name, imported);
    } catch(err) {
      console.error('Error reading JSON backup file:', err);
      toast('❌ Error reading JSON backup file');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

function showRestoreConfirmModal(fileName, imported) {
  const modal = document.getElementById('modal-restore-confirm');
  if (!modal) {
    const doMerge = confirm(`Restore backup: ${imported.patients.length} patients, ${imported.prescriptions.length} prescriptions found.\n\nClick OK to MERGE safely (keeps local records safe).\nClick Cancel to abort.`);
    if (doMerge) executeRestore('merge');
    return;
  }

  const nameEl = document.getElementById('restore-file-name');
  const metaEl = document.getElementById('restore-file-meta');
  const patCountEl = document.getElementById('restore-count-patients');
  const patLocalEl = document.getElementById('restore-local-patients');
  const rxCountEl = document.getElementById('restore-count-rx');
  const rxLocalEl = document.getElementById('restore-local-rx');
  const drugCountEl = document.getElementById('restore-count-drugs');
  const drugLocalEl = document.getElementById('restore-local-drugs');

  if (nameEl) nameEl.textContent = fileName || 'backup.json';
  if (metaEl) {
    const dateStr = imported.exportedAt ? new Date(imported.exportedAt).toLocaleString() : 'Date unspecified';
    const ver = imported.version ? `Version ${imported.version}` : 'Version 4.1 Pro';
    metaEl.textContent = `Exported: ${dateStr} · ${ver}`;
  }

  if (patCountEl) patCountEl.textContent = imported.patients.length;
  if (patLocalEl) patLocalEl.textContent = `Current: ${(state.patients || []).length}`;
  if (rxCountEl) rxCountEl.textContent = imported.prescriptions.length;
  if (rxLocalEl) rxLocalEl.textContent = `Current: ${(state.prescriptions || []).length}`;
  if (drugCountEl) drugCountEl.textContent = imported.customDrugs.length;
  if (drugLocalEl) drugLocalEl.textContent = `Current: ${(state.customDrugs || []).length}`;

  openModal('modal-restore-confirm');
}

function executeRestore(mode) {
  if (!pendingRestoreData) return;
  const imported = pendingRestoreData;

  const prevPatientCount = (state.patients || []).length;
  const prevRxCount = (state.prescriptions || []).length;

  if (mode === 'merge') {
    const merged = mergeState(state, imported);
    Object.assign(state, merged);
  } else if (mode === 'overwrite') {
    if (imported.profile) state.profile = { ...imported.profile };
    if (imported.padSettings) state.padSettings = { ...imported.padSettings };
    state.patients = [...imported.patients];
    state.prescriptions = [...imported.prescriptions];
    state.customDrugs = [...imported.customDrugs];
    if (imported.theme) state.theme = imported.theme;
  }

  if (!Array.isArray(state.customDrugs)) state.customDrugs = [];
  if (!Array.isArray(state.patients)) state.patients = [];
  if (!Array.isArray(state.prescriptions)) state.prescriptions = [];

  saveState();
  scheduleCloudSync(true);
  renderDashboard();
  renderPatients();
  renderAllRx();
  populateProfileForm();
  if (state.theme) applyTheme(state.theme, true);

  closeModal('modal-restore-confirm');
  pendingRestoreData = null;

  if (mode === 'merge') {
    const addedPatients = Math.max(0, state.patients.length - prevPatientCount);
    const addedRx = Math.max(0, state.prescriptions.length - prevRxCount);
    toast(`✅ Merged successfully: ${state.patients.length} patients (+${addedPatients}), ${state.prescriptions.length} prescriptions (+${addedRx})`);
  } else {
    toast(`✅ Restored backup: ${state.patients.length} patients, ${state.prescriptions.length} prescriptions`);
  }
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

function getRecordTimestamp(obj, fallback = 0) {
  if (!obj) return fallback;
  if (typeof obj.updatedAt === 'number' && !isNaN(obj.updatedAt)) return obj.updatedAt;
  if (typeof obj.updatedAt === 'string' && obj.updatedAt.trim()) {
    const t = new Date(obj.updatedAt).getTime();
    if (!isNaN(t)) return t;
    const n = Number(obj.updatedAt);
    if (!isNaN(n)) return n;
  }
  if (typeof obj.createdAt === 'number' && !isNaN(obj.createdAt)) return obj.createdAt;
  if (typeof obj.createdAt === 'string' && obj.createdAt.trim()) {
    const t = new Date(obj.createdAt).getTime();
    if (!isNaN(t)) return t;
    const n = Number(obj.createdAt);
    if (!isNaN(n)) return n;
  }
  return fallback;
}

function mergeState(local, cloud) {
  if (!cloud) return local;

  const merged = { ...local };

  // Merge Doctor Profile
  if (cloud.profile) {
    if (!merged.profile || getRecordTimestamp(cloud.profile) >= getRecordTimestamp(merged.profile)) {
      merged.profile = { ...(merged.profile || {}), ...cloud.profile };
    }
  }

  // Merge Pad Settings
  if (cloud.padSettings) {
    if (!merged.padSettings || getRecordTimestamp(cloud.padSettings) >= getRecordTimestamp(merged.padSettings)) {
      merged.padSettings = { ...(merged.padSettings || {}), ...cloud.padSettings };
    }
  }

  // Merge Patient Profiles (by ID)
  const patientMap = new Map();
  (merged.patients || []).forEach(p => {
    if (p && p.id) patientMap.set(p.id, p);
  });
  (cloud.patients || []).forEach(p => {
    if (!p || !p.id) return;
    const existing = patientMap.get(p.id);
    if (!existing || getRecordTimestamp(p) >= getRecordTimestamp(existing)) {
      patientMap.set(p.id, p);
    }
  });
  merged.patients = Array.from(patientMap.values());

  // Merge Prescriptions (by ID)
  const rxMap = new Map();
  (merged.prescriptions || []).forEach(r => {
    if (r && r.id) rxMap.set(r.id, r);
  });
  (cloud.prescriptions || []).forEach(r => {
    if (!r || !r.id) return;
    const existing = rxMap.get(r.id);
    if (!existing || getRecordTimestamp(r) >= getRecordTimestamp(existing)) {
      rxMap.set(r.id, r);
    }
  });
  merged.prescriptions = Array.from(rxMap.values());

  // Merge Custom Drugs (by unique id or lowercased name)
  const drugMap = new Map();
  (merged.customDrugs || []).forEach(d => {
    if (d && (d.id || d.name)) drugMap.set(String(d.id || d.name).toLowerCase().trim(), d);
  });
  (cloud.customDrugs || []).forEach(d => {
    if (!d || (!d.id && !d.name)) return;
    const key = String(d.id || d.name).toLowerCase().trim();
    const existing = drugMap.get(key);
    if (!existing || getRecordTimestamp(d) >= getRecordTimestamp(existing)) {
      drugMap.set(key, d);
    }
  });
  merged.customDrugs = Array.from(drugMap.values());

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
      version: '4.0',
      updatedAt: Date.now(),
      user: state.user,
      profile: state.profile,
      padSettings: state.padSettings,
      patients: state.patients,
      prescriptions: state.prescriptions,
      customDrugs: state.customDrugs || []
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
  if (id === 'modal-rx') {
    state.currentRx = null;
    updateRxPatientInfoStrip('');
  }
  if (id === 'modal-restore-confirm') {
    pendingRestoreData = null;
  }
}

function toast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}