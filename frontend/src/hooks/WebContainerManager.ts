// // hooks/WebContainerManager.ts
// import { WebContainer } from '@webcontainer/api';
// import { FileItem } from '../types';

// export class WebContainerManager {
//   private static instance: WebContainerManager;
//   private webContainer: WebContainer | null = null;
//   private isBooting: boolean = false;
//   private bootPromise: Promise<WebContainer> | null = null;
//   private listeners: Set<(webContainer: WebContainer) => void> = new Set();

//   private constructor() {}

//   static getInstance(): WebContainerManager {
//     if (!WebContainerManager.instance) {
//       WebContainerManager.instance = new WebContainerManager();
//     }
//     return WebContainerManager.instance;
//   }

//   async getWebContainer(): Promise<WebContainer> {
//     if (this.webContainer) {
//       return this.webContainer;
//     }

//     if (this.isBooting && this.bootPromise) {
//       return this.bootPromise;
//     }

//     this.isBooting = true;
//     this.bootPromise = this.bootWebContainer();

//     try {
//       this.webContainer = await this.bootPromise;
//       this.isBooting = false;
      
//       // Notify all listeners
//       this.listeners.forEach(listener => listener(this.webContainer!));
      
//       return this.webContainer;
//     } catch (error) {
//       this.isBooting = false;
//       this.bootPromise = null;
//       throw error;
//     }
//   }

//   private async bootWebContainer(): Promise<WebContainer> {
//     console.log('Booting WebContainer...');
//     const webContainer = await WebContainer.boot();
//     console.log('WebContainer booted successfully');
//     return webContainer;
//   }

//   onWebContainerReady(callback: (webContainer: WebContainer) => void) {
//     if (this.webContainer) {
//       callback(this.webContainer);
//     } else {
//       this.listeners.add(callback);
//     }
//   }

//   offWebContainerReady(callback: (webContainer: WebContainer) => void) {
//     this.listeners.delete(callback);
//   }

//   async mountFiles(files: FileItem[]): Promise<void> {
//     const webContainer = await this.getWebContainer();
//     const mountStructure = this.createMountStructure(files);
    
//     console.log('Mounting files structure:', mountStructure);
//     await webContainer.mount(mountStructure);
//     console.log('Files mounted successfully');
//   }

//   private createMountStructure(files: FileItem[]): Record<string, any> {
//     const mountStructure: Record<string, any> = {};

//     // Define the return type for the mount structure items
//     type MountItem = {
//       directory: Record<string, MountItem>;
//     } | {
//       file: {
//         contents: string;
//       };
//     };

//     const processFile = (file: FileItem, isRootFolder: boolean): MountItem | undefined => {
//       if (file.type === 'folder') {
//         const children: Record<string, MountItem> = file.children ? 
//           Object.fromEntries(
//             file.children
//               .map(child => {
//                 const processed = processFile(child, false);
//                 return processed ? [child.name, processed] : null;
//               })
//               .filter((entry): entry is [string, MountItem] => entry !== null)
//           ) : {};
        
//         const folderStructure: MountItem = {
//           directory: children
//         };
        
//         if (isRootFolder) {
//           mountStructure[file.name] = folderStructure;
//           return folderStructure;
//         } else {
//           return folderStructure;
//         }
//       } else if (file.type === 'file') {
//         const fileContent: MountItem = {
//           file: {
//             contents: file.content || ''
//           }
//         };
        
//         if (isRootFolder) {
//           mountStructure[file.name] = fileContent;
//           return fileContent;
//         } else {
//           return fileContent;
//         }
//       }

//       return undefined;
//     };

//     files.forEach(file => processFile(file, true));
//     return mountStructure;
//   }

//   async executeCommand(
//     command: string, 
//     args: string[] = [], 
//     options: { cwd?: string } = {}
//   ): Promise<{
//     process: any;
//     output: string[];
//     exitCode: Promise<number>;
//   }> {
//     const webContainer = await this.getWebContainer();
//     const output: string[] = [];

//     console.log(`Executing command: ${command} ${args.join(' ')} in ${options.cwd || '/'}`);

//     const process = await webContainer.spawn(command, args, {
//       cwd: options.cwd || '/'
//     });

//     // Capture output
//     process.output.pipeTo(new WritableStream({
//       write(data) {
//         const text = data.toString();
//         if (text.trim()) {
//           output.push(text);
//         }
//       }
//     }));

