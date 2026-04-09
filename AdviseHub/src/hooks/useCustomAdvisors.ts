import { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../providers/AuthProvider';
import { MessageRole } from '../types';
import { DEFAULT_PROMPTS, getAdvisorSystemPrompt } from './useAdvisors';

export interface AdvisorDef {
  id: string;
  namePl: string;
  nameEn: string;
  role: string;
  description: string;
  systemPrompt: string;
  icon: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  isCustom: boolean;
  avatarUrl?: string;
}

export const getBaseAdvisors = (): AdvisorDef[] => [
  { id: 'contrarian', role: 'contrarian', icon: 'gavel', namePl: 'Głos Krytyczny', nameEn: 'The Contrarian', color: 'bg-red-500', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20', textClass: 'text-red-500', description: 'Szuka luk w logice, ukrytych ryzyk i najgorszych scenariuszy.', systemPrompt: getAdvisorSystemPrompt('contrarian'), isCustom: false },
  { id: 'first_principles', role: 'first_principles', icon: 'architecture', namePl: 'Myśliciel Fundamentalny', nameEn: 'First Principles Thinker', color: 'bg-blue-500', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20', textClass: 'text-blue-500', description: 'Rozbija problem na fundamentalne prawdy, buduje od podstaw.', systemPrompt: getAdvisorSystemPrompt('first_principles'), isCustom: false },
  { id: 'expansionist', role: 'expansionist', icon: 'rocket_launch', namePl: 'Wizjoner', nameEn: 'The Expansionist', color: 'bg-purple-500', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/20', textClass: 'text-purple-500', description: 'Szuka skali 10x, nieoczywistych rynków i wykładniczego wzrostu.', systemPrompt: getAdvisorSystemPrompt('expansionist'), isCustom: false },
  { id: 'outsider', role: 'outsider', icon: 'travel_explore', namePl: 'Obserwator Zewnętrzny', nameEn: 'The Outsider', color: 'bg-emerald-500', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', textClass: 'text-emerald-500', description: 'Patrzy z perspektywy innej branży, zadaje naiwne, ale trafne pytania.', systemPrompt: getAdvisorSystemPrompt('outsider'), isCustom: false },
  { id: 'executor', role: 'executor', icon: 'task_alt', namePl: 'Człowiek Działania', nameEn: 'The Executor', color: 'bg-amber-500', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20', textClass: 'text-amber-500', description: 'Skupia się na egzekucji, MVP i brutalnie pragmatycznym planie.', systemPrompt: getAdvisorSystemPrompt('executor'), isCustom: false },
];

export function useCustomAdvisors() {
  const { user } = useAuth();
  const [customAdvisors, setCustomAdvisors] = useState<AdvisorDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCustomAdvisors([]);
      setLoading(false);
      return;
    }

    const fetchAdvisors = async () => {
      try {
        const q = query(collection(db, 'customAdvisors'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const advisors: AdvisorDef[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          advisors.push({
            id: doc.id,
            namePl: data.namePl,
            nameEn: data.nameEn || 'Własny Doradca',
            role: data.role || doc.id,
            description: data.description,
            systemPrompt: data.systemPrompt,
            icon: data.icon || 'person',
            color: data.color || 'bg-primary',
            bgClass: data.bgClass || 'bg-primary/10',
            borderClass: data.borderClass || 'border-primary/20',
            textClass: data.textClass || 'text-primary',
            isCustom: true,
            avatarUrl: data.avatarUrl,
          });
        });
        setCustomAdvisors(advisors);
      } catch (err: any) {
        console.error('Error fetching custom advisors:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvisors();
  }, [user]);

  const saveCustomAdvisor = async (advisor: Omit<AdvisorDef, 'id' | 'isCustom' | 'role'> & { id?: string }) => {
    if (!user) return;
    
    try {
      const isNew = !advisor.id;
      const docRef = isNew 
        ? doc(collection(db, 'customAdvisors')) 
        : doc(db, 'customAdvisors', advisor.id as string);
        
      const roleId = isNew ? `custom_${docRef.id}` : (advisor as any).role || `custom_${docRef.id}`;
      
      const advisorData = {
        userId: user.uid,
        namePl: advisor.namePl,
        nameEn: advisor.nameEn,
        role: roleId,
        description: advisor.description,
        systemPrompt: advisor.systemPrompt,
        icon: advisor.icon,
        color: advisor.color,
        bgClass: advisor.bgClass,
        borderClass: advisor.borderClass,
        textClass: advisor.textClass,
        avatarUrl: advisor.avatarUrl || null,
        updatedAt: Date.now(),
        ...(isNew ? { createdAt: Date.now() } : {})
      };

      await setDoc(docRef, advisorData, { merge: true });
      
      const newAdvisor: AdvisorDef = {
        id: docRef.id,
        ...advisorData,
        isCustom: true
      };

      setCustomAdvisors(prev => {
        if (isNew) return [...prev, newAdvisor];
        return prev.map(a => a.id === docRef.id ? newAdvisor : a);
      });
      
      return docRef.id;
    } catch (err: any) {
      console.error('Error saving custom advisor:', err);
      throw err;
    }
  };

  const deleteCustomAdvisor = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'customAdvisors', id));
      setCustomAdvisors(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      console.error('Error deleting custom advisor:', err);
      throw err;
    }
  };

  const getAllAdvisors = (): AdvisorDef[] => {
    return [...getBaseAdvisors(), ...customAdvisors];
  };

  return {
    customAdvisors,
    allAdvisors: getAllAdvisors(),
    loading,
    error,
    saveCustomAdvisor,
    deleteCustomAdvisor,
    getAllAdvisors
  };
}
