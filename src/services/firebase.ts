import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import { Patient, SessionEntry } from '../types/finance';

// Robust configuration supporting both json file and environment variables
const firebaseConfig = {
  projectId: rawFirebaseConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'grounded-alpha-fdw77',
  appId: rawFirebaseConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '1:404812862461:web:54ddde1dd13b9a6bb97f94',
  apiKey: rawFirebaseConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBxq6j2GXhruGwRPrqIT-9rE-okJnrULLM',
  authDomain: rawFirebaseConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'grounded-alpha-fdw77.firebaseapp.com',
  firestoreDatabaseId: rawFirebaseConfig?.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-psifinancegestof-847c1c2b-dbe1-4437-8134-ea94a3a1595a',
  storageBucket: rawFirebaseConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'grounded-alpha-fdw77.firebasestorage.app',
  messagingSenderId: rawFirebaseConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '404812862461',
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Firestore with database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot without throwing uncaught crash
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    console.warn('Firestore initial connection check (operating in resilient mode):', error);
    return false;
  }
}

// Cloud sync services for Patients
export async function savePatientToCloud(patient: Patient): Promise<void> {
  const path = `patients/${patient.id}`;
  try {
    await setDoc(doc(db, 'patients', patient.id), patient);
  } catch (error) {
    const info = handleFirestoreError(error, OperationType.WRITE, path);
    throw new Error(JSON.stringify(info));
  }
}

export async function deletePatientFromCloud(patientId: string): Promise<void> {
  const path = `patients/${patientId}`;
  try {
    await deleteDoc(doc(db, 'patients', patientId));
  } catch (error) {
    const info = handleFirestoreError(error, OperationType.DELETE, path);
    throw new Error(JSON.stringify(info));
  }
}

// Cloud sync services for Sessions
export async function saveSessionToCloud(session: SessionEntry): Promise<void> {
  const path = `sessions/${session.id}`;
  try {
    await setDoc(doc(db, 'sessions', session.id), session);
  } catch (error) {
    const info = handleFirestoreError(error, OperationType.WRITE, path);
    throw new Error(JSON.stringify(info));
  }
}

export async function deleteSessionFromCloud(sessionId: string): Promise<void> {
  const path = `sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
  } catch (error) {
    const info = handleFirestoreError(error, OperationType.DELETE, path);
    throw new Error(JSON.stringify(info));
  }
}

// Batch bootstrap to populate initial data if cloud is empty
export async function seedInitialCloudData(patients: Patient[], sessions: SessionEntry[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    patients.forEach(p => {
      batch.set(doc(db, 'patients', p.id), p);
    });
    // First 40 sessions
    sessions.slice(0, 40).forEach(s => {
      batch.set(doc(db, 'sessions', s.id), s);
    });
    await batch.commit();
  } catch (error) {
    console.warn('Initial seeding note (non-blocking):', error);
  }
}
