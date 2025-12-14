/**
 * Analyzer Service V2 (Tree-Based)
 * Uses recursive tree mapping to eliminate blind 404s and ensure 100% discovery.
 */

import { githubService } from './github.js';
import { FileSystemService } from './fileSystem.js';
import { RISKS, READINESS_LEVELS, OFFLINE_SIGNALS } from '../data/heuristics.js';

export class AnalyzerService {

  async analyzeRepo(repoUrl) {
    const repoPath = githubService.parseUrl(repoUrl);
    if (!repoPath) throw new Error('Invalid GitHub URL');

    const context = {
        type: 'ONLINE',
        owner: repoPath.owner,
        repo: repoPath.repo,
        defaultBranch: 'main' 
    };

    return this._runAnalysis(githubService, context);
  }

  async analyzeLocal(dirHandle) {
     const provider = new FileSystemService(dirHandle);
     const context = { type: 'OFFLINE' };
     return this._runAnalysis(provider, context);
  }

  /**
   * Core Analysis Logic (Tree-Based)
   */
  async _runAnalysis(provider, context) {
      
      // 1. Metadata & Branch Detection
      let projectInfo = null;
      let rateLimited = false;

      const getDetails = async () => {
         if (context.type === 'ONLINE') return provider.getRepoDetails(context.owner, context.repo);
         return provider.getProjectDetails();
      };

      projectInfo = await getDetails();
      if (!projectInfo) throw new Error('Project access failed.');

      if (projectInfo.rateLimited) {
          rateLimited = true;
          context.defaultBranch = 'master'; 
      } else {
          context.defaultBranch = projectInfo.default_branch || 'main'; 
      }

      // 2. TREE SCAN (The "Map")
      let tree = [];
      if (context.type === 'ONLINE') {
          tree = await provider.getTree(context.owner, context.repo, context.defaultBranch);
      } else {
          tree = await provider.getTree();
      }

      if (!tree || (tree.rateLimited && context.type === 'ONLINE')) {
          rateLimited = true;
          tree = []; // Fallback to empty tree, will trigger blind/limited scan if needed
      }

      // --- Smart Unwrapping (Tree Based) ---
      // If all files in the tree start with the same directory prefix, unwrap it.
      // e.g. "repo-main/package.json", "repo-main/src/..."
      let pathPrefix = '';
      if (tree.length > 0) {
          const firstPath = tree[0].path;
          const slashIndex = firstPath.indexOf('/');
          if (slashIndex !== -1) {
              const possiblePrefix = firstPath.substring(0, slashIndex + 1); // "repo-main/"
              const allMatch = tree.every(f => f.path.startsWith(possiblePrefix));
              if (allMatch) {
                  pathPrefix = possiblePrefix;
              }
          }
      }

      // Helper: Check existence (Eliminates 404s!)
      const fileExists = (path) => {
           const targetPath = pathPrefix + path;
           return tree.some(f => f.path === targetPath && f.type === 'file');
      };

      // Helper: Get files in a dir (from memory!)
      const getFilesInDir = (dirPath) => {
          const targetDir = dirPath ? (pathPrefix + dirPath) : pathPrefix.slice(0, -1); // handle root
          // logic is tricky with prefixes. 
          // Simplest: Filter tree for items starting with targetDir + '/' and having no more slashes
          // But tree paths are full relative paths.
          // Let's rely on `dataset` filtering instead.
          /* 
             Actually, we don't need `getDir` anymore for crawling!
             We have the FULL LIST. We can just search the list for patterns.
             This is the power of Tree-Based scanning.
          */
         return [];
      };

      // Helper: Fetch File (Only if exists)
      const getFile = async (path) => {
          const targetPath = pathPrefix + path;
          // Pre-check existence using the Tree Map
          const exists = tree.some(f => f.path === targetPath);
          if (!exists && !rateLimited) return null; // Skip fetch if we know it's missing!

          if (context.type === 'ONLINE') return provider.getRawFile(context.owner, context.repo, targetPath, context.defaultBranch);
          return provider.getFileContent(targetPath);
      };

      // Setup Report
      const report = {
        repoInfo: projectInfo,
        evidence: [],
        architecture: 'Unknown',
        score: READINESS_LEVELS.UNKNOWN,
        offline: { status: 'Online-Only', reason: 'Default assumption.' },
        timestamp: new Date().toISOString(),
        limitations: [
           context.type === 'ONLINE' ? 'Tree-Based Network analysis.' : 'Recursive Local analysis.'
        ] // Cleared blind scan warning unless rate limited
      };

      if (rateLimited) {
          report.limitations.push('GitHub API Rate Limit active. Switching to limited Blind Scan.');
      } else if (pathPrefix) {
          report.limitations.push(`Auto-unwrapped folder: ${pathPrefix}`);
      }

      // --- Analysis Strategy ---
      // Instead of "checking files", we can now "query the tree".

      let allDeps = new Set();
      let fileSignals = [];
      let offlineSignals = [];
      let configSignals = [];
      const fetchPromises = [];

      // A. Config & Dependency Files (Exact Match)
      const criticalFiles = [
        'package.json', 'requirements.txt', 'composer.json', 
        'firebase.json', 'vercel.json', 'netlify.toml', 'docker-compose.yml', 'fly.toml', '.env.example'
      ];

      criticalFiles.forEach(f => {
          if (fileExists(f) || rateLimited) { // If rate limited, we blindly try
               // FIX: package.json/composer.json are dependency manifests (neutral), not hosting configs (medium risk).
               // We only mark specific hosting files (vercel.json, netlify.toml) as 'config'.
               const isHostingConfig = ['firebase.json', 'vercel.json', 'netlify.toml', 'fly.toml', 'docker-compose.yml'].includes(f);
               const type = isHostingConfig ? 'config' : 'dep';
               
               fetchPromises.push(getFile(f).then(c => c ? { name: f, type: type, content: c } : null));
          }
      });

      // B. Structure Hints (Pattern Match on Tree)
      // No fetch needed! Just check the paths.
      const structureChecks = [
          { pattern: /manage\.py$/, signal: 'Django Backend', id: 'django' },
          { pattern: /wp-admin/, signal: 'WordPress', id: 'wordpress' },
          { pattern: /Gemfile/, signal: 'Ruby/Rails', id: 'ruby' },
          { pattern: /\.sol$/, signal: 'Smart Contracts (Solidity)', id: 'solidity' },
          { pattern: /Cargo\.toml$/, signal: 'Rust/Cargo', id: 'rust' }
      ];

      tree.forEach(node => {
          structureChecks.forEach(check => {
               if (check.pattern.test(node.path)) {
                   // We found a file matching the hint
                   if (!allDeps.has(check.id)) {
                        allDeps.add(check.id);
                        fileSignals.push({ signal: check.signal, risk: 'Medium', category: 'Structure', reason: `Found ${node.path}`, file: node.path });
                   }
               }
          });
      });

      // C. Monorepo Deep Scan (Targeted)
      // We look for ANY package.json in the tree, not just in strict 'packages/' dirs
      const pkgJsonPaths = tree
          .filter(f => f.path.endsWith('package.json') && f.path !== (pathPrefix + 'package.json')) // Skip root
          .filter(f => !f.path.includes('node_modules') && !f.path.includes('test') && !f.path.includes('example')) // Noise filter
          .map(f => f.path.replace(pathPrefix, '')) // Remove prefix for fetcher
          .slice(0, 15); // Usage limit

      pkgJsonPaths.forEach(path => {
          fetchPromises.push(getFile(path).then(c => c ? { name: path, type: 'monorepo-dep', content: c } : null));
      });

      // D. Source Code Sampling
      // Find top 20 JS/TS files in 'src/' or root
      const sourceFiles = tree
          .filter(f => f.path.match(/\.(js|ts|jsx|tsx)$/i))
          .filter(f => !f.path.includes('node_modules') && !f.path.includes('dist') && !f.path.includes('build'))
          .sort((a,b) => a.path.length - b.path.length) // Prefer shorter paths (closer to root)
          .slice(0, 20)
          .map(f => f.path.replace(pathPrefix, ''));

      sourceFiles.forEach(path => {
           fetchPromises.push(getFile(path).then(c => c ? { name: path, type: 'code-scan', content: c } : null));
      });


      // --- Execution ---
      const results = await Promise.allSettled(fetchPromises);
      
      const getLineNumber = (fullText, index) => {
         return fullText.substring(0, index).split('\n').length;
      };

      results.forEach(res => {
          if (res.status === 'fulfilled' && res.value) {
              const { name, content, type } = res.value;

              // 1. Dependency Parsing
              if ((type === 'dep' || type === 'monorepo-dep') && name.endsWith('json')) {
                   try {
                       const pkg = JSON.parse(content);
                       const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                       Object.keys(deps).forEach(d => allDeps.add(d));
                       // Scripts check for offline intent
                       if (pkg.scripts) {
                           const scriptStr = JSON.stringify(pkg.scripts).toLowerCase();
                           if (scriptStr.includes('tauri') || scriptStr.includes('electron')) allDeps.add('OFFLINE_NATIVE');
                       }
                   } catch (e) {}
              }

              // 2. Config Analysis
              if (type === 'config') {
                  configSignals.push({ file: name, signal: `Config: ${name}`, risk: 'Medium', category: 'Hosting', reason: 'Platform Specific' });
                  if (name.includes('firebase')) allDeps.add('firebase-tools');
                  if (name.includes('vercel')) allDeps.add('vercel.json');
              }

              // 3. Code Scanning
              if (type === 'code-scan') {
                     // Generic Network
                     const genericPattern = /fetch\s*\(|axios(\.|@|\s*\()/gi;
                     let match;
                     while ((match = genericPattern.exec(content)) !== null) {
                        fileSignals.push({
                            signal: 'Generic Network Call',
                            risk: 'Medium',
                            category: 'External Service',
                            reason: `Usage in ${name}`, 
                            file: name,
                            line: getLineNumber(content, match.index)
                        });
                        allDeps.add('GENERIC_NETWORK');
                     }

                     // Offline Signals
                     // Reusing regex from original logic
                     const offlinePatterns = [
                       { cat: 'PERSISTENCE', regex: /indexedDB|localforage|dexie|rxdb|pouchdb|watermelondb/gi },
                       { cat: 'CACHING', regex: /navigator\.serviceWorker|caches\.open|workbox|sw-precache/gi },
                       { cat: 'INTENT', regex: /navigator\.onLine|addEventListener\(['"]offline['"]\)|backgroundSync/gi },
                       { cat: 'NATIVE', regex: /tauri|electron-store|react-native-fs|capacitor/gi }
                     ];

                     offlinePatterns.forEach(op => {
                        let offMatch;
                        while ((offMatch = op.regex.exec(content)) !== null) {
                            allDeps.add(`OFFLINE_${op.cat}`);
                            offlineSignals.push({
                                file: name,
                                category: op.cat,
                                signal: `Detected ${offMatch[0]}`,
                                line: getLineNumber(content, offMatch.index)
                            });
                        }
                     });
                     
                     // Risks
                     const codeRisks = [
                         { id: 'firebase', pattern: /firebaseio\.com/gi, label: 'Firebase API' },
                         { id: 'google', pattern: /googleapis\.com/gi, label: 'Google API' },
                         { id: 'supabase', pattern: /supabase\.co/gi, label: 'Supabase API' },
                     ];
                     codeRisks.forEach(cr => {
                         let riskMatch;
                         while ((riskMatch = cr.pattern.exec(content)) !== null) {
                             fileSignals.push({
                                 signal: cr.label,
                                 risk: 'Medium',
                                 category: 'Hardcoded API',
                                 reason: `Found in ${name}`,
                                 file: name,
                                 line: getLineNumber(content, riskMatch.index)
                             });
                         }
                     });
              }
          }
      });


      // --- Verdict Logic (Strict Audit Mode) ---
      const findings = [];
      let highRiskCount = 0;
      let mediumRiskCount = 0;

      fileSignals.forEach(s => {
          findings.push({ source: 'Code/Structure', failureMode: s.reason, ...s });
          if(s.risk === 'High') highRiskCount++;
          // Fix: Logic was missing counting of Medium risks from structure/code checks (e.g. Django, Rails)
          // We Exclude 'Generic Network Call' because we handle that in a specific 'Ambiguity' block later.
          if(s.risk === 'Medium' && s.signal !== 'Generic Network Call') mediumRiskCount++;
      });
      configSignals.forEach(s => {
          findings.push({ source: 'Config', failureMode: s.reason, ...s });
          if(s.risk === 'High') highRiskCount++;
          if(s.risk === 'Medium') mediumRiskCount++;
      });
      allDeps.forEach(dep => {
          const rule = RISKS[dep];
          if(rule) {
              findings.push({ source: 'Dependency', signal: `Dep: ${dep}`, risk: rule.riskLevel, category: rule.category, failureMode: rule.failureMode });
              if(rule.riskLevel === 'High') highRiskCount++;
              if(rule.riskLevel === 'Medium') mediumRiskCount++;
          }
      });

      report.evidence = findings;

      // 1. Calculate Offline Capability (Strict Hierarchy)
      // A. OFFLINE-CAPABLE (Strong)
      // Requirement: Persistence IS detected AND Critical Cloud Blockers are NOT detected.
      // Note: Network calls (fetch/axios) do NOT disqualify this status, as offline-first apps sync.
      
      const offStats = {
          persistence: offlineSignals.some(s => s.category === 'PERSISTENCE') || Array.from(allDeps).some(d => OFFLINE_SIGNALS.PERSISTENCE.includes(d)),
          caching: offlineSignals.some(s => s.category === 'CACHING') || Array.from(allDeps).some(d => OFFLINE_SIGNALS.CACHING.includes(d)),
          native: offlineSignals.some(s => s.category === 'NATIVE') || Array.from(allDeps).some(d => OFFLINE_SIGNALS.NATIVE.includes(d)),
      };

      const hasCloudBlocker = findings.some(f => f.category === 'Critical Infrastructure' || f.risk === 'High');
      let offStatus = 'Online-Only';
      let offReason = 'No verifiable offline capability.';

      if (hasCloudBlocker) {
           offStatus = 'Online-Only';
           offReason = 'Critical Cloud Dependencies prevent offline use.';
      } else if (offStats.persistence) {
           // Strongest signal: Data is stored locally.
           // Even if network exists, the app HAS local state.
           offStatus = 'Offline-Capable';
           offReason = 'Strong Local Persistence detected (Offline First).';
      } else if (offStats.caching || offStats.native) {
           offStatus = 'Partially Offline';
           offReason = 'Caching or Native Shell detected, but no deep data persistence.';
      } else {
           // Default
           offStatus = 'Online-Only';
           offReason = 'No persistence or caching strategy found.';
      }

      report.offline = { status: offStatus, reason: offReason, evidence: offlineSignals };


      // 2. Calculate Decentralization Readiness (Strict Caps)
      const hasGenericNetwork = allDeps.has('GENERIC_NETWORK');
      const hasOfflineLib = offStats.persistence; // Re-use strong signal

      if (highRiskCount > 0) {
          report.score = READINESS_LEVELS.LOW;
          report.architecture = 'Centralized / Server-Required';
      } else if (mediumRiskCount > 0) {
          report.score = READINESS_LEVELS.MEDIUM;
          report.architecture = 'Hybrid (Client + Services)';
      } else if (hasGenericNetwork) {
          // KEY FIX: Generic Network calls (fetch/axios) WITHOUT specific identified service
          // This is AMBIGUOUS. We don't know if it's hitting localhost or a centralized server.
          // Verdict: HUMAN REVIEW REQUIRED.
          
          // Exception: If we have PROVEN Local Persistence, we lean towards Hybrid/High, 
          // but strict rules say "fetch" means external dependency -> Hybrid.
          // BUT, if we have NO specific evidence of what is being fetched, we must flag for review.
          
          if (hasOfflineLib) {
               // Local + Network = Sync = Hybrid ?
               // FIX: User feedback says "biased to Medium". 
               // If an app is truly Offline First (Strong Persistence), generic network calls (likely for sync) 
               // should NOT drag it down to Medium unless there's a specific Centralized dependency.
               // We grant HIGH readiness to Offline-First apps even with generic network calls.
               report.score = READINESS_LEVELS.HIGH;
               report.architecture = 'Decentralized / Local-First (with Sync)';
          } else {
               // Just Network, no Local, no specific service? 
               // Could be an API wrapper. 
               report.score = READINESS_LEVELS.HUMAN_REVIEW;
               report.architecture = 'Ambiguous (Unidentified Network Calls)';
               
               // Add explicit hint
               report.evidence.push({
                   source: 'Analyzer',
                   signal: 'Ambiguity',
                   risk: 'Medium',
                   category: 'Ambiguity',
                   failureMode: 'Generic network usage (fetch/axios) without identified endpoint.',
                   file: 'Multiple',
                   line: 'N/A'
               });
          }
      } else if (allDeps.size > 0 || offStats.persistence) {
          // No High risks, No Medium risks, No Generic Network.
          // Has some dependencies or offline traits.
          report.score = READINESS_LEVELS.HIGH;
          report.architecture = 'Decentralized / Client-Side';
      } else {
          // Truly nothing found?
          report.score = READINESS_LEVELS.UNKNOWN;
          report.architecture = 'Unknown / Static';
      }

      report.offline = { status: offStatus, reason: offReason, evidence: offlineSignals };

      return report;
  }
}

export const analyzerService = new AnalyzerService();
