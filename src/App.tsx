/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ChatBox } from './components/ChatBox';
import { LibraryPanel } from './components/LibraryPanel';
import { MessageCircle, Home, BookOpen, HeartHandshake } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from './services/gemini';
import { LogoIcon } from './components/Logo';

export default function App() {
  const [view, setView] = useState<'landing' | 'chat' | 'library'>('landing');
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLibraryAuthorized, setIsLibraryAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const handleLibraryAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'testing') {
      setIsLibraryAuthorized(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleGoToChat = (question?: string) => {
    if (typeof question === 'string') {
      setInitialQuestion(question);
    } else {
      setInitialQuestion(null);
    }
    setView('chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-indigo-50 text-slate-800 font-sans flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-rose-100 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setView('landing')}
          >
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <LogoIcon className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">AIDYS</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => { setInitialQuestion(null); setView('landing'); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${view === 'landing' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-100' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Accueil</span>
            </button>
            
            <button 
              onClick={() => { handleGoToChat(); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${view === 'chat' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-100' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Assistant</span>
            </button>

            <button 
              onClick={() => {
                if (!isLibraryAuthorized) {
                  setAuthError(false);
                  setPasswordInput('');
                }
                setView('library');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${view === 'library' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-100' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Bibliothèque</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {view === 'landing' && <LandingPage onGoToChat={handleGoToChat} />}
            {view === 'chat' && (
              <ChatBox 
                initialQuestion={initialQuestion} 
                messages={messages}
                setMessages={setMessages}
              />
            )}
            {view === 'library' && (
              isLibraryAuthorized ? (
                <LibraryPanel />
              ) : (
                <div className="max-w-md mx-auto mt-20">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/60 backdrop-blur-md p-8 rounded-3xl soft-shadow border border-rose-100"
                  >
                    <div className="mb-6 text-center">
                      <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-100">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">Accès Restreint</h2>
                      <p className="text-slate-500 text-sm mt-2">Veuillez saisir le mot de passe pour accéder à la bibliothèque.</p>
                    </div>
                    
                    <form onSubmit={handleLibraryAuth} className="space-y-4">
                      <div>
                        <input 
                          type="password"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Mot de passe"
                          className={`w-full px-5 py-3 rounded-2xl bg-white border outline-none transition-all font-medium ${authError ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-rose-50 focus:ring-2 focus:ring-indigo-100'}`}
                          autoFocus
                        />
                        {authError && (
                          <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-2">Mot de passe incorrect</p>
                        )}
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                      >
                        Valider l'accès
                      </button>
                    </form>
                  </motion.div>
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-auto py-12 bg-white/40 border-t border-rose-100 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p className="font-medium text-slate-500">© {new Date().getFullYear()} AIDYS. Accompagner chaque enfant dans son parcours unique.</p>
          <p className="mt-2 italic text-xs">À titre informatif uniquement. Consultez des professionnels de santé qualifiés pour tout diagnostic ou traitement.</p>
        </div>
      </footer>
    </div>
  );
}

