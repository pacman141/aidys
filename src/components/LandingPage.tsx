import { useState } from 'react';
import { ArrowRight, BookOpen, Brain, Users, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { LogoIcon } from './Logo';

interface LandingPageProps {
  onGoToChat: (question?: string) => void;
}

export function LandingPage({ onGoToChat }: LandingPageProps) {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest"
        >
          <Sparkles className="w-4 h-4" />
          Soutien Bienveillant & Éclairé
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-800 leading-tight"
        >
          Comprenez le <span className="text-indigo-500 underline decoration-indigo-200 underline-offset-8">progrès unique</span> de votre enfant
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-500 max-w-2xl mx-auto font-medium"
        >
          Une IA spécialisée, spécifiquement basée sur les ressources cliniques et pédagogiques partagées par la communauté.
        </motion.p>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="max-w-2xl mx-auto space-y-8"
        >
          <button 
            onClick={() => onGoToChat()}
            className="px-10 py-5 bg-indigo-500 text-white rounded-3xl text-xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 mx-auto active:scale-95 group"
          >
            Commencer maintenant
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex flex-wrap justify-center gap-2">
            <span className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Suggestions rapides</span>
            {['Gérer l\'hypersensibilité', 'Routine du soir', 'Astuces concentration'].map(tag => (
              <button 
                key={tag}
                onClick={() => onGoToChat(tag)}
                className="text-xs font-bold text-slate-500 hover:text-indigo-500 bg-white/60 hover:bg-white px-4 py-2 rounded-full border border-slate-100 transition-all soft-shadow"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid sm:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl soft-shadow border border-blue-50 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
            <LogoIcon className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">Développement TSA</h3>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            Obtenez des informations claires et exploitables sur le traitement sensoriel et les jalons sociaux à partir de sources cliniques vérifiées.
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl soft-shadow border border-blue-50 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg shadow-amber-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">Soutien Scolaire</h3>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            Découvrez des stratégies pour la dyslexie et l'apprentissage neurodivergent, basées sur du matériel pédagogique expert.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl soft-shadow border border-blue-50 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg shadow-emerald-100">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">Sources Vérifiées</h3>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            Notre assistant ne devine jamais. Chaque réponse est recoupée avec des fichiers sources strictement validés par des spécialistes.
          </p>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-neutral-900 text-white rounded-3xl p-10 overflow-hidden relative">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
            <Sparkles className="w-4 h-4" />
            La Fiabilité Avant Tout
          </div>
          <h2 className="text-3xl font-bold">Précision Fondée</h2>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Contrairement aux IA généralistes, AIDYS est restreinte à répondre uniquement sur la base de la base de connaissances gérée par nos administrateurs. Cela élimine les hallucinations.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl -mr-20 -mt-20 rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 blur-3xl -ml-20 -mb-20 rounded-full" />
      </section>
    </div>
  );
}
