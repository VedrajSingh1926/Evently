/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { dbStore } from './server/store';
import { User, Event, RSVP, Comment, EventCategory, RSVPStatus } from './src/types';
import { generateDescription } from './backend/src/controllers/aiController';
import { generateCopy } from './backend/src/controllers/geminiController';
import { syncProfile } from './backend/src/controllers/authController';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  submitRsvp,
  addComment,
} from './backend/src/controllers/eventController';
import { protect as authenticateToken, AuthenticatedRequest } from './backend/src/middleware/authMiddleware';
import { authenticateUser } from './backend/src/middleware/firebaseAuth';
import { supabase } from './backend/src/config/supabaseConfig';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- REST Endpoints ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ success: true, status: 'Evently Full-Stack Server is running smoothly' });
  });

  // AI Description Generator endpoint via official Gemini SDK
  app.post('/api/ai/generate-description', generateDescription);
  app.post('/api/events/generate-copy', authenticateUser, generateCopy);

  // DUAL-ROLE Firebase + Supabase Profile sync endpoint
  app.post('/api/auth/sync', authenticateUser, syncProfile);

  // GET CURRENT PROFILE (Authenticated via Firebase Admin, matching profiles database)
  app.get('/api/auth/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User context not found' });
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id);

      if (error || !profiles || profiles.length === 0) {
        // Dynamic fallback creation on the fly
        const newUserProfile = {
          id: req.user.id,
          email: req.user.email || '',
          name: req.user.name || req.user.email?.split('@')[0] || 'User',
          role: req.user.role || 'user',
          created_at: new Date().toISOString(),
        };
        await supabase.from('profiles').insert([newUserProfile]);
        return res.json({
          success: true,
          data: {
            id: newUserProfile.id,
            email: newUserProfile.email,
            name: newUserProfile.name,
            role: newUserProfile.role,
            createdAt: newUserProfile.created_at,
          }
        });
      }

      const prof = profiles[0];
      return res.json({
        success: true,
        data: {
          id: prof.id,
          email: prof.email,
          name: prof.name,
          role: prof.role,
          createdAt: prof.created_at || prof.createdAt,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch user context' });
    }
  });

  // Event Routes (Backed by Supabase queries with dynamic filtering)
  app.get('/api/events', getEvents);
  app.get('/api/events/:id', getEventById);
  app.post('/api/events', authenticateUser, createEvent);
  app.put('/api/events/:id', authenticateUser, updateEvent);
  app.delete('/api/events/:id', authenticateUser, deleteEvent);

  // RSVP & Commenting
  app.post('/api/events/:id/rsvp', authenticateUser, submitRsvp);
  app.post('/api/events/:id/comments', authenticateUser, addComment);

  // --- Vite & Production Handlers ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Evently Server] listening at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Evently Server] bootstrap failed:', err);
});