//     return {
//       process,
//       output,
//       exitCode: process.exit
//     };
//   }

//   async checkDirectoryExists(path: string): Promise<boolean> {
//     try {
//       const webContainer = await this.getWebContainer();
//       const process = await webContainer.spawn('test', ['-d', path]);
//       const exitCode = await process.exit;
//       return exitCode === 0;
//     } catch {
//       return false;
//     }
//   }

//   async getCurrentWorkingDirectory(): Promise<string> {
//     try {
//       const webContainer = await this.getWebContainer();
//       const process = await webContainer.spawn('pwd', []);
      
//       let cwd = '/';
//       process.output.pipeTo(new WritableStream({
//         write(data) {
//           cwd = data.toString().trim();
//         }
//       }));
      
//       await process.exit;
//       return cwd;
//     } catch {
//       return '/';
//     }
//   }

//   async listDirectory(path: string = '.'): Promise<string[]> {
//     try {
//       const webContainer = await this.getWebContainer();
//       const process = await webContainer.spawn('ls', ['-la', path]);
      
//       const output: string[] = [];
//       process.output.pipeTo(new WritableStream({
//         write(data) {
//           const lines = data.toString().split('\n').filter(line => line.trim());
//           output.push(...lines);
//         }
//       }));
      
//       await process.exit;
//       return output;
//     } catch (error) {
//       console.error('Error listing directory:', error);
//       return [];
//     }
//   }

//   // Start development server if not already running
//   private devServerProcess: any = null;
//   private devServerUrl: string | null = null;

//   async startDevServer(): Promise<string | null> {
//     if (this.devServerUrl && this.devServerProcess) {
//       return this.devServerUrl;
//     }

//     try {
//       const webContainer = await this.getWebContainer();
      
//       // First install dependencies if package.json exists
//       try {
//         await webContainer.spawn('npm', ['install']);
//         console.log('Dependencies installed');
//       } catch (error) {
//         console.warn('Could not install dependencies:', error);
//       }

//       // Start dev server
//       this.devServerProcess = await webContainer.spawn('npm', ['run', 'dev']);
      
//       // Listen for server ready event
//       return new Promise((resolve) => {
//         webContainer.on('server-ready', (port, url) => {
//           console.log('Dev server ready at:', url);
//           this.devServerUrl = url;
//           resolve(url);
//         });

//         // Timeout after 30 seconds
//         setTimeout(() => {
//           if (!this.devServerUrl) {
//             console.warn('Dev server startup timeout');
//             resolve(null);
//           }
//         }, 30000);
//       });
//     } catch (error) {
//       console.error('Error starting dev server:', error);
//       return null;
//     }
//   }

//   getDevServerUrl(): string | null {
//     return this.devServerUrl;
//   }
// }

// hooks/WebContainerManager.ts
import { WebContainer } from '@webcontainer/api';
import { FileItem } from '../types';

export class WebContainerManager {
  private static instance: WebContainerManager;
  private webContainer: WebContainer | null = null;
  private isBooting: boolean = false;
  private bootPromise: Promise<WebContainer> | null = null;
  private listeners: Set<(webContainer: WebContainer) => void> = new Set();

  private constructor() {}

  static getInstance(): WebContainerManager {
    if (!WebContainerManager.instance) {
      WebContainerManager.instance = new WebContainerManager();
    }
    return WebContainerManager.instance;
  }

  async getWebContainer(): Promise<WebContainer> {
    if (this.webContainer) {
      return this.webContainer;
    }

    if (this.isBooting && this.bootPromise) {
      return this.bootPromise;
    }

    this.isBooting = true;
    this.bootPromise = this.bootWebContainer();

    try {
      this.webContainer = await this.bootPromise;
      this.isBooting = false;
      
      // Notify all listeners
      this.listeners.forEach(listener => listener(this.webContainer!));
      
      return this.webContainer;
    } catch (error) {
      this.isBooting = false;
      this.bootPromise = null;
      throw error;
    }
  }

  private async bootWebContainer(): Promise<WebContainer> {
    console.log('Booting WebContainer...');
    const webContainer = await WebContainer.boot();
    console.log('WebContainer booted successfully');
    return webContainer;
  }

