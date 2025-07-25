import React, { useState } from 'react';
import { CheckCircle, Clock, Circle, ChevronDown, ChevronRight, User, Bot, Zap } from 'lucide-react';
import { ChatMessage, Step, StepType } from '../types';
import { useDarkMode } from '../contexts/DarkModeContext';

interface ChatHistoryProps {
  messages: ChatMessage[];
  currentStep?: number;
  onStepClick?: (stepId: number) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  currentStep,
  onStepClick
}) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const { isDarkMode } = useDarkMode();

  const toggleMessageExpansion = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'error':
        return <Circle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />;
    }
  };

  const getStepTypeIcon = (type: StepType) => {
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
  };

  const formatMessageContent = (content: string): string => {
    // Remove XML tags for display
    return content
      .replace(/<boltArtifact[^>]*>.*?<\/boltArtifact>/gs, '')
      .replace(/<boltAction[^>]*>.*?<\/boltAction>/gs, '')
      .trim();
  };

  const themeClasses = {
    container: isDarkMode 
      ? "bg-[#1a1a1a] rounded-lg shadow-lg p-4 h-full overflow-auto no-scrollbar"
      : "bg-white rounded-lg shadow-lg p-4 h-full overflow-auto no-scrollbar border border-gray-200",
    userMessage: isDarkMode
      ? "bg-slate-500/20 text-white px-4 py-2 rounded-lg max-w-[80%] flex items-start gap-2"
      : "bg-purple-100 text-gray-900 px-4 py-2 rounded-lg max-w-[80%] flex items-start gap-2",
    assistantMessage: isDarkMode
      ? "border border-gray-700 text-gray-100 px-3 py-2 rounded-lg w-full"
      : "border border-gray-200 text-gray-900 px-3 py-2 rounded-lg w-full bg-gray-50",
    botIcon: isDarkMode ? "text-purple-400" : "text-purple-600",
    userIcon: isDarkMode ? "text-white" : "text-white",
    stepsButton: isDarkMode
      ? "flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors mb-2"
      : "flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-2",
    stepsBorder: isDarkMode ? "border-t border-gray-600 pt-3" : "border-t border-gray-300 pt-3",
    stepItem: (isActive: boolean) => isDarkMode
      ? `p-2 rounded-md cursor-pointer transition-all ${
          isActive
            ? 'bg-gray-700 border border-gray-600'
            : 'bg-gray-800 hover:bg-gray-700'
        }`
      : `p-2 rounded-md cursor-pointer transition-all ${
          isActive
            ? 'bg-purple-100 border border-purple-200'
            : 'bg-gray-100 hover:bg-gray-200'
        }`,
    stepTitle: isDarkMode ? "text-gray-300 font-medium" : "text-gray-700 font-medium",
    stepDescription: isDarkMode ? "text-xs text-gray-400 mt-1 ml-6" : "text-xs text-gray-500 mt-1 ml-6",
    stepPath: isDarkMode ? "text-xs text-blue-400 mt-1 ml-6 font-mono" : "text-xs text-blue-600 mt-1 ml-6 font-mono",
    streamingIndicator: isDarkMode ? "text-xs text-gray-400" : "text-xs text-gray-500",
    emptyStateIcon: isDarkMode ? "text-gray-500 opacity-50" : "text-gray-400 opacity-50",
    emptyStateText: isDarkMode ? "text-gray-500" : "text-gray-600"
  };

  return (
    <div className={themeClasses.container}>
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="w-full">
            {/* User Message */}
            {message.role === 'user' && (
              <div className="flex justify-end mb-2">
                <div className={themeClasses.userMessage}>
                  <User className={`w-4 h-4 mt-0.5 flex-shrink-0 ${themeClasses.userIcon}`} />
                  <div className="text-sm">{message.content}</div>
                </div>
              </div>
            )}

            {/* Assistant Message */}
            {message.role === 'assistant' && (
              <div className="flex justify-start mb-2">
                <div className={themeClasses.assistantMessage}>
                  <div className="flex items-start gap-2 mb-2">
                    <Bot className={`w-4 h-4 mt-0.5 flex-shrink-0 ${themeClasses.botIcon}`} />
                    <div className="text-sm flex-1">
                      {formatMessageContent(message.content)}
                    </div>
                  </div>

                  {/* Steps Section */}
                  {message.steps && message.steps.length > 0 && (
                    <div className={`mt-3 ${themeClasses.stepsBorder}`}>
                      <button
                        onClick={() => toggleMessageExpansion(message.id)}
                        className={themeClasses.stepsButton}
                      >
                        {expandedMessages.has(message.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        {message.steps.length} steps
                      </button>

                      {expandedMessages.has(message.id) && (
                        <div className="space-y-2">
                          {message.steps.map((step) => (
                            <div
                              key={step.id}
                              className={themeClasses.stepItem(currentStep === step.id)}
                              onClick={() => onStepClick?.(step.id)}
                            >
                              <div className="flex items-center gap-2 text-xs">
                                {getStepIcon(step.status)}
                                <span className="text-sm">{getStepTypeIcon(step.type)}</span>
                                <span className={themeClasses.stepTitle}>
                                  {step.title}
                                </span>
                              </div>
                              {step.description && (
                                <p className={themeClasses.stepDescription}>
                                  {step.description}
                                </p>
                              )}
                              {step.path && (
                                <p className={themeClasses.stepPath}>
                                  {step.path}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Streaming Indicator */}
                  {message.isStreaming && (
                    <div className={`mt-2 flex items-center gap-2 ${themeClasses.streamingIndicator}`}>
                      <div className="animate-pulse">●</div>
                      <span>Generating...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {messages.length === 0 && (
          <div className="text-center pt-36">
            <Zap className={`w-12 h-12 mx-auto mb-4 ${themeClasses.emptyStateIcon}`} />
            <p className={themeClasses.emptyStateText}>Start a conversation to see the chat history</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;