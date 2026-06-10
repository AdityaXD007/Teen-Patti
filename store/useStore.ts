import { create } from 'zustand';
import uuid from 'react-native-uuid';
import { db, auth } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Player {
  id: string;
  name: string;
  balance: number;
}

export interface Round {
  id: string;
  winnerId: string;
  winnerName: string;
  loserIds: string[];
  loserNames: string[];
  amount: number;
  splitAmount: number;
  timestamp: number;
}

export interface Session {
  id: string;
  joinCode: string;
  creatorId?: string; // Optional for backward compatibility with old sessions
  name: string;
  createdAt: number;
  players: Player[];
  rounds: Round[];
}

interface StoreState {
  user: User | null;
  uid: string | null;
  authInitialized: boolean;
  initializeAuth: () => void;
  sessions: Session[];
  loadSessions: () => void;
  createSession: (name: string, playerNames: string[]) => Promise<void>;
  joinSession: (code: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  addPlayer: (sessionId: string, playerName: string) => Promise<void>;
  removePlayer: (sessionId: string, playerId: string) => Promise<void>;
  addRound: (sessionId: string, winnerId: string, loserIds: string[], amount: number) => Promise<void>;
  deleteRound: (sessionId: string, roundId: string) => Promise<void>;
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

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  uid: null,
  authInitialized: false,
  sessions: [],

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

    if (mySessionIds.length === 0) {
      set({ sessions: [] });
      return;
    }

    // Accumulate sessions from individual listeners
    const loadedSessions: { [id: string]: Session } = {};
    const currentSessions = get().sessions;
    currentSessions.forEach(s => {
      if (mySessionIds.includes(s.id)) {
        loadedSessions[s.id] = s;
      }
    });

    const updateState = () => {
      const sessionsArray = Object.values(loadedSessions).sort((a, b) => b.createdAt - a.createdAt);
      set({ sessions: sessionsArray });
    };

    mySessionIds.forEach(id => {
      if (!unsubscribes[id]) {
        unsubscribes[id] = onSnapshot(doc(db, 'sessions', id), async (snapshot) => {
          if (snapshot.exists()) {
            loadedSessions[id] = snapshot.data() as Session;
            updateState();
          } else {
            // Session was deleted from backend
            delete loadedSessions[id];
            await removeMySessionId(id);
            updateState();
          }
        }, (error) => {
          console.error(`Failed to listen to session ${id}`, error);
        });
      }
    });
  },

  createSession: async (name, playerNames) => {
    const trimmedName = name.trim();
    if (!trimmedName || playerNames.length < 2) return;

    const sessionId = uuid.v4() as string;
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const uid = get().uid;

    const newSession: Session = {
      id: sessionId,
      joinCode,
      creatorId: uid || undefined,
      name: trimmedName,
      createdAt: Date.now(),
      players: playerNames.map(pName => ({
        id: uuid.v4() as string,
        name: pName.trim(),
        balance: 0,
      })).filter(p => p.name.length > 0),
      rounds: [],
    };

    await setDoc(doc(db, 'sessions', sessionId), newSession);
    await addMySessionId(sessionId);
    get().loadSessions(); // Setup listener for the new session
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
    // Delete from backend
    await deleteDoc(doc(db, 'sessions', sessionId));
    // Remove locally
    await removeMySessionId(sessionId);
    
    if (unsubscribes[sessionId]) {
      unsubscribes[sessionId]();
      delete unsubscribes[sessionId];
    }
    
    get().loadSessions();
  },

  addPlayer: async (sessionId, playerName) => {
    const trimmedName = playerName.trim();
    if (!trimmedName) return;

    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedSession = {
      ...session,
      players: [
        ...session.players,
        { id: uuid.v4() as string, name: trimmedName, balance: 0 },
      ],
    };

    await setDoc(doc(db, 'sessions', sessionId), updatedSession);
  },

  removePlayer: async (sessionId, playerId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedSession = {
      ...session,
      players: session.players.filter(p => p.id !== playerId),
    };

    await setDoc(doc(db, 'sessions', sessionId), updatedSession);
  },

  addRound: async (sessionId, winnerId, loserIds, amount) => {
    if (amount <= 0 || loserIds.length === 0) return;

    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const newRound: Round = {
      id: uuid.v4() as string,
      winnerId,
      winnerName: session.players.find(p => p.id === winnerId)?.name || 'Unknown',
      loserIds,
      loserNames: loserIds.map(id => session.players.find(p => p.id === id)?.name || 'Unknown'),
      amount: amount,
      splitAmount: 0,
      timestamp: Date.now(),
    };

    const updatedPlayers = session.players.map(player => {
      if (player.id === winnerId) {
        return { ...player, balance: player.balance + amount };
      }
      return player;
    });

    const updatedSession = {
      ...session,
      rounds: [newRound, ...session.rounds],
      players: updatedPlayers,
    };

    await setDoc(doc(db, 'sessions', sessionId), updatedSession);
  },

  deleteRound: async (sessionId, roundId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    const roundToDelete = session.rounds.find(r => r.id === roundId);
    if (!roundToDelete) return;

    const updatedPlayers = session.players.map(player => {
      if (player.id === roundToDelete.winnerId) {
        return { ...player, balance: player.balance - roundToDelete.amount };
      }
      return player;
    });

    const updatedSession = {
      ...session,
      rounds: session.rounds.filter(r => r.id !== roundId),
      players: updatedPlayers,
    };

    await setDoc(doc(db, 'sessions', sessionId), updatedSession);
  },
}));
