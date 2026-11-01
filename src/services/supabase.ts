import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventData, Guest, TicketCategory, AuditLog, UserProfile } from '../types';
import {
  INITIAL_EVENTS,
  INITIAL_CATEGORIES,
  INITIAL_GUESTS,
  INITIAL_LOGS,
  INITIAL_USERS,
} from '../data/mockData';

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://spyqcxpbtbjcrkctqfby.supabase.co';
export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNweXFjeHBidGJqY3JrY3RxZmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDIxMTcsImV4cCI6MjEwOTExODExN30.ppUPtGPz3jm2qtmvC2r9kyB7E5_jQlsBUOSKhwfG05s';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const TABLES: Record<string, string> = {
  events: 'events',
  guests: 'guests',
  categories: 'categories',
  auditLogs: 'audit_logs',
  users: 'users',
};

export function resolveTable(collection: string): string {
  return TABLES[collection] ?? collection;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DataErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleDataError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DataErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('events').select('id').limit(1);
    return !error;
  } catch (error) {
    console.warn('Supabase connection test failed:', error);
    return false;
  }
}

export async function seedInitialDatabaseIfNeeded() {
  try {
    const { data: events, error: evtErr } = await supabase.from('events').select('id').limit(1);
    if (evtErr) {
      handleDataError(evtErr, OperationType.LIST, 'events');
      return;
    }
    if (events && events.length > 0) return;

    console.log('Seeding initial events, guests, categories and users into Supabase...');
    const { error: e1 } = await supabase.from('events').upsert(INITIAL_EVENTS as EventData[]);
    const { error: e2 } = await supabase.from('categories').upsert(INITIAL_CATEGORIES as TicketCategory[]);
    const { error: e3 } = await supabase.from('guests').upsert(INITIAL_GUESTS as Guest[]);
    const { error: e4 } = await supabase.from('audit_logs').upsert(INITIAL_LOGS as AuditLog[]);
    const usersSeed = INITIAL_USERS.map((u) => {
      const { password: _legacyPassword, ...rest } = u;
      return rest;
    });
    const { error: e5 } = await supabase.from('users').upsert(usersSeed);

    if (e1 || e2 || e3 || e4 || e5) {
      console.error('Seed errors:', { e1, e2, e3, e4, e5 });
      return;
    }
    console.log('Initial data seeded successfully in Supabase!');
  } catch (error) {
    handleDataError(error, OperationType.WRITE, 'seed');
  }
}

