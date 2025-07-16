import React, { useState } from 'react';
import { CheckCircle, Clock, Circle, ChevronDown, ChevronRight, User, Bot, Zap } from 'lucide-react';
import { ChatMessage, Step, StepType } from '../types';

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
        return <Circle className="w-4 h-4 text-gray-500" />;
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

  return (
    <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-4 h-full overflow-auto no-scrollbar">
      
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="w-full">
            {/* User Message */}
            {message.role === 'user' && (
              <div className="flex justify-end mb-2">
                <div className="bg-slate-500/20 text-white px-4 py-2 rounded-lg max-w-[80%] flex items-start gap-2">
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">{message.content}</div>
                </div>
              </div>
            )}

            {/* Assistant Message */}
            {message.role === 'assistant' && (
              <div className="flex justify-start mb-2">
                <div className=" border border-gray-700 text-gray-100 px-3 py-2 rounded-lg w-full">
                  <div className="flex items-start gap-2 mb-2">
                    <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                    <div className="text-sm flex-1">
                      {formatMessageContent(message.content)}
                    </div>
                  </div>

                  {/* Steps Section */}
                  {message.steps && message.steps.length > 0 && (
                    <div className="mt-3 border-t border-gray-600 pt-3">
                      <button
                        onClick={() => toggleMessageExpansion(message.id)}
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors mb-2"
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
                              className={`p-2 rounded-md cursor-pointer transition-all ${
                                currentStep === step.id
                                  ? 'bg-gray-700 border border-gray-600'
                                  : 'bg-gray-800 hover:bg-gray-700'
                              }`}
                              onClick={() => onStepClick?.(step.id)}
                            >
                              <div className="flex items-center gap-2 text-xs">
                                {getStepIcon(step.status)}
                                <span className="text-sm">{getStepTypeIcon(step.type)}</span>
                                <span className="text-gray-300 font-medium">
                                  {step.title}
                                </span>
                              </div>
                              {step.description && (
                                <p className="text-xs text-gray-400 mt-1 ml-6">
                                  {step.description}
                                </p>
                              )}
                              {step.path && (
                                <p className="text-xs text-blue-400 mt-1 ml-6 font-mono">
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
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
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
          <div className="text-center pt-36 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation to see the chat history</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;