/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDlK1-q-RktRqGpmbk_QxH7sowz07hf89M",
  authDomain: "gen-lang-client-0169998243.firebaseapp.com",
  projectId: "gen-lang-client-0169998243",
  storageBucket: "gen-lang-client-0169998243.firebasestorage.app",
  messagingSenderId: "1077226509156",
  appId: "1:1077226509156:web:5a9b5dca204b0978b7a071"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
