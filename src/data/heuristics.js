/**
 * Decentralization Heuristics (Advanced)
 * 
 * PHILOSOPHY:
 * - Evidence-Based: No guessing. Every finding must point to a specific file/line.
 * - Deterministic: Same input = same output. No AI probability.
 * - Conservative: Prefer "Unknown" over false assurance.
 * 
 * Rules:
 * - Risks are categorized by type (Critical, Hosting, Vendor, etc.)
 * - Each risk has a specific failure mode explanation.
 */

export const OFFLINE_SIGNALS = {
  PERSISTENCE: ['indexedDB', 'idb', 'localforage', 'dexie', 'rxdb', 'pouchdb', 'watermelondb', 'sqlite-wasm', 'absurd-sql'],
  CACHING: ['serviceWorker', 'sw-precache', 'workbox', 'vite-plugin-pwa', 'next-pwa', 'caches.open'],
  INTENT: ['navigator.onLine', 'window.addEventListener("offline")', 'backgroundSync', 'periodicSync'],
  NATIVE: ['tauri', 'electron-store', 'react-native-fs', 'capacitor', 'cordova']
};

export const RISKS = {
  // --- Generic Network Signals ---
  'GENERIC_NETWORK': {
    id: 'generic-network',
    category: 'External Service',
    riskLevel: 'Medium',
    reason: 'Generic HTTP Client detected (fetch/axios).',
    failureMode: 'Project makes network calls. Centralization unknown without runtime verification.'
  },

  'firebase': { 
    id: 'firebase',
    category: 'Critical Infrastructure', 
    riskLevel: 'High', 
    reason: 'Relies on Google-hosted proprietary backend services (Auth/DB/Hosting).',
    failureMode: 'If Google limits the project or the service goes down, the application completely stops working.' 
  },
  // ... (previous deps mostly same, saving space if possible, but replace tool needs full logic if overwriting block) ...
  // actually I should only overwrite the specific blocks or the whole file. I will overwrite the config section particularly.

  '@firebase/app': { 
    id: 'firebase',
    category: 'Critical Infrastructure', 
    riskLevel: 'High', 
    reason: 'Core Firebase SDK Detected.',
    failureMode: 'Centralized backend dependency. Single point of failure.' 
  },
  'firebase-tools': {
    id: 'firebase-tools',
    category: 'Critical Infrastructure', 
    riskLevel: 'High', 
    reason: 'Firebase CLI indicates deployment/management via Firebase.',
    failureMode: 'infra-as-code binding to Firebase.'
  },
  'aws-sdk': { 
    id: 'aws-sdk',
    category: 'Critical Infrastructure', 
    riskLevel: 'High', 
    reason: 'Hard dependency on Amazon Web Services.',
    failureMode: 'Vendor lock-in. Migration requires rewriting core logic.' 
  },
  'contentful': { 
    id: 'contentful',
    category: 'Critical Infrastructure', 
    riskLevel: 'High', 
    reason: 'Headless CMS hosted by Contentful.',
    failureMode: 'Content vanishes if API fails or payment stops.' 
  },
  'sanity': { 
    id: 'sanity',
    category: 'Critical Infrastructure', 
    riskLevel: 'High', 
    reason: 'Headless CMS hosted by Sanity.',
    failureMode: 'Content dependency. App is a shell without the remote API.' 
  },

  // --- Traditional Server Architecture (Low Readiness) ---
  'wordpress-core': { 
    id: 'wordpress',
    category: 'Traditional Server', 
    riskLevel: 'High', 
    reason: 'Monolithic PHP Server Architecture.',
    failureMode: 'Single Server (SPoF). If the server crashes, the site is gone.' 
  },
  'laravel/framework': { 
    id: 'laravel',
    category: 'Traditional Server', 
    riskLevel: 'High', 
    reason: 'PHP Backend Framework.',
    failureMode: 'Requires always-on trusted server.' 
  },
  'django': { 
    id: 'django',
    category: 'Traditional Server', 
    riskLevel: 'High', 
    reason: 'Python Backend Framework.',
    failureMode: 'Centralized logic/database. Not distributed.' 
  },
  'express': {
    id: 'express',
    category: 'Traditional Server',
    riskLevel: 'High',
    reason: 'Node.js Backend Framework.',
    failureMode: 'Implies a centralized server API.'
  },

  // --- Hosting Dependency (Medium/High) - MITIGATED ---
  'vercel.json': {
    id: 'vercel',
    category: 'Hosting Dependency',
    riskLevel: 'Medium',
    reason: 'Optimized for Vercel Cloud Platform.',
    failureMode: 'Project likely relies on Vercel-specific serverless functions. (Check if Dev-Only)'
  },
  'netlify.toml': {
    id: 'netlify',
    category: 'Hosting Dependency',
    riskLevel: 'Medium',
    reason: 'Optimized for Netlify Cloud Platform.',
    failureMode: 'Project likely relies on Netlify-specific redirects/forms. (Check if Dev-Only)'
  },
  'docker-compose.yml': {
    id: 'docker',
    category: 'Infrastructure Config',
    riskLevel: 'Medium',
    reason: 'Docker Orchestration Config.',
    failureMode: 'Implies complex server requirements. May be Dev-Only, but verification required.'
  },
    
  // --- Vendor Lock-in (Medium/High Risk) ---
  '@auth0/auth0-react': { 
    id: 'auth0',
    category: 'Identity Dependency', 
    riskLevel: 'High', 
    reason: 'Identity as a Service (Auth0).',
    failureMode: 'Users cannot log in if Auth0 is down. Identity data is not owned by the user.' 
  },
  '@clerk/clerk-react': { 
    id: 'clerk',
    category: 'Identity Dependency', 
    riskLevel: 'High', 
    reason: 'Proprietary Auth Provider.',
    failureMode: 'User identity siloed in Clerk servers.' 
  },
  '@supabase/supabase-js': { 
    id: 'supabase',
    category: 'Data Dependency', 
    riskLevel: 'Medium', 
    reason: 'Supabase (Managed Postgres/Auth).',
    failureMode: 'While open-source compatible, usually deployed as a hosted monolith. Migration is easier than Firebase but still non-trivial.' 
  },

  // --- Operational Dependency (Medium Risk) ---
  'react-ga': { 
    id: 'analytics',
    category: 'Operational', 
    riskLevel: 'Medium', 
    reason: 'Google Analytics.',
    failureMode: 'Privacy leak. Does not usually break core app functionality if blocked.' 
  },
  'mixpanel-browser': { 
    id: 'analytics',
    category: 'Operational', 
    riskLevel: 'Medium', 
    reason: 'Mixpanel Tracking.',
    failureMode: 'User surveillance. Non-critical for uptime.' 
  },
};

export const READINESS_LEVELS = {
  HIGH: { 
    label: 'HIGH READINESS', 
    color: 'var(--accent-primary)', 
    desc: 'System is designed to run independently. No obvious single points of control/failure found in dependencies.',
    verdict: 'Decentralized / Self-Sufficient'
  },
  MEDIUM: { 
    label: 'MEDIUM READINESS', 
    color: 'var(--accent-warn)', 
    desc: 'System works but has some centralized dependencies (Analytics, Optional APIs) or partial vendor lock-in.',
    verdict: 'Hybrid / Partial Dependencies'
  },
  LOW: { 
    label: 'LOW READINESS', 
    color: 'var(--accent-risk)', 
    desc: 'System is architected around centralized control (Cloud DB, Auth Provider, Monolithic Server). It cannot function without specific vendors.',
    verdict: 'Centralized / Fragile'
  },
  UNKNOWN: {
    label: 'MANUAL REVIEW REQUIRED',
    color: 'var(--text-secondary)',
    desc: 'No strong signals found. Does not use standard recognized decentralized or centralized patterns.',
    verdict: 'Unknown'
  }
};
