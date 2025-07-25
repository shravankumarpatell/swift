// components/Terminal.tsx
import React, { Dispatch, SetStateAction, useState, useRef, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';
import { ChevronDown, Terminal as TerminalIcon, Zap, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { WebContainerManager } from '../hooks/WebContainerManager';

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
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandExecutions, setCommandExecutions] = useState<CommandExecution[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const managerRef = useRef<WebContainerManager | null>(null);

  // Initialize WebContainer Manager
  useEffect(() => {
    managerRef.current = WebContainerManager.getInstance();
  }, []);

  // Clean ANSI escape sequences from terminal output
  const cleanAnsiOutput = (text: string): string => {
    return text
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\[1G/g, '')
      .replace(/\[0K/g, '')
      .replace(/\[K/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line, index, array) => {
        return line.trim() !== '' || (index > 0 && array[index - 1].trim() !== '');
      })
      .join('\n');
  };

  // Initialize terminal when WebContainer is ready
  useEffect(() => {
    if (webContainer && !isInitialized) {
      initializeTerminal();
      setIsInitialized(true);
    }
  }, [webContainer, isInitialized]);

  // Process command queue
  useEffect(() => {
    if (commandQueue.length > 0 && webContainer && managerRef.current) {
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

  // Scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminals]);

  const initializeTerminal = async () => {
    if (!webContainer || !managerRef.current) return;

    try {
      const newTerminal: TerminalSession = {
        id: `terminal-${Date.now()}`,
        name: 'Main Terminal',
        output: [
          '🚀 Terminal initialized and connected to WebContainer',
          '📁 Current directory: /',
          '💡 Type "help" for available commands or start typing any command',
          ''
        ],
        currentDir: '/',
        isActive: true,
      };

      setTerminals([newTerminal]);
      setActiveTerminalId(newTerminal.id);
      
      // Show current directory contents
      await showDirectoryContents(newTerminal.id, '/');
    } catch (error) {
      console.error('Error initializing terminal:', error);
      
      const errorTerminal: TerminalSession = {
        id: `terminal-${Date.now()}`,
        name: 'Main Terminal',
        output: [
          '❌ Terminal initialization failed',
          `Error: ${error instanceof Error ? error.message : String(error)}`,
          'Falling back to basic terminal mode',
          ''
        ],
        currentDir: '/',
        isActive: true,
      };

      setTerminals([errorTerminal]);
      setActiveTerminalId(errorTerminal.id);
    }
  };

  const executeQueuedCommand = async (commandId: number, command: string) => {
    if (!webContainer) {
      console.error('WebContainer not available');
      setCommandExecutions(prev => prev.map(exec => 
        exec.id === commandId 
          ? { ...exec, status: 'error', endTime: new Date(), output: ['❌ WebContainer not available'] }
          : exec
      ));
      return;
    }

    // Update command status to running
    setCommandExecutions(prev => prev.map(exec => 
      exec.id === commandId 
        ? { ...exec, status: 'running', startTime: new Date() }
        : exec
    ));

    onCommandStart(commandId);

    try {
      const activeTerminal = terminals.find(t => t.id === activeTerminalId) || terminals[0];
      const cwd = activeTerminal?.currentDir || '/';

      // Add command to terminal output
      const commandLine = `$ ${command}`;
      updateTerminalOutput(activeTerminalId, commandLine);
      
      // Parse command and arguments
      const [cmd, ...args] = command.trim().split(/\s+/);
      
      console.log(`[Queue] Executing: ${cmd} ${args.join(' ')} in ${cwd}`);

      // Execute command directly with WebContainer
      const process = await webContainer.spawn(cmd, args, { cwd });
      
      // Collect output
      let outputText = '';
      process.output.pipeTo(new WritableStream({
        write(data) {
          outputText += data;
          updateTerminalOutput(activeTerminalId, data);
        }
      })).catch(console.error);

      // Wait for completion
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
              output: [...exec.output, outputText, completionMessage]
            }
          : exec
      ));

      onCommandComplete(commandId);

    } catch (error) {
      const errorMessage = `❌ Command error: ${getErrorMessage(error)}`;
      updateTerminalOutput(activeTerminalId, errorMessage);
      updateTerminalOutput(activeTerminalId, '');
      console.error('Command execution error:', error);
      
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
    const commandLine = `$ ${command}`;
    updateTerminalOutput(activeTerminalId, commandLine);

    try {
      // Parse command and arguments
      const [cmd, ...args] = command.trim().split(/\s+/);
      
      // Handle built-in commands
      if (cmd === 'clear') {
        clearTerminal(activeTerminalId);
        setCurrentInput('');
        return;
      }

      if (cmd === 'help') {
        showHelp(activeTerminalId);
        setCurrentInput('');
        return;
      }

      if (cmd === 'pwd') {
        updateTerminalOutput(activeTerminalId, activeTerminal.currentDir);
        updateTerminalOutput(activeTerminalId, '');
        setCurrentInput('');
        return;
      }

      if (cmd === 'cd') {
        const targetDir = args[0] || '/';
        await changeDirectory(activeTerminalId, targetDir);
        setCurrentInput('');
        return;
      }

      if (cmd === 'ls' && args.length === 0) {
        await listCurrentDirectory(activeTerminalId);
        setCurrentInput('');
        return;
      }

      console.log(`[User] Executing: ${cmd} ${args.join(' ')} in ${activeTerminal.currentDir}`);

      // Execute command directly with WebContainer
      const process = await webContainer.spawn(cmd, args, { 
        cwd: activeTerminal.currentDir 
      });
      
      // Handle real-time output
      process.output.pipeTo(new WritableStream({
        write(data) {
          const cleanOutput = cleanAnsiOutput(data);
          if (cleanOutput.trim()) {
            const lines = cleanOutput.split('\n');
            lines.forEach(line => {
              if (line.trim() || line === '') {
                updateTerminalOutput(activeTerminalId, line);
              }
            });
          }
        }
      })).catch(console.error);

      // Wait for completion
      const exitCode = await process.exit;
      
      if (exitCode !== 0) {
        updateTerminalOutput(activeTerminalId, `❌ Process exited with code ${exitCode}`);
      }
      updateTerminalOutput(activeTerminalId, '');

    } catch (error) {
      const errorMessage = `❌ Command error: ${getErrorMessage(error)}`;
      updateTerminalOutput(activeTerminalId, errorMessage);
      updateTerminalOutput(activeTerminalId, '');
      console.error('Command execution error:', error);
    }

    setCurrentInput('');
  };

  const changeDirectory = async (terminalId: string, targetDir: string) => {
    if (!webContainer) return;

    try {
      const activeTerminal = terminals.find(t => t.id === terminalId);
      const currentDir = activeTerminal?.currentDir || '/';
      
      let newDir = targetDir;
      
      // Handle relative paths
      if (!targetDir.startsWith('/')) {
        if (targetDir === '..') {
          const parts = currentDir.split('/').filter(p => p);
          parts.pop();
          newDir = parts.length > 0 ? '/' + parts.join('/') : '/';
        } else if (targetDir === '.') {
          newDir = currentDir;
        } else {
          // Relative path - resolve it properly
          if (currentDir === '/') {
            newDir = `/${targetDir}`;
          } else {
            newDir = `${currentDir}/${targetDir}`;
          }
        }
      }

      // Normalize the path
      newDir = newDir.replace(/\/+/g, '/');
      if (newDir !== '/' && newDir.endsWith('/')) {
        newDir = newDir.slice(0, -1);
      }

      console.log(`Attempting to change directory from ${currentDir} to ${newDir}`);

      // Check if directory exists by trying to list it
      try {
        const process = await webContainer.spawn('ls', ['-la', newDir]);
        const exitCode = await process.exit;
        
        if (exitCode === 0) {
          updateTerminalDir(terminalId, newDir);
          updateTerminalOutput(terminalId, `📁 Changed directory to: ${newDir}`);
          await listCurrentDirectory(terminalId);
        } else {
          updateTerminalOutput(terminalId, `❌ Directory not found: ${targetDir}`);
          updateTerminalOutput(terminalId, '');
        }
      } catch (error) {
        updateTerminalOutput(terminalId, `❌ Directory not found: ${targetDir}`);
        updateTerminalOutput(terminalId, '');
      }
    } catch (error) {
      const errorMessage = `❌ Error changing directory: ${getErrorMessage(error)}`;
      updateTerminalOutput(terminalId, errorMessage);
      updateTerminalOutput(terminalId, '');
      console.error('Directory change error:', error);
    }
  };

  const listCurrentDirectory = async (terminalId: string) => {
    if (!webContainer) return;

    try {
      const activeTerminal = terminals.find(t => t.id === terminalId);
      const currentDir = activeTerminal?.currentDir || '/';
      
      const process = await webContainer.spawn('ls', ['-la', currentDir]);
      
      updateTerminalOutput(terminalId, '📂 Directory contents:');
      
      process.output.pipeTo(new WritableStream({
        write(data) {
          const lines = data.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            updateTerminalOutput(terminalId, `  ${line}`);
          });
        }
      })).catch(console.error);
      
      await process.exit;
      updateTerminalOutput(terminalId, '');
    } catch (error) {
      updateTerminalOutput(terminalId, `❌ Could not list directory: ${getErrorMessage(error)}`);
      updateTerminalOutput(terminalId, '');
    }
  };

  const showDirectoryContents = async (terminalId: string, directory: string) => {
    await listCurrentDirectory(terminalId);
  };

  const showHelp = (terminalId: string) => {
    const helpText = [
      '🔧 Available Commands:',
      '  help          - Show this help message',
      '  clear         - Clear terminal output',
      '  pwd           - Print current directory',
      '  cd <dir>      - Change directory',
      '  ls            - List directory contents',
      '  npm install   - Install dependencies',
      '  npm run dev   - Start development server',
      '  npm run build - Build project',
      '  node <file>   - Run node script',
      '  + Any other shell command available in the environment',
      ''
    ];
    
    helpText.forEach(line => updateTerminalOutput(terminalId, line));
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
        ? { ...t, output: ['🚀 Terminal cleared'] }
        : t
    ));
  };

  const getErrorMessage = (error: any): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      return JSON.stringify(error);
    }
    return String(error);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // TODO: Implement tab completion
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

  if (!webContainer || !isInitialized || terminals.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0C0c0c]">
        <div className="text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <p className="text-gray-400 text-sm">
            {!webContainer ? 'Waiting for WebContainer...' : 'Initializing Terminal...'}
          </p>
          <p className="text-gray-500 text-xs mt-2">This may take a moment</p>
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
                line.includes('$') && line.startsWith('$ ') ? 'text-blue-400 font-medium' :
                line.includes('✅') ? 'text-green-400' :
                line.includes('❌') ? 'text-red-400' :
                line.includes('📁') || line.includes('📂') ? 'text-cyan-400' :
                line.includes('🚀') || line.includes('💡') ? 'text-purple-400' :
                line.includes('🔧') ? 'text-yellow-400' :
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
                {activeTerminal?.currentDir || '/'} $ 
              </span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-gray-300 outline-none font-mono text-sm placeholder-gray-500"
              placeholder="Enter command... (type 'help' for available commands)"
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
}