  onWebContainerReady(callback: (webContainer: WebContainer) => void) {
    if (this.webContainer) {
      callback(this.webContainer);
    } else {
      this.listeners.add(callback);
    }
  }

  offWebContainerReady(callback: (webContainer: WebContainer) => void) {
    this.listeners.delete(callback);
  }

  async mountFiles(files: FileItem[]): Promise<void> {
    const webContainer = await this.getWebContainer();
    const mountStructure = this.createMountStructure(files);
    
    console.log('Mounting files structure:', mountStructure);
    await webContainer.mount(mountStructure);
    console.log('Files mounted successfully');
  }

  private createMountStructure(files: FileItem[]): Record<string, any> {
    const mountStructure: Record<string, any> = {};

    // Define the return type for the mount structure items
    type MountItem = {
      directory: Record<string, MountItem>;
    } | {
      file: {
        contents: string;
      };
    };

    const processFile = (file: FileItem, isRootFolder: boolean): MountItem | undefined => {
      if (file.type === 'folder') {
        const children: Record<string, MountItem> = file.children ? 
          Object.fromEntries(
            file.children
              .map(child => {
                const processed = processFile(child, false);
                return processed ? [child.name, processed] : null;
              })
              .filter((entry): entry is [string, MountItem] => entry !== null)
          ) : {};
        
        const folderStructure: MountItem = {
          directory: children
        };
        
        if (isRootFolder) {
          mountStructure[file.name] = folderStructure;
          return folderStructure;
        } else {
          return folderStructure;
        }
      } else if (file.type === 'file') {
        const fileContent: MountItem = {
          file: {
            contents: file.content || ''
          }
        };
        
        if (isRootFolder) {
          mountStructure[file.name] = fileContent;
          return fileContent;
        } else {
          return fileContent;
        }
      }

      return undefined;
    };

    files.forEach(file => processFile(file, true));
    return mountStructure;
  }

  async executeCommand(
    command: string, 
    args: string[] = [], 
    options: { cwd?: string } = {}
  ): Promise<{
    process: any;
    exitCode: Promise<number>;
  }> {
    const webContainer = await this.getWebContainer();
    const workingDir = options.cwd || '/';

    console.log(`Executing command: ${command} ${args.join(' ')} in ${workingDir}`);

    try {
      const process = await webContainer.spawn(command, args, {
        cwd: workingDir
      });

      return {
        process,
        exitCode: process.exit
      };
    } catch (error) {
      console.error('Command spawn error:', error);
      throw error; // Re-throw the original error
    }
  }

  // Simplified directory check using ls
  async checkDirectoryExists(path: string): Promise<boolean> {
    try {
      const webContainer = await this.getWebContainer();
      console.log(`Checking if directory exists: ${path}`);
      
      // Use ls to check if directory exists
      const process = await webContainer.spawn('ls', ['-d', path]);
      const exitCode = await process.exit;
      
      console.log(`Directory check result for ${path}: ${exitCode === 0 ? 'exists' : 'does not exist'}`);
      return exitCode === 0;
    } catch (error) {
      console.error(`Error checking directory ${path}:`, error);
      return false;
    }
  }

  // Start development server if not already running
  private devServerProcess: any = null;
  private devServerUrl: string | null = null;

  async startDevServer(): Promise<string | null> {
    if (this.devServerUrl && this.devServerProcess) {
      return this.devServerUrl;
    }

    try {
      const webContainer = await this.getWebContainer();
      
      // First install dependencies if package.json exists
      try {
        const installProcess = await webContainer.spawn('npm', ['install']);
        await installProcess.exit;
        console.log('Dependencies installed');
      } catch (error) {
        console.warn('Could not install dependencies:', error);
      }

      // Start dev server
      this.devServerProcess = await webContainer.spawn('npm', ['run', 'dev']);
      
      // Listen for server ready event
      return new Promise((resolve) => {
        webContainer.on('server-ready', (port, url) => {
          console.log('Dev server ready at:', url);
          this.devServerUrl = url;
          resolve(url);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (!this.devServerUrl) {
            console.warn('Dev server startup timeout');
            resolve(null);
          }
        }, 30000);
      });
    } catch (error) {
      console.error('Error starting dev server:', error);
      return null;
    }
  }

  getDevServerUrl(): string | null {
    return this.devServerUrl;
  }
}