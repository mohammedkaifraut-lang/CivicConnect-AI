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
import { auth, db, googleProvider, generateCitizenId, sanitizeForFirestore } from '../lib/firebase';
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
  signInOwnerWithEmail: (email: string, pass: string) => Promise<void>;
  signInAdminWithEmail: (email: string, pass: string) => Promise<void>;
  signInAdminWithGoogle: () => Promise<void>;
  signInAsDemoAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Recognized initial municipal admins & owners
const ADMIN_EMAILS = [
  'mkwebsitedeveloper@gmail.com',
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
          await setDoc(userDocRef, sanitizeForFirestore(updatedProfile), { merge: true });
          setUserProfile(updatedProfile);
          return updatedProfile;
        }
        setUserProfile(data);
        return data;
      } else {
        // Auto-create profile without undefined fields
        const citizenId = isKnownAdmin ? 'ADMIN-01' : generateCitizenId();
        const newProfile: UserProfile = {
          uid: user.uid,
          citizenId,
          name: user.displayName || user.email?.split('@')[0] || (isKnownAdmin ? 'Chief Municipal Officer' : 'Verified Citizen'),
          email: user.email || '',
          role: isKnownAdmin ? 'admin' : 'citizen',
          createdAt: new Date().toISOString(),
          trustScore: 85
        };
        if (isKnownAdmin) {
          newProfile.department = 'Public Works & Municipal Oversight';
        }
        if (user.photoURL) {
          newProfile.avatarUrl = user.photoURL;
        }
        await setDoc(userDocRef, sanitizeForFirestore(newProfile), { merge: true });
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
    await setDoc(userDocRef, sanitizeForFirestore(newProfile), { merge: true });
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
      createdAt: new Date().toISOString()
    };
    if (user.photoURL) {
      adminProfile.avatarUrl = user.photoURL;
    }
    await setDoc(userDocRef, sanitizeForFirestore(adminProfile), { merge: true });
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

  // Owner & Municipal Admin login flow using Firebase Auth & authorized verification
  const signInOwnerWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    const isAuthorizedOwner = ADMIN_EMAILS.includes(cleanEmail.toLowerCase());

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      
      // Enforce Owner/Admin RBAC authorization
      if (!isAuthorizedOwner) {
        await fbSignOut(auth);
        setUserProfile(null);
        setCurrentUser(null);
        throw new Error('Access Denied: This account is not authorized as a municipal owner or administrator.');
      }

      const adminProfile: UserProfile = {
        uid: user.uid,
        citizenId: 'OWNER-01',
        name: user.displayName || (cleanEmail.includes('kaif') ? 'Chief Municipal Officer (Kaif Raut)' : 'Municipal System Owner'),
        email: cleanEmail,
        role: 'admin',
        department: 'Public Works & Municipal Oversight',
        createdAt: new Date().toISOString()
      };
      if (user.photoURL) {
        adminProfile.avatarUrl = user.photoURL;
      }

      await setDoc(userDocRef, sanitizeForFirestore(adminProfile), { merge: true });
      setUserProfile(adminProfile);
    } catch (err: any) {
      // 2. If Firebase Email/Password auth is disabled or restricted in this environment,
      // safely verify via server-side owner authentication without exposing credentials in frontend
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-login-credentials'
      ) {
        try {
          const res = await fetch('/api/owner-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password: pass })
          });
          const data = await res.json();

          if (res.ok && data.success && data.user) {
            const ownerProfile: UserProfile = {
              uid: data.user.uid,
              citizenId: data.user.citizenId || 'OWNER-01',
              name: data.user.name || 'Chief Municipal Officer (Kaif Raut)',
              email: data.user.email,
              role: 'admin',
              department: data.user.department || 'Public Works & Municipal Oversight',
              createdAt: new Date().toISOString()
            };

            // Write to Firestore if available
            try {
              await setDoc(doc(db, 'users', ownerProfile.uid), sanitizeForFirestore(ownerProfile), { merge: true });
            } catch (fsErr) {
              console.warn('Firestore sync note:', fsErr);
            }

            setUserProfile(ownerProfile);
            return;
          } else {
            throw new Error(data.error || 'Invalid municipal owner credentials.');
          }
        } catch (fetchErr: any) {
          throw new Error(fetchErr.message || 'Municipal owner verification failed.');
        }
      }
      throw err;
    }
  };

  const signInAdminWithEmail = signInOwnerWithEmail;

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
        signInOwnerWithEmail,
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
