// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Wand2 } from 'lucide-react';

// export function Home() {
//   const [prompt, setPrompt] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (prompt.trim()) {
//       navigate('/builder', { state: { prompt } });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
//       <div className="max-w-2xl w-full">
//         <div className="text-center mb-8">
//           <div className="flex justify-center mb-4">
//             <Wand2 className="w-12 h-12 text-blue-400" />
//           </div>
//           <h1 className="text-4xl font-bold text-gray-100 mb-4">
//             Website Builder AI
//           </h1>
//           <p className="text-lg text-gray-300">
//             Describe your dream website, and we'll help you build it step by step
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="bg-gray-800 rounded-lg shadow-lg p-6">
//             <textarea
//               value={prompt}
//               onChange={(e) => setPrompt(e.target.value)}
//               placeholder="Describe the website you want to build..."
//               className="w-full h-32 p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500"
//             />
//             <button
//               type="submit"
//               className="w-full mt-4 bg-blue-600 text-gray-100 py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
//             >
//               Generate Website Plan
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Wand2, Sparkles, Code, Zap, ArrowRight } from 'lucide-react';

// export function Home() {
//   const [prompt, setPrompt] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (prompt.trim()) {
//       navigate('/builder', { state: { prompt } });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
//       {/* Animated background elements */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
//         <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-400/30 rounded-full blur-2xl animate-bounce delay-500"></div>
//         <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-400/30 rounded-full blur-2xl animate-bounce delay-700"></div>
//       </div>

//       <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
//         <div className="max-w-4xl w-full">
//           {/* Header Section */}
//           <div className="text-center mb-12">
//             <div className="flex justify-center mb-6">
//               <div className="relative">
//                 <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-lg opacity-75 animate-pulse"></div>
//                 <div className="relative bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-full">
//                   <Wand2 className="w-12 h-12 text-white" />
//                 </div>
//               </div>
//             </div>
            
//             <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6 leading-tight">
//               Website Builder AI
//             </h1>
            
//             <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
//               Transform your ideas into stunning websites with the power of AI. 
//               <span className="block mt-2 text-purple-300">Just describe your vision, and watch magic happen.</span>
//             </p>

//             {/* Feature highlights */}
//             <div className="flex flex-wrap justify-center gap-6 mb-12">
//               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
//                 <Sparkles className="w-4 h-4 text-purple-400" />
//                 <span className="text-sm text-slate-200">AI-Powered</span>
//               </div>
//               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
//                 <Code className="w-4 h-4 text-blue-400" />
//                 <span className="text-sm text-slate-200">Live Preview</span>
//               </div>
//               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
//                 <Zap className="w-4 h-4 text-green-400" />
//                 <span className="text-sm text-slate-200">Instant Build</span>
//               </div>
//             </div>
//           </div>

//           {/* Main Form */}
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="relative">
//               <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-2xl blur-xl"></div>
//               <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10">
//                 <div className="relative">
//                   <textarea
//                     value={prompt}
//                     onChange={(e) => setPrompt(e.target.value)}
//                     placeholder="✨ Describe your dream website... 

// Example:
// • Create a modern portfolio website for a photographer"
//                     className="w-full h-40 p-6 bg-slate-800/50 text-slate-100 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-slate-400 text-lg leading-relaxed backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50"
//                   />
//                   <div className="absolute bottom-4 right-4 text-xs text-slate-500">
//                     {prompt.length}/2000
//                   </div>
//                 </div>
                
//                 <button
//                   type="submit"
//                   disabled={!prompt.trim()}
//                   className="group w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
//                 >
//                   <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
//                   <div className="relative flex items-center justify-center gap-3">
//                     <Sparkles className="w-5 h-5 group-hover:animate-spin" />
//                     <span>Generate Website Plan</span>
//                     <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
//                   </div>
//                 </button>
//               </div>
//             </div>
//           </form>

//           {/* Bottom decoration */}
//           <div className="text-center mt-12">
//             <p className="text-slate-500 text-sm">
//               Powered by advanced AI • Built with modern web technologies
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


//Home.tsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Wand2, Sparkles, Code, Zap, ArrowRight } from 'lucide-react';

// export function Home() {
//   const [prompt, setPrompt] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (prompt.trim()) {
//       navigate('/builder', { state: { prompt } });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
//       {/* Animated background elements */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
//         <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
//       </div>

//       <div className="relative z-10 min-h-screen flex flex-col">
//         {/* Header */}
//         <header className="px-6 py-4 border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/20">
//           <div className="flex items-center justify-between max-w-7xl mx-auto">
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
//                 <Wand2 className="w-5 h-5 text-white" />
//               </div>
//               <span className="text-xl font-bold text-white">BuilderAI</span>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
//                 Examples
//               </button>
//               <button className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
//                 Docs
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* Main Content */}
//         <main className="flex-1 flex items-center justify-center p-6">
//           <div className="max-w-4xl w-full">
//             <div className="text-center mb-12">
//               <div className="flex justify-center mb-6">
//                 <div className="relative">
//                   <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
//                     <Sparkles className="w-10 h-10 text-white" />
//                   </div>
//                   <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
//                     <Zap className="w-3 h-3 text-white" />
//                   </div>
//                 </div>
//               </div>
              
