const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, deleteDoc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');
const crypto = require('crypto');

const firebaseConfig = {
  apiKey: "AIzaSyADdvJb7OUVdf6YJWRK_Bst0i_jZOfnxSQ",
  authDomain: "teen-patti-34955.firebaseapp.com",
  projectId: "teen-patti-34955",
  storageBucket: "teen-patti-34955.firebasestorage.app",
  messagingSenderId: "410977110543",
  appId: "1:410977110543:web:bb4e87752b6cbdce7f317a",
  measurementId: "G-L7CXMN6YQL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const uuid = () => crypto.randomUUID();

// Reused exact logic from useStore.ts
function applyAddRoundDelta(session, newRound) {
  const updatedPlayers = session.players.map(player => {
    if (player.id === newRound.winnerId) {
      return { ...player, balance: player.balance + newRound.stake * (newRound.playerCount - 1) };
    }
    return { ...player, balance: player.balance - newRound.stake };
  });

  return {
    ...session,
    rounds: [newRound, ...session.rounds],
    players: updatedPlayers,
  };
}

function applyDeleteRoundDelta(session, roundId) {
  const roundToDelete = session.rounds.find(r => r.id === roundId);
  if (!roundToDelete) return session;

  const updatedPlayers = session.players.map(player => {
    if (player.id === roundToDelete.winnerId) {
      return { ...player, balance: player.balance - roundToDelete.stake * (roundToDelete.playerCount - 1) };
    }
    return { ...player, balance: player.balance + roundToDelete.stake };
  });

  return {
    ...session,
    rounds: session.rounds.filter(r => r.id !== roundId),
    players: updatedPlayers,
  };
}

function applyEditRoundDelta(session, roundId, newWinnerId, newStake) {
  const oldRound = session.rounds.find(r => r.id === roundId);
  if (!oldRound) return session;

  let updatedPlayers = session.players.map(player => {
    if (player.id === oldRound.winnerId) {
      return { ...player, balance: player.balance - oldRound.stake * (oldRound.playerCount - 1) };
    }
    return { ...player, balance: player.balance + oldRound.stake };
  });

  const newPlayerCount = session.players.length;
  updatedPlayers = updatedPlayers.map(player => {
    if (player.id === newWinnerId) {
      return { ...player, balance: player.balance + newStake * (newPlayerCount - 1) };
    }
    return { ...player, balance: player.balance - newStake };
  });

  const editedRound = {
    ...oldRound,
    winnerId: newWinnerId,
    winnerName: session.players.find(p => p.id === newWinnerId)?.name || 'Unknown',
    stake: newStake,
    playerCount: newPlayerCount,
    editedAt: Date.now(),
  };

  return {
    ...session,
    rounds: session.rounds.map(r => r.id === roundId ? editedRound : r),
    players: updatedPlayers,
  };
}

function printBalances(session, stepName) {
  console.log(`\n--- ${stepName} ---`);
  let total = 0;
  session.players.forEach(p => {
    console.log(`  ${p.name}: Rs ${p.balance}`);
    total += p.balance;
  });
  console.log(`  => Zero-Sum Check: Total = ${total} | Result: ${total === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
}

async function writeAndRead(sessionId, session) {
  const sessionRef = doc(db, 'sessions', sessionId);
  await setDoc(sessionRef, session);
  const docSnap = await getDoc(sessionRef);
  return docSnap.data();
}

async function runTest() {
  console.log('Initializing Firebase & Auth...');
  try {
    const userCredential = await signInAnonymously(auth);
    const uid = userCredential.user.uid;
    const sessionId = "logic-test-" + uuid().substring(0, 8);
    const sessionRef = doc(db, 'sessions', sessionId);

    console.log(`Test Session ID: ${sessionId}`);

    let session = {
      id: sessionId,
      joinCode: "MATH12",
      creatorId: uid,
      name: "Math Logic Test",
      createdAt: Date.now(),
      players: [
        { id: "p1", name: "Alice", balance: 0 },
        { id: "p2", name: "Bob", balance: 0 },
        { id: "p3", name: "Charlie", balance: 0 },
        { id: "p4", name: "Diana", balance: 0 }
      ],
      rounds: []
    };

    // 1. Initial State
    session = await writeAndRead(sessionId, session);
    printBalances(session, 'Initial State');

    // 2. Add Round 1 (Alice wins Rs 100)
    const round1 = { id: uuid(), winnerId: "p1", winnerName: "Alice", stake: 100, playerCount: 4, timestamp: Date.now() };
    console.log('\n[Action] Alice wins Rs 100 stake');
    session = applyAddRoundDelta(session, round1);
    session = await writeAndRead(sessionId, session);
    printBalances(session, 'Round 1 (Alice wins 100)');

    // 3. Add Round 2 (Bob wins Rs 50)
    const round2 = { id: uuid(), winnerId: "p2", winnerName: "Bob", stake: 50, playerCount: 4, timestamp: Date.now() };
    console.log('\n[Action] Bob wins Rs 50 stake');
    session = applyAddRoundDelta(session, round2);
    session = await writeAndRead(sessionId, session);
    printBalances(session, 'Round 2 (Bob wins 50)');

    // 4. Add Round 3 (Charlie wins Rs 200)
    const round3 = { id: uuid(), winnerId: "p3", winnerName: "Charlie", stake: 200, playerCount: 4, timestamp: Date.now() };
    console.log('\n[Action] Charlie wins Rs 200 stake');
    session = applyAddRoundDelta(session, round3);
    session = await writeAndRead(sessionId, session);
    printBalances(session, 'Round 3 (Charlie wins 200)');

    // 5. Edit Round 2 (Change winner from Bob to Diana, stake to 150)
    console.log('\n[Action] EDIT Round 2: Change winner to Diana, stake to Rs 150');
    session = applyEditRoundDelta(session, round2.id, "p4", 150);
    session = await writeAndRead(sessionId, session);
    printBalances(session, 'After Edit Round 2 (Diana wins 150 instead of Bob 50)');

    // 6. Delete Round 3
    console.log('\n[Action] DELETE Round 3 (Charlie won Rs 200)');
    session = applyDeleteRoundDelta(session, round3.id);
    session = await writeAndRead(sessionId, session);
    printBalances(session, 'After Delete Round 3');

    // 7. Cleanup
    console.log(`\nCleaning up... Deleting session ${sessionId} from Firestore`);
    await deleteDoc(sessionRef);
    console.log('Test harness completed successfully.');

  } catch (err) {
    console.error('\n--- TEST FAILED ---');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error(err);
  } finally {
    process.exit();
  }
}

runTest();
