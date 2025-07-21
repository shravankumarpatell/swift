// //PreviewFrame.tsx
// import { WebContainer } from '@webcontainer/api';
// import { useEffect, useState, useRef } from 'react';

// interface PreviewFrameProps {
//   files: any[];
//   webContainer: WebContainer;
// }

// // Global state to track initialization per WebContainer instance
// const initializedContainers = new WeakMap<WebContainer, {
//   isInitialized: boolean;
//   url: string;
//   devServerProcess: any;
// }>();

// export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
//   const [url, setUrl] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [loadingStep, setLoadingStep] = useState("Initializing...");

//   async function initializeProject() {
//     const containerState = initializedContainers.get(webContainer);
    
//     // If already initialized, just use the existing URL
//     if (containerState?.isInitialized) {
//       setUrl(containerState.url);
//       setIsLoading(false);
//       return;
//     }
    
//     try {
//       setIsLoading(true);
//       setLoadingStep("Installing dependencies...");
      
//       // Install dependencies
//       const installProcess = await webContainer.spawn('npm', ['install']);
      
//       installProcess.output.pipeTo(new WritableStream({
//         // write(data) {
//         //   console.log('Install:', data);
//         // }
//       }));

//       // Wait for install to complete
//       const installExitCode = await installProcess.exit;
//       if (installExitCode !== 0) {
//         throw new Error('npm install failed');
//       }

//       setLoadingStep("Starting development server...");
      
//       // Start dev server
//       const devServerProcess = await webContainer.spawn('npm', ['run', 'dev']);
      
//       // Handle server output
//       devServerProcess.output.pipeTo(new WritableStream({
//         // write(data) {
//         //   console.log('Dev server:', data);
//         // }
//       }));

//       // Wait for server-ready event
//       webContainer.on('server-ready', (port, serverUrl) => {
//         console.log('Server ready:', serverUrl, 'Port:', port);
        
//         // Store the state globally
//         initializedContainers.set(webContainer, {
//           isInitialized: true,
//           url: serverUrl,
//           devServerProcess: devServerProcess
//         });
        
//         setUrl(serverUrl);
//         setIsLoading(false);
//       });

//     } catch (error) {
//       console.error('Error initializing project:', error);
//       setLoadingStep("Error starting preview");
//       setIsLoading(false);
//     }
//   }

//   useEffect(() => {
//     if (!webContainer) return;
    
//     const containerState = initializedContainers.get(webContainer);
    
//     if (containerState?.isInitialized) {
//       // Already initialized, just set the URL
//       setUrl(containerState.url);
//       setIsLoading(false);
//     } else {
//       // Not initialized yet, start the process
//       initializeProject();
//     }
    
//     // No cleanup needed here since we want to keep the server running
//     // The server will be cleaned up when the WebContainer itself is destroyed
//   }, [webContainer]);

//   const retryInitialization = () => {
//     // Clear the stored state and retry
//     initializedContainers.delete(webContainer);
//     setUrl("");
//     setIsLoading(true);
//     setLoadingStep("Retrying...");
//     initializeProject();
//   };

//   return (
//     <div className="h-full flex items-center justify-center text-gray-400">
//       {isLoading && (
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <p className="mb-2">{loadingStep}</p>
//           <p className="text-sm text-gray-500">This may take a few moments...</p>
//         </div>
//       )}
//       {!isLoading && url && (
//         <iframe 
//           width="100%" 
//           height="100%" 
//           src={url}
//           className="border-0"
//           onLoad={() => console.log('Preview loaded')}
//         />
//       )}
//       {!isLoading && !url && (
//         <div className="text-center text-red-400">
//           <p>Failed to start preview</p>
//           <button 
//             onClick={retryInitialization}
//             className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             Retry
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }


