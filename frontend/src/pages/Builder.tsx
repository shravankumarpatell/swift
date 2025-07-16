//Builder.tsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatHistory  from '../components/ChatHistory';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Terminal } from '../components/Terminal';
import { Step, FileItem, StepType, ChatMessage } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { Loader } from '../components/Loader';
import ChatInput from '../components/ChatInput';
import JSZip from 'jszip';

import {
  Search,
  Download,
  Terminal as TerminalIcon,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [userPrompt, setPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Terminal state
  const [showTerminal, setShowTerminal] = useState<boolean>(true);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [commandQueue, setCommandQueue] = useState<{ id: number; command: string }[]>([]);

  // Function to download project as zip
  const downloadProject = async () => {
    const zip = new JSZip();

    const addFilesToZip = (fileItems: FileItem[], currentPath: string = '') => {
      fileItems.forEach(item => {
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;

        if (item.type === 'file') {
          zip.file(fullPath, item.content || '');
        } else if (item.type === 'folder' && item.children) {
          // Create folder and add its children
          addFilesToZip(item.children, fullPath);
        }
      });
    };

    addFilesToZip(files);

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `website-project-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
    }
  };

  //   const handleSave = async (file: FileItem, newContent: string) => {
  //   try {
  //     const fullPath = file.path;
  //     // Option 1: If you're using a real file system/API
  //     // await saveFileToServer(file.path, newContent);

  //     // Option 2: If you're managing files in React state
  //     // Update your files state with the new content
  //     setFiles(prevFiles => 
  //       prevFiles.map(f => 
  //         f.path === file.path 
  //           ? { ...f, content: newContent }
  //           : f
  //       )
  //     );

  //     console.log(`File saved: ${fullPath}`);

  //     // Optional: Show success message
  //     // showToast('File saved successfully!');

  //   } catch (error) {
  //     console.error('Failed to save file:', error);
  //     throw error;
  //     // Optional: Show error message
  //     // showToast('Failed to save file');
  //   }
  // };

  // Extract all pending steps from chat messages

  const handleSave = async (file: FileItem, newContent: string) => {
    try {
      const fullPath = file.path;

      // Recursive function to update file content in nested structure
      const updateFileInTree = (files: FileItem[]): FileItem[] => {
        return files.map(f => {
          if (f.path === file.path && f.type === 'file') {
            // Found the file to update
            return { ...f, content: newContent };
          } else if (f.type === 'folder' && f.children) {
            // Recursively search in folder children
            return { ...f, children: updateFileInTree(f.children) };
          }
          return f;
        });
      };

      // Update your files state with the new content using recursive search
      setFiles(prevFiles => updateFileInTree(prevFiles));

      console.log(`File saved: ${fullPath}`);

      // Optional: Show success message
      // showToast('File saved successfully!');

    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
      // Optional: Show error message
      // showToast('Failed to save file');
    }
  };


  const getAllPendingSteps = (): Step[] => {
    const allSteps: Step[] = [];
    chatMessages.forEach(message => {
      if (message.role === 'assistant' && message.steps) {
        allSteps.push(...message.steps.filter(step => step.status === 'pending'));
      }
    });
    return allSteps;
  };

  // Update step status in chat messages
  const updateStepStatus = (stepId: number, status: 'pending' | 'in-progress' | 'completed') => {
    setChatMessages(prev => prev.map(message => {
      if (message.role === 'assistant' && message.steps) {
        return {
          ...message,
          steps: message.steps.map(step => 
            step.id === stepId ? { ...step, status } : step
          )
        };
      }
      return message;
    }));
  };

  // Handle terminal command execution completion
  const handleCommandComplete = (commandId: number) => {
    updateStepStatus(commandId, 'completed');
    setCommandQueue(prev => prev.filter(cmd => cmd.id !== commandId));
  };

  // Handle terminal command execution start
  const handleCommandStart = (commandId: number) => {
    updateStepStatus(commandId, 'in-progress');
  };

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    const pendingSteps = getAllPendingSteps();

    pendingSteps.forEach(step => {
      updateHappened = true;

      if (step?.type === StepType.CreateFile) {
        updateStepStatus(step.id, 'completed');

        let parsedPath = step.path?.split("/") ?? [];
        let currentFileStructure = [...originalFiles];
        let finalAnswerRef = currentFileStructure;

        let currentFolder = ""
        while (parsedPath.length) {
          currentFolder = `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);

          if (!parsedPath.length) {
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      } else if (
  step?.type === StepType.RunScript ||
  step?.type === StepType.ExecuteCommand ||
  step?.type === StepType.RunCommand
) {
        // Handle command execution steps
        const command = step.code || step.command || '';
        if (command) {
          setCommandQueue(prev => [...prev, { id: step.id, command }]);
          setShowTerminal(true); // Auto-show terminal when commands are queued
        }
      }
    });

    if (updateHappened) {
      setFiles(originalFiles);
    }
  }, [chatMessages]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processFile = (file: FileItem, isRootFolder: boolean) => {
        if (file.type === 'folder') {
          mountStructure[file.name] = {
            directory: file.children ?
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              )
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }

        return mountStructure[file.name];
      };

      files.forEach(file => processFile(file, true));
      return mountStructure;
    };

    const mountStructure = createMountStructure(files);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim()
    });
    setTemplateSet(true);

    const { prompts, uiPrompts } = response.data;

    // Create initial assistant message with template steps
    const initialSteps = parseXml(uiPrompts[0]).map((x: Step) => ({
      ...x,
      status: "pending" as const
    }));

    const initialMessage: ChatMessage = {
      id: Date.now(),
      role: 'assistant',
      content: 'I\'ll help you build this project. Let me start by setting up the initial structure.',
      steps: initialSteps,
      timestamp: new Date()
    };

    setChatMessages([initialMessage]);

    setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...prompts, prompt].map(content => ({
        role: "user",
        content
      }))
    });

    setLoading(false);

    // Parse the assistant response and create a new message
    const responseSteps = parseXml(stepsResponse.data.response).map((x: Step) => ({
      ...x,
      status: "pending" as const
    }));

    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: stepsResponse.data.response,
      steps: responseSteps,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, assistantMessage]);
  }

  useEffect(() => {
    init();
  }, []);

  const handleSendMessage = async () => {
    if (!userPrompt.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: userPrompt.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Convert chat messages to the format expected by the backend
      const messagesForBackend = chatMessages
        .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && msg.content))
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...messagesForBackend, { role: 'user', content: userPrompt.trim() }]
      });

      const responseSteps = parseXml(response.data.response).map((x: Step) => ({
        ...x,
        status: "pending" as const
      }));

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response,
        steps: responseSteps,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      setPrompt('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle terminal resize
  const handleTerminalResize = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = terminalHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.max(150, Math.min(600, startHeight + deltaY));
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">Website Builder</h1>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-400 truncate max-w-md">{prompt}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={downloadProject}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-2 transition-colors"
              disabled={files.length === 0}
            >
              <Download className="w-4 h-4" />
              Download Project
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden ">
        {/* Left Panel - Chat History */}
        <div className="w-96 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
          {/* Chat History */}
          <div className="flex-1 bg-gradient-to-br from-[#0A122A] to-[#0d1117] overflow-y-auto no-scrollbar">
            <ChatHistory messages={chatMessages} />
          </div>

          {/* Chat Input */}
          <ChatInput
            userPrompt={userPrompt}
            setPrompt={setPrompt}
            loading={loading}
            onSend={handleSendMessage}
          />
        </div>

        {/* Right Panel - Combined File Explorer and Code Editor/Preview */}
        <div className="flex-1 bg-[#0a0a0a] flex flex-col">
          {/* Tabs */}
          <div className="bg-[#1a1a1a] border-b border-gray-800 px-4 py-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 text-sm rounded ${activeTab === 'code'
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-sm rounded ${activeTab === 'preview'
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Main Content Area */}
            <div className={`flex-1 overflow-hidden ${showTerminal ? '' : 'flex-1'}`}>
              {activeTab === 'code' ? (
                // VS Code-like layout with file explorer on the left and code editor on the right
                <div className="flex h-full">
                  {/* File Explorer */}
                  <div className="w-60 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
                    <div className="px-4 py-2 border-b border-gray-800">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium text-gray-300">Files</h2>
                        {/* Search bar */}
                        <div className="relative mb-2 flex-shrink-0 mt-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="
                              w-40           
                              pl-10 pr-4 py-1 
                              bg-transparent   
                              border border-slate-700/50 
                              rounded-xl
                              text-slate-200 placeholder-slate-400
                              focus:outline-none 
                              focus:border-purple-500/50 
                              focus:ring-2 focus:ring-purple-500/20
                              transition-all duration-200
                            "
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <FileExplorer
                        files={files}
                        onFileSelect={setSelectedFile}
                      />
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 bg-[#0a0a0a]">
                    <CodeEditor file={selectedFile} onSave={handleSave} />
                  </div>
                </div>
              ) : (
                // Full-width preview when in preview mode (no file explorer)
                <div className="h-full">
                  <PreviewFrame webContainer={webcontainer} files={files} />
                </div>
              )}
            </div>

            {/* Terminal Panel */}
            {showTerminal && (
              <div className="border-t border-gray-800 bg-[#1a1a1a] flex flex-col">

                {/* Terminal Content */}
                <div style={{ height: terminalHeight }} className="flex-1 overflow-hidden">
                  <Terminal
                    webContainer={webcontainer}
                    commandQueue={commandQueue}
                    onCommandStart={handleCommandStart}
                    onCommandComplete={handleCommandComplete}
                    showTerminal={showTerminal}
                    setShowTerminal={setShowTerminal}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}