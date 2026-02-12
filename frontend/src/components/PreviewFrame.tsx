import { WebContainer } from '@webcontainer/api';
import { useEffect, useState, useRef } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { WebContainerManager } from '../hooks/WebContainerManager';
import { useDarkMode } from '../contexts/DarkModeContext';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer | null;
  loading?: boolean;
}

/**
 * Extract package.json content from the file tree so we can detect
 * when dependencies change and need a fresh `npm install`.
 */
function getPackageJsonContent(files: any[]): string | null {
  for (const file of files) {
    if (file.type === 'file' && file.name === 'package.json') {
      return file.content || null;
    }
    if (file.type === 'folder' && file.children) {
      const found = getPackageJsonContent(file.children);
      if (found) return found;
    }
  }
  return null;
}

export function PreviewFrame({ files, webContainer, loading = false }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const managerRef = useRef<WebContainerManager | null>(null);
  const initializationRef = useRef<boolean>(false);
  const lastInstalledPkgJsonRef = useRef<string | null>(null);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    managerRef.current = WebContainerManager.getInstance();
  }, []);

  const hasPackageJson = files.some(file => file.name === 'package.json');

  const resetState = () => {
    setUrl("");
    setIsLoading(true);
    setError(null);
    setLoadingStep("Initializing...");
  };

  async function runInstallAndStartDev() {
    if (!managerRef.current || !webContainer) {
      setError("WebContainer not available");
      setIsLoading(false);
      return;
    }

    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      resetState();

      // Check if dev server is already running AND deps haven't changed
      const currentPkgJson = getPackageJsonContent(files);
      const existingUrl = managerRef.current.getDevServerUrl();
      if (existingUrl && lastInstalledPkgJsonRef.current === currentPkgJson) {
        console.log('Using existing dev server:', existingUrl);
        setUrl(existingUrl);
        setIsLoading(false);
        initializationRef.current = false;
        return;
      }

      if (!hasPackageJson) {
        setLoadingStep("No package.json found");
        setError("This project doesn't have a package.json file. Add a development server configuration to enable preview.");
        setIsLoading(false);
        initializationRef.current = false;
        return;
      }

      console.log('Starting development server...');
      setLoadingStep("Installing dependencies...");

      // Install dependencies
      try {
        const installProcess = await webContainer.spawn('npm', ['install']);

        let installOutput = '';
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            installOutput += data;
            console.log('Install output:', data);
          }
        }));

        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error(`npm install failed with exit code ${installExitCode}`);
        }

        // Track what we installed so we can detect changes later
        lastInstalledPkgJsonRef.current = currentPkgJson;

        console.log('Dependencies installed successfully');
        setLoadingStep("Starting development server...");

        // If dev server is already running, kill it so we restart with new deps
        if (existingUrl) {
          console.log('Restarting dev server with updated dependencies...');
          managerRef.current.resetDevServer();
        }

        const devServerUrl = await managerRef.current.startDevServer();

        if (devServerUrl) {
          console.log('Dev server started successfully:', devServerUrl);
          setUrl(devServerUrl);
          setIsLoading(false);
        } else {
          throw new Error('Development server failed to start or timed out');
        }

      } catch (installError) {
        console.error('Installation error:', installError);
        setLoadingStep("Attempting to start development server...");

        try {
          const devServerUrl = await managerRef.current.startDevServer();
          if (devServerUrl) {
            console.log('Dev server started despite install issues:', devServerUrl);
            setUrl(devServerUrl);
            setIsLoading(false);
          } else {
            throw installError;
          }
        } catch (serverError) {
          throw installError;
        }
      }

    } catch (error) {
      console.error('Error initializing preview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoadingStep("Error starting preview");
      setIsLoading(false);
    } finally {
      initializationRef.current = false;
    }
  }

  // Initialize preview when WebContainer and files are ready AND loading is complete
  useEffect(() => {
    if (webContainer && files.length > 0 && !loading && !initializationRef.current) {
      console.log('AI response complete. Initializing preview with', files.length, 'files');
      runInstallAndStartDev();
    }
  }, [webContainer, files.length, loading]);

  // Re-install deps if package.json changes after initial install
  useEffect(() => {
    if (!webContainer || loading || files.length === 0 || !lastInstalledPkgJsonRef.current) return;

    const currentPkgJson = getPackageJsonContent(files);
    if (currentPkgJson && currentPkgJson !== lastInstalledPkgJsonRef.current) {
      console.log('[PreviewFrame] package.json changed — re-installing dependencies');
      initializationRef.current = false;
      runInstallAndStartDev();
    }
  }, [files, loading]);

  const retryInitialization = () => {
    setRetryCount(prev => prev + 1);
    initializationRef.current = false;
    lastInstalledPkgJsonRef.current = null; // Force re-install
    runInstallAndStartDev();
  };

  const themeClasses = {
    loadingContainer: isDarkMode
      ? "h-full flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50"
      : "h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200/50",
    loadingSpinner: isDarkMode
      ? "animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-6"
      : "animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-6",
    loadingTitle: isDarkMode
      ? "text-lg font-semibold text-slate-200 mb-2"
      : "text-lg font-semibold text-gray-800 mb-2",
    loadingDescription: isDarkMode ? "text-slate-400" : "text-gray-600",
    progressBox: isDarkMode
      ? "text-sm bg-slate-800/50 rounded-lg p-3"
      : "text-sm bg-gray-100/70 rounded-lg p-3",
    progressDot: (isActive: boolean, isComplete: boolean) => 
      isComplete 
        ? 'w-2 h-2 rounded-full bg-green-500'
        : isActive 
          ? 'w-2 h-2 rounded-full bg-orange-500 animate-pulse'
          : isDarkMode 
            ? 'w-2 h-2 rounded-full bg-slate-600'
            : 'w-2 h-2 rounded-full bg-gray-400',
    errorContainer: isDarkMode
      ? "h-full flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50"
      : "h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200/50",
    errorIcon: isDarkMode ? "w-16 h-16 text-amber-400 mx-auto mb-6" : "w-16 h-16 text-amber-500 mx-auto mb-6",
    errorTitle: isDarkMode
      ? "text-xl font-semibold text-slate-200 mb-4"
      : "text-xl font-semibold text-gray-800 mb-4",
    errorMessage: isDarkMode
      ? "text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300"
      : "text-sm bg-red-50 border border-red-200 rounded-lg p-3 text-red-700",
    helpBox: isDarkMode
      ? "text-sm bg-slate-800/50 rounded-lg p-4 space-y-2 text-left"
      : "text-sm bg-gray-100 rounded-lg p-4 space-y-2 text-left",
    helpTitle: isDarkMode ? "font-medium text-slate-300" : "font-medium text-gray-700",
    helpList: isDarkMode ? "space-y-1 text-slate-400" : "space-y-1 text-gray-600",
    retryButton: isDarkMode
      ? "flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors mx-auto"
      : "flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors mx-auto",
    alternativeText: isDarkMode ? "text-sm text-slate-500 mb-2" : "text-sm text-gray-500 mb-2",
    previewContainer: isDarkMode
      ? "h-full flex flex-col bg-[#0C0E16]"
      : "h-full flex flex-col bg-gray-50",
    previewHeader: isDarkMode
      ? "bg-[#101010] border-b border-gray-800/30 px-4 py-2 flex items-center justify-between"
      : "bg-white border-b border-gray-200/50 px-4 py-2 flex items-center justify-between",
    statusDot: "w-3 h-3 bg-green-500 rounded-full",
    urlText: isDarkMode
      ? "text-sm text-gray-300 font-mono"
      : "text-sm text-gray-600 font-mono",
    headerButton: isDarkMode
      ? "p-2 text-gray-400 hover:text-white transition-colors"
      : "p-2 text-gray-500 hover:text-gray-700 transition-colors",
    previewContent: "flex-1 bg-white",
    fallbackContainer: isDarkMode
      ? "h-full flex items-center justify-center bg-[#0C0E16]"
      : "h-full flex items-center justify-center bg-gray-50",
    fallbackSpinner: isDarkMode
      ? "animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"
      : "animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4",
    fallbackText: isDarkMode ? "text-gray-400" : "text-gray-600"
  };

  // Show "Waiting for AI" while still loading
  if (loading) {
    return (
      <div className={themeClasses.loadingContainer}>
        <div className="text-center max-w-md px-6">
          <div className={themeClasses.loadingSpinner}></div>
          <h3 className={themeClasses.loadingTitle}>Waiting for AI response...</h3>
          <div className={`${themeClasses.loadingDescription} space-y-2`}>
            <p>Preview will start once the code generation is complete.</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !error) {
    return (
      <div className={themeClasses.loadingContainer}>
        <div className="text-center max-w-md px-6">
          <div className={themeClasses.loadingSpinner}></div>
          <h3 className={themeClasses.loadingTitle}>{loadingStep}</h3>
          <div className={`${themeClasses.loadingDescription} space-y-2`}>
            <p>Setting up your development environment...</p>
            <div className={themeClasses.progressBox}>
              <div className="flex items-center justify-between">
                <span>Progress</span>
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className={themeClasses.progressDot(
                        (loadingStep.includes('Installing') && i === 0) ||
                        (loadingStep.includes('Starting') && i === 1) ||
                        (loadingStep.includes('Ready') && i === 2),
                        loadingStep.includes('Ready') && i <= 2
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !url) {
    return (
      <div className={themeClasses.errorContainer}>
        <div className="text-center max-w-md px-6">
          <AlertTriangle className={themeClasses.errorIcon} />
          
          <h3 className={themeClasses.errorTitle}>
            Preview Not Available
          </h3>
          
          <div className={`${themeClasses.loadingDescription} space-y-3 mb-6`}>
            <p className={themeClasses.errorMessage}>
              {error}
            </p>
            
            {!hasPackageJson && (
              <div className={themeClasses.helpBox}>
                <p className={themeClasses.helpTitle}>To enable preview:</p>
                <ul className={themeClasses.helpList}>
                  <li>• Add a package.json with dev scripts</li>
                  <li>• Include a development server (Vite, Next.js, etc.)</li>
                  <li>• Ensure your project has a start command</li>
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={retryInitialization}
              className={themeClasses.retryButton}
            >
              <RefreshCw className="w-4 h-4" />
              Retry {retryCount > 0 && `(${retryCount})`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - show the preview (no "Open in new tab" button — WebContainer URLs don't work outside the iframe)
  if (url) {
    return (
      <div className={themeClasses.previewContainer}>
        {/* Preview Header */}
        <div className={themeClasses.previewHeader}>
          <div className="flex items-center gap-3">
            <div className={themeClasses.statusDot}></div>
            <span className={themeClasses.urlText}>{url}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={retryInitialization}
              className={themeClasses.headerButton}
              title="Refresh preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className={themeClasses.previewContent}>
          <iframe 
            src={url}
            className="w-full h-full border-0"
            title="Preview"
            onLoad={() => console.log('Preview iframe loaded successfully')}
            onError={(e) => {
              console.error('Preview iframe error:', e);
              setError('Failed to load preview content');
            }}
          />
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className={themeClasses.fallbackContainer}>
      <div className="text-center">
        <div className={themeClasses.fallbackSpinner}></div>
        <p className={themeClasses.fallbackText}>Loading preview...</p>
      </div>
    </div>
  );
}