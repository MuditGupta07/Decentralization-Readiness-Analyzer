/**
 * Analyzer Service (Hardened)
 * Evidence-Based Analysis Logic.
 */

import { githubService } from './github.js';
import { RISKS, READINESS_LEVELS, OFFLINE_SIGNALS } from '../data/heuristics.js';

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
      let offlineSignals = [];
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

        // --- FEATURE: MONOREPO SUPPORT (Bounded) ---
        // Look for 'packages' or 'apps' directories
        ['packages', 'apps'].forEach(dir => {
          if (fileNames.includes(dir)) {
             // We can't await inside this loop easily without blocking, so we add a promise
             fetchPromises.push(
               githubService.getDirContents(repoPath.owner, repoPath.repo, dir) // 1 API Call per dir
                 .then(async (subDirs) => {
                    if (!subDirs || !Array.isArray(subDirs)) return null;
                    // Limit to 10 sub-packages to avoid explosion, and filter out noise (dotfiles, docs, examples)
                    const targets = subDirs
                        .filter(d => d.type === 'dir' && !d.name.startsWith('.') && !['docs', 'examples', 'tests', 'website', 'demo'].includes(d.name))
                        .slice(0, 10);
                    
                    const subResults = await Promise.all(
                      targets.map(t => 
                        githubService.getRawFile(repoPath.owner, repoPath.repo, `${dir}/${t.name}/package.json`, defaultBranch)
                          .then(content => content ? { name: `${dir}/${t.name}/package.json`, type: 'monorepo-dep', content } : null)
                      )
                    );
                    return subResults.filter(Boolean);
                 })
                 .catch(() => null) // Ignore errors/limits in sub-scans
             );
          }
        });

        // --- FEATURE: STRING SCANS (Safe/Bounded) ---
        // Look for 'src' directory
        if (fileNames.includes('src')) {
             fetchPromises.push(
               githubService.getDirContents(repoPath.owner, repoPath.repo, 'src')
                 .then(async (srcFiles) => {
                    if (!srcFiles || !Array.isArray(srcFiles)) return null;
                    // Filter for code files, limit to 20
                    const targets = srcFiles.filter(f => f.name.match(/\.(js|ts|jsx|tsx)$/) && f.type === 'file').slice(0, 20);
                    
                    const srcResults = await Promise.all(
                      targets.map(t => {
                           if (t.download_url) {
                               return githubService.getAbsoluteRaw(t.download_url)
                                   .then(content => content ? { name: `src/${t.name}`, type: 'code-scan', content } : null);
                           } else {
                               return githubService.getRawFile(repoPath.owner, repoPath.repo, `src/${t.name}`, defaultBranch)
                                   .then(content => content ? { name: `src/${t.name}`, type: 'code-scan', content } : null);
                           }
                      })
                    );
                    return srcResults.filter(Boolean);
                 })
                 .catch(() => null)
             );
        }

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
      // Process Fetched Content
      fileResults.forEach(res => {
         if (res.status === 'fulfilled' && res.value) {
            // value can be a single file object OR an array (for monorepo/src scans)
            const items = Array.isArray(res.value) ? res.value : [res.value];
            
            items.forEach(item => {
                if (!item) return;
                const { name, content, type } = item;

                // 1. Standard Deps
                if (name === 'package.json') packageJsonStr = content;
                if (name === 'requirements.txt') requirementsTxt = content;
                if (name === 'composer.json') composerJsonStr = content;
                
                // 2. Monorepo Deps
                if (type === 'monorepo-dep' && content) {
                     try {
                        const pkg = JSON.parse(content);
                        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                        // Add as Supporting Evidence if not already found (we'll process deps later but flag here)
                        // Actually, just add to allDeps but we might want to flag origin.
                        // For simplicity/robustness, we add to allDeps. 
                        // To allow "Supporting" classification, we would need to map dep -> source.
                        // Current logic maps dep -> risk. We'll rely on allDeps for coverage.
                         Object.keys(deps).forEach(d => allDeps.add(d));
                         // Explicitly flagging monorepo existence as a positive signal of complexity? No.
                     } catch (e) { /* ignore */ }
                }

                // 3. Code String Scans
                if (type === 'code-scan' && content) {
                     // Regex for specific risky domains
                     const codeRisks = [
                         { id: 'firebase', pattern: /firebaseio\.com/i, label: 'Firebase API' },
                         { id: 'google', pattern: /googleapis\.com/i, label: 'Google API' },
                         { id: 'supabase', pattern: /supabase\.co/i, label: 'Supabase API' },
                         { id: 'auth0', pattern: /auth0\.com/i, label: 'Auth0 API' },
                         { id: 'aws', pattern: /amazonaws\.com/i, label: 'AWS API' },
                     ];

                     // Generic Network Detection (fetch/axios)
                     // matches: fetch(, axios., axios(
                     const genericPattern = /fetch\s*\(|axios(\.|@|\s*\()/i;
                     if (genericPattern.test(content)) {
                        fileSignals.push({
                            signal: 'Generic Network Call (fetch/axios)',
                            risk: 'Medium',
                            category: 'External Service',
                            reason: `Network client usage detected in ${name}. Target Unknown.`
                        });
                        // Track specifically for ambiguity check
                        allDeps.add('GENERIC_NETWORK'); 
                     }

                     // Offline Signal Detection
                     const offlinePatterns = [
                       { cat: 'PERSISTENCE', regex: /indexedDB|localforage|dexie|rxdb|pouchdb|watermelondb/i },
                       { cat: 'CACHING', regex: /navigator\.serviceWorker|caches\.open|workbox|sw-precache/i },
                       { cat: 'INTENT', regex: /navigator\.onLine|addEventListener\(['"]offline['"]\)|backgroundSync/i },
                       { cat: 'NATIVE', regex: /tauri|electron-store|react-native-fs|capacitor/i }
                     ];

                     offlinePatterns.forEach(op => {
                       if (op.regex.test(content)) {
                          allDeps.add(`OFFLINE_${op.cat}`); // Generic flag
                          // Add specific signal for evidence
                          // Extract what matched roughly? regex.exec? match[0]?
                          const match = content.match(op.regex);
                          if (match) {
                             // We don't want to spam evidence, just track unique signals
                              // But we need evidence for the report.
                              // Let's optimize: Add to a set of offline signals later?
                              // Or push to fileSignals? 
                              // Current logic pushes to fileSignals which become findings.
                              // Let's push, but maybe mark risk as 'Info' or 'Low' so it doesn't affect Centralization Score?
                              // Actually, these are POSITIVE signals. We shouldn't put them in "Evidence of Centralization".
                              // We should track them separately or filter them out of "Centralization Evidence".
                              
                              // We'll store them in a new list: offlineSignals
                              offlineSignals.push({
                                file: name,
                                category: op.cat,
                                signal: `Detected ${match[0]}`
                              });
                          }
                       }
                     });

                     codeRisks.forEach(cr => {
                         if (cr.pattern.test(content)) {
                             // Add specific signal
                             fileSignals.push({
                                 signal: `Hardcoded API detected: ${cr.label}`,
                                 risk: 'Medium', // Downgraded because string regex isn't AST
                                 category: 'External Service',
                                 reason: `Found "${cr.label}" string in ${name}. Potential runtime dependency.`
                             });
                         }
                     });
                }

                // 4. Config Signals
                if (['firebase.json', 'vercel.json', 'netlify.toml', 'docker-compose.yml'].includes(name)) {
                   configSignals.push({ 
                     file: name, 
                     signal: `Config file present: ${name}`, 
                     risk: 'Medium', 
                     category: 'Hosting Dependency',
                     reason: `Project is configured for specific platform (${name.split('.')[0]}).`
                   });
                   if (name === 'firebase.json') allDeps.add('firebase-tools');
                   if (name === 'vercel.json') allDeps.add('vercel.json');
                   if (name === 'netlify.toml') allDeps.add('netlify.toml');
                }
            });
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
      
      // Offline Lib Check for Gating
      const hasOfflineStorageLib = allDeps.has('idb') || allDeps.has('localforage') || allDeps.has('redux-persist') || allDeps.has('rxdb');
      const hasGenericNetwork = allDeps.has('GENERIC_NETWORK');

      if (highRiskCount > 0) {
        report.score = READINESS_LEVELS.LOW;
        report.architecture = 'Centralized / Server-Required';
      } else if (mediumRiskCount > 0) {
        // Check for Ambiguity: Generic Network + No Local First + No Specific Centralization
        // If we found specific centralized configs (vercel.json) or strings (firebase), mediumRiskCount > 0
        // If we ONLY found 'Generic Network' and nothing else specific...
        
        // Wait, 'Generic Network' adds a Medium signal. So we are here.
        // If we have Generic Network, but NO Offline Support -> We can't say it's "Hybrid" accurately used for decentralization.
        // But we also don't know if it's centralized. -> HUMAN REVIEW.

        if (hasGenericNetwork && !hasOfflineStorageLib && highRiskCount === 0) {
             // Differentiate: Is there OTHER specific medium evidence (like vercel.json)?
             // If yes, we stick to MEDIUM (Hybrid).
             // If NO specific evidence (just fetch), it's ambiguous.
             const specificEvidence = findings.filter(f => f.signal !== 'Generic Network Call (fetch/axios)');
             
             if (specificEvidence.length === 0) {
                 report.score = READINESS_LEVELS.HUMAN_REVIEW;
                 report.architecture = 'Ambiguous (Network Detected)';
             } else {
                 report.score = READINESS_LEVELS.MEDIUM;
                 report.architecture = 'Hybrid (Client + Services)';
             }
        } else {
             report.score = READINESS_LEVELS.MEDIUM;
             report.architecture = 'Hybrid (Client + Services)';
        }

      } else if (allDeps.size > 0 && highRiskCount === 0 && mediumRiskCount === 0) {
         // CLEAN PASS
         // Gate: If we somehow missed generic network but have no other signals? 
         // (Impossible as generic network adds medium risk)
         
         report.score = READINESS_LEVELS.HIGH;
         report.architecture = 'Decentralized / Client-Side';
      } else {
        // No deps found or empty repo -> Unknown
        report.score = READINESS_LEVELS.UNKNOWN;
        report.architecture = 'Unknown / Static';
      }

      // 6. Strict Offline Check (Deepened & Tiered)
      // signal tally
      const offStats = {
          persistence: offlineSignals.some(s => s.category === 'PERSISTENCE') || Array.from(allDeps).some(d => OFFLINE_SIGNALS.PERSISTENCE.includes(d)),
          caching: offlineSignals.some(s => s.category === 'CACHING') || Array.from(allDeps).some(d => OFFLINE_SIGNALS.CACHING.includes(d)),
          native: offlineSignals.some(s => s.category === 'NATIVE') || Array.from(allDeps).some(d => OFFLINE_SIGNALS.NATIVE.includes(d)),
          intent: offlineSignals.some(s => s.category === 'INTENT') || Array.from(allDeps).some(d => OFFLINE_SIGNALS.INTENT.includes(d)),
      };

      const hasCloudDB = findings.some(f => f.category === 'Critical Infrastructure'); // e.g. Firebase

      let offlineStatus = 'Online-Only';
      let offlineReason = 'No verifiable offline capability found.';

      if (hasCloudDB) {
          offlineStatus = 'Online-Only';
          offlineReason = 'Critical Cloud Dependencies (DB/Auth) prevent offline use.';
      } else {
          // Rule: Offline-Capable = Persistence AND (Caching OR Native)
          if (offStats.persistence && (offStats.caching || offStats.native)) {
              offlineStatus = 'Offline-Capable';
              offlineReason = 'Strong Local Persistence + Offline Shell detected.';
          } 
          // Rule: Partially Offline = Caching Only OR Persistence Only
          else if (offStats.caching || offStats.persistence || offStats.native) {
              offlineStatus = 'Partially Offline';
              offlineReason = 'Partial offline signals found (Caching or Storage), but full capability unverified.';
          }
      }

      report.offline = { 
          status: offlineStatus, 
          reason: offlineReason,
          evidence: offlineSignals // Pass explicit evidence to report
      };

      return report;

    } catch (error) {
       console.error(error);
       throw error;
    }
  }
}

export const analyzerService = new AnalyzerService();
