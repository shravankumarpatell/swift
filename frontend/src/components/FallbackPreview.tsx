// FallbackPreview.tsx - Component to use when WebContainer isn't supported
import React from 'react';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface FallbackPreviewProps {
  files: any[];
  onRetry?: () => void;
}

export function FallbackPreview({ files, onRetry }: FallbackPreviewProps) {
  const hasPackageJson = files.some(file => file.name === 'package.json');
  const hasIndexHtml = files.some(file => file.name === 'index.html');

  return (
    <div className="h-full flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50">
      <div className="text-center max-w-md px-6">
        <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
        
        <h3 className="text-xl font-semibold text-slate-200 mb-4">
          Preview Not Available
        </h3>
        
        <div className="text-slate-400 space-y-3 mb-6">
          <p>
            The preview feature requires cross-origin isolation and SharedArrayBuffer support.
          </p>
          
          <div className="text-sm bg-slate-800/50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-slate-300">To enable preview:</p>
            <ul className="text-left space-y-1">
              <li>• Serve your app with proper CORS headers</li>
              <li>• Enable cross-origin isolation</li>
              <li>• Use HTTPS in production</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}

          {(hasIndexHtml || hasPackageJson) && (
            <div className="pt-4 border-t border-slate-700/50">
              <p className="text-sm text-slate-500 mb-2">Alternative options:</p>
              <div className="flex gap-2 justify-center">
                <a
                  href="https://codesandbox.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  CodeSandbox
                </a>
                <a
                  href="https://stackblitz.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  StackBlitz
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}