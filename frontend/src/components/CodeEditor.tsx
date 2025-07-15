import { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileItem } from '../types';
import { Copy, Download, FileText, Code2, Maximize2, Minimize2, Save, RotateCcw } from 'lucide-react';

interface CodeEditorProps {
  file: FileItem | null;
  onSave?: (file: FileItem, newContent: string) => void; // Callback to handle file saving
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

  // const handleSave = async () => {
  //   if (!file || !hasUnsavedChanges) return;
    
  //   setIsSaving(true);
  //   try {
  //     // Call the onSave callback if provided
  //     if (onSave) {
  //       await onSave(file, currentContent);
  //     }
      
  //     // Update the original content to reflect the save
  //     setOriginalContent(currentContent);
  //     setHasUnsavedChanges(false);
  //   } catch (error) {
  //     console.error('Failed to save file:', error);
  //     // You might want to show a toast notification here
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

// const handleSave = async () => {
//     if (!file || !hasUnsavedChanges) return;
    
//     setIsSaving(true);
//     try {
//       // Debug logging
//       console.log('Saving file:', {
//         name: file.name,
//         path: file.path,
//         contentLength: currentContent.length,
//         hasOnSave: !!onSave
//       });
      
//       // Call the onSave callback if provided
//       if (onSave) {
//         await onSave(file, currentContent);
//       }
      
//       // Update the original content to reflect the save
//       setOriginalContent(currentContent);
//       setHasUnsavedChanges(false);
      
//       console.log('File saved successfully');
//     } catch (error) {
//       console.error('Failed to save file:', error);
//       // You might want to show a toast notification here
//     } finally {
//       setIsSaving(false);
//     }
//   };

const handleSave = async () => {
    if (!file || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      console.log('Saving file:', { name: file.name, path: file.path });
      
      // Call the onSave callback if provided
      if (onSave) {
        await onSave(file, currentContent);
      } else {
        console.warn('No onSave callback provided');
      }
      
      // Update the original content to reflect the save
      setOriginalContent(currentContent);
      setHasUnsavedChanges(false);
      
      console.log('File saved successfully:', file.path);
    } catch (error) {
      console.error('Failed to save file:', error);
      console.error('File details:', { name: file.name, path: file.path });
      // You might want to show a toast notification here
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
    switch (ext) {
      case 'ts': case 'tsx': case 'js': case 'jsx':
        return <Code2 className="w-4 h-4 text-blue-400" />;
      case 'css':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'html':
        return <FileText className="w-4 h-4 text-orange-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
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
      // Do nothing - completely suppress all markers
      return;
    };

    // Override getModelMarkers to always return empty array
    const originalGetModelMarkers = monaco.editor.getModelMarkers;
    monaco.editor.getModelMarkers = function() {
      return [];
    };

    // Override onDidChangeMarkers to prevent marker change events
    const originalOnDidChangeMarkers = monaco.editor.onDidChangeMarkers;
    monaco.editor.onDidChangeMarkers = function(listener: any) {
      // Return a dummy disposable
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

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50 backdrop-blur-sm">
        <div className="text-center">
          <Code2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">No file selected</p>
          <p className="text-slate-500 text-sm">Choose a file from the explorer to view its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : 'h-full w-full'} flex flex-col`}>
      {/* Header */}
      <div className="bg-[#1a1a1a] backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {getFileIcon(file.name)}
          <div>
            <h3 className="text-slate-200 font-medium flex items-center gap-2">
              {file.name}
              {hasUnsavedChanges && (
                <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Unsaved changes" />
              )}
            </h3>
            <p className="text-slate-500 text-xs">{file.path}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Save and Reset buttons (only show when there are unsaved changes) */}
          {hasUnsavedChanges && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600/80 hover:bg-green-600 disabled:bg-green-600/50 text-white rounded-md transition-colors text-sm font-medium"
                title="Save changes"
              >
                <Save className="w-3 h-3" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600/80 hover:bg-orange-600 text-white rounded-md transition-colors text-sm font-medium"
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
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors text-sm"
            title="Copy to clipboard"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied!' : ''}
          </button>
          
          <button
            onClick={downloadFile}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors text-sm"
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
            theme="vs-dark"
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
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading file content...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}