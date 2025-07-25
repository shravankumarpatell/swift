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
import { useDarkMode } from '../contexts/DarkModeContext';

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
  const { isDarkMode } = useDarkMode();

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
    const baseClass = "w-4 h-4 group-hover:text-slate-50 transition-all duration-200";
    const iconClass = isSelected 
      ? `${baseClass} text-purple-400` 
      : isDarkMode 
        ? `${baseClass} text-slate-200`
        : `${baseClass} text-gray-600`;
    
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

  const themeClasses = {
    itemContainer: isDarkMode
      ? `group flex items-center gap-1 py-1 px-2 cursor-pointer transition-all duration-200 relative text-sm ${
          isSelected 
            ? 'bg-purple-500/20 hover:bg-purple-500/30' 
            : 'hover:bg-slate-600/50'
        }`
      : `group flex items-center gap-1 py-1 px-2 cursor-pointer transition-all duration-200 relative text-sm ${
          isSelected 
            ? 'bg-purple-100 hover:bg-purple-200/70' 
            : 'hover:bg-gray-100'
        }`,
    expandIcon: isDarkMode
      ? "text-slate-400 group-hover:text-slate-50 transition-all duration-200 flex-shrink-0"
      : "text-gray-500 group-hover:text-gray-700 transition-all duration-200 flex-shrink-0",
    folderIcon: isSelected 
      ? 'text-purple-400' 
      : isDarkMode 
        ? 'text-purple-400 group-hover:text-slate-50'
        : 'text-purple-500 group-hover:text-purple-600',
    fileName: isSelected 
      ? 'text-purple-400' 
      : isDarkMode 
        ? 'text-slate-200 group-hover:text-slate-50'
        : 'text-gray-800 group-hover:text-gray-900'
  };

  return (
    <div className="select-none">
      <div
        className={themeClasses.itemContainer}
        style={{ paddingLeft: `${depth * 1.2 + 0.5}rem` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse arrow for folders */}
        {item.type === 'folder' ? (
          <span className={themeClasses.expandIcon}>
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
              <FolderOpen className={`w-4 h-4 ${themeClasses.folderIcon}`} />
            ) : (
              <Folder className={`w-4 h-4 ${themeClasses.folderIcon}`} />
            )
          ) : (
            getFileIcon(item.name, isSelected)
          )}
        </span>
        
        {/* File/folder name */}
        <span className={`flex-1 truncate font-medium transition-all duration-200 ${themeClasses.fileName}`}>
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
  const { isDarkMode } = useDarkMode();

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

  const themeClasses = {
    container: 'h-full flex flex-col',
    emptyState: isDarkMode
      ? "text-center py-8 text-slate-400"
      : "text-center py-8 text-gray-500",
    emptyStateIcon: isDarkMode 
      ? "w-8 h-8 mx-auto mb-2 text-slate-500" 
      : "w-8 h-8 mx-auto mb-2 text-gray-400",
    emptyStateText: isDarkMode ? "text-slate-400" : "text-gray-500",
    scrollArea: isDarkMode 
      ? "flex-1 overflow-y-auto overflow-x-hidden scrollbar-dark"
      : "flex-1 overflow-y-auto overflow-x-hidden"
  };

  return (
    <div className={themeClasses.container}> 
      {/* File tree - Scrollable area */}
      <div className={themeClasses.scrollArea}>
        {sortedFiles.length === 0 ? (
          <div className={themeClasses.emptyState}>
            <FolderTree className={themeClasses.emptyStateIcon} />
            <p className={themeClasses.emptyStateText}>No files found</p>
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