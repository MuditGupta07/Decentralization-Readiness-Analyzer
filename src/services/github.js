/**
 * GitHub API Service
 * Fetches repository content and metadata.
 */

const BASE_URL = 'https://api.github.com/repos';

export class GitHubService {
  constructor(token = null) {
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
      this.headers['Authorization'] = `token ${token}`;
    }
  }

  setToken(token) {
    if (token) {
      this.headers['Authorization'] = `token ${token}`;
    } else {
      delete this.headers['Authorization'];
    }
  }

  /**
   * Parse a GitHub URL to get owner and repo name
   * @param {string} url 
   * @returns {{owner: string, repo: string} | null}
   */
  parseUrl(url) {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    } catch (e) {
      // Fallback for non-URL inputs like "owner/repo"
      const parts = url.split('/').filter(Boolean);
      if (parts.length === 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    }
    return null;
  }

  /**
   * Fetch file content from the repo
   * @param {string} owner 
   * @param {string} repo 
   * @param {string} path 
   */
  async getFileContent(owner, repo, path) {
    try {
      const response = await fetch(`${BASE_URL}/${owner}/${repo}/contents/${path}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        if (response.status === 404) return null; // File not found is expected
        if (response.status === 403 || response.status === 429) throw new Error('GitHub API Rate Limit Exceeded. Try again later or use a different IP.');
        throw new Error(`GitHub API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // GitHub API returns content in base64
      if (data.encoding === 'base64' && data.content) {
        // Handle unicode strings correctly
        const decoded = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
        return decoded;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      return null;
    }
  }

  /**
   * Fetch directory contents to check for file existence
   * @param {string} owner 
   * @param {string} repo 
   * @param {string} path 
   */
  async getDirContents(owner, repo, path = '') {
    const response = await fetch(`${BASE_URL}/${owner}/${repo}/contents/${path}`, {
      headers: this.headers
    });
    if (!response.ok) {
        if (response.status === 403 || response.status === 429) throw new Error('GitHub API Rate Limit Exceeded. Please add a Token.');
        return null;
    }
    return await response.json();
  }

  /**
   * Fetch Repository Metadata (stars, description, etc.)
   */
  async getRepoDetails(owner, repo) {
    const response = await fetch(`${BASE_URL}/${owner}/${repo}`, {
      headers: this.headers
    });
    if (!response.ok) {
        if (response.status === 403 || response.status === 429) throw new Error('GitHub API Rate Limit Exceeded. Please add a Token.');
        throw new Error('Repo not found');
    }
    return await response.json();
  }
}

export const githubService = new GitHubService();
