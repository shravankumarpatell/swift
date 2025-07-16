import React, { Dispatch, SetStateAction, useState, useRef, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';
import { ChevronDown, Terminal as TerminalIcon, Plus, X, Maximize2, Minimize2, Zap, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TerminalProps {
  webContainer: WebContainer | null;
  commandQueue: { id: number; command: string }[];
  onCommandStart: (commandId: number) => void;
  onCommandComplete: (commandId: number) => void;
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

interface CommandExecution {
  id: number;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output: string[];
  startTime?: Date;
  endTime?: Date;
}

export function Terminal({ 
  webContainer, 
  commandQueue, 
  onCommandStart, 
  onCommandComplete,
  showTerminal,
  setShowTerminal 
}: TerminalProps) {
  const [terminals, setTerminals] = useState<TerminalSession[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandExecutions, setCommandExecutions] = useState<CommandExecution[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Process command queue
  useEffect(() => {
    if (commandQueue.length > 0 && webContainer) {
      commandQueue.forEach(queueItem => {
        const existingExecution = commandExecutions.find(exec => exec.id === queueItem.id);
        if (!existingExecution) {
          const newExecution: CommandExecution = {
            id: queueItem.id,
            command: queueItem.command,
            status: 'pending',
            output: [],
            startTime: new Date()
          };
          setCommandExecutions(prev => [...prev, newExecution]);
          executeQueuedCommand(queueItem.id, queueItem.command);
        }
      });
    }
  }, [commandQueue, webContainer]);

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
  }, [commandExecutions, terminals]);

  const createNewTerminal = () => {
    const newTerminal: TerminalSession = {
      id: `terminal-${Date.now()}`,
      name: `Bolt Terminal`,
      output: [
        'Terminal initialized'
      ],
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

  const executeQueuedCommand = async (commandId: number, command: string) => {
    if (!webContainer) return;

    // Update command status to running
    setCommandExecutions(prev => prev.map(exec => 
      exec.id === commandId 
        ? { ...exec, status: 'running', startTime: new Date() }
        : exec
    ));

    onCommandStart(commandId);

    try {
      // Add command to terminal output
      const commandLine = `Executing: ${command}`;
      updateTerminalOutput(activeTerminalId, commandLine);
      
      // Update command execution output
      setCommandExecutions(prev => prev.map(exec => 
        exec.id === commandId 
          ? { ...exec, output: [...exec.output, commandLine] }
          : exec
      ));

      // Parse command and arguments
      const [cmd, ...args] = command.trim().split(' ');
      
      // Execute command in WebContainer
      const process = await webContainer.spawn(cmd, args);
      
      // Handle output
      let outputBuffer = '';
      process.output.pipeTo(new WritableStream({
        write(data) {
          const output = data.toString();
          outputBuffer += output;
          
          // Update terminal output
          updateTerminalOutput(activeTerminalId, output);
          
          // Update command execution output
          setCommandExecutions(prev => prev.map(exec => 
            exec.id === commandId 
              ? { ...exec, output: [...exec.output, output] }
              : exec
          ));
        }
      }));

      // Handle process completion
      const exitCode = await process.exit;
      
      const completionMessage = exitCode === 0 
        ? `✅ Command completed successfully` 
        : `❌ Command failed with exit code ${exitCode}`;
      
      updateTerminalOutput(activeTerminalId, completionMessage);
      updateTerminalOutput(activeTerminalId, '');

      // Update command execution status
      setCommandExecutions(prev => prev.map(exec => 
        exec.id === commandId 
          ? { 
              ...exec, 
              status: exitCode === 0 ? 'completed' : 'error',
              endTime: new Date(),
              output: [...exec.output, completionMessage]
            }
          : exec
      ));

      onCommandComplete(commandId);

    } catch (error) {
      const errorMessage = `❌ Error: ${error}`;
      updateTerminalOutput(activeTerminalId, errorMessage);
      
      setCommandExecutions(prev => prev.map(exec => 
        exec.id === commandId 
          ? { 
              ...exec, 
              status: 'error',
              endTime: new Date(),
              output: [...exec.output, errorMessage]
            }
          : exec
      ));

      onCommandComplete(commandId);
    }
  };

  const executeCommand = async (command: string) => {
    if (!webContainer || !command.trim()) return;

    const activeTerminal = terminals.find(t => t.id === activeTerminalId);
    if (!activeTerminal) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add command to output
    const commandLine = `👤 $ ${command}`;
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
        updateTerminalOutput(activeTerminalId, '✅ Command completed');
      } else {
        updateTerminalOutput(activeTerminalId, `❌ Process exited with code ${exitCode}`);
      }

    } catch (error) {
      updateTerminalOutput(activeTerminalId, `❌ Error: ${error}`);
    }

    // Clear input
    setCurrentInput('');
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

  const getStatusIcon = (status: CommandExecution['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'running':
        return <Clock className="w-4 h-4 text-orange-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Play className="w-4 h-4 text-gray-400" />;
    }
  };

  const activeTerminal = terminals.find(t => t.id === activeTerminalId);

  if (terminals.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0C0c0c]">
        <div className="text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <p className="text-gray-400 text-sm">Initializing Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0c0c0c]">
      {/* Command Queue Status */}
      {commandExecutions.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-800/30 bg-[#1A1C24]/50">
          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
            {commandExecutions.slice(-3).map((execution) => (
              <div
                key={execution.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                  execution.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : execution.status === 'running'
                    ? 'bg-orange-500/20 text-orange-400'
                    : execution.status === 'error'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {getStatusIcon(execution.status)}
                <span className="font-mono truncate max-w-32">{execution.command}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terminal Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Output Area */}
        <div 
          ref={outputRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#0C0c0c] text-gray-300 leading-relaxed"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace" }}
        >
          {activeTerminal?.output.map((line, index) => (
            <div 
              key={index} 
              className={`whitespace-pre-wrap mb-1 ${
                line.includes('Executing:') ? 'text-orange-400 font-medium' :
                line.includes('✅') ? 'text-green-400' :
                line.includes('❌') ? 'text-red-400' :
                line.includes('💻 $') ? 'text-blue-400' :
                line.includes('🚀') || line.includes('💡') ? 'text-purple-400' :
                'text-gray-300'
              }`}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 bg-[#101010]/50 border-t border-gray-800/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-orange-400 font-mono text-sm font-medium">
                {activeTerminal?.currentDir || '/'} 
              </span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-gray-300 outline-none font-mono text-sm placeholder-gray-500"
              placeholder="Enter command..."
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
}