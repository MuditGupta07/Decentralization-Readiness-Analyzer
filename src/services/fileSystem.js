/**
 * File System Service (Offline Provider)
 * Implements DataProvider interface for local File System Access API.
 */

export class FileSystemService {
  constructor(dirHandle) {
    this.dirHandle = dirHandle;
    this.name = dirHandle.name;
  }

  /**
   * Returns project metadata (similar to repo details)
   */
  async getProjectDetails() {
    return {
      full_name: `[LOCAL] ${this.name}`,
      default_branch: 'local-disk',
      isLocal: true
    };
  }

  /**
   * Get raw content of a file given a relative path.
   * Path format: "src/components/App.jsx"
   */
  async getFileContent(path) {
    try {
      const parts = path.split('/');
      let currentHandle = this.dirHandle;

      // Navigate down to the folder
      for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create: false });
      }

      // Get file handle
      const fileHandle = await currentHandle.getFileHandle(parts[parts.length - 1], { create: false });
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (e) {
      // console.warn(`Local file not found: ${path}`, e);
      return null;
    }
  }

  /**
   * Get contents of a directory.
   * Returns array of { name, type: 'file' | 'dir' }
   */
  async getDirContents(path) {
    try {
      let targetHandle = this.dirHandle;

      // Navigate if path is provided and not root
      if (path && path !== '' && path !== '.') {
          const parts = path.split('/');
          for (const part of parts) {
              targetHandle = await targetHandle.getDirectoryHandle(part, { create: false });
          }
      }

      const contents = [];
      for await (const entry of targetHandle.values()) {
        contents.push({
          name: entry.name,
          type: entry.kind === 'directory' ? 'dir' : 'file',
          // We don't have download_url for local, but we don't need it if analyzer uses getFileContent(path)
        });
      }
      return contents;
    } catch (e) {
      // console.warn(`Local dir not found: ${path}`, e);
      return [];
    }
  }

  /**
   * Recusively scan local folder to build a full file tree.
   * Matches GitHub Tree API format.
   */
  async getTree() {
      const files = [];
      
      const scan = async (dirHandle, pathPrefix = '') => {
          for await (const entry of dirHandle.values()) {
              const fullPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;
              
              if (entry.kind === 'file') {
                  files.push({
                      path: fullPath,
                      type: 'file'
                  });
              } else if (entry.kind === 'directory') {
                  // Skip typically huge/irrelevant folders to speed up local scan
                  if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
                  
                  files.push({
                      path: fullPath,
                      type: 'dir'
                  });
                  await scan(await dirHandle.getDirectoryHandle(entry.name), fullPath);
              }
          }
      };

      try {
          await scan(this.dirHandle);
          return files;
      } catch (e) {
          console.error("Local Tree Scan failed:", e);
          return [];
      }
  }

  /**
   * No-op for absolute URLs in offline mode (safety)
   */
  async getAbsoluteRaw(url) {
    return null; 
  }
}
