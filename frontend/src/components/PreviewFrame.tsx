//PreviewFrame.tsx
import { WebContainer } from '@webcontainer/api';
import { useEffect, useState, useRef } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

// Global state to track initialization per WebContainer instance
const initializedContainers = new WeakMap<WebContainer, {
  isInitialized: boolean;
  url: string;
  devServerProcess: any;
}>();

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Initializing...");

  async function initializeProject() {
    const containerState = initializedContainers.get(webContainer);
    
    // If already initialized, just use the existing URL
    if (containerState?.isInitialized) {
      setUrl(containerState.url);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setLoadingStep("Installing dependencies...");
      
      // Install dependencies
      const installProcess = await webContainer.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(new WritableStream({
        // write(data) {
        //   console.log('Install:', data);
        // }
      }));

      // Wait for install to complete
      const installExitCode = await installProcess.exit;
      if (installExitCode !== 0) {
        throw new Error('npm install failed');
      }

      setLoadingStep("Starting development server...");
      
      // Start dev server
      const devServerProcess = await webContainer.spawn('npm', ['run', 'dev']);
      
      // Handle server output
      devServerProcess.output.pipeTo(new WritableStream({
        // write(data) {
        //   console.log('Dev server:', data);
        // }
      }));

      // Wait for server-ready event
      webContainer.on('server-ready', (port, serverUrl) => {
        console.log('Server ready:', serverUrl, 'Port:', port);
        
        // Store the state globally
        initializedContainers.set(webContainer, {
          isInitialized: true,
          url: serverUrl,
          devServerProcess: devServerProcess
        });
        
        setUrl(serverUrl);
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error initializing project:', error);
      setLoadingStep("Error starting preview");
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!webContainer) return;
    
    const containerState = initializedContainers.get(webContainer);
    
    if (containerState?.isInitialized) {
      // Already initialized, just set the URL
      setUrl(containerState.url);
      setIsLoading(false);
    } else {
      // Not initialized yet, start the process
      initializeProject();
    }
    
    // No cleanup needed here since we want to keep the server running
    // The server will be cleaned up when the WebContainer itself is destroyed
  }, [webContainer]);

  const retryInitialization = () => {
    // Clear the stored state and retry
    initializedContainers.delete(webContainer);
    setUrl("");
    setIsLoading(true);
    setLoadingStep("Retrying...");
    initializeProject();
  };

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {isLoading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="mb-2">{loadingStep}</p>
          <p className="text-sm text-gray-500">This may take a few moments...</p>
        </div>
      )}
      {!isLoading && url && (
        <iframe 
          width="100%" 
          height="100%" 
          src={url}
          className="border-0"
          onLoad={() => console.log('Preview loaded')}
        />
      )}
      {!isLoading && !url && (
        <div className="text-center text-red-400">
          <p>Failed to start preview</p>
          <button 
            onClick={retryInitialization}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}