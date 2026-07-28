import { create } from 'zustand';
import uuid from 'react-native-uuid';
import { db, auth } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

// Backward-compat: normalize old-format rounds to new stake-based format.
// Old format had: { amount, splitAmount, loserIds, loserNames }
// New format has:  { stake, playerCount }
const normalizeRound = (round: any): Round => {
  if (round.stake !== undefined) return round as Round; // already new format

  const playerCount = (round.loserIds?.length ?? 0) + 1;
  const stake = round.splitAmount || (round.amount ? Math.round(round.amount / playerCount) : 0);

  return {
    id: round.id,
    winnerId: round.winnerId,
    winnerName: round.winnerName,
    stake,
    playerCount,
    timestamp: round.timestamp,
    ...(round.editedAt !== undefined && { editedAt: round.editedAt }),
  };
};

export const getRoundParticipants = (r: any, allPlayers: any[]): string[] => {
  if (Array.isArray(r.participantIds) && r.participantIds.length > 0) {
    return r.participantIds;
  }
  if (Array.isArray(r.loserIds) && r.loserIds.length > 0) {
    const set = new Set([r.winnerId, ...r.loserIds]);
    return Array.from(set);
  }
  // Legacy round fallback: take up to r.playerCount players present, ensuring winner is included
  const pCount = Number(r.playerCount) || 2;
  const ids: string[] = [];
  if (r.winnerId) ids.push(r.winnerId);
  for (const p of allPlayers) {
    if (ids.length >= pCount) break;
    if (!ids.includes(p.id)) {
      ids.push(p.id);
    }
  }
  return ids;
};

const normalizeSession = (session: any): Session => {
  const balanceMap: { [id: string]: number } = {};
  for (const p of (session.players || [])) {
    balanceMap[p.id] = 0;
  }

  const normalizedRounds = (session.rounds || []).map((r: any) => {
    const normR = normalizeRound(r);
    const stake = Number(normR.stake) || 0;

    // Get explicit participant IDs for this round
    const participantIds = getRoundParticipants(r, session.players || []);
    const playerCount = participantIds.length;

    for (const p of (session.players || [])) {
      // If player did NOT participate in this round (e.g. joined mid-game later), skip them!
      if (!participantIds.includes(p.id)) {
        continue;
      }

      if (p.id === normR.winnerId) {
        balanceMap[p.id] += stake * (playerCount - 1);
      } else {
        balanceMap[p.id] -= stake;
      }
    }
    return { ...normR, stake, playerCount, participantIds };
  });

  // Factor in settled payments so standings/leaderboard reflect completed settlements
  const settledPayments: SettledPayment[] = session.settledPayments || [];
  for (const sp of settledPayments) {
    if (balanceMap[sp.fromId] !== undefined) {
      balanceMap[sp.fromId] += Number(sp.amount) || 0;
    }
    if (balanceMap[sp.toId] !== undefined) {
      balanceMap[sp.toId] -= Number(sp.amount) || 0;
    }
  }

  return {
    ...session,
    rounds: normalizedRounds,
    players: (session.players || []).map((p: any) => ({
      ...p,
      balance: balanceMap[p.id] ?? 0,
    })),
  };
};

export interface Player {
  id: string;
  name: string;
  balance: number;
}

export interface Round {
  id: string;
  winnerId: string;
  winnerName: string;
  stake: number;
  playerCount: number;
  participantIds?: string[];
  timestamp: number;
  editedAt?: number;
}

export interface SettledPayment {
  fromId: string;
  toId: string;
  amount: number;
  settledAt: number;
}

export interface Session {
  id: string;
  joinCode: string;
  creatorId?: string; // Optional for backward compatibility with old sessions
  name: string;
  createdAt: number;
  players: Player[];
  rounds: Round[];
  settledPayments?: SettledPayment[];
}

