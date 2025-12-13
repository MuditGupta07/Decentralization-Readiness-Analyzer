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
      const [repoInfo, rootFiles] = await Promise.all([
        githubService.getRepoDetails(repoPath.owner, repoPath.repo),
        githubService.getDirContents(repoPath.owner, repoPath.repo),
      ]);

      if (!repoInfo) throw new Error('Repository not found or private.');
      report.repoInfo = repoInfo;

      // 3. Evidence Gathering (Files & Dependencies)
      let allDeps = new Set();
      let fileSignals = [];

      let packageJsonPromise = Promise.resolve(null);
      let requirementsPromise = Promise.resolve(null);
      let composerJsonPromise = Promise.resolve(null);

      // --- Structure Analysis ---
      if (rootFiles && Array.isArray(rootFiles)) {
        const fileNames = rootFiles.map(f => f.name);

        // JavaScript / Node
        if (fileNames.includes('package.json')) {
          packageJsonPromise = githubService.getFileContent(repoPath.owner, repoPath.repo, 'package.json');
        }

        // Python
        if (fileNames.includes('requirements.txt')) {
          requirementsPromise = githubService.getFileContent(repoPath.owner, repoPath.repo, 'requirements.txt');
        }
        if (fileNames.includes('manage.py')) {
           allDeps.add('django'); // Auto-flag
           fileSignals.push('Found `manage.py` indicating centralized Django server.');
        }

        // PHP
        if (fileNames.includes('composer.json')) {
          composerJsonPromise = githubService.getFileContent(repoPath.owner, repoPath.repo, 'composer.json');
        }
        // WordPress
        if (fileNames.includes('wp-admin') || fileNames.includes('wp-config-sample.php')) {
          allDeps.add('wordpress-core');
          fileSignals.push('Found `wp-admin` structure indicating monolithic WordPress server.');
        }
      }

      // --- Fetch Content ---
      const [packageJsonStr, requirementsTxt, composerJsonStr] = await Promise.all([
        packageJsonPromise, requirementsPromise, composerJsonPromise
      ]);

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

      // Add file signals first
      fileSignals.forEach(sig => {
         findings.push({
           source: 'File Structure',
           signal: sig,
           risk: 'High',
           category: 'Traditional Server',
           failureMode: 'Single Point of Failure (Server).'
         });
         highRiskCount++;
      });

      // Check Deps
      allDeps.forEach(dep => {
        const rule = RISKS[dep];
        if (rule) {
          findings.push({
            source: 'Dependency Scan',
            signal: `Found dependency: ${dep}`,
            risk: rule.riskLevel,
            category: rule.category,
            failureMode: rule.failureMode
          });
          if (rule.riskLevel === 'High') highRiskCount++;
          if (rule.riskLevel === 'Medium') mediumRiskCount++;
        }
      });

      report.evidence = findings;

      // 5. Hardened Verdict Logic
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
        // No deps found or empty repo -> Unknown, don't guess
        report.score = READINESS_LEVELS.UNKNOWN;
        report.architecture = 'Unknown / Static';
      }

      // 6. Strict Offline Check
      const hasPWA = allDeps.has('vite-plugin-pwa') || allDeps.has('workbox-webpack-plugin') || allDeps.has('@angular/service-worker');
      const hasCloudDB = findings.some(f => f.category === 'Critical Infrastructure');

      if (hasCloudDB) {
        report.offline = { status: 'Online-Only', reason: 'Critical Cloud Dependencies detected (DB/Auth).' };
      } else if (hasPWA) {
        report.offline = { status: 'Offline-Capable', reason: 'PWA / Service Worker library detected.' };
      } else {
        report.offline = { status: 'Online-Only', reason: 'No explicit offline/caching libraries found.' };
      }

      return report;

    } catch (error) {
       console.error(error);
       throw error;
    }
  }
}

export const analyzerService = new AnalyzerService();
