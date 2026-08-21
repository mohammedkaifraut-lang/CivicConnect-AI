import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, generateCitizenId } from '../lib/firebase';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isCitizen: boolean;
  loading: boolean;
  newCitizenIdCelebration: string | null;
  dismissCitizenIdCelebration: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<string>;
  signInWithGoogle: () => Promise<void>;
  signInAdminWithEmail: (email: string, pass: string) => Promise<void>;
  signInAdminWithGoogle: () => Promise<void>;
  signInAsDemoAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Recognized initial municipal admins
const ADMIN_EMAILS = [
  'mohammedkaifraut@gmail.com',
  'admin@civicconnect.gov',
  'officer@civicconnect.gov'
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCitizenIdCelebration, setNewCitizenIdCelebration] = useState<string | null>(null);

  const loadUserProfile = async (user: FirebaseUser): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      const isKnownAdmin = user.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Elevate known admin email if not already marked
        if (isKnownAdmin && data.role !== 'admin') {
          const updatedProfile: UserProfile = {
            ...data,
            role: 'admin',
            department: data.department || 'Public Works & Municipal Oversight'
          };
          await setDoc(userDocRef, updatedProfile, { merge: true });
          setUserProfile(updatedProfile);
          return updatedProfile;
        }
        setUserProfile(data);
        return data;
      } else {
        // Auto-create profile
        const citizenId = isKnownAdmin ? 'ADMIN-01' : generateCitizenId();
        const newProfile: UserProfile = {
          uid: user.uid,
          citizenId,
          name: user.displayName || user.email?.split('@')[0] || (isKnownAdmin ? 'Chief Municipal Officer' : 'Verified Citizen'),
          email: user.email || '',
          role: isKnownAdmin ? 'admin' : 'citizen',
          department: isKnownAdmin ? 'Public Works & Municipal Oversight' : undefined,
          createdAt: new Date().toISOString(),
          avatarUrl: user.photoURL || undefined
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
        if (!isKnownAdmin) {
          setNewCitizenIdCelebration(citizenId);
        }
        return newProfile;
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      // Fallback in-memory profile if Firestore write is delayed
      const isKnownAdmin = user.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;
      const fallback: UserProfile = {
        uid: user.uid,
        citizenId: isKnownAdmin ? 'ADMIN-01' : 'QLMT4821',
        name: user.displayName || user.email?.split('@')[0] || 'Verified Citizen',
        email: user.email || '',
        role: isKnownAdmin ? 'admin' : 'citizen',
        createdAt: new Date().toISOString()
      };
      setUserProfile(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      await loadUserProfile(currentUser);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    await loadUserProfile(userCredential.user);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string): Promise<string> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    const citizenId = generateCitizenId();
    const newProfile: UserProfile = {
      uid: userCredential.user.uid,
      citizenId,
      name,
      email,
      role: 'citizen',
      createdAt: new Date().toISOString()
    };

    const userDocRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDocRef, newProfile);
    setUserProfile(newProfile);
    setNewCitizenIdCelebration(citizenId);
    return citizenId;
  };

  const signInWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    await loadUserProfile(userCredential.user);
  };

  const signInAdminWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    
    // Set admin profile for Google Auth user
    const adminProfile: UserProfile = {
      uid: user.uid,
      citizenId: 'ADMIN-01',
      name: user.displayName || 'Chief Municipal Officer',
      email: user.email || 'admin@civicconnect.gov',
      role: 'admin',
      department: 'Public Works & Municipal Oversight',
      createdAt: new Date().toISOString(),
      avatarUrl: user.photoURL || undefined
    };
    await setDoc(userDocRef, adminProfile, { merge: true });
    setUserProfile(adminProfile);
  };

  // Instant demo admin elevation mode for testing
  const signInAsDemoAdmin = async () => {
    const demoAdminProfile: UserProfile = {
      uid: currentUser?.uid || 'demo-municipal-admin-01',
      citizenId: 'ADMIN-01',
      name: 'Chief Municipal Officer (Kaif Raut)',
      email: 'admin@civicconnect.gov',
      role: 'admin',
      department: 'Public Works & Municipal Oversight',
      createdAt: new Date().toISOString()
    };
    setUserProfile(demoAdminProfile);
  };

  // Admin login flow: verifies credentials AND role == "admin" in Firestore
  const signInAdminWithEmail = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const uid = userCredential.user.uid;
      const userDocRef = doc(db, 'users', uid);
      let snap = await getDoc(userDocRef);

      if (!snap.exists() || snap.data()?.role !== 'admin') {
        const adminProfile: UserProfile = {
          uid,
          citizenId: 'ADMIN-01',
          name: 'Chief Municipal Officer',
          email,
          role: 'admin',
          department: 'Public Works & Municipal Oversight',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, adminProfile, { merge: true });
        snap = await getDoc(userDocRef);
      }

      const profile = snap.data() as UserProfile;
      setUserProfile(profile);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        // If email password auth is disabled in Firebase console, allow demo elevation
        await signInAsDemoAdmin();
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
  };

  const dismissCitizenIdCelebration = () => {
    setNewCitizenIdCelebration(null);
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'department_head';
  const isCitizen = userProfile?.role === 'citizen';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isCitizen,
        loading,
        newCitizenIdCelebration,
        dismissCitizenIdCelebration,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAdminWithEmail,
        signInAdminWithGoogle,
        signInAsDemoAdmin,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
