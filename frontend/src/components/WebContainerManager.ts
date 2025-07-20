// WebContainerManager.ts
import { WebContainer } from '@webcontainer/api';

export class WebContainerManager {
  private static instance: WebContainer | null = null;
  private static isBootstrapping = false;
  private static bootPromise: Promise<WebContainer> | null = null;

  // Check if the environment supports WebContainer
  static isSupported(): boolean {
    try {
      // Check for SharedArrayBuffer support
      if (typeof SharedArrayBuffer === 'undefined') {
        console.warn('SharedArrayBuffer is not available. WebContainer will not work.');
        return false;
      }

      // Check for cross-origin isolation
      if (!crossOriginIsolated) {
        console.warn('Cross-origin isolation is not enabled. WebContainer may not work properly.');
        return false;
      }

      // Check for required APIs
      if (!('Worker' in window) || !('MessageChannel' in window)) {
        console.warn('Required Web APIs are not available.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking WebContainer support:', error);
      return false;
    }
  }

  static async getInstance(): Promise<WebContainer | null> {
    if (!this.isSupported()) {
      return null;
    }

    if (this.instance) {
      return this.instance;
    }

    if (this.isBootstrapping && this.bootPromise) {
      return this.bootPromise;
    }

    this.isBootstrapping = true;
    this.bootPromise = this.createInstance();

    try {
      this.instance = await this.bootPromise;
      return this.instance;
    } catch (error) {
      console.error('Failed to create WebContainer instance:', error);
      this.instance = null;
      return null;
    } finally {
      this.isBootstrapping = false;
      this.bootPromise = null;
    }
  }

  private static async createInstance(): Promise<WebContainer> {
    try {
      console.log('Booting WebContainer...');
      
      const webContainer = await WebContainer.boot({
        // Add configuration to handle cross-origin issues
        coep: 'credentialless' as any,
        // Reduce memory usage
        workdirName: 'project',
      });

      console.log('WebContainer booted successfully');
      return webContainer;
    } catch (error) {
      console.error('WebContainer boot failed:', error);
      throw new Error(`Failed to boot WebContainer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async teardown(): Promise<void> {
    if (this.instance) {
      try {
        await this.instance.teardown();
        console.log('WebContainer torn down successfully');
      } catch (error) {
        console.error('Error during WebContainer teardown:', error);
      }
      this.instance = null;
    }
  }
}