interface StoreState {
  user: User | null;
  uid: string | null;
  authInitialized: boolean;
  initializeAuth: () => void;
  sessions: Session[];
  loadSessions: () => void;
  createSession: (name: string, playerNames: string[]) => Promise<string | undefined>;
  joinSession: (code: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;
  addPlayer: (sessionId: string, playerName: string) => Promise<void>;
  removePlayer: (sessionId: string, playerId: string) => Promise<void>;
  addRound: (sessionId: string, winnerId: string, stake: number) => Promise<void>;
  deleteRound: (sessionId: string, roundId: string) => Promise<void>;
  editRound: (sessionId: string, roundId: string, newWinnerId: string, newStake: number) => Promise<void>;
  markPaymentSettled: (sessionId: string, fromId: string, toId: string, amount: number) => Promise<void>;
  unmarkPaymentSettled: (sessionId: string, fromId: string, toId: string, amount: number) => Promise<void>;
  clearSessionHistory: (sessionId: string) => Promise<void>;
  pendingNavigationSessionId: string | null;
  setPendingNavigationSessionId: (id: string | null) => void;
}

// Keep track of active Firebase listeners
let unsubscribes: { [sessionId: string]: () => void } = {};

const getMySessionIds = async (): Promise<string[]> => {
  try {
    const ids = await AsyncStorage.getItem('mySessionIds');
    return ids ? JSON.parse(ids) : [];
  } catch {
    return [];
  }
};

const addMySessionId = async (id: string) => {
  const ids = await getMySessionIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await AsyncStorage.setItem('mySessionIds', JSON.stringify(ids));
  }
};

const removeMySessionId = async (id: string) => {
  let ids = await getMySessionIds();

  ids = ids.filter(i => i !== id);
  await AsyncStorage.setItem('mySessionIds', JSON.stringify(ids));
};

