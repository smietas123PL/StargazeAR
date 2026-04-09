import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../providers/AuthProvider';
import { useDocumentRAG } from '../../hooks/useDocumentRAG';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface VaultDocument {
  id: string;
  name: string;
  size: number;
  createdAt: number;
}

export function VaultDocumentList() {
  const { user } = useAuth();
  const { processAndSaveVaultDocument, deleteVaultDocumentChunks } = useDocumentRAG();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'vaultDocuments'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VaultDocument));
      docs.sort((a, b) => b.createdAt - a.createdAt);
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching vault documents:', err);
      toast.error('Nie udało się pobrać dokumentów.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    if (documents.length + files.length > 20) {
      toast.error('Możesz wgrać maksymalnie 20 dokumentów.');
      return;
    }

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`Plik ${file.name} przekracza limit 20MB.`);
        continue;
      }

      try {
        const text = await file.text();
        
        // 1. Zapisz metadane w Firestore
        const docRef = await addDoc(collection(db, 'vaultDocuments'), {
          userId: user.uid,
          name: file.name,
          size: file.size,
          createdAt: Date.now()
        });

        // 2. Przetwórz i zapisz chunki do RAG
        await processAndSaveVaultDocument(user.uid, file.name, text);
        
        toast.success(`Dodano dokument: ${file.name}`);
      } catch (err) {
        console.error('Error uploading file:', err);
        toast.error(`Błąd podczas dodawania pliku ${file.name}`);
      }
    }

    setUploading(false);
    fetchDocuments();
    if (e.target) e.target.value = ''; // Reset input
  };

  const handleDelete = async (docId: string, documentName: string) => {
    if (!user) return;
    try {
      // 1. Usuń metadane
      await deleteDoc(doc(db, 'vaultDocuments', docId));
      
      // 2. Usuń chunki
      await deleteVaultDocumentChunks(user.uid, documentName);
      
      setDocuments(documents.filter(d => d.id !== docId));
      toast.success('Dokument został usunięty.');
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Błąd podczas usuwania dokumentu.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Twoje dokumenty</h2>
          <p className="text-sm text-zinc-400">
            {documents.length} / 20 plików (max 20MB każdy)
          </p>
        </div>
        
        <div className="relative">
          <input
            type="file"
            accept=".txt,.md,.pdf"
            multiple
            onChange={handleFileUpload}
            disabled={uploading || documents.length >= 20}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <Button 
            disabled={uploading || documents.length >= 20}
            className="bg-primary text-[#003851] font-bold hover:opacity-90 flex items-center gap-2"
          >
            {uploading ? (
              <span className="w-5 h-5 border-2 border-[#003851] border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined">upload_file</span>
            )}
            {uploading ? 'Przetwarzanie...' : 'Dodaj dokumenty'}
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low/30 border border-white/5 rounded-3xl">
          <span className="material-symbols-outlined text-6xl text-zinc-600 mb-4">folder_open</span>
          <h3 className="text-xl font-bold text-white mb-2">Baza Wiedzy jest pusta</h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Wgraj dokumenty (np. strategie, raporty, procedury), aby Twoja Rada Doradców mogła z nich korzystać podczas każdej sesji.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-surface-container-low border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-white font-medium truncate" title={doc.name}>{doc.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                    <span>{formatSize(doc.size)}</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString('pl-PL')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id, doc.name)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                title="Usuń dokument"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
