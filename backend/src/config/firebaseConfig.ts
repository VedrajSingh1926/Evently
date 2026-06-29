/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let app;

// Check if Firebase Admin is already initialized to avoid duplicate app errors
if (!getApps().length) {
  if (projectId && clientEmail && privateKey) {
    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          // Format the private key to handle both single-line and multiline env formatting
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('[Firebase Admin] Initialized successfully with custom credentials.');
    } catch (err) {
      console.error('[Firebase Admin] Initialization with credentials failed:', err);
      app = initializeApp();
    }
  } else {
    // Elegant fallback to default initialization for developer-grade local execution
    console.warn('[Firebase Admin] Custom environment credentials missing. Falling back to default app credentials.');
    try {
      app = initializeApp();
    } catch (err) {
      console.warn('[Firebase Admin] Fallback initialization failed. Mock mode activated for non-blocking local runs.');
      // Initialize with a simple local placeholder or dummy
      app = initializeApp({
        projectId: 'mock-project-id',
      });
    }
  }
} else {
  app = getApp();
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export default app;
