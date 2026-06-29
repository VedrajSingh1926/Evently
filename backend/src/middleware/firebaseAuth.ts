/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebaseConfig';
import { supabase } from '../config/supabaseConfig';

export interface DecodedUser {
  uid: string;
  id: string;
  role: 'admin' | 'user' | 'organizer';
  email?: string;
  name?: string;
  picture?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedUser;
}

/**
 * Elite, high-end, production-grade Firebase Authentication Middleware.
 * Rejects custom JWTs, ensuring 100% reliance on Firebase Auth verified ID tokens.
 * Fetches user custom role dynamically from Supabase database.
 */
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Please provide a valid Firebase Authorization Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate ID Token directly via firebase-admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const email = decodedToken.email || '';
    const uid = decodedToken.uid;

    // Fetch verified profile role from Supabase profiles table
    let resolvedRole: 'admin' | 'user' | 'organizer' = email === 'organizer@evently.com' ? 'organizer' : 'user';
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid);
      
      if (!error && profiles && profiles.length > 0) {
        resolvedRole = profiles[0].role;
      }
    } catch (profileErr: any) {
      console.warn('[Firebase Auth Middleware] Error checking profile role in Supabase:', profileErr.message);
    }

    req.user = {
      uid: uid,
      id: uid,
      email: email,
      name: decodedToken.name || email.split('@')[0] || 'Member',
      role: resolvedRole,
      picture: decodedToken.picture,
    };

    next();
  } catch (error: any) {
    console.error('[Firebase Auth Middleware] Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Access denied. The provided Firebase ID token is invalid or has expired.',
    });
  }
};