//               <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
//                 Build websites with{' '}
//                 <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
//                   AI magic
//                 </span>
//               </h1>
              
//               <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
//                 Describe your vision and watch as our AI transforms your ideas into fully functional websites. 
//                 No coding required—just pure creativity.
//               </p>

//               {/* Feature highlights */}
//               <div className="flex flex-wrap justify-center gap-4 mb-12">
//                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
//                   <Code className="w-4 h-4 text-purple-400" />
//                   <span className="text-sm text-slate-300">Live Preview</span>
//                 </div>
//                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
//                   <Zap className="w-4 h-4 text-blue-400" />
//                   <span className="text-sm text-slate-300">Instant Deploy</span>
//                 </div>
//                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
//                   <Sparkles className="w-4 h-4 text-emerald-400" />
//                   <span className="text-sm text-slate-300">AI Powered</span>
//                 </div>
//               </div>
//             </div>

//             {/* Prompt Input */}
//             <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
//               <div className="relative">
//                 <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
//                   <div className="relative">
//                     <textarea
//                       value={prompt}
//                       onChange={(e) => setPrompt(e.target.value)}
//                       placeholder="Describe the website you want to build... (e.g., 'Create a modern portfolio website with a hero section, about me, and contact form')"
//                       className="w-full h-32 p-4 bg-slate-900/50 text-white border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none placeholder-slate-400 text-lg leading-relaxed transition-all"
//                       rows={4}
//                     />
//                     <div className="absolute bottom-3 right-3 text-xs text-slate-500">
//                       {prompt.length}/500
//                     </div>
//                   </div>
                  
//                   <div className="flex items-center justify-between mt-6">
//                     <div className="flex items-center gap-2 text-sm text-slate-400">
//                       <Sparkles className="w-4 h-4" />
//                       <span>Powered by AI</span>
//                     </div>
                    
//                     <button
//                       type="submit"
//                       disabled={!prompt.trim()}
//                       className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 hover:shadow-xl"
//                     >
//                       <span>Generate Website</span>
//                       <ArrowRight className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </form>

//             {/* Quick Examples */}
//             <div className="max-w-3xl mx-auto mt-8">
//               <p className="text-sm text-slate-400 mb-4 text-center">Try these examples:</p>
//               <div className="flex flex-wrap justify-center gap-3">
//                 {[
//                   "Modern landing page for a SaaS product",
//                   "Portfolio website for a photographer",
//                   "E-commerce store for handmade crafts",
//                   "Blog website with dark theme"
//                 ].map((example, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setPrompt(example)}
//                     className="px-4 py-2 text-sm bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 hover:text-white rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-all"
//                   >
//                     {example}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </main>

//         {/* Footer */}
//         <footer className="px-6 py-4 border-t border-slate-800/50 backdrop-blur-sm bg-slate-900/20">
//           <div className="max-w-7xl mx-auto flex items-center justify-between">
//             <div className="text-sm text-slate-400">
//               © 2024 BuilderAI. Powered by AI.
//             </div>
//             <div className="flex items-center gap-6">
//               <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy</a>
//               <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Terms</a>
//               <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Support</a>
//             </div>
//           </div>
//         </footer>
//       </div>
//     </div>
//   );
// }

import React, { useState } from 'react';
import { Wand2, Send, Github, Figma } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

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

  const examplePrompts = [
    "Create a financial app",
    "Design a directory website", 
    "Build a project management app",
    "Make a landing page",
    "Generate a CRM",
    "Build a mobile app"
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">BuilderAI</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-300 hover:text-white transition-colors">
              Community
            </button>
            <button className="text-slate-300 hover:text-white transition-colors">
              Enterprise
            </button>
            <button className="text-slate-300 hover:text-white transition-colors">
              Resources
            </button>
            <button className="text-slate-300 hover:text-white transition-colors">
              Pricing
            </button>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Figma className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl w-full text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              What do you want to build?
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Create stunning apps & websites by chatting with AI.
            </p>
          </div>

          {/* Input Section */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 focus-within:border-slate-600 transition-colors">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your idea and we'll bring it to life (or /command)"
                  className="w-full bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none text-lg"
                  rows={3}
                />
                
                {/* Send Button - Only shows when there's text */}
                {prompt.trim() && (
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleSubmit}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Import Options */}
            <div className="mt-8">
              <p className="text-slate-400 mb-4">or import from</p>
              <div className="flex justify-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
                  <Figma className="w-4 h-4" />
                  <span>Figma</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </button>
              </div>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors text-left"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}