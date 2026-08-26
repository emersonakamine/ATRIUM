import React, { useEffect } from 'react';
import { EventData, Guest, TicketCategory, AuditLog, UserProfile } from '../types';
import { 
  db, 
  testFirestoreConnection, 
  seedInitialDatabaseIfNeeded, 
  handleFirestoreError,
  OperationType 
} from '../services/firebase';
import { 
  collection, 
  onSnapshot 
} from 'firebase/firestore';

interface FirestoreSyncState {
  setEvents: React.Dispatch<React.SetStateAction<EventData[]>>;
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  setCategories: React.Dispatch<React.SetStateAction<TicketCategory[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
}

export function useFirestoreSync({ setEvents, setGuests, setCategories, setAuditLogs, setUsers }: FirestoreSyncState) {
  useEffect(() => {
    testFirestoreConnection();
    seedInitialDatabaseIfNeeded();

    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      if (!snapshot.empty) {
        const remoteEvents: EventData[] = [];
        snapshot.forEach((docSnap) => {
          remoteEvents.push(docSnap.data() as EventData);
        });
        if (remoteEvents.length > 0) {
          setEvents(remoteEvents);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
    });

    const unsubGuests = onSnapshot(collection(db, 'guests'), (snapshot) => {
      if (!snapshot.empty) {
        const remoteGuests: Guest[] = [];
        snapshot.forEach((docSnap) => {
          remoteGuests.push(docSnap.data() as Guest);
        });
        if (remoteGuests.length > 0) {
          setGuests(remoteGuests);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'guests');
    });

    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      if (!snapshot.empty) {
        const remoteCats: TicketCategory[] = [];
        snapshot.forEach((docSnap) => {
          remoteCats.push(docSnap.data() as TicketCategory);
        });
        if (remoteCats.length > 0) {
          setCategories(remoteCats);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    const unsubLogs = onSnapshot(collection(db, 'auditLogs'), (snapshot) => {
      if (!snapshot.empty) {
        const remoteLogs: AuditLog[] = [];
        snapshot.forEach((docSnap) => {
          remoteLogs.push(docSnap.data() as AuditLog);
        });
        if (remoteLogs.length > 0) {
          remoteLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setAuditLogs(remoteLogs);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'auditLogs');
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!snapshot.empty) {
        const remoteUsers: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          remoteUsers.push(docSnap.data() as UserProfile);
        });
        if (remoteUsers.length > 0) {
          setUsers(remoteUsers);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => {
      unsubEvents();
      unsubGuests();
      unsubCats();
      unsubLogs();
      unsubUsers();
    };
  }, [setEvents, setGuests, setCategories, setAuditLogs, setUsers]);
}
