import { useEffect } from 'react';
import { EventData, Guest, TicketCategory, AuditLog, UserProfile, AppSettings } from '../types';

interface LocalStorageSyncProps {
  events: EventData[];
  guests: Guest[];
  categories: TicketCategory[];
  auditLogs: AuditLog[];
  users: UserProfile[];
  currentUser: UserProfile | null;
  currentEventId: string;
  appSettings: AppSettings;
}

export function useLocalStorageSync({
  events,
  guests,
  categories,
  auditLogs,
  users,
  currentUser,
  currentEventId,
  appSettings,
}: LocalStorageSyncProps) {
  useEffect(() => {
    localStorage.setItem('eventiza_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('eventiza_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('eventiza_logged_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('eventiza_logged_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('eventiza_current_event_id', currentEventId);
  }, [currentEventId]);

  useEffect(() => {
    localStorage.setItem('eventiza_guests', JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem('eventiza_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('eventiza_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('eventiza_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);
}
