
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Sparkles, Github, Upload, Zap, MessageSquare, Code2, Eye, Terminal, Users, BookOpen, Twitter, MessageCircle, ExternalLink, ChevronRight, Play, Star, GitBranch, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthButton } from '../components/AuthButton';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated } = useAuth();

  const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    if (!isAuthenticated) {
      // Save prompt to session storage and redirect to sign in
      sessionStorage.setItem('pending_prompt', prompt.trim());
      // The AuthButton will handle the sign in process
      return;
    }
    
    // User is authenticated, proceed to builder
    navigate('/builder', { state: { prompt } });
  };

  const handleCreateApp = () => {
    if (!prompt.trim()) return;
    
    if (!isAuthenticated) {
      // Save prompt and trigger sign in
      sessionStorage.setItem('pending_prompt', prompt.trim());
      return;
    }
    
    // User is authenticated, proceed to builder
    navigate('/builder', { state: { prompt } });
  };

  // Check for pending prompt after component mounts
  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem('pending_prompt');
    if (pendingPrompt && isAuthenticated) {
      sessionStorage.removeItem('pending_prompt');
      navigate('/builder', { state: { prompt: pendingPrompt } });
    }
  }, [isAuthenticated, navigate]);

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

  const showcaseApps = [
    {
      title: "Task Management App",
      description: "A full-featured todo app with drag & drop",
      image: "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400",
      tags: ["React", "TypeScript", "Tailwind"]
    },
    {
      title: "E-commerce Dashboard",
      description: "Analytics dashboard with charts and metrics",
      image: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=400",
      tags: ["Next.js", "Charts", "API"]
    },
    {
      title: "Landing Page",
      description: "Modern SaaS landing page with animations",
      image: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400",
      tags: ["React", "Framer Motion", "SEO"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900/20 via-black to-orange-800/10 text-gray-100 font-inter">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                bolt.new
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
              <AuthButton onSignInRequired={handleCreateApp} />
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-black to-orange-500/5 opacity-80"></div>
          
          <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-32">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-600/10 border border-orange-500/20 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-300">AI-Powered Development</span>
              </div>

              {/* Main heading */}
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Prompt, run, edit, deploy
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                StackBlitz's AI agent can build & deploy full-stack web apps from a single prompt
              </p>

              {/* Input Section */}
              <div className="max-w-4xl mx-auto mb-16">
                <div className={`relative bg-black/60 backdrop-blur-sm border-2 rounded-2xl p-6 transition-all duration-300 ${
                  isInputFocused 
                    ? 'border-orange-500/50 shadow-2xl shadow-orange-500/10' 
                    : 'border-orange-500/20 hover:border-orange-500/30'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap className="w-5 h-5 text-white" />
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
                          <button className="flex items-center gap-2 px-3 py-2 bg-black/40 hover:bg-black/60 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-sm text-gray-300 transition-colors duration-200">
                            <Upload className="w-4 h-4" />
                            Import
                          </button>
                          <button className="flex items-center gap-2 px-3 py-2 bg-black/40 hover:bg-black/60 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-sm text-gray-300 transition-colors duration-200">
                            <Github className="w-4 h-4" />
                            GitHub
                          </button>
                        </div>
                        
                        {prompt.trim() && (
                          <button
                            onClick={!isAuthenticated ? handleCreateApp : handleSubmit}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            <span>{!isAuthenticated ? 'Sign In to Create' : 'Create App'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
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
                        className="group px-4 py-3 bg-black/40 hover:bg-black/60 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-left transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
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

              {/* Demo video placeholder */}
              <div className="relative max-w-5xl mx-auto">
                <div className="relative bg-gradient-to-br from-black/60 to-black/80 backdrop-blur-sm rounded-2xl border border-orange-500/20 overflow-hidden shadow-2xl">
                  <div className="flex items-center px-6 py-4 bg-black/60 border-b border-orange-500/20">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-sm text-gray-400">bolt.new - AI Web Development</span>
                    </div>
                  </div>
                  
                  <div className="aspect-video bg-gradient-to-br from-black to-orange-900/20 flex items-center justify-center">
                    <button className="group flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-110">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gradient-to-br from-black via-orange-900/10 to-black">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Build anything with AI
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                From simple components to full applications, bolt.new handles the entire development workflow
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group p-6 bg-black/60 backdrop-blur-sm border border-orange-500/20 rounded-xl hover:border-orange-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20"
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

        {/* Showcase Section */}
        <section id="showcase" className="py-20 bg-gradient-to-br from-orange-900/10 via-black to-orange-800/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Built with bolt.new
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                See what others have created with AI-powered development
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {showcaseApps.map((app, index) => (
                <div 
                  key={index}
                  className="group bg-black/60 backdrop-blur-sm border border-orange-500/20 rounded-xl overflow-hidden hover:border-orange-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    <img 
                      src={app.image} 
                      alt={app.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-white">{app.title}</h3>
                    <p className="text-gray-400 mb-4">{app.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {app.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-3 py-1 bg-black/40 border border-orange-500/30 text-orange-400 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-orange-600/20 via-black to-orange-500/20 border-y border-orange-500/30">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ready to build with AI?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of developers building the future with bolt.new
            </p>
            <button 
              onClick={() => {
                if (!isAuthenticated) {
                  sessionStorage.setItem('pending_prompt', 'Build me a React app');
                } else {
                  navigate('/builder', { state: { prompt: 'Build me a React app' } });
                }
              }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-2xl hover:shadow-orange-500/25 hover:scale-105"
            >
              <Zap className="w-5 h-5" />
              {!isAuthenticated ? 'Sign In to Start Building' : 'Start Building Now'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-black via-orange-900/5 to-black border-t border-orange-500/20 pt-16 pb-8">
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
          
          <div className="border-t border-orange-500/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                bolt.new
              </span>
            </div>
            
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} swift. All rights reserved.
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