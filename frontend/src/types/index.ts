
export interface Step {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  type: StepType;
  path?: string;
  code?: string;
  command?: string;
  timestamp?: Date;
}

export enum StepType {
  CreateFile = 'create_file',
  EditFile = 'edit_file',
  CreateFolder = 'create_folder',
  RunCommand = 'run_command',
  InstallPackage = 'install_package',
  DeleteFile = 'delete_file',
  MoveFile = 'move_file',
  ExecuteCommand = 'execute_command',
  RunScript = 'run_script'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  steps?: Step[];
  isStreaming?: boolean;
}

// File system related types
export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  content?: string;
  path: string;
}

export interface FileViewerProps {
  file: FileItem | null;
  onClose: () => void;
}

// Chat component props
export interface ChatInputProps {
  userPrompt: string;
  setPrompt: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  placeholder?: string;
  maxLength?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

export interface ChatHistoryProps {
  messages: ChatMessage[];
  onStepClick?: (stepId: number) => void;
  currentStep?: number;
  isLoading?: boolean;
}

export interface MessageComponentProps {
  message: ChatMessage;
  onStepClick?: (stepId: number) => void;
  currentStep?: number;
  isLatest?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onCopy?: (content: string) => void;
  onRetry?: (messageId: string) => void;
}

// Step related props
export interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  showProgress?: boolean;
  allowReorder?: boolean;
}

export interface StepItemProps {
  step: Step;
  isActive: boolean;
  onClick: () => void;
  showProgress?: boolean;
  allowEdit?: boolean;
  onEdit?: (stepId: number) => void;
  onDelete?: (stepId: number) => void;
}

// Enhanced input states and handlers
export interface ChatInputState {
  value: string;
  isFocused: boolean;
  isComposing: boolean;
  characterCount: number;
  lineCount: number;
  hasError: boolean;
  errorMessage?: string;
}

export interface ChatInputHandlers {
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onClear: () => void;
}

// Builder component props
export interface BuilderProps {
  initialPrompt?: string;
  onProjectChange?: (project: Project) => void;
  theme?: 'dark' | 'light';
  enableFileViewer?: boolean;
  enableStepNavigation?: boolean;
  maxMessages?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  prompt: string;
  messages: ChatMessage[];
  steps: Step[];
  files: FileItem[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'error';
}

// API related types
export interface ChatResponse {
  response: string;
  steps?: Step[];
  files?: FileItem[];
  error?: string;
}

export interface TemplateResponse {
  prompts: string[];
  uiPrompts: string[];
  type: 'node' | 'react';
}

// Utility types for parsing
export interface ParsedXmlContent {
  steps: Step[];
  files: FileItem[];
  messages: string[];
}

export interface XmlParseOptions {
  includeComments?: boolean;
  preserveWhitespace?: boolean;
  extractMetadata?: boolean;
}

// Theme and styling types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
}

// Animation and transition types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface TransitionProps {
  show: boolean;
  duration?: number;
  children: React.ReactNode;
}

// Error handling types
export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorCode?: string;
  retryable?: boolean;
}

export interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}

// Keyboard shortcuts and accessibility
export interface KeyboardShortcut {
  key: string;
  modifier?: 'ctrl' | 'cmd' | 'alt' | 'shift';
  action: () => void;
  description: string;
}

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  role?: string;
  tabIndex?: number;
}

// Utility functions return types
export type ParseXmlResult = Step[];
export type FormatMessageResult = string;
export type StepStatusIcon = string;
export type StepTypeIcon = string;

// Event handler types
export type StepClickHandler = (stepId: number) => void;
export type MessageClickHandler = (messageId: string) => void;
export type FileClickHandler = (file: FileItem) => void;
export type ErrorHandler = (error: Error) => void;
export type RetryHandler = (messageId: string) => void;
export type CopyHandler = (content: string) => void;

