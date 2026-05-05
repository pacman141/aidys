import { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Loader2, Info, Sparkles, Mic, Volume2, Square, VolumeX, RotateCcw } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { askAssistant, ChatMessage } from '../services/gemini';
import { KBContent } from '../types';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { LogoIcon } from './Logo';

interface ChatBoxProps {
  initialQuestion?: string | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function ChatBox({ initialQuestion, messages, setMessages }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const initialized = useRef(false);

  const scrollToTopIfNew = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToTopIfNew();
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuestion && !initialized.current && messages.length === 0) {
      initialized.current = true;
      handleSend(initialQuestion);
    }
  }, [initialQuestion, messages.length]);

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setLoading(false);
    setSpeakingId(null);
    window.speechSynthesis.cancel();
    initialized.current = false;
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const speak = (text: string, index: number) => {
    if (speakingId === index) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    
    setSpeakingId(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (messageText?: string) => {
    const textToSubmit = messageText || input;
    if (!textToSubmit.trim() || loading) return;

    if (!messageText) setInput('');
    const newUserMessage: ChatMessage = { role: 'user', content: textToSubmit.trim() };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // 1. Fetch Knowledge Base
      const path = 'kb_content';
      let kbItems: KBContent[] = [];
      try {
        const kbSnapshot = await getDocs(collection(db, path));
        kbItems = kbSnapshot.docs.map(doc => doc.data() as KBContent);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
      
      // 2. Combine into context
      const context = kbItems.map(item => `Source: ${item.source}\nContent: ${item.content}`).join('\n\n---\n\n');

      if (!context.trim()) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "La base de connaissances est actuellement vide. Veuillez demander à un administrateur de télécharger du contenu de soutien." 
        }]);
        return;
      }

      // 3. Ask Gemini - Pass current messages + the new one
      const response = await askAssistant(textToSubmit.trim(), context, [...messages]);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response || "Je suis désolé, je n'ai pas pu générer de réponse." }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Une erreur s'est produite lors de la communication avec l'IA. Veuillez réessayer plus tard." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-md px-8 py-6 rounded-t-3xl border border-rose-100 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="font-bold text-slate-800 text-xl tracking-tight">Assistant de Soutien Parent</h2>
          <p className="text-xs text-emerald-600 flex items-center gap-1 font-bold mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Réponses basées sur des sources validées
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group"
            title="Réinitialiser la conversation"
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-[-90deg] transition-transform duration-300" />
          </button>
          <div className="hidden sm:flex items-center gap-3">
             <div className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-rose-100">AI Grounded</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="py-12 px-4 sm:px-8 space-y-8 bg-white/20 border-x border-rose-100">
        <AnimatePresence>
          {messages.length === 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-6 px-12"
            >
              <div className="bg-white p-6 rounded-3xl soft-shadow border border-rose-50">
                <Sparkles className="w-10 h-10 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">Comment puis-je vous aider ?</h3>
                <p className="text-slate-500 mt-2 font-medium max-w-md mx-auto leading-relaxed">Posez vos questions sur le développement ou les besoins de votre enfant. Je m'appuie sur la bibliothèque partagée.</p>
              </div>
            </motion.div>
          )}

          {messages.map((m, i) => (
            <motion.div 
              key={i}
              ref={i === messages.length - 1 ? lastMessageRef : null}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className="flex flex-col items-center gap-2 mt-1">
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-sm transform transition-transform hover:scale-110 ${m.role === 'user' ? 'bg-amber-400' : 'bg-indigo-500'}`}>
                  {m.role === 'user' ? (
                    <span className="text-[10px] font-bold text-white">VOUS</span>
                  ) : (
                    <LogoIcon className="w-6 h-6" />
                  )}
                </div>
                {m.role === 'assistant' && (
                  <button 
                    onClick={() => speak(m.content, i)}
                    className={`p-1.5 rounded-lg transition-all ${speakingId === i ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-500'}`}
                    title={speakingId === i ? "Arrêter l'audio" : "Écouter la réponse"}
                  >
                    {speakingId === i ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <div className={`max-w-[85%] px-6 py-5 rounded-2xl soft-shadow text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-rose-50'}`}>
                <div className="prose prose-slate prose-sm max-w-none prose-p:my-0">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm mt-1">
               <LogoIcon className="w-6 h-6" />
             </div>
             <div className="bg-white/60 px-6 py-5 rounded-2xl soft-shadow border border-rose-50 flex items-center gap-3">
               <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Analyse documentaire...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <footer className="p-8 bg-white/60 backdrop-blur-md rounded-b-3xl border border-rose-100 mt-[-1px]">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="bg-white p-2 rounded-[1.5rem] flex items-center gap-2 shadow-inner border border-rose-50"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Posez votre question ici..."
            className="flex-1 bg-transparent border-none outline-none px-5 py-3 text-sm text-slate-600 font-medium placeholder:text-slate-300"
          />
          <button 
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'hover:bg-slate-50 text-slate-400'}`}
            title={isListening ? "Arrêter l'écoute" : "Poser une question à l'oral"}
          >
            <Mic className="w-5 h-5" />
          </button>
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-500 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
      </footer>
    </div>
  );
}
