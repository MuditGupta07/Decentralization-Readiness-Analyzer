/**
 * Analyzer Service (Hardened)
 * Evidence-Based Analysis Logic.
 */

import { githubService } from './github.js';
import { RISKS, READINESS_LEVELS } from '../data/heuristics.js';

export class AnalyzerService {
  async analyzeRepo(repoUrl) {
    const report = {
      url: repoUrl,
      repoInfo: null,
      evidence: [], // List of specific findings made by the tool
      architecture: 'Unknown',
      score: READINESS_LEVELS.UNKNOWN,
      offline: { status: 'Online-Only', reason: 'Default assumption. No offline signals found.' },
      timestamp: new Date().toISOString(),
      limitations: [
        'Static analysis only checks standard config files (package.json, composer.json).',
        'Cannot detect runtime API calls made in obscure or minified code.',
        'Assumes standard naming for tech stacks (e.g., firebase, auth0).'
      ]
    };

    // 1. Parse URL
    const repoPath = githubService.parseUrl(repoUrl);
    if (!repoPath) throw new Error('Invalid GitHub URL');

    try {
      // 2. Info & Directory Scan
      // Fetch metadata first. If rate limited, we get a skeleton object.
      const repoInfo = await githubService.getRepoDetails(repoPath.owner, repoPath.repo);
      if (!repoInfo) throw new Error('Repository not found or private.');
      
      report.repoInfo = repoInfo;
      const defaultBranch = repoInfo.default_branch || 'main'; // Fallback for blind scan

      // Try API Directory Listing (1 Call)
      // If null, it means we are rate limited or empty -> Proceed to BLIND SCAN
      const rootFiles = await githubService.getDirContents(repoPath.owner, repoPath.repo);

      // 3. Evidence Gathering (Files & Dependencies)
      let allDeps = new Set();
      let fileSignals = [];
      let configSignals = [];

      // Files to check for existence and optionally fetch
      const fileChecks = [
        { name: 'package.json', type: 'dep' },
        { name: 'requirements.txt', type: 'dep' },
        { name: 'composer.json', type: 'dep' },
        { name: 'firebase.json', type: 'config' },
        { name: 'vercel.json', type: 'config' },
        { name: 'netlify.toml', type: 'config' },
        { name: 'docker-compose.yml', type: 'config' },
        { name: '.env.example', type: 'config' },
      ];

      const fetchPromises = [];

      // Logic: If we have directory listing (Unknown Safe Mode), only fetch what we see.
      // If we don't (Blind Mode), try to fetch EVERYTHING and ignore 404s.
      const isBlindMode = !rootFiles || rootFiles.length === 0;

      if (repoInfo.rateLimited) {
          report.limitations.push('GitHub API Rate Limit active. Performing LIMITED "Blind Scan" of standard files.');
      }

      if (!isBlindMode) {
        // OPTIMIZED SCAN: Only fetch files we know exist
        const fileNames = rootFiles.map(f => f.name);

        fileChecks.forEach(check => {
          if (fileNames.includes(check.name)) {
             fetchPromises.push(
               githubService.getRawFile(repoPath.owner, repoPath.repo, check.name, defaultBranch)
                 .then(content => ({ name: check.name, type: check.type, content }))
             );
          }
        });

        // Structure Hints
        if (fileNames.includes('manage.py')) {
           allDeps.add('django');
           fileSignals.push({ signal: 'Found `manage.py`', risk: 'High', category: 'Traditional Server', reason: 'Django Project Structure' });
        }
        if (fileNames.includes('wp-admin') || fileNames.includes('wp-includes')) {
          allDeps.add('wordpress-core');
          fileSignals.push({ signal: 'Found `wp-admin`', risk: 'High', category: 'Traditional Server', reason: 'WordPress Project Structure' });
        }

      } else {
        // BLIND SCAN: Fetch everything, hope for hits
        fileChecks.forEach(check => {
             fetchPromises.push(
               githubService.getRawFile(repoPath.owner, repoPath.repo, check.name, defaultBranch)
                 .then(content => ({ name: check.name, type: check.type, content }))
             );
        });
      }

      const fileResults = await Promise.allSettled(fetchPromises);
      
      let packageJsonStr = null;
      let requirementsTxt = null;
      let composerJsonStr = null;
      
      // Process Fetched Content
      fileResults.forEach(res => {
         if (res.status === 'fulfilled' && res.value) {
            const { name, content } = res.value;
            // Scan configs for signals
            if (name === 'package.json') packageJsonStr = content;
            if (name === 'requirements.txt') requirementsTxt = content;
            if (name === 'composer.json') composerJsonStr = content;
            
            // Supporting Config Signals
            if (['firebase.json', 'vercel.json', 'netlify.toml', 'docker-compose.yml'].includes(name)) {
               configSignals.push({ 
                 file: name, 
                 signal: `Config file present: ${name}`, 
                 risk: 'Medium', 
                 category: 'Hosting Dependency',
                 reason: `Project is configured for specific platform (${name.split('.')[0]}).`
               });
               // Auto-flag known risky configs
               if (name === 'firebase.json') allDeps.add('firebase-tools');
               if (name === 'vercel.json') allDeps.add('vercel.json'); // Map to heuristic
               if (name === 'netlify.toml') allDeps.add('netlify.toml');
            }
         }
      });

      // --- Parse Dependencies ---
      // JS
      if (packageJsonStr) {
        try {
          const pkg = JSON.parse(packageJsonStr);
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          Object.keys(deps).forEach(d => allDeps.add(d));
        } catch (e) {
             console.warn('Failed to parse package.json');
        }
      }

      // Python
      if (requirementsTxt) {
        requirementsTxt.split('\n').forEach(line => {
          const match = line.match(/^([a-zA-Z0-9_\-]+)/);
          if (match) allDeps.add(match[1].toLowerCase());
        });
      }

      // PHP
      if (composerJsonStr) {
        try {
          const pkg = JSON.parse(composerJsonStr);
          const deps = { ...pkg.require, ...pkg['require-dev'] };
          Object.keys(deps).forEach(d => allDeps.add(d));
        } catch (e) {
             console.warn('Failed to parse composer.json');
        }
      }

      // 4. Heuristic Matching (Evidence Creation)
      const findings = [];
      let highRiskCount = 0;
      let mediumRiskCount = 0;
      let strongEvidenceCount = 0; // Direct deps or critical files

      // Add file signals (Strong)
      fileSignals.forEach(sig => {
         findings.push({
           source: 'File Structure (Strong)',
           signal: sig.signal,
           risk: sig.risk,
           category: sig.category,
           failureMode: sig.reason
         });
         if (sig.risk === 'High') { highRiskCount++; strongEvidenceCount++; }
      });

      // Add config signals (Supporting)
      configSignals.forEach(sig => {
         findings.push({
            source: 'Configuration (Supporting)',
            signal: sig.signal,
            risk: sig.risk,
            category: sig.category,
            failureMode: sig.reason
         });
         if (sig.risk === 'High') highRiskCount++; // Configs can still trip high risk keys
         if (sig.risk === 'Medium') mediumRiskCount++;
      });

      // Check Deps (Strong)
      allDeps.forEach(dep => {
        const rule = RISKS[dep];
        if (rule) {
          findings.push({
            source: 'Dependency (Strong)',
            signal: `Found rigid dependency: ${dep}`,
            risk: rule.riskLevel,
            category: rule.category,
            failureMode: rule.failureMode
          });
          if (rule.riskLevel === 'High') { highRiskCount++; strongEvidenceCount++; }
          if (rule.riskLevel === 'Medium') mediumRiskCount++;
        }
      });

      report.evidence = findings;

      // 5. Hardened Verdict Logic (Weighted)
      if (highRiskCount > 0) {
        report.score = READINESS_LEVELS.LOW;
        report.architecture = 'Centralized / Server-Required';
      } else if (mediumRiskCount > 0) {
        report.score = READINESS_LEVELS.MEDIUM;
        report.architecture = 'Hybrid (Client + Services)';
      } else if (allDeps.size > 0 && highRiskCount === 0 && mediumRiskCount === 0) {
        // Only if we actually scanned things and found NO risks
        report.score = READINESS_LEVELS.HIGH;
        report.architecture = 'Decentralized / Client-Side';
      } else {
        // No deps found or empty repo -> Unknown
        report.score = READINESS_LEVELS.UNKNOWN;
        report.architecture = 'Unknown / Static';
      }

      // 6. Strict Offline Check (Deepened)
      const hasPWA = allDeps.has('vite-plugin-pwa') || allDeps.has('workbox-webpack-plugin') || allDeps.has('@angular/service-worker');
      const hasCloudDB = findings.some(f => f.category === 'Critical Infrastructure');
      
      // Check for code usage hints (indexedDB/localStorage) - Simple Scan
      // Note: This is a scan of package.json/main files only for now to catch libs like 'idb' or 'localforage'
      const hasOfflineStorageLib = allDeps.has('idb') || allDeps.has('localforage') || allDeps.has('redux-persist');

      if (hasCloudDB) {
        report.offline = { status: 'Online-Only', reason: 'Critical Cloud Dependencies (DB/Auth) prevent offline use.' };
      } else if (hasPWA || hasOfflineStorageLib) {
        report.offline = { status: 'Offline-Capable', reason: 'Explicit offline libraries (PWA/IDB) detected.' };
      } else {
        report.offline = { status: 'Online-Only', reason: 'No offline-first libraries or service workers found.' };
      }

      return report;

    } catch (error) {
       console.error(error);
       throw error;
    }
  }
}

export const analyzerService = new AnalyzerService();
