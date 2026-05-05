import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { KBContent } from '../types';
import { Plus, Trash2, FileText, Loader2, AlertCircle, Upload, FileUp } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function LibraryPanel() {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [items, setItems] = useState<KBContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const path = 'kb_content';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KBContent[];
      setItems(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }, []);

  const parsePDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const parsePptx = async (file: File): Promise<string> => {
    const zip = await JSZip.loadAsync(file);
    const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
    let fullText = '';
    
    for (const slideFile of slideFiles) {
      const content = await zip.file(slideFile)?.async('text');
      if (content) {
        // Simple regex to extract text from PPTX XML
        const matches = content.match(/<a:t>([^<]*)<\/a:t>/g);
        if (matches) {
          const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
          fullText += slideText + '\n';
        }
      }
    }
    return fullText;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setSource(file.name);
    
    try {
      let extractedText = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        extractedText = await parsePDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        extractedText = await parseDocx(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx')) {
        extractedText = await parsePptx(file);
      } else {
        alert("Format de fichier non supporté. Veuillez utiliser PDF, Word (.docx) ou PowerPoint (.pptx).");
        setParsing(false);
        return;
      }
      
      setContent(extractedText);
    } catch (error) {
      console.error("File parsing error:", error);
      alert("Erreur lors de la lecture du fichier.");
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !source.trim()) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'kb_content'), {
        content: content.trim(),
        source: source.trim(),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'anonymous',
      });
      setContent('');
      setSource('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'kb_content');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) return;
    try {
      await deleteDoc(doc(db, 'kb_content', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `kb_content/${id}`);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Formulaire de téléchargement */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl soft-shadow border border-rose-100">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-6 text-slate-800">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Plus className="w-5 h-5" />
            </div>
            Partager un document
          </h2>
          
          <div className="mb-6">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 underline">Importer (PDF, Word, PPT)</label>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="w-full py-4 border-2 border-dashed border-indigo-100 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-indigo-50 transition-colors group"
            >
              {parsing ? (
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              ) : (
                <FileUp className="w-6 h-6 text-indigo-300 group-hover:text-indigo-500" />
              )}
              <span className="text-xs font-bold text-slate-400">
                {parsing ? "Analyse..." : "Choisir un fichier"}
              </span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.docx,.pptx"
            />
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Source / Titre</label>
              <input 
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Ex: Guide TSA Chapitre 1"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-600 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Contenu</label>
              <textarea 
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Le contenu apparaîtra ici..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-medium text-slate-600 leading-relaxed text-sm"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={saving || parsing}
              className="w-full py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Enregistrer
            </button>
          </form>
        </div>
      </div>

      {/* Liste du contenu */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 px-2">Bibliothèque Collaborative</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white/40 p-12 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-medium italic">La bibliothèque est vide.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl soft-shadow border border-rose-50 group hover:border-indigo-100 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <h4 className="font-bold text-slate-800 truncate text-sm">{item.source}</h4>
                    </div>
                    <p className="text-[13px] text-slate-500 line-clamp-3 leading-relaxed font-medium">
                      {item.content}
                    </p>
                    <div className="mt-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      {item.createdAt?.toDate().toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
