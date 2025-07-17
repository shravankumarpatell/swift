import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Sparkles, Github, Upload, Zap, MessageSquare, Code2, Eye, Terminal, Users, BookOpen, Twitter, MessageCircle, ExternalLink, ChevronRight, Play, Star, GitBranch, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900/100 via-black to-black opacity-100 text-gray-100 font-inter">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-transparent backdrop-blur-xl ">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                swift
              </h1>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium">
                Features
              </a>
              <a href="#showcase" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium">
                Showcase
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium">
                Docs
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium">
                Community
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                <Github className="w-5 h-5" />
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/70 via-black to-black opacity-100"></div>
          <div className="relative max-w-6xl mx-auto px-6 pt-20 md:pt-32 md:pb-10">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-600/10 border border-orange-500/20 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-300">AI-Powered Development</span>
              </div>

              {/* Main heading */}
              <h1 className="text-5xl md:text-5xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Prompt Run Edit Deploy
                </span>
              </h1>

              <p className="text-xl md:text-1xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                Build & deploy full-stack web apps from a single prompt
              </p>

              {/* Input Section */}
              <div className="max-w-4xl mx-auto mb-16">
                <div
                  className={`relative rounded-2xl transition-all duration-[2000ms] ${isInputFocused
                      // OUTER: gradient background as “border”
                      ? 'p-[1px] bg-gradient-to-br from-orange-500/70 via-black to-orange-500/70 opacity-100 '
                      : 'p-[1px] bg-gradient-to-br from-black via-black to-orange-500/70 opacity-100'
                    }`}
                >
                  {/* INNER: actual box, transparent border so gradient shows through */}
                  <div
                    className={`bg-[#000000] rounded-2xl transition-colors duration-[2000ms] ${isInputFocused
                        ? 'border-2 border-orange-500/50 shadow-2xl shadow-orange-500/10'
                        : ' border-2 border-transparent shadow-2xl shadow-orange-500/10'
                      } p-6`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="pt-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                      </div>

                      <div className="flex-1">
                        <textarea
                          ref={textareaRef}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          placeholder="Build me a React app that..."
                          className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-lg leading-relaxed min-h-[60px]"
                          rows={1}
                        />

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-3 py-2 bg-[#2A2D36] hover:bg-[#34374A] rounded-lg text-sm text-gray-300 transition-colors duration-200">
                              <Upload className="w-4 h-4" />
                             
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 bg-[#2A2D36] hover:bg-[#34374A] rounded-lg text-sm text-gray-300 transition-colors duration-200">
                              <Github className="w-4 h-4" />
                              
                            </button>
                          </div>

                          {prompt.trim() && (
                            <button
                              onClick={handleSubmit}
                              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              <span></span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Example prompts */}
                <div className="mt-8">
                  <p className="text-gray-500 text-sm mb-4">Try an example:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {examplePrompts.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        className="group px-4 py-3 bg-[#1A1C24] hover:bg-[#2A2D36] border border-gray-800/50 hover:border-gray-700/50 rounded-lg text-left transition-all duration-200 hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">
                            {example}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-orange-400 transition-colors duration-200" />
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
        <section id="features" className="pb-20 bg-gradient-to-br to-orange-900/70 via-black from-black opacity-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Build anything with AI
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                From simple components to full applications, swift handles the entire development workflow
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 bg-[#1A1C24] border border-gray-800/50 rounded-xl hover:border-orange-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-orange-500/30 group-hover:to-red-600/30 transition-all duration-300">
                    <div className="text-orange-400">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-orange-900/70 via-black to-black opacity-100   pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Features</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Templates</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Integrations</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">About</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Careers</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Documentation</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Guides</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">API Status</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-4">Community</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Discord</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Twitter</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">GitHub</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">YouTube</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800/30 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                swift
              </span>
            </div>

            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} StackBlitz. All rights reserved.
            </div>

            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}