const BASE_API_URL = 'https://api.github.com/repos';
const RAW_BASE_URL = 'https://raw.githubusercontent.com';

class GitHubService {
  constructor() {
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
    };
  }

  // Parse "user/repo" from various URL formats
  parseUrl(url) {
    try {
      if (!url) return null;
      const cleanUrl = url.trim();
      // Handle "https://github.com/owner/repo"
      const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) return { owner: match[1], repo: match[2].replace('.git', '') };
      
      // Handle "owner/repo"
      const parts = cleanUrl.split('/');
      if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
      
      return null;
    } catch (e) {
      return null;
    }
  }

  // 1. Metadata Fetch (Uses API Quota)
  async getRepoDetails(owner, repo) {
    try {
      const response = await fetch(`${BASE_API_URL}/${owner}/${repo}`, {
        headers: this.headers
      });

      if (response.status === 403 || response.status === 429) {
         // Return a special flag for rate limiting
         console.warn('GitHub API Rate Limit Hit. Proceeding with limited analysis.');
         return { rateLimited: true, full_name: `${owner}/${repo}`, default_branch: 'master' }; 
      }

      if (!response.ok) throw new Error('Repo not found');
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  // 2. Directory Listing (Uses API Quota)
  // Returns null if rate limited or empty
  async getDirContents(owner, repo) {
    try {
      const response = await fetch(`${BASE_API_URL}/${owner}/${repo}/contents`, {
        headers: this.headers
      });
      
      if (response.status === 403 || response.status === 429) {
          return null; // Signal to use blind scan
      }

      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  // 3. Raw File Fetch (Zero API Quota)
  // Fetches directly from raw.githubusercontent.com
  async getRawFile(owner, repo, path, branch = 'HEAD') {
    try {
        // Optimization: If a specific branch is provided (not HEAD), try ONLY that branch first.
        // This prevents 404 console spam from checking 'main'/'master' blindly when we already know the correct branch.
        if (branch && branch !== 'HEAD') {
             const res = await fetch(`${RAW_BASE_URL}/${owner}/${repo}/${branch}/${path}`);
             if (res.ok) {
                 return await res.text();
             }
             // If specific branch failed, real 404. Don't fallback to main/master unless we really suspect it's wrong.
             // Given analyzer passes repoInfo.default_branch, we trust it.
             return null;
        }

        // Fallback Strategy (only for HEAD or undefined)
        const branches = ['main', 'master'];
        for (const b of branches) {
            const res = await fetch(`${RAW_BASE_URL}/${owner}/${repo}/${b}/${path}`);
            if (res.ok) {
                return await res.text();
            }
        }
        return null;
    } catch (error) {
        // Suppress console error for 404s to keep logs clean
        // console.error(`Error fetching raw ${path}:`, error);
        return null;
    }
  }
  async getAbsoluteRaw(url) {
      if (!url) return null;
      try {
          const res = await fetch(url);
          if (res.ok) return await res.text();
          return null;
      } catch (e) {
          return null;
      }
  }
}

export const githubService = new GitHubService();
