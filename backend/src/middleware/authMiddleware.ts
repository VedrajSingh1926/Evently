/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebaseConfig';

export interface DecodedUser {
  uid: string;
  id: string; // compatibility mapping for id
  role: 'admin' | 'user'; // compatibility mapping for role
  email?: string;
  name?: string;
  picture?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedUser;
}

/**
 * Recruiter-grade protect middleware that intercepts requests,
 * extracts the Bearer token, and verifies it with Firebase Admin.
 */
export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authentication token provided in Bearer format.',
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate with Firebase Admin Auth
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Attach decoded user info to request object
    const email = decodedToken.email || '';
    req.user = {
      uid: decodedToken.uid,
      id: decodedToken.uid,
      email: email,
      name: decodedToken.name || email.split('@')[0] || 'User',
      role: email === 'organizer@evently.com' ? 'admin' : 'user',
      picture: decodedToken.picture,
    };

    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Bearer token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Access denied. Invalid or expired authentication token.',
    });
  }
};