export async function resetEntireDatabase(adminUser: UserProfile) {
  try {
    console.log('Performing Total System Reset...');

    const collectionsToClear = ['events', 'guests', 'categories', 'audit_logs', 'users'];
    for (const collName of collectionsToClear) {
      const { error } = await supabase.from(collName).delete().neq('id', '__none__');
      if (error) throw new Error(`Failed to clear ${collName}: ${error.message}`);
    }

    const cleanEventId = `evt_${Date.now()}`;
    const cleanEvent: EventData = {
      id: cleanEventId,
      code: 'EVT-001',
      title: 'Meu Primeiro Evento',
      subtitle: 'Credenciamento & Acesso Exclusivo',
      description: 'Estrutura limpa e pronta para uso da nova organização.',
      startDate: new Date().toLocaleDateString('pt-BR'),
      endDate: new Date().toLocaleDateString('pt-BR'),
      startTime: '19h00m',
      endTime: '23h30m',
      locationName: 'Centro de Convenções & Eventos',
      address: 'Av. Principal, 1000',
      cityState: 'São Paulo - SP',
      maxCapacity: 500,
      status: 'published',
      coverUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
      inviteLayout: {
        bgTheme: 'dark',
        title: 'Meu Primeiro Evento',
        subtitle: 'Credenciamento & Acesso Exclusivo',
        instructions: 'Apresente este QR Code na portaria de entrada para validação imediata.',
        showQr: true,
        showName: true,
        showCategory: true,
        showLocation: true,
        showTime: true,
        showDoc: true,
        showCompanions: true,
        accentColor: '#3b82f6',
        textColor: '#ffffff',
        cardStyle: 'modern',
      },
    };

    const cleanCategory: TicketCategory = {
      id: 'cat_geral',
      eventId: cleanEventId,
      name: 'Geral / Convidados',
      color: '#3b82f6',
      badgeBg: '#eff6ff',
      badgeText: '#1d4ed8',
      quota: 300,
      description: 'Acesso geral ao evento e portaria principal',
      accessZone: 'Todas as Portarias',
      validTime: 'Integral',
    };

    const cleanVipCategory: TicketCategory = {
      id: 'cat_vip',
      eventId: cleanEventId,
      name: 'VIP / Área Exclusiva',
      color: '#a855f7',
      badgeBg: '#faf5ff',
      badgeText: '#7e22ce',
      quota: 100,
      description: 'Credenciamento prioritário e área VIP',
      accessZone: 'Entrada VIP & Portaria Principal',
      validTime: 'Integral',
    };

    const cleanAdminUser: UserProfile = {
      id: adminUser.id || `usr_admin_${Date.now()}`,
      name: adminUser.name || 'Administrador Master',
      email: adminUser.email || 'admin@empresa.com',
      role: 'admin',
      assignedGate: 'Todas as Portarias',
      status: 'active',
      lastLoginAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
    };

    const cleanAuditLog: AuditLog = {
      id: `log_init_${Date.now()}`,
      eventId: cleanEventId,
      timestamp: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
      action: 'guest_created',
      operator: cleanAdminUser.name,
      device: 'Painel Cloud Master',
      details: 'Sistema resetado com sucesso para nova empresa/organização. Instância limpa iniciada.',
      severity: 'info',
    };

    const { error: seedErr } = await supabase.from('events').upsert(cleanEvent);
    if (seedErr) throw new Error(seedErr.message);
    const { error: catErr } = await supabase.from('categories').upsert([cleanCategory, cleanVipCategory]);
    if (catErr) throw new Error(catErr.message);
    const { error: usrErr } = await supabase.from('users').upsert(cleanAdminUser);
    if (usrErr) throw new Error(usrErr.message);
    const { error: logErr } = await supabase.from('audit_logs').upsert(cleanAuditLog);
    if (logErr) throw new Error(logErr.message);

    localStorage.removeItem('eventiza_events');
    localStorage.removeItem('eventiza_guests');
    localStorage.removeItem('eventiza_categories');
    localStorage.removeItem('eventiza_logs');
    localStorage.removeItem('eventiza_users');
    localStorage.setItem('eventiza_current_event_id', cleanEventId);
    localStorage.setItem('eventiza_logged_user', JSON.stringify(cleanAdminUser));

    return {
      success: true,
      event: cleanEvent,
      categories: [cleanCategory, cleanVipCategory],
      user: cleanAdminUser,
    };
  } catch (error) {
    handleDataError(error, OperationType.WRITE, 'system_reset');
    throw error;
  }
}

export async function getDocById<T>(collection: string, id: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from(resolveTable(collection))
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as T) ?? null;
  } catch (error) {
    handleDataError(error, OperationType.GET, `${collection}/${id}`);
    return null;
  }
}

export async function getDocsWhere<T>(
  collection: string,
  field: string,
  value: string
): Promise<T[]> {
  try {
    const { data, error } = await supabase
      .from(resolveTable(collection))
      .select('*')
      .eq(field, value)
      .limit(50);
    if (error) throw new Error(error.message);
    return (data as T[]) ?? [];
  } catch (error) {
    handleDataError(error, OperationType.LIST, `${collection}.${field}`);
    return [];
  }
}

export async function getDocByField<T>(
  collection: string,
  field: string,
  value: string
): Promise<T | null> {
  const rows = await getDocsWhere<T>(collection, field, value);
  return rows[0] ?? null;
}
