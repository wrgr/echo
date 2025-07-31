import { initializeApp } from 'firebase/app';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: 'AIzaSyC6i1I_kXZu9LoUHH5FpoTMlXN-9gbglEI',
  authDomain: 'echo-d825e.firebaseapp.com',
  projectId: 'echo-d825e',
  storageBucket: 'echo-d825e.firebasestorage.app',
  messagingSenderId: '603237082641',
  appId: '1:603237082641:web:69aee7089da070969833b0',
  measurementId: 'G-MVJ8YGYNE5',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;

