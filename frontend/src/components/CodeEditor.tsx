import { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileItem } from '../types';
import { Copy, Download, FileText, Code2, Maximize2, Minimize2, Save, RotateCcw } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface CodeEditorProps {
  file: FileItem | null;
  onSave?: (file: FileItem, newContent: string) => void;
}

export function CodeEditor({ file, onSave }: CodeEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useDarkMode();

  // Update content when file changes
  useEffect(() => {
    if (file?.content !== undefined) {
      setCurrentContent(file.content);
      setOriginalContent(file.content);
      setHasUnsavedChanges(false);
    }
  }, [file?.content]);

  // Check for unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(currentContent !== originalContent);
  }, [currentContent, originalContent]);

  // Force editor layout on container resize
  useEffect(() => {
    if (editorInstance) {
      const resizeObserver = new ResizeObserver(() => {
        editorInstance.layout();
      });
      
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [editorInstance]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (editorInstance) {
        setTimeout(() => {
          editorInstance.layout();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [editorInstance]);

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp': case 'c': return 'cpp';
      case 'php': return 'php';
      case 'rb': return 'ruby';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'sql': return 'sql';
      case 'sh': return 'shell';
      case 'xml': return 'xml';
      case 'yaml': case 'yml': return 'yaml';
      default: return 'typescript';
    }
  };

  const copyToClipboard = async () => {
    if (currentContent) {
      try {
        await navigator.clipboard.writeText(currentContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const downloadFile = () => {
    if (currentContent && file?.name) {
      const blob = new Blob([currentContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSave = async () => {
    if (!file || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      console.log('Saving file:', { name: file.name, path: file.path });
      
      if (onSave) {
        await onSave(file, currentContent);
      } else {
        console.warn('No onSave callback provided');
      }
      
      setOriginalContent(currentContent);
      setHasUnsavedChanges(false);
      
      console.log('File saved successfully:', file.path);
    } catch (error) {
      console.error('Failed to save file:', error);
      console.error('File details:', { name: file.name, path: file.path });
      alert(`Failed to save file: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!hasUnsavedChanges) return;
    
    setCurrentContent(originalContent);
    if (editorInstance) {
      editorInstance.setValue(originalContent);
    }
    setHasUnsavedChanges(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setCurrentContent(newContent);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconClass = isDarkMode ? 'w-4 h-4' : 'w-4 h-4';
    
    switch (ext) {
      case 'ts': case 'tsx': case 'js': case 'jsx':
        return <Code2 className={`${iconClass} text-blue-400`} />;
      case 'css':
        return <FileText className={`${iconClass} text-purple-400`} />;
      case 'html':
        return <FileText className={`${iconClass} text-orange-400`} />;
      default:
        return <FileText className={`${iconClass} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />;
    }
  };

  // Configure Monaco Editor to disable ALL error checking
  const handleEditorWillMount = (monaco: any) => {
    // Completely disable TypeScript language service
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });

    // Completely disable JavaScript language service  
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });

    // Disable CSS validation
    try {
      monaco.languages.css?.cssDefaults?.setDiagnosticsOptions({ validate: false });
      monaco.languages.css?.scssDefaults?.setDiagnosticsOptions({ validate: false });
      monaco.languages.css?.lessDefaults?.setDiagnosticsOptions({ validate: false });
    } catch (e) {
      console.warn('CSS validation disable failed:', e);
    }

    // Disable HTML validation
    try {
      monaco.languages.html?.htmlDefaults?.setOptions({ validate: false });
    } catch (e) {
      console.warn('HTML validation disable failed:', e);
    }

    // Disable JSON validation
    try {
      monaco.languages.json?.jsonDefaults?.setDiagnosticsOptions({ validate: false });
    } catch (e) {
      console.warn('JSON validation disable failed:', e);
    }

    // Nuclear option: Override ALL marker-related functions
    const originalSetModelMarkers = monaco.editor.setModelMarkers;
    monaco.editor.setModelMarkers = function() {
      return;
    };

    const originalGetModelMarkers = monaco.editor.getModelMarkers;
    monaco.editor.getModelMarkers = function() {
      return [];
    };

    const originalOnDidChangeMarkers = monaco.editor.onDidChangeMarkers;
    monaco.editor.onDidChangeMarkers = function(listener: any) {
      return { dispose: () => {} };
    };

    // Disable all language services at the worker level
    monaco.languages.registerHoverProvider = () => ({ dispose: () => {} });
    monaco.languages.registerCompletionItemProvider = () => ({ dispose: () => {} });
    monaco.languages.registerSignatureHelpProvider = () => ({ dispose: () => {} });
    monaco.languages.registerDefinitionProvider = () => ({ dispose: () => {} });
    monaco.languages.registerReferenceProvider = () => ({ dispose: () => {} });
    monaco.languages.registerDocumentHighlightProvider = () => ({ dispose: () => {} });
    
    // Set extremely permissive compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      allowJs: true,
      skipLibCheck: true,
      allowSyntheticDefaultImports: true,
      strict: false,
      noImplicitAny: false,
      noImplicitReturns: false,
      noImplicitThis: false,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noImplicitOverride: false,
      noPropertyAccessFromIndexSignature: false,
      noUncheckedIndexedAccess: false,
      exactOptionalPropertyTypes: false,
      checkJs: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      allowJs: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      checkJs: false,
    });
  };

  const themeClasses = {
    container: isDarkMode
      ? `${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : 'h-full w-full'} flex flex-col`
      : `${isFullscreen ? 'fixed inset-0 z-50 bg-gray-100' : 'h-full w-full'} flex flex-col`,
    header: isDarkMode
      ? "bg-[#1a1a1a] backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex items-center justify-between flex-shrink-0"
      : "bg-white backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between flex-shrink-0",
    fileName: isDarkMode ? "text-slate-200 font-medium" : "text-gray-800 font-medium",
    filePath: isDarkMode ? "text-slate-500 text-xs" : "text-gray-500 text-xs",
    unsavedDot: "w-2 h-2 bg-yellow-400 rounded-full",
    saveButton: isDarkMode
      ? "flex items-center gap-1 px-3 py-1.5 bg-green-600/80 hover:bg-green-600 disabled:bg-green-600/50 text-white rounded-md transition-colors text-sm font-medium"
      : "flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-md transition-colors text-sm font-medium",
    resetButton: isDarkMode
      ? "flex items-center gap-1 px-3 py-1.5 bg-orange-600/80 hover:bg-orange-600 text-white rounded-md transition-colors text-sm font-medium"
      : "flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors text-sm font-medium",
    actionButton: isDarkMode
      ? "flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors text-sm"
      : "flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors text-sm",
    emptyState: isDarkMode
      ? "h-full flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50 backdrop-blur-sm"
      : "h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 backdrop-blur-sm",
    emptyStateIcon: isDarkMode ? "w-16 h-16 text-slate-600 mx-auto mb-4" : "w-16 h-16 text-gray-400 mx-auto mb-4",
    emptyStateTitle: isDarkMode ? "text-slate-400 text-lg mb-2" : "text-gray-600 text-lg mb-2",
    emptyStateDescription: isDarkMode ? "text-slate-500 text-sm" : "text-gray-500 text-sm",
    loadingOverlay: isDarkMode
      ? "absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center"
      : "absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center",
    loadingSpinner: isDarkMode
      ? "animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"
      : "animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4",
    loadingText: isDarkMode ? "text-slate-400" : "text-gray-600"
  };

  if (!file) {
    return (
      <div className={themeClasses.emptyState}>
        <div className="text-center">
          <Code2 className={themeClasses.emptyStateIcon} />
          <p className={themeClasses.emptyStateTitle}>No file selected</p>
          <p className={themeClasses.emptyStateDescription}>Choose a file from the explorer to view its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses.container}>
      {/* Header */}
      <div className={themeClasses.header}>
        <div className="flex items-center gap-3">
          {getFileIcon(file.name)}
          <div>
            <h3 className={`${themeClasses.fileName} flex items-center gap-2`}>
              {file.name}
              {hasUnsavedChanges && (
                <span className={themeClasses.unsavedDot} title="Unsaved changes" />
              )}
            </h3>
            <p className={themeClasses.filePath}>{file.path}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Save and Reset buttons (only show when there are unsaved changes) */}
          {hasUnsavedChanges && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={themeClasses.saveButton}
                title="Save changes"
              >
                <Save className="w-3 h-3" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              
              <button
                onClick={handleReset}
                className={themeClasses.resetButton}
                title="Reset to original"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </>
          )}
          
          {/* Action buttons */}
          <button
            onClick={copyToClipboard}
            className={themeClasses.actionButton}
            title="Copy to clipboard"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied!' : ''}
          </button>
          
          <button
            onClick={downloadFile}
            className={themeClasses.actionButton}
            title="Download file"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div ref={containerRef} className="flex-1 relative min-h-0 overflow-hidden">
        <div className="w-full h-full">
          <Editor
            height="100%"
            width="100%"
            language={getLanguage(file.name)}
            theme={isDarkMode ? "vs-dark" : "light"}
            value={currentContent}
            onChange={handleEditorChange}
            beforeMount={handleEditorWillMount}
            onMount={(editor, monaco) => {
              setEditorInstance(editor);
              // Force layout refresh after mount
              setTimeout(() => {
                editor.layout();
              }, 100);
            }}
            options={{
              readOnly: false,
              minimap: { enabled: true },
              fontSize: 15,
              fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
              fontLigatures: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              renderLineHighlight: 'all',
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              showFoldingControls: 'always',
              contextmenu: true,
              automaticLayout: true,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 12,
                horizontalScrollbarSize: 12,
              },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              renderWhitespace: 'selection',
              padding: { top: 16, bottom: 16 },
              bracketPairColorization: {
                enabled: true,
              },
              guides: {
                bracketPairs: false,
                indentation: false,
              },
              renderValidationDecorations: 'off',
              'semanticHighlighting.enabled': false,
              quickSuggestions: false,
              parameterHints: {
                enabled: false,
              },
              suggestOnTriggerCharacters: false,
              acceptSuggestionOnEnter: 'off',
              tabCompletion: 'off',
              wordBasedSuggestions: 'off',
              hover: {
                enabled: false,
              },
              links: false,
              colorDecorators: false,
              foldingHighlight: false,
              selectionHighlight: false,
              occurrencesHighlight: 'off',
            }}
          />
        
          {/* Loading overlay */}
          {!file.content && (
            <div className={themeClasses.loadingOverlay}>
              <div className="text-center">
                <div className={themeClasses.loadingSpinner}></div>
                <p className={themeClasses.loadingText}>Loading file content...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}