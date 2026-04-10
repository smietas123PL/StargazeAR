import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed, user:", currentUser?.email || "none");
      setUser(currentUser);
      
      if (currentUser) {
        try {
          console.log("Fetching profile for UID:", currentUser.uid);
          // Fetch or create user profile
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            console.log("Profile found:", userSnap.data());
            setProfile(userSnap.data() as UserProfile);
          } else {
            console.log("No profile found, creating new...");
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              plan: 'free',
              createdAt: Date.now(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
          // Don't block the user if profile fails to load
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      console.log("Attempting sign-in with popup...");
      const result = await signInWithPopup(auth, provider);
      console.log("Sign-in successful:", result.user.email);
    } catch (err: any) {
      console.error("Sign-in popup error:", err);
      // Fallback if popup is blocked or fails
      if (err.code === 'auth/popup-blocked') {
        alert("Wyskakujące okienko zostało zablokowane. Wyłącz blokadę pop-up dla tej strony.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore user closing the popup
      } else {
        alert("Błąd logowania: " + err.message);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