// Parse XML response from LLM to extract steps
export function parseXml(xmlContent: string): Step[] {
  const steps: Step[] = [];
  let stepId = 1;

  // Parse boltArtifact tags
  const artifactRegex = /<boltArtifact[^>]*>(.*?)<\/boltArtifact>/gs;
  const artifactMatches = xmlContent.match(artifactRegex);

  if (artifactMatches) {
    artifactMatches.forEach(artifactMatch => {
      // Parse boltAction tags within artifact
      const actionRegex = /<boltAction\s+type="([^"]+)"\s+filePath="([^"]+)"[^>]*>(.*?)<\/boltAction>/gs;
      let actionMatch;

      while ((actionMatch = actionRegex.exec(artifactMatch)) !== null) {
        const [, type, filePath, content] = actionMatch;
        
        steps.push({
          id: stepId++,
          title: getStepTitle(type, filePath),
          description: getStepDescription(type, filePath),
          status: 'pending',
          type: mapActionTypeToStepType(type),
          path: filePath,
          code: content.trim(),
          timestamp: new Date()
        });
      }
    });
  }

  // Parse shell commands (legacy boltAction shell type)
  const shellRegex = /<boltAction\s+type="shell"[^>]*>(.*?)<\/boltAction>/gs;
  let shellMatch;

  while ((shellMatch = shellRegex.exec(xmlContent)) !== null) {
    const [, command] = shellMatch;
    
    steps.push({
      id: stepId++,
      title: `Run Command`,
      description: `Execute: ${command.trim()}`,
      status: 'pending',
      type: StepType.RunCommand,
      command: command.trim(),
      timestamp: new Date()
    });
  }

  // Parse execute tags for terminal commands
  const executeRegex = /<execute[^>]*>(.*?)<\/execute>/gs;
  let executeMatch;

  while ((executeMatch = executeRegex.exec(xmlContent)) !== null) {
    const [, executeContent] = executeMatch;
    
    // Extract command from <command> tags within <execute>
    const commandRegex = /<command[^>]*>(.*?)<\/command>/gs;
    let commandMatch;

    while ((commandMatch = commandRegex.exec(executeContent)) !== null) {
      const [, command] = commandMatch;
      const cleanCommand = command.trim();
      
      if (cleanCommand) {
        steps.push({
          id: stepId++,
          title: `Execute Command`,
          description: `Run: ${cleanCommand}`,
          status: 'pending',
          type: StepType.ExecuteCommand,
          command: cleanCommand,
          timestamp: new Date()
        });
      }
    }
  }

  return steps;
}

function mapActionTypeToStepType(actionType: string): StepType {
  switch (actionType) {
    case 'file':
      return StepType.CreateFile;
    case 'shell':
      return StepType.RunCommand;
    default:
      return StepType.CreateFile;
  }
}

function getStepTitle(type: string, filePath: string): string {
  switch (type) {
    case 'file':
      return `Create ${filePath}`;
    case 'shell':
      return 'Run Command';
    default:
      return `Process ${filePath}`;
  }
}

function getStepDescription(type: string, filePath: string): string {
  switch (type) {
    case 'file':
      return `Creating file: ${filePath}`;
    case 'shell':
      return `Executing shell command`;
    default:
      return `Processing: ${filePath}`;
  }
}

// Format message content for display
export function formatMessageContent(content: string): string {
  // Remove XML tags for display
  return content
    .replace(/<boltArtifact[^>]*>.*?<\/boltArtifact>/gs, '')
    .replace(/<boltAction[^>]*>.*?<\/boltAction>/gs, '')
    .replace(/<execute[^>]*>.*?<\/execute>/gs, '')
    .trim();
}

// Generate step status icon
export function getStepStatusIcon(status: Step['status']): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in-progress':
      return '⏳';
    case 'error':
      return '❌';
    default:
      return '⏸️';
  }
}

// Generate step type icon
export function getStepTypeIcon(type: StepType): string {
  switch (type) {
    case StepType.CreateFile:
      return '📄';
    case StepType.EditFile:
      return '✏️';
    case StepType.CreateFolder:
      return '📁';
    case StepType.RunCommand:
      return '⚡';
    case StepType.InstallPackage:
      return '📦';
    case StepType.DeleteFile:
      return '🗑️';
    case StepType.MoveFile:
      return '🔄';
    case StepType.ExecuteCommand:
      return '💻';
    default:
      return '🔧';
  }
}