// PreviewFrame.tsx - Enhanced version with better error handling
import { WebContainer } from '@webcontainer/api';
import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer | null;
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
  const [error, setError] = useState<string | null>(null);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Check if WebContainer is available and properly initialized
  const checkWebContainerSupport = () => {
    if (!webContainer) {
      return { supported: false, reason: 'WebContainer instance not available' };
    }

    if (!crossOriginIsolated) {
      return { supported: false, reason: 'Page is not cross-origin isolated' };
    }

    if (typeof SharedArrayBuffer === 'undefined') {
      return { supported: false, reason: 'SharedArrayBuffer not available' };
    }

    return { supported: true, reason: null };
  };

  async function initializeProject() {
    const supportCheck = checkWebContainerSupport();
    
    if (!supportCheck.supported) {
      setError(supportCheck.reason || 'WebContainer not supported');
      setIsLoading(false);
      return;
    }

    const containerState = initializedContainers.get(webContainer!);
    
    // If already initialized, just use the existing URL
    if (containerState?.isInitialized) {
      setUrl(containerState.url);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setInstallLogs([]);
      setLoadingStep("Installing dependencies...");
      
      console.log('🚀 Starting project initialization...');
      
      // Check if package.json exists
      const hasPackageJson = files.some(file => file.name === 'package.json' && file.content);
      if (!hasPackageJson) {
        throw new Error('No package.json found in project files');
      }
      
      // Install dependencies with detailed logging
      console.log('📦 Running npm install...');
      const installProcess = await webContainer!.spawn('npm', ['install'], {
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      });
      
      // Capture install output
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          const output = data.toString();
          console.log('Install output:', output);
          setInstallLogs(prev => [...prev, output]);
        }
      }));

      // Wait for install to complete with timeout
      const installExitCode = await Promise.race([
        installProcess.exit,
        new Promise<number>((_, reject) => 
          setTimeout(() => reject(new Error('npm install timeout after 3 minutes')), 180000)
        )
      ]);

      if (installExitCode !== 0) {
        throw new Error(`npm install failed with exit code ${installExitCode}`);
      }

      console.log('✅ npm install completed successfully');
      setLoadingStep("Starting development server...");
      
      // Check available scripts
      let devCommand = ['run', 'dev'];
      try {
        const startProcess = await webContainer!.spawn('npm', ['run', 'start'], { cwd: '/' });
        devCommand = ['run', 'start'];
      } catch {
        // Fallback to 'dev' if 'start' doesn't exist
      }
      
      // Start dev server
      console.log(`🔥 Starting dev server with: npm ${devCommand.join(' ')}`);
      const devServerProcess = await webContainer!.spawn('npm', devCommand);
      
      // Handle server output
      devServerProcess.output.pipeTo(new WritableStream({
        write(data) {
          const output = data.toString();
          console.log('Dev server output:', output);
          
          // Look for common dev server ready patterns
          if (output.includes('localhost') || output.includes('127.0.0.1') || 
              output.includes('ready') || output.includes('Local:')) {
            console.log('🎯 Dev server appears to be ready');
          }
        }
      }));

      // Set up server-ready listener with timeout
      const serverReadyPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Dev server startup timeout'));
        }, 120000); // 2 minutes timeout

        webContainer!.on('server-ready', (port, serverUrl) => {
          clearTimeout(timeout);
          console.log('🌐 Server ready:', serverUrl, 'Port:', port);
          resolve(serverUrl);
        });
      });

      try {
        const serverUrl = await serverReadyPromise;
        
        // Store the state globally
        initializedContainers.set(webContainer!, {
          isInitialized: true,
          url: serverUrl,
          devServerProcess: devServerProcess
        });
        
        setUrl(serverUrl);
        setIsLoading(false);
        console.log('🎉 Project initialized successfully!');
        
      } catch (timeoutError) {
        console.warn('⚠️ Server ready timeout - this might be normal for some projects');
        
        // For now, show an error with retry option instead of trying to guess URLs
        // The server-ready event is the reliable way to get the correct URL
        throw new Error(
          'Dev server started but did not emit server-ready event within timeout. ' +
          'This could mean: 1) Server takes longer to start, 2) Server uses a different port setup, ' +
          'or 3) Project configuration issue. Try refreshing or check the project setup.'
        );
      }

    } catch (error) {
      console.error('❌ Error initializing project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setLoadingStep("Error occurred");
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!webContainer) {
      setError('WebContainer not available');
      setIsLoading(false);
      return;
    }
    
    const containerState = initializedContainers.get(webContainer);
    
    if (containerState?.isInitialized) {
      // Already initialized, just set the URL
      setUrl(containerState.url);
      setIsLoading(false);
    } else {
      // Not initialized yet, start the process
      initializeProject();
    }
  }, [webContainer]);

  const retryInitialization = () => {
    if (webContainer) {
      // Clear the stored state and retry
      initializedContainers.delete(webContainer);
    }
    setUrl("");
    setError(null);
    setIsLoading(true);
    setLoadingStep("Retrying...");
    setInstallLogs([]);
    initializeProject();
  };

  // Show support check results
  if (!webContainer) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-slate-200 mb-4">
            WebContainer Not Available
          </h3>
          <div className="text-slate-400 space-y-3">
            <p>WebContainer failed to initialize. This could be due to:</p>
            <ul className="text-left space-y-1 text-sm">
              <li>• Missing cross-origin isolation headers</li>
              <li>• SharedArrayBuffer not available</li>
              <li>• Browser compatibility issues</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const supportCheck = checkWebContainerSupport();
  if (!supportCheck.supported) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-slate-200 mb-4">
            Environment Not Supported
          </h3>
          <div className="text-slate-400 space-y-3">
            <p className="font-medium text-red-300">{supportCheck.reason}</p>
            <div className="text-sm bg-slate-800/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-slate-300">Debug Info:</p>
              <ul className="text-left space-y-1">
                <li>Cross-origin isolated: {crossOriginIsolated ? '✅' : '❌'}</li>
                <li>SharedArrayBuffer: {typeof SharedArrayBuffer !== 'undefined' ? '✅' : '❌'}</li>
                <li>Worker support: {typeof Worker !== 'undefined' ? '✅' : '❌'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {isLoading && (
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="mb-2 text-lg">{loadingStep}</p>
          <p className="text-sm text-gray-500 mb-4">This may take a few moments...</p>
          
          {installLogs.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-xs text-blue-400 hover:text-blue-300 mb-2"
              >
                {showLogs ? 'Hide' : 'Show'} install logs
              </button>
              
              {showLogs && (
                <div className="bg-black/50 p-3 rounded text-xs font-mono text-left max-h-32 overflow-y-auto">
                  {installLogs.slice(-10).map((log, i) => (
                    <div key={i} className="text-green-400">{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {!isLoading && url && (
        <iframe 
          width="100%" 
          height="100%" 
          src={url}
          className="border-0"
          onLoad={() => console.log('🖼️ Preview loaded successfully')}
          onError={(e) => console.error('🖼️ Preview failed to load:', e)}
        />
      )}
      
      {!isLoading && error && (
        <div className="text-center text-red-400 max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold mb-2">Preview Failed</h3>
          <p className="text-sm mb-4">{error}</p>
          
          {installLogs.length > 0 && (
            <details className="mb-4">
              <summary className="cursor-pointer text-xs text-blue-400 mb-2">
                View install logs
              </summary>
              <div className="bg-black/50 p-3 rounded text-xs font-mono text-left max-h-32 overflow-y-auto">
                {installLogs.map((log, i) => (
                  <div key={i} className="text-red-300">{log}</div>
                ))}
              </div>
            </details>
          )}
          
          <button 
            onClick={retryInitialization}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}