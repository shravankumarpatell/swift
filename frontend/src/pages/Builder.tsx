import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatHistory from '../components/ChatHistory';
import { FileExplorer } from '../components/FileExplorer';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Terminal } from '../components/Terminal';
import { Step, FileItem, StepType, ChatMessage } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import ChatInput from '../components/ChatInput';
import JSZip from 'jszip';
import { WebContainerManager } from '../components/WebContainerManager';


import {
  Search,
  Download,
  Terminal as TerminalIcon,
  ChevronUp,
  ChevronDown,
  Code2,
  Eye,
  FileText,
  Folder,
  Zap,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  X
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
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  // Chat panel state
  const [showChatPanel, setShowChatPanel] = useState<boolean>(true);
  const [chatPanelWidth, setChatPanelWidth] = useState(384); // 96 * 4 = 384px (w-96)

  // Function to download project as zip
  const downloadProject = async () => {
    const zip = new JSZip();

    const addFilesToZip = (fileItems: FileItem[], currentPath: string = '') => {
      fileItems.forEach(item => {
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;

        if (item.type === 'file') {
          zip.file(fullPath, item.content || '');
        } else if (item.type === 'folder' && item.children) {
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
      link.download = `bolt-project-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
    }
  };

  const handleSave = async (file: FileItem, newContent: string) => {
    try {
      const updateFileInTree = (files: FileItem[]): FileItem[] => {
        return files.map(f => {
          if (f.path === file.path && f.type === 'file') {
            return { ...f, content: newContent };
          } else if (f.type === 'folder' && f.children) {
            return { ...f, children: updateFileInTree(f.children) };
          }
          return f;
        });
      };

      setFiles(prevFiles => updateFileInTree(prevFiles));
      console.log(`File saved: ${file.path}`);
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
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

  const handleCommandComplete = (commandId: number) => {
    updateStepStatus(commandId, 'completed');
    setCommandQueue(prev => prev.filter(cmd => cmd.id !== commandId));
  };

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
        const command = step.code || step.command || '';
        if (command) {
          setCommandQueue(prev => [...prev, { id: step.id, command }]);
          setShowTerminal(true);
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

  
useEffect(() => {
  console.log('WebContainer Debug:', {
    crossOriginIsolated: self.crossOriginIsolated,
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    webContainer: webcontainer,
    isSupported: WebContainerManager.isSupported()
  });
}, [webcontainer]);

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim()
    });
    setTemplateSet(true);

    const { prompts, uiPrompts } = response.data;

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

  const toggleTerminal = () => {
    setShowTerminal(!showTerminal);
  };

  const toggleTerminalMaximize = () => {
    setIsTerminalMaximized(!isTerminalMaximized);
  };

  const toggleChatPanel = () => {
    setShowChatPanel(!showChatPanel);
  };

  const handleChatPanelResize = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = chatPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(300, Math.min(600, startWidth + deltaX));
      setChatPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen bg-[#0C0E16] flex flex-col overflow-hidden text-gray-100">
      {/* Header */}
      <header className="bg-[#101010] border-b border-gray-800/30 px-6 py-3 flex-shrink-0 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="pt-0.5">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              <h1 className="text-lg font-bold text-white bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                swift
              </h1>
            </div>
            <div className="h-6 w-px bg-gray-700"></div>
            <div className="flex items-center gap-2 max-w-md">
              <span className="text-sm text-gray-400 truncate">{prompt}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadProject}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={files.length === 0}
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        {showChatPanel && (
          <div
            className="bg-[#101010] border-r border-gray-800/30 flex flex-col backdrop-blur-md relative"
            style={{ width: chatPanelWidth }}
          >
            {/* Resize Handle */}
            <div
              className="absolute right-0 top-0 w-1 h-full bg-transparent hover:bg-gray-600 cursor-col-resize z-10"
              onMouseDown={handleChatPanelResize}
            />

            {/* Chat Header */}
            <div className="px-4 py-2.5 border-b border-gray-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-medium text-gray-200">Conversation</h2>
              </div>
              <button
                onClick={toggleChatPanel}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${showChatPanel
                  ? 'hover:bg-[#252830] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#252830]'
                  }`}
              >
                {showChatPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 bg-gradient-to-br from-[#0F1117] to-[#1A1C24] overflow-y-auto">
              <ChatHistory messages={chatMessages} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-800/30">
              <ChatInput
                userPrompt={userPrompt}
                setPrompt={setPrompt}
                loading={loading}
                onSend={handleSendMessage}
              />
            </div>
          </div>
        )}

        {/* Right Panel - Code/Preview Area */}
        <div className="flex-1 bg-[#0C0E16] flex flex-col">
          {/* Tab Bar */}
          <div className="bg-[#101010] border-b border-gray-800/30 px-4 py-2 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {!showChatPanel && (
                  <button
                    onClick={toggleChatPanel}
                    className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${showChatPanel
                      ? 'bg-[#2A2D36] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#252830]'
                      }`}
                  >
                    {showChatPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}

                  </button>
                )}
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'code'
                    ? 'bg-[#2A2D36] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-[#252830]'
                    }`}
                >
                  <Code2 className="w-4 h-4" />
                  Code
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'preview'
                    ? 'bg-[#2A2D36] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-[#252830]'
                    }`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>

              {/* Terminal Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTerminal}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${showTerminal
                    ? 'bg-[#2A2D36] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#252830]'
                    }`}
                >
                  <TerminalIcon className="w-4 h-4" />
                  Terminal
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Main Content */}
            <div className={`${isTerminalMaximized ? 'hidden' : 'flex-1'} overflow-hidden`}>
              {activeTab === 'code' ? (
                <div className="flex h-full">
                  {/* File Explorer */}
                  <div className="w-64 bg-[#101010] border-r border-gray-800/30 flex flex-col backdrop-blur-md">
                    <div className="px-4 py-3 border-b border-gray-800/30">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          Files
                        </h3>
                        <div className="relative w-40">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-[#0c0c0c] border border-gray-700/30 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
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
                  <div className="flex-1 bg-[#0C0E16]">
                    {selectedFile ? (
                      <CodeEditor file={selectedFile} onSave={handleSave} />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-[#1a1a1a]">
                        <div className="text-center">
                          <div className="  flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-14 h-14 text-gray-500" />
                          </div>
                          <p className="text-gray-500">Select a file to start editing</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full bg-[#0C0E16]">
                  <PreviewFrame webContainer={webcontainer} files={files} />
                </div>
              )}
            </div>

            {/* Terminal Panel */}
            {showTerminal && (
              <div className={`border-t border-gray-800/30 bg-[#101010] flex flex-col backdrop-blur-md ${isTerminalMaximized ? 'flex-1' : ''
                }`}>
                {/* Terminal Header */}
                <div className="px-4 py-2 border-b border-gray-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="">
                      <Zap className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Terminal</span>
                    {commandQueue.length > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                          {commandQueue.length} running
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleTerminalMaximize}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {isTerminalMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                      onMouseDown={handleTerminalResize}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200 cursor-ns-resize"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={toggleTerminal}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Terminal Content */}
                <div
                  style={{ height: isTerminalMaximized ? 'auto' : terminalHeight }}
                  className={`${isTerminalMaximized ? 'flex-1' : ''} overflow-hidden`}
                >
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