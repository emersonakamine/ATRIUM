import { supabase, resolveTable } from '../services/supabase';
import { sanitizeForFirestore } from './firestoreSanitizer';

export interface WriteResult {
  success: boolean;
  error?: string;
}

export interface SetOptions {
  merge?: boolean;
}

export async function safeSetDoc<T>(
  collection: string,
  id: string,
  data: T,
  _options?: SetOptions
): Promise<WriteResult> {
  try {
    const row = { ...(sanitizeForFirestore(data) as Record<string, unknown>), id };
    const { error } = await supabase.from(resolveTable(collection)).upsert(row);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Supabase write failed [${collection}/${id}]:`, msg);
    return { success: false, error: msg };
  }
}

export async function safeDeleteDoc(
  collection: string,
  id: string
): Promise<WriteResult> {
  try {
    const { error } = await supabase.from(resolveTable(collection)).delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Supabase delete failed [${collection}/${id}]:`, msg);
    return { success: false, error: msg };
  }
}
