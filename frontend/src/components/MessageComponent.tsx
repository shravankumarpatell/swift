import React from 'react';
import { User, Bot, Clock, CheckCircle, Circle, AlertCircle, Play } from 'lucide-react';
import { ChatMessage, Step, StepType } from '../types';
import { useDarkMode } from '../contexts/DarkModeContext';

interface MessageComponentProps {
  message: ChatMessage;
  onStepClick?: (step: Step) => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({ message, onStepClick }) => {
  const { isDarkMode } = useDarkMode();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStepStatusIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-orange-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Play className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />;
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

  const getStepStatusColor = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return isDarkMode
          ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
          : 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'in-progress':
        return isDarkMode
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-orange-50 border-orange-200';
      case 'error':
        return isDarkMode
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-red-50 border-red-200';
      default:
        return isDarkMode
          ? 'bg-gray-800/20 border-gray-700/20 hover:bg-gray-700/20'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const themeClasses = {
    container: isDarkMode
      ? "flex gap-3 p-4 hover:bg-gray-900/20 transition-colors"
      : "flex gap-3 p-4 hover:bg-gray-50 transition-colors",
    userAvatar: "w-8 h-8 rounded-full flex items-center justify-center bg-blue-600",
    botAvatar: "w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600",
    avatarIcon: "w-4 h-4 text-white",
    userName: isDarkMode ? "text-sm font-medium text-gray-200" : "text-sm font-medium text-gray-800",
    timeStamp: isDarkMode ? "text-xs text-gray-500" : "text-xs text-gray-400",
    streamingIndicator: isDarkMode
      ? "flex items-center gap-1 text-xs text-orange-400"
      : "flex items-center gap-1 text-xs text-orange-500",
    streamingDot: isDarkMode ? "w-2 h-2 bg-orange-400 rounded-full animate-pulse" : "w-2 h-2 bg-orange-500 rounded-full animate-pulse",
    messageContent: isDarkMode ? "text-gray-200" : "text-gray-800",
    messageText: "whitespace-pre-wrap break-words leading-relaxed",
    stepsContainer: "mt-4 space-y-2",
    stepsHeader: isDarkMode
      ? "text-xs text-gray-400 font-medium flex items-center gap-2"
      : "text-xs text-gray-500 font-medium flex items-center gap-2",
    stepsDivider: isDarkMode ? "h-px bg-gray-700/50 flex-1" : "h-px bg-gray-300/50 flex-1",
    stepItem: (status: Step['status']) => 
      `flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${getStepStatusColor(status)}`,
    stepTitle: isDarkMode ? "text-sm font-medium text-gray-200 truncate" : "text-sm font-medium text-gray-800 truncate",
    stepDescription: isDarkMode ? "text-xs text-gray-400 mt-1 leading-relaxed" : "text-xs text-gray-500 mt-1 leading-relaxed",
    stepPath: isDarkMode ? "text-xs text-orange-400 mt-1 font-mono" : "text-xs text-orange-600 mt-1 font-mono",
    stepTimestamp: isDarkMode ? "text-xs text-gray-500 mt-1" : "text-xs text-gray-400 mt-1"
  };

  const renderSteps = () => {
    if (!message.steps || message.steps.length === 0) return null;

    return (
      <div className={themeClasses.stepsContainer}>
        <div className={themeClasses.stepsHeader}>
          <span>Build Steps:</span>
          <div className={themeClasses.stepsDivider}></div>
        </div>
        {message.steps.map((step) => (
          <div
            key={step.id}
            className={themeClasses.stepItem(step.status)}
            onClick={() => onStepClick?.(step)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStepStatusIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{getStepTypeIcon(step.type)}</span>
                <span className={themeClasses.stepTitle}>
                  {step.title}
                </span>
              </div>
              {step.description && (
                <p className={themeClasses.stepDescription}>{step.description}</p>
              )}
              {step.path && (
                <p className={themeClasses.stepPath}>
                  {step.path}
                </p>
              )}
              {step.timestamp && (
                <p className={themeClasses.stepTimestamp}>
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
    <div className={themeClasses.container}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={message.role === 'user' ? themeClasses.userAvatar : themeClasses.botAvatar}>
          {message.role === 'user' ? (
            <User className={themeClasses.avatarIcon} />
          ) : (
            <Bot className={themeClasses.avatarIcon} />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={themeClasses.userName}>
            {message.role === 'user' ? 'You' : 'Swift'}
          </span>
          <span className={themeClasses.timeStamp}>
            {formatTime(message.timestamp)}
          </span>
          {message.isStreaming && (
            <div className={themeClasses.streamingIndicator}>
              <div className={themeClasses.streamingDot}></div>
              Thinking...
            </div>
          )}
        </div>

        {/* Message Text */}
        <div className={`prose prose-sm max-w-none ${themeClasses.messageContent}`}>
          <div className={themeClasses.messageText}>
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