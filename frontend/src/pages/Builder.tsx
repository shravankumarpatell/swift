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
import { WebContainerManager } from '../hooks/WebContainerManager';
import { useDarkMode } from '../contexts/DarkModeContext';
import { DarkModeToggle } from '../components/DarkModeToggle';

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
  const { webContainer, isLoading: webContainerLoading, error: webContainerError, manager } = useWebContainer();
  const { isDarkMode } = useDarkMode();

  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Terminal state
  const [showTerminal, setShowTerminal] = useState(false);
  const [areFilesMounted, setAreFilesMounted] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [commandQueue, setCommandQueue] = useState<{ id: number; command: string }[]>([]);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  // Chat panel state
  const [showChatPanel, setShowChatPanel] = useState<boolean>(true);
  const [chatPanelWidth, setChatPanelWidth] = useState(500);

  // Theme classes
  const getThemeClasses = () => ({
    container: isDarkMode
      ? "h-screen bg-[#0C0E16] flex flex-col overflow-hidden text-gray-100"
      : "h-screen bg-gray-50 flex flex-col overflow-hidden text-gray-900",
    header: isDarkMode
      ? "bg-[#101010] border-b border-gray-800/30 px-6 py-3 flex-shrink-0 backdrop-blur-md"
      : "bg-white border-b border-gray-200/50 px-6 py-3 flex-shrink-0 backdrop-blur-md",
    logoText: isDarkMode
      ? "text-lg font-bold text-white bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent"
      : "text-lg font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent",
    promptText: isDarkMode ? "text-sm text-gray-400 truncate" : "text-sm text-gray-600 truncate",
    downloadButton: isDarkMode
      ? "px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-900 hover:from-purple-900 hover:to-purple-900 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      : "px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed",
    chatPanel: isDarkMode
      ? "bg-[#101010] border-r border-gray-800/30 flex flex-col backdrop-blur-md relative"
      : "bg-white border-r border-gray-200/50 flex flex-col backdrop-blur-md relative",
    chatHeader: isDarkMode
      ? "px-4 py-2.5 border-b border-gray-800/30 flex items-center justify-between"
      : "px-4 py-2.5 border-b border-gray-200/50 flex items-center justify-between",
    chatHeaderText: isDarkMode ? "text-sm font-medium text-gray-200" : "text-sm font-medium text-gray-800",
    chatHeaderButton: isDarkMode
      ? `px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${showChatPanel
          ? 'hover:bg-[#252830] text-white'
          : 'text-gray-400 hover:text-white hover:bg-[#252830]'
        }`
      : `px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${showChatPanel
          ? 'hover:bg-gray-100 text-gray-900'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`,
    chatHistory: isDarkMode
      ? "flex-1 bg-gradient-to-br from-[#0F1117] to-[#1A1C24] overflow-y-auto"
      : "flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto",
    chatInputBorder: isDarkMode ? "border-t border-gray-800/30" : "border-t border-gray-200/50",
    rightPanel: isDarkMode ? "flex-1 bg-[#0C0E16] flex flex-col" : "flex-1 bg-gray-50 flex flex-col",
    tabBar: isDarkMode
      ? "bg-[#101010] border-b border-gray-800/30 px-4 py-2 backdrop-blur-md"
      : "bg-white border-b border-gray-200/50 px-4 py-2 backdrop-blur-md",
    tabButton: (isActive: boolean) => isDarkMode
      ? `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${isActive
          ? 'bg-[#221230] text-white shadow-sm'
          : 'text-gray-400 hover:text-white hover:bg-[#331b48]'
        }`
      : `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${isActive
          ? 'bg-purple-100 text-purple-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`,
    panelButton: isDarkMode
      ? `px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${showChatPanel
          ? 'bg-[#2A2D36] text-white'
          : 'text-gray-400 hover:text-white hover:bg-[#252830]'
        }`
      : `px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${showChatPanel
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`,
    terminalButton: isDarkMode
      ? `px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${showTerminal
          ? 'bg-[#2A2D36] text-white'
          : 'text-gray-400 hover:text-white hover:bg-[#252830]'
        }`
      : `px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${showTerminal
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`,
    fileExplorer: isDarkMode
      ? "w-64 bg-[#101010] border-r border-gray-800/30 flex flex-col backdrop-blur-md"
      : "w-64 bg-white border-r border-gray-200/50 flex flex-col backdrop-blur-md",
    fileExplorerHeader: isDarkMode
      ? "px-4 py-3 border-b border-gray-800/30"
      : "px-4 py-3 border-b border-gray-200/50",
    fileExplorerTitle: isDarkMode ? "text-sm font-medium text-gray-200" : "text-sm font-medium text-gray-800",
    searchInput: isDarkMode
      ? "w-full pl-10 pr-4 py-2 bg-[#0c0c0c] border border-gray-700/30 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
      : "w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300/50 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200",
    codeEditorBg: isDarkMode ? "flex-1 bg-[#0C0E16]" : "flex-1 bg-white",
    emptyState: isDarkMode ? "h-full flex items-center justify-center bg-[#1a1a1a]" : "h-full flex items-center justify-center bg-gray-100",
    emptyStateText: isDarkMode ? "text-gray-500" : "text-gray-600",
    previewBg: isDarkMode ? "h-full bg-[#0C0E16]" : "h-full bg-white",
    terminalPanel: isDarkMode
      ? "border-t border-gray-800/30 bg-[#101010] flex flex-col backdrop-blur-md"
      : "border-t border-gray-200/50 bg-white flex flex-col backdrop-blur-md",
    terminalHeader: isDarkMode
      ? "px-4 py-2 border-b border-gray-800/30 flex items-center justify-between"
      : "px-4 py-2 border-b border-gray-200/50 flex items-center justify-between",
    terminalHeaderText: isDarkMode ? "text-sm font-medium text-gray-300" : "text-sm font-medium text-gray-700",
    terminalStatus: isDarkMode
      ? "px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full"
      : "px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full",
    terminalControlButton: isDarkMode
      ? "p-1 text-gray-400 hover:text-white transition-colors duration-200"
      : "p-1 text-gray-500 hover:text-gray-900 transition-colors duration-200",
    loadingContainer: isDarkMode
      ? "h-screen bg-[#0C0E16] flex items-center justify-center"
      : "h-screen bg-gray-50 flex items-center justify-center",
    loadingTitle: isDarkMode ? "text-xl font-bold text-white mb-2" : "text-xl font-bold text-gray-900 mb-2",
    loadingText: isDarkMode ? "text-gray-400" : "text-gray-600",
    errorContainer: isDarkMode
      ? "h-screen bg-[#0C0E16] flex items-center justify-center"
      : "h-screen bg-gray-50 flex items-center justify-center",
    errorTitle: isDarkMode ? "text-xl font-bold text-white mb-2" : "text-xl font-bold text-gray-900 mb-2",
    errorText: isDarkMode ? "text-gray-400 mb-4" : "text-gray-600 mb-4",
    retryButton: isDarkMode
      ? "px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      : "px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
  });

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
      link.download = `swift-project-${Date.now()}.zip`;
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
      // Update file in the local state
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

      const updatedFiles = updateFileInTree(files);
      setFiles(updatedFiles);

      // Update the file in WebContainer if available
      if (webContainer && manager) {
        console.log(`Saving file to WebContainer: ${file.path}`);
        // Re-mount the updated files to WebContainer
        await manager.mountFiles(updatedFiles);
      }

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

  // Process pending steps and update file structure
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
        const command = (step.code || step.command || '').trim();
        if (command) {
          // Filter out npm install/dev/build/start commands — these are handled
          // by the preview system automatically, not the terminal
          const isNpmLifecycleCmd = /^npm\s+(install|i|ci|run\s+(dev|start|build)|start)/.test(command);
          if (isNpmLifecycleCmd) {
            console.log(`[Builder] Skipping auto-execution of: ${command}`);
            updateStepStatus(step.id, 'completed');
          } else {
            setCommandQueue(prev => [...prev, { id: step.id, command }]);
            setShowTerminal(true);
          }
        }
      }
    });

    if (updateHappened) {
      setFiles(originalFiles);
    }
  }, [chatMessages]);

  // Mount files to WebContainer whenever files change
  useEffect(() => {
    if (files.length > 0 && manager && webContainer) {
      console.log('Mounting files to WebContainer...');
      // Reset mounted state when files change
      setAreFilesMounted(false);
      
      manager.mountFiles(files)
        .then(() => {
          console.log('Files mounted successfully');
          setAreFilesMounted(true);
        })
        .catch(error => {
          console.error('Failed to mount files to WebContainer:', error);
          // Even on error, we might want to set true to stop loading spinners, 
          // but for now let's leave it false to indicate failure.
        });
    }
  }, [files, manager, webContainer]);

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

  const themeClasses = getThemeClasses();

  // Show loading state while WebContainer is initializing
  if (webContainerLoading) {
    return (
      <div className={themeClasses.loadingContainer}>
        <div className="text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Zap className={`w-12 h-12 ${isDarkMode ? 'text-purple-500' : 'text-purple-600'} animate-pulse`} />
          </div>
          <h2 className={themeClasses.loadingTitle}>Initializing Swift</h2>
          <p className={themeClasses.loadingText}>Setting up your development environment...</p>
          <div className="mt-4 flex items-center justify-center">
            <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${isDarkMode ? 'border-purple-500' : 'border-purple-600'}`}></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if WebContainer fails to initialize
  if (webContainerError) {
    return (
      <div className={themeClasses.errorContainer}>
        <div className="text-center max-w-md px-6">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Zap className={`w-12 h-12 ${isDarkMode ? 'text-red-500' : 'text-red-600'}`} />
          </div>
          <h2 className={themeClasses.errorTitle}>Initialization Failed</h2>
          <p className={themeClasses.errorText}>{webContainerError}</p>
          <button
            onClick={() => window.location.reload()}
            className={themeClasses.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses.container}>
      {/* Header */}
      <header className={themeClasses.header}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="pt-0.5">
                <Zap className={`w-5 h-5 ${isDarkMode ? 'text-purple-500' : 'text-purple-600'}`} />
              </div>
              <h1 className={themeClasses.logoText}>
                swift
              </h1>
            </div>
            <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className="flex items-center gap-2 max-w-md">
              <span className={themeClasses.promptText}>{prompt}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <button
              onClick={downloadProject}
              className={themeClasses.downloadButton}
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
            className={themeClasses.chatPanel}
            style={{ width: 500 }}
          >
            {/* Chat Header */}
            <div className={themeClasses.chatHeader}>
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h2 className={themeClasses.chatHeaderText}>Conversation</h2>
              </div>
              <button
                onClick={toggleChatPanel}
                className={themeClasses.chatHeaderButton}
              >
                {showChatPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Chat History */}
            <div className={themeClasses.chatHistory}>
              <ChatHistory messages={chatMessages} />
            </div>

            {/* Chat Input */}
            <div className={themeClasses.chatInputBorder}>
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
        <div className={themeClasses.rightPanel}>
          {/* Tab Bar */}
          <div className={themeClasses.tabBar}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {!showChatPanel && (
                  <button
                    onClick={toggleChatPanel}
                    className={themeClasses.panelButton}
                  >
                    {showChatPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('code')}
                  className={themeClasses.tabButton(activeTab === 'code')}
                >
                  <Code2 className="w-4 h-4" />
                  Code
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={themeClasses.tabButton(activeTab === 'preview')}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>

              {/* Terminal Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTerminal}
                  className={themeClasses.terminalButton}
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
                  <div className={themeClasses.fileExplorer}>
                    <div className={themeClasses.fileExplorerHeader}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`${themeClasses.fileExplorerTitle} flex items-center gap-2`}>
                          <Folder className="w-4 h-4" />
                          Files
                        </h3>
                        <div className="relative w-40">
                          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} w-4 h-4`} />
                          <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={themeClasses.searchInput}
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
                  <div className={themeClasses.codeEditorBg}>
                    {selectedFile ? (
                      <CodeEditor file={selectedFile} onSave={handleSave} />
                    ) : (
                      <div className={themeClasses.emptyState}>
                        <div className="text-center">
                          <div className="flex items-center justify-center mx-auto mb-4">
                            <FileText className={`w-14 h-14 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                          <p className={themeClasses.emptyStateText}>Select a file to start editing</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={themeClasses.previewBg}>
                  <PreviewFrame webContainer={webContainer} files={files} loading={loading} />
                </div>
              )}
            </div>

            {/* Terminal Panel */}
            {showTerminal && (
              <div className={`${themeClasses.terminalPanel} ${isTerminalMaximized ? 'flex-1' : ''}`}>
                {/* Resize Handle */}
                <div
                  className={`absolute right-0 top-0 w-full h-1 bg-transparent ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-400'} cursor-row-resize z-10`}
                  onMouseDown={handleTerminalResize}
                />
                {/* Terminal Header */}
                <div className={themeClasses.terminalHeader}>
                  <div className="flex items-center gap-2">
                    <div className="">
                      <Zap className={`w-4 h-4 ${isDarkMode ? 'text-purple-500' : 'text-purple-600'}`} />
                    </div>
                    <span className={themeClasses.terminalHeaderText}>Terminal</span>
                    {commandQueue.length > 0 && (
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 ${isDarkMode ? 'bg-purple-500' : 'bg-purple-600'} rounded-full animate-pulse`}></div>
                        <span className={themeClasses.terminalStatus}>
                          {commandQueue.length} running
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleTerminalMaximize}
                      className={themeClasses.terminalControlButton}
                    >
                      {isTerminalMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={toggleTerminal}
                      className={themeClasses.terminalControlButton}
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
                    webContainer={webContainer}
                    commandQueue={commandQueue}
                    onCommandStart={handleCommandStart}
                    onCommandComplete={handleCommandComplete}
                    showTerminal={showTerminal}
                    setShowTerminal={setShowTerminal}
                    files={files}
                    areFilesMounted={areFilesMounted}
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