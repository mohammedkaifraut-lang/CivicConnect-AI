import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';
import type { Complaint, UserProfile, ComplaintStatus, ComplaintCategory } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();

// Generate unique 8-character Citizen ID: 4 uppercase letters + 4 digits (e.g. QLMT4821)
export function generateCitizenId(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // omitting easily confused letters like I, O
  const digits = '23456789'; // omitting 0, 1 for clarity
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    id += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return id;
}

// User Profile Firestore handlers
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

export async function createUserProfileDoc(profile: UserProfile): Promise<void> {
  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, {
    ...profile,
    createdAt: profile.createdAt || new Date().toISOString()
  }, { merge: true });
}

// Upvote a complaint (toggle)
export async function toggleUpvoteComplaint(complaintId: string, uid: string): Promise<{ upvoted: boolean; newCount: number }> {
  const complaintRef = doc(db, 'complaints', complaintId);
  const snap = await getDoc(complaintRef);
  if (!snap.exists()) {
    throw new Error('Complaint not found');
  }
  const data = snap.data() as Complaint;
  const currentUpvotes = data.upvotes || [];
  const hasUpvoted = currentUpvotes.includes(uid);
  
  let newUpvotes: string[];
  if (hasUpvoted) {
    newUpvotes = currentUpvotes.filter(id => id !== uid);
  } else {
    newUpvotes = [...currentUpvotes, uid];
  }

  // Recalculate priority score dynamically
  const baseWeight = getCategoryBaseWeight(data.category);
  const duplicateCount = data.duplicateOf ? 1 : 0;
  const aiSeverityBonus = data.aiClassification?.severity === 'critical' ? 25 : data.aiClassification?.severity === 'high' ? 15 : 5;
  const priorityScore = Math.min(100, Math.round(baseWeight + (newUpvotes.length * 8) + (duplicateCount * 12) + aiSeverityBonus));

  await updateDoc(complaintRef, {
    upvotes: newUpvotes,
    priorityScore,
    updatedAt: new Date().toISOString()
  });

  return { upvoted: !hasUpvoted, newCount: newUpvotes.length };
}

// Confirm Citizen Resolution Feedback
export async function submitResolutionFeedback(
  complaintId: string, 
  confirmed: boolean, 
  feedbackNotes?: string
): Promise<void> {
  const complaintRef = doc(db, 'complaints', complaintId);
  await updateDoc(complaintRef, {
    citizenConfirmedResolution: confirmed,
    citizenFeedbackNotes: feedbackNotes || (confirmed ? 'Citizen verified resolution on-site.' : 'Citizen flagged issue as still unresolved.'),
    updatedAt: new Date().toISOString()
  });
}

// Helper: Calculate base weight for priority scoring
export function getCategoryBaseWeight(category: ComplaintCategory): number {
  switch (category) {
    case 'water_leak': return 75;
    case 'pothole': return 65;
    case 'streetlight': return 60;
    case 'garbage': return 50;
    case 'damaged_facility': return 45;
    default: return 50;
  }
}

// Calculate total priority score
export function calculatePriorityScore(
  category: ComplaintCategory,
  upvotesCount: number,
  isDuplicateOrNear: boolean,
  severity?: string
): number {
  const base = getCategoryBaseWeight(category);
  const upvoteBonus = Math.min(30, upvotesCount * 8);
  const dupBonus = isDuplicateOrNear ? 15 : 0;
  const severityBonus = severity === 'critical' ? 25 : severity === 'high' ? 15 : severity === 'medium' ? 8 : 0;
  return Math.min(100, Math.max(10, Math.round(base + upvoteBonus + dupBonus + severityBonus)));
}

// Subscribe to all complaints in real-time
export function subscribeAllComplaints(callback: (complaints: Complaint[]) => void) {
  const complaintsRef = collection(db, 'complaints');
  const q = query(complaintsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Complaint[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        ...data,
        complaintId: docSnap.id
      } as Complaint);
    });
    callback(list);
  }, (err) => {
    console.error('Complaints subscription error:', err);
  });
}

// Subscribe to citizen's own complaints in real-time
export function subscribeCitizenComplaints(uid: string, callback: (complaints: Complaint[]) => void) {
  const complaintsRef = collection(db, 'complaints');
  const q = query(complaintsRef, where('reportedBy', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const list: Complaint[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        ...data,
        complaintId: docSnap.id
      } as Complaint);
    });
    // Sort client-side to avoid compound index requirements
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (err) => {
    console.error('Citizen complaints subscription error:', err);
  });
}

// Geospatial distance helper in meters (Haversine formula)
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Check for nearby complaints in same category within radiusMeters (default 50m)
export function findNearbyDuplicates(
  allComplaints: Complaint[],
  category: ComplaintCategory,
  lat: number,
  lng: number,
  radiusMeters: number = 50
): Complaint[] {
  return allComplaints.filter((comp) => {
    if (comp.status === 'resolved') return false; // Ignore resolved issues
    if (comp.category !== category) return false;
    const dist = getDistanceMeters(lat, lng, comp.location.lat, comp.location.lng);
    return dist <= radiusMeters;
  });
}
