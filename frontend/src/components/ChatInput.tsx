// src/components/ChatInput.tsx
// import React from 'react';
// import { ArrowRight } from 'lucide-react';
// import { Loader } from './Loader'; // adjust path if needed

// interface ChatInputProps {
//     userPrompt: string;
//     setPrompt: (v: string) => void;
//     onSend: () => void;
//     loading: boolean;
// }

// const ChatInput: React.FC<ChatInputProps> = ({
//     userPrompt,
//     setPrompt,
//     onSend,
//     loading,
// }) => {
//     const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             if (userPrompt.trim() !== '' && !loading) {
//                 onSend();
//             }
//         }
//     };

//     return (
//         <div className="p-4 border-t border-gray-800 bg-[#1a1a1a]">
//             {loading ? (
//                 <div className="flex items-center justify-center py-4">
//                     <Loader />
//                 </div>
//             ) : (
//                 <div className="relative">
//                     <textarea
//                         value={userPrompt}
//                         onChange={e => setPrompt(e.target.value)}
//                         onKeyDown={handleKeyDown}
//                         placeholder="How can I help you today?"
//                         className="
//     w-full
//     pl-4 pt-4 pr-14
//     bg-[#2a2a2a] border border-gray-700 rounded-lg
//     text-sm text-white placeholder-gray-400
//     resize-none focus:outline-none focus:ring-2 focus:ring-blue-500
//     focus:border-transparent
//     hover:outline-none hover:ring-2 hover:ring-blue-500
//     hover:border-transparent
//     transition-all duration-200
//   "
//                         rows={3}
//                     />
//                     {userPrompt.trim() !== '' && (
//                         <button
//                             onClick={onSend}
//                             className="
//                 absolute top-1/2 right-3 transform -translate-y-1/2
//                 flex items-center justify-center
//                 w-8 h-8
//                 bg-blue-600 hover:bg-blue-700
//                 rounded-md
//                 transition
//                 disabled:opacity-50 disabled:cursor-not-allowed
//               "
//                             disabled={loading}
//                         >
//                             <ArrowRight className="w-5 h-5 text-white" />
//                         </button>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ChatInput;

// src/components/ChatInput.tsx
import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Loader } from './Loader';

interface ChatInputProps {
    userPrompt: string;
    setPrompt: (v: string) => void;
    onSend: () => void;
    loading: boolean;
}

const placeholderSuggestions = [
    "How can I help you today?"
];

const ChatInput: React.FC<ChatInputProps> = ({
    userPrompt,
    setPrompt,
    onSend,
    loading,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [placeholder, setPlaceholder] = useState(placeholderSuggestions[5]);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [isButtonPressed, setIsButtonPressed] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const maxChars = 2000;

    // Auto-resize textarea
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 200; // Max height in pixels
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
                // Shift+Enter: New line (default behavior)
                return;
            } else if (e.ctrlKey || e.metaKey) {
                // Ctrl+Enter or Cmd+Enter: Send message
                e.preventDefault();
                if (canSend()) {
                    handleSend();
                }
            } else {
                // Enter: Send message
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

    return (
        <div className="border-t border-gray-800 bg-[#1a1a1a] ">
            {loading ? (
                <div className="flex items-center justify-center py-6 ">
                    <div className="flex items-center gap-3 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Generating response...</span>
                    </div>
                </div>
            ) : (
                <div className="p-4 max-w-4xl mx-auto ">
                    <div className="relative no-scrollbar">
                        <div className="relative no-scrollbar">
                            <textarea
                                ref={textareaRef}
                                value={userPrompt}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="How can I help you today?"
                                className={`
                                    w-full
                                    pl-4 pt-4 pr-14 pb-4
                                    bg-[#1a1a1a] border-2 rounded-xl
                                    text-sm text-white placeholder-gray-400
                                    resize-none focus:outline-none
                                    transition-all duration-200
                                    min-h-[60px] max-h-[200px]
                                    no-scrollbar
                                    ${canSend() && !isOverLimit
                                        ? 'border-blue-500 focus:border-blue-500 hover:border-gray-500'
                                        : isOverLimit
                                        ? 'border-red-500 focus:border-red-400'
                                        : 'border-blue-500/40 focus:border-blue-500 hover:border-blue-500'
                                    }
                                    ${isOverLimit ? 'focus:ring-2 focus:ring-red-500/20' : 'focus:ring-2 focus:ring-blue-500/20'}
                                `}
                                disabled={loading}
                            />
                            
                            {/* Send Button */}
                            {canSend() && !isOverLimit && (
                                <button
                                    onClick={handleSend}
                                    disabled={loading}
                                    className={`
                                        absolute bottom-3 right-3
                                        flex items-center justify-center
                                        w-8 h-8
                                        bg-blue-600 hover:bg-blue-700
                                        rounded-lg
                                        transition-all duration-150
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        ${isButtonPressed ? 'scale-95 bg-blue-800' : 'scale-100'}
                                        hover:scale-105 active:scale-95
                                        shadow-lg hover:shadow-blue-500/25
                                    `}
                                >
                                    <ArrowRight className="w-4 h-4 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Character Counter */}
                        {(isNearLimit || isOverLimit) && (
                            <div className="flex justify-end mt-2">
                                <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-yellow-400'}`}>
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