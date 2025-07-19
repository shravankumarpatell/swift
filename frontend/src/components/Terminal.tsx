//Terminal.ts
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

  // Clean ANSI escape sequences from terminal output
  const cleanAnsiOutput = (text: string): string => {
    // Remove ANSI escape sequences
    return text
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // Remove ANSI escape codes
      .replace(/\[1G/g, '') // Remove cursor positioning
      .replace(/\[0K/g, '') // Remove line clearing
      .replace(/\[K/g, '') // Remove line clearing
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n') // Convert carriage returns to newlines
      .split('\n')
      .filter(line => line.trim() !== '' || line === '') // Keep empty lines but remove whitespace-only lines
      .join('\n');
  };

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

  const createNewTerminal = async () => {
    if (!webContainer) return;

    // Get current working directory
    let currentDir = '/';
    try {
      const pwdProcess = await webContainer.spawn('pwd', []);
      pwdProcess.output.pipeTo(new WritableStream({
        write(data) {
          currentDir = data.toString().trim();
        }
      }));
      await pwdProcess.exit;
    } catch (error) {
      // Default to root if pwd fails
      currentDir = '/';
    }

    const newTerminal: TerminalSession = {
      id: `terminal-${Date.now()}`,
      name: `Bolt Terminal`,
      output: [
        'Terminal initialized',
        `Current directory: ${currentDir}`
      ],
      currentDir,
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
      // Add command to terminal output
      const commandLine = `$ ${command}`;
      updateTerminalOutput(activeTerminalId, commandLine);
      
      // Update command execution output
      setCommandExecutions(prev => prev.map(exec => 
        exec.id === commandId 
          ? { ...exec, output: [...exec.output, commandLine] }
          : exec
      ));

      // Parse command and arguments
      const [cmd, ...args] = command.trim().split(' ');
      
      // Get current directory from active terminal
      const activeTerminal = terminals.find(t => t.id === activeTerminalId);
      const cwd = activeTerminal?.currentDir || '/';

      console.log(`Executing command: ${cmd} with args:`, args, 'in directory:', cwd);
      console.log('WebContainer instance:', webContainer);

      // Execute command in WebContainer with proper working directory
      let process;
      try {
        process = await webContainer.spawn(cmd, args, {
          cwd: cwd
        });
        console.log('Process spawned successfully:', process);
      } catch (spawnError) {
        console.error('Spawn error details:', spawnError);
        throw new Error(`Failed to spawn process: ${spawnError instanceof Error ? spawnError.message : String(spawnError)}`);
      }
      
      // Handle output with ANSI cleaning
      let outputBuffer = '';
      process.output.pipeTo(new WritableStream({
        write(data) {
          const rawOutput = data.toString();
          const cleanOutput = cleanAnsiOutput(rawOutput);
          
          if (cleanOutput.trim()) {
            outputBuffer += cleanOutput;
            
            // Split by lines and add each non-empty line
            const lines = cleanOutput.split('\n');
            lines.forEach(line => {
              if (line.trim() || line === '') {
                updateTerminalOutput(activeTerminalId, line);
                
                // Update command execution output
                setCommandExecutions(prev => prev.map(exec => 
                  exec.id === commandId 
                    ? { ...exec, output: [...exec.output, line] }
                    : exec
                ));
              }
            });
          }
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
      const errorMessage = `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
      updateTerminalOutput(activeTerminalId, errorMessage);
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

    // Add command to output (keep the command visible)
    const commandLine = `$ ${command}`;
    updateTerminalOutput(activeTerminalId, commandLine);

    try {
      // Parse command and arguments
      const [cmd, ...args] = command.trim().split(' ');
      
      // Handle built-in commands
      if (cmd === 'clear') {
        clearTerminal(activeTerminalId);
        setCurrentInput('');
        return;
      }

      if (cmd === 'cd') {
        const targetDir = args[0] || '/';
        await changeDirectory(activeTerminalId, targetDir);
        setCurrentInput('');
        return;
      }

      // Test command for debugging WebContainer
      if (cmd === 'test') {
        updateTerminalOutput(activeTerminalId, '🔍 Testing WebContainer...');
        try {
          const testProcess = await webContainer.spawn('echo', ['WebContainer is working!']);
          console.log('Test process created:', testProcess);
          
          testProcess.output.pipeTo(new WritableStream({
            write(data) {
              updateTerminalOutput(activeTerminalId, `✅ ${data.toString()}`);
            }
          }));
          
          const exitCode = await testProcess.exit;
          updateTerminalOutput(activeTerminalId, `Test completed with exit code: ${exitCode}`);
        } catch (testError) {
          console.error('Test error:', testError);
          updateTerminalOutput(activeTerminalId, `❌ Test failed: ${testError instanceof Error ? testError.message : String(testError)}`);
        }
        setCurrentInput('');
        return;
      }

      console.log(`Executing command: ${cmd} with args:`, args, 'in directory:', activeTerminal.currentDir);
      console.log('WebContainer instance:', webContainer);

      // Execute command in WebContainer with current working directory
      let process;
      try {
        process = await webContainer.spawn(cmd, args, {
          cwd: activeTerminal.currentDir
        });
        console.log('Process spawned successfully:', process);
      } catch (spawnError) {
        console.error('Spawn error details:', spawnError);
        throw new Error(`Failed to spawn process: ${spawnError instanceof Error ? spawnError.message : String(spawnError)}`);
      }
      
      // Update terminal with process reference
      setTerminals(prev => prev.map(t => 
        t.id === activeTerminalId ? { ...t, process } : t
      ));

      // Handle output with ANSI cleaning
      process.output.pipeTo(new WritableStream({
        write(data) {
          const rawOutput = data.toString();
          const cleanOutput = cleanAnsiOutput(rawOutput);
          
          if (cleanOutput.trim()) {
            // Split by lines and add each non-empty line
            const lines = cleanOutput.split('\n');
            lines.forEach(line => {
              if (line.trim() || line === '') {
                updateTerminalOutput(activeTerminalId, line);
              }
            });
          }
        }
      }));

      // Handle process completion
      const exitCode = await process.exit;
      
      if (exitCode === 0) {
        updateTerminalOutput(activeTerminalId, '');
      } else {
        updateTerminalOutput(activeTerminalId, `❌ Process exited with code ${exitCode}`);
        updateTerminalOutput(activeTerminalId, '');
      }

    } catch (error) {
      const errorMessage = `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
      updateTerminalOutput(activeTerminalId, errorMessage);
      updateTerminalOutput(activeTerminalId, '');
      console.error('Command execution error:', error);
    }

    // Clear input after command execution
    setCurrentInput('');
  };

  const changeDirectory = async (terminalId: string, targetDir: string) => {
    if (!webContainer) return;

    try {
      // Resolve the target directory
      const activeTerminal = terminals.find(t => t.id === terminalId);
      const currentDir = activeTerminal?.currentDir || '/';
      
      let newDir = targetDir;
      
      // Handle relative paths
      if (!targetDir.startsWith('/')) {
        if (targetDir === '..') {
          // Go up one directory
          const parts = currentDir.split('/').filter(p => p);
          parts.pop();
          newDir = '/' + parts.join('/');
          if (newDir === '/') newDir = '/';
        } else if (targetDir === '.') {
          newDir = currentDir;
        } else {
          // Relative path
          newDir = currentDir === '/' ? `/${targetDir}` : `${currentDir}/${targetDir}`;
        }
      }

      // Test if directory exists by trying to list it
      const testProcess = await webContainer.spawn('ls', ['-la', newDir]);
      const exitCode = await testProcess.exit;
      
      if (exitCode === 0) {
        updateTerminalDir(terminalId, newDir);
        updateTerminalOutput(terminalId, `Changed directory to: ${newDir}`);
      } else {
        updateTerminalOutput(terminalId, `❌ Directory not found: ${targetDir}`);
      }
    } catch (error) {
      const errorMessage = `❌ Error changing directory: ${error instanceof Error ? error.message : String(error)}`;
      updateTerminalOutput(terminalId, errorMessage);
      console.error('Directory change error:', error);
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
      e.preventDefault();
      executeCommand(currentInput);
      // Note: currentInput is cleared in executeCommand, not here
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
                line.includes('$') && (line.includes('Executing:') || line.startsWith('$ ')) ? 'text-blue-400 font-medium' :
                line.includes('✅') ? 'text-green-400' :
                line.includes('❌') ? 'text-red-400' :
                line.includes('Changed directory') ? 'text-cyan-400' :
                line.includes('Terminal initialized') || line.includes('Current directory') ? 'text-purple-400' :
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
              placeholder="Enter command..."
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
}