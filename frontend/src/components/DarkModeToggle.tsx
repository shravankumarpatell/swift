import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

export const DarkModeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isDarkMode
          ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white'
          : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-700 hover:text-gray-900'
      }`}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
};