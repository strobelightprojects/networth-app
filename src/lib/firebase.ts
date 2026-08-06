import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  collection, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfigJSON from '../../firebase-applet-config.json';
import { PortfolioData, HistoricalSnapshot } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJSON.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJSON.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJSON.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJSON.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJSON.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJSON.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJSON.firestoreDatabaseId,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

// Auth helper functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await updateUserProfileLastActive(result.user);
    }
    return result.user;
  } catch (error: any) {
    console.error("Google sign in error:", error);
    throw error;
  }
};

export const signInGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    if (result.user) {
      await updateUserProfileLastActive(result.user);
    }
    return result.user;
  } catch (error: any) {
    console.error("Anonymous sign in error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  return await firebaseSignOut(auth);
};

// User Metadata & Activity Tracking
export const updateUserProfileLastActive = async (user: User) => {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const nowIso = new Date().toISOString();
    await setDoc(userDocRef, {
      email: user.email || '',
      displayName: user.displayName || 'Guest User',
      lastActiveAt: nowIso,
      isAnonymous: user.isAnonymous
    }, { merge: true });
  } catch (err) {
    console.warn("Could not update lastActiveAt timestamp:", err);
  }
};

// Storage Saver: Compress/Downsample History Points Older than 180 Days
export const compressHistoryData = (history: HistoricalSnapshot[]): HistoricalSnapshot[] => {
  if (!history || history.length <= 10) return history;

  const now = new Date().getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const HALF_YEAR_MS = 180 * ONE_DAY_MS;
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

  const recentPoints: HistoricalSnapshot[] = [];
  const olderPoints: HistoricalSnapshot[] = [];

  history.forEach(point => {
    const pointTime = new Date(point.date).getTime();
    if (isNaN(pointTime)) return;
    if (now - pointTime < HALF_YEAR_MS) {
      recentPoints.push(point);
    } else {
      olderPoints.push(point);
    }
  });

  // Keep only 1 point per 7-day bucket for older points
  const compressedOlder: HistoricalSnapshot[] = [];
  let lastSavedBucket = -1;

  // Sort older points chronologically
  olderPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  olderPoints.forEach(point => {
    const pointTime = new Date(point.date).getTime();
    const bucket = Math.floor(pointTime / SEVEN_DAYS_MS);
    if (bucket !== lastSavedBucket) {
      compressedOlder.push(point);
      lastSavedBucket = bucket;
    }
  });

  return [...compressedOlder, ...recentPoints];
};

// Check if an account timestamp is older than 1 year (365 days)
export const isAccountInactiveOneYear = (lastActiveAtISO?: string): boolean => {
  if (!lastActiveAtISO) return false;
  const lastActive = new Date(lastActiveAtISO).getTime();
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  return (Date.now() - lastActive) > ONE_YEAR_MS;
};

// Calculate Storage Footprint Estimate
export const calculateStorageEstimate = (portfolios: PortfolioData[]): { estimatedBytes: number; itemCount: number; historyCount: number } => {
  const jsonStr = JSON.stringify(portfolios);
  const estimatedBytes = new Blob([jsonStr]).size;
  const itemCount = portfolios.reduce((acc, p) => acc + p.items.length, 0);
  const historyCount = portfolios.reduce((acc, p) => acc + p.history.length, 0);
  return { estimatedBytes, itemCount, historyCount };
};

// Delete Entire Account and All Associated Data
export const deleteUserAccountAndData = async (user: User): Promise<void> => {
  const userId = user.uid;

  // 1. Delete all user portfolios from Firestore
  const portfoliosRef = collection(db, 'users', userId, 'portfolios');
  const snapshot = await getDocs(portfoliosRef);
  const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
  await Promise.all(deletePromises);

  // 2. Delete user profile doc
  const userDocRef = doc(db, 'users', userId);
  await deleteDoc(userDocRef);

  // 3. Delete Firebase Auth user
  await deleteUser(user);
};

// Firestore Portfolio Sync Helpers
export const subscribeUserPortfolios = (
  userId: string, 
  onPortfoliosUpdated: (portfolios: PortfolioData[]) => void
) => {
  const portfoliosRef = collection(db, 'users', userId, 'portfolios');
  
  return onSnapshot(portfoliosRef, (snapshot) => {
    const portfolios: PortfolioData[] = [];
    snapshot.forEach((docSnap) => {
      portfolios.push({
        id: docSnap.id,
        ...docSnap.data()
      } as PortfolioData);
    });
    onPortfoliosUpdated(portfolios);
  }, (error) => {
    console.error("Error subscribing to portfolios:", error);
  });
};

export const saveUserPortfolioToFirestore = async (userId: string, portfolio: PortfolioData) => {
  try {
    const docRef = doc(db, 'users', userId, 'portfolios', portfolio.id);
    const optimizedPortfolio = {
      ...portfolio,
      history: compressHistoryData(portfolio.history),
      lastActiveAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, optimizedPortfolio, { merge: true });
  } catch (error) {
    console.error("Failed saving portfolio to Firestore:", error);
  }
};

export const deleteUserPortfolioFromFirestore = async (userId: string, portfolioId: string) => {
  try {
    const docRef = doc(db, 'users', userId, 'portfolios', portfolioId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Failed deleting portfolio from Firestore:", error);
  }
};

export const syncAllPortfoliosToFirestore = async (userId: string, portfolios: PortfolioData[]) => {
  try {
    for (const p of portfolios) {
      await saveUserPortfolioToFirestore(userId, p);
    }
  } catch (error) {
    console.error("Failed syncing portfolios to Firestore:", error);
  }
};
