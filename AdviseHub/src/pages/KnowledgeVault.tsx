import React from 'react';
import { VaultDocumentList } from '../components/features/VaultDocumentList';

export default function KnowledgeVault() {
  return (
    <div className="max-w-5xl mx-auto w-full pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
          <h1 className="text-3xl font-headline font-black text-white tracking-tight">Baza Wiedzy</h1>
        </div>
        <p className="text-zinc-400 max-w-2xl">
          Zarządzaj stałymi dokumentami firmy. Wgrane tutaj pliki (np. strategie, raporty, procedury) będą automatycznie analizowane przez Radę Doradców podczas każdej nowej sesji, zapewniając kontekst specyficzny dla Twojej organizacji.
        </p>
      </div>

      <div className="bg-surface-container-low/50 border border-white/5 rounded-3xl p-6 sm:p-8">
        <VaultDocumentList />
      </div>
    </div>
  );
}
