/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Event, RSVP, Comment, AuthResponse, ApiResponse } from './types';
import { auth } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut 
} from 'firebase/auth';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('evently_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async register(email: string, name: string, password: string, role: 'user' | 'organizer' = 'user'): Promise<ApiResponse<AuthResponse>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      const token = await user.getIdToken();
      
      localStorage.setItem('evently_token', token);

      // Trigger backend synchronization with Supabase Profiles table
      const syncRes = await fetch(`${API_BASE}/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role, name }),
      });

      let userData: User = {
        id: user.uid,
        email: user.email || '',
        name: name,
        role: role,
        createdAt: new Date().toISOString(),
      };

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.success && syncData.data) {
          userData = syncData.data;
        }
      }

      localStorage.setItem('evently_user', JSON.stringify(userData));
      return { success: true, data: { user: userData, token } };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  },

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      
      localStorage.setItem('evently_token', token);

      // Fetch verified profile from Supabase
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let userData: User = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || email.split('@')[0],
        role: email === 'organizer@evently.com' ? 'organizer' : 'user',
        createdAt: new Date().toISOString(),
      };

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.success && meData.data) {
          userData = meData.data;
        }
      }

      localStorage.setItem('evently_user', JSON.stringify(userData));
      return { success: true, data: { user: userData, token } };
    } catch (err: any) {
      // Auto-signup logic for quick sandbox demo accounts to bypass missing user credential failures
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        try {
          const name = email === 'organizer@evently.com' ? 'Sarah Jenkins' : (email === 'alex@minimalist.io' ? 'Alex Rivera' : email.split('@')[0]);
          const resolvedRole = email === 'organizer@evently.com' ? 'organizer' : 'user';
          
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          await updateProfile(user, { displayName: name });
          const token = await user.getIdToken();
          
          localStorage.setItem('evently_token', token);

          // Trigger backend synchronization with Supabase Profiles table
          const syncRes = await fetch(`${API_BASE}/auth/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ role: resolvedRole, name }),
          });

          let userData: User = {
            id: user.uid,
            email: user.email || '',
            name: name,
            role: resolvedRole,
            createdAt: new Date().toISOString(),
          };

          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.success && syncData.data) {
              userData = syncData.data;
            }
          }

          localStorage.setItem('evently_user', JSON.stringify(userData));
          return { success: true, data: { user: userData, token } };
        } catch (signUpErr: any) {
          return { success: false, error: err.message || signUpErr.message || 'Authentication failed' };
        }
      }
      return { success: false, error: err.message || 'Login failed' };
    }
  },

  async getMe(): Promise<ApiResponse<User>> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        this.logout();
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to authenticate session' };
    }
  },

  logout() {
    localStorage.removeItem('evently_token');
    localStorage.removeItem('evently_user');
    signOut(auth).catch(() => {});
  },

  // Events
  async generateCopy(prompt: string): Promise<ApiResponse<{ description: string }>> {
    try {
      const res = await fetch(`${API_BASE}/events/generate-copy`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to generate markdown copy via Gemini' };
    }
  },

  async getEvents(category?: string, search?: string): Promise<ApiResponse<Event[]>> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const url = `${API_BASE}/events?${params.toString()}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to retrieve events' };
    }
  },

  async getEventDetails(id: string): Promise<ApiResponse<Event & { rsvps: RSVP[]; comments: Comment[] }>> {
    try {
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to retrieve event details' };
    }
  },

  async createEvent(eventData: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    category: string;
    imageUrl?: string;
    capacity: number;
  }): Promise<ApiResponse<Event>> {
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(eventData),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create event' };
    }
  },

  async updateEvent(
    id: string,
    eventData: Partial<Event>
  ): Promise<ApiResponse<Event>> {
    try {
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(eventData),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update event' };
    }
  },

  async deleteEvent(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete event' };
    }
  },

  // RSVPs
  async rsvp(eventId: string, status: 'going' | 'maybe' | 'not_going'): Promise<ApiResponse<RSVP>> {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to register RSVP' };
    }
  },

  // Comments
  async addComment(eventId: string, content: string): Promise<ApiResponse<Comment>> {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit comment' };
    }
  },

  async deleteComment(eventId: string, commentId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete comment' };
    }
  }
};
