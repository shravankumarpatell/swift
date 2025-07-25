import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, Loader2, Sparkles, Send } from 'lucide-react';
import { Loader } from './Loader';
import { useDarkMode } from '../contexts/DarkModeContext';

interface ChatInputProps {
    userPrompt: string;
    setPrompt: (v: string) => void;
    onSend: () => void;
    loading: boolean;
}

const placeholderSuggestions = [
    "Add a navigation menu to the header",
    "Create a contact form with validation",
    "Add animations to the landing page",
    "Implement a dark mode toggle",
    "Add a search functionality",
    "Create a responsive grid layout",
    "How can I help you today?"
];

const ChatInput: React.FC<ChatInputProps> = ({
    userPrompt,
    setPrompt,
    onSend,
    loading,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [placeholder, setPlaceholder] = useState(placeholderSuggestions[6]);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [isButtonPressed, setIsButtonPressed] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const { isDarkMode } = useDarkMode();
    const maxChars = 2000;

    // Auto-resize textarea
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 200;
            textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    };

    // Dynamic placeholder rotation
    useEffect(() => {
        if (userPrompt.length === 0) {
            const interval = setInterval(() => {
                setPlaceholderIndex(prev => (prev + 1) % (placeholderSuggestions.length - 1));
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [userPrompt]);

    useEffect(() => {
        if (userPrompt.length === 0) {
            setPlaceholder(placeholderSuggestions[placeholderIndex]);
        }
    }, [placeholderIndex, userPrompt]);

    // Auto-resize on content change
    useEffect(() => {
        adjustTextareaHeight();
        setCharCount(userPrompt.length);
    }, [userPrompt]);

    // Focus management
    useEffect(() => {
        if (!loading && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [loading]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                return;
            } else if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (canSend()) {
                    handleSend();
                }
            } else {
                e.preventDefault();
                if (canSend()) {
                    handleSend();
                }
            }
        }
    };

    const handleSend = () => {
        if (canSend()) {
            setIsButtonPressed(true);
            onSend();
            setTimeout(() => setIsButtonPressed(false), 150);
        }
    };

    const canSend = () => {
        return userPrompt.trim() !== '' && !loading && charCount <= maxChars;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= maxChars) {
            setPrompt(value);
        }
    };

    const isNearLimit = charCount > maxChars * 0.8;
    const isOverLimit = charCount > maxChars;

    const themeClasses = {
        container: isDarkMode
            ? "border-t border-gray-800/30 bg-[#101010]"
            : "border-t border-gray-200/50 bg-white",
        loadingContainer: isDarkMode ? "text-gray-400" : "text-gray-600",
        loadingIcon: isDarkMode
            ? "w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center"
            : "w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center",
        loadingText: isDarkMode ? "text-sm" : "text-sm",
        textarea: isDarkMode
            ? `w-full overflow-auto no-scrollbar pl-4 pt-4 pr-14 pb-4 bg-[#0c0c0c] border-2 rounded-xl text-sm text-white placeholder-gray-400 resize-none focus:outline-none transition-all duration-200 min-h-[60px] max-h-[200px] ${
                canSend() && !isOverLimit
                    ? 'border-purple-500/50 focus:border-purple-500 hover:border-purple-500/70'
                    : isOverLimit
                    ? 'border-purple-500 focus:border-purple-400'
                    : 'border-gray-700/50 focus:border-purple-500/50 hover:border-gray-600/50'
            } ${isOverLimit ? 'focus:ring-2 focus:ring-purple-500/20' : 'focus:ring-2 focus:ring-purple-500/20'}`
            : `w-full overflow-auto no-scrollbar pl-4 pt-4 pr-14 pb-4 bg-gray-50 border-2 rounded-xl text-sm text-gray-900 placeholder-gray-500 resize-none focus:outline-none transition-all duration-200 min-h-[60px] max-h-[200px] ${
                canSend() && !isOverLimit
                    ? 'border-purple-400/50 focus:border-purple-500 hover:border-purple-400/70'
                    : isOverLimit
                    ? 'border-purple-500 focus:border-purple-400'
                    : 'border-gray-300/50 focus:border-purple-400/50 hover:border-gray-400/50'
            } ${isOverLimit ? 'focus:ring-2 focus:ring-purple-400/20' : 'focus:ring-2 focus:ring-purple-400/20'}`,
        sendButton: `absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
            isButtonPressed ? 'scale-95' : 'scale-100'
        } hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/25`,
        helpText: isDarkMode
            ? "flex items-center gap-2 text-xs text-gray-500"
            : "flex items-center gap-2 text-xs text-gray-400",
        charCounter: isOverLimit 
            ? (isDarkMode ? 'text-xs text-purple-400' : 'text-xs text-purple-600')
            : (isDarkMode ? 'text-xs text-purple-400' : 'text-xs text-purple-600')
    };

    return (
        <div className={themeClasses.container}>
            {loading ? (
                <div className="flex items-center justify-center py-6">
                    <div className={`flex items-center gap-3 ${themeClasses.loadingContainer}`}>
                        <div className={themeClasses.loadingIcon}>
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                        </div>
                        <span className={themeClasses.loadingText}>swift is thinking...</span>
                    </div>
                </div>
            ) : (
                <div className="p-4">
                    <div className="relative">
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={userPrompt}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                className={themeClasses.textarea}
                                disabled={loading}
                            />
                            
                            {/* Send Button */}
                            {canSend() && !isOverLimit && (
                                <button
                                    onClick={handleSend}
                                    disabled={loading}
                                    className={themeClasses.sendButton}
                                >
                                    <Send className="w-4 h-4 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Character Counter */}
                        {(isNearLimit || isOverLimit) && (
                            <div className="flex justify-between items-center mt-2">
                                <div className={themeClasses.helpText}>
                                    <Sparkles className="w-3 h-3" />
                                    <span>Press Enter to send, Shift+Enter for new line</span>
                                </div>
                                <span className={themeClasses.charCounter}>
                                    {charCount}/{maxChars}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInput;