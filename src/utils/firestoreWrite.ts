import { 
  doc, 
  setDoc, 
  deleteDoc, 
  type DocumentReference,
  type SetOptions 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { sanitizeForFirestore } from './firestoreSanitizer';

export interface WriteResult {
  success: boolean;
  error?: string;
}

/**
 * Safely write a document to Firestore with error handling.
 * Returns a result object instead of throwing.
 */
export async function safeSetDoc<T>(
  collection: string,
  id: string,
  data: T,
  options?: SetOptions
): Promise<WriteResult> {
  try {
    const docRef = doc(db, collection, id) as DocumentReference<T>;
    await setDoc(docRef, sanitizeForFirestore(data), options ?? {});
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Firestore write failed [${collection}/${id}]:`, msg);
    return { success: false, error: msg };
  }
}

/**
 * Safely delete a document from Firestore with error handling.
 */
export async function safeDeleteDoc(
  collection: string,
  id: string
): Promise<WriteResult> {
  try {
    const docRef = doc(db, collection, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Firestore delete failed [${collection}/${id}]:`, msg);
    return { success: false, error: msg };
  }
}
