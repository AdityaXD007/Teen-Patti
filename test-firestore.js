const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyADdvJb7OUVdf6YJWRK_Bst0i_jZOfnxSQ",
  authDomain: "teen-patti-34955.firebaseapp.com",
  projectId: "teen-patti-34955",
  storageBucket: "teen-patti-34955.firebasestorage.app",
  messagingSenderId: "410977110543",
  appId: "1:410977110543:web:bb4e87752b6cbdce7f317a",
  measurementId: "G-L7CXMN6YQL"
};

async function runTest() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    console.log('Attempting anonymous sign-in...');
    const userCredential = await signInAnonymously(auth);
    const uid = userCredential.user.uid;
    console.log('Sign-in successful! UID:', uid);

    const sessionId = "test-session-123";
    const sessionRef = doc(db, 'sessions', sessionId);

    const sessionData = {
      id: sessionId,
      joinCode: "TEST12",
      creatorId: uid,
      name: "Node.js Test Session",
      createdAt: Date.now(),
      players: [
        { id: "player-1", name: "Test Player", balance: 0 }
      ],
      rounds: []
    };

    console.log(`Writing test document to sessions/${sessionId}...`);
    await setDoc(sessionRef, sessionData);
    console.log('Write successful!');

    console.log(`Reading test document from sessions/${sessionId}...`);
    const docSnap = await getDoc(sessionRef);
    
    if (docSnap.exists()) {
      console.log('Read successful! Document data:');
      console.log(JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log('Document does not exist after writing!');
    }

  } catch (err) {
    console.error('\n--- TEST FAILED ---');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error('Full Error:', err);
  } finally {
    process.exit();
  }
}

runTest();