const ensureAuth = async () => {
  if (auth.currentUser) return auth.currentUser.uid;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (error) {
    console.error('ensureAuth failed:', error);
    return null;
  }
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
  uid: null,
  authInitialized: false,
  sessions: [],
  pendingNavigationSessionId: null,
  setPendingNavigationSessionId: (id) => set({ pendingNavigationSessionId: id }),

  initializeAuth: () => {
    // Only initialize once
    if (get().authInitialized) return;
    
    set({ authInitialized: true });

    onAuthStateChanged(auth, (user) => {
      if (user) {
        set({ user, uid: user.uid });
      } else {
        // Automatically sign in anonymously if no user is found
        signInAnonymously(auth).catch((error) => {
          console.error('Firebase Anonymous Auth failed:', error);
        });
      }
    });
  },

  loadSessions: async () => {
    const mySessionIds = await getMySessionIds();

    // Clean up listeners for sessions that were removed
    Object.keys(unsubscribes).forEach(id => {
      if (!mySessionIds.includes(id)) {
        unsubscribes[id]();
        delete unsubscribes[id];
      }
    });

    // Remove sessions from state that are no longer tracked
    set((state) => ({
      sessions: state.sessions.filter(s => mySessionIds.includes(s.id)),
    }));

    if (mySessionIds.length === 0) {
      return;
    }

    mySessionIds.forEach(id => {
      if (!unsubscribes[id]) {
        unsubscribes[id] = onSnapshot(doc(db, 'sessions', id), (snapshot) => {
          if (snapshot.exists()) {
            const normalized = normalizeSession(snapshot.data());
            set((state) => {
              const exists = state.sessions.some(s => s.id === id);
              if (exists) {
                return { sessions: state.sessions.map(s => s.id === id ? normalized : s) };
              } else {
                return { sessions: [...state.sessions, normalized].sort((a, b) => b.createdAt - a.createdAt) };
              }
            });
          } else {
            // Only delete if it's explicitly deleted, but for now we won't auto-delete
            // local sessions just because Firestore doesn't have them, to allow offline
            // or local-only usage.
            console.warn(`Session ${id} not found in Firestore. Keeping local copy.`);
          }
        }, (error) => {
          console.error(`Failed to listen to session ${id}`, error);
        });
      }
    });
  },

  createSession: async (name, playerNames) => {
    const trimmedName = name.trim();
    if (!trimmedName || playerNames.length < 2) return undefined;

    const sessionId = uuid.v4() as string;
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const uid = get().uid;

    const newSession: any = {
      id: sessionId,
      joinCode,
      name: trimmedName,
      createdAt: Date.now(),
      players: playerNames.map(pName => ({
        id: uuid.v4() as string,
        name: pName.trim(),
        balance: 0,
      })).filter(p => p.name.length > 0),
      rounds: [],
    };

    if (uid) {
      newSession.creatorId = uid;
    }

    // Optimistically update the state so navigation works instantly
    set({ sessions: [newSession as Session, ...get().sessions] });

    await addMySessionId(sessionId);
    
    // Ensure we are authenticated before writing to avoid permission-denied rollbacks
    await ensureAuth();

    // Await Firestore write before setting up listeners, so the snapshot
    // listener sees the document and doesn't remove the optimistic session.
    try {
      await setDoc(doc(db, 'sessions', sessionId), newSession);
      console.log('[Firestore] write success (createSession)');
    } catch (err: any) {
      console.error('[Firestore] setDoc failed (createSession):', err.code, err.message, err);
    }
    
    get().loadSessions(); // Setup listener for the new session
    return sessionId;
  },

  joinSession: async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    const q = query(collection(db, 'sessions'), where('joinCode', '==', cleanCode));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Invalid Join Code');
    }

    const sessionDoc = snapshot.docs[0];
    await addMySessionId(sessionDoc.id);
    get().loadSessions(); // Start listening
  },

  deleteSession: async (sessionId) => {
    // Immediately remove from UI state
    set((state) => ({
      sessions: state.sessions.filter(s => s.id !== sessionId),
    }));

    // Unsubscribe listener first to prevent snapshot from re-adding the session
    if (unsubscribes[sessionId]) {
      unsubscribes[sessionId]();
      delete unsubscribes[sessionId];
    }

    // Remove from local tracking
    await removeMySessionId(sessionId);

    // Delete from backend
    await ensureAuth();
    deleteDoc(doc(db, 'sessions', sessionId))
      .catch(err => console.error('[Firestore] deleteDoc failed (deleteSession):', err));
  },

  leaveSession: async (sessionId) => {
    // Immediately remove from UI state
    set((state) => ({
      sessions: state.sessions.filter(s => s.id !== sessionId),
    }));

    // Unsubscribe listener
    if (unsubscribes[sessionId]) {
      unsubscribes[sessionId]();
      delete unsubscribes[sessionId];
    }

    // Remove from local tracking
    await removeMySessionId(sessionId);
  },

  addPlayer: async (sessionId, playerName) => {
    const trimmedName = playerName.trim();
    if (!trimmedName) return;

    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const rawSession = {
      ...session,
      players: [
        ...session.players,
        { id: uuid.v4() as string, name: trimmedName, balance: 0 },
      ],
    };
    const updatedSession = normalizeSession(rawSession);

    set({ sessions: get().sessions.map(s => s.id === sessionId ? updatedSession : s) });

    await ensureAuth();
    setDoc(doc(db, 'sessions', sessionId), updatedSession)
      .then(() => console.log('[Firestore] write success (addPlayer)'))
      .catch((err: any) => console.error('[Firestore] setDoc failed (addPlayer):', err.code, err.message, err));
  },

  removePlayer: async (sessionId, playerId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const rawSession = {
      ...session,
      players: session.players.filter(p => p.id !== playerId),
    };
    const updatedSession = normalizeSession(rawSession);

    set({ sessions: get().sessions.map(s => s.id === sessionId ? updatedSession : s) });

    await ensureAuth();
    setDoc(doc(db, 'sessions', sessionId), updatedSession)
      .then(() => console.log('[Firestore] write success (removePlayer)'))
      .catch((err: any) => console.error('[Firestore] setDoc failed (removePlayer):', err.code, err.message, err));
  },

  addRound: async (sessionId, winnerId, stake) => {
    if (stake <= 0) return;

    const session = get().sessions.find(s => s.id === sessionId);
    if (!session || session.players.length < 2) return;

    const playerCount = session.players.length;
    const participantIds = session.players.map(p => p.id);

    const newRound: Round = {
      id: uuid.v4() as string,
      winnerId,
      winnerName: session.players.find(p => p.id === winnerId)?.name || 'Unknown',
      stake,
      playerCount,
      participantIds,
      timestamp: Date.now(),
    };

    const rawSession = {
      ...session,
      rounds: [newRound, ...session.rounds],
    };
    const updatedSession = normalizeSession(rawSession);

    set({ sessions: get().sessions.map(s => s.id === sessionId ? updatedSession : s) });

    await ensureAuth();
    setDoc(doc(db, 'sessions', sessionId), updatedSession)
      .then(() => console.log('[Firestore] write success (addRound)'))
      .catch((err: any) => console.error('[Firestore] setDoc failed (addRound):', err.code, err.message, err));
  },

  deleteRound: async (sessionId, roundId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const rawSession = {
      ...session,
      rounds: session.rounds.filter(r => r.id !== roundId),
    };
    const updatedSession = normalizeSession(rawSession);

    set({ sessions: get().sessions.map(s => s.id === sessionId ? updatedSession : s) });

    await ensureAuth();
    setDoc(doc(db, 'sessions', sessionId), updatedSession)
      .then(() => console.log('[Firestore] write success (deleteRound)'))
      .catch((err: any) => console.error('[Firestore] setDoc failed (deleteRound):', err.code, err.message, err));
  },

  editRound: async (sessionId, roundId, newWinnerId, newStake) => {
    if (newStake <= 0) return;

    const session = get().sessions.find(s => s.id === sessionId);
    if (!session || session.players.length < 2) return;

    const oldRound = session.rounds.find(r => r.id === roundId);
    if (!oldRound) return;

    const editedRound: Round = {
      ...oldRound,
      winnerId: newWinnerId,
      winnerName: session.players.find(p => p.id === newWinnerId)?.name || 'Unknown',
      stake: newStake,
      editedAt: Date.now(),
    };

    const rawSession = {
      ...session,
      rounds: session.rounds.map(r => r.id === roundId ? editedRound : r),
    };
    const updatedSession = normalizeSession(rawSession);

    set({ sessions: get().sessions.map(s => s.id === sessionId ? updatedSession : s) });

    await ensureAuth();
    setDoc(doc(db, 'sessions', sessionId), updatedSession)
      .then(() => console.log('[Firestore] write success (editRound)'))
      .catch((err: any) => console.error('[Firestore] setDoc failed (editRound):', err.code, err.message, err));
  },

  markPaymentSettled: async (sessionId, fromId, toId, amount) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const newPayment: SettledPayment = { fromId, toId, amount, settledAt: Date.now() };
    const rawSession = {
      ...session,
      settledPayments: [...(session.settledPayments || []), newPayment],
    };
    const updatedSession = normalizeSession(rawSession);

    set({ sessions: get().sessions.map(s => s.id === sessionId ? updatedSession : s) });

    await ensureAuth();
    setDoc(doc(db, 'sessions', sessionId), updatedSession)
      .then(() => console.log('[Firestore] write success (markPaymentSettled)'))
      .catch((err: any) => console.error('[Firestore] setDoc failed (markPaymentSettled):', err.code, err.message, err));
  },

  unmarkPaymentSettled: async (sessionId, fromId, toId, amount) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const existing = [...(session.settledPayments || [])];
    // Find and remove the first matching settled payment
    const idx = existing.findIndex(p => p.fromId === fromId && p.toId === toId && p.amount === amount);
    if (idx === -1) return;
    existing.splice(idx, 1);

    const rawSession = {
      ...session,
      settledPayments: existing,
    };
    const updatedSession = normalizeSession(rawSession);

    set({ sessions: get().sessions.map(s => s.id === sessionId ? updatedSession : s) });

    await ensureAuth();
    setDoc(doc(db, 'sessions', sessionId), updatedSession)
      .then(() => console.log('[Firestore] write success (unmarkPaymentSettled)'))
      .catch((err: any) => console.error('[Firestore] setDoc failed (unmarkPaymentSettled):', err.code, err.message, err));
  },

  clearSessionHistory: async (sessionId: string) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const rawSession = {
      ...session,
      rounds: [],
      settledPayments: [],
      players: session.players.map(p => ({ ...p, balance: 0 })),
    };
    const updatedSession = normalizeSession(rawSession);

    set({ sessions: get().sessions.map(s => s.id === sessionId ? updatedSession : s) });

    await ensureAuth();
    setDoc(doc(db, 'sessions', sessionId), updatedSession)
      .then(() => console.log('[Firestore] write success (clearSessionHistory)'))
      .catch((err: any) => console.error('[Firestore] setDoc failed (clearSessionHistory):', err.code, err.message, err));
  },
}),
{
  name: 'teen-patti-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ sessions: state.sessions }),
}
));
