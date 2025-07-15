//Terminal.tsx
import React, { Dispatch, SetStateAction, useState, useRef, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';
import { ChevronDown,
    Terminal as TerminalIcon, Plus, X, Maximize2, Minimize2 } from 'lucide-react';

interface TerminalProps {
  webContainer: WebContainer | null;
  onExecuteCommand?: (command: string) => void;
  autoExecuteCommands?: string[];
  showTerminal: boolean;
  setShowTerminal: Dispatch<SetStateAction<boolean>>;
}

interface TerminalSession {
  id: string;
  name: string;
  output: string[];
  currentDir: string;
  isActive: boolean;
  process: any;
}

export function Terminal({ webContainer, onExecuteCommand, autoExecuteCommands = [] }: TerminalProps) {
  const [terminals, setTerminals] = useState<TerminalSession[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
//   const [showTerminal, setShowTerminal] = useState<boolean>(true);

  // Auto-execute commands when they come in
  useEffect(() => {
    if (autoExecuteCommands.length > 0 && webContainer) {
      autoExecuteCommands.forEach(command => {
        executeCommand(command, true);
      });
    }
  }, [autoExecuteCommands, webContainer]);

  // Create initial terminal session
  useEffect(() => {
    if (webContainer && terminals.length === 0) {
      createNewTerminal();
    }
  }, [webContainer]);

  // Scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminals, activeTerminalId]);

  const createNewTerminal = () => {
    const newTerminal: TerminalSession = {
      id: `terminal-${Date.now()}`,
      name: `Terminal ${terminals.length + 1}`,
      output: ['Welcome to the terminal!', ''],
      currentDir: '/',
      isActive: true,
      process: null
    };

    setTerminals(prev => {
      const updated = prev.map(t => ({ ...t, isActive: false }));
      return [...updated, newTerminal];
    });
    setActiveTerminalId(newTerminal.id);
  };

  const closeTerminal = (terminalId: string) => {
    setTerminals(prev => {
      const filtered = prev.filter(t => t.id !== terminalId);
      if (filtered.length === 0) {
        return [];
      }
      
      // If we're closing the active terminal, switch to another one
      if (activeTerminalId === terminalId) {
        const newActive = filtered[filtered.length - 1];
        newActive.isActive = true;
        setActiveTerminalId(newActive.id);
      }
      
      return filtered;
    });
  };

  const switchTerminal = (terminalId: string) => {
    setTerminals(prev => prev.map(t => ({
      ...t,
      isActive: t.id === terminalId
    })));
    setActiveTerminalId(terminalId);
  };

  const executeCommand = async (command: string, isAutoExecute = false) => {
    if (!webContainer || !command.trim()) return;

    const activeTerminal = terminals.find(t => t.id === activeTerminalId);
    if (!activeTerminal) return;

    // Add command to history
    if (!isAutoExecute) {
      setCommandHistory(prev => [...prev, command]);
      setHistoryIndex(-1);
    }

    // Add command to output
    const commandLine = `$ ${command}`;
    updateTerminalOutput(activeTerminalId, commandLine);

    try {
      // Parse command and arguments
      const [cmd, ...args] = command.trim().split(' ');
      
      // Handle built-in commands
      if (cmd === 'clear') {
        clearTerminal(activeTerminalId);
        return;
      }

      if (cmd === 'cd') {
        const newDir = args[0] || '/';
        updateTerminalDir(activeTerminalId, newDir);
        return;
      }

      // Execute command in WebContainer
      const process = await webContainer.spawn(cmd, args);
      
      // Update terminal with process reference
      setTerminals(prev => prev.map(t => 
        t.id === activeTerminalId ? { ...t, process } : t
      ));

      // Handle output
      process.output.pipeTo(new WritableStream({
        write(data) {
          const output = data.toString();
          updateTerminalOutput(activeTerminalId, output);
        }
      }));

      // Handle process completion
      const exitCode = await process.exit;
      
      if (exitCode === 0) {
        updateTerminalOutput(activeTerminalId, '');
      } else {
        updateTerminalOutput(activeTerminalId, `Process exited with code ${exitCode}`);
      }

    } catch (error) {
      updateTerminalOutput(activeTerminalId, `Error: ${error}`);
    }

    // Clear input
    setCurrentInput('');
    
    // Callback for external handling
    if (onExecuteCommand) {
      onExecuteCommand(command);
    }
  };

  const updateTerminalOutput = (terminalId: string, output: string) => {
    setTerminals(prev => prev.map(t => 
      t.id === terminalId 
        ? { ...t, output: [...t.output, output] }
        : t
    ));
  };

  const updateTerminalDir = (terminalId: string, dir: string) => {
    setTerminals(prev => prev.map(t => 
      t.id === terminalId 
        ? { ...t, currentDir: dir }
        : t
    ));
  };

  const clearTerminal = (terminalId: string) => {
    setTerminals(prev => prev.map(t => 
      t.id === terminalId 
        ? { ...t, output: [] }
        : t
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const activeTerminal = terminals.find(t => t.id === activeTerminalId);

  if (terminals.length === 0) {
    return null;
  }

  return (
    <div className={`bg-[#1a1a1a] border-t border-gray-800 flex flex-col transition-all duration-200 ${
      isMinimized ? 'h-10' : 'h-80'
    }`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a] border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">Terminal</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={createNewTerminal}
            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
            title="New Terminal"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Terminal Tabs */}
          {terminals.length > 1 && (
            <div className="flex bg-[#1a1a1a] border-b border-gray-700">
              {terminals.map((terminal) => (
                <div
                  key={terminal.id}
                  className={`flex items-center gap-2 px-3 py-1 cursor-pointer text-sm transition-colors ${
                    terminal.isActive 
                      ? 'bg-[#2a2a2a] text-white border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                  onClick={() => switchTerminal(terminal.id)}
                >
                  <span>{terminal.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTerminal(terminal.id);
                    }}
                    className="p-0.5 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Terminal Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Output Area */}
            <div 
              ref={outputRef}
              className="flex-1 overflow-y-auto p-3 font-mono text-sm bg-[#0a0a0a] text-gray-300"
              style={{ fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace" }}
            >
              {activeTerminal?.output.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2 p-3 bg-[#0a0a0a] border-t border-gray-700">
              <span className="text-green-400 font-mono text-sm">
                {activeTerminal?.currentDir || '/'} $
              </span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-gray-300 outline-none font-mono text-sm"
                placeholder="Type a command..."
                autoFocus
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}