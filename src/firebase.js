// src/firebase.js
import { initializeApp }  from 'firebase/app';
import { getFunctions }   from 'firebase/functions';

// Firebase project configuration
const firebaseConfig = {
  apiKey: 'AIzaSyC6i1I_kXZu9LoUHH5FpoTMlXN-9gbglEI',
  authDomain: 'echo-d825e.firebaseapp.com',
  projectId: 'echo-d825e',
  storageBucket: 'echo-d825e.firebasestorage.app',
  messagingSenderId: '603237082641',
  appId: '1:603237082641:web:69aee7089da070969833b0',
  measurementId: 'G-MVJ8YGYNE5',
};


const app = initializeApp(firebaseConfig);

const functions = getFunctions(app); // or getFunctions(app, 'us-central1')


export { app, functions };
