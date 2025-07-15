import { Step, StepType } from './types';

// /*
//  * Parse input XML and convert it into steps.
//  * Eg: Input - 
//  * <boltArtifact id=\"project-import\" title=\"Project Files\">
//  *  <boltAction type=\"file\" filePath=\"eslint.config.js\">
//  *      import js from '@eslint/js';\nimport globals from 'globals';\n
//  *  </boltAction>
//  * <boltAction type="shell">
//  *      node index.js
//  * </boltAction>
//  * </boltArtifact>
//  * 
//  * Output - 
//  * [{
//  *      title: "Project Files",
//  *      status: "Pending"
//  * }, {
//  *      title: "Create eslint.config.js",
//  *      type: StepType.CreateFile,
//  *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
//  * }, {
//  *      title: "Run command",
//  *      code: "node index.js",
//  *      type: StepType.RunScript
//  * }]
//  * 
//  * The input can have strings in the middle they need to be ignored
//  */
// export function parseXml(response: string): Step[] {
//     // Extract the XML content between <boltArtifact> tags
//     const xmlMatch = response.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);
    
//     if (!xmlMatch) {
//       return [];
//     }
  
//     const xmlContent = xmlMatch[1];
//     const steps: Step[] = [];
//     let stepId = 1;
  
//     // Extract artifact title
//     const titleMatch = response.match(/title="([^"]*)"/);
//     const artifactTitle = titleMatch ? titleMatch[1] : 'Project Files';
  
//     // Add initial artifact step
//     steps.push({
//       id: stepId++,
//       title: artifactTitle,
//       description: '',
//       type: StepType.CreateFolder,
//       status: 'pending'
//     });
  
//     // Regular expression to find boltAction elements
//     const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)<\/boltAction>/g;
    
//     let match;
//     while ((match = actionRegex.exec(xmlContent)) !== null) {
//       const [, type, filePath, content] = match;
  
//       if (type === 'file') {
//         // File creation step
//         steps.push({
//           id: stepId++,
//           title: `Create ${filePath || 'file'}`,
//           description: '',
//           type: StepType.CreateFile,
//           status: 'pending',
//           code: content.trim(),
//           path: filePath
//         });
//       } else if (type === 'shell') {
//         // Shell command step
//         steps.push({
//           id: stepId++,
//           title: 'Run command',
//           description: '',
//           type: StepType.RunScript,
//           status: 'pending',
//           code: content.trim()
//         });
//       }
//     }
  
//     return steps;
//   }

// steps.ts - XML Parser and Step Types

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileItem[];
}


export interface Terminal {
  id: string;
  title: string;
  isActive: boolean;
  output: string;
  process?: any;
}


// export interface Step {
//   id: number;
//   title: string;
//   description: string;
//   status: 'pending' | 'in-progress' | 'completed' | 'error';
//   type: StepType;
//   path?: string;
//   code?: string;
//   command?: string;
//   timestamp?: Date;
// }

// export enum StepType {
//   CreateFile = 'create_file',
//   EditFile = 'edit_file',
//   CreateFolder = 'create_folder',
//   ExecuteCommand = 'ExecuteCommand',
//   RunCommand = 'run_command',
//   InstallPackage = 'install_package',
//   DeleteFile = 'delete_file',
//   MoveFile = 'move_file'
// }

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  steps?: Step[];
  isStreaming?: boolean;
}

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

  // Parse shell commands
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
    default:
      return '🔧';
  }
}