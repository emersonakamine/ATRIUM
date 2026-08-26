import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { EventData, Guest, TicketCategory, AuditLog, UserProfile } from '../types';
import { 
  INITIAL_EVENTS, 
  INITIAL_CATEGORIES, 
  INITIAL_GUESTS, 
  INITIAL_LOGS, 
  INITIAL_USERS 
} from '../data/mockData';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_test', 'connection'));
    return true;
  } catch (error) {
    console.warn('Firestore connection test failed:', error);
    return false;
  }
}

// Sync Service: Seed Initial Data if Collections are Empty
export async function seedInitialDatabaseIfNeeded() {
  try {
    const eventsSnap = await getDocs(collection(db, 'events'));
    if (eventsSnap.empty) {
      console.log('Seeding initial events, guests, categories and users into Firestore...');
      const batch = writeBatch(db);

      INITIAL_EVENTS.forEach((evt) => {
        batch.set(doc(db, 'events', evt.id), evt);
      });

      INITIAL_CATEGORIES.forEach((cat) => {
        batch.set(doc(db, 'categories', cat.id), cat);
      });

      INITIAL_GUESTS.forEach((gst) => {
        batch.set(doc(db, 'guests', gst.id), gst);
      });

      INITIAL_LOGS.forEach((log) => {
        batch.set(doc(db, 'auditLogs', log.id), log);
      });

      INITIAL_USERS.forEach((usr) => {
        batch.set(doc(db, 'users', usr.id), usr);
      });

      await batch.commit();
      console.log('Initial data seeded successfully in Firestore!');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed');
  }
}

// Global System Reset (Cessão da Plataforma / Nova Empresa)
export async function resetEntireDatabase(adminUser: UserProfile) {
  try {
    console.log('Performing Total System Reset...');
    
    // 1. Delete all existing docs
    const collectionsToClear = ['events', 'guests', 'categories', 'auditLogs', 'users'];
    for (const collName of collectionsToClear) {
      const snap = await getDocs(collection(db, collName));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 2. Re-create clean initial instance with the requesting Admin as primary owner
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
      id: `cat_geral`,
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
      id: `cat_vip`,
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

    const initBatch = writeBatch(db);
    initBatch.set(doc(db, 'events', cleanEvent.id), cleanEvent);
    initBatch.set(doc(db, 'categories', cleanCategory.id), cleanCategory);
    initBatch.set(doc(db, 'categories', cleanVipCategory.id), cleanVipCategory);
    initBatch.set(doc(db, 'users', cleanAdminUser.id), cleanAdminUser);
    initBatch.set(doc(db, 'auditLogs', cleanAuditLog.id), cleanAuditLog);
    await initBatch.commit();

    // Clear local storage overrides
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
    handleFirestoreError(error, OperationType.WRITE, 'system_reset');
    throw error;
  }
}
