import React from 'react';
import { 
  INITIAL_EVENTS,
  INITIAL_CATEGORIES, 
  INITIAL_GUESTS, 
  INITIAL_FORM_FIELDS, 
  INITIAL_LOGS, 
  INITIAL_USERS 
} from './data/mockData';
import { 
  EventData, 
  TicketCategory, 
  Guest, 
  FormField, 
  AuditLog, 
  UserProfile, 
  UserRole,
  CheckInScanResult,
  AuditActionType,
  EventLandingPageConfig,
  AppSettings
} from './types';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { CreateEventModal } from './components/CreateEventModal';
import { MassImportModal } from './components/MassImportModal';
import { SpecDocumentModal } from './components/SpecDocumentModal';
import { PublicInviteView } from './components/PublicInviteView';
import { PublicInviteNotFound } from './components/PublicInviteNotFound';
import { LoginView } from './components/LoginView';
import { SetPasswordModal } from './components/SetPasswordModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';

// Lazy-loaded view components (code splitting)
const EventsHubView = React.lazy(() => import('./components/EventsHubView').then(m => ({ default: m.EventsHubView })));
const DashboardView = React.lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const GuestListView = React.lazy(() => import('./components/GuestListView').then(m => ({ default: m.GuestListView })));
const DispatchCenterView = React.lazy(() => import('./components/DispatchCenterView').then(m => ({ default: m.DispatchCenterView })));
const InviteEditorView = React.lazy(() => import('./components/InviteEditorView').then(m => ({ default: m.InviteEditorView })));
const EventLandingPageView = React.lazy(() => import('./components/EventLandingPageView').then(m => ({ default: m.EventLandingPageView })));
const EventAiConciergeView = React.lazy(() => import('./components/EventAiConciergeView').then(m => ({ default: m.EventAiConciergeView })));
const BroadcastView = React.lazy(() => import('./components/BroadcastView').then(m => ({ default: m.BroadcastView })));
const PortariaScannerView = React.lazy(() => import('./components/PortariaScannerView').then(m => ({ default: m.PortariaScannerView })));
const FormBuilderView = React.lazy(() => import('./components/FormBuilderView').then(m => ({ default: m.FormBuilderView })));
const AuditLogsView = React.lazy(() => import('./components/AuditLogsView').then(m => ({ default: m.AuditLogsView })));
const TeamSettingsView = React.lazy(() => import('./components/TeamSettingsView').then(m => ({ default: m.TeamSettingsView })));
const AdminSettingsView = React.lazy(() => import('./components/AdminSettingsView').then(m => ({ default: m.AdminSettingsView })));
import { sound } from './utils/audio';
import { parseCurrentRoute, getGuestInviteUrl, getEventLandingUrl } from './utils/urlHelper';
import { 
  resetEntireDatabase,
  getDocById,
  getDocsWhere,
  getDocByField,
  supabase,
} from './services/supabase';
import { safeSetDoc, safeDeleteDoc } from './utils/firestoreWrite';
import { generateSecureToken } from './utils/token';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useLocalStorageSync } from './hooks/useLocalStorageSync';

