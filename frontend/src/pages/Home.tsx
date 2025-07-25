import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Sparkles, Github, Upload, Zap, MessageSquare, Code2, Eye, Terminal, Users, BookOpen, Twitter, MessageCircle, ExternalLink, ChevronRight, Play, Star, GitBranch, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { DarkModeToggle } from '../components/DarkModeToggle';


export function Home() {
  const [prompt, setPrompt] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isDarkMode } = useDarkMode();

  const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };
  

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  

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

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  const examplePrompts = [
    "A React app that lets you take notes",
    "A beautiful landing page for a SaaS",
    "A todo app with a clean design",
    "A dashboard with charts and tables",
    "A blog with a modern layout",
    "An e-commerce product page"
  ];

  const features = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Chat with AI",
      description: "Describe what you want to build in plain English"
    },
    {
      icon: <Code2 className="w-5 h-5" />,
      title: "Full-Stack Code",
      description: "Get complete, production-ready applications"
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Live Preview",
      description: "See your app running in real-time as it's built"
    },
    {
      icon: <Terminal className="w-5 h-5" />,
      title: "No Setup",
      description: "Everything runs in your browser, no installation needed"
    }
  ];

  const themeClasses = {
    background: isDarkMode
      ? "min-h-screen bg-gradient-to-br from-purple-950/65 via-black to-black text-gray-100"
      : "min-h-screen bg-gradient-to-br from-purple-50 via-white to-gray-50 text-gray-900",
    header: isDarkMode
      ? "sticky top-0 z-50 bg-transparent backdrop-blur-xl"
      : "sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50",
    logo: isDarkMode
      ? "w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-900 rounded-lg flex items-center justify-center shadow-lg"
      : "w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg",
    logoText: isDarkMode
      ? "text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
      : "text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-600 bg-clip-text text-transparent",
    navLink: isDarkMode
      ? "text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium"
      : "text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm font-medium",
    signInButton: isDarkMode
      ? "px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-900 hover:from-purple-800 hover:to-purple-900 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      : "px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl",
    heroBackground: isDarkMode
      ? "absolute inset-0 bg-gradient-to-br from-purple-950/5 via-black to-black opacity-100"
      : "absolute inset-0 bg-gradient-to-br from-purple-50/80 via-white to-gray-50 opacity-100",
    badge: isDarkMode
      ? "inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-black/80 border border-purple-500/20 rounded-full mb-8"
      : "inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 rounded-full mb-8",
    badgeText: isDarkMode ? "text-sm font-medium text-purple-300" : "text-sm font-medium text-purple-700",
    mainHeading: isDarkMode
      ? "bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
      : "bg-gradient-to-r from-gray-900 via-gray-700 to-gray-600 bg-clip-text text-transparent",
    subtitle: isDarkMode ? "text-xl md:text-1xl text-gray-400" : "text-xl md:text-1xl text-gray-600",
    inputContainer: isDarkMode
      ? `bg-[#000000] rounded-2xl transition-colors duration-[2000ms] ${isInputFocused
        ? 'border-2 border-purple-500/50 shadow-2xl shadow-purple-500/10'
        : ' border-2 border-transparent shadow-2xl shadow-purple-500/10'
      } p-6`
      : `bg-white rounded-2xl transition-colors duration-[2000ms] ${isInputFocused
        ? 'border-2 border-purple-400/50 shadow-2xl shadow-purple-400/10'
        : ' border-2 border-gray-200/50 shadow-2xl shadow-gray-200/10'
      } p-6`,
    textarea: isDarkMode
      ? "w-11/12 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-lg leading-relaxed min-h-[60px]"
      : "w-11/12 bg-transparent text-gray-900 placeholder-gray-400 resize-none focus:outline-none text-lg leading-relaxed min-h-[60px]",
    submitButton: isDarkMode
      ? "flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-black hover:from-purple-600 hover:to-black text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      : "flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl",
    examplePromptText: isDarkMode ? "text-gray-500 text-sm mb-4" : "text-gray-600 text-sm mb-4",
    examplePromptButton: isDarkMode
      ? "group px-4 py-3 bg-transparent hover:bg-[#0f081b] border border-gray-800/50 hover:border-gray-700/50 rounded-lg text-left transition-all duration-200 hover:shadow-lg"
      : "group px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200/80 hover:border-gray-300/80 rounded-lg text-left transition-all duration-200 hover:shadow-lg",
    examplePromptButtonText: isDarkMode
      ? "text-sm text-gray-300 group-hover:text-white transition-colors duration-200"
      : "text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200",
    examplePromptIcon: isDarkMode
      ? "w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors duration-200"
      : "w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors duration-200",
    featuresBackground: isDarkMode
      ? "pb-20 bg-gradient-to-br to-black via-black from-black opacity-100"
      : "pb-20 bg-gradient-to-br from-gray-50 via-white to-purple-50/30 opacity-100",
    featuresHeading: isDarkMode
      ? "bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
      : "bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent",
    featuresSubtitle: isDarkMode ? "text-xl text-gray-400" : "text-xl text-gray-600",
    featureCard: isDarkMode
      ? "group p-6 bg-transparent border border-gray-800/50 rounded-xl hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10"
      : "group p-6 bg-white border border-gray-200/80 rounded-xl hover:border-purple-300/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-300/10",
    featureIcon: isDarkMode
      ? "w-12 h-12 bg-gradient-to-br from-purple-500/20 to-black rounded-lg flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-black transition-all duration-300"
      : "w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center mb-4 group-hover:from-purple-200 group-hover:to-purple-100 transition-all duration-300",
    featureIconColor: isDarkMode ? "text-purple-400" : "text-purple-600",
    featureTitle: isDarkMode ? "text-xl font-semibold mb-2 text-white" : "text-xl font-semibold mb-2 text-gray-900",
    featureDescription: isDarkMode ? "text-gray-400 leading-relaxed" : "text-gray-600 leading-relaxed",
    footer: isDarkMode
      ? "bg-gradient-to-br from-purple-900/0 via-black to-black opacity-100 pt-1 pb-8"
      : "bg-gradient-to-br from-purple-50/50 via-white to-gray-50 opacity-100 pt-1 pb-8",
    footerText: isDarkMode ? "text-gray-500 text-sm" : "text-gray-600 text-sm"
  };

  return (
    <div className={`${themeClasses.background} font-inter`}>
      {/* Header */}
      <header className={themeClasses.header}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={themeClasses.logo}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className={themeClasses.logoText}>
                swift
              </h1>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className={themeClasses.navLink}>
                Features
              </a>
              <a href="https://webcontainers.io/" className={themeClasses.navLink}>
                Docs
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <button className={themeClasses.signInButton}>
                <p>Sign In</p>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className={themeClasses.heroBackground}></div>
          <div className="relative max-w-6xl mx-auto px-6 pt-20 md:pt-32 md:pb-10">
            <div className="text-center">
              {/* Badge */}
              <div className={themeClasses.badge}>
                <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={themeClasses.badgeText}>AI-Powered Development</span>
              </div>

              {/* Main heading */}
              <h1 className="text-5xl md:text-5xl font-bold mb-6 leading-tight">
                <span className={themeClasses.mainHeading}>
                  Prompt Run Edit Deploy
                </span>
              </h1>

              <p className={`${themeClasses.subtitle} mb-12 max-w-3xl mx-auto leading-relaxed`}>
                Build & deploy full-stack web apps from a single prompt
              </p>

              {/* Input Section */}
              <div className="max-w-4xl mx-auto mb-16">
                <div
                  className={`relative rounded-2xl ${isInputFocused ? 'transition-all duration-[2000ms]' : ''} ${isInputFocused
                    ? isDarkMode
                      ? 'p-[1px] bg-gradient-to-br from-purple-500/70 via-black to-purple-500/70 opacity-100'
                      : 'p-[1px] bg-gradient-to-br from-purple-900/100 via-white to-purple-900/100 opacity-100'
                    : isDarkMode
                      ? 'p-[1px] bg-gradient-to-br from-black via-black to-purple-500/70 opacity-100'
                      : 'p-[1px] bg-gradient-to-br from-white via-white to-purple-900/100 opacity-100'
                    }`}
                >
                  <div className={themeClasses.inputContainer}>
                    <div className="flex items-start gap-4">
                      <div className="pt-2">
                        <Zap className={`w-5 h-5 ${isDarkMode ? 'text-purple-500' : 'text-purple-600'}`} />
                      </div>

                      <div className="flex items-center justify-between mt-1 w-full">
                        <textarea
                          ref={textareaRef}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          placeholder="How can I help you today..."
                          className={themeClasses.textarea}
                          rows={1}
                        />
                      </div>

                      <div>
                        {prompt.trim() && (
                          <button
                            onClick={handleSubmit}
                            className={themeClasses.submitButton}
                          >
                            <span></span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example prompts */}
                <div className="mt-8">
                  <p className={themeClasses.examplePromptText}>Try an example:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {examplePrompts.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        className={themeClasses.examplePromptButton}
                      >
                        <div className="flex items-center justify-between">
                          <span className={themeClasses.examplePromptButtonText}>
                            {example}
                          </span>
                          <ChevronRight className={themeClasses.examplePromptIcon} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={themeClasses.featuresBackground}>
          <div className="max-w-7xl mx-auto px-6 pt-12">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className={themeClasses.featuresHeading}>
                  Build anything with AI
                </span>
              </h2>
              <p className={`${themeClasses.featuresSubtitle} max-w-3xl mx-auto`}>
                From simple components to full applications, swift handles the entire development workflow
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={themeClasses.featureCard}
                >
                  <div className={themeClasses.featureIcon}>
                    <div className={themeClasses.featureIconColor}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className={themeClasses.featureTitle}>{feature.title}</h3>
                  <p className={themeClasses.featureDescription}>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={themeClasses.footer}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="pt-8 flex flex-col md:flex-row justify-center items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
            </div>
            <div className={`${themeClasses.footerText} mb-4 md:mb-0`}>
              &copy; {new Date().getFullYear()} Swift. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}