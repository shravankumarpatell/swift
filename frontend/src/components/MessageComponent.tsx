import React from 'react';
import { User, Bot, Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { ChatMessage, Step, StepType } from '../types';

interface MessageComponentProps {
  message: ChatMessage;
  onStepClick?: (step: Step) => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({ message, onStepClick }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStepStatusIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-600" />;
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

  const renderSteps = () => {
    if (!message.steps || message.steps.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        <div className="text-xs text-gray-400 font-medium">Build Steps:</div>
        {message.steps.map((step) => (
          <div
            key={step.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
              ${step.status === 'completed' 
                ? 'bg-green-950/30 border-green-800/30' 
                : step.status === 'in-progress'
                ? 'bg-blue-950/30 border-blue-800/30'
                : step.status === 'error'
                ? 'bg-red-950/30 border-red-800/30'
                : 'bg-gray-800/30 border-gray-700/30'
              }
              hover:bg-gray-700/30 hover:border-gray-600/30
            `}
            onClick={() => onStepClick?.(step)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStepStatusIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{getStepTypeIcon(step.type)}</span>
                <span className="text-sm font-medium text-gray-100 truncate">
                  {step.title}
                </span>
              </div>
              {step.description && (
                <p className="text-xs text-gray-400 mt-1">{step.description}</p>
              )}
              {step.path && (
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {step.path}
                </p>
              )}
              {step.timestamp && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(step.timestamp)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex gap-3 p-4 hover:bg-gray-900/30 transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${message.role === 'user' 
            ? 'bg-blue-600' 
            : 'bg-gray-700'
          }
        `}>
          {message.role === 'user' ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-100">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
          {message.isStreaming && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Thinking...
            </div>
          )}
        </div>

        {/* Message Text */}
        <div className={`
          prose prose-sm max-w-none
          ${message.role === 'user' 
            ? 'text-gray-100' 
            : 'text-gray-200'
          }
        `}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>

        {/* Steps */}
        {renderSteps()}
      </div>
    </div>
  );
};

export default MessageComponent;