export default function App() {
  // 1. Events State (Multi-event support)
  const [events, setEvents] = React.useState<EventData[]>(() => {
    const saved = localStorage.getItem('eventiza_events');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved events', e);
      }
    }
    return INITIAL_EVENTS;
  });

  const [currentEventId, setCurrentEventId] = React.useState<string>(() => {
    const saved = localStorage.getItem('eventiza_current_event_id');
    return saved || INITIAL_EVENTS[0].id;
  });

  // Current active event
  const currentEvent = React.useMemo(() => {
    return events.find(e => e.id === currentEventId) || events[0];
  }, [events, currentEventId]);

  // 2. Multi-record states
  const [categories, setCategories] = React.useState<TicketCategory[]>(() => {
    const saved = localStorage.getItem('eventiza_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [guests, setGuests] = React.useState<Guest[]>(() => {
    const saved = localStorage.getItem('eventiza_guests');
    return saved ? JSON.parse(saved) : INITIAL_GUESTS;
  });

  const [formFields, setFormFields] = React.useState<FormField[]>(() => {
    const saved = localStorage.getItem('eventiza_form_fields');
    return saved ? JSON.parse(saved) : INITIAL_FORM_FIELDS;
  });

  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('eventiza_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [users, setUsers] = React.useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('eventiza_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved users', e);
      }
    }
    return INITIAL_USERS;
  });

  const [appSettings, setAppSettings] = React.useState<AppSettings>(() => {
    const saved = localStorage.getItem('eventiza_app_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse app settings', e);
      }
    }
    return {
      groqApiKey: '',
      groqModel: 'openai/gpt-oss-120b',
      channelConfig: {
        whatsapp: {
          enabled: true,
          serverUrl: 'http://localhost:3000',
          sessionName: 'mi-sesion',
          delayMin: 15,
          delayMax: 45,
          maxRetries: 3,
        },
      },
    };
  });

  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('eventiza_logged_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch (e) {
        console.error('Failed to parse logged user', e);
      }
    }
    return null; // Require login authentication to access dashboard
  });

  // Auth Modals State
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = React.useState(false);
  const [setPasswordTargetTokenOrEmail, setSetPasswordTargetTokenOrEmail] = React.useState('');
  const [isSetPasswordFirstAccess, setIsSetPasswordFirstAccess] = React.useState(true);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = React.useState(false);

  // 3. Navigation & Modals
  const [currentTab, setCurrentTab] = React.useState<NavTab>('dashboard');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<EventData | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = React.useState(false);
  
  // Synchronous Public Route initialization (Guarantees public pages never flash or redirect to login/dashboard)
  const initialRoute = React.useMemo(() => parseCurrentRoute(), []);
  const [isPublicRoute, setIsPublicRoute] = React.useState<boolean>(initialRoute.isPublic);
  const [publicRouteCode, setPublicRouteCode] = React.useState<string>(initialRoute.code);
  const [isPublicGeneralEvent, setIsPublicGeneralEvent] = React.useState<boolean>(initialRoute.isGeneralEvent);
  const [isPublicLoading, setIsPublicLoading] = React.useState<boolean>(initialRoute.isPublic && !!initialRoute.code);
  const [isPortariaRoute, setIsPortariaRoute] = React.useState<boolean>(initialRoute.isPortaria);

  // 4. Persistence to LocalStorage
  useLocalStorageSync({ events, guests, categories, auditLogs, users, currentUser, currentEventId, appSettings });

  // 4.1 Supabase Auth: restaura sessão no load e reage a SIGNED_OUT
  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user?.email) {
        const profile = await getDocByField<UserProfile>('users', 'email', session.user.email);
        if (!mounted) return;
        if (profile && profile.status === 'active') {
          setCurrentUser(profile);
        } else {
          await supabase.auth.signOut();
        }
      } else {
        setCurrentUser(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setCurrentUser(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Real-Time Subscriptions for Multi-Device synchronization
  useSupabaseSync({ setEvents, setGuests, setCategories, setAuditLogs, setUsers });

  // Check for URL token on load (e.g. #create-password?token=... or #reset-password?token=...) or public invite route
  React.useEffect(() => {
    const checkRoutes = () => {
      const hash = window.location.hash;

      // 1. Password reset tokens
      if (hash.includes('token=')) {
        const match = hash.match(/token=([^&]+)/);
        if (match && match[1]) {
          const token = decodeURIComponent(match[1]);
          const isFirst = hash.includes('create-password');
          handleOpenSetPassword(token, isFirst);
          return;
        }
      }

      // 2. Public Guest Invite / Event Landing page link
      const route = parseCurrentRoute();
      if (route.isPortaria) {
        setIsPortariaRoute(true);
        setIsPublicRoute(false);
        setPublicRouteCode('');
        setIsPublicGeneralEvent(false);
        setIsPublicLoading(false);
      } else if (route.isPublic) {
        setIsPublicRoute(true);
        setIsPortariaRoute(false);
        setPublicRouteCode(route.code);
        setIsPublicGeneralEvent(route.isGeneralEvent);
      } else {
        setIsPublicRoute(false);
        setIsPortariaRoute(false);
        setPublicRouteCode('');
        setIsPublicGeneralEvent(false);
        setIsPublicLoading(false);
      }
    };

    checkRoutes();
    window.addEventListener('popstate', checkRoutes);
    window.addEventListener('hashchange', checkRoutes);
    return () => {
      window.removeEventListener('popstate', checkRoutes);
      window.removeEventListener('hashchange', checkRoutes);
    };
  }, []);

  // Proactive Firestore fetch for public route when guest is not in memory
  React.useEffect(() => {
    if (!isPublicRoute || !publicRouteCode) {
      setIsPublicLoading(false);
      return;
    }

    const clean = publicRouteCode.trim();
    const cleanLower = clean.toLowerCase();

    // Check if already in memory
    const inMemoryGuest = guests.find(g => 
      g.publicCode?.toLowerCase() === cleanLower ||
      g.qrPayloadToken?.toLowerCase() === cleanLower ||
      g.id?.toLowerCase() === cleanLower
    );

    const inMemoryEvent = events.find(e => 
      e.code?.toLowerCase() === cleanLower || 
      e.id?.toLowerCase() === cleanLower
    );

    if (inMemoryGuest || (isPublicGeneralEvent && inMemoryEvent)) {
      setIsPublicLoading(false);
      return;
    }

    let isMounted = true;
    setIsPublicLoading(true);

    async function fetchMissingData() {
      try {
        // 1. Query guest by publicCode
        const codeRows = await getDocsWhere<Guest>('guests', 'publicCode', clean);
        if (codeRows.length > 0 && isMounted) {
          const g = codeRows[0];
          setGuests(prev => prev.some(item => item.id === g.id) ? prev : [...prev, g]);
          setIsPublicLoading(false);
          return;
        }

        // 2. Query guest by qrPayloadToken
        const tokenRows = await getDocsWhere<Guest>('guests', 'qrPayloadToken', clean);
        if (tokenRows.length > 0 && isMounted) {
          const g = tokenRows[0];
          setGuests(prev => prev.some(item => item.id === g.id) ? prev : [...prev, g]);
          setIsPublicLoading(false);
          return;
        }

        // 3. Query guest by document ID
        const g = await getDocById<Guest>('guests', clean);
        if (g && isMounted) {
          setGuests(prev => prev.some(item => item.id === g.id) ? prev : [...prev, g]);
          setIsPublicLoading(false);
          return;
        }

        // 4. Query event by code
        const evtRows = await getDocsWhere<EventData>('events', 'code', clean);
        if (evtRows.length > 0 && isMounted) {
          const e = evtRows[0];
          setEvents(prev => prev.some(item => item.id === e.id) ? prev : [...prev, e]);
          setIsPublicLoading(false);
          return;
        }

        // 5. Query event by ID
        const e = await getDocById<EventData>('events', clean);
        if (e && isMounted) {
          setEvents(prev => prev.some(item => item.id === e.id) ? prev : [...prev, e]);
          setIsPublicLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching remote public record:', err);
      } finally {
        if (isMounted) {
          setIsPublicLoading(false);
        }
      }
    }

    fetchMissingData();

    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsPublicLoading(false);
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [isPublicRoute, publicRouteCode, guests, events, isPublicGeneralEvent]);

  // Auth Handlers
  const handleLogin = (user: UserProfile) => {
    const updatedUser: UserProfile = {
      ...user,
      lastLoginAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    safeSetDoc('users', updatedUser.id, updatedUser);
    logAudit('guest_created', `Login efetuado no sistema por ${user.name} (${user.role})`);
  };

  const handleLogout = () => {
    if (currentUser) {
      logAudit('guest_created', `Logout efetuado por ${currentUser.name}`);
    }
    supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handlePasswordSetSuccess = (updatedUser: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    safeSetDoc('users', updatedUser.id, updatedUser);
    logAudit('guest_updated', `Senha de acesso definida com sucesso para ${updatedUser.name}`);
  };

  const handleAdminSendPasswordReset = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return { success: false, token: '', user: users[0] };

    const token = generateSecureToken();
    const updatedUser: UserProfile = {
      ...targetUser,
      resetToken: token,
      resetRequestedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
    };

    setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    safeSetDoc('users', userId, updatedUser);
    logAudit('guest_updated', `Administrador gerou e enviou link de redefinição de senha para ${targetUser.name} (${targetUser.email})`);
    return { success: true, token, user: updatedUser };
  };

  const handleTriggerResetLink = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const targetUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!targetUser) {
      return { success: false, error: 'Nenhum usuário cadastrado encontrado com este e-mail.' };
    }

    const token = generateSecureToken();
    const updatedUser: UserProfile = {
      ...targetUser,
      resetToken: token,
      resetRequestedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
    };

    setUsers(prev => prev.map(u => u.id === targetUser.id ? updatedUser : u));
    safeSetDoc('users', targetUser.id, updatedUser);
    logAudit('guest_updated', `Solicitação de redefinição de senha disparada para ${targetUser.name}`);
    return { success: true, user: updatedUser, token };
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    setUsers(prev => prev.filter(u => u.id !== userId));
    safeDeleteDoc('users', userId);
    logAudit('guest_blocked', `Acesso de usuário revogado/excluído: ${target.name}`);
  };

  const handleOpenSetPassword = (tokenOrEmail: string, isFirstAccess: boolean) => {
    setSetPasswordTargetTokenOrEmail(tokenOrEmail);
    setIsSetPasswordFirstAccess(isFirstAccess);
    setIsSetPasswordModalOpen(true);
  };
  const currentEventGuests = React.useMemo(() => {
    return guests.filter(g => (g.eventId || 'evt_bp30') === currentEvent.id);
  }, [guests, currentEvent.id]);

  const currentEventCategories = React.useMemo(() => {
    const cats = categories.filter(c => (c.eventId || 'evt_bp30') === currentEvent.id);
    if (cats.length > 0) return cats;
    return [
      { 
        id: `cat_${currentEvent.id}_vip`, 
        eventId: currentEvent.id, 
        name: 'VIP & Executivo', 
        color: '#3B82F6', 
        badgeBg: '#EFF6FF',
        badgeText: '#1D4ED8',
        quota: 100,
        description: 'Acesso total e credenciamento exclusivo',
        accessZone: 'Área VIP + Plenária',
        validTime: 'Integral'
      },
      { 
        id: `cat_${currentEvent.id}_std`, 
        eventId: currentEvent.id, 
        name: 'Geral', 
        color: '#10B981', 
        badgeBg: '#ECFDF5',
        badgeText: '#047857',
        quota: 500,
        description: 'Acesso padrão ao evento',
        accessZone: 'Plenária Principal',
        validTime: 'Integral'
      },
    ];
  }, [categories, currentEvent.id]);

  const currentEventLogs = React.useMemo(() => {
    return auditLogs.filter(l => !l.eventId || l.eventId === currentEvent.id);
  }, [auditLogs, currentEvent.id]);

  // Log Audit Event Helper
  const logAudit = (
    action: AuditActionType,
    details: string,
    guestId?: string,
    guestName?: string,
    severity: 'info' | 'success' | 'warning' | 'error' = 'info',
    targetEventId: string = currentEvent.id
  ) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: targetEventId || '',
      timestamp: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
      action,
      guestId: guestId || '',
      guestName: guestName || '',
      operator: currentUser?.name || 'Sistema',
      device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Portaria Mobile PWA' : 'Painel Web Desktop',
      details,
      severity,
    };
    setAuditLogs(prev => [newLog, ...prev]);
    safeSetDoc('auditLogs', newLog.id, newLog);
  };

  // Event Switcher Handler
  const handleSelectEvent = (eventId: string) => {
    setCurrentEventId(eventId);
  };

  // Event Creation Handler
  const handleSaveEvent = (savedEvent: EventData) => {
    const exists = events.some(e => e.id === savedEvent.id);
    if (exists) {
      // Update existing
      setEvents(prev => prev.map(e => e.id === savedEvent.id ? savedEvent : e));
      safeSetDoc('events', savedEvent.id, savedEvent);
      logAudit('guest_updated', `Informações do evento "${savedEvent.title}" foram atualizadas`, undefined, undefined, 'info', savedEvent.id);
    } else {
      // Add new
      setEvents(prev => [savedEvent, ...prev]);
      setCurrentEventId(savedEvent.id);
      safeSetDoc('events', savedEvent.id, savedEvent);

      // Create default categories for this new event
      const defaultCategories: TicketCategory[] = [
        { 
          id: `cat_${savedEvent.id}_vip`, 
          eventId: savedEvent.id, 
          name: 'VIP & Convidados Especiais', 
          color: '#3B82F6', 
          badgeBg: '#EFF6FF',
          badgeText: '#1D4ED8',
          quota: Math.floor(savedEvent.maxCapacity * 0.3),
          description: 'Acesso prioritário e credenciamento exclusivo',
          accessZone: 'Área VIP + Auditório',
          validTime: 'Integral'
        },
        { 
          id: `cat_${savedEvent.id}_std`, 
          eventId: savedEvent.id, 
          name: 'Geral / Participantes', 
          color: '#10B981', 
          badgeBg: '#ECFDF5',
          badgeText: '#047857',
          quota: Math.floor(savedEvent.maxCapacity * 0.7),
          description: 'Acesso padrão ao evento',
          accessZone: 'Auditório Geral',
          validTime: 'Integral'
        },
      ];
      setCategories(prev => [...defaultCategories, ...prev]);
      defaultCategories.forEach((cat) => {
        try {
          safeSetDoc('categories', cat.id, cat);
        } catch (e) {
          console.error(e);
        }
      });

      logAudit('guest_created', `Novo evento criado com sucesso: "${savedEvent.title}" (ID: ${savedEvent.id})`, undefined, undefined, 'success', savedEvent.id);
      setCurrentTab('dashboard');
    }
  };

  // Event Duplication Handler
  const handleDuplicateEvent = (sourceEvent: EventData) => {
    const newId = `evt_${Date.now()}`;
    const newCode = `EVT-${Math.floor(1000 + Math.random() * 9000)}`;
    const clonedEvent: EventData = {
      ...sourceEvent,
      id: newId,
      code: newCode,
      title: `${sourceEvent.title} (Cópia)`,
      status: 'draft',
    };

    setEvents(prev => [clonedEvent, ...prev]);
    setCurrentEventId(newId);
    try {
      safeSetDoc('events', clonedEvent.id, clonedEvent);
    } catch (e) {
      console.error(e);
    }

    // Duplicate categories
    const sourceCats = categories.filter(c => (c.eventId || 'evt_bp30') === sourceEvent.id);
    const newCats: TicketCategory[] = sourceCats.map((cat, idx) => ({
      ...cat,
      id: `cat_${newId}_${idx}`,
      eventId: newId,
    }));
    setCategories(prev => [...newCats, ...prev]);
    newCats.forEach((cat) => {
      try {
        safeSetDoc('categories', cat.id, cat);
      } catch (e) {
        console.error(e);
      }
    });

    logAudit('guest_created', `Evento duplicado: "${clonedEvent.title}" criado a partir de "${sourceEvent.title}"`, undefined, undefined, 'info', newId);
    setCurrentTab('dashboard');
  };

  // Event Deletion Handler
  const handleDeleteEvent = (eventIdToDelete: string) => {
    const eventToDelete = events.find(e => e.id === eventIdToDelete);
    const remainingEvents = events.filter(e => e.id !== eventIdToDelete);

    if (remainingEvents.length === 0) {
      // If deleting the last event, generate a clean default replacement
      const fallbackEventId = `evt_${Date.now()}`;
      const fallbackEvent: EventData = {
        id: fallbackEventId,
        code: 'EVT-001',
        title: 'Novo Evento',
        subtitle: 'Credenciamento & Acesso Exclusivo',
        description: 'Evento criado automaticamente após a exclusão do anterior.',
        startDate: new Date().toLocaleDateString('pt-BR'),
        endDate: new Date().toLocaleDateString('pt-BR'),
        startTime: '19h00m',
        endTime: '23h00m',
        locationName: 'Espaço de Eventos',
        address: 'Av. Paulista, 1000',
        cityState: 'São Paulo - SP',
        maxCapacity: 200,
        status: 'published',
        coverUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
        inviteLayout: {
          bgTheme: 'dark',
          title: 'Novo Evento',
          subtitle: 'Credenciamento & Acesso Exclusivo',
          instructions: 'Apresente este QR Code na portaria de entrada.',
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

      setEvents([fallbackEvent]);
      setCurrentEventId(fallbackEventId);
      try {
        safeSetDoc('events', fallbackEvent.id, fallbackEvent);
        safeDeleteDoc('events', eventIdToDelete);
      } catch (err) {
        console.error(err);
      }
    } else {
      setEvents(remainingEvents);
      if (currentEventId === eventIdToDelete) {
        setCurrentEventId(remainingEvents[0].id);
      }
      try {
        safeDeleteDoc('events', eventIdToDelete);
      } catch (err) {
        console.error(err);
      }
    }

    // Remove guests & categories belonging to deleted event
    const guestsToRemove = guests.filter(g => g.eventId === eventIdToDelete);
    guestsToRemove.forEach(g => {
      try {
        safeDeleteDoc('guests', g.id);
      } catch (e) {
        console.error(e);
      }
    });

    setGuests(prev => prev.filter(g => g.eventId !== eventIdToDelete));
    setCategories(prev => prev.filter(c => c.eventId !== eventIdToDelete));

    logAudit('guest_blocked', `Evento excluído permanentemente: "${eventToDelete?.title || eventIdToDelete}"`, undefined, undefined, 'warning');
  };

  // Master Reset Handler (Cessão a Nova Empresa / Tenant)
  const handleSystemResetForNewTenant = async () => {
    if (!currentUser) return;
    const result = await resetEntireDatabase(currentUser);
    if (result && result.event) {
      setEvents([result.event]);
      setCurrentEventId(result.event.id);
      setCategories(result.categories);
      setGuests([]);
      setUsers([result.user]);
      setCurrentUser(result.user);
      setCurrentTab('events_hub');
    }
  };

  // Perform Atomic QR Check-in Scan (Scoped by active event)
  const handlePerformCheckIn = (
    payloadToken: string,
    operatorName: string,
    gateName: string
  ): CheckInScanResult => {
    const timestampStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const deviceStr = typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile Portaria (PWA)' : 'Terminal Desktop Portaria';

    // 1. Locate Guest by Token, PublicCode or ID across current event guests
    const targetGuest = currentEventGuests.find(
      g => g.qrPayloadToken === payloadToken || g.publicCode === payloadToken || g.id === payloadToken
    );

    // 2. Not Found or Invalid for this event
    if (!targetGuest) {
      // Check if this token belongs to another event
      const otherEventGuest = guests.find(
        g => g.qrPayloadToken === payloadToken || g.publicCode === payloadToken || g.id === payloadToken
      );

      if (otherEventGuest) {
        const otherEvent = events.find(e => e.id === otherEventGuest.eventId);
        logAudit('checkin_invalid', `Tentativa de entrada com ingresso de OUTRO evento: ${otherEvent?.title || 'Outro evento'}`, undefined, undefined, 'error');
        return {
          status: 'invalid',
          message: `Ingresso Pertence a Outro Evento: "${otherEvent?.title || 'Outro Evento'}"`,
          timestamp: timestampStr,
          operator: operatorName,
          device: deviceStr,
        };
      }

      logAudit('checkin_invalid', `Tentativa de leitura de QR Code inválido ou inexistente: ${payloadToken}`, undefined, undefined, 'error');
      return {
        status: 'invalid',
        message: 'QR Code Não Cadastrado ou Inválido',
        timestamp: timestampStr,
        operator: operatorName,
        device: deviceStr,
      };
    }

    // 3. Blocked or Cancelled
    if (targetGuest.status === 'blocked' || targetGuest.status === 'cancelled') {
      logAudit('checkin_invalid', `Acesso negado: Ingresso de ${targetGuest.name} está bloqueado/cancelado`, targetGuest.id, targetGuest.name, 'error');
      return {
        status: 'blocked',
        guest: targetGuest,
        message: `Ingresso de ${targetGuest.name} está Cancelado / Bloqueado`,
        timestamp: timestampStr,
        operator: operatorName,
        device: deviceStr,
      };
    }

    // 4. DUPLICATE CHECK-IN ATTEMPT (Anti-fraud Protection)
    if (targetGuest.isCheckedIn) {
      logAudit(
        'checkin_duplicate_attempt',
        `ALERTA DE DUPLICIDADE: Tentativa de reentrada com o mesmo QR Code de ${targetGuest.name} na ${gateName}`,
        targetGuest.id,
        targetGuest.name,
        'warning'
      );

      return {
        status: 'duplicate',
        guest: targetGuest,
        message: `ATENÇÃO: Entrada Já Realizada para ${targetGuest.name}!`,
        timestamp: timestampStr,
        operator: operatorName,
        device: deviceStr,
        previousCheckIn: {
          timestamp: targetGuest.checkInTimestamp || timestampStr,
          operator: targetGuest.checkInOperator || 'Operador Portaria',
          device: targetGuest.checkInDevice || 'Portaria Principal',
          gate: targetGuest.checkInGate || gateName,
        },
      };
    }

    // 5. SUCCESSFUL CHECK-IN
    const updatedGuest: Guest = {
      ...targetGuest,
      isCheckedIn: true,
      checkInTimestamp: timestampStr,
      checkInOperator: operatorName,
      checkInDevice: deviceStr,
      checkInGate: gateName,
    };

    setGuests(prev => prev.map(g => (g.id === targetGuest.id ? updatedGuest : g)));
    safeSetDoc('guests', updatedGuest.id, updatedGuest);

    logAudit(
      'checkin_success',
      `Check-in autorizado com sucesso para ${targetGuest.name} (${targetGuest.publicCode}) na ${gateName}`,
      targetGuest.id,
      targetGuest.name,
      'success'
    );

    return {
      status: 'success',
      guest: updatedGuest,
      message: `Entrada autorizada com sucesso para ${targetGuest.name}`,
      timestamp: timestampStr,
      operator: operatorName,
      device: deviceStr,
    };
  };

  // Toggle Check-in Switch directly from table
  const handleToggleCheckIn = (guestId: string, currentStatus: boolean) => {
    const target = guests.find(g => g.id === guestId);
    if (!target) return;

    if (!currentStatus) {
      sound.playSuccess();
      handlePerformCheckIn(target.qrPayloadToken, currentUser.name, currentUser.assignedGate || 'Portaria Principal A');
    } else {
      const updated: Guest = {
        ...target,
        isCheckedIn: false,
        checkInTimestamp: undefined,
        checkInOperator: undefined,
      };
      setGuests(guests.map(g => (g.id === guestId ? updated : g)));
      logAudit('guest_updated', `Check-in de ${target.name} foi revertido manualmente pelo organizador`, target.id, target.name, 'info');
    }
  };

  // Add Single Guest to active event
  const handleAddGuest = (newGuestData: Partial<Guest>) => {
    const randId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const guestPublicCode = `${currentEvent.code.replace('EVT-', 'BP')}-${Math.floor(1000 + Math.random() * 9000)}-${randId.slice(0, 4)}`;
    const guestQrToken = `EVZ-${currentEvent.id.toUpperCase()}-${newGuestData.name?.toUpperCase().replace(/\s+/g, '') || 'CONVIDADO'}-${randId}`;

    const guest: Guest = {
      id: `gst_${Date.now()}`,
      eventId: currentEvent.id,
      publicCode: guestPublicCode,
      qrPayloadToken: guestQrToken,
      name: newGuestData.name || 'Convidado Sem Nome',
      email: newGuestData.email || '',
      phone: newGuestData.phone || '',
      ticketCategoryId: newGuestData.ticketCategoryId || currentEventCategories[0].id,
      status: 'confirmed',
      isCheckedIn: false,
      emailStatus: 'not_sent',
      whatsappStatus: 'not_sent',
      docNumber: newGuestData.docNumber || '',
      companions: newGuestData.companions || 0,
      notes: newGuestData.notes || '',
      qrVersion: 1,
      createdAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setGuests(prev => [guest, ...prev]);
    safeSetDoc('guests', guest.id, guest);
    logAudit('guest_created', `Novo participante cadastrado: ${guest.name} (${guest.publicCode})`, guest.id, guest.name, 'info');
  };

  // Bulk Import for active event
  const handleBulkImport = (importedList: Array<Partial<Guest>>) => {
    const newGuests: Guest[] = importedList.map((item, idx) => {
      const randId = Math.random().toString(36).substring(2, 9).toUpperCase();
      const guestPublicCode = item.publicCode && item.publicCode.trim().length > 0
        ? item.publicCode.trim()
        : `${currentEvent.code.replace('EVT-', 'BP')}-${Math.floor(1000 + Math.random() * 9000)}-${randId.slice(0, 4)}`;
      const guestQrToken = `EVZ-${currentEvent.id.toUpperCase()}-${(item.name || 'CONVIDADO').toUpperCase().replace(/\s+/g, '')}-${randId}`;

      return {
        id: `gst_imp_${Date.now()}_${idx}`,
        eventId: currentEvent.id,
        publicCode: guestPublicCode,
        qrPayloadToken: guestQrToken,
        name: item.name || 'Convidado',
        email: item.email || '',
        phone: item.phone || '',
        ticketCategoryId: item.ticketCategoryId || currentEventCategories[0].id,
        status: 'confirmed',
        isCheckedIn: false,
        emailStatus: 'not_sent',
        whatsappStatus: 'not_sent',
        docNumber: item.docNumber || '',
        companions: item.companions || 0,
        notes: 'Importado via planilha em lote',
        qrVersion: 1,
        createdAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
    });

    setGuests(prev => [...newGuests, ...prev]);
    newGuests.forEach(g => {
      try {
        safeSetDoc('guests', g.id, g);
      } catch (err) {
        console.error('Error saving imported guest to Supabase:', err);
      }
    });

    logAudit('bulk_imported', `Importação em massa concluída: ${newGuests.length} novos convidados adicionados com QR Codes gerados para o evento "${currentEvent.title}"`, undefined, undefined, 'success');
  };

  // Reissue QR Code
  const handleReissueQr = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    const newRand = Math.random().toString(36).substring(2, 9).toUpperCase();
    const newQrToken = `EVZ-${currentEvent.id.toUpperCase()}-${guest.name.toUpperCase().replace(/\s+/g, '')}-${newRand}`;

    const updated: Guest = {
      ...guest,
      qrPayloadToken: newQrToken,
      qrVersion: guest.qrVersion + 1,
      reissuedAt: new Date().toLocaleString('pt-BR'),
      isCheckedIn: false,
      checkInTimestamp: undefined,
    };

    setGuests(guests.map(g => (g.id === guestId ? updated : g)));
    safeSetDoc('guests', guestId, updated);
    logAudit('qr_reissued', `QR Code de ${guest.name} reemitido para a versão v${updated.qrVersion}. Código anterior foi invalidado.`, guest.id, guest.name, 'warning');
  };

  // Block / Cancel Guest
  const handleBlockGuest = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    const newStatus = guest.status === 'blocked' ? 'confirmed' : 'blocked';
    const updated: Guest = { ...guest, status: newStatus };
    setGuests(guests.map(g => (g.id === guestId ? updated : g)));
    safeSetDoc('guests', guestId, updated);
    logAudit('guest_blocked', `Status de ${guest.name} alterado para ${newStatus === 'blocked' ? 'Bloqueado' : 'Liberado'}`, guest.id, guest.name, newStatus === 'blocked' ? 'error' : 'info');
  };

  // Delete Guest permanently
  const handleDeleteGuest = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    setGuests(prev => prev.filter(g => g.id !== guestId));
    safeDeleteDoc('guests', guestId);
    logAudit('guest_blocked', `Participante excluído permanentemente: "${guest.name}" (${guest.publicCode})`, guest.id, guest.name, 'warning');
  };

  // Handle guest RSVP update from Public Landing Page
  const handleUpdateGuestRsvp = (guestId: string, isConfirmed: boolean) => {
    const targetGuest = guests.find(g => g.id === guestId);
    if (!targetGuest) return;

    const newStatus = isConfirmed ? 'confirmed' : 'cancelled';
    const updated: Guest = {
      ...targetGuest,
      status: newStatus,
    };

    setGuests(prev => prev.map(g => g.id === guestId ? updated : g));
    try {
      safeSetDoc('guests', guestId, updated);
    } catch (e) {
      console.error('Error updating RSVP in Supabase', e);
    }
    logAudit(
      'guest_updated',
      `Convidado ${targetGuest.name} ${isConfirmed ? 'confirmou presença' : 'informou ausência'} pela Landing Page do Evento`,
      targetGuest.id,
      targetGuest.name,
      isConfirmed ? 'success' : 'warning'
    );
  };

  // Render Portaria Scanner Full-Screen (Mobile-First, No Sidebar)
  if (isPortariaRoute) {
    // Filter guests by user's assigned events (if any)
    const assignedEventIds = currentUser?.assignedEventIds || [];
    const portariaGuests = assignedEventIds.length > 0
      ? guests.filter(g => g.eventId && assignedEventIds.includes(g.eventId))
      : guests;

    return (
      <div className="h-[100dvh] w-screen overflow-y-auto bg-slate-950 overscroll-contain">
        <React.Suspense fallback={
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <PortariaScannerView
            event={currentEvent}
            guests={portariaGuests}
            categories={categories}
            currentUser={currentUser!}
            onPerformCheckIn={handlePerformCheckIn}
          />
        </React.Suspense>
      </div>
    );
  }

  // Render Public Guest Invite Page or General Event Landing Page if requested
  if (isPublicRoute) {
    const clean = (publicRouteCode || '').trim();
    const cleanLower = clean.toLowerCase();

    // 1. Check in-memory guest by publicCode, qrPayloadToken or ID
    const matchedGuest = cleanLower ? guests.find(g => 
      g.publicCode?.toLowerCase() === cleanLower || 
      g.qrPayloadToken?.toLowerCase() === cleanLower || 
      g.id?.toLowerCase() === cleanLower
    ) : null;

    // 2. Check in-memory event by code or ID
    const matchedEventDirect = cleanLower ? events.find(e => 
      e.code?.toLowerCase() === cleanLower || 
      e.id?.toLowerCase() === cleanLower
    ) : null;

    // Event associated with guest or matched event or fallback to currentEvent
    const resolvedEvent = matchedGuest 
      ? (events.find(e => e.id === matchedGuest.eventId) || currentEvent)
      : (matchedEventDirect || currentEvent);

    // Category associated with guest
    const resolvedCategory = matchedGuest 
      ? (categories.find(c => c.id === matchedGuest.ticketCategoryId) || null)
      : null;

    // Loading State
    if (isPublicLoading && !matchedGuest && !matchedEventDirect) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-base font-bold text-white tracking-tight">Carregando seu Convite Digital...</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">{clean}</p>
        </div>
      );
    }

    // If not general event and guest not found (and not directly matching an event)
    if (!matchedGuest && !isPublicGeneralEvent && !matchedEventDirect) {
      return (
        <PublicInviteNotFound
          codeEntered={clean || 'Código não informado'}
          onRetry={() => window.location.reload()}
        />
      );
    }

    return (
      <PublicInviteView
        event={resolvedEvent}
        guest={matchedGuest || null}
        category={resolvedCategory}
        onUpdateRsvp={handleUpdateGuestRsvp}
      />
    );
  }

  // If not logged in, render Authentication Screen (Login)
  if (!currentUser) {
    return (
      <>
        <LoginView
          users={users}
          onLogin={handleLogin}
          onOpenSetPassword={handleOpenSetPassword}
          onOpenForgotPassword={() => setIsForgotPasswordModalOpen(true)}
        />

        {/* Set / Create Password Modal (for 1st access or reset) */}
        <SetPasswordModal
          isOpen={isSetPasswordModalOpen}
          onClose={() => setIsSetPasswordModalOpen(false)}
          users={users}
          initialTokenOrEmail={setPasswordTargetTokenOrEmail}
          isFirstAccess={isSetPasswordFirstAccess}
          onPasswordSetSuccess={handlePasswordSetSuccess}
        />

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={isForgotPasswordModalOpen}
          onClose={() => setIsForgotPasswordModalOpen(false)}
          users={users}
          onTriggerResetLink={handleTriggerResetLink}
          onOpenSetPasswordWithToken={(token) => handleOpenSetPassword(token, false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        event={currentEvent}
        allEvents={events}
        onSelectEvent={handleSelectEvent}
        onOpenCreateEventModal={() => {
          setEditingEvent(null);
          setIsCreateEventModalOpen(true);
        }}
        onNavigateToEventsHub={() => setCurrentTab('events_hub')}
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={setCurrentUser}
        onOpenSpecModal={() => setIsSpecModalOpen(true)}
        onOpenPublicInvite={() => {
          const sample = currentEventGuests[0] || guests[0];
          if (sample) {
            window.open(getGuestInviteUrl(sample.publicCode), '_blank');
          } else {
            window.open(getEventLandingUrl(currentEvent.code || currentEvent.id), '_blank');
          }
        }}
        onOpenQuickScanner={() => setCurrentTab('scanner')}
        onLogout={handleLogout}
        onChangePassword={() => handleOpenSetPassword(currentUser.email, false)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          pendingCheckInCount={currentEventGuests.filter(g => !g.isCheckedIn).length}
          totalGuests={currentEventGuests.length}
          totalEventsCount={events.length}
          currentEvent={currentEvent}
          onOpenCreateEventModal={() => {
            setEditingEvent(null);
            setIsCreateEventModalOpen(true);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100/90 min-h-[calc(100vh-61px)]">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
          {/* 0. Hub de Todos os Eventos */}
          {currentTab === 'events_hub' && (
            <EventsHubView
              events={events}
              currentEventId={currentEventId}
              guests={guests}
              categories={categories}
              onSelectEvent={(eventId) => {
                handleSelectEvent(eventId);
                setCurrentTab('dashboard');
              }}
              onOpenCreateModal={() => {
                setEditingEvent(null);
                setIsCreateEventModalOpen(true);
              }}
              onOpenEditModal={(eventToEdit) => {
                setEditingEvent(eventToEdit);
                setIsCreateEventModalOpen(true);
              }}
              onDuplicateEvent={handleDuplicateEvent}
              onDeleteEvent={handleDeleteEvent}
              onNavigateToDashboard={() => setCurrentTab('dashboard')}
              onNavigateToScanner={() => setCurrentTab('scanner')}
            />
          )}

          {/* 1. Painel do Evento Selecionado */}
          {currentTab === 'dashboard' && (
            <DashboardView
              event={currentEvent}
              guests={currentEventGuests}
              categories={currentEventCategories}
              auditLogs={currentEventLogs}
              onOpenInviteModal={() => setCurrentTab('invite_editor')}
              onOpenScanner={() => setCurrentTab('scanner')}
              onNavigateToGuests={() => setCurrentTab('guests')}
              onNavigateToDispatch={() => setCurrentTab('dispatch')}
            />
          )}

          {/* 2. Lista de Participantes & Check-in */}
          {currentTab === 'guests' && (
            <GuestListView
              guests={currentEventGuests}
              categories={currentEventCategories}
              event={currentEvent}
              currentUser={currentUser}
              onToggleCheckIn={handleToggleCheckIn}
              onAddGuest={handleAddGuest}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onReissueQr={handleReissueQr}
              onBlockGuest={handleBlockGuest}
              onDeleteGuest={handleDeleteGuest}
              onLogAudit={logAudit}
            />
          )}

          {/* 3. Central de Disparos de Convites */}
          {currentTab === 'dispatch' && (
            <DispatchCenterView
              guests={currentEventGuests}
              event={currentEvent}
              categories={currentEventCategories}
              onUpdateGuestStatus={(id, updates) => {
                const target = guests.find(g => g.id === id);
                if (target) {
                  const updated = { ...target, ...updates };
                  setGuests(guests.map(g => (g.id === id ? updated : g)));
                  try {
                    safeSetDoc('guests', id, updated);
                  } catch (e) {
                    console.error(e);
                  }
                }
              }}
              onLogAudit={logAudit}
            />
          )}

          {/* 4. Editor Visual de Layout do Convite */}
          {currentTab === 'invite_editor' && (
            <InviteEditorView
              event={currentEvent}
              categories={currentEventCategories}
              sampleGuest={currentEventGuests[0] || guests[0]}
              onSaveLayout={(updatedLayout) => {
                const updatedEvent = { ...currentEvent, inviteLayout: updatedLayout };
                setEvents(events.map(e => e.id === currentEvent.id ? updatedEvent : e));
                logAudit('guest_updated', `Layout visual do convite atualizado para o evento "${currentEvent.title}"`);
              }}
              onOpenPublicInvite={() => {
                const sample = currentEventGuests[0] || guests[0];
                if (sample) {
                  window.open(getGuestInviteUrl(sample.publicCode), '_blank');
                } else {
                  window.open(getEventLandingUrl(currentEvent.code || currentEvent.id), '_blank');
                }
              }}
            />
          )}

          {/* 4.1 Página do Evento (Landing Page com Horários, Cardápio, Local e RSVP) */}
          {currentTab === 'landing_page' && (
            <EventLandingPageView
              event={currentEvent}
              categories={currentEventCategories}
              sampleGuest={currentEventGuests[0] || guests[0]}
              onSaveLandingConfig={(updatedConfig: EventLandingPageConfig) => {
                const updatedEvent: EventData = { 
                  ...currentEvent, 
                  landingPageConfig: updatedConfig 
                };
                setEvents(events.map(e => e.id === currentEvent.id ? updatedEvent : e));
                try {
                  safeSetDoc('events', updatedEvent.id, updatedEvent, { merge: true });
                } catch (err) {
                  console.error('Error saving event landing config in Supabase:', err);
                }
              }}
              onOpenPublicLanding={(guestId) => {
                const targetGuest = guestId ? guests.find(g => g.id === guestId) : (currentEventGuests[0] || guests[0]);
                if (targetGuest) {
                  window.open(getGuestInviteUrl(targetGuest.publicCode), '_blank');
                } else {
                  window.open(getEventLandingUrl(currentEvent.code || currentEvent.id), '_blank');
                }
              }}
              onLogAudit={logAudit}
            />
          )}

          {/* 4.1 Concierge IA & Treinamento Gemini */}
          {currentTab === 'ai_concierge' && (
            <EventAiConciergeView
              event={currentEvent}
              appSettings={appSettings}
              onUpdateEvent={(updatedEvent) => {
                setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
                try {
                  safeSetDoc('events', updatedEvent.id, updatedEvent, { merge: true });
                } catch (err) {
                  console.error('Error saving event AI config:', err);
                }
              }}
              onLogAudit={logAudit}
            />
          )}

          {/* 4.2 Envio de Convites em Massa (Broadcast) */}
          {currentTab === 'broadcast' && (
            <BroadcastView
              event={currentEvent}
              guests={currentEventGuests}
            />
          )}

          {/* 5. Leitor QR de Portaria PWA */}
          {currentTab === 'scanner' && (
            <PortariaScannerView
              event={currentEvent}
              guests={currentEventGuests}
              categories={currentEventCategories}
              currentUser={currentUser}
              onPerformCheckIn={handlePerformCheckIn}
            />
          )}

          {/* 6. Construtor de Formulário de Inscrição */}
          {currentTab === 'form_builder' && (
            <FormBuilderView
              fields={formFields}
              onSaveFields={(updated) => {
                setFormFields(updated);
                logAudit('guest_updated', 'Campos do formulário de inscrição atualizados');
              }}
            />
          )}

          {/* 7. Auditoria, Segurança & Gestão de Dados */}
          {currentTab === 'logs' && (
            <AuditLogsView 
              logs={currentEventLogs}
              currentEvent={currentEvent}
              allEvents={events}
              currentUser={currentUser}
              onDeleteCurrentEvent={handleDeleteEvent}
              onSystemResetForNewTenant={handleSystemResetForNewTenant}
              cloudConnected={true}
            />
          )}

          {/* 8. Equipe & Permissões */}
          {currentTab === 'settings' && (
            <TeamSettingsView
              users={users}
              events={events}
              onAddUser={(newUser) => {
                setUsers(prev => [...prev, newUser]);
                safeSetDoc('users', newUser.id, newUser);
                logAudit('guest_created', `Novo membro adicionado à equipe: ${newUser.name} (${newUser.role}) com link de 1º acesso enviado`);
              }}
              onUpdateRole={(userId, newRole) => {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
                const target = users.find(u => u.id === userId);
                if (target) safeSetDoc('users', userId, { ...target, role: newRole });
                logAudit('guest_updated', `Permissão de usuário alterada para ${newRole}`);
              }}
              onUpdateAssignedEvents={(userId, eventIds) => {
                setUsers(users.map(u => u.id === userId ? { ...u, assignedEventIds: eventIds } : u));
                const target = users.find(u => u.id === userId);
                if (target) safeSetDoc('users', userId, { ...target, assignedEventIds: eventIds });
                logAudit('guest_updated', `Eventos atribuídos ao membro da equipe atualizados`);
              }}
              onDeleteUser={handleDeleteUser}
              onAdminSendPasswordReset={handleAdminSendPasswordReset}
              onOpenSetPasswordModal={handleOpenSetPassword}
            />
          )}

          {/* 8.5 Configurações Gerais do Sistema */}
          {currentTab === 'admin_settings' && (
            <AdminSettingsView
              settings={appSettings}
              onUpdateSettings={setAppSettings}
            />
          )}

          {/* 9. Especificação Técnica Completa */}
          {currentTab === 'spec' && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Especificação Técnica Completa (10 Partes)</h2>
                  <p className="text-xs text-slate-500 mt-1">Consulte os modelos de dados, fluxo de check-in atômico antifraude e arquitetura do BP Eventos</p>
                </div>
                <button
                  onClick={() => setIsSpecModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer shrink-0"
                >
                  Abrir Leitor Completo em Tela Cheia
                </button>
              </div>
              <AuditLogsView logs={currentEventLogs} />
            </div>
          )}
          </React.Suspense>
        </main>
      </div>

      {/* Set / Change Password Modal */}
      <SetPasswordModal
        isOpen={isSetPasswordModalOpen}
        onClose={() => setIsSetPasswordModalOpen(false)}
        users={users}
        initialTokenOrEmail={setPasswordTargetTokenOrEmail}
        isFirstAccess={isSetPasswordFirstAccess}
        onPasswordSetSuccess={handlePasswordSetSuccess}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        users={users}
        onTriggerResetLink={handleTriggerResetLink}
        onOpenSetPasswordWithToken={(token) => handleOpenSetPassword(token, false)}
      />

      {/* Modal de Criação / Edição de Evento */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => {
          setIsCreateEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSaveEvent={handleSaveEvent}
        initialData={editingEvent || undefined}
      />

      {/* Mass Import Modal */}
      <MassImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        categories={currentEventCategories}
        onImportSuccess={handleBulkImport}
        eventName={currentEvent.title}
      />

      {/* Full 10-Part Specification Modal */}
      <SpecDocumentModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />
    </div>
  );
}
