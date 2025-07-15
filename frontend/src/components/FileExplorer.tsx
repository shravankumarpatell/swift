//FileExplorer.tsx
import React, { useState, useMemo } from 'react';
import { 
  FolderTree, 
  Folder, 
  FolderOpen, 
  File, 
  FileText, 
  Search, 
  ChevronRight, 
  ChevronDown,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit3
} from 'lucide-react';
import { FileItem } from '../types';

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
}

interface FileNodeProps {
  item: FileItem;
  depth: number;
  onFileClick: (file: FileItem) => void;
  searchTerm: string;
  selectedFile: FileItem | null;
}

function FileNode({ item, depth, onFileClick, searchTerm, selectedFile }: FileNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(item);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(!showContextMenu);
  };

  const getFileIcon = (fileName: string, isSelected: boolean) => {
    const iconClass = isSelected ? "w-4 h-4 text-blue-400" : "w-4 h-4 text-slate-200 group-hover:text-slate-50 transition-all duration-200";
    
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx') || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
      return <FileText className={iconClass} />;
    }
    if (fileName.endsWith('.json')) {
      return <FileText className={iconClass} />;
    }
    if (fileName.endsWith('.css') || fileName.endsWith('.scss')) {
      return <FileText className={iconClass} />;
    }
    if (fileName.endsWith('.html')) {
      return <FileText className={iconClass} />;
    }
    if (fileName.endsWith('.md')) {
      return <FileText className={iconClass} />;
    }
    return <File className={iconClass} />;
  };

  const isVisible = useMemo(() => {
    if (!searchTerm) return true;
    return item.name.toLowerCase().includes(searchTerm.toLowerCase());
  }, [item.name, searchTerm]);

  // Sort children: folders first, then files, both alphabetically
  const sortedChildren = useMemo(() => {
    if (!item.children) return [];
    
    return [...item.children].sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [item.children]);

  if (!isVisible) return null;

  const isSelected = selectedFile && item.type === 'file' && selectedFile.path === item.path;

  return (
    <div className="select-none">
      <div
        className={`group flex items-center gap-1 py-1 px-2 cursor-pointer transition-all duration-200 relative text-sm ${
          isSelected 
            ? 'bg-blue-500/20 hover:bg-blue-500/30' 
            : 'hover:bg-slate-600/50'
        }`}
        style={{ paddingLeft: `${depth * 1.2 + 0.5}rem` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse arrow for folders */}
        {item.type === 'folder' ? (
          <span className="text-slate-400 group-hover:text-slate-50 transition-all duration-200 flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}
        
        {/* File/folder icon */}
        <span className="flex-shrink-0">
          {item.type === 'folder' ? (
            isExpanded ? (
              <FolderOpen className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-blue-400 group-hover:text-slate-50'}`} />
            ) : (
              <Folder className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-blue-400 group-hover:text-slate-50'}`} />
            )
          ) : (
            getFileIcon(item.name, isSelected)
          )}
        </span>
        
        {/* File/folder name */}
        <span className={`flex-1 truncate font-medium transition-all duration-200 ${
          isSelected ? 'text-blue-400' : 'text-slate-200 group-hover:text-slate-50'
        }`}>
          {item.name}
        </span>
      </div>
      
      {/* Child items */}
      {item.type === 'folder' && isExpanded && sortedChildren.length > 0 && (
        <div className="transition-all duration-200 ease-in-out">
          {sortedChildren.map((child, index) => (
            <FileNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              searchTerm={searchTerm}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, onFileSelect }: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
    onFileSelect(file);
  };

  // Sort root level files: folders first, then files, both alphabetically
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [files]);

  return (
    <div className='h-full flex flex-col'> 
      {/* File tree - Scrollable area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-dark">
        {sortedFiles.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FolderTree className="w-8 h-8 mx-auto mb-2" />
            <p>No files found</p>
          </div>
        ) : (
          sortedFiles.map((file, index) => (
            <FileNode
              key={`${file.path}-${index}`}
              item={file}
              depth={0}
              onFileClick={handleFileClick}
              searchTerm={searchTerm}
              selectedFile={selectedFile}
            />
          ))
        )}
      </div>
    </div>
  );
}