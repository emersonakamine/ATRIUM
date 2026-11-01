import React, { useEffect } from 'react';
import { EventData, Guest, TicketCategory, AuditLog, UserProfile } from '../types';
import {
  supabase,
  testFirestoreConnection,
  seedInitialDatabaseIfNeeded,
  handleDataError,
  OperationType,
} from '../services/supabase';

interface DbSyncState {
  setEvents: React.Dispatch<React.SetStateAction<EventData[]>>;
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  setCategories: React.Dispatch<React.SetStateAction<TicketCategory[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
}

function upsertById<T extends { id: string }>(prev: T[], row: Partial<T> & { id: string }): T[] {
  const idx = prev.findIndex((x) => x.id === row.id);
  if (idx === -1) return [...prev, row as T];
  const next = [...prev];
  next[idx] = { ...prev[idx], ...(row as T) };
  return next;
}

export function useSupabaseSync({ setEvents, setGuests, setCategories, setAuditLogs, setUsers }: DbSyncState) {
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchAll<T>(table: string, setter: React.Dispatch<React.SetStateAction<T[]>>) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        handleDataError(error, OperationType.LIST, table);
        return;
      }
      if (cancelled || !data || data.length === 0) return;
      setter(data as T[]);
    }

    async function setup() {
      if (cancelled) return;

      fetchAll<EventData>('events', setEvents);
      fetchAll<Guest>('guests', setGuests);
      fetchAll<TicketCategory>('categories', setCategories);
      fetchAll<AuditLog>('audit_logs', setAuditLogs);
      fetchAll<UserProfile>('users', setUsers);

      if (channel) {
        await supabase.removeChannel(channel);
        channel = null;
      }

      channel = supabase
        .channel('db-sync-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
          if (payload.eventType === 'DELETE') {
            setEvents((prev) => prev.filter((x) => x.id !== (payload.old as { id?: string }).id));
          } else {
            setEvents((prev) => upsertById(prev, payload.new as EventData));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, (payload) => {
          if (payload.eventType === 'DELETE') {
            setGuests((prev) => prev.filter((x) => x.id !== (payload.old as { id?: string }).id));
          } else {
            setGuests((prev) => upsertById(prev, payload.new as Guest));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
          if (payload.eventType === 'DELETE') {
            setCategories((prev) => prev.filter((x) => x.id !== (payload.old as { id?: string }).id));
          } else {
            setCategories((prev) => upsertById(prev, payload.new as TicketCategory));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, (payload) => {
          if (payload.eventType === 'DELETE') {
            setAuditLogs((prev) => prev.filter((x) => x.id !== (payload.old as { id?: string }).id));
          } else {
            setAuditLogs((prev) => upsertById(prev, payload.new as AuditLog));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          if (payload.eventType === 'DELETE') {
            setUsers((prev) => prev.filter((x) => x.id !== (payload.old as { id?: string }).id));
          } else {
            setUsers((prev) => upsertById(prev, payload.new as UserProfile));
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') console.log('Supabase realtime connected');
        });
    }

    testFirestoreConnection();
    seedInitialDatabaseIfNeeded();
    setup();

    // Após login/logout o papel do JWT muda -> re-assina o canal com o papel certo
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setup();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [setEvents, setGuests, setCategories, setAuditLogs, setUsers]);